'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/_rate.js (módulo compartilhado, NÃO é uma rota)
   Limitador de requisições por IP que compartilha o estado entre instâncias.
   Usa um documento por IP + rota + janela na coleção "limites" do Firestore,
   em transação (sem contar duas vezes em disparos simultâneos).

   Falha aberta: se o Firestore estiver indisponível, a requisição NÃO é
   bloqueada (o importante é o site continuar funcionando). O erro vai para o log.
   ========================================================================== */
const crypto = require('crypto');
const { getDb } = require('./_firebase');

let _segredo = null;
function segredo() {
  if (_segredo) return _segredo;
  const base = String(process.env.RATE_SALT || process.env.SESSAO_SECRET || process.env.FIREBASE_PRIVATE_KEY || '');
  _segredo = crypto.createHash('sha256').update(base + '|aetix-rate').digest('hex');
  return _segredo;
}

function hashIp(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  return crypto.createHmac('sha256', segredo()).update(ip).digest('hex').slice(0, 40);
}

async function limpar(db) {
  try {
    const snap = await db.collection('limites').where('expiraEm', '<', new Date()).limit(30).get();
    if (snap.empty) return;
    const lote = db.batch();
    snap.docs.forEach(d => lote.delete(d.ref));
    await lote.commit();
  } catch (e) { /* limpeza é oportunista */ }
}

/* excedeu('comprar', req, 20, 60000) -> true quando passou do limite */
async function excedeu(rota, req, max, janelaMs) {
  const agora = Date.now();
  const janela = Math.floor(agora / janelaMs);
  const id = 'rl-' + String(rota) + '-' + janela + '-' + hashIp(req);

  try {
    const db = getDb();
    const ref = db.collection('limites').doc(id);
    const bloqueado = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const n = snap.exists ? Number(snap.get('n')) || 0 : 0;
      if (n >= max) return true;
      tx.set(ref, {
        n: n + 1,
        rota: String(rota),
        expiraEm: new Date(agora + janelaMs * 2)
      }, { merge: true });
      return false;
    });
    if (Math.random() < 0.02) limpar(db);
    return bloqueado;
  } catch (e) {
    console.error('[rate] indisponível:', e && e.message);
    return false;   // falha aberta: não derruba o site por causa do limitador
  }
}

module.exports = { excedeu };
