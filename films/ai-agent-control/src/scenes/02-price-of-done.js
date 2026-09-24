/*
 * 02 · price-of-done · «Цена слова «готово»» · T 5–10 · interface plate
 *
 * Opens on H1 (the working search). A green «✓ Готово» badge pops on the cut beat. On «пока» (6.5) the
 * camera pulls back ×3.14 → ×1: the app shrinks into the right-hand tool card; files and terminal slide
 * in, the agent mark comes down from above, and the three cards are wired to it (7.0 / 7.5 / 8.0). The
 * badge leaves the app, flies to the agent, collapses into a circle and turns into the orange «?» (8.5).
 * Ends on H2.
 *
 * Layers, back to front:
 *   1  plate (ui.bg, screen-fixed, drifting)
 *   2  world: H1 app (≤ 6.5) → pull-back under L.camera through a soft stage mask (6.5–8.5) → H2 (≥ 8.5)
 *   3  the badge / question badge Q (screen space)
 *   4  tags + headlines: shot 01's exits at 6.5, «А что агенту разрешено?» rises at 7.0
 *
 * Camera: zoom z0 = 880/280 → 1 in log space, as a pure dolly about the one world point that stays put on
 * screen (F, derived from the storyboard's end cameras (860, 1147.7)@z0 and (540, 960)@1), eased outCubic
 * so the move starts on the «пока» hit and every wire lands on screen.
 */
(function () {
  'use strict';

  const ID = 'price-of-done';
  const FR = 1 / 24;
  const TAU = Math.PI * 2;

  // ===== shared H1 block — identical in 01-instant-result.js, 02-price-of-done.js, 03-one-wrong-step.js =====
  /** H1 (storyboard handoff, T 5.0): the app's final state; the caret blinks on the global clock. */
  function h1AppState(T) {
    return { search: 1, query: 'вход', filter: 1, mark: 1, focus: 1, t: T };
  }
  /** H1 tag + headline of shot 01; `out` = seconds since their exit began (negative = still in). */
  function h1Titles(ctx, L, T, out) {
    L.ui.tag(ctx, '// ai-кодинг', T - 0.5, { out });
    L.ui.headline(ctx, ['AI уже пишет [код]'], T - 0.5, { out, outDur: 0.25 });
  }
  // ===== end shared H1 block =====

  // ===== shared H2 block — identical in 02-price-of-done.js and 03-one-wrong-step.js =====
  /** The question badge Q of H2. */
  const H2Q = { x: 668, y: 694, r: 38 };
  /** H2 tag + headline of shot 02 (in at T 7.0); `out` = seconds since their exit began. */
  function h2Titles(ctx, L, T, out) {
    L.ui.tag(ctx, '// доступ', T - 7.0, { out });
    L.ui.headline(ctx, ['А что агенту', '[разрешено?]'], T - 7.0, { out, outDur: 0.2 });
  }
  /** Wire from the agent mark down to a tool card whose centre x is cx. */
  function h2Wire(cx) {
    return [[540, 846], [540, 900], [cx, 900], [cx, 972]];
  }
  /** Q's glow breathing (global clock, peaks on the bar lines 9.0 / 10.0). */
  function qBreath(T) {
    return 0.425 + 0.075 * Math.cos(TAU * (T - 9));
  }
  /**
   * A tool card at world rect (x, y, w) seen through a camera of zoom z. The kit thickens outlines of small
   * cards (lw = 2 / scale); drawing the card at w * z under a 1 / z scale gives exactly the outline the kit
   * would draw at the card's on-screen size, so the zoomed card matches the full-size window (H1) and the
   * small card matches ui.toolCard at 280 (H2).
   */
  function toolCardZ(ctx, L, id, x, y, w, z, o) {
    ctx.save();
    ctx.translate(x, y);
    if (z !== 1) ctx.scale(1 / z, 1 / z);
    L.ui.toolCard(ctx, id, 0, 0, w * z, Object.assign({ label: false }, o));
    ctx.restore();
  }
  /** The mono name above a tool card (the kit's toolCard label, drawn in world units). */
  function cardLabel(ctx, L, id, x, y, act, alpha) {
    if (alpha <= 0) return;
    const ui = L.ui, P = L.pal;
    const icon = id === 'files' ? 'folder' : id === 'terminal' ? 'terminal' : 'app';
    ctx.save();
    ctx.globalAlpha *= alpha;
    ui.icon(ctx, icon, x + 16, y - 26, 28, { color: act > 0.5 ? P.sig : P.txtDim, lw: 2.5 });
    ui.label(ctx, id, x + 42, y - 16, { size: 30, font: 'mono', weight: 500, color: P.txt });
    ctx.restore();
  }
  /**
   * The H2 world: three wires, three tool cards (TOOLS2, app card in the H1 state), the agent mark.
   * z: camera zoom it is seen through. o (per card index files, terminal, app): wire (draw-on), wireGlow,
   * active (orange border), label (alpha); others (alpha of everything but the files card), files (its alpha).
   */
  function h2World(ctx, L, T, z, o) {
    o = o || {};
    const ui = L.ui;
    const cards = L.GEO.TOOLS2;
    const aO = o.others != null ? o.others : 1;
    const aF = o.files != null ? o.files : 1;
    const wp = o.wire || [1, 1, 1];
    const wg = o.wireGlow || [0, 0, 0];
    const act = o.active || [0, 0, 0];
    const la = o.label || [1, 1, 1];
    if (aO > 0) {
      ctx.save();
      ctx.globalAlpha *= aO;
      for (let i = 0; i < 3; i++) {
        if (wp[i] > 0) ui.arrow(ctx, h2Wire(cards[i].x + cards[i].w / 2), { lw: 3, p: wp[i], glow: wg[i] });
      }
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) {
      const c = cards[i];
      const a = c.id === 'files' ? aF : aO;
      if (a > 0) toolCardZ(ctx, L, c.id, c.x, c.y, c.w, z, { alpha: a, active: act[i], app: h1AppState(T) });
      cardLabel(ctx, L, c.id, c.x, c.y, act[i], la[i] * aO);
    }
    if (aO > 0) ui.agent(ctx, 540, 780, 150, { glow: 1, alpha: aO });
  }
  /**
   * Q, the question badge (H2 = defaults). o: alpha, green 0..1 (its «done» colours), check 0..1 (✓ scale),
   * q 0..1 («?» scale), glow (alpha; default qBreath(T)), x / y (centre).
   */
  function h2Q(ctx, L, T, o) {
    o = o || {};
    const ui = L.ui, P = L.pal;
    const a = o.alpha != null ? o.alpha : 1;
    if (a <= 0) return;
    const x = o.x != null ? o.x : H2Q.x;
    const y = o.y != null ? o.y : H2Q.y;
    const g = o.green || 0;
    const col = g > 0 ? L.mix(P.sig, P.ok, g) : P.sig;
    const fill = g > 0 ? L.mix(P.sigTint, P.okTint, g) : P.sigTint;
    ctx.save();
    ctx.globalAlpha *= a;
    ui.glow(ctx, x, y, 90, col, o.glow != null ? o.glow : qBreath(T));
    ctx.beginPath();
    ctx.arc(x, y, H2Q.r, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.stroke();
    const ck = o.check || 0;
    if (ck > 0) ui.icon(ctx, 'check', x, y, 40 * ck, { color: col, lw: 4 });
    const q = o.q != null ? o.q : 1;
    if (q > 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(q, q);
      ui.label(ctx, '?', 0, 3, { size: 48, weight: 800, color: col, align: 'center', baseline: 'middle' });
      ctx.restore();
    }
    ctx.restore();
  }
  // ===== end shared H2 block =====

  // ---- camera: pull-back from the app card (= G1) to the H2 layout ------------------------------
  const Z0 = 880 / 280; // the app card (280 wide) fills G1 (880 wide)
  const C0 = [860, 1030 + 370 / Z0]; // camera centre at Z0: card (720, 1030) lands on G1 (100, 590)
  // the world point that stays fixed on screen between (C0, Z0) and ((540, 960), 1)
  const FX = (Z0 * C0[0] - 540) / (Z0 - 1);
  const FY = (Z0 * C0[1] - 960) / (Z0 - 1);
  const PB0 = 6.5, PB1 = 8.5; // pull-back, global T
  const zoomAt = (L, T) => Math.exp(Math.log(Z0) * (1 - L.ease.outCubic(L.clamp((T - PB0) / (PB1 - PB0)))));
  const camFor = (z) => ({ x: FX - (FX - 540) / z, y: FY - (FY - 960) / z, zoom: z });
  const toScreen = (z, wx, wy) => [FX + z * (wx - FX), FY + z * (wy - FY)];

  // wires land app → terminal → files (7.25 / 7.75 / 8.25), each drawn on over the 6 frames before
  const LAND = [8.25, 7.75, 7.25]; // per TOOLS2 index: files, terminal, app

  // ---- the green «✓ Готово» badge -----------------------------------------------------------------
  const BADGE = { size: 30, h: 51, padX: 18, iconW: 40, right: 956, y: 590 };
  const badgeW = (ui, ctx) => ui.measure(ctx, 'Готово', { size: BADGE.size, weight: 600 }) + BADGE.padX * 2 + BADGE.iconW;
  /** Right-edge anchor of the badge while it rides the app card: the card's design point (856, 0). */
  const badgeRight = (z) => toScreen(z, 720 + (856 * 280) / 880, 1030);

  /**
   * The badge as a pill (ui.chip layout: check icon + «Готово», Inter 600 30, ok on okTint) that collapses
   * into the r 38 circle of Q as m goes 0 → 1. sc: pop scale, ga: glow alpha.
   */
  function doneBadge(ctx, L, cx, cy, W0, m, sc, ga) {
    const ui = L.ui, P = L.pal;
    const w = L.lerp(W0, 2 * H2Q.r, m);
    const h = L.lerp(BADGE.h, 2 * H2Q.r, m);
    ui.glow(ctx, cx, cy, L.lerp(120, 90, m), P.ok, ga);
    ctx.save();
    ctx.translate(cx, cy);
    if (sc !== 1) ctx.scale(sc, sc);
    const x0 = -w / 2;
    ctx.beginPath();
    ui.rr(ctx, x0, -h / 2, w, h, h / 2);
    ctx.fillStyle = P.okTint;
    ctx.fill();
    ctx.strokeStyle = P.ok;
    ctx.lineWidth = L.lerp(2, 3, m);
    ctx.stroke();
    ctx.clip();
    const ix = L.lerp(-W0 / 2 + BADGE.padX + BADGE.size / 2, 0, m);
    ui.icon(ctx, 'check', ix, 0, L.lerp(BADGE.size * 0.95, 40, m), { color: P.ok, lw: L.lerp(3, 4, m) });
    const ta = 1 - L.clamp(m * 2.2);
    if (ta > 0) ui.label(ctx, 'Готово', ix + BADGE.iconW - BADGE.size / 2, 1, { size: BADGE.size, weight: 600, color: P.ok, baseline: 'middle', alpha: ta });
    ctx.restore();
  }

  /**
   * Draws fn(g) into a scratch layer and fades out everything above the stage edge (y0 hidden → y1 visible)
   * before compositing it: during the camera move nothing in the world sweeps behind the headline.
   * The layer is fully cleared on every use, so no state crosses frames.
   */
  function stageMask(ctx, L, y0, y1, fn) {
    const cv = ctx.canvas;
    const w = cv.width, h = cv.height;
    const lay = L.cached(ID + ':stage-layer:' + w + 'x' + h, () => FILM.makeCanvas(w, h));
    const g = lay.getContext('2d');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, w, h);
    g.restore();
    g.save();
    FILM.baseTransform(g);
    fn(g);
    g.globalCompositeOperation = 'destination-out';
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, L.rgba(L.pal.bg, 1));
    gr.addColorStop(1, L.rgba(L.pal.bg, 0));
    g.fillStyle = gr;
    g.fillRect(-20, -20, 1120, y1 + 20);
    g.restore();
    ctx.drawImage(lay, 0, 0, 1080, 1920);
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui, E = L.ease;
      const t = L.clamp(tIn, 0, info.dur);
      const T = info.shot.start + t;

      // 1 plate (screen-fixed during the camera move)
      ui.bg(ctx, { oy: -T * 12 });

      // 2 world
      const z = zoomAt(L, T);
      const wire = LAND.map((l) => ui.kf(T, l - 0.25, 0.25, 'outCubic'));
      const wo = {
        wire,
        wireGlow: LAND.map((l, i) => (wire[i] > 0 ? 0.8 * (1 - ui.k(T, l, 0.25)) : 0)),
        active: LAND.map((l) => {
          const k = ui.kf(T, l, 0.5);
          return k > 0 ? Math.pow(1 - k, 1.5) : 0;
        }),
        label: LAND.map((l) => ui.kf(T, l - 0.125, 0.25, 'outCubic')),
      };
      if (T <= PB0) {
        ui.app(ctx, 100, 590, 880, h1AppState(T)); // H1, exactly as shot 01 leaves it
      } else if (T >= PB1) {
        h2World(ctx, L, T, 1, wo); // H2
      } else {
        stageMask(ctx, L, 505, 600, (g) => L.camera(g, camFor(z), (c) => h2World(c, L, T, z, wo)));
      }

      // 3 the badge → Q (screen space)
      const W0 = badgeW(ui, ctx);
      if (T < 7.25) {
        const r = badgeRight(z);
        doneBadge(ctx, L, r[0] - W0 / 2, r[1], W0, 0, ui.pop(T, 5.0), 0.6 - 0.4 * ui.kf(T, 5.0, 0.5));
      } else if (T < 8.5 - 1e-6) {
        const r = badgeRight(zoomAt(L, 7.25));
        const p0 = [r[0] - W0 / 2, r[1]];
        const p1 = [H2Q.x, H2Q.y];
        const c1 = [p0[0] + 20, p1[1] - 90];
        const m = E.inOutCubic(ui.k(T, 7.25, 1.0));
        const v = 1 - m;
        const x = v * v * p0[0] + 2 * v * m * c1[0] + m * m * p1[0];
        const y = v * v * p0[1] + 2 * v * m * c1[1] + m * m * p1[1];
        doneBadge(ctx, L, x, y, W0, m, 1, 0.2);
      } else {
        const c = ui.kf(T, 8.5, 4 * FR);
        if (c >= 1) h2Q(ctx, L, T, {});
        else h2Q(ctx, L, T, { green: 1 - c, check: 1 - E.outCubic(c), q: ui.pop(T, 8.5), glow: L.lerp(0.2, qBreath(T), c) });
      }

      // 4 titles: shot 01's leave on «пока», this shot's rise at 7.0
      if (T < PB0 + 0.25) h1Titles(ctx, L, T, T - PB0);
      h2Titles(ctx, L, T, -1);
    },
  });
})();
