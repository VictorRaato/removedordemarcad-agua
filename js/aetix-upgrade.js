'use strict';
/* ==========================================================================
   AETIX DESIGN AI · js/aetix-upgrade.js
   Painel "PLANOS SEM RENOVAÇÃO" (na tela inicial).

   - Conta nova nasce sem plano: o painel abre automaticamente
   - Enquanto o plano for 'nenhum', as ferramentas ficam bloqueadas (clique nelas
     não faz nada até escolher um plano)
   - Free ativado uma única vez por conta (POST /api/plano)
   - Starter/Pro pagos via Pix (POST /api/comprar); pagamento único, sem renovação
   - O botão PLANOS UPGRADE abre/fecha este mesmo painel (não é pop-up)
   - Cada cartão tem o seu próprio botão de escolher
   ========================================================================== */
(function () {
  'use strict';

  var CARTOES = [
    {
      id: 'free', nome: 'Free', creditos: 150, preco: 0, eq: 10, eqv: 6, selo: '', tipo: 'free',
      beneficios: ['150 créditos de boas-vindas', 'Recursos limitados', 'Um pacote por conta', 'Sem cartão e sem pagamento', 'Processamento no navegador']
    },
    {
      id: 'starter', nome: 'Starter', creditos: 2500, preco: 990, eq: 166, eqv: 100, selo: 'Mais popular', tipo: 'pago',
      beneficios: ['2.500 créditos', 'Todos os modelos desbloqueados', 'Créditos somados ao saldo', 'Pagamento único via Pix', 'Serve até o saldo zerar', 'Processamento no navegador']
    },
    {
      id: 'pro', nome: 'Pro', creditos: 0, preco: 1798, criador: true, selo: '', tipo: 'pago',
      beneficios: ['30 dias ilimitado', 'Suporte prioritário', 'Recursos de IA disponíveis', 'Todos os modelos desbloqueados', 'Modelos de teste', 'Pagamento único via Pix', 'Melhor preço para criador', 'Processamento no navegador']
    }
  ];

  var escolhido = '';
  var cobrancaId = null;
  var polling = null;
  var qrLibPromise = null;
  var painelAberto = false;
  var dispensado = false;

  function $(id) { return document.getElementById(id); }
  function num(n) { return Math.round(Number(n) || 0).toLocaleString('pt-BR'); }
  function brl(centavos) { return ((Number(centavos) || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function fotos(c) { return Math.floor(c / 15); }
  function videos(c) { return Math.floor(c / 25); }
  function achar(id) { for (var i = 0; i < CARTOES.length; i++) if (CARTOES[i].id === id) return CARTOES[i]; return null; }

  /* ---------- renderização dos cartões ---------- */
  function montarCartoes() {
    var caixa = $('planosCards');
    if (!caixa || caixa.dataset.pronto === '1') return;
    CARTOES.forEach(function (p) {
      var b = document.createElement('div');
      b.className = 'ss-card';
      b.dataset.pacote = p.id;
      var selo = p.selo ? '<span class="ss-selo">Mais popular</span>' : '';
      var linhaCreditos = p.criador ? 'Criador' : num(p.creditos) + ' créditos';
      var linhaEq = p.criador ? '30 dias ilimitado' : '≈ ' + num(fotos(p.creditos)) + ' fotos ou ' + num(videos(p.creditos)) + ' vídeos';
      var subPreco = p.criador ? '30 dias · pagamento único' : (p.preco ? 'pagamento único' : 'um pacote por conta');
      b.innerHTML =
        selo +
        '<span class="ss-card__nome"><span class="ss-card__marca" aria-hidden="true"></span>' + p.nome + '<span class="ss-atual" data-atual hidden>Plano atual</span></span>' +
        '<span class="ss-card__preco">' + (p.preco ? brl(p.preco) : 'Free') +
          '<small>' + subPreco + '</small></span>' +
        '<span class="ss-card__creditos">' + linhaCreditos + '</span>' +
        '<span class="ss-card__eq">' + linhaEq + '</span>' +
        '<ul class="ss-lista">' + p.beneficios.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
        '<button type="button" class="pay-btn ss-cta" data-escolher="' + p.id + '"><span>' + (p.preco ? p.nome : 'Free') + '</span></button>';
      caixa.appendChild(b);
    });
    caixa.dataset.pronto = '1';
    caixa.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-escolher]') : null;
      if (btn && !btn.disabled) escolherPlano(btn.getAttribute('data-escolher'));
    });
  }

  function estadoCartoes(dados) {
    /* Pro ilimitado não é mestre: conta mestra continua com tudo travado. */
    var plano = !dados ? 'nenhum' : (dados.mestre === true ? 'mestre' : (dados.plano || 'free'));
    Array.prototype.forEach.call(($('planosCards') || {}).children || [], function (b) {
      var id = b.getAttribute('data-pacote');
      var btn = b.querySelector('[data-escolher]');
      var atual = b.querySelector('[data-atual]');
      if (id === 'free') {
        var podeFree = plano === 'nenhum';
        btn.disabled = !podeFree;
        btn.classList.toggle('is-current', !podeFree);
        if (!podeFree) btn.innerHTML = '<span>Plano atual</span>';
        if (atual) atual.hidden = plano !== 'free';
        return;
      }
      if (plano === 'mestre') {
        btn.disabled = true;
        btn.classList.remove('is-current');
        btn.innerHTML = '<span>' + (id === 'starter' ? 'Starter' : 'Pro') + '</span>';
        if (atual) atual.hidden = true;
        return;
      }
      if (id === 'pro' && plano === 'pro') {
        /* 30 dias já ativos: comprar de novo só depois de expirar */
        btn.disabled = true;
        btn.classList.add('is-current');
        btn.innerHTML = '<span>Plano atual</span>';
        if (atual) atual.hidden = false;
        return;
      }
      btn.disabled = plano === 'pro' && id === 'starter';   /* Pro ativo já dá tudo: não vende Starter por engano */
      btn.classList.remove('is-current');
      btn.innerHTML = '<span>' + (id === 'starter' ? 'Starter' : 'Pro') + '</span>';
      if (atual) atual.hidden = plano !== id;
    });
  }

  function ir(passo) {
    ['planosEscolher', 'planosPix', 'planosOk'].forEach(function (id) {
      var el = $(id); if (el) el.hidden = id !== passo;
    });
  }

  function erro(m) { var e = $('planosErro'); if (e) e.textContent = m || ''; }

  function setStatus(txt) {
    var el = $('planStatus'); if (!el) return;
    var s = el.querySelector('span:last-child'); if (s) s.textContent = txt || '';
    el.hidden = !txt;
  }

  function mostrarPainel() {
    var el = $('planosPanel'); if (!el) return;
    el.hidden = false;
    el.style.transform = '';
    dispensado = false;
    painelAberto = true;
    if (window.innerWidth < 780 && el.scrollIntoView) {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(true); }
    }
  }

  function esconderPainel() {
    var el = $('planosPanel'); if (el) { el.hidden = true; el.style.transform = ''; }
    painelAberto = false;
  }

  /* Cancelar pagamento: para de observar, apaga a cobrança pendente no servidor
     (a transação continua registrada até expirar ou até o provedor cancelar,
     mas não gera crédito) e volta para a escolha do plano. */
  function cancelarPagamento() {
    pararPolling();
    cobrancaId = null;
    setStatus('');
    ir('planosEscolher');
  }

  function dispensarPainel() { esconderPainel(); dispensado = true; }

  /* ---------- ativação do plano Free (uma vez por conta) ---------- */
  async function ativarFree() {
    erro('');
    var btn = document.querySelector('[data-escolher="free"]') || $('planosComprar');
    var txt = btn ? (btn.querySelector('span') || btn) : null;
    var textoOriginal = txt ? txt.textContent : '';
    var feito = false;
    if (btn) btn.disabled = true;
    if (txt) txt.textContent = 'Ativando…';
    try {
      var r = await fetch('/api/plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano: 'free' })
      });
      var data = null;
      try { data = await r.json(); } catch (e) {}
      if (r.ok && data && data.ok) {
        feito = true;                  /* o estado "Plano atual" vem de aplicarEstado/estadoCartoes */
        await atualizarCreditos();
        esconderPainel();
        return;
      }
      if (r.status === 401) return erro('Entre novamente para ativar o plano.');
      if (r.status === 403) return erro((data && data.message) || 'Confirme seu e-mail e aceite os Termos para ativar.');
      erro((data && data.message) || 'Não foi possível ativar o plano Free. Tente de novo.');
    } catch (e) {
      erro('Sem conexão agora. Tente de novo.');
    } finally {
      if (!feito) {
        if (btn) btn.disabled = false;
        if (txt) txt.textContent = textoOriginal;
      }
    }
  }

  /* ---------- compra de pacotes ---------- */
  async function criarCobranca(pacote) {
    erro('');
    var btn = document.querySelector('[data-escolher="' + pacote + '"]');
    var txt = btn ? (btn.querySelector('span') || btn) : null;
    var textoOriginal = txt ? txt.textContent : '';
    if (btn) btn.disabled = true;
    if (txt) txt.textContent = 'Gerando Pix…';
    try {
      var r = await fetch('/api/comprar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacote: pacote })
      });
      var data = null;
      try { data = await r.json(); } catch (e) {}
      if (r.status === 201 && data && data.ok) {
        escolhido = pacote;
        mostrarPix(data.id, data.pix && data.pix.copy_paste);
        return;
      }
      if (r.status === 401) return erro('Entre novamente para comprar.');
      if (r.status === 403) return erro((data && data.message) || 'Confirme seu e-mail e aceite os Termos para comprar.');
      if (r.status === 409) return erro((data && data.message) || 'Sua conta já tem tudo liberado.');
      if (r.status === 400) return erro((data && data.message) || 'Escolha um plano válido.');
      erro((data && data.message) || 'Não foi possível gerar o Pix. Tente de novo.');
    } catch (e) {
      erro('Sem conexão agora. Tente de novo.');
    } finally {
      if (btn) { btn.disabled = false; if (txt) txt.textContent = textoOriginal; }
    }
  }

  async function atualizarCreditos() {
    if (window.AETIX_CREDITOS && typeof window.AETIX_CREDITOS.atualizar === 'function') {
      try { await window.AETIX_CREDITOS.atualizar(); } catch (e) {}
    }
  }

  function pararPolling() { if (polling) { clearInterval(polling); polling = null; } }

  function carregarQrLib() {
    if (!qrLibPromise) {
      qrLibPromise = new Promise(function (resolve, reject) {
        if (window.qrcode) return resolve(window.qrcode);
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
        s.async = true;
        s.onload = function () { window.qrcode ? resolve(window.qrcode) : reject(new Error('qr')); };
        s.onerror = function () { qrLibPromise = null; reject(new Error('qr')); };
        document.head.appendChild(s);
      });
    }
    return qrLibPromise;
  }

  function desenharQR(codigo) {
    var box = $('planQr'); if (!box) return;
    box.textContent = 'Gerando QR…';
    carregarQrLib().then(function (qrcode) {
      var qr = qrcode(0, 'M');
      qr.addData(String(codigo || ''));
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    }).catch(function () {
      box.textContent = 'QR indisponível — use o código copia e cola abaixo.';
    });
  }

  function iniciarPolling() {
    pararPolling();
    var tentativas = 0;
    polling = setInterval(function () {
      tentativas += 1;
      var modal = $('planosPanel');
      if (!modal || modal.hidden || tentativas > 240) {
        pararPolling();
        if (tentativas > 240) setStatus('Pagamento ainda não detectado. Se você já pagou, aguarde alguns minutos.');
        return;
      }
      fetch('/api/comprar?id=' + encodeURIComponent(cobrancaId), { cache: 'no-store' })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d && String(res.d.status || '').toUpperCase() === 'PAID') {
            pararPolling();
            pagamentoConfirmado();
          }
        })
        .catch(function () { /* rede instável: tenta de novo no próximo ciclo */ });
    }, 2500);
  }

  function pagamentoConfirmado() {
    setStatus('');
    var p = achar(escolhido);
    var okText = $('planOkText');
    if (okText && p) {
      okText.textContent = p.criador
        ? 'Plano Pro ativo: 30 dias ilimitado em todos os modelos. Bom uso!'
        : num(p.creditos) + ' créditos e o plano ' + p.nome + ' já estão ativos. Bom uso!';
    }
    ir('planosOk');
    atualizarCreditos();
  }

  function escolherPlano(id) {
    var p = achar(id);
    if (!p) return;
    if (p.tipo === 'free') return ativarFree();
    return criarCobranca(p.id);
  }

  function mostrarPix(id, codigo, pacoteId) {
    cobrancaId = id;
    var c = $('planCode');
    if (c) c.value = codigo || '';
    if (pacoteId) escolhido = pacoteId;
    var p = achar(escolhido);
    if (p) {
      var lista = $('planosBenefits');
      if (lista) lista.innerHTML = p.beneficios.map(function (x) { return '<li>' + x + '</li>'; }).join('');
      var ttl = $('planosBenefitsTitle');
      if (ttl) ttl.textContent = 'BENEFÍCIOS · ' + p.nome.toUpperCase();
    }
    desenharQR(codigo);
    setStatus('Aguardando confirmação do pagamento…');
    ir('planosPix');
    iniciarPolling();
  }

  function copiarCodigo() {
    var c = $('planCode'); if (!c || !c.value) return;
    var fim = function (ok) { setStatus(ok ? 'Código copiado.' : 'Não foi possível copiar. Selecione o texto e copie manualmente.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(c.value).then(function () { fim(true); }, function () { fim(false); });
    } else {
      c.select();
      try { document.execCommand('copy'); fim(true); } catch (e) { fim(false); }
    }
  }

  /* ---------- gate das ferramentas enquanto plano = nenhum ---------- */
  function permitido(alvo) {
    if (!alvo || !alvo.closest) return true;
    if (document.documentElement.getAttribute('data-nivel') !== 'nenhum') return true;
    return !!alvo.closest('#planosPanel, .hdr, .helpmenu, .dropdown, dialog, .flinks, #cookieBanner, .aetix-thanks, [data-close-modal]');
  }

  function capturar(e) {
    if (document.documentElement.getAttribute('data-nivel') !== 'nenhum') return;
    if (permitido(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    mostrarPainel();
  }

  /* ---------- estado geral ---------- */
  function aplicarEstado(dados) {
    montarCartoes();
    estadoCartoes(dados);
    var nivel = document.documentElement.getAttribute('data-nivel');
    if (nivel === 'nenhum' && !dispensado) mostrarPainel();
    else if (nivel !== 'nenhum') esconderPainel();
  }

  function bind() {
    var copy = $('planCopy');
    if (copy) copy.addEventListener('click', copiarCodigo);
    var payClose = $('planosPayClose');
    if (payClose) payClose.addEventListener('click', cancelarPagamento);
    var ok = $('planOkBtn');
    if (ok) ok.addEventListener('click', function () { esconderPainel(); });
    var gatilho = $('pricingOpen');
    if (gatilho) gatilho.addEventListener('click', function () {
      if (painelAberto) dispensarPainel(); else mostrarPainel();
    });
    /* tela de pagamento: arrastar a guia para baixo ou pressionar Escape volta para a escolha */
    var payHandle = document.querySelector('.ss-pay-head');
    if (payHandle) {
      var dragPay = null;
      payHandle.addEventListener('pointerdown', function (e) {
        if (e.target === payHandle) { dragPay = { startY: e.clientY, dy: 0 }; try { payHandle.setPointerCapture(e.pointerId); } catch (err) {} }
      });
      payHandle.addEventListener('pointermove', function (e) {
        if (!dragPay) return;
        dragPay.dy = Math.max(0, e.clientY - dragPay.startY);
        var el = $('planosPanel');
        if (el) el.style.transform = 'translateY(' + Math.min(dragPay.dy, 110) + 'px)';
      });
      var soltarPay = function () {
        if (!dragPay) return;
        var el = $('planosPanel');
        if (el) el.style.transform = '';
        if (dragPay.dy > 70) cancelarPagamento();
        dragPay = null;
      };
      payHandle.addEventListener('pointerup', soltarPay);
      payHandle.addEventListener('pointercancel', soltarPay);
      payHandle.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); cancelarPagamento(); } });
    }

    /* arrastar a guia para baixo para fechar */
    var head = $('planosHandle');
    var drag = null;
    if (head) {
      var iniciarArraste = function (e) {
        var src = e.touches ? e.touches[0] : e;
        drag = { startY: src.clientY, dy: 0 };
      };
      head.addEventListener('pointerdown', function (e) {
        iniciarArraste(e);
        try { head.setPointerCapture(e.pointerId); } catch (err) {}
      });
      head.addEventListener('pointermove', function (e) {
        if (!drag) return;
        drag.dy = Math.max(0, e.clientY - drag.startY);
        var el = $('planosPanel');
        if (el) el.style.transform = 'translateY(' + Math.min(drag.dy, 110) + 'px)';
      });
      var soltar = function () {
        if (!drag) return;
        var el = $('planosPanel');
        if (el) el.style.transform = '';
        if (drag.dy > 70) dispensarPainel();
        drag = null;
      };
      head.addEventListener('pointerup', soltar);
      head.addEventListener('pointercancel', soltar);
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); dispensarPainel(); }
      });
    }

    document.addEventListener('pointerdown', capturar, true);
    document.addEventListener('click', capturar, true);
    document.addEventListener('drop', capturar, true);
    document.addEventListener('dragover', capturar, true);
    document.addEventListener('keydown', function (e) {
      if (document.documentElement.getAttribute('data-nivel') !== 'nenhum') return;
      var v = (e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V');
      if (v && !permitido(e.target)) { capturar(e); }
    }, true);
  }

  function iniciar() {
    montarCartoes();
    bind();
    /* o aetix-creditos.js dispara 'aetix:saldo' assim que souber o plano (cacheado ou pela API) */
    window.addEventListener('aetix:saldo', function (e) { aplicarEstado(e && e.detail ? e.detail : null); });
    var nivelAtual = document.documentElement.getAttribute('data-nivel');
    if (nivelAtual === 'nenhum' && !dispensado) mostrarPainel();
    if (window.AETIX_CREDITOS && typeof window.AETIX_CREDITOS.atualizar === 'function') {
      try { window.AETIX_CREDITOS.atualizar(); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
