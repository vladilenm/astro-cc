/*
 * 05 · Понять, как устроен агент — shot 's05'
 * 60 cut: T 18–24 · 45 cut: T 13–19. Both cuts use the same local schedule (the 45 beats are the
 * 60 beats shifted by 5 s: 13.0 Модель, 14.2 / 15.1 links, 16.0 pulse, 17.2 Проверка, 18.0 sheet).
 *
 * Starts on G4 (the empty accent contour s04 ends on), which fills and becomes «Модель»
 * (ui.schema at 960, 560, scale 1 puts Модель exactly on G4). Ends on a clean hold: the schema on
 * the sheet «Мой агент» + caption pill — s06 crossfades in over it (0.32 s).
 *
 * Beats (local t):
 *   0.10–0.60  contour → Модель · 0.20 kicker · 0.30 title
 *   1.20       link → Инструменты (0.5 s), block at the link end
 *   2.10       link → Знания
 *   3.00–4.20  a light dot travels Модель → Инструменты → back (st.pulse)
 *   4.20       link → Проверка
 *   4.80–5.55  the schema scales to 0.72 onto the sheet «Мой агент» rising behind it
 *   5.10       caption pill «Схема своего агента» · hold to the end
 *
 * Layers back to front: bg · sheet · schema · G4 contour · kicker + title · caption.
 */
(function () {
  'use strict';

  const ID = 's05';
  const L = FILM.lib;
  const P = L.pal;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const A = (c, a) => L.rgba(c, a);

  // the sheet the schema lands on, and the schema's end placement on it
  const SHEET = { x: 500, y: 316, w: 920, h: 464 };
  const END = { cx: 960, cy: 588, s: 0.76 };

  const SCHED = {
    model: 0.1, contourOut: 0.12, kicker: 0.2, title: 0.3,
    lTools: 1.2, tools: 1.62,
    lKnow: 2.1, know: 2.52,
    pulse: 3.0, pulseDur: 1.2,
    lCheck: 4.2, check: 4.55,
    sheet: 4.8, sheetDur: 0.75,
    caption: 5.1,
  };

  /** The G4 contour: one rounded rect, accent 2 px stroke, soft glow, empty. (Same helper in 04.) */
  function g4Contour(ctx, x, y, w, h, r, a) {
    if (a <= 0) return;
    const U = FILM.ui;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.shadowColor = A(P.accent, 0.75);
    ctx.shadowBlur = 26 * FILM.S;
    U.rrect(ctx, x, y, w, h, r);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.accent;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const U = FILM.ui;
      const t = clamp(tIn, 0, info.dur);
      const S = SCHED;
      const G4 = U.G4;

      U.bg(ctx, {});

      // 1 · sheet «Мой агент» rises behind the schema ---------------------------
      const sp = U.k(t, S.sheet, S.sheetDur, 'inOutCubic');
      if (sp > 0) {
        const sa = U.k(t, S.sheet, S.sheetDur * 0.8, 'outCubic');
        ctx.save();
        ctx.globalAlpha *= sa;
        ctx.translate(0, (1 - sp) * 60);
        U.sheet(ctx, SHEET.x, SHEET.y, SHEET.w, SHEET.h, { file: U.ROUTES[1].file, title: 'Мой агент' });
        ctx.restore();
      }

      // 2 · the schema ----------------------------------------------------------
      const pr = t >= S.pulse && t <= S.pulse + S.pulseDur ? L.ease.inOutSine((t - S.pulse) / S.pulseDur) : null;
      const st = {
        model: U.k(t, S.model, 0.5, 'outCubic'),
        lTools: U.k(t, S.lTools, 0.5, 'inOutCubic'),
        tools: U.appear(t, S.tools, 0.4),
        lKnow: U.k(t, S.lKnow, 0.5, 'inOutCubic'),
        know: U.appear(t, S.know, 0.4),
        lCheck: U.k(t, S.lCheck, 0.45, 'inOutCubic'),
        check: U.appear(t, S.check, 0.4),
        pulse: pr,
        sub: true,
      };
      U.schema(ctx, lerp(G4.schemaCx, END.cx, sp), lerp(G4.schemaCy, END.cy, sp), lerp(1, END.s, sp), st);

      // 3 · the G4 contour s04 ended on, dissolving into Модель -------------------
      const ca = 1 - U.k(t, S.contourOut, 0.45, 'inOutCubic');
      if (ca > 0) g4Contour(ctx, G4.x, G4.y, G4.w, G4.h, G4.r, ca);

      // 4 · kicker + title --------------------------------------------------------
      U.kicker(ctx, 'Маршрут 2 · AI-инженерия', U.TITLE.x, U.TITLE.kickerY, { alpha: U.appear(t, S.kicker, 0.4) });
      U.title(ctx, U.ROUTES[1].name, U.TITLE.x, U.TITLE.y, { size: U.TITLE.size, accent: 'AI-инженерии', a: U.appear(t, S.title, 0.45) });

      // 5 · caption pill ------------------------------------------------------------
      const cp = U.appear(t, S.caption, 0.4);
      if (cp > 0) {
        ctx.save();
        ctx.globalAlpha *= cp;
        ctx.translate(0, (1 - cp) * 20);
        U.pill(ctx, 960, 796, U.ROUTES[1].resultLong, { size: 28, align: 'center' });
        ctx.restore();
      }
    },
  });
})();
