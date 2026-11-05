'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/_planos.js (módulo compartilhado, NÃO é uma rota)
   Pacotes de créditos vendidos no site e registro das compras confirmadas.

   Regra de ouro: preço e quantidade de créditos são definidos AQUI, no servidor.
   O navegador só escolhe o pacote; nunca informa valor.

   Coleções no Firestore:
     compras_pendentes  -> cobrança Pix criada, aguardando confirmação da PagueZy
     compras             -> cobrança confirmada (idempotência: um doc por cobrança)
     creditos            -> carteira do usuário; recebe saldo, plano e planoCreditos

   Promoção da compra (promoverCompra) é idempotente: pode ser chamada pelo webhook
   e pelo polling de status no navegador sem creditar duas vezes.
   ========================================================================== */

const { getDb } = require('./_firebase');
const { FieldValue } = require('firebase-admin/firestore');
const { SALDO_INICIAL } = require('./_creditos');

const PACOTES = Object.freeze({
  starter: Object.freeze({ id: 'starter', nome: 'Starter', creditos: 10000, centavos: 990 }),
  pro: Object.freeze({ id: 'pro', nome: 'Pro', creditos: 35000, centavos: 2490 })
});
const COLECAO_PENDENTES = 'compras_pendentes';
const COLECAO_COMPRAS = 'compras';
const COLECAO_CARTEIRA = 'creditos';

function limpo(valor, max) {
  return String(valor == null ? '' : valor).replace(/[\x00-\x1f<>]/g, '').trim().slice(0, max || 120);
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
  const ref = String(id);
  const pendRef = db.collection(COLECAO_PENDENTES).doc(ref);
  const compraRef = db.collection(COLECAO_COMPRAS).doc(ref);
  let promovido = false;
  try {
    await db.runTransaction(async (tx) => {
      const compra = await tx.get(compraRef);
      if (compra.exists) { promovido = true; return; }   // já creditada; não é colaboração
      const pend = await tx.get(pendRef);
      if (!pend.exists) return;                        // desconhecida/expirada: não é compra
      const d = pend.data() || {};
      const pacote = PACOTES[String(d.pacote || '')];
      const uid = String(d.uid || '');
      if (!pacote || !uid) return;

      const carteiraRef = db.collection(COLECAO_CARTEIRA).doc(uid);
      const carteira = await tx.get(carteiraRef);
      const saldoAtual = carteira.exists ? Number(carteira.get('saldo')) : NaN;
      const base = Number.isFinite(saldoAtual) ? saldoAtual : SALDO_INICIAL;
      const agora = FieldValue.serverTimestamp();

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
      tx.delete(pendRef);
      promovido = true;
    });
    return { ok: true, promovido: promovido === true };
  } catch (e) {
    console.error('[planos] promoção da compra falhou:', e && e.message);
    return { ok: false, promovido: false };
  }
}

module.exports = { PACOTES, COLECAO_PENDENTES, COLECAO_COMPRAS, guardarPendenteCompra, promoverCompra };
