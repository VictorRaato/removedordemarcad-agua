'use strict';
/* AETIX DESIGN AI · api/colaboracoes.js
   GET /api/colaboracoes         -> { ok, top:[{nome,centavos}], recentes:[até 100 {nome,centavos,em}] }
   GET /api/colaboracoes?feed=1  -> { ok, recentes } (usado pelos avisos verdes, sem o pódio)
   Só expõe primeiro/segundo nome + valor + data de quem marcou "Mostrar meu nome".
   O id do documento (que é o id da transação no processador) NÃO sai daqui.

   Proteções desta rota pública:
   1) só aceita o parâmetro "feed" — qualquer outro criaria uma URL nova e furaria o cache da CDN;
   2) limitador por IP, na memória da instância;
   3) cache curto na memória da instância, para não consultar o banco a cada visita. */
const { getDb } = require('./_firebase');
const { excedeu } = require('./_rate');

const CACHE_MS = { feed: 60 * 1000, mural: 5 * 60 * 1000 };
const cache = { feed: null, mural: null };
function doCache(tipo) {
  const c = cache[tipo];
  return c && Date.now() - c.em < CACHE_MS[tipo] ? c.dados : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ ok: false }); }

  const q = req.query || {};
  if (await excedeu('colaboracoes', req, 40, 60 * 1000)) {
    res.setHeader('Retry-After', '30');
    return res.status(429).json({ ok: false });
  }
  for (const k of Object.keys(q)) {
    if (k !== 'feed') return res.status(400).json({ ok: false });
  }
  const soResumo = q.feed === '1';
  if (q.feed !== undefined && !soResumo) return res.status(400).json({ ok: false });

  const tipo = soResumo ? 'feed' : 'mural';
  const guardado = doCache(tipo);
  if (guardado) {
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(guardado);
  }

  try {
    const db = getDb();
    /* o aviso verde só precisa dos mais recentes; o mural completo mostra os 100 */
    const recSnap = await db.collection('colaboracoes').orderBy('criadoEm', 'desc').limit(soResumo ? 10 : 100).get();
    const recentes = recSnap.docs.map(d => {
      const x = d.data();
      const t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : 0;
      return { nome: String(x.nome || ''), centavos: Number(x.centavos) || 0, em: t };
    });
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    if (soResumo) {
      const dados = { ok: true, recentes };
      cache.feed = { em: Date.now(), dados };
      return res.status(200).json(dados);
    }
    const topSnap = await db.collection('ranking').orderBy('centavos', 'desc').limit(3).get();
    const top = topSnap.docs.map(d => ({ nome: String(d.get('nome') || ''), centavos: Number(d.get('centavos')) || 0 }));
    const dados = { ok: true, top, recentes };
    cache.mural = { em: Date.now(), dados };
    return res.status(200).json(dados);
  } catch (err) {
    console.error('[colaboracoes]', err && err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false });
  }
};
