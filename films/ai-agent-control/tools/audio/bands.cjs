// bands.cjs <wav> : octave-band power (dB) per section, from a 16384-point FFT averaged over hops.
'use strict';
const fs = require('fs');
const file = process.argv[2];
const b = fs.readFileSync(file);
let p = 12, data = null;
while (p < b.length) { const id = b.toString('ascii', p, p + 4); const size = b.readUInt32LE(p + 4); if (id === 'data') data = b.subarray(p + 8, p + 8 + size); p += 8 + size + (size % 2); }
const f = new Float32Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length - (data.length % 8)));
const sr = 48000, n = f.length / 2;
const mono = new Float64Array(n);
for (let i = 0; i < n; i++) mono[i] = (f[2 * i] + f[2 * i + 1]) / 2;
function fft(re, im) {
  const N = re.length;
  for (let i = 1, j = 0; i < N; i++) { let bit = N >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= N; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < N; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const ur = re[i + j], ui = im[i + j]; const vr = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci; const vi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr; re[i + j] = ur + vr; im[i + j] = ui + vi; re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
const centers = [40, 80, 160, 315, 630, 1250, 2500, 5000, 10000];
const sections = [['act1 0-8', 0, 8], ['act2a 8-11.5', 8, 11.5], ['pupa 11.5-15', 11.5, 15], ['drop 16-22', 16, 22], ['compass 22-23.5', 22, 23.5], ['act4 24-28', 24, 28], ['winter 28-29.5', 28, 29.5], ['end 30-32', 30, 32], ['all', 0, 32]];
const N = 8192;
const win = new Float64Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
console.log('section'.padEnd(18) + centers.map((c) => String(c).padStart(7)).join(''));
for (const [name, a, z] of sections) {
  const pow = new Float64Array(N / 2);
  let frames = 0;
  for (let s = Math.floor(a * sr); s + N <= Math.floor(z * sr); s += N / 2) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = mono[s + i] * win[i];
    fft(re, im);
    for (let k = 0; k < N / 2; k++) pow[k] += re[k] * re[k] + im[k] * im[k];
    frames++;
  }
  const row = centers.map((c) => {
    const lo = c / Math.SQRT2, hi = c * Math.SQRT2;
    let e = 0;
    for (let k = Math.ceil((lo * N) / sr); k <= Math.floor((hi * N) / sr); k++) e += pow[k];
    return (10 * Math.log10(e / frames / (N * N) + 1e-20)).toFixed(1).padStart(7);
  });
  console.log(name.padEnd(18) + row.join(''));
}
