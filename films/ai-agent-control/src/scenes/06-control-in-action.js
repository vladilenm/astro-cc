/*
 * 06 control-in-action : «Контроль в действии» — T 27.0–33.0 (6 s), interface plate, enters on a hard cut.
 *
 * An example setup of agent rules (labelled «пример настройки», never a universal guarantee):
 * read files → allowed, change files → with confirmation, delete → forbidden. The agent token walks the
 * track down the rules: passes row 1, waits at row 2, hits the red barrier before row 3; the blocked
 * attempt becomes a confirmation request for the developer.
 *
 * Layers, back to front:
 *   1 plate (ui.bg, dot grid drifting 6 px per beat)
 *   2 tag «// правила» + headline «Доступ. Лимиты. / Подтверждение.» (screen-fixed)
 *   3 rules panel «Правила агента»: shield, title, «пример настройки» chip, limits line
 *   4 three rule rows (slide in from the right; tint + chip lights when the token reaches them)
 *   5 track: hair line, orange trail behind the token, stations, the red barrier
 *   6 agent token (idle → busy → waits → blocked; recoil + shake on twos)
 *   7 dim veil over the rules (from 31.0)
 *   8 confirmation request for the developer (pops at 31.0, glow breathes once per bar)
 *
 * Beats (shot-local t, global T in comments):
 *   0.000 T 27.00  panel slides up 40 px + fades (6 frames)
 *   0.250 T 27.25  tag + headline; the token appears at the top of the track
 *   0.500 T 27.50  row 1 slides in       1.000 T 28.00  token reaches row 1: «можно» lights
 *   1.500 T 28.50  row 2 slides in       2.000 T 29.00  token reaches row 2: «подтверждение» pulses, token waits
 *   2.500 T 29.50  row 3 + barrier       3.500 T 30.50  token hits the barrier: blocked, «запрещено» lights
 *   4.000 T 31.00  confirmation request pops, the rules dim to 70 %
 */
(function () {
  'use strict';

  const ID = 'control-in-action';
  const FR = 1 / 24;

  // ---- geometry (docs/storyboard.md, shot 06) ----------------------------------
  const PANEL = { x: 90, y: 580, w: 900, h: 720, r: 28 };
  const TRACK = { x: 144, y0: 760, y1: 1240 }; // spec x 150, moved 6 px left so the token clears the rows
  const COL_X = 190; // left edge of the text column: title, limits line, rows
  const ROW = { x: 190, w: 760, h: 130, r: 20 };
  const BARRIER = { y: 1060, x0: TRACK.x - 40, x1: TRACK.x + 40 };
  const TOKEN_S = 64;
  const TOKEN_Y0 = 740;
  // the token's head bottom is cy + 0.4 s; it touches the barrier's top face (y − 3) with its outline
  const TOKEN_HIT = BARRIER.y - 3 - TOKEN_S * 0.4 - 2;
  const TOKEN_REST = TOKEN_HIT - 24; // recoil 24 px up
  const REQ = { x: 170, y: 1196, w: 740, h: 184, r: 24 }; // spec y 1120 h 210: moved below row 3 so no row is half-covered

  // ---- beats (shot-local seconds) ----------------------------------------------
  const B_HEAD = 0.25; // T 27.25 tag + headline, token appears
  const ROWS = [
    { cy: 820, icon: 'eye', label: 'Читать файлы', chip: 'можно', chipIcon: 'check', kind: 'allow', tIn: 0.5, tHit: 1.0 },
    { cy: 970, icon: 'pencil', label: 'Изменять файлы', chip: 'подтверждение', chipIcon: 'user', kind: 'ask', tIn: 1.5, tHit: 2.0 },
    { cy: 1120, icon: 'trash', label: 'Удалять', chip: 'запрещено', chipIcon: 'block', kind: 'deny', tIn: 2.5, tHit: 3.5 },
  ];
  const M1 = [1.0 - 8 * FR, 1.0]; // T 27.667–28.0 token → row 1 (outCubic, 8 frames)
  const M2 = [1.5, 2.0]; // T 28.5–29.0 token → row 2
  const WAIT = [2.0, 2.5]; // T 29.0–29.5 waits for confirmation (ring fills)
  const M3 = [2.75, 3.5]; // T 29.75–30.5 token → barrier (accelerating into the hit)
  const B_HIT = 3.5; // T 30.5
  const B_REQ = 4.0; // T 31.0

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, u) => a + (b - a) * u;

  /** Token centre y and x shake at shot time t. */
  function tokenPose(L, t) {
    const E = L.ease;
    let y = TOKEN_Y0;
    if (t >= M1[0]) y = lerp(TOKEN_Y0, ROWS[0].cy, E.outCubic((t - M1[0]) / (M1[1] - M1[0])));
    if (t >= M2[0]) y = lerp(ROWS[0].cy, ROWS[1].cy, E.outCubic((t - M2[0]) / (M2[1] - M2[0])));
    if (t >= M3[0]) y = lerp(ROWS[1].cy, TOKEN_HIT, E.inCubic((t - M3[0]) / (M3[1] - M3[0])));
    let x = TRACK.x;
    if (t >= B_HIT) {
      // recoil up 24 px (outBack over 6 frames), starting one frame after the contact frame
      y = lerp(TOKEN_HIT, TOKEN_REST, E.outBack(clamp((t - B_HIT - FR) / (6 * FR))));
      // shake on twos from the frame after the contact: three drawings, decaying
      const d = Math.floor((t - B_HIT - FR) * 12 + 1e-6);
      const sh = [-8, 6, -3];
      if (t >= B_HIT + FR - 1e-6 && d >= 0 && d < sh.length) x += sh[d];
    }
    return { x, y };
  }

  /** A row's "current" weight: 1 while the token is at it, 0.5 once it has moved on. */
  function rowGlow(i, t) {
    const r = ROWS[i];
    if (t < r.tHit - 1e-6) return 0;
    const leave = i === 0 ? M2[0] : i === 1 ? M3[0] : 1e9;
    if (t < leave) return 1;
    return lerp(1, 0.3, clamp((t - leave) / (6 * FR)));
  }

  function drawHeader(ctx, L) {
    const P = L.pal, ui = L.ui;
    ui.icon(ctx, 'shield', TRACK.x, 646, 40, { color: P.sig, lw: 3.5 });
    ui.label(ctx, 'Правила агента', 186, 660, { size: 40, weight: 700, color: P.txt, tracking: -0.5 });
    // honesty label: this is one example configuration
    ui.chip(ctx, 'пример настройки', 950, 648, { size: 26, font: 'mono', weight: 500, color: P.txtDim, fill: P.panelHi, stroke: P.hairHi, align: 'right', h: 46, padX: 18 });
    ui.rich(ctx, [['лимит: ', P.txtDim], ['20 шагов', P.txt], [' · ', P.txtFaint], ['5 мин', P.txt]], COL_X, 714, { size: 28, font: 'mono', weight: 500 });
    // hairline under the header
    ctx.fillStyle = P.hair;
    ctx.fillRect(COL_X, 736, PANEL.x + PANEL.w - 40 - COL_X, 2);
  }

  function drawRow(ctx, L, i, t) {
    const P = L.pal, ui = L.ui;
    const r = ROWS[i];
    const kIn = ui.kf(t, r.tIn, 6 * FR, 'outCubic');
    if (kIn <= 0) return;
    const hit = t >= r.tHit - 1e-6 ? 1 : 0;
    const g = rowGlow(i, t);
    const deny = r.kind === 'deny';
    const hue = deny ? P.danger : P.sig;
    const x = ROW.x + (1 - kIn) * 150;
    const y = r.cy - ROW.h / 2;

    ctx.save();
    ctx.globalAlpha *= clamp(kIn * 1.3);
    // body
    ctx.beginPath();
    ui.rr(ctx, x, y, ROW.w, ROW.h, ROW.r);
    ctx.fillStyle = hit ? L.mix(P.panelHi, deny ? P.dangerTint : P.sigTint, 0.9 * g) : P.panelHi;
    ctx.fill();
    ctx.strokeStyle = hit ? L.mix(P.hair, deny ? P.danger : P.sigDeep, 0.35 + 0.65 * g) : P.hair;
    ctx.lineWidth = 2;
    ctx.stroke();
    // accent bar on the left edge once the rule applies
    if (hit) {
      ctx.save();
      ctx.beginPath();
      ui.rr(ctx, x, y, ROW.w, ROW.h, ROW.r);
      ctx.clip();
      ctx.fillStyle = hue;
      ctx.globalAlpha *= 0.55 + 0.45 * g;
      ctx.fillRect(x, y, 6, ROW.h);
      ctx.restore();
    }
    // icon + label
    const iconC = hit ? hue : P.txtDim;
    ui.icon(ctx, r.icon, x + 52, r.cy, 40, { color: iconC, lw: 3.5 });
    ui.label(ctx, r.label, x + 96, r.cy + 1, { size: 36, weight: 600, color: P.txt, baseline: 'middle', tracking: -0.3 });
    // status chip: grey while armed, lights in its colour when the token reaches the row
    const cOn = ui.kf(t, r.tHit, 3 * FR);
    const chipC = L.mix(P.txtDim, hue, cOn);
    const chipFill = r.kind === 'ask' ? P.panel : L.mix(P.panel, deny ? P.dangerTint : P.sigTint, cOn);
    const chipStroke = L.mix(P.hairHi, r.kind === 'allow' ? P.sigDeep : hue, cOn);
    const size = 28, h = 52, padX = 18;
    const tw = ui.measure(ctx, r.chip, { size, weight: 600 });
    const cw = tw + padX * 2 + size + 10;
    const cx = x + ROW.w - 28 - cw / 2;
    // bump on the hit: 1 → 1.14 → 1 over 6 frames, visible on the beat frame
    const bk = ui.kf(t, r.tHit, 6 * FR);
    const bump = bk > 0 && bk < 1 ? 1 + 0.14 * Math.sin(Math.PI * bk) : 1;
    if (bk > 0) ui.glow(ctx, cx, r.cy, 150, hue, 0.35 * (1 - bk) + 0.1 * g);
    ctx.save();
    ctx.translate(cx, r.cy);
    ctx.scale(bump, bump);
    ui.chip(ctx, r.chip, -cw / 2, 0, { size, weight: 600, h, padX, icon: r.chipIcon, color: chipC, fill: chipFill, stroke: chipStroke, lw: 2 });
    ctx.restore();
    // one ring pulse leaves the chip on the hit (expands 14 px, fades over 8 frames)
    const pk = ui.kf(t, r.tHit, 8 * FR, 'outCubic');
    if (pk > 0 && pk < 1) {
      const gr = 14 * pk;
      ctx.save();
      ctx.beginPath();
      ui.rr(ctx, cx - cw / 2 - gr, r.cy - h / 2 - gr, cw + gr * 2, h + gr * 2, h / 2 + gr);
      ctx.strokeStyle = L.rgba(hue, 0.8 * (1 - pk));
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawTrack(ctx, L, t, tok) {
    const P = L.pal, ui = L.ui;
    // base hair line
    ctx.fillStyle = P.hairHi;
    ctx.fillRect(TRACK.x - 1, TRACK.y0, 2, TRACK.y1 - TRACK.y0);
    // the orange trail: the route the token has been allowed to take
    const ty = clamp(tok.y, TRACK.y0, BARRIER.y);
    if (t >= M1[0] && ty > TRACK.y0) {
      ctx.fillStyle = P.sig;
      ctx.fillRect(TRACK.x - 1.5, TRACK.y0, 3, ty - TRACK.y0);
    }
    // stations at the row centres
    for (let i = 0; i < ROWS.length; i++) {
      const passed = t >= ROWS[i].tHit - 1e-6 && ROWS[i].kind !== 'deny';
      const vis = ui.kf(t, ROWS[i].tIn, 6 * FR);
      if (vis <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= vis;
      ctx.beginPath();
      ctx.arc(TRACK.x, ROWS[i].cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = passed ? P.sig : P.panel;
      ctx.fill();
      ctx.strokeStyle = passed ? P.sig : P.hairHi;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBarrier(ctx, L, t) {
    const P = L.pal, ui = L.ui;
    const k = ui.kf(t, ROWS[2].tIn, 6 * FR, 'outCubic');
    if (k <= 0) return;
    const cx = (BARRIER.x0 + BARRIER.x1) / 2;
    const half = ((BARRIER.x1 - BARRIER.x0) / 2) * k;
    const fl = t >= B_HIT - 1e-6 ? 1 - clamp((t - B_HIT) / (12 * FR)) : 0; // flash on the hit
    const white = t >= B_HIT - 1e-6 && t < B_HIT + 2 * FR ? 0.65 : 0;
    ui.glow(ctx, cx, BARRIER.y, 70 + 50 * fl, P.danger, 0.22 + 0.6 * fl);
    ctx.save();
    ctx.fillStyle = white ? L.mix(P.danger, P.txt, white) : P.danger;
    ctx.fillRect(cx - half, BARRIER.y - 3, half * 2, 6);
    // end posts
    ctx.fillRect(cx - half - 1, BARRIER.y - 11, 4, 22);
    ctx.fillRect(cx + half - 3, BARRIER.y - 11, 4, 22);
    ctx.restore();
  }

  function drawToken(ctx, L, t, tok) {
    const ui = L.ui, P = L.pal;
    const pk = ui.pop(t, B_HEAD);
    if (pk <= 0) return;
    const state = t >= B_HIT - 1e-6 ? 'blocked' : t >= M1[0] ? 'busy' : 'idle';
    const s = TOKEN_S * (0.6 + 0.4 * pk);
    // eyes glance at the row the token is working on
    const look = state === 'busy' && (t >= ROWS[0].tHit - 1e-6) ? 0.9 : 0;
    // one blink while it waits for the confirmation
    const blink = t >= 2.25 - 1e-6 && t < 2.25 + 2 * FR ? 1 : 0;
    // waiting ring around the token at row 2
    if (t >= WAIT[0] - 1e-6 && t < M3[0] + 2 * FR) {
      const a = ui.kf(t, WAIT[0], WAIT[1] - WAIT[0]);
      const fade = t > WAIT[1] ? 1 - clamp((t - WAIT[1]) / (0.25 + 2 * FR)) : 1;
      ctx.save();
      ctx.globalAlpha *= fade;
      ctx.strokeStyle = P.hairHi;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tok.x, tok.y, 41, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = P.sig;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(tok.x, tok.y, 41, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a);
      ctx.stroke();
      ctx.restore();
    }
    if (state === 'blocked') ui.glow(ctx, tok.x, tok.y, 90, P.danger, 0.3);
    ui.agent(ctx, tok.x, tok.y, s, { state, glow: state === 'busy' ? 0.9 : 0.5, look, blink });
  }

  function drawRequest(ctx, L, t) {
    const P = L.pal, ui = L.ui;
    const pk = ui.pop(t, B_REQ);
    if (pk <= 0) return;
    const a = clamp((t - B_REQ + FR) / (3 * FR));
    const sc = 0.86 + 0.14 * pk;
    const cx = REQ.x + REQ.w / 2, cy = REQ.y + REQ.h / 2;
    // glow breathes once per bar (2 s) after the pop
    const br = t > B_REQ ? 0.5 - 0.5 * Math.cos((Math.PI * 2 * (t - B_REQ)) / 2) : 0;
    const flash = 1 - clamp((t - B_REQ) / (10 * FR));
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.translate(-cx, -cy);
    ui.glow(ctx, cx, cy, 460, P.sig, 0.1 + 0.08 * br + 0.18 * flash);
    ui.panel(ctx, REQ.x, REQ.y, REQ.w, REQ.h, { r: REQ.r, fill: P.panel, stroke: P.sig, lw: 3, glow: L.rgba(P.sig, 0.55 + 0.35 * br), glowBlur: 34 });
    ui.user(ctx, REQ.x + 56, REQ.y + 58, 56);
    ui.label(ctx, 'Подтвердите действие', REQ.x + 104, REQ.y + 52, { size: 34, weight: 700, color: P.txt, tracking: -0.3 });
    ui.rich(ctx, [['агент: ', P.txtDim], ['rm -rf src/', P.txt]], REQ.x + 104, REQ.y + 92, { size: 28, font: 'mono', weight: 500 });
    // two answers; the developer's decision is not shown — the dialog only asks
    const by = REQ.y + REQ.h - 42;
    const allow = ui.chip(ctx, 'Разрешить', REQ.x + REQ.w - 28, by, { size: 28, weight: 600, color: P.txtDim, fill: P.panelHi, stroke: P.hairHi, align: 'right', h: 52, padX: 26, r: 14 });
    ui.chip(ctx, 'Отклонить', allow.x - 14, by, { size: 28, weight: 700, color: P.bg, fill: P.sig, stroke: null, align: 'right', h: 52, padX: 26, r: 14 });
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
      ui.tag(ctx, '// правила', t - B_HEAD);
      ui.headline(ctx, ['Доступ. Лимиты.', '[Подтверждение.]'], t - B_HEAD);

      // 3 rules panel: slides up 40 px and fades in over 6 frames
      const kP = ui.kf(t, 0, 6 * FR, 'outCubic');
      const tok = tokenPose(L, t);
      ctx.save();
      ctx.globalAlpha *= clamp(kP * 1.2);
      ctx.translate(0, (1 - kP) * 40);
      ui.panel(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, { r: PANEL.r, fill: P.panel, stroke: P.hairHi });
      drawHeader(ctx, L);

      // 4 rows (clipped to the panel so they slide in from under its right edge)
      ctx.save();
      ctx.beginPath();
      ui.rr(ctx, PANEL.x + 2, PANEL.y + 2, PANEL.w - 4, PANEL.h - 4, PANEL.r - 2);
      ctx.clip();
      for (let i = 0; i < ROWS.length; i++) drawRow(ctx, L, i, t);
      ctx.restore();

      // 5 track, stations, barrier
      drawTrack(ctx, L, t, tok);
      drawBarrier(ctx, L, t);

      // 6 the agent token
      drawToken(ctx, L, t, tok);
      ctx.restore();

      // 7 dim veil: the rules step back to 70 % when the request arrives
      const dim = ui.kf(t, B_REQ, 4 * FR, 'outCubic');
      if (dim > 0) {
        ctx.save();
        ctx.beginPath();
        ui.rr(ctx, PANEL.x - 2, PANEL.y - 2, PANEL.w + 4, PANEL.h + 4, PANEL.r + 2);
        ctx.fillStyle = L.rgba(P.bg, 0.3 * dim);
        ctx.fill();
        ctx.restore();
      }

      // 8 the confirmation request
      drawRequest(ctx, L, t);
    },
  });
})();
