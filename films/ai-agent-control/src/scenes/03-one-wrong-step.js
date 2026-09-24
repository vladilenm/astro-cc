/*
 * 03 · one-wrong-step · «Конкретный риск» · T 10–15 · interface plate
 *
 * Opens on H2. The camera pushes through the files card (10.0–10.5) until its tree becomes the file tree
 * panel at G3. The agent's pointer glides to src/, an orange operation «удалить папку · rm -rf src/»
 * pops up, the pointer heads for «Выполнить ↵» and stops short; at 12.5 the stop-frame: a thin red frame
 * «Без подтверждения?», the src/ subtree tints red, a 1.5 % punch-in, and nothing moves again except the
 * frame's slow glow. Nothing is deleted: every tree row stays to the end.
 *
 * Layers, back to front:
 *   1  plate (ui.bg, screen-fixed, drifting)
 *   2  push-in (0–0.5): H2 world + Q under L.camera through the soft stage mask; the files card's tree
 *      cross-fades into a world-space copy of the G3 tree that lands exactly on G3
 *   3  stage (≥ 0.5, punched in 1.5 % at 12.5): tree, src/ → operation line, operation card, agent pointer
 *   4  danger frame + «Без подтверждения?» chip (≥ 12.5, screen-fixed)
 *   5  tags + headlines: shot 02's leave at 10.0, «Один неверный шаг» rises at 10.5
 *   6  one-frame 18 % white flash at 12.5
 */
(function () {
  'use strict';

  const ID = 'one-wrong-step';
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

  // ---- push-in: H2 → the files card → the G3 tree -------------------------------------------------
  // The card's tree (ui.tree at design (40, 76), w 800, rows 76, no header, card scale 280/880) lands with
  // its rows on G3's rows: row pitch 76·s → 72, row 0 centre → y 722, depth-1 text → x 222.
  const S0 = 280 / 880;
  const ZE = 72 / (76 * S0);
  const CEX = 80 + S0 * (40 + 40 + 40 + 62) + (540 - 222) / ZE;
  const CEY = 1030 + S0 * (76 + 10 + 38) + (960 - 722) / ZE;
  // the world point that stays fixed on screen between ((540, 960), 1) and ((CEX, CEY), ZE)
  const FX = (ZE * CEX - 540) / (ZE - 1);
  const FY = (ZE * CEY - 960) / (ZE - 1);
  // world origin of a copy of the G3 tree that lands exactly on G3 (80, 600) at ZE
  const VX = FX + (80 - FX) / ZE;
  const VY = FY + (600 - FY) / ZE;
  const PUSH = 0.5; // push-in length, shot time
  const camFor = (z) => ({ x: FX - (FX - 540) / z, y: FY - (FY - 960) / z, zoom: z });

  // ---- stage geometry -------------------------------------------------------------------------------
  const TREE = { x: 80, y: 600, w: 560 }; // G3
  const OP = { x: 520, y: 1010, w: 480, h: 256, r: 24 }; // operation card (kept clear of the tree's names)
  const PILL = { right: OP.x + OP.w - 28, cy: 1190, h: 52, padX: 20, size: 28, glyph: 22, gap: 12 };
  const LINE = [[600, 722], [700, 722], [700, OP.y - 6]]; // src/ row → operation card
  const HOVER = [455, 724]; // pointer tip on the src/ row, right of its name
  const FROM = [1060, 1500]; // pointer enters here
  const DANGER = { x: 56, y: 572, w: 968, h: 736, r: 36 };
  const PUNCH = { x: 540, y: 940, k: 0.015 };

  // beats (shot time; global = +10)
  const B_TITLE = 0.5; // T 10.5
  const B_GLIDE = 0.75; // T 10.75
  const B_HOVER = 1.25; // T 11.25
  const B_OP = 1.5; // T 11.5
  const B_REACH = 1.75; // T 11.75 → 12.35
  const B_STOP = 2.5; // T 12.5

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

  /** The «return» key glyph (↵), drawn so it does not depend on the font having the arrow. */
  function returnGlyph(ctx, x, y, s, color) {
    const h = s / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x + h * 0.8, y - h * 0.8);
    ctx.lineTo(x + h * 0.8, y + h * 0.25);
    ctx.lineTo(x - h * 0.8, y + h * 0.25);
    ctx.moveTo(x - h * 0.35, y - h * 0.2);
    ctx.lineTo(x - h * 0.8, y + h * 0.25);
    ctx.lineTo(x - h * 0.35, y + h * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  /** Left edge of the «Выполнить ↵» pill. */
  function pillLeft(ui, ctx) {
    const tw = ui.measure(ctx, 'Выполнить', { size: PILL.size, weight: 600 });
    return PILL.right - (PILL.padX * 2 + tw + PILL.gap + PILL.glyph);
  }

  /** The operation card «удалить папку · rm -rf src/ · Выполнить ↵». dk: 0..1 danger (stroke → red). */
  function opCard(ctx, L, dk) {
    const ui = L.ui, P = L.pal;
    const edge = dk > 0 ? L.mix(P.sig, P.danger, dk) : P.sig;
    ui.panel(ctx, OP.x, OP.y, OP.w, OP.h, { r: OP.r, fill: P.panel, stroke: edge, lw: 2 + dk, glow: L.rgba(edge, 0.4) });
    ui.icon(ctx, 'trash', OP.x + 52, 1060, 40, { color: P.sig, lw: 3.4 });
    ui.label(ctx, 'удалить папку', OP.x + 88, 1073, { size: 38, weight: 700, color: P.sig, tracking: -0.3 });
    ctx.beginPath();
    ui.rr(ctx, OP.x + 28, 1092, OP.w - 56, 56, 12);
    ctx.fillStyle = P.panelHi;
    ctx.fill();
    ui.label(ctx, 'rm -rf src/', OP.x + 52, 1131, { size: 32, font: 'mono', weight: 500, color: P.txt });
    // «Выполнить ↵» — button-like, never pressed
    const x0 = pillLeft(ui, ctx);
    const w = PILL.right - x0;
    ctx.beginPath();
    ui.rr(ctx, x0, PILL.cy - PILL.h / 2, w, PILL.h, PILL.h / 2);
    ctx.fillStyle = P.panelTop;
    ctx.fill();
    ctx.strokeStyle = P.hairHi;
    ctx.lineWidth = 2;
    ctx.stroke();
    const tw = ui.label(ctx, 'Выполнить', x0 + PILL.padX, PILL.cy + 1, { size: PILL.size, weight: 600, color: P.txt, baseline: 'middle' });
    returnGlyph(ctx, x0 + PILL.padX + tw + PILL.gap + PILL.glyph / 2, PILL.cy, PILL.glyph, P.txtDim);
  }

  /** The agent's pointer: an orange cursor with a multiplayer-style name tag «агент». */
  function agentPointer(ctx, L, x, y, a) {
    const ui = L.ui, P = L.pal;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ui.cursor(ctx, x, y, 48, { color: P.sig, outline: P.bg });
    const tx = x + 24, ty = y + 38, th = 34;
    const tw = ui.measure(ctx, 'агент', { font: 'mono', size: 22, weight: 600 });
    const w = 44 + tw + 14;
    ctx.beginPath();
    ui.rr(ctx, tx, ty, w, th, th / 2);
    ctx.fillStyle = P.sig;
    ctx.fill();
    ui.agent(ctx, tx + 23, ty + th / 2 + 2, 22, { color: P.bg, fill: P.sig, eyesAccent: true });
    ui.label(ctx, 'агент', tx + 44, ty + th / 2 + 1, { font: 'mono', size: 22, weight: 600, color: P.bg, baseline: 'middle' });
    ctx.restore();
  }

  /** Pointer tip position at shot time t. */
  function pointerAt(L, ui, ctx, t) {
    const E = L.ease;
    if (t < B_REACH) {
      const u = ui.kf(t, B_GLIDE, 0.5, 'outCubic');
      const c = [840, 760];
      const v = 1 - u;
      return [v * v * FROM[0] + 2 * v * u * c[0] + u * u * HOVER[0], v * v * FROM[1] + 2 * v * u * c[1] + u * u * HOVER[1]];
    }
    const stop = [pillLeft(ui, ctx) - 40, PILL.cy - 14];
    const u = E.inOutCubic(ui.k(t, B_REACH, 0.6));
    return [L.lerp(HOVER[0], stop[0], u), L.lerp(HOVER[1], stop[1], u)];
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui, P = L.pal, E = L.ease;
      const t = L.clamp(tIn, 0, info.dur);
      const T = info.shot.start + t;

      // 1 plate
      ui.bg(ctx, { oy: -T * 12 });

      // 2 push-in through the files card
      if (t <= 0) {
        h2World(ctx, L, T, 1, {}); // H2, exactly as shot 02 leaves it
        h2Q(ctx, L, T, {});
      } else if (t < PUSH) {
        const z = Math.exp(Math.log(ZE) * E.inOutCubic(t / PUSH));
        const cam = camFor(z);
        const others = 1 - E.inQuad(L.clamp(t / 0.375));
        const cross = E.inOutSine(ui.k(t, 0.292, 4 * FR));
        stageMask(ctx, L, 505, 600, (g) =>
          L.camera(g, cam, (c) => {
            h2World(c, L, T, z, { others, files: 1 - cross });
            h2Q(c, L, T, { alpha: others });
          })
        );
        if (cross > 0) {
          L.camera(ctx, cam, (c) => {
            c.save();
            c.translate(VX, VY);
            c.scale(1 / ZE, 1 / ZE);
            ui.tree(c, 0, 0, TREE.w, { alpha: cross });
            c.restore();
          });
        }
      } else {
        // 3 stage, punched in on the stop-frame
        const dk = ui.kf(t, B_STOP, 3 * FR);
        const pk = ui.kf(t, B_STOP, 3 * FR, 'outCubic');
        ctx.save();
        if (pk > 0) {
          const s = 1 + PUNCH.k * pk;
          ctx.translate(PUNCH.x, PUNCH.y);
          ctx.scale(s, s);
          ctx.translate(-PUNCH.x, -PUNCH.y);
        }
        ui.tree(ctx, TREE.x, TREE.y, TREE.w, { hi: t >= B_HOVER - 1e-6 ? 0 : -1, danger: dk });
        // src/ → operation: a line with its origin dot on the hovered row
        const lp = ui.kf(t, B_OP, 6 * FR, 'outCubic');
        if (lp > 0) {
          ctx.beginPath();
          ctx.arc(LINE[0][0], LINE[0][1], 5, 0, TAU);
          ctx.fillStyle = P.sig;
          ctx.fill();
          ui.arrow(ctx, LINE, { lw: 3, p: lp, glow: lp < 1 ? 0.7 : 0 });
        }
        // operation card pops
        const op = ui.pop(t, B_OP);
        if (op > 0) {
          const s = 0.82 + 0.18 * op;
          const cx = OP.x + OP.w / 2, cy = OP.y + OP.h / 2;
          ctx.save();
          ctx.globalAlpha *= L.clamp(op * 1.6);
          ctx.translate(cx, cy);
          ctx.scale(s, s);
          ctx.translate(-cx, -cy);
          opCard(ctx, L, dk);
          ctx.restore();
        }
        // the agent's pointer
        if (t >= B_GLIDE - 1e-6) {
          const p = pointerAt(L, ui, ctx, t);
          agentPointer(ctx, L, p[0], p[1], L.clamp((t - B_GLIDE + FR) / (2 * FR)));
        }
        ctx.restore();

        // 4 danger frame + chip: snap on at 12.5, then only the glow breathes (one cycle per 2 beats)
        if (t >= B_STOP - 1e-6) {
          const br = 0.875 + 0.125 * Math.cos((TAU * (t - B_STOP)) / 1.0);
          ctx.save();
          ctx.beginPath();
          ui.rr(ctx, DANGER.x, DANGER.y, DANGER.w, DANGER.h, DANGER.r);
          ctx.strokeStyle = P.danger;
          ctx.lineWidth = 4;
          ctx.shadowColor = L.rgba(P.danger, 0.75 * br);
          ctx.shadowBlur = 30 * (FILM.S || 1);
          ctx.stroke();
          ctx.restore();
          ui.chip(ctx, 'Без подтверждения?', 80, DANGER.y, { size: 30, weight: 700, icon: 'warn', color: P.danger, fill: P.dangerTint, stroke: P.danger });
        }
      }

      // 5 titles
      if (t < 0.25) h2Titles(ctx, L, T, t);
      const dk = ui.kf(t, B_STOP, 3 * FR);
      ui.tag(ctx, '// риск', t - B_TITLE);
      ui.headline(ctx, ['Один [неверный шаг]'], t - B_TITLE, { accent: dk > 0 ? L.mix(P.sig, P.danger, dk) : P.sig });

      // 6 one-frame flash on the stop
      if (t >= B_STOP - 1e-6 && t < B_STOP + FR - 1e-6) {
        ctx.fillStyle = L.rgba(P.txt, 0.18);
        ctx.fillRect(0, 0, 1080, 1920);
      }
    },
  });
})();
