'use strict';
/* AETIX DESIGN AI · js/aetix-creditos.js
   Conversa com /api/creditos e atualiza os medidores no perfil e no menu.
   Não escreve saldo por conta própria e não lista contas de outras pessoas. */
(function () {
  'use strict';

  var CUSTOS = { foto: 15, video: 25 };
  var MAX_CREDITOS = 3500;

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
    catch (e) { return { ok: false, erro: 'rede', message: 'Sem conexão agora.' }; }
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
    return { ok: Number.isFinite(atual) && atual >= custo, ilimitado: false, saldo: Number.isFinite(atual) ? atual : null };
  }

  function formatar(n) {
    var valor = Number(n);
    if (!Number.isFinite(valor)) return '—';
    if (Math.abs(valor) >= 1000) {
      var texto = (valor / 1000).toFixed(2)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*[1-9])0$/, '$1');
      return texto + 'K';
    }
    return String(Math.round(valor));
  }

  function pintar(el, dados) {
    if (!el) return;
    var numero = el.querySelector('[data-credit-count]');
    var barra = el.querySelector('[data-credit-fill]');
    if (!dados || dados.ok !== true) { el.hidden = true; return; }

    var ilimitado = dados.ilimitado === true || dados.mestre === true;
    var saldo = Number(dados.saldo);
    var texto = ilimitado ? '∞' : formatar(saldo);
    var largura = ilimitado ? 100 : (Number.isFinite(saldo) ? Math.max(0, Math.min(100, saldo / MAX_CREDITOS * 100)) : 0);

    if (numero) numero.textContent = texto;
    if (barra) barra.style.width = largura + '%';
    el.setAttribute('aria-label', ilimitado ? 'Tokens ilimitados' : 'Seus tokens: ' + texto);
    el.hidden = false;
  }

  async function atualizarTudo(dados) {
    var resposta = dados && dados.ok === true ? dados : await consulta();
    var elementos = document.querySelectorAll('[data-credits]');
    Array.prototype.forEach.call(elementos, function (el) { pintar(el, resposta); });
    return resposta;
  }

  function iniciarMedidores() {
    window.addEventListener('aetix:user', function () { atualizarTudo(); });
    if (window.AETIX_USER !== undefined) atualizarTudo();
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
    if (data.ok === true) atualizarTudo(data);
    return data;
  }

  window.AETIX_CREDITOS = {
    custos: CUSTOS,
    consultar: consulta,
    pode: pode,
    consumir: consumir,
    atualizar: atualizarTudo,
    max: MAX_CREDITOS
  };

  iniciarMedidores();
})();
