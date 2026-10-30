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
   Nenhum dado do cliente é gravado nem escrito em log por esta função.
   ========================================================================== */

const BASE_URL = 'https://bravopay.club/api/v1';
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
      const r = await bravo('/transactions/' + encodeURIComponent(id));
      if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ message: mensagemErro(r.data, r.status) });
      return res.status(200).json({ status: String(r.data.status || '') });
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
