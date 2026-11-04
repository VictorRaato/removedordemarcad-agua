'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/aceite.js  (Vercel Serverless Function)
   Registra no servidor o aceite dos Termos de Uso e da Política de Privacidade.

   GET  /api/aceite -> { ok, aceito, termos, privacidade }   (aceito = já aceitou a versão ATUAL)
   POST /api/aceite -> corpo { aceitou:true, termos:'2026-11', privacidade:'2026-11', origem?:'cadastro'|'google'|'tela' }
                       grava e responde { ok:true }
        409 se as versões enviadas não forem as atuais (o site recarrega e pede de novo).

   Firestore (só o servidor escreve; as regras continuam trancadas):
     aceites/{uid}                      -> aceite vigente do usuário (uid, versões, data/hora do servidor, origem)
     aceites/{uid}/historico/{versões}  -> um registro por versão aceita; criado uma vez e nunca alterado
   Não guardamos IP, e-mail nem nome neste registro. A data e a hora vêm do servidor, não do navegador.
   ========================================================================== */
const { getDb } = require('./_firebase');
const { exigirLogin, temAceite } = require('./_auth');
const V = require('./_versoes');

const ORIGENS = new Set(['cadastro', 'google', 'tela']);
const JANELA_MS = 60 * 1000;
const MAX_POR_JANELA = 20;
const hits = new Map();
function excedeu(uid) {
  const agora = Date.now();
  const lista = (hits.get(uid) || []).filter(t => agora - t < JANELA_MS);
  lista.push(agora);
  hits.set(uid, lista);
  if (hits.size > 5000) hits.clear();
  return lista.length > MAX_POR_JANELA;
}

function lerBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    if (b.length > 2048) return null;
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, erro: 'metodo' });
  }

  /* exige login, mas NÃO exige aceite: é justamente aqui que o aceite é criado */
  const uid = await exigirLogin(req, res);
  if (!uid) return;
  if (excedeu(uid)) return res.status(429).json({ ok: false, erro: 'limite' });

  try {
    if (req.method === 'GET') {
      const aceito = await temAceite(uid);
      return res.status(200).json({ ok: true, aceito, termos: V.TERMOS, privacidade: V.PRIVACIDADE });
    }

    const b = lerBody(req);
    if (!b || b.aceitou !== true) return res.status(400).json({ ok: false, erro: 'corpo' });
    if (b.termos !== V.TERMOS || b.privacidade !== V.PRIVACIDADE) {
      return res.status(409).json({ ok: false, erro: 'versao', termos: V.TERMOS, privacidade: V.PRIVACIDADE });
    }
    const origem = ORIGENS.has(b.origem) ? b.origem : 'tela';

    const { FieldValue } = require('firebase-admin/firestore');
    const db = getDb();
    const ref = db.collection('aceites').doc(uid);
    const hist = ref.collection('historico').doc('termos-' + V.TERMOS + '_privacidade-' + V.PRIVACIDADE);
    await db.runTransaction(async (tx) => {
      const h = await tx.get(hist);
      if (h.exists) {
        /* esta versão já tinha sido aceita antes: mantém o registro original e só reaponta o aceite vigente */
        tx.set(ref, h.data());
        return;
      }
      const dados = {
        uid: uid,
        versaoTermos: V.TERMOS,
        versaoPrivacidade: V.PRIVACIDADE,
        aceitoEm: FieldValue.serverTimestamp(),
        origem: origem
      };
      tx.create(hist, dados);   // create() falha se já existir: o histórico nunca é sobrescrito
      tx.set(ref, dados);
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[aceite] falha:', e && e.message);
    return res.status(500).json({ ok: false, erro: 'indisponivel' });
  }
};
