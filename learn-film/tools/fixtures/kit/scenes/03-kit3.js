(function () {
  'use strict';
  FILM.scene({
    id: 'kit3',
    draw(ctx, t, info) {
      const U = FILM.ui;
      U.bg(ctx, {});
      FILM.lib.camera(ctx, { x: 960, y: 750, zoom: 0.7 }, () => U.lessonPage(ctx, { video: 0.3, tpl: 1, vals: [1, 0.5, 0], critHi: 0, progress: 1, done: 1, taskFocus: 1, T: info.T }));
    },
  });
})();
