/*
 * 04 who-controls — «Главный вопрос». T 15.0–21.0 (shot-local t 0–6), schematic.
 * Enters with a 0.25 s fade from shot 03 (core); t = 0 is H3: the file tree at G3 on the interface
 * plate, src/ hovered and red. Leaves on H4 (the first frame of 05-engineering-frame.js).
 *
 * Beats (t → T):
 *   0.00–1.00  (15.0–16.0)  plate interface → schematic; the tree panel shrinks into the files node,
 *                           its rows retract bottom-up by 0.5, its «files» header rides the corner and lands as
 *                           the node label
 *   0.50       (15.5)       tag «// контроль» + headline; developer node pops
 *   0.75       (15.75)      agent pops; developer → agent arrow draws on
 *   1.00       (16.0)       terminal + app nodes pop; the agent turns busy
 *   1.00–2.50  (16.0–17.5)  seven wild arrows fire on irregular 16ths, each re-drawn once (a second scribble),
 *                           control points wobbling on twos
 *   2.50       (17.5)       STOP: the stop button pops on the developer node; the arrows freeze (dashed, 60 %)
 *   2.625      (17.625)     chip «выполнение остановлено»
 *   2.75       (17.75)      the agent blinks
 *   3.50–6.00  (18.5–21.0)  mechanical pulse: on every beat the frozen dashes step and a faint ring leaves the agent
 *
 * Layers, back to front:
 *   1. plate (interface crossfading to schematic)
 *   2. pulse rings
 *   3. wild arrows (shared with 05, see the SHARED block)
 *   4. developer → agent arrow
 *   5. developer node (+ stop, local: see drawDevNode), stop ripple, ui.schema tool nodes
 *   6. the tree panel morphing into the files node (t < 1)
 *   7. the agent mark + label (ui.schema's numbers, plus look / blink)
 *   8. stop chip
 *   9. tag + headline (screen-fixed; captions are core's)
 */
(function () {
  'use strict';

  const ID = 'who-controls';
  const FR = 1 / 24;

  // beats, shot-local seconds (global T = 15 + t)
  const B_MORPH = 1.0; // T 16.0   the tree has become the files node
  const B_HEAD = 0.5; // T 15.5    tag, headline, developer node
  const B_AGENT = 0.75; // T 15.75 agent, developer → agent arrow
  const B_TOOLS = 1.0; // T 16.0   terminal + app nodes; agent busy
  const B_STOP = 2.5; // T 17.5    stop, freeze
  const B_CHIP = 2.625; // T 17.625 «выполнение остановлено»
  const B_BLINK = 2.75; // T 17.75
  const B_PULSE = 3.5; // T 18.5   mechanical pulse, every beat to the end

  // ==== SHARED 04/05 — copied verbatim into 05-engineering-frame.js (H4) ========================
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

  /** The tree panel (G3) shrinking into the files node; its header becomes the node's icon + label. */
  function drawTreeMorph(ctx, L, t) {
    const ui = L.ui, P = L.pal;
    const T3 = L.GEO.TREE3;
    const N = L.GEO.TOOLS[0];
    const k = L.ease.inOutCubic(L.clamp(t / B_MORPH));
    const h0 = 76 + L.TREE.length * 72 + 20; // ui.tree panel height (672)
    const rx = L.lerp(T3.x, N.x - N.w / 2, k);
    const ry = L.lerp(T3.y, N.y - N.h / 2, k);
    const rw = L.lerp(T3.w, N.w, k);
    const rh = L.lerp(h0, N.h, k);
    const rr = L.lerp(24, 20, k);
    const danger = 1 - ui.k(t, 0, 0.25);
    // rows retract bottom-up (ui.tree's cascade run backwards) and are gone by t 0.5
    const rowsP = 1 - ui.k(t, 0.06, 0.44, 'inOutSine');
    const rowsA = L.clamp(rowsP * 5); // the header rule fades with the last rows
    // surface (fill + shadow), then the rows clipped inside it, then the outline on top
    ui.panel(ctx, rx, ry, rw, rh, { r: rr, fill: P.panel, stroke: null });
    if (rowsA > 0) {
      const s = rw / T3.w;
      const a0 = ctx.globalAlpha;
      ctx.save();
      ctx.beginPath();
      ui.rr(ctx, rx + 2, ry + 2, rw - 4, rh - 4, Math.max(0, rr - 2));
      ctx.clip();
      ctx.translate(rx, ry);
      ctx.scale(s, s);
      ctx.translate(-T3.x, -T3.y);
      ctx.globalAlpha = a0 * rowsA;
      ui.tree(ctx, T3.x, T3.y, T3.w, { hi: 0, danger, p: rowsP });
      // the tree's own header is hidden here: it is redrawn below, riding the panel corner
      ctx.globalAlpha = a0;
      ctx.fillStyle = P.panel;
      ctx.fillRect(T3.x + 2, T3.y + 2, T3.w - 4, 72);
      ctx.restore();
    }
    ui.panel(ctx, rx, ry, rw, rh, { r: rr, fill: null, stroke: P.hairHi });
    // header «files»: tree header (icon 30 at +44/+40, mono 26 txtDim at +72/+42) → node (icon 40 at +48/+46, mono 32 600 txt at +84/+47)
    const col = L.mix(P.txtDim, P.txt, k);
    ui.icon(ctx, 'folder', rx + L.lerp(44, 48, k), ry + L.lerp(40, 46, k), L.lerp(30, 40, k), { color: col, lw: L.lerp(2.5, 3.6, k) });
    ui.label(ctx, 'files', rx + L.lerp(72, 84, k), ry + L.lerp(42, 47, k), { size: L.lerp(26, 32, k), font: 'mono', weight: k < 0.5 ? 500 : 600, color: col, baseline: 'middle' });
  }

  /** The press: one orange ripple leaves the stop button (8 frames), gone long before H4. */
  function drawStopRipple(ctx, L, t) {
    const u = L.ui.kf(t, B_STOP, 8 * FR);
    if (u <= 0 || u >= 1) return;
    const D = L.GEO.DEV;
    const e = L.ease.outCubic(u);
    ctx.save();
    ctx.globalAlpha *= 0.7 * (1 - u);
    ctx.strokeStyle = L.pal.sig;
    ctx.lineWidth = L.lerp(4, 1.5, u);
    ctx.beginPath();
    ctx.arc(D.x + D.w / 2, D.y, L.lerp(30, 78, e), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /** A faint ring leaving the agent on every beat from B_PULSE (the shape of the core that 05 draws). */
  function drawPulseRings(ctx, L, t) {
    if (t < B_PULSE - 1e-6) return;
    const ui = L.ui, P = L.pal, C = L.GEO.CORE;
    const cx = C.x + C.w / 2, cy = C.y + C.h / 2;
    const n = Math.floor((t - B_PULSE) / 0.5 + 1e-6);
    for (let b = Math.max(0, n - 1); b <= n; b++) {
      const u = ui.kf(t, B_PULSE + b * 0.5, 8 * FR);
      if (u <= 0 || u >= 1) continue;
      const e = L.ease.outCubic(u);
      const w = L.lerp(150, C.w + 60, e), h = L.lerp(130, C.h + 40, e);
      ctx.save();
      ctx.globalAlpha *= 0.25 * (1 - u);
      ctx.strokeStyle = P.sig;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ui.rr(ctx, cx - w / 2, cy - h / 2, w, h, 30);
      ctx.stroke();
      ctx.restore();
    }
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui, P = L.pal;
      const t = L.clamp(tIn, 0, info.dur);

      // 1. plate: interface (H3) → schematic
      const pk = ui.k(t, 0, B_MORPH, 'inOutSine');
      if (pk < 1) ui.bg(ctx, { plate: 'interface', oy: -info.T * 12 });
      if (pk > 0) {
        ctx.save();
        ctx.globalAlpha *= pk;
        ui.bg(ctx, { plate: 'schematic' });
        ctx.restore();
      }

      // 2. pulse rings (T 18.5 on)
      drawPulseRings(ctx, L, t);

      // 3. wild arrows: live 16.0–17.5, frozen after; the dashes step on every beat from 18.5
      const steps = t < B_PULSE - 1e-6 ? 0 : Math.floor((t - B_PULSE) / 0.5 + 1e-6) + 1;
      drawWild(ctx, L, t, { dashOffset: 6 * steps });

      // 4. developer → agent
      drawDevArrow(ctx, L, ui.kf(t, B_AGENT, 6 * FR, 'outCubic'), 1);

      // 5. developer node (+ stop) and tool nodes; files is the morphing tree until B_MORPH
      const kT = ui.kf(t, B_TOOLS, 6 * FR);
      const tools = kT <= 0 ? 0 : kT >= 1 ? 1 : 1 / 3 + (2 / 3) * kT;
      drawDevNode(ctx, L, ui.kf(t, B_HEAD, 4 * FR), ui.kf(t, B_STOP, 4 * FR), 1);
      drawStopRipple(ctx, L, t);
      ui.schema(ctx, { agent: 0, tools });

      // 6. the tree → files node
      if (t < B_MORPH - 1e-6) drawTreeMorph(ctx, L, t);

      // 7. agent: busy while the arrows are live, eyes darting on twos; one blink after the stop
      const busy = t >= B_TOOLS - 1e-6 && t < B_STOP - 1e-6;
      const look = busy ? L.clamp(1.6 * L.noise1(L.onTwos(t) * 6 + 0.5, L.hash(ID, 'look') & 0x7fffffff), -1, 1) : 0;
      const bf = Math.floor((t - B_BLINK) * 24 + 1e-6);
      const blink = bf >= 0 && bf < 4 ? [0.55, 1, 1, 0.45][bf] : 0;
      drawAgentH4(ctx, L, { p: ui.kf(t, B_AGENT, 4 * FR), state: busy ? 'busy' : 'idle', look, blink, label: 'агент' });

      // 8. stop chip
      drawStopChip(ctx, L, ui.pop(t, B_CHIP, 4 * FR), 1);

      // 9. tag + headline
      ui.tag(ctx, '// контроль', t - B_HEAD);
      ui.headline(ctx, HEAD04, t - B_HEAD);
    },
  });
})();
