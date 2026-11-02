'use strict';
/* ==========================================================================
   AETIX DESIGN · api/pix.js  (Vercel Serverless Function)
   Intermedia a cobrança Pix: o navegador nunca vê a chave do processador.

   POST /api/pix           -> cria a cobrança Pix
        corpo: { amount_cents, customer:{name,email,phone}, external_reference?, utm? }
        resposta: { id, pix:{ copy_paste } }
   GET  /api/pix?id=XXXX   -> consulta o status da cobrança
        resposta: { status }

   Variável de ambiente (Vercel > Settings > Environment Variables):
        BRAVOPAY_API_KEY   (obrigatória)
        BRAVOPAY_PRODUCT_ID (opcional)
   E-mail e telefone nunca são escritos em log por esta função.

   REGISTRO PRIVADO: quando o processador confirma o pagamento, o pedido é
   copiado para a coleção "colaboradores" (nome completo, e-mail, telefone,
   valor, conta e se autorizou o nome no mural). Serve para conciliação e
   sorteios. Nenhuma rota pública lê essa coleção e as regras do Firestore
   negam acesso direto pelo navegador.

   MURAL DE COLABORADORES: toda colaboração paga entra no mural e no ranking.
   Se o cliente marcar "Mostrar meu nome" (show_name = true) guardamos o
   primeiro e segundo nome; se não marcar, aparece como "Anônimo". Em ambos
   os casos guardamos valor e um código irreversível (HMAC) do e-mail, usado
   só para somar as colaborações da mesma pessoa no ranking. O registro só
   fica público depois que o processador confirma o pagamento (status PAID).
   ========================================================================== */
const crypto = require('crypto');
let _fb = null;
function fb() { return _fb || (_fb = require('./_firebase')); }
const { exigirLogin } = require('./_auth');

const BASE_URL = 'https://bravopay.club/api/v1';
const MIN_CENTS = 500;            // R$ 5,00 (mesmo mínimo do site)
const MAX_CENTS = 5000000;        // R$ 50.000,00 (teto de segurança)
const TIMEOUT_MS = 20000;
const MAX_BODY_CHARS = 8192;
const JANELA_MS = 60 * 1000;      // limitador simples por visitante
const MAX_POR_JANELA = 20;

const ANONIMO = 'Anônimo';
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);

/* "joão  DA silva souza" -> "João Silva" */
function nomePublico(nome) {
  const partes = String(nome || '').replace(/[^\p{L}'’\- ]/gu, ' ').split(/\s+/).filter(Boolean);
  const uteis = partes.filter((w, i) => i === 0 || !PARTICULAS.has(w.toLowerCase()));
  const cap = w => w.slice(0, 24).toLowerCase().replace(/(^|['’\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return uteis.slice(0, 2).map(cap).join(' ');
}

function chaveEmail(email) {
  const segredo = process.env.RATE_SALT || process.env.FIREBASE_PRIVATE_KEY || 'aetix';
  return crypto.createHmac('sha256', segredo).update(String(email).toLowerCase()).digest('hex');
}

/* Guarda o pedido de exibição até o pagamento ser confirmado. Nunca derruba a cobrança. */
async function guardarPendente(id, nome, cents, dados) {
  try {
    const db = fb().getDb();
    const { FieldValue, Timestamp } = require('firebase-admin/firestore');
    await db.collection('colab_pendentes').doc(String(id)).set({
      nome: nome,
      centavos: cents,
      chave: chaveEmail(dados.email),
      criadoEm: FieldValue.serverTimestamp(),
      conta: String(dados.uid || ''),
      nomeCompleto: String(dados.nomeCompleto || ''),
      email: String(dados.email || ''),
      telefone: String(dados.telefone || ''),
      mostrar: dados.mostrar === true
    });
    const velhos = await db.collection('colab_pendentes')
      .where('criadoEm', '<=', Timestamp.fromMillis(Date.now() - 3 * 24 * 3600 * 1000)).limit(20).get();
    if (!velhos.empty) {
      const batch = db.batch();
      velhos.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) { console.error('[pix] pendente não gravado:', e && e.message); }
}

/* Pagamento confirmado: publica no mural e soma no ranking (idempotente). */
async function promover(id) {
  try {
    const db = fb().getDb();
    const { FieldValue } = require('firebase-admin/firestore');
    const pendRef = db.collection('colab_pendentes').doc(String(id));
    const colRef = db.collection('colaboracoes').doc(String(id));
    await db.runTransaction(async (tx) => {
      const pend = await tx.get(pendRef);
      const col = await tx.get(colRef);
      if (col.exists || !pend.exists) return;
      const d = pend.data();
      const rankRef = d.chave ? db.collection('ranking').doc(d.chave) : null;
      const rank = rankRef ? await tx.get(rankRef) : null;
      tx.set(colRef, { nome: d.nome, centavos: d.centavos, criadoEm: FieldValue.serverTimestamp() });
      /* registro privado, só para o dono do projeto: conciliação e sorteios */
      tx.set(db.collection('colaboradores').doc(String(id)), {
        conta: d.conta || '',
        nomeCompleto: d.nomeCompleto || '',
        email: d.email || '',
        telefone: d.telefone || '',
        centavos: d.centavos,
        mostrar: d.mostrar === true,
        criadoEm: FieldValue.serverTimestamp()
      });
      if (rankRef) {
        tx.set(rankRef, {
          nome: d.nome,
          centavos: (rank.exists ? Number(rank.get('centavos')) || 0 : 0) + d.centavos,
          qtd: (rank.exists ? Number(rank.get('qtd')) || 0 : 0) + 1,
          ultimoEm: FieldValue.serverTimestamp()
        });
      }
      tx.delete(pendRef);
    });
    /* mantém só as 100 colaborações mais recentes no mural (o ranking é um doc por pessoa e fica) */
    const excesso = await db.collection('colaboracoes').orderBy('criadoEm', 'desc').offset(100).limit(25).get();
    if (!excesso.empty) {
      const batch = db.batch();
      excesso.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) { console.error('[pix] promoção falhou:', e && e.message); }
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term', 'fbclid', 'ttclid', 'gclid'];

const hits = new Map();
function excedeuLimite(req) {
  const xff = String(req.headers['x-forwarded-for'] || '');
  const chave = xff.split(',')[0].trim() || 'anon';
  const agora = Date.now();
  const lista = (hits.get(chave) || []).filter(t => agora - t < JANELA_MS);
  lista.push(agora);
  hits.set(chave, lista);
  if (hits.size > 5000) hits.clear();
  return lista.length > MAX_POR_JANELA;
}

function lerBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    if (b.length > MAX_BODY_CHARS) return null;
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

const texto = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F]/g, '').trim().slice(0, max) : '');

/* Chamada ao processador, com a chave só no servidor. */
async function bravo(path, options) {
  const key = process.env.BRAVOPAY_API_KEY;
  if (!key) throw Object.assign(new Error('config'), { code: 'config' });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(BASE_URL + path, {
      ...options,
      signal: ctrl.signal,
      headers: { 'Authorization': 'Bearer ' + key, ...(options && options.headers) }
    });
    let data = null;
    try { data = await resp.json(); } catch (e) { /* corpo vazio */ }
    return { ok: resp.ok, status: resp.status, data: data || {} };
  } finally {
    clearTimeout(timer);
  }
}

function mensagemErro(data, status) {
  const m = data && (data.message || (data.error && (data.error.message || data.error)));
  return typeof m === 'string' && m.length < 200 ? m : 'Erro ' + status;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Método não permitido.' });
  }
  const uid = await exigirLogin(req, res, { aceite: true });   // 401 sem login · 403 sem aceite dos Termos
  if (!uid) return;
  if (excedeuLimite(req)) {
    return res.status(429).json({ message: 'Muitas tentativas. Aguarde um pouco.' });
  }

  try {
    /* ---------- consulta de status ---------- */
    if (req.method === 'GET') {
      const id = texto(req.query && req.query.id, 128);
      if (!/^[\w.-]{4,128}$/.test(id)) {
        return res.status(400).json({ message: 'Identificador inválido.' });
      }
      /* só o dono da cobrança pode consultar o status */
      const db = fb().getDb();
      const pend = await db.collection('colab_pendentes').doc(id).get();
      if (pend.exists) {
        const dono = pend.get('conta');
        if (dono && dono !== uid) return res.status(404).json({ message: 'Cobrança não encontrada.' });
      } else {
        const pago = await db.collection('colaboradores').doc(id).get();
        const dono = pago.exists ? pago.get('conta') : '';
        if (!pago.exists || (dono && dono !== uid)) return res.status(404).json({ message: 'Cobrança não encontrada.' });
      }
      const r = await bravo('/transactions/' + encodeURIComponent(id));
      if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ message: mensagemErro(r.data, r.status) });
      const status = String(r.data.status || '');
      if (status.toUpperCase() === 'PAID') await promover(id);
      return res.status(200).json({ status });
    }

    /* ---------- criação da cobrança ---------- */
    const body = lerBody(req);
    if (!body) return res.status(400).json({ message: 'Corpo da requisição inválido.' });

    const cents = Number(body.amount_cents);
    if (!Number.isInteger(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
      return res.status(400).json({ message: 'Informe um valor de R$ 5,00 ou mais.' });
    }

    const c = body.customer || {};
    const name = texto(c.name, 120);
    const email = texto(c.email, 160);
    const phone = texto(c.phone, 20).replace(/\D+/g, '');
    if (name.split(/\s+/).filter(Boolean).length < 2) return res.status(400).json({ message: 'Informe seu nome completo.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ message: 'Informe um e-mail válido.' });
    if (phone.length < 10 || phone.length > 13) return res.status(400).json({ message: 'Informe o telefone com DDD.' });

    const utm = {};
    const u = body.utm && typeof body.utm === 'object' ? body.utm : {};
    UTM_KEYS.forEach(k => { const v = texto(u[k], 200); if (v) utm[k] = v; });

    const payload = {
      amount_cents: cents,
      method: 'pix',
      customer: { name, email, phone },
      external_reference: texto(body.external_reference, 64) || ('aetix-' + Date.now()),
      utm
    };
    if (process.env.BRAVOPAY_PRODUCT_ID) payload.product_id = process.env.BRAVOPAY_PRODUCT_ID;

    const r = await bravo('/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ message: mensagemErro(r.data, r.status) });

    const copy = r.data.pix && r.data.pix.copy_paste;
    if (!r.data.id || !copy) return res.status(502).json({ message: 'Resposta inesperada do processador de pagamentos.' });
    const publico = body.show_name === true ? nomePublico(name) : '';
    await guardarPendente(r.data.id, publico || ANONIMO, cents, {
      uid: uid,
      nomeCompleto: name,
      email: email,
      telefone: phone,
      mostrar: body.show_name === true
    });
    return res.status(201).json({ id: r.data.id, pix: { copy_paste: copy } });
  } catch (err) {
    if (err && err.code === 'config') {
      console.error('[pix] BRAVOPAY_API_KEY ausente.');
      return res.status(500).json({ message: 'Pagamento indisponível no momento.' });
    }
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ message: 'Tempo esgotado. Tente de novo.' });
    }
    console.error('[pix] falha:', err && err.message);
    return res.status(500).json({ message: 'Não foi possível gerar o Pix.' });
  }
};
