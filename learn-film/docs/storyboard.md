# Storyboard — «Выбери свою задачу, пройди понятные шаги и примени AI в своём проекте»

Source: ТЗ «Анимационный ролик для Learn» (28.09.2026). Concept: «От открытых вкладок к первому результату».
Scattered videos and notes assemble into three clear routes; the viewer sees what each gives, walks one learning step
with the cursor, and ends at «Начать маршрут».

## Numbers

- 25 fps · 1920 × 1080 · 120 bpm grid (beat 0.5 s, bar 2 s). Every scene boundary is a whole second, i.e. on the bar
  or half-bar grid. 60-s cut = 1500 frames = 30 bars; 45-s cut = 1125 frames.
- Scene code receives `t` = seconds since the shot started. **All times below are global (T); subtract the shot
  start.** The two cuts share every scene file: `FILM.ui.cut(info)` returns 60 or 45 and the scene picks the
  matching schedule. `FILM.ui.variant(info)` returns 'page' or 'external' (only scene 12 cares).
- Subtitles are drawn by the kit overlay from the timeline, not by scenes. Scenes keep y 880–1000 free.

## Summary

| # | id | 60 cut (T) | 45 cut (T) | main title | kit pieces |
|---|---|---|---|---|---|
| 01 | s01 | 0–4 | 0–3 | «С чего начать?» | tabCard ×3, card(dashed) «Мой проект», route (lost), cursor |
| 02 | s02 | 4–9 | 3–5 | «Бесплатный гид по AI-разработке» | brand, author, route, routeCard(contour) ×3 |
| 03 | s03 | 9–12 | 5–7 | «Три задачи. Три маршрута» | routeCard ×3 (short labels), route |
| 04 | s04 | 12–18 | 7–13 | «Собрать первого агента» | briefCard, window «Твой проект», button, cursor, check, pill |
| 05 | s05 | 18–24 | 13–19 | «Разобраться в AI-инженерии» | schema, sheet «Мой агент», pill |
| 06 | s06 | 24–30 | 19–25 | «Довести свой проект до результата» | notes (pill/cards), planSheet, pill |
| 07 | s07 | 30–35 | 25–30 | «Посмотри разбор» → «Возьми материалы» → «Попробуй сам» (45: «Смотри → пробуй → проверяй») | lessonPage + camera |
| 08 | s08 | 35–40 | 30–32 | «Примени к своей задаче» → «Проверь результат» (45: «Сделай на своей задаче») | lessonPage, window thumb, cursor |
| 09 | s09 | 40–45 | 32–34 | «В своём темпе» (45: keeps «Сделай на своей задаче») | lessonPage, resumeCard (60 only) |
| 10 | s10 | 45–50 | 34–38 | «Результат твоего маршрута» | briefCard/schema/planSheet (compact) |
| 11 | s11 | 50–54 | 38–41 | «Бесплатно · Без регистрации» | text, kicker, route |
| 12 | s12 | 54–60 | 41–45 | «Выбери маршрут ниже» + «Сделай первый шаг сегодня» | brand, routeCard ×3 + button, arrowDown |

Transitions: cuts with matched geometry, except fades (0.32 s) into s06, s07 and s10. A fade shows both shots, so the
outgoing shot must hold a clean final pose at t ≥ its duration.

## Shared geometry (all on `FILM.ui`, exact)

- **G1 `CARD_ROW`** — x [192, 720, 1248], y 440, w 480, h 360, r 24. The three route cards in s02 (contour), s03, s12.
- **G2** — cold-open pose at the s01→s02 boundary: three tabs + the dashed «Мой проект» card (see `ui.G2`). s01 ends
  exactly on G2 (tilts included); s02 starts exactly on G2.
- **G3** — {x 120, y 300, w 560, h 440}: at the s03→s04 boundary only route card 0 is visible, drawn with
  `ui.routeCard(ctx, 0, G3..., { label: 'name', glow: 1 })`; s03 ends on it, s04 starts from it. Nothing else on screen
  except `ui.bg`.
- **G4** — at the s04→s05 boundary the frame is `ui.bg` + one rounded-rect contour {x 810, y 435, w 300, h 130, r 18},
  accent stroke 2 px with soft glow, empty inside. s04 ends on it; s05 starts from it and fills it as «Модель»
  (`ui.schema(ctx, 960, 560, 1, …)` puts Модель exactly there).
- **Brand position** — the lockup `ui.brand(ctx, 960, 150, { size: 64, align: 'center' })` in s02, s03 and s12.
- **Route titles** — `ui.TITLE`: kicker at (120, 150), title baseline (120, 232), 76 px, left-aligned (s04–s06).
- **Lesson page** — `ui.LESSON` rects; s07–s09 film the same page through `L.camera`.

---

## 01 · Знакомая ситуация — s01 · 60: T 0–4 (frames 0–99) · 45: T 0–3

**Composition.** Dark page. Open "tabs" (`ui.tabCard`): «Видео про AI» (video), «Новый инструмент» (tool), «Сохранить
на потом» (note), partly overlapping; in the centre the dashed empty card «Мой проект» (`ui.card({ dashed: true })`
with a mono caption "Мой проект" and a faint "+" or empty skeleton). No third-party sites reproduced.

**60.** 0.0–1.2 the three tabs appear one by one (0.0, 0.4, 0.8) with small overshoot, overlapping, slightly tilted,
drifting a few px (restless). 1.2–2.4 the cursor travels between them (tab → tab → tab), the route line (dashed,
wobble) follows it and bends, never reaching «Мой проект». 2.4–4.0 motion stops: big title «С чего начать?» (88 px,
centred, baseline ~ 200) appears at 2.4; the empty project stays near. 3.4–4.0 the tabs start to line up: they ease
from their drift toward the **G2** pose, landing exactly on G2 at t = 4.0 (tilts included). The title stays until 4.0.

**45.** Two tabs only (video, tool) + the empty project. The question appears in the first second (1.0). Tabs settle
onto G2 (the third tab of G2 fades in during 2.2–3.0 so the boundary pose matches) by t = 3.0.

**Sound.** Two–three soft tab clicks; a questioning hit at 2.4 (45: 1.0).

## 02 · Появляется понятная точка входа — s02 · 60: T 4–9 · 45: T 3–5

**Composition.** The tabs turn into the neat guide: brand lockup on top (G brand position), centred title «Бесплатный
гид по AI-разработке» (76 px, «AI-разработке» in accent, baseline 290), under it the author credit
`ui.author(ctx, 960, 360, { align: 'center', size: 48 })` «Владилен Минин». Below: three contour route cards on G1.

**60.** 4.0–4.7: from G2 the tabs and the project card align and shed detail — they slide/scale into three contour
cards on G1 (tab contents fade out, 0.7 s, inOutCubic) and fade to outline. 4.7–6.2: brand and title assemble
(appear 0.4 s each, staggered); the route line becomes straight and calm under the title (draws across x 560→1360,
y 395) and fades to a thin line. 6.2–9.0: in the contour cards the glyph tiles appear in order (6.4, 7.1, 7.8; glyph
draw-on 0.5 s) — cards stay contour (dashed) without labels. The title stays readable.

**45.** 3.0–3.6 tabs align into the G1 contour cards; 3.4–4.0 brand + a short title «Бесплатный гид» appear (skip the
author); 4.0–5.0 glyph tiles appear quickly in the cards (4.0, 4.2, 4.4). Ends on the same pose s03 starts from.

**End state (60 at 9.0, 45 at 5.0).** Brand + title (+ author in 60) + three dashed contour cards with glyphs on G1.

## 03 · Выбор из трёх задач — s03 · 60: T 9–12 · 45: T 5–7

**Composition.** The three cards on G1, filled (no longer dashed), with short labels «Агент», «AI-инженерия»,
«Свой проект» (label: 'short', 48 px) and the glyphs. Title band: brand stays; «Бесплатный гид…» crossfades to
«Три задачи. Три маршрута» (centred, baseline 290, same place). The route line runs along the card tops linking
1→2→3.

**60.** 9.0–9.6: cards fill (contour → solid, 0.3 s) and labels appear one by one (9.0, 9.2, 9.4 — three tactile
accents). The title swap happens 9.0–9.4 (old out 0.2 s, new in 0.3 s); author fades out. 9.6–11.2: hold the wide
shot (only the route line head glides slowly). 11.2–12.0: card 0 grows and moves to **G3** (label changes to 'name'
«Собрать первого агента», glow → 1) while cards 1 and 2 dim and slide back to alpha 0, brand/title fade out. At t =
3.0 the frame is exactly G3.

**45.** 5.0–5.4 fill + labels; the title already reads «Три задачи. Три маршрута» (swap 5.0–5.3); hold to 6.4;
6.4–7.0 card 0 → G3 as above.

## 04 · Настроить агента под свою задачу — s04 · 60: T 12–18 · 45: T 7–13

**Composition.** Left: kicker «Маршрут 1 · Агент», title «Собрать первого агента» (ui.TITLE). Under it the brief card
(`ui.briefCard`, ~ x 120, y 300, w 760, h 480) with rows Задача / Правила / Проверка. Right: the separate window
«Твой проект» (`ui.window`, ~ x 1000, y 300, w 800, h 480) with a simple preview inside: a mini app mock with a
button that is broken (misaligned, dull) and becomes fixed (accent, aligned). Caption pill at the bottom of content
(y ~ 800): «Бриф + первый проверенный результат».

**60.** 12.0–13.2: from G3 the card's name rises into the title position (it *is* the title), the card body opens into
the brief (rows appear, labels only). 13.2–15.0: values type in: «Поправить кнопку» (13.2–13.8), «Только нужный файл»
(13.8–14.4), «Проверить на телефоне» (14.4–15.0) with caret (`st.T = info.T`). 15.0–16.2: the brief is handed to the
window: the window appears on the right (15.0–15.4) and the route line draws from the brief to the window with a
small brief-token travelling along it; the window title «Твой проект» stays visible. 16.2–18.0: the button in the
preview changes (16.2–16.7, the fix), the cursor comes in (16.2–16.9) and clicks it (16.9, press 0.3 s); only after
the click, at 17.3, «Проверено» appears (green pill with check near the preview) and the caption pill appears.
17.5–18.0: everything else fades out and the window frame shrinks into the **G4** contour (ends exactly on G4).

**45 (7–13).** Same beats, compressed: 7.0–7.8 G3 → title + brief; 8.0–9.4 three values type (8.0, 8.5, 9.0, 0.4 s
each); 9.4–10.0 window + handoff line; 10.4–11.9 fix + cursor; click 11.9; «Проверено» 12.3; 12.5–13.0 → G4.

**Must.** The window is visibly separate from the guide. No chat, no «запустить агента». «Проверено» only after the click.

## 05 · Понять, как устроен агент — s05 · 60: T 18–24 · 45: T 13–19

**Composition.** Kicker «Маршрут 2 · AI-инженерия», title «Разобраться в AI-инженерии» (ui.TITLE). Centre:
`ui.schema(ctx, 960, 560, 1, st)` — Модель, Инструменты, Знания, Проверка. At the end the whole schema sits on a sheet
«Мой агент» (`ui.sheet`, file 'agent-architecture.md', title 'Мой агент'). Caption pill «Схема своего агента».

**60.** 18.0–19.2: the G4 contour fills and becomes «Модель» (block appear). Title appears 18.2. 19.2–21.0:
Инструменты (19.2) and Знания (20.1) connect (link draws 0.5 s, block appears at link end). 21.0–22.2: a light dot
travels model → tools → back (`st.pulse` 0→1). 22.2–24.0: Проверка appears (22.2) and links; 23.0–24.0 the schema
scales down (≈ 0.72) onto the sheet «Мой агент» that rises behind it; caption pill at 23.4. Hold.

**45 (13–19).** Same, 5 s after: 13.0 Модель, 14.2/15.1 connections, 16.0 pulse, 17.2 Проверка, 18.0 sheet.

**Must.** Only these four blocks; no "must-do" stages; small mono sub-labels (LLM, API, RAG…) may stay as fine detail.

## 06 · Сдвинуть свой проект с места — s06 · 60: T 24–30 · 45: T 19–25 (fade in 0.32)

**Composition.** Kicker «Маршрут 3 · Свой проект», title «Довести свой проект до результата» (two lines, ui.TITLE,
maxW ≈ 1000 so it breaks «Довести свой проект / до результата»). Left: a loose cluster of idea notes (small cards /
pills: «Лендинг», «Телеграм-бот», «Форма заявки», «Портфолио», «Курс») — slightly scattered. Right: `ui.planSheet`
«План на неделю» (x ~ 1060, y ~ 300, w 740, h 560). Caption pill «План на неделю» near the bottom left.

**60.** 24.0–25.2: the notes gather around one chosen task («Форма заявки»/«Лендинг» highlighted; others dim).
25.2–27.0: the chosen note flies to the plan's top row «Результат недели» and becomes the goal text (goal 0→1).
27.0–28.5: three steps appear (27.0, 27.5, 28.0), each with its empty check square. 28.5–30.0: step 1 is
highlighted (active 0→1), the others stay ahead; «Кому покажу результат» appears (29.0). The route line threads the
rows. Last 0.4 s: step 1 starts to scale up slightly (bridge to the lesson page).

**45 (19–25).** 19.0–20.0 notes gather; 20.2–21.6 goal; 22.0/22.5/23.0 steps; 23.5 highlight; 24.0 «Кому покажу».

## 07 · Что находится внутри шага — s07 · 60: T 30–35 · 45: T 25–30 (fade in 0.32)

**Composition.** The lesson page (`ui.lessonPage`) filmed through `L.camera`. Three zones: video, materials, the practice
task. One focus at a time, big enough to read; a sequential title in the title band (left or centred, 64–76 px) over a
top gradient scrim so it reads over the page.

**60.** 30.0–31.5 camera rests on the video (zoom ~ 1.45 on ui.LESSON.video), video playhead runs, videoFocus ring,
title «Посмотри разбор». 31.5–33.0 camera glides to materials (matFocus), title «Возьми материалы». 33.0–35.0 camera
glides to the task panel header «Теперь попробуй на своей задаче» (taskFocus), title «Попробуй сам». Short glides
(0.5 s), no long scroll. Ends framed on the task area as s08 starts.

**45 (25–30).** Same three focuses at 25.0 / 26.5 / 28.0, but one static title «Смотри → пробуй → проверяй» for the
whole scene (appears at 25.1, holds).

## 08 · Сделать на своей задаче — s08 · 60: T 35–40 · 45: T 30–32

**Composition.** Close on the practice block: «Вставить шаблон», the notes field, «Как понять, что готово». A small
separate `ui.window` thumbnail «Твой проект» (≈ 420 × 260) appears at the right side to show the task is applied
outside the guide. Titles: «Примени к своей задаче» → «Проверь результат».

**60.** 35.0–36.0 the cursor clicks «Вставить шаблон» (press at 35.3). 36.0–37.5 template lines appear in the notes
(tpl 0→1). 37.5–38.8 values type (vals), the «Твой проект» thumbnail appears with the fixed button. 38.8–40.0 the
cursor highlights criterion 1 (critHi 0, critFocus), title swaps to «Проверь результат» at 38.8. Keep the notes field
in frame for s09.

**45 (30–32).** 30.0 click template (press 30.1), 30.3–30.9 template + values fill fast, 31.4 criteria highlighted
with a manual tick by the cursor. Title «Сделай на своей задаче» for all of s08+s09.

## 09 · Увидеть своё продвижение — s09 · 60: T 40–45 · 45: T 32–34

**Composition.** Same page, framed on «Я сделал» and «0 / 3». Then back to the top of the guide: `ui.resumeCard`
«Продолжим с того места, где остановились» + «Продолжить».

**60.** 40.0–41.0 the cursor moves to «Я сделал» and clicks (press at 40.5). 41.0–42.0 «Выполнено» (done = 1) and the
progress changes 0/3 → 1/3 (bar grows). 42.0–43.3 a smooth camera move up/out to the guide start (same page world —
no other device). 43.3–45.0 the resume card appears (centred, ~ x 360, y 420, w 1200, h 200) with «Продолжить».
Title «В своём темпе» at 41.2. Must: no second device, no cloud, no auto-saved notes.

**45 (32–34).** 32.0–32.4 cursor → «Я сделал», click 32.4, 33.0 «Выполнено» + 1/3; no resume card. Title stays
«Сделай на своей задаче».

## 10 · Что останется у человека — s10 · 60: T 45–50 · 45: T 34–38 (fade in 0.32)

**Composition.** Three big result cards in a row: `ui.briefCard` (compact) «Бриф агента», a sheet with `ui.schema`
scaled small «Схема агента», `ui.planSheet` (compact) «План проекта». Common caption «Результат твоего маршрута»
(title band, centred). Route line under the row.

**60.** 45.0 brief, 46.0 schema, 47.0 plan (each appears 0.4 s, filled). 48.0–50.0 wide shot; one card highlights
(glow) while the other two dim a little — showing that a route gives *one* of them (cycle highlight 0→1→2 is not
required; highlighting one is enough). Last 0.5 s: the cards shrink slightly toward the centre, making room.

**45 (34–38).** All three within 1.5 s (34.0, 34.5, 35.0), wide + one highlighted from 35.8.

## 11 · Снять барьер — s11 · 60: T 50–54 · 45: T 38–41

**Composition.** Small constant kicker «Материалы гида» above two big lines «Бесплатно» and «Без регистрации» (88–110 px,
centred). The route line turns down toward the bottom (where cards will be).

**60.** 50.0–50.6 «Бесплатно»; 50.6–51.2 «Без регистрации»; 51.2–54.0 calm hold; the line draws from the left toward a
point below centre and bends downward.

**45 (38–41).** Both lines and the kicker assembled within 38.0–38.5; hold.

## 12 · Выбрать маршрут сейчас — s12 · 60: T 54–60 · 45: T 41–45

**Composition (page).** Brand at the top (brand position), title «Выбери маршрут ниже» (88 px, centred, baseline 290),
second line «Сделай первый шаг сегодня» (40 px, text2, baseline 350). Three route cards on G1 with label 'both' and the
«Начать маршрут» button. Short violet arrow down below the cards (`ui.arrowDown(ctx, 960, 812, 56)`), ending ≤ y 870.

**60.** 54.0–55.0 cards settle onto G1 (rise + fade); 55.0–56.0 title + arrow; from 56.0 fully static except a
barely-visible glow breathing on the line/arrow. Hold to 60.0.

**45 (41–45).** Everything assembled by 41.5; hold.

**External ending (variant 'external').** Brand at the top; «Открой бесплатный гид» (88 px); the address
**irreplaceable-ai.ru/learn** very large (JetBrains Mono 600, ~ 84 px, accent, in a field/pill), visible from the first
frame of the scene and to the end; below «Выбери свой маршрут» (40 px) and the three glyph tiles in a row. No arrow.
