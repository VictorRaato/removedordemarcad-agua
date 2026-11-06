'use strict';
/* ==========================================================================
   AETIX DESIGN AI · api/comprar.js  (Vercel Serverless Function)
   Compra de pacotes de créditos via Pix (PagueZy). O valor cobrado é sempre
   o do mapa de pacotes em ./_planos (nunca vem do navegador).

   POST /api/comprar     -> cria a cobrança Pix do pacote escolhido
         corpo: { pacote: 'starter'|'pro' }  (nome e e-mail vêm da conta; nada é digitado no checkout)
         resposta 201: { ok:true, id, pix:{ copy_paste } }
   GET  /api/comprar?id= -> consulta o status da cobrança; se a PagueZy já
         confirmou (PAID), credita a carteira e marca o plano (idempotente).

   Variáveis de ambiente: PAGUEZY_API_KEY, PAGUEZY_API_SECRET,
   PAGUEZY_WEBHOOK_SECRET (recomendada). E-mail/telefone nunca são logados.
   ========================================================================== */
const { exigirLogin } = require('./_auth');
const { consultarCarteira } = require('./_creditos');
const { PACOTES, guardarPendenteCompra, promoverCompra } = require('./_planos');

let _fb = null;
function fb() { return _fb || (_fb = require('./_firebase')); }

const PAGUEZY_BASE = 'https://paguezy.com/api/v1';
const MIN_CENTS = 500;
const MAX_CENTS = 5000000;
const TIMEOUT_MS = 20000;
const MAX_BODY_CHARS = 8192;
const JANELA_MS = 60 * 1000;
const MAX_POR_JANELA = 20;

const hits = new Map();
function excedeuLimite(req) {
  const xff = String(req.headers['x-forwarded-for'] || '');
  const chave = xff.split(',')[0].trim() || 'anon';
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
    if (b.length > MAX_BODY_CHARS) return null;
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

const texto = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F]/g, '').trim().slice(0, max) : '');
const pago = (status) => String(status || '').toUpperCase() === 'PAID';

async function chamaApi(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'X-Api-Key': String(process.env.PAGUEZY_API_KEY || ''),
        'X-Api-Secret': String(process.env.PAGUEZY_API_SECRET || ''),
        ...(options && options.headers)
      }
    });
    let data = null;
    try { data = await resp.json(); } catch (e) { /* corpo vazio */ }
    return { ok: resp.ok, status: resp.status, data: data || {} };
  } finally {
    clearTimeout(timer);
  }
}

async function criarCobranca(path, options) {
  if (!process.env.PAGUEZY_API_KEY || !process.env.PAGUEZY_API_SECRET) {
    throw Object.assign(new Error('config'), { code: 'config' });
  }
  return chamaApi(PAGUEZY_BASE + path, options);
}

function mensagemErro(data, status) {
  const m = data && (data.message || (data.error && (data.error.message || data.error)));
  return typeof m === 'string' && m.length < 200 ? m : 'Erro ' + status;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }
  const uid = await exigirLogin(req, res, { aceite: true });   // 401 sem login · 403 sem aceite
  if (!uid) return;
  if (excedeuLimite(req)) {
    return res.status(429).json({ ok: false, message: 'Muitas tentativas. Aguarde um pouco.' });
  }

  try {
    /* ---------- consulta de status ---------- */
    if (req.method === 'GET') {
      const id = texto(req.query && req.query.id, 128);
      if (!/^[\w.-]{4,128}$/.test(id)) {
        return res.status(400).json({ ok: false, message: 'Identificador inválido.' });
      }
      /* só o dono da cobrança pode consultar o status */
      const db = fb().getDb();
      const pend = await db.collection('compras_pendentes').doc(id).get();
      if (pend.exists) {
        const dono = pend.get('uid');
        if (dono && dono !== uid) return res.status(404).json({ ok: false, message: 'Cobrança não encontrada.' });
      } else {
        const compra = await db.collection('compras').doc(id).get();
        const dono = compra.exists ? compra.get('uid') : '';
        if (!compra.exists || (dono && dono !== uid)) return res.status(404).json({ ok: false, message: 'Cobrança não encontrada.' });
      }
      const r = await criarCobranca('/payments/' + encodeURIComponent(id), { method: 'GET' });
      if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ ok: false, message: mensagemErro(r.data, r.status) });
      const status = String(r.data.status || '');
      if (pago(status)) await promoverCompra(id);
      return res.status(200).json({ ok: true, status: status });
    }

    /* ---------- criação da cobrança ---------- */
    const body = lerBody(req);
    if (!body) return res.status(400).json({ ok: false, message: 'Corpo da requisição inválido.' });

    const pacote = texto(body.pacote, 24).toLowerCase();
    const p = PACOTES[pacote];
    if (!p) return res.status(400).json({ ok: false, message: 'Escolha um pacote válido.' });

    const cents = p.centavos;
    if (!Number.isInteger(cents) || cents < MIN_CENTS || cents > MAX_CENTS) {
      return res.status(500).json({ ok: false, message: 'Pacote indisponível no momento.' });
    }

    /* conta mestra já é ilimitada: não precisa comprar pacote */
    const carteira = await consultarCarteira(uid);
    if (carteira && carteira.mestre) {
      return res.status(409).json({ ok: false, erro: 'mestre', message: 'Sua conta já tem acesso ilimitado ao serviço.' });
    }
    /* Pro ativo já inclui tudo por 30 dias: evita cobrar de novo (e perder dias) por engano */
    if (carteira && carteira.plano === 'pro' && carteira.ilimitado === true) {
      return res.status(409).json({ ok: false, erro: 'pro', message: 'Seu plano Pro já está ativo e inclui tudo por 30 dias.' });
    }

    /* nome e e-mail vêm da conta (nada é digitado no checkout) */
    const { getAdminAuth } = require('./_firebase');
    const loginUser = await getAdminAuth().getUser(uid);
    const name = texto(loginUser.displayName, 120) || texto(String(loginUser.email || '').split('@')[0], 120) || 'Usuário';
    const email = texto(loginUser.email, 254).toLowerCase();
    if (!email) return res.status(400).json({ ok: false, message: 'Não encontramos o e-mail da sua conta.' });

    const externalReference = texto(body.external_reference, 64) || ('aetix-plano-' + pacote + '-' + Date.now());

    const payload = {
      amount: cents,
      payment_method: 'pix',
      external_reference: externalReference,
      customer: { name, email }
    };

    let r = await criarCobranca('/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(r.status >= 400 && r.status < 600 ? r.status : 502).json({ ok: false, message: mensagemErro(r.data, r.status) });

    const id = r.data.transaction_id || r.data.id || r.data.provider_transaction_id;
    const copy = r.data.pix_copy_paste || (r.data.pix && r.data.pix.copy_paste);
    if (!id || !copy) return res.status(502).json({ ok: false, message: 'Resposta inesperada do processador de pagamentos.' });

    await guardarPendenteCompra(id, pacote, { uid, nomeCompleto: name, email, telefone: '' });
    return res.status(201).json({ ok: true, id: id, pix: { copy_paste: copy } });
  } catch (err) {
    if (err && err.code === 'config') {
      console.error('[comprar] configuração ausente.');
      return res.status(500).json({ ok: false, message: 'Pagamento indisponível no momento.' });
    }
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ ok: false, message: 'Tempo esgotado. Tente de novo.' });
    }
    console.error('[comprar] falha:', err && err.message);
    return res.status(500).json({ ok: false, message: 'Não foi possível gerar o Pix.' });
  }
};
