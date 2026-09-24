/*
 * 08 real-project : «Это можно разобрать самому». T 39–45 (6 s), interface — opens on the schematic plate. Hard cut in.
 *
 * The engineering frame from shot 05 is not abstract: the camera pulls back and the schema turns out to be a
 * tracing sheet lying over the real React project «Обращения клиентов». The schema thins to a faint line
 * overlay and a plain lesson card («Бесплатный урок», «React · TypeScript») frames the readable app.
 * Honesty (art bible §0.7, §10.6): no portrait, no player chrome, no play button, no REC dot, no timecode —
 * the card is a plain panel with two chips around the app UI.
 *
 * World placement: the app sits at G1 (x 100, y 590, w 880 — its 880 × 760 design size) under the canonical
 * schema. The camera pulls back from (540, 960) ×1 to (540, 945.56) ×0.9 (inOutCubic, zoom in log space),
 * which lands the app exactly on the card rect x 144, y 640, w 792, h 684 — the rect an editor can replace
 * with real lesson footage from T 41.0. At ×0.9 the whole schema (x 135–945, y 606–1320 on screen) lies
 * over the app.
 *
 * Layers, back to front:
 *   1. plate: schematic → interface crossfade, screen-fixed, drifting 6 px per beat (t 0.5–2.0)
 *   2. lesson card fill (screen, from t 2.0)
 *   3. camera: the app (fades in t 0.5–1.25), ui.schema at full strength (fades out), the thin line overlay
 *      (fades in, lines thin), the signal pulses (one per beat, one per bar from t 2.5)
 *   4. lesson card outline draw-on + chips (t 2.0, 2.125)
 *   5. tag + headline (t 1.0), screen-fixed
 */
(function () {
  'use strict';
  const ID = 'real-project';
  const FR = 1 / 24;

  // ---- beats (shot-local seconds; global T in comments) ----
  const B_PULL = 0.5; //    T 39.5   pull-back starts; the app fades in under the schema
  const PULL_DUR = 1.5; //  → T 41.0
  const APP_IN = 0.75; //   app alpha 0 → 1 by T 40.25
  const B_HEAD = 1.0; //    T 40.0   tag + headline
  const B_CARD = 2.0; //    T 41.0   lesson card draws on, chip 1 pops
  const B_CHIP2 = 2.125; // T 41.125 chip 2 pops
  const B_THIN = 2.5; //    T 41.5   overlay 0.22 → 0.12, pulses slow to one per bar
  const THIN_DUR = 0.5; //  → T 42.0 app fully readable («настоящем»)

  const OV_MID = 0.22; // overlay strength when the pull-back lands
  const OV_END = 0.12; // after T 42.0

  // ---- screen geometry (storyboard 08, Forms) ----
  // h 760 (storyboard: 736) so the card keeps the same 40 px margin left, right and below the app (bottom 1364,
  // still 32 px clear of the caption band); the top margin carries the chips.
  const CARD = { x: 104, y: 604, w: 872, h: 760, r: 32 };
  const CARD_APP = { x: 144, y: 640, w: 792 }; // h = 760 · 792 / 880 = 684 → bottom 1324

  const TAG = '// бесплатный урок';
  const HEAD = ['Бесплатный урок.', '[Реальный проект.]'];
  const CHIP1 = 'Бесплатный урок';
  const CHIP2 = 'React · TypeScript';

  /** Camera for shot-local t: identity until B_PULL, then ×1 → ×0.9 onto the card rect. */
  function camAt(L, t, W, H) {
    const A = L.GEO.APP;
    const z1 = CARD_APP.w / A.w; // 0.9
    const c1x = A.x - (CARD_APP.x - W / 2) / z1; // 540
    const c1y = A.y - (CARD_APP.y - H / 2) / z1; // 945.56
    const u = L.ease.inOutCubic(L.clamp((t - B_PULL) / PULL_DUR));
    return { x: L.lerp(W / 2, c1x, u), y: L.lerp(H / 2, c1y, u), zoom: Math.exp(Math.log(z1) * u), u };
  }

  /** The schema as a thin line tracing (no fills, no labels): rings, core outline, routes, gates, tool outlines. */
  function overlay(ctx, L, a, wk) {
    if (a <= 0.002) return;
    const G = L.GEO, ui = L.ui, P = L.pal;
    ctx.save();
    ctx.globalAlpha *= a;
    const ringC = P.txt;
    for (let i = G.RINGS.length - 1; i >= 0; i--) {
      ui.arrow(ctx, ui.ringPts(G.RINGS[i]), { head: false, r: 0, lw: 2 * wk, color: ringC });
    }
    const C = G.CORE;
    ctx.beginPath();
    ui.rr(ctx, C.x, C.y, C.w, C.h, 26);
    ctx.strokeStyle = P.sig;
    ctx.lineWidth = 3 * wk;
    ctx.stroke();
    for (const Rt of G.ROUTES) ui.arrow(ctx, Rt.pts, { lw: 4 * wk, color: P.sig, headSize: 18 * (0.55 + 0.45 * wk), r: 22 });
    ctx.strokeStyle = P.sig;
    ctx.fillStyle = P.sig;
    ctx.lineWidth = 3 * wk;
    for (const Rt of G.ROUTES) {
      for (const g of Rt.gates) {
        ctx.strokeRect(g[0] - 9, g[1] - 9, 18, 18);
        ctx.fillRect(g[0] - 3, g[1] - 3, 6, 6);
      }
    }
    ctx.strokeStyle = P.sig;
    ctx.lineWidth = 2 * wk;
    for (const Tn of G.TOOLS) {
      ctx.beginPath();
      ui.rr(ctx, Tn.x - Tn.w / 2, Tn.y - Tn.h / 2, Tn.w, Tn.h, 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Signal dots on the routes — the same motion as ui.schema's pulse (pT = the pulse clock). */
  function pulses(ctx, L, pT, a, soft) {
    if (a <= 0.002) return;
    const G = L.GEO, ui = L.ui, P = L.pal;
    const beat = 0.5;
    const ph = (((pT % beat) + beat) % beat) / beat;
    const e = L.ease.inOutSine(ph);
    // soft 0..1: once the pulse is slowed, the dot fades in at the core and out at the tool instead of jumping back
    const env = L.lerp(1, Math.pow(Math.sin(Math.PI * ph), 0.6), soft || 0);
    ctx.save();
    ctx.globalAlpha *= a * env;
    for (const Rt of G.ROUTES) {
      const q = ui.along(ui.roundPts(Rt.pts, 22), e);
      ui.glow(ctx, q.x, q.y, 34, P.sigHot, 0.7);
      ctx.fillStyle = P.sigHot;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 7, 0, L.TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Closed outline of the card as points, starting at its top centre, clockwise. */
  function cardLoop(ui) {
    const { x, y, w, h, r } = CARD;
    const cx = x + w / 2;
    return ui.roundPts([[cx, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y], [cx, y]], r, 4);
  }

  /** A chip popped about its own centre. */
  function popChip(ctx, ui, str, x, y, sc, o) {
    if (sc <= 0) return 0;
    const w = ui.measure(ctx, str, o) + (o.padX != null ? o.padX : 18) * 2;
    ctx.save();
    ctx.translate(x + w / 2, y);
    ctx.scale(sc, sc);
    ctx.globalAlpha *= Math.min(1, sc * 2);
    ui.chip(ctx, str, -w / 2, 0, o);
    ctx.restore();
    return w;
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui, P = L.pal, E = L.ease;
      const clamp = L.clamp, lerp = L.lerp;
      const t = clamp(tIn, 0, info.dur);
      const T = info.shot.start + t;
      const W = info.W, H = info.H;
      const G = L.GEO;

      // ---- 1. plate: schematic → interface (screen-fixed, drifts 6 px per beat) ----
      const plateK = E.inOutSine(clamp((t - B_PULL) / PULL_DUR));
      if (plateK < 1) ui.bg(ctx, { plate: 'schematic', oy: -T * 12 });
      if (plateK > 0) {
        ctx.save();
        ctx.globalAlpha *= plateK;
        ui.bg(ctx, { plate: 'interface', oy: -T * 12 });
        ctx.restore();
      }

      // ---- timing values ----
      const cam = camAt(L, t, W, H);
      const u = cam.u; // pull-back progress 0..1 (inOutCubic)
      const appA = ui.kf(t, B_PULL, APP_IN, 'outCubic');
      const rowsP = lerp(0.25, 1, ui.kf(t, B_PULL + 0.125, 0.75, 'outCubic'));
      // the full schema (ui.schema, fills and labels) gives way to the thin tracing
      const aFull = 1 - E.inOutSine(clamp((t - B_PULL) / 1.1));
      const tabA = 1 - E.inOutSine(clamp((t - B_PULL) / 0.45)); // ring tabs leave first, so no labels fight the app's type
      let strength = lerp(1, OV_MID, u);
      strength = lerp(strength, OV_END, E.inOutSine(clamp((t - B_THIN) / THIN_DUR)));
      const aLine = strength * (1 - aFull);
      const wk = lerp(1, 0.55, u); // line widths thin
      // pulse clock: on the beat until T 41.5, then a quarter rate (one traversal per bar)
      const tp = t <= B_THIN ? t : B_THIN + (t - B_THIN) / 4;
      const pT = info.shot.start + tp;
      const dotA = (1 - aFull) * lerp(1, 0.5, u) * lerp(1, 0.8, E.inOutSine(clamp((t - B_THIN) / THIN_DUR)));

      // lesson card
      const cK = ui.kf(t, B_CARD, 8 * FR, 'outCubic');

      // ---- 2. lesson card fill (behind the app) ----
      if (cK > 0) {
        ui.panel(ctx, CARD.x, CARD.y, CARD.w, CARD.h, { r: CARD.r, fill: P.panel, stroke: null, alpha: cK });
      }

      // ---- 3. world: app under the schema ----
      L.camera(ctx, cam, (c) => {
        if (appA > 0) {
          ui.app(c, G.APP.x, G.APP.y, G.APP.w, {
            search: 1, query: '', rows: rowsP, alpha: appA,
            caret: t >= B_CARD, t: T,
          });
        }
        if (aFull > 0.002) {
          ui.schema(c, {
            agent: 1, agentLabel: 'модель', core: 1, rings: [1, 1, 1, 1], tools: 1, toolsActive: [1, 1, 1],
            routes: 1, gates: 1, pulse: pT, alpha: aFull, labels: tabA,
          });
        }
        overlay(c, L, aLine, wk);
        pulses(c, L, pT, dotA);
      });

      // ---- 4. lesson card outline (draws on from the top centre both ways) + chips ----
      if (cK > 0) {
        const loop = cardLoop(ui);
        const settle = ui.k(t, B_CARD + 8 * FR, 0.5, 'inOutSine');
        const col = L.mix(P.sig, P.hairHi, settle);
        const half = 0.5 * cK;
        const glowA = cK < 1 ? 0.55 : 0;
        ui.arrow(ctx, loop, { p: half, head: false, r: 0, lw: 2, color: col, glow: glowA });
        ui.arrow(ctx, loop.slice().reverse(), { p: half, head: false, r: 0, lw: 2, color: col, glow: glowA });
      }
      const o1 = { size: 28, weight: 700, color: P.bg, fill: P.sig, stroke: null, padX: 20 };
      const o2 = { size: 24, weight: 500, font: 'mono', color: P.txt, fill: P.panelHi, stroke: P.hairHi, h: 48, padX: 18 };
      const w1 = ui.measure(ctx, CHIP1, o1) + o1.padX * 2;
      popChip(ctx, ui, CHIP1, 136, CARD.y, ui.pop(t, B_CARD), o1);
      popChip(ctx, ui, CHIP2, 136 + w1 + 12, CARD.y, ui.pop(t, B_CHIP2), o2);
      if (cK > 0 && cK < 1) ui.glow(ctx, 136 + w1 / 2, CARD.y, 120, P.sig, 0.35 * (1 - cK));

      // ---- 5. tag + headline (screen-fixed) ----
      ui.tag(ctx, TAG, t - B_HEAD);
      ui.headline(ctx, HEAD, t - B_HEAD);
    },
  });
})();
