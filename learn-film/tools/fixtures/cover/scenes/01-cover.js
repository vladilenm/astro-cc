// Cover: brand, the question, three route glyphs joined by the violet route line, the subtitle.
(function () {
  'use strict';
  FILM.scene({
    id: 'cover',
    draw(ctx, t, info) {
      const U = FILM.ui;
      const P = FILM.lib.pal;
      U.bg(ctx, { glow: { x: 960, y: 560, r: 900, a: 0.16 } });
      U.brand(ctx, 960, 150, { size: 64, align: 'center' });
      U.title(ctx, 'Что ты сделаешь с AI?', 960, 360, { size: 112, align: 'center', accent: 'AI?' });
      const xs = [560, 960, 1360];
      const y = 620;
      U.route(ctx, [[360, y + 40], [560, y], [760, y + 30], [960, y], [1160, y + 30], [1360, y], [1560, y + 40]], { width: 5, head: true, to: 1 });
      ['agent', 'engineering', 'project'].forEach((g, i) => {
        U.card(ctx, xs[i] - 110, y - 110, 220, 220, { r: 40, glow: i === 1 ? 0.6 : 0.3 });
        U.glyph(ctx, g, xs[i], y, 120, { tile: false, lw: 7 });
        U.text(ctx, FILM.ui.ROUTES[i].short, xs[i], y + 180, { size: 40, weight: 600, align: 'center' });
      });
      U.text(ctx, 'Три бесплатных маршрута', 960, 930, { size: 48, weight: 500, align: 'center', color: P.text2 });
    },
  });
})();
