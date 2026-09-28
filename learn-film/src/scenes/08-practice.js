// STUB — replaced by the scene agent.
(function () {
  "use strict";
  FILM.scene({
    id: "s08",
    draw(ctx, t, info) {
      const U = FILM.ui;
      U.bg(ctx, {});
      U.kicker(ctx, "s08 · stub", 120, 150);
      U.title(ctx, "Сделать на своей задаче", 120, 260, { size: 76 });
      U.progress(ctx, 120, 820, 1680, info.p, {});
    },
  });
})();
