/* Boulai hero animation: patients -> treatment effect -> for whom -> causal hypotheses -> stress test.
   Mounts on every element with class "ba-hero". Canvas 2D, no dependencies. 24 s loop. */
(() => {
  const T = 30;
  const MONO = "'Locus Plex Mono','IBM Plex Mono',ui-monospace,monospace";
  const SANS = "'Barlow',system-ui,sans-serif";
  const COL = {
    red: [239, 111, 94],
    amb: [127, 139, 160], ctl: [150, 161, 178], trt: [95, 179, 218], sub: [168, 226, 250],
    node: [210, 218, 228], gold: [242, 201, 76], vio: [185, 170, 245], cop: [224, 153, 90], dim: [95, 107, 126]
  };
  const ss = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const win = (t, a, b, f = 0.6) => ss(a, a + f, t) * (1 - ss(b - f, b, t));
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function gauss(r) { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  const quant = (arr, q) => { const a = arr.slice().sort((x, y) => x - y); const i = (a.length - 1) * q, lo = Math.floor(i); return a[lo] + (a[Math.ceil(i)] - a[lo]) * (i - lo); };
  const qbez = (p0, c, p1, u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]];

  // scene boundaries (s)
  const S = { effect: 3, whom: 8.5, graph: 11.5, scan: 13.2, stress: 15.4, icarus: 18, cand: 18.9, pick: 20.7, latent: 21.3, retest: 23.9, resolved: 25.3, out: 27.1 };

  function mount(el) {
    if (el.__ba) return; el.__ba = 1;
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    el.appendChild(cv);
    const ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, mobile = false, G = null, P = [], N = 0;

    function build() {
      const r = rng(20261127);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = el.clientWidth; H = el.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      mobile = W < 900;
      // scene region
      const g = mobile
        ? { x0: W * 0.06, x1: W * 0.94, y0: H * 0.17, y1: H * 0.8 }
        : { x0: Math.max(W * 0.5, W / 2 + 30), x1: W * 0.965, y0: Math.max(H * 0.2, 165), y1: H * 0.84 };
      g.w = g.x1 - g.x0; g.h = g.y1 - g.y0; g.cx = g.x0 + g.w / 2; g.cy = g.y0 + g.h / 2;
      const at = (u, v) => [g.x0 + u * g.w, g.y0 + v * g.h];
      // groups (effect scene)
      g.col = [at(mobile ? 0.27 : 0.27, 0.6), at(mobile ? 0.73 : 0.73, 0.6)];
      g.sd = g.h * (mobile ? 0.12 : 0.135);
      g.hw = g.w * (mobile ? 0.17 : 0.13);
      // graph
      const nodes = mobile
        ? { dose: [0.5, 0.12], ma: [0.17, 0.42], mb: [0.83, 0.42], out: [0.5, 0.72], hid: [0.84, 0.88] }
        : { dose: [0.08, 0.5], ma: [0.42, 0.16], mb: [0.42, 0.8], out: [0.8, 0.48], hid: [0.74, 0.92] };
      g.nodes = {}; for (const k in nodes) g.nodes[k] = at(nodes[k][0], nodes[k][1]);
      g.rN = Math.min(g.w, g.h) * (mobile ? 0.075 : 0.065);
      g.cand = [g.nodes.hid, ...(mobile ? [at(0.16, 0.88), at(0.93, 0.64)] : [at(0.99, 0.74), at(0.56, 1.0)])];
      const E = [['dose', 'ma', -0.12], ['dose', 'mb', 0.12], ['ma', 'out', -0.1], ['mb', 'out', 0.1], ['hid', 'mb', -0.12], ['hid', 'out', 0.1]];
      g.edges = E.map(([a, b, bow]) => {
        const p0 = g.nodes[a], p1 = g.nodes[b];
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy);
        const c = [(p0[0] + p1[0]) / 2 - dy / L * L * bow, (p0[1] + p1[1]) / 2 + dx / L * L * bow];
        const tr = g.rN * 1.25 / L; // trim inside node clusters
        return { a, b, p0, p1, c, u0: tr, u1: 1 - tr * 1.15 };
      });
      G = g;

      N = mobile ? 1100 : 2600;
      const prev = P; P = [];
      const vals = [[], []];
      for (let i = 0; i < N; i++) {
        const p = { i, rate: 2.2 + r() * 1.6, d: r() * 0.9, ph: r() * 6.283, rad: 0.85 + r() * r() * 1.5 };
        // cloud
        if (i < N * 0.72) {
          p.cx = g.cx + gauss(r) * g.w * 0.26; p.cy = g.cy + gauss(r) * g.h * 0.24;
        } else {
          p.cx = r() * W; p.cy = H * 0.08 + r() * H * 0.88; p.far = 1;
        }
        // effect groups
        if (i < N * 0.7) {
          p.grp = i % 2;
          if (p.grp === 1) { p.sub = r() < 0.4; p.v = p.sub ? 0.61 + gauss(r) * 0.85 : 0.29 + gauss(r) * 0.95; }
          else p.v = gauss(r);
          p.v = Math.max(-2.6, Math.min(2.6, p.v));
          const m = p.grp ? 0.42 : 0, dens = Math.exp(-((p.v - m) ** 2) / 2);
          p.gx = g.col[p.grp][0] + (r() * 2 - 1) * g.hw * (0.15 + 0.85 * dens);
          p.gy = g.col[p.grp][1] - p.v * g.sd;
          vals[p.grp].push(p.gy);
          if (p.grp === 1 && p.sub) (vals.sub = vals.sub || []).push(p.gy);
        }
        // graph roles
        const f = i / N;
        if (f < 0.4) {
          const keys = ['dose', 'ma', 'mb', 'out', 'hid'];
          p.node = keys[i % 5];
          const a = r() * 6.283, rr = Math.sqrt(r()) * g.rN * (p.node === 'hid' ? 0.8 : 1);
          p.nx = Math.cos(a) * rr; p.ny = Math.sin(a) * rr;
        } else if (f < 0.66) {
          p.edge = i % 6; p.eu = r(); p.ej = (r() - 0.5) * 3;
        }
        const o = prev[i];
        p.x = o ? o.x : p.cx; p.y = o ? o.y : p.cy;
        p.c = o ? o.c.slice() : COL.amb.slice(); p.a = o ? o.a : 0;
        P.push(p);
      }
      // box stats (screen y)
      g.box = [0, 1].map(k => ({ p5: quant(vals[k], 0.05), q1: quant(vals[k], 0.25), md: quant(vals[k], 0.5), q3: quant(vals[k], 0.75), p95: quant(vals[k], 0.95) }));
      g.subMd = quant(vals.sub, 0.5);
    }

    // target + style per point at time t
    function target(p, t) {
      const tt = (t - p.d + T) % T, g = G;
      const cloud = () => [p.cx + Math.sin(t * 0.31 + p.ph) * 9, p.cy + Math.cos(t * 0.27 + p.ph) * 7];
      let pos, col = COL.amb, a = p.far ? 0.14 : 0.55, rate = p.rate;
      if (tt < S.effect || tt >= S.out + 0.4) { pos = cloud(); if (tt < 0.8) a *= tt / 0.8; if (tt > T - 0.8) a *= (T - tt) / 0.8; }
      else if (tt < S.graph) {
        if (p.grp !== undefined) {
          pos = [p.gx + Math.sin(t * 0.8 + p.ph) * 0.6, p.gy];
          if (tt < S.whom) { col = p.grp ? COL.trt : COL.ctl; a = p.grp ? 0.9 : 0.7; }
          else { if (p.grp && p.sub) { col = COL.sub; a = 1; } else { col = p.grp ? COL.trt : COL.ctl; a = 0.22; } }
        } else { pos = cloud(); a = p.far ? 0.06 : 0.1; }
      } else {
        const hidOk = tt >= S.latent, stressed = tt >= S.stress && tt < S.resolved + 0.4;
        if (p.node === 'hid' && !hidOk && tt >= S.icarus) {
          // Icarus pulls the unexplained signal out of marker_b and outcome, then searches candidate latent factors
          let c, rr = g.rN * (0.55 + 0.45 * Math.abs(Math.sin(p.ph))), sp = 0.9;
          if (tt < S.cand) { c = (p.i >> 1) % 2 ? g.nodes.mb : g.nodes.out; rr *= 0.7; }
          else if (tt < S.pick) c = g.cand[(p.i >> 2) % 3];
          else { c = g.cand[0]; sp = 0.5; }
          const ang = p.ph + t * sp;
          pos = [c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr]; col = COL.cop; a = tt < S.cand ? 0.85 : 0.6; rate = 3.2;
        } else if (p.node && (p.node !== 'hid' || hidOk)) {
          const c = g.nodes[p.node], s = Math.sin(t * 0.25), k = Math.cos(t * 0.25);
          pos = [c[0] + p.nx * k - p.ny * s, c[1] + p.nx * s + p.ny * k];
          col = p.node === 'out' ? COL.gold : p.node === 'hid' ? COL.cop : COL.node; a = p.node === 'out' ? 0.95 : 0.78;
          if (stressed && p.node === 'mb') { pos[0] += Math.sin(t * 23 + p.ph) * 1.6; pos[1] += Math.cos(t * 19 + p.ph) * 1.6; col = [236, 170, 160]; }
        } else if (p.edge !== undefined && (p.edge < 4 || hidOk)) {
          const e = g.edges[p.edge];
          const u = e.u0 + (e.u1 - e.u0) * ((p.eu + t * 0.09) % 1);
          const q = qbez(e.p0, e.c, e.p1, u);
          pos = [q[0] + p.ej, q[1] + p.ej * 0.6]; rate = 9; a = 0.62; col = COL.node;
          if (p.edge >= 4) { col = COL.cop; a = 0.6; }
          if (p.edge === 3 && stressed) { col = COL.red; a = 0.95; pos[0] += Math.sin(t * 29 + p.ph) * 3; pos[1] += Math.cos(t * 31 + p.ph) * 3; rate = 14; }
          if (p.edge === 3 && tt >= S.resolved + 0.4) { col = COL.cop; a = 0.4; }
        } else { pos = cloud(); a = p.far ? 0.05 : 0.08; }
      }
      return { pos, col, a, rate };
    }

    function step(t, dt) {
      for (const p of P) {
        const tg = target(p, t);
        const k = 1 - Math.exp(-dt * tg.rate);
        p.x += (tg.pos[0] - p.x) * k; p.y += (tg.pos[1] - p.y) * k;
        const kc = 1 - Math.exp(-dt * 3);
        for (let j = 0; j < 3; j++) p.c[j] += (tg.col[j] - p.c[j]) * kc;
        p.a += (tg.a - p.a) * kc;
      }
    }

    function text(str, x, y, { size = 11, col = COL.node, a = 1, align = 'left', font = MONO, weight = 500, ls = 1.3 } = {}) {
      if (a <= 0.01) return;
      ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
      if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px';
      ctx.fillStyle = rgba(col, a); ctx.fillText(str, x, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }
    function line(x1, y1, x2, y2, col, a, w = 1, dash) {
      if (a <= 0.01) return;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
    }

    function overlays(t) {
      const g = G, fs = mobile ? 10.5 : 11;
      // ---- effect scene ----
      const lab = win(t, 4.0, 11.2);
      const by = g.y1 + (mobile ? 2 : 6);
      text('CONTROL', g.col[0][0], by, { align: 'center', col: COL.ctl, a: lab * 0.9, size: fs });
      text('TREATED', g.col[1][0], by, { align: 'center', col: COL.trt, a: lab, size: fs });
      const bx = win(t, 5.0, 11.2);
      g.box.forEach((b, k) => {
        const x = g.col[k][0], w = mobile ? 14 : 18, c = k ? COL.trt : COL.ctl;
        line(x, b.p5, x, b.q1, c, bx * 0.6); line(x, b.q3, x, b.p95, c, bx * 0.6);
        if (bx > 0.01) { ctx.strokeStyle = rgba(c, bx * 0.75); ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, b.q3, w, b.q1 - b.q3); }
        line(x - w / 2 - 4, b.md, x + w / 2 + 4, b.md, k ? COL.gold : COL.node, bx, 1.6);
      });
      const ef = win(t, 6.0, 8.7);
      if (ef > 0.01) {
        const m0 = g.box[0].md, m1 = g.box[1].md, xa = g.col[0][0] + 16, xb = g.col[1][0] - 16, xm = (g.col[0][0] + g.col[1][0]) / 2;
        line(xa, m0, xb, m0, COL.node, ef * 0.45, 1, [3, 4]);
        line(xa, m1, xb, m1, COL.gold, ef * 0.75, 1, [3, 4]);
        line(xm, m0, xm, m1 + 3, COL.gold, ef, 1.4);
        ctx.beginPath(); ctx.moveTo(xm - 4, m1 + 6); ctx.lineTo(xm, m1); ctx.lineTo(xm + 4, m1 + 6); ctx.strokeStyle = rgba(COL.gold, ef); ctx.lineWidth = 1.4; ctx.stroke();
        const ly = g.col[0][1] - 2.7 * g.sd - (mobile ? 58 : 66);
        text('TREATMENT EFFECT', xm, ly, { align: 'center', col: COL.dim, a: ef, size: fs - 0.5 });
        text('+0.42', xm, ly + (mobile ? 30 : 34), { align: 'center', col: [246, 231, 184], a: ef, size: mobile ? 28 : 34, font: SANS, weight: 500, ls: 0 });
        text('95% CI 0.31\u20130.53', xm, ly + (mobile ? 47 : 53), { align: 'center', col: COL.dim, a: ef, size: fs - 0.5 });
      }
      const sb = win(t, 9.0, 11.2);
      if (sb > 0.01) {
        const x = g.col[1][0], y = g.subMd;
        line(x + g.hw + 6, y, x + g.hw + 22, y, COL.sub, sb * 0.8, 1);
        const lx = mobile ? (g.col[0][0] + g.col[1][0]) / 2 : (g.col[0][0] + g.col[1][0]) / 2;
        const ly = g.col[0][1] - 2.7 * g.sd - (mobile ? 58 : 66);
        text('FOR WHOM IT HOLDS', lx, ly, { align: 'center', col: COL.dim, a: sb, size: fs - 0.5 });
        text('marker_a high  +0.61', lx, ly + (mobile ? 26 : 30), { align: 'center', col: COL.sub, a: sb, size: mobile ? 17 : 20, font: SANS, weight: 500, ls: 0 });
      }
      // ---- graph scene ----
      const gr = win(t, S.graph + 0.6, S.out + 0.2), lt = win(t, S.latent + 0.2, S.out + 0.2);
      const stress = win(t, S.stress, S.resolved + 0.3, 0.5), resolved = win(t, S.resolved, S.out + 0.2, 0.5);
      g.edges.forEach((e, k) => {
        const a = (k >= 4 ? lt : gr) * 0.16;
        if (a < 0.01) return;
        ctx.beginPath(); ctx.moveTo(...qbez(e.p0, e.c, e.p1, e.u0)); ctx.quadraticCurveTo(e.c[0], e.c[1], ...qbez(e.p0, e.c, e.p1, e.u1));
        ctx.strokeStyle = rgba(k >= 4 ? COL.cop : COL.node, a); ctx.lineWidth = 1; ctx.setLineDash(k >= 4 ? [3, 4] : []); ctx.stroke(); ctx.setLineDash([]);
      });
      // stress halo on the part of the model that breaks
      if (stress > 0.01) {
        const e = g.edges[3], [x, y] = qbez(e.p0, e.c, e.p1, 0.42), R = g.rN * (3 + Math.sin(t * 6) * 0.25);
        const rg = ctx.createRadialGradient(x, y, 0, x, y, R);
        rg.addColorStop(0, rgba(COL.red, 0.26 * stress)); rg.addColorStop(1, rgba(COL.red, 0));
        ctx.fillStyle = rg; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
      }
      const names = { dose: 'DOSE', ma: 'MARKER_A', mb: 'MARKER_B', out: 'OUTCOME', hid: 'HIDDEN FACTOR' };
      for (const k in g.nodes) {
        const a = k === 'hid' ? lt : gr; if (a < 0.01) continue;
        const [x, y] = g.nodes[k], r = g.rN * 1.35;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283);
        const rc = k === 'mb' && stress > 0.5 ? COL.red : k === 'out' ? COL.gold : k === 'hid' ? COL.cop : COL.node;
        ctx.strokeStyle = rgba(rc, a * (k === 'out' ? 0.6 : k === 'mb' && stress > 0.5 ? 0.6 : 0.28));
        ctx.lineWidth = 1; ctx.setLineDash(k === 'hid' ? [2, 4] : []); ctx.stroke(); ctx.setLineDash([]);
        let lx = x, ly = y - r - 10, al = 'center';
        if (!mobile && k === 'dose') { ly = y + r + 20; }
        if (!mobile && k === 'mb') { ly = y + r + 20; }
        if (!mobile && k === 'hid') { lx = x + r + 12; ly = y + 4; al = 'left'; }
        if (!mobile && k === 'out') { ly = y - r - 12; }
        if (mobile && k === 'out') { ly = y + r + 20; }
        if (mobile && k === 'hid') { ly = y + r + 16; al = 'center'; }
        text(names[k], lx, ly, { align: al, col: k === 'hid' ? COL.cop : k === 'out' ? COL.gold : COL.node, a: a * 0.85, size: fs });
      }
      // Locus scan: violet pulses along every link, then again on the stressed area after the revision
      const scans = [];
      for (let k = 0; k < 4; k++) scans.push([k, S.scan + k * 0.5]);
      scans.push([3, S.retest], [4, S.retest + 0.25], [5, S.retest + 0.5]);
      scans.forEach(([k, t0]) => {
        const u = (t - t0) / 0.8; if (u < 0 || u > 1.25) return;
        const e = g.edges[k], fade = u > 1 ? 1 - (u - 1) / 0.25 : 1;
        for (let j = 0; j < 14; j++) {
          const uu = Math.min(1, u) - j * 0.018; if (uu < 0) continue;
          const [x, y] = qbez(e.p0, e.c, e.p1, e.u0 + (e.u1 - e.u0) * uu);
          ctx.beginPath(); ctx.arc(x, y, j === 0 ? 2.4 : 1.8 - j * 0.1, 0, 6.283);
          ctx.fillStyle = rgba(j === 0 ? [236, 230, 255] : COL.vio, (1 - j / 14) * 0.9 * fade); ctx.fill();
        }
      });
      const hs = mobile ? 9.5 : 10.5;
      const meas = (str, size, ls = 1.3) => { ctx.font = `500 ${size}px ${MONO}`; if ('letterSpacing' in ctx) ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(str).width; if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; return w; };
      // stress tag on the link that breaks
      if (stress > 0.01 || resolved > 0.01) {
        const e = g.edges[3], [x, y] = qbez(e.p0, e.c, e.p1, 0.5);
        const lab = t < S.resolved ? 'STRESS' : 'RESOLVED', c = t < S.resolved ? COL.red : COL.vio, a = Math.max(stress, resolved) * gr;
        const w = meas(lab, fs - 1, 1.4) + 26;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 10, w, 20, 10) : ctx.rect(x - w / 2, y - 10, w, 20);
        ctx.fillStyle = rgba([14, 17, 23], 0.92 * a); ctx.fill(); ctx.strokeStyle = rgba(c, 0.6 * a); ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.arc(x - w / 2 + 10, y, 2.4, 0, 6.283); ctx.fillStyle = rgba(c, a); ctx.fill();
        text(lab, x - w / 2 + 18, y + 3.5, { col: c, a, size: fs - 1, ls: 1.4 });
      }
      // Locus checks: testable implications of the model
      const ck = win(t, S.scan + 0.4, S.out + 0.2);
      if (ck > 0.01) {
        const x = g.x0, y1 = mobile ? H - 86 : g.y0 - 34, gap = mobile ? 16 : 19;
        const l1 = t < S.resolved ? 'dose ⊥ outcome | marker_a, marker_b' : 'dose ⊥ outcome | marker_a, marker_b, hidden';
        const l2 = 'marker_a ⊥ marker_b | dose';
        const v1 = ss(S.scan + 1.6, S.scan + 2.0, t), v2 = ss(S.scan + 2.1, S.scan + 2.5, t);
        const px = mobile ? 0 : 52;
        if (!mobile) text('CHECK', x, y1, { col: COL.vio, a: ck, size: hs });
        text(l1, x + px, y1, { col: COL.node, a: ck * 0.85, size: hs, ls: 0.4 });
        const f1 = t < S.resolved ? 'FAILS' : 'PASSES', c1 = t < S.resolved ? COL.red : COL.vio;
        text(f1, x + px + meas(l1, hs, 0.4) + 12, y1, { col: c1, a: ck * v1, size: hs });
        if (!mobile) text('CHECK', x, y1 + gap, { col: COL.vio, a: ck, size: hs });
        text(l2, x + px, y1 + gap, { col: COL.node, a: ck * 0.85, size: hs, ls: 0.4 });
        text('PASSES', x + px + meas(l2, hs, 0.4) + 12, y1 + gap, { col: COL.dim, a: ck * v2, size: hs });
      }
      // Icarus: search of the latent space, candidate factors scored, the best one kept
      const cs = win(t, S.cand, S.latent + 0.3, 0.4);
      if (cs > 0.01) {
        const fin = [0.88, 0.41, 0.23], grow = ss(S.cand, S.pick, t);
        g.cand.forEach((c, k) => {
          const a = k === 0 ? cs : cs * (1 - ss(S.pick, S.pick + 0.5, t));
          if (a < 0.01) return;
          const r = g.rN * 1.35;
          ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, 6.283);
          ctx.strokeStyle = rgba(COL.cop, a * (k === 0 && t >= S.pick ? 0.8 : 0.45)); ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.stroke(); ctx.setLineDash([]);
          const v = (fin[k] * grow).toFixed(2), lab = 'FIT ' + v;
          const m2 = mobile && k === 2;
          const lx = m2 ? c[0] - r - 8 : mobile ? c[0] : (k === 1 ? c[0] - r - 10 : c[0] + r + 12), ly = m2 ? c[1] + 4 : mobile ? c[1] + r + 16 : c[1] + 4;
          const al = m2 ? 'right' : mobile ? 'center' : (k === 1 ? 'right' : 'left');
          if (!(k === 0 && t >= S.latent)) text(lab, lx, ly, { align: al, col: k === 0 && t >= S.pick ? COL.cop : COL.dim, a, size: hs });
        });
      }
      // causal loadings of the hidden factor on the measured variables
      const ld = win(t, S.latent + 0.6, S.out + 0.2);
      if (ld > 0.01) {
        [[4, '+0.58'], [5, '+0.34']].forEach(([k, v]) => {
          const e = g.edges[k], [x, y] = qbez(e.p0, e.c, e.p1, 0.5);
          const off = mobile ? (k === 4 ? [-22, 0] : [0, 16]) : (k === 4 ? [0, 18] : [22, 0]);
          text(v, x + off[0], y + off[1], { align: 'center', col: [240, 200, 160], a: ld, size: hs + 0.5, ls: 0.4 });
        });
      }
      // Icarus writes out what it found
      const hy = win(t, S.pick + 0.1, S.out + 0.2, 0.3);
      if (hy > 0.01) {
        const str = mobile ? 'Hidden factor → marker_b → outcome' : 'Hidden factor drives outcome through marker_b';
        const n = Math.max(0, Math.min(str.length, Math.floor((t - S.pick - 0.3) * 26)));
        const x0 = g.x0, y = mobile ? H - 40 : g.y1 + 70, size = mobile ? 10.5 : 14;
        text('›', x0, y, { col: COL.cop, a: hy, size, ls: 0 });
        const x = x0 + (mobile ? 12 : 16), shown = str.slice(0, n);
        text(shown, x, y, { col: [240, 200, 160], a: hy, size, ls: mobile ? 0.2 : 0.4 });
        if ((n < str.length || Math.floor(t * 2.2) % 2 === 0) && t < S.retest) {
          const w = meas(shown, size, mobile ? 0.2 : 0.4);
          ctx.fillStyle = rgba(COL.cop, hy); ctx.fillRect(x + w + 2, y - size + 2, mobile ? 6 : 8, size);
        }
        if (!mobile) {
          const a2 = hy * ss(S.latent + 0.8, S.latent + 1.3, t);
          text('NOT MEASURED IN THE TRIAL  ·  CAUSAL, NOT CORRELATIONAL  ·  TESTABLE', x, y + 22, { col: COL.dim, a: a2, size: hs });
        }
      }
      // outcome glow once the model is revised
      if (resolved > 0.01) {
        const [ox, oy] = g.nodes.out, gl = resolved * 0.5;
        const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, g.rN * 3.2);
        rg.addColorStop(0, rgba(COL.gold, 0.35 * gl)); rg.addColorStop(1, rgba(COL.gold, 0));
        ctx.fillStyle = rg; ctx.fillRect(ox - g.rN * 3.2, oy - g.rN * 3.2, g.rN * 6.4, g.rN * 6.4);
      }
      // scene caption (no numbers, no progress bar)
      const ph = [[0, S.effect, '', '1,284 PATIENTS', COL.dim], [S.effect, S.whom, 'ATLAS', 'MEASURES THE EFFECT', COL.trt], [S.whom, S.graph, 'ATLAS', 'FINDS FOR WHOM IT HOLDS', COL.trt], [S.graph, S.scan, '', 'CAUSAL MODEL OF THE TRIAL', COL.dim], [S.scan, S.icarus, 'LOCUS', mobile ? 'FINDS WHERE THE MODEL BREAKS' : 'FINDS WHERE THE MODEL IS UNDER STRESS', COL.vio], [S.icarus, S.latent, 'ICARUS', mobile ? 'SEARCHES FOR HIDDEN FACTORS' : 'SEARCHES FOR HIDDEN CAUSAL FACTORS', COL.cop], [S.latent, S.retest, 'ICARUS', mobile ? 'FINDS A HIDDEN FACTOR' : 'FINDS A HIDDEN FACTOR ACTING THROUGH MARKER_B', COL.cop], [S.retest, S.out + 1.5, 'LOCUS', 'RE-TESTS THE REVISED MODEL', COL.vio]];
      const cy = mobile ? H - 12 : g.y1 + 40, cx = g.x0;
      ph.forEach(([a, b, eng, name, c]) => {
        const a2 = win(t, a, b, 0.35);
        if (a2 < 0.01) return;
        let x = cx;
        if (eng) { text(eng, x, cy, { col: c, a: a2, size: fs }); x += meas(eng, fs) + 12; }
        text(name, x, cy, { col: COL.node, a: a2 * 0.85, size: fs });
      });
    }

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        if (p.a < 0.01) continue;
        // keep the text column calm on desktop
        let a = p.a;
        if (!mobile && p.x < G.x0 - 20) a *= 0.35;
        ctx.fillStyle = rgba(p.c, a);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, 6.283); ctx.fill();
      }
      overlays(t);
    }

    let t0 = performance.now(), last = t0, run = true, raf = 0;
    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = ((now - t0) / 1000) % T;
      step(t, dt); draw(t);
      if (run) raf = requestAnimationFrame(frame);
    }
    function settle(t) { for (const p of P) { p.x = p.cx; p.y = p.cy; } for (let s = 0; s <= t; s += 1 / 60) step(s, 1 / 60); draw(t); }
    build();
    el.__baSeek = (t) => { run = false; if (raf) cancelAnimationFrame(raf); raf = 0; settle(t); };
    if (reduce) { settle(7.6); new ResizeObserver(() => { build(); settle(7.6); }).observe(el); return; }
    new ResizeObserver(() => build()).observe(el);
    new IntersectionObserver(([en]) => {
      run = en.isIntersecting && !document.hidden;
      if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }).observe(el);
    document.addEventListener('visibilitychange', () => {
      run = !document.hidden; if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    raf = requestAnimationFrame(frame);
  }
  const go = () => document.querySelectorAll('.ba-hero').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  window.BoulaiHero = { mount };
})();
