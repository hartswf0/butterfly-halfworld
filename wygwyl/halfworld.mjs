/* ============================================================================
   WYGWYL HALFWORLD ENGINE
   WHERE YOU GO WHEN YOU LEAVE — each poem restaged as its own halfworld.

   The beflix suite player replays a recording (128×96 nodes, 8 shades, one
   mp3). This engine REMAKES each poem from source under the butterfly laws:

     · THE DOT LAW — eight ink levels, ordered halftone, cream paper. Scenes
       draw flat quantized tones into a 192×144 ink field; ONE halftone pass
       runs over the whole field at the end. No gradients, no blur, no alpha.
       A dissolve is therefore never a cross-fade: it is a per-dot allegiance
       swap on an ordered (Bayer) schedule.
     · PURE TIME — every movement is a pure function of normalised u ∈ [0,1).
       No wall clock, no accumulated state. Frame n renders identically
       whether or not frame n−1 ever existed. Temporal effects (smear, echo)
       are extra SAMPLES of the same pure function, never stored state.
     · SOUND NO SMOOTHER THAN THE PICTURE — all audio is synthesised here:
       a drone bed of detuned partials stepping with the movements, and foley
       events built from decaying partials + a burst of shaped noise. No
       samples, no reverb tail longer than the room.

   A world module supplies:
     { n, slug, title, tagline, accent, seed,
       drone:{ base, steps:[semitone offsets], bright? },
       movements:[ { label, line, seconds,
                     fx?:{ smear:{taps,spread,fall}, kaleido:'x'|'y'|'quad',
                           invert:(u)=>0..1, shake:amp|(u)=>amp },
                     cues?:[ {at, f, decay, gain, partials, noise, seed} ],
                     draw(u, F) } ] }
   ========================================================================= */

export const TAU = Math.PI * 2;
export const FW = 192, FH = 144;            // the ink field, 4:3
const CELLS = FW * FH;
const XFADE = 1.5;                          // seconds of per-dot dissolve

export const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
export const clamp01 = (x) => clamp(x, 0, 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
/* smoothstep between edges a..b */
export const ss = (a, b, x) => smooth((x - a) / (b - a || 1e-9));
/* a pulse that rises over [a,b] and falls over [c,d] */
export const win = (u, a, b, c, d) => ss(a, b, u) * (1 - ss(c, d, u));

const PAPER = "#f2efe6", INKC = "#161513", DIMC = "#8b8175";

/* 8×8 Bayer matrix, /64 — the ordered schedule every dissolve obeys */
const B8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];
const bayerAt = (x, y) => B8[((y & 7) << 3) | (x & 7)] / 64;

/* ---------------------------------------------------------------- field kit
   Everything a movement draws with. Bound to one Float32Array at a time.
   Levels: 0 = paper … 7 = full ink, 8 = the accent mark (one per world). */
function makeKit(seed) {
  const K = {
    W: FW, H: FH, buf: null, u: 0,
    bind(buf) { K.buf = buf; return K; },
    i(x, y) { return y * FW + x; },
    bayer: bayerAt,
    clear(l = 0) { K.buf.fill(l); },
    put(x, y, l) {
      x |= 0; y |= 0;
      if (x >= 0 && x < FW && y >= 0 && y < FH) K.buf[y * FW + x] = l;
    },
    ink(x, y, l) {
      x |= 0; y |= 0;
      if (x >= 0 && x < FW && y >= 0 && y < FH) {
        const q = y * FW + x;
        if (l > K.buf[q]) K.buf[q] = l;
      }
    },
    stamp(x, y, l, set) { (set ? K.put : K.ink)(x, y, l); },
    rect(x, y, w, h, l, set = false) {
      const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0);
      const x1 = Math.min(FW, Math.ceil(x + w)), y1 = Math.min(FH, Math.ceil(y + h));
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) K.stamp(xx, yy, l, set);
    },
    box(x, y, w, h, l, th = 1) {
      K.rect(x, y, w, th, l); K.rect(x, y + h - th, w, th, l);
      K.rect(x, y, th, h, l); K.rect(x + w - th, y, th, h, l);
    },
    line(x0, y0, x1, y1, l, th = 1, set = false) {
      const dx = x1 - x0, dy = y1 - y0;
      const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 2));
      for (let k = 0; k <= n; k++) {
        const x = x0 + dx * k / n, y = y0 + dy * k / n;
        if (th <= 1) K.stamp(Math.round(x), Math.round(y), l, set);
        else K.disc(x, y, th / 2, l, set);
      }
    },
    disc(cx, cy, r, l, set = false) {
      const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(FW - 1, Math.ceil(cx + r));
      const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(FH - 1, Math.ceil(cy + r));
      const r2 = r * r;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= r2) K.stamp(x, y, l, set);
      }
    },
    ring(cx, cy, r, l, th = 1) {
      const n = Math.max(8, Math.ceil(TAU * r * 1.6));
      for (let k = 0; k < n; k++) {
        const a = k / n * TAU;
        if (th <= 1) K.ink(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), l);
        else K.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, th / 2, l);
      }
    },
    arc(cx, cy, r, a0, a1, l, th = 1) {
      const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * r * 1.6));
      for (let k = 0; k <= n; k++) {
        const a = a0 + (a1 - a0) * k / n;
        if (th <= 1) K.ink(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), l);
        else K.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, th / 2, l);
      }
    },
    /* rasterise a word once, stamp it forever after from cache */
    word(text, cx, cy, ph, l, set = false) {
      const g = wordRaster(text, ph);
      const x0 = Math.round(cx - g.w / 2), y0 = Math.round(cy - g.h / 2);
      for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++)
        if (g.data[y * g.w + x]) K.stamp(x0 + x, y0 + y, l, set);
    },
    wordW(text, ph) { return wordRaster(text, ph).w; },
    /* a stick body. pose: {mode:'stand'|'walk'|'fall'|'sit', phase, face,
       lean, rot, arms:'down'|'open'|'up'|'reach'} — enough to stage grief,
       dance, and a fall from a fire escape. */
    fig(x, y, h, pose = {}, l = 7) {
      const face = pose.face || 1, ph2 = pose.phase || 0;
      const mode = pose.mode || "stand";
      const th = Math.max(1, h * 0.055);
      let hip = [0, -h * 0.46], sh = [0, -h * 0.78], hd = [0, -h * 0.885];
      let ft = [[-h * 0.09, 0], [h * 0.09, 0]], hn;
      if (mode === "walk") {
        const s = Math.sin(ph2 * TAU) * 0.30;
        ft = [[Math.sin(ph2 * TAU) * h * 0.20, -Math.max(0, Math.sin(ph2 * TAU + 1.7)) * h * 0.05],
              [-Math.sin(ph2 * TAU) * h * 0.20, -Math.max(0, Math.sin(ph2 * TAU + TAU / 2 + 1.7)) * h * 0.05]];
        hip = [s * h * 0.02, -h * 0.46 - Math.abs(Math.cos(ph2 * TAU)) * h * 0.012];
      }
      if (mode === "sit") { hip = [0, -h * 0.28]; sh = [0, -h * 0.62]; hd = [0, -h * 0.73];
        ft = [[h * 0.24 * face, 0], [h * 0.30 * face, 0]]; }
      const arms = pose.arms || (mode === "walk" ? "swing" : "down");
      if (arms === "down") hn = [[-h * 0.10, -h * 0.38], [h * 0.10, -h * 0.38]];
      else if (arms === "open") hn = [[-h * 0.32, -h * 0.62], [h * 0.32, -h * 0.62]];
      else if (arms === "up") hn = [[-h * 0.20, -h * 1.02], [h * 0.20, -h * 1.02]];
      else if (arms === "reach") hn = [[face * h * 0.36, -h * 0.72], [face * h * 0.10, -h * 0.40]];
      else hn = [[Math.sin(ph2 * TAU + TAU / 2) * h * 0.16, -h * 0.42],
                 [Math.sin(ph2 * TAU) * h * 0.16, -h * 0.42]];
      let pts = [hip, sh, hd, ft[0], ft[1], hn[0], hn[1]];
      const rot = pose.rot || 0, ln = pose.lean || 0;
      if (rot || ln) {
        const c = Math.cos(rot), s = Math.sin(rot), py = -h * 0.46;
        pts = pts.map(([px, pyy]) => {
          let dx = px, dy = pyy - py;
          const rx = dx * c - dy * s, ry = dx * s + dy * c;
          return [rx + ln * (py - pyy) * 0.8, ry + py];
        });
      }
      const [H, S, D, F0, F1, H0, H1] = pts.map(([px, py]) => [x + px, y + py]);
      K.line(H[0], H[1], S[0], S[1], l, th);          // torso
      K.line(H[0], H[1], F0[0], F0[1], l, th * 0.8);  // legs
      K.line(H[0], H[1], F1[0], F1[1], l, th * 0.8);
      K.line(S[0], S[1], H0[0], H0[1], l, th * 0.7);  // arms
      K.line(S[0], S[1], H1[0], H1[1], l, th * 0.7);
      K.disc(D[0], D[1], h * 0.10, l);                // head
    },
    /* deterministic noise — this is where "no wall clock" is enforced */
    noise(x, y) {
      let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed, 69069);
      n = Math.imul(n ^ (n >>> 13), 1274126177);
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    },
    n2(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), tx = smooth(x - xi), ty = smooth(y - yi);
      const a = K.noise(xi, yi), b = K.noise(xi + 1, yi), c = K.noise(xi, yi + 1), d = K.noise(xi + 1, yi + 1);
      return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    },
    fbm(x, y, o = 3) {
      let v = 0, amp = 0.5, f = 1;
      for (let k = 0; k < o; k++) { v += amp * K.n2(x * f, y * f); amp *= 0.5; f *= 2.03; }
      return v;
    },
    rng(k) {
      let s = ((seed ^ Math.imul(k, 2654435761)) >>> 0) || 1;
      return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
    },
    map(fn) {
      const b = K.buf;
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const q = y * FW + x, nv = fn(x, y, b[q]);
        if (nv !== undefined) b[q] = nv;
      }
    },
  };
  return K;
}

/* word rasteriser + cache (module-level: glyphs are world-independent) */
const WORDS = new Map();
function wordRaster(text, ph) {
  const key = text + "|" + ph;
  if (WORDS.has(key)) return WORDS.get(key);
  const S = 4, fpx = Math.max(4, Math.round(ph * S));
  const c = document.createElement("canvas");
  const q = c.getContext("2d");
  q.font = `900 ${fpx}px ui-monospace, Menlo, Consolas, monospace`;
  const tw = Math.ceil(q.measureText(text).width);
  c.width = tw + S * 2; c.height = Math.ceil(fpx * 1.5);
  const q2 = c.getContext("2d");
  q2.font = `900 ${fpx}px ui-monospace, Menlo, Consolas, monospace`;
  q2.textBaseline = "middle";
  q2.fillStyle = "#000";
  q2.fillText(text, S, c.height / 2);
  const im = q2.getImageData(0, 0, c.width, c.height).data;
  const w = Math.ceil(c.width / S), h = Math.ceil(c.height / S);
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = Math.min(c.width - 1, x * S + (S >> 1)), py = Math.min(c.height - 1, y * S + (S >> 1));
    data[y * w + x] = im[(py * c.width + px) * 4 + 3] > 120 ? 1 : 0;
  }
  const g = { w, h, data };
  WORDS.set(key, g);
  return g;
}

/* ------------------------------------------------------------------- sound
   All synthesis, nothing sampled. A bed of detuned partials whose root
   steps with the movements, plus foley: decaying partials + shaped noise. */
/* One audio context serves a whole session. The bed is retuned when the film
   changes rather than rebuilt — a second AudioContext per film would cost a
   hardware stream each and browsers cap how many you may have. */
export function makeSound(world) {
  let ac = null, master = null, oscs = [], noiseGain = null, on = false;
  let spec = world.drone || { base: 55, steps: [0, 3, 7, 10] };
  let seed = world.seed || 1;
  function boot() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const defs = [[1, "sine", 0.16], [1.007, "triangle", 0.05], [2.003, "sine", 0.045]];
    oscs = defs.map(([m, type, g]) => {
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = type; o.frequency.value = spec.base * m;
      og.gain.value = g; o.connect(og); og.connect(master); o.start();
      return { o, m };
    });
    const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const nd = nb.getChannelData(0);
    let s = (seed >>> 0) || 1;
    for (let i = 0; i < nd.length; i++) { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; nd[i] = (((s >>> 0) / 4294967296) * 2 - 1) * 0.5; }
    const src = ac.createBufferSource(); src.buffer = nb; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 0.7;
    f.frequency.value = spec.bright ? 900 : 260;
    noiseGain = ac.createGain(); noiseGain.gain.value = 0.05;
    src.connect(f); f.connect(noiseGain); noiseGain.connect(master); src.start();
    boot.air = f;
  }
  return {
    get on() { return on; },
    /* the suite player calls this at every film boundary */
    setWorld(w) {
      spec = w.drone || spec; seed = w.seed || seed;
      if (ac && boot.air) boot.air.frequency.setTargetAtTime(spec.bright ? 900 : 260, ac.currentTime, 0.8);
    },
    toggle() {
      if (!ac) boot();
      if (ac.state === "suspended") ac.resume();
      on = !on;
      master.gain.cancelScheduledValues(ac.currentTime);
      master.gain.setTargetAtTime(on ? 0.55 : 0, ac.currentTime, 0.4);
      return on;
    },
    step(i) {
      if (!ac) return;
      const st = spec.steps[i % spec.steps.length];
      const root = spec.base * Math.pow(2, st / 12);
      const t = ac.currentTime;
      for (const { o, m } of oscs) {
        o.frequency.cancelScheduledValues(t);
        o.frequency.setTargetAtTime(root * m, t, 1.2);
      }
    },
    /* a struck body: partials + a contact transient, tail ≤ the room */
    cue(c) {
      if (!ac || !on) return;
      const t0 = ac.currentTime + 0.01;
      const f = c.f || 800, decay = c.decay || 0.15, gain = (c.gain ?? 0.5) * 0.5;
      for (const [pi, p] of (c.partials || [1, 2.4, 4.1]).entries()) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f * p;
        g.gain.setValueAtTime(gain / (pi + 1), t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay * (1 + pi * 0.2));
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0 + decay * 2 + 0.1);
      }
      if (c.noise) {
        const dur = c.nDecay || 0.05;
        const nb = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur * 3), ac.sampleRate);
        const nd = nb.getChannelData(0);
        let s = ((c.seed || 1) >>> 0) || 1;
        for (let i = 0; i < nd.length; i++) {
          s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
          nd[i] = (((s >>> 0) / 4294967296) * 2 - 1) * Math.exp(-i / (ac.sampleRate * dur));
        }
        const src = ac.createBufferSource(); src.buffer = nb;
        const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2.2; bp.Q.value = 1.1;
        const g = ac.createGain(); g.gain.value = gain * c.noise;
        src.connect(bp); bp.connect(g); g.connect(master); src.start(t0);
      }
    },
  };
}

/* -------------------------------------------------------------- the runtime
   Shared by the full player and the index previews. Pure: renderField(t)
   fills a Float32Array for absolute suite-time t, nothing else. */
export function makeRuntime(world) {
  const K = makeKit(world.seed || 1);
  const title = {
    label: "TITLE", line: "", seconds: 5,
    draw(u, F) {
      F.clear(7);
      F.word(world.n, F.W / 2, F.H * 0.30, 13, 0, true);
      const words = world.title.split(" ");
      const ph = world.title.length > 16 ? 12 : 15;
      if (words.length > 2 && world.title.length > 14) {
        const mid = Math.ceil(words.length / 2);
        F.word(words.slice(0, mid).join(" "), F.W / 2, F.H * 0.46, ph, 0, true);
        F.word(words.slice(mid).join(" "), F.W / 2, F.H * 0.58, ph, 0, true);
      } else {
        F.word(world.title, F.W / 2, F.H * 0.52, ph, 0, true);
      }
      F.word("A WYGWYL HALFWORLD", F.W / 2, F.H * 0.78, 8, 2, true);
      /* the carve arrives dot by dot, on the ordered schedule */
      F.map((x, y, v) => (v < 3.5 && F.bayer(x, y) > u * 2.4 ? 7 : undefined));
    },
  };
  const movements = [title, ...world.movements];
  const starts = []; let total = 0;
  for (const m of movements) { starts.push(total); total += m.seconds; }

  const bufA = new Float32Array(CELLS), bufB = new Float32Array(CELLS), bufT = new Float32Array(CELLS);

  function locate(t) {
    t = ((t % total) + total) % total;
    let i = movements.length - 1;
    while (i > 0 && t < starts[i]) i--;
    return [i, (t - starts[i]) / movements[i].seconds, t];
  }
  function renderMovement(m, u, buf) {
    K.bind(buf); K.u = u;
    K.clear(0);
    m.draw(clamp01(u), K);
    const fx = m.fx || {};
    if (fx.smear) {
      const { taps = 2, spread = 0.02, fall = 1.6 } = fx.smear;
      for (let k = 1; k <= taps; k++) {
        K.bind(bufT); K.clear(0);
        m.draw(clamp01(u - k * spread), K);
        for (let q = 0; q < CELLS; q++) {
          const v = bufT[q] - k * fall;
          if (v > buf[q] && bufT[q] <= 7) buf[q] = v;
        }
      }
      K.bind(buf);
    }
    if (fx.kaleido) {
      const mode = fx.kaleido;
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const sx = (mode === "x" || mode === "quad") && x >= FW / 2 ? FW - 1 - x : x;
        const sy = (mode === "y" || mode === "quad") && y >= FH / 2 ? FH - 1 - y : y;
        if (sx !== x || sy !== y) buf[y * FW + x] = buf[sy * FW + sx];
      }
    }
    if (fx.invert) {
      const amt = typeof fx.invert === "function" ? fx.invert(u) : fx.invert;
      if (amt > 0) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        if (bayerAt(x, y) < amt) {
          const q = y * FW + x;
          if (buf[q] <= 7) buf[q] = 7 - buf[q];
        }
      }
    }
    if (fx.shake) {
      const amp = typeof fx.shake === "function" ? fx.shake(u) : fx.shake;
      if (amp > 0.05) {
        const dx = Math.round((K.noise(Math.floor(u * 431), 7) - 0.5) * 2 * amp);
        const dy = Math.round((K.noise(Math.floor(u * 431), 13) - 0.5) * 2 * amp);
        if (dx || dy) {
          bufT.set(buf);
          for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
            const sx = x + dx, sy = y + dy;
            buf[y * FW + x] = (sx >= 0 && sx < FW && sy >= 0 && sy < FH) ? bufT[sy * FW + sx] : 0;
          }
        }
      }
    }
  }
  function renderField(t) {
    const [i, u] = locate(t);
    const m = movements[i];
    renderMovement(m, u, bufA);
    const rem = (1 - u) * m.seconds;
    if (rem < XFADE) {
      const j = (i + 1) % movements.length;
      const tt = (XFADE - rem) / XFADE;
      const u2 = Math.max(0, (XFADE - rem) / movements[j].seconds - XFADE / movements[j].seconds);
      renderMovement(movements[j], u2, bufB);
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        if (bayerAt(x, y) < tt) { const q = y * FW + x; bufA[q] = bufB[q]; }
      }
    }
    return bufA;
  }
  return { movements, starts, total, locate, renderField };
}

/* the halftone pass: paper, faint mesh, dots by darkness. The one place the
   ink field becomes a picture. */
export function makePost(canvas, accent) {
  const ctx = canvas.getContext("2d");
  let cell = 4, ox = 0, oy = 0, bg = null;
  function fit(cw, ch, dpr) {
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + "px"; canvas.style.height = ch + "px";
    cell = Math.min(canvas.width / FW, canvas.height / FH);
    ox = (canvas.width - cell * FW) / 2; oy = (canvas.height - cell * FH) / 2;
    bg = document.createElement("canvas");
    bg.width = canvas.width; bg.height = canvas.height;
    const g = bg.getContext("2d");
    g.fillStyle = PAPER; g.fillRect(0, 0, bg.width, bg.height);
    g.strokeStyle = "rgba(0,0,0,.07)"; g.lineWidth = Math.max(1, dpr * 0.5);
    g.beginPath();
    for (let y = oy + cell * 0.5; y < oy + cell * FH; y += Math.max(3, cell * 0.72)) {
      g.moveTo(ox, y); g.lineTo(ox + cell * FW, y);
    }
    g.stroke();
  }
  function draw(buf) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    const batches = [[], [], [], [], [], [], [], []];
    const acc = [];
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const v = buf[y * FW + x];
      if (v < 0.45) continue;
      if (v > 7.5) { acc.push(x, y); continue; }
      const lv = Math.min(7, Math.round(v));
      if (lv >= 1) batches[lv].push(x, y);
    }
    ctx.fillStyle = INKC;
    for (let lv = 1; lv <= 7; lv++) {
      const pts = batches[lv];
      if (!pts.length) continue;
      const r = cell * 0.5 * Math.pow(lv / 7, 0.72) * 1.24;
      ctx.beginPath();
      for (let k = 0; k < pts.length; k += 2) {
        const px = ox + (pts[k] + 0.5) * cell, py = oy + (pts[k + 1] + 0.5) * cell;
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, TAU);
      }
      ctx.fill();
    }
    if (acc.length) {
      ctx.fillStyle = accent;
      const r = cell * 0.44;
      ctx.beginPath();
      for (let k = 0; k < acc.length; k += 2) {
        const px = ox + (acc[k] + 0.5) * cell, py = oy + (acc[k + 1] + 0.5) * cell;
        ctx.moveTo(px + r, py);
        ctx.arc(px, py, r, 0, TAU);
      }
      ctx.fill();
    }
  }
  return { fit, draw };
}

/* ------------------------------------------------------------------ mount */
export function mount(world) {
  document.title = `${world.n} · ${world.title} — a WYGWYL halfworld`;
  document.body.innerHTML = `
    <header>
      <span class="brand"><span class="dot"></span>WYGWYL</span>
      <span class="ttl">${world.n} · ${world.title}</span>
      <span class="tagline">${world.tagline || ""}</span>
      <span class="sp"></span>
      <a class="btn" href="index.html">SUITE</a>
    </header>
    <main>
      <div id="stagewrap">
        <canvas id="stage"></canvas>
        <div id="chip"></div>
      </div>
      <div id="linebar"><span id="voice"></span></div>
    </main>
    <footer>
      <button id="play" aria-label="play/pause">▶</button>
      <button id="prev">◀◀</button>
      <button id="next">▶▶</button>
      <input id="scrub" type="range" min="0" max="1000" step="1" value="0">
      <span id="clock"></span>
      <button id="snd" aria-pressed="false">SOUND</button>
      <button id="cin">CINEMA</button>
    </footer>`;

  const R = makeRuntime(world);
  const canvas = document.getElementById("stage");
  const post = makePost(canvas, world.accent || "#0033cc");
  const sound = makeSound(world);
  const $ = (id) => document.getElementById(id);

  let t = 0, playing = true, lastNow = performance.now(), lastI = -1, prevU = 0;
  const startAt = new URLSearchParams(location.search).get("m");
  if (startAt) t = R.starts[Math.min(R.movements.length - 1, +startAt)] || 0;

  function fit() {
    const w = document.getElementById("stagewrap");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    post.fit(w.clientWidth, w.clientHeight, dpr);
  }
  window.addEventListener("resize", fit);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function frame(now) {
    const dt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    if (playing) t = (t + dt) % R.total;
    const [i, u] = R.locate(t);
    const m = R.movements[i];
    if (i !== lastI) { sound.step(i); lastI = i; prevU = 0; }
    for (const c of m.cues || []) {
      if (c.at > prevU && c.at <= u) sound.cue(c);
    }
    prevU = u;
    post.draw(R.renderField(t));
    /* the line arrives the way spoken word arrives: a phrase at a time */
    const words = (m.line || "").split(" ");
    const nWords = Math.ceil(clamp01(u * 1.18) * words.length);
    $("voice").textContent = words.slice(0, nWords).join(" ");
    $("linebar").style.visibility = m.line ? "visible" : "hidden";
    $("chip").textContent = i === 0 ? `${world.n} · TITLE`
      : `${world.n} · M${i}/${R.movements.length - 1} · ${m.label}`;
    $("clock").textContent = `${fmt(t)} / ${fmt(R.total)}`;
    if (!scrubbing) $("scrub").value = Math.round(t / R.total * 1000);
    requestAnimationFrame(frame);
  }

  let scrubbing = false;
  $("play").onclick = () => { playing = !playing; $("play").textContent = playing ? "Ⅱ" : "▶"; };
  $("prev").onclick = () => { const [i] = R.locate(t - 0.01); t = R.starts[(i - 1 + R.movements.length) % R.movements.length]; };
  $("next").onclick = () => { const [i] = R.locate(t); t = R.starts[(i + 1) % R.movements.length]; };
  $("scrub").addEventListener("input", (e) => { scrubbing = true; t = +e.target.value / 1000 * R.total; });
  $("scrub").addEventListener("change", () => { scrubbing = false; });
  $("snd").onclick = (e) => { const on = sound.toggle(); e.target.setAttribute("aria-pressed", String(on)); };
  $("cin").onclick = () => document.body.classList.toggle("cinema");
  canvas.addEventListener("dblclick", () => document.body.classList.toggle("cinema"));
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") { e.preventDefault(); $("play").click(); }
    if (e.key === "ArrowRight") $("next").click();
    if (e.key === "ArrowLeft") $("prev").click();
    if (e.key === "f" || e.key === "F") $("cin").click();
    if (e.key === "s" || e.key === "S") $("snd").click();
  });

  /* headless QA hook: harness scripts seek and read state through this */
  window.__hw = {
    world, runtime: R,
    seek(tt) { t = tt; playing = false; },
    play() { playing = true; },
  };

  fit();
  $("play").textContent = "Ⅱ";
  requestAnimationFrame(frame);
}

/* a static preview frame for the suite index */
export function drawPreview(world, canvas, t) {
  if (!canvas.__rt) {
    canvas.__rt = makeRuntime(world);
    canvas.__post = makePost(canvas, world.accent || "#0033cc");
    canvas.__post.fit(canvas.clientWidth || 288, canvas.clientHeight || 216, 1);
  }
  canvas.__post.draw(canvas.__rt.renderField(t));
  return canvas.__rt;
}
