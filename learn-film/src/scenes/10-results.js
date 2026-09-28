/*
 * 10 · Что останется у человека — s10
 * 60 cut: T 45–50 (5 s) · 45 cut: T 34–38 (4 s) · fade in 0.32 s from s09 (frame 0 = bg only).
 *
 * Three result documents in a row — «Бриф агента», «Схема агента», «План проекта» — under the caption
 * «Результат твоего маршрута». The route line runs under the row as the cards arrive. Then one card
 * (the brief: the route we walked in 07–09) takes the glow and the others step back — a route gives
 * ONE of these results; small «или» chips between the cards say the same. Last 0.5 s: the row shrinks
 * a little toward the centre, making room for s11.
 *
 * Layers (back to front):
 *   1 ui.bg
 *   2 route line under the row (decoration, y 848)
 *   3 the three cards (briefCard compact · sheet + schema · planSheet compact), under the shrink transform
 *   4 «или» chips in the gaps
 *   5 title «Результат твоего маршрута» (screen-fixed, centred, holds)
 */
(function () {
  'use strict';
  const ID = 's10';

  // ---------------------------------------------------------------- geometry
  // three ~520 px cards filling the content zone x 120..1800
  const ROW = { x: [120, 700, 1280], y: 290, w: 520, h: 520 };
  const ROW_CX = 960;
  const ROW_CY = ROW.y + ROW.h / 2;
  const LINE_Y = 848;
  const TITLE_Y = 200;
  const BRIEF_W = 560;
  const HI = 0; // the highlighted result: the brief (the agent route walked through in 07–09)

  // ---------------------------------------------------------------- schedules (local seconds)
  const SCHED = {
    60: { title: 0.08, cards: [0.0, 1.0, 2.0], ili: [1.2, 2.2], line: [0.1, 2.5], hi: 3.0, shrink: 4.5, dur: 5 },
    45: { title: 0.06, cards: [0.0, 0.5, 1.0], ili: [0.7, 1.2], line: [0.1, 1.5], hi: 1.8, shrink: 3.5, dur: 4 },
  };

  function drawSchemaCard(U, ctx, x, y, w, h, glow) {
    const body = U.sheet(ctx, x, y, w, h, { file: 'agent-architecture.md', title: 'Схема агента', titleSize: 34, glow });
    // the diagram is 1080 x 330 at s = 1 (Инструменты -540 .. Знания +540, Модель top -125 .. Проверка bottom +205)
    const s = Math.min(body.w / 1090, 1);
    const cy = body.y + (h - (body.y - y) - 24) / 2 - (205 - 125) / 2 * s + 10;
    U.schema(ctx, x + w / 2, cy, s, { sub: false });
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const U = FILM.ui;
      const L = FILM.lib;
      const P = L.pal;
      const t = Math.max(0, Math.min(tIn, info.dur));
      const S = SCHED[U.cut(info)];

      // 1 background
      U.bg(ctx, { glow: { x: 960, y: 540, r: 900, a: 0.09 } });

      const hi = U.k(t, S.hi, 0.5, 'inOutCubic');
      const shrink = U.k(t, S.shrink, 0.5, 'inOutCubic');
      const sc = 1 - 0.1 * shrink;

      // 2 route line under the row — its head travels as the cards arrive
      const lp = U.k(t, S.line[0], S.line[1] - S.line[0], 'inOutCubic');
      const lx0 = ROW_CX + (ROW.x[0] + 24 - ROW_CX) * sc;
      const lx1 = ROW_CX + (ROW.x[2] + ROW.w - 24 - ROW_CX) * sc;
      const ly = ROW_CY + (LINE_Y - ROW_CY) * sc;
      if (lp > 0) {
        U.route(ctx, [[lx0, ly], [lx1, ly]], { straight: true, to: lp, width: 4, alpha: 0.75 - 0.2 * hi, head: lp < 1 });
        // the stretch under the chosen card stays bright
        if (hi > 0) {
          const hx0 = ROW_CX + (ROW.x[HI] + 24 - ROW_CX) * sc;
          const hx1 = ROW_CX + (ROW.x[HI] + ROW.w - 24 - ROW_CX) * sc;
          U.route(ctx, [[hx0, ly], [hx1, ly]], { straight: true, width: 4, alpha: 0.9 * hi, head: false });
        }
      }

      // 3 the cards
      ctx.save();
      ctx.translate(ROW_CX, ROW_CY);
      ctx.scale(sc, sc);
      ctx.translate(-ROW_CX, -ROW_CY);
      for (let i = 0; i < 3; i++) {
        const a = U.appear(t, S.cards[i], 0.4);
        if (a <= 0) continue;
        const isHi = i === HI;
        const glow = isHi ? hi : 0;
        const alpha = a * (isHi ? 1 : 1 - 0.45 * hi);
        const x = ROW.x[i];
        const y = ROW.y + (1 - a) * 28;
        ctx.save();
        ctx.globalAlpha *= alpha;
        // a soft pop: 0.96 → 1 around the card centre, plus the chosen one lifts a hair
        const s = (0.96 + 0.04 * a) * (1 + 0.02 * glow);
        ctx.translate(x + ROW.w / 2, y + ROW.h / 2);
        ctx.scale(s, s);
        ctx.translate(-(x + ROW.w / 2), -(y + ROW.h / 2));
        if (i === 0) {
          // the brief's longest value («Проверить на телефоне») needs a 560-wide sheet: draw it at 560 and
          // fit it into the 520 slot (type ends up ~7 % smaller than on the other two sheets)
          const f = ROW.w / BRIEF_W;
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(f, f);
          U.briefCard(ctx, 0, 0, BRIEF_W, ROW.h / f, { compact: true, glow, rows: [1, 1, 1], labels: 1 });
          ctx.restore();
        }
        else if (i === 1) drawSchemaCard(U, ctx, x, y, ROW.w, ROW.h, glow);
        else U.planSheet(ctx, x, y, ROW.w, ROW.h, { compact: true, title: 'План проекта', glow, goal: 1, steps: [1, 1, 1], active: 0, who: 1 });
        ctx.restore();
      }

      // 4 «или» chips between the cards: one route, one of these results
      for (let g = 0; g < 2; g++) {
        const a = U.appear(t, S.ili[g], 0.35);
        if (a <= 0) continue;
        const gx = (ROW.x[g] + ROW.w + ROW.x[g + 1]) / 2;
        const gy = ROW_CY;
        ctx.save();
        ctx.globalAlpha *= a;
        U.card(ctx, gx - 29, gy - 24, 58, 48, { r: 24, fill: P.cardHi, stroke: P.borderHi, shadow: 0.6 });
        U.text(ctx, 'или', gx, gy + 7, { size: 22, weight: 600, color: P.text2, align: 'center' });
        ctx.restore();
      }
      ctx.restore();

      // 5 title — appears once, then holds still
      U.title(ctx, 'Результат твоего маршрута', 960, TITLE_Y, { size: 76, align: 'center', a: U.appear(t, S.title, 0.45), accent: 'маршрута' });
    },
  });
})();
