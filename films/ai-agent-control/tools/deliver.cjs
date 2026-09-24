#!/usr/bin/env node
// deliver.cjs : every file the edit and the publication need, in one pass.
//
//   node tools/deliver.cjs                 gate, then all deliverables below
//   node tools/deliver.cjs --skip-gate     same without the gate
//   node tools/deliver.cjs --only srt,stems   a subset: gate, master, clean, phone, stems, srt, html
//
// exports/<slug>.mp4            master 1080x1920, burned-in captions, music + SFX
// exports/<slug>-clean.mp4      master without captions (re-caption after the voice-over)
// exports/<slug>-phone.mp4      720x1280 transcode of the master, for review on a phone
// exports/<slug>-music.wav      music stem (sfx/amb buses muted), 48 kHz 24-bit
// exports/<slug>-sfx.wav        SFX stem (sfx + amb buses only), 48 kHz 24-bit
// exports/<slug>-captions.srt   the caption track as SRT (timings from FILM.TIMELINE.captions)
// dist/<slug>.html              the self-contained interactive player
//
// Stems pass the same master chain as the mix, so music + sfx is close to (not bit-identical with) the mix.
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const C = require('./common.cjs');

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const args = C.parseArgs(process.argv.slice(2), ['skip-gate']);
const only = typeof args.only === 'string' ? args.only.split(',') : null;
const want = (k) => !only || only.includes(k);
const out = (suffix) => path.join(C.ROOT, 'exports', `${C.SLUG}${suffix}`);
fs.mkdirSync(path.join(C.ROOT, 'exports'), { recursive: true });

function run(cmd, argv) {
  console.log(`\n$ ${cmd} ${argv.join(' ')}`);
  const r = spawnSync(cmd, argv, { cwd: C.ROOT, stdio: 'inherit' });
  if (r.status !== 0) C.die(`${cmd} ${argv[0] || ''} failed (exit ${r.status})`);
}
const node = (script, argv = []) => run(process.execPath, [path.join(__dirname, script), ...argv]);

function srtTime(s) {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), sec = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  const p = (v, n) => String(v).padStart(n, '0');
  return `${p(h, 2)}:${p(m, 2)}:${p(sec, 2)},${p(r, 3)}`;
}

if (!args['skip-gate'] && want('gate')) node('check.cjs');
if (want('master')) node('render.cjs', ['--workers', '4', '--out', out('.mp4')]);
if (want('clean')) node('render.cjs', ['--workers', '4', '--clean', '--out', out('-clean.mp4')]);
if (want('phone')) {
  run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', out('.mp4'), '-vf', 'scale=720:1280:flags=lanczos', '-c:v', 'libx264', '-crf', '23', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out('-phone.mp4')]);
}
if (want('stems')) {
  const tmp = path.join(C.TMP, 'stems');
  fs.mkdirSync(tmp, { recursive: true });
  const stems = [['-music.wav', ['--mute', 'sfx,amb']], ['-sfx.wav', ['--solo', 'sfx,amb']]];
  for (const [suffix, flags] of stems) {
    const f32 = path.join(tmp, `stem${suffix}`);
    node(path.join('audio', 'render-audio.cjs'), [...flags, '--out', f32]);
    run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', f32, '-c:a', 'pcm_s24le', out(suffix)]);
  }
}
if (want('srt')) {
  const tl = C.loadTimeline(path.join(C.SRC, 'timeline.js'));
  const caps = (tl.captions || (tl.raw && tl.raw.captions) || []);
  const body = caps.map((c, i) => `${i + 1}\n${srtTime(c[0])} --> ${srtTime(c[1])}\n${c[2]}\n`).join('\n');
  fs.writeFileSync(out('-captions.srt'), body);
  console.log(`\nwrote ${out('-captions.srt')} (${caps.length} captions)`);
}
if (want('html')) node('build.cjs');
console.log('\ndeliver: done');
