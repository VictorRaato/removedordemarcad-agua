/* AETIX · versão 2.2 (imagem) e seletor de versão.
   Arquivo novo: não altera o que já existe. Se qualquer coisa falhar aqui,
   o site continua usando o caminho da versão 1.0, como sempre. */
(function () {
  'use strict';

  var MODEL_URL = '/models/migan_pipeline_v2.onnx';
  var ORT_VER = '1.22.0';
  var ORT_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@' + ORT_VER + '/dist/';
  var ORT_URL = ORT_BASE + 'ort.all.min.js';
  var CACHE_NAME = 'aetix-modelo-v1';
  var MIN_MODEL_BYTES = 5 * 1048576;   // proteção: um erro 404 não pode virar "modelo"
  var GROW = 3;                        // folga (px) em volta da área marcada
  var KEY_IMG = 'aetix.versao.imagem';
  var LABEL = { v1: 'AETIX v1.0', v2: 'AETIX v2.2' };

  var broken = false, loading = null, session = null, backend = '', modelBuf = null;

  /* ---------- versão escolhida (guardada só neste navegador) ---------- */
  function getVer() {
    try { return localStorage.getItem(KEY_IMG) === 'v2' ? 'v2' : 'v1'; } catch (e) { return 'v1'; }
  }
  function setVer(v) {
    try { localStorage.setItem(KEY_IMG, v === 'v2' ? 'v2' : 'v1'); } catch (e) { /* sem armazenamento */ }
  }

  /* ---------- carregamento do motor ---------- */
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('script')); };
      document.head.appendChild(s);
    });
  }

  function getModel() {
    var cacheP = ('caches' in window) ? caches.open(CACHE_NAME).catch(function () { return null; }) : Promise.resolve(null);
    return cacheP.then(function (cache) {
      var hit = cache ? cache.match(MODEL_URL).catch(function () { return null; }) : Promise.resolve(null);
      return hit.then(function (cached) {
        if (cached) {
          return cached.arrayBuffer().then(function (b) {
            if (b.byteLength >= MIN_MODEL_BYTES) return b;
            return cache.delete(MODEL_URL).catch(function () {}).then(function () { return download(cache); });
          });
        }
        return download(cache);
      });
    });
  }
  function download(cache) {
    return fetch(MODEL_URL, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('modelo');
      return r.arrayBuffer();
    }).then(function (b) {
      if (b.byteLength < MIN_MODEL_BYTES) throw new Error('modelo');
      if (cache) { try { cache.put(MODEL_URL, new Response(b.slice(0))).catch(function () {}); } catch (e) { /* sem cache */ } }
      return b;
    });
  }

  function makeSession(buf, order) {
    var i = 0;
    function next() {
      if (i >= order.length) return Promise.reject(new Error('sessao'));
      var p = order[i++];
      return window.ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: [p], graphOptimizationLevel: 'all' })
        .then(function (s) { return { s: s, p: p }; }, next);
    }
    return next();
  }

  function ensure() {
    if (session) return Promise.resolve();
    if (broken) return Promise.reject(new Error('indisponivel'));
    if (loading) return loading;
    loading = Promise.resolve().then(function () {
      return window.ort ? null : loadScript(ORT_URL);
    }).then(function () {
      if (!window.ort) throw new Error('ort');
      window.ort.env.wasm.wasmPaths = ORT_BASE;
      window.ort.env.wasm.numThreads = 1;
      return getModel();
    }).then(function (buf) {
      modelBuf = buf;
      return makeSession(buf, navigator.gpu ? ['webgpu', 'wasm'] : ['wasm']);
    }).then(function (m) {
      session = m.s; backend = m.p;
    }).catch(function (e) {
      broken = true; loading = null;
      refreshUi();
      throw e;
    });
    return loading;
  }

  /* ---------- apagar ---------- */
  function dilate(hole, W, H, r) {
    if (r <= 0) return hole;
    var tmp = new Uint8Array(W * H), out = new Uint8Array(W * H), x, y, k, a, b;
    for (y = 0; y < H; y++) {
      var row = y * W;
      for (x = 0; x < W; x++) {
        if (hole[row + x]) { a = Math.max(0, x - r); b = Math.min(W - 1, x + r); for (k = a; k <= b; k++) tmp[row + k] = 1; }
      }
    }
    for (x = 0; x < W; x++) {
      for (y = 0; y < H; y++) {
        if (tmp[y * W + x]) { a = Math.max(0, y - r); b = Math.min(H - 1, y + r); for (k = a; k <= b; k++) out[k * W + x] = 1; }
      }
    }
    return out;
  }

  function buildFeeds(rgba, hole, W, H) {
    var n = W * H, img = new Uint8Array(3 * n), mask = new Uint8Array(n), i, j;
    for (i = 0, j = 0; i < n; i++, j += 4) {
      img[i] = rgba[j]; img[n + i] = rgba[j + 1]; img[2 * n + i] = rgba[j + 2];
      mask[i] = hole[i] ? 0 : 255;                 // 255 = manter, 0 = preencher
    }
    var names = session.inputNames;
    var im = names.filter(function (x) { return /img|image/i.test(x); })[0] || names[0];
    var mk = names.filter(function (x) { return /mask/i.test(x); })[0] || names[1];
    var feeds = {};
    feeds[im] = new window.ort.Tensor('uint8', img, [1, 3, H, W]);
    feeds[mk] = new window.ort.Tensor('uint8', mask, [1, 1, H, W]);
    return feeds;
  }

  function runSession(feeds) {
    return session.run(feeds).catch(function (e) {
      if (backend !== 'webgpu') throw e;          // WebGPU falhou ao rodar: tenta de novo na CPU
      return makeSession(modelBuf, ['wasm']).then(function (m) {
        session = m.s; backend = m.p;
        return session.run(feeds);
      });
    });
  }

  function compose(img, out, hole, W, H) {
    var n = W * H, d = img.data, data = out.data, scale = 1, i, o;
    var isU8 = data instanceof Uint8Array || data instanceof Uint8ClampedArray;
    if (!isU8) {
      var mx = 0; for (i = 0; i < data.length; i += 97) if (data[i] > mx) mx = data[i];
      if (mx <= 1.5) scale = 255;
    }
    for (i = 0; i < n; i++) {
      if (!hole[i]) continue;                      // só a área marcada vem do modelo
      o = i * 4;
      d[o] = data[i] * scale; d[o + 1] = data[n + i] * scale; d[o + 2] = data[2 * n + i] * scale;
    }
  }

  // Devolve uma Promise<boolean>: true = apagou com a versão 2.2; false = usar o caminho de sempre.
  function erase(kind, ctx, W, H, mask) {
    if (kind !== 'image' || getVer() !== 'v2' || broken) return Promise.resolve(false);
    if (!ctx || !mask || mask.length !== W * H) return Promise.resolve(false);
    var any = false, i;
    for (i = 0; i < mask.length; i++) if (mask[i]) { any = true; break; }
    if (!any) return Promise.resolve(false);
    var img, hole, feeds;
    return ensure().then(function () {
      img = ctx.getImageData(0, 0, W, H);
      hole = dilate(mask, W, H, GROW);
      feeds = buildFeeds(img.data, hole, W, H);
      return runSession(feeds);
    }).then(function (res) {
      var t = res[session.outputNames[0]], dims = (t && t.dims) || [];
      if (!t || dims.length !== 4 || dims[2] !== H || dims[3] !== W) throw new Error('saida');
      compose(img, t, hole, W, H);
      ctx.putImageData(img, 0, 0);                 // só grava no fim: se algo falhar antes, nada muda
      return true;
    }).catch(function () { return false; });
  }

  /* ---------- seletor de versão na pílula de status ---------- */
  var pill = null, txt = null, menu = null, opt = null, open = false;
  function isPt() { return /^pt/i.test(document.documentElement.lang || 'pt'); }
  function onImageTab() {
    var pv = document.getElementById('panelVideo');
    return !(pv && !pv.hidden && !pv.classList.contains('hidden'));
  }

  function injectCss() {
    if (document.getElementById('aetixVerCss')) return;
    var st = document.createElement('style');
    st.id = 'aetixVerCss';
    st.textContent =
      '.pill.aetix-ver{cursor:pointer;user-select:none}' +
      '.pill.aetix-ver:after{content:"";width:6px;height:6px;margin-left:2px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7;transition:transform .15s}' +
      '.pill.aetix-ver[aria-expanded="true"]:after{transform:rotate(225deg) translateY(-1px)}' +
      '.pill.aetix-ver:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.aetix-ver-menu{position:fixed;z-index:80;min-width:150px;padding:5px;border-radius:14px;border:1px solid var(--line-2);background:rgba(18,12,30,.97);box-shadow:0 12px 32px rgba(0,0,0,.45)}' +
      '.aetix-ver-menu[hidden]{display:none}' +
      '.aetix-ver-menu button{display:block;width:100%;padding:8px 12px;border:0;border-radius:10px;background:transparent;color:var(--ink);font:inherit;font-size:.82rem;text-align:left;cursor:pointer}' +
      '.aetix-ver-menu button:hover:not(:disabled),.aetix-ver-menu button:focus-visible{background:var(--panel-2);outline:0}' +
      '.aetix-ver-menu button:disabled{opacity:.5;cursor:not-allowed}';
    document.head.appendChild(st);
  }

  function place() {
    if (!menu || !pill) return;
    var r = pill.getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.left = Math.round(r.left + r.width / 2 - menu.offsetWidth / 2) + 'px';
  }
  function setOpen(v) {
    open = !!v && !!menu;
    if (menu) menu.hidden = !open;
    if (pill) pill.setAttribute('aria-expanded', String(open));
    if (open) place();
  }

  function refreshUi() {
    if (!pill || !txt) return;
    var active = onImageTab() && pill.dataset.s === 'ok';
    if (!active) {
      pill.classList.remove('aetix-ver');
      pill.removeAttribute('tabindex'); pill.removeAttribute('aria-haspopup'); pill.removeAttribute('aria-expanded');
      setOpen(false);
      return;
    }
    var ver = (getVer() === 'v2' && !broken) ? 'v2' : 'v1';
    if (getVer() === 'v2' && broken) setVer('v1');
    var want = LABEL[ver];
    if (txt.textContent !== want) txt.textContent = want;
    pill.classList.add('aetix-ver');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-haspopup', 'listbox');
    pill.setAttribute('aria-expanded', String(open));
    var other = ver === 'v1' ? 'v2' : 'v1';
    opt.dataset.v = other;
    opt.textContent = LABEL[other] + ((other === 'v2' && broken) ? (isPt() ? ' · indisponível' : ' · unavailable') : '');
    opt.disabled = (other === 'v2' && broken);
    if (open) place();
  }

  function choose(v) {
    setVer(v);
    setOpen(false);
    refreshUi();
    if (v === 'v2') { ensure().catch(function () { /* a pílula já mostra "indisponível" */ }); }
  }

  function initUi() {
    pill = document.getElementById('engine');
    txt = document.getElementById('engineText');
    if (!pill || !txt) return;
    injectCss();

    menu = document.createElement('div');
    menu.className = 'aetix-ver-menu'; menu.hidden = true; menu.setAttribute('role', 'listbox');
    opt = document.createElement('button');
    opt.type = 'button'; opt.setAttribute('role', 'option');
    menu.appendChild(opt);
    document.body.appendChild(menu);

    opt.addEventListener('click', function () { if (!opt.disabled) choose(opt.dataset.v); });
    pill.addEventListener('click', function () { if (pill.classList.contains('aetix-ver')) setOpen(!open); });
    pill.addEventListener('keydown', function (e) {
      if (!pill.classList.contains('aetix-ver')) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); }
    });
    document.addEventListener('click', function (e) {
      if (open && !menu.contains(e.target) && !pill.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (open && e.key === 'Escape') { setOpen(false); pill.focus(); }
    });
    window.addEventListener('resize', function () { if (open) place(); });
    window.addEventListener('scroll', function () { if (open) place(); }, true);

    var mo = new MutationObserver(refreshUi);
    mo.observe(txt, { childList: true, characterData: true, subtree: true });
    mo.observe(pill, { attributes: true, attributeFilter: ['data-s'] });
    var pv = document.getElementById('panelVideo');
    if (pv) mo.observe(pv, { attributes: true, attributeFilter: ['class', 'hidden'] });
    ['tabImage', 'tabVideo'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.addEventListener('click', function () { setTimeout(refreshUi, 0); setTimeout(refreshUi, 200); });
    });
    refreshUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi);
  else initUi();

  window.AetixMiGan = Object.freeze({ erase: erase });
})();
