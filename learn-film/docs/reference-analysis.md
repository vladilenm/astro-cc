> **EXAMPLE — the analysis that fixed the house style** (paper plate vs blueprint plate, hard cuts, synthesised sound landing on cuts). A new film in the house style skips this document entirely.
> Run the same method only when the user names a different look: step through the reference video in a browser at roughly 1-second intervals, take written notes only (no saved frames), and finish with a numbered "Style rules to carry over" list. That list then rewrites art-bible sections 1–9 before planning continues.

# Reference analysis: Kevin Ngo, "The life of a fruit fly"

Source: https://x.com/kevin_t_ngo/status/2099858454043349342 (posted 15 Sep 2026, 633K views).
Analysed 16 Sep 2026 by stepping through the video in a browser at roughly 1-second intervals.
No frames were saved; everything below is a written description.

## What the author said about how it was made

The author describes the piece as one HTML file in which Claude Opus 5 drew every frame with JavaScript on a canvas and composed the music and sound effects, also in JavaScript.
Each of his pieces was built by showing the model his previous piece as the reference.
He credits the model's habit of writing a lot of code for the density of detail, and keeps the cutting fast because slower cutting stops reading as animation.

## Format

1080x1080 square, 27 seconds, music and sound effects throughout.
Our version is 1080x1920 vertical (YouTube Shorts), so compositions must be re-thought for a tall frame, not cropped.

## Shot-by-shot (approximate times)

| Time | Mode | What is on screen |
|---|---|---|
| 0.0-1.2 | Illustrated | Cold open on the hero: adult fly standing on an orange's peel, huge in frame. Background of wide diagonal cream and pale-yellow stripes. A small dew droplet sits on the peel. |
| 1.2-2.0 | Schematic | Cut to near-black navy. A single tiny white star-burst spark in the middle. The beginning. |
| 2.0-6.0 | Schematic | Blueprint of the egg: a long rounded capsule drawn with a double pale-lavender outline, filled with a fine hexagonal cell lattice. Two paddle-shaped filaments rise from the top. Two glowing nuclei with short radial ticks (cell division). Behind: a faint large concentric circle, long diagonal guide lines crossing the frame, a small measurement bracket in a corner. |
| 6.0-7.0 | Schematic | Same egg, camera pushed in. The lattice becomes a dense dotted stipple (the larva forming). A segmented bar-chart-like glyph appears top right. Magenta radiating lines burst from the bottom end: hatching. |
| 7.0-9.0 | Illustrated | The larva: a translucent white segmented body with ruled segment lines, a faint orange gut line, black mouth hooks. It crawls diagonally across a warm tan field of rounded pebble-like cells (fruit flesh or yeast), each cell outlined in brown ink with hatched shading. It chews into one cell, crumbs scatter. |
| 9.0-10.0 | Schematic | The pupa as a dark rounded-rectangle outline. Inside, a tangled cellular network (the metamorphosis soup). Thin curved lines radiate outward to small circular nodes, like a network diagram. |
| 10.0-12.0 | Illustrated | Back on the orange. The adult fly stands beside its empty puparium, a dark brown case with the lid popped open. Diagonal stripe background returns. |
| 12.0-13.0 | Illustrated macro | Extreme close-up of the compound eye: a circle of hexagonal facets outlined in brown hatching. The facets are tinted yellow, cream and dark, and together form a coarse mosaic picture of what the fly sees. |
| 13.0-14.0 | Schematic | Nervous system cross-section: two large oval eyes left and right with pale blue fibre bundles converging in the middle, small coloured organ circles. |
| 14.0-16.0 | Illustrated | Top-down: a teal-rimmed plate with white rim dots, a halved peach, a cluster of purple grapes, a banana, on a wood-grain table with hatched shadows. The fly flies over it. Thin coloured annotation arcs (magenta, blue, yellow) trace its flight. |
| 16.0-18.0 | Illustrated | Camera pulls back. The plate is at the frame edge, a large circular object with radial spokes (a ceiling fan or lamp seen from below), long straight black lines crossing, the fly small with a thin blue trajectory line and circular motion rings. |
| 18.0-19.0 | Illustrated | The fly next to a dense cross-hatched mass on the wood. Red radiating arcs and a red arrow: a smell or danger cue. |
| 19.0-21.0 | Illustrated | Courtship. Two flies face to face on the peel surface, red eyes. One vibrates a wing and concentric yellow and pink rings pulse out (the wing song). Background at the top: a window with the sun in a frame, a pink sunset band. |
| 21.0-23.0 | Illustrated | Egg laying. The female deposits white egg capsules in a row. The window sun is setting; a purple band of sky. |
| 23.0-24.5 | Illustrated | Night. Purple sky with stars, a crescent moon with rays, the window frame, and tally marks scratched on the wall counting the days. The fly rests beside a row of eggs. |
| 24.5-26.0 | Illustrated | Morning. A green leaf with hatched veins. A large dew drop on it acts as a fisheye lens, refracting the window and a fly inside it. A young fly at left, the orange at the bottom right, the sun with drawn rays in the window. Big faint construction arcs overlay the whole frame. |
| 26.0-27.0 | Schematic | Back to the egg blueprint from the start, two nuclei glowing: the cycle loops. A thin rounded lowercase wordmark bottom right. |

## Measured: the cadence and the grain

Drawn on twos at 24 fps: frame-to-frame difference alternates large, small, large, small for the whole 27 s.
On the paper shots the held frame still differs by about 0.3 to 1.4 average luma levels, so a fine grain changes every frame.
On the navy schematic shots the held frame differs by 0.01 to 0.08, the encoder's own noise floor, so those plates are frozen.
Our house style re-seeds the grain at 12 fps on both plates instead, so the two frames of a pair are one identical image (art bible 4.3).
That is a deliberate difference from the reference, not an oversight.

Measured 17 Sep 2026 with:

```bash
ffmpeg -i fly.mp4 -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null -
```

## Style rules to carry over

1. **Two alternating visual modes.** Warm hand-illustrated scenes and cool scientific-blueprint scenes, cut against each other roughly every 1 to 2.5 seconds. The schematic shots explain what is happening inside; the illustrated shots show the life.
2. **Illustrated mode.**
   Cream paper base with visible grain.
   Dark brown ink outlines, slightly irregular, sometimes doubled.
   Tone is built from directional hatching (parallel strokes clipped to the shape) and cross-hatching for shadow, not from gradients.
   Flat, muted, warm colours: orange, tan, ochre, dusty rose, sage green, teal.
   Faint construction lines extend past the forms.
   Wide diagonal stripes as a recurring background device.
3. **Schematic mode.**
   Deep navy background, thin pale lavender and white linework at partial opacity.
   Hexagonal cell lattices, stippled fills, glowing star-like nuclei with radial ticks.
   Guide geometry behind everything: large faint circles, long diagonal lines, measurement brackets and ticks.
   One hot accent colour (magenta) reserved for moments of change.
4. **Motion-graphic overlays on illustrations.** Thin coloured circles, arcs, rings and straight guide lines drawn over the illustrated scenes to show flight paths, sound, smell and attention.
5. **Editing.**
   Hard cuts, fast.
   Match cuts on shape (the egg outline in schematic cuts to the real egg).
   Push-ins to macro (the eye) and pull-backs to reveal scale (plate to table to room).
   Time passing is shown with a window motif (sun, sunset, moon) and tally marks.
   The film ends where it began, so it loops.
6. **Density.** Every frame is busy with fine detail: hundreds of hatch strokes, lattice cells, grain. The author credits the model's tendency to write a lot of code for the quality.
7. **Animation feel.** Snappy, not floaty. Movement reads like drawn animation.
8. **Sound.** Music and effects are synthesised in JavaScript and land on the cuts.
