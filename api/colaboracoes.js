'use strict';
/* AETIX DESIGN AI · api/colaboracoes.js
   GET /api/colaboracoes         -> { ok, top:[{nome,centavos}], recentes:[até 100 {nome,centavos,em}] }
   GET /api/colaboracoes?feed=1  -> { ok, recentes } (usado pelos avisos verdes, sem o pódio)
   Só expõe primeiro/segundo nome + valor + data de quem marcou "Mostrar meu nome".
   O id do documento (que é o id da transação no processador) NÃO sai daqui. */
const { getDb } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ ok: false }); }
  try {
    const db = getDb();
    const soResumo = req.query && req.query.feed === '1';
    const recSnap = await db.collection('colaboracoes').orderBy('criadoEm', 'desc').limit(100).get();
    const recentes = recSnap.docs.map(d => {
      const x = d.data();
      const t = x.criadoEm && x.criadoEm.toMillis ? x.criadoEm.toMillis() : 0;
      return { nome: String(x.nome || ''), centavos: Number(x.centavos) || 0, em: t };
    });
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    if (soResumo) return res.status(200).json({ ok: true, recentes });
    const topSnap = await db.collection('ranking').orderBy('centavos', 'desc').limit(3).get();
    const top = topSnap.docs.map(d => ({ nome: String(d.get('nome') || ''), centavos: Number(d.get('centavos')) || 0 }));
    return res.status(200).json({ ok: true, top, recentes });
  } catch (err) {
    console.error('[colaboracoes]', err && err.message);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ ok: false });
  }
};
