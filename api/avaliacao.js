'use strict';
/* ==========================================================================
   AETIX DESIGN · api/avaliacao.js  (Vercel Serverless Function)
   Recebe via POST { nota: 1..5, comentario?: string } e grava de forma
   anônima na coleção "avaliacoes" do Cloud Firestore.
   Nenhuma credencial vai para o navegador: tudo vem de variáveis de ambiente.
   Não são gravados IP, user-agent, e-mail ou qualquer identificador.
   ========================================================================== */
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const MAX_COMENTARIO = 500;      // mesmo limite do campo no site (maxlength)
const MAX_BODY_BYTES = 4096;     // evita lixo/abuso
const JANELA_MS = 60 * 1000;     // limitador simples: 5 envios por minuto por visitante
const MAX_POR_JANELA = 5;

/* Inicializa o Firebase Admin uma única vez (instâncias "quentes" reaproveitam). */
function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    /* Na Vercel a chave costuma chegar com "\n" literais: converte para quebras reais. */
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
      .replace(/^"|"$/g, '')
      .replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Variáveis de ambiente do Firebase ausentes.');
    }
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getDb._db || (getDb._db = getFirestore());
}

/* Limitador em memória (melhor esforço; some quando a instância é reciclada).
   A chave é usada só na memória, nunca é gravada. */
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
    if (b.length > MAX_BODY_BYTES) return null;
    try { b = JSON.parse(b); } catch (e) { return null; }
  }
  return b && typeof b === 'object' ? b : null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, erro: 'Método não permitido.' });
  }

  if (excedeuLimite(req)) {
    return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Aguarde um pouco.' });
  }

  const body = lerBody(req);
  if (!body) {
    return res.status(400).json({ ok: false, erro: 'Corpo da requisição inválido.' });
  }

  /* Validação: nota inteira de 1 a 5 (obrigatória) */
  const nota = Number(body.nota);
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    return res.status(400).json({ ok: false, erro: 'A nota deve ser um número inteiro de 1 a 5.' });
  }

  /* Validação: comentário opcional, texto, até 500 caracteres */
  let comentario = null;
  if (body.comentario != null) {
    if (typeof body.comentario !== 'string') {
      return res.status(400).json({ ok: false, erro: 'Comentário inválido.' });
    }
    const limpo = body.comentario.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
    if (limpo.length > MAX_COMENTARIO) {
      return res.status(400).json({ ok: false, erro: 'Comentário muito longo.' });
    }
    comentario = limpo || null;
  }

  try {
    await getDb().collection('avaliacoes').add({
      nota: nota,
      comentario: comentario,
      criadoEm: FieldValue.serverTimestamp()   // timestamp gerado no servidor
    });
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[avaliacao] falha ao gravar:', err && err.message);
    return res.status(500).json({ ok: false, erro: 'Não foi possível salvar agora.' });
  }
};
