'use strict';
/* ==========================================================================
   AETIX DESIGN · api/pix.js  (Vercel Serverless Function)
   Intermedia a cobrança Pix pela PagueZy: o navegador nunca vê a chave.

   POST /api/pix           -> cria a cobrança Pix
         corpo: { amount_cents, customer:{name,email,phone}, external_reference? }
         resposta: { id, pix:{ copy_paste } }
   GET  /api/pix?id=XXXX   -> consulta o status da cobrança
         resposta: { status }

   Variáveis de ambiente (Vercel > Settings > Environment Variables):
         PAGUEZY_API_KEY      (obrigatória)
         PAGUEZY_API_SECRET   (obrigatória)
         PAGUEZY_WEBHOOK_SECRET (recomendada; valida o webhook)
         RATE_SALT            (recomendada; segredo para os códigos irreversíveis)
   E-mail e telefone nunca são escritos em log por esta função.

   REGISTRO PRIVADO: quando a PagueZy confirma o pagamento, o pedido é
   copiado para a coleção "colaboradores" (nome completo, e-mail, telefone,
   valor, conta e se autorizou o nome no mural). Serve para conciliação e
   sorteios. Nenhuma rota pública lê essa coleção.

   MURAL DE COLABORADORES: toda colaboração paga entra no mural e no ranking.
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { ANONIMO, nomePublico, chaveDono, guardarPendente, promover } = require('./_pix');
const { excedeu } = require('./_rate');

let _fb = null;
function fb() { return _fb || (_fb = require('./_firebase')); }

const PAGUEZY_BASE = 'https://paguezy.com/api/v1';
const MIN_CENTS = 500;            // R$ 5,00
const MAX_CENTS = 5000000;        // R$ 50.000,00
const TIMEOUT_MS = 20000;
const MAX_BODY_CHARS = 8192;

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

async function chamaApi(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'X-Api-Key': String(process.env.PAGUEZY_API_KEY || ''),
        'X-Api-Secret': String(process.env.PAGUEZY_API_SECRET || ''),
        ...(options && options.headers)
      }
    });
    let data = null;
    try { data = await resp.json(); } catch (e) { /* corpo vazio */ }
    return { ok: resp.ok, status: resp.status, data: data || {} };
  } finally {
    clearTimeout(timer);
  }
}

async function criarCobranca(path, options) {
  if (!process.env.PAGUEZY_API_KEY || !process.env.PAGUEZY_API_SECRET) {
    throw Object.assign(new Error('config'), { code: 'config' });
  }
  return chamaApi(PAGUEZY_BASE + path, options);
}

function mensagemErro(data, status) {
  /* detalhe do provedor só no log do servidor; o usuário recebe texto amigável */
  const m = data && (data.message || (data.error && (data.error.message || data.error)));
  console.error('[pix] provedor:', status, typeof m === 'string' ? m.slice(0, 200) : '');
  return 'Não foi possível gerar o Pix agora. Tente de novo em instantes.';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Método não permitido.' });
  }
  const uid = await exigirLogin(req, res, { aceite: true });   // 401 sem login · 403 sem aceite dos Termos
  if (!uid) return;
  if (await excedeu('pix', req, 20, 60 * 1000)) {
    return res.status(429).json({ message: 'Muitas tentativas. Aguarde um pouco.' });
  }

  try {
    /* ---------- consulta de status ---------- */
    if (req.method === 'GET') {
      const id = texto(req.query && req.query.id, 128);
      if (!/^[\w.-]{4,128}$/.test(id)) {
        return res.status(400).json({ message: 'Identificador inválido.' });
      }
      /* só o dono da cobrança pode consultar o status (uid vai como hash, nunca em texto puro) */
      const db = fb().getDb();
      const donoHash = chaveDono(uid);
      const ehDono = (dono) => !dono || dono === donoHash || dono === uid;   // aceita registros antigos com uid puro
      const pend = await db.collection('colab_pendentes').doc(id).get();
      if (pend.exists) {
        const dono = pend.get('donoHash') || pend.get('conta');
        if (!ehDono(dono)) return res.status(404).json({ message: 'Cobrança não encontrada.' });
      } else {
        const pagoDoc = await db.collection('colaboradores').doc(id).get();
        const dono = pagoDoc.exists ? (pagoDoc.get('donoHash') || pagoDoc.get('conta')) : '';
        if (!pagoDoc.exists || !ehDono(dono)) return res.status(404).json({ message: 'Cobrança não encontrada.' });
      }
      const r = await criarCobranca('/payments/' + encodeURIComponent(id), { method: 'GET' });
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

    const externalReference = texto(body.external_reference, 64) || ('aetix-' + Date.now());

    const payload = {
      amount: cents,
      payment_method: 'pix',
      external_reference: externalReference,
      customer: { name, email, phone }
    };

    let r = await criarCobranca('/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ message: mensagemErro(r.data, r.status) });

    const id = r.data.transaction_id || r.data.id || r.data.provider_transaction_id;
    const copy = r.data.pix_copy_paste || (r.data.pix && r.data.pix.copy_paste);
    if (!id || !copy) return res.status(502).json({ message: 'Resposta inesperada do processador de pagamentos.' });

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
      console.error('[pix] configuração ausente.');
      return res.status(500).json({ message: 'Pagamento indisponível no momento.' });
    }
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ message: 'Tempo esgotado. Tente de novo.' });
    }
    console.error('[pix] falha:', err && err.message);
    return res.status(500).json({ message: 'Não foi possível gerar o Pix.' });
  }
};
