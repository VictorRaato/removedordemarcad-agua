'use strict';
/* ==========================================================================
   AETIX DESIGN · api/avaliacoes-resumo.js  (Vercel Serverless Function)
   GET -> { ok, media, total }  (média das notas e quantidade de avaliações)
   Usado pelo site para mostrar a nota no rodapé e preencher o aggregateRating
   do JSON-LD (estrelas no Google). Só números: nenhum comentário é exposto.
   ========================================================================== */
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, AggregateField } = require('firebase-admin/firestore');

const FIRESTORE_DATABASE_ID = 'default';   // mesmo ID usado em avaliacao.js

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/^"|"$/g, '')
      .replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Variáveis de ambiente do Firebase ausentes.');
    }
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getDb._db || (getDb._db = getFirestore(FIRESTORE_DATABASE_ID));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false });
  }
  try {
    const snap = await getDb().collection('avaliacoes').aggregate({
      media: AggregateField.average('nota'),
      total: AggregateField.count()
    }).get();
    const d = snap.data();
    const total = Number(d.total) || 0;
    const media = total && d.media ? Math.round(d.media * 10) / 10 : 0;
    /* cache curto na CDN da Vercel: a nota nova aparece em até ~1 min e o banco
       continua sem ser consultado a cada visita */
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ ok: true, media: media, total: total });
  } catch (err) {
    console.error('[avaliacoes-resumo]', err && err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false });
  }
};
