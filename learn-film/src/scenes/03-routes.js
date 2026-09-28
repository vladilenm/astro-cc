/*
 * 03 · Выбор из трёх задач — shot s03
 * 60 cut: T 9–12 · 45 cut: T 5–7
 *
 * Starts on exactly the s02 end pose. The three contour cards on G1 fill one by one and get their
 * short labels (three tactile accents); the title swaps to «Три задачи. Три маршрута»; the route
 * line runs along the card tops linking 1 → 2 → 3, its head gliding slowly through the hold. Then
 * card 0 grows into G3 (label → the full route name, glow → 1) while everything else recedes.
 *
 * Layers (back to front)
 *   1. ui.bg
 *   2. cards 1 and 2 (contour → filled → dim and slide back)
 *   3. card 0 (contour → filled → G3)
 *   4. route line along the tops (+ the s02 thin line fading out)
 *   5. brand · titles · author (fading)
 *
 * End pose (from the last frames, and at t = dur): ONLY ui.bg + ui.routeCard(ctx, 0, G3.x, G3.y,
 * G3.w, G3.h, { label: 'name', glow: 1 }). s04 starts from exactly this.
 */
(function () {
  'use strict';
  const ID = 's03';
  const U = FILM.ui;
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, q) => a + (b - a) * q;

  const CR = U.CARD_ROW;
  const G3 = U.G3;

  const SCHED = {
    60: {
      prevTitle: 'Бесплатный гид по AI-разработке',
      prevAccent: 'AI-разработке',
      author: true,
      thinLine: true, // s02 ends with a thin route line under the author
      oldOut: [0.0, 0.2],
      newIn: 0.12, // appear 0.3 s → reads by T 9.4
      authorOut: [0.0, 0.3],
      fill: [0.0, 0.2, 0.4], // T 9.0 / 9.2 / 9.4
      fillDur: 0.3,
      route: [0.3, 0.5, 2.05], // draw-in start, draw-in length, glide end
      routeOut: [2.05, 0.3],
      move: [2.2, 0.72], // card 0 → G3, lands at t 2.92 (last frame 2.96 holds it)
      label: [2.25, 0.5], // 'short' → 'name'
      recede: [2.2, 0.5], // cards 1/2, brand, title, route
    },
    45: {
      prevTitle: 'Бесплатный гид',
      prevAccent: null,
      author: false,
      thinLine: false,
      oldOut: [0.0, 0.15],
      newIn: 0.08,
      authorOut: null,
      fill: [0.0, 0.1, 0.2],
      fillDur: 0.25,
      route: [0.2, 0.4, 1.3],
      routeOut: [1.3, 0.25],
      move: [1.4, 0.52], // lands at t 1.92
      label: [1.42, 0.4],
      recede: [1.4, 0.35],
    },
  };

  // --- the s02 contour card (verbatim from 02-guide.js) ------------------------------------------
  function contour(ctx, i, x, y, w, h, alpha, draw, tilt, pivot) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (tilt) {
      ctx.translate(pivot[0], pivot[1]);
      ctx.rotate(tilt);
      ctx.translate(-pivot[0], -pivot[1]);
    }
    U.routeCard(ctx, i, x, y, w, h, { contour: true, label: 'none', index: false, draw });
    // the kit's contour stroke (P.border, 1.5 px) vanishes on a phone: restate it brighter
    U.card(ctx, x, y, w, h, { r: 24, dashed: true, stroke: P.text3, lw: 2 });
    ctx.restore();
  }

  /** filled route card with a tactile pop (scale about its centre) */
  function filled(ctx, i, x, y, w, h, o, alpha, pop) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (pop) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(1 + pop, 1 + pop);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    U.routeCard(ctx, i, x, y, w, h, o);
    ctx.restore();
  }

  /** the label zone of a route card (inside its rounded body; below the glyph tile) */
  function labelClip(ctx, x, y, w, h) {
    const gs = Math.min(76, w * 0.16);
    // edges snapped to device pixels: a partially covered clip row would darken (the overlay's
    // drop shadow shows through its partial fill)
    const S = FILM.S || 1;
    const px = (v) => Math.round(v * S) / S;
    const x0 = px(x + 6);
    const x1 = px(x + w - 6);
    const y0 = px(y + 44 + gs * 1.24 + 8);
    const y1 = px(y + h - 6);
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.clip();
  }

  // the route along the card tops: 1 → 2 → 3, dipping onto each card's top edge
  const TOP_ROUTE = [
    [CR.x[0] + CR.w / 2, CR.y],
    [(CR.x[0] + CR.w + CR.x[1]) / 2, CR.y - 34],
    [CR.x[1] + CR.w / 2, CR.y],
    [(CR.x[1] + CR.w + CR.x[2]) / 2, CR.y - 34],
    [CR.x[2] + CR.w / 2, CR.y],
  ];

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const t = clamp(tIn, 0, info.dur);
      const cut = U.cut(info);
      const S = SCHED[cut];

      // 1. background
      U.bg(ctx, {});

      const mv = E.inOutCubic(clamp((t - S.move[0]) / S.move[1]));
      if (mv >= 1) {
        // the G3 contract pose, nothing else
        U.routeCard(ctx, 0, G3.x, G3.y, G3.w, G3.h, { label: 'name', glow: 1 });
        return;
      }
      const rc = E.inOutCubic(clamp((t - S.recede[0]) / S.recede[1])); // 0 → 1 as the rest recedes

      // 2. cards 1 and 2
      const fillK = (i) => clamp((t - S.fill[i]) / S.fillDur);
      for (let i = 2; i >= 1; i--) {
        const f = fillK(i);
        const fe = E.outCubic(f);
        ctx.save();
        if (rc > 0) {
          // dim and slide back: shrink a little and drift right, fading out
          const sc = 1 - 0.06 * rc;
          const cx = CR.x[i] + CR.w / 2 + 70 * rc * i;
          const cy = CR.y + CR.h / 2 + 10 * rc;
          ctx.translate(cx, cy);
          ctx.scale(sc, sc);
          ctx.translate(-(CR.x[i] + CR.w / 2), -(CR.y + CR.h / 2));
          ctx.globalAlpha *= 1 - rc;
        }
        contour(ctx, i, CR.x[i], CR.y, CR.w, CR.h, 1 - fe, 1, 0, null);
        filled(ctx, i, CR.x[i], CR.y, CR.w, CR.h, { label: 'short', dim: rc }, fe, 0.022 * Math.sin(Math.PI * f));
        ctx.restore();
      }

      // 3. card 0: fill, then grow into G3
      {
        const f = fillK(0);
        const fe = E.outCubic(f);
        const x = lerp(CR.x[0], G3.x, mv);
        const y = lerp(CR.y, G3.y, mv);
        const w = lerp(CR.w, G3.w, mv);
        const h = lerp(CR.h, G3.h, mv);
        if (t < S.move[0]) {
          contour(ctx, 0, CR.x[0], CR.y, CR.w, CR.h, 1 - fe, 1, 0, null);
          filled(ctx, 0, CR.x[0], CR.y, CR.w, CR.h, { label: 'short' }, fe, 0.022 * Math.sin(Math.PI * f));
        } else {
          const glow = mv;
          const lq = E.inOutCubic(clamp((t - S.label[0]) / S.label[1]));
          U.routeCard(ctx, 0, x, y, w, h, { label: 'name', glow });
          if (lq < 1) {
            // label swap inside the label zone only (clipped: no double shadow, exact G3 when done):
            // first the short label fades to an empty card, then the name fades up
            const aNone = 1 - clamp(lq * 2 - 1);
            const aShort = 1 - clamp(lq * 2);
            ctx.save();
            labelClip(ctx, x, y, w, h);
            ctx.globalAlpha *= aNone;
            U.routeCard(ctx, 0, x, y, w, h, { label: 'none', glow });
            ctx.restore();
            if (aShort > 0) {
              ctx.save();
              labelClip(ctx, x, y, w, h);
              ctx.globalAlpha *= aShort;
              U.routeCard(ctx, 0, x, y, w, h, { label: 'short', glow });
              ctx.restore();
            }
          }
        }
      }

      // 4. route lines
      if (S.thinLine) {
        const a = 1 - E.inOutCubic(clamp(t / 0.3));
        if (a > 0) U.route(ctx, [[560, 395], [1360, 395]], { straight: true, to: 1, width: 2, glow: 0.4, alpha: 0.75 * a });
      }
      {
        const [r0, rd, r1] = S.route;
        const drawIn = E.outCubic(clamp((t - r0) / rd));
        const glide = E.inOutSine(clamp((t - r0 - rd) / (r1 - r0 - rd)));
        const to = 0.42 * drawIn + 0.58 * glide;
        const ra = 1 - E.inOutCubic(clamp((t - S.routeOut[0]) / S.routeOut[1]));
        if (to > 0 && ra > 0) U.route(ctx, TOP_ROUTE, { to, width: 3, glow: 0.8, alpha: ra });
      }

      // 5. title band
      const ta = 1 - rc;
      if (ta > 0) {
        U.brand(ctx, 960, 150, { size: 64, align: 'center', alpha: ta });
        const oa = 1 - E.inOutCubic(clamp((t - S.oldOut[0]) / S.oldOut[1]));
        if (oa > 0) {
          ctx.save();
          ctx.globalAlpha *= oa;
          U.title(ctx, S.prevTitle, 960, 290, { size: 76, align: 'center', accent: S.prevAccent || undefined, a: 1 });
          ctx.restore();
        }
        ctx.save();
        ctx.globalAlpha *= ta;
        U.title(ctx, 'Три задачи. Три маршрута', 960, 290, { size: 76, align: 'center', accent: 'Три маршрута', a: U.appear(t, S.newIn, 0.3), rise: 20 });
        ctx.restore();
        if (S.author) {
          const aa = 1 - E.inOutCubic(clamp((t - S.authorOut[0]) / S.authorOut[1]));
          if (aa > 0) U.author(ctx, 960, 360, { align: 'center', size: 48, alpha: aa * ta });
        }
      }
    },
  });
})();
