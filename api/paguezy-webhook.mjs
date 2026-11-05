/* ==========================================================================
   AETIX DESIGN · api/paguezy-webhook.mjs  (Vercel Serverless Function)
   Recebe o POST do webhook PagueZy e confirma o pagamento usando HMAC.
   ========================================================================== */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { promover } = require('./_pix.js');
const { promoverCompra } = require('./_planos.js');

const MAX_BODY_CHARS = 32768;

function responder(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(headers || {}) }
  });
}

function seguro(a, b) {
  const ba = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return responder({ ok: false, message: 'Método não permitido.' }, 405, { Allow: 'POST' });
    }

    const raw = await request.text();
    if (!raw || raw.length > MAX_BODY_CHARS) {
      return responder({ ok: false, message: 'Corpo inválido.' }, 400);
    }

    const secret = String(process.env.PAGUEZY_WEBHOOK_SECRET || '');
    if (!secret) {
      console.error('[paguezy-webhook] PAGUEZY_WEBHOOK_SECRET ausente.');
      return responder({ ok: false, message: 'Webhook não configurado.' }, 500);
    }

    const signature = String(request.headers.get('x-paguezy-signature') || '');
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (!seguro(signature, expected)) {
      return responder({ ok: false, message: 'Assinatura inválida.' }, 401);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return responder({ ok: false, message: 'JSON inválido.' }, 400);
    }

    if (payload && payload.event === 'payment.paid') {
      const id = String(payload.transaction_id || '');
      if (!/^[\w.-]{4,128}$/.test(id)) {
        return responder({ ok: false, message: 'Identificador inválido.' }, 400);
      }
      /* compra de pacotes tem prioridade; cobrança desconhecida cai na colaboração */
      const r = await promoverCompra(id);
      if (!r || r.promovido !== true) await promover(id);
    }

    return responder({ ok: true }, 200);
  }
};
