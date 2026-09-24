// envdump.cjs <wav> <t0> <t1> [hp=500] : HF log-energy every 0.5 ms (2.7 ms window, newest-sample time)
'use strict';
const fs = require('fs');
const [file, a, b, hpArg] = process.argv.slice(2);
const buf = fs.readFileSync(file);
let p = 12, data = null;
while (p < buf.length) { const id = buf.toString('ascii', p, p + 4); const size = buf.readUInt32LE(p + 4); if (id === 'data') data = buf.subarray(p + 8, p + 8 + size); p += 8 + size + (size % 2); }
const f = new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length - (data.length % 8)));
const sr = 48000, t0 = Number(a), t1 = Number(b), hp = Number(hpArg || 500);
const i0 = Math.floor((t0 - 0.05) * sr), i1 = Math.floor(t1 * sr);
const x = [];
for (let i = i0; i < i1; i++) x.push((f[2 * i] + f[2 * i + 1]) / 2);
const w = (2 * Math.PI * hp) / sr, al = Math.sin(w) / 1.414, cw = Math.cos(w);
const b0 = (1 + cw) / 2, b1 = -(1 + cw), b2 = b0, a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
const y = x.map((v) => { const o = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = v; y2 = y1; y1 = o; return o; });
const N = 128;
for (let k = 0; k + N < y.length; k += 24) {
  const t = (i0 + k + N) / sr;
  if (t < t0) continue;
  let s = 0; for (let i = k; i < k + N; i++) s += y[i] * y[i];
  const L = 10 * Math.log10(s / N + 1e-12);
  console.log(t.toFixed(4), L.toFixed(1), '#'.repeat(Math.max(0, Math.round((L + 70) / 1.5))));
}
