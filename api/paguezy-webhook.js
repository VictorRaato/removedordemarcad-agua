'use strict';
/* ==========================================================================
   AETIX DESIGN · api/paguezy-webhook.js  (Vercel Serverless Function)
   Recebe o POST do webhook PagueZy e confirma o pagamento usando HMAC.
   ========================================================================== */
const crypto = require('crypto');
const { promover } = require('./_pix');

const MAX_BODY_CHARS = 32768;
let _hits = new Map();
function excedeu(req) {
  const chave = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  const agora = Date.now();
  const lista = (_hits.get(chave) || []).filter(t => agora - t < 60000);
  lista.push(agora);
  _hits.set(chave, lista);
  if (_hits.size > 5000) _hits.clear();
  return lista.length > 60;
}

function seguro(a, b) {
  const ba = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

async function lerCorpo(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += Buffer.from(chunk).toString('utf8');
    if (raw.length > MAX_BODY_CHARS) return null;
  }
  return raw;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }
  if (excedeu(req)) return res.status(429).json({ ok: false, message: 'Muitas tentativas.' });

  const raw = await lerCorpo(req);
  if (raw === null || !raw) return res.status(400).json({ ok: false, message: 'Corpo inválido.' });

  const secret = String(process.env.PAGUEZY_WEBHOOK_SECRET || '');
  if (!secret) {
    console.error('[paguezy-webhook] PAGUEZY_WEBHOOK_SECRET ausente.');
    return res.status(500).json({ ok: false, message: 'Webhook não configurado.' });
  }

  const signature = String(req.headers['x-paguezy-signature'] || '');
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (!seguro(signature, expected)) {
    return res.status(401).json({ ok: false, message: 'Assinatura inválida.' });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ ok: false, message: 'JSON inválido.' });
  }

  if (payload && payload.event === 'payment.paid') {
    const id = String(payload.transaction_id || '');
    if (!/^[\w.-]{4,128}$/.test(id)) return res.status(400).json({ ok: false, message: 'Identificador inválido.' });
    await promover(id);
  }

  return res.status(200).json({ ok: true });
};

module.exports.config = { api: { bodyParser: false } };
