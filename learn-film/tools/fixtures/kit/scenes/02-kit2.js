(function () {
  'use strict';
  FILM.scene({
    id: 'kit2',
    draw(ctx, t, info) {
      const U = FILM.ui;
      U.bg(ctx, {});
      U.briefCard(ctx, 100, 90, 620, 470, { rows: [1, 0.6, 0], focus: 1, T: info.T });
      U.planSheet(ctx, 1220, 90, 600, 700, { goal: 1, steps: [1, 1, 1], active: 1, who: 1 });
      U.schema(ctx, 700, 700, 0.62, { pulse: 0.3 });
      U.resumeCard(ctx, 100, 880 - 200, 1000, 180, {});
    },
  });
})();
