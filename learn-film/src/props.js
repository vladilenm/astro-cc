/*
 * props.js : FILM.ui — the Learn interface kit. Every card, button, cursor, glyph, route line,
 * title and subtitle in the film is drawn here, once, so twelve scene files draw them identically.
 * Loaded after lib.js (and photos.js) and before the timeline and scenes.
 *
 * Everything is a pure function of its arguments (no state between frames). Canvases are cached
 * only for t-independent content, keyed by every input.
 *
 * Coordinates are logical pixels on the 1920 x 1080 frame. Layout zones (docs/art-bible.md §1):
 *   margins x 120..1800 · title band y 90..300 · content y 300..860 · subtitle band y 880..1000
 *
 * Contents
 *   time      k(t, t0, d, e)  ·  appear(t, t0, d)  ·  typed(str, p)  ·  blink(T)  ·  cut(info)  ·  variant(info)
 *   type      font(w, size, mono)  ·  text(ctx, str, x, y, o)  ·  measure(ctx, str, o)  ·  wrap(ctx, str, maxW, o)
 *             title(ctx, str, x, y, o)  ·  kicker(ctx, str, x, y, o)
 *   surface   bg(ctx, o)  ·  rrect(ctx, x, y, w, h, r)  ·  card(ctx, x, y, w, h, o)  ·  window(ctx, x, y, w, h, o)
 *             tabCard(ctx, x, y, w, h, o)  ·  skeleton(ctx, x, y, w, n, o)  ·  sheet(ctx, x, y, w, h, o)
 *   controls  button(ctx, x, y, w, h, label, o)  ·  pill(ctx, x, y, label, o)  ·  field(ctx, x, y, w, h, o)
 *             progress(ctx, x, y, w, frac, o)  ·  check(ctx, cx, cy, r, p, o)  ·  playButton(ctx, cx, cy, r, o)
 *             video(ctx, x, y, w, h, o)
 *   actors    cursor(ctx, x, y, o)  ·  ripple(ctx, x, y, p, o)  ·  route(ctx, pts, o)  ·  glyph(ctx, kind, cx, cy, s, o)
 *             logo(ctx, cx, cy, size, o)  ·  brand(ctx, x, y, o)  ·  author(ctx, x, y, o)  ·  block(ctx, cx, cy, w, h, label, o)
 *             link(ctx, ax, ay, bx, by, p, o)  ·  arrowDown(ctx, cx, y, len, o)
 *   routes    ROUTES (the three routes: key, glyph, short, name, result)  ·  routeCard(ctx, i, x, y, w, h, o)
 *   overlay   FILM.overlay (subtitles from FILM.TIMELINE.subs when FILM.TIMELINE.subtitles is true)
 */
(function () {
  'use strict';

  const FILM = window.FILM;
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const A = (c, a) => L.rgba(c, a);

  const SANS = 'Onest, "Helvetica Neue", Arial, sans-serif';
  const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

  const ui = {};
  ui.SANS = SANS;
  ui.MONO = MONO;
  ui.W = 1920;
  ui.H = 1080;
  /** layout zones, art bible §1 */
  ui.Z = Object.freeze({ left: 120, right: 1800, titleTop: 90, titleBase: 210, contentTop: 300, contentBottom: 860, subTop: 880, subBottom: 1000 });

  // ===========================================================================
  // Time
  // ===========================================================================

  /** eased 0..1 progress of t through [t0, t0 + d] */
  ui.k = (t, t0, d, e = 'inOutCubic') => {
    if (d <= 0) return t >= t0 ? 1 : 0;
    const f = typeof e === 'function' ? e : E[e] || E.linear;
    return f(clamp((t - t0) / d));
  };
  /** standard appear: 0.4 s outCubic from t0 */
  ui.appear = (t, t0, d = 0.4) => ui.k(t, t0, d, 'outCubic');
  /** first round(len * p) characters */
  ui.typed = (str, p) => String(str).slice(0, Math.round(String(str).length * clamp(p)));
  /** caret blink from global time: 1 visible, 0 hidden (0.5 s period) */
  ui.blink = (T) => (Math.floor(T * 2 + 1e-6) % 2 === 0 ? 1 : 0);
  /** which cut is playing: 60 (default) or 45 */
  ui.cut = (info) => (info && info.shot && Number(info.shot.cut) === 45 ? 45 : FILM.TIMELINE && Number(FILM.TIMELINE.cut) === 45 ? 45 : 60);
  /** ending variant: 'page' (default) or 'external' */
  ui.variant = (info) => (FILM.TIMELINE && FILM.TIMELINE.ending === 'external' ? 'external' : 'page');

  // ===========================================================================
  // Type
  // ===========================================================================

  ui.font = (w = 500, size = 32, mono = false) => `${w} ${size}px ${mono ? MONO : SANS}`;

  function setText(ctx, o) {
    ctx.font = ui.font(o.weight || 500, o.size || 32, !!o.mono);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    if ('letterSpacing' in ctx) {
      const tr = o.tracking != null ? o.tracking : o.mono ? 0 : -0.01 * (o.size || 32);
      ctx.letterSpacing = typeof tr === 'string' ? tr : `${tr}px`;
    }
  }

  /**
   * text(ctx, str, x, y, o) : one line of Onest (or JetBrains Mono with mono: true).
   *   size 32 · weight 500 · color P.text · alpha 1 · align 'left' · baseline 'alphabetic'
   *   tracking (px; default -0.01em sans, 0 mono) · upper false · p (typewriter fraction)
   * Returns the drawn width.
   */
  ui.text = (ctx, str, x, y, o = {}) => {
    let s = String(str);
    if (o.upper) s = s.toUpperCase();
    if (o.p != null) s = ui.typed(s, o.p);
    ctx.save();
    setText(ctx, o);
    const w = ctx.measureText(s).width;
    if (s) {
      ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
      ctx.fillStyle = o.color || P.text;
      ctx.fillText(s, x, y);
    }
    ctx.restore();
    return w;
  };
  ui.measure = (ctx, str, o = {}) => {
    ctx.save();
    setText(ctx, o);
    const w = ctx.measureText(o.upper ? String(str).toUpperCase() : String(str)).width;
    ctx.restore();
    return w;
  };
  /** greedy word wrap; '\n' forces a break. Returns lines. */
  ui.wrap = (ctx, str, maxW, o = {}) => {
    const out = [];
    for (const para of String(str).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const tryLine = line ? line + ' ' + word : word;
        if (line && ui.measure(ctx, tryLine, o) > maxW) {
          out.push(line);
          line = word;
        } else line = tryLine;
      }
      out.push(line);
    }
    return out;
  };

  /**
   * title(ctx, str, x, y, o) : the main title. '\n' breaks lines. y is the first baseline.
   *   size 76 · weight 600 · color P.text · align 'left' · lh 1.12 · a (appear 0..1: alpha + 24 px rise)
   *   maxW (wrap width) · accent: substring drawn in P.accent
   * Returns { lines, h, w } (h = distance from first baseline to last baseline).
   */
  ui.title = (ctx, str, x, y, o = {}) => {
    const size = o.size || 76;
    const lh = size * (o.lh || 1.12);
    const opt = { size, weight: o.weight || 600, align: o.align || 'left', tracking: o.tracking != null ? o.tracking : -0.02 * size };
    const lines = o.maxW ? ui.wrap(ctx, str, o.maxW, opt) : String(str).split('\n');
    const a = o.a != null ? clamp(o.a) : 1;
    let w = 0;
    if (a > 0) {
      ctx.save();
      ctx.globalAlpha *= a;
      const dy = (1 - a) * (o.rise != null ? o.rise : 24);
      lines.forEach((ln, i) => {
        const yy = y + i * lh + dy;
        if (o.accent && ln.includes(o.accent)) {
          // split the line around the accent substring
          const at = ln.indexOf(o.accent);
          const pre = ln.slice(0, at);
          const post = ln.slice(at + o.accent.length);
          const full = ui.measure(ctx, ln, opt);
          let cx = opt.align === 'center' ? x - full / 2 : opt.align === 'right' ? x - full : x;
          const so = Object.assign({}, opt, { align: 'left' });
          cx += ui.text(ctx, pre, cx, yy, Object.assign({}, so, { color: o.color || P.text }));
          cx += ui.text(ctx, o.accent, cx, yy, Object.assign({}, so, { color: P.accent }));
          ui.text(ctx, post, cx, yy, Object.assign({}, so, { color: o.color || P.text }));
          w = Math.max(w, full);
        } else {
          w = Math.max(w, ui.text(ctx, ln, x, yy, Object.assign({}, opt, { color: o.color || P.text })));
        }
      });
      ctx.restore();
    }
    return { lines, h: (lines.length - 1) * lh, w, lh };
  };

  /** kicker(ctx, str, x, y, o) : small mono uppercase label above a title (route tag). color P.accent, size 22 */
  ui.kicker = (ctx, str, x, y, o = {}) =>
    ui.text(ctx, str, x, y, { mono: true, upper: true, size: o.size || 22, weight: o.weight || 500, tracking: (o.size || 22) * 0.16, color: o.color || P.accent, alpha: o.alpha, align: o.align });

  // ===========================================================================
  // Surfaces
  // ===========================================================================

  ui.rrect = (ctx, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /**
   * bg(ctx, o) : the page background — #0B0C0E, a sparse dot grid (40 px) faded to the edges,
   * and an optional soft accent glow. Cached (t-independent).
   *   glow { x, y, r, a } (default a centred glow at 0.10) · dots 1 (alpha of the grid) · ox, oy (grid drift px)
   */
  ui.bg = (ctx, o = {}) => {
    const S = FILM.S;
    const plate = L.cached(`ui-bg-${S}`, () => {
      const c = FILM.makeCanvas(Math.round(1920 * S), Math.round(1080 * S));
      const g = c.getContext('2d');
      g.scale(S, S);
      g.fillStyle = P.bg;
      g.fillRect(0, 0, 1920, 1080);
      const vg = g.createRadialGradient(960, 480, 200, 960, 540, 1150);
      vg.addColorStop(0, A(P.bgDeep, 0));
      vg.addColorStop(1, A(P.bgDeep, 0.9));
      g.fillStyle = vg;
      g.fillRect(0, 0, 1920, 1080);
      return c;
    });
    ctx.save();
    ctx.drawImage(plate, 0, 0, 1920, 1080);
    const gl = o.glow === false ? null : Object.assign({ x: 960, y: 420, r: 760, a: 0.1 }, o.glow || {});
    if (gl && gl.a > 0) {
      const g = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r);
      g.addColorStop(0, A(P.accent, gl.a));
      g.addColorStop(0.5, A(P.accent, gl.a * 0.32));
      g.addColorStop(1, A(P.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1920, 1080);
    }
    const da = o.dots != null ? o.dots : 1;
    if (da > 0) {
      const dots = L.cached(`ui-dots-${S}`, () => {
        const c = FILM.makeCanvas(Math.round(2000 * S), Math.round(1160 * S));
        const g = c.getContext('2d');
        g.scale(S, S);
        for (let y = 0; y <= 1160; y += 40) {
          for (let x = 0; x <= 2000; x += 40) {
            const dx = (x - 1000) / 1000;
            const dy = (y - 580) / 620;
            const f = clamp(1.25 - Math.sqrt(dx * dx + dy * dy));
            if (f <= 0) continue;
            g.fillStyle = A('#3A3D45', 0.2 + 0.55 * f);
            g.beginPath();
            g.arc(x, y, 1.6, 0, TAU);
            g.fill();
          }
        }
        return c;
      });
      const ox = ((o.ox || 0) % 40) - 40;
      const oy = ((o.oy || 0) % 40) - 40;
      ctx.globalAlpha *= da;
      ctx.drawImage(dots, ox, oy, 2000, 1160);
    }
    ctx.restore();
  };

  /**
   * card(ctx, x, y, w, h, o) : a Learn card — fill P.card, 1.5 px P.border stroke, radius 24.
   *   r 24 · fill P.card · stroke P.border · lw 1.5 · alpha 1 · glow 0..1 (accent ring + halo)
   *   shadow 1 (soft drop shadow) · dashed false (outline-only contour card)
   */
  ui.card = (ctx, x, y, w, h, o = {}) => {
    const r = o.r != null ? o.r : 24;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    const glow = clamp(o.glow || 0);
    if ((o.shadow != null ? o.shadow : 1) > 0 && !o.dashed) {
      ctx.save();
      ctx.shadowColor = A('#000000', 0.55 * (o.shadow != null ? o.shadow : 1));
      ctx.shadowBlur = 40 * FILM.S;
      ctx.shadowOffsetY = 16 * FILM.S;
      ui.rrect(ctx, x, y, w, h, r);
      ctx.fillStyle = o.fill || P.card;
      ctx.fill();
      ctx.restore();
    }
    if (glow > 0) {
      ctx.save();
      ctx.shadowColor = A(P.accent, 0.45 * glow);
      ctx.shadowBlur = 48 * FILM.S;
      ui.rrect(ctx, x, y, w, h, r);
      ctx.fillStyle = o.fill || P.card;
      ctx.fill();
      ctx.restore();
    }
    ui.rrect(ctx, x, y, w, h, r);
    if (!o.dashed) {
      ctx.fillStyle = o.fill || P.card;
      ctx.fill();
      // faint top sheen
      const sh = ctx.createLinearGradient(0, y, 0, y + Math.min(h, 160));
      sh.addColorStop(0, A(P.text, 0.035));
      sh.addColorStop(1, A(P.text, 0));
      ctx.fillStyle = sh;
      ctx.fill();
    }
    ctx.lineWidth = o.lw || 1.5;
    ctx.strokeStyle = glow > 0 ? L.mix(o.stroke || P.border, P.accent, glow) : o.stroke || P.border;
    if (o.dashed) ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.restore();
  };

  /**
   * window(ctx, x, y, w, h, o) : an application window — the user's own workspace, deliberately
   * unlike a Learn card: square-ish corners (14), a title bar with three dots, a mono title, and a
   * cooler, darker body. Returns the body rect { x, y, w, h }.
   *   title 'Твой проект' · alpha 1 · glow 0..1 · bar 52
   */
  ui.window = (ctx, x, y, w, h, o = {}) => {
    const bar = o.bar || 52;
    const r = 14;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ctx.save();
    ctx.shadowColor = A('#000000', 0.6);
    ctx.shadowBlur = 50 * FILM.S;
    ctx.shadowOffsetY = 20 * FILM.S;
    ui.rrect(ctx, x, y, w, h, r);
    ctx.fillStyle = P.field;
    ctx.fill();
    ctx.restore();
    if (o.glow) {
      ctx.save();
      ctx.shadowColor = A(P.green, 0.35 * clamp(o.glow));
      ctx.shadowBlur = 40 * FILM.S;
      ui.rrect(ctx, x, y, w, h, r);
      ctx.fillStyle = P.field;
      ctx.fill();
      ctx.restore();
    }
    ui.rrect(ctx, x, y, w, h, r);
    ctx.fillStyle = P.field;
    ctx.fill();
    // title bar
    ctx.save();
    ui.rrect(ctx, x, y, w, h, r);
    ctx.clip();
    ctx.fillStyle = P.cardHi;
    ctx.fillRect(x, y, w, bar);
    ctx.fillStyle = P.border;
    ctx.fillRect(x, y + bar - 1.5, w, 1.5);
    ctx.restore();
    ui.rrect(ctx, x, y, w, h, r);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = P.borderHi;
    ctx.stroke();
    const dc = ['#F4524A', '#F5C66B', '#6EE7B7'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = A(dc[i], 0.85);
      ctx.beginPath();
      ctx.arc(x + 28 + i * 24, y + bar / 2, 7, 0, TAU);
      ctx.fill();
    }
    const title = o.title != null ? o.title : 'Твой проект';
    if (title) ui.text(ctx, title, x + w / 2, y + bar / 2 + 1, { mono: true, size: o.titleSize || 22, weight: 500, color: P.text2, align: 'center', baseline: 'middle' });
    ctx.restore();
    return { x, y: y + bar, w, h: h - bar };
  };

  /**
   * tabCard(ctx, x, y, w, h, o) : an "open browser tab" card for the cold open — a tab on top with a
   * favicon dot and a title, a body of skeleton lines and an optional media block.
   *   title · fav (colour) · kind 'video' | 'tool' | 'note' | 'empty' · alpha 1 · tilt (radians)
   */
  ui.tabCard = (ctx, x, y, w, h, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    if (o.tilt) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(o.tilt);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    const tabW = Math.min(w * 0.72, 380);
    const tabH = 50;
    // tab ear
    ctx.save();
    ui.rrect(ctx, x, y, tabW, tabH + 20, 14);
    ctx.fillStyle = P.cardHi;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = P.border;
    ctx.stroke();
    ctx.restore();
    ui.card(ctx, x, y + tabH, w, h - tabH, { r: 18, dashed: o.kind === 'empty' });
    if (o.kind !== 'empty') {
      ctx.fillStyle = P.cardHi;
      ctx.fillRect(x + 1.5, y + tabH - 2, tabW - 3, 6);
    }
    ctx.fillStyle = o.fav || P.accent;
    ctx.beginPath();
    ctx.arc(x + 28, y + 26, 8, 0, TAU);
    ctx.fill();
    ui.text(ctx, o.title || '', x + 48, y + 35, { size: 25, weight: 500, color: P.text, tracking: -0.2 });
    ui.text(ctx, '×', x + tabW - 26, y + 35, { size: 26, weight: 400, color: P.text3, align: 'center' });
    const bx = x + 32;
    const by = y + tabH + 32;
    const bw = w - 64;
    if (o.kind === 'video') {
      ui.rrect(ctx, bx, by, bw, h - tabH - 120, 12);
      ctx.fillStyle = P.bgDeep;
      ctx.fill();
      ui.playButton(ctx, bx + bw / 2, by + (h - tabH - 120) / 2, 34, {});
      ui.skeleton(ctx, bx, y + h - 64, bw * 0.8, 1, { h: 14 });
    } else if (o.kind === 'tool') {
      ui.rrect(ctx, bx, by, bw * 0.45, 40, 20);
      ctx.fillStyle = A(P.accent, 0.16);
      ctx.fill();
      ui.text(ctx, 'NEW', bx + 20, by + 28, { mono: true, size: 20, weight: 600, color: P.accentHi, tracking: 2 });
      ui.skeleton(ctx, bx, by + 80, bw, 3, { h: 14, gap: 30 });
    } else if (o.kind === 'note') {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = P.borderHi;
        ctx.lineWidth = 2;
        ui.rrect(ctx, bx, by + i * 50 + 2, 22, 22, 6);
        ctx.stroke();
        ui.skeleton(ctx, bx + 40, by + i * 50 + 6, bw * (0.8 - i * 0.14) - 40, 1, { h: 14 });
      }
    }
    ctx.restore();
  };

  /** skeleton(ctx, x, y, w, n, o) : n grey text-placeholder bars. h 14 · gap 28 · color P.border · last 0.62 (last bar width) */
  ui.skeleton = (ctx, x, y, w, n, o = {}) => {
    const h = o.h || 14;
    const gap = o.gap || 28;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ctx.fillStyle = o.color || P.border;
    for (let i = 0; i < n; i++) {
      const ww = i === n - 1 && n > 1 ? w * (o.last != null ? o.last : 0.62) : w;
      ui.rrect(ctx, x, y + i * gap, ww, h, h / 2);
      ctx.fill();
    }
    ctx.restore();
  };

  /**
   * sheet(ctx, x, y, w, h, o) : a document sheet (a downloaded .md file: brief, schema or plan) —
   * a card with a folded corner and a mono file name in the header. Returns the body rect.
   *   file 'agent-brief.md' · title · alpha 1 · glow 0..1
   */
  ui.sheet = (ctx, x, y, w, h, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ui.card(ctx, x, y, w, h, { r: 20, glow: o.glow || 0, fill: P.cardHi });
    const f = 34;
    ctx.beginPath();
    ctx.moveTo(x + w - f, y);
    ctx.lineTo(x + w, y + f);
    ctx.lineTo(x + w - f, y + f);
    ctx.closePath();
    ctx.fillStyle = P.border;
    ctx.fill();
    if (o.file) ui.text(ctx, o.file, x + 32, y + 50, { mono: true, size: 22, weight: 500, color: P.text3 });
    if (o.title) ui.text(ctx, o.title, x + 32, y + (o.file ? 104 : 64), { size: o.titleSize || 38, weight: 600, color: P.text });
    ctx.restore();
    return { x: x + 32, y: y + (o.title ? (o.file ? 140 : 100) : o.file ? 80 : 32), w: w - 64, h: h - (o.title ? 160 : 100) };
  };

  // ===========================================================================
  // Controls
  // ===========================================================================

  /**
   * button(ctx, x, y, w, h, label, o) : a Learn button.
   *   primary true (accent fill, dark ink) | false (outline) · press 0..1 (scale 0.96 + darken)
   *   hover 0..1 · size 30 · alpha 1 · icon 'arrow' | 'check' | 'play' | 'download' | null · done (green state)
   */
  ui.button = (ctx, x, y, w, h, label, o = {}) => {
    const primary = o.primary !== false;
    const press = clamp(o.press || 0);
    const hover = clamp(o.hover || 0);
    const sc = 1 - 0.05 * Math.sin(press * Math.PI);
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(sc, sc);
    ctx.translate(-(x + w / 2), -(y + h / 2));
    const r = o.r != null ? o.r : h / 2;
    if (o.done) {
      ui.rrect(ctx, x, y, w, h, r);
      ctx.fillStyle = A(P.green, 0.14);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = A(P.green, 0.8);
      ctx.stroke();
    } else if (primary) {
      if (hover > 0) {
        ctx.save();
        ctx.shadowColor = A(P.accent, 0.55 * hover);
        ctx.shadowBlur = 36 * FILM.S;
        ui.rrect(ctx, x, y, w, h, r);
        ctx.fillStyle = P.accent;
        ctx.fill();
        ctx.restore();
      }
      ui.rrect(ctx, x, y, w, h, r);
      ctx.fillStyle = L.mix(L.mix(P.accent, P.accentHi, hover * 0.5), P.accentDeep, press * 0.35);
      ctx.fill();
    } else {
      ui.rrect(ctx, x, y, w, h, r);
      ctx.fillStyle = A(P.accent, 0.06 + 0.1 * hover + 0.1 * press);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = L.mix(P.borderHi, P.accent, 0.5 + 0.5 * hover);
      ctx.stroke();
    }
    const size = o.size || 30;
    const ink = o.done ? P.green : primary ? P.accentInk : P.text;
    const icon = o.done ? 'check' : o.icon === undefined ? null : o.icon;
    const tw = ui.measure(ctx, label, { size, weight: 600 });
    const iw = icon ? size * 0.9 + 12 : 0;
    const x0 = x + w / 2 - (tw + iw) / 2;
    const cy = y + h / 2;
    ui.text(ctx, label, x0, cy + size * 0.36, { size, weight: 600, color: ink });
    if (icon) ui.icon(ctx, icon, x0 + tw + 12 + (size * 0.9) / 2, cy, size * 0.9, { color: ink });
    ctx.restore();
  };

  /** icon(ctx, kind, cx, cy, s, o) : tiny line icons — arrow, arrowDown, check, play, download, file. color, lw */
  ui.icon = (ctx, kind, cx, cy, s, o = {}) => {
    ctx.save();
    ctx.strokeStyle = o.color || P.text;
    ctx.fillStyle = o.color || P.text;
    ctx.lineWidth = o.lw || Math.max(2, s * 0.11);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const h = s / 2;
    ctx.beginPath();
    if (kind === 'arrow') {
      ctx.moveTo(cx - h * 0.8, cy);
      ctx.lineTo(cx + h * 0.8, cy);
      ctx.moveTo(cx + h * 0.2, cy - h * 0.6);
      ctx.lineTo(cx + h * 0.8, cy);
      ctx.lineTo(cx + h * 0.2, cy + h * 0.6);
      ctx.stroke();
    } else if (kind === 'arrowDown') {
      ctx.moveTo(cx, cy - h * 0.8);
      ctx.lineTo(cx, cy + h * 0.8);
      ctx.moveTo(cx - h * 0.6, cy + h * 0.2);
      ctx.lineTo(cx, cy + h * 0.8);
      ctx.lineTo(cx + h * 0.6, cy + h * 0.2);
      ctx.stroke();
    } else if (kind === 'check') {
      ctx.moveTo(cx - h * 0.7, cy + h * 0.02);
      ctx.lineTo(cx - h * 0.2, cy + h * 0.5);
      ctx.lineTo(cx + h * 0.75, cy - h * 0.5);
      ctx.stroke();
    } else if (kind === 'play') {
      ctx.moveTo(cx - h * 0.45, cy - h * 0.7);
      ctx.lineTo(cx + h * 0.75, cy);
      ctx.lineTo(cx - h * 0.45, cy + h * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'download') {
      ctx.moveTo(cx, cy - h * 0.8);
      ctx.lineTo(cx, cy + h * 0.3);
      ctx.moveTo(cx - h * 0.5, cy - h * 0.1);
      ctx.lineTo(cx, cy + h * 0.35);
      ctx.lineTo(cx + h * 0.5, cy - h * 0.1);
      ctx.moveTo(cx - h * 0.8, cy + h * 0.8);
      ctx.lineTo(cx + h * 0.8, cy + h * 0.8);
      ctx.stroke();
    } else if (kind === 'file') {
      ctx.moveTo(cx - h * 0.6, cy - h * 0.85);
      ctx.lineTo(cx + h * 0.2, cy - h * 0.85);
      ctx.lineTo(cx + h * 0.6, cy - h * 0.45);
      ctx.lineTo(cx + h * 0.6, cy + h * 0.85);
      ctx.lineTo(cx - h * 0.6, cy + h * 0.85);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  };

  /**
   * pill(ctx, x, y, label, o) : a rounded tag. x,y = top-left. Returns { w, h }.
   *   size 24 · color P.accent (text + tint) · mono false · alpha 1 · icon (see ui.icon) · align 'left' | 'center'
   */
  ui.pill = (ctx, x, y, label, o = {}) => {
    const size = o.size || 24;
    const h = Math.round(size * 1.9);
    const col = o.color || P.accent;
    const icon = o.icon || null;
    const tw = ui.measure(ctx, label, { size, weight: 500, mono: !!o.mono, upper: !!o.upper, tracking: o.mono ? size * 0.08 : undefined });
    const iw = icon ? size + 10 : 0;
    const w = tw + iw + size * 1.4;
    const x0 = o.align === 'center' ? x - w / 2 : x;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ui.rrect(ctx, x0, y, w, h, h / 2);
    ctx.fillStyle = A(col, 0.12);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = A(col, 0.45);
    ctx.stroke();
    if (icon) ui.icon(ctx, icon, x0 + size * 0.7 + size / 2, y + h / 2, size, { color: col });
    ui.text(ctx, label, x0 + size * 0.7 + iw, y + h / 2 + size * 0.36, { size, weight: 500, color: o.textColor || col, mono: !!o.mono, upper: !!o.upper, tracking: o.mono ? size * 0.08 : undefined });
    ctx.restore();
    return { w, h, x: x0 };
  };

  /**
   * field(ctx, x, y, w, h, o) : a labelled row of a brief / form. Label at left in mono caps, value
   * typed in after it, caret while typing.
   *   label · value · p 0..1 (typed fraction of value) · labelW 220 · size 34 · focus 0..1 · caret (T for blink)
   *   alpha 1 · multiline false (value wraps under the label)
   */
  ui.field = (ctx, x, y, w, h, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    const focus = clamp(o.focus || 0);
    ui.rrect(ctx, x, y, w, h, 14);
    ctx.fillStyle = P.field;
    ctx.fill();
    ctx.lineWidth = 1.5 + focus;
    ctx.strokeStyle = L.mix(P.border, P.accent, focus);
    ctx.stroke();
    const size = o.size || 34;
    const lw = o.labelW != null ? o.labelW : 220;
    const cy = y + h / 2;
    if (o.label) ui.text(ctx, o.label, x + 28, cy + 8, { mono: true, size: 22, weight: 500, color: P.text3, upper: true, tracking: 2.5 });
    const val = o.value ? ui.typed(o.value, o.p != null ? o.p : 1) : '';
    const vx = x + 28 + lw;
    const vw = ui.text(ctx, val, vx, cy + size * 0.36, { size, weight: 500, color: P.text });
    const typing = o.value && o.p != null && o.p > 0 && o.p < 1;
    if ((typing || (focus > 0.5 && o.caret != null)) && o.caret != null && (typing || ui.blink(o.caret))) {
      ctx.fillStyle = P.accent;
      ctx.fillRect(vx + vw + 4, cy - size * 0.55, 3, size * 1.05);
    }
    ctx.restore();
  };

  /** progress(ctx, x, y, w, frac, o) : a thin progress bar. h 8 · color P.accent · track P.border · alpha 1 */
  ui.progress = (ctx, x, y, w, frac, o = {}) => {
    const h = o.h || 8;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ui.rrect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = o.track || P.border;
    ctx.fill();
    const fw = w * clamp(frac);
    if (fw > 0.5) {
      ctx.save();
      ctx.shadowColor = A(o.color || P.accent, 0.6);
      ctx.shadowBlur = 16 * FILM.S;
      ui.rrect(ctx, x, y, Math.max(h, fw), h, h / 2);
      ctx.fillStyle = o.color || P.accent;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  /** check(ctx, cx, cy, r, p, o) : a check in a circle, drawn on over p 0..1. color P.green · fill true · alpha 1 */
  ui.check = (ctx, cx, cy, r, p, o = {}) => {
    p = clamp(p);
    if (p <= 0) return;
    const col = o.color || P.green;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    const ring = clamp(p / 0.5);
    const tick = clamp((p - 0.35) / 0.65);
    const sc = 0.6 + 0.4 * E.outBack(ring);
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    if (o.fill !== false) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fillStyle = A(col, 0.16 * ring);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * ring);
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(2.5, r * 0.12);
    ctx.lineCap = 'round';
    ctx.stroke();
    if (tick > 0) {
      const pts = [[-r * 0.4, r * 0.02], [-r * 0.1, r * 0.32], [r * 0.45, -r * 0.3]];
      const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
      const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
      const d = tick * (l1 + l2);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      if (d <= l1) ctx.lineTo(lerp(pts[0][0], pts[1][0], d / l1), lerp(pts[0][1], pts[1][1], d / l1));
      else {
        ctx.lineTo(pts[1][0], pts[1][1]);
        const q = (d - l1) / l2;
        ctx.lineTo(lerp(pts[1][0], pts[2][0], q), lerp(pts[1][1], pts[2][1], q));
      }
      ctx.lineWidth = Math.max(3, r * 0.16);
      ctx.stroke();
    }
    ctx.restore();
  };

  /** playButton(ctx, cx, cy, r, o) : round play button. press 0..1 · alpha 1 · accent false */
  ui.playButton = (ctx, cx, cy, r, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    const sc = 1 - 0.08 * Math.sin(clamp(o.press || 0) * Math.PI);
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = o.accent ? P.accent : A(P.text, 0.92);
    ctx.fill();
    ui.icon(ctx, 'play', r * 0.08, 0, r * 0.95, { color: o.accent ? P.accentInk : P.bg });
    ctx.restore();
  };

  /**
   * video(ctx, x, y, w, h, o) : a lesson video frame — dark 16:9 panel, a soft abstract "code on
   * screen" still, a play button, a scrub bar and a duration stamp.
   *   p 0..1 (playhead) · playing false · press 0..1 · alpha 1 · label (mono caption on the frame)
   */
  ui.video = (ctx, x, y, w, h, o = {}) => {
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ui.rrect(ctx, x, y, w, h, 18);
    ctx.fillStyle = P.bgDeep;
    ctx.fill();
    ctx.save();
    ui.rrect(ctx, x, y, w, h, 18);
    ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, A(P.accentDeep, 0.35));
    g.addColorStop(1, A(P.bg, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // abstract code lines on screen
    const rng = L.rng(9107);
    for (let i = 0; i < 9; i++) {
      const lx = x + w * 0.08 + (i % 3 === 0 ? 0 : 36);
      const ly = y + h * 0.14 + i * h * 0.075;
      const lw = w * (0.18 + rng() * 0.3);
      ctx.fillStyle = A(i % 4 === 1 ? P.accent : P.text2, 0.18);
      ui.rrect(ctx, lx, ly, lw, h * 0.028, h * 0.014);
      ctx.fill();
    }
    ctx.restore();
    ui.rrect(ctx, x, y, w, h, 18);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = P.border;
    ctx.stroke();
    if (!o.playing) ui.playButton(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.12, { press: o.press });
    ui.progress(ctx, x + 24, y + h - 34, w - 48, o.p || 0, { h: 6 });
    if (o.label) ui.text(ctx, o.label, x + 24, y + 44, { mono: true, size: 20, weight: 500, color: P.text2 });
    ctx.restore();
  };

  // ===========================================================================
  // Actors
  // ===========================================================================

  /**
   * cursor(ctx, x, y, o) : the mouse pointer, tip at (x, y). White with a dark outline, soft shadow.
   *   press 0..1 (the pointer dips 2 px and a ripple rings out) · alpha 1 · s 1 (scale; 1 = 44 px tall)
   */
  ui.cursor = (ctx, x, y, o = {}) => {
    const s = o.s || 1;
    const press = clamp(o.press || 0);
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    if (press > 0) ui.ripple(ctx, x, y, press);
    const dip = Math.sin(press * Math.PI) * 0.1;
    ctx.translate(x, y);
    ctx.scale(s * (1 - dip), s * (1 - dip));
    const path = [[0, 0], [0, 36], [9, 28], [15.5, 42], [21.5, 39.5], [15, 26], [27, 26]];
    ctx.save();
    ctx.shadowColor = A('#000000', 0.6);
    ctx.shadowBlur = 12 * FILM.S;
    ctx.shadowOffsetY = 4 * FILM.S;
    ctx.beginPath();
    path.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = P.text;
    ctx.fill();
    ctx.restore();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = P.bgDeep;
    ctx.stroke();
    ctx.restore();
  };
  /** ripple(ctx, x, y, p, o) : a click ring expanding from (x, y) over p 0..1. color P.accent · r 46 */
  ui.ripple = (ctx, x, y, p, o = {}) => {
    p = clamp(p);
    if (p <= 0 || p >= 1) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 8 + (o.r || 46) * E.outCubic(p), 0, TAU);
    ctx.strokeStyle = A(o.color || P.accent, 0.8 * (1 - p));
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 6 + 10 * E.outCubic(p), 0, TAU);
    ctx.fillStyle = A(o.color || P.accent, 0.35 * (1 - p));
    ctx.fill();
    ctx.restore();
  };
  /**
   * cursorPath(keys, t) : cursor position from keyframes [[t, x, y], ...], eased inOutCubic between
   * them, holding before the first and after the last. Returns [x, y].
   */
  ui.cursorPath = (keys, t) => {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const a = keys[i - 1];
        const b = keys[i];
        const q = E.inOutCubic((t - a[0]) / Math.max(1e-6, b[0] - a[0]));
        // a slight arc so moves feel hand-made
        const mx = lerp(a[1], b[1], q);
        const my = lerp(a[2], b[2], q) - Math.sin(q * Math.PI) * Math.min(40, Math.hypot(b[1] - a[1], b[2] - a[2]) * 0.08);
        return [mx, my];
      }
    }
    const z = keys[keys.length - 1];
    return [z[1], z[2]];
  };

  // Catmull-Rom sampled polyline through pts, cached per pts identity key
  function sampleCurve(pts, per = 18) {
    const out = [];
    const n = pts.length;
    if (n < 2) return pts.slice();
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(n - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[n - 1].slice());
    return out;
  }
  ui.curve = sampleCurve;

  /**
   * route(ctx, pts, o) : THE violet route line — the film's through-line. A smooth curve through pts
   * (Catmull-Rom), drawn from `from` to `to` (0..1 of its length), with a soft glow and a bright
   * leading dot at the `to` end.
   *   from 0 · to 1 · width 4 · color P.accent · glow 1 · head true · alpha 1 · dash false (lost/searching state)
   *   wobble 0 (px amplitude of a living wiggle, animated by o.T) · T (global time for wobble)
   *   straight false (polyline instead of curve)
   * Returns { x, y, angle } of the head.
   */
  ui.route = (ctx, pts, o = {}) => {
    let S = o.straight ? pts.map((p) => p.slice()) : sampleCurve(pts, o.per || 18);
    if (o.straight) {
      // densify for partial drawing
      const d = [];
      for (let i = 0; i < S.length - 1; i++) for (let k = 0; k < 12; k++) d.push([lerp(S[i][0], S[i + 1][0], k / 12), lerp(S[i][1], S[i + 1][1], k / 12)]);
      d.push(S[S.length - 1]);
      S = d;
    }
    if (o.wobble) {
      const T = o.T || 0;
      S = S.map((p, i) => {
        const nx = L.noise2(i * 0.09, T * 1.3, 77) * o.wobble;
        const ny = L.noise2(i * 0.09 + 40, T * 1.3, 91) * o.wobble;
        const e = Math.min(1, i / 8, (S.length - 1 - i) / 8);
        return [p[0] + nx * e, p[1] + ny * e];
      });
    }
    const len = [0];
    for (let i = 1; i < S.length; i++) len.push(len[i - 1] + Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]));
    const total = len[len.length - 1] || 1;
    const a = clamp(o.from || 0) * total;
    const b = clamp(o.to != null ? o.to : 1) * total;
    if (b - a < 0.5) return null;
    const at = (d) => {
      let i = 1;
      while (i < len.length - 1 && len[i] < d) i++;
      const q = (d - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1]);
      return [lerp(S[i - 1][0], S[i][0], q), lerp(S[i - 1][1], S[i][1], q), Math.atan2(S[i][1] - S[i - 1][1], S[i][0] - S[i - 1][0])];
    };
    const trace = () => {
      ctx.beginPath();
      const p0 = at(a);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 0; i < S.length; i++) if (len[i] > a && len[i] < b) ctx.lineTo(S[i][0], S[i][1]);
      const p1 = at(b);
      ctx.lineTo(p1[0], p1[1]);
    };
    const col = o.color || P.accent;
    const w = o.width || 4;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash([w * 3, w * 3.5]);
    const glow = o.glow != null ? o.glow : 1;
    if (glow > 0) {
      trace();
      ctx.strokeStyle = A(col, 0.18 * glow);
      ctx.lineWidth = w * 5;
      ctx.stroke();
      trace();
      ctx.strokeStyle = A(col, 0.3 * glow);
      ctx.lineWidth = w * 2.4;
      ctx.stroke();
    }
    trace();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.setLineDash([]);
    const h = at(b);
    if (o.head !== false) {
      const g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], w * 7);
      g.addColorStop(0, A(P.accentHi, 0.9));
      g.addColorStop(0.35, A(col, 0.35));
      g.addColorStop(1, A(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(h[0] - w * 7, h[1] - w * 7, w * 14, w * 14);
      ctx.beginPath();
      ctx.arc(h[0], h[1], w * 1.35, 0, TAU);
      ctx.fillStyle = P.text;
      ctx.fill();
    }
    ctx.restore();
    return { x: h[0], y: h[1], angle: h[2], length: total };
  };

  /**
   * glyph(ctx, kind, cx, cy, s, o) : the three route pictograms, line icons on an s x s box.
   *   'agent' a robot head · 'engineering' a component scheme · 'project' ascending steps with an arrow
   *   color P.accent · lw (default s/22) · draw 0..1 (stroke-on) · alpha 1 · tile true (rounded tinted tile behind)
   */
  ui.glyph = (ctx, kind, cx, cy, s, o = {}) => {
    const col = o.color || P.accent;
    const d = o.draw != null ? clamp(o.draw) : 1;
    if (d <= 0) return;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    if (o.tile !== false) {
      ui.rrect(ctx, cx - s * 0.62, cy - s * 0.62, s * 1.24, s * 1.24, s * 0.3);
      ctx.fillStyle = A(col, 0.12 * Math.min(1, d * 2));
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = A(col, 0.3 * Math.min(1, d * 2));
      ctx.stroke();
    }
    ctx.translate(cx, cy);
    const u = s / 100; // design on a 100-unit box centred at 0
    ctx.scale(u, u);
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = (o.lw || s / 22) / u;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const seg = (i, n) => clamp(d * n - i);
    const partial = (f, q) => {
      if (q <= 0) return;
      ctx.save();
      ctx.setLineDash([400 * q, 400]);
      f();
      ctx.restore();
    };
    if (kind === 'agent') {
      partial(() => { ui.rrect(ctx, -32, -22, 64, 50, 14); ctx.stroke(); }, seg(0, 4));
      partial(() => { ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -36); ctx.stroke(); }, seg(1, 4));
      if (seg(1, 4) > 0.5) { ctx.beginPath(); ctx.arc(0, -40, 5, 0, TAU); ctx.fill(); }
      if (seg(2, 4) > 0) {
        ctx.globalAlpha *= seg(2, 4);
        ctx.beginPath(); ctx.arc(-13, 0, 6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(13, 0, 6, 0, TAU); ctx.fill();
      }
      partial(() => { ctx.beginPath(); ctx.moveTo(-12, 15); ctx.lineTo(12, 15); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-32, 2); ctx.lineTo(-40, 2); ctx.moveTo(32, 2); ctx.lineTo(40, 2); ctx.stroke(); }, seg(3, 4));
    } else if (kind === 'engineering') {
      partial(() => { ui.rrect(ctx, -14, -40, 28, 22, 6); ctx.stroke(); }, seg(0, 4));
      partial(() => { ui.rrect(ctx, -44, 16, 28, 22, 6); ctx.stroke(); ui.rrect(ctx, 16, 16, 28, 22, 6); ctx.stroke(); }, seg(1, 4));
      partial(() => { ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -2); ctx.moveTo(-30, 16); ctx.lineTo(-30, -2); ctx.lineTo(30, -2); ctx.lineTo(30, 16); ctx.stroke(); }, seg(2, 4));
      if (seg(3, 4) > 0) { ctx.globalAlpha *= seg(3, 4); ctx.beginPath(); ctx.arc(0, -2, 5, 0, TAU); ctx.fill(); }
    } else {
      partial(() => { ctx.beginPath(); ctx.moveTo(-42, 36); ctx.lineTo(-14, 36); ctx.lineTo(-14, 12); ctx.lineTo(14, 12); ctx.lineTo(14, -12); ctx.lineTo(42, -12); ctx.stroke(); }, seg(0, 2));
      partial(() => { ctx.beginPath(); ctx.moveTo(-30, 8); ctx.lineTo(24, -40); ctx.moveTo(6, -40); ctx.lineTo(24, -40); ctx.lineTo(24, -22); ctx.stroke(); }, seg(1, 2));
    }
    ctx.restore();
  };

  /**
   * logo(ctx, cx, cy, size, o) : the real Незаменимые mark (public/logo.png via src/photos.js), with
   * the site's accent drop-glow. Drawn through a per-size cached canvas at 1:1 so every size
   * resamples once and identically. alpha 1 · glow 1 · scale 1 (pop)
   */
  ui.logo = (ctx, cx, cy, size, o = {}) => {
    const img = FILM.photo ? FILM.photo('logo') : null;
    if (!img) return;
    const S = FILM.S;
    const px = Math.max(8, Math.round(size * S));
    const pad = Math.round(px * 0.5);
    const tile = L.cached(`ui-logo-${px}`, () => {
      const c = FILM.makeCanvas(px + pad * 2, px + pad * 2);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = 'high';
      g.shadowColor = A(P.accent, 0.55);
      g.shadowBlur = px * 0.35;
      g.drawImage(img, pad, pad, px, px);
      return c;
    });
    const sc = o.scale != null ? o.scale : 1;
    if (sc <= 0) return;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    const full = (px + pad * 2) / S;
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ctx.drawImage(tile, -full / 2, -full / 2, full, full);
    ctx.restore();
  };

  /**
   * brand(ctx, x, y, o) : the lockup as on the site header — logo mark, НЕЗАМЕНИМЫЕ (Onest 600),
   * and a mono caps caption (default 'Открытая практика'). x,y = left, vertical centre.
   *   size 64 (logo px) · alpha 1 · caption · align 'left' | 'center' (then x is the centre)
   * Returns the lockup width.
   */
  ui.brand = (ctx, x, y, o = {}) => {
    const s = o.size || 64;
    const nameSize = Math.round(s * 0.5);
    const capSize = Math.round(s * 0.26);
    const cap = o.caption != null ? o.caption : 'Открытая практика';
    const nw = ui.measure(ctx, 'НЕЗАМЕНИМЫЕ', { size: nameSize, weight: 600, tracking: nameSize * 0.02 });
    const cw = ui.measure(ctx, cap, { mono: true, size: capSize, upper: true, tracking: capSize * 0.16 });
    const w = s + s * 0.3 + Math.max(nw, cw);
    const x0 = o.align === 'center' ? x - w / 2 : x;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ui.logo(ctx, x0 + s / 2, y, s);
    const tx = x0 + s * 1.3;
    ui.text(ctx, 'НЕЗАМЕНИМЫЕ', tx, y - s * 0.02, { size: nameSize, weight: 600, tracking: nameSize * 0.02, color: P.text });
    ui.text(ctx, cap, tx, y + capSize * 1.45, { mono: true, size: capSize, upper: true, tracking: capSize * 0.16, color: P.text3 });
    ctx.restore();
    return w;
  };

  /** author(ctx, x, y, o) : small author credit — round photo + name. size 56 · alpha 1 · name 'Владилен Минин' · align 'left'|'center' */
  ui.author = (ctx, x, y, o = {}) => {
    const s = o.size || 56;
    const name = o.name || 'Владилен Минин';
    const ts = Math.round(s * 0.5);
    const tw = ui.measure(ctx, name, { size: ts, weight: 500 });
    const w = s + 16 + tw;
    const x0 = o.align === 'center' ? x - w / 2 : x;
    const img = FILM.photo ? FILM.photo('author') : null;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    if (img) {
      const px = Math.round(s * FILM.S);
      const tile = L.cached(`ui-author-${px}`, () => {
        const c = FILM.makeCanvas(px, px);
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.beginPath();
        g.arc(px / 2, px / 2, px / 2, 0, TAU);
        g.clip();
        g.drawImage(img, 0, 0, px, px);
        return c;
      });
      ctx.drawImage(tile, x0, y - s / 2, s, s);
    }
    ctx.beginPath();
    ctx.arc(x0 + s / 2, y, s / 2, 0, TAU);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = P.borderHi;
    ctx.stroke();
    ui.text(ctx, name, x0 + s + 16, y + ts * 0.36, { size: ts, weight: 500, color: P.text2 });
    ctx.restore();
    return w;
  };

  /**
   * block(ctx, cx, cy, w, h, label, o) : a schema block for the architecture diagram (scene 05) —
   * a card with a centred label and a small mono sub-label.
   *   a 0..1 (appear: alpha + scale 0.9→1) · accent false (accent outline for the centre block) · sub · size 36
   */
  ui.block = (ctx, cx, cy, w, h, label, o = {}) => {
    const a = o.a != null ? clamp(o.a) : 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    const sc = 0.9 + 0.1 * E.outBack(a);
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    ui.card(ctx, -w / 2, -h / 2, w, h, { r: 18, glow: o.accent ? 0.8 : o.glow || 0, fill: o.accent ? L.mix(P.card, P.accentDeep, 0.18) : P.card });
    const size = o.size || 36;
    if (o.sub) {
      ui.text(ctx, label, 0, size * 0.1, { size, weight: 600, align: 'center', color: P.text });
      ui.text(ctx, o.sub, 0, size * 0.1 + 38, { mono: true, size: 20, align: 'center', color: P.text3 });
    } else {
      ui.text(ctx, label, 0, size * 0.36, { size, weight: 600, align: 'center', color: P.text });
    }
    ctx.restore();
  };

  /**
   * link(ctx, ax, ay, bx, by, p, o) : a connector drawn from a to b over p 0..1, with round end
   * nodes. pulse (0..1 position of a travelling light dot, or null) · color P.accent · width 3 · alpha 1
   */
  ui.link = (ctx, ax, ay, bx, by, p, o = {}) => {
    p = clamp(p);
    if (p <= 0) return;
    const col = o.color || P.accent;
    ctx.save();
    ctx.globalAlpha *= o.alpha != null ? o.alpha : 1;
    ctx.lineCap = 'round';
    const ex = lerp(ax, bx, p);
    const ey = lerp(ay, by, p);
    ctx.strokeStyle = A(col, 0.25);
    ctx.lineWidth = (o.width || 3) * 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.strokeStyle = col;
    ctx.lineWidth = o.width || 3;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(ax, ay, 6, 0, TAU);
    ctx.fill();
    if (p >= 1) {
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, TAU);
      ctx.fill();
    }
    if (o.pulse != null && o.pulse >= 0 && o.pulse <= 1) {
      const px = lerp(ax, bx, o.pulse);
      const py = lerp(ay, by, o.pulse);
      const g = ctx.createRadialGradient(px, py, 0, px, py, 26);
      g.addColorStop(0, A(P.text, 1));
      g.addColorStop(0.3, A(P.accentHi, 0.7));
      g.addColorStop(1, A(P.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(px - 26, py - 26, 52, 52);
    }
    ctx.restore();
  };

  /** arrowDown(ctx, cx, y, len, o) : the closing violet arrow pointing down. p 0..1 (draw) · glow 0..1 · alpha 1 */
  ui.arrowDown = (ctx, cx, y, len, o = {}) => {
    const p = o.p != null ? clamp(o.p) : 1;
    if (p <= 0) return;
    const y1 = y + len * E.outCubic(p);
    ui.route(ctx, [[cx, y], [cx, y1]], { straight: true, head: false, width: 5, glow: 0.6 + 0.6 * (o.glow || 0), alpha: o.alpha });
    ctx.save();
    ctx.globalAlpha *= (o.alpha != null ? o.alpha : 1) * clamp(p * 3 - 1.5);
    ctx.strokeStyle = P.accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 20, y1 - 20);
    ctx.lineTo(cx, y1);
    ctx.lineTo(cx + 20, y1 - 20);
    ctx.stroke();
    ctx.restore();
  };

  // ===========================================================================
  // Routes
  // ===========================================================================

  /** The three routes, verbatim from the Learn catalogue (ТЗ). */
  ui.ROUTES = Object.freeze([
    Object.freeze({ key: 'agents', glyph: 'agent', short: 'Агент', name: 'Собрать первого агента', result: 'Бриф агента', resultLong: 'Бриф + первый проверенный результат', file: 'agent-brief.md' }),
    Object.freeze({ key: 'engineering', glyph: 'engineering', short: 'AI-инженерия', name: 'Разобраться в AI-инженерии', result: 'Схема агента', resultLong: 'Схема своего агента', file: 'agent-architecture.md' }),
    Object.freeze({ key: 'projects', glyph: 'project', short: 'Свой проект', name: 'Довести свой проект до результата', result: 'План проекта', resultLong: 'План на неделю', file: 'weekly-plan.md' }),
  ]);

  /**
   * Shared geometry G1 — the row of three route cards (scenes 02, 03, 12). Exact numbers; a scene
   * that shows the row uses these so the cards hold still across cuts.
   */
  ui.CARD_ROW = Object.freeze({ x: [192, 720, 1248], y: 440, w: 480, h: 360, r: 24 });
  /** G2 — scene 01 → 02 boundary (T 4.0 in the 60 cut, 3.0 in the 45 cut): the four cards of the cold open. */
  ui.G2 = Object.freeze({
    tabs: Object.freeze([
      Object.freeze({ x: 150, y: 330, w: 520, h: 330, tilt: -0.035, title: 'Видео про AI', kind: 'video', fav: '#F4524A' }),
      Object.freeze({ x: 1250, y: 300, w: 520, h: 330, tilt: 0.03, title: 'Новый инструмент', kind: 'tool', fav: '#7FB0FF' }),
      Object.freeze({ x: 1180, y: 540, w: 520, h: 300, tilt: -0.02, title: 'Сохранить на потом', kind: 'note', fav: '#F5C66B' }),
    ]),
    project: Object.freeze({ x: 700, y: 400, w: 520, h: 380, title: 'Мой проект' }),
  });
  /** G3 — scene 03 → 04 boundary (T 12.0 / 7.0): route card 0 alone, enlarged, label 'name', glow 1. */
  ui.G3 = Object.freeze({ x: 120, y: 300, w: 560, h: 440 });
  /** G4 — scene 04 → 05 boundary (T 18.0 / 13.0): the window frame has become the contour of the Модель block. */
  ui.G4 = Object.freeze({ x: 810, y: 435, w: 300, h: 130, r: 18, schemaCx: 960, schemaCy: 560 });
  /** Standard title placement for route scenes (04–06): kicker baseline 150, title baseline 232, x 120. */
  ui.TITLE = Object.freeze({ x: 120, kickerY: 150, y: 232, size: 76 });

  /**
   * routeCard(ctx, i, x, y, w, h, o) : one route card as on the Learn page — glyph tile top-left,
   * the short label large, the full route name under it, optional "Начать маршрут" button.
   *   a 0..1 (appear) · label 'short' | 'name' | 'both' (default 'both') · button false · press 0..1 · hover 0..1
   *   glow 0..1 · dim 0..1 (pushed back) · contour false (outline-only) · draw 0..1 (glyph stroke-on)
   *   index true (mono "01" in the corner)
   */
  ui.routeCard = (ctx, i, x, y, w, h, o = {}) => {
    const R = ui.ROUTES[i];
    const a = o.a != null ? clamp(o.a) : 1;
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a * (1 - 0.55 * clamp(o.dim || 0));
    ctx.translate(0, (1 - a) * 28);
    ui.card(ctx, x, y, w, h, { r: 24, glow: o.glow || 0, dashed: !!o.contour, shadow: o.contour ? 0 : 1 });
    const gs = Math.min(76, w * 0.16);
    ui.glyph(ctx, R.glyph, x + 44 + gs * 0.62, y + 44 + gs * 0.62, gs, { draw: o.draw != null ? o.draw : 1 });
    if (o.index !== false) ui.text(ctx, '0' + (i + 1), x + w - 40, y + 70, { mono: true, size: 22, color: P.text3, align: 'right' });
    const mode = o.label || 'both';
    const tx = x + 44;
    let ty = y + 44 + gs * 1.24 + 70;
    if (mode === 'short' || mode === 'both') {
      ui.text(ctx, R.short, tx, ty, { size: o.shortSize || 48, weight: 600, color: P.text });
      ty += 52;
    }
    if (mode === 'name' || mode === 'both') {
      const lines = ui.wrap(ctx, R.name, w - 88, { size: mode === 'name' ? 40 : 28, weight: mode === 'name' ? 600 : 400 });
      lines.forEach((ln, k) => ui.text(ctx, ln, tx, ty + k * (mode === 'name' ? 48 : 36), { size: mode === 'name' ? 40 : 28, weight: mode === 'name' ? 600 : 400, color: mode === 'name' ? P.text : P.text2 }));
    }
    if (o.button) ui.button(ctx, x + 44, y + h - 44 - 68, w - 88, 68, 'Начать маршрут', { press: o.press, hover: o.hover, icon: 'arrow', size: 28 });
    ctx.restore();
  };

  // ===========================================================================
  // Composites — the film's recurring documents and pages. Scenes drive their state; nobody
  // redraws them. All take st (state) with 0..1 progress fields; missing fields mean "done".
  // ===========================================================================

  const one = (v) => (v == null ? 1 : clamp(v));

  /**
   * briefCard(ctx, x, y, w, h, st) : "Бриф агента" (agent-brief.md) with three rows.
   *   st.rows [pTask, pRules, pCheck]  typed fraction per row value (0 = empty field, label shown)
   *   st.labels 0..1 (row labels appear) · st.focus (row index being typed, or -1) · st.T (caret clock)
   *   st.glow 0..1 · st.alpha · st.compact (thumbnail mode for scene 10: smaller type)
   * Values (ТЗ сцена 04): Поправить кнопку · Только нужный файл · Проверить на телефоне
   */
  ui.BRIEF = Object.freeze([
    ['Задача', 'Поправить кнопку'],
    ['Правила', 'Только нужный файл'],
    ['Проверка', 'Проверить на телефоне'],
  ]);
  ui.briefCard = (ctx, x, y, w, h, st = {}) => {
    ctx.save();
    ctx.globalAlpha *= st.alpha != null ? st.alpha : 1;
    const c = !!st.compact;
    const body = ui.sheet(ctx, x, y, w, h, { file: 'agent-brief.md', title: 'Бриф агента', glow: st.glow || 0, titleSize: c ? 34 : 40 });
    const rows = st.rows || [1, 1, 1];
    const la = one(st.labels);
    const rh = c ? 64 : 84;
    const gap = c ? 16 : 22;
    for (let i = 0; i < 3; i++) {
      const ry = body.y + 8 + i * (rh + gap);
      if (ry + rh > y + h - 16) break;
      ui.field(ctx, body.x, ry, body.w, rh, {
        label: ui.BRIEF[i][0], value: ui.BRIEF[i][1], p: rows[i], labelW: c ? 150 : 200, size: c ? 26 : 34,
        focus: st.focus === i ? 1 : 0, caret: st.T, alpha: la,
      });
    }
    ctx.restore();
  };

  /**
   * schema(ctx, cx, cy, s, st) : the agent architecture — Модель in the centre, Инструменты left,
   * Знания right, Проверка below; connectors between them. s = scale (1 = 1100 px wide diagram).
   *   st.model st.tools st.know st.check 0..1 (block appear) · st.lTools st.lKnow st.lCheck 0..1 (links draw)
   *   st.pulse 0..1 (a light dot travelling model→tools and back: 0..0.5 out, 0.5..1 back) or null
   *   st.sub true (mono sub-labels: LLM · API · RAG · тесты) · st.alpha
   * Geometry (s = 1, relative to cx, cy): Модель (0, -60) 300 x 130 · Инструменты (-400, -60) 280 x 110 ·
   * Знания (400, -60) 280 x 110 · Проверка (0, 150) 280 x 110.
   */
  ui.SCHEMA = Object.freeze({
    model: Object.freeze({ x: 0, y: -60, w: 300, h: 130 }),
    tools: Object.freeze({ x: -400, y: -60, w: 280, h: 110 }),
    know: Object.freeze({ x: 400, y: -60, w: 280, h: 110 }),
    check: Object.freeze({ x: 0, y: 150, w: 280, h: 110 }),
  });
  ui.schema = (ctx, cx, cy, s, st = {}) => {
    const G = ui.SCHEMA;
    ctx.save();
    ctx.globalAlpha *= st.alpha != null ? st.alpha : 1;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    const sub = st.sub !== false;
    const lT = one(st.lTools);
    const lK = one(st.lKnow);
    const lC = one(st.lCheck);
    const pulse = st.pulse;
    // links first (behind blocks)
    const mL = [G.model.x - G.model.w / 2, G.model.y];
    const tR = [G.tools.x + G.tools.w / 2, G.tools.y];
    const mR = [G.model.x + G.model.w / 2, G.model.y];
    const kL = [G.know.x - G.know.w / 2, G.know.y];
    const mB = [G.model.x, G.model.y + G.model.h / 2];
    const cT = [G.check.x, G.check.y - G.check.h / 2];
    let pT = null;
    if (pulse != null && pulse >= 0 && pulse <= 1) pT = pulse < 0.5 ? 1 - pulse * 2 : (pulse - 0.5) * 2;
    ui.link(ctx, mL[0], mL[1], tR[0], tR[1], lT, { pulse: pT });
    ui.link(ctx, mR[0], mR[1], kL[0], kL[1], lK, {});
    ui.link(ctx, mB[0], mB[1], cT[0], cT[1], lC, {});
    ui.block(ctx, G.tools.x, G.tools.y, G.tools.w, G.tools.h, 'Инструменты', { a: one(st.tools), sub: sub ? 'API · файлы' : null, size: 32 });
    ui.block(ctx, G.know.x, G.know.y, G.know.w, G.know.h, 'Знания', { a: one(st.know), sub: sub ? 'RAG · документы' : null, size: 32 });
    ui.block(ctx, G.check.x, G.check.y, G.check.w, G.check.h, 'Проверка', { a: one(st.check), sub: sub ? 'тесты · критерии' : null, size: 32, glow: st.checkGlow || 0 });
    ui.block(ctx, G.model.x, G.model.y, G.model.w, G.model.h, 'Модель', { a: one(st.model), accent: true, sub: sub ? 'LLM' : null, size: 40 });
    ctx.restore();
  };

  /**
   * planSheet(ctx, x, y, w, h, st) : "План на неделю" (weekly-plan.md).
   *   st.goal 0..1 (the "Результат недели" row types in) · st.steps [p1, p2, p3] (each step row appears)
   *   st.active 0..1 (step 1 highlighted) · st.who 0..1 ("Кому покажу результат" row) · st.alpha · st.glow · st.compact
   * Texts: goal 'Лендинг с формой заявки'; steps 'Собрать первый экран', 'Подключить форму', 'Показать трём людям'.
   */
  ui.PLAN = Object.freeze({
    goal: 'Лендинг с формой заявки',
    steps: Object.freeze(['Собрать первый экран', 'Подключить форму', 'Показать трём людям']),
    who: 'Кому покажу результат',
  });
  ui.planSheet = (ctx, x, y, w, h, st = {}) => {
    ctx.save();
    ctx.globalAlpha *= st.alpha != null ? st.alpha : 1;
    const c = !!st.compact;
    const body = ui.sheet(ctx, x, y, w, h, { file: 'weekly-plan.md', title: 'План на неделю', glow: st.glow || 0, titleSize: c ? 34 : 40 });
    const gy = body.y + 4;
    const gh = c ? 72 : 96;
    // goal row
    ui.rrect(ctx, body.x, gy, body.w, gh, 14);
    ctx.fillStyle = A(P.accent, 0.1);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = A(P.accent, 0.5);
    ctx.stroke();
    ui.text(ctx, 'Результат недели', body.x + 24, gy + (c ? 28 : 34), { mono: true, size: c ? 17 : 20, upper: true, tracking: 2, color: P.accentHi });
    ui.text(ctx, ui.PLAN.goal, body.x + 24, gy + (c ? 58 : 76), { size: c ? 26 : 34, weight: 600, p: one(st.goal), color: P.text });
    const steps = st.steps || [1, 1, 1];
    const sh = c ? 54 : 70;
    const act = clamp(st.active || 0);
    for (let i = 0; i < 3; i++) {
      const a = clamp(steps[i] != null ? steps[i] : 1);
      if (a <= 0) continue;
      const sy = gy + gh + (c ? 14 : 20) + i * (sh + (c ? 10 : 14));
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate((1 - a) * 24, 0);
      const hi = i === 0 ? act : 0;
      ui.rrect(ctx, body.x, sy, body.w, sh, 12);
      ctx.fillStyle = hi > 0 ? L.mix(P.field, P.accentDeep, 0.25 * hi) : P.field;
      ctx.fill();
      ctx.lineWidth = 1.5 + hi;
      ctx.strokeStyle = L.mix(P.border, P.accent, hi);
      ctx.stroke();
      ui.text(ctx, String(i + 1), body.x + 26, sy + sh / 2 + 9, { mono: true, size: 24, weight: 600, color: hi > 0 ? P.accentHi : P.text3 });
      ui.text(ctx, ui.PLAN.steps[i], body.x + 66, sy + sh / 2 + (c ? 9 : 11), { size: c ? 25 : 31, weight: 500, color: i === 0 || !act ? P.text : P.text2 });
      // check square (place for the check)
      ctx.strokeStyle = hi > 0 ? P.accent : P.borderHi;
      ctx.lineWidth = 2;
      ui.rrect(ctx, body.x + body.w - 54, sy + sh / 2 - 15, 30, 30, 8);
      ctx.stroke();
      ctx.restore();
    }
    const wa = clamp(st.who || 0);
    if (wa > 0) {
      const wy = gy + gh + (c ? 14 : 20) + 3 * (sh + (c ? 10 : 14)) + 6;
      ctx.save();
      ctx.globalAlpha *= wa;
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = P.borderHi;
      ctx.lineWidth = 1.5;
      ui.rrect(ctx, body.x, wy, body.w, c ? 50 : 62, 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ui.text(ctx, ui.PLAN.who, body.x + 24, wy + (c ? 33 : 40), { size: c ? 23 : 28, weight: 500, color: P.text2 });
      ctx.restore();
    }
    ctx.restore();
  };

  /**
   * LESSON — the practice page (a lesson of the agent route), laid out on its own 1920-wide
   * virtual page that scenes 07–09 film through lib.camera. Region rects are in page coordinates.
   */
  ui.LESSON = Object.freeze({
    w: 1920, h: 1500,
    header: Object.freeze({ x: 120, y: 60, w: 1680, h: 150 }),
    video: Object.freeze({ x: 120, y: 250, w: 1000, h: 562 }),
    materials: Object.freeze({ x: 1160, y: 250, w: 640, h: 562 }),
    task: Object.freeze({ x: 120, y: 852, w: 1680, h: 600 }),
    template: Object.freeze({ x: 160, y: 976, w: 330, h: 64 }),
    notes: Object.freeze({ x: 160, y: 1064, w: 1000, h: 250 }),
    criteria: Object.freeze({ x: 1200, y: 976, w: 560, h: 338 }),
    download: Object.freeze({ x: 160, y: 1338, w: 330, h: 64 }),
    done: Object.freeze({ x: 1200, y: 1338, w: 300, h: 64 }),
    progress: Object.freeze({ x: 1530, y: 1338, w: 230, h: 64 }),
  });
  ui.MATERIALS = Object.freeze(['Памятка: как устроен бриф', 'Шаблон брифа · agent-brief.md', 'Чек-лист проверки']);
  ui.CRITERIA = Object.freeze(['Изменён только нужный файл', 'Кнопка работает на телефоне', 'Результат проверен вручную']);
  ui.TEMPLATE = Object.freeze([
    ['Задача', 'Поправить кнопку «Оплатить»'],
    ['Ожидаемый результат', 'Кнопка видна и нажимается'],
    ['Как проверить', 'Открыть на телефоне и нажать'],
  ]);

  /**
   * lessonPage(ctx, st) : draws the whole page in page coordinates (call inside lib.camera).
   *   st.video 0..1 (playhead) · st.videoFocus 0..1 · st.matFocus 0..1 · st.taskFocus 0..1 (accent rings)
   *   st.templatePress 0..1 · st.tpl 0..1 (template skeleton appears in notes) · st.vals [p, p, p] (values typed)
   *   st.critFocus 0..1 · st.critHi (criterion index highlighted, or -1) · st.donePress 0..1 · st.done 0..1 (completed state)
   *   st.progress 0 | 1 (0/3 → 1/3; fractional animates the bar) · st.T (caret clock) · st.hover { template, done } 0..1
   */
  ui.lessonPage = (ctx, st = {}) => {
    const G = ui.LESSON;
    // header: breadcrumb + lesson title + step indicator
    ui.text(ctx, 'Собрать первого агента  /  Шаг 1 из 3', G.header.x, G.header.y + 40, { mono: true, size: 24, color: P.text3 });
    ui.text(ctx, 'Первый агент в своём проекте', G.header.x, G.header.y + 118, { size: 64, weight: 600, color: P.text, tracking: -1.2 });
    ui.pill(ctx, G.header.x + G.header.w - 250, G.header.y + 12, 'Шаг 1 · 12 мин', { size: 24, color: P.text2 });
    // video
    const v = G.video;
    ctx.save();
    ui.video(ctx, v.x, v.y, v.w, v.h, { p: st.video || 0, playing: (st.video || 0) > 0.02, label: 'Разбор · 8:40' });
    ctx.restore();
    if (st.videoFocus) ring(ctx, v, st.videoFocus);
    // materials
    const m = G.materials;
    ui.card(ctx, m.x, m.y, m.w, m.h, { r: 20 });
    ui.text(ctx, 'Материалы', m.x + 40, m.y + 70, { size: 38, weight: 600 });
    ui.MATERIALS.forEach((s, i) => {
      const yy = m.y + 120 + i * 118;
      ui.rrect(ctx, m.x + 32, yy, m.w - 64, 96, 14);
      ctx.fillStyle = P.field;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = P.border;
      ctx.stroke();
      ui.icon(ctx, 'file', m.x + 76, yy + 48, 34, { color: P.accent });
      const parts = s.split(' · ');
      ui.text(ctx, parts[0], m.x + 116, yy + (parts[1] ? 42 : 58), { size: 27, weight: 500 });
      if (parts[1]) ui.text(ctx, parts[1], m.x + 116, yy + 76, { mono: true, size: 19, color: P.text3 });
      ui.icon(ctx, 'download', m.x + m.w - 76, yy + 48, 28, { color: P.text2 });
    });
    if (st.matFocus) ring(ctx, m, st.matFocus);
    // task panel
    const tk = G.task;
    ui.card(ctx, tk.x, tk.y, tk.w, tk.h, { r: 24, glow: 0.35 * clamp(st.taskFocus || 0), fill: L.mix(P.card, P.accentDeep, 0.06) });
    ui.kicker(ctx, 'Практика', tk.x + 40, tk.y + 52, { size: 22 });
    ui.text(ctx, 'Теперь попробуй на своей задаче', tk.x + 40, tk.y + 106, { size: 44, weight: 600 });
    const hv = st.hover || {};
    const tp = G.template;
    ui.button(ctx, tp.x, tp.y, tp.w, tp.h, 'Вставить шаблон', { primary: false, press: st.templatePress, hover: hv.template, size: 27 });
    // notes textarea
    const n = G.notes;
    ui.rrect(ctx, n.x, n.y, n.w, n.h, 16);
    ctx.fillStyle = P.field;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = (st.tpl || 0) > 0 ? L.mix(P.border, P.accent, 0.6) : P.border;
    ctx.stroke();
    const tpl = clamp(st.tpl || 0);
    if (tpl <= 0) {
      ui.text(ctx, 'Заметки к заданию…', n.x + 30, n.y + 56, { size: 28, color: P.text3 });
    } else {
      const vals = st.vals || [0, 0, 0];
      ui.TEMPLATE.forEach(([lab, val], i) => {
        const la = clamp(tpl * 3 - i);
        if (la <= 0) return;
        const yy = n.y + 58 + i * 72;
        ui.text(ctx, lab + ':', n.x + 30, yy, { mono: true, size: 24, weight: 600, color: P.accentHi, alpha: la });
        const lw = ui.measure(ctx, lab + ':', { mono: true, size: 24, weight: 600 });
        const vv = clamp(vals[i] || 0);
        const w = ui.text(ctx, val, n.x + 30 + lw + 18, yy, { size: 28, weight: 500, p: vv, color: P.text });
        if (vv > 0 && vv < 1 && st.T != null) {
          ctx.fillStyle = P.accent;
          ctx.fillRect(n.x + 30 + lw + 22 + w, yy - 26, 3, 32);
        }
      });
    }
    // criteria
    const cr = G.criteria;
    ui.rrect(ctx, cr.x, cr.y, cr.w, cr.h, 16);
    ctx.fillStyle = A(P.bgDeep, 0.6);
    ctx.fill();
    ctx.lineWidth = 1.5 + clamp(st.critFocus || 0);
    ctx.strokeStyle = L.mix(P.border, P.green, clamp(st.critFocus || 0));
    ctx.stroke();
    ui.text(ctx, 'Как понять, что готово', cr.x + 30, cr.y + 56, { size: 30, weight: 600 });
    ui.CRITERIA.forEach((s, i) => {
      const yy = cr.y + 110 + i * 74;
      const hi = st.critHi === i ? 1 : 0;
      if (hi) {
        ui.rrect(ctx, cr.x + 16, yy - 32, cr.w - 32, 60, 12);
        ctx.fillStyle = A(P.green, 0.12);
        ctx.fill();
      }
      ctx.strokeStyle = hi ? P.green : P.borderHi;
      ctx.lineWidth = 2;
      ui.rrect(ctx, cr.x + 30, yy - 16, 28, 28, 8);
      ctx.stroke();
      ui.text(ctx, s, cr.x + 76, yy + 8, { size: 26, weight: 500, color: hi ? P.text : P.text2 });
    });
    // footer: download, done, progress
    const dl = G.download;
    ui.button(ctx, dl.x, dl.y, dl.w, dl.h, 'Скачать ответ .txt', { primary: false, icon: 'download', size: 25 });
    const dn = G.done;
    const done = clamp(st.done || 0);
    if (done >= 1) ui.button(ctx, dn.x, dn.y, dn.w, dn.h, 'Выполнено', { done: true, size: 27 });
    else ui.button(ctx, dn.x, dn.y, dn.w, dn.h, 'Я сделал', { press: st.donePress, hover: hv.done, icon: 'check', size: 27 });
    const pg = G.progress;
    const pr = clamp(st.progress || 0);
    ui.text(ctx, pr >= 0.5 ? '1 / 3' : '0 / 3', pg.x + pg.w, pg.y + 30, { mono: true, size: 30, weight: 600, color: pr >= 0.5 ? P.accentHi : P.text2, align: 'right' });
    ui.progress(ctx, pg.x, pg.y + 50, pg.w, pr / 3, { h: 8 });
  };
  function ring(ctx, r, a) {
    a = clamp(a);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.shadowColor = A(P.accent, 0.6);
    ctx.shadowBlur = 30 * FILM.S;
    ui.rrect(ctx, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 26);
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.accent;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * resumeCard(ctx, x, y, w, h, st) : the guide's "continue" card (scene 09 end).
   *   st.a 0..1 · st.press 0..1 (button) · st.hover 0..1 · progress shown as 1 / 3
   */
  ui.resumeCard = (ctx, x, y, w, h, st = {}) => {
    const a = one(st.a);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(0, (1 - a) * 24);
    ui.card(ctx, x, y, w, h, { r: 24, glow: 0.5 });
    ui.glyph(ctx, 'agent', x + 90, y + h / 2 - 10, 64, {});
    // needs w >= 1200 and h >= 200
    ui.text(ctx, 'Продолжим с того места, где остановились', x + 160, y + 76, { size: 36, weight: 600 });
    ui.text(ctx, 'Собрать первого агента · Шаг 2 из 3', x + 160, y + 120, { size: 26, color: P.text2 });
    ui.progress(ctx, x + 160, y + 150, 360, 1 / 3, {});
    ui.text(ctx, '1 / 3', x + 544, y + 160, { mono: true, size: 24, color: P.accentHi });
    ui.button(ctx, x + w - 300, y + h / 2 - 34, 250, 68, 'Продолжить', { press: st.press, hover: st.hover, icon: 'arrow', size: 28 });
    ctx.restore();
  };

  // ===========================================================================
  // Subtitles overlay
  // ===========================================================================

  /**
   * FILM.overlay — subtitles. Active only when FILM.TIMELINE.subtitles is true. Cues come from
   * FILM.TIMELINE.subs: [{ t0, t1, text }] ('\n' allowed, at most two lines). Onest 500 44 px,
   * P.text on a dark rounded plate, centred, last baseline at y 972 (ink ends above 1000; the
   * gate's landscape margin is 80 px). Scenes keep y 880..1000 free of must-read UI.
   */
  const SUB = { size: 44, lh: 56, base: 968, padX: 30, padY: 16 };
  FILM.overlay = function overlay(ctx, T) {
    const tl = FILM.TIMELINE;
    if (!tl || !tl.subtitles || !Array.isArray(tl.subs)) return;
    const cue = tl.subs.find((c) => T >= c.t0 - 1e-6 && T < c.t1 - 1e-6);
    if (!cue) return;
    const fade = Math.min(ui.k(T, cue.t0, 0.12, 'linear'), 1 - ui.k(T, cue.t1 - 0.12, 0.12, 'linear'));
    const o = { size: SUB.size, weight: 500, tracking: -0.2 };
    const lines = ui.wrap(ctx, cue.text, 1400, o).slice(0, 2);
    const wmax = Math.max(...lines.map((l) => ui.measure(ctx, l, o)));
    const top = SUB.base - (lines.length - 1) * SUB.lh - SUB.size * 0.9 - SUB.padY;
    const bot = SUB.base + SUB.size * 0.28 + SUB.padY;
    ctx.save();
    ctx.globalAlpha *= fade;
    ui.rrect(ctx, 960 - wmax / 2 - SUB.padX, top, wmax + SUB.padX * 2, bot - top, 14);
    ctx.fillStyle = A(P.bgDeep, 0.78);
    ctx.fill();
    lines.forEach((ln, i) => ui.text(ctx, ln, 960, SUB.base - (lines.length - 1 - i) * SUB.lh, Object.assign({ color: P.text, align: 'center' }, o)));
    ctx.restore();
  };

  FILM.ui = Object.freeze(ui);
})();
