'use strict';
/* ==========================================================================
   AETIX DESIGN · api/avaliacao.js  (Vercel Serverless Function)
   Recebe via POST { nota: 1..5, comentario?: string } e grava de forma
   anônima na coleção "avaliacoes" do Cloud Firestore.
   Nenhuma credencial vai para o navegador: tudo vem de variáveis de ambiente.

   ANTI-SPAM: no máximo 1 avaliação por hora por visitante.
   O IP NUNCA é gravado. Só um HMAC-SHA256 (com chave secreta) dele é usado
   como ID de um documento na coleção "limites", que expira em 1 hora.
   Esse registro não tem nenhum vínculo com a nota ou o comentário.
   ========================================================================== */
const crypto = require('crypto');
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

/* ID do banco no Firestore. Aqui o banco foi criado com o ID "default" (sem parênteses);
   o padrão do Firebase seria "(default)". Precisa ser igual ao ID mostrado no console. */
const FIRESTORE_DATABASE_ID = 'default';

const MAX_COMENTARIO = 500;      // mesmo limite do campo no site (maxlength)
const MAX_BODY_BYTES = 4096;     // evita lixo/abuso
const JANELA_MS = 60 * 1000;     // filtro barato em memória: 5 requisições por minuto
const MAX_POR_JANELA = 5;
const HORA_MS = 60 * 60 * 1000;  // limite real: 1 avaliação por hora por visitante

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
  return getDb._db || (getDb._db = getFirestore(FIRESTORE_DATABASE_ID));
}

function ipDoVisitante(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || String(req.headers['x-real-ip'] || '').trim() ||
    (req.socket && req.socket.remoteAddress) || '';
}

/* Código irreversível do visitante. O IP em si nunca sai desta função.
   Opcional: defina RATE_SALT na Vercel (qualquer texto longo e aleatório);
   sem ela, usa a chave privada do Firebase como segredo. */
function chaveDoVisitante(req) {
  const ip = ipDoVisitante(req);
  if (!ip) return null;
  const segredo = process.env.RATE_SALT || process.env.FIREBASE_PRIVATE_KEY || 'aetix';
  return crypto.createHmac('sha256', segredo).update(ip).digest('hex');
}

/* Filtro em memória (melhor esforço; some quando a instância é reciclada). */
const hits = new Map();
function excedeuLimite(req) {
  const chave = ipDoVisitante(req) || 'anon';
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
    const db = getDb();
    const chave = chaveDoVisitante(req);
    const novaRef = db.collection('avaliacoes').doc();
    const limiteRef = chave ? db.collection('limites').doc(chave) : null;
    const agora = Date.now();

    /* Transação: confere o limite e grava a avaliação de forma atômica.
       Se algo falhar, o visitante não fica bloqueado sem ter avaliado. */
    await db.runTransaction(async (tx) => {
      if (limiteRef) {
        const snap = await tx.get(limiteRef);
        const ultimo = snap.exists ? snap.get('ultimoEm') : null;
        if (ultimo && agora - ultimo.toMillis() < HORA_MS) {
          const e = new Error('limite-hora');
          e.codigo = 'hora';
          e.restanteSeg = Math.ceil((HORA_MS - (agora - ultimo.toMillis())) / 1000);
          throw e;
        }
        tx.set(limiteRef, {
          ultimoEm: Timestamp.fromMillis(agora),
          expiraEm: Timestamp.fromMillis(agora + HORA_MS)   // use como política TTL no console
        });
      }
      tx.set(novaRef, {
        nota: nota,
        comentario: comentario,
        criadoEm: FieldValue.serverTimestamp()   // timestamp gerado no servidor
      });
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    if (err && err.codigo === 'hora') {
      res.setHeader('Retry-After', String(err.restanteSeg || 3600));
      return res.status(429).json({
        ok: false,
        codigo: 'hora',
        erro: 'Você já enviou uma avaliação há pouco. Tente novamente em até 1 hora.'
      });
    }
    console.error('[avaliacao] falha ao gravar:', err && err.message);
    return res.status(500).json({ ok: false, erro: 'Não foi possível salvar agora.' });
  }
};
