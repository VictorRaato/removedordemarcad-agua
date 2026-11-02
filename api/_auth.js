'use strict';
/* AETIX DESIGN · api/_auth.js (módulo compartilhado, NÃO é uma rota)
   exigirLogin(req, res): confere o token de login enviado em "Authorization: Bearer <token>".
   Devolve o uid se estiver tudo certo. Se não, já responde ao navegador (401 ou 500) e devolve null. */
const { getAdminAuth } = require('./_firebase');

function tokenDoCabecalho(req) {
  const m = /^Bearer\s+(\S+)$/i.exec(String((req.headers && req.headers.authorization) || ''));
  return m ? m[1] : '';
}

async function exigirLogin(req, res) {
  const token = tokenDoCabecalho(req);
  if (!token) {
    res.status(401).json({ ok: false, erro: 'login', message: 'Faça login para continuar.' });
    return null;
  }
  let auth;
  try { auth = getAdminAuth(); }
  catch (e) {
    console.error('[auth] configuração do Firebase:', e && e.message);
    res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Serviço indisponível no momento.' });
    return null;
  }
  try {
    const dados = await auth.verifyIdToken(token);
    return dados.uid;
  } catch (e) {
    res.status(401).json({ ok: false, erro: 'login', message: 'Sessão inválida. Entre novamente.' });
    return null;
  }
}

module.exports = { exigirLogin };
