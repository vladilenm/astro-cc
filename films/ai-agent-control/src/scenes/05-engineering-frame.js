/*
 * 05 engineering-frame — «Инженерная рамка». T 21.0–27.0 (shot-local t 0–6), schematic.
 * Hard cut from H4: t = 0 is exactly the last frame of 04-who-controls.js (developer + stop, the chip,
 * the agent, the tools, the frozen dashed wild arrows). The SHARED block below is a verbatim copy of
 * the one in 04, so both sides of the cut draw the same pixels.
 *
 * Beats (t → T):
 *   0.00          (21.0)         H4
 *   0.00–0.25     (21.0–21.25)   developer node, stop chip, developer arrow fade out; 04's tag/headline exit (0.2 s)
 *   0.00–0.375    (21.0–21.375)  the core draws on around the agent
 *   0.125         (21.125)       label «агент» → «модель» (3-frame crossfade)
 *   0.50          (21.5)         tag «// ai engineering» + headline «AI Engineering = система вокруг модели»
 *   0.5 1.5 2.5 3.5 (21.5 … 24.5) rings 1–4 draw on (10 frames, outExpo), orange while drawing, cooling over 0.5 s;
 *                                as each ring lands a share of the frozen arrows dissolves (6 frames): none after ring 4
 *   4.00–4.75     (25.0–25.75)   clean orange routes core → tools; gates pop 4.25–4.75; tools light at 4.5
 *   5.00–6.00     (26.0–27.0)    signal dots travel the routes on every beat. Hold.
 *
 * Layers, back to front:
 *   1. plate (schematic, locked)
 *   2. frozen wild arrows (dissolving), dashes still stepping on beats
 *   3. developer → agent arrow, developer node (fading out)
 *   4. ui.schema: rings, routes, gates, pulses, core, tools
 *   5. agent mark + label (ui.schema's numbers, label crossfade)
 *   6. stop chip (fading out)
 *   7. tags + headlines (screen-fixed; captions are core's)
 */
(function () {
  'use strict';

  const ID = 'engineering-frame';
  const FR = 1 / 24;

  // beats, shot-local seconds (global T = 21 + t)
  const B_LABEL = 0.125; // T 21.125 «агент» → «модель»
  const B_HEAD = 0.5; // T 21.5
  const RING_T = [0.5, 1.5, 2.5, 3.5]; // T 21.5, 22.5, 23.5, 24.5
  const B_ROUTES = 4.0; // T 25.0
  const B_GATES = 4.25; // T 25.25
  const B_TOOLS_ON = 4.5; // T 25.5 the routes reach the tools
  const B_PULSE = 5.0; // T 26.0
  const HEAD05 = ['AI Engineering =', '[система вокруг модели]'];

  // H4: shot 04 ends with its dash pattern stepped five times (beats 18.5 … 20.5), 6 px each
  const H4_DASH = 30;
  // which ring dissolves each wild arrow (index into WILD): strays go with the task, misses with the
  // tools, the half-drawn terminal command with the permissions, the last strays with the checks
  const DISSOLVE = [1, 3, 1, 0, 0, 2, 3];

  // ==== SHARED 04/05 — copied verbatim from 04-who-controls.js (H4) ========================
  // The seven wild arrows of shot 04 and the other pieces of the H4 frame. Times are shot-04 local
  // (t 0 = T 15.0). The arrows are live from their fire time to WILD_FREEZE and frozen after it.
  const WILD_ID = 'who-controls';
  const WILD_FREEZE = 2.5; // T 17.5: the developer presses stop
  const WILD_REDRAW = 0.375; // the second scribble starts three 16ths after the first
  const WILD_DASH = [14, 10];
  // f: fire time; a / b: first / second scribble as cubic [P0, C1, C2, P1]; every tip misses its node
  const WILD = [
    { f: 1.0, aim: 'files', a: [[492, 930], [420, 1010], [300, 1030], [205, 1196]], b: [[492, 930], [380, 990], [150, 1040], [74, 1220]] },
    { f: 1.125, aim: 'edge right', a: [[600, 872], [720, 870], [850, 770], [1000, 800]], b: [[600, 872], [760, 920], [900, 690], [1050, 742]] },
    { f: 1.375, aim: 'app', a: [[598, 930], [780, 960], [960, 1010], [1010, 1182]], b: [[598, 930], [700, 1010], [820, 1070], [880, 1192]] },
    { f: 1.5, aim: 'edge left', a: [[484, 902], [380, 930], [250, 860], [110, 940]], b: [[484, 902], [360, 990], [200, 880], [40, 1004]] },
    { f: 1.75, aim: 'edge top-left', a: [[488, 866], [360, 850], [250, 790], [150, 650]], b: [[488, 866], [330, 870], [150, 770], [86, 574]] },
    { f: 2.0, aim: 'terminal', a: [[596, 938], [660, 1040], [730, 1150], [702, 1216]], b: [[596, 938], [625, 1090], [470, 1110], [388, 1212]] },
    { f: 2.25, aim: 'edge bottom-right', a: [[602, 906], [800, 920], [1090, 1100], [1030, 1436]], b: null },
  ];
  const HEAD04 = ['Кто [контролирует]', 'работу агента?'];

  /** One scribble at drawing time tw: control points and tip wobble with seeded noise. */
  function wildCurve(L, P4, i, v, tw) {
    const amp = [0, 38, 38, 10];
    const Q = P4.map((p, j) => {
      if (!amp[j]) return p;
      const nx = L.noise1(tw * 5 + 0.37 + j * 1.9, L.hash(WILD_ID, i, v, j, 0) & 0x7fffffff);
      const ny = L.noise1(tw * 5 + 0.37 + j * 1.9, L.hash(WILD_ID, i, v, j, 1) & 0x7fffffff);
      return [p[0] + nx * amp[j], p[1] + ny * amp[j]];
    });
    return L.ui.bezier(Q[0], Q[1], Q[2], Q[3], 36);
  }

  /** The visible scribbles at shot-04 time t (t past WILD_FREEZE returns the frozen state). */
  function wildArrows(L, t) {
    const ui = L.ui;
    const tt = Math.min(t, WILD_FREEZE);
    const tw = L.onTwos(tt);
    const out = [];
    for (let i = 0; i < WILD.length; i++) {
      const w = WILD[i];
      if (tt < w.f - 1e-6) continue;
      const r2 = w.b ? w.f + WILD_REDRAW : Infinity;
      const pA = ui.kf(tt, w.f, 6 * (1 / 24), 'outCubic');
      const eA = w.b ? ui.kf(tt, r2, 4 * (1 / 24), 'outCubic') : 0; // the first scribble retracts tail-first
      if (eA < 1) out.push({ i, pts: wildCurve(L, w.a, i, 0, tw), p: pA, from: eA, a: 1 - 0.8 * eA });
      if (w.b && tt >= r2 - 1e-6) out.push({ i, pts: wildCurve(L, w.b, i, 1, tw), p: ui.kf(tt, r2, 8 * (1 / 24)), from: 0, a: 1 });
    }
    return out;
  }

  /** Draws the wild arrows; o.alpha[i] fades arrow i, o.dashOffset steps the frozen dashes. */
  function drawWild(ctx, L, t, o) {
    const ui = L.ui;
    const sig = L.pal.sig;
    const frozen = t >= WILD_FREEZE - 1e-6;
    for (const A of wildArrows(L, t)) {
      const am = (o && o.alpha ? o.alpha[A.i] : 1) * A.a;
      if (am <= 0.002) continue;
      if (frozen) {
        ui.arrow(ctx, A.pts, { p: A.p, from: A.from, r: 0, lw: 3, headSize: 16, color: sig, alpha: 0.6 * am, dash: WILD_DASH, dashOffset: (o && o.dashOffset) || 0 });
      } else {
        ui.arrow(ctx, A.pts, { p: A.p, from: A.from, r: 0, lw: 3, headSize: 16, color: sig, alpha: am, glow: A.p < 1 ? 0.55 : 0 });
      }
    }
  }

  /** ui.schema's agent + label with the same numbers, plus look / blink and a label crossfade (schema exposes neither). */
  function drawAgentH4(ctx, L, o) {
    const ui = L.ui, A = L.GEO.AGENT;
    const ap = L.clamp(o.p != null ? o.p : 1);
    if (ap <= 0) return;
    const sc = 0.8 + 0.2 * L.ease.outBack(ap);
    ctx.save();
    ctx.globalAlpha *= L.clamp(ap * 1.6);
    ui.agent(ctx, A.x, A.y, A.s * sc, { glow: 1, state: o.state || 'idle', look: o.look || 0, blink: o.blink || 0 });
    const lab = { size: 28, font: 'mono', weight: 500, color: L.pal.txtDim, align: 'center' };
    const q = L.clamp(o.mix || 0);
    if (q < 1) ui.label(ctx, o.label || 'агент', A.x, 968, Object.assign({ alpha: 1 - q }, lab));
    if (q > 0) ui.label(ctx, o.label2 || 'агент', A.x, 968, Object.assign({ alpha: q }, lab));
    ctx.restore();
  }

  /** The developer → agent arrow (storyboard 04 Forms). */
  function drawDevArrow(ctx, L, p, alpha) {
    if (p <= 0 || alpha <= 0) return;
    const D = L.GEO.DEV;
    L.ui.arrow(ctx, [[D.x, D.y + D.h / 2], [D.x, 818]], { p, color: L.pal.txtDim, lw: 3, alpha });
  }

  /**
   * The developer node at G4 DEV with its stop button. Local instead of ui.schema's dev/devStop: the kit
   * draws the label at the node's left + 28 and the user mark centred at left + 52, so «раз» of
   * «разработчик» sits under the mark. Same node, mark and button drawing; the label starts after the
   * mark and the button sits as a badge on the node's right edge so the full label fits.
   */
  function drawDevNode(ctx, L, p, stop, alpha) {
    p = L.clamp(p);
    if (p <= 0 || alpha <= 0) return;
    const ui = L.ui, P = L.pal, D = L.GEO.DEV;
    const sc = 0.86 + 0.14 * L.ease.outBack(p);
    ctx.save();
    ctx.globalAlpha *= alpha * L.clamp(p * 1.6);
    ctx.translate(D.x, D.y);
    ctx.scale(sc, sc);
    ui.panel(ctx, -D.w / 2, -D.h / 2, D.w, D.h, { r: 20, fill: P.panel, stroke: P.hairHi, lw: 2 });
    ui.user(ctx, -D.w / 2 + 52, 0, 60);
    ui.label(ctx, 'разработчик', -D.w / 2 + 98, 1, { size: 30, weight: 600, color: P.txt, baseline: 'middle' });
    const st = L.clamp(stop || 0);
    if (st > 0) {
      const bs = L.ease.outBack(L.clamp(st * 1.5));
      ctx.save();
      ctx.translate(D.w / 2, 0);
      ctx.scale(bs, bs);
      ui.glow(ctx, 0, 0, 70, P.sig, 0.5 * st);
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fillStyle = P.sigTint;
      ctx.fill();
      ctx.strokeStyle = P.sig;
      ctx.lineWidth = 3;
      ctx.stroke();
      ui.icon(ctx, 'stop', 0, 0, 30, { color: P.sig });
      ctx.restore();
    }
    ctx.restore();
  }

  /** The chip «выполнение остановлено» under the developer node, centred (540, 724); 26 px (art bible minimum). */
  function drawStopChip(ctx, L, sc, alpha) {
    if (sc <= 0 || alpha <= 0) return;
    const P = L.pal;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(540, 724);
    ctx.scale(sc, sc);
    L.ui.chip(ctx, 'выполнение остановлено', 0, 0, { align: 'center', size: 26, font: 'mono', weight: 500, color: P.sig, fill: P.sigTint, stroke: P.sigDeep, icon: 'stop', h: 44 });
    ctx.restore();
  }
  // ==== end SHARED 04/05 ==========================================================================

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui;
      const t = L.clamp(tIn, 0, info.dur);

      // 1. plate
      ui.bg(ctx, { plate: 'schematic' });

      // 2. the frozen arrows from shot 04: dissolve as the rings land; dashes keep stepping on the beat
      const alpha = DISSOLVE.map((d) => 1 - ui.k(t, RING_T[d] + 0.125, 6 * FR));
      if (alpha.some((a) => a > 0)) drawWild(ctx, L, WILD_FREEZE, { dashOffset: H4_DASH + 6 * Math.floor(t / 0.5 + 1e-6), alpha });

      // 3. developer, its arrow and the stop button leave (21.0–21.25)
      const devA = 1 - ui.k(t, 0, 0.25);
      drawDevArrow(ctx, L, 1, devA);
      drawDevNode(ctx, L, 1, 1, devA);

      // 4. the frame around the model
      const rings = RING_T.map((r) => ui.kf(t, r, 10 * FR, 'outExpo'));
      const ringGlow = RING_T.map((r) => (t < r - 1e-6 ? 0 : 1 - ui.k(t, r + 10 * FR, 0.5, 'inOutSine')));
      const toolOn = ui.kf(t, B_TOOLS_ON, 3 * FR);
      ui.schema(ctx, {
        agent: 0,
        core: ui.k(t, 0, 0.375, 'outCubic'),
        rings,
        ringGlow,
        tools: 1,
        toolsActive: [toolOn, toolOn, toolOn],
        routes: ui.kf(t, B_ROUTES, 0.75, 'outCubic'),
        gates: ui.kf(t, B_GATES, 0.5),
        pulse: t >= B_PULSE - 1e-6 ? info.T : null,
      });

      // 5. the agent becomes «модель»
      drawAgentH4(ctx, L, { p: 1, state: 'idle', label: 'агент', label2: 'модель', mix: ui.kf(t, B_LABEL, 3 * FR) });

      // 6. stop chip leaves with the developer
      drawStopChip(ctx, L, 1, devA);

      // 7. tag + headline: 04's exit (0.2 s), 05's enter at 21.5
      if (t < 0.3) {
        ui.tag(ctx, '// контроль', 10, { out: t * 1.25 });
        ui.headline(ctx, HEAD04, 10, { out: t, outDur: 0.2 });
      }
      ui.tag(ctx, '// ai engineering', t - B_HEAD);
      ui.headline(ctx, HEAD05, t - B_HEAD);
    },
  });
})();
