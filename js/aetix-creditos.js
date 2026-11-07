'use strict';
/* AETIX DESIGN AI · js/aetix-creditos.js
   Conversa com /api/creditos e atualiza os medidores no perfil e no menu.
   Não escreve saldo por conta própria e não lista contas de outras pessoas. */
(function () {
  'use strict';

  var CUSTOS = { foto: 15, video: 25 };
  var MAX_CREDITOS = 500;
  var CHAVE_CREDITOS = 'aetix-credits-cache';
  var CHAVE_USUARIO = 'aetix-user-cache';

  function lerUsuarioCache() {
    try { return JSON.parse(localStorage.getItem(CHAVE_USUARIO) || 'null'); } catch (e) { return null; }
  }
  function emailUsuario() {
    var u = lerUsuarioCache();
    return u && u.email ? String(u.email).toLowerCase() : '';
  }
  function lerCacheCreditos() {
    try {
      var d = JSON.parse(localStorage.getItem(CHAVE_CREDITOS) || 'null');
      return d && d.email ? d : null;
    } catch (e) { return null; }
  }
  function guardarCache(dados) {
    if (!dados || dados.ok !== true || !dados.email) return;
    var plano = dados.plano === 'starter' || dados.plano === 'pro' ? dados.plano : 'free';
    var planoCreditos = Number(dados.planoCreditos);
    try {
      localStorage.setItem(CHAVE_CREDITOS, JSON.stringify({
        email: String(dados.email).toLowerCase(),
        nome: String(dados.nome || ''),
        saldo: dados.ilimitado === true ? null : Number(dados.saldo),
        ilimitado: dados.ilimitado === true,
        mestre: dados.mestre === true,
        plano: plano,
        planoCreditos: Number.isFinite(planoCreditos) && planoCreditos > 0 ? planoCreditos : 0
      }));
    } catch (e) {}
  }
  function cacheCompativel(dados) {
    return !!(dados && dados.email && dados.email === emailUsuario());
  }
  function pintarCache() {
    var d = lerCacheCreditos();
    if (!d || d.email !== emailUsuario()) return false;
    var elementos = document.querySelectorAll('[data-credits]');
    Array.prototype.forEach.call(elementos, function (el) { pintar(el, d); });
    pintarPlano(d);
    aplicarUpgrade(d);
    return true;
  }
  function esconderTodos() {
    var elementos = document.querySelectorAll('[data-credits]');
    Array.prototype.forEach.call(elementos, function (el) { el.hidden = true; });
  }

  /* Botão "PLANOS UPGRADE": Free sempre vê; quem comprou pacote só vê
     quando o saldo cai para 20% do pacote comprado; mestra não vê. */
  var LIMIAR_UPGRADE = 0.2;
  function esconderUpgrade() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-upgrade]'), function (el) { el.hidden = true; });
  }
  function aplicarUpgrade(dados) {
    var els = document.querySelectorAll('[data-upgrade]');
    if (!els.length) return;
    var mostrar;
    if (!dados) mostrar = false;
    else if (dados.ilimitado === true || dados.mestre === true) mostrar = false;
    else if (dados.plano !== 'starter' && dados.plano !== 'pro') mostrar = true;   /* plano Free */
    else {
      var planoCreditos = Number(dados.planoCreditos);
      var saldo = Number(dados.saldo);
      mostrar = Number.isFinite(planoCreditos) && planoCreditos > 0 &&
        (!Number.isFinite(saldo) || saldo <= planoCreditos * LIMIAR_UPGRADE);
    }
    Array.prototype.forEach.call(els, function (el) { el.hidden = !mostrar; });
  }

  /* Nível mostrado no perfil/menu: 'free' (Free), 'starter'/'pro' (compras via /api/comprar)
     e 'mestre' (conta ilimitada). O que a API devolver manda. */
  function nivelDe(dados) {
    if (dados && dados.mestre === true) return 'mestre';
    if (dados && (dados.plano === 'starter' || dados.plano === 'pro')) return dados.plano;
    if (dados && dados.plano === 'nenhum') return 'nenhum';   // ainda não escolheu plano
    return 'free';
  }
  function pintarPlano(dados) {
    var nivel = nivelDe(dados);
    document.documentElement.setAttribute('data-nivel', nivel);
    Array.prototype.forEach.call(document.querySelectorAll('[data-plan]'), function (el) {
      el.hidden = el.getAttribute('data-plan') !== nivel;
    });
    var botao = document.getElementById('profileBtn');
    if (botao) botao.setAttribute('data-nivel', nivel);
    anunciar(dados);
  }

  /* Painel de planos (aetix-upgrade.js) reage a este evento */
  function anunciar(dados) {
    try {
      window.dispatchEvent(new CustomEvent('aetix:saldo', { detail: dados || null }));
    } catch (e) {}
  }
  function esconderPlanos() {
    document.documentElement.removeAttribute('data-nivel');
    Array.prototype.forEach.call(document.querySelectorAll('[data-plan]'), function (el) { el.hidden = true; });
    var botao = document.getElementById('profileBtn');
    if (botao) botao.removeAttribute('data-nivel');
    esconderUpgrade();
    anunciar(null);
  }

  function erro(message) {
    var e = new Error(message || 'creditos');
    e.code = 'creditos';
    throw e;
  }

  async function lerJson(response) {
    try { return await response.json(); } catch (e) { return null; }
  }

  var aviso401 = false;
  async function consulta() {
    var response;
    try { response = await fetch('/api/creditos', { cache: 'no-store' }); }
    catch (e) { return { ok: false, erro: 'rede', message: 'Sem conexão agora.' }; }
    if (response.status === 401 && !aviso401) {
      aviso401 = true;
      try { console.warn('[AETIX] não foi possível anexar a sessão (401). O navegador não mandou o token da conta; se isso persistir, saia e entre de novo.'); } catch (e) {}
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
    return { ok: Number.isFinite(atual) && atual >= custo, ilimitado: false, saldo: Number.isFinite(atual) ? atual : null };
  }

  function formatar(n) {
    var valor = Number(n);
    if (!Number.isFinite(valor)) return '—';
    return Math.round(valor).toLocaleString('pt-BR');
  }

  function ehNenhum(dados) {
    return !!(dados && dados.plano === 'nenhum' && dados.mestre !== true && dados.ilimitado !== true);
  }

  function pintar(el, dados) {
    if (!el) return;
    var numero = el.querySelector('[data-credit-count]');
    var barra = el.querySelector('[data-credit-fill]');
    if (!dados || (dados.ok !== true && !dados.email) || ehNenhum(dados)) { el.hidden = true; return; }

    var ilimitado = dados.ilimitado === true || dados.mestre === true;
    var saldo = Number(dados.saldo);
    var maximo = MAX_CREDITOS;
    if ((dados.plano === 'starter' || dados.plano === 'pro') && Number(dados.planoCreditos) > 0) {
      maximo = Number(dados.planoCreditos);
    }
    var criador = dados.plano === 'pro' && dados.mestre !== true && ilimitado;
    var texto = criador ? 'Criador' : (ilimitado ? '∞' : formatar(saldo));
    var largura = ilimitado ? 100 : (Number.isFinite(saldo) ? Math.max(0, Math.min(100, saldo / maximo * 100)) : 0);

    if (numero) numero.textContent = texto;
    if (barra) barra.style.width = largura + '%';
    el.setAttribute('aria-label', criador ? 'Plano Criador · ilimitado' : (ilimitado ? 'Tokens ilimitados' : 'Seus tokens: ' + texto));
    el.hidden = false;
  }

  async function atualizarTudo(dados) {
    if (dados === null) {
      try { localStorage.removeItem(CHAVE_CREDITOS); } catch (e) {}
      esconderTodos();
      esconderPlanos();
      return null;
    }
    var resposta = dados && dados.ok === true ? dados : await consulta();
    if (resposta && resposta.ok === true) {
      guardarCache(resposta);
      var elementos = document.querySelectorAll('[data-credits]');
      Array.prototype.forEach.call(elementos, function (el) { pintar(el, resposta); });
      pintarPlano(resposta);
      aplicarUpgrade(resposta);
      return resposta;
    }
    if (pintarCache()) return lerCacheCreditos();
    return resposta || null;
  }

  function iniciarMedidores() {
    window.addEventListener('aetix:user', function (e) {
      if (!e || !e.detail) { try { localStorage.removeItem(CHAVE_CREDITOS); } catch (x) {} esconderTodos(); esconderPlanos(); return; }
      atualizarTudo();
    });
    if (window.AETIX_USER !== undefined) atualizarTudo();
    else pintarCache();
  }

  async function enviar(corpo) {
    var response;
    try {
      response = await fetch('/api/creditos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });
    } catch (e) {
      return { ok: false, erro: 'rede', message: 'Sem conexão agora.' };
    }
    var data = await lerJson(response);
    if (!data || typeof data !== 'object') return { ok: false, erro: 'indisponivel' };
    return data;
  }

  /* Reserva: debita agora e guarda o comprovante. No fim, confirme; se falhar, cancele. */
  async function reservar(tipo) {
    var custo = CUSTOS[tipo];
    if (!custo) return { ok: false, erro: 'tipo' };
    var data = await enviar({ acao: 'reservar', tipo: tipo });
    if (data && data.ok === true) atualizarTudo(data);
    return data;
  }

  async function confirmar(id) {
    if (!id) return { ok: true, semReserva: true };   /* conta ilimitada: nada a fazer */
    return enviar({ acao: 'confirmar', id: id });
  }

  async function cancelar(id) {
    if (!id) return { ok: true, semReserva: true };
    var data = await enviar({ acao: 'cancelar', id: id });
    if (data && data.ok === true) atualizarTudo();     /* mostra o saldo devolvido */
    return data;
  }

  async function consumir(tipo) {
    var custo = CUSTOS[tipo];
    if (!custo) return { ok: false, erro: 'tipo' };
    var data = await enviar({ tipo: tipo });
    if (data && data.ok === true) atualizarTudo(data);
    return data;
  }

  window.AETIX_CREDITOS = {
    custos: CUSTOS,
    consultar: consulta,
    pode: pode,
    reservar: reservar,
    confirmar: confirmar,
    cancelar: cancelar,
    consumir: consumir,
    atualizar: atualizarTudo,
    max: MAX_CREDITOS
  };

  iniciarMedidores();
})();
