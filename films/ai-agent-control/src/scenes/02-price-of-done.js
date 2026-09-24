// STUB
// Placeholder for shot 02 'price-of-done' (illustrated). The scene agent replaces this whole file.
FILM.scene({
  id: 'price-of-done',
  draw(ctx, t, info) {
    const L = info.lib, P = L.pal;
    const p = L.clamp(t / info.dur);
    const q = L.clamp(L.onTwos(t) / info.dur);
    const seed = L.hash('price-of-done');
    L.paper(ctx);
    L.inkPath(ctx, L.ellipsePts(540, 860, 300, 400, 72), { closed: true, width: 5, seed: seed + 1, double: true });
    L.inkLine(ctx, 140, 1300, 940, 1300, { width: 3, seed: seed + 2 });
    L.inkCircle(ctx, 240 + 600 * q, 1230, 44, { width: 3, seed: seed + 3, fill: P.orange });
    L.text(ctx, 'STUB 02', 540, 330, { size: 60, weight: 600, align: 'center', color: P.annMagenta });
    L.text(ctx, info.shot.title || 'price-of-done', 540, 1420, { size: 44, align: 'center', color: P.ink });
    L.text(ctx, 'price-of-done', 540, 1480, { size: 30, align: 'center', color: P.inkSoft });
    if (p > 0.01) L.inkLine(ctx, 140, 1530, 140 + 800 * p, 1530, { width: 4, color: P.annBlue, seed: seed + 4, taper: 0 });
  },
});
