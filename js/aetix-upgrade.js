'use strict';
/* AETIX DESIGN AI · js/aetix-upgrade.js
   Modal "Planos" (checkout de pacotes de créditos).

   - Abertura pelo botão #pricingOpen (script.js abre o modal upgradeModal)
   - Pacotes fixos aqui; o servidor cobra o valor real (api/comprar.js)
   - O checkout não pede dados: nome e e-mail vêm da conta (api/comprar.js)
   - Pagamento via Pix; a tela detecta a confirmação sozinha
     (polling em /api/comprar?id=) ou pelo webhook (api/paguezy-webhook.mjs)
   - Nada é cobrado sem login e sem aceite dos Termos
   ========================================================================== */
(function () {
  'use strict';

  var PACOTES = [
    { id: 'starter', nome: 'Starter', creditos: 10000, preco: 990, selo: 'Mais popular' },
    { id: 'pro', nome: 'Pro', creditos: 35000, preco: 2490, selo: '' }
  ];
  var CUSTO_FOTO = 15;
  var CUSTO_VIDEO = 25;

  var escolhido = 'starter';
  var cobrancaId = null;
  var polling = null;
  var qrLibPromise = null;

  function $(id) { return document.getElementById(id); }
  function num(n) { return Math.round(Number(n) || 0).toLocaleString('pt-BR'); }
  function brl(centavos) { return ((Number(centavos) || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function fotos(c) { return Math.floor(c / CUSTO_FOTO); }
  function videos(c) { return Math.floor(c / CUSTO_VIDEO); }
  function achar(id) { for (var i = 0; i < PACOTES.length; i++) if (PACOTES[i].id === id) return PACOTES[i]; return PACOTES[0]; }

  /* ---------- cartões de pacote ---------- */
  function criarCard(p) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'upgrade-card';
    b.dataset.pacote = p.id;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    var h = '';
    if (p.selo) h += '<span class="upgrade-card__nome"><span>' + p.nome + '</span><span class="upgrade-selo">' + p.selo + '</span></span>';
    else h += '<span class="upgrade-card__nome"><span>' + p.nome + '</span></span>';
    h += '<span class="upgrade-card__preco">' + brl(p.preco) + '<small>pagamento único</small></span>';
    h += '<span class="upgrade-card__creditos">' + num(p.creditos) + ' créditos</span>';
    h += '<span class="upgrade-card__eq">≈ ' + num(fotos(p.creditos)) + ' fotos ou ' + num(videos(p.creditos)) + ' vídeos</span>';
    b.innerHTML = h;
    return b;
  }

  function selecionar(id) {
    escolhido = String(id);
    var p = achar(escolhido);
    var caixa = $('upgradePlanos');
    if (caixa) {
      Array.prototype.forEach.call(caixa.children, function (c) {
        var on = c.getAttribute('data-pacote') === String(id);
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-checked', String(on));
      });
    }
    var btn = $('upBtnTxt');
    if (btn) btn.textContent = 'Comprar ' + p.nome + ' · ' + brl(p.preco);
  }

  function renderCards() {
    var caixa = $('upgradePlanos');
    if (!caixa || caixa.dataset.pronto === '1') return;
    PACOTES.forEach(function (p) { caixa.appendChild(criarCard(p)); });
    caixa.dataset.pronto = '1';
    caixa.addEventListener('click', function (e) {
      var card = e.target && e.target.closest ? e.target.closest('.upgrade-card') : null;
      if (card) selecionar(card.getAttribute('data-pacote'));
    });
  }

  /* ---------- passos do modal ---------- */
  function ir(passo) {
    ['upgradeFormView', 'upgradePixView', 'upgradeOkView'].forEach(function (id) {
      var el = $(id); if (el) el.hidden = id !== passo;
    });
    var card = $('upgradeCard');
    if (card) card.dataset.step = passo === 'upgradeFormView' ? 'form' : (passo === 'upgradePixView' ? 'pix' : 'ok');
  }

  function erro(msg) {
    var el = $('upErr');
    if (el) el.textContent = msg || '';
  }

  function setStatus(txt) {
    var el = $('upStatus');
    if (!el) return;
    var s = el.querySelector('span:last-child') || (el.lastElementChild || el);
    if (s && s !== el) s.textContent = txt || '';
    el.hidden = !txt;
  }

  function planoAtualTexto() {
    try {
      var d = JSON.parse(localStorage.getItem('aetix-credits-cache') || 'null');
      if (d && d.plano === 'pro') return 'Pro';
      if (d && d.plano === 'starter') return 'Starter';
    } catch (e) {}
    return 'Free';
  }

  function preencher() {
    var cur = $('upgradeCurrentPlan');
    if (cur) cur.textContent = planoAtualTexto();
  }

  /* ---------- criar cobrança ---------- */
  async function criarCobranca() {
    erro('');
    var btn = $('upBtn');
    if (btn) btn.disabled = true;
    var txt = $('upBtnTxt');
    if (txt) txt.textContent = 'Gerando Pix…';
    try {
      var r = await fetch('/api/comprar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacote: escolhido })
      });
      var data = null;
      try { data = await r.json(); } catch (e) {}
      if (r.status === 201 && data && data.ok) {
        mostrarPix(data.id, data.pix && data.pix.copy_paste);
        return;
      }
      if (r.status === 401) return erro('Entre novamente para comprar.');
      if (r.status === 403) return erro((data && data.message) || 'Confirme seu e-mail e aceite os Termos para comprar.');
      if (r.status === 409) return erro((data && data.message) || 'Sua conta já tem acesso ilimitado.');
      if (r.status === 400) return erro((data && data.message) || 'Escolha um pacote válido.');
      erro((data && data.message) || 'Não foi possível gerar o Pix. Tente de novo.');
    } catch (e) {
      erro('Sem conexão agora. Tente de novo.');
    } finally {
      if (btn) btn.disabled = false;
      selecionar(escolhido);   // restaura o texto do botão
    }
  }

  /* ---------- Pix: QR, polling, confirmação ---------- */
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
    var box = $('upQr');
    if (!box) return;
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

  function pararPolling() {
    if (polling) { clearInterval(polling); polling = null; }
  }

  function iniciarPolling() {
    pararPolling();
    var tentativas = 0;
    polling = setInterval(function () {
      tentativas += 1;
      var modal = $('upgradeModal');
      if (!modal || modal.hidden || tentativas > 240) { pararPolling(); if (tentativas > 240) setStatus('Pagamento ainda não detectado. Se você já pagou, aguarde alguns minutos.'); return; }
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
    var okText = $('upOkText');
    if (okText) okText.textContent = num(p.creditos) + ' créditos e o plano ' + p.nome + ' já estão ativos. Bom uso!';
    ir('upgradeOkView');
    if (window.AETIX_CREDITOS && typeof window.AETIX_CREDITOS.atualizar === 'function') {
      try { window.AETIX_CREDITOS.atualizar(); } catch (e) {}
    }
  }

  function mostrarPix(id, codigo) {
    cobrancaId = id;
    var c = $('upCode');
    if (c) c.value = codigo || '';
    desenharQR(codigo);
    setStatus('Aguardando confirmação do pagamento…');
    ir('upgradePixView');
    iniciarPolling();
  }

  function copiarCodigo() {
    var c = $('upCode');
    if (!c || !c.value) return;
    var fim = function (ok) {
      setStatus(ok ? 'Código copiado.' : 'Não foi possível copiar. Selecione o texto e copie manualmente.');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(c.value).then(function () { fim(true); }, function () { fim(false); });
    } else {
      c.select();
      try { document.execCommand('copy'); fim(true); } catch (e) { fim(false); }
    }
  }

  /* ---------- bindings ---------- */
  function bind() {
    var btn = $('upBtn');
    if (btn) btn.addEventListener('click', criarCobranca);
    var copy = $('upCopy');
    if (copy) copy.addEventListener('click', copiarCodigo);
    var gatilho = $('pricingOpen');
    if (gatilho) gatilho.addEventListener('click', function () { preencher(); ir('upgradeFormView'); });
    var modaisFechables = document.querySelectorAll('#upgradeModal [data-close-modal]');
    Array.prototype.forEach.call(modaisFechables, function (el) {
      el.addEventListener('click', function () { pararPolling(); });
    });
  }

  renderCards();
  selecionar(escolhido);
  preencher();
  bind();
})();
