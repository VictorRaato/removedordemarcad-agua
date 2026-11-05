/* AETIX · versão 2.2, versão 1.5 (leve, PatchMatch) e versão 1.0 (OpenCV) na imagem;
   versão 1.8 (vídeo) e versão 1.0 no vídeo; seletor de versão.
   A v1.5 não usa o modelo: carrega aetix-patchmatch.js sob demanda e, em qualquer
   falha ou demora, devolve false e o site apaga com a v1.0, como antes.
   O modelo (migan_pipeline_v2.onnx) é baixado do Hugging Face (3 espelhos) e guardado no cache. */
(function () {
  'use strict';

  var CFG = {
    origin: location.origin,
    /* Mesmos 3 endereços da página de teste (index + script): tenta em ordem e, se um falhar, passa para o próximo.
       Exige o Hugging Face liberado no connect-src do vercel.json. O modelo é guardado no cache do navegador. */
    sources: [
      { url: 'https://huggingface.co/andraniksargsyan/migan/resolve/main/migan_pipeline_v2.onnx', ext: true },
      { url: 'https://huggingface.co/CardAnvilModels/MI-GAN-ONNX/resolve/main/migan_pipeline_v2.onnx', ext: true },
      { url: 'https://huggingface.co/techycoder/migan-inpainting/resolve/main/migan_pipeline_v2.onnx', ext: true }
    ],
    sha256: '',                 // opcional: SHA-256 do arquivo (minúsculas). Vazio = não confere. Vale para todos os endereços.
    minBytes: 5 * 1048576,      // proteção: uma página de erro não pode virar "modelo"
    ortVer: '1.22.0',
    cache: 'aetix-modelo-v1',
    grow: 3,                    // folga (px) em volta da área marcada
    /* VÍDEO (mais leve, sem perder qualidade): */
    bloco: 64,                  // o recorte de cada quadro é arredondado para múltiplos de 64 px -> o modelo recebe sempre o mesmo formato e não recompila a cada quadro
    pausa: 0.3,                 // WebGPU: descansa 30% do tempo de cada quadro, para a GPU atender a tela (0 = sem pausa; 0.6 = bem mais suave e mais lento)
    patchUrl: location.origin + '/js/aetix-patchmatch.js?v=20261105a',     // usado pela v1.9 (sem download de modelo); endereço absoluto para funcionar dentro do Worker
    pausaMax: 60                // teto da pausa por quadro (ms)
  };

  /* =====================================================================
     MOTOR: roda na página (imagem) e dentro do Worker do vídeo.
     Precisa ser autossuficiente: ele é copiado como texto para o Worker.
     Camadas, todas escondidas: WebGPU -> CPU (WASM) -> versão 1.0 (OpenCV).
     ===================================================================== */
  function makeEngine(g, C) {
    var BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@' + C.ortVer + '/dist/';
    var st = { broken: false, session: null, backend: '', buf: null, loading: null, flip: null };
    var inWin = typeof g.document !== 'undefined';

    async function loadScript(src) {
      if (!inWin) { g.importScripts(src); return; }
      await new Promise(function (res, rej) {
        var s = g.document.createElement('script');
        s.src = src; s.async = true;
        s.onload = function () { res(); };
        s.onerror = function () { rej(new Error('script')); };
        g.document.head.appendChild(s);
      });
    }

    async function sha(buf) {
      if (!C.sha256) return;
      var d = new Uint8Array(await g.crypto.subtle.digest('SHA-256', buf)), h = '', i;
      for (i = 0; i < d.length; i++) h += (d[i] < 16 ? '0' : '') + d[i].toString(16);
      if (h !== String(C.sha256).toLowerCase()) throw new Error('hash');
    }
    async function accept(buf) {
      if (buf.byteLength < C.minBytes) throw new Error('modelo');
      await sha(buf);
      return buf;
    }

    /* aviso no console (F12) para saber POR QUE caiu na v1.0; não altera o comportamento */
    function why(tag, e) { try { if (g.console && g.console.warn) g.console.warn('[AETIX v2]', tag, (e && e.message) ? e.message : e); } catch (x) { /* só aviso */ } }

    var progress = null;
    function setProgress(f) { progress = f; }

    /* reaproveita os vetores grandes entre quadros (menos coleta de lixo, sem mudar nenhum pixel) */
    var pool = {};
    function buf(name, len, zero) {
      if (inWin) return new Uint8Array(len);            // imagem (página): sempre vetores novos, como antes
      var b = pool[name];
      if (!b || b.length !== len) b = pool[name] = new Uint8Array(len);
      else if (zero) b.fill(0);
      return b;
    }

    /* baixa um endereço; avisa o progresso (got, total) se alguém estiver ouvindo */
    async function download(url, ext) {
      var r = await g.fetch(url, ext ? { mode: 'cors', credentials: 'omit' } : { credentials: 'same-origin' });
      if (!r.ok) throw new Error('modelo');
      if (!r.body || !r.body.getReader) return await r.arrayBuffer();
      var total = +r.headers.get('content-length') || 0, rd = r.body.getReader(), chunks = [], got = 0, x, off = 0, out, i;
      for (;;) {
        x = await rd.read();
        if (x.done) break;
        chunks.push(x.value); got += x.value.length;
        if (progress) { try { progress(got, total); } catch (e) { /* só enfeite */ } }
      }
      out = new Uint8Array(got);
      for (i = 0; i < chunks.length; i++) { out.set(chunks[i], off); off += chunks[i].length; }
      return out.buffer;
    }

    /* modelo: para cada endereço, cache do navegador primeiro; se não houver (ou estiver ruim), baixa.
       Falhou? passa para o próximo endereço. Só dá erro se todos falharem. */
    async function modelBytes() {
      var cache = null, last = null, i, s, url, hit, b;
      try { if ('caches' in g) cache = await g.caches.open(C.cache); } catch (e) { cache = null; }
      for (i = 0; i < C.sources.length; i++) {
        s = C.sources[i];
        url = s.ext ? s.url : C.origin + s.url;
        try {
          if (cache) {
            try {
              hit = await cache.match(url);
              if (hit) {
                try { return await accept(await hit.arrayBuffer()); }
                catch (e) { try { await cache.delete(url); } catch (e2) { /* segue para o download */ } }
              }
            } catch (e) { /* segue para o download */ }
          }
          b = await accept(await download(url, s.ext));
          if (cache) { try { await cache.put(url, new g.Response(b.slice(0))); } catch (e) { /* sem cache */ } }
          return b;
        } catch (e) { last = e; why('modelo falhou: ' + url, e); }
      }
      throw last || new Error('modelo');
    }

    async function makeSession(buf, order) {
      var last, i;
      for (i = 0; i < order.length; i++) {
        try {
          var s = await g.ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: [order[i]], graphOptimizationLevel: 'all' });
          return { s: s, p: order[i] };
        } catch (e) { last = e; why('sessão ' + order[i] + ' falhou', e); }
      }
      throw last || new Error('sessao');
    }

    function load() {
      if (st.session) return Promise.resolve();
      if (st.broken) return Promise.reject(new Error('indisponivel'));
      if (!st.loading) {
        st.loading = (async function () {
          var r = await Promise.all([
            g.ort ? 0 : loadScript(BASE + 'ort.all.min.js'),
            st.buf ? st.buf : modelBytes()
          ]);
          if (!g.ort) throw new Error('ort');
          g.ort.env.wasm.wasmPaths = BASE;
          g.ort.env.wasm.numThreads = 1;
          st.buf = r[1];
          var m = await makeSession(st.buf, (g.navigator && g.navigator.gpu) ? ['webgpu', 'wasm'] : ['wasm']);
          st.session = m.s; st.backend = m.p;
        })().catch(function (e) { st.broken = true; st.loading = null; why('motor indisponível, usando v1.0', e); throw e; });
      }
      return st.loading;
    }

    /* só confere se o modelo está no site e é válido (deixa guardado no cache), sem montar o motor */
    async function prepare() {
      if (st.broken) throw new Error('indisponivel');
      if (st.buf || st.session) return;
      try { await modelBytes(); } catch (e) { st.broken = true; throw e; }
    }

    function dilate(hole, W, H, r) {
      if (r <= 0) return hole;
      var tmp = buf('dt', W * H, true), out = buf('do', W * H, true), x, y, k, a, b, row;
      for (y = 0; y < H; y++) {
        row = y * W;
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

    function feedsFor(rgba, hole, W, H, flip) {
      var n = W * H, img = buf('img', 3 * n), mask = buf('mask', n), i, j;
      for (i = 0, j = 0; i < n; i++, j += 4) {
        img[i] = rgba[j]; img[n + i] = rgba[j + 1]; img[2 * n + i] = rgba[j + 2];
        mask[i] = ((hole[i] ? 1 : 0) !== (flip ? 1 : 0)) ? 0 : 255;   // 255 = manter, 0 = preencher
      }
      var names = st.session.inputNames;
      var im = names.filter(function (x) { return /img|image/i.test(x); })[0] || names[0];
      var mk = names.filter(function (x) { return /mask/i.test(x); })[0] || names[1];
      var f = {};
      f[im] = new g.ort.Tensor('uint8', img, [1, 3, H, W]);
      f[mk] = new g.ort.Tensor('uint8', mask, [1, 1, H, W]);
      return f;
    }

    async function run(feeds) {
      try { return await st.session.run(feeds); }
      catch (e) {
        if (st.backend !== 'webgpu') throw e;       // WebGPU falhou ao rodar: refaz na CPU
        var m = await makeSession(st.buf, ['wasm']);
        st.session = m.s; st.backend = m.p;
        return await st.session.run(feeds);
      }
    }

    function scaleOf(data) {
      if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) return 1;
      var mx = 0, i;
      for (i = 0; i < data.length; i += 97) if (data[i] > mx) mx = data[i];
      return mx <= 1.5 ? 255 : 1;
    }

    /* média |saída - entrada| nos pixels que deviam ficar iguais. -1 = pouca amostra para julgar */
    function drift(rgba, data, hole, W, H, sc) {
      var n = W * H, sum = 0, cnt = 0, i, o;
      for (i = 0; i < n; i += 5) {
        if (hole[i]) continue;
        o = i * 4;
        sum += Math.abs(data[i] * sc - rgba[o]) + Math.abs(data[n + i] * sc - rgba[o + 1]) + Math.abs(data[2 * n + i] * sc - rgba[o + 2]);
        cnt += 3;
      }
      return cnt < 300 ? -1 : sum / cnt;
    }

    /* média |saída - entrada| DENTRO da marca: se o modelo "obedeceu", a marca mudou; se ~0, ele deixou a marca como estava */
    function inside(rgba, data, hole, W, H, sc) {
      var n = W * H, sum = 0, cnt = 0, i, o;
      for (i = 0; i < n; i++) {
        if (!hole[i]) continue;
        o = i * 4;
        sum += Math.abs(data[i] * sc - rgba[o]) + Math.abs(data[n + i] * sc - rgba[o + 1]) + Math.abs(data[2 * n + i] * sc - rgba[o + 2]);
        cnt += 3;
      }
      return cnt ? sum / cnt : 0;
    }

    function paste(rgba, data, hole, W, H, sc) {
      var n = W * H, i, o;
      for (i = 0; i < n; i++) {
        if (!hole[i]) continue;                      // só a área marcada vem do modelo
        o = i * 4;
        rgba[o] = data[i] * sc; rgba[o + 1] = data[n + i] * sc; rgba[o + 2] = data[2 * n + i] * sc;
      }
    }

    /* img: ImageData do recorte; rawHole: 1 = apagar. Devolve true se apagou (e já alterou img). */
    async function inpaint(img, rawHole, W, H, grow) {
      try {
        await load();
        var hole = dilate(rawHole, W, H, grow);
        // Leitura certa da máscara = (1) a marca MUDA e (2) o resto fica igual. Só vale se as duas coisas acontecem.
        // Se a leitura já fixada deixar de valer, testa a outra e troca. Nenhuma valendo: a v1.0 apaga.
        var first = st.flip === null ? false : st.flip, tries = [first, !first], k, best = null;
        for (k = 0; k < 2; k++) {
          var res = await run(feedsFor(img.data, hole, W, H, tries[k]));
          var t = res[st.session.outputNames[0]], dm = (t && t.dims) || [];
          if (!t || dm.length !== 4 || dm[2] !== H || dm[3] !== W) throw new Error('saida');
          var sc = scaleOf(t.data);
          var dOut = drift(img.data, t.data, hole, W, H, sc), dIn = inside(img.data, t.data, hole, W, H, sc);
          var changed = dIn >= 0.5, clean = dOut < 0 || dOut <= 14;
          if (changed && clean) { st.flip = tries[k]; paste(img.data, t.data, hole, W, H, sc); return true; }
          if (changed && (dOut < 0 || dOut <= 45)) {
            var score = dIn - Math.max(0, dOut);
            if (!best || score > best.score) best = { score: score, t: t, sc: sc, flip: tries[k] };
          }
        }
        if (best) {                                   // nenhuma ficou limpa: usa a mais plausível
          st.flip = best.flip;
          paste(img.data, best.t.data, hole, W, H, best.sc);
          return true;
        }
        why('o modelo não alterou a marca (ou mexeu no resto); v1.0 apaga', null);
        return false;                                // nenhuma leitura fez sentido: deixa a v1.0 apagar
      } catch (e) { why('inpaint falhou; v1.0 apaga', e); return false; }
    }

    return {
      load: load,
      prepare: prepare,
      inpaint: inpaint,
      buf: buf,
      setProgress: setProgress,
      state: function () { return { broken: st.broken, ready: !!st.session, backend: st.backend }; }
    };
  }

  /* Dentro do Worker do vídeo: o código do site chama self.__aetixV18 quadro a quadro.
     Devolve true se este quadro foi apagado pela v1.8; false = o código de sempre (OpenCV) apaga. */
  function workerBoot(g, mk, C) {
    /* v1.9: PatchMatch local, sem baixar modelo. Usa o mesmo gancho que o vídeo já chama. */
    if (C && C.version === 'v19') {
      g.__aetixV18 = async function (frameCanvas, SW, SH, W, H, bb, mc) {
        try {
          if (!g.AetixPatchMatch) g.importScripts(C.patchUrl);
          if (!g.AetixPatchMatch) return false;
          var ctx = frameCanvas.getContext('2d', { willReadFrequently: true });
          var sx = SW / W, sy = SH / H;
          var x0 = Math.max(0, Math.floor(bb.x * sx)), y0 = Math.max(0, Math.floor(bb.y * sy));
          var x1 = Math.min(SW, Math.ceil((bb.x + bb.width) * sx)), y1 = Math.min(SH, Math.ceil((bb.y + bb.height) * sy));
          if (x1 - x0 < 2 || y1 - y0 < 2) return false;
          var mg = Math.max(48, Math.round(Math.max(x1 - x0, y1 - y0) * 0.5));
          var cx = Math.max(0, x0 - mg), cy = Math.max(0, y0 - mg);
          var cw = Math.min(SW, x1 + mg) - cx, ch = Math.min(SH, y1 + mg) - cy;
          var md = mc.getContext('2d', { willReadFrequently: true }).getImageData(bb.x, bb.y, bb.width, bb.height).data;
          var hole = new Uint8Array(cw * ch), X, Y, u, v;
          for (Y = 0; Y < ch; Y++) {
            v = Math.floor((cy + Y) / sy) - bb.y;
            if (v < 0 || v >= bb.height) continue;
            for (X = 0; X < cw; X++) {
              u = Math.floor((cx + X) / sx) - bb.x;
              if (u >= 0 && u < bb.width && md[(v * bb.width + u) * 4] > 127) hole[Y * cw + X] = 1;
            }
          }
          var img = ctx.getImageData(cx, cy, cw, ch);
          var out = g.AetixPatchMatch.core(img.data, hole, cw, ch, {
            maxSide: 320,
            holeBudget: 12000,
            timeLimit: 1800,
            itersCoarse: 3,
            itersMid: 2,
            itersFine: 2,
            patch: 3
          });
          if (!out) return false;
          img.data.set(out);
          ctx.putImageData(img, cx, cy);
          return true;
        } catch (e) { return false; }
      };
      return;
    }
    var eng = mk(g, C), fails = 0, off = false;
    g.__aetixV18 = async function (frameCanvas, SW, SH, W, H, bb, mc) {
      if (off) return false;
      try {
        var ctx = frameCanvas.getContext('2d', { willReadFrequently: true });
        var sx = SW / W, sy = SH / H;
        var x0 = Math.max(0, Math.floor(bb.x * sx)), y0 = Math.max(0, Math.floor(bb.y * sy));
        var x1 = Math.min(SW, Math.ceil((bb.x + bb.width) * sx)), y1 = Math.min(SH, Math.ceil((bb.y + bb.height) * sy));
        if (x1 - x0 < 2 || y1 - y0 < 2) return false;
        var mg = Math.max(64, Math.round(Math.max(x1 - x0, y1 - y0) * 0.75));
        var cx = Math.max(0, x0 - mg), cy = Math.max(0, y0 - mg);
        var cw = Math.min(SW, x1 + mg) - cx, ch = Math.min(SH, y1 + mg) - cy;
        /* formato estável: aumenta o recorte (mais contexto, nunca menos) até múltiplo de C.bloco, dentro do quadro */
        var bl = C.bloco > 1 ? C.bloco : 0;
        if (bl) {
          var cw2 = Math.min(SW, Math.ceil(cw / bl) * bl), ch2 = Math.min(SH, Math.ceil(ch / bl) * bl);
          cx = Math.max(0, Math.min(cx - ((cw2 - cw) >> 1), SW - cw2)); cy = Math.max(0, Math.min(cy - ((ch2 - ch) >> 1), SH - ch2));
          cw = cw2; ch = ch2;
        }
        var md = mc.getContext('2d', { willReadFrequently: true }).getImageData(bb.x, bb.y, bb.width, bb.height).data;
        var hole = eng.buf('hv', cw * ch, true), X, Y, u, v;
        for (Y = 0; Y < ch; Y++) {
          v = Math.floor((cy + Y) / sy) - bb.y;
          if (v < 0 || v >= bb.height) continue;
          for (X = 0; X < cw; X++) {
            u = Math.floor((cx + X) / sx) - bb.x;
            if (u < 0 || u >= bb.width) continue;
            if (md[(v * bb.width + u) * 4] > 127) hole[Y * cw + X] = 1;
          }
        }
        var img = ctx.getImageData(cx, cy, cw, ch);
        var t0 = Date.now();
        var ok = await eng.inpaint(img, hole, cw, ch, Math.max(1, Math.round(C.grow * Math.max(sx, sy))));
        if (ok) {
          ctx.putImageData(img, cx, cy); fails = 0;
          if (C.pausa > 0 && eng.state().backend === 'webgpu') {   // dá folga para a GPU desenhar a tela
            var w = Math.min(C.pausaMax, (Date.now() - t0) * C.pausa);
            if (w >= 1) await new Promise(function (r) { setTimeout(r, w); });
          }
          return true;
        }
      } catch (e) { /* cai para a v1.0 neste quadro */ }
      if (++fails >= 3) off = true;                  // 3 falhas seguidas: o resto do vídeo segue na v1.0
      return false;
    };
  }

  var eng = makeEngine(window, CFG);
  var KEY = { image: 'aetix.versao.imagem', video: 'aetix.versao.video' };
  var LABEL = {
    image: { v1: 'AETIX v1.0', v15: 'AETIX v1.5 (leve)', v2: 'AETIX v2.2' },
    video: { v1: 'AETIX v1.0', v19: 'AETIX v1.9 (rápido)', v2: 'AETIX v1.8' }
  };

  /* versão escolhida por aba (guardada só neste navegador) */
  function verValida(tab, v) {
    if (tab === 'image') return (v === 'v2' || v === 'v15') ? v : 'v1';
    if (tab === 'video') return (v === 'v2' || v === 'v19') ? v : 'v1';
  }
  function getVer(tab) {
    try { return verValida(tab, localStorage.getItem(KEY[tab])); } catch (e) { return 'v1'; }
  }
  function setVer(tab, v) {
    try { localStorage.setItem(KEY[tab], verValida(tab, v)); } catch (e) { /* sem armazenamento */ }
  }

  /* ---------- v1.5 (leve): PatchMatch carregado sob demanda ---------- */
  var leveUrl = '/js/aetix-patchmatch.js?v=20261105a', leveLoad = null;
  function carregarLeve() {
    if (window.AetixPatchMatch && typeof window.AetixPatchMatch.inpaint === 'function') return Promise.resolve(true);
    if (leveLoad) return leveLoad;
    leveLoad = new Promise(function (res) {
      var fim = false;
      function done() {
        if (fim) return;
        fim = true;
        res(!!(window.AetixPatchMatch && typeof window.AetixPatchMatch.inpaint === 'function'));
      }
      var s = document.createElement('script');
      s.src = leveUrl; s.async = true;
      s.onload = done; s.onerror = done;
      document.head.appendChild(s);
      setTimeout(done, 12000);                    // não deixa a escolha pendurada
    }).then(function (ok) { if (!ok) leveLoad = null; return ok; });
    return leveLoad;
  }

  /* ---------- imagem: devolve Promise<boolean> (true = apagou com a versão escolhida) ---------- */
  async function eraseLeve(ctx, W, H, mask) {
    try {
      if (!ctx || !mask || mask.length !== W * H) return false;
      var ok = await carregarLeve();
      var api = window.AetixPatchMatch;
      if (!ok || !api || typeof api.inpaint !== 'function') return false;
      var x0 = W, y0 = H, x1 = -1, y1 = -1, x, y, row;
      for (y = 0; y < H; y++) {
        row = y * W;
        for (x = 0; x < W; x++) {
          if (mask[row + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
        }
      }
      if (x1 < 0) return false;
      /* contexto em volta: mantém o recorte perto de 640 px para não perder resolução */
      var mg = Math.max(32, Math.round(Math.max(x1 - x0 + 1, y1 - y0 + 1) * 0.5));
      var cx = Math.max(0, x0 - mg), cy = Math.max(0, y0 - mg);
      var cw = Math.min(W, x1 + 1 + mg) - cx, ch = Math.min(H, y1 + 1 + mg) - cy;
      if (cw < 8 || ch < 8) return false;
      var hole = new Uint8Array(cw * ch);
      for (y = 0; y < ch; y++) for (x = 0; x < cw; x++) hole[y * cw + x] = mask[(cy + y) * W + cx + x] ? 1 : 0;
      var img = ctx.getImageData(cx, cy, cw, ch);
      var saida = await api.inpaint(img.data, hole, cw, ch, {
        maxSide: 640, timeLimit: 6000, seed: 12345, grow: 0, grain: false
      });
      if (!saida || saida.length !== img.data.length) return false;   // falhou/estourou: v1.0 apaga
      img.data.set(saida);                                          // fora do buraco vem idêntico
      ctx.putImageData(img, cx, cy);
      return true;
    } catch (e) { return false; }
  }

  async function erase(kind, ctx, W, H, mask) {
    try {
      if (kind !== 'image') return false;
      var ver = getVer('image');
      if (ver === 'v15') return await eraseLeve(ctx, W, H, mask);
      if (ver !== 'v2' || eng.state().broken) return false;
      if (!ctx || !mask || mask.length !== W * H) return false;
      var x0 = W, y0 = H, x1 = -1, y1 = -1, x, y, row;
      for (y = 0; y < H; y++) {
        row = y * W;
        for (x = 0; x < W; x++) {
          if (mask[row + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
        }
      }
      if (x1 < 0) return false;
      var mg = Math.max(64, Math.round(Math.max(x1 - x0 + 1, y1 - y0 + 1) * 0.75));
      var cx = Math.max(0, x0 - mg), cy = Math.max(0, y0 - mg);
      var cw = Math.min(W, x1 + 1 + mg) - cx, ch = Math.min(H, y1 + 1 + mg) - cy;
      var hole = new Uint8Array(cw * ch);
      for (y = 0; y < ch; y++) for (x = 0; x < cw; x++) hole[y * cw + x] = mask[(cy + y) * W + cx + x] ? 1 : 0;
      var img = ctx.getImageData(cx, cy, cw, ch);
      var ok = await eng.inpaint(img, hole, cw, ch, CFG.grow);
      if (ok) ctx.putImageData(img, cx, cy);          // só grava no fim: se algo falhar antes, nada muda
      return ok;
    } catch (e) { return false; }
    finally { refreshUi(); }
  }

  /* ---------- vídeo: endereço do código que o Worker carrega (ou null = v1.0 de sempre) ---------- */
  var wUrls = {};
  function videoJob() {
    try {
      var ver = getVer('video');
      if (ver !== 'v2' && ver !== 'v19') return null;
      if (ver === 'v2' && eng.state().broken) return null;
      if (!wUrls[ver]) {
        var cfg = Object.assign({}, CFG, { version: ver });
        var src = 'var __mk=' + makeEngine.toString() + ';(' + workerBoot.toString() + ')(self,__mk,' + JSON.stringify(cfg) + ');';
        wUrls[ver] = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      }
      return wUrls[ver];
    } catch (e) { return null; }
  }

  /* ---------- seletor de versão na pílula de status ---------- */
  var pill = null, txt = null, menu = null, open = false, pend = null, menuSig = '';
  function isPt() { return /^pt/i.test(document.documentElement.lang || 'pt'); }
  function curTab() {
    var pv = document.getElementById('panelVideo');
    return (pv && !pv.hidden && !pv.classList.contains('hidden')) ? 'video' : 'image';
  }
  function versoes(tab) {
    return tab === 'image' ? ['v15', 'v2', 'v1'] : ['v19', 'v2', 'v1'];
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
    var mw = menu.offsetWidth || 150;
    var left = Math.round(r.left + r.width / 2 - mw / 2);
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    if (vw) {                                    /* não deixa o menu vazar da tela (celular) */
      if (left < 6) left = 6;
      if (left > vw - mw - 6) left = vw - mw - 6;
      if (left < 6) left = 6;
    }
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.left = left + 'px';
  }
  function setOpen(v) {
    open = !!v && !!menu;
    if (menu) menu.hidden = !open;
    if (pill) pill.setAttribute('aria-expanded', String(open));
    if (open) place();
  }

  function refreshUi() {
    if (!pill || !txt) return;
    if (pill.dataset.s !== 'ok') {                     // ainda carregando (ou erro): a pílula fica como o site mostra
      pill.classList.remove('aetix-ver');
      pill.removeAttribute('tabindex'); pill.removeAttribute('aria-haspopup'); pill.removeAttribute('aria-expanded');
      setOpen(false);
      return;
    }
    var tab = curTab(), bad = eng.state().broken;
    /* modelo indisponível: só a v2.2 volta para a v1.0 (a v1.5 não usa o modelo) */
    if (bad) {
      if (getVer('image') === 'v2') setVer('image', 'v1');
      if (getVer('video') === 'v2') setVer('video', 'v1');
    }
    var ver = getVer(tab), loading = !!pend && pend.tab === tab;
    var alvo = loading && pend.ver ? pend.ver : ver;
    var want = LABEL[tab][alvo] + (loading ? (isPt() ? ' · carregando…' : ' · loading…') : '');
    if (txt.textContent !== want) txt.textContent = want;
    pill.classList.add('aetix-ver');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-haspopup', 'listbox');
    pill.setAttribute('aria-expanded', String(open));
    var sig = tab + '|' + ver + '|' + bad + '|' + (isPt() ? 'pt' : 'en');
    if (menu && sig !== menuSig) { menuSig = sig; montarMenu(tab, ver, bad); }
    if (open) place();
  }

  /* lista só as versões inativas (a atual não aparece) */
  function montarMenu(tab, ver, bad) {
    while (menu.firstChild) menu.removeChild(menu.firstChild);
    var lista = versoes(tab).filter(function (v) { return v !== ver; });
    for (var i = 0; i < lista.length; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'option'); b.dataset.v = lista[i];
      b.textContent = LABEL[tab][lista[i]] + ((lista[i] === 'v2' && bad) ? (isPt() ? ' · indisponível' : ' · unavailable') : '');
      b.disabled = (lista[i] === 'v2' && bad);
      menu.appendChild(b);
    }
  }

  async function choose(v) {
    var tab = curTab();
    setOpen(false);
    if (v === 'v15') {                                 // imagem: PatchMatch sob demanda (não usa o modelo)
      if (tab !== 'image') return;
      var minha15 = pend = { tab: tab, ver: 'v15' };
      refreshUi();
      var okLeve = false;
      try { okLeve = await carregarLeve(); } catch (e) { okLeve = false; }
      if (pend === minha15 && okLeve) setVer(tab, 'v15');
      if (pend === minha15) pend = null;
      refreshUi();
      return;
    }
    if (v === 'v19') {                                 // vídeo: PatchMatch local, sem modelo
      if (tab !== 'video') return;
      pend = null;
      setVer(tab, 'v19');
      refreshUi();
      return;
    }
    if (v !== 'v2') { pend = null; setVer(tab, 'v1'); refreshUi(); return; }
    var minha2 = pend = { tab: tab, ver: 'v2' };
    refreshUi();
    try {
      await (tab === 'image' ? eng.load() : eng.prepare());   // imagem monta o motor; vídeo só confere o modelo
      if (pend === minha2) setVer(tab, 'v2');
    } catch (e) { /* a pílula passa a mostrar "indisponível" */ }
    if (pend === minha2) pend = null;
    refreshUi();
  }

  function initUi() {
    pill = document.getElementById('engine');
    txt = document.getElementById('engineText');
    if (!pill || !txt) return;
    injectCss();

    menu = document.createElement('div');
    menu.className = 'aetix-ver-menu'; menu.hidden = true; menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);

    menu.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('button[data-v]') : null;
      if (b && !b.disabled) choose(b.dataset.v);
    });
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

    // quem já escolheu a versão nova antes: deixa o modelo (ou a v1.5) pronto sem atrapalhar o carregamento da página
    var vi = getVer('image');
    var pre = vi === 'v2' ? eng.load : (vi === 'v15' ? carregarLeve : (getVer('video') === 'v2' ? eng.prepare : null));
    if (pre) setTimeout(function () { pre().catch(function () { /* indisponível */ }).then(refreshUi); }, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUi);
  else initUi();

  window.AetixMiGan = Object.freeze({ erase: erase, videoJob: videoJob });
})();
