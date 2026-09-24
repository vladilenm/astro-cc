// cost.cjs : synchronous FILM.audio.render() time, node count, and offline render speed per 4 s slice.
'use strict';
const path = require('path');
const fs = require('fs');
const C = require('../common.cjs');
(async () => {
  const src = path.join(C.ROOT, 'src');
  const music = fs.readFileSync(path.join(src, 'music.js'), 'utf8');
  const hits = C.scanForbidden(music);
  const banned = [/Math\.random/, /\bDate\b/, /performance\.now/, /crypto/].filter((r) => r.test(music.replace(/\/\/.*$/gm, '')));
  console.log(`forbidden media patterns in music.js: ${hits.length}${hits.length ? ' ' + JSON.stringify(hits) : ''}; banned randomness/time calls: ${banned.length}`);
  const browser = await C.launch();
  const pg = await C.openPage(browser, ['core.js', 'lib.js', 'timeline.js', 'music.js'].map((f) => path.join(src, f)), { scale: 0.1, prefix: 'audio-cost' });
  const r = await pg.page.evaluate(async () => {
    const out = {};
    const proto = BaseAudioContext.prototype;
    let count = 0;
    for (const k of Object.getOwnPropertyNames(proto)) if (/^create/.test(k)) { const f = proto[k]; proto[k] = function () { count++; return f.apply(this, arguments); }; }
    const t0 = performance.now();
    const ctx = new OfflineAudioContext(2, 48000 * 32, 48000);
    FILM.audio.render(ctx, { start: 0 });
    out.scheduleMs = performance.now() - t0;
    out.nodes = count;
    const t1 = performance.now();
    await ctx.startRendering();
    out.renderFullS = (performance.now() - t1) / 1000;
    out.slices = [];
    for (let s = 0; s < 32; s += 4) {
      const c = new OfflineAudioContext(2, 48000 * 4, 48000);
      FILM.audio.render(c, { start: s });
      const t = performance.now();
      await c.startRendering();
      out.slices.push(`${s}-${s + 4}s: ${((performance.now() - t) / 1000).toFixed(2)}s`);
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await pg.close();
  await browser.close();
})();
