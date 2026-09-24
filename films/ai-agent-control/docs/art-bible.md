# Art bible: Кто контролирует работу AI-агента?

The visual rules every scene follows.
Where this file and a scene brief disagree on a colour, weight or rule, this file wins.
Where this file and `docs/storyboard.md` disagree on a position or a time, the storyboard wins.

This film does **not** use the skill's house style (cream paper + navy blueprint).
The brief asks for the continuation of a five-image teaser from 22 September: black background, white typography, orange signal elements, a technical interface.
Sections 1–9 below were rewritten for that look (see §0); section 10 is the subject reference; section 11 is the UI kit every scene draws with.

## 0. Reference analysis (what the teaser fixed, as rules)

1. Background is black, never grey or navy. Texture is a faint dot grid (interface plate) or a faint line grid (schematic plate), plus film grain.
2. Type is white, heavy, tight (Inter 800, −1.5 px tracking) for the key phrase; mono (JetBrains Mono) for technical labels.
3. Orange is a signal, not a decoration: it marks the agent's actions, allowed routes, focus and the one accent word of a headline. Never an orange background fill larger than a chip.
4. The hero is the working project (the React app «Обращения клиентов»), not the robot. The robot head is a small mark for the agent (≤ 150 px wide).
5. Every text element is rebuilt as vector type in the scene. No pseudo-code, no fake imports, no long code walls, no random decorative words.
6. One or two big elements per moment. If a phone viewer cannot read it at 1/3 size, it is too small or too many.
7. Illustrative UI is honest: it is never dressed as a recording of the lesson (no REC dots, no video timecodes, no video-player chrome, no portrait).

## 1. Frame

1080 × 1920 px, 24 fps, 120 bpm (beat 0.5 s = 12 frames). Origin top-left, y down.

### 1.1 Instagram safe area

Stories draws the progress bar, avatar and close button over the top ~230 px and the reply bar over the bottom ~200 px; Reels adds a caption block over the bottom ~400 px and a button column on the right from y ≈ 1000.
**Must-read content sits inside x 72–1008 and y 250–1540.** In the lower right (y > 1100) keep must-read content left of x 950.
Backgrounds, grids, glows and decorative lines run full bleed.

### 1.2 Vertical zones (every shot)

| Zone | y | Content |
|---|---|---|
| system UI | 0–250 | background only |
| tag | 283–300 | mono chapter tag `// …` (ui.tag), x 80 |
| headline | 330–520 | key phrase, max 2 lines (ui.headline, first baseline y 404) |
| stage | 560–1350 | the action: app, schema, cards (1–2 big elements) |
| captions | 1396–1530 | burned-in voice-over captions — **drawn by core, never by scenes**; keep this band free of must-read scene content |
| system UI | 1540–1920 | background only |

Shot 10 (CTA) is the exception: centred composition, no captions, sticker zone (§9).

## 2. Palettes

Names are keys of `FILM.lib.pal`; `src/lib.js` mirrors this table exactly. Scenes never write hex literals.

### 2.1 Legacy keys

The skill's paper and blueprint keys stay in `lib.pal` for the tool fixtures; this film does not use them.

### 2.2 Film palette

| Name | Hex | Use |
|---|---|---|
| bg | #070707 | interface plate base |
| bgDeep | #030303 | schematic plate base, chip fills that mask a line |
| panel | #101010 | windows, cards |
| panelHi | #181818 | rows, inputs, raised fills |
| panelTop | #1E1E1E | window title bars |
| hair | #272727 | hairline borders |
| hairHi | #3B3B3B | window outlines, strong borders |
| dotGrid | #1F1F1F | interface plate dot grid |
| gridLine | #121212 | schematic 60 px grid |
| gridMajor | #1A1A1A | schematic 240 px grid |
| txt | #F4F4F1 | primary type, main linework |
| txtDim | #A6A6A2 | secondary type |
| txtFaint | #68685F | tertiary labels, placeholders, ids |
| sig | #FF6A13 | **orange signal**: agent actions, allowed routes, focus, accent word |
| sigHot | #FF9C55 | glow cores, travelling signal dots |
| sigDeep | #A8430C | deep orange borders (selected rows) |
| sigTint | #2A1407 | orange-tinted fills |
| danger | #FF3B30 | red: danger frame, blocked action — shots 03 and 06 only |
| dangerSoft | #FF8A80 | type inside a danger zone |
| dangerTint | #2E0B09 | red-tinted fills |
| ok | #2FD27A | green: «Готово», test passed — shots 01/02 and 07 only |
| okTint | #0B2717 | green-tinted fills |

Colour semantics are fixed: **orange = the agent acting / allowed**, **red = danger / blocked**, **green = done / verified**, white = structure. A shot uses at most two of orange/red/green at once.

## 3. Line

| Element | Width | Colour |
|---|---|---|
| window outline | 2 px | hairHi |
| row / input border | 2 px | hair (focused: sig) |
| connector arrow (ui.arrow) | 3–4 px, round caps, 18–22 px corner radius | sig (allowed), txtDim (neutral) |
| schema rings | 2 px | txt at 50 % over bgDeep (`mix(bgDeep, txt, 0.5)`) |
| danger frame | 4 px | danger |
| frozen arrows | 3 px dashed 14/10 | sig at 60 % |

## 4. Tone and texture

### 4.1 Fills

Flat fills from the palette. Soft radial glows (`ui.glow`) are allowed on orange/red/green signal points only. Drop shadows only through `ui.panel`.

### 4.2 Depth

Depth comes from layering panels (panel over bg, panelHi rows inside panels) and the vignette in `ui.bg`, never from gradients on surfaces.

### 4.3 Grain

`core` lays a neutral grain (faint light specks, dark clumps) over every shot on the 12 fps boil clock, at `FILM.GRAIN = 0.3` of the tile strength: stronger boiling grain cost ~30 Mbit/s at crf 16 and breaks up in Instagram's re-encode. Scenes add no full-frame grain.

### 4.4 Background drift

Plates may drift slowly (`ui.bg({ oy: -T * 12 })`, 6 px per beat) for life. During camera moves the plate stays screen-fixed.

## 5. Schematic language (shots 04, 05, 09 and the start of 08)

Schematic plate = `ui.bg({ plate: 'schematic' })`. Structures are nodes (`ui.node`), connectors (`ui.arrow`), rounded-rect layers (`ui.ringPts`) and the canonical schema (`ui.schema`).
Arrows are orthogonal with rounded corners when controlled, free curves when uncontrolled.
Signals are small orange dots with a glow travelling a route on the beat.
Text in schematic shots: node labels, ring tabs, the tag and the headline. Nothing else.

## 6. Type

### 6.1 Families

`lib.FONT.sans` (Inter → SF Pro → Helvetica → Arial) and `lib.FONT.mono` (JetBrains Mono → SF Mono → Menlo). System fonts only, no font files.

### 6.2 Scale

| Role | Style | Helper |
|---|---|---|
| headline (key phrase) | Inter 800, 76 px (auto-fits 920 px), lh 1.1, −1.5 px, one [accent] word in sig | `ui.headline` |
| CTA headline (shot 10) | Inter 800, 92 px, centred | `ui.headline({ align: 'center', size: 92, x: 540 })` |
| chapter tag | JetBrains Mono 500, 26 px, sig, orange square | `ui.tag` |
| UI title | Inter 700, 38–44 px | `ui.label` |
| UI body | Inter 500–600, 30–36 px | `ui.label` |
| technical label | JetBrains Mono 500, 26–32 px | `ui.label({ font: 'mono' })` |
| chips | Inter 600 or mono, 22–30 px | `ui.chip` |
| captions | Inter 600, 40 px, white on black 74 % pill — **core only** | `FILM.TIMELINE.captions` |

Minimum size for anything the viewer should read: **26 px**. Decorative miniatures (a mini window at 0.3 scale) may go smaller if nothing in them must be read.

### 6.3 Hierarchy

Action (stage) → key phrase (headline) → caption (core). The headline enters with the scene's first beat and holds; captions follow the voice.

## 7. Motion

### 7.1 Timing

Every pop, cut and hit lands on the 16th-note grid (0.125 s = 3 frames), visible ON the beat frame (`ui.kf`, `ui.pop` lead one frame).
Pops: `outBack` over 4 frames. Draw-ons: `outExpo` or `outCubic` over 6–10 frames. UI slides: `outCubic` over 6–8 frames.
Camera moves: `inOutCubic`, 1–2 s, zoom interpolated in log space. Motion is snappy, never floaty.

### 7.2 On-twos

Characters in this film are UI objects, so they move at 24 fps. Only "jittery / uncontrolled" things (shot 04 wild arrows, the blocked agent's shake) step on twos (`L.onTwos(t)`).

### 7.3 Determinism

No `Math.random`, `Date`, `performance.now`. Seed from `L.hash(ID, …)` through `L.rng`. Draw from `t` alone; clamp `t` to `[0, info.dur]` first.

## 8. Match cuts

Shared geometry lives in `L.GEO` (and the storyboard "Shared geometry" table). Scenes copy it exactly — the first frame of a shot must equal the last frame of the previous shot wherever the storyboard says "match".

## 9. Closing card

Shot 10 carries no wordmark. It carries the CTA stack and the empty sticker zone `L.GEO.STICKER` (x 270–810, y 1190–1350) marked only by four orange corner ticks (`ui.corners`). Nothing is drawn inside the zone; no drawn button that looks tappable.

## 10. Subject reference

Source: the brief (this lesson's story) — sources checked on 2026-09-24: the scenario text supplied by the author; no external facts are asserted in the film.

### 10.1 The project

A React app «Обращения клиентов»: title bar (`localhost:5173`, React atom), header «Обращения», a count chip, then — once the agent has added it — a search field «Поиск по обращениям», and a list of four tickets (`L.TICKETS`):

| id | title | status |
|---|---|---|
| #1042 | Не приходит письмо после оплаты | новое |
| #1043 | Ошибка при входе с телефона | в работе |
| #1044 | Как сменить тариф? | новое |
| #1045 | Не грузится счёт в PDF | решено |

Queries used: «вход» finds #1043 (shots 01–02), «оплат» finds #1042 (shot 07). Tickets are fictional; no personal names, emails or phone numbers anywhere.

### 10.2 The project tree (`L.TREE`)

`src/` › `components/` (TicketList.tsx, SearchBar.tsx), `data/` (tickets.json), App.tsx; `package.json` at the root. The dangerous operation targets `src/` (`rm -rf src/`).

### 10.3 The agent

A tool-using agent: model + tools (files, terminal, app) + a loop. Its mark is the robot head (`ui.agent`). In shot 05 the node is labelled «модель»; elsewhere «агент».

### 10.4 The control frame (shot 05)

Four layers around the model, inner to outer: задача и контекст → инструменты → права → проверки. Routes to the tools pass a gate at every layer.

### 10.5 Example rules (shot 06, shown as «пример настройки»)

читать файлы → можно; изменять файлы → с подтверждением; удалять → запрещено; limits line «лимит: 20 шагов · 5 мин».

### 10.6 Mistakes to avoid

- The robot as the hero, big and cute — **the project is the hero; the robot is a ≤ 150 px mark.**
- Something actually disappearing in shot 03 — **nothing is deleted; the action freezes before execution.**
- A loud siren, flashing red full screen — **a thin red frame, one muted beep, a 0.5 s held pause.**
- Tiny fake code, imports, stack traces — **file names, chips, one command (`rm -rf src/`), nothing else.**
- A fake video player, REC dot, timecode or a generated portrait of Vladilen — **shot 08 shows the project UI in a plain card.**
- Promises of universal safety — **shot 06 is labelled «пример настройки».**
- Paid course, prices, «Agentic OS», 3D Agent — **never shown.**
- A drawn "button" in the CTA — **text + arrow + corner ticks only; the native sticker is added in Instagram.**
- Text inside the caption band (y 1396–1530) — **scenes keep it clear; core owns captions.**

## 11. UI kit (`src/lib.js`, `L.ui`)

All primitives are pure functions; sizes are 1080-frame pixels. Read the JSDoc in `src/lib.js` for every option.

| Function | What |
|---|---|
| `ui.bg(ctx, {plate, ox, oy})` | plate background (interface dot grid / schematic grid) + vignette |
| `ui.tag(ctx, str, t, {x, y, out})` | chapter tag, typed in |
| `ui.headline(ctx, lines, t, {x, y, size, align, out})` | key phrase, lines rise in; `[word]` = orange |
| `ui.label / ui.rich / ui.measure / ui.font` | type |
| `ui.panel(ctx, x, y, w, h, o)`, `ui.rr` | surfaces |
| `ui.chip(ctx, str, x, y, o)` | pills with optional icon |
| `ui.node(ctx, cx, cy, w, h, o)` | schematic node card |
| `ui.arrow(ctx, pts, o)`, `ui.roundPts`, `ui.bezier`, `ui.along` | connectors with draw-on |
| `ui.icon(ctx, name, cx, cy, s, o)` | line icons: search folder file terminal app check cross stop block lock warn shield eye pencil trash loop play cursor spark chevronRight chevronDown atom user send code video |
| `ui.agent(ctx, cx, cy, s, o)` | robot-head mark (states idle/busy/blocked/ok) |
| `ui.user(ctx, cx, cy, s, o)` | developer mark |
| `ui.app(ctx, x, y, w, st)` | the React app (880 × 760 design) with search/filter/highlight states |
| `ui.tree(ctx, x, y, w, o)` | the file tree panel, hover and danger states |
| `ui.toolCard(ctx, id, x, y, w, o)` | tool mini window (files / terminal / app) with its label |
| `ui.schema(ctx, s)` | the canonical control schema (dev, agent/model, core, rings, tools, routes, gates, pulses) |
| `ui.cursor`, `ui.glow`, `ui.corners` | pointer, glow, viewfinder corners |
| `ui.k / kf / env / pop / typed / caretOn` | timing helpers |
