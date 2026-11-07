'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/creditos.js
   GET  /api/creditos  -> devolve o saldo do usuário logado (cria a carteira na primeira vez)
   POST /api/creditos  { acao:'reservar', tipo:'foto'|'video' } -> debita e cria a reserva
   POST /api/creditos  { acao:'confirmar', id:'...' }           -> operação deu certo: efetiva
   POST /api/creditos  { acao:'cancelar',  id:'...' }           -> operação falhou: devolve
   POST /api/creditos  { tipo:'foto'|'video' }  (sem acao)      -> debita na hora (compatibilidade)
   A conta mestra é ilimitada. Não lista contas de outras pessoas.
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { consultarCarteira, consumirCreditos, reservarCreditos, confirmarReserva, cancelarReserva } = require('./_creditos');
const { excedeu } = require('./_rate');

function responderErro(res, e) {
  const code = String((e && e.code) || '');
  if (code === 'sem_creditos') return res.status(403).json({ ok: false, erro: 'sem_creditos', message: 'Você não tem créditos suficientes.' });
  if (code === 'sem_plano') return res.status(403).json({ ok: false, erro: 'sem_plano', message: 'Escolha um plano para usar as ferramentas.' });
  if (code === 'reserva') return res.status(403).json({ ok: false, erro: 'reserva', message: 'Reserva inválida.' });
  if (code === 'tipo_invalido') return res.status(400).json({ ok: false, erro: 'tipo', message: 'Informe uma operação válida.' });
  if (code === 'saldo_invalido') return res.status(500).json({ ok: false, erro: 'saldo_invalido', message: 'Serviço indisponível no momento.' });
  console.error('[creditos] operação:', e && e.message);
  return res.status(500).json({ ok: false, erro: 'indisponivel', message: 'Serviço indisponível no momento.' });
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
  if (await excedeu('creditos', req, 60, 60 * 1000)) return res.status(429).json({ ok: false, erro: 'limite', message: 'Muitas tentativas em pouco tempo. Aguarde.' });

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
    const acao = String((b && b.acao) || 'consumir').toLowerCase();

    /* as duas ações não precisam do tipo: a própria reserva já guarda o valor */
    if (acao === 'confirmar' || acao === 'cancelar') {
      const id = b && b.id ? String(b.id).slice(0, 128) : '';
      if (!id) return res.status(400).json({ ok: false, erro: 'reserva', message: 'Reserva inválida.' });
      try {
        const r = acao === 'confirmar' ? await confirmarReserva(uid, id) : await cancelarReserva(uid, id);
        return res.status(200).json(r);
      } catch (e) {
        return responderErro(res, e);
      }
    }

    const tipo = b && String(b.tipo || '').toLowerCase();
    if (tipo !== 'foto' && tipo !== 'video') {
      return res.status(400).json({ ok: false, erro: 'tipo', message: 'Informe uma operação válida.' });
    }
    try {
      const r = acao === 'reservar' ? await reservarCreditos(uid, tipo) : await consumirCreditos(uid, tipo);
      return res.status(200).json(r);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, erro: 'metodo' });
};
