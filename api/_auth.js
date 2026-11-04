'use strict';
/* AETIX DESIGN · api/_auth.js (módulo compartilhado, NÃO é uma rota)

   exigirLogin(req, res)                    -> confere o token de login (Authorization: Bearer <token>)
   exigirLogin(req, res, { aceite: true })  -> confere o login E o aceite dos Termos na versão atual
   Devolve o uid se estiver tudo certo. Se não, já responde ao navegador e devolve null:
     401 = sem login ou sessão inválida · 403 = logado, mas sem aceite da versão atual · 500 = falha do servidor */
const { getAdminAuth, getDb } = require('./_firebase');
const V = require('./_versoes');

function tokenDoCabecalho(req) {
  const m = /^Bearer\s+(\S+)$/i.exec(String((req.headers && req.headers.authorization) || ''));
  return m ? m[1] : '';
}

/* memória da instância: só guarda "já aceitou", para não consultar o banco a cada chamada */
const jaAceitou = new Map();

async function temAceite(uid) {
  const chave = V.TERMOS + '|' + V.PRIVACIDADE;
  if (jaAceitou.get(uid) === chave) return true;
  const snap = await getDb().collection('aceites').doc(uid).get();
  const ok = snap.exists && snap.get('versaoTermos') === V.TERMOS && snap.get('versaoPrivacidade') === V.PRIVACIDADE;
  if (ok) {
    if (jaAceitou.size > 5000) jaAceitou.clear();
    jaAceitou.set(uid, chave);
  }
  return ok;
}

async function exigirLogin(req, res, opcoes) {
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
  let uid;
  try {
    uid = (await auth.verifyIdToken(token)).uid;
  } catch (e) {
    res.status(401).json({ ok: false, erro: 'login', message: 'Sessão inválida. Entre novamente.' });
    return null;
  }
  if (opcoes && opcoes.aceite) {
    let ok = false;
    try { ok = await temAceite(uid); }
    catch (e) {
      /* se não der para conferir o aceite, NÃO libera */
      console.error('[auth] conferir aceite:', e && e.message);
      res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Serviço indisponível no momento.' });
      return null;
    }
    if (!ok) {
      res.status(403).json({ ok: false, erro: 'aceite', message: 'Aceite os Termos de Uso para continuar.' });
      return null;
    }
  }
  return uid;
}

module.exports = { exigirLogin, temAceite };
