/*
 * 07 verify : «Проверяем результат» — T 33.0–39.0 (6 s), interface plate, enters on a hard cut.
 *
 * After the changes, a check: the execution history lights step by step on an accelerating rhythm,
 * then the compact app slides back in, the query «оплат» finds ticket 1042 and a green test badge
 * lights on T 37.5 (the resolving chord).
 *
 * Layers, back to front:
 *   1 plate (ui.bg, dot grid drifting 6 px per beat)
 *   2 tag «// проверка» + headline «Видно, что сделал агент. / Видно, что работает.» (screen-fixed)
 *   3 history panel «история выполнения»: the step line, four step nodes, step labels
 *   4 compact app (ui.app at 0.859 scale, top 400 design px, bottom dissolving into the plate)
 *   5 test link (step 4 → badge) and the green test badge
 *
 * Beats (shot-local t, global T in comments):
 *   0.000 T 33.00  history panel slides up 40 px + fades (6 frames)
 *   0.250 T 33.25  tag + headline
 *   0.500 T 33.50  step 1 «Прочитал файлы»        1.500 T 34.50  step 2 «Предложил изменения»
 *   2.250 T 35.25  step 3 «Получил подтверждение»  2.750 T 35.75  step 4 «Проверил поиск»
 *   3.000 T 36.00  compact app slides in from the right (x 1100 → 162, outCubic, 8 frames)
 *   3.500 T 36.50  «оплат» typed on 16ths, one letter per click (36.5 … 37.0)
 *   4.250 T 37.25  filter 0 → 1
 *   4.500 T 37.50  mark → 1, test badge pops green, step 4's node turns green
 */
(function () {
  'use strict';

  const ID = 'verify';
  const FR = 1 / 24;

  // ---- geometry (docs/storyboard.md, shot 07) ----------------------------------
  const HIST = { x: 90, y: 572, w: 900, h: 396, r: 28 };
  const NODE_X = 146;
  const NODE_R = 16;
  const TEXT_X = 186;
  const STEPS = [
    { cy: 676, label: 'Прочитал файлы', t: 0.5 }, // T 33.50
    { cy: 752, label: 'Предложил изменения', t: 1.5 }, // T 34.50
    { cy: 828, label: 'Получил подтверждение', t: 2.25, user: true }, // T 35.25
    { cy: 904, label: 'Проверил поиск', t: 2.75 }, // T 35.75
  ];
  const APP = { x: 162, y: 1000, w: 756 };
  const APP_S = APP.w / 880;
  const APP_CLIP = 404; // design px kept (title bar, header, search, first row)
  const APP_BOTTOM = APP.y + APP_CLIP * APP_S; // ≈ 1347
  const FADE_H = 30; // the last 30 px dissolve into the plate
  const BADGE = { x: 918, y: 984, str: 'тест: поиск находит обращение', size: 28 };

  // ---- beats (shot-local seconds) ----------------------------------------------
  const B_HEAD = 0.25; // T 33.25
  const B_APP = 3.0; // T 36.00
  const B_TYPE = 3.5; // T 36.50
  const B_FILTER = 4.25; // T 37.25
  const B_PASS = 4.5; // T 37.50
  const QUERY = 'оплат';

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, u) => a + (b - a) * u;

  // A scratch layer for the compact app's dissolve. Fully cleared and redrawn every frame it is used,
  // so nothing carries over between frames (it is a buffer, not a cache).
  let SCRATCH = null;
  function scratch(w, h) {
    if (!SCRATCH || SCRATCH.width !== w || SCRATCH.height !== h) {
      SCRATCH = FILM.makeCanvas(w, h);
    }
    return SCRATCH;
  }

  function drawHistory(ctx, L, t) {
    const P = L.pal, ui = L.ui;
    const k = ui.kf(t, 0, 6 * FR, 'outCubic');
    ctx.save();
    ctx.globalAlpha *= clamp(k * 1.2);
    ctx.translate(0, (1 - k) * 40);
    ui.panel(ctx, HIST.x, HIST.y, HIST.w, HIST.h, { r: HIST.r, fill: P.panel, stroke: P.hairHi });
    ui.label(ctx, 'история выполнения', 130, 618, { size: 26, font: 'mono', weight: 500, color: P.txtFaint, tracking: 0.5 });
    // step counter on the right: how many steps are done
    let done = 0;
    for (const s of STEPS) if (t >= s.t - 1e-6) done++;
    ui.label(ctx, `${done}/${STEPS.length}`, HIST.x + HIST.w - 40, 618, { size: 26, font: 'mono', weight: 500, color: done ? P.txtDim : P.txtFaint, align: 'right' });

    // the step line: a faint hair from node 1 to node 4, then orange segments drawing on
    const y0 = STEPS[0].cy, y3 = STEPS[STEPS.length - 1].cy;
    ctx.fillStyle = P.hair;
    ctx.fillRect(NODE_X - 1, y0, 2, y3 - y0);
    for (let i = 0; i < STEPS.length - 1; i++) {
      const s = STEPS[i], n = STEPS[i + 1];
      const d = ui.kf(t, s.t, 6 * FR, 'outCubic');
      if (d <= 0) continue;
      const a = s.cy + NODE_R, b = n.cy - NODE_R;
      ctx.fillStyle = P.sig;
      ctx.fillRect(NODE_X - 1.5, a, 3, (b - a) * d);
    }

    // steps
    for (let i = 0; i < STEPS.length; i++) {
      const s = STEPS[i];
      const on = t >= s.t - 1e-6;
      const pk = ui.pop(t, s.t);
      const lit = ui.kf(t, s.t, 4 * FR);
      // step 4 turns green when the test passes: a green node pops over the orange one (no muddy blend)
      const green = i === STEPS.length - 1 ? ui.pop(t, B_PASS) : 0;
      // hollow node (before)
      ctx.beginPath();
      ctx.arc(NODE_X, s.cy, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = P.panel;
      ctx.fill();
      ctx.strokeStyle = P.hairHi;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (on) {
        // glow flash on the pop, and again (green) when the test passes
        const fl = 1 - clamp((t - s.t) / (12 * FR));
        ui.glow(ctx, NODE_X, s.cy, 70, P.sig, 0.55 * fl);
        if (green > 0) {
          const gf = 1 - clamp((t - B_PASS) / (14 * FR));
          ui.glow(ctx, NODE_X, s.cy, 80, P.ok, 0.18 + 0.6 * gf);
        }
        const r = NODE_R * Math.max(0, pk);
        ctx.beginPath();
        ctx.arc(NODE_X, s.cy, r, 0, Math.PI * 2);
        ctx.fillStyle = P.sig;
        ctx.fill();
        if (green > 0) {
          ctx.beginPath();
          ctx.arc(NODE_X, s.cy, NODE_R * green, 0, Math.PI * 2);
          ctx.fillStyle = P.ok;
          ctx.fill();
        }
        if (pk > 0.6) ui.icon(ctx, 'check', NODE_X, s.cy + 1, 20 * Math.min(1, pk), { color: P.bg, lw: 3.5 });
      }
      // label: faint before, bright after
      const col = on ? L.mix(P.txtFaint, P.txt, lit) : P.txtFaint;
      const lw = ui.label(ctx, s.label, TEXT_X, s.cy + 1, { size: 36, weight: 600, color: col, baseline: 'middle', tracking: -0.3 });
      if (s.user && on) {
        const up = ui.pop(t, s.t + 2 * FR);
        if (up > 0) {
          ctx.save();
          ctx.translate(TEXT_X + lw + 34, s.cy);
          ctx.scale(up, up);
          ui.user(ctx, 0, 0, 36, { ring: P.sigDeep });
          ctx.restore();
        }
      }
    }
    ctx.restore();
  }

  /** ui.app state at shot time t. «оплат» is typed one letter per 16th: 36.5, 36.625 … 37.0 (the five key clicks). */
  function appState(ui, t, T) {
    const typedN = t >= B_TYPE - 1e-6 ? Math.min(QUERY.length, Math.floor((t - B_TYPE) * 8 + 1e-6) + 1) : 0;
    const q = QUERY.slice(0, typedN);
    const typing = t >= B_TYPE - 1e-6 && t < B_TYPE + 0.5 + 2 * FR;
    return {
      search: 1,
      focus: 1,
      query: q,
      caret: true,
      t: typing ? 0 : T, // solid caret while typing, blinking otherwise
      filter: t >= B_FILTER - 1e-6 ? (t - B_FILTER + FR) / (B_PASS - B_FILTER) : 0,
      mark: ui.kf(t, B_PASS, 4 * FR),
    };
  }

  /** The compact app: top 404 design px only, its bottom 30 px dissolving into the plate. */
  function drawApp(ctx, L, x, st) {
    const S = ctx.canvas.width / FILM.W; // device pixels per logical pixel (the base transform)
    const pad = 44;
    const rx = Math.floor(x - pad), ry = APP.y - pad;
    const rw = Math.ceil(APP.w + pad * 2), rh = Math.ceil(APP_BOTTOM - ry);
    const cw = Math.max(2, Math.ceil(rw * S)), ch = Math.max(2, Math.ceil(rh * S));
    const c = scratch(cw, ch);
    const g = c.getContext('2d');
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, cw, ch);
    g.setTransform(S, 0, 0, S, -rx * S, -ry * S);
    L.ui.app(g, x, APP.y, APP.w, st);
    // dissolve the bottom edge
    g.globalCompositeOperation = 'destination-out';
    const gr = g.createLinearGradient(0, APP_BOTTOM - FADE_H, 0, APP_BOTTOM);
    gr.addColorStop(0, L.rgba(L.pal.bg, 0));
    gr.addColorStop(1, L.rgba(L.pal.bg, 1));
    g.fillStyle = gr;
    g.fillRect(rx, APP_BOTTOM - FADE_H, rw, FADE_H + 2);
    g.restore();
    ctx.drawImage(c, 0, 0, cw, ch, rx, ry, cw / S, ch / S);
  }

  /**
   * The empty slot where the app will land: a quiet dashed outline with the app icon, so the lower
   * stage is not a void while the history lights. Fades in with the headline, fades out as the app arrives.
   */
  function drawSlot(ctx, L, t, kA) {
    const P = L.pal, ui = L.ui;
    const a = ui.kf(t, B_HEAD, 8 * FR, 'outCubic') * (1 - kA);
    if (a <= 0) return;
    const x = APP.x, y = APP.y, w = APP.w, h = APP_BOTTOM - APP.y, r = 28 * APP_S;
    ctx.save();
    ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, L.rgba(P.hairHi, 1));
    g.addColorStop(0.6, L.rgba(P.hairHi, 0.6));
    g.addColorStop(1, L.rgba(P.hairHi, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.setLineDash([]);
    ui.icon(ctx, 'app', 540, 1142, 48, { color: P.txtFaint, lw: 3 });
    ui.label(ctx, 'приложение', 540, 1212, { size: 26, font: 'mono', weight: 500, color: P.txtFaint, align: 'center', tracking: 0.5 });
    ctx.restore();
  }

  function drawBadge(ctx, L, t) {
    const P = L.pal, ui = L.ui;
    const pk = ui.pop(t, B_PASS);
    if (pk <= 0) return;
    const o = { size: BADGE.size, weight: 600, icon: 'check', color: P.ok, fill: P.okTint, stroke: P.ok, h: 52, padX: 20, lw: 2.5 };
    const tw = ui.measure(ctx, BADGE.str, { size: o.size, weight: o.weight });
    const w = tw + o.padX * 2 + o.size + 10;
    const cx = BADGE.x - w / 2;
    // green glow flash 0.6 → 0.2 over 12 frames, then holds
    const fl = 1 - clamp((t - B_PASS) / (12 * FR));
    ui.glow(ctx, cx, BADGE.y, 230, P.ok, 0.12 + 0.48 * fl);
    ctx.save();
    ctx.globalAlpha *= clamp(pk * 2);
    ctx.translate(cx, BADGE.y);
    ctx.scale(pk, pk);
    ui.chip(ctx, BADGE.str, -w / 2, 0, o);
    ctx.restore();
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, P = L.pal, ui = L.ui;
      const t = clamp(tIn, 0, info.dur);
      const T = info.shot.start + t;

      // 1 plate
      ui.bg(ctx, { plate: 'interface', oy: -T * 12 });

      // 2 tag + headline (screen-fixed)
      ui.tag(ctx, '// проверка', t - B_HEAD);
      ui.headline(ctx, ['Видно, что сделал агент.', 'Видно, [что работает.]'], t - B_HEAD);

      // 3 execution history
      drawHistory(ctx, L, t);

      // 4 the compact app slides in from the right
      const kA = ui.kf(t, B_APP, 8 * FR, 'outCubic');
      drawSlot(ctx, L, t, kA);
      if (kA > 0) {
        const x = lerp(1100, APP.x, kA);
        drawApp(ctx, L, x, appState(ui, t, T));
      }

      // 5 the green test badge
      drawBadge(ctx, L, t);
    },
  });
})();
