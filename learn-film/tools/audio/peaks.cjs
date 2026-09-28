// peaks.cjs <wav> <gain> : list 50 ms windows whose sample peak (times gain) exceeds a threshold, and a histogram
'use strict';
const fs = require('fs');
const [file, g, thr] = process.argv.slice(2);
const b = fs.readFileSync(file);
let p = 12, data = null;
while (p < b.length) { const id = b.toString('ascii', p, p + 4); const size = b.readUInt32LE(p + 4); if (id === 'data') data = b.subarray(p + 8, p + 8 + size); p += 8 + size + (size % 2); }
const f = new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length - (data.length % 8)));
const G = Number(g || 1), T = Number(thr || 0.55), sr = 48000, W = Math.floor(0.05 * sr);
let over = 0, total = f.length, maxv = 0;
const hits = [];
for (let w = 0; w * W * 2 < f.length; w++) {
  let m = 0;
  for (let i = w * W * 2; i < Math.min(f.length, (w + 1) * W * 2); i++) m = Math.max(m, Math.abs(f[i] * G));
  maxv = Math.max(maxv, m);
  if (m > T) hits.push(`${(w * 0.05).toFixed(2)}:${m.toFixed(2)}`);
}
for (let i = 0; i < f.length; i++) if (Math.abs(f[i] * G) > T) over++;
console.log(`max pre-limiter peak ${maxv.toFixed(3)} (${(20 * Math.log10(maxv)).toFixed(2)} dBFS); samples above ${T}: ${over} (${((100 * over) / total).toFixed(3)} %)`);
console.log(hits.join('  '));
