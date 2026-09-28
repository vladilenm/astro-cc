/*
 * 04 · Настроить агента под свою задачу — shot 's04'
 * 60 cut: T 12–18 · 45 cut: T 7–13 (both 6 s; the second half shares local times).
 *
 * Starts on G3 (route card 0, label 'name', glow 1) and ends on G4 (one empty accent contour).
 *
 * Beats (local t, 60 cut / 45 cut where they differ):
 *   0.10–0.92   the card's name flies up and becomes the title; the card body grows into the brief
 *   1.2 / 1.0   brief values type in (Задача, Правила, Проверка)
 *   3.0 / 2.4   the separate window «Твой проект» appears on the right
 *   3.2 / 2.55  the route line hands the brief to the window (a «бриф» token rides its head)
 *   4.2 / 3.4   the broken button in the preview is fixed (grey, misaligned, overflowing → accent, aligned)
 *   4.1–4.8     the cursor comes in from off-frame; click 4.9 (press 0.3 s)
 *   5.2         «Проверено» (only after the click) · 5.25 caption pill
 *   5.45–6.0    everything else fades; the window frame shrinks into the G4 contour
 *
 * Layers back to front: bg · brief (morphing card) · window + preview · route line + token · title ·
 * «Проверено» · caption · cursor · G4 contour.
 */
(function () {
  'use strict';

  const ID = 's04';
  const L = FILM.lib;
  const P = L.pal;
  const E = L.ease;
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const A = (c, a) => L.rgba(c, a);

  // ---------------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------------
  const BRIEF = { x: 120, y: 300, w: 740, h: 464 };
  const WIN = { x: 1020, y: 300, w: 780, h: 464 };
  // phone-shaped preview inside the window body (body starts at WIN.y + 52)
  const PHONE = { x: 1090, y: 374, w: 300, h: 368 };
  const BTN_OK = { x: 1114, y: 660, w: 252, h: 60 };
  const BTN_BAD = { x: 1300, y: 676, w: 96, h: 46, rot: -0.06 };
  const CLICK = [1262, 700];
  const ROUTE = [[866, 492], [944, 498], [1000, 584], [1086, 602]];
  const CHECK_PILL = { x: 1596, y: 520 };

  // ---------------------------------------------------------------------------
  // Schedules (local seconds)
  // ---------------------------------------------------------------------------
  const COMMON = {
    fly: 0.1, flyDur: 0.72, flyStagger: 0,
    morph: 0.22, morphDur: 0.72,
    brief: 0.62, labels: 0.86,
    kicker: 0.55,
    cursorIn: 4.1, cursorAt: 4.8, click: 4.9,
    checked: 5.2, caption: 5.22,
    out: 5.5, shrink: 5.44,
  };
  const SCHED = {
    60: Object.assign({}, COMMON, { type: [[1.2, 0.55], [1.8, 0.55], [2.4, 0.55]], win: 3.0, route: 3.2, routeDur: 0.72, fix: 4.2 }),
    45: Object.assign({}, COMMON, { type: [[1.0, 0.4], [1.5, 0.4], [2.0, 0.4]], win: 2.4, route: 2.55, routeDur: 0.62, fix: 3.4 }),
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** The G4 contour: one rounded rect, accent 2 px stroke, soft glow, empty. (Same helper in 05.) */
  function g4Contour(ctx, x, y, w, h, r, a) {
    if (a <= 0) return;
    const U = FILM.ui;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.shadowColor = A(P.accent, 0.75);
    ctx.shadowBlur = 26 * FILM.S;
    U.rrect(ctx, x, y, w, h, r);
    ctx.lineWidth = 2;
    ctx.strokeStyle = P.accent;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
  }

  /** Word layout of the route name: start (inside the G3 card) and end (title position). Cached. */
  let WORDS = null;
  function words(ctx) {
    if (WORDS) return WORDS;
    const U = FILM.ui;
    const G = U.G3;
    const R = U.ROUTES[0];
    const gs = Math.min(76, G.w * 0.16);
    const sOpt = { size: 40, weight: 600 };
    const lines = U.wrap(ctx, R.name, G.w - 88, sOpt);
    const tx = G.x + 44;
    const ty = G.y + 44 + gs * 1.24 + 70;
    const tr1 = -0.02 * U.TITLE.size;
    const eOpt = { size: U.TITLE.size, weight: 600, tracking: tr1 };
    const out = [];
    let full = '';
    lines.forEach((ln, k) => {
      let pre = '';
      ln.split(' ').forEach((wd) => {
        const sx = tx + (pre ? U.measure(ctx, pre + ' ', sOpt) : 0);
        const ex = U.TITLE.x + (full ? U.measure(ctx, full + ' ', eOpt) : 0);
        out.push({ w: wd, sx, sy: ty + k * 48, ex, ey: U.TITLE.y });
        pre = pre ? pre + ' ' + wd : wd;
        full = full ? full + ' ' + wd : wd;
      });
    });
    WORDS = out;
    return out;
  }

  /** the mini app inside the window: a phone-width screen with a skeleton product and a pay button */
  function preview(ctx, fix, hover, press) {
    const U = FILM.ui;
    const ph = PHONE;
    U.card(ctx, ph.x, ph.y, ph.w, ph.h, { r: 30, fill: P.card, shadow: 0 });
    U.skeleton(ctx, ph.x + ph.w / 2 - 34, ph.y + 16, 68, 1, { h: 8, color: P.borderHi });
    U.card(ctx, ph.x + 24, ph.y + 40, ph.w - 48, 128, { r: 16, fill: P.cardHi, shadow: 0 });
    U.skeleton(ctx, ph.x + 24 + 20, ph.y + 72, 90, 1, { h: 12, color: P.borderHi });
    U.skeleton(ctx, ph.x + 24 + 20, ph.y + 98, 150, 1, { h: 12, color: P.border });
    U.skeleton(ctx, ph.x + 24, ph.y + 192, ph.w - 72, 2, { h: 14, gap: 28, last: 0.66 });
    U.skeleton(ctx, ph.x + 24, ph.y + 254, 92, 1, { h: 18, color: A(P.accent, 0.35) });

    // broken button: dull grey, off the grid, sticking out of the screen, label overflowing
    const bad = 1 - fix;
    if (bad > 0) {
      const b = BTN_BAD;
      const q = E.inOutCubic(fix);
      const x = lerp(b.x, BTN_OK.x, q);
      const y = lerp(b.y, BTN_OK.y, q);
      const w = lerp(b.w, BTN_OK.w, q);
      const h = lerp(b.h, BTN_OK.h, q);
      ctx.save();
      ctx.globalAlpha *= clamp(bad * 1.6);
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(b.rot * (1 - q));
      ctx.translate(-(x + w / 2), -(y + h / 2));
      U.card(ctx, x, y, w, h, { r: 8, fill: P.border, stroke: P.borderHi, shadow: 0 });
      U.text(ctx, 'Оплатить', x + 14, y + h / 2 + 9, { size: 26, weight: 600, color: P.text3 });
      ctx.restore();
    }
    // fixed button: accent, full width, aligned with the content column
    if (fix > 0) {
      const b = BTN_OK;
      const q = E.inOutCubic(fix);
      ctx.save();
      ctx.globalAlpha *= clamp((fix - 0.3) / 0.7);
      const w = lerp(BTN_BAD.w, b.w, q);
      const x = lerp(BTN_BAD.x, b.x, q);
      const y = lerp(BTN_BAD.y, b.y, q);
      const h = lerp(BTN_BAD.h, b.h, q);
      U.button(ctx, x, y, w, h, 'Оплатить', { size: 26, r: 14, hover, press });
      ctx.restore();
    }
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
      const G3 = U.G3;
      const G4 = U.G4;

      U.bg(ctx, {});

      // frame 0: exactly the G3 pose s03 ends on
      if (t <= 0) {
        U.routeCard(ctx, 0, G3.x, G3.y, G3.w, G3.h, { label: 'name', glow: 1 });
        return;
      }

      const out = 1 - U.k(t, S.out, 0.3, 'inOutCubic'); // everything but the window fades
      const shrink = U.k(t, S.shrink, 0.48, 'inOutCubic'); // window → G4

      // 1 · brief (grows out of the route card) ------------------------------
      if (out > 0) {
        ctx.save();
        ctx.globalAlpha *= out;
        const m = U.k(t, S.morph, S.morphDur, 'inOutCubic');
        const ba = U.k(t, S.brief, 0.4, 'outCubic');
        if (ba < 1) {
          const x = lerp(G3.x, BRIEF.x, m);
          const y = lerp(G3.y, BRIEF.y, m);
          const w = lerp(G3.w, BRIEF.w, m);
          const h = lerp(G3.h, BRIEF.h, m);
          U.card(ctx, x, y, w, h, { r: lerp(24, 20, m), glow: 1 - m, fill: L.mix(P.card, P.cardHi, m) });
          const ga = 1 - U.k(t, 0.04, 0.3, 'outCubic');
          if (ga > 0) {
            const gs = Math.min(76, G3.w * 0.16);
            U.glyph(ctx, 'agent', G3.x + 44 + gs * 0.62, G3.y + 44 + gs * 0.62, gs, { alpha: ga });
            U.text(ctx, '01', x + w - 40, y + 70, { mono: true, size: 22, color: P.text3, align: 'right', alpha: ga });
          }
        }
        if (ba > 0) {
          const rows = S.type.map(([a, d]) => U.k(t, a, d, 'linear'));
          let focus = -1;
          S.type.forEach(([a, d], i) => { if (t >= a - 0.05 && t < a + d + 0.12) focus = i; });
          const hand = U.k(t, S.route - 0.1, 0.3, 'outCubic') * (1 - U.k(t, S.route + S.routeDur + 0.2, 0.5));
          U.briefCard(ctx, BRIEF.x, BRIEF.y, BRIEF.w, BRIEF.h, {
            rows, focus, T: info.T, labels: U.k(t, S.labels, 0.4, 'outCubic'), alpha: ba, glow: 0.6 * hand,
          });
        }
        ctx.restore();
      }

      // 2 · the separate window «Твой проект» + preview ------------------------
      const wa = U.appear(t, S.win, 0.4);
      const fix = U.k(t, S.fix, 0.5, 'linear');
      const checked = U.appear(t, S.checked, 0.35);
      if (wa > 0 && shrink < 1) {
        const hover = U.k(t, S.cursorAt - 0.2, 0.25, 'outCubic');
        const press = U.k(t, S.click, 0.3, 'linear');
        ctx.save();
        // map the window rect onto the shrinking rect
        const rx = lerp(WIN.x, G4.x, shrink);
        const ry = lerp(WIN.y, G4.y, shrink);
        const rw = lerp(WIN.w, G4.w, shrink);
        const rh = lerp(WIN.h, G4.h, shrink);
        ctx.translate(rx, ry);
        ctx.scale(rw / WIN.w, rh / WIN.h);
        ctx.translate(-WIN.x, -WIN.y + (1 - wa) * 28);
        ctx.globalAlpha *= wa * (1 - U.k(t, S.shrink, 0.34, 'inOutCubic'));
        U.window(ctx, WIN.x, WIN.y, WIN.w, WIN.h, { title: 'Твой проект', glow: checked * out });
        ctx.globalAlpha *= 1 - U.k(t, S.shrink, 0.2, 'linear');
        U.text(ctx, 'телефон · 375 px', PHONE.x + PHONE.w + 58, PHONE.y + 36, { mono: true, size: 20, color: P.text3 });
        preview(ctx, fix, hover, press);
        ctx.restore();
      }

      // 3 · route line: brief → window, with the brief token on its head -------
      if (out > 0) {
        const rp = U.k(t, S.route, S.routeDur, 'inOutCubic');
        if (rp > 0) {
          const settle = U.k(t, S.route + S.routeDur, 0.5, 'inOutCubic');
          const head = U.route(ctx, ROUTE, { to: rp, alpha: out * (1 - 0.45 * settle), head: settle < 1, width: 4 });
          const ta = U.k(t, S.route, 0.15, 'outCubic') * (1 - U.k(t, S.route + S.routeDur - 0.12, 0.22, 'inOutCubic'));
          if (head && ta > 0) {
            U.pill(ctx, head.x, head.y - 50, 'бриф', { icon: 'file', size: 22, align: 'center', alpha: ta * out, textColor: P.accentHi });
          }
        }
      }

      // 4 · kicker + title (the card's name rises into it) ----------------------
      if (out > 0) {
        ctx.save();
        ctx.globalAlpha *= out;
        const R = U.ROUTES[0];
        U.kicker(ctx, 'Маршрут 1 · Агент', U.TITLE.x, U.TITLE.kickerY, { alpha: U.appear(t, S.kicker, 0.4) });
        const W = words(ctx);
        const lastEnd = S.fly + S.flyStagger * (W.length - 1) + S.flyDur;
        if (t >= lastEnd) {
          U.title(ctx, R.name, U.TITLE.x, U.TITLE.y, { size: U.TITLE.size, accent: 'агента' });
        } else {
          W.forEach((wd, i) => {
            const e = U.k(t, S.fly + i * S.flyStagger, S.flyDur, 'inOutCubic');
            const size = lerp(40, U.TITLE.size, e);
            const x = lerp(wd.sx, wd.ex, e);
            const y = lerp(wd.sy, wd.ey, e) - Math.sin(e * Math.PI) * 16;
            const col = wd.w === 'агента' ? L.mix(P.text, P.accent, e) : P.text;
            U.text(ctx, wd.w, x, y, { size, weight: 600, tracking: lerp(-0.01 * 40, -0.02 * U.TITLE.size, e), color: col });
          });
        }
        ctx.restore();
      }

      // 5 · «Проверено» — only after the click -----------------------------------
      if (checked > 0 && out > 0) {
        ctx.save();
        ctx.globalAlpha *= out * checked;
        ctx.translate(0, (1 - checked) * 20);
        U.pill(ctx, CHECK_PILL.x, CHECK_PILL.y, 'Проверено', { color: P.green, icon: 'check', size: 32, align: 'center' });
        ctx.restore();
      }

      // 6 · caption pill -------------------------------------------------------
      const ca = U.appear(t, S.caption, 0.3);
      if (ca > 0 && out > 0) {
        ctx.save();
        ctx.globalAlpha *= out * ca;
        ctx.translate(0, (1 - ca) * 20);
        U.pill(ctx, 960, 786, U.ROUTES[0].resultLong, { size: 28, align: 'center' });
        ctx.restore();
      }

      // 7 · cursor ---------------------------------------------------------------
      if (t >= S.cursorIn) {
        const keys = [[S.cursorIn, 1990, 930], [S.cursorAt, CLICK[0], CLICK[1]], [S.click + 0.45, CLICK[0], CLICK[1]], [S.out + 0.4, CLICK[0] + 70, CLICK[1] + 70]];
        const [cx, cy] = U.cursorPath(keys, t);
        const press = U.k(t, S.click, 0.3, 'linear');
        const ca2 = 1 - U.k(t, S.out - 0.05, 0.25, 'linear');
        if (ca2 > 0) U.cursor(ctx, cx, cy, { press: press < 1 ? press : 0, alpha: ca2 });
      }

      // 8 · the G4 contour the window frame becomes -------------------------------
      if (shrink > 0) {
        const rx = lerp(WIN.x, G4.x, shrink);
        const ry = lerp(WIN.y, G4.y, shrink);
        const rw = lerp(WIN.w, G4.w, shrink);
        const rh = lerp(WIN.h, G4.h, shrink);
        g4Contour(ctx, rx, ry, rw, rh, lerp(14, G4.r, shrink), clamp(shrink * 2.2));
      }
    },
  });
})();
