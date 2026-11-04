'use strict';
/* AETIX DESIGN AI · js/aetix-creditos.js
   Conversa com /api/creditos. Não guarda saldo no navegador:
   só pergunta e consome no servidor. */
(function () {
  'use strict';

  var CUSTOS = { foto: 15, video: 25 };

  function erro(message) {
    var e = new Error(message || 'creditos');
    e.code = 'creditos';
    throw e;
  }

  async function lerJson(response) {
    try { return await response.json(); } catch (e) { return null; }
  }

  async function consulta() {
    var response;
    try { response = await fetch('/api/creditos', { cache: 'no-store' }); }
    catch (e) {
      return { ok: false, erro: 'rede', message: 'Sem conexão agora.' };
    }
    var data = await lerJson(response);
    if (!data || typeof data !== 'object') return { ok: false, erro: 'indisponivel' };
    return data;
  }

  async function pode(tipo) {
    var custo = CUSTOS[tipo];
    if (!custo) return { ok: false, erro: 'tipo' };
    var saldo = await consulta();
    if (!saldo || !saldo.ok) return saldo || { ok: false, erro: 'indisponivel' };
    if (saldo.ilimitado === true || saldo.mestre === true) return { ok: true, ilimitado: true, saldo: null };
    var atual = Number(saldo.saldo);
    return {
      ok: Number.isFinite(atual) && atual >= custo,
      ilimitado: false,
      saldo: Number.isFinite(atual) ? atual : null
    };
  }

  async function consumir(tipo) {
    var custo = CUSTOS[tipo];
    if (!custo) return { ok: false, erro: 'tipo' };
    var response;
    try {
      response = await fetch('/api/creditos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo })
      });
    } catch (e) {
      return { ok: false, erro: 'rede', message: 'Sem conexão agora.' };
    }
    var data = await lerJson(response);
    if (!data || typeof data !== 'object') return { ok: false, erro: 'indisponivel' };
    return data;
  }

  window.AETIX_CREDITOS = {
    custos: CUSTOS,
    consultar: consulta,
    pode: pode,
    consumir: consumir
  };
})();
