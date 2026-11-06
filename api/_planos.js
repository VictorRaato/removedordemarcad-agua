'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/_planos.js (módulo compartilhado, NÃO é uma rota)
   Pacotes de créditos vendidos no site e registro das compras confirmadas.

   Regra de ouro: preço e quantidade de créditos são definidos AQUI, no servidor.
   O navegador só escolhe o pacote; nunca informa valor.

   Coleções no Firestore:
     compras_pendentes  -> cobrança Pix criada, aguardando confirmação
     compras             -> cobrança confirmada (idempotência: um doc por cobrança)
     assinantes          -> um doc por assinante (identidade + pacote atual + total
                            de compras) para consulta/suporte em caso de problema
     creditos            -> carteira do usuário; recebe saldo, plano e planoCreditos

   Promoção da compra (promoverCompra) é idempotente e atômica: pode ser chamada
   pelo webhook e pelo polling de status no navegador sem creditar duas vezes.
   ========================================================================== */

const { getDb } = require('./_firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { SALDO_INICIAL } = require('./_creditos');

const PACOTES = Object.freeze({
  starter: Object.freeze({ id: 'starter', nome: 'Starter', creditos: 2500, centavos: 990 }),
  pro: Object.freeze({ id: 'pro', nome: 'Pro', creditos: 35000, centavos: 1798 })
});
const COLECAO_PENDENTES = 'compras_pendentes';
const COLECAO_COMPRAS = 'compras';
const COLECAO_ASSINANTES = 'assinantes';
const COLECAO_CARTEIRA = 'creditos';

function limpo(valor, max) {
  return String(valor == null ? '' : valor).replace(/[\x00-\x1f<>]/g, '').trim().slice(0, max || 120);
}
function assinaturaAnterior(snap) {
  return {
    totalCompras: Number(snap.get('totalCompras')) || 0,
    totalCreditos: Number(snap.get('totalCreditos')) || 0
  };
}

/* Guarda o pedido até o pagamento ser confirmado. Nunca derruba a cobrança. */
async function guardarPendenteCompra(id, pacote, dados) {
  try {
    const db = getDb();
    await db.collection(COLECAO_PENDENTES).doc(String(id)).set({
      pacote: String(pacote || ''),
      uid: String(dados.uid || ''),
      nomeCompleto: limpo(dados.nomeCompleto, 120),
      email: limpo(dados.email, 254).toLowerCase(),
      telefone: limpo(dados.telefone, 20),
      criadoEm: FieldValue.serverTimestamp()
    });
    const { Timestamp } = require('firebase-admin/firestore');
    const velhos = await db.collection(COLECAO_PENDENTES)
      .where('criadoEm', '<=', Timestamp.fromMillis(Date.now() - 3 * 24 * 3600 * 1000)).limit(20).get();
    if (!velhos.empty) {
      const batch = db.batch();
      velhos.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (e) { console.error('[planos] pendente não gravado:', e && e.message); }
}

/* Pagamento confirmado: credita a carteira, marca o plano e grava a compra.
   Idempotente: cobranças já promovidas não creditam de novo. */
async function promoverCompra(id) {
  const db = getDb();
  return db.runTransaction(async (tx) => {
    const compraRef = db.collection(COLECAO_COMPRAS).doc(String(id));
    const pendenteRef = db.collection(COLECAO_PENDENTES).doc(String(id));
    const compra = await tx.get(compraRef);
    if (compra.exists) return { ok: true, jaPromovida: true };
    const pendente = await tx.get(pendenteRef);
    if (!pendente.exists) return { ok: false, erro: 'nao_encontrado' };

    const d = pendente.data() || {};
    const pacote = PACOTES[String(d.pacote || '').toLowerCase()];
    const uid = String(d.uid || '');
    if (!pacote || !uid) return;

    const carteiraRef = db.collection(COLECAO_CARTEIRA).doc(uid);
    const assinanteRef = db.collection(COLECAO_ASSINANTES).doc(uid);
    /* Firestore: todas as LEITURAS antes de qualquer ESCRITA */
    const carteira = await tx.get(carteiraRef);
    const assinante = await tx.get(assinanteRef);
    const saldoAtual = carteira.exists ? Number(carteira.get('saldo')) : NaN;
    const base = Number.isFinite(saldoAtual) ? saldoAtual : SALDO_INICIAL;
    const agora = FieldValue.serverTimestamp();
    const anterior = assinante.exists ? assinaturaAnterior(assinante) : { totalCompras: 0, totalCreditos: 0 };

    if (carteira.exists) {
      tx.update(carteiraRef, {
        saldo: base + pacote.creditos,
        plano: pacote.id,
        planoCreditos: pacote.creditos,
        planoEm: agora,
        ajusteSaldo500: true,          /* compra paga nunca pode ser rebaixada pelo ajuste único */
        atualizadoEm: agora
      });
    } else {
      tx.set(carteiraRef, {
        uid,
        nome: limpo(d.nomeCompleto, 80) || 'Usuário',
        email: limpo(d.email, 254).toLowerCase(),
        saldo: SALDO_INICIAL + pacote.creditos,
        mestre: false,
        plano: pacote.id,
        planoCreditos: pacote.creditos,
        planoEm: agora,
        ajusteSaldo500: true,
        criadoEm: agora,
        atualizadoEm: agora
      });
    }
    tx.set(compraRef, {
      uid,
      pacote: pacote.id,
      creditos: pacote.creditos,
      centavos: pacote.centavos,
      email: limpo(d.email, 254).toLowerCase(),
      criadoEm: agora
    });
    tx.set(assinanteRef, {
      uid,
      nomeCompleto: limpo(d.nomeCompleto, 120),
      email: limpo(d.email, 254).toLowerCase(),
      pacoteAtual: pacote.id,
      comprouEm: agora,
      totalCompras: anterior.totalCompras + 1,
      totalCreditos: anterior.totalCreditos + pacote.creditos,
      atualizadoEm: agora
    }, { merge: true });
    tx.delete(pendenteRef);
    return { ok: true, jaPromovida: false };
  });
}

module.exports = { PACOTES, guardarPendenteCompra, promoverCompra, COLECAO_ASSINANTES, COLECAO_COMPRAS };
