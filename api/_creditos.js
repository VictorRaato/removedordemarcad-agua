'use strict';
/* AETIX DESIGN · api/_creditos.js (módulo compartilhado, NÃO é uma rota)
   Carteira de créditos no Firestore (coleção "creditos", um documento por conta).

   Campos: uid, nome, email, saldo, mestre, criadoEm, atualizadoEm
   Contas novas e já existentes recebem 3.500 créditos.
   A conta mestra (vitinhosilva2k20@gmail.com) é ilimitada e não é descontada. */

const { getAdminAuth, getDb } = require('./_firebase');
const { FieldValue } = require('firebase-admin/firestore');

const MESTRE_EMAIL = 'vitinhosilva2k20@gmail.com';
const SALDO_INICIAL = 3500;
const CUSTOS = Object.freeze({ foto: 15, video: 25 });
const COLECAO = 'creditos';

function limpo(valor, max) {
  return String(valor == null ? '' : valor).replace(/[\x00-\x1f<>]/g, '').trim().slice(0, max || 120);
}
function emailDe(user) { return limpo(user && user.email, 254).toLowerCase(); }
function nomeDe(user) {
  const email = emailDe(user);
  return limpo(user && user.displayName, 80) || limparFallback(email);
}
function limparFallback(email) {
  const antes = String(email || '').split('@')[0];
  return limpo(antes, 80) || 'Usuário';
}
function ehMestreEmail(email) { return String(email || '').toLowerCase() === MESTRE_EMAIL; }
function numero(valor) { const n = Number(valor); return Number.isFinite(n) ? n : NaN; }

async function dadosDoLogin(uid) {
  const u = await getAdminAuth().getUser(uid);
  const email = emailDe(u);
  return { uid, nome: nomeDe(u), email, mestre: ehMestreEmail(email) };
}

async function garantirCarteira(uid) {
  const perfil = await dadosDoLogin(uid);
  const ref = getDb().collection(COLECAO).doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    const dados = {
      uid: perfil.uid,
      nome: perfil.nome,
      email: perfil.email,
      saldo: perfil.mestre ? 0 : SALDO_INICIAL,
      mestre: !!perfil.mestre,
      criadoEm: FieldValue.serverTimestamp(),
      atualizadoEm: FieldValue.serverTimestamp()
    };
    await ref.create(dados);
    return { ...dados, criadoEm: new Date(), atualizadoEm: new Date() };
  }

  const dados = snap.data() || {};
  const mestre = perfil.mestre || dados.mestre === true;
  const mudou = dados.email !== perfil.email || dados.nome !== perfil.nome || (perfil.mestre && dados.mestre !== true);

  if (mudou) {
    const atualizacao = { nome: perfil.nome, email: perfil.email, mestre, atualizadoEm: FieldValue.serverTimestamp() };
    await ref.update(atualizacao);
    Object.assign(dados, atualizacao);
  }
  return { ...dados, uid, mestre, saldo: numero(dados.saldo) };
}

function lerSaldo(dados) {
  const saldo = numero(dados && dados.saldo);
  return Number.isFinite(saldo) ? saldo : NaN;
}

async function consultarCarteira(uid) {
  const dados = await garantirCarteira(uid);
  const mestre = dados.mestre === true;
  const saldo = mestre ? 0 : lerSaldo(dados);
  return {
    ok: true,
    uid,
    nome: limparNome(dados.nome),
    email: limparEmail(dados.email),
    mestre,
    ilimitado: mestre,
    saldo: Number.isFinite(saldo) ? saldo : null
  };
}
function limparNome(valor) { return limpo(valor, 80) || 'Usuário'; }
function limparEmail(valor) { return limpo(valor, 254).toLowerCase(); }

async function consumirCreditos(uid, tipo) {
  const custo = CUSTOS[tipo];
  if (!custo) { const e = new Error('tipo_invalido'); e.code = 'tipo_invalido'; throw e; }
  const perfil = await dadosDoLogin(uid);
  if (perfil.mestre) {
    const carteira = await garantirCarteira(uid);
    return { ok: true, tipo, custo, saldo: null, ilimitado: true, consumido: false, mestre: true, nome: carteira.nome, email: carteira.email };
  }

  /* cria/atualiza a carteira antes da transação, para contas novas também debitarem */
  const antes = await garantirCarteira(uid);
  if (antes.mestre === true) {
    return { ok: true, tipo, custo, saldo: null, ilimitado: true, consumido: false, mestre: true, nome: antes.nome, email: antes.email };
  }

  const ref = getDb().collection(COLECAO).doc(uid);
  return getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      const criado = {
        uid,
        nome: perfil.nome,
        email: perfil.email,
        saldo: SALDO_INICIAL,
        mestre: false,
        criadoEm: FieldValue.serverTimestamp(),
        atualizadoEm: FieldValue.serverTimestamp()
      };
      if (SALDO_INICIAL < custo) { const e = new Error('sem_creditos'); e.code = 'sem_creditos'; throw e; }
      tx.set(ref, { ...criado, saldo: SALDO_INICIAL - custo });
      return { ok: true, tipo, custo, saldo: SALDO_INICIAL - custo, ilimitado: false, consumido: true, mestre: false, nome: perfil.nome, email: perfil.email };
    }
    const dados = snap.data() || {};
    if (dados.mestre === true) {
      return { ok: true, tipo, custo, saldo: null, ilimitado: true, consumido: false, mestre: true, nome: limparNome(dados.nome), email: limparEmail(dados.email) };
    }
    const saldo = lerSaldo(dados);
    if (!Number.isFinite(saldo)) { const e = new Error('saldo_invalido'); e.code = 'saldo_invalido'; throw e; }
    if (saldo < custo) { const e = new Error('sem_creditos'); e.code = 'sem_creditos'; throw e; }
    const novo = saldo - custo;
    tx.update(ref, { saldo: novo, atualizadoEm: FieldValue.serverTimestamp() });
    return { ok: true, tipo, custo, saldo: novo, ilimitado: false, consumido: true, mestre: false, nome: limparNome(dados.nome), email: limparEmail(dados.email) };
  });
}

module.exports = { MESTRE_EMAIL, SALDO_INICIAL, CUSTOS, COLECAO, consultarCarteira, consumirCreditos, garantirCarteira };
