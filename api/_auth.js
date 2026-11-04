'use strict';
/* AETIX DESIGN · api/_auth.js (módulo compartilhado, NÃO é uma rota)

   exigirLogin(req, res)                    -> confere o token de login (Authorization: Bearer <token>)
   exigirLogin(req, res, { aceite: true })  -> confere o login, o e-mail confirmado E o aceite dos Termos
   Devolve o uid se estiver tudo certo. Se não, já responde ao navegador e devolve null:
     401 = sem login ou sessão inválida
     403 = logado, mas sem e-mail confirmado (erro 'verificar_email') ou sem aceite (erro 'aceite')
     500 = falha do servidor */
const { getAdminAuth, getDb } = require('./_firebase');
const V = require('./_versoes');

function tokenDoCabecalho(req) {
  const m = /^Bearer\s+(\S+)$/i.exec(String((req.headers && req.headers.authorization) || ''));
  return m ? m[1] : '';
}

/* memória da instância: só guarda "já aceitou", para não consultar o banco a cada chamada */
const jaAceitou = new Map();

/* ===== E-MAIL CONFIRMADO =====
   Só as rotas que passam { aceite: true } (IA, Pix e avaliação) exigem e-mail confirmado.
   Contas criadas ANTES do corte ficam liberadas: já existiam antes da regra e trancá-las
   agora derrubaria gente sem aviso. Basta mudar CORTE para 0 para exigir de todo mundo. */
const CORTE = Date.parse('2026-11-05T00:00:00Z');
const contaAntigaCache = new Map();   // uid -> true (criada antes do corte)

async function contaAntiga(uid) {
  if (contaAntigaCache.has(uid)) return contaAntigaCache.get(uid);
  const u = await getAdminAuth().getUser(uid);
  const criada = Date.parse(String((u.metadata && u.metadata.creationTime) || ''));
  const antiga = Number.isFinite(criada) && criada < CORTE;
  if (contaAntigaCache.size > 5000) contaAntigaCache.clear();
  contaAntigaCache.set(uid, antiga);
  return antiga;
}

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
  let dec;
  try {
    dec = await auth.verifyIdToken(token);
  } catch (e) {
    res.status(401).json({ ok: false, erro: 'login', message: 'Sessão inválida. Entre novamente.' });
    return null;
  }
  const uid = dec.uid;
  if (opcoes && opcoes.aceite) {
    /* 1) e-mail confirmado */
    if (dec.email_verified !== true) {
      let antiga = false;
      try { antiga = await contaAntiga(uid); }
      catch (e) {
        /* se não der para conferir a data da conta, NÃO libera */
        console.error('[auth] conferir verificacao de e-mail:', e && e.message);
        res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Serviço indisponível no momento.' });
        return null;
      }
      if (!antiga) {
        res.status(403).json({ ok: false, erro: 'verificar_email', message: 'Confirme seu e-mail para continuar.' });
        return null;
      }
    }
    /* 2) aceite dos Termos */
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
