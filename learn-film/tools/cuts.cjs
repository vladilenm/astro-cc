#!/usr/bin/env node
// cuts.cjs : writes src/timeline.js for one delivery variant. Every tool reads src/timeline.js,
// so switch the variant first, then check / snap / render.
//
//   node tools/cuts.cjs --cut 60 [--ending page|external] [--subs]
//   node tools/cuts.cjs --cut 45 --ending external --subs
//   node tools/cuts.cjs --list                          prints the eight delivery variants
//
// The two cuts share every scene file. A shot entry carries cut: 60 | 45 and each scene picks its
// own schedule from it (FILM.ui.cut(info)); the ending variant is FILM.TIMELINE.ending.
'use strict';

const fs = require('fs');
const path = require('path');
const C = require('./common.cjs');

const FILES = {
  s01: '01-question.js', s02: '02-guide.js', s03: '03-routes.js', s04: '04-agent.js', s05: '05-engineering.js', s06: '06-project.js',
  s07: '07-inside.js', s08: '08-practice.js', s09: '09-progress.js', s10: '10-results.js', s11: '11-free.js', s12: '12-cta.js',
};
const TITLES = {
  s01: 'Знакомая ситуация', s02: 'Появляется точка входа', s03: 'Выбор из трёх задач', s04: 'Собрать первого агента', s05: 'Разобраться в AI-инженерии',
  s06: 'Довести свой проект до результата', s07: 'Что внутри шага', s08: 'Сделать на своей задаче', s09: 'Своё продвижение', s10: 'Что останется',
  s11: 'Снять барьер', s12: 'Выбрать маршрут',
};

// [id, start, end, transitionIn]
const CUT60 = [
  ['s01', 0, 4], ['s02', 4, 9], ['s03', 9, 12], ['s04', 12, 18], ['s05', 18, 24], ['s06', 24, 30, { kind: 'fade', dur: 0.32 }],
  ['s07', 30, 35, { kind: 'fade', dur: 0.32 }], ['s08', 35, 40], ['s09', 40, 45], ['s10', 45, 50, { kind: 'fade', dur: 0.32 }], ['s11', 50, 54], ['s12', 54, 60],
];
const CUT45 = [
  ['s01', 0, 3], ['s02', 3, 5], ['s03', 5, 7], ['s04', 7, 13], ['s05', 13, 19], ['s06', 19, 25, { kind: 'fade', dur: 0.32 }],
  ['s07', 25, 30, { kind: 'fade', dur: 0.32 }], ['s08', 30, 32], ['s09', 32, 34], ['s10', 34, 38, { kind: 'fade', dur: 0.32 }], ['s11', 38, 41], ['s12', 41, 45],
];

// Subtitles = the narration, verbatim from the ТЗ. [t0, t1, text]
const SUBS60 = [
  [0.3, 3.8, 'Смотришь про AI. А на практике с чего начать?'],
  [4.2, 8.8, 'В этом бесплатном гиде всё собрано вокруг твоей задачи.'],
  [9.1, 11.9, 'Выбери один из трёх маршрутов.'],
  [12.2, 17.8, 'Настрой агента под свой проект: задай правила, дай задачу и проверь результат.'],
  [18.2, 23.8, 'Разберись в AI-инженерии: как связаны модель, инструменты, знания и проверка.'],
  [24.2, 29.8, 'Сдвинь свой проект с места: выбери результат и составь план на неделю.'],
  [30.2, 34.8, 'В каждом шаге: видео, материалы и задание для практики.'],
  [35.1, 39.9, 'Возьми шаблон, примени к своей задаче и проверь, что получилось.'],
  [40.2, 44.8, 'Отметь выполненный шаг. Продолжишь здесь же, в своём темпе.'],
  [45.2, 49.8, 'На руках — бриф агента, схема или план твоего проекта.'],
  [50.2, 53.8, 'Материалы гида доступны бесплатно и без регистрации.'],
  [54.3, 58.6, { page: 'Выбери маршрут ниже и сделай первый шаг сегодня.', external: 'Открой бесплатный гид по ссылке. Выбери маршрут и начни сегодня.' }],
];
const SUBS45 = [
  [0.2, 2.9, 'Много видео про AI. С чего начать?'],
  [3.1, 6.9, 'Выбери задачу. В гиде три бесплатных маршрута.'],
  [7.1, 12.9, 'Настрой агента: задай правила, дай ему задачу и проверь результат.'],
  [13.1, 18.9, 'Разберись в AI-инженерии: модель, инструменты, знания и проверка.'],
  [19.1, 24.9, 'Сдвинь свой проект с места: составь план на неделю.'],
  [25.1, 29.9, 'Внутри — видео, материалы, шаблоны и задания для практики.'],
  [30.1, 33.9, 'Примени к своей задаче. Проверь и отметь шаг.'],
  [34.1, 37.9, 'Результат — бриф, схема агента или план проекта.'],
  [38.1, 40.9, 'Бесплатно. Без регистрации.'],
  [41.2, 44.2, { page: 'Выбери маршрут ниже. Начни сегодня.', external: 'Открой гид по ссылке. Начни сегодня.' }],
];

// Sound cues (global seconds). kind names are the score's vocabulary (src/music.js).
const CUES60 = [
  [0, 'open'], [0.3, 'tab'], [0.7, 'tab'], [1.1, 'tab'], [2.4, 'question'],
  [4.0, 'assemble'], [5.0, 'logo'], [6.4, 'card'], [7.1, 'card'], [7.8, 'card'],
  [9.0, 'tick'], [9.2, 'tick'], [9.4, 'tick'], [11.2, 'zoom'],
  [12.0, 'section'], [13.2, 'type'], [13.8, 'type'], [14.4, 'type'], [15.0, 'handoff'], [16.9, 'click'], [17.3, 'verified'],
  [18.0, 'section'], [19.2, 'connect'], [20.1, 'connect'], [21.0, 'pulse'], [22.2, 'connect'], [23.2, 'sheet'],
  [24.0, 'section'], [25.2, 'goal'], [27.0, 'step'], [27.5, 'step'], [28.0, 'step'], [28.5, 'highlight'],
  [30.0, 'focus'], [31.5, 'focus'], [33.0, 'focus'],
  [35.0, 'click'], [36.0, 'appear'], [38.8, 'select'],
  [40.0, 'click'], [41.0, 'done'], [43.3, 'card'],
  [45.0, 'result'], [46.0, 'result'], [47.0, 'result'], [48.0, 'highlight'],
  [50.0, 'word'], [50.6, 'word'], [52.0, 'duck'],
  [54.0, 'settle'], [55.0, 'arrow'], [56.0, 'final'],
];
const CUES45 = [
  [0, 'open'], [0.3, 'tab'], [0.8, 'tab'], [1.0, 'question'],
  [3.0, 'assemble'], [3.6, 'logo'], [5.0, 'tick'], [5.2, 'tick'], [5.4, 'tick'],
  [7.0, 'section'], [8.0, 'type'], [8.5, 'type'], [9.0, 'type'], [9.8, 'handoff'], [11.9, 'click'], [12.3, 'verified'],
  [13.0, 'section'], [14.2, 'connect'], [15.1, 'connect'], [16.0, 'pulse'], [17.2, 'connect'], [18.2, 'sheet'],
  [19.0, 'section'], [20.2, 'goal'], [22.0, 'step'], [22.5, 'step'], [23.0, 'step'], [23.5, 'highlight'],
  [25.0, 'focus'], [26.5, 'focus'], [28.0, 'focus'],
  [30.0, 'click'], [30.5, 'appear'], [31.4, 'select'], [32.4, 'click'], [33.0, 'done'],
  [34.0, 'result'], [34.5, 'result'], [35.0, 'result'], [35.8, 'highlight'],
  [38.0, 'word'], [38.25, 'word'], [40.0, 'duck'],
  [41.0, 'settle'], [41.3, 'arrow'], [41.5, 'final'],
];

function build({ cut, ending, subs }) {
  const shots = (cut === 45 ? CUT45 : CUT60).map(([id, start, end, tr]) => {
    const s = { id, file: FILES[id], start, end, mode: 'none', cut, title: TITLES[id], brief: `see docs/storyboard.md ${id}` };
    if (tr) s.transitionIn = tr;
    return s;
  });
  const subList = (cut === 45 ? SUBS45 : SUBS60).map(([t0, t1, text]) => ({ t0, t1, text: typeof text === 'string' ? text : text[ending] }));
  const cues = (cut === 45 ? CUES45 : CUES60).map(([t, kind]) => ({ t, kind }));
  return {
    title: 'learn',
    variant: `learn-${cut}-${ending}${subs ? '-subtitled' : ''}`,
    cut,
    ending,
    subtitles: !!subs,
    bpm: 120,
    fps: 25,
    width: 1920,
    height: 1080,
    duration: cut,
    shots,
    subs: subList,
    cues,
  };
}

function main() {
  const a = C.parseArgs(process.argv.slice(2), ['subs', 'list']);
  if (a.list) {
    for (const cut of [60, 45]) for (const ending of ['page', 'external']) for (const subs of [false, true]) console.log(build({ cut, ending, subs }).variant);
    return;
  }
  const cut = Number(a.cut || 60) === 45 ? 45 : 60;
  const ending = a.ending === 'external' ? 'external' : 'page';
  const tl = build({ cut, ending, subs: !!a.subs });
  const out =
    `// GENERATED by tools/cuts.cjs (${tl.variant}). Edit tools/cuts.cjs, not this file.\n` +
    `FILM.TIMELINE = ${JSON.stringify(tl, null, 2)};\n`;
  const dest = typeof a.out === 'string' ? C.resolveOut(a.out) : path.join(C.SRC, 'timeline.js');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  console.log(`${C.rel(dest)} -> ${tl.variant} (${tl.shots.length} shots, ${tl.duration}s, ${tl.subs.length} subtitle cues, ${tl.cues.length} sound cues)`);
}

if (require.main === module) main();
module.exports = { build, SUBS60, SUBS45 };
