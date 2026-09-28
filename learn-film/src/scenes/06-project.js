/*
 * 06 · Сдвинуть свой проект с места — shot 's06'
 *   60 cut: T 24–30 · 45 cut: T 19–25 (6 s both). Fades in from s05 (0.32 s), fades out into s07.
 *
 * Left: kicker «Маршрут 3 · Свой проект» + two-line title (ui.TITLE), a loose cluster of idea notes.
 * Right: ui.planSheet «План на неделю», drawn under a fixed scale so the full sheet (goal, 3 steps,
 * «Кому покажу результат») fits y 300–860. The chosen note «Лендинг с формой» flies along the violet
 * route into the «Результат недели» row, becomes its text, and « заявки» types in. Then the steps
 * appear with the route threading down the sheet's left gutter; step 1 is highlighted and lifts
 * slightly in the last 0.4 s (bridge to the lesson page).
 *
 * Layers (back to front)
 *   1 bg                       5 route A (cluster → goal row), screen space
 *   2 kicker + title           6 flying / chosen note
 *   3 other notes (dim)        7 caption pill «План на неделю»
 *   4 plan sheet group (sheet, empty step slots, route B in the gutter, nodes, caret, step-1 lift)
 */
(function () {
  'use strict';

  const ID = 's06';
  const FILM = window.FILM;
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const A = (c, a) => L.rgba(c, a);

  // ---------------------------------------------------------------------------
  // Schedules (shot-relative seconds). Global T in comments.
  // ---------------------------------------------------------------------------
  const SCHED = {
    60: {
      gather: [0.0, 1.2], //  T 24.0–25.2  notes gather, chosen one highlights
      fly: [1.2, 1.0], //     T 25.2–26.2  chosen note flies to «Результат недели»
      type: [2.35, 0.55], //  T 26.35–26.9 « заявки» types in
      pill: 2.9, //           T 26.9       caption pill
      steps: [3.0, 3.5, 4.0], // T 27.0 / 27.5 / 28.0
      active: 4.5, //         T 28.5       step 1 highlighted
      who: 5.0, //            T 29.0       «Кому покажу результат»
      lift: 5.6, //           T 29.6       step 1 starts to scale up
    },
    45: {
      gather: [0.0, 1.0], //  T 19.0–20.0
      fly: [1.2, 0.85], //    T 20.2–21.05
      type: [2.15, 0.45], //  T 21.15–21.6
      pill: 2.6, //           T 21.6
      steps: [3.0, 3.5, 4.0], // T 22.0 / 22.5 / 23.0
      active: 4.5, //         T 23.5
      who: 5.0, //            T 24.0
      lift: 5.6, //           T 24.6
    },
  };

  // ---------------------------------------------------------------------------
  // Plan sheet geometry. The kit's full-size sheet needs ~612 px of height; it is drawn at a fixed
  // scale so it spans exactly x 1060–1800, y 300–860 on screen.
  // ---------------------------------------------------------------------------
  const SX = 1060; // screen rect
  const SY = 300;
  const SW = 740;
  const SH = 560;
  const LH = 612; // logical sheet height (full-size planSheet with the «Кому покажу» row + padding)
  const SS = SH / LH; // sheet scale
  const LW = SW / SS; // logical sheet width
  // planSheet internals (non-compact), in logical sheet coords relative to its top-left
  const BODY_X = 32;
  const GOAL_Y = 144; // body.y (140) + 4
  const GOAL_H = 96;
  const STEP_Y = (i) => GOAL_Y + GOAL_H + 20 + i * (70 + 14);
  const STEP_H = 70;
  const WHO_Y = STEP_Y(3) + 6; // gy + gh + 20 + 3 * 84 + 6
  const WHO_H = 62;
  const GUTTER_X = 16; // the route runs in the sheet's left gutter
  // logical → screen
  const sx = (x) => SX + x * SS;
  const sy = (y) => SY + y * SS;

  const GOAL = FILM.ui.PLAN.goal; // 'Лендинг с формой заявки'
  const CHOSEN = 'Лендинг с формой';
  const GOAL_FONT = { size: 34, weight: 600 };

  // ---------------------------------------------------------------------------
  // Idea notes. kind 'card' = small note card, 'pill' = kit pill, 'blank' = skeleton note.
  // p0 = scattered start (top-left), p1 = gathered around the chosen note.
  // ---------------------------------------------------------------------------
  const NOTE_H = 96;
  const NOTE_SIZE = 32;
  const NOTES = [
    { text: CHOSEN, kind: 'card', chosen: true, p0: [352, 548], p1: [318, 540] },
    { text: 'Телеграм-бот', kind: 'card', p0: [124, 396], p1: [168, 418] },
    { text: 'Портфолио', kind: 'card', p0: [626, 384], p1: [560, 412] },
    { text: 'Курс по Figma', kind: 'pill', p0: [140, 700], p1: [176, 676] },
    { text: 'Идея для SaaS', kind: 'pill', p0: [620, 718], p1: [560, 690] },
    { kind: 'blank', w: 190, p0: [760, 560], p1: [712, 544] },
    { kind: 'blank', w: 150, p0: [126, 560], p1: [150, 548], short: true },
  ];

  // ---------------------------------------------------------------------------
  // Local helpers
  // ---------------------------------------------------------------------------

  /** arc-length sampler over the kit's Catmull-Rom curve (t-independent, cached per key) */
  const PATHS = {};
  function pathOf(key, pts) {
    if (PATHS[key]) return PATHS[key];
    const S = FILM.ui.curve(pts, 24);
    const len = [0];
    for (let i = 1; i < S.length; i++) len.push(len[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
    const total = len[len.length - 1];
    const at = (u) => {
      const d = clamp(u) * total;
      let i = 1;
      while (i < len.length - 1 && len[i] < d) i++;
      const q = (d - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1]);
      return [lerp(S[i - 1][0], S[i][0], q), lerp(S[i - 1][1], S[i][1], q)];
    };
    PATHS[key] = { pts, at, total };
    return PATHS[key];
  }

  /** a small idea-note card: Learn card, one line of Onest 600. Returns width. */
  function noteCard(ctx, U, x, y, w, h, text, o) {
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    U.card(ctx, x, y, w, h, { r: o.r != null ? o.r : 16, glow: o.glow || 0, fill: o.fill, shadow: o.shadow != null ? o.shadow : 0.8 });
    if (text) U.text(ctx, text, x + o.tx, y + o.ty, { size: o.size, weight: 600, color: o.color || P.text, alpha: o.textAlpha });
    ctx.restore();
  }

  /** a caret (typing cursor) after a string, in the current transform */
  function caret(ctx, x, baseline, size, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = P.accent;
    ctx.fillRect(x, baseline - size * 0.8, 3, size * 1.0);
    ctx.restore();
  }

  function noteWidth(ctx, U, n) {
    if (n.kind === 'blank') return n.w;
    return U.measure(ctx, n.text, { size: NOTE_SIZE, weight: 600 }) + 56;
  }

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------
  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const U = FILM.ui;
      const t = clamp(tIn, 0, info.dur);
      const S = SCHED[U.cut(info)];
      const T = info.T;

      // --- derived timing --------------------------------------------------
      const gather = U.k(t, S.gather[0], S.gather[1], 'inOutCubic');
      const flyU = U.k(t, S.fly[0], S.fly[1], 'inOutCubic');
      const landed = t >= S.fly[0] + S.fly[1];
      const land = U.k(t, S.fly[0] + S.fly[1], 0.3, 'outCubic'); // settle / crossfade into the row
      const baseP = CHOSEN.length / GOAL.length;
      const typeP = U.k(t, S.type[0], S.type[1], 'linear');
      const goalP = !landed ? 0 : lerp(baseP, 1, typeP);
      const stepsA = S.steps.map((s0) => U.k(t, s0, 0.4, 'outCubic'));
      const active = U.k(t, S.active, 0.4, 'inOutCubic');
      const who = U.k(t, S.who, 0.4, 'outCubic');
      const lift = U.k(t, S.lift, info.dur - S.lift, 'inOutSine');
      const dimOthers = 0.45 * gather + 0.25 * U.k(t, S.fly[0], S.fly[1] + 0.6, 'inOutCubic');

      // --- 1 background ----------------------------------------------------
      U.bg(ctx, { glow: { x: 1300, y: 560, r: 900, a: 0.08 } });

      // --- 2 kicker + title (present from frame 0; the crossfade brings it in) ---
      U.kicker(ctx, 'Маршрут 3 · Свой проект', U.TITLE.x, U.TITLE.kickerY);
      U.title(ctx, 'Довести свой проект\nдо результата', U.TITLE.x, U.TITLE.y, { size: U.TITLE.size, accent: 'результата' });

      // --- 3 the other notes ----------------------------------------------
      const drift = (i, ax) => Math.sin(t * 0.9 + i * 1.7 + ax) * 4 * (1 - gather * 0.6);
      NOTES.forEach((n, i) => {
        if (n.chosen) return;
        const x = lerp(n.p0[0], n.p1[0], gather) + drift(i, 0);
        const y = lerp(n.p0[1], n.p1[1], gather) + drift(i, 2.1);
        const a = 1 - dimOthers;
        if (n.kind === 'pill') {
          U.pill(ctx, x, y, n.text, { size: 28, color: P.text2, textColor: P.text, alpha: a });
        } else if (n.kind === 'card') {
          noteCard(ctx, U, x, y, noteWidth(ctx, U, n), NOTE_H, n.text, { alpha: a, size: NOTE_SIZE, tx: 28, ty: NOTE_H / 2 + NOTE_SIZE * 0.36 });
        } else {
          ctx.save();
          ctx.globalAlpha *= a * 0.8;
          U.card(ctx, x, y, n.w, NOTE_H, { r: 16, dashed: true });
          U.skeleton(ctx, x + 24, y + 30, n.w - 48, n.short ? 1 : 2, { h: 12, gap: 24 });
          ctx.restore();
        }
      });

      // --- 4 plan sheet group ---------------------------------------------
      ctx.save();
      ctx.translate(SX, SY);
      ctx.scale(SS, SS);
      U.planSheet(ctx, 0, 0, LW, LH, { goal: goalP, steps: stepsA, active, who, glow: 0.25 * active });

      // empty step slots, waiting to be filled (fade out as each step lands on top)
      for (let i = 0; i < 3; i++) {
        const a = 1 - stepsA[i];
        if (a <= 0.01) continue;
        ctx.save();
        ctx.globalAlpha *= 0.55 * a;
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = P.border;
        U.rrect(ctx, BODY_X, STEP_Y(i), LW - 2 * BODY_X, STEP_H, 12);
        ctx.stroke();
        ctx.setLineDash([]);
        U.text(ctx, String(i + 1), BODY_X + 26, STEP_Y(i) + STEP_H / 2 + 9, { mono: true, size: 24, weight: 600, color: P.text3, alpha: 0.7 });
        ctx.restore();
      }

      // caret while « заявки» types
      if (landed) {
        const typed = U.typed(GOAL, goalP);
        const cw = U.measure(ctx, typed, GOAL_FONT);
        const on = typeP < 1 ? 1 : U.blink(T) * (1 - U.k(t, S.type[0] + S.type[1] + 0.5, 0.2, 'linear'));
        caret(ctx, BODY_X + 24 + cw + 4, GOAL_Y + 76, 34, on * U.k(t, S.fly[0] + S.fly[1], 0.12, 'linear'));
      }

      // route B: threads the rows down the left gutter
      const rowMid = [GOAL_Y + GOAL_H / 2, STEP_Y(0) + STEP_H / 2, STEP_Y(1) + STEP_H / 2, STEP_Y(2) + STEP_H / 2, WHO_Y + WHO_H / 2];
      const segT = [S.steps[0] - 0.15, S.steps[0] + 0.3, S.steps[1] + 0.3, S.steps[2] + 0.3, S.who + 0.3];
      let reachY = rowMid[0];
      for (let k = 1; k < rowMid.length; k++) {
        const q = U.k(t, segT[k - 1] + (k === 1 ? 0 : 0.0), segT[k] - segT[k - 1], 'inOutCubic');
        if (t >= segT[k - 1]) reachY = lerp(rowMid[k - 1], rowMid[k], q);
      }
      const bStarted = t > segT[0];
      if (bStarted && reachY > rowMid[0] + 0.5) {
        U.route(ctx, [[GUTTER_X, rowMid[0]], [GUTTER_X, reachY]], { straight: true, width: 4, glow: 0.8 });
      }
      // nodes where the route meets a row
      for (let k = 0; k < rowMid.length; k++) {
        const on = k === 0 ? U.k(t, S.fly[0] + S.fly[1], 0.2, 'outCubic') : clamp((reachY - rowMid[k] + 2) / 4);
        if (on <= 0) continue;
        const hot = k === 1 ? active : 0;
        ctx.save();
        ctx.globalAlpha *= on;
        ctx.beginPath();
        ctx.arc(GUTTER_X, rowMid[k], 6 + 2 * hot, 0, TAU);
        ctx.fillStyle = hot > 0 ? L.mix(P.accent, P.accentHi, hot) : P.accent;
        ctx.fill();
        ctx.restore();
      }

      // step 1 lifts (last 0.4 s): the kit's own row, redrawn magnified through a clip
      if (lift > 0) {
        const rx = BODY_X;
        const ry = STEP_Y(0);
        const rw = LW - 2 * BODY_X;
        const cx = rx + rw / 2;
        const cy = ry + STEP_H / 2;
        const sc = 1 + 0.05 * lift;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);
        // soft shadow + accent halo under the lifted row
        ctx.save();
        ctx.shadowColor = A(P.accent, 0.35 * lift);
        ctx.shadowBlur = 36 * FILM.S * SS;
        ctx.shadowOffsetY = 10 * FILM.S * SS * lift;
        U.rrect(ctx, rx, ry, rw, STEP_H, 12);
        ctx.fillStyle = P.field;
        ctx.fill();
        ctx.restore();
        U.rrect(ctx, rx - 2, ry - 2, rw + 4, STEP_H + 4, 14);
        ctx.clip();
        U.planSheet(ctx, 0, 0, LW, LH, { goal: goalP, steps: stepsA, active, who, glow: 0 });
        ctx.restore();
      }
      ctx.restore();

      // --- 5 route A: from the cluster to the goal row ---------------------
      const w0 = noteWidth(ctx, U, NOTES[0]);
      const g0 = [lerp(NOTES[0].p0[0], NOTES[0].p1[0], gather), lerp(NOTES[0].p0[1], NOTES[0].p1[1], gather) + NOTE_H / 2];
      const g1 = [NOTES[0].p1[0], NOTES[0].p1[1] + NOTE_H / 2]; // gathered anchor (left-middle)
      const goalL = [sx(GUTTER_X), sy(GOAL_Y + GOAL_H / 2)];
      const route = pathOf('A', [
        g1,
        [g1[0] + w0 + 90, g1[1] + 18],
        [930, sy(GOAL_Y + GOAL_H / 2) + 30],
        [goalL[0] - 70, goalL[1]],
        goalL,
      ]);
      if (flyU > 0) {
        U.route(ctx, route.pts, { from: 0, to: flyU, width: 4, glow: 1, head: !bStarted, alpha: landed ? 1 - 0.25 * land : 1 });
      }

      // --- 6 the chosen note ------------------------------------------------
      {
        const goalRect = [sx(BODY_X), sy(GOAL_Y), (LW - 2 * BODY_X) * SS, GOAL_H * SS];
        const glow = gather;
        let x;
        let y;
        let w;
        let h;
        let size;
        let ty;
        let tx;
        if (flyU <= 0) {
          const sc = 1 + 0.06 * E.outBack(gather) - 0.0 * gather;
          w = w0 * sc;
          h = NOTE_H * sc;
          const a0 = [g0[0] + drift(0, 0) * (1 - gather), g0[1] + drift(0, 2.1) * (1 - gather)];
          x = a0[0] - (w - w0) / 2;
          y = a0[1] - h / 2;
          size = NOTE_SIZE * sc;
          tx = 28 * sc;
          ty = h / 2 + size * 0.36;
        } else {
          const anc = route.at(flyU);
          const sc0 = 1.06;
          w = lerp(w0 * sc0, goalRect[2], flyU);
          h = lerp(NOTE_H * sc0, goalRect[3], flyU);
          // left edge rides just ahead of the route head, landing on the goal row's left edge
          x = anc[0] + lerp(-(w0 * sc0 - w0) / 2, goalRect[0] - goalL[0], flyU);
          y = anc[1] - h / 2;
          size = lerp(NOTE_SIZE * sc0, GOAL_FONT.size * SS, flyU);
          tx = lerp(28 * sc0, 24 * SS, flyU);
          ty = lerp(h / 2 + size * 0.36, 76 * SS, flyU);
        }
        const fade = landed ? 1 - land : 1;
        if (fade > 0.001) {
          noteCard(ctx, U, x, y, w, h, CHOSEN, {
            alpha: fade,
            glow: glow,
            size,
            tx,
            ty,
            r: lerp(16, 14 * SS, flyU),
            fill: L.mix(P.card, P.accentDeep, 0.12 * glow),
            shadow: 0.8 * (1 - flyU) + 0.2,
          });
        }
      }

      // --- 7 caption pill ---------------------------------------------------
      const pa = U.appear(t, S.pill, 0.45);
      if (pa > 0) {
        ctx.save();
        ctx.globalAlpha *= pa;
        ctx.translate(0, (1 - pa) * 20);
        U.pill(ctx, U.TITLE.x, 790, U.ROUTES[2].resultLong, { size: 28, icon: 'file' });
        ctx.restore();
      }
    },
  });
})();
