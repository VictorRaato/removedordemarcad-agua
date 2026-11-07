'use strict';
/* AETIX · api/_pix.js (NÃO é uma rota)
   Lógica compartilhada entre a cobrança e o webhook do processador. */
const crypto = require('crypto');
let _fb = null;
function fb() { return _fb || (_fb = require('./_firebase')); }

const ANONIMO = 'Anônimo';
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du']);

const nomePublico = (nome) => {
  const partes = String(nome || '').replace(/[^\p{L}'’\- ]/gu, ' ').split(/\s+/).filter(Boolean);
  const uteis = partes.filter((w, i) => i === 0 || !PARTICULAS.has(w.toLowerCase()));
  const cap = w => w.slice(0, 24).toLowerCase().replace(/(^|['’\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return uteis.slice(0, 2).map(cap).join(' ');
};

let _segredo = null;
function segredoRate() {
  if (_segredo) return _segredo;
  const s = String(process.env.RATE_SALT || '');
  if (s) return (_segredo = s);
  const k = String(process.env.FIREBASE_PRIVATE_KEY || '');
  if (k) return (_segredo = crypto.createHash('sha256').update('ratelimit|' + k).digest('hex'));
  console.error('[rate] RATE_SALT ausente: segredo aleatório desta instância.');
  return (_segredo = crypto.randomBytes(32).toString('hex'));
}

function chaveEmail(email) {
  return crypto.createHmac('sha256', segredoRate()).update(String(email).toLowerCase()).digest('hex');
}

/* Identificador irreversível da conta (nunca o uid em texto puro). */
function chaveDono(uid) {
  return crypto.createHmac('sha256', segredoRate()).update('dono|' + String(uid || '')).digest('hex');
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
      donoHash: chaveDono(dados.uid),
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
      tx.set(db.collection('colaboradores').doc(String(id)), {
        donoHash: d.donoHash || (d.conta ? chaveDono(d.conta) : ''),
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
    const excesso = await db.collection('colaboracoes').orderBy('criadoEm', 'desc').offset(100).limit(25).get();
    if (!excesso.empty) {
      const batch = db.batch();
      excesso.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) { console.error('[pix] promoção falhou:', e && e.message); }
}

module.exports = { ANONIMO, nomePublico, chaveEmail, chaveDono, guardarPendente, promover };
