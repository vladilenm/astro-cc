// Fixture scene: every FILM.lib helper on one 1080x1920 plate. Used to judge the library's look.
FILM.scene({
  id: 'lib-showcase',
  draw(ctx, t, info) {
    const L = info.lib;
    const P = L.pal;

    // ---------------------------------------------------------------- paper plate (top)
    L.paper(ctx, { seed: 3 });
    L.text(ctx, 'plate I · ink, hatching, stipple', 70, 96, { size: 34, color: P.inkSoft, tracking: 1 });
    L.text(ctx, 'the specimen', 1010, 96, { size: 30, color: P.inkFaint, align: 'right', italic: true });

    // stripe window
    const PX = 70, PY = 130, PW = 940, PH = 560;
    L.stripes(ctx, { bounds: [PX, PY, PW, PH], offset: L.onTwos(t) * 20, seed: 4 });
    const win = L.rectPts(PX, PY, PW, PH, 30);
    ctx.save();
    ctx.beginPath();
    ctx.rect(PX, PY, PW, PH);
    ctx.clip();

    // sun
    L.glowDot(ctx, 880, 250, 46, { color: P.sun, core: P.glow, additive: false, rays: 16, rayLen: 2.3, rayWidth: 0.12, twinkle: 0.04, glow: 3 });
    L.guideCircle(ctx, 880, 250, 92, { color: P.inkFaint, alpha: 0.5, dash: [3, 7] });

    // broad leaf
    const leaf = L.smoothPts([[150, 640], [300, 470], [560, 350], [840, 330], [960, 360], [820, 470], [560, 600], [300, 700]], true, 7);
    L.inkPath(ctx, leaf, { closed: true, fill: P.sage, width: 3.4, seed: 11, double: true });
    const rib = [[190, 650], [420, 520], [700, 410], [950, 362]];
    L.hatch(ctx, leaf, {
      angle: -1.05, spacing: 6, width: 1.1, seed: 12, alpha: 0.85, bend: 1.4,
      density: (x, y) => L.smoothstep(-10, 90, y - (650 - (x - 190) * 0.38)),
    });
    L.crossHatch(ctx, leaf, {
      angle: -0.35, spacing: 6.5, width: 1, seed: 13, alpha: 0.7, layers: 1,
      density: (x, y) => L.smoothstep(40, 120, y - (650 - (x - 190) * 0.38)) * 0.9,
    });
    ctx.save();
    ctx.beginPath();
    L.tracePath(ctx, leaf);
    ctx.clip();
    for (let i = 0; i < 7; i++) {
      const u = 0.12 + i * 0.12;
      const bx = L.lerp(190, 950, u), by = L.lerp(650, 362, u) + Math.sin(u * 3) * 10;
      L.inkPath(ctx, [[bx, by], [bx + 40, by - 70 + i * 4], [bx + 70, by - 120 + i * 6]], { width: 1.7, seed: 20 + i });
      L.inkPath(ctx, [[bx, by], [bx + 30, by + 50], [bx + 36, by + 90 - i * 5]], { width: 1.5, seed: 40 + i });
    }
    ctx.restore();
    L.inkPath(ctx, rib, { width: 3, seed: 14 });

    // egg on the leaf, stippled
    const ex = 610, ey = 430;
    const egg = L.ellipsePts(ex, ey, 30, 44, 48);
    L.inkPath(ctx, egg, { closed: true, fill: P.white, width: 2.4, seed: 60 });
    L.stipple(ctx, egg, { spacing: 3.6, r: [0.45, 1.25], seed: 61, density: (x, y) => L.smoothstep(-20, 40, (x - ex) * 0.7 + (y - ey) * 0.6) * 0.9 });
    for (let k = -2; k <= 2; k++) {
      L.inkPath(ctx, [[ex + k * 10, ey - 40 + Math.abs(k) * 4], [ex + k * 13, ey], [ex + k * 10, ey + 40 - Math.abs(k) * 4]], { width: 0.9, alpha: 0.7, seed: 62 + k, taper: 10 });
    }
    L.bracket(ctx, ex + 48, ey - 44, ex + 48, ey + 44, { style: 'square', offset: -14, color: P.ink, alpha: 0.8, label: '1.2mm', labelSize: 18, width: 1.3 });

    // three pebbles with form shading from the upper left
    const pebbles = [[250, 600, 70, 46], [390, 640, 52, 36], [150, 540, 40, 30]];
    pebbles.forEach(([x, y, rx, ry], k) => {
      const pts = L.ellipsePts(x, y, rx, ry, 40, 0.2 * k);
      L.inkPath(ctx, pts, { closed: true, fill: k === 1 ? P.tan : P.ochre, width: 2.8, seed: 70 + k });
      const shade = (px, py) => L.smoothstep(-0.4, 0.9, ((px - x) / rx) * 0.6 + ((py - y) / ry) * 0.8);
      L.crossHatch(ctx, pts, { spacing: 4.6, width: 1, seed: 80 + k, tone: 0.75, density: shade, alpha: 0.85 });
    });

    // flight annotations
    const pA = L.seg(t, 0.1, 1.2, 'outCubic');
    L.arcAnnotation(ctx, 610, 430, 120, -2.8, 0.6, { color: P.annMagenta, width: 3, p: pA });
    L.arcAnnotation(ctx, 420, 330, 260, 2.6, 4.9, { color: P.annBlue, width: 2.5, dash: [12, 9], p: L.seg(t, 0.3, 1.6, 'outCubic'), arrow: 14 });
    L.arcAnnotation(ctx, 760, 520, 180, 0.2, -1.6, { color: P.annYellow, width: 4, p: L.seg(t, 0.5, 1.8, 'outCubic'), label: 'flight' });
    ctx.restore();
    L.inkPath(ctx, win, { closed: true, width: 3.2, seed: 90, double: { offset: 7, alpha: 0.5, width: 0.5, from: 0.02, to: 0.97 } });
    // construction lines running past the frame
    L.inkLine(ctx, 40, 700, 1040, 110, { width: 1, alpha: 0.35, seed: 91, color: P.inkSoft });
    L.inkLine(ctx, 610, 110, 610, 720, { width: 0.9, alpha: 0.3, seed: 92, color: P.inkSoft });

    // tone ramps
    L.text(ctx, 'hatch density', 70, 760, { size: 24, color: P.inkSoft });
    L.text(ctx, 'crossHatch tone', 70, 930, { size: 24, color: P.inkSoft });
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * 158, w = 140;
      const sw = L.rrectPts(x, 780, w, 110, 10, 18);
      L.hatch(ctx, sw, { density: 0.15 + i * 0.17, spacing: 5.5, seed: 100 + i });
      L.inkPath(ctx, sw, { closed: true, width: 2, seed: 110 + i });
      const sw2 = L.rrectPts(x, 950, w, 110, 10, 18);
      L.crossHatch(ctx, sw2, { tone: 0.15 + i * 0.17, spacing: 5.5, seed: 120 + i });
      L.inkPath(ctx, sw2, { closed: true, width: 2, seed: 130 + i });
    }
    L.ticks(ctx, 70, 1100, { kind: 'linear', length: 940, n: 47, len: 8, major: 5, majorLen: 18, color: P.inkSoft, alpha: 0.8, width: 1.2 });

    // ---------------------------------------------------------------- blueprint plate (bottom)
    const BY = 1140;
    L.blueprint(ctx, { x: 0, y: BY, w: 1080, h: 780, seed: 9, center: [370, 385], circles: 4, diagonals: 6 });
    L.inkLine(ctx, 0, BY, 1080, BY, { width: 3.4, seed: 93 });
    L.text(ctx, 'plate II · schematic', 60, BY + 60, { size: 30, color: P.lavender, alpha: 0.85, tracking: 1 });

    const zoom = L.mapRange(t, 0, info.dur, 1, 1.06, 'inOutSine');
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, BY, 640, 780);
    ctx.clip();
    // keep world point (370, BY+400) where it is on screen while zooming about it
    L.camera(ctx, { x: 370 - (370 - 540) / zoom, y: BY + 400 - (BY + 400 - 960) / zoom, zoom }, () => {
      const cx = 370, cy = BY + 400;
      L.guideCircle(ctx, cx, cy, 330, { alpha: 0.28, dash: [2, 6], cross: 16, quadrants: 12 });
      L.guideCircle(ctx, cx, cy, 250, { alpha: 0.4, p: L.seg(t, 0, 1.4, 'inOutCubic'), width: 1.4 });
      const capsule = L.capsulePts(cx, cy, 540, 150, Math.PI / 2, 96);
      L.hexLattice(ctx, capsule, {
        r: 17, alpha: 0.5, seed: 5,
        cellFn: (x, y) => (y < cy + 120 ? true : L.h3(Math.round(x), Math.round(y), 7) < L.mapRange(y, cy + 120, cy + 250, 1, 0) ? { fill: P.lavender, alpha: 0.08 } : false),
      });
      L.stipple(ctx, capsule, { spacing: 5, r: [0.6, 1.5], color: P.lavender, alpha: 0.75, seed: 6, density: (x, y) => L.smoothstep(cy + 110, cy + 260, y) });
      L.inkPath(ctx, capsule, { closed: true, color: P.lavender, width: 3, seed: 7, wobble: 1, double: { offset: 10, alpha: 0.45, width: 0.55, from: 0, to: 1 } });
      // paddle filaments
      for (const s of [-1, 1]) {
        L.inkPath(ctx, [[cx + s * 30, cy - 262], [cx + s * 44, cy - 320], [cx + s * 70, cy - 360]], { color: P.lavender, width: 2.2, seed: 8 + s });
        L.inkCircle(ctx, cx + s * 78, cy - 372, 13, { color: P.lavender, width: 1.8, seed: 10 + s });
      }
      const split = L.seg(t, 0.3, 1.5, 'outBack') * 70;
      for (const s of [-1, 1]) {
        const ny = cy - 40 + s * split;
        L.glowDot(ctx, cx, ny, 13, { rot: t * 0.8 + s, seed: 20 + s });
        L.ticks(ctx, cx, ny, { r: 34, n: 12, len: 9, color: P.lineWhite, alpha: 0.55, rot: t * 0.4 });
      }
      const burst = L.seg(t, 1.2, 2.2, 'outExpo');
      L.ticks(ctx, cx, cy + 275, { r: 20 + burst * 30, n: 22, len: 20 + burst * 70, start: 0.1, span: Math.PI - 0.2, color: P.magenta, alpha: 0.95 * (1 - burst * 0.5), width: 2.4 });
      L.bracket(ctx, cx - 170, cy - 270, cx - 170, cy + 270, { offset: 34, label: '1.2 mm', color: P.lavender, p: L.seg(t, 0.2, 1.0, 'outCubic') });
    });
    ctx.restore();

    // ease plot
    const gx = 660, gy = BY + 110, gw = 360, gh = 280;
    ctx.save();
    ctx.strokeStyle = L.rgba(P.lavender, 0.35);
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.restore();
    L.ticks(ctx, gx, gy + gh, { kind: 'linear', length: gw, n: 10, len: 6, major: 5, majorLen: 12, side: -1, alpha: 0.6, baseline: false });
    const names = ['inOutCubic', 'outBack', 'outExpo', 'inOutSine', 'outBounce', 'snap'];
    const cols = [P.lavender, P.magenta, P.paleBlue, P.lineWhite, P.sun, P.teal];
    names.forEach((n, k) => {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        pts.push([gx + u * gw, gy + gh - L.ease[n](u) * gh * 0.8 - gh * 0.1]);
      }
      L.inkPath(ctx, pts, { color: cols[k], width: 2, seed: 200 + k, wobble: 0.6, tremble: 0.15, smooth: false });
      L.text(ctx, n, gx + 8 + (k % 2) * 180, gy + gh + 34 + Math.floor(k / 2) * 26, { size: 19, color: cols[k], alpha: 0.9 });
    });
    const pu = (t / info.dur) % 1;
    L.glowDot(ctx, gx + pu * gw, gy + gh - L.ease.outBack(pu) * gh * 0.8 - gh * 0.1, 6, { color: P.magenta, rays: 4, rayLen: 3 });

    // noise and rng
    const ny0 = BY + 610;
    L.text(ctx, 'noise1 · rng', 660, ny0 - 30, { size: 20, color: P.lavender, alpha: 0.8 });
    const npts = [];
    for (let i = 0; i <= 90; i++) npts.push([660 + i * 4, ny0 + 40 + L.noise1(i * 0.08 + t * 2, 3) * 34]);
    L.inkPath(ctx, npts, { color: P.paleBlue, width: 1.8, seed: 300, smooth: false, wobble: 0.3 });
    const r = L.rng(42);
    ctx.save();
    ctx.fillStyle = P.lineWhite;
    for (let i = 0; i < 120; i++) {
      const x = 660 + r() * 360, y = ny0 + 100 + r.gauss() * 18;
      ctx.globalAlpha = 0.35 + r() * 0.5;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
    L.text(ctx, 'film', 1010, BY + 60, { size: 44, color: P.lineWhite, alpha: 0.9, align: 'right', weight: 300, tracking: 2 });
  },
});
