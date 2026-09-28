// Probe: latency of DynamicsCompressorNode and WaveShaper oversampling in headless Chromium.
'use strict';
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const r = await p.evaluate(async () => {
    const out = {};
    async function run(build) {
      const sr = 48000, n = sr;
      const ctx = new OfflineAudioContext(1, n, sr);
      const buf = ctx.createBuffer(1, 1, sr);
      buf.getChannelData(0)[0] = 0.5;
      const s = ctx.createBufferSource();
      s.buffer = buf;
      const node = build(ctx);
      s.connect(node);
      node.connect(ctx.destination);
      s.start(0.1);
      const res = await ctx.startRendering();
      const d = res.getChannelData(0);
      let mi = 0;
      for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > Math.abs(d[mi])) mi = i;
      let first = -1;
      for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > 1e-6) { first = i; break; }
      return { peakIdx: mi, first, expected: 4800, peak: d[mi] };
    }
    out.gain = await run((c) => c.createGain());
    out.comp = await run((c) => { const k = c.createDynamicsCompressor(); k.threshold.value = -40; return k; });
    out.shaper4x = await run((c) => { const w = c.createWaveShaper(); w.curve = new Float32Array([-1, 0, 1]); w.oversample = '4x'; return w; });
    out.biquad = await run((c) => { const f = c.createBiquadFilter(); f.frequency.value = 20000; return f; });
    out.ua = navigator.userAgent;
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await b.close();
})();
