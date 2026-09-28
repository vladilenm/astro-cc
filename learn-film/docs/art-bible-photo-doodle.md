# Art bible: <FILM TITLE> — photo-doodle mode

The house style. Sections 1 to 8 are decided: change the numbers a film genuinely needs (the tints it
uses, the floor line, the cast's sizes) and leave the rules alone. Section 9 is this film's own.

This is the proven version from a finished film — fifteen objects, a snail who finishes last. Where
it names that film's cast or shot numbers, swap in yours.

## 1 Frame and safe area

- 1080 × 1080, 24 fps. Square, full bleed, no border.
- Safe area x 60 to 1020, y 70 to 1000. Must-read text and faces stay inside it.
- Ground line: most shots put the object's base on y 880 to 960, so objects stand on a floor rather
  than float. The floor itself is a single loose ink line, drawn edge to edge, slightly off level.

## 2 Plates and palette

Every shot is a **paper plate**: `lib.paper(ctx, { color, seed })` with a per-shot tint, plus its grain
and vignette. There is no blueprint plate in this mode. Night shots use the **night plate** (`pal.paperNight`),
where ink becomes chalk and the washes are dropped — every `FILM.props` and `FILM.cast` call in those
shots takes `night: true`.

Paper tints (one named per shot in the storyboard): `paperMint`, `paperPink`, `paperButter`,
`paperSky`, `paperCream`, `paperLilac`, `paperPeach`, `paperSage`, `paperNight`.

Ink: `pal.doodleInk` #26221D. Night ink: `pal.chalk` #F1EDE2.

Washes, always translucent and never used as a line colour: `washYellow`, `washPink`, `washBlue`,
`washGreen`, `washLilac`, `washRed`, `washCream`, `washBrown`.

All of the names above ship in `lib.pal` already — they are the mode's house colours, not per-film
ones, so scenes read them with no wiring. Your film adds only its **cast colours** to the subject
palette block in `src/lib.js` (one or two per character, plus the shared `blush`), and section 2.2
below is where you write them down.

**Two washes per shot, three at most.** A shot with four pigments stops looking like one hand drew it.

## 3 The line

Every stroke goes through `lib.inkPath` (directly, or through `FILM.props` / `FILM.cast`).

| Role | width | example |
|---|---|---|
| Hero outline (a character's body, the object's added parts) | 3.4 to 4 | shell, cloud |
| Secondary (props, scenery) | 2.6 to 3 | pole, ladder, ground line |
| Detail (whiskers, ticks, hatch) | 1.8 to 2.4 | stalk, rain |

Defaults: `wobble: 1.6`, `tremble: 0.4`, boil on (12 fps). Never set `boil: false` except for a shape
that must not move between drawings. Closed shapes carry `overlap` past their start — that scruffy
pen-past-the-corner is the look.

Hatching (`lib.hatch`) is allowed for shade under a cloud, inside a crate, under a hat brim. Keep it
to one direction, alpha 0.3 to 0.45.

## 4 Washes

`lib.wash(ctx, pts, { color, alpha, seed, offset, spread, p })`.

- Alpha 0.45 to 0.6. Offset 3 to 5 px off the ink outline, never centred: the mis-registration is the look.
- The wash arrives **after** its outline: its `p` runs over 4 to 6 frames starting when the outline
  finishes drawing.
- A wash never has its own hard edge. `edge` stays at the default.

## 5 Photos

`lib.photo(ctx, id, cx, baseY, { h, rot, scale, shadow, alpha })`, positioned by bottom-centre.

- One photo per shot (shot 16 is the exception: all 15 as cards).
- The photo occupies 40 to 65 percent of the frame height. It is the set, not a prop: doodles hang off
  it, stand on it, climb it, come out of it.
- Entrance: the photo scales from 0.92 to 1 over 5 frames at the shot's first frame, with the shadow
  scaling with it. After that it holds still unless the storyboard says it moves.
- Contact shadow `shadow: 0.38` by default; raise to 0.5 on pale paper.
- Photos are never drawn over by a wash. Ink may cross them; pigment stays off them.

## 6 Draw-on and motion

- **Draw-on:** a shot's doodles are drawn in the first 0.75 to 1.1 s, staggered, not one at a time.
  Two to four elements are drawing at any moment. `cast.step(d, i, n)` gives element i of n its slice.
- **Then it acts:** the remaining time is movement — a character travels, rain falls, a flag waves,
  a face changes. A shot that only draws and then holds is a failed shot.
- **On twos:** characters and props move at 12 fps (`lib.onTwos(t)`); the photo and the paper are not
  re-sampled.
- **Text:** `lib.hand` with `p` for a letter-by-letter reveal, about 14 letters per second. Sound words
  are lowercase except the loud ones ("PAAARP!", "FINISH"). One or two text elements per shot, never more.
- **Pop:** an element that lands on a beat uses a 3-drawing pop: scale 0.72, 1.08, 1.

## 7 Continuity

- **A through-line the eye can follow.** One motif in nearly every shot. In the worked film it is the
  snail's shimmer trail (`props.trail`), entering from the left edge and ending at his tail — it is
  what makes sixteen separate frames read as one film.
- **A mark on the hero.** A hand-lettered number, a hat, a scarf: one identifying detail, established
  early and present from then on.
- **Where the hero sits in frame.** Give the storyboard a per-shot x so the character advances across
  the film. Never the exact same position twice running.
- **Sky furniture.** Decide which shots carry a sun, which carry nothing and which carry a moon, and
  let the sun sink shot by shot. It is the cheapest way to show a day passing.

## 7b Density — the standard the film is judged against

The reference this film matches builds a small world per photo: 10 to 20 distinct doodle elements
around one object — the character, a second character reacting, the thing they are using, scenery that
explains the place, weather or atmosphere, a sound word, and small details.

- **8 to 15 elements per shot**, and the storyboard's Forms list is the minimum, not the maximum.
- **Nothing important below 40 px.** Pim reads at 100 to 160 px long.
- **Never dark ink on a dark part of a photo.** Over dark areas, `pal.chalk` at width 4 or more,
  checked on a rendered frame rather than in the head.
- **Pigment is present**, not implied: most non-photo elements carry a wash.
- **Three things moving at any moment** once the draw-on is done.

Shot 11 is the one deliberate exception: it is sparse because the emptiness is the point.

## 8 Mistakes to avoid

| Mistake | Instead |
|---|---|
| Doodles floating with no relation to the photo | Every doodle touches, hangs from, stands on or points at the object |
| Drawing the whole scene, then nothing moves | Draw in the first second, act for the rest |
| Four or more wash colours | Two, three at a push |
| A wash exactly filling its outline | Offset it 3 to 5 px and let it run over the line |
| Text in the middle of the frame covering the object | Text sits in the paper space above or beside the object |
| The cast redrawn per scene with its own geometry | Always `FILM.cast.<name>` |
| Pigment painted over a photo | Pigment on paper only |
| A character standing in mid-air | Feet on the floor line or on the object |
| The hero at the same x as the shot before | The hero advances across the film |

## 9 Subject reference

*This film's own section. Fill it before any scene is written.*

### 9.1 The story

*Two or three sentences: what happens, and the feeling at the end.*

### 9.2 The cast (drawn only through `FILM.cast`)

*One line per character: colours, poses, size range, what they are for.*

### 9.3 The objects and what each one becomes

| Shot | Photo id | Becomes |
|---|---|---|
| 01 | *hourglass* | *The start clock. Sand falling = the countdown* |

*The right-hand column is the film. "A teapot, with steam" is not an idea; "the teapot is the rest
stop, and its steam becomes a face that looks at him" is.*

### 9.4 How each real object behaves

*From step 2. One line each, so the doodles stay truthful: steam leaves a spout and widens as it
rises; a trumpet sounds at the bell, not the valves; pine-cone scales overlap upward like roof tiles.*

### 9.5 Sizes, for a consistent world

*At 1080 square with the object 480 to 700 px tall: the hero at s 0.55 to 0.9, secondary characters
0.5 to 0.8, text 42 to 58 (one sound word may reach 80), sun 60 to 80 r, clouds 180 to 260 wide.*

### 9.6 The sign-off

*The end card: a grid of every shot's photo, then the wordmark, both hand-lettered. Name the cards'
size, the pop cadence and the last line. Thumbnails of photos drawn large elsewhere go through an
offscreen canvas at 1:1 — see step 1b.*

### 9.7 Mistakes to avoid

*Extend section 8's table with this film's own traps, each paired with the correct drawing.*
