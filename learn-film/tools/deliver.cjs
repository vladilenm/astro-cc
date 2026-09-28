#!/usr/bin/env node
// deliver.cjs : builds the delivery set from the ТЗ «Форматы и комплект сдачи».
//
//   node tools/deliver.cjs                 everything below except ProRes
//   node tools/deliver.cjs --only learn-45-page,learn-45-page-subtitled
//   node tools/deliver.cjs --prores        also ProRes 422 HQ masters of the two page cuts (large, not for git)
//   node tools/deliver.cjs --skip-video    subtitles, stems, cover, player only
//
// Writes into exports/:
//   learn-{60,45}-{page,external}[-subtitled].mp4   H.264 High, 25 fps CFR, BT.709, AAC 48 kHz, +faststart,
//                                                   loudness normalised to -16 LUFS integrated, true peak <= -1 dBTP
//   learn-{60,45}-{page,external}.{srt,vtt}         subtitles (the narration)
//   audio/learn-{60,45}-{mix,music,sfx}.wav         48 kHz 24-bit stems (voice: to be recorded, see README)
//   learn-cover.jpg, learn-cover.webp               1920x1080 poster
//   learn-{60,45}-page-master.mov                   (--prores) ProRes 422 HQ + PCM
// and dist/learn.html (the interactive player, 60 cut).
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const C = require('./common.cjs');
const { build, SUBS60, SUBS45 } = require('./cuts.cjs');

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const EXP = path.join(C.ROOT, 'exports');
const node = (args) => execFileSync(process.execPath, args, { cwd: C.ROOT, stdio: 'inherit' });
const ff = (args) => {
  const r = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(' ')}\n${r.stderr}`);
  return r;
};

function measureLoudness(file) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = r.stderr.match(/\{[\s\S]*?\}/g);
  return JSON.parse(m[m.length - 1]);
}
const loudnormFilter = (m) =>
  `loudnorm=I=-16:TP=-1:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=summary`;

const ts = (s, vtt) => {
  const ms = Math.round(s * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)}${vtt ? '.' : ','}${p(r, 3)}`;
};
function writeSubs(cut, ending) {
  const list = (cut === 45 ? SUBS45 : SUBS60).map(([t0, t1, text]) => [t0, t1, typeof text === 'string' ? text : text[ending]]);
  const base = path.join(EXP, `learn-${cut}-${ending}`);
  fs.writeFileSync(base + '.srt', list.map(([a, b, x], i) => `${i + 1}\n${ts(a)} --> ${ts(b)}\n${x}\n`).join('\n'));
  fs.writeFileSync(base + '.vtt', 'WEBVTT\n\n' + list.map(([a, b, x], i) => `${i + 1}\n${ts(a, true)} --> ${ts(b, true)}\n${x}\n`).join('\n'));
}

function setCut(cut, ending, subs) {
  node(['tools/cuts.cjs', '--cut', String(cut), '--ending', ending, ...(subs ? ['--subs'] : [])]);
}

function main() {
  const a = C.parseArgs(process.argv.slice(2), ['prores', 'skip-video']);
  fs.mkdirSync(path.join(EXP, 'audio'), { recursive: true });
  const only = typeof a.only === 'string' ? a.only.split(',') : null;
  const variants = [];
  for (const cut of [60, 45]) for (const ending of ['page', 'external']) for (const subs of [false, true]) variants.push({ cut, ending, subs, name: build({ cut, ending, subs }).variant });

  // subtitles
  for (const cut of [60, 45]) for (const ending of ['page', 'external']) writeSubs(cut, ending);
  console.log('subtitles: exports/learn-{60,45}-{page,external}.{srt,vtt}');

  // stems + loudness reference per cut (page timeline; the audio is identical across endings)
  const gain = {};
  for (const cut of [60, 45]) {
    setCut(cut, 'page', false);
    const raw = (n) => path.join(C.TMP, `stem-${cut}-${n}.wav`);
    node(['tools/audio/render-audio.cjs', '--out', raw('mix')]);
    node(['tools/audio/render-audio.cjs', '--out', raw('music'), '--mute', 'sfx']);
    node(['tools/audio/render-audio.cjs', '--out', raw('sfx'), '--solo', 'sfx']);
    const m = measureLoudness(raw('mix'));
    gain[cut] = m;
    // the mix normalised; music and sfx get the same linear gain so the stems sum back to the mix
    const g = -16 - Number(m.input_i);
    ff(['-i', raw('mix'), '-af', loudnormFilter(m), '-ar', '48000', '-c:a', 'pcm_s24le', path.join(EXP, 'audio', `learn-${cut}-mix.wav`)]);
    for (const n of ['music', 'sfx']) ff(['-i', raw(n), '-af', `volume=${g.toFixed(2)}dB,alimiter=limit=0.89:level=false`, '-ar', '48000', '-c:a', 'pcm_s24le', path.join(EXP, 'audio', `learn-${cut}-${n}.wav`)]);
    console.log(`stems ${cut}: measured ${m.input_i} LUFS / ${m.input_tp} dBTP -> -16 LUFS`);
  }

  // cover
  node(['tools/snap.cjs', '--fixtures=tools/fixtures/cover', '--times', '0.5', '--out', '.tmp/cover']);
  const png = path.join(C.ROOT, '.tmp/cover/fixtures-T000.500.png');
  ff(['-i', png, '-q:v', '2', path.join(EXP, 'learn-cover.jpg')]);
  ff(['-i', png, '-c:v', 'libwebp', '-quality', '92', path.join(EXP, 'learn-cover.webp')]);
  console.log('cover: exports/learn-cover.{jpg,webp}');

  if (!a['skip-video']) {
    for (const v of variants) {
      if (only && !only.includes(v.name)) continue;
      setCut(v.cut, v.ending, v.subs);
      const master = path.join(C.TMP, `${v.name}-master.mp4`);
      node(['tools/render.cjs', '--workers', '3', '--crf', '12', '--preset', 'fast', '--out', master]);
      const m = measureLoudness(master);
      const out = path.join(EXP, `${v.name}.mp4`);
      ff([
        '-i', master, '-map', '0:v:0', '-map', '0:a:0',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-maxrate', '10M', '-bufsize', '20M', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-r', '25', '-g', '50', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-af', loudnormFilter(m), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
        '-t', String(v.cut), '-movflags', '+faststart', out,
      ]);
      const mb = (fs.statSync(out).size / 1048576).toFixed(1);
      console.log(`${v.name}.mp4  ${mb} MB`);
      if (a.prores && v.ending === 'page' && !v.subs) {
        const mov = path.join(EXP, `learn-${v.cut}-page-master.mov`);
        ff(['-i', master, '-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0', '-af', loudnormFilter(m), '-c:a', 'pcm_s24le', '-ar', '48000', '-t', String(v.cut), mov]);
        console.log(`${path.basename(mov)}  ${(fs.statSync(mov).size / 1048576).toFixed(0)} MB`);
      }
      fs.rmSync(master, { force: true });
    }
  }

  // the interactive player (60 cut, page ending, subtitles on)
  setCut(60, 'page', true);
  node(['tools/build.cjs']);
  console.log('done. src/timeline.js left on learn-60-page-subtitled.');
}

main();
