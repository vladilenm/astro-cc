/*
 * 09-progress.js : s09 «Увидеть своё продвижение» · 60: T 40–45 · 45: T 32–34 (s10 fades in after it)
 *
 * Same lesson page as s07/s08 through the shared LESSON FILM helper (verbatim copy of the one in
 * 07-inside.js; u = seconds since s07 started, this shot starts at u 10 in the 60 cut, u 7 in the 45).
 *
 * 60: the cursor presses «Я сделал» (40.5); only then «Выполнено» and 0 / 3 → 1 / 3; «В своём темпе»;
 * the camera flies out and up the same page to the guide top: brand + resumeCard «Продолжим с того
 * места, где остановились» with the pointer resting on «Продолжить». Holds for the fade into s10.
 * 45: press 32.4, «Выполнено» + 1 / 3, hold (no resume card).
 *
 * Layers: see 07-inside.js.
 */
(function () {
  'use strict';
  const ID = 's09';
  const U0 = { 60: 10, 45: 7 }; // u at this shot's t = 0

  // ==== LESSON FILM : shared by 07-inside.js, 08-practice.js, 09-progress.js — keep identical ====
  const LF = (function () {
    const F_ = window.FILM;
    const L = F_.lib;
    const P = L.pal;
    const E = L.ease;
    const ui = F_.ui;
    const G = ui.LESSON;
    const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, q) => a + (b - a) * q;
    const k = (u, a, d, e) => ui.k(u, a, d, e || 'inOutCubic');
    const pulse = (u, a, d = 0.3) => (u > a && u < a + d ? (u - a) / d : 0); // a click: press 0→1, then 0
    const TX = 120; // title x, baseline, size
    const TY = 222;
    const TS = 72;

    // camera that puts page point (px, py) at screen point (sx, sy) with zoom z
    const camAt = (px, py, sx, sy, z) => ({ x: px - (sx - 960) / z, y: py - (sy - 540) / z, z });
    const toScreen = (c, px, py) => [960 + (px - c.x) * c.z, 540 + (py - c.y) * c.z];
    const pad = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });

    // the guide top (60 cut only): brand + resume card, in page space above the lesson
    // (resumeCard's title runs into its «Продолжить» button below w ≈ 1300, so the card is 1320 wide)
    const CR = { x: 960, y: -440, z: 1 }; // camera on the guide top: screen y = page y + 980
    const RES = { x: 300, y: 470 - 980, w: 1320, h: 200 }; // resumeCard at screen (300, 470)
    const BRAND = { x: 300, y: 392 - 980 };
    const RES_BTN = [RES.x + RES.w - 175 + 34, RES.y + RES.h / 2 + 18]; // cursor tip on «Продолжить»

    // focuses: camera + spotlight hole (page rects)
    const FOC = {
      V: { cam: camAt(620, 531, 820, 590, 1.2), hole: pad(G.video, 14), dim: 0.5 },
      M: { cam: camAt(1480, 250, 960, 290, 1.25), hole: pad(G.materials, 14), dim: 0.5 },
      T: { cam: camAt(120, 852, 110, 300, 1.25), hole: { x: 128, y: 862, w: 1052, h: 468 }, dim: 0.52 },
      C: { cam: camAt(1180, 960, 960, 350, 1.2), hole: { x: 1182, y: 958, w: 596, h: 462 }, dim: 0.64 },
      R: { cam: CR, hole: { x: -400, y: -1500, w: 2720, h: 3400 }, dim: 0 },
    };
    const KEYS = {
      60: [[0, 'V'], [1.5, 'V'], [2.0, 'M'], [3.0, 'M'], [3.5, 'T'], [8.55, 'T'], [9.05, 'C'], [12.0, 'C'], [13.3, 'R']],
      45: [[0, 'V'], [1.5, 'V'], [2.0, 'M'], [3.0, 'M'], [3.5, 'T'], [5.9, 'T'], [6.3, 'C']],
    };
    // [swap time, title, accent]: the old title fades out over 0.2 s, the new one appears over 0.4 s
    const TITLES = {
      60: [[-0.08, 'Посмотри разбор', 'разбор'], [1.5, 'Возьми материалы', 'материалы'], [3.0, 'Попробуй сам', 'сам'],
        [5.0, 'Примени к своей задаче', 'своей задаче'], [8.8, 'Проверь результат', 'результат'], [11.0, 'В своём темпе', 'своём темпе']],
      45: [[-0.08, 'Смотри → пробуй → проверяй', null], [5.0, 'Сделай на своей задаче', 'своей задаче']],
    };
    // screen-space «Твой проект» thumbnail (a separate window, outside the guide)
    const TH = { x: 1400, y: 92, w: 400, h: 240 };

    // page points the cursor visits
    const tpl = G.template;
    const cr = G.criteria;
    const dn = G.done;
    const C_ENTRY = [1624, 1420]; // off-frame bottom right under the task framing
    const C_WAIT = [548, 1030]; // beside «Вставить шаблон»
    const C_TPL = [398, 1018]; // on «Вставить шаблон»
    const C_REST = [1080, 1006]; // right of the practice header
    const BOX = [cr.x + 44, cr.y + 108]; // criterion 1 check square centre
    const C_BOX = [BOX[0] + 4, BOX[1] + 4];
    const C_OFF = [1676, 1104]; // off the ticked box, past the end of its label
    const C_DONE = [dn.x + 252, dn.y + 44]; // on «Я сделал»
    const C_AWAY = [1700, 1250]; // empty corner of the criteria box

    const S = {
      60: {
        cursor: [[3.7, ...C_ENTRY], [4.75, ...C_WAIT], [5.0, ...C_WAIT], [5.28, ...C_TPL], [5.7, ...C_TPL], [6.2, ...C_REST],
          [8.5, ...C_REST], [9.2, ...C_BOX], [9.55, ...C_BOX], [9.95, ...C_OFF], [10.02, ...C_OFF], [10.45, ...C_DONE], [10.95, ...C_DONE], [11.45, ...C_AWAY]],
        hoverTpl: [5.0, 5.7], pressTpl: 5.3, tpl: [5.7, 1.2], vals: [[7.0, 0.5], [7.5, 0.5], [8.0, 0.5]], thumb: 7.5,
        pressBox: 9.25, tick: 9.4, hoverDone: [10.25, 10.8], pressDone: 10.5, done: 10.82, prog: [10.9, 0.6],
        fly: 12.0, thumbOut: 11.8, res: 13.2, cursorFly: [12.7, 14.0], resHover: 13.9,
      },
      45: {
        cursor: [[3.6, ...C_ENTRY], [4.45, ...C_WAIT], [4.6, ...C_WAIT], [4.95, ...C_TPL], [5.4, ...C_TPL], [6.3, ...C_BOX],
          [6.55, ...C_BOX], [6.9, ...C_OFF], [7.0, ...C_OFF], [7.35, ...C_DONE], [7.8, ...C_DONE], [8.2, ...C_AWAY]],
        hoverTpl: [4.8, 5.4], pressTpl: 5.1, tpl: [5.3, 0.3], vals: [[5.45, 0.2], [5.6, 0.2], [5.75, 0.2]], thumb: 5.6,
        pressBox: 6.35, tick: 6.45, hoverDone: [7.2, 7.7], pressDone: 7.4, done: 7.72, prog: [7.75, 0.45],
        fly: null, thumbOut: null, res: null, cursorFly: null, resHover: null,
      },
    };

    // eased track through keyframes [[u, value]] with a per-segment mixer
    function track(keys, u, mix) {
      if (u <= keys[0][0]) return mix(keys[0][1], keys[0][1], 0, 0);
      for (let i = 1; i < keys.length; i++) {
        if (u <= keys[i][0]) {
          const a = keys[i - 1];
          const b = keys[i];
          return mix(a[1], b[1], E.inOutCubic((u - a[0]) / Math.max(1e-6, b[0] - a[0])), i);
        }
      }
      const z = keys[keys.length - 1][1];
      return mix(z, z, 0, keys.length);
    }

    function camera(u, cut) {
      return track(KEYS[cut], u, (a, b, q) => {
        const A = FOC[a].cam;
        const B = FOC[b].cam;
        let z = lerp(A.z, B.z, q);
        if (b === 'R' && a !== 'R') z *= 1 - 0.46 * Math.sin(Math.PI * q); // out, up, back in
        return {
          x: lerp(A.x, B.x, q), y: lerp(A.y, B.y, q), z,
          hole: { x: lerp(FOC[a].hole.x, FOC[b].hole.x, q), y: lerp(FOC[a].hole.y, FOC[b].hole.y, q), w: lerp(FOC[a].hole.w, FOC[b].hole.w, q), h: lerp(FOC[a].hole.h, FOC[b].hole.h, q) },
          dim: b === 'R' ? FOC[a].dim * (1 - clamp(q * 2.5)) : lerp(FOC[a].dim, FOC[b].dim, q),
        };
      });
    }

    function state(u, cut, T) {
      const s = S[cut];
      const vals = s.vals.map(([a, d]) => k(u, a, d, 'linear'));
      return {
        video: Math.min(0.96, 0.14 + 0.045 * u),
        videoFocus: 1 - k(u, 1.5, 0.35),
        matFocus: k(u, 1.75, 0.4) - k(u, 3.0, 0.35),
        taskFocus: k(u, 3.25, 0.45) - k(u, 8.55, 0.4) * (cut === 60 ? 1 : 0) - (cut === 45 ? k(u, 5.9, 0.4) : 0),
        templatePress: pulse(u, s.pressTpl),
        tpl: k(u, s.tpl[0], s.tpl[1], 'linear'),
        vals,
        critFocus: k(u, s.tick, 0.4),
        critHi: u >= s.tick ? 0 : -1,
        donePress: pulse(u, s.pressDone),
        done: u >= s.done ? 1 : 0,
        progress: k(u, s.prog[0], s.prog[1]),
        T: vals.some((v) => v > 0 && v < 1) ? T : null,
        hover: { template: k(u, s.hoverTpl[0], 0.25) * (1 - k(u, s.hoverTpl[1], 0.25)), done: k(u, s.hoverDone[0], 0.25) * (1 - k(u, s.hoverDone[1], 0.2)) },
      };
    }

    // cursor: screen position, press
    function cursor(u, cut, cam) {
      const s = S[cut];
      const keys = s.cursor;
      let p;
      if (s.fly != null && u > s.fly) {
        // the page flies away under a still pointer, which then glides to «Продолжить»
        const last = keys[keys.length - 1];
        const from = toScreen(FOC.C.cam, last[1], last[2]);
        const to = toScreen(CR, RES_BTN[0], RES_BTN[1]);
        const q = k(u, s.cursorFly[0], s.cursorFly[1] - s.cursorFly[0]);
        p = [lerp(from[0], to[0], q), lerp(from[1], to[1], q) - Math.sin(Math.PI * q) * 40];
      } else {
        const pp = ui.cursorPath(keys, u);
        p = toScreen(cam, pp[0], pp[1]);
      }
      const press = Math.max(pulse(u, s.pressTpl), pulse(u, s.pressBox), pulse(u, s.pressDone));
      return { x: p[0], y: p[1], press, a: u >= keys[0][0] ? 1 : 0 };
    }

    function layer(key) {
      const Sc = F_.S || 1;
      return L.cached(`lessonfilm-${key}-${Sc}`, () => F_.makeCanvas(Math.round(1920 * Sc), Math.round(1080 * Sc)));
    }

    function drawTitles(ctx, u, cut) {
      const list = TITLES[cut];
      for (let i = 0; i < list.length; i++) {
        const [sw, str, acc] = list[i];
        const next = list[i + 1] ? list[i + 1][0] : Infinity;
        if (u <= sw + 0.2 || u >= next + 0.2) continue;
        ctx.save();
        ctx.globalAlpha *= 1 - k(u, next, 0.2, 'linear');
        ui.title(ctx, str, TX, TY, { size: TS, a: ui.appear(u, sw + 0.2, 0.4), accent: acc || undefined });
        ctx.restore();
      }
    }

    function draw(ctx, u, cut, info) {
      const s = S[cut];
      const cam = camera(u, cut);
      const st = state(u, cut, info.T);
      const Sc = F_.S || 1;

      // 1 background: grid rides with the page
      ui.bg(ctx, { ox: -cam.x * cam.z, oy: -cam.y * cam.z, glow: { x: 960, y: 560, r: 900, a: 0.08 } });

      // 2 page layer
      const lay = layer('page');
      const g = lay.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      g.clearRect(0, 0, lay.width, lay.height);
      g.setTransform(Sc, 0, 0, Sc, 0, 0);
      L.camera(g, { x: cam.x, y: cam.y, zoom: cam.z }, () => {
        ui.lessonPage(g, st);
        // the manual tick in criterion 1 (the kit has no ticked-criterion state)
        const tk = u > s.tick ? k(u, s.tick, 0.3, 'outBack') : 0;
        if (tk > 0.001) {
          g.save();
          g.translate(BOX[0], BOX[1]);
          g.scale(0.6 + 0.4 * tk, 0.6 + 0.4 * tk);
          ui.rrect(g, -14, -14, 28, 28, 8);
          g.fillStyle = L.rgba(P.green, 0.22 * clamp(tk));
          g.fill();
          ui.icon(g, 'check', 0, 0, 22, { color: P.green, lw: 3.2 });
          g.restore();
        }
        // «Выполнено» lands with a soft green ring (after the manual press only)
        if (u > s.done && u < s.done + 0.6) ui.ripple(g, dn.x + dn.w / 2, dn.y + dn.h / 2, (u - s.done) / 0.6, { color: P.green, r: 150 });
        if (cut === 60 && cam.y < 700) {
          ui.brand(g, BRAND.x, BRAND.y, { size: 56 });
          if (s.res != null) ui.resumeCard(g, RES.x, RES.y, RES.w, RES.h, { a: ui.appear(u, s.res, 0.5), hover: k(u, s.resHover, 0.3) });
        }
      });
      // spotlight: dim everything but the focused zone
      if (cam.dim > 0.001) {
        const [hx, hy] = toScreen(cam, cam.hole.x, cam.hole.y);
        g.save();
        ui.rrect(g, hx, hy, cam.hole.w * cam.z, cam.hole.h * cam.z, 28 * cam.z); // (rrect begins the path)
        g.rect(0, 0, 1920, 1080);
        g.fillStyle = L.rgba(P.bg, cam.dim);
        g.fill('evenodd');
        g.restore();
      }
      // soft edges: sides fade out, the subtitle band keeps only a dim trace of the page
      g.save();
      g.globalCompositeOperation = 'destination-in';
      const gh = g.createLinearGradient(0, 0, 1920, 0);
      gh.addColorStop(0, L.rgba(P.bg, 0));
      gh.addColorStop(0.03, L.rgba(P.bg, 0.15));
      gh.addColorStop(0.09, L.rgba(P.bg, 1));
      gh.addColorStop(0.91, L.rgba(P.bg, 1));
      gh.addColorStop(0.97, L.rgba(P.bg, 0.15));
      gh.addColorStop(1, L.rgba(P.bg, 0));
      g.fillStyle = gh;
      g.fillRect(0, 0, 1920, 1080);
      const gv = g.createLinearGradient(0, 0, 0, 1080);
      gv.addColorStop(0, L.rgba(P.bg, 1));
      gv.addColorStop(860 / 1080, L.rgba(P.bg, 1));
      gv.addColorStop(940 / 1080, L.rgba(P.bg, 0.2));
      gv.addColorStop(1, L.rgba(P.bg, 0.1));
      g.fillStyle = gv;
      g.fillRect(0, 0, 1920, 1080);
      g.restore();
      ctx.drawImage(lay, 0, 0, 1920, 1080);

      // top scrim (the title band reads over the page)
      const sg = ctx.createLinearGradient(0, 0, 0, 330);
      sg.addColorStop(0, L.rgba(P.bg, 1));
      sg.addColorStop(0.6, L.rgba(P.bg, 0.97));
      sg.addColorStop(0.82, L.rgba(P.bg, 0.6));
      sg.addColorStop(1, L.rgba(P.bg, 0));
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, 1920, 330);

      // 3 the user's own project: a separate window with the fixed button
      const tha = ui.appear(u, s.thumb, 0.4) * (s.thumbOut != null ? 1 - k(u, s.thumbOut, 0.35) : 1);
      if (tha > 0) {
        // handoff line from the notes to the window
        const la = k(u, s.thumb + 0.1, 0.5) * (1 - k(u, cut === 60 ? 8.55 : 5.9, 0.3));
        if (la > 0) {
          const [nx, ny] = toScreen(cam, G.notes.x + G.notes.w - 30, G.notes.y);
          ui.route(ctx, [[nx, ny - 4], [nx + 22, ny - 110], [nx + 60, ny - 200], [TH.x + 110, TH.y + TH.h + 6]], { to: la, width: 3, alpha: 0.85 * la, glow: 0.7 });
        }
        const dy = (1 - tha) * 20;
        ctx.save();
        ctx.globalAlpha *= tha;
        const b = ui.window(ctx, TH.x, TH.y + dy, TH.w, TH.h, { title: 'Твой проект' });
        ui.skeleton(ctx, b.x + 30, b.y + 30, 210, 2, { h: 12, gap: 24 });
        ui.button(ctx, b.x + 30, b.y + 96, 190, 56, 'Оплатить', { size: 24 });
        ui.skeleton(ctx, b.x + 250, b.y + 104, 120, 2, { h: 12, gap: 24 });
        ctx.restore();
      }

      // 4 cursor
      const c = cursor(u, cut, cam);
      if (c.a > 0) ui.cursor(ctx, c.x, c.y, { press: c.press, s: 1.15 });

      // 5 title
      drawTitles(ctx, u, cut);
    }

    return { draw };
  })();
  // ==== end LESSON FILM ====

  FILM.scene({
    id: ID,
    draw(ctx, tIn, info) {
      const cut = FILM.ui.cut(info);
      const t = Math.min(Math.max(tIn, 0), info.dur);
      LF.draw(ctx, U0[cut] + t, cut, info);
    },
  });
})();
