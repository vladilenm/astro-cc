// notes.cjs <wav> <t0> <t1> [notes...] : FFT note levels vs the loudest bin in the window.
'use strict';
const fs = require('fs');
const file = process.argv[2];
const t0 = Number(process.argv[3]), t1 = Number(process.argv[4]);
const names = process.argv.slice(5);
const b = fs.readFileSync(file);
let p = 12, data = null;
while (p < b.length) {
  const id = b.toString('ascii', p, p + 4);
  const size = b.readUInt32LE(p + 4);
  if (id === 'data') data = b.subarray(p + 8, p + 8 + size);
  p += 8 + size + (size % 2);
}
const f = new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length - (data.length % 8)));
const sr = 48000, n = f.length / 2;
const i0 = Math.max(0, Math.floor(t0 * sr)), i1 = Math.min(n, Math.floor(t1 * sr));
const N = 1 << Math.ceil(Math.log2(Math.max(2048, i1 - i0)));
const re = new Float64Array(N), im = new Float64Array(N);
const win = (i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (i1 - i0));
for (let i = i0; i < i1; i++) {
  const x = ((f[2 * i] + f[2 * i + 1]) / 2) * win(i - i0);
  re[i - i0] = x;
}
function fft(re, im) {
  const N = re.length;
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < N; i += len) {
      let cr = 1, ci = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j], ui = im[i + j];
        const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci;
        const vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr;
        re[i + j] = ur + vr; im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
fft(re, im);
let mx = 0;
for (let k = 1; k < N / 2; k++) mx = Math.max(mx, re[k] * re[k] + im[k] * im[k]);
const db = (e) => 10 * Math.log10(e / mx + 1e-20);
const hzOf = (note) => {
  if (/^\d/.test(note)) return Number(note);
  const m = note.match(/^([A-G])(#?)(-?\d+)$/);
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  return 440 * Math.pow(2, (SEMI[m[1]] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12 - 9) / 12);
};
const pick = names.length ? names : ['C#5', 'D5', 'C#4', 'D4', 'D3', 'A6', '5280'];
for (const nte of pick) {
  const hz = hzOf(nte);
  const k = Math.round((hz * N) / sr);
  let e = 0;
  for (let j = k - 1; j <= k + 1; j++) e += re[j] * re[j] + im[j] * im[j];
  console.log(`${String(nte).padEnd(8)} ${hz.toFixed(1).padStart(8)} Hz  ${db(e).toFixed(1).padStart(6)} dB`);
}
