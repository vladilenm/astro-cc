// Fixture scene: schematic egg. Exercises blueprint, capsule, hexLattice, glowDot, ticks, bracket, camera.
FILM.scene({
  id: 'fx-egg',
  draw(ctx, t, info) {
    const L = info.lib, P = L.pal;
    L.blueprint(ctx, { seed: 8, center: [540, 900] });
    const zoom = L.mapRange(t, 0, info.dur, 1, 1.12, 'inOutSine');
    L.camera(ctx, { x: 540, y: 900, zoom }, () => {
      const egg = L.capsulePts(540, 900, 820, 250, Math.PI / 2, 96);
      L.hexLattice(ctx, egg, { r: 20, color: P.lavender, alpha: 0.42, seed: 3 });
      L.inkPath(ctx, egg, { closed: true, color: P.lavender, width: 3, double: { offset: 9, alpha: 0.55, width: 0.6, from: 0, to: 1 }, seed: 4 });
      const split = L.seg(t, 0.4, 1.4, 'outBack') * 120;
      for (const s of [-1, 1]) {
        const y = 900 + s * split;
        L.glowDot(ctx, 540, y, 18, { rays: 8, rot: t * 0.6 });
        L.ticks(ctx, 540, y, { r: 46, n: 16, len: 10, color: P.lineWhite, alpha: 0.6 });
      }
      L.bracket(ctx, 290, 490, 290, 1310, { offset: -70, label: '1.2 mm', color: P.lavender });
    });
    const burst = L.seg(t, 1.5, 2.0, 'outExpo');
    if (burst > 0) {
      L.ticks(ctx, 540, 1320, { r: 40 + burst * 60, n: 28, len: 40 + burst * 120, color: P.magenta, alpha: 1 - burst * 0.6, width: 2.5 });
    }
    L.text(ctx, 'ovum', 90, 1530, { size: 40, color: P.lavender, alpha: 0.85 });
  },
});
