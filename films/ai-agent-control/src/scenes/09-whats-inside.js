// STUB
// Placeholder for shot 09 'whats-inside' (schematic). The scene agent replaces this whole file.
FILM.scene({
  id: 'whats-inside',
  draw(ctx, t, info) {
    const L = info.lib, P = L.pal;
    const p = L.clamp(t / info.dur);
    L.blueprint(ctx);
    L.guideCircle(ctx, 540, 860, 340, { alpha: 0.4 });
    L.glowDot(ctx, 540, 860, 10 + 8 * p, { rays: 12, rot: p * Math.PI });
    L.text(ctx, 'STUB 09', 540, 330, { size: 60, weight: 600, align: 'center', color: P.magenta });
    L.text(ctx, info.shot.title || 'whats-inside', 540, 1420, { size: 44, align: 'center', color: P.lavender });
    L.text(ctx, 'whats-inside', 540, 1480, { size: 30, align: 'center', color: P.lavender, alpha: 0.6 });
    ctx.fillStyle = P.lineWhite;
    ctx.fillRect(140, 1526, 800 * p, 6);
  },
});
