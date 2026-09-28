// UI kit sheet: every FILM.ui element on one frame (the cast sheet of this film).
FILM.TIMELINE = {
  title: 'kit', bpm: 120, fps: 25, width: 1920, height: 1080, duration: 6, subtitles: true,
  subs: [{ t0: 0, t1: 2, text: 'Смотришь про эй-ай. А на практике с чего начать?' }],
  shots: [{ id: 'kit', file: '01-kit.js', start: 0, end: 2, mode: 'none', brief: 'UI kit sheet' },
    { id: 'kit2', file: '02-kit2.js', start: 2, end: 4, mode: 'none', brief: 'composites' },
    { id: 'kit3', file: '03-kit3.js', start: 4, end: 6, mode: 'none', brief: 'lesson page' }],
  cues: [{ t: 0, kind: 'open' }],
};
