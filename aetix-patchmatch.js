/* AETIX · v1.5 (leve) — preenchimento por PatchMatch, 100% no navegador.
   Arquivo novo e isolado: NÃO substitui a v1.0 (OpenCV) e NÃO mexe no MI-GAN.
   Expõe window.AetixPatchMatch = { inpaint(rgba, hole, W, H, opts) -> Promise<Uint8ClampedArray|null> }.
   A conta pesada roda num Web Worker criado por Blob (worker-src blob: na CSP).
   O núcleo pmCore é autossuficiente: é copiado como texto para o Worker e também
   pode ser importado no Node (module.exports) para os testes. */
(function (G) {
  'use strict';

  /* =====================================================================
     NÚCLEO PURO — roda no Worker e no Node. Nada fora desta função.
     rgba: Uint8ClampedArray (W*H*4) | hole: Uint8Array (W*H, !=0 = apagar)
     Devolve um novo Uint8ClampedArray com o buraco preenchido; pixels fora
     do buraco (dilatado por opts.grow) ficam idênticos à entrada.
     null = falhou/estourou o tempo (o chamador cai no OpenCV).
     ===================================================================== */
  function pmCore(rgba, holeIn, W, H, opts) {
    opts = opts || {};
    var patch = opts.patch ? Math.round(opts.patch) : 5;
    if (patch < 3) patch = 3;
    if ((patch & 1) === 0) patch++;
    var rad = (patch - 1) >> 1;
    var maxSide = opts.maxSide || 640;
    var timeLimit = opts.timeLimit == null ? 6000 : opts.timeLimit;
    var seed = (opts.seed == null ? 12345 : opts.seed) >>> 0;
    var grow = opts.grow == null ? 0 : opts.grow | 0;
    if (grow < 0) grow = 0;
    var grain = !!opts.grain;
    var itersC = opts.itersCoarse || 5;
    var itersM = opts.itersMid || 4;
    var itersF = opts.itersFine || 3;
    var sigma = opts.sigma || 12;
    /* peso dos pixels ainda estimados no casamento: pequeno, só para desempatar.
       Peso alto trava o borrão inicial; peso zero faz o miolo aceitar qualquer fonte. */
    var wEst = opts.wEst == null ? 0.08 : opts.wEst;
    var now = function () { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); };
    var t0 = now();
    var timeUp = function () { return (now() - t0) > timeLimit; };

    if (!rgba || !holeIn || !W || !H) return null;
    if (rgba.length !== W * H * 4 || holeIn.length !== W * H) return null;

    var N = W * H, i, x, y, p;

    /* ---------- máscara: engorda em grow (separável) ---------- */
    var hole = new Uint8Array(N);
    if (grow > 0) {
      var tmp = new Uint8Array(N), a, b, k;
      for (y = 0; y < H; y++) {
        var row0 = y * W;
        for (x = 0; x < W; x++) {
          if (holeIn[row0 + x]) {
            a = x - grow < 0 ? 0 : x - grow;
            b = x + grow > W - 1 ? W - 1 : x + grow;
            for (k = a; k <= b; k++) tmp[row0 + k] = 1;
          }
        }
      }
      for (x = 0; x < W; x++) {
        for (y = 0; y < H; y++) {
          if (tmp[y * W + x]) {
            a = y - grow < 0 ? 0 : y - grow;
            b = y + grow > H - 1 ? H - 1 : y + grow;
            for (k = a; k <= b; k++) hole[k * W + x] = 1;
          }
        }
      }
    } else {
      hole.set(holeIn);
    }

    var anyHole = 0;
    for (i = 0; i < N; i++) if (hole[i]) { anyHole = 1; break; }
    if (!anyHole) return new Uint8ClampedArray(rgba);

    /* ---------- reduz o lado maior para no máximo maxSide ---------- */
    var sw = W, sh = H, scaled = false;
    if (W > maxSide || H > maxSide) {
      var sc = maxSide / (W > H ? W : H);
      sw = Math.round(W * sc); sh = Math.round(H * sc);
      if (sw < 16) sw = 16;
      if (sh < 16) sh = 16;
      scaled = (sw !== W || sh !== H);
    }

    var baseImg, baseHole;
    if (!scaled) {
      baseImg = new Float32Array(N * 3);
      for (i = 0, x = 0; i < N; i++, x += 4) {
        baseImg[i * 3] = rgba[x];
        baseImg[i * 3 + 1] = rgba[x + 1];
        baseImg[i * 3 + 2] = rgba[x + 2];
      }
      baseHole = hole;
    } else {
      baseImg = new Float32Array(sw * sh * 3);
      baseHole = new Uint8Array(sw * sh);
      for (y = 0; y < sh; y++) {
        var sy0 = Math.floor(y * H / sh), sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * H / sh));
        if (sy1 > H) sy1 = H;
        for (x = 0; x < sw; x++) {
          var sx0 = Math.floor(x * W / sw), sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * W / sw));
          if (sx1 > W) sx1 = W;
          var r = 0, g = 0, b2 = 0, cnt = 0, hb = 0, sy, sx, q, pp;
          for (sy = sy0; sy < sy1; sy++) {
            for (sx = sx0; sx < sx1; sx++) {
              pp = sy * W + sx;
              if (hole[pp]) { hb = 1; continue; }
              q = pp * 4;
              r += rgba[q]; g += rgba[q + 1]; b2 += rgba[q + 2]; cnt++;
            }
          }
          var dp = y * sw + x;
          baseHole[dp] = hb;
          if (cnt) { baseImg[dp * 3] = r / cnt; baseImg[dp * 3 + 1] = g / cnt; baseImg[dp * 3 + 2] = b2 / cnt; }
        }
      }
    }

    /* ---------- gerador determinístico (mulberry32) ---------- */
    var rs = seed >>> 0;
    function rnd() {
      rs |= 0; rs = (rs + 0x6D2B79F5) | 0;
      var t = Math.imul(rs ^ (rs >>> 15), 1 | rs);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /* ---------- nível: SAT do buraco, lista de fontes válidas, NNF ---------- */
    function makeLevel(w, h, img, hm) {
      var w1 = w + 1, sat = new Int32Array(w1 * (h + 1)), xx, yy, pp;
      for (yy = 0; yy < h; yy++) {
        var acc = 0;
        for (xx = 0; xx < w; xx++) {
          acc += hm[yy * w + xx];
          sat[(yy + 1) * w1 + (xx + 1)] = sat[yy * w1 + (xx + 1)] + acc;
        }
      }
      var L = { w: w, h: h, img: img, hole: hm, sat: sat, wEst: wEst };
      var src = [], x0, y0, x1, y1, cnt;
      for (yy = 0; yy < h; yy++) {
        y0 = yy - rad; y1 = yy + rad + 1;
        if (y0 < 0 || y1 > h) continue;
        for (xx = 0; xx < w; xx++) {
          x0 = xx - rad; x1 = xx + rad + 1;
          if (x0 < 0 || x1 > w) continue;
          cnt = sat[y1 * w1 + x1] - sat[y0 * w1 + x1] - sat[y1 * w1 + x0] + sat[y0 * w1 + x0];
          if (cnt === 0) src.push(yy * w + xx);
        }
      }
      L.src = new Int32Array(src);
      L.srcN = src.length;
      L.nnx = new Int32Array(w * h);
      L.nny = new Int32Array(w * h);
      L.dist = new Float32Array(w * h);
      for (pp = 0; pp < w * h; pp++) { L.nnx[pp] = -1; L.dist[pp] = Infinity; }
      return L;
    }

    function validSrc(L, sx, sy) {
      if (sx < rad || sy < rad || sx >= L.w - rad || sy >= L.h - rad) return false;
      var w1 = L.w + 1, x0 = sx - rad, y0 = sy - rad, x1 = sx + rad + 1, y1 = sy + rad + 1;
      return (L.sat[y1 * w1 + x1] - L.sat[y0 * w1 + x1] - L.sat[y1 * w1 + x0] + L.sat[y0 * w1 + x0]) === 0;
    }

    function patchDist(L, tx, ty, sx, sy) {
      var img = L.img, w = L.w, h = L.h, d = 0, th = L.hole, we = L.wEst;
      var sy0 = sy - rad, sx0 = sx - rad;
      var y0 = ty - rad, y1 = ty + rad, x0 = tx - rad, x1 = tx + rad;
      var dy, dx, tp, a, b, dr, dg, db, wt;
      for (dy = y0; dy <= y1; dy++) {
        if (dy < 0 || dy >= h) continue;
        var trow = dy * w, srow = (sy0 + (dy - y0)) * w;
        for (dx = x0; dx <= x1; dx++) {
          if (dx < 0 || dx >= w) continue;
          tp = trow + dx;
          a = tp * 3;
          b = (srow + sx0 + (dx - x0)) * 3;
          dr = img[a] - img[b]; dg = img[a + 1] - img[b + 1]; db = img[a + 2] - img[b + 2];
          /* pixels conhecidos mandam; estimados pesam menos para não travar o borrão */
          wt = th[tp] ? we : 1;
          d += wt * (dr * dr + dg * dg + db * db);
        }
      }
      return d;
    }

    function initNnf(L) {
      var hm = L.hole, w = L.w, h = L.h, nnx = L.nnx, nny = L.nny, dist = L.dist, src = L.src, srcN = L.srcN;
      if (!srcN) return false;
      for (var q = 0; q < w * h; q++) {
        if (!hm[q]) continue;
        var sp = src[(rnd() * srcN) | 0];
        var sx = sp % w, sy = (sp / w) | 0;
        nnx[q] = sx; nny[q] = sy;
        dist[q] = patchDist(L, q % w, (q / w) | 0, sx, sy);
      }
      return true;
    }

    function tryCand(L, q, xq, yq, sx, sy) {
      if (sx < rad || sy < rad || sx >= L.w - rad || sy >= L.h - rad) return 0;
      if (!validSrc(L, sx, sy)) return 0;
      var d = patchDist(L, xq, yq, sx, sy);
      if (d < L.dist[q]) { L.dist[q] = d; L.nnx[q] = sx; L.nny[q] = sy; return 1; }
      return 0;
    }

    function searchPass(L, backward) {
      var hm = L.hole, w = L.w, h = L.h, nnx = L.nnx, nny = L.nny, ntot = w * h;
      var xq, yq, q, q2, rmax = (w > h ? w : h), r, count = 0, step, ganhos = 0;
      if (rmax > 128) rmax = 128;   /* a propagação em salto cobre o resto */
      var ys = backward ? h - 2 : 1, ye = backward ? 0 : h - 1, st = backward ? -1 : 1;
      var xs = backward ? w - 2 : 1, xe = backward ? 0 : w - 1, sxs = backward ? -1 : 1;
      for (yq = ys; backward ? yq >= ye : yq <= ye; yq += st) {
        var row = yq * w;
        for (xq = xs; backward ? xq >= xe : xq <= xe; xq += sxs) {
          q = row + xq;
          if (!hm[q]) continue;
          /* propagação normal (1 px) */
          q2 = q - sxs;
          if (nnx[q2] >= 0) ganhos += tryCand(L, q, xq, yq, nnx[q2] + sxs, nny[q2]);
          q2 = q - st * w;
          if (nnx[q2] >= 0) ganhos += tryCand(L, q, xq, yq, nnx[q2], nny[q2] + st);
          /* propagação em salto: alcança o miolo do buraco em poucas passadas */
          for (step = 2; step < rmax; step <<= 1) {
            q2 = q - step * sxs;
            if (q2 >= row && nnx[q2] >= 0) ganhos += tryCand(L, q, xq, yq, nnx[q2] + step * sxs, nny[q2]);
            q2 = q - step * st * w;
            if (q2 >= 0 && q2 < ntot && nnx[q2] >= 0) ganhos += tryCand(L, q, xq, yq, nnx[q2], nny[q2] + step * st);
          }
          /* busca aleatória */
          r = rmax;
          while (r >= 1) {
            ganhos += tryCand(L, q, xq, yq, nnx[q] + (((rnd() * 2 - 1) * r) | 0), nny[q] + (((rnd() * 2 - 1) * r) | 0));
            r >>= 1;
          }
          if (((++count) & 4095) === 0 && timeUp()) return -1;
        }
      }
      return ganhos;
    }

    function vote(L) {
      var w = L.w, h = L.h, hm = L.hole, img = L.img, nnx = L.nnx, nny = L.nny, dist = L.dist;
      var n = w * h;
      var accR = new Float32Array(n), accG = new Float32Array(n), accB = new Float32Array(n), wsum = new Float32Array(n);
      var q, xq, yq, sx, sy, dy, dx, tx, ty, tp, sp, wt, mse, s2 = 2 * sigma * sigma, count = 0;
      for (q = 0; q < n; q++) {
        if (!hm[q] || nnx[q] < 0) continue;
        xq = q % w; yq = (q / w) | 0; sx = nnx[q]; sy = nny[q];
        mse = dist[q] / (3 * patch * patch);
        wt = Math.exp(-mse / s2) + 1e-6;
        for (dy = -rad; dy <= rad; dy++) {
          ty = yq + dy;
          if (ty < 0 || ty >= h) continue;
          for (dx = -rad; dx <= rad; dx++) {
            tx = xq + dx;
            if (tx < 0 || tx >= w) continue;
            tp = ty * w + tx;
            if (!hm[tp]) continue;
            sp = (sy + dy) * w + (sx + dx);
            accR[tp] += wt * img[sp * 3];
            accG[tp] += wt * img[sp * 3 + 1];
            accB[tp] += wt * img[sp * 3 + 2];
            wsum[tp] += wt;
          }
        }
        if (((++count) & 2047) === 0 && timeUp()) return false;
      }
      for (q = 0; q < n; q++) {
        if (!hm[q] || wsum[q] <= 0) continue;
        img[q * 3] = accR[q] / wsum[q];
        img[q * 3 + 1] = accG[q] / wsum[q];
        img[q * 3 + 2] = accB[q] / wsum[q];
      }
      return true;
    }

    /* ---------- pirâmide (do fino para o grosso) ---------- */
    var levels = [makeLevel(sw, sh, baseImg, baseHole)];
    /* sem um único patch 5x5 inteiro fora do buraco não há o que casar */
    if (!levels[0].srcN) return null;
    while (levels.length <= 8) {
      var L0 = levels[levels.length - 1];
      if (L0.w <= patch * 4 || L0.h <= patch * 4) break;
      var hw = (L0.w + 1) >> 1, hh = (L0.h + 1) >> 1;
      var himg = new Float32Array(hw * hh * 3), hhole = new Uint8Array(hw * hh);
      for (y = 0; y < hh; y++) {
        for (x = 0; x < hw; x++) {
          var r3 = 0, g3 = 0, b3 = 0, cc = 0, hh2 = 0, sy2, sx2, pp2, qq;
          for (sy2 = y * 2; sy2 < y * 2 + 2 && sy2 < L0.h; sy2++) {
            for (sx2 = x * 2; sx2 < x * 2 + 2 && sx2 < L0.w; sx2++) {
              pp2 = sy2 * L0.w + sx2;
              if (L0.hole[pp2]) { hh2 = 1; continue; }
              qq = pp2 * 3;
              r3 += L0.img[qq]; g3 += L0.img[qq + 1]; b3 += L0.img[qq + 2]; cc++;
            }
          }
          var dp2 = y * hw + x;
          hhole[dp2] = hh2;
          if (cc) { himg[dp2 * 3] = r3 / cc; himg[dp2 * 3 + 1] = g3 / cc; himg[dp2 * 3 + 2] = b3 / cc; }
        }
      }
      var nivelGrosso = makeLevel(hw, hh, himg, hhole);
      /* buraco grande pode não deixar nenhum patch válido no nível grosso:
         para a pirâmide aqui e começa no nível anterior (melhor que falhar) */
      if (!nivelGrosso.srcN) break;
      levels.push(nivelGrosso);
    }

    /* ---------- inicialização do nível mais grosso (difusão) ---------- */
    (function seedCoarse(L) {
      var w = L.w, h = L.h, hm = L.hole, img = L.img, q, xx, yy, it, k;
      var mr = 0, mg = 0, mb = 0, c = 0;
      for (q = 0; q < w * h; q++) if (!hm[q]) { mr += img[q * 3]; mg += img[q * 3 + 1]; mb += img[q * 3 + 2]; c++; }
      if (!c) return;
      mr /= c; mg /= c; mb /= c;
      for (q = 0; q < w * h; q++) if (hm[q]) { img[q * 3] = mr; img[q * 3 + 1] = mg; img[q * 3 + 2] = mb; }
      for (it = 0; it < 80; it++) {
        for (yy = 0; yy < h; yy++) {
          for (xx = 0; xx < w; xx++) {
            q = yy * w + xx;
            if (!hm[q]) continue;
            var sr = 0, sg = 0, sb = 0, cn = 0;
            for (k = 0; k < 8; k++) {
              var nx = xx + (k === 0 ? -1 : k === 1 ? 0 : k === 2 ? 1 : k === 3 ? -1 : k === 4 ? 1 : k === 5 ? -1 : k === 6 ? 0 : 1);
              var ny = yy + (k === 0 ? -1 : k === 1 ? -1 : k === 2 ? -1 : k === 3 ? 0 : k === 4 ? 0 : k === 5 ? 1 : k === 6 ? 1 : 1);
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              var z = (ny * w + nx) * 3;
              sr += img[z]; sg += img[z + 1]; sb += img[z + 2]; cn++;
            }
            if (cn) { img[q * 3] = sr / cn; img[q * 3 + 1] = sg / cn; img[q * 3 + 2] = sb / cn; }
          }
        }
      }
    })(levels[levels.length - 1]);

    /* ---------- de grosso para fino ---------- */
    var li, L, iter, total;
    for (li = levels.length - 1; li >= 0; li--) {
      L = levels[li];
      if (li === levels.length - 1) {
        if (!initNnf(L)) return null;
      }
      total = li === levels.length - 1 ? itersC : (li === 0 ? itersF : itersM);
      var nHole = 0, limiteGanho, g1, g2;
      for (q = 0; q < L.w * L.h; q++) if (L.hole[q]) nHole++;
      limiteGanho = Math.max(8, (nHole * 0.004) | 0);
      for (iter = 0; iter < total; iter++) {
        g1 = searchPass(L, false); if (g1 < 0) return null;
        g2 = searchPass(L, true); if (g2 < 0) return null;
        if (!vote(L)) return null;
        /* convergiu: as buscas quase não mudaram mais nada */
        if (iter >= 1 && (g1 + g2) < limiteGanho) break;
      }
      if (li > 0) {
        var F = levels[li - 1], C = L;
        var wf = F.w, hf = F.h, hmf = F.hole, imgf = F.img, nnxf = F.nnx, nnyf = F.nny, distf = F.dist;
        var srcf = F.src, srcNf = F.srcN, qf, fx, fy;
        /* 1ª passada: cores do nível fino (bilinear do grosso) */
        for (qf = 0; qf < wf * hf; qf++) {
          if (!hmf[qf]) continue;
          fx = qf % wf; fy = (qf / wf) | 0;
          var gx = (fx + 0.5) / 2 - 0.5, gy = (fy + 0.5) / 2 - 0.5;
          var ix = Math.floor(gx), iy = Math.floor(gy), tx = gx - ix, ty = gy - iy;
          if (ix < 0) { ix = 0; tx = 0; }
          if (iy < 0) { iy = 0; ty = 0; }
          if (ix > C.w - 2) { ix = C.w - 2; tx = 1; }
          if (iy > C.h - 2) { iy = C.h - 2; ty = 1; }
          for (var ch = 0; ch < 3; ch++) {
            var v00 = C.img[(iy * C.w + ix) * 3 + ch], v10 = C.img[(iy * C.w + ix + 1) * 3 + ch];
            var v01 = C.img[((iy + 1) * C.w + ix) * 3 + ch], v11 = C.img[((iy + 1) * C.w + ix + 1) * 3 + ch];
            imgf[qf * 3 + ch] = (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty;
          }
        }
        /* 2ª passada: NNF herdado e validado (cores já preenchidas) */
        for (qf = 0; qf < wf * hf; qf++) {
          if (!hmf[qf]) continue;
          fx = qf % wf; fy = (qf / wf) | 0;
          var cp = (((fy / 2) | 0) * C.w + ((fx / 2) | 0));
          var sx4 = C.nnx[cp] >= 0 ? (C.nnx[cp] * 2) : -1;
          var sy4 = C.nny[cp] >= 0 ? (C.nny[cp] * 2) : -1;
          var tries = 0, sp4;
          while ((sx4 < rad || sy4 < rad || sx4 >= wf - rad || sy4 >= hf - rad || !validSrc(F, sx4, sy4)) && tries < 24) {
            sp4 = srcf[(rnd() * srcNf) | 0];
            sx4 = sp4 % wf; sy4 = (sp4 / wf) | 0;
            tries++;
          }
          if (sx4 < rad || sy4 < rad || sx4 >= wf - rad || sy4 >= hf - rad || !validSrc(F, sx4, sy4)) {
            sp4 = srcf[(rnd() * srcNf) | 0]; sx4 = sp4 % wf; sy4 = (sp4 / wf) | 0;
          }
          nnxf[qf] = sx4; nnyf[qf] = sy4;
          distf[qf] = patchDist(F, fx, fy, sx4, sy4);
        }
      }
      if (timeUp()) return null;
    }

    /* ---------- resultado no tamanho de trabalho ---------- */
    var workImg = levels[0].img, ww = levels[0].w, wh = levels[0].h;
    var out = new Uint8ClampedArray(rgba);               /* cópia: fora fica idêntico */
    var fill = new Float32Array(N * 3);

    if (!scaled) {
      for (q = 0; q < N; q++) {
        fill[q * 3] = workImg[q * 3]; fill[q * 3 + 1] = workImg[q * 3 + 1]; fill[q * 3 + 2] = workImg[q * 3 + 2];
      }
    } else {
      for (y = 0; y < H; y++) {
        var gy2 = (y + 0.5) * wh / H - 0.5, iy2 = Math.floor(gy2), ty2 = gy2 - iy2;
        if (iy2 < 0) { iy2 = 0; ty2 = 0; }
        if (iy2 > wh - 2) { iy2 = wh - 2; ty2 = 1; }
        for (x = 0; x < W; x++) {
          var gx2 = (x + 0.5) * ww / W - 0.5, ix2 = Math.floor(gx2), tx2 = gx2 - ix2;
          if (ix2 < 0) { ix2 = 0; tx2 = 0; }
          if (ix2 > ww - 2) { ix2 = ww - 2; tx2 = 1; }
          q = y * W + x;
          for (var ch2 = 0; ch2 < 3; ch2++) {
            var a00 = workImg[(iy2 * ww + ix2) * 3 + ch2], a10 = workImg[(iy2 * ww + ix2 + 1) * 3 + ch2];
            var a01 = workImg[((iy2 + 1) * ww + ix2) * 3 + ch2], a11 = workImg[((iy2 + 1) * ww + ix2 + 1) * 3 + ch2];
            fill[q * 3 + ch2] = (a00 * (1 - tx2) + a10 * tx2) * (1 - ty2) + (a01 * (1 - tx2) + a11 * tx2) * ty2;
          }
        }
      }
    }

    /* ---------- emenda: degradê de 2 px com a borda conhecida ---------- */
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        q = y * W + x;
        if (!hole[q]) continue;
        var sr2 = 0, sg2 = 0, sb2 = 0, c8 = 0, c4 = 0, kx, ky, nx2, ny2, z2;
        for (ky = -1; ky <= 1; ky++) {
          for (kx = -1; kx <= 1; kx++) {
            if (!kx && !ky) continue;
            nx2 = x + kx; ny2 = y + ky;
            if (nx2 < 0 || ny2 < 0 || nx2 >= W || ny2 >= H) continue;
            z2 = ny2 * W + nx2;
            if (hole[z2]) continue;
            sr2 += rgba[z2 * 4]; sg2 += rgba[z2 * 4 + 1]; sb2 += rgba[z2 * 4 + 2];
            c8++;
            if (!kx || !ky) c4++;
          }
        }
        var al = c4 ? 0.5 : (c8 ? 0.22 : 0);
        if (al) {
          fill[q * 3] = fill[q * 3] * (1 - al) + (sr2 / c8) * al;
          fill[q * 3 + 1] = fill[q * 3 + 1] * (1 - al) + (sg2 / c8) * al;
          fill[q * 3 + 2] = fill[q * 3 + 2] * (1 - al) + (sb2 / c8) * al;
        }
      }
    }

    /* ---------- granulação opcional (desligada por padrão) ---------- */
    if (grain) {
      var dr2 = 0, dg2 = 0, db2 = 0, nd = 0;
      for (q = 0; q < N; q++) {
        if (hole[q]) continue;
        var hasHole = 0, kk, nxx, nyy;
        x = q % W; y = (q / W) | 0;
        for (kk = -2; kk <= 2 && !hasHole; kk++) {
          for (nxx = -2; nxx <= 2; nxx++) {
            nyy = y + kk;
            if (nxx + x < 0 || nxx + x >= W || nyy < 0 || nyy >= H) continue;
            if (hole[nyy * W + x + nxx]) { hasHole = 1; break; }
          }
        }
        if (!hasHole) continue;
        dr2 += rgba[q * 4]; dg2 += rgba[q * 4 + 1]; db2 += rgba[q * 4 + 2]; nd++;
      }
      if (nd > 32) {
        var ar2 = dr2 / nd, ag2 = dg2 / nd, ab2 = db2 / nd;
        var vr = 0, vg = 0, vb = 0;
        for (q = 0; q < N; q++) {
          if (hole[q]) continue;
          x = q % W; y = (q / W) | 0;
          if (x < 4 || x >= W - 4 || y < 4 || y >= H - 4) continue;
          vr += (rgba[q * 4] - ar2) * (rgba[q * 4] - ar2);
          vg += (rgba[q * 4 + 1] - ag2) * (rgba[q * 4 + 1] - ag2);
          vb += (rgba[q * 4 + 2] - ab2) * (rgba[q * 4 + 2] - ab2);
        }
        var gr = Math.sqrt(vr / nd) * 0.35, gg = Math.sqrt(vg / nd) * 0.35, gb = Math.sqrt(vb / nd) * 0.35;
        for (q = 0; q < N; q++) {
          if (!hole[q]) continue;
          fill[q * 3] += (rnd() * 2 - 1) * gr;
          fill[q * 3 + 1] += (rnd() * 2 - 1) * gg;
          fill[q * 3 + 2] += (rnd() * 2 - 1) * gb;
        }
      }
    }

    /* ---------- compõe só o buraco ---------- */
    for (q = 0; q < N; q++) {
      if (!hole[q]) continue;
      var o4 = q * 4;
      out[o4] = fill[q * 3];
      out[o4 + 1] = fill[q * 3 + 1];
      out[o4 + 2] = fill[q * 3 + 2];
      /* alfa da entrada é preservado */
    }
    return out;
  }

  /* =====================================================================
     WORKER — recebe buffers transferidos e devolve o resultado
     ===================================================================== */
  function pmWorker(self, core) {
    self.onmessage = function (e) {
      var m = e.data || {};
      try {
        var out = core(new Uint8ClampedArray(m.rgba), new Uint8Array(m.hole), m.W, m.H, m.opts);
        if (!out) { self.postMessage({ id: m.id, ok: false }); return; }
        self.postMessage({ id: m.id, ok: true, data: out.buffer }, [out.buffer]);
      } catch (err) {
        self.postMessage({ id: m.id, ok: false });
      }
    };
  }

  /* =====================================================================
     PÁGINA — cria o Worker uma vez e controla o tempo limite
     ===================================================================== */
  var wk = null, wkUrl = null, seq = 0, jobs = {};

  function failAll() {
    for (var k in jobs) {
      if (!jobs.hasOwnProperty(k)) continue;
      try { clearTimeout(jobs[k].timer); } catch (e) { /* nada */ }
      try { jobs[k].resolve(null); } catch (e) { /* nada */ }
    }
    jobs = {};
  }

  function getWorker() {
    if (wk) return wk;
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined' || !G.URL || !G.URL.createObjectURL) return null;
    var src = 'var __pm=' + pmCore.toString() + ';(' + pmWorker.toString() + ')(self,__pm);';
    wkUrl = G.URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    wk = new Worker(wkUrl);
    wk.onmessage = function (e) {
      var m = e.data || {}, j = jobs[m.id];
      if (!j) return;
      delete jobs[m.id];
      try { clearTimeout(j.timer); } catch (x) { /* nada */ }
      j.resolve(m.ok && m.data ? new Uint8ClampedArray(m.data) : null);
    };
    wk.onerror = function () {
      try { wk.terminate(); } catch (e) { /* nada */ }
      wk = null;
      failAll();
    };
    return wk;
  }

  function inpaint(rgba, hole, W, H, opts) {
    return new Promise(function (resolve) {
      if (!rgba || !hole || !W || !H) { resolve(null); return; }
      var w = getWorker();
      if (!w) { resolve(null); return; }
      var o = {}, k;
      if (opts) for (k in opts) if (opts.hasOwnProperty(k)) o[k] = opts[k];
      var limit = o.timeLimit == null ? 6000 : o.timeLimit;
      var id = ++seq;
      var a = new Uint8ClampedArray(rgba), b = new Uint8Array(hole);
      var timer = setTimeout(function () {
        var j = jobs[id];
        if (!j) return;
        delete jobs[id];
        try { wk.terminate(); } catch (e) { /* nada */ }
        wk = null;
        failAll();
        resolve(null);
      }, limit + 1500);
      jobs[id] = { resolve: resolve, timer: timer };
      try {
        w.postMessage({ id: id, rgba: a.buffer, hole: b.buffer, W: W, H: H, opts: o }, [a.buffer, b.buffer]);
      } catch (e) {
        delete jobs[id];
        try { clearTimeout(timer); } catch (x) { /* nada */ }
        resolve(null);
      }
    });
  }

  var api = { inpaint: inpaint, core: pmCore };
  if (G && G.document) {
    try { G.AetixPatchMatch = api; } catch (e) { /* nada */ }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this)));
