'use strict';
/* AETIX DESIGN · api/_sessao.js (módulo compartilhado, NÃO é uma rota)
   Cria o cookie de sessão que o "porteiro" (middleware.ts) confere antes de entregar páginas, scripts e imagens.
   O cookie é assinado com a variável de ambiente SESSAO_SECRET (mínimo 32 caracteres) e não dá para falsificar sem ela.
   Dura HORAS horas e é renovado a cada página aberta por quem está logado. */
const crypto = require('crypto');

const NOME = '__Host-aetix';   // "__Host-": o navegador só aceita via HTTPS, sem domínio e para o site todo
const HORAS = 24;

function segredo() {
  const s = process.env.SESSAO_SECRET || '';
  if (s.length < 32) throw new Error('SESSAO_SECRET ausente ou curta (mínimo 32 caracteres).');
  return s;
}

function criarToken(uid) {
  const exp = Math.floor(Date.now() / 1000) + HORAS * 3600;
  const p = Buffer.from(JSON.stringify({ u: String(uid), e: exp })).toString('base64url');
  const s = crypto.createHmac('sha256', segredo()).update(p).digest('base64url');
  return p + '.' + s;
}

/* lembrar=false: cookie de sessão (some quando o navegador fecha) */
function cookieDefinir(valor, lembrar) {
  return NOME + '=' + valor + '; Path=/; HttpOnly; Secure; SameSite=Lax' + (lembrar ? '; Max-Age=' + HORAS * 3600 : '');
}
function cookieApagar() {
  return NOME + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

module.exports = { NOME, HORAS, criarToken, cookieDefinir, cookieApagar };
