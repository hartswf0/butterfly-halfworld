/* ============================================================================
   ops.mjs — SIX OPERATIONS, ONE UTTERANCE.

   The jukebox stops being a reference list at the moment you notice that each
   ancestor contributes a different OPERATION, and that the operations compose.
   Not "in the manner of" — an actual transform with a signature, applied to a
   buffer, producing another buffer that can be fed to the next one.

     LOCK      Tawney · Grey Funnel      a human tempo entrains to a machine one
     INHABIT   Tawney · Diesel & Shale   everything shares one small hard room
     ADDRESS   Anderson · O Superman     a syllable becomes the infrastructure
     RECURSE   Lucier · Sitting in a Room  generation n is made from n-1
     DECAY     Basinski · Disintegration every retrieval costs information
     SHELTER   Bryars · Jesus' Blood     orchestration gathers, never overpowers

   THE LAW THAT MAKES IT A THEORY AND NOT A MOOD. Every derived signal in a
   piece built from these must descend from ONE recorded utterance, by
   operators only. Nothing may be added from outside. When a piece then
   "reveals" late that its pulse and its ping and its engine are the same
   human word, that is not a gesture — it is true, and it can be checked by
   reading the code backwards.

   Buffers, not samples. RECURSE and DECAY are multi-pass by nature: you cannot
   make generation twelve from generation eleven inside a single per-sample
   loop. So a piece here is built in passes — utterance, then transforms, then
   a sequence — which is also why the lineage is legible in the source.
   ========================================================================= */

export const SR = 44100;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export { clamp, lerp, smooth };

export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; };
}
export const secs = (n) => Math.round(n * SR);
export const buf = (n) => new Float32Array(n);
export function peak(x) { let p = 0; for (const v of x) { const a = Math.abs(v); if (a > p) p = a; } return p; }
export function norm(x, to = 0.9) { const p = peak(x); if (p > 1e-9) { const g = to / p; for (let i = 0; i < x.length; i++) x[i] *= g; } return x; }
export function mix(dst, src, gain = 1, at = 0) {
  const off = Math.round(at);
  for (let i = 0; i < src.length; i++) { const j = off + i; if (j >= 0 && j < dst.length) dst[j] += src[i] * gain; }
  return dst;
}

/* ------------------------------------------------------------------ filters */
export function lowpass(x, cut, out = buf(x.length)) {
  let z = 0; const a = 1 - Math.exp(-2 * Math.PI * clamp(cut, 8, SR * 0.45) / SR);
  for (let i = 0; i < x.length; i++) out[i] = (z += a * (x[i] - z));
  return out;
}
export function highpass(x, cut, out = buf(x.length)) {
  let z = 0; const a = 1 - Math.exp(-2 * Math.PI * clamp(cut, 8, SR * 0.45) / SR);
  for (let i = 0; i < x.length; i++) { z += a * (x[i] - z); out[i] = x[i] - z; }
  return out;
}
export function bandpass(x, f, q, out = buf(x.length)) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const w = 2 * Math.PI * clamp(f, 20, SR * 0.45) / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
  const b0 = al, b2 = -al, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
  for (let i = 0; i < x.length; i++) {
    const v = x[i];
    const y = (b0 * v + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = v; y2 = y1; y1 = y; out[i] = y;
  }
  return out;
}

/* ------------------------------------------------------------------ a room
   Schroeder, with the comb feedback solved from a target RT60 so a room's size
   is a number in the source rather than an adjective. `modes` detunes the comb
   lengths — that is what gives a particular room its particular melody, and it
   is the thing RECURSE goes looking for. */
export function room({ rt60 = 2.2, modes = 1, damp = 0.3 } = {}) {
  const C = [1557, 1617, 1491, 1422, 1277, 1356].map(n => Math.max(31, Math.round(n * modes)));
  const A = [225, 556];
  const combs = C.map(n => ({ b: buf(n), i: 0, n, g: Math.pow(10, -3 * n / (rt60 * SR)), lp: 0 }));
  const alls = A.map(n => ({ b: buf(n), i: 0, n, g: 0.5 }));
  return (x, out = buf(x.length)) => {
    for (const c of combs) { c.b.fill(0); c.i = 0; c.lp = 0; }
    for (const a of alls) { a.b.fill(0); a.i = 0; }
    for (let k = 0; k < x.length; k++) {
      let y = 0;
      for (const c of combs) {
        const v = c.b[c.i]; y += v;
        c.lp = v * (1 - damp) + c.lp * damp;
        c.b[c.i] = x[k] + c.lp * c.g;
        if (++c.i >= c.n) c.i = 0;
      }
      y /= combs.length;
      for (const a of alls) {
        const v = a.b[a.i], o = -a.g * y + v;
        a.b[a.i] = y + a.g * o;
        if (++a.i >= a.n) a.i = 0;
        y = o;
      }
      out[k] = y;
    }
    return out;
  };
}

/* ========================================================== THE SIX OPERATORS */

/* LOCK · Tawney, The Grey Funnel Line.
   "the person begins behaving like the machine carrying him away." A human
   period and a machine period, and a pull that grows: by the end the singer
   has learned to pass time the way the vessel does. Returns a function from
   time to the CURRENT effective period, so a melody written in free human
   time can be played through it and come out entrained. */
export function LOCK({ human, machine, over }) {
  return (t) => {
    const p = smooth(clamp(t / over, 0, 1));
    /* the machine never bends; only the man does. That asymmetry is the song. */
    return lerp(human, machine * Math.round(human / machine), p);
  };
}

/* INHABIT · Tawney, Diesel and Shale.
   "the machine separating the sailor from earth is also keeping him alive."
   One small hard space, and EVERYTHING goes through it — voice, guitar,
   breath, memory — until the distinction between sailor and submarine stops
   meaning anything. A compartment too small to reverberate: short RT60, strong
   modes, and a lowpass because there is no fresh air in it. */
export function INHABIT({ rt60 = 0.28, modes = 0.34, air = 2600 } = {}) {
  const r = room({ rt60, modes, damp: 0.55 });
  return (x) => {
    const wet = r(x);
    const out = buf(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] * 0.55 + wet[i] * 0.85;
    return lowpass(out, air, out);
  };
}

/* ADDRESS · Anderson, O Superman.
   "Build the rhythm section out of a human exhalation rather than drums: one
   syllable repeating until breath becomes infrastructure." Takes an utterance
   and returns a CLOCK — the syllable at a tempo, forever. What comes back is
   not a drum part that sounds like a voice; it is the voice, being the time. */
export function ADDRESS(utterance, { bpm = 100, seconds, gain = 0.5 }) {
  const per = secs(60 / bpm), n = secs(seconds), out = buf(n);
  for (let at = 0; at < n; at += per) mix(out, utterance, gain, at);
  return out;
}

/* RECURSE · Lucier, I Am Sitting in a Room.
   "Do not distort the voice directly. Put it into a room, record what the room
   does to it, then make that damaged recording the only source allowed for the
   next pass." The one absolute rule is that the master is never consulted
   again: generation n is built from n-1 and nothing else. Normalising between
   generations is not cheating — it is the tape op turning the gain up, and
   without it the whole thing walks into the noise floor by generation four. */
export function RECURSE(x, { generations = 12, rt60 = 2.4, modes = 1, keep = [] } = {}) {
  const r = room({ rt60, modes, damp: 0.24 });
  let g = Float32Array.from(x);
  const kept = [];
  for (let k = 0; k < generations; k++) {
    const wet = r(g);
    /* the microphone hears the room, not the source: no dry path at all */
    g = norm(wet, 0.9);
    if (keep.includes(k)) kept.push(Float32Array.from(g));
  }
  /* ONE SHAPE, ALWAYS. This returned a bare buffer without `keep` and an
     object with it, so a caller who wanted only the last generation
     destructured `final` off a Float32Array and got undefined. An operator
     whose return type depends on an optional argument is a trap set for the
     person composing with it, which is the entire point of this file. */
  return { final: g, kept };
}

/* DECAY · Basinski, The Disintegration Loops.
   "every revolution must permanently lose information." Not an old-tape
   colour: a destructive read. The loop buffer is MUTATED as it plays, so pass
   eleven is genuinely built from the damage pass ten did, and the original is
   never consulted again. Three kinds of loss, because oxide does not fail one
   way: dropouts take transients, a spectral hole takes a band for good, and
   the transport wanders. */
export function DECAY(loop, { revolutions = 24, seed = 7, rate = 1 } = {}) {
  const rnd = rng(seed);
  const L = loop.length, live = Float32Array.from(loop);
  const out = buf(L * revolutions);
  const holes = [];
  for (let rev = 0; rev < revolutions; rev++) {
    /* the transport wanders — read the live buffer at a drifting rate */
    const wow = 1 + Math.sin(rev * 0.7) * 0.0016 * rate + rnd() * 0.0009 * rate;
    for (let i = 0; i < L; i++) {
      const p = clamp(i * wow, 0, L - 2), p0 = Math.floor(p);
      out[rev * L + i] = lerp(live[p0], live[p0 + 1], p - p0);
    }
    /* and then the pass costs something, permanently */
    const bite = 0.0018 * rate * (1 + rev * 0.08);
    for (let i = 0; i < L; i++) if (Math.abs(rnd()) < bite) {
      const w = 20 + Math.floor(Math.abs(rnd()) * 900);       // a dropout
      for (let j = i; j < Math.min(L, i + w); j++) live[j] *= 0.12;
    }
    if (rev % 3 === 2) {                                       // and a band, for good
      const f = 180 * Math.pow(2, Math.abs(rnd()) * 5.2);
      holes.push(f);
      const notched = bandpass(live, f, 1.4);
      for (let i = 0; i < L; i++) live[i] -= notched[i] * 0.65;
    }
  }
  return { audio: out, holes };
}

/* SHELTER · Bryars, Jesus' Blood Never Failed Me Yet.
   "The orchestra must never overpower or sentimentalize the source — it
   shelters it." Strings that arrive from below audibility, tuned to the
   fragment's OWN pitch rather than to a key chosen for it, and gain-limited
   so the fragment always wins. The instruction is not "add strings"; it is
   "build a room around him out of consonance." */
export function SHELTER(fragment, { root, seconds, arrive = 0.35, ceiling = 0.34, seed = 3 } = {}) {
  const n = secs(seconds), out = buf(n), rnd = rng(seed);
  /* a warm consonant stack: root, fifth, octave, tenth — no third in the bass,
     so it shelters without deciding whether the song is happy */
  const voices = [1, 1.5, 2, 2.5, 3].map((r, k) => ({
    hz: root * r,
    /* each player is a person: slightly late, slightly out, slowly breathing */
    det: 1 + rnd() * 0.0022, ph: Math.abs(rnd()) * 6.283, vib: 0.6 + Math.abs(rnd()) * 0.5,
    g: [0.30, 0.22, 0.17, 0.11, 0.08][k],
  }));
  for (let i = 0; i < n; i++) {
    const t = i / SR, u = t / seconds;
    /* they arrive so slowly you cannot say when they came in */
    const swell = smooth(clamp((u - arrive) / (1 - arrive) * 1.35, 0, 1));
    let v = 0;
    for (const q of voices) {
      const f = q.hz * q.det * (1 + Math.sin(t * 6.283 * q.vib) * 0.0016);
      v += Math.sin(t * 6.283 * f + q.ph) * q.g;
    }
    out[i] = v * swell * ceiling;
  }
  /* bowed, not blown: soften the top so it never competes for the consonants */
  return lowpass(out, 2200, out);
}

/* ------------------------------------------------------------ the utterance
   One word, built from phonemes rather than recorded, because a piece whose
   subject is a voice DECAYING needs a voice that can be starved: the
   consonants taken before the vowel, the vowel before the pitch. A sample can
   only be processed. This can be undone. */
export function utter(word = "home", { f0 = 132, seconds = 0.66, seed = 11, breath = 1 } = {}) {
  const n = secs(seconds), out = buf(n), rnd = rng(seed);
  let g = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0, x1b = 0, x2b = 0, y1b = 0, y2b = 0;
  const bq = (v, f, q, s) => {
    const w = 2 * Math.PI * f / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
    const a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    const y = (al * v - al * s.x2 - a1 * s.y1 - a2 * s.y2) / a0;
    s.x2 = s.x1; s.x1 = v; s.y2 = s.y1; s.y1 = y; return y;
  };
  const s1 = { x1: 0, x2: 0, y1: 0, y2: 0 }, s2 = { x1: 0, x2: 0, y1: 0, y2: 0 };
  for (let i = 0; i < n; i++) {
    const p = i / n;
    let voiced, noise, F1, F2, open;
    if (p < 0.10) { voiced = 0.05; noise = 1 * breath; F1 = 520; F2 = 900; open = 1; }
    else if (p < 0.55) { const q = (p - 0.10) / 0.45; voiced = 1; noise = 0.06 * (1 - q) * breath; F1 = lerp(520, 380, q); F2 = lerp(900, 700, q); open = 1; }
    else if (p < 0.85) { const q = (p - 0.55) / 0.30; voiced = 1; noise = 0; F1 = lerp(380, 280, q); F2 = lerp(700, 1100, q); open = lerp(1, 0.15, q); }
    else { const q = (p - 0.85) / 0.15; voiced = 1 - q; noise = 0; F1 = 280; F2 = 1100; open = 0.15 * (1 - q); }
    g += f0 / SR;
    const src = (Math.exp(-(g % 1) * 5) - 0.22) * 2.2 * voiced + rnd() * noise * 0.7;
    out[i] = (bq(src, F1, 9, s1) + bq(src, F2, 11, s2) * 0.5) * (open * 0.9 + 0.1);
  }
  /* a mouth opens and closes; do not let it click */
  const e = secs(0.012);
  for (let i = 0; i < e; i++) { out[i] *= i / e; out[n - 1 - i] *= i / e; }
  return norm(out, 0.85);
}
