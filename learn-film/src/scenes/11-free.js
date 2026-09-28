/*
 * 11 · Снять барьер — s11
 * 60 cut: T 50–54 (4 s) · 45 cut: T 38–41 (3 s) · hard cut in from s10, hard cut out to s12.
 *
 * A small constant kicker «Материалы гида» over two big centred lines «Бесплатно» / «Без регистрации».
 * The route line enters from the left under the words, runs toward a point below the centre and turns
 * down — toward where s12's route cards will stand. Its final pose is the handoff to s12: s12 starts
 * from exactly this curve (ROUTE_PTS is mirrored there) and folds it into ui.arrowDown(960, 812, 56).
 *
 * Nothing here refers to paid products: the promise is about the open guide's materials only.
 *
 * Layers (back to front):
 *   1 ui.bg
 *   2 route line (from the left, bends down at x 960 to y 868)
 *   3 kicker «Материалы гида»
 *   4 «Бесплатно», «Без регистрации»
 */
(function () {
  'use strict';
  const ID = 's11';

  // shared with s12 (12-cta.js keeps an identical copy): the line's final pose
  const ROUTE_PTS = [[-40, 716], [380, 716], [760, 718], [920, 742], [958, 800], [960, 868]];
  const ROUTE_W = 5;

  const TEXT = { kickerY: 318, l1: 468, l2: 600, size: 108 };

  const SCHED = {
    // l1 starts a hair before the cut so its first frame already shows the word rising
    60: { kicker: 0, l1: -0.08, l2: 0.6, line: [0.5, 2.3] },
    45: { kicker: 0, l1: -0.08, l2: 0.05, line: [0.2, 1.6] },
  };

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const U = FILM.ui;
      const L = FILM.lib;
      const P = L.pal;
      const t = Math.max(0, Math.min(tIn, info.dur));
      const S = SCHED[U.cut(info)];

      // 1 background — the glow sits on the words
      U.bg(ctx, { glow: { x: 960, y: 500, r: 820, a: 0.1 } });

      // 2 route line — draws on, then holds with a calm head
      const lp = U.k(t, S.line[0], S.line[1] - S.line[0], 'inOutCubic');
      if (lp > 0) U.route(ctx, ROUTE_PTS, { to: lp, width: ROUTE_W, alpha: 0.95 });

      // 3 kicker
      const ka = S.kicker <= 0 ? 1 : U.appear(t, S.kicker, 0.35); // constant: on from the cut
      if (ka > 0) {
        ctx.save();
        ctx.globalAlpha *= ka;
        ctx.translate(0, (1 - ka) * 16);
        U.kicker(ctx, 'Материалы гида', 960, TEXT.kickerY, { size: 28, align: 'center' });
        ctx.restore();
      }

      // 4 the two lines — appear once (outCubic, 24 px rise), then hold still
      U.title(ctx, 'Бесплатно', 960, TEXT.l1, { size: TEXT.size, align: 'center', a: U.appear(t, S.l1, 0.45), accent: 'Бесплатно' });
      U.title(ctx, 'Без регистрации', 960, TEXT.l2, { size: TEXT.size, align: 'center', a: U.appear(t, S.l2, 0.45), color: P.text });
    },
  });
})();
