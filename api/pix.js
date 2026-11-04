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
         PIX_PROVIDER     (opcional: bravopay ou paguezy)
         PAGUEZY_API_KEY  (obrigatória se provider = paguezy)
         PAGUEZY_API_SECRET (obrigatória se provider = paguezy)
         PAGUEZY_WEBHOOK_SECRET (recomendada; valida o webhook)
         BRAVOPAY_API_KEY   (obrigatória se provider = bravopay)
         BRAVOPAY_PRODUCT_ID (opcional)
         RATE_SALT          (recomendada; segredo para os códigos irreversíveis)
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
   fica público depois que o processador confirma o pagamento (status PAID/paid).
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { ANONIMO, nomePublico, guardarPendente, promover } = require('./_pix');

let _fb = null;
function fb() { return _fb || (_fb = require('./_firebase')); }

const PIX_PROVIDER = String(process.env.PIX_PROVIDER || (process.env.PAGUEZY_API_KEY ? 'paguezy' : 'bravopay')).toLowerCase();
const BRAVO_BASE = 'https://bravopay.club/api/v1';
const PAGUEZY_BASE = 'https://paguezy.com/api/v1';
const MIN_CENTS = 500;            // R$ 5,00 (mesmo mínimo do site)
const MAX_CENTS = 5000000;        // R$ 50.000,00 (teto de segurança)
const TIMEOUT_MS = 20000;
const MAX_BODY_CHARS = 8192;
const JANELA_MS = 60 * 1000;      // limitador simples por visitante
const MAX_POR_JANELA = 20;

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
const pago = (status) => String(status || '').toUpperCase() === 'PAID';

async function chamandoApi(url, options, headers) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, { ...options, signal: ctrl.signal, headers: { ...headers, ...(options && options.headers) } });
    let data = null;
    try { data = await resp.json(); } catch (e) { /* corpo vazio */ }
    return { ok: resp.ok, status: resp.status, data: data || {} };
  } finally {
    clearTimeout(timer);
  }
}

async function bravo(path, options) {
  const key = process.env.BRAVOPAY_API_KEY;
  if (!key) throw Object.assign(new Error('config'), { code: 'config' });
  return chamandoApi(BRAVO_BASE + path, options, { 'Authorization': 'Bearer ' + key });
}

async function paguezy(path, options) {
  const key = process.env.PAGUEZY_API_KEY;
  const secret = process.env.PAGUEZY_API_SECRET;
  if (!key || !secret) throw Object.assign(new Error('config'), { code: 'config' });
  return chamandoApi(PAGUEZY_BASE + path, options, {
    'X-Api-Key': key,
    'X-Api-Secret': secret
  });
}

function mensagemErro(data, status) {
  const m = data && (data.message || (data.error && (data.error.message || data.error)));
  return typeof m === 'string' && m.length < 200 ? m : 'Erro ' + status;
}
/* apenas os NOMES/TIPOS dos campos (sem valores), para diagnosticar a resposta */
function formato(v, depth) {
  const t = typeof v;
  if (v === null || Array.isArray(v)) return v === null ? 'null' : 'array';
  if (t !== 'object') return t;
  if (depth >= 3) return 'object';
  return '{' + Object.keys(v).slice(0, 20).map((k) => k + ':' + formato(v[k], depth + 1)).join(', ') + '}';
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
        const pagoDoc = await db.collection('colaboradores').doc(id).get();
        const dono = pagoDoc.exists ? pagoDoc.get('conta') : '';
        if (!pagoDoc.exists || (dono && dono !== uid)) return res.status(404).json({ message: 'Cobrança não encontrada.' });
      }
      const r = PIX_PROVIDER === 'paguezy'
        ? await paguezy('/payments/' + encodeURIComponent(id), { method: 'GET' })
        : await bravo('/transactions/' + encodeURIComponent(id), { method: 'GET' });
      if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ message: mensagemErro(r.data, r.status) });
      const status = String(r.data.status || '');
      if (pago(status)) await promover(id);
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
    const externalReference = texto(body.external_reference, 64) || ('aetix-' + Date.now());

    let r, id, copy;
    if (PIX_PROVIDER === 'paguezy') {
      const payload = {
        amount: cents,
        payment_method: 'pix',
        external_reference: externalReference,
        customer: { name, email, phone }
      };
      r = await paguezy('/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      id = r.data.id;
      copy = r.data.pix_copy_paste;
    } else {
      const payload = {
        amount_cents: cents,
        method: 'pix',
        customer: { name, email, phone },
        external_reference: externalReference,
        utm
      };
      if (process.env.BRAVOPAY_PRODUCT_ID) payload.product_id = process.env.BRAVOPAY_PRODUCT_ID;
      r = await bravo('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      id = r.data.id;
      copy = r.data.pix && r.data.pix.copy_paste;
    }

    if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ message: mensagemErro(r.data, r.status) });
    if (!id || !copy) {
      const forma = formato(r.data, 0);
      console.error('[pix] resposta inesperada; status=' + r.status + ' forma=' + forma);
      return res.status(502).json({ message: 'Resposta inesperada do processador de pagamentos.', forma });
    }

    const publico = body.show_name === true ? nomePublico(name) : '';
    await guardarPendente(id, publico || ANONIMO, cents, {
      uid: uid,
      nomeCompleto: name,
      email: email,
      telefone: phone,
      mostrar: body.show_name === true
    });
    return res.status(201).json({ id: id, pix: { copy_paste: copy } });
  } catch (err) {
    if (err && err.code === 'config') {
      console.error('[pix] configuração do provedor ausente.');
      return res.status(500).json({ message: 'Pagamento indisponível no momento.' });
    }
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ message: 'Tempo esgotado. Tente de novo.' });
    }
    console.error('[pix] falha:', err && err.message);
    return res.status(500).json({ message: 'Não foi possível gerar o Pix.' });
  }
};
