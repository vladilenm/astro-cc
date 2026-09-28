// STUB — replaced by the scene agent.
(function () {
  "use strict";
  FILM.scene({
    id: "s02",
    draw(ctx, t, info) {
      const U = FILM.ui;
      U.bg(ctx, {});
      U.kicker(ctx, "s02 · stub", 120, 150);
      U.title(ctx, "Появляется точка входа", 120, 260, { size: 76 });
      U.progress(ctx, 120, 820, 1680, info.p, {});
    },
  });
})();
