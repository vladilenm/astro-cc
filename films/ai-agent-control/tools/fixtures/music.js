// Fixture score for testing render.cjs: kick, hats, pad, bells on cues, generated reverb.
(function () {
  const FILM = window.FILM;
  FILM.audio = {
    render(ctx, opts) {
      const start = (opts && opts.start) || 0;
      const dest = (opts && opts.dest) || ctx.destination;
      const TL = FILM.TIMELINE;
      const beat = 60 / TL.bpm;
      const now = ctx.currentTime;
      const at = (T) => now + (T - start);
      const end = FILM.DURATION;
      const rnd = FILM.lib.rng('fixture-music');

      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(dest);
      // reverb from a seeded, decaying noise impulse
      const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 2.2), ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < d.length; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      }
      const verb = ctx.createConvolver();
      verb.buffer = ir;
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      verb.connect(wet);
      wet.connect(master);

      const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noise.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;

      for (let T = 0; T < end - 1e-6; T += beat) {
        if (T + 0.3 < start) continue;
        const w = Math.max(now, at(T));
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.setValueAtTime(140, w);
        o.frequency.exponentialRampToValueAtTime(42, w + 0.18);
        g.gain.setValueAtTime(0.9, w);
        g.gain.exponentialRampToValueAtTime(0.001, w + 0.3);
        o.connect(g).connect(master);
        o.start(w);
        o.stop(w + 0.32);
        const hT = T + beat / 2;
        if (hT < start || hT >= end) continue;
        const hs = ctx.createBufferSource();
        hs.buffer = noise;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 7000;
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0.18, at(hT));
        hg.gain.exponentialRampToValueAtTime(0.001, at(hT) + 0.05);
        hs.connect(hp).connect(hg).connect(master);
        hs.start(at(hT), rnd() * 0.5, 0.06);
      }
      const chords = [[220, 277.2, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6]];
      TL.shots.forEach((s, i) => {
        if (s.end <= start) return;
        const t0 = Math.max(now, at(s.start)), t1 = at(s.end);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.05, t0 + 0.08);
        g.gain.setValueAtTime(0.05, t1 - 0.06);
        g.gain.linearRampToValueAtTime(0.0001, t1);
        lp.connect(g);
        g.connect(master);
        g.connect(verb);
        for (const f of chords[i % chords.length]) {
          for (const det of [-7, 7]) {
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = f;
            o.detune.value = det;
            o.connect(lp);
            o.start(t0);
            o.stop(t1 + 0.01);
          }
        }
      });
      for (const cue of TL.cues) {
        if (cue.t < start) continue;
        const w = at(cue.t);
        [880, 1320, 1760].forEach((f, k) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.12 / (k + 1), w);
          g.gain.exponentialRampToValueAtTime(0.0005, w + 1.2);
          o.connect(g);
          g.connect(master);
          g.connect(verb);
          o.start(w);
          o.stop(w + 1.25);
        });
      }
    },
  };
})();
