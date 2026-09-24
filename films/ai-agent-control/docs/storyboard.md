# Storyboard: Кто контролирует работу AI-агента?

The plan every agent works from. Times are global `T` unless marked `t` (shot-local, `t = T − start`).

## Logline

A developer asks an AI agent for a search feature and gets it in seconds — then the camera pulls back to show what the agent can reach, a single unconfirmed `rm -rf src/` freezes the frame, and an engineering frame of layers, rules, confirmations and checks turns chaos into routes; the film ends on the free lesson «От AI-кодинга к AI Engineering».
Method: every pixel is drawn in canvas JavaScript in a dark technical-interface style (black, white type, orange signal), every sound is synthesised; captions carry the voice-over so the film reads without sound.

## Numbers

- 120 bpm → beat 0.5 s = 12 frames, 8th 0.25 s = 6 frames, 16th 0.125 s = 3 frames, bar 2 s.
- 60 s = 30 bars = 1440 frames at 24 fps, 1080 × 1920.
- 10 shots = the ten scenes of the brief, 5–8 s each (the brief's voice-over needs the length; each shot carries 6–12 beat-locked events inside).

## Summary

| # | Id | Start | End | Plate | Title | In |
|---|---|---|---|---|---|---|
| 01 | instant-result | 0 | 5 | interface | Мгновенный результат | — |
| 02 | price-of-done | 5 | 10 | interface | Цена слова «готово» | cut, match H1 |
| 03 | one-wrong-step | 10 | 15 | interface | Конкретный риск | cut, match H2 |
| 04 | who-controls | 15 | 21 | schematic | Главный вопрос | fade 0.25 from H3 |
| 05 | engineering-frame | 21 | 27 | schematic | Инженерная рамка | cut, match H4 |
| 06 | control-in-action | 27 | 33 | interface | Контроль в действии | cut |
| 07 | verify | 33 | 39 | interface | Проверяем результат | cut |
| 08 | real-project | 39 | 45 | interface (opens schematic) | Это можно разобрать самому | cut |
| 09 | whats-inside | 45 | 52 | schematic | Содержание и аудитория | cut |
| 10 | cta | 52 | 60 | interface | Переход на форму | fade 0.5 |

Engine modes: interface = `mode: 'illustrated'`, schematic = `mode: 'schematic'` (only the grain differs; each scene paints its own plate with `ui.bg`).

## Structure

- Act 1 «магия» — bars 1–3 (0–6.5 s): result in seconds. Music lifts.
- Act 2 «риск» — bars 4–10 (6.5–21 s): pull-back on «пока», the unconfirmed delete, the question. Low layer, stop-frame at 12.5, silence at 17.5, pulse from 18.5.
- Act 3 «инженерия» — bars 11–20 (21–39 s): layers, rules, confirmation, checks. Pulse → warm pad → acceleration → resolving chord at 37.5.
- Act 4 «урок» — bars 20–30 (39–60 s): real project, programme, CTA. Music opens up, resolves at 55, holds.
- Match chain: 01→02 (the app), 02→03 (the files card zooms into the tree), 03→04 (the tree shrinks into the files node), 04→05 (the schema), 05 geometry echoes in 08 (schema over the project) and 09 (the loop has layer 2's shape).
- Camera: 02 pull-back ×3.14 → ×1 (6.5–8.5); 03 push-in into the files card (10.0–10.5); 04 tree → node (15.0–16.0); 08 pull-back from the schema onto the project (39.5–41.0).
- The CTA holds perfectly still from 54.0 to 60.0.

## Conventions

- Every shot: `t = clamp(tIn, 0, info.dur)` first; frame 0 fully drawn; the last frame holds.
- Every shot paints its own plate (`ui.bg`) and draws its own tag + headline (`ui.tag`, `ui.headline`). **Captions are drawn by core — scenes never draw them and keep y 1396–1530 free.**
- Palette names only (`L.pal.*`); geometry from `L.GEO`; content from `L.TICKETS`, `L.TREE`.
- Camera moves use `L.camera(ctx, { x, y, zoom }, fn)`; screen-fixed things (tag, headline, captions) are drawn outside the camera.
- Beat events are visible ON their frame: use `ui.kf`/`ui.pop` (one-frame lead) for anything that starts on a beat.

## Shared geometry

All numbers are in `L.GEO` — copy from there, never retype.

| Key | Value | Used by |
|---|---|---|
| G1 `APP` | x 100, y 590, w 880 (h 760 → bottom 1350) | 01, 02 start, 10 background |
| G2 `AGENT2` | centre (540, 780), s 150 | 02 end, 03 start |
| G2 `TOOLS2` | files (80, 1030, 280×242), terminal (400, 1030, 280×242), app (720, 1030, 280×242) | 02 end, 03 start |
| G3 `TREE3` | x 80, y 600, w 560 (h 672 → bottom 1272; row i centre y = 686 + 72 i + 36) | 03, 04 start |
| G4 `DEV` | centre (540, 640), 340×96 | 04, 05 start |
| G4 `AGENT` | centre (540, 895), s 110; label y 968 | 04, 05, 08 |
| G4 `CORE` | x 390, y 815, 300×170 | 05, 08 |
| G4 `TOOLS` | centres (220, 1300), (540, 1300), (860, 1300), 250×92 | 04, 05, 08 |
| G5 `RINGS` | 1 задача и контекст (320, 755, 440×290, r 34); 2 инструменты (240, 695, 600×410, r 42); 3 права (160, 635, 760×530, r 50); 4 проверки (90, 575, 900×650, r 58) | 05, 08, 09 (shape of 2) |
| G5 `ROUTES` | orthogonal core→tool polylines with 4 gates each | 05, 08 |
| G10 `STICKER` | x 270, y 1190, 540×160 | 10 |

### Handoff states (the frames two shots share)

- **H1 (T 5.0, 01→02):** plate interface (`ui.bg({ oy: -T * 12 })`); tag `// ai-кодинг` and headline `['AI уже пишет [код]']` fully in; `ui.app(ctx, 100, 590, 880, { search: 1, query: 'вход', filter: 1, mark: 1, focus: 1, t: T })` (caret blinks on `ui.caretOn(T)`); nothing else on stage.
- **H2 (T 10.0, 02→03):** plate interface; tag `// доступ` + headline `['А что агенту', '[разрешено?]']` fully in; `ui.agent(ctx, 540, 780, 150, { glow: 1 })`; three wires `ui.arrow(ctx, [[540, 846], [540, 900], [cx, 900], [cx, 972]], { lw: 3 })` where cx = card centre x (220, 540, 860); `ui.toolCard(ctx, id, x, y, 280, {})` for the three `TOOLS2` cards (app card state = H1 app state); the question badge Q: circle centre (668, 694) r 38, fill sigTint, stroke sig 3 px, «?» Inter 800 48 px sig centred, `ui.glow(ctx, 668, 694, 90, sig, 0.45)`.
- **H3 (T 15.0, 03→04):** shot 04 enters with a 0.25 s fade, so shot 04 only needs its own t = 0 state: plate interface, `ui.tree(ctx, 80, 600, 560, { hi: 0, danger: 1 })`, tag/headline of 04 not yet in.
- **H4 (T 21.0, 04→05):** plate schematic; tag `// контроль` + headline `['Кто [контролирует]', 'работу агента?']` fully in; `ui.schema(ctx, { dev: 1, devStop: 1, agent: 1, agentLabel: 'агент', tools: 1 })`; the frozen wild arrows (dashed, 60 % sig) exactly as shot 04 leaves them; the «выполнение остановлено» chip. Shots 04 and 05 are one agent's work: share the frozen-arrow geometry through a function copied verbatim into both files.

---

## 01 instant-result: Мгновенный результат

T 0 to 5, interface, first shot.

### Composition
Headline zone: tag `// ai-кодинг` (x 80, y 300) and `['AI уже пишет [код]']`. Stage: the app at G1. Over the app, for 1.5–2.5 s, a developer prompt card and three code cards; they leave before the search result.

### Forms
- App: `ui.app` at G1. Starts **without** the search bar (`search: 0`), four rows.
- Prompt card: `ui.panel` x 130, y 1150, 820×140, r 24, fill panelHi, stroke hairHi; `ui.user` s 64 at (190, 1220); a small mono label «разработчик» 22 px txtFaint at (240, 1196); the typed request «Добавь поиск по обращениям» Inter 500 34 px txt at (240, 1246) with an orange caret; a round send button r 30 at (888, 1220) (panelTop fill, `send` icon; turns sig on send).
- Agent response: the agent mark `ui.agent` s 72 at (540, 700) with glow, and three code cards centred at x 540, 520×76, r 16, at y centres 800, 890, 980: file icon + mono 28 file name + a green mono «+N» on the right: «SearchBar.tsx +24», «TicketList.tsx +8», «useSearch.ts +16». No code text.
- The orange line: `ui.arrow` from the prompt card top (540, 1150) up to the bottom card (540, 1018), lw 4, glow at the tip.

### Motion
- T 0.00–0.50: the app grows out of the dark — scale 0.94 → 1 about (540, 970), alpha 0 → 1 (outExpo); an orange scan line (2 px sig + glow) sweeps the window top → bottom over the same half second; rows cascade in (`rows` 0.2 → 1 by T 0.6). Frame 0 already shows the scan line at the window top and a 15 % window outline — never a black frame.
- T 0.50: tag types in; headline rises in (`ui.headline(..., T − 0.5)`).
- T 0.50: prompt card slides up 30 px + fades in over 6 frames; typing starts at 21 cps (`ui.typed(str, T, 0.5, 21)`), done by 1.75.
- T 2.00: send — button flashes sig (pop), the orange line draws 2.00 → 2.25 (outCubic); the agent mark pops at 2.0 (state 'busy').
- T 2.25 / 2.50 / 2.75: the three code cards pop (outBack, 4 frames) bottom → top.
- T 3.00–3.25: prompt card, cards, line and agent mark fly into the app's search slot (scale 0.6, move to y 800, fade) while `search` goes 0 → 1 (outCubic) — the search field lands in the app.
- T 3.25–3.625: `query` types «вход» on 16ths (`ui.typed('вход', T, 3.25, 8)`), `focus` 1.
- T 4.00–4.25: `filter` 0 → 1 (the other three rows collapse); `mark` 0 → 1 over 4.125–4.375; a thin sig ring pulse around the found row (#1043) at 4.0 (expands 12 px and fades over 8 frames).
- T 4.25–5.0: hold H1 (caret blinking).

### Camera
Locked. The plate drifts (`oy: −T*12`).

### Enter and exit
Enter from black. Exit = H1.

### Subject
Result is fast: request → code → working search in ~3.5 s. Search finds exactly one ticket.

### Sound
0.0 swell (air in); 0.5–1.75 typing clicks; 2.0 send click + music lift starts; 2.25/2.5/2.75 card blips; 3.0 search whoosh; 3.25–3.625 four key clicks; 4.0 found chime.

---

## 02 price-of-done: Цена слова «готово»

T 5 to 10, interface, hard cut from H1.

### Composition
Starts as H1. Ends as H2: the agent mark centred, wired to three tool cards (files, terminal, app); the app is now the small right card.

### Forms
- Green badge «✓ Готово»: `ui.chip` Inter 600 30 px, icon check, color ok, fill okTint, stroke ok, right-aligned at (956, 590) straddling the app's top edge, green glow.
- Tool cards, wires, agent mark and the question badge Q exactly as H2.

### Motion
- T 5.00: the green badge pops (outBack, 4 frames) with a green glow flash (alpha 0.6 → 0.2 over 12 frames). Holds.
- T 6.50: headline 1 and its tag exit (`out` over 0.25 s).
- T 6.50–8.50: **pull-back.** Draw the H2 layout in world space under `L.camera`; zoom goes from z0 = 880/280 = 3.1429 to 1 in log space (inOutCubic) while the camera centre goes from (860, 1147.8) to (540, 960) — at z0 the app card (720, 1030, 280) fills exactly G1, so frame 6.50 equals H1. Files and terminal cards slide into view as the camera widens; the agent mark comes in from above.
- T 7.00 / 7.50 / 8.00: wires to files / terminal / app draw on (outCubic, 6 frames) with a glowing tip; each card's border flashes sig once as its wire lands.
- T 7.00: tag `// доступ` + headline `['А что агенту', '[разрешено?]']` rise in.
- T 7.25–8.25: the green badge leaves the app card (screen space) and travels on an arc to Q's centre (668, 694), shrinking to a circle.
- T 8.50: the badge turns into Q: green → orange over 4 frames, «Готово» collapses, «?» pops (outBack); Q glows.
- T 8.50–10.0: hold H2; Q breathes gently (glow alpha 0.35 ↔ 0.5 on beats).

### Camera
Pull-back 6.5 → 8.5 as above; locked otherwise.

### Enter and exit
Enter = H1 exactly (at T 5.0 with the badge not yet popped). Exit = H2.

### Subject
The agent is not just a code writer: it has tools — files, terminal, the app itself.

### Sound
5.0 «Готово» stab; 6.5 the lift cuts dead, low layer enters + pull-back whoosh; 7.0/7.5/8.0 low clicks; 8.5 question tone.

---

## 03 one-wrong-step: Конкретный риск

T 10 to 15, interface, hard cut from H2.

### Composition
Left: the file tree at G3 (x 80, y 600, w 560). Right/bottom: the operation card. Everything framed by the red danger frame from 12.5.

### Forms
- Tree: `ui.tree(ctx, 80, 600, 560, { hi, danger })`; row 0 is `src/` (centre y 722).
- Agent pointer: `ui.cursor` s 48 in sig with a small name tag to its lower right — a pill with `ui.agent` s 26 + «агент» mono 22 (like a multiplayer cursor).
- Operation card: `ui.panel` x 400, y 1030, 600×250, r 24, fill panel, stroke sig, glow sig 0.4; inside: `trash` icon 40 px sig at (452, 1092), «удалить папку» Inter 700 38 px sig at (488, 1105); a mono 32 px command line «rm -rf src/» txt at (452, 1172) on a panelHi strip; bottom-right a button-like pill «Выполнить ↵» (panelTop fill, hairHi stroke, Inter 600 28) centred at (880, 1238) — the cursor stops just before it.
- Danger frame: 4 px danger rounded rect x 56, y 572, 968×736, r 36; a chip «Без подтверждения?» (icon warn, Inter 700 30 px, color danger, fill dangerTint, stroke danger) straddling its top edge at x 80.

### Motion
- T 10.00–10.50: push-in through the files card: draw H2 under `L.camera`, zooming from 1 into the files card (80, 1030, 280) until it becomes the tree panel at G3 (inOutCubic). The files card's content is the same tree, so the zoom lands on `ui.tree` at G3. Agent mark, other cards, wires and Q slide off with the camera and fade by 10.375; tag/headline of 02 exit at 10.0 over 0.2 s.
- T 10.50: tag `// риск` + headline `['Один [неверный шаг]']`.
- T 10.75–11.25: the agent pointer glides in from (1060, 1500) to the `src/` row (tip at (330, 730)), outCubic; `hi: 0` from 11.25 (orange tint).
- T 11.50: the operation card pops (outBack 4 frames) with a sig line from the pointer to the card (`ui.arrow`, 6 frames).
- T 11.75–12.35: the pointer moves toward «Выполнить ↵» and stops 40 px short (tip at (812, 1224)) — it never clicks.
- T 12.50: **stop-frame**: the danger frame and its chip snap on (1 frame, no ease), `danger` 0 → 1 over 3 frames (src subtree tints red), the operation card's stroke turns danger, the headline accent turns danger; a one-frame 18 % white flash; the whole stage (not tag/headline) punches in 1.00 → 1.015 over 3 frames and holds. From here **nothing moves** except the danger frame's glow breathing slowly (alpha 0.75 ↔ 1, 1 cycle per 2 beats).
- Nothing is ever deleted: all tree rows stay visible to the end.

### Camera
Push-in 10.0–10.5; locked after; 1.5 % punch at 12.5.

### Enter and exit
Enter = H2. Exit = the frozen danger state (H3 is shot 04's own t = 0; the 0.25 s fade blends them).

### Subject
Risk shown concretely and honestly: the agent is one keystroke from deleting `src/` without confirmation. Nothing is actually deleted.

### Sound
10.0 zoom whoosh; 10.75 glide tick; 11.5 tense blip; 12.5 everything cuts + muffled beep; 12.5–13.0 held silence; low drone after.

---

## 04 who-controls: Главный вопрос

T 15 to 21, schematic, `transitionIn: fade 0.25` (add to the timeline — owned by the director; already assumed).

### Composition
The canonical schema: developer on top (G4 DEV), agent in the middle (G4 AGENT), three tool nodes at the bottom (G4 TOOLS). Uncontrolled arrows spray out of the agent.

### Forms
- `ui.schema(ctx, { dev, devStop, agent, agentLabel: 'агент', tools })`.
- Developer → agent arrow: `ui.arrow` [[540, 688], [540, 818]] txtDim lw 3.
- Wild arrows: 7 free curves (`ui.bezier` + `ui.arrow`, sig lw 3, heads 16) from the agent (540, 895) — three toward the tools but overshooting/missing (ending 30–90 px off the node), four strays toward the frame edges (e.g. (1060, 760), (30, 1010), (1000, 1480), (80, 560)). Control points wobble with seeded noise on twos while live.
- Stop state: `devStop` on the DEV node; a chip «выполнение остановлено» (icon stop, mono 24, sig, fill sigTint, stroke sigDeep) under the DEV node, centred (540, 724).

### Motion
- t 0–0.25 (T 15.0–15.25): fade in from shot 03 (core). The tree at G3 with `danger` 1 → 0 by 15.25.
- T 15.00–16.00: plate crossfades interface → schematic (draw both, schematic alpha 0 → 1); the tree panel shrinks (rect interpolation, inOutCubic) into the files node (220, 1300, 250×92), its rows fading out by 15.5 and the node's icon + «files» fading in 15.75–16.0.
- T 15.50: tag `// контроль` + headline `['Кто [контролирует]', 'работу агента?']`.
- T 15.50 / 15.75 / 16.00: DEV node, agent, terminal + app nodes pop (`ui.schema` values from `ui.kf`); dev → agent arrow draws at 15.75.
- T 16.00–17.50: wild arrows fire one after another on irregular 16ths (16.0, 16.125, 16.375, 16.5, 16.75, 17.0, 17.25), each drawing on over 6 frames and then *re-drawing* (a second scribble) — the agent acts faster than anyone watches. Agent mark in state 'busy', eyes looking around (`look` on twos).
- T 17.50: `devStop` 0 → 1 (pop); the arrows **freeze** where they are: from here each is dashed 14/10, alpha 0.6, heads still, no wobble. The chip «выполнение остановлено» pops at 17.625. Agent blinks once (17.75).
- T 18.50–21.0: mechanical pulse: on every beat the frozen dashes step (lineDashOffset += 6) and a faint ring (sig 25 %) expands from the agent over 8 frames. Otherwise still. End = H4.

### Camera
Locked (the tree→node shrink is a rect interpolation, not a camera move).

### Enter and exit
Enter: fade from shot 03. Exit = H4.

### Subject
Developer → agent → files, terminal, app; without a system around it, the agent's actions are uncontrolled. The developer can stop execution — but who decides what the agent may do?

### Sound
15.0 whoosh; 15.5/15.75/16.0 clicks; 16.0–17.5 glitch zips; 17.5 tape-stop + silence to 18.5; 18.5 pulse starts.

---

## 05 engineering-frame: Инженерная рамка

T 21 to 27, schematic, hard cut from H4.

### Composition
The four rings around the core, the tools below, clean routes with gates. Headline on top.

### Forms
`ui.schema(ctx, { dev, devStop, agent: 1, agentLabel, core, rings: [..4], ringGlow: [..4], tools: 1, toolsActive, routes, gates, pulse })`, plus shot 04's frozen arrows while they dissolve.

### Motion
- T 21.00: starts as H4. DEV node + stop chip + dev arrow fade out 21.0–21.25. `core` draws on 21.0–21.375 around the agent; the label switches «агент» → «модель» at 21.125 (crossfade 3 frames).
- T 21.00: tag/headline of 04 exit (0.2 s); T 21.50 tag `// ai engineering` + headline `['AI Engineering =', '[система вокруг модели]']`.
- T 21.50 / 22.50 / 23.50 / 24.50: ring 1 → 4 draw on (`rings[i]` 0 → 1 over 10 frames, outExpo; the tab pops with the start); each ring glows orange on arrival (`ringGlow[i]` 1 → 0 over 0.5 s).
- As each ring lands, a share of the frozen arrows dissolves (alpha → 0 over 6 frames): after ring 4 none remain.
- T 25.00–25.75: `routes` 0 → 1 (outCubic) — clean orange routes from the core to the tools; `gates` 0 → 1 over 25.25–25.75; each tool node's `toolsActive[i]` → 1 as its route arrives (≈ 25.6).
- T 26.00–27.0: `pulse: T` — signal dots travel core → tools on each beat. Hold.

### Camera
Locked.

### Enter and exit
Enter = H4. Exit: hard cut.

### Subject
AI Engineering = the system around the model: task & context, tools, permissions, checks. Orange now marks allowed routes.

### Sound
21.0 soft click; 21.5/22.5/23.5/24.5 layer clicks rising; 25.0 sweep + warm pad.

---

## 06 control-in-action: Контроль в действии

T 27 to 33, interface, hard cut.

### Composition
One big rules panel «Правила агента» on the stage, the agent token travelling down a track through three rule rows; a confirmation request pops up at the end.

### Forms
- Panel: `ui.panel` x 90, y 580, 900×720, r 28. Header: `shield` icon 40 px sig at (146, 646), «Правила агента» Inter 700 40 px at (186, 660); chip «пример настройки» (mono 22, txtDim, fill panelHi, stroke hair) right-aligned at (950, 648); under it the limits line «лимит: 20 шагов · 5 мин» mono 26 txtDim at (146, 714).
- Track: a vertical hair line (2 px hairHi) at x 150 from y 760 to 1240.
- Rows (x 190–950, h 130, r 20, fill panelHi), centres y 820, 970, 1120:
  1. `eye` icon, «Читать файлы» Inter 600 36; status chip «можно» with icon check (sig on sigTint).
  2. `pencil` icon, «Изменять файлы»; status chip «подтверждение» with icon `send`/arrow (sig outline).
  3. `trash` icon, «Удалять»; status chip «запрещено» with icon `block` (danger on dangerTint); a red barrier bar (danger, 6 px, 80 px wide) across the track at y 1060.
- Agent token: `ui.agent` s 64 on the track (x 150).
- Confirmation request: `ui.panel` x 170, y 1120, 740×210, r 24, stroke sig, glow; `ui.user` s 52 at (222, 1172); «Подтвердите действие» Inter 700 32 at (262, 1182); mono 28 «агент: rm -rf src/» txtDim at (222, 1240); two pills at y 1290: «Отклонить» (sig fill, bg text) and «Разрешить» (panelHi, txtDim) — the developer's decision is not shown; the dialog simply asks.

### Motion
- T 27.00: panel slides up 40 px + fades (6 frames); header in. T 27.25: tag `// правила` + headline `['Доступ. Лимиты.', '[Подтверждение.]']`.
- T 27.50 / 28.50 / 29.50: rows 1 / 2 / 3 slide in from the right (outCubic, 6 frames) — row 3 brings the barrier.
- Token: at (150, 740) from 27.25; moves (outCubic, 8 frames) to row 1 by T 28.0 → row 1 tints sig 15 %, its chip pops (warm click). 28.5–29.0 moves to row 2 → row 2 tints, the chip «подтверждение» pulses once. 29.75–30.5 moves toward row 3 and hits the barrier at 30.5: recoil up 24 px (outBack), token state 'blocked', a 4-frame shake on twos, the barrier flashes; row 3 chip pops.
- T 31.00: the confirmation request pops (outBack, 4 frames) over rows 2–3 area bottom; everything else dims to 70 %.
- T 31.0–33.0: hold; the request's glow breathes once per bar.

### Camera
Locked; plate drift.

### Subject
Example of a setup (not a universal guarantee): read — allowed, change — with confirmation, dangerous actions stopped; the dangerous attempt becomes a question to the developer.

### Sound
27.0 soft whoosh; 28.0, 29.0 warm clicks; 30.5 dull stop; 31.0 notification.

---

## 07 verify: Проверяем результат

T 33 to 39, interface, hard cut.

### Composition
Top of the stage: the execution history (4 big steps). Bottom: the app slides back in, compact, and proves the search works; a green test badge.

### Forms
- History panel: `ui.panel` x 90, y 572, 900×396, r 28; mono 24 txtFaint «история выполнения» at (130, 618). Steps at y centres 676, 752, 828, 904 (h 76): a node on a vertical line at x 146 (circle r 16: hollow hairHi before, filled sig with a check after), text Inter 600 36 at x 186 (txtFaint before → txt after): «Прочитал файлы», «Предложил изменения», «Получил подтверждение» (+ a tiny `ui.user` s 30 after the text), «Проверил поиск».
- Compact app: `ui.app` at x 162, y 1000, w 756 (scale 0.859), clipped to the design's top 400 px (window y 1000–1344) with its bottom edge fading into panel — shows title bar, header, search, first row.
- Test badge: `ui.chip` «тест: поиск находит обращение» icon check, Inter 600 28, ok on okTint, stroke ok, right-aligned at (918, 984) straddling the compact app's top edge, green glow.

### Motion
- T 33.00: history panel in (6 frames); T 33.25: tag `// проверка` + headline `['Видно, что сделал агент.', 'Видно, [что работает.]']`.
- Steps light at T 33.50, 34.50, 35.25, 35.75 (accelerating): node fills sig with a pop, text brightens, the connecting line segment to the next node draws on.
- T 36.00: the compact app slides in from the right (x 1100 → 162, outCubic, 8 frames), `search: 1`, `focus: 1`, empty query.
- T 36.50–37.00: `query` types «оплат» (`ui.typed('оплат', T, 36.5, 10)`).
- T 37.25–37.50: `filter` 0 → 1; T 37.50: `mark` → 1 and the test badge pops (outBack) with a green glow flash; step 4's node flashes green once.
- T 37.5–39.0: hold.

### Camera
Locked; plate drift.

### Subject
After changes — a check. The history makes every step visible; the test proves the feature works.

### Sound
33.0 rhythm accelerates; 33.5/34.5/35.25/35.75 ticks; 36.0 whoosh; 36.5–37.0 five key clicks; 37.5 resolving chord.

---

## 08 real-project: Это можно разобрать самому

T 39 to 45, interface (opens on the schematic plate), hard cut.

### Composition
Opens on the full schema (shot 05's end state, calmer). The camera pulls back: the schema turns out to be a sheet lying over the real React project. The schema thins to an overlay, and a card frames the readable app.

### Forms
- Schema: `ui.schema(ctx, { agent: 1, agentLabel: 'модель', core: 1, rings: [1,1,1,1], tools: 1, toolsActive: [1,1,1], routes: 1, gates: 1, pulse: T })`.
- Project: `ui.app` (unfiltered: `search: 1`, empty query, four rows).
- Lesson card (final): `ui.panel` x 104, y 604, 872×736, r 32, fill panel, stroke hairHi; inside, the app at x 144, y 640, w 792 (h 684 → 1324). Chips on the card's top edge (y 604): «Бесплатный урок» (Inter 700 28, bg text on sig fill) at x 136 and «React · TypeScript» (mono 24, txt, fill panelHi, stroke hairHi) right after it.
- **No** portrait, video player, play button, REC or timecode. (If real lesson footage is supplied later, the editor can place it in the app rect x 144, y 640, 792×684 from T 41.0.)

### Motion
- T 39.00–39.50: schema holds, pulses running; plate schematic.
- T 39.50–41.00: pull-back: under `L.camera`, zoom 1 → 0.9 while the app fades in *under* the schema (alpha 0 → 1 over 39.5–40.25) at a world rect that lands on the final card app rect; the plate crossfades schematic → interface; the schema's alpha goes 1 → 0.22 and its line widths thin; the schema ends as a faint overlay exactly over the app.
- T 40.00: tag `// бесплатный урок` + headline `['Бесплатный урок.', '[Реальный проект.]']`.
- T 41.00: the lesson card frame draws on around the app (outCubic, 8 frames) and the chips pop (41.0, 41.125).
- T 41.5: the overlay fades to 0.12 so the app is fully readable by 42.0 («настоящем»); hold to 45.0 with pulses slowed (every bar).

### Camera
Pull-back 39.5–41.0.

### Subject
The engineering frame is not abstract: the lesson builds it on a real React project.

### Sound
39.0 music opens up; 39.5 whoosh; 41.0 soft impact + shimmer.

---

## 09 whats-inside: Содержание и аудитория

T 45 to 52, schematic, hard cut.

### Composition
Two sequential cards. Card 2 holds three labelled blocks that assemble into a loop with the exact shape of ring 2 (600×410, r 42) centred at (540, 1060). A source folder enters from the frame edge.

### Forms
- Card 1 «Готовый агент»: `ui.panel` x 100, y 640, 880×300, r 28; mono 24 sig «шаг 1» at (144, 700); `ui.agent` s 90 at (200, 810); «Готовый агент» Inter 700 48 at (280, 828).
- Card 1 compact (after 46.5): a pill x 100, y 572, 880×72: check icon sig + «Готовый агент» Inter 600 30 + mono 22 «шаг 1» right.
- Card 2 «Свой агент на TypeScript»: `ui.panel` x 100, y 664, 880×676, r 28; mono 24 sig «шаг 2» at (144, 722); title `['Свой агент на [TypeScript]']` Inter 700 44 at (144, 790) (use `ui.rich`).
- Loop: ring 2 shape centred (540, 1060): x 240, y 855, 600×410, r 42 (`ui.ringPts`), drawn in sig with an orange signal dot circulating once per bar after assembly.
- Blocks (`ui.node`, 250×88, Inter 600 30): «модель» (icon: agent mark via `ui.agent` s 40 drawn inside, or icon `spark`), «инструменты» (icon terminal), «цикл» (icon loop). Final positions on the loop: модель at (540, 855) (top centre), инструменты at (840, 1060) (right centre), цикл at (240, 1060) (left centre).
- Source folder: chip with `folder` icon 40 px + «Запись + исходный код» Inter 600 28, fill panelHi, stroke sig — slides in from the left edge to x 124, y 1296 (inside card 2, bottom-left).

### Motion
- T 45.00: card 1 pops (6 frames). T 45.25: tag `// для кого` + headline `['Для JavaScript /', '[TypeScript]-разработчиков']`.
- T 46.50: card 1 collapses up into the compact pill (outCubic, 8 frames); card 2 rises in from y + 60 (outCubic).
- T 47.00 / 47.50 / 48.00: the three blocks pop in a row at y 1010: x 270, 540, 810.
- T 48.50: the folder chip slides in from x −420 (outCubic, 8 frames).
- T 49.00 / 49.50 / 50.00: blocks move (outBack, 6 frames) onto their loop positions — модель at 49.0, инструменты at 49.5, цикл at 50.0; the loop outline draws on 49.0–50.25 through them.
- T 50.25–52.0: an orange signal dot circulates the loop clockwise (one lap per bar), each block's border flashing sig as the dot passes.
- T 51.5–52.0: gentle push-in on the whole stage (zoom 1 → 1.03) into the fade.

### Camera
Locked, final push 51.5–52.0.

### Subject
The lesson's path: first a ready-made agent, then your own on TypeScript — model, tools, loop. For people who already write code; the recording and the source code are included.

### Sound
45.0 click; 46.5 swoosh; 47.0/47.5/48.0 clicks; 48.5 slide; 49.0/49.5/50.0 snaps; circulating shimmer; 51.5 rise.

---

## 10 cta: Переход на форму

T 52 to 60, interface, `transitionIn: fade 0.5` (in the timeline). `post.grain` 0.6.

### Composition
Centred, calm. Background: the app, very faint (alpha 0.10, blurred 4 px) at G1, static. Foreground stack centred on x 540.

### Forms
- Tag `// бесплатный урок` centred (x = 540 − its width/2; draw with `ui.tag` at that x), y 330.
- Headline `['От AI-кодинга', 'к [AI Engineering]']`, Inter 800 92 px, centred (`ui.headline({ align: 'center', x: 540, y: 470, size: 92 })`) → baselines ≈ 470 and 571.
- Subline «Бесплатный урок + исходный код», Inter 500 42 px txtDim, centred at y 680.
- A 160 px hair divider centred at y 780 (optional).
- «Забрать бесплатный урок», Inter 700 50 px txt, centred at y 1060.
- Orange arrow `ui.arrow` [[540, 1092], [540, 1172]], lw 5, headSize 22, glow 0.5.
- Sticker zone G10: `ui.corners(ctx, 270, 1190, 540, 160, { color: sig, alpha: 0.85, len: 30 })`. **Nothing inside.**

### Motion
- T 52.00–52.50: fade in from 09 (core).
- T 52.25: tag + headline rise in. T 52.75: subline fades up. T 53.25: «Забрать бесплатный урок» rises in. T 53.50–53.875: the arrow draws on; the corner ticks draw in (8 frames).
- **T 54.00 → 60.00: completely static.** No pulses, no drift (plate `oy` fixed), no blinking.

### Camera
Locked.

### Subject
One clear action: take the free lesson + source code; the link is the native Instagram sticker placed in the zone.

### Sound
52.0 final phrase; 53.5 arrow blip; 55.0 resolve; calm chord to 60.
