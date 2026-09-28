// diffwin.cjs <seek.wav> <full.wav> <offset> <t0> <t1> <step> : residual (dB rel. full) per window, lag 0
'use strict';
const fs = require('fs');
function rd(file) {
  const b = fs.readFileSync(file);
  let p = 12, data = null;
  while (p < b.length) { const id = b.toString('ascii', p, p + 4); const size = b.readUInt32LE(p + 4); if (id === 'data') data = b.subarray(p + 8, p + 8 + size); p += 8 + size + (size % 2); }
  return new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length - (data.length % 8)));
}
const [a, b, off, t0, t1, st] = process.argv.slice(2);
const A = rd(a), B = rd(b), S = Number(off), sr = 48000;
for (let t = Number(t0); t < Number(t1); t += Number(st)) {
  const m = Math.floor(Number(st) * sr), ia = Math.floor((t - S) * sr), ib = Math.floor(t * sr);
  let d = 0, e = 0, ea = 0;
  for (let i = 0; i < m; i++) for (let c = 0; c < 2; c++) { const x = A[2 * (ia + i) + c], y = B[2 * (ib + i) + c]; d += (x - y) ** 2; e += y * y; ea += x * x; }
  console.log(t.toFixed(3), 'full', (10 * Math.log10(e / m / 2 + 1e-20)).toFixed(1), 'seek', (10 * Math.log10(ea / m / 2 + 1e-20)).toFixed(1), 'residual', (10 * Math.log10(d / (e + 1e-20) + 1e-20)).toFixed(1));
}
