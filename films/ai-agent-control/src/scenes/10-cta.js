/*
 * 10 cta: Переход на форму. T 52.0–60.0 (shot-local t 0–8), interface plate.
 * Enters with a 0.5 s fade from 09 (core); grain 0.6 (timeline). No captions in this shot.
 *
 * One clear action: the free lesson + source code. The link is Instagram's native sticker, placed by the
 * author inside L.GEO.STICKER; this shot only points at it. Nothing is drawn inside the zone and nothing
 * here looks tappable (no drawn button): type, one arrow, four corner ticks.
 *
 * Layers, back to front:
 *   1. plate          ui.bg interface, fixed offset (no drift: the CTA holds perfectly still)
 *   2. app ghost      ui.app at GEO.APP with the search bar (no query), blurred 4 px, alpha ~0.1, masked to a
 *                     soft band so it fades out well above the sticker zone; a cached sprite (pure of FILM.S)
 *   3. tag            // бесплатный урок, centred
 *   4. headline       От AI-кодинга / к [AI Engineering], 92 px, centred
 *   5. subline        Бесплатный урок + исходный код
 *   6. action line    Забрать бесплатный урок
 *   7. arrow          orange, down into the zone; its glow stays above the zone edge
 *   8. corner ticks   ui.corners just outside the zone, converging onto it (focus lock)
 *
 * Beats (global T): 52.25 tag + headline · 52.75 subline · 53.25 action line · 53.50 arrow draws on ·
 * 53.625 ticks lock in · settled 53.92 · static 54.00–60.00 (t is frozen at SETTLE below).
 */
(function () {
  'use strict';

  const ID = 'cta';
  const FR = 1 / 24;

  // ---- beats (shot-local seconds) ----------------------------------------------
  const B_HEAD = 0.25; // T 52.25 tag types in, headline rises in
  const B_SUB = 0.75; // T 52.75 subline fades up
  const B_ACT = 1.25; // T 53.25 action line rises in
  const B_ARROW = 1.5; // T 53.50 arrow draws on (9 frames) — sfx blip
  const B_TICKS = 1.625; // T 53.625 corner ticks lock onto the zone (8 frames)
  const SETTLE = 2.0; // T 54.00 every value above has saturated; the frame is frozen from here to 60.0

  // ---- layout (1080-frame px; baselines) ------------------------------------------
  const CX = 540;
  const Y_TAG = 330;
  const Y_HEAD = 470; // first baseline; the second sits at 470 + 92 * 1.1 = 571.2
  const HEAD_SIZE = 92;
  const Y_SUB = 680;
  const Y_ACT = 1054;
  const ARROW_Y0 = 1094;
  const ARROW_Y1 = 1172; // head tip lands at 1172 + 0.35 * 22 = 1179.7, ~10 px above the zone
  const ARROW_LW = 5;
  const ARROW_HEAD = 22;
  const TICK_LEN = 30;
  const TICK_LW = 3;
  const PLATE_OY = -52 * 12; // the drift value at this shot's first frame, held constant

  const TAG = '// бесплатный урок';
  const HEAD = ['От AI-кодинга', 'к [AI Engineering]'];
  const SUB = 'Бесплатный урок + исходный код';
  const ACT = 'Забрать бесплатный урок';

  // ---- the app ghost: sharp render → blur → vertical band mask, cached per render scale ----
  const APP_ALPHA = 0.1;
  const GHOST_M = 64; // margin around the window for the blur and the panel shadow
  // band mask stops [y, alpha] (logical px): opens below the subline (the title bar and header would muddy it),
  // full over the search field and the first ticket row, gone before the action line and far above the zone
  const GHOST_MASK = [
    [690, 0],
    [735, 0.45],
    [790, 1],
    [945, 1],
    [1000, 0.45],
    [1045, 0.1],
    [1090, 0],
  ];

  function ghostSprite(L, S) {
    const G = L.GEO.APP;
    const ui = L.ui;
    const h = (G.w * ui.APP_H) / ui.APP_W;
    const x0 = G.x - GHOST_M;
    const y0 = G.y - GHOST_M;
    const w = G.w + GHOST_M * 2;
    const hh = h + GHOST_M * 2;
    const sprite = L.cached(`cta-app-ghost@${S}`, () => {
      const cw = Math.max(2, Math.ceil(w * S));
      const ch = Math.max(2, Math.ceil(hh * S));
      // 1. the app, sharp
      const a = FILM.makeCanvas(cw, ch);
      const ga = a.getContext('2d');
      ga.scale(S, S);
      ga.translate(-x0, -y0);
      ui.app(ga, G.x, G.y, G.w, { search: 1, caret: false });
      // 2. blurred copy (the blur radius scales with the render so previews match the full frame)
      const b = FILM.makeCanvas(cw, ch);
      const gb = b.getContext('2d');
      if ('filter' in gb) {
        gb.filter = `blur(${4 * S}px)`;
        gb.drawImage(a, 0, 0);
        gb.filter = 'none';
      } else {
        // no canvas filter (older Safari): a down-and-up resample reads as the same soft blur
        const q = FILM.makeCanvas(Math.max(2, Math.ceil(cw / 4)), Math.max(2, Math.ceil(ch / 4)));
        const gq = q.getContext('2d');
        gq.imageSmoothingQuality = 'high';
        gq.drawImage(a, 0, 0, q.width, q.height);
        gb.imageSmoothingQuality = 'high';
        gb.drawImage(q, 0, 0, cw, ch);
      }
      // 3. keep only a soft vertical band
      gb.save();
      gb.scale(S, S);
      gb.translate(-x0, -y0);
      gb.globalCompositeOperation = 'destination-in';
      const gr = gb.createLinearGradient(0, y0, 0, y0 + hh);
      for (const [y, al] of GHOST_MASK) gr.addColorStop(L.clamp((y - y0) / hh), L.rgba(L.pal.txt, al));
      gb.fillStyle = gr;
      gb.fillRect(x0, y0, w, hh);
      gb.restore();
      return b;
    });
    return { sprite, x0, y0, w, hh };
  }

  // ---- draw ------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib;
      const P = L.pal;
      const ui = L.ui;
      const Z = L.GEO.STICKER;
      // clamp first; then freeze at SETTLE so nothing can move from T 54.0 on
      const t = Math.min(L.clamp(tIn, 0, info.dur), SETTLE);

      // 1. plate: fixed offset, no drift
      ui.bg(ctx, { plate: 'interface', oy: PLATE_OY });

      // 2. app ghost (static from frame 0; core's fade brings it in)
      const g = ghostSprite(L, FILM.S || 1);
      ctx.save();
      ctx.globalAlpha *= APP_ALPHA;
      ctx.drawImage(g.sprite, g.x0, g.y0, g.w, g.hh);
      ctx.restore();

      // 3. tag, centred as one unit (14 px square + 14 px gap + mono text)
      const tagW = 28 + ui.measure(ctx, TAG, { font: 'mono', size: 26, weight: 500, tracking: 1 });
      ui.tag(ctx, TAG, t - B_HEAD, { x: Math.round(CX - tagW / 2), y: Y_TAG });

      // 4. headline
      ui.headline(ctx, HEAD, t - B_HEAD, { align: 'center', x: CX, y: Y_HEAD, size: HEAD_SIZE });

      // 5. subline: fades up
      const kSub = ui.kf(t, B_SUB, 8 * FR, 'outExpo');
      if (kSub > 0) {
        ui.label(ctx, SUB, CX, Y_SUB + (1 - kSub) * 18, { size: 42, weight: 500, color: P.txtDim, align: 'center', alpha: kSub });
      }

      // 6. action line: rises in
      const kAct = ui.kf(t, B_ACT, 8 * FR, 'outExpo');
      if (kAct > 0) {
        ui.label(ctx, ACT, CX, Y_ACT + (1 - kAct) * 26, { size: 50, weight: 700, color: P.txt, align: 'center', tracking: -0.5, alpha: kAct });
      }

      // 7. arrow into the zone; the glow sits on the head and ends above the zone's top edge
      const kArrow = ui.kf(t, B_ARROW, 9 * FR, 'outCubic');
      if (kArrow > 0) {
        const tip = ui.arrow(ctx, [[CX, ARROW_Y0], [CX, ARROW_Y1]], { lw: ARROW_LW, headSize: ARROW_HEAD, p: kArrow, color: P.sig });
        if (tip) {
          const gy = tip.y - 12;
          const gr = Math.min(44, Z.y - 2 - gy);
          ui.glow(ctx, tip.x, gy, gr, P.sig, 0.5 * kArrow);
        }
      }

      // 8. corner ticks: just outside the zone (stroke's inner edge on the zone edge), converging 18 px → 0
      const kTicks = ui.kf(t, B_TICKS, 8 * FR, 'outCubic');
      if (kTicks > 0) {
        const off = TICK_LW / 2 + (1 - kTicks) * 18;
        const len = TICK_LEN * (0.35 + 0.65 * kTicks);
        ui.corners(ctx, Z.x - off, Z.y - off, Z.w + off * 2, Z.h + off * 2, { color: P.sig, alpha: 0.85 * kTicks, len, lw: TICK_LW });
      }
    },
  });
})();
