'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/excluir.js  (Vercel Serverless Function)
   POST /api/excluir -> apaga os dados da conta no Firestore e depois a conta
   do Firebase Authentication. Exige apenas login (não exige aceite: quem está
   excluindo a conta não pode ficar preso numa tela de termos).

   O que é apagado:
     creditos/{uid}                      -> carteira e saldo
     aceites/{uid} + historico/*         -> aceite dos Termos
     assinantes/{uid}                    -> ficha de assinante
     compras_pendentes (uid)             -> cobranças ainda não pagas
     colab_pendentes (donoHash/conta)    -> colaborações ainda não confirmadas
     limites/ia-chat-u-{uid}             -> cotas de uso da IA (o id contém o uid)
     limites/ia-busca-u-{uid}
   O que é anonimizado (obrigação fiscal/contábil):
     compras (uid/email)                 -> mantém valor e data, sem identificar
     colaboradores (nome/email/telefone) -> mantém valor e data, sem identificar
     colaboracoes (nome)                 -> nome público vira "Anônimo"
     ranking (nome do pódio)             -> nome público vira "Anônimo" (total preservado)
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { getDb, getAdminAuth } = require('./_firebase');
const { chaveDono, chaveEmail } = require('./_pix');
const S = require('./_sessao');
const { excedeu } = require('./_rate');

async function apagarOnde(db, colecao, campo, valor) {
  const snap = await db.collection(colecao).where(campo, '==', valor).get();
  let lote = db.batch();
  let n = 0;
  for (const doc of snap.docs) {
    lote.delete(doc.ref);
    n += 1;
    if (n === 400) { await lote.commit(); lote = db.batch(); n = 0; }
  }
  if (n) await lote.commit();
  return snap.docs.map(d => d.id);
}

async function anonimizar(db, colecao, campo, valor, dados) {
  const snap = await db.collection(colecao).where(campo, '==', valor).get();
  let lote = db.batch();
  let n = 0;
  /* guarda o e-mail antes de sobrescrever: o ranking é indexado pelo hash do e-mail */
  const antes = snap.docs.map(d => ({ id: d.id, email: String(d.get('email') || '').toLowerCase() }));
  for (const doc of snap.docs) {
    lote.set(doc.ref, dados, { merge: true });
    n += 1;
    if (n === 400) { await lote.commit(); lote = db.batch(); n = 0; }
  }
  if (n) await lote.commit();
  return antes;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erro: 'metodo', message: 'Método não permitido.' });
  }
  const uid = await exigirLogin(req, res);   // sem aceite: exclusão não pode ficar bloqueada
  if (!uid) return;

  if (await excedeu('excluir', req, 10, 60 * 1000)) {
    return res.status(429).json({ ok: false, erro: 'limite', message: 'Muitas tentativas. Aguarde um pouco.' });
  }

  try {
    const db = getDb();
    const donoHash = chaveDono(uid);

    /* ---------- apagar ---------- */
    await db.collection('creditos').doc(uid).delete().catch(() => {});
    await db.collection('assinantes').doc(uid).delete().catch(() => {});

    const historico = await db.collection('aceites').doc(uid).collection('historico').get();
    let lote = db.batch();
    let n = 0;
    for (const doc of historico.docs) {
      lote.delete(doc.ref);
      n += 1;
      if (n === 400) { await lote.commit(); lote = db.batch(); n = 0; }
    }
    lote.delete(db.collection('aceites').doc(uid));
    await lote.commit();

    await apagarOnde(db, 'compras_pendentes', 'uid', uid);
    await apagarOnde(db, 'colab_pendentes', 'donoHash', donoHash);
    await apagarOnde(db, 'colab_pendentes', 'conta', uid);   // registros antigos

    /* cotas de IA: o próprio id do documento carrega o uid */
    await db.collection('limites').doc('ia-chat-u-' + uid).delete().catch(() => {});
    await db.collection('limites').doc('ia-busca-u-' + uid).delete().catch(() => {});

    /* ---------- anonimizar o que precisa ficar por obrigação legal ---------- */
    await anonimizar(db, 'compras', 'uid', uid, { uid: '', email: '' });

    const colab = [];
    colab.push(...await anonimizar(db, 'colaboradores', 'donoHash', donoHash, {
      donoHash: '', nomeCompleto: 'Anônimo', email: '', telefone: '', mostrar: false
    }));
    colab.push(...await anonimizar(db, 'colaboradores', 'conta', uid, {
      conta: '', nomeCompleto: 'Anônimo', email: '', telefone: '', mostrar: false
    }));

    if (colab.length) {
      const loteCol = db.batch();
      for (const c of colab) {
        loteCol.set(db.collection('colaboracoes').doc(String(c.id)), { nome: 'Anônimo' }, { merge: true });
      }
      await loteCol.commit();

      /* o nome público também aparece no pódio; o total arrecadado é preservado */
      const emails = [...new Set(colab.map(c => c.email).filter(Boolean))];
      for (const email of emails) {
        const ref = db.collection('ranking').doc(chaveEmail(email));
        const snapRank = await ref.get();
        if (snapRank.exists) await ref.set({ nome: 'Anônimo' }, { merge: true });
      }
    }

    /* ---------- só agora apaga a conta de login ---------- */
    try {
      await getAdminAuth().deleteUser(uid);
    } catch (e) {
      if (String((e && e.code) || '') !== 'auth/user-not-found') {
        console.error('[excluir] auth:', e && e.message);
        return res.status(502).json({ ok: false, erro: 'auth', message: 'Não foi possível excluir a conta agora. Tente de novo.' });
      }
    }

    res.setHeader('Set-Cookie', S.cookieApagar());
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[excluir] falha:', e && e.message);
    return res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Não foi possível excluir a conta agora. Tente de novo.' });
  }
};
