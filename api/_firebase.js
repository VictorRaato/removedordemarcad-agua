'use strict';
/* AETIX DESIGN · api/_firebase.js (módulo compartilhado, NÃO é uma rota: o "_" faz a Vercel ignorá-lo) */
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const FIRESTORE_DATABASE_ID = 'default';   // igual ao de avaliacao.js

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) throw new Error('Variáveis de ambiente do Firebase ausentes.');
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getDb._db || (getDb._db = getFirestore(FIRESTORE_DATABASE_ID));
}
module.exports = { getDb };
