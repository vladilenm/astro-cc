/*
 * 09 whats-inside : «Содержание и аудитория». T 45–52 (7 s), schematic. Hard cut in; shot 10 fades in over this
 * shot's held last pose from T 52.0 (core).
 *
 * The lesson's path as two sequential cards: «Готовый агент» (шаг 1) collapses into a done pill, then
 * «Свой агент на TypeScript» (шаг 2) holds three blocks — модель / инструменты / цикл — that snap onto one loop
 * with the exact shape of ring 2 from shot 05 (600 × 410, r 42, here centred on (540, 1060)). The source
 * folder chip «Запись + исходный код» slides in from the frame edge. An orange signal then circulates the
 * loop, one lap per bar, lighting each block as it passes.
 *
 * Layers, back to front:
 *   1. plate: schematic, drifting 6 px per beat (screen-fixed)
 *   2. stage under the final push-in camera (t 6.5–7.0, ×1 → ×1.03):
 *      a. card 2 (rises in at t 1.5): step label, title, loop guide, loop, blocks, signal, folder chip
 *      b. card 1 (pops at t 0) collapsing into the pill (t 1.5)
 *   3. tag + headline (t 0.25), screen-fixed
 */
(function () {
  'use strict';
  const ID = 'whats-inside';
  const FR = 1 / 24;

  // ---- beats (shot-local seconds; global T in comments) ----
  const B_CARD1 = 0.0; //  T 45.0   card 1 pops (6 frames)
  const B_HEAD = 0.25; //  T 45.25  tag + headline
  const B_SWAP = 1.5; //   T 46.5   card 1 → pill, card 2 rises in (8 frames)
  const B_FOLDER = 3.5; // T 48.5   folder chip slides in from the left edge (8 frames)
  const B_CIRC = 5.5; //   T 50.5   the loop closes at «модель»; the signal circulates, one lap per bar
  const LAP = 2.0; //      one bar
  const B_PUSH = 6.5; //   T 51.5   push-in ×1 → ×1.03 into the fade

  // Loop draw-on keys [t, fraction of the loop from «модель», clockwise]: the tip reaches each block's slot as
  // that block lands (49.25 / 49.75 / 50.25) and closes on the beat at 50.5.
  const LOOP_KEYS = [[4.0, 0], [4.75, 0.25], [5.25, 0.75], [5.5, 1]];

  // ---- geometry (storyboard 09, Forms) ----
  const CARD1 = { x: 100, y: 640, w: 880, h: 300, r: 28 };
  const PILL = { x: 100, y: 572, w: 880, h: 72, r: 36 };
  const CARD2 = { x: 100, y: 664, w: 880, h: 676, r: 28 };
  const LOOP_C = [540, 1060];
  const BLK = { w: 250, h: 88 };
  // The row reads цикл · модель · инструменты (x 270 / 540 / 810) so each block moves the short way onto its
  // slot and nothing crosses; the pops still run модель → инструменты → цикл, the loop's clockwise order.
  // frac = where the block sits on the loop, measured clockwise from the top centre.
  const BLOCKS = [
    { label: 'модель', mark: 'agent', row: [540, 1010], slot: [540, 855], pop: 2.0, move: 4.0, frac: 0 }, //       T 47.0 / 49.0
    { label: 'инструменты', icon: 'terminal', row: [810, 1010], slot: [840, 1060], pop: 2.5, move: 4.5, frac: 0.25 }, // T 47.5 / 49.5
    { label: 'цикл', icon: 'loop', row: [270, 1010], slot: [240, 1060], pop: 3.0, move: 5.0, frac: 0.75 }, //         T 48.0 / 50.0
  ];
  const BLK_PAD = 12, BLK_ICON = 30, BLK_GAP = 10;
  // The folder chip straddles card 2's bottom edge (y 1340): inside the card the loop's bottom edge (y 1265)
  // leaves no room for a 64 px chip.
  const FOLDER = { x: 124, y: 1340, x0: -420, h: 64, label: 'Запись + исходный код' };

  const TAG = '// для кого';
  const HEAD = ['Для JavaScript /', '[TypeScript]-разработчиков'];

  let LOOP_PTS = null;
  /** The loop: ring 2's shape (L.GEO.RINGS[1]) centred on LOOP_C, as points from its top centre, clockwise. */
  function loopPts(L) {
    if (LOOP_PTS) return LOOP_PTS;
    const R = L.GEO.RINGS[1];
    const x = LOOP_C[0] - R.w / 2, y = LOOP_C[1] - R.h / 2;
    const cx = LOOP_C[0];
    LOOP_PTS = L.ui.roundPts([[cx, y], [x + R.w, y], [x + R.w, y + R.h], [x, y + R.h], [x, y], [cx, y]], R.r, 4);
    return LOOP_PTS;
  }

  /** Piecewise-linear through [[t, v], ...] keys (held outside). */
  function keyed(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        return a[1] + ((b[1] - a[1]) * (t - a[0])) / (b[0] - a[0]);
      }
    }
    return keys[keys.length - 1][1];
  }

  /** One label size for all three blocks: 30 px, or what fits «инструменты» in 250 px (never under 26). */
  function blockSize(ctx, ui) {
    const room = BLK.w - 2 * BLK_PAD - BLK_ICON - BLK_GAP;
    let size = 30;
    for (const B of BLOCKS) {
      const w = ui.measure(ctx, B.label, { size: 30, weight: 600, tracking: -0.3 });
      if (w > room) size = Math.min(size, Math.floor((30 * room) / w));
    }
    return Math.max(26, size);
  }

  /** A schematic block (ui.node's look: panel, orange border + glow when active), icon/mark + label centred. */
  function block(ctx, L, B, cx, cy, sc, act, size) {
    if (sc <= 0) return;
    const ui = L.ui, P = L.pal;
    const w = BLK.w, h = BLK.h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.globalAlpha *= L.clamp(sc * 1.6);
    ui.panel(ctx, -w / 2, -h / 2, w, h, {
      r: 20, fill: P.panel, lw: 2,
      stroke: act > 0 ? L.mix(P.hairHi, P.sig, act) : P.hairHi,
      glow: act > 0.01 ? L.rgba(P.sig, 0.55 * act) : null,
    });
    const iconW = BLK_ICON, gap = BLK_GAP;
    const tw = ui.measure(ctx, B.label, { size, weight: 600, tracking: -0.3 });
    const x0 = -(iconW + gap + tw) / 2;
    const ic = act > 0.5 ? P.sig : P.txt;
    if (B.mark === 'agent') ui.agent(ctx, x0 + iconW / 2, 4, 30, { glow: 0.6 + 0.4 * act });
    else ui.icon(ctx, B.icon, x0 + iconW / 2, 0, 32, { color: ic, lw: 3 });
    ui.label(ctx, B.label, x0 + iconW + gap, 1, { size, weight: 600, color: P.txt, baseline: 'middle', tracking: -0.3 });
    ctx.restore();
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui, P = L.pal, E = L.ease;
      const clamp = L.clamp, lerp = L.lerp;
      const t = clamp(tIn, 0, info.dur);
      const T = info.shot.start + t;
      const W = info.W, H = info.H;

      // ---- 1. plate ----
      ui.bg(ctx, { plate: 'schematic', oy: -T * 12 });

      // ---- 2. stage (final push-in) ----
      const push = E.inOutSine(clamp((t - B_PUSH) / (info.dur - B_PUSH)));
      const zoom = lerp(1, 1.03, push);
      L.camera(ctx, { x: W / 2, y: H / 2, zoom }, (c) => {
        // ---- 2a. card 2 ----
        const k2 = ui.kf(t, B_SWAP, 8 * FR, 'outCubic');
        if (k2 > 0) {
          c.save();
          c.translate(0, (1 - k2) * 60);
          c.globalAlpha *= k2;
          ui.panel(c, CARD2.x, CARD2.y, CARD2.w, CARD2.h, { r: CARD2.r, fill: P.panel, stroke: P.hairHi });
          ui.label(c, 'шаг 2', 144, 712, { font: 'mono', size: 24, weight: 500, color: P.sig, tracking: 1 });
          ui.rich(c, 'Свой агент на [TypeScript]', 144, 772, { size: 44, weight: 700, tracking: -0.5 });
          c.restore();
        }

        const pts = loopPts(L);
        // loop guide: ring 2's outline, dashed and faint, marks where the blocks will lock in
        const guideK = ui.kf(t, 2.0, 0.5, 'outCubic') * (1 - ui.k(t, 5.5, 0.5, 'inOutSine'));
        if (guideK > 0) ui.arrow(c, pts, { p: guideK, head: false, r: 0, lw: 2, color: P.hairHi, dash: [10, 12] });

        // the loop itself, drawn on through the slots
        // loop, signal and flashes run one frame ahead (like ui.kf) so each key is visible ON its beat frame
        const tl = t + FR;
        const lp = keyed(LOOP_KEYS, tl);
        if (lp > 0) {
          ui.arrow(c, pts, { p: lp, head: false, r: 0, lw: 3, color: P.sig });
          ui.arrow(c, pts, { p: lp, head: false, r: 0, lw: 9, color: P.sig, alpha: 0.12 });
        }
        // direction chevrons on the two free stretches (bottom and top-right / top-left halves), after closing
        const chevK = ui.kf(t, B_CIRC, 6 * FR, 'outCubic');
        if (chevK > 0) {
          for (const f of [0.125, 0.5, 0.875]) {
            const q = ui.along(pts, f);
            c.save();
            c.translate(q.x, q.y);
            c.rotate(q.a);
            c.globalAlpha *= chevK;
            c.fillStyle = P.bgDeep;
            c.fillRect(-14, -14, 28, 28);
            ui.icon(c, 'chevronRight', 0, 0, 30, { color: P.sig, lw: 3.5 });
            c.restore();
          }
        }

        // the signal: the draw-on tip, then one lap per bar
        let sigF = -1;
        if (lp > 0 && lp < 1) sigF = lp;
        else if (tl >= B_CIRC) sigF = ((tl - B_CIRC) / LAP) % 1;
        if (sigF >= 0) {
          const q = ui.along(pts, sigF);
          const trail = 0.06;
          if (tl >= B_CIRC) {
            const a0 = sigF - trail;
            if (a0 >= 0) ui.arrow(c, pts, { from: a0, p: sigF, head: false, r: 0, lw: 5, color: P.sigHot, alpha: 0.55 });
            else {
              ui.arrow(c, pts, { from: 0, p: sigF, head: false, r: 0, lw: 5, color: P.sigHot, alpha: 0.55 });
              ui.arrow(c, pts, { from: 1 + a0, p: 1, head: false, r: 0, lw: 5, color: P.sigHot, alpha: 0.55 });
            }
          }
          ui.glow(c, q.x, q.y, 46, P.sigHot, 0.75);
          c.fillStyle = P.sigHot;
          c.beginPath();
          c.arc(q.x, q.y, 8, 0, L.TAU);
          c.fill();
        }

        // blocks: pop in a row, then snap onto the loop
        const bSize = blockSize(c, ui);
        for (const B of BLOCKS) {
          const sc = ui.pop(t, B.pop);
          if (sc <= 0) continue;
          const m = ui.kf(t, B.move, 6 * FR);
          const mb = E.outBack(m);
          const x = lerp(B.row[0], B.slot[0], mb);
          const y = lerp(B.row[1], B.slot[1], mb);
          // orange flash: on landing, and each time the signal passes the block
          const land = B.move + 5 * FR; // kf lands one frame early
          let act = t >= land ? Math.exp(-(t - land) / 0.3) : 0;
          if (tl >= B_CIRC) {
            const since = (((tl - B_CIRC - B.frac * LAP) % LAP) + LAP) % LAP;
            if (tl - B_CIRC >= B.frac * LAP - 1e-6) act = Math.max(act, Math.exp(-since / 0.3));
            const until = LAP - since; // pre-light as the signal approaches
            if (until < 0.12) act = Math.max(act, 1 - until / 0.12);
          }
          block(c, L, B, x, y, sc, clamp(act), bSize);
        }

        // folder chip: slides in from the frame's left edge
        const fk = ui.kf(t, B_FOLDER, 8 * FR, 'outCubic');
        if (fk > 0) {
          const fx = lerp(FOLDER.x0, FOLDER.x, fk);
          const size = 28, iconS = 40, padL = 20, padR = 26, gap = 14;
          const tw = ui.measure(c, FOLDER.label, { size, weight: 600 });
          const fw = padL + iconS + gap + tw + padR;
          const fy = FOLDER.y;
          c.save();
          c.beginPath();
          ui.rr(c, fx, fy - FOLDER.h / 2, fw, FOLDER.h, FOLDER.h / 2);
          c.fillStyle = P.panelHi;
          c.fill();
          c.strokeStyle = P.sig;
          c.lineWidth = 2;
          c.stroke();
          ui.icon(c, 'folder', fx + padL + iconS / 2, fy, iconS, { color: P.sig, lw: 3, fill: P.sigTint });
          ui.label(c, FOLDER.label, fx + padL + iconS + gap, fy + 1, { size, weight: 600, color: P.txt, baseline: 'middle' });
          c.restore();
          if (fk < 1) ui.glow(c, fx + fw, fy, 70, P.sig, 0.4 * (1 - fk));
        }

        // ---- 2b. card 1 → pill ----
        const pop1 = ui.kf(t, B_CARD1, 6 * FR);
        const mk = ui.kf(t, B_SWAP, 8 * FR, 'outCubic');
        const rx = lerp(CARD1.x, PILL.x, mk), ry = lerp(CARD1.y, PILL.y, mk);
        const rw = lerp(CARD1.w, PILL.w, mk), rh = lerp(CARD1.h, PILL.h, mk);
        const rr = lerp(CARD1.r, PILL.r, mk);
        const sc1 = 0.92 + 0.08 * E.outBack(pop1);
        c.save();
        c.translate(rx + rw / 2, ry + rh / 2);
        c.scale(sc1, sc1);
        c.translate(-(rx + rw / 2), -(ry + rh / 2));
        c.globalAlpha *= clamp(0.45 + pop1 * 1.8);
        ui.panel(c, rx, ry, rw, rh, { r: rr, fill: P.panel, stroke: P.hairHi });
        c.save();
        c.beginPath();
        ui.rr(c, rx, ry, rw, rh, rr);
        c.clip();
        // big content rides with the card's top edge and fades as it collapses
        const bigA = 1 - clamp(mk * 2.2);
        if (bigA > 0) {
          c.save();
          c.translate(0, ry - CARD1.y);
          c.globalAlpha *= bigA;
          ui.label(c, 'шаг 1', 144, 700, { font: 'mono', size: 24, weight: 500, color: P.sig, tracking: 1 });
          const blink = t > 1.0 && t < 1.0 + 3 * FR ? 1 : 0;
          ui.agent(c, 200, 810, 90, { glow: 1, blink });
          ui.label(c, 'Готовый агент', 280, 828, { size: 48, weight: 700, color: P.txt, tracking: -0.5 });
          c.restore();
        }
        const pillA = clamp((mk - 0.45) / 0.55);
        if (pillA > 0) {
          const cy = PILL.y + PILL.h / 2;
          c.save();
          c.globalAlpha *= pillA;
          ui.icon(c, 'check', 150, cy, 30, { color: P.sig, lw: 4 });
          ui.label(c, 'Готовый агент', 184, cy + 1, { size: 30, weight: 600, color: P.txt, baseline: 'middle' });
          ui.label(c, 'шаг 1', PILL.x + PILL.w - 40, cy + 1, { font: 'mono', size: 22, weight: 500, color: P.txtDim, baseline: 'middle', align: 'right', tracking: 1 });
          c.restore();
        }
        c.restore();
        c.restore();
      });

      // ---- 3. tag + headline (screen-fixed) ----
      ui.tag(ctx, TAG, t - B_HEAD);
      ui.headline(ctx, HEAD, t - B_HEAD);
    },
  });
})();
