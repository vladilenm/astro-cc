(function () {
  'use strict';
  FILM.scene({
    id: 'kit',
    draw(ctx, t, info) {
      const U = FILM.ui;
      const P = FILM.lib.pal;
      U.bg(ctx, {});
      U.brand(ctx, 120, 130, { size: 64 });
      U.author(ctx, 620, 130, {});
      U.kicker(ctx, 'Маршрут 1 · агент', 120, 250);
      U.title(ctx, 'Бесплатный гид по AI-разработке', 120, 330, { size: 72, accent: 'AI-разработке' });
      for (let i = 0; i < 3; i++) U.routeCard(ctx, i, 120 + i * 400, 400, 370, 380, { button: i === 0, hover: i === 0 ? 1 : 0, glow: i === 1 ? 1 : 0, label: 'both' });
      U.route(ctx, [[1330, 420], [1450, 380], [1560, 470], [1700, 430]], { to: 0.8 + 0.2 * info.p, T: info.T, wobble: 6 });
      U.tabCard(ctx, 1330, 480, 460, 260, { title: 'Видео про AI', fav: P.tabRed, kind: 'video' });
      const b = U.window(ctx, 1330, 760, 460, 110, {});
      U.button(ctx, b.x + 30, b.y + 10, 180, 44, 'Купить', { size: 22 });
      U.check(ctx, b.x + 300, b.y + 32, 22, 1);
      U.pill(ctx, 1560, 80, 'Проверено', { color: P.green, icon: 'check' });
      U.field(ctx, 1260, 180, 560, 72, { label: 'Задача', value: 'Поправить кнопку', p: 0.6, caret: info.T, labelW: 170, size: 30 });
      U.progress(ctx, 1260, 290, 300, 0.33);
      U.text(ctx, '1 / 3', 1580, 300, { mono: true, size: 26, color: P.text2 });
      U.cursor(ctx, 380, 720, { press: 0.4 });
      U.block(ctx, 1000, 180, 220, 90, 'Модель', { accent: true });
      U.link(ctx, 900, 250, 1100, 250, 1, { pulse: 0.5 });
      U.arrowDown(ctx, 1700, 300, 80, {});
    },
  });
})();
