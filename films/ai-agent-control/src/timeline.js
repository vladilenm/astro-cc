/*
 * timeline.js : «Кто контролирует работу AI-агента?» — the storyboard as data (docs/storyboard.md).
 * 120 bpm → beat 0.5 s = 12 frames; 60 s = 30 bars = 1440 frames at 24 fps, 1080 × 1920.
 * Ten shots = the ten scenes of the brief. Every boundary and cue sits on the 16th-note grid (0.125 s).
 */
(function () {
  'use strict';
  const FILM = (window.FILM = window.FILM || {});

  FILM.TIMELINE = {
    title: 'Кто контролирует работу AI-агента?',
    bpm: 120,
    duration: 60,
    fps: 24,
    width: 1080,
    height: 1920,
    shots: [
      {
        id: 'instant-result', file: '01-instant-result.js', start: 0, end: 5, mode: 'illustrated',
        title: 'Мгновенный результат',
        brief: 'The React app «Обращения клиентов» grows out of the dark; a developer prompt «Добавь поиск по обращениям» is typed over it; an orange line runs to three code cards; a search bar lands in the app and the query «вход» filters the list to ticket №1043. Headline «AI уже пишет код».',
      },
      {
        id: 'price-of-done', file: '02-price-of-done.js', start: 5, end: 10, mode: 'illustrated',
        title: 'Цена слова «готово»',
        brief: 'A green «Готово» badge flashes on the working search; on the beat of «пока» the camera pulls back: the app shrinks into one of three tool cards (files, terminal, app) wired to the agent mark; the green badge flies to the agent and turns into an orange question mark. Headline «А что агенту разрешено?».',
      },
      {
        id: 'one-wrong-step', file: '03-one-wrong-step.js', start: 10, end: 15, mode: 'illustrated',
        title: 'Конкретный риск',
        brief: 'Zoom through the files card into the project tree (src / components / data). The agent pointer hovers the src/ folder, an orange operation «удалить папку · rm -rf src/» appears, then a red frame «Без подтверждения?» snaps on: stop-frame, the cursor freezes before the action. Nothing is deleted. Headline «Один неверный шаг».',
      },
      {
        id: 'who-controls', file: '04-who-controls.js', start: 15, end: 21, mode: 'schematic',
        title: 'Главный вопрос',
        transitionIn: { kind: 'fade', dur: 0.25 },
        brief: 'The tree shrinks into the files node of a schema: developer → agent → files, terminal, app. Uncontrolled arrows spray from the agent; the developer presses stop and the arrows freeze mid-air, dashed. Headline «Кто контролирует работу агента?». A mechanical pulse starts on 18.5.',
      },
      {
        id: 'engineering-frame', file: '05-engineering-frame.js', start: 21, end: 27, mode: 'schematic',
        title: 'Инженерная рамка',
        brief: 'Four layers build around the central model on the beats 21.5, 22.5, 23.5, 24.5: задача и контекст → инструменты → права → проверки. The frozen arrows re-route into clean orthogonal orange routes through gates on each layer. Headline «AI Engineering = система вокруг модели».',
      },
      {
        id: 'control-in-action', file: '06-control-in-action.js', start: 27, end: 33, mode: 'illustrated',
        title: 'Контроль в действии',
        brief: 'A rules screen «Правила агента» (tag «пример настройки»): читать файлы ✓ можно, изменять файлы → подтверждение, удалять ⛔ запрещено, limit footer. The agent token passes row 1, waits at row 2, hits a barrier at row 3; a confirmation request pops up for the developer. Headline «Доступ. Лимиты. Подтверждение.».',
      },
      {
        id: 'verify', file: '07-verify.js', start: 33, end: 39, mode: 'illustrated',
        title: 'Проверяем результат',
        brief: 'An execution history of four big steps lights up on an accelerating rhythm: Прочитал файлы → Предложил изменения → Получил подтверждение → Проверил поиск. The app slides back in from the right, the query «оплат» finds ticket №1042 and a green test badge lights on 37.5. Headline «Видно, что сделал агент. Видно, что работает.».',
      },
      {
        id: 'real-project', file: '08-real-project.js', start: 39, end: 45, mode: 'illustrated',
        title: 'Это можно разобрать самому',
        brief: 'The layer schema pulls back and turns out to lie over the real React project; it thins to an overlay and a card «Бесплатный урок» frames the readable app (no portrait, no fake video chrome). Headline «Бесплатный урок. Реальный проект.».',
      },
      {
        id: 'whats-inside', file: '09-whats-inside.js', start: 45, end: 52, mode: 'schematic',
        title: 'Содержание и аудитория',
        brief: 'Two sequential cards: «Готовый агент» → «Свой агент на TypeScript». In the second, three labelled blocks модель / инструменты / цикл appear, a source folder slides in from the frame edge, and the blocks assemble into one working loop in the shape of layer 2 from shot 05. Headline «Для JavaScript / TypeScript-разработчиков», small «Запись + исходный код».',
      },
      {
        id: 'cta', file: '10-cta.js', start: 52, end: 60, mode: 'illustrated',
        title: 'Переход на форму',
        transitionIn: { kind: 'fade', dur: 0.5 },
        post: { grain: 0.6 },
        brief: 'Clean dark frame, the app faintly behind. «От AI-кодинга к AI Engineering», «Бесплатный урок + исходный код», «Забрать бесплатный урок» and an orange arrow into the empty sticker zone. Everything settles by 54.0 and holds still to 60.',
      },
    ],

    // Burned-in captions: the meaning of the voice-over in short lines ([T in, T out, text]).
    // core.js draws them over every shot; tools/render.cjs --clean leaves them out.
    captions: [
      [0.25, 1.875, 'ИИ уже пишет код.'],
      [1.875, 4.875, 'Попросил поиск в приложении — готово.'],
      [5.0, 6.25, 'Магия.'],
      [6.25, 8.0, 'Пока не даёшь агенту доступ'],
      [8.0, 9.875, 'к файлам и командам.'],
      [10.125, 11.5, 'Один неверный шаг —'],
      [11.5, 13.25, 'и под угрозой папка проекта.'],
      [13.25, 14.875, 'Без подтверждения.'],
      [15.125, 16.375, 'Теперь вопрос:'],
      [16.375, 18.25, 'кто решает, что этому агенту'],
      [18.25, 20.875, 'можно делать?'],
      [21.125, 23.0, 'Здесь начинается AI-инженерия:'],
      [23.0, 24.625, 'модель, инструменты'],
      [24.625, 26.875, 'и правила работы между ними.'],
      [27.125, 28.375, 'Читать — можно.'],
      [28.375, 30.25, 'Изменять — с подтверждением.'],
      [30.25, 32.875, 'Опасное действие останавливаем.'],
      [33.125, 35.0, 'После изменений — проверка.'],
      [35.0, 38.875, 'По шагам видно, что сделал агент.'],
      [39.125, 41.625, 'В бесплатном уроке я показываю это'],
      [41.625, 44.875, 'на настоящем React-проекте.'],
      [45.125, 46.625, 'Сначала готовый агент,'],
      [46.625, 48.625, 'потом свой на TypeScript.'],
      [48.625, 51.875, 'Для тех, кто уже пишет код.'],
    ],

    // The score spec (docs/storyboard.md, Sound). music.js implements each cue at exactly this time.
    cues: [
      // 01 instant-result
      { t: 0.0, kind: 'swell', note: 'App grows out of the dark: short airy noise swell 0→0.5 s, highpassed, no low end' },
      { t: 0.5, kind: 'sfx', note: 'Dry keyboard typing 0.5→1.75 s: ~26 short seeded key clicks (prompt «Добавь поиск по обращениям»)' },
      { t: 2.0, kind: 'hit', note: 'Send: crisp click; the music lift starts — kick on beats, bright pluck motif E5 G#5 B5 on 8ths, sub bass' },
      { t: 2.25, kind: 'sfx', note: 'Code card 1 pop: soft blip' },
      { t: 2.5, kind: 'sfx', note: 'Code card 2 pop: soft blip, a step higher' },
      { t: 2.75, kind: 'sfx', note: 'Code card 3 pop: soft blip, higher again' },
      { t: 3.0, kind: 'sfx', note: 'Search bar slides into the app: short whoosh' },
      { t: 3.25, kind: 'sfx', note: 'Typing «вход»: four key clicks on 16ths 3.25–3.625' },
      { t: 4.0, kind: 'hit', note: 'Filter finds №1043: bright two-note chime' },
      // 02 price-of-done
      { t: 5.0, kind: 'hit', note: '«Готово» badge: warm major stab, top of the short lift' },
      { t: 6.5, kind: 'cut', note: 'On «пока» the lift cuts dead (all music buses off); a second, lower layer enters: sub drone A1 + slow low pulse' },
      { t: 6.5, kind: 'sfx', note: 'Camera pull-back 6.5→8.5: long air whoosh, falling filter' },
      { t: 7.0, kind: 'sfx', note: 'Files card wires to the agent: low click' },
      { t: 7.5, kind: 'sfx', note: 'Terminal card wires: low click' },
      { t: 8.0, kind: 'sfx', note: 'App card wires: low click' },
      { t: 8.5, kind: 'hit', note: 'Green badge turns into «?»: muted low question tone (minor second)' },
      // 03 one-wrong-step
      { t: 10.0, kind: 'sfx', note: 'Zoom-through into the file tree: quick whoosh' },
      { t: 10.75, kind: 'sfx', note: 'Agent pointer glides to src/: soft tick' },
      { t: 11.5, kind: 'sfx', note: 'Orange operation «удалить папку» appears: tense blip' },
      { t: 12.5, kind: 'hit', note: 'Stop-frame: everything cuts to near-silence; short muffled beep (lowpassed square ~880 Hz, 0.15 s) instead of a siren; hold the pause 12.5→13.0' },
      // 04 who-controls
      { t: 15.0, kind: 'sfx', note: 'Camera moves from the tree to the schema: whoosh' },
      { t: 15.5, kind: 'sfx', note: 'Nodes appear: clicks on 15.5, 15.75, 16.0' },
      { t: 16.0, kind: 'sfx', note: 'Uncontrolled arrows 16.0→17.5: glitchy zips on irregular 16ths' },
      { t: 17.5, kind: 'hit', note: 'Developer presses stop: tape-stop drop, then short silence 17.5→18.5 on the question' },
      { t: 18.5, kind: 'swell', note: 'Even mechanical pulse starts: muted tick on 8ths + soft low thump on beats (the system starts assembling)' },
      // 05 engineering-frame
      { t: 21.0, kind: 'cut', note: 'Pulse continues; the agent node becomes «модель»: soft click' },
      { t: 21.5, kind: 'sfx', note: 'Layer 1 «задача и контекст»: quiet click' },
      { t: 22.5, kind: 'sfx', note: 'Layer 2 «инструменты»: quiet click, higher' },
      { t: 23.5, kind: 'sfx', note: 'Layer 3 «права»: quiet click, higher' },
      { t: 24.5, kind: 'sfx', note: 'Layer 4 «проверки»: quiet click, highest' },
      { t: 25.0, kind: 'swell', note: 'Routes lock into orange: smooth sweep 25.0→26.0 and a warm pad enters' },
      // 06 control-in-action
      { t: 27.0, kind: 'cut', note: 'Rules screen: soft whoosh; pulse keeps going' },
      { t: 28.0, kind: 'sfx', note: 'Row 1 «читать» passes: warm click' },
      { t: 29.0, kind: 'sfx', note: 'Row 2 «изменять» asks confirmation: warm click, a third higher' },
      { t: 30.5, kind: 'hit', note: 'Row 3 «удалять» blocks: short dull «stop» thud' },
      { t: 31.0, kind: 'sfx', note: 'Confirmation request pops up: soft two-tone notification' },
      // 07 verify
      { t: 33.0, kind: 'cut', note: 'Rhythm starts to accelerate: hats on 8ths, then 16ths from 35.0' },
      { t: 33.5, kind: 'sfx', note: 'Step 1 lights: tick' },
      { t: 34.5, kind: 'sfx', note: 'Step 2 lights: tick' },
      { t: 35.25, kind: 'sfx', note: 'Step 3 lights: tick' },
      { t: 35.75, kind: 'sfx', note: 'Step 4 lights: tick' },
      { t: 36.0, kind: 'sfx', note: 'App slides in from the right: whoosh' },
      { t: 36.5, kind: 'sfx', note: 'Typing «оплат»: five key clicks on 16ths 36.5–37.0' },
      { t: 37.5, kind: 'hit', note: 'Test passes: resolving major chord' },
      // 08 real-project
      { t: 39.0, kind: 'cut', note: 'Music opens up: full chords, wider stereo; the low tension layer leaves by 40.0' },
      { t: 39.5, kind: 'sfx', note: 'Pull-back from the schema 39.5→41.0: airy whoosh' },
      { t: 41.0, kind: 'hit', note: 'Lesson card lands: soft impact with a shimmer' },
      // 09 whats-inside
      { t: 45.0, kind: 'cut', note: 'Card «Готовый агент»: click' },
      { t: 46.5, kind: 'sfx', note: 'Card switch to «Свой агент на TypeScript»: swoosh' },
      { t: 47.0, kind: 'sfx', note: 'Block «модель»: technical click' },
      { t: 47.5, kind: 'sfx', note: 'Block «инструменты»: technical click' },
      { t: 48.0, kind: 'sfx', note: 'Block «цикл»: technical click' },
      { t: 48.5, kind: 'sfx', note: 'Source folder slides in: soft slide' },
      { t: 49.0, kind: 'sfx', note: 'Assembly into one loop: snaps on 49.0, 49.5, 50.0, then a circulating shimmer to 51.5' },
      { t: 51.5, kind: 'swell', note: 'Smooth rise into the final card' },
      // 10 cta
      { t: 52.0, kind: 'cut', note: 'Final phrase of the music under the CTA' },
      { t: 53.5, kind: 'sfx', note: 'Arrow draws to the sticker zone: soft rising blip' },
      { t: 55.0, kind: 'hit', note: 'The music resolves: final cadence on the tonic; afterwards a calm sustained chord fading to silence by 59.8' },
    ],
  };
})();
