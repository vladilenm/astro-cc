# Art bible — «Бесплатный гид по AI-разработке» (Learn)

This film deviates from the procedural-film house style (paper / blueprint plates) on purpose: the ТЗ asks for the
visual language of the live Learn page. Sections 1–9 below replace the house style. Everything is still drawn in
JavaScript on a canvas and the soundtrack is synthesised; the only embedded media are the real brand assets
(logo, author photo, the site's Onest and JetBrains Mono faces) through the `src/photos.js` door.

## 1. Frame, zones, safe area

- 1920 × 1080, 25 fps, SDR. Shot mode `none` (no grain post).
- Text safe area: 80 px on every side (the gate measures rendered text ink). The ТЗ's 5 % rule (96 / 54 px) is met
  horizontally by the layout margins below.
- Layout zones (logical px):
  | zone | y | use |
  |---|---|---|
  | title band | 90–300 | kicker (mono caps) + main title |
  | content | 300–860 | the one main object of the moment |
  | subtitle band | 880–1000 | subtitles only (FILM.overlay). Nothing must-read lives here; decoration may pass through, dimmed |
- Horizontal margins: x 120–1800. Centred compositions centre on x 960.
- One main object and one main phrase per moment. Zoom into the interface fragment that matters rather than showing a
  whole browser.

## 2. Palette (`FILM.lib.pal`, mirrored from `src/lib.js`)

| name | hex | use |
|---|---|---|
| bg | #0B0C0E | page background (ТЗ) |
| bgDeep | #08090A | vignette, video panels |
| card | #111316 | cards (ТЗ) |
| cardHi | #16181C | tab ears, sheets, title bars |
| field | #0E1013 | inputs, the user's own project window |
| text | #F1F1EE | primary text (ТЗ) |
| text2 | #A1A3AB | secondary text (ТЗ) |
| text3 | #6B6D74 | tertiary labels, file names |
| accent | #A78BFA | the route line, active states, one accent word per title (ТЗ) |
| accentHi / accentDeep / accentInk | #C4B2FC / #6D4FD8 / #140B2E | highlight, pressed, ink on accent buttons |
| border / borderHi | #292B31 / #3A3D45 | 1.5 px outlines (ТЗ) |
| green / greenDeep | #6EE7B7 / #0F2E24 | only "Проверено" / "Выполнено" / criteria met (site `--green`) |
| amber, tabBlue, tabRed | #F5C66B, #7FB0FF, #F4524A | favicon dots of the cold-open tabs only |

Rules: accent is the film's only saturated colour after scene 01. Green appears only after a *manual* check.
Colours in scene files come from `L.pal` / `L.rgba(P.x, a)` — no literal hex.

## 3. Type

- Onest (site sans) for everything a viewer reads; JetBrains Mono for kickers, file names, counters ("1 / 3"),
  small technical labels (≥ 20 px).
- Main titles: 64–88 px, weight 600, tracking −2 %. Default 76 (`FILM.ui.title`). Long route names break into 2–3
  lines and stay for the whole scene.
- Significant UI labels: 38–48 px. Secondary UI text 26–32 px only when it is not needed to follow the story.
- Subtitles: Onest 500 44 px, max 2 lines, on a dark plate, last baseline y 968 (FILM.overlay).
- A main title shows 3–7 words. While a title is being read it does not move (appear, then hold).

## 4. Motion

- Appear: 0.3–0.5 s, `outCubic`, alpha 0→1 with a 16–32 px rise (`FILM.ui.appear`, `ui.title({ a })`).
- Moves and camera: `inOutCubic`, 0.3–0.5 s for transitions, up to ~1.2 s for camera pushes.
- Camera: frontal. Zoom via `FILM.lib.camera` only. No rotation except the cold-open tabs (≤ 3°).
- Scene 01 is slightly restless (tabs drift, the route line wiggles); from scene 02 on motion is orderly.
- Cursor: `FILM.ui.cursor` + `ui.cursorPath` keyframes; a click = `press` 0→1 over 0.3 s with a ripple.
  The cursor never teleports: it enters from off-frame or from its last position.
- Frame 0 of every shot is a complete pose; the last frame holds.

## 5. The kit (`FILM.ui`, `src/props.js`) — mandatory

Scenes never redraw what the kit draws: `bg`, `card`, `window`, `tabCard`, `sheet`, `button`, `pill`, `field`,
`progress`, `check`, `video`, `cursor`, `ripple`, `route`, `glyph`, `logo`, `brand`, `author`, `block`, `link`,
`arrowDown`, `routeCard`, `briefCard`, `schema`, `planSheet`, `lessonPage`, `resumeCard`, `title`, `kicker`, `text`.
Shared geometry lives on the kit too: `CARD_ROW` (G1), `G2`, `G3`, `G4`, `TITLE`, `SCHEMA`, `LESSON`.
Texts that must match the product (`ROUTES`, `BRIEF`, `PLAN`, `MATERIALS`, `CRITERIA`, `TEMPLATE`) are constants on the
kit; use them, do not retype.

Every scene starts with `FILM.ui.bg(ctx, {...})`.

## 6. The route line (through-line)

`FILM.ui.route(ctx, pts, { from, to, wobble, T })` — violet, glowing, with a bright head.

| scene | what the line does |
|---|---|
| 01 | wanders between the tabs, dashed and wiggling, never reaching the empty project card |
| 02 | straightens into a calm line under the title that leads to the three cards |
| 03 | runs along the tops of the cards linking 1→2→3 |
| 04 | draws from the brief to the "Твой проект" window (the handoff) |
| 05 | is the connector system (links pulse) |
| 06 | threads the plan rows top to bottom |
| 07–09 | a thin guide under the focused zone; at 09 the progress bar is its continuation |
| 10 | runs under the three result cards |
| 11 | turns down toward where the cards will be |
| 12 | becomes the short arrow down (`ui.arrowDown`) |

## 7. Accuracy of promises (ТЗ «Точность обещаний») — hard rules

- The agent works in a separate workspace: `ui.window` "Твой проект" (title bar, three dots, mono title) is visually
  distinct from Learn cards. Never draw a chat, a "Run agent" button or anything that implies Learn runs the agent.
- "Проверено" appears only *after* the cursor checks the result by hand (clicks the button in the preview).
- "Я сделал" is pressed by the cursor; "Выполнено" and "1 / 3" come after the press. No automatic grading.
- Progress lives in this browser: never show another device, a cloud icon or sync.
- Filled brief / schema / plan = the user's own work. The voice line in 10 keeps "или": the route gives one result.
- "Бесплатно · Без регистрации" refers to the open guide only; no paid products (3D Agent, AI Engineer, Клуб), no prices.
- "План на неделю" is a small result, not a promise to launch anything in 7 days.

## 8. Mistakes to avoid → correct drawing

- A tiny title at the top of a big empty frame → titles 76 px, content fills y 300–860.
- A full browser screenshot with unreadable text → zoom to one panel; readable ≥ 26 px at output size.
- Two things moving while a title is read → hold everything except one small living detail (caret, glow, pulse).
- Text inside the subtitle band (y > 880) → keep must-read content above 860.
- The project window looking like a Learn card → always `ui.window` (dots + mono title), cooler body `field`.
- Green used as decoration → green only for manual verification states.
- A cursor popping in at a click point → cursor paths come from the previous position or off-frame.
- Different card sizes for the same three routes across scenes 02/03/12 → `CARD_ROW` exactly.

## 9. Sound picture (for the score)

Light instrumental electronic, no vocals, 120 bpm grid (half-time feel), soft; uncertain first bars, a steady pulse
from 4.0 s. Effects: clicks, card appears, block connects, step complete. The voice (to be recorded) sits on top: the
music leaves 1–4 kHz room and ducks under the final call.

## 10. Subject reference (the Learn page)

- Three routes (`ui.ROUTES`): Агент — «Собрать первого агента» — result «Бриф + первый проверенный результат»;
  AI-инженерия — «Разобраться в AI-инженерии» — «Схема своего агента»; Свой проект — «Довести свой проект до
  результата» — «План на неделю».
- Glyphs: robot (agent), component scheme (engineering), steps with an arrow (project). The originals are the
  `RouteGlyph` SVG in `app/learn/GuideChrome.jsx` (branch `codex/ai-learning-routes`, not on GitHub at the time of
  production); the kit's glyphs are line redraws of the same three motifs — swap when the SVG is available.
- Brand lockup: logo + «НЕЗАМЕНИМЫЕ» (Onest 600) + mono caps caption «Открытая практика» (as in the site header).
- Lesson page: video, «Материалы», practice block «Теперь попробуй на своей задаче» with «Вставить шаблон», a notes
  field, «Как понять, что готово», «Скачать ответ .txt», «Я сделал», progress «0 / 3».
