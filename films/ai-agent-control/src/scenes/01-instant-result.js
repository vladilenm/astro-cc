/*
 * 01 · instant-result · «Мгновенный результат» · T 0–5 · interface plate
 *
 * The React app «Обращения клиентов» grows out of the dark; a developer prompt is typed over it,
 * an orange line runs from the prompt to three code cards, the whole request flies into the app as
 * its new search field, «вход» is typed and the list filters down to ticket 1043. Ends on H1.
 *
 * Layers, back to front:
 *   1  plate (ui.bg, dot grid drifting 6 px per beat)
 *   2  the app at G1 — entrance scale 0.94 → 1 about (540, 970), 15 % ghost outline, orange scan line
 *   3  scrim over the app while the request overlay is up (0.5 → 3.25)
 *   4  request overlay group: orange line, prompt card, code cards, agent mark (flies into the search slot at 3.0)
 *   5  found-row ring pulse (4.0)
 *   6  tag + headline (screen-fixed, from 0.5)
 * Captions are core's.
 */
(function () {
  'use strict';

  const ID = 'instant-result';
  const FR = 1 / 24;

  // ===== shared H1 block — identical in 01-instant-result.js and 02-price-of-done.js =====
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

  const APP = { x: 100, y: 590, w: 880, h: 760, r: 28 };
  const PROMPT = 'Добавь поиск по обращениям';
  // code cards, top to bottom; they pop bottom → top as the orange line reaches them
  const CARDS = [
    { name: 'SearchBar.tsx', add: '+24', y: 800, t0: 2.75 },
    { name: 'TicketList.tsx', add: '+8', y: 890, t0: 2.5 },
    { name: 'useSearch.ts', add: '+16', y: 980, t0: 2.25 },
  ];

  const B_IN = 0.5; // T 0.5  tag, headline, prompt card
  const B_SEND = 2.0; // T 2.0  send, orange line, agent mark
  const B_FLY = 3.0; // T 3.0  overlay flies into the app, search field lands
  const B_TYPE = 3.25; // T 3.25 «вход» on 16ths
  const B_FIND = 4.0; // T 4.0  filter, ring pulse

  /** App state at shot time t (T = t here: the shot starts at 0). */
  function appState(ui, E, t, T) {
    if (t >= 4.375) return h1AppState(T);
    const clamp = FILM.lib.clamp;
    const nq = t < B_TYPE - 1e-6 ? 0 : Math.min(4, Math.floor((t - B_TYPE) * 8 + 1e-6) + 1);
    return {
      search: ui.kf(t, B_FLY, 0.25),
      query: 'вход'.slice(0, nq),
      filter: ui.kf(t, B_FIND, 0.25),
      mark: ui.kf(t, 4.125, 0.25, 'outCubic'),
      focus: ui.kf(t, 3.125, 0.125),
      caret: t >= 3.125 - 1e-6,
      // solid caret while the field lands and the query is typed, then it blinks on the global clock
      t: t < 3.75 ? 0 : T,
      rows: 0.2 + 0.8 * clamp(t / 0.6),
    };
  }

  function rrPath(ctx, ui, x, y, w, h, r) {
    ctx.beginPath();
    ui.rr(ctx, x, y, w, h, r);
  }

  /** Orange scan line sweeping the window during the entrance (0 → 0.5). */
  function scanLine(ctx, L, t) {
    const ui = L.ui, P = L.pal;
    const p = L.clamp(t / 0.5);
    if (p >= 1) return;
    const sy = APP.y + 2 + (APP.h - 4) * L.ease.inOutSine(p);
    const a = 1 - L.smoothstep(0.72, 1, p);
    ctx.save();
    rrPath(ctx, ui, APP.x, APP.y, APP.w, APP.h, APP.r);
    ctx.clip();
    const band = ctx.createLinearGradient(0, sy - 110, 0, sy);
    band.addColorStop(0, L.rgba(P.sig, 0));
    band.addColorStop(1, L.rgba(P.sig, 0.2 * a));
    ctx.fillStyle = band;
    ctx.fillRect(APP.x, sy - 110, APP.w, 110);
    ctx.fillStyle = L.rgba(P.sig, a);
    ctx.fillRect(APP.x, sy - 1, APP.w, 2);
    ctx.fillStyle = L.rgba(P.sigHot, 0.8 * a);
    ctx.fillRect(APP.x + 40, sy - 0.5, APP.w - 80, 1);
    ctx.restore();
    ui.glow(ctx, 540, sy, 140, P.sig, 0.35 * a);
  }

  /** The developer's prompt card (0.5 → flies at 3.0). */
  function promptCard(ctx, L, t, T) {
    const ui = L.ui, P = L.pal;
    const pe = ui.kf(t, B_IN, 6 * FR, 'outCubic');
    if (pe <= 0) return;
    const dy = 30 * (1 - pe);
    ctx.save();
    ctx.globalAlpha *= pe;
    ui.panel(ctx, 130, 1150 + dy, 820, 140, { r: 24, fill: P.panelHi, stroke: P.hairHi });
    ui.user(ctx, 190, 1220 + dy, 64);
    ui.label(ctx, 'разработчик', 240, 1196 + dy, { font: 'mono', size: 22, weight: 500, color: P.txtFaint });
    const n = t < B_IN - 1e-6 ? 0 : Math.min(PROMPT.length, Math.floor((t - B_IN) * 21 + 1e-6) + 1);
    const tw = ui.label(ctx, PROMPT.slice(0, n), 240, 1246 + dy, { size: 34, weight: 500, color: P.txt });
    const done = n >= PROMPT.length;
    if (t < B_SEND - 1e-6 && (!done || ui.caretOn(T))) {
      ctx.fillStyle = P.sig;
      ctx.fillRect(240 + tw + 4, 1246 + dy - 30, 3, 38);
    }
    // send button: waits dim, wakes when the text is complete, flashes orange on send
    const bx = 888, by = 1220 + dy;
    const sent = t >= B_SEND - 1e-6;
    const bp = ui.kf(t, B_SEND, 6 * FR);
    const bs = sent ? 1 + 0.2 * Math.sin(Math.PI * bp) : 1;
    if (sent) ui.glow(ctx, bx, by, 90, P.sig, 0.55 * (1 - bp) + 0.18);
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(bs, bs);
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = sent ? P.sig : P.panelTop;
    ctx.fill();
    if (!sent) {
      ctx.strokeStyle = P.hairHi;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ui.icon(ctx, 'send', 0, 0, 28, { color: sent ? P.bg : done ? P.txt : P.txtFaint, lw: 3 });
    ctx.restore();
    ctx.restore();
  }

  /** One generated-code card: file icon, file name, green line count. */
  function codeCard(ctx, L, c, t) {
    const ui = L.ui, P = L.pal;
    const pk = ui.pop(t, c.t0);
    if (pk <= 0) return;
    const a = L.clamp((t - c.t0 + FR) / (2 * FR));
    const sc = 0.72 + 0.28 * pk;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(540, c.y);
    ctx.scale(sc, sc);
    ctx.translate(-540, -c.y);
    ui.panel(ctx, 280, c.y - 38, 520, 76, { r: 16, fill: P.panel, stroke: P.hairHi });
    ctx.fillStyle = P.ok;
    ctx.fillRect(280, c.y - 20, 4, 40);
    ui.icon(ctx, 'file', 322, c.y, 28, { color: P.txtDim, lw: 2.5 });
    ui.label(ctx, c.name, 352, c.y + 1, { font: 'mono', size: 28, weight: 500, color: P.txt, baseline: 'middle' });
    ui.label(ctx, c.add, 772, c.y + 1, { font: 'mono', size: 28, weight: 600, color: P.ok, baseline: 'middle', align: 'right' });
    ctx.restore();
  }

  /** The request overlay: orange line, prompt card, code cards, agent mark. */
  function overlay(ctx, L, t, T) {
    const ui = L.ui, P = L.pal;
    // T 3.0–3.25: the whole group flies into the search slot (scale 0.6, centre to y 802) and fades
    const fe = ui.kf(t, B_FLY, 0.25, 'outCubic');
    const ga = 1 - fe;
    if (ga <= 0.001) return;
    ctx.save();
    ctx.globalAlpha *= ga;
    if (fe > 0) {
      const s = L.lerp(1, 0.6, fe);
      ctx.translate(540, L.lerp(975, 802, fe));
      ctx.scale(s, s);
      ctx.translate(-540, -975);
    }
    // orange line: prompt card top → bottom code card
    const lp = ui.kf(t, B_SEND, 0.25, 'outCubic');
    if (lp > 0) ui.arrow(ctx, [[540, 1150], [540, 1025]], { lw: 4, p: lp, headSize: 18, glow: lp < 1 ? 0.75 : 0.3 });
    promptCard(ctx, L, t, T);
    for (let i = CARDS.length - 1; i >= 0; i--) codeCard(ctx, L, CARDS[i], t);
    // agent mark pops on send, busy
    const ap = ui.pop(t, B_SEND);
    if (ap > 0) {
      ctx.save();
      ctx.translate(540, 700);
      const s = 0.6 + 0.4 * ap;
      ctx.scale(s, s);
      ui.agent(ctx, 0, 0, 72, { state: 'busy', glow: 1, alpha: L.clamp(ap * 2) });
      ctx.restore();
    }
    ctx.restore();
  }

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const L = info.lib, ui = L.ui, P = L.pal, E = L.ease;
      const t = L.clamp(tIn, 0, info.dur);
      const T = info.shot.start + t;

      // 1 plate
      ui.bg(ctx, { oy: -T * 12 });

      // 2 the app — entrance 0 → 0.5 (outExpo), then locked at G1
      const eIn = E.outExpo(L.clamp(t / 0.5));
      const st = appState(ui, E, t, T);
      ctx.save();
      if (eIn < 1) {
        const sc = 0.94 + 0.06 * eIn;
        ctx.translate(540, 970);
        ctx.scale(sc, sc);
        ctx.translate(-540, -970);
        // frame 0 is never black: a 15 % window outline under the scan line
        ctx.save();
        rrPath(ctx, ui, APP.x, APP.y, APP.w, APP.h, APP.r);
        ctx.strokeStyle = L.rgba(P.txt, 0.15 * (1 - eIn));
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        st.alpha = eIn;
      }
      ui.app(ctx, APP.x, APP.y, APP.w, st);
      scanLine(ctx, L, t);
      ctx.restore();

      // 3 scrim while the request overlay is up
      const sa = 0.5 * ui.kf(t, B_IN, 6 * FR) * (1 - ui.kf(t, B_FLY, 0.25));
      if (sa > 0) {
        rrPath(ctx, ui, APP.x, APP.y, APP.w, APP.h, APP.r);
        ctx.fillStyle = L.rgba(P.bg, sa);
        ctx.fill();
      }

      // 4 request overlay
      if (t >= B_IN - 1e-6 && t < B_FLY + 0.25) overlay(ctx, L, t, T);

      // 5 ring pulse around the found row (ticket 1043) at 4.0
      const pk = ui.kf(t, B_FIND, 8 * FR);
      if (pk > 0 && pk < 1) {
        const col = E.inOutCubic(st.filter || 0);
        const yy = APP.y + 280 + 116 * (1 - col);
        const g = 12 * E.outCubic(pk);
        ctx.save();
        rrPath(ctx, ui, APP.x + 36 - g, yy - g, 808 + 2 * g, 104 + 2 * g, 16 + g);
        ctx.strokeStyle = L.rgba(P.sig, 1 - pk);
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
        ui.glow(ctx, APP.x + 36 + 60, yy + 52, 120, P.sig, 0.35 * (1 - pk));
      }

      // 6 tag + headline
      h1Titles(ctx, L, T, -1);
    },
  });
})();
