/*
 * 12 · Выбрать маршрут сейчас — s12
 * 60 cut: T 54–60 (6 s) · 45 cut: T 41–45 (4 s) · hard cut in from s11. The last frame IS the call to
 * action: no fade to black.
 *
 * Page ending (FILM.ui.variant(info) === 'page'):
 *   brand (brand position) · «Выбери маршрут ниже» 88 px (baseline 290) · «Сделай первый шаг сегодня»
 *   40 px text2 (baseline 350) · the three route cards on G1 (CARD_ROW, label 'both', «Начать маршрут»)
 *   · ui.arrowDown(960, 812, 56) under the middle card (ink ends at y 868).
 *   The route line s11 left on screen (same curve, ROUTE_PTS) retracts its tail behind the rising cards;
 *   only its last, vertical piece stays — exactly where the arrow's shaft is — and it becomes the arrow.
 *   Assembled by 56.0 (45: 41.5), then static except a barely visible glow breathing on the arrow.
 *
 * External ending ('external'):
 *   brand · «Открой бесплатный гид» 88 px · the address irreplaceable-ai.ru/learn in JetBrains Mono 600
 *   84 px accent inside a field — on screen from the scene's first frame to the last · «Выбери свой
 *   маршрут» 40 px · three glyph tiles (with their short route names) in a row. No arrow. The s11 line
 *   retracts into its head and goes out.
 *
 * Layers (back to front):
 *   1 ui.bg
 *   2 the s11 route line (retracting)
 *   3 page: route cards · arrow   |   external: address field · route tiles
 *   4 brand, title, second line
 */
(function () {
  'use strict';
  const ID = 's12';

  // identical copy of s11's final route pose (11-free.js) — the handoff across the cut
  const ROUTE_PTS = [[-40, 716], [380, 716], [760, 718], [920, 742], [958, 800], [960, 868]];
  const ROUTE_W = 5;
  const ARROW = { x: 960, y: 812, len: 56 };

  const URL = 'irreplaceable-ai.ru/learn';

  const SCHED = {
    60: {
      page: { cards: [0.0, 0.15, 0.3], cardD: 0.7, retract: [0.0, 1.0], brand: 0.1, title: 1.0, sub: 1.3, arrow: [1.2, 0.5], breathe: 2.0 },
      ext: { retract: [0.0, 0.9], brand: 0.1, title: 0.3, sub: 1.0, tiles: [1.2, 1.4, 1.6], breathe: 2.2 },
    },
    45: {
      page: { cards: [0.0, 0.03, 0.06], cardD: 0.44, retract: [0.0, 0.3], brand: 0.0, title: 0.05, sub: 0.1, arrow: [0.25, 0.25], breathe: 0.5 },
      ext: { retract: [0.0, 0.5], brand: 0.0, title: 0.05, sub: 0.3, tiles: [0.4, 0.5, 0.6], breathe: 1.1 },
    },
  };

  // arc-length fraction where the s11 curve enters the arrow shaft (y >= ARROW.y); t-independent
  let SPLIT = null;
  function splitFrac(U) {
    if (SPLIT != null) return SPLIT;
    const S = U.curve(ROUTE_PTS, 18);
    let tot = 0;
    let at = null;
    for (let i = 1; i < S.length; i++) {
      const d = Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]);
      if (at == null && S[i][1] >= ARROW.y) at = tot;
      tot += d;
    }
    SPLIT = at != null ? at / tot : 0.95;
    return SPLIT;
  }

  // routeCard with label 'both' + button stacks: glyph tile (y+44..138), short label (baseline y+208),
  // the full name (28 px, baseline y+260, wrapped at w-88) and the button (y+h-112..h-44). At the G1
  // size (480 x 360) the name runs into the button, so the card is drawn on a design box of height
  // >= CARD_MIN_H and uniformly scaled into G1; the box is also wide enough to keep every name on one
  // line. f depends only on the fonts; measured per frame (three measures), no state kept.
  const CARD_MIN_H = 400;
  function cardFit(U, ctx) {
    const R = U.CARD_ROW;
    let nw = 0;
    for (const r of U.ROUTES) nw = Math.max(nw, U.measure(ctx, r.name, { size: 28, weight: 400 }));
    return Math.min(R.h / CARD_MIN_H, R.w / (nw + 88 + 8), 1);
  }

  function drawPage(U, ctx, t, S, P) {
    const R = U.CARD_ROW;
    // 2 the s11 line: the tail retracts to the shaft, then the shaft hands over to the arrow
    const arrowA = U.k(t, S.arrow[0], S.arrow[1], 'inOutCubic');
    const ret = U.k(t, S.retract[0], S.retract[1] - S.retract[0], 'inOutCubic');
    const lineA = 1 - arrowA;
    if (lineA > 0) U.route(ctx, ROUTE_PTS, { from: ret * splitFrac(U), to: 1, width: ROUTE_W, alpha: 0.95 * lineA });

    // 3 route cards settle onto G1 (rise + fade) — they cover the retracting line
    const f = cardFit(U, ctx);
    for (let i = 0; i < 3; i++) {
      const a = U.k(t, S.cards[i], S.cardD, 'outCubic');
      if (a <= 0) continue;
      // exactly the G1 rect on screen; drawn on a taller design box and scaled by f so the 'both'
      // labels and the «Начать маршрут» button do not collide (see cardFit)
      ctx.save();
      ctx.translate(R.x[i], R.y);
      ctx.scale(f, f);
      U.routeCard(ctx, i, 0, 0, R.w / f, R.h / f, { a, label: 'both', button: true });
      ctx.restore();
    }

    // arrow + breathing glow (barely visible)
    if (arrowA > 0) {
      const br = t > S.breathe ? 0.5 - 0.5 * Math.cos(((t - S.breathe) / 2.0) * Math.PI * 2) : 0;
      U.arrowDown(ctx, ARROW.x, ARROW.y, ARROW.len, { p: 1, alpha: arrowA, glow: 0.25 * br });
    }

    // 4 brand + titles (hold still once in)
    U.brand(ctx, 960, 150, { size: 64, align: 'center', alpha: U.appear(t, S.brand, 0.4) });
    U.title(ctx, 'Выбери маршрут ниже', 960, 290, { size: 88, align: 'center', a: U.appear(t, S.title, 0.45) });
    const sa = U.appear(t, S.sub, 0.4);
    if (sa > 0) U.text(ctx, 'Сделай первый шаг сегодня', 960, 350 + (1 - sa) * 16, { size: 40, weight: 500, color: P.text2, align: 'center', alpha: sa });
  }

  function drawExternal(U, ctx, t, S, P, L) {
    // 2 the s11 line retracts into its head and goes out
    const ret = U.k(t, S.retract[0], S.retract[1] - S.retract[0], 'inOutCubic');
    if (ret < 1) U.route(ctx, ROUTE_PTS, { from: ret, to: 1, width: ROUTE_W, alpha: 0.95 * (1 - ret * ret) });

    // 3a the address — full from the first frame to the last
    const br = t > S.breathe ? 0.5 - 0.5 * Math.cos(((t - S.breathe) / 2.0) * Math.PI * 2) : 0;
    const fs = 84;
    const tw = U.measure(ctx, URL, { mono: true, size: fs, weight: 600 });
    const fw = Math.min(1640, tw + 128);
    const fh = 148;
    const fx = 960 - fw / 2;
    const fy = 376;
    U.card(ctx, fx, fy, fw, fh, { r: 28, fill: P.field, stroke: L.mix(P.border, P.accent, 0.7), lw: 2, glow: 0.55 + 0.15 * br });
    U.text(ctx, URL, 960, fy + fh / 2 + fs * 0.36, { mono: true, size: fs, weight: 600, color: P.accent, align: 'center' });

    // 3b «Выбери свой маршрут» + three route tiles
    const sa = U.appear(t, S.sub, 0.4);
    if (sa > 0) U.text(ctx, 'Выбери свой маршрут', 960, 622 + (1 - sa) * 16, { size: 40, weight: 500, color: P.text2, align: 'center', alpha: sa });
    const TW = 400;
    const TH = 112;
    const GAP = 40;
    const x0 = 960 - (3 * TW + 2 * GAP) / 2;
    for (let i = 0; i < 3; i++) {
      const a = U.appear(t, S.tiles[i], 0.4);
      if (a <= 0) continue;
      const R = U.ROUTES[i];
      const x = x0 + i * (TW + GAP);
      const y = 668 + (1 - a) * 20;
      ctx.save();
      ctx.globalAlpha *= a;
      U.card(ctx, x, y, TW, TH, { r: 22 });
      // glyph tile + short name, centred as a group in the tile
      const lw = U.measure(ctx, R.short, { size: 36, weight: 600 });
      const gx = x + TW / 2 - (60 + 26 + lw) / 2;
      U.glyph(ctx, R.glyph, gx + 30, y + TH / 2, 48, { draw: U.k(t, S.tiles[i], 0.5, 'outCubic') });
      U.text(ctx, R.short, gx + 60 + 26, y + TH / 2 + 13, { size: 36, weight: 600, color: P.text });
      ctx.restore();
    }

    // 4 brand + title
    U.brand(ctx, 960, 150, { size: 64, align: 'center', alpha: U.appear(t, S.brand, 0.4) });
    U.title(ctx, 'Открой бесплатный гид', 960, 300, { size: 88, align: 'center', a: U.appear(t, S.title, 0.45) });
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const U = FILM.ui;
      const L = FILM.lib;
      const P = L.pal;
      const t = Math.max(0, Math.min(tIn, info.dur));
      const S = SCHED[U.cut(info)];
      const external = U.variant(info) === 'external';

      // 1 background
      U.bg(ctx, { glow: { x: 960, y: external ? 470 : 560, r: 900, a: 0.1 } });

      if (external) drawExternal(U, ctx, t, S.ext, P, L);
      else drawPage(U, ctx, t, S.page, P);
    },
  });
})();
