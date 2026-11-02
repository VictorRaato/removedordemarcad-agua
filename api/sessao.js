'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/sessao.js  (Vercel Serverless Function)
   POST   /api/sessao  -> exige login (token do Firebase). Se a conta já aceitou os Termos na versão atual,
                          grava o cookie de sessão e responde { ok:true, aceito:true }.
                          Se não aceitou, apaga o cookie e responde { ok:true, aceito:false }.
          corpo opcional: { lembrar:false } -> cookie some ao fechar o navegador
   DELETE /api/sessao  -> apaga o cookie (sair da conta)

   Variável de ambiente obrigatória na Vercel:  SESSAO_SECRET  (texto aleatório de 32+ caracteres)
   ========================================================================== */
const { exigirLogin, temAceite } = require('./_auth');
const S = require('./_sessao');

const JANELA_MS = 60 * 1000;
const MAX_POR_JANELA = 40;
const hits = new Map();
function excedeu(req) {
  const chave = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  const agora = Date.now();
  const lista = (hits.get(chave) || []).filter(t => agora - t < JANELA_MS);
  lista.push(agora);
  hits.set(chave, lista);
  if (hits.size > 5000) hits.clear();
  return lista.length > MAX_POR_JANELA;
}

function lerBody(req) {
  let b = req.body;
  if (typeof b === 'string') {
    if (b.length > 1024) return null;
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ ok: false, erro: 'metodo' });
  }
  if (excedeu(req)) return res.status(429).json({ ok: false, erro: 'limite' });

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', S.cookieApagar());
    return res.status(200).json({ ok: true });
  }

  const uid = await exigirLogin(req, res);   // login obrigatório; o aceite é conferido logo abaixo
  if (!uid) return;
  const b = lerBody(req) || {};
  const lembrar = b.lembrar !== false;

  let aceito = false;
  try { aceito = await temAceite(uid); }
  catch (e) {
    console.error('[sessao] conferir aceite:', e && e.message);
    return res.status(500).json({ ok: false, erro: 'indisponivel' });
  }
  if (!aceito) {
    res.setHeader('Set-Cookie', S.cookieApagar());
    return res.status(200).json({ ok: true, aceito: false });
  }
  try {
    res.setHeader('Set-Cookie', S.cookieDefinir(S.criarToken(uid), lembrar));
  } catch (e) {
    console.error('[sessao]', e && e.message);
    return res.status(500).json({ ok: false, erro: 'indisponivel' });
  }
  return res.status(200).json({ ok: true, aceito: true });
};
