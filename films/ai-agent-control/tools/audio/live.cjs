// live.cjs : run FILM.audio.render on a live AudioContext from a seek point and watch the look-ahead scheduler.
'use strict';
const path = require('path');
const C = require('../common.cjs');
(async () => {
  const src = path.join(C.ROOT, 'src');
  const browser = await C.launch(['--autoplay-policy=no-user-gesture-required']);
  const pg = await C.openPage(browser, ['core.js', 'lib.js', 'timeline.js', 'music.js'].map((f) => path.join(src, f)), { scale: 0.1, prefix: 'audio-live' });
  const r = await pg.page.evaluate(async () => {
    const proto = BaseAudioContext.prototype;
    let count = 0;
    for (const k of Object.getOwnPropertyNames(proto)) if (/^create/.test(k)) { const f = proto[k]; proto[k] = function () { count++; return f.apply(this, arguments); }; }
    const ctx = new AudioContext({ latencyHint: 'playback', sampleRate: 48000 });
    await ctx.resume();
    const errors = [];
    window.addEventListener('error', (e) => errors.push(e.message));
    const log = [];
    const t0 = ctx.currentTime;
    FILM.audio.render(ctx, { start: 12.0, dest: ctx.destination });
    log.push({ song: 12.0, nodes: count, state: ctx.state });
    for (let i = 0; i < 12; i++) {
      await new Promise((res) => setTimeout(res, 500));
      log.push({ song: +(12 + ctx.currentTime - t0).toFixed(2), nodes: count, state: ctx.state });
    }
    await ctx.close();
    const after = count;
    await new Promise((res) => setTimeout(res, 800));
    return { log, errors, nodesAfterClose: count - after };
  });
  console.log(JSON.stringify(r));
  await pg.close();
  await browser.close();
})();
