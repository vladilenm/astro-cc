/*
 * 02 · Появляется понятная точка входа — shot s02
 * 60 cut: T 4–9 · 45 cut: T 3–5
 *
 * Starts on exactly the s01 end pose (FILM.ui.G2 tabs + the empty «Мой проект» card + the question).
 * The question fades, the tabs and the project card align and shed detail into three dashed contour
 * cards on G1 (CARD_ROW). Brand, title and author assemble in the title band; the route line draws
 * straight and calm under them, then thins. The route glyphs draw on inside the contour cards.
 *
 * Mapping G2 → G1: tab «Видео про AI» → card 0 · «Мой проект» → card 1 · «Новый инструмент» and
 * «Сохранить на потом» → card 2 (the note tab dissolves into it).
 *
 * Layers (back to front)
 *   1. ui.bg
 *   2. project card → contour card 1
 *   3. tabs → contour cards 0 / 2 (tab content fades while the contour fades in)
 *   4. brand · title · author · route line
 *   5. the s01 question, fading out over the first frames
 *
 * End pose (60 at t 5, 45 at t 2): brand + title (+ author and a thin route line in 60) + three dashed
 * contour cards with glyphs on CARD_ROW (no labels, no index). s03 starts from exactly this.
 */
(function () {
  'use strict';
  const ID = 's02';
  const U = FILM.ui;
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, q) => a + (b - a) * q;

  // --- shared with 01-question.js (verbatim copy): the empty project card ------------------------
  /** the dashed «Мой проект» card; ca = content alpha (caption + plus), k = 0 project look → 1 contour look */
  function drawProject(ctx, x, y, w, h, ca, k) {
    U.card(ctx, x, y, w, h, { r: 24, dashed: true, stroke: L.mix(P.borderHi, P.text3, k || 0), lw: 2 });
    if (ca <= 0) return;
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.save();
    ctx.globalAlpha *= ca;
    // a dashed ring with a plus: "nothing here yet"
    ctx.beginPath();
    ctx.arc(cx, cy - 34, 50, 0, Math.PI * 2);
    ctx.setLineDash([7, 7]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.borderHi;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 34);
    ctx.lineTo(cx + 18, cy - 34);
    ctx.moveTo(cx, cy - 52);
    ctx.lineTo(cx, cy - 16);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.text3;
    ctx.stroke();
    ctx.restore();
    U.text(ctx, 'Мой проект', cx, cy + 66, { size: 40, weight: 600, color: P.text2, align: 'center', alpha: ca });
    U.text(ctx, 'пусто', cx, cy + 112, { mono: true, size: 22, upper: true, tracking: 3.5, color: P.text3, align: 'center', alpha: ca });
  }

  const G2 = U.G2;
  const CR = U.CARD_ROW;
  const TAB_EAR = 50; // ui.tabCard: the card body starts 50 px below the tab's y
  const TAB_TO_CARD = [0, 2, 2];

  const SCHED = {
    60: {
      qOut: 0.3, // the s01 question fades
      morph: 0.7, // tabs → contour cards (inOutCubic)
      brand: 0.7,
      title: 1.0,
      titleText: 'Бесплатный гид по AI-разработке',
      accent: 'AI-разработке',
      author: 1.4,
      route: [1.3, 0.9], // draws x 560 → 1360 at y 395
      thin: [2.3, 0.5], // … then settles to a thin calm line
      glyphs: [2.4, 3.1, 3.8], // T 6.4 / 7.1 / 7.8
      glyphDur: 0.5,
    },
    45: {
      qOut: 0.2,
      morph: 0.6,
      brand: 0.4,
      title: 0.55,
      titleText: 'Бесплатный гид',
      accent: null,
      author: null,
      route: null,
      thin: null,
      glyphs: [1.0, 1.2, 1.4], // T 4.0 / 4.2 / 4.4
      glyphDur: 0.45,
    },
  };

  /** a contour route card, optionally rotated about the centre of the rect (tx, ty, tw, th) */
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

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const t = clamp(tIn, 0, info.dur);
      const cut = U.cut(info);
      const S = SCHED[cut];

      // 1. background
      U.bg(ctx, {});

      const u = clamp(t / S.morph); // linear morph progress
      const m = E.inOutCubic(u);
      const glyphP = (i) => E.inOutSine(clamp((t - S.glyphs[i]) / S.glyphDur));

      if (u < 1) {
        // 2. project → contour card 1
        const pr = G2.project;
        const px = lerp(pr.x, CR.x[1], m);
        const py = lerp(pr.y, CR.y, m);
        const pw = lerp(pr.w, CR.w, m);
        const ph = lerp(pr.h, CR.h, m);
        drawProject(ctx, px, py, pw, ph, 1 - E.inOutCubic(clamp(u / 0.55)), m);

        // 3. tabs → contour cards 0 and 2
        const contentA = 1 - E.inOutCubic(clamp(u / 0.8)); // tab content fades out
        const lineA = E.inOutCubic(clamp((u - 0.15) / 0.85)); // the contour fades in
        for (let i = 0; i < 3; i++) {
          const g = G2.tabs[i];
          const c = TAB_TO_CARD[i];
          const x = lerp(g.x, CR.x[c], m);
          const y = lerp(g.y, CR.y - TAB_EAR, m);
          const w = lerp(g.w, CR.w, m);
          const h = lerp(g.h, CR.h + TAB_EAR, m);
          const tilt = lerp(g.tilt, 0, m);
          const pivot = [x + w / 2, y + h / 2];
          if (i !== 2) contour(ctx, c, x, y + TAB_EAR, w, h - TAB_EAR, lineA, 0, tilt, pivot);
          const a = i === 2 ? 1 - E.inOutCubic(clamp(u / 0.6)) : contentA;
          if (a > 0) U.tabCard(ctx, x, y, w, h, { title: g.title, kind: g.kind, fav: g.fav, tilt, alpha: a });
        }
      } else {
        // the row of contour cards on G1, glyphs drawing on
        for (let i = 0; i < 3; i++) contour(ctx, i, CR.x[i], CR.y, CR.w, CR.h, 1, glyphP(i), 0, null);
      }

      // 4. title band: brand, title, author, the calm route line
      const ba = U.appear(t, S.brand, 0.4);
      if (ba > 0) {
        ctx.save();
        ctx.translate(0, (1 - ba) * 20);
        U.brand(ctx, 960, 150, { size: 64, align: 'center', alpha: ba });
        ctx.restore();
      }
      U.title(ctx, S.titleText, 960, 290, { size: 76, align: 'center', accent: S.accent || undefined, a: U.appear(t, S.title, 0.4), rise: 24 });
      if (S.author != null) {
        const aa = U.appear(t, S.author, 0.4);
        if (aa > 0) {
          ctx.save();
          ctx.translate(0, (1 - aa) * 16);
          U.author(ctx, 960, 360, { align: 'center', size: 48, alpha: aa });
          ctx.restore();
        }
      }
      if (S.route) {
        const to = E.inOutCubic(clamp((t - S.route[0]) / S.route[1]));
        const th = E.inOutCubic(clamp((t - S.thin[0]) / S.thin[1]));
        if (to > 0) U.route(ctx, [[560, 395], [1360, 395]], { straight: true, to, width: lerp(4, 2, th), glow: lerp(1, 0.4, th), alpha: lerp(1, 0.75, th) });
      }

      // 5. the s01 question, carried over the cut and faded
      const qa = 1 - E.inOutCubic(clamp(t / S.qOut));
      if (qa > 0) {
        ctx.save();
        ctx.globalAlpha *= qa;
        U.title(ctx, 'С чего начать?', 960, 200, { size: 88, align: 'center', a: 1 });
        ctx.restore();
      }
    },
  });
})();
