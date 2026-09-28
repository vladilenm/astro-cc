/*
 * 01 · Знакомая ситуация — shot s01
 * 60 cut: T 0–4 · 45 cut: T 0–3
 *
 * The cold open. The empty dashed «Мой проект» card sits in the centre from frame 0; open tabs pile
 * up around it (slightly tilted, drifting a few px — restless). The cursor wanders tab → tab and
 * drags a dashed, wobbling route line behind it that never reaches the project. Motion stops, the
 * question «С чего начать?» appears, and the tabs line up onto FILM.ui.G2 exactly at the cut.
 *
 * Layers (back to front)
 *   1. ui.bg
 *   2. project card «Мой проект» (dashed, G2.project) — behind the tabs
 *   3. tabs (ui.tabCard) — scatter + drift → G2
 *   4. route line (dashed, wobble) — the cursor's trail
 *   5. cursor
 *   6. title «С чего начать?» (88 px, centred, baseline 200)
 *
 * End pose (t = dur, and already from the last frame): G2 tabs (tilts included) + G2 project card +
 * the title. No cursor, no route line. s02 starts from exactly this.
 */
(function () {
  'use strict';
  const ID = 's01';
  const U = FILM.ui;
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, q) => a + (b - a) * q;

  // --- shared with 02-guide.js (verbatim copy there): the empty project card -------------------
  /** the dashed «Мой проект» card; ca = content alpha (caption + plus), k = 0 project look → 1 contour look */
  function drawProject(ctx, x, y, w, h, ca, k) {
    U.card(ctx, x, y, w, h, { r: 24, dashed: true, stroke: L.mix(P.borderHi, P.text3, k || 0), lw: 2 });
    if (ca <= 0) return;
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.save();
    ctx.globalAlpha *= ca;
    // a dashed ring with a plus: "nothing here yet"
    ctx.beginPath();
    ctx.arc(cx, cy - 34, 50, 0, Math.PI * 2);
    ctx.setLineDash([7, 7]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.borderHi;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 34);
    ctx.lineTo(cx + 18, cy - 34);
    ctx.moveTo(cx, cy - 52);
    ctx.lineTo(cx, cy - 16);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.text3;
    ctx.stroke();
    ctx.restore();
    U.text(ctx, 'Мой проект', cx, cy + 66, { size: 40, weight: 600, color: P.text2, align: 'center', alpha: ca });
    U.text(ctx, 'пусто', cx, cy + 112, { mono: true, size: 22, upper: true, tracking: 3.5, color: P.text3, align: 'center', alpha: ca });
  }

  const G2 = U.G2;

  // scatter offsets from the G2 pose (the "restless" pose before the tabs line up); tilt ≤ 3°
  const SCATTER = [
    { dx: -26, dy: 24, tilt: -0.05 },
    { dx: 20, dy: -18, tilt: 0.05 },
    { dx: -34, dy: 14, tilt: -0.042 },
  ];

  // --- schedules (shot-local seconds) --------------------------------------------------------------
  const SCHED = {
    60: {
      tabIn: [-0.12, 0.4, 0.8], // T 0.0 / 0.4 / 0.8 (first one already on screen at frame 0)
      tabs: 3,
      cursor: [[1.0, 250, 1150], [1.36, 440, 560], [1.6, 880, 336], [1.86, 1470, 470], [2.14, 1440, 736], [2.4, 1282, 676]],
      clicks: [1.38, 1.88, 2.16],
      trailFrom: 1.32,
      title: 2.4, // «С чего начать?»
      settle: [3.4, 0.52], // → exact G2 at 3.92 (last frame 3.96 holds it)
      out: [3.4, 0.42], // cursor + route fade
      tab3Fade: null,
    },
    45: {
      tabIn: [-0.12, 0.25, null],
      tabs: 2,
      cursor: [[0.15, 250, 1150], [0.46, 440, 560], [0.66, 880, 336], [0.86, 1470, 470], [1.04, 1262, 700]],
      clicks: [0.48, 0.88],
      trailFrom: 0.44,
      title: 1.0,
      settle: [2.2, 0.72], // → exact G2 at 2.92
      out: [2.2, 0.5],
      tab3Fade: [2.2, 0.7], // the third G2 tab fades in so the boundary pose matches
    },
  };

  /** the cursor's trail, resampled at equal arc length from its start (stable prefix → stable wobble) */
  function trail(keys, t0, t1) {
    const raw = [];
    const n = Math.max(1, Math.floor((t1 - t0) / 0.02));
    for (let i = 0; i <= n; i++) raw.push(U.cursorPath(keys, t0 + (i / n) * (t1 - t0)));
    const D = 22;
    const out = [raw[0].slice()];
    let acc = 0;
    for (let i = 1; i < raw.length; i++) {
      let ax = raw[i - 1][0];
      let ay = raw[i - 1][1];
      const bx = raw[i][0];
      const by = raw[i][1];
      let seg = Math.hypot(bx - ax, by - ay);
      while (acc + seg >= D) {
        const q = (D - acc) / seg;
        ax = lerp(ax, bx, q);
        ay = lerp(ay, by, q);
        out.push([ax, ay]);
        seg = Math.hypot(bx - ax, by - ay);
        acc = 0;
      }
      acc += seg;
    }
    const last = raw[raw.length - 1];
    const z = out[out.length - 1];
    if (Math.hypot(last[0] - z[0], last[1] - z[1]) > 0.5) out.push(last.slice());
    return out;
  }

  function drawTab(ctx, i, T, t, S, settle) {
    const g = G2.tabs[i];
    const sc = SCATTER[i];
    const amp = 1 - settle;
    // restless drift: a few px and a hair of tilt, fading out as the tabs line up
    const dx = (sc.dx + 6 * L.noise1(T * 0.55 + i * 7.3, 1101 + i)) * amp;
    const dy = (sc.dy + 5 * L.noise1(T * 0.5 + i * 3.1, 1201 + i)) * amp;
    const tilt = lerp(sc.tilt + 0.006 * L.noise1(T * 0.45 + i, 1301 + i), g.tilt, settle);
    let a = 1;
    let s = 1;
    let rise = 0;
    const t0 = S.tabIn[i];
    if (t0 != null) {
      const p = clamp((t - t0) / 0.45);
      a = E.outCubic(clamp((t - t0) / 0.3));
      s = 0.9 + 0.1 * E.outBack(p);
      rise = 26 * (1 - E.outCubic(p));
    } else if (S.tab3Fade) {
      const p = clamp((t - S.tab3Fade[0]) / S.tab3Fade[1]);
      a = E.outCubic(p);
      rise = 16 * (1 - E.outCubic(p));
    }
    if (a <= 0) return;
    const x = g.x + dx;
    const y = g.y + dy + rise;
    ctx.save();
    if (s !== 1) {
      ctx.translate(x + g.w / 2, y + g.h / 2);
      ctx.scale(s, s);
      ctx.translate(-(x + g.w / 2), -(y + g.h / 2));
    }
    U.tabCard(ctx, x, y, g.w, g.h, { title: g.title, kind: g.kind, fav: g.fav, tilt, alpha: a });
    ctx.restore();
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const t = clamp(tIn, 0, info.dur);
      const T = info.T;
      const cut = U.cut(info);
      const S = SCHED[cut];

      // 1. background
      U.bg(ctx, {});

      // 2. the empty project, present from frame 0
      const pr = G2.project;
      drawProject(ctx, pr.x, pr.y, pr.w, pr.h, 1, 0);

      // 3. tabs
      const settle = E.inOutCubic(clamp((t - S.settle[0]) / S.settle[1]));
      for (let i = 0; i < 3; i++) {
        if (i >= S.tabs && !S.tab3Fade) continue;
        drawTab(ctx, i, T, t, S, settle);
      }

      // 4–5. route trail + cursor (the lost search), fading out as the tabs line up
      const out = 1 - E.inOutCubic(clamp((t - S.out[0]) / S.out[1]));
      if (out > 0) {
        const keys = S.cursor;
        if (t > S.trailFrom + 0.02) {
          const pts = trail(keys, S.trailFrom, Math.min(t, keys[keys.length - 1][0]));
          if (pts.length >= 2) {
            const calm = clamp((t - S.title) / 0.6);
            U.route(ctx, pts, { dash: true, wobble: lerp(8, 5, calm), T, width: 4, per: 3, alpha: out * 0.95 });
          }
        }
        const [cx, cy] = U.cursorPath(keys, t);
        let press = 0;
        for (const c of S.clicks) if (t >= c && t < c + 0.3) press = (t - c) / 0.3;
        U.cursor(ctx, cx, cy, { press, alpha: out });
      }

      // 6. the question
      U.title(ctx, 'С чего начать?', 960, 200, { size: 88, align: 'center', a: U.appear(t, S.title, 0.45), rise: 26 });
    },
  });
})();
