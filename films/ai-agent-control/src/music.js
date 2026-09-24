// music.js : the score and sound design of the film.
// Owner: music. Contract: docs/CONTRACT.md, section Audio.
//
// FILM.audio.render(ctx, { start = 0, dest = ctx.destination }) schedules the whole piece,
// music and effects, from global time `start` into any BaseAudioContext.
// Every sound is synthesised here: oscillators, periodic waves, seeded noise, filters, envelopes,
// a ping-pong delay, convolver reverbs on generated impulse responses, a glue compressor and a
// soft limiter. Randomness comes only from FILM.lib.rng, seeded per event, so any start time
// schedules the same notes at the same global times.
//
// The engine, instruments, effects and master chain below are film-agnostic. Per film the music
// agent replaces three things: the CH chord table, the MIX.ride section automation, and the whole
// score() function — composing against FILM.TIMELINE.bpm and FILM.TIMELINE.cues so hits land on
// the cuts. What ships here is a demo score that gives the stub pass a pulse; see the skill's
// reference/music.md before composing.
(function () {
  'use strict';
  const FILM = window.FILM;
  const lib = FILM.lib;
  const TAU = Math.PI * 2;
  const FLOOR = 1e-5;

  // DynamicsCompressorNode delays its output by a fixed 6 ms look-ahead (measured: 288 samples at
  // 48 kHz). Every event before the compressor is scheduled that much early, so it leaves the master
  // exactly on its cue. Only an event inside the first 6 ms of a render window can land late.
  const LAT = 0.006;

  // Mix constants, tuned by measurement (tools/audio): loudness, peaks, per-bar profile.
  const MIX = {
    trim: 1.05,
    ceiling: 0.66, // soft limiter output ceiling (about -3.6 dBFS)
    knee: 0.5,
    bus: { drums: 0.6, perc: 0.8, bass: 0.3, pad: 0.26, keys: 0.6, bells: 0.45, lead: 0.5, sfx: 0.62, amb: 0.5 },
    // Master tilt EQ in dB: a low shelf under the subs, presence and air for phone speakers.
    eq: { low: -4, presence: 5, air: 3 },
    comp: { threshold: -18, knee: 10, ratio: 2, attack: 0.006, release: 0.2 },
    // Section fader rides in dB at global times, pre-compressor. The whole piece is a bed under a
    // voice-over, so it sits well below a solo mix; the rides only shape the acts and fade the final
    // chord to silence by 59.8 (the seam then meets the opening air swell from silence).
    ride: [[0, -7], [6.45, -7], [6.5, -6], [37.0, -6], [37.5, -5], [44.5, -5], [46.0, -6], [56.5, -6], [58.0, -12], [59.2, -26], [59.8, -70]],
  };

  // ---------------------------------------------------------------- pitch
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) {
    if (typeof n === 'number') return n;
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    const midi = 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ---------------------------------------------------------------- envelopes
  // pts: [[dt, value, shape]] with dt from the note start; shape is the ramp INTO that point:
  // 'lin' (default), 'exp' or 'set'. The first point must sit at dt 0.
  // When the voice started before the render window (skip > 0) the value at `skip` is computed
  // and automation resumes from there, so a seek hears the same envelope.
  function setEnv(param, pts, c0, skip) {
    let i;
    let prev;
    if (skip > 0) {
      let v = pts[0][1];
      for (i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        if (skip < b[0]) {
          const f = (skip - a[0]) / Math.max(1e-9, b[0] - a[0]);
          const sh = b[2] || 'lin';
          if (sh === 'set') v = a[1];
          else if (sh === 'exp' && a[1] > 0) v = a[1] * Math.pow(Math.max(b[1], FLOOR) / a[1], f);
          else v = a[1] + (b[1] - a[1]) * f;
          break;
        }
        v = b[1];
      }
      param.setValueAtTime(v, c0 + skip);
      prev = v;
    } else {
      param.setValueAtTime(pts[0][1], c0);
      prev = pts[0][1];
      i = 1;
    }
    for (; i < pts.length; i++) {
      const v = pts[i][1];
      const sh = pts[i][2] || 'lin';
      const w = c0 + pts[i][0];
      if (sh === 'set') {
        param.setValueAtTime(v, w);
        prev = v;
      } else if (sh === 'exp' && prev > 0) {
        param.exponentialRampToValueAtTime(Math.max(v, FLOOR), w);
        prev = Math.max(v, FLOOR);
      } else {
        param.linearRampToValueAtTime(v, w);
        prev = v;
      }
    }
  }

  // Percussive amplitude envelope: attack then exponential decay to silence.
  const perc = (vel, att, dec) => [[0, 0], [att, vel], [att + dec, FLOOR, 'exp']];

  // ---------------------------------------------------------------- generated buffers
  function noiseBuffer(ctx, secs, channels, seed) {
    const n = Math.floor(secs * ctx.sampleRate);
    const buf = ctx.createBuffer(channels, n, ctx.sampleRate);
    for (let ch = 0; ch < channels; ch++) {
      const r = lib.rng(lib.hash('film-noise', seed, ch));
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
    }
    return buf;
  }

  // Impulse response: seeded stereo noise, exponential decay to -60 dB at `secs`, a two-pole
  // lowpass that darkens over the tail, a pre-delay and a few early reflections.
  function impulse(ctx, secs, seed, o) {
    const sr = ctx.sampleRate;
    const n = Math.floor(secs * sr);
    const buf = ctx.createBuffer(2, n, sr);
    const pre = Math.floor(o.pre * sr);
    const tail = secs - o.pre;
    for (let ch = 0; ch < 2; ch++) {
      const r = lib.rng(lib.hash('film-ir', seed, ch));
      const d = buf.getChannelData(ch);
      let l1 = 0;
      let l2 = 0;
      for (let i = pre; i < n; i++) {
        const t = (i - pre) / sr;
        const u = t / tail;
        const env = Math.exp(-6.9 * u) * (t < 0.005 ? t / 0.005 : 1);
        const a = o.bright + (o.dark - o.bright) * Math.sqrt(u);
        l1 += a * (r() * 2 - 1 - l1);
        l2 += a * (l1 - l2);
        d[i] = l2 * env;
      }
      for (let k = 0; k < o.early; k++) {
        const i = pre + Math.floor((0.003 + r() * o.spread) * sr);
        if (i < n) d[i] += (r() * 2 - 1) * 0.35 * (1 - k / o.early);
      }
    }
    return buf;
  }

  // Grains rendered straight into a stereo buffer: band-passed noise flaps and clicks, or short sines.
  // g: { t, dur, amp, pan (-1..1), f, q, att, dec, sine }
  function grainBuffer(ctx, key, secs, grains) {
    const sr = ctx.sampleRate;
    const n = Math.max(1, Math.ceil(secs * sr));
    const buf = ctx.createBuffer(2, n, sr);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    const r = lib.rng(lib.hash('film-grain', key));
    for (const g of grains) {
      const i0 = Math.floor(g.t * sr);
      const m = Math.floor(g.dur * sr);
      const gl = Math.cos(((g.pan + 1) * Math.PI) / 4);
      const gr = Math.sin(((g.pan + 1) * Math.PI) / 4);
      const att = g.att || 0.002;
      const dec = g.dec || g.dur * 0.3;
      const w = (TAU * g.f) / sr;
      const al = Math.sin(w) / (2 * (g.q || 1));
      const cw = Math.cos(w);
      const a0 = 1 + al;
      let x1 = 0;
      let x2 = 0;
      let y1 = 0;
      let y2 = 0;
      const ph = r() * TAU;
      for (let k = 0; k < m; k++) {
        const j = i0 + k;
        if (j >= n) break;
        const tt = k / sr;
        let s;
        if (g.sine) s = Math.sin(ph + w * k);
        else {
          const x = r() * 2 - 1;
          s = (al * x - al * x2 + 2 * cw * y1 - (1 - al) * y2) / a0;
          x2 = x1;
          x1 = x;
          y2 = y1;
          y1 = s;
        }
        const env = tt < att ? tt / att : Math.exp(-(tt - att) / dec);
        const tailFade = k > m - 64 ? (m - k) / 64 : 1;
        const v = s * env * tailFade * g.amp;
        if (j >= 0) {
          L[j] += v * gl;
          R[j] += v * gr;
        }
      }
    }
    return buf;
  }

  // Stick-slip creak: irregular pulses, each ringing three damped wooden resonances.
  function creakBuffer(ctx, key, secs, rate0, rate1, formants) {
    const sr = ctx.sampleRate;
    const n = Math.ceil(secs * sr);
    const buf = ctx.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    const r = lib.rng(lib.hash('film-creak', key));
    let t = 0.004;
    while (t < secs - 0.01) {
      const u = t / secs;
      const swell = Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.55 + 0.45 * r());
      const i0 = Math.floor(t * sr);
      for (const [f, tau, a] of formants) {
        const m = Math.min(n - i0, Math.floor(tau * 5 * sr));
        const fj = f * (0.94 + 0.12 * r());
        for (let k = 0; k < m; k++) d[i0 + k] += swell * a * Math.exp(-k / sr / tau) * Math.sin((TAU * fj * k) / sr);
      }
      const rate = rate0 + (rate1 - rate0) * u;
      t += (1 / rate) * (0.7 + 0.6 * r());
    }
    for (let k = 0; k < 96 && k < n; k++) d[n - 1 - k] *= k / 96;
    return buf;
  }

  // Soft limiter transfer curve. The shaper is fed at half level, so the curve covers inputs up to
  // +6 dBFS: linear to the knee, then a tanh shoulder that never passes the ceiling.
  function limiterCurve(ceiling, knee) {
    const n = 16385;
    const c = new Float32Array(n);
    const room = ceiling - knee;
    for (let i = 0; i < n; i++) {
      const x = ((i / (n - 1)) * 2 - 1) * 2;
      const a = Math.abs(x);
      const y = a <= knee ? a : knee + room * Math.tanh((a - knee) / room);
      c[i] = x < 0 ? -y : y;
    }
    return c;
  }

  function periodic(ctx, n, amp) {
    const real = new Float32Array(n + 1);
    const imag = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) imag[k] = amp(k);
    return ctx.createPeriodicWave(real, imag);
  }

  // ---------------------------------------------------------------- engine
  function makeEngine(ctx, start, dest, DUR, MIX) {
    const base = ctx.currentTime;
    const E = { ctx, sr: ctx.sampleRate, start, base, DUR, duckTargets: [] };

    // A voice is a note or effect that starts at global time t0 and lasts len seconds (release included).
    // A sustained voice whose compensated start falls before the window resumes mid-envelope on time.
    // A short voice that starts inside the first 6 ms plays whole, up to 6 ms late; one that began
    // earlier is skipped.
    E.w0 = -Infinity;
    E.w1 = Infinity;
    E.voice = function (t0, len, sustain) {
      if (t0 < E.w0 || t0 >= E.w1) return null; // belongs to another scheduling window
      if (t0 >= DUR || t0 + len <= start) return null;
      const c = base + (t0 - start) - LAT;
      let c0 = c;
      let skip = 0;
      if (c < base) {
        if (sustain) skip = base - c;
        else if (t0 >= start) c0 = base;
        else return null;
      }
      return {
        c0,
        skip,
        len,
        env: (param, pts) => setEnv(param, pts, c0, skip),
        osc(node, stopDt) {
          node.start(c0 + skip);
          node.stop(c0 + Math.max(stopDt === undefined ? len : stopDt, skip + 0.002));
          return node;
        },
        buf(node, offset, stopDt) {
          const d = node.buffer.duration;
          let off = (offset || 0) + skip;
          if (node.loop) off %= d;
          else if (off >= d) return node;
          node.start(c0 + skip, off);
          node.stop(c0 + Math.max(stopDt === undefined ? len : stopDt, skip + 0.002));
          return node;
        },
      };
    };

    E.gain = (v) => {
      const g = ctx.createGain();
      g.gain.value = v === undefined ? 1 : v;
      return g;
    };
    E.osc = (type, f) => {
      const o = ctx.createOscillator();
      if (typeof type === 'string') o.type = type;
      else o.setPeriodicWave(type);
      o.frequency.value = f;
      return o;
    };
    E.filt = (type, f, q) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q === undefined ? 0.707 : q;
      return b;
    };
    E.panner = (p) => {
      const s = ctx.createStereoPanner();
      s.pan.value = p;
      return s;
    };
    E.rng = (...k) => lib.rng(lib.hash('film-score', ...k));

    // ---- master: highpass, glue compressor, trim, soft limiter, output fades
    const master = E.gain(1);
    const hp = E.filt('highpass', 26, 0.6);
    const lowShelf = E.filt('lowshelf', 140, 0.7);
    lowShelf.gain.value = MIX.eq.low;
    const presence = E.filt('peaking', 3000, 0.7);
    presence.gain.value = MIX.eq.presence;
    const air = E.filt('highshelf', 8000, 0.7);
    air.gain.value = MIX.eq.air;
    const comp = ctx.createDynamicsCompressor();
    for (const k in MIX.comp) comp[k].value = MIX.comp[k];
    const trim = E.gain(MIX.trim * 0.5);
    const lim = ctx.createWaveShaper();
    lim.curve = limiterCurve(MIX.ceiling, MIX.knee);
    lim.oversample = 'none';
    const out = E.gain(1);
    master.connect(hp);
    hp.connect(lowShelf);
    lowShelf.connect(presence);
    presence.connect(air);
    air.connect(comp);
    comp.connect(trim);
    trim.connect(lim);
    lim.connect(out);
    out.connect(dest);
    E.master = master;
    // Output fades sit after the compressor, so they use uncompensated times. The compressor's
    // first 6 ms are silent; the output then opens over 3 ms, and the last 10 ms taper to zero, so the
    // loop seam and every seek start without a click.
    out.gain.setValueAtTime(0, base);
    out.gain.setValueAtTime(0, base + LAT);
    out.gain.linearRampToValueAtTime(1, base + LAT + 0.003);
    const cEnd = base + (DUR - start);
    if (DUR - start > 0.05) {
      out.gain.setValueAtTime(1, cEnd - 0.01);
      out.gain.linearRampToValueAtTime(0, cEnd);
    }
    // Section rides on the master input, compensated like every other pre-compressor event.
    setEnv(master.gain, MIX.ride.map(([t, d], i) => [t, Math.pow(10, d / 20), i ? 'lin' : undefined]), base - start - LAT, start + LAT);

    // ---- shared buffers
    E.white = noiseBuffer(ctx, 2.5, 1, 'white');
    E.wide = noiseBuffer(ctx, 5, 2, 'wide');
    E.warmSaw = periodic(ctx, 48, (k) => Math.pow(k, -1.35) * (k > 24 ? Math.exp(-(k - 24) / 10) : 1));
    E.softSquare = periodic(ctx, 31, (k) => (k % 2 ? Math.pow(k, -1.5) : 0.04 / k));
    E.brassSaw = periodic(ctx, 40, (k) => Math.pow(k, -1.05));

    // ---- effects returns
    E.fx = {};
    const verb = (name, secs, o, ret) => {
      const c = ctx.createConvolver();
      c.buffer = impulse(ctx, secs, name, o);
      const g = E.gain(ret);
      c.connect(g);
      g.connect(master);
      E.fx[name] = c;
    };
    verb('room', 0.9, { pre: 0.006, bright: 0.55, dark: 0.18, early: 10, spread: 0.035 }, 0.9);
    verb('hall', 2.8, { pre: 0.018, bright: 0.45, dark: 0.09, early: 14, spread: 0.07 }, 0.9);
    verb('cave', 6.0, { pre: 0.03, bright: 0.35, dark: 0.05, early: 18, spread: 0.12 }, 0.85);

    // Ping-pong delay, a dotted 8th (0.375 s) each side.
    const dIn = E.gain(1);
    dIn.channelCount = 1;
    dIn.channelCountMode = 'explicit';
    const dL = ctx.createDelay(1);
    const dR = ctx.createDelay(1);
    dL.delayTime.value = 0.375;
    dR.delayTime.value = 0.375;
    const fL = E.filt('lowpass', 4200, 0.5);
    const fR = E.filt('lowpass', 3400, 0.5);
    const gL = E.gain(0.4);
    const gR = E.gain(0.4);
    dIn.connect(dL);
    dL.connect(fL);
    fL.connect(gL);
    gL.connect(dR);
    dR.connect(fR);
    fR.connect(gR);
    gR.connect(dL);
    const mrg = ctx.createChannelMerger(2);
    fL.connect(mrg, 0, 0);
    fR.connect(mrg, 0, 1);
    const dRet = E.gain(0.75);
    mrg.connect(dRet);
    dRet.connect(master);
    const dVerb = E.gain(0.25);
    dRet.connect(dVerb);
    dVerb.connect(E.fx.hall);
    E.fx.delay = dIn;

    // ---- buses
    E.bus = {};
    // Per-voice sends pass through a tap scaled by the bus gain, so a bus fader moves its reverb too.
    E.tap = {};
    const taps = (name) => {
      E.tap[name] = {};
      for (const k of ['room', 'hall', 'cave', 'delay']) {
        const g = E.gain(MIX.bus[name]);
        g.connect(E.fx[k]);
        E.tap[name][k] = g;
      }
    };
    const bus = (name, sends, duck, hpf) => {
      taps(name);
      const b = E.gain(MIX.bus[name]);
      let tail = b;
      if (hpf) {
        const h = E.filt('highpass', hpf, 0.6);
        tail.connect(h);
        tail = h;
      }
      if (duck) {
        const d = E.gain(1);
        b.connect(d);
        tail = d;
        E.duckTargets.push(d.gain);
      }
      tail.connect(master);
      for (const k in sends) {
        const s = E.gain(sends[k]);
        tail.connect(s);
        s.connect(E.fx[k]);
      }
      E.bus[name] = b;
    };
    // Drum bus: a gentle saturator adds harmonics so the kick reads on phone speakers.
    {
      const b = E.gain(MIX.bus.drums);
      const drive = E.gain(1.6);
      const sat = ctx.createWaveShaper();
      const curve = new Float32Array(2049);
      for (let i = 0; i < curve.length; i++) {
        const x = (i / (curve.length - 1)) * 2 - 1;
        curve[i] = Math.tanh(x * 1.4) / Math.tanh(1.4);
      }
      sat.curve = curve;
      const back = E.gain(0.72);
      b.connect(drive);
      drive.connect(sat);
      sat.connect(back);
      back.connect(master);
      const rs = E.gain(0.1);
      back.connect(rs);
      rs.connect(E.fx.room);
      E.bus.drums = b;
      taps('drums');
    }
    bus('perc', { room: 0.1 });
    bus('bass', {}, true);
    bus('pad', { hall: 0.22 }, true, 180);
    bus('keys', { room: 0.12, hall: 0.14, delay: 0.06 });
    bus('bells', { hall: 0.3, cave: 0.06, delay: 0.14 });
    bus('lead', { hall: 0.22, delay: 0.18 });
    bus('sfx', { room: 0.14 });
    bus('amb', { hall: 0.12 });

    // Route a voice's last node to a bus, with an optional pan and extra sends.
    E.out = (node, busName, o) => {
      o = o || {};
      let n = node;
      if (o.pan) {
        const p = E.panner(o.pan);
        n.connect(p);
        n = p;
      }
      n.connect(E.bus[busName]);
      for (const k of ['room', 'hall', 'cave', 'delay']) {
        if (o[k]) {
          const s = E.gain(o[k]);
          n.connect(s);
          s.connect(E.tap[busName][k]);
        }
      }
      return n;
    };

    // Looping noise source with a per-event deterministic read offset.
    E.noise = (V, key, stereo) => {
      const s = ctx.createBufferSource();
      s.buffer = stereo ? E.wide : E.white;
      s.loop = true;
      const off = ((lib.hash('film-nz', key) % 100003) / 100003) * s.buffer.duration;
      return V.buf(s, off);
    };

    // Sidechain-style pump: a decaying negative curve added to the pad and bass bus gains on a kick.
    const duckLen = 0.32;
    E.duckBuf = ctx.createBuffer(1, Math.floor(duckLen * E.sr), E.sr);
    {
      const d = E.duckBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / E.sr;
        d[i] = -(t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) / 0.085)) * (i > d.length - 48 ? (d.length - i) / 48 : 1);
      }
    }
    E.duck = (t, depth) => {
      const V = E.voice(t, duckLen, false);
      if (!V) return;
      const s = ctx.createBufferSource();
      s.buffer = E.duckBuf;
      for (const p of E.duckTargets) {
        const g = E.gain(depth);
        s.connect(g);
        g.connect(p);
      }
      V.buf(s, 0);
    };
    return E;
  }

  // ---------------------------------------------------------------- instruments
  function instruments(E) {
    const ctx = E.ctx;
    const I = {};

    // Felt, full, heartbeat or thud kick: a pitch-dropping sine with a short filtered click.
    I.kick = (t, vel, kind) => {
      const P = {
        felt: { f0: 125, f1: 50, fd: 0.055, dec: 0.36, click: 0.18, cf: 1600 },
        full: { f0: 165, f1: 47, fd: 0.065, dec: 0.5, click: 0.3, cf: 4200 },
        heart: { f0: 96, f1: 46, fd: 0.05, dec: 0.3, click: 0.16, cf: 1500 },
        thud: { f0: 95, f1: 52, fd: 0.04, dec: 0.2, click: 0.12, cf: 1200 },
      }[kind || 'felt'];
      const V = E.voice(t, P.dec + 0.03, false);
      if (!V) return;
      const o = E.osc('sine', P.f0);
      V.env(o.frequency, [[0, P.f0], [P.fd, P.f1, 'exp'], [P.dec, P.f1 * 0.92, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.002, vel], [0.06, vel * 0.75, 'exp'], [P.dec, FLOOR, 'exp']]);
      o.connect(g);
      E.out(g, 'drums');
      V.osc(o);
      const n = E.noise(V, ['kick', t]);
      const f = E.filt('lowpass', P.cf, 0.7);
      const cg = E.gain(0);
      V.env(cg.gain, perc(vel * P.click, 0.0008, 0.012));
      n.connect(f);
      f.connect(cg);
      E.out(cg, 'drums');
    };

    I.brush = (t, vel, pan) => {
      const V = E.voice(t, 0.26, false);
      if (!V) return;
      const n = E.noise(V, ['brush', t]);
      const f = E.filt('bandpass', 3000, 0.55);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.004, vel], [0.05, vel * 0.45, 'exp'], [0.24, FLOOR, 'exp']]);
      n.connect(f);
      f.connect(g);
      E.out(g, 'perc', { pan: pan || 0.12 });
      const o = E.osc('sine', 185);
      const og = E.gain(0);
      V.env(og.gain, perc(vel * 0.35, 0.002, 0.06));
      o.connect(og);
      E.out(og, 'drums');
      V.osc(o, 0.1);
    };

    I.hat = (t, vel, open) => {
      const len = open ? 0.22 : 0.055;
      const V = E.voice(t, len + 0.01, false);
      if (!V) return;
      const n = E.noise(V, ['hat', t]);
      const f = E.filt('highpass', 7200, 0.8);
      const f2 = E.filt('peaking', 10500, 1.2);
      f2.gain.value = 5;
      const g = E.gain(0);
      V.env(g.gain, perc(vel, 0.001, len));
      n.connect(f);
      f.connect(f2);
      f2.connect(g);
      E.out(g, 'perc', { pan: -0.25 });
    };

    I.shaker = (t, vel, pan) => {
      const V = E.voice(t, 0.09, false);
      if (!V) return;
      const n = E.noise(V, ['shaker', t]);
      const f = E.filt('bandpass', 6500, 1.1);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.01, vel], [0.075, FLOOR, 'exp']]);
      n.connect(f);
      f.connect(g);
      E.out(g, 'perc', { pan: pan || 0.3 });
    };

    I.crash = (t, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.55;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const n = E.noise(V, ['crash', t], true);
      const f = E.filt('highpass', 4800, 0.6);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [0.12, vel * 0.45, 'exp'], [dec, FLOOR, 'exp']]);
      n.connect(f);
      f.connect(g);
      E.out(g, 'perc', o);
    };

    // Woodblock tock or small wooden click.
    I.tock = (t, vel, f, o) => {
      o = o || {};
      const V = E.voice(t, 0.1, false);
      if (!V) return;
      const s = E.osc('sine', f * 1.5);
      V.env(s.frequency, [[0, f * 1.5], [0.006, f, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, perc(vel, 0.001, o.dec || 0.06));
      s.connect(g);
      E.out(g, o.bus || 'perc', o);
      V.osc(s);
      const tri = E.osc('triangle', f * 2.71);
      const tg = E.gain(0);
      V.env(tg.gain, perc(vel * 0.25, 0.001, 0.025));
      tri.connect(tg);
      E.out(tg, o.bus || 'perc', o);
      V.osc(tri, 0.05);
      const n = E.noise(V, ['tock', t, f]);
      const nf = E.filt('bandpass', Math.min(9000, f * 2.4), 2.5);
      const ng = E.gain(0);
      V.env(ng.gain, perc(vel * 0.5, 0.0005, 0.01));
      n.connect(nf);
      nf.connect(ng);
      E.out(ng, o.bus || 'perc', o);
    };

    // FM marimba: soft-mallet FM attack on the fundamental, the tuned 4th partial, a mallet thump.
    I.marimba = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || Math.min(2.2, Math.max(0.35, 1.5 * Math.sqrt(220 / f)));
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const c = E.osc('sine', f);
      const m = E.osc('sine', f);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * 1.4], [0.04, f * 0.04, 'exp'], [dec, FLOOR, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [dec, FLOOR, 'exp']]);
      c.connect(g);
      E.out(g, o.bus || 'keys', o);
      V.osc(c);
      V.osc(m);
      if (f * 4 < 16000) {
        const p = E.osc('sine', f * 4);
        const pg = E.gain(0);
        V.env(pg.gain, perc(vel * 0.22, 0.002, 0.12));
        p.connect(pg);
        E.out(pg, o.bus || 'keys', o);
        V.osc(p, 0.2);
      }
      const n = E.noise(V, ['mar', t, f]);
      const nf = E.filt('lowpass', 1400, 0.7);
      const ng = E.gain(0);
      V.env(ng.gain, perc(vel * 0.12, 0.001, 0.012));
      n.connect(nf);
      nf.connect(ng);
      E.out(ng, o.bus || 'keys', o);
    };

    // Kalimba: sine tine with a small pitch settle, an inharmonic overtone and a thumb click.
    I.kalimba = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.5;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const s = E.osc('sine', f);
      V.env(s.frequency, [[0, f * 1.007], [0.03, f, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.002, vel], [0.09, vel * 0.55, 'exp'], [dec, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, o.bus || 'keys', o);
      V.osc(s);
      if (f * 5.93 < 17000) {
        const p = E.osc('sine', f * 5.93);
        const pg = E.gain(0);
        V.env(pg.gain, perc(vel * 0.28, 0.001, 0.07));
        p.connect(pg);
        E.out(pg, o.bus || 'keys', o);
        V.osc(p, 0.12);
      }
      const h = E.osc('sine', f * 2);
      const hg = E.gain(0);
      V.env(hg.gain, perc(vel * 0.1, 0.002, 0.35));
      h.connect(hg);
      E.out(hg, o.bus || 'keys', o);
      V.osc(h, 0.5);
      const n = E.noise(V, ['kal', t, f]);
      const nf = E.filt('bandpass', 3300, 1.8);
      const ng = E.gain(0);
      V.env(ng.gain, perc(vel * 0.3, 0.0005, 0.008));
      n.connect(nf);
      nf.connect(ng);
      E.out(ng, o.bus || 'keys', o);
    };

    // Glockenspiel: free-bar partial ratios, higher partials die first.
    I.glock = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.8;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const parts = [
        [1, 1, 1],
        [2.756, 0.3, 0.35],
        [5.404, 0.11, 0.14],
        [8.933, 0.05, 0.06],
      ];
      for (const [ratio, a, d] of parts) {
        if (f * ratio > 18000) continue;
        const s = E.osc('sine', f * ratio);
        const g = E.gain(0);
        V.env(g.gain, perc(vel * a, 0.001, dec * d));
        s.connect(g);
        E.out(g, o.bus || 'bells', o);
        V.osc(s, dec * d + 0.02);
      }
    };

    // Glassy sine ping.
    I.glass = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.6;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const parts = [
        [1, 1, 1],
        [2, 0.12, 0.35],
        [3.01, 0.05, 0.18],
      ];
      for (const [ratio, a, d] of parts) {
        const s = E.osc('sine', f * ratio);
        const g = E.gain(0);
        V.env(g.gain, perc(vel * a, o.att || 0.003, dec * d));
        s.connect(g);
        E.out(g, o.bus || 'bells', o);
        V.osc(s, dec * d + 0.02);
      }
    };

    // FM bell: modulator at an inharmonic or harmonic ratio, index decaying with the note.
    I.fmBell = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 1.6;
      const ratio = o.ratio || 1.4;
      const idx = o.index || 3;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const c = E.osc('sine', f);
      const m = E.osc('sine', f * ratio);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * idx], [dec * 0.5, f * idx * 0.08, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const g = E.gain(0);
      V.env(g.gain, perc(vel, o.att || 0.002, dec));
      c.connect(g);
      E.out(g, o.bus || 'bells', o);
      V.osc(c);
      V.osc(m);
    };

    // Soft FM gong.
    I.gong = (t, f, vel, o) => {
      o = o || {};
      const dec = o.dec || 2.2;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const c = E.osc('sine', f);
      const m = E.osc('sine', f * 1.41);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * 0.3], [0.09, f * 2.2], [dec, f * 0.15, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const lp = E.filt('lowpass', 1900, 0.5);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.012, vel], [dec, FLOOR, 'exp']]);
      c.connect(lp);
      lp.connect(g);
      E.out(g, o.bus || 'bells', o);
      V.osc(c);
      V.osc(m);
    };

    // Metallic FM ting for the gold dots.
    I.ting = (t, f, vel, o) => I.fmBell(t, f, vel, Object.assign({ ratio: 3.51, index: 1.6, dec: 0.45 }, o || {}));

    // Warm detuned pad: two warm-saw voices per note, spread left and right, one shared lowpass.
    // o: att, rel, cut0, cut1 (cutoff at the start and at t1), q, sine (hushed sine pad), bus, sends
    I.pad = (t0, t1, notes, vel, o) => {
      o = o || {};
      const att = Math.min(o.att === undefined ? 0.25 : o.att, t1 - t0);
      const rel = o.rel === undefined ? 0.35 : o.rel;
      const hold = t1 - t0;
      const len = hold + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const lp = E.filt('lowpass', o.cut0 || 1200, o.q || 0.6);
      V.env(lp.frequency, [[0, o.cut0 || 1200], [hold, o.cut1 || o.cut0 || 1200, 'exp'], [len, (o.cut1 || o.cut0 || 1200) * 0.7, 'exp']]);
      const g = E.gain(0);
      const pts = [[0, 0], [att, vel, o.attShape || 'lin']];
      if (hold > att) pts.push([hold, vel * (o.sus === undefined ? 1 : o.sus), 'lin']);
      pts.push([len, 0, 'lin']);
      V.env(g.gain, pts);
      lp.connect(g);
      E.out(g, o.bus || 'pad', o);
      const per = 1 / Math.sqrt(notes.length * 2);
      notes.forEach((nm, i) => {
        const f = hz(nm);
        const sides = o.sine ? [0] : [-1, 1];
        for (const side of sides) {
          const s = E.osc(o.sine ? 'sine' : E.warmSaw, f);
          s.detune.value = side * (o.detune || 8) + (i % 2 ? 1.5 : -1.5);
          const sg = E.gain(per * (o.sine ? 1.4 : 1));
          const p = E.panner(side * (o.width === undefined ? 0.55 : o.width) * (i % 2 ? 0.8 : 1));
          s.connect(sg);
          sg.connect(p);
          p.connect(lp);
          V.osc(s);
        }
      });
    };

    // Sub bass: sine with a little 2nd and 3rd harmonic so it survives small speakers.
    I.sub = (t0, t1, note, vel, o) => {
      o = o || {};
      const att = Math.min(o.att === undefined ? 0.008 : o.att, t1 - t0);
      const rel = o.rel === undefined ? 0.06 : o.rel;
      const hold = t1 - t0;
      const len = hold + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const f = hz(note);
      const g = E.gain(0);
      const pts = [[0, 0], [att, vel, o.attShape || 'lin']];
      if (hold > att) pts.push([hold, vel * (o.sus === undefined ? 0.85 : o.sus), 'lin']);
      pts.push([len, 0, 'lin']);
      V.env(g.gain, pts);
      const lp = E.filt('lowpass', 420, 0.5);
      for (const [k, a] of [
        [1, 1],
        [2, 0.3],
        [3, 0.1],
      ]) {
        const s = E.osc('sine', f * k);
        const sg = E.gain(a);
        s.connect(sg);
        sg.connect(lp);
        V.osc(s);
      }
      lp.connect(g);
      E.out(g, 'bass');
    };

    // Sub drop: a sine sweeping down under a hit.
    I.subDrop = (t, f0, f1, len, vel) => {
      const V = E.voice(t, len + 0.02, false);
      if (!V) return;
      const s = E.osc('sine', f0);
      V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.004, vel], [len * 0.5, vel * 0.7, 'lin'], [len, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, 'bass');
      V.osc(s);
    };

    // Warm pluck: warm saw plus soft square an octave up, a fast lowpass sweep.
    I.pluck = (t, note, vel, o) => {
      o = o || {};
      const f = hz(note);
      const dec = o.dec || 0.8;
      const V = E.voice(t, dec + 0.05, false);
      if (!V) return;
      const lp = E.filt('lowpass', 2000, o.q || 1.2);
      const top = Math.min(11000, f * (o.bright || 9));
      V.env(lp.frequency, [[0, top], [0.16, Math.max(180, f * 1.8), 'exp'], [dec, Math.max(150, f * 1.2), 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [0.14, vel * 0.45, 'exp'], [dec, FLOOR, 'exp']]);
      const a = E.osc(E.warmSaw, f);
      a.detune.value = -5;
      const b = E.osc(E.softSquare, f * 2);
      b.detune.value = 6;
      const bg = E.gain(0.35);
      a.connect(lp);
      b.connect(bg);
      bg.connect(lp);
      lp.connect(g);
      E.out(g, o.bus || 'keys', o);
      V.osc(a);
      V.osc(b);
    };

    // FM boop with an upward bend (the molts).
    I.boop = (t, note, vel, o) => {
      o = o || {};
      const f = hz(note);
      const V = E.voice(t, 0.32, false);
      if (!V) return;
      const c = E.osc('sine', f * 0.8);
      V.env(c.frequency, [[0, f * 0.8], [0.06, f, 'exp']]);
      const m = E.osc('sine', f * 1.6);
      V.env(m.frequency, [[0, f * 1.6], [0.06, f * 2, 'exp']]);
      const mg = E.gain(0);
      V.env(mg.gain, [[0, f * 2.2], [0.14, f * 0.2, 'exp']]);
      m.connect(mg);
      mg.connect(c.frequency);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.004, vel], [0.08, vel * 0.6, 'exp'], [0.3, FLOOR, 'exp']]);
      c.connect(g);
      E.out(g, 'keys', Object.assign({ room: 0.2 }, o));
      V.osc(c);
      V.osc(m);
    };

    // Detuned, band-passed saw stab.
    I.stab = (t, notes, vel, o) => {
      o = o || {};
      const len = o.len || 0.22;
      const V = E.voice(t, len + 0.02, false);
      if (!V) return;
      const bp = E.filt('bandpass', o.f || 1500, 1.4);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [len, FLOOR, 'exp']]);
      bp.connect(g);
      E.out(g, 'keys', o);
      for (const nm of notes) {
        for (const d of [-14, 14]) {
          const s = E.osc('sawtooth', hz(nm));
          s.detune.value = d;
          const sg = E.gain(0.5 / notes.length);
          s.connect(sg);
          sg.connect(bp);
          V.osc(s);
        }
      }
    };

    // Continuous FM lead with glides and delayed vibrato. phrase: [[t, note, glide]]
    I.lead = (phrase, tEnd, vel, o) => {
      o = o || {};
      const t0 = phrase[0][0];
      const rel = o.rel || 0.3;
      const len = tEnd - t0 + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const pitch = ctx.createConstantSource();
      const pp = [[0, hz(phrase[0][1])]];
      const vib = [[0, 0]];
      for (let i = 1; i < phrase.length; i++) {
        const dt = phrase[i][0] - t0;
        const gl = Math.max(0.005, phrase[i][2] || 0);
        pp.push([dt, hz(phrase[i - 1][1]), 'set']);
        pp.push([dt + gl, hz(phrase[i][1]), 'exp']);
      }
      for (let i = 0; i < phrase.length; i++) {
        const a = phrase[i][0] - t0;
        const b = (i + 1 < phrase.length ? phrase[i + 1][0] : tEnd + rel) - t0;
        const f = hz(phrase[i][1]);
        vib.push([a, 0, 'set']);
        if (b - a > 0.35) {
          vib.push([a + 0.18, 0, 'set']);
          vib.push([Math.min(b, a + 0.45), f * 0.008, 'lin']);
          vib.push([b, f * 0.008, 'lin']);
        }
      }
      V.env(pitch.offset, pp);
      const c = E.osc('sine', 0);
      const m = E.osc('sine', 0);
      const sub = E.osc('triangle', 0);
      pitch.connect(c.frequency);
      const mr = E.gain(1);
      pitch.connect(mr);
      mr.connect(m.frequency);
      const sr = E.gain(0.5);
      pitch.connect(sr);
      sr.connect(sub.frequency);
      const mg = E.gain(hz(phrase[0][1]) * 0.9);
      m.connect(mg);
      mg.connect(c.frequency);
      const lfo = E.osc('sine', 5.3);
      const vg = E.gain(0);
      V.env(vg.gain, vib);
      lfo.connect(vg);
      vg.connect(c.frequency);
      const lp = E.filt('lowpass', 3200, 0.8);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.012, vel], [tEnd - t0, vel * 0.9, 'lin'], [len, 0, 'lin']]);
      const sg = E.gain(0.35);
      c.connect(lp);
      sub.connect(sg);
      sg.connect(lp);
      lp.connect(g);
      E.out(g, 'lead', o);
      V.osc(pitch);
      V.osc(c);
      V.osc(m);
      V.osc(sub);
      V.osc(lfo);
    };

    // Synth horn: two brass saws with a filter swell per note and a scoop into pitch.
    I.horn = (phrase, tEnd, vel, o) => {
      o = o || {};
      const t0 = phrase[0][0];
      const rel = 0.25;
      const len = tEnd - t0 + rel;
      const V = E.voice(t0, len, true);
      if (!V) return;
      const pitch = ctx.createConstantSource();
      const pp = [];
      const cut = [];
      phrase.forEach(([t, nm], i) => {
        const dt = t - t0;
        const f = hz(nm);
        if (i === 0) pp.push([0, f * 0.97]);
        else pp.push([dt, f * 0.97, 'set']);
        pp.push([dt + 0.07, f, 'exp']);
        cut.push([dt, 300, i === 0 ? 'lin' : 'set']);
        cut.push([dt + 0.16, 2400, 'exp']);
        cut.push([dt + 0.45, 1500, 'exp']);
      });
      cut[0] = [0, 300];
      V.env(pitch.offset, pp);
      const lp = E.filt('lowpass', 300, 1.1);
      V.env(lp.frequency, cut);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.06, vel], [tEnd - t0, vel, 'lin'], [len, 0, 'lin']]);
      for (const d of [-7, 7]) {
        const s = E.osc(E.brassSaw, 0);
        s.detune.value = d;
        pitch.connect(s.frequency);
        const sg = E.gain(0.5);
        s.connect(sg);
        sg.connect(lp);
        V.osc(s);
      }
      lp.connect(g);
      E.out(g, 'lead', o);
      V.osc(pitch);
    };

    // Generic filtered noise: whooshes, sweeps, cracks, risers.
    // o: { type, f: env pts, q, amp: env pts, pan, panEnv, bus, sustain, stereo, sends }
    I.nz = (t, len, o) => {
      const V = E.voice(t, len, !!o.sustain);
      if (!V) return;
      const n = E.noise(V, ['nz', t, len, o.key || ''], !!o.stereo);
      const f = E.filt(o.type || 'bandpass', o.f[0][1], o.q || 0.8);
      V.env(f.frequency, o.f);
      const g = E.gain(0);
      V.env(g.gain, o.amp);
      n.connect(f);
      let last = f;
      if (o.type2) {
        const f2 = E.filt(o.type2, o.f2, o.q2 || 0.7);
        f.connect(f2);
        last = f2;
      }
      last.connect(g);
      let node = g;
      if (o.panEnv) {
        const p = E.panner(0);
        V.env(p.pan, o.panEnv);
        g.connect(p);
        node = p;
      }
      E.out(node, o.bus || 'sfx', o);
    };

    // A generated buffer played through an optional filter. make() builds the buffer only when the
    // voice is actually scheduled; secs must match its length.
    I.play = (t, secs, make, vel, o) => {
      o = o || {};
      const V = E.voice(t, secs + 0.01, o.sustain !== false);
      if (!V) return;
      const s = ctx.createBufferSource();
      s.buffer = make();
      let last = s;
      if (o.filt) {
        const f = E.filt(o.filt[0], o.filt[1], o.filt[2]);
        s.connect(f);
        last = f;
      }
      const g = E.gain(vel);
      last.connect(g);
      E.out(g, o.bus || 'sfx', o);
      V.buf(s, 0);
    };

    // Wing flutter: band-passed noise sweeping f0 to f1 with a flap on each listed offset.
    I.flutter = (t, len, flaps, o) => {
      const amp = [[0, 0]];
      const fl = o.floor || 0.08;
      flaps.forEach((dt, i) => {
        const pk = o.vel * (o.grow ? 0.6 + (0.4 * i) / Math.max(1, flaps.length - 1) : 1);
        amp.push([dt, amp.length > 1 ? o.vel * fl : 0, 'lin']);
        amp.push([dt + 0.008, pk, 'lin']);
        amp.push([dt + 0.06, o.vel * fl, 'exp']);
      });
      amp.push([len, FLOOR, 'exp']);
      I.nz(t, len, {
        type: 'bandpass',
        q: 1.1,
        f: [[0, o.f0], [len, o.f1, 'exp']],
        amp,
        panEnv: o.pan ? [[0, -o.pan], [len, o.pan, 'lin']] : null,
        bus: 'sfx',
        room: 0.25,
        key: 'flutter',
      });
    };

    I.chew = (t, vel, pan) =>
      I.nz(t, 0.02, { type: 'highpass', q: 0.7, f: [[0, 4200]], amp: perc(vel, 0.0008, 0.012), pan, key: 'chew' });

    I.plip = (t, f0, f1, vel, o) => {
      o = o || {};
      const V = E.voice(t, 0.14, false);
      if (!V) return;
      for (const [k, a] of [
        [1, 1],
        [2, 0.25],
      ]) {
        const s = E.osc('sine', f0 * k);
        V.env(s.frequency, [[0, f0 * k], [0.05, f1 * k, 'exp']]);
        const g = E.gain(0);
        V.env(g.gain, [[0, 0], [0.002, vel * a], [0.02, vel * a * 0.6, 'exp'], [0.12, FLOOR, 'exp']]);
        s.connect(g);
        E.out(g, 'sfx', Object.assign({ room: 0.2 }, o));
        V.osc(s);
      }
    };

    I.glide = (t, f0, f1, len, vel, o) => {
      o = o || {};
      const V = E.voice(t, len + 0.3, false);
      if (!V) return;
      const s = E.osc('sine', f0);
      V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.003, vel], [len, vel * 0.5, 'exp'], [len + 0.28, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, o.bus || 'sfx', o);
      V.osc(s);
    };

    // Low whump for the wing pumps: a rising sine body plus a soft rising noise sweep.
    I.whump = (t, vel) => {
      const V = E.voice(t, 0.42, false);
      if (!V) return;
      const s = E.osc('sine', 55);
      V.env(s.frequency, [[0, 55], [0.14, 88, 'exp'], [0.4, 80, 'lin']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.006, vel], [0.12, vel * 0.7, 'exp'], [0.4, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, 'bass');
      V.osc(s);
      const h = E.osc('triangle', 110);
      V.env(h.frequency, [[0, 110], [0.14, 176, 'exp']]);
      const hg = E.gain(0);
      V.env(hg.gain, perc(vel * 0.25, 0.005, 0.18));
      h.connect(hg);
      E.out(hg, 'sfx');
      V.osc(h, 0.25);
      I.nz(t, 0.3, {
        type: 'bandpass',
        q: 1.5,
        f: [[0, 220], [0.26, 1500, 'exp']],
        amp: [[0, 0], [0.02, vel * 0.08], [0.2, vel * 0.18, 'lin'], [0.3, FLOOR, 'exp']],
        key: 'whump',
      });
    };

    I.whistle = (t, len, f0, f1, vel) => {
      const V = E.voice(t, len + 0.05, false);
      if (!V) return;
      const s = E.osc('sine', f0);
      V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.015, vel], [len, FLOOR, 'exp']]);
      s.connect(g);
      E.out(g, 'sfx', { hall: 0.15 });
      V.osc(s);
    };

    I.bleep = (t, f, vel) => {
      const V = E.voice(t, 0.07, false);
      if (!V) return;
      const s = E.osc('sine', f);
      const lp = E.filt('lowpass', 6500, 0.7);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.002, vel], [0.062, FLOOR, 'exp']]);
      s.connect(lp);
      lp.connect(g);
      E.out(g, 'sfx', { room: 0.15 });
      V.osc(s);
    };

    // Striated buzz: a rising saw, chopped at 30 Hz, through a feedback comb.
    I.buzz = (t, len, vel) => {
      const V = E.voice(t, len + 0.05, false);
      if (!V) return;
      const s = E.osc('sawtooth', 98);
      V.env(s.frequency, [[0, 98], [len, 196, 'exp']]);
      const chop = E.gain(0.5);
      const lfo = E.osc('square', 30);
      const lg = E.gain(0.45);
      lfo.connect(lg);
      lg.connect(chop.gain);
      const d = ctx.createDelay(0.05);
      d.delayTime.value = 0.0034;
      const fb = E.gain(0.55);
      const bp = E.filt('bandpass', 1300, 0.8);
      const g = E.gain(0);
      V.env(g.gain, [[0, 0], [0.04, vel * 0.5], [len * 0.85, vel, 'lin'], [len, FLOOR, 'exp']]);
      s.connect(chop);
      chop.connect(bp);
      chop.connect(d);
      d.connect(fb);
      fb.connect(d);
      d.connect(bp);
      bp.connect(g);
      E.out(g, 'sfx', { hall: 0.25 });
      V.osc(s);
      V.osc(lfo);
    };

    // Reverse swell: noise rising exponentially into a hard stop at t + len.
    I.revSwell = (t, len, vel, o) => {
      o = o || {};
      const hi = o.hi || false;
      I.nz(t, len, {
        type: hi ? 'highpass' : 'lowpass',
        q: 0.7,
        f: hi ? [[0, 9000], [len, 3500, 'exp']] : [[0, 400], [len, o.fTop || 3500, 'exp']],
        type2: hi ? 'peaking' : null,
        f2: 9500,
        amp: [[0, vel * 0.004], [len - 0.012, vel, 'exp'], [len, FLOOR, 'lin']],
        stereo: true,
        sustain: true,
        bus: o.bus || 'sfx',
        hall: o.hall || 0.2,
        key: 'rev',
      });
    };

    // Stereo wind bed: wide noise through a slowly wandering band-pass. amp: env pts.
    I.wind = (t0, t1, amp, o) => {
      o = o || {};
      const len = t1 - t0;
      const f = [[0, 700]];
      for (let k = 1; k * 0.25 < len; k++) f.push([k * 0.25, 650 + 380 * lib.noise1(k * 0.23 + t0, 'film-wind'), 'lin']);
      I.nz(t0, len, { type: 'bandpass', q: 0.45, f, type2: 'lowpass', f2: o.lp || 2600, amp, stereo: true, sustain: true, bus: 'amb', key: 'wind' });
    };

    return I;
  }

  // ---------------------------------------------------------------- grain textures
  function flapGrains(r, t0, len, rate, o) {
    const out = [];
    const n = Math.floor(len * rate);
    for (let i = 0; i < n; i++) {
      const t = t0 + r() * len;
      out.push({
        t,
        dur: 0.05 + r() * 0.05,
        amp: (o.amp || 0.3) * (0.4 + 0.6 * r()),
        pan: (r() * 2 - 1) * (o.width || 0.9),
        f: (o.f0 || 380) + r() * (o.f1 || 1200),
        q: 0.9,
        att: 0.008 + r() * 0.008,
        dec: 0.02 + r() * 0.02,
      });
    }
    return out;
  }
  function clickGrains(r, t0, len, count, o) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const u = o.shape ? Math.pow(r(), o.shape) : r();
      out.push({
        t: t0 + u * len,
        dur: 0.008,
        amp: (o.amp || 0.3) * (0.3 + 0.7 * r()),
        pan: (r() * 2 - 1) * (o.width || 0.9),
        f: (o.f0 || 3000) + r() * (o.f1 || 5000),
        q: o.q || 1.2,
        att: 0.0004,
        dec: o.dec || 0.0015,
      });
    }
    return out;
  }

  // ---------------------------------------------------------------- the score
  // «Кто контролирует работу AI-агента?» — E major, 120 bpm, 30 bars (docs/storyboard.md, Structure).
  //   0–6.5   «магия»: air in, dry typing, the send click at 2.0 and a short bright lift on E (kick on the
  //           beats, pluck E–G#–B on 8ths, sub), the «Готово» stab at 5.0; cut dead on «пока» at 6.5.
  //   6.5–21  «риск»: an A pedal in A minor colour, sub drone and a slow low pulse that tightens into the
  //           stop-frame at 12.5 (near-silence, one muffled beep); the drone creeps back from 13.0 under
  //           the chaos, the tape-stop at 17.5, silence, and an even mechanical pulse from 18.5.
  //   21–39   «инженерия»: layer pings on an open fifth, the third arrives with the warm Amaj9 pad at 25.0,
  //           a B dominant pedal from 33.0 accelerates (8ths, then 16ths) into E major at 37.5.
  //   39–60   «урок»: the music opens up (I–vi–IV–V, wide pad, bells), the tension drone leaves by 40.0,
  //           IV–ii–V7 under the CTA and the final cadence on E at 55.0, held and faded out by 59.8.
  // Room for the voice-over: pads high-passed by their bus and low-passed at 1.2–1.8 kHz, motifs above
  // 1.2 kHz or in the sub, nothing busy in the mid-range while the captions run.
  // Routing: every effect goes to sfx (air beds to amb), every musical element to a music bus. The perc
  // bus is not a stem bus of render-audio.cjs, so the score folds it into drums. Sections that must stop
  // dead (6.5, 12.5, 17.5) play through gated private buses with their own reverb: the gate closes dry
  // and wet together, so no tail rings on, and each private bus follows its real bus's level, so
  // --solo / --mute still silence it.
  const CH = {
    // act 1 lift, over E2 C#2 A1 B1 E2
    lE: ['E3', 'B3', 'F#4', 'G#4'],
    lCsm: ['E3', 'B3', 'C#4', 'G#4'],
    lA: ['E3', 'A3', 'B3', 'C#4'],
    lB: ['F#3', 'B3', 'E4', 'F#4'],
    lE2: ['E3', 'B3', 'E4', 'G#4'],
    // act 2 risk, over the A1 drone
    Am: ['E3', 'A3', 'C4'],
    // act 3, over the A1 then B1 pedal
    A5: ['A3', 'E4', 'A4'],
    Amaj9: ['A3', 'E4', 'G#4', 'B4', 'C#5'],
    Fsm9: ['A3', 'C#4', 'F#4', 'G#4', 'E5'],
    Amaj9s11: ['A3', 'C#4', 'G#4', 'B4', 'D#5'],
    B11: ['A3', 'E4', 'F#4', 'B4', 'C#5'],
    B7sus: ['A3', 'E4', 'F#4', 'B4'],
    B7: ['A3', 'D#4', 'F#4', 'B4'],
    Eres: ['E3', 'B3', 'E4', 'G#4', 'B4'],
    // act 4
    Eopen: ['E3', 'B3', 'F#4', 'G#4', 'B4', 'E5'],
    Csm7: ['E3', 'G#3', 'C#4', 'E4', 'B4'],
    Aadd9: ['E3', 'A3', 'C#4', 'E4', 'B4'],
    Bsus4: ['F#3', 'B3', 'E4', 'F#4', 'B4'],
    B: ['F#3', 'B3', 'D#4', 'F#4', 'B4'],
    Fsm7: ['F#3', 'A3', 'C#4', 'E4'],
    B7sus4: ['F#3', 'A3', 'B3', 'E4'],
    B7f: ['F#3', 'A3', 'B3', 'D#4'],
    Efinal: ['E3', 'B3', 'E4', 'G#4', 'B4', 'E5'],
  };

  // ---- routing
  const MUSIC_BUSES = ['drums', 'bass', 'pad', 'keys', 'bells', 'lead'];
  // Bus-level reverb sends of the real buses, summed, for the private copies.
  const GATE_SENDS = { drums: 0.1, bass: 0, pad: 0.22, keys: 0.3, bells: 0.45, lead: 0.35 };
  // [id, open, close, reverb seconds]: music that must stop dead at `close`.
  const GATES = [
    ['lift', -1, 6.5, 1.3],
    ['risk', 6.5, 12.5, 2.4],
    ['creep', 13.0, 17.5, 2.4],
  ];

  function setupGates(E) {
    if (E.gates) return;
    E.gates = true;
    const ctx = E.ctx;
    const at = (T) => E.base + (T - E.start) - LAT;
    for (const [id, t0, t1, secs] of GATES) {
      const gate = E.gain(0);
      gate.connect(E.master);
      const g = gate.gain;
      g.setValueAtTime(0, E.base);
      const cClose = at(t1);
      if (cClose > E.base) {
        const cOpen = Math.max(E.base, at(t0) - 0.002);
        g.setValueAtTime(1, cOpen);
        g.setValueAtTime(1, Math.max(cOpen, cClose - 0.004));
        g.linearRampToValueAtTime(0, cClose);
      }
      const verb = ctx.createConvolver();
      verb.buffer = impulse(ctx, secs, 'gate-' + id, { pre: 0.012, bright: 0.5, dark: 0.1, early: 12, spread: 0.05 });
      const wet = E.gain(0.9);
      verb.connect(wet);
      wet.connect(gate);
      for (const name of MUSIC_BUSES) {
        const lvl = E.bus[name].gain.value * (name === 'drums' ? 1.1 : 1);
        const inp = E.gain(lvl);
        let tail = inp;
        if (name === 'pad') {
          const h = E.filt('highpass', 180, 0.6);
          inp.connect(h);
          tail = h;
        }
        tail.connect(gate);
        if (GATE_SENDS[name]) {
          const s = E.gain(GATE_SENDS[name]);
          tail.connect(s);
          s.connect(verb);
        }
        const key = id + ':' + name;
        E.bus[key] = inp;
        E.tap[key] = {};
        for (const k of ['room', 'hall', 'cave', 'delay']) {
          const tg = E.gain(lvl);
          tg.connect(verb);
          E.tap[key][k] = tg;
        }
      }
    }
  }

  // Run fn with bus names remapped (the instruments hard-code some buses).
  function via(E, map, fn) {
    const out = E.out;
    E.out = (node, b, o) => out(node, map[b] || b, o);
    try {
      fn();
    } finally {
      E.out = out;
    }
  }
  const MUSIC_MAP = { perc: 'drums' };
  const SFX_MAP = { drums: 'sfx', perc: 'sfx', bass: 'sfx', pad: 'sfx', keys: 'sfx', bells: 'sfx', lead: 'sfx' };
  const gateMap = (id) => {
    const m = { perc: id + ':drums' };
    for (const b of MUSIC_BUSES) m[b] = id + ':' + b;
    return m;
  };

  // ---- film instruments (music)
  // Dark drone: a sine root, two detuned warm saws and a soft octave through a low lowpass.
  // o.amp and o.lp are envelope points from t0 (amp ends at 0 at t1 - t0).
  function drone(E, t0, t1, note, o) {
    const V = E.voice(t0, t1 - t0, true);
    if (!V) return;
    const f = hz(note);
    const lp = E.filt('lowpass', o.lp[0][1], 0.8);
    V.env(lp.frequency, o.lp);
    const g = E.gain(0);
    V.env(g.gain, o.amp);
    for (const [type, k, det, a] of [
      ['sine', 1, 0, 0.8],
      [E.warmSaw, 1, -9, 0.32],
      [E.warmSaw, 1, 8, 0.32],
      ['sine', 2, 3, 0.2],
    ]) {
      const s = E.osc(type, f * k);
      s.detune.value = det;
      const sg = E.gain(a);
      s.connect(sg);
      sg.connect(lp);
      V.osc(s);
    }
    lp.connect(g);
    E.out(g, 'bass', o);
  }

  // ---- film instruments (effects, all on sfx)
  // Keyboard typing rendered into one grain buffer: each keystroke is a switch tick, a cap clack, a
  // desk thock and a release tick. hits: [[dt, vel, pan, big]]
  function typing(E, I, t, hits, vel, key) {
    const secs = hits[hits.length - 1][0] + 0.17;
    I.play(
      t,
      secs,
      () => {
        const r = lib.rng(lib.hash('film-keys', key));
        const g = [];
        for (const [dt, v, pan, big] of hits) {
          g.push({ t: dt, dur: 0.012, amp: 1.1 * v, pan, f: 2800 + r() * 2200, q: 1.3, att: 0.0003, dec: 0.0014 });
          g.push({ t: dt + 0.0008, dur: 0.035, amp: 0.8 * v, pan, f: (big ? 650 : 950) + r() * 450, q: 1.6, att: 0.0008, dec: big ? 0.009 : 0.0055 });
          g.push({ t: dt + 0.0012, dur: 0.05, amp: 0.3 * v, pan, f: big ? 140 : 190 + r() * 50, sine: true, att: 0.0012, dec: big ? 0.014 : 0.008 });
          g.push({ t: dt + 0.075 + r() * 0.035, dur: 0.01, amp: 0.3 * v, pan, f: 3200 + r() * 1800, q: 1.4, att: 0.0003, dec: 0.001 });
        }
        return grainBuffer(E.ctx, key, secs, g);
      },
      vel,
      { bus: 'sfx' }
    );
  }

  // Tuned high sparkle: sine grains on E major pentatonic, octaves 7–8. o: rate, amp, circle (pan period).
  function shimmer(E, I, t, secs, key, o) {
    const scale = ['E7', 'F#7', 'G#7', 'B7', 'C#8', 'E8'].map(hz);
    I.play(
      t,
      secs,
      () => {
        const r = lib.rng(lib.hash('film-shimmer', key));
        const g = [];
        const n = Math.floor(secs * (o.rate || 30));
        for (let i = 0; i < n; i++) {
          const u = i / n;
          const tt = u * (secs - 0.15) + r() * 0.01;
          const pan = o.circle ? Math.sin((TAU * tt) / o.circle) * 0.85 : (r() * 2 - 1) * 0.8;
          const env = o.fade ? Math.pow(1 - u, 1.5) : Math.sin(Math.PI * Math.min(1, u * 1.1));
          g.push({ t: tt, dur: 0.14, amp: o.amp * env * (0.45 + 0.55 * r()), pan, f: scale[Math.floor(r() * scale.length)], sine: true, att: 0.003, dec: 0.035 });
        }
        return grainBuffer(E.ctx, key, secs, g);
      },
      1,
      { bus: 'sfx', hall: 0.3 }
    );
  }

  // Glitch zip: a chopped saw sweeping f0 → f1.
  function zip(E, t, len, f0, f1, vel, pan, rate) {
    const V = E.voice(t, len + 0.01, false);
    if (!V) return;
    const s = E.osc('sawtooth', f0);
    V.env(s.frequency, [[0, f0], [len, f1, 'exp']]);
    const chop = E.gain(0.5);
    const lfo = E.osc('square', rate);
    const lg = E.gain(0.5);
    lfo.connect(lg);
    lg.connect(chop.gain);
    const hp = E.filt('highpass', 900, 0.7);
    const pk = E.filt('peaking', 3200, 1);
    pk.gain.value = 4;
    const g = E.gain(0);
    V.env(g.gain, [[0, 0], [0.002, vel], [len * 0.6, vel * 0.7, 'lin'], [len, FLOOR, 'exp']]);
    s.connect(chop);
    chop.connect(hp);
    hp.connect(pk);
    pk.connect(g);
    E.out(g, 'sfx', { pan, room: 0.1 });
    V.osc(s);
    V.osc(lfo);
  }

  // Tape-stop: a saw chord whose speed runs down linearly while the lowpass closes.
  function tapeStop(E, t, len, notes, vel) {
    const V = E.voice(t, len + 0.02, false);
    if (!V) return;
    const lp = E.filt('lowpass', 3400, 0.9);
    V.env(lp.frequency, [[0, 3400], [len, 110, 'exp']]);
    const g = E.gain(0);
    V.env(g.gain, [[0, 0], [0.003, vel], [len * 0.55, vel * 0.75, 'lin'], [len, FLOOR, 'exp']]);
    for (const n of notes) {
      for (const d of [-8, 8]) {
        const f = hz(n);
        const s = E.osc(E.warmSaw, f);
        s.detune.value = d;
        V.env(s.frequency, [[0, f], [len, f * 0.05, 'lin']]);
        const sg = E.gain(0.55 / notes.length);
        s.connect(sg);
        sg.connect(lp);
        V.osc(s);
      }
    }
    lp.connect(g);
    E.out(g, 'sfx', { room: 0.1 });
  }

  // Muffled beep: a lowpassed square, no siren.
  function mbeep(E, t, f, len, vel) {
    const V = E.voice(t, len + 0.02, false);
    if (!V) return;
    const s = E.osc('square', f);
    const lp = E.filt('lowpass', 1250, 0.7);
    const lp2 = E.filt('lowpass', 2000, 0.6);
    const g = E.gain(0);
    V.env(g.gain, [[0, 0], [0.004, vel], [len - 0.025, vel * 0.8, 'lin'], [len, 0, 'lin']]);
    s.connect(lp);
    lp.connect(lp2);
    lp2.connect(g);
    E.out(g, 'sfx', { room: 0.12 });
    V.osc(s);
  }

  // Dull thud: a falling low sine and a muffled knock. o: f0, f1, dec, lp.
  function thud(E, t, vel, o) {
    o = o || {};
    const dec = o.dec || 0.3;
    const V = E.voice(t, dec + 0.02, false);
    if (!V) return;
    const s = E.osc('sine', o.f0 || 120);
    V.env(s.frequency, [[0, o.f0 || 120], [0.05, o.f1 || 58, 'exp'], [dec, (o.f1 || 58) * 0.8, 'exp']]);
    const g = E.gain(0);
    V.env(g.gain, [[0, 0], [0.003, vel], [0.08, vel * 0.5, 'exp'], [dec, FLOOR, 'exp']]);
    s.connect(g);
    E.out(g, 'sfx');
    V.osc(s);
    const n = E.noise(V, ['thud', t]);
    const lp = E.filt('lowpass', o.lp || 900, 0.8);
    const ng = E.gain(0);
    V.env(ng.gain, perc(vel * 0.7, 0.001, 0.035));
    n.connect(lp);
    lp.connect(ng);
    E.out(ng, 'sfx', { room: 0.15 });
  }

  // Question tone: two muted triangles a minor second apart, lifting at the end like a question.
  function question(E, t, vel) {
    const len = 0.85;
    const V = E.voice(t, len + 0.02, false);
    if (!V) return;
    const lp = E.filt('lowpass', 1300, 0.7);
    const g = E.gain(0);
    V.env(g.gain, [[0, 0], [0.012, vel], [0.35, vel * 0.7, 'lin'], [len, FLOOR, 'exp']]);
    for (const n of ['A3', 'Bb3']) {
      const f = hz(n);
      const s = E.osc('triangle', f);
      V.env(s.frequency, [[0, f * 0.985], [0.05, f, 'exp'], [0.45, f, 'lin'], [0.8, f * 1.06, 'exp']]);
      s.connect(lp);
      V.osc(s);
    }
    lp.connect(g);
    E.out(g, 'sfx', { room: 0.2 });
  }

  // A short whoosh: band-passed stereo noise, fast front, filter sweep f (pts), peak at `peak`.
  function whoosh(I, t, len, f, vel, o) {
    o = o || {};
    const pk = o.peak || len * 0.4;
    I.nz(t, len, {
      type: 'bandpass',
      q: o.q || 0.8,
      f,
      amp: [[0, 0], [o.att || 0.008, vel * (o.front || 0.4)], [pk, vel, 'exp'], [len, FLOOR, 'exp']],
      stereo: true,
      sustain: true,
      panEnv: o.pan || null,
      bus: o.bus || 'sfx',
      hall: o.hall || 0.15,
      key: 'wh' + t,
    });
  }

  // ---- act 1: «магия» (gated at 6.5)
  function lift(E, I) {
    const { kick, hat, shaker, sub, pad, pluck, glock, glass, stab } = I;
    const CUT = 6.5;
    // 0–2: a soft sine glow under the typing
    pad(0.0, 2.0, ['B4', 'E5', 'G#5'], 0.07, { sine: true, att: 1.7, rel: 0.02, cut0: 3000, width: 0.35 });
    // 2.0: the lift
    const bassline = [[2.0, 3.0, 'E2'], [3.0, 4.0, 'C#2'], [4.0, 4.5, 'A1'], [4.5, 5.0, 'B1'], [5.0, CUT, 'E2']];
    for (const [a, b, n] of bassline) sub(a, b === CUT ? b - 0.006 : b, n, 0.5, { att: 0.006, rel: b === CUT ? 0.006 : 0.03, sus: 0.8 });
    const chords = [[2.0, 3.0, CH.lE], [3.0, 4.0, CH.lCsm], [4.0, 4.5, CH.lA], [4.5, 5.0, CH.lB], [5.0, CUT, CH.lE2]];
    for (const [a, b, notes] of chords) pad(a, b === CUT ? b - 0.008 : b, notes, 0.15, { att: 0.02, rel: b === CUT ? 0.008 : 0.06, cut0: 1500, cut1: 1800, width: 0.5 });
    for (let k = 0; k < 9; k++) {
      const t = 2 + k * 0.5;
      const down = k % 2 === 0;
      kick(t, t === 5 ? 0.6 : down ? 0.52 : 0.4, down || t === 5 ? 'full' : 'felt');
      hat(t + 0.25, 0.09);
    }
    for (let k = 0; k < 12; k++) if (k % 2) shaker(5 + k * 0.125, 0.06);
    // pluck motif E–G#–B on 8ths (an octave above the cue's E5, clear of the voice), a 6-note cycle
    const arp = ['E6', 'G#6', 'B6', 'E7', 'B6', 'G#6'];
    for (let k = 0; k < 18; k++) {
      const t = 2 + k * 0.25;
      pluck(t, arp[k % 6], k % 6 === 0 ? 0.14 : 0.11, { dec: 0.4, pan: k % 2 ? 0.3 : -0.3, room: 0.1 });
    }
    // 5.0 «Готово»: warm major stab, top of the lift, with a high sparkle
    stab(5.0, ['E4', 'G#4', 'B4', 'E5'], 0.2, { f: 1700, len: 0.32 });
    glass(5.0, hz('B6'), 0.06, { dec: 1.2 });
    glass(5.0, hz('E7'), 0.05, { dec: 1.4 });
    for (const [t, n] of [[5.5, 'G#6'], [6.0, 'B6']]) glock(t, hz(n), 0.05, { dec: 0.8 });
  }

  // ---- act 2a: «риск» (6.5–12.5, gated)
  function risk(E, I) {
    const { kick, pad, tock, subDrop } = I;
    const T0 = 6.5;
    const T1 = 12.5;
    // slow low pulse: half notes, beats from 10.0, 8ths from 11.5
    const pulses = [6.5, 7.5, 8.5, 9.5, 10, 10.5, 11, 11.5, 11.75, 12, 12.25];
    pulses.forEach((t) => kick(t, t === T0 ? 0.3 : 0.26 + (0.14 * (t - T0)) / 6, 'heart'));
    subDrop(T0, 110, 55, 1.2, 0.1);
    const v = 0.32;
    const amp = [[0, 0], [0.02, v * 0.35], [0.4, v, 'lin']];
    for (const t of pulses) {
      const dt = t - T0;
      if (dt > 0) amp.push([dt, v * 0.7, 'lin'], [dt + 0.05, v, 'lin']);
    }
    amp.push([T1 - T0 - 0.006, v, 'lin'], [T1 - T0, 0, 'lin']);
    drone(E, T0, T1, 'A1', { amp, lp: [[0, 230], [4.0, 260, 'exp'], [5.0, 380, 'exp'], [6.0, 520, 'exp']] });
    // dark A minor pad, and a thin high Bb–A major seventh that swells from the question into the stop-frame
    pad(T0, T1 - 0.008, CH.Am, 0.1, { att: 0.03, rel: 0.008, cut0: 500, cut1: 900, width: 0.6 });
    pad(8.5, T1 - 0.008, ['Bb5', 'A6'], 0.035, { sine: true, att: 3.9, rel: 0.008, cut0: 6000, width: 0.7 });
    // ticking from 10.0, 8ths, growing
    for (let k = 0; k < 10; k++) {
      const t = 10 + k * 0.25;
      tock(t, 0.05 + 0.006 * k, 2400, { bus: 'drums', dec: 0.02, pan: k % 2 ? 0.15 : -0.15 });
    }
  }

  // ---- act 2b: the drone creeps back (13.0–17.5, gated)
  function creep(E, I) {
    const { kick, pad } = I;
    const T0 = 13.0;
    const T1 = 17.5;
    const pulses = [14.5, 15.5, 16, 16.5, 17, 17.25];
    pulses.forEach((t) => kick(t, 0.24 + 0.05 * (t - 14.5), 'heart'));
    const amp = [[0, 0], [1.8, 0.2, 'lin']];
    for (const t of pulses) {
      const dt = t - T0;
      const lv = 0.2 + 0.06 * (t - 14.5);
      amp.push([dt, lv * 0.72, 'lin'], [dt + 0.05, lv, 'lin']);
    }
    amp.push([T1 - T0 - 0.006, 0.38, 'lin'], [T1 - T0, 0, 'lin']);
    drone(E, T0, T1, 'A1', { amp, lp: [[0, 200], [2.5, 260, 'exp'], [4.5, 480, 'exp']] });
    pad(T0, T1 - 0.008, CH.Am, 0.09, { att: 2.0, rel: 0.008, cut0: 420, cut1: 1000, width: 0.6 });
    pad(15.5, T1 - 0.008, ['Bb5', 'A6'], 0.03, { sine: true, att: 2.0, rel: 0.008, cut0: 6000, width: 0.8 });
  }

  // ---- act 3: «инженерия» (18.5–39)
  function system(E, I) {
    const { kick, tock, hat, pad, sub, glass, glock, fmBell, crash } = I;
    // 18.5–33: the even mechanical pulse, muted tick on 8ths, soft low thump on beats
    for (let k = 0; 18.5 + k * 0.25 < 33 - 1e-9; k++) {
      const t = 18.5 + k * 0.25;
      if (t === 30.5 || t === 30.75) continue; // the machine halts on the «stop» thud
      const beat = k % 2 === 0;
      tock(t, beat ? 0.085 : 0.055, 2600, { bus: 'drums', dec: 0.018, pan: beat ? 0.1 : -0.1 });
      if (beat) kick(t, t < 25 ? 0.26 : 0.3, 'thud');
    }
    // the tension layer: A1 pedal, then the B1 dominant pedal, then it leaves on E by 40.0
    drone(E, 18.5, 33.0, 'A1', { amp: [[0, 0], [2.0, 0.3, 'lin'], [6.5, 0.3, 'lin'], [7.5, 0.36, 'lin'], [14.4, 0.36, 'lin'], [14.5, 0, 'lin']], lp: [[0, 220], [6.5, 260, 'exp'], [14.5, 300, 'exp']] });
    drone(E, 33.0, 37.5, 'B1', { amp: [[0, 0], [0.05, 0.38, 'lin'], [4.44, 0.5, 'lin'], [4.5, 0, 'lin']], lp: [[0, 280], [4.5, 520, 'exp']] });
    drone(E, 37.5, 40.0, 'E2', { amp: [[0, 0], [0.02, 0.36, 'lin'], [2.5, 0, 'lin']], lp: [[0, 420], [2.5, 140, 'exp']] });
    // 21.0–25: an open fifth, and one high ping per layer, rising (the third is withheld)
    pad(21.0, 25.0, CH.A5, 0.09, { sine: true, att: 2.5, rel: 0.5, cut0: 1200, width: 0.4 });
    [[21.5, 'E6'], [22.5, 'A6'], [23.5, 'B6'], [24.5, 'E7']].forEach(([t, n], i) => glass(t, hz(n), 0.065, { dec: 1.8, hall: 0.25, pan: -0.3 + i * 0.2 }));
    // 25.0: the third arrives, a warm Amaj9 pad (orange: allowed)
    const warm = [[25, 29, CH.Amaj9], [29, 31, CH.Fsm9], [31, 33, CH.Amaj9s11], [33, 35, CH.B11], [35, 36.5, CH.B7sus], [36.5, 37.5, CH.B7]];
    for (const [a, b, notes] of warm) {
      pad(a, b === 37.5 ? b - 0.02 : b, notes, 0.2, {
        att: a === 25 ? 1.0 : 0.08,
        rel: b === 37.5 ? 0.02 : 0.12,
        cut0: a === 25 ? 600 : a >= 35 ? 1300 : 1300,
        cut1: a >= 35 ? 2400 : 1400,
        width: 0.7,
        hall: 0.15,
      });
    }
    fmBell(25.0, hz('C#6'), 0.08, { ratio: 2, index: 1.2, dec: 2.4, hall: 0.3, delay: 0.15 });
    glock(25.0, hz('G#6'), 0.05, { dec: 2.0 });
    // 33–37.5: the rhythm accelerates, hats on 8ths, 16ths from 35.0
    for (let k = 0; k < 9; k++) {
      const t = 33 + k * 0.5;
      kick(t, 0.36 + 0.025 * k, 'felt');
      E.duck(t, 0.3);
    }
    for (let k = 0; k < 8; k++) hat(33 + k * 0.25, k % 2 ? 0.075 : 0.05);
    for (let k = 0; k < 20; k++) hat(35 + k * 0.125, 0.035 + (0.05 * k) / 20 + (k % 2 ? 0 : 0.015));
    // 37.5: the test passes, E major resolves (root position, no added notes)
    pad(37.5, 39.0, CH.Eres, 0.24, { att: 0.01, rel: 0.12, cut0: 2400, cut1: 1500, width: 0.8, hall: 0.2 });
    sub(37.5, 39.0, 'E2', 0.5, { att: 0.006, rel: 0.05 });
    kick(37.5, 0.62, 'full');
    E.duck(37.5, 0.4);
    crash(37.5, 0.1, { dec: 2.2, pan: 0.2 });
    glock(37.5, hz('E6'), 0.11, { dec: 2.4 });
    glock(37.5, hz('G#6'), 0.08, { dec: 2.2 });
    glock(37.5, hz('B6'), 0.08, { dec: 2.2 });
    glass(37.5, hz('E7'), 0.05, { dec: 2.5 });
    kick(38.0, 0.3, 'felt');
    kick(38.5, 0.34, 'felt');
    for (const t of [37.75, 38.25, 38.75]) hat(t, 0.05);
  }

  // ---- act 4: «урок» (39–60)
  function lessonMusic(E, I) {
    const { kick, hat, shaker, sub, pad, pluck, glock, crash, gong } = I;
    const prog = [
      [39, 41, CH.Eopen, 'E2'],
      [41, 43, CH.Csm7, 'C#2'],
      [43, 45, CH.Aadd9, 'A1'],
      [45, 46, CH.Bsus4, 'B1'],
      [46, 47, CH.B, 'B1'],
      [47, 49, CH.Csm7, 'C#2'],
      [49, 51, CH.Aadd9, 'A1'],
      [51, 52, CH.Bsus4, 'B1'],
      [52, 53, CH.Aadd9, 'A1'],
      [53, 54, CH.Fsm7, 'F#1'],
      [54, 54.5, CH.B7sus4, 'B1'],
      [54.5, 55, CH.B7f, 'B1'],
    ];
    for (const [a, b, notes, root] of prog) {
      const rise = a === 51;
      pad(a, b, notes, rise ? 0.17 : 0.18, { att: rise ? 0.4 : 0.06, rel: 0.12, cut0: rise ? 1200 : 1500, cut1: rise ? 3000 : 1700, width: 0.9, hall: 0.2 });
      if (a < 52) {
        // bouncing sub on the beats, the third beat up an octave
        for (let t = a; t < b - 1e-9; t += 0.5) {
          const up = Math.round((t - a) / 0.5) === 2;
          sub(t, t + 0.4, up ? root.replace(/\d/, (d) => String(Number(d) + 1)) : root, 0.42, { att: 0.005, rel: 0.06 });
        }
      } else sub(a, b, root, 0.42, { att: 0.02, rel: 0.05 });
    }
    // drums 39–52: kick on the beats (pumping pad and bass), offbeat hats, 16th shaker from 45
    for (let k = 0; 39 + k * 0.5 < 52 - 1e-9; k++) {
      const t = 39 + k * 0.5;
      const change = t % 2 === 1;
      kick(t, change ? 0.55 : 0.44, change ? 'full' : 'felt');
      E.duck(t, 0.45);
      hat(t + 0.25, 0.08);
      if (t >= 45) {
        shaker(t + 0.125, 0.035);
        shaker(t + 0.375, 0.045);
      }
    }
    crash(39.0, 0.06, { dec: 1.6, pan: -0.2 });
    // bells: dotted-quarter figures on chord tones, high, into the ping-pong delay
    const bells = [
      [39, ['B6', 'G#6', 'E6']],
      [41, ['C#7', 'G#6', 'E6']],
      [43, ['C#7', 'A6', 'E6']],
      [45, ['B6', 'F#6', 'D#6']],
      [47, ['E7', 'C#7', 'G#6']],
      [49, ['E7', 'C#7', 'A6']],
    ];
    for (const [a, ns] of bells) ns.forEach((n, i) => glock(a + i * 0.75, hz(n), 0.09, { dec: 1.4, delay: 0.2, pan: i % 2 ? 0.35 : -0.35 }));
    // 47–51.5: assembly, a light high pluck on 8ths
    const asm = { 47: ['E6', 'B6', 'G#6', 'C#7'], 48: ['E6', 'B6', 'G#6', 'C#7'], 49: ['E6', 'C#7', 'A6', 'B6'], 50: ['E6', 'C#7', 'A6', 'B6'], 51: ['F#6', 'B6', 'E6', 'D#7'] };
    for (let k = 0; 47 + k * 0.25 < 51.5 - 1e-9; k++) {
      const t = 47 + k * 0.25;
      pluck(t, asm[Math.floor(t)][k % 4], 0.05 + 0.02 * (k / 18), { dec: 0.3, pan: k % 2 ? 0.4 : -0.4, delay: 0.08 });
    }
    // 51.5: the rise into the final card (music part: a bell and the pad swell above)
    glock(51.5, hz('F#6'), 0.06, { dec: 1.0, delay: 0.15 });
    // 52–55: the final phrase, IV–ii–V7, the lift's pluck returns with a glock an octave up
    kick(52.0, 0.5, 'full');
    kick(53.0, 0.34, 'felt');
    kick(54.0, 0.34, 'felt');
    crash(52.0, 0.07, { dec: 2.0, pan: 0.2 });
    for (let k = 0; k < 5; k++) hat(52.25 + k * 0.5, 0.055);
    const mel = [[52.0, 'C#6'], [52.5, 'B5'], [52.75, 'C#6'], [53.0, 'E6'], [53.5, 'F#6'], [53.75, 'E6'], [54.0, 'E6'], [54.5, 'D#6']];
    for (const [t, n] of mel) {
      pluck(t, n, 0.13, { dec: 0.9, room: 0.15, delay: 0.1 });
      glock(t, hz(n) * 2, 0.04, { dec: 1.0 });
    }
    // 55.0: the cadence on E, then a calm sustained chord fading out by 59.8
    pad(55.0, 57.6, CH.Efinal, 0.22, { att: 0.015, rel: 2.2, cut0: 2000, cut1: 1200, width: 0.8, hall: 0.25 });
    sub(55.0, 57.4, 'E2', 0.45, { att: 0.01, rel: 2.3 });
    kick(55.0, 0.6, 'full');
    E.duck(55.0, 0.35);
    crash(55.0, 0.09, { dec: 3.5, pan: -0.15 });
    gong(55.0, hz('E3'), 0.07, { dec: 4.2 });
    pluck(55.0, 'E6', 0.13, { dec: 1.6, room: 0.15, delay: 0.1 });
    [['E6', 0], ['G#6', 0.25], ['B6', 0.5], ['E7', 0.75]].forEach(([n, dt]) => glock(55.0 + dt, hz(n), 0.07 - dt * 0.03, { dec: 2.6, delay: 0.12 }));
  }

  // ---- every sound effect (routed to sfx; air beds to amb)
  function effects(E, I) {
    const { nz, tock, plip, glass, fmBell, bleep, subDrop } = I;
    // 0.0 air in: a short high airy swell
    nz(0.0, 0.62, {
      type: 'highpass',
      q: 0.7,
      f: [[0, 7500], [0.3, 3200, 'exp'], [0.62, 4500, 'exp']],
      amp: [[0, 0], [0.006, 0.04], [0.3, 0.16, 'exp'], [0.62, FLOOR, 'exp']],
      stereo: true,
      sustain: true,
      bus: 'amb',
      hall: 0.25,
      key: 'airin',
    });
    // 0.5–1.75: «Добавь поиск по обращениям», 26 keys, spaces at 6, 12, 15
    {
      const r = E.rng('typing', 1);
      const hits = [];
      for (let i = 0; i < 26; i++) {
        const space = i === 6 || i === 12 || i === 15;
        const dt = i === 0 ? 0 : i === 25 ? 1.25 : i * 0.05 + (r() - 0.5) * 0.024;
        hits.push([dt, space ? 0.95 : 0.6 + 0.3 * r(), (r() - 0.5) * 0.4, space]);
      }
      typing(E, I, 0.5, hits, 0.5, 'type-prompt');
    }
    // 2.0 send: a crisp enter
    typing(E, I, 2.0, [[0, 1, 0.1, true]], 0.6, 'type-send');
    tock(2.0, 0.2, 3000, { pan: 0.1, dec: 0.03 });
    // 2.25 / 2.5 / 2.75 code cards: soft blips, stepping up
    [[2.25, 988], [2.5, 1109], [2.75, 1319]].forEach(([t, f]) => plip(t, f * 0.92, f, 0.13));
    // 3.0 search bar slides in
    whoosh(I, 3.0, 0.45, [[0, 900], [0.25, 4800, 'exp'], [0.45, 2600, 'exp']], 0.16, { pan: [[0, 0.5], [0.45, -0.1, 'lin']] });
    // 3.25–3.625 «вход»
    typing(E, I, 3.25, [0, 0.125, 0.25, 0.375].map((dt, i) => [dt, 0.7 + 0.1 * (i % 2), 0.05 * i - 0.05, false]), 0.45, 'type-vhod');
    // 4.0 found: a bright two-note chime
    fmBell(4.0, hz('G#6'), 0.14, { ratio: 2, index: 1.1, dec: 0.9, pan: -0.15, room: 0.2 });
    fmBell(4.125, hz('B6'), 0.14, { ratio: 2, index: 1.1, dec: 1.1, pan: 0.15, room: 0.2 });
    // 6.5 pull-back: long air whoosh with a falling filter
    whoosh(I, 6.5, 2.1, [[0, 6000], [0.4, 2500, 'exp'], [2.1, 300, 'exp']], 0.13, { front: 0.9, peak: 0.12, q: 0.6, hall: 0.2 });
    // 7.0 / 7.5 / 8.0 the cards wire up: low clicks
    [[7.0, -0.3], [7.5, 0], [8.0, 0.3]].forEach(([t, pan]) => tock(t, 0.2, 520, { dec: 0.05, pan, room: 0.1 }));
    // 8.5 the badge turns into «?»
    question(E, 8.5, 0.12);
    // 10.0 zoom-through
    whoosh(I, 10.0, 0.5, [[0, 500], [0.35, 5000, 'exp'], [0.5, 3000, 'exp']], 0.15, { front: 0.5, peak: 0.3 });
    // 10.75 pointer glide: soft tick
    tock(10.75, 0.1, 3200, { dec: 0.02, pan: -0.2 });
    // 11.5 «удалить папку»: tense blip, a semitone rub
    bleep(11.5, hz('D6'), 0.1);
    bleep(11.5, hz('D#6'), 0.08);
    // 12.5 stop-frame: near-silence and one muffled beep
    mbeep(E, 12.5, 880, 0.15, 0.09);
    // 15.0 tree → schema
    whoosh(I, 15.0, 0.9, [[0, 3500], [0.9, 600, 'exp']], 0.1, { front: 0.8, peak: 0.1 });
    // 15.5 / 15.75 / 16.0 nodes appear
    [[15.5, 1800], [15.75, 2100], [16.0, 2400]].forEach(([t, f], i) => tock(t, 0.15, f, { dec: 0.03, pan: -0.3 + 0.3 * i }));
    // 16.0–17.5 uncontrolled arrows: glitchy zips on irregular 16ths
    {
      const r = E.rng('zips');
      for (let k = 0; k < 12; k++) {
        const keep = r() < 0.72;
        const up = r() < 0.5;
        const len = 0.045 + r() * 0.07;
        const fa = 500 + r() * 1500;
        const fb = 2500 + r() * 4000;
        const pan = (r() * 2 - 1) * 0.75;
        const rate = 40 + r() * 110;
        const vel = 0.07 + r() * 0.05;
        if (k === 0 || keep) zip(E, 16 + k * 0.125, len, up ? fa : fb, up ? fb : fa, vel, pan, rate);
      }
    }
    // 17.5 stop: the button, a tape-stop of the A minor colour, a sub drop; then silence to 18.5
    typing(E, I, 17.5, [[0, 1, 0, true]], 0.5, 'type-stop');
    tapeStop(E, 17.5, 0.5, ['A2', 'E3', 'A3', 'C4'], 0.2);
    subDrop(17.5, 90, 30, 0.45, 0.3);
    // 21.0 the agent node becomes «модель»
    tock(21.0, 0.12, 1500, { dec: 0.04 });
    // 21.5 / 22.5 / 23.5 / 24.5 layers: quiet clicks, rising
    [[21.5, 1600], [22.5, 1900], [23.5, 2250], [24.5, 2700]].forEach(([t, f]) => tock(t, 0.1, f, { dec: 0.03 }));
    // 25.0 routes lock: a click and a smooth sweep to 26.0
    tock(25.0, 0.13, 2000, { dec: 0.03 });
    nz(25.0, 1.1, {
      type: 'bandpass',
      q: 0.9,
      f: [[0, 500], [0.6, 3500, 'exp'], [1.1, 2000, 'exp']],
      amp: [[0, 0], [0.25, 0.05, 'lin'], [0.6, 0.07, 'lin'], [1.1, FLOOR, 'exp']],
      stereo: true,
      sustain: true,
      panEnv: [[0, -0.5], [1.1, 0.5, 'lin']],
      bus: 'amb',
      hall: 0.2,
      key: 'sweep25',
    });
    // 27.0 rules screen: soft whoosh
    whoosh(I, 27.0, 0.6, [[0, 1200], [0.3, 3500, 'exp'], [0.6, 1800, 'exp']], 0.09, { front: 0.4, peak: 0.25 });
    // 28.0 / 29.0 rows pass: warm clicks, a major third apart
    tock(28.0, 0.15, hz('E6'), { dec: 0.06 });
    tock(29.0, 0.15, hz('G#6'), { dec: 0.06 });
    // 30.5 «удалять» blocks: a dull stop
    thud(E, 30.5, 0.45);
    // 31.0 confirmation request: soft two-tone notification
    glass(31.0, hz('B5'), 0.1, { dec: 0.6, att: 0.004 });
    glass(31.125, hz('E6'), 0.1, { dec: 0.9, att: 0.004 });
    // 33.5 / 34.5 / 35.25 / 35.75 steps light
    [[33.5, 'E6'], [34.5, 'F#6'], [35.25, 'G#6'], [35.75, 'B6']].forEach(([t, n]) => {
      tock(t, 0.12, 2600, { dec: 0.02 });
      bleep(t, hz(n), 0.04);
    });
    // 36.0 the app slides in from the right
    whoosh(I, 36.0, 0.5, [[0, 1000], [0.3, 4500, 'exp'], [0.5, 2500, 'exp']], 0.13, { pan: [[0, 0.7], [0.5, 0, 'lin']] });
    // 36.5–37.0 «оплат»
    typing(E, I, 36.5, [0, 0.125, 0.25, 0.375, 0.5].map((dt, i) => [dt, 0.65 + 0.1 * (i % 2), 0.04 * i - 0.08, false]), 0.42, 'type-oplat');
    // 39.5–41.0 pull-back from the schema: airy whoosh
    whoosh(I, 39.5, 1.5, [[0, 3500], [0.8, 5000, 'exp'], [1.5, 1500, 'exp']], 0.08, { att: 0.004, front: 1.5, peak: 0.7, q: 0.6, bus: 'amb' });
    // 41.0 the lesson card lands: soft impact with a shimmer
    thud(E, 41.0, 0.4, { f0: 90, f1: 45, dec: 0.5, lp: 700 });
    shimmer(E, I, 41.0, 1.3, 'land', { rate: 26, amp: 0.05, fade: true });
    // 45.0 card «Готовый агент»
    tock(45.0, 0.15, 2200, { dec: 0.03 });
    // 46.5 card switch: swoosh
    whoosh(I, 46.5, 0.45, [[0, 1200], [0.25, 5000, 'exp'], [0.45, 3000, 'exp']], 0.13, { pan: [[0, -0.6], [0.45, 0.6, 'lin']] });
    // 47.0 / 47.5 / 48.0 blocks: technical clicks
    [[47.0, 2600], [47.5, 2900], [48.0, 3300]].forEach(([t, f]) => {
      tock(t, 0.14, f, { dec: 0.02 });
      nz(t, 0.02, { type: 'highpass', q: 0.7, f: [[0, 6000]], amp: perc(0.12, 0.0005, 0.008), key: 'tc' });
    });
    // 48.5 the source folder slides in
    tock(48.5, 0.06, 1400, { dec: 0.03 });
    whoosh(I, 48.5, 0.5, [[0, 800], [0.5, 1700, 'exp']], 0.06, { front: 0.6, peak: 0.2, q: 1.2 });
    // 49.0 / 49.5 / 50.0 snaps into one loop
    [49.0, 49.5, 50.0].forEach((t, i) => {
      tock(t, 0.18, 3500, { dec: 0.015, pan: (i - 1) * 0.3 });
      plip(t, 2400, 1600, 0.05);
    });
    // 50.0–51.5 a circulating shimmer
    shimmer(E, I, 50.0, 1.5, 'loop', { rate: 34, amp: 0.035, circle: 0.75 });
    // 51.5 the smooth rise into the final card
    tock(51.5, 0.08, 3000, { dec: 0.02 });
    nz(51.5, 0.75, {
      type: 'bandpass',
      q: 0.8,
      f: [[0, 900], [0.5, 6000, 'exp'], [0.75, 4000, 'exp']],
      amp: [[0, 0], [0.01, 0.02], [0.5, 0.1, 'exp'], [0.75, FLOOR, 'exp']],
      stereo: true,
      sustain: true,
      bus: 'sfx',
      hall: 0.25,
      key: 'rise',
    });
    // 53.5 the arrow draws to the sticker zone: soft rising blip
    plip(53.5, 1100, 1650, 0.13);
  }

  function score(E, I) {
    setupGates(E);
    via(E, MUSIC_MAP, () => {
      via(E, gateMap('lift'), () => lift(E, I));
      via(E, gateMap('risk'), () => risk(E, I));
      via(E, gateMap('creep'), () => creep(E, I));
      system(E, I);
      lessonMusic(E, I);
      via(E, SFX_MAP, () => effects(E, I));
    });
  }

  FILM.audio = {
    render(ctx, opts) {
      const o = opts || {};
      const start = Math.max(0, Number(o.start) || 0);
      const dest = o.dest || ctx.destination;
      const DUR = (FILM.TIMELINE && FILM.TIMELINE.duration) || FILM.DURATION || 32;
      // opts.mix overrides the mix constants (bus gains, trim); the analysis tools use it for solo renders.
      const om = o.mix || {};
      const mix = Object.assign({}, MIX, om, {
        bus: Object.assign({}, MIX.bus, om.bus || {}),
        eq: Object.assign({}, MIX.eq, om.eq || {}),
        comp: Object.assign({}, MIX.comp, om.comp || {}),
      });
      const E = makeEngine(ctx, start, dest, DUR, mix);
      const I = instruments(E);
      // The score is scheduled one bar at a time, so the audio graph only ever holds the voices of
      // the next few seconds. Each voice belongs to exactly one bar by its start time, so the output
      // is the same as scheduling everything at once. The first bar also takes every earlier voice
      // still sounding at `start`.
      const BAR = 240 / ((FILM.TIMELINE && FILM.TIMELINE.bpm) || 120);
      const first = Math.floor(start / BAR);
      const last = Math.ceil(DUR / BAR) - 1;
      const run = (k) => {
        E.w0 = k === first ? -Infinity : k * BAR;
        E.w1 = k === last ? Infinity : (k + 1) * BAR;
        score(E, I);
      };
      const due = (k) => E.base + (k * BAR - start) - LAT; // context time of bar k's first event
      run(first);
      let k = first + 1;
      const isOffline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
      if (isOffline && typeof ctx.suspend !== 'function') {
        // An offline context that cannot pause mid-render gets every bar up front.
        for (; k <= last; k++) run(k);
      } else if (isOffline) {
        // Offline: pause the render 0.25 s before each bar, schedule it, resume.
        const q = 128 / ctx.sampleRate;
        const end = ctx.length / ctx.sampleRate;
        for (; k <= last; k++) {
          const j = k;
          const when = Math.floor((due(j) - 0.25) / q) * q;
          if (when >= end - q) break; // this bar starts after the render window ends
          let paused = null;
          if (when > ctx.currentTime + q) {
            try {
              paused = ctx.suspend(when);
            } catch (e) {
              paused = null;
            }
          }
          if (!paused) run(j);
          else
            paused.then(
              () => {
                run(j);
                ctx.resume();
              },
              () => run(j)
            );
        }
      } else {
        // Live: a look-ahead timer schedules each bar 1.5 s before it sounds.
        const AHEAD = 1.5;
        const pump = () => {
          while (k <= last && due(k) - ctx.currentTime < AHEAD) run(k++);
          return k <= last;
        };
        if (pump()) {
          const timer = setInterval(() => {
            if (ctx.state === 'closed' || !pump()) clearInterval(timer);
          }, 100);
        }
      }
    },
  };
})();
