'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/plano.js  (Vercel Serverless Function)
   POST /api/plano  { plano: 'free' } -> ativa o plano Free (uma vez por conta)

   - Login e aceite dos Termos obrigatórios
   - Idempotente: quem já está no Free/Starter/Pro/Mestre recebe o plano atual sem mudar nada
   - Quem está em 'nenhum' (conta nova) passa para 'free' com os mesmos 500 créditos iniciais
   - Conta mestra devolve 'mestre' (não precisa de plano)
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { consultarCarteira } = require('./_creditos');
const { excedeu } = require('./_rate');

let _fb = null;
function fb() { return _fb || (_fb = require('./_firebase')); }

const MAX_BODY_CHARS = 2048;
function lerBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    if (b.length > MAX_BODY_CHARS) return null;
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }
  const uid = await exigirLogin(req, res, { aceite: true });   // 401 sem login · 403 sem aceite
  if (!uid) return;
  if (await excedeu('plano', req, 30, 60 * 1000)) return res.status(429).json({ ok: false, message: 'Muitas tentativas. Aguarde um pouco.' });

  const body = lerBody(req);
  if (!body || String(body.plano || '').toLowerCase() !== 'free') {
    return res.status(400).json({ ok: false, message: 'Plano inválido.' });
  }

  try {
    const atual = await consultarCarteira(uid);
    if (atual.mestre) return res.status(200).json({ ok: true, plano: 'mestre', ilimitado: true });
    if (atual.plano === 'free' || atual.plano === 'starter' || atual.plano === 'pro') {
      /* já escolheu: não credita de novo nem troca de plano */
      return res.status(200).json({ ok: true, plano: atual.plano, saldo: atual.saldo, jaAtivado: true });
    }

    /* 'nenhum' -> ativa o Free (uma única vez) */
    const db = fb().getDb();
    const { FieldValue } = require('firebase-admin/firestore');
    await db.collection('creditos').doc(uid).update({
      plano: 'free',
      planoEm: FieldValue.serverTimestamp(),
      ajusteSaldo500: true,
      atualizadoEm: FieldValue.serverTimestamp()
    });
    const depois = await consultarCarteira(uid);
    return res.status(200).json({ ok: true, plano: 'free', saldo: depois.saldo, jaAtivado: false });
  } catch (err) {
    console.error('[plano] ativar free:', err && err.message);
    return res.status(500).json({ ok: false, message: 'Não foi possível ativar o plano agora. Tente de novo.' });
  }
};
