'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/creditos.js
   GET  /api/creditos  -> devolve o saldo do usuário logado (cria a carteira na primeira vez)
   POST /api/creditos  { tipo:'foto'|'video' } -> debita 15 ou 25 créditos no fim do processamento
   A conta mestra é ilimitada. Não lista contas de outras pessoas.
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { consultarCarteira, consumirCreditos } = require('./_creditos');

const JANELA_MS = 60 * 1000;
const MAX_POR_JANELA = 60;
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
  if (excedeu(req)) return res.status(429).json({ ok: false, erro: 'limite', message: 'Muitas tentativas em pouco tempo. Aguarde.' });

  const uid = await exigirLogin(req, res);
  if (!uid) return;

  if (req.method === 'GET') {
    try { return res.status(200).json(await consultarCarteira(uid)); }
    catch (e) {
      console.error('[creditos] consultar:', e && e.message);
      return res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Serviço indisponível no momento.' });
    }
  }

  if (req.method === 'POST') {
    const b = lerBody(req);
    const tipo = b && String(b.tipo || '').toLowerCase();
    if (tipo !== 'foto' && tipo !== 'video') {
      return res.status(400).json({ ok: false, erro: 'tipo', message: 'Informe uma operação válida.' });
    }
    try {
      return res.status(200).json(await consumirCreditos(uid, tipo));
    } catch (e) {
      const code = String((e && e.code) || '');
      if (code === 'sem_creditos') {
        return res.status(403).json({ ok: false, erro: 'sem_creditos', message: 'Você não tem créditos suficientes.' });
      }
      if (code === 'saldo_invalido') {
        return res.status(500).json({ ok: false, erro: 'saldo_invalido', message: 'Serviço indisponível no momento.' });
      }
      console.error('[creditos] consumir:', e && e.message);
      return res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Serviço indisponível no momento.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, erro: 'metodo' });
};
