#!/usr/bin/env node
// stubgen.cjs : generate one placeholder scene file per timeline shot, so the whole film
// can be checked and rendered before any real scene exists (the stub pass).
//
//   node tools/stubgen.cjs      writes src/scenes/NN-<id>.js for every shot in src/timeline.js
//
// Overwrites existing scene files — run it before scene work starts, never after.
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./common.cjs');
const TL = C.loadTimeline(path.join(C.SRC, 'timeline.js'));
const dir = path.join(C.SRC, 'scenes');
fs.mkdirSync(dir, { recursive: true });

const illustrated = (nn, id) => `// STUB
// Placeholder for shot ${nn} '${id}' (illustrated). The scene agent replaces this whole file.
FILM.scene({
  id: '${id}',
  draw(ctx, t, info) {
    const L = info.lib, P = L.pal;
    const p = L.clamp(t / info.dur);
    const q = L.clamp(L.onTwos(t) / info.dur);
    const seed = L.hash('${id}');
    L.paper(ctx);
    L.inkPath(ctx, L.ellipsePts(540, 860, 300, 400, 72), { closed: true, width: 5, seed: seed + 1, double: true });
    L.inkLine(ctx, 140, 1300, 940, 1300, { width: 3, seed: seed + 2 });
    L.inkCircle(ctx, 240 + 600 * q, 1230, 44, { width: 3, seed: seed + 3, fill: P.orange });
    L.text(ctx, 'STUB ${nn}', 540, 330, { size: 60, weight: 600, align: 'center', color: P.annMagenta });
    L.text(ctx, info.shot.title || '${id}', 540, 1420, { size: 44, align: 'center', color: P.ink });
    L.text(ctx, '${id}', 540, 1480, { size: 30, align: 'center', color: P.inkSoft });
    if (p > 0.01) L.inkLine(ctx, 140, 1530, 140 + 800 * p, 1530, { width: 4, color: P.annBlue, seed: seed + 4, taper: 0 });
  },
});
`;

const schematic = (nn, id) => `// STUB
// Placeholder for shot ${nn} '${id}' (schematic). The scene agent replaces this whole file.
FILM.scene({
  id: '${id}',
  draw(ctx, t, info) {
    const L = info.lib, P = L.pal;
    const p = L.clamp(t / info.dur);
    L.blueprint(ctx);
    L.guideCircle(ctx, 540, 860, 340, { alpha: 0.4 });
    L.glowDot(ctx, 540, 860, 10 + 8 * p, { rays: 12, rot: p * Math.PI });
    L.text(ctx, 'STUB ${nn}', 540, 330, { size: 60, weight: 600, align: 'center', color: P.magenta });
    L.text(ctx, info.shot.title || '${id}', 540, 1420, { size: 44, align: 'center', color: P.lavender });
    L.text(ctx, '${id}', 540, 1480, { size: 30, align: 'center', color: P.lavender, alpha: 0.6 });
    ctx.fillStyle = P.lineWhite;
    ctx.fillRect(140, 1526, 800 * p, 6);
  },
});
`;

for (const s of TL.shots) {
  const nn = path.basename(s.file).slice(0, 2);
  const mode = String(s.mode).toLowerCase();
  const code = /schem|blue/.test(mode) ? schematic(nn, s.id) : illustrated(nn, s.id);
  const out = path.join(dir, path.basename(s.file));
  fs.writeFileSync(out, code);
  console.log(`${path.basename(s.file)}  ${mode}`);
}
