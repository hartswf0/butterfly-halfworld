/* ============================================================================
   abyss.mjs — THE SOUND OF A MACHINE TRYING TO CRY AND ONLY PRODUCING A SIGNAL.

   Same law as the pictures: a pure function of time. No wall clock, no
   Math.random, no state carried between renders that is not an explicit filter
   memory. Render it twice and you get the same file, byte for byte, which is
   what lets a sound be REVISED rather than re-rolled.

   ONE NUMBER RUNS THE PIECE. `depth(t)` goes 0 to 1 across the duration and
   every layer reads it. Deeper means: darker (the lowpass closes), slower
   (the lung's period drifts long), further (reverb send rises, dry falls),
   more broken (detune, bitcrush and dropout all climb), and lonelier (the
   voice loses its consonants before it loses its pitch). Nothing is automated
   independently. A descent is one gesture, so it is one variable.

   THE SIX LAYERS

     lung    120 BPM, and asymmetric — 0.18s of intake against 0.32s of ragged
             exhale, because a bellows is not a metronome. As depth rises the
             period jitters and then begins to MISS beats outright. An iron
             lung failing is not a slower pulse, it is a pulse with holes.
     hull    the diesel: 38 Hz with slow FM and a hard rolloff, the only thing
             in the piece with no reverb on it at all. It is inside with you.
     shanty  an original modal phrase in E aeolian, sung by three formants over
             a glottal pulse train, then put under a mile of water: wow and
             flutter on a slow random walk, and a lowpass that closes to a
             whisper. It is not a sample. It is a synthesis, so it can rot
             continuously rather than in edits.
     rain    the sonar rain of back home — noise bursts through a bandpass,
             then a Schroeder reverb with a ten second tail, then 78rpm
             crackle. Memory arrives already damaged.
     home    the word, built from phonemes rather than recorded: /h/ as a noise
             burst, /oʊ/ as two formants gliding into a round vowel, /m/ as a
             nasal murmur with the mouth shut. Looped on the sonar interval and
             degraded until the vowel is all that is left, then until the pitch
             is all that is left, then until only the interval is left.
     whale   a long glissando in the band where whale song and a human sob
             overlap, with vibrato slow enough to read as breath. It answers
             the sonar and is never in time with it.

   WHY SYNTHESISE THE VOICE INSTEAD OF SAMPLING ONE. Because the brief asks for
   a voice that DECAYS, and a sample can only be processed. A formant model can
   be starved — the consonants can be taken away before the vowel, the vowel
   before the pitch — which is how a memory actually goes.
   ========================================================================= */

export const SR = 44100;

/* ------------------------------------------------------------- determinism */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; };
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ------------------------------------------------------------------ filters
   One-pole and biquad, written as closures with their own memory. Each is
   constructed once per render and stepped per sample; nothing is shared, so a
   layer can never smear into another layer's state. */
function onePoleLP() {
  let z = 0;
  return (x, cut) => {
    const a = 1 - Math.exp(-2 * Math.PI * clamp(cut, 8, SR * 0.45) / SR);
    return (z += a * (x - z));
  };
}
function onePoleHP() {
  const lp = onePoleLP();
  return (x, cut) => x - lp(x, cut);
}
/* resonant bandpass — the formant. Constant skirt gain, so a vowel keeps its
   loudness as it moves. */
function biquadBP() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q) => {
    const w = 2 * Math.PI * clamp(f, 20, SR * 0.45) / SR;
    const al = Math.sin(w) / (2 * q), c = Math.cos(w);
    const b0 = al, b1 = 0, b2 = -al, a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
/* Schroeder reverb: four combs in parallel into two allpasses. The comb
   feedback is solved from a target RT60 rather than tuned by ear, so "ten
   second cathedral" is a number in the source and not an adjective. */
function reverb(rt60) {
  const C = [1557, 1617, 1491, 1422, 1277, 1356];
  const A = [225, 556];
  const combs = C.map(n => ({ buf: new Float32Array(n), i: 0, n, g: Math.pow(10, -3 * n / (rt60 * SR)), lp: 0 }));
  const alls = A.map(n => ({ buf: new Float32Array(n), i: 0, n, g: 0.5 }));
  return (x, damp = 0.35) => {
    let y = 0;
    for (const c of combs) {
      const v = c.buf[c.i];
      y += v;
      c.lp = v * (1 - damp) + c.lp * damp;      // air absorbs the top first
      c.buf[c.i] = x + c.lp * c.g;
      if (++c.i >= c.n) c.i = 0;
    }
    y /= combs.length;
    for (const a of alls) {
      const v = a.buf[a.i];
      const out = -a.g * y + v;
      a.buf[a.i] = y + a.g * out;
      if (++a.i >= a.n) a.i = 0;
      y = out;
    }
    return y;
  };
}
function delay(maxSec) {
  const n = Math.ceil(maxSec * SR), buf = new Float32Array(n);
  let i = 0;
  return {
    push(x) { buf[i] = x; if (++i >= n) i = 0; },
    tap(sec) {
      const d = clamp(sec * SR, 1, n - 2);
      const j = i - d, k = ((j % n) + n) % n, k0 = Math.floor(k), fr = k - k0;
      return lerp(buf[k0], buf[(k0 + 1) % n], fr);
    },
  };
}

/* --------------------------------------------------------------- the shanty
   An original phrase, not a quotation: E aeolian, a rising fourth to the
   tonic and a stepwise fall to the flat seventh — the naval-homesick cadence,
   written here rather than borrowed. Semitones from E2, and a length in beats
   at 120, so the tune sits across the lung rather than on it. */
const E2 = 82.407;
const st = (n) => E2 * Math.pow(2, n / 12);
const PHRASE = [
  [7, 3], [12, 3], [14, 2], [15, 4], [14, 2], [12, 3], [10, 6], [12, 3],
  [7, 3], [10, 3], [12, 4], [10, 2], [ 8, 3], [ 7, 6], [ 5, 3], [ 7, 8],
];

/* ------------------------------------------------------------------ the word
   "home" from phonemes. /h/ is a noise burst shaped by the vowel that follows
   it, /oʊ/ is two formants gliding as the lips round, /m/ is a nasal murmur
   with the mouth closed — a low F1 and nothing above it. */
function homeEnvelope(p) {           // p is 0..1 through the word
  if (p < 0.10) return { voiced: 0.05, noise: 1.0, f1: 520, f2: 900, open: 1.0 };
  if (p < 0.55) { const q = (p - 0.10) / 0.45;
    return { voiced: 1, noise: 0.06 * (1 - q), f1: lerp(520, 380, q), f2: lerp(900, 700, q), open: 1 }; }
  if (p < 0.85) { const q = (p - 0.55) / 0.30;
    return { voiced: 1, noise: 0, f1: lerp(380, 280, q), f2: lerp(700, 1100, q), open: lerp(1, 0.15, q) }; }
  const q = (p - 0.85) / 0.15;
  return { voiced: 1 - q, noise: 0, f1: 280, f2: 1100, open: 0.15 * (1 - q) };
}

/* ============================================================================ */
export function render({ seconds = 186, seed = 1953, sr = SR } = {}) {
  const N = Math.round(seconds * sr);
  const out = new Float32Array(N);

  const rnd = rng(seed);
  /* one long random walk, sampled — wow and flutter, and the lung's jitter,
     both read from it so the machine and the memory drift together */
  const WALK = new Float32Array(4096);
  { let v = 0; for (let i = 0; i < WALK.length; i++) { v = v * 0.985 + rnd() * 0.05; WALK[i] = v; } }
  const walk = (t, rate) => {
    const x = (t * rate) % WALK.length, i = Math.floor(x);
    return lerp(WALK[i], WALK[(i + 1) % WALK.length], x - i);
  };

  /* the crackle and the rain are impulse trains drawn once, so the piece is
     the same piece every time it is rendered */
  const cr = rng(seed ^ 0x51ab);
  const rr = rng(seed ^ 0x9d2f);

  const revRain = reverb(10.0);
  const revWord = reverb(6.5);
  const lpMaster = onePoleLP();
  const hpRain = onePoleHP();
  const bpRain = biquadBP();
  const fmt = [biquadBP(), biquadBP(), biquadBP()];
  const wfmt = [biquadBP(), biquadBP()];
  const lpWord = onePoleLP();
  const lpShanty = onePoleLP();
  const lpHull = onePoleLP();
  const salt = delay(1.2);

  let glot = 0, wglot = 0, hullPh = 0, whalePh = 0, subPh = 0;
  const BEAT = 0.5;                                  // 120 BPM

  /* the phrase laid out in seconds, once, so the melody is a lookup */
  /* THE PHRASES PULL APART AS IT SINKS. Laid end to end, four repeats of the
     tune filled the piece and the last minute was as busy as the first — the
     integrated loudness range came back at 0.7 LU, which is a flat line
     pretending to be a descent. The rests between repeats now grow, so what
     thins out is not the volume but the COMPANY. A voice you hear less often
     is further away than a voice you hear more quietly. */
  const notes = [];
  { let t = 6.0;
    for (let rep = 0; rep < 4; rep++) {
      for (const [semi, beats] of PHRASE) {
        notes.push({ t0: t, t1: t + beats * BEAT, hz: st(semi) });
        t += beats * BEAT;
      }
      t += BEAT * (2 + rep * 7);
    }
  }
  const noteAt = (t) => { for (const n of notes) if (t >= n.t0 && t < n.t1) return n; return null; };

  for (let i = 0; i < N; i++) {
    const t = i / sr;
    /* DEPTH. Slow at first — the descent is only frightening once you notice
       it has been happening. Held near 1 at the end rather than reaching it,
       because a bottom is a resolution and this piece does not get one. */
    const d = smooth(clamp((t / seconds) * 1.12, 0, 1)) * 0.97;

    /* ---- LUNG · 120 BPM, asymmetric, and failing ------------------------ */
    const jitter = walk(t, 3.1) * d * 0.055;
    const per = BEAT * (1 + jitter);
    const beat = Math.floor(t / per);
    const ph = (t / per) % 1;
    /* it starts missing beats. Not slowing — missing. */
    const alive = (Math.abs(walk(beat * 0.37, 997)) > d * 0.42) ? 1 : 0;
    let lung = 0;
    if (alive) {
      if (ph < 0.36) {                                   // intake: short, rising
        const q = ph / 0.36;
        lung = Math.sin(q * Math.PI) * 0.9 * (0.4 + 0.6 * q);
        lung *= 1 + rnd() * 0.06 * d;                    // the bellows tears
      } else {                                           // exhale: long, ragged
        const q = (ph - 0.36) / 0.64;
        lung = -Math.exp(-q * 3.2) * 0.8 * (1 + walk(t, 220) * 0.5 * d);
      }
    }
    /* the valve — a mechanical click that survives everything else */
    const clickPh = ph < 0.02 ? ph / 0.02 : -1;
    const click = clickPh >= 0 && alive
      ? Math.exp(-clickPh * 9) * (rnd() * 0.5 + Math.sin(clickPh * 380)) * 0.22 : 0;
    /* the pulse is felt, not heard: put it in the sub */
    subPh += (26 + lung * 5) / sr;
    const lungOut = Math.sin(subPh * 2 * Math.PI) * Math.abs(lung) * 0.42
                  + lpHull(click, lerp(2600, 900, d));

    /* ---- HULL · the diesel, dry, inside with you ------------------------ */
    hullPh += (38 + Math.sin(t * 0.7) * 0.7 + walk(t, 11) * 0.9) / sr;
    const hull = (Math.sin(hullPh * 2 * Math.PI) * 0.62
                + Math.sin(hullPh * 4 * Math.PI) * 0.11
                + Math.sin(hullPh * 6 * Math.PI) * 0.05) * lerp(0.34, 0.5, d);

    /* ---- SHANTY · the ghost of a voice ---------------------------------- */
    let shanty = 0;
    const nt = noteAt(t);
    if (nt) {
      const life = (t - nt.t0) / (nt.t1 - nt.t0);
      const env = Math.min(1, life * 9) * Math.exp(-life * 1.15);
      /* wow and flutter — the tape, and the water */
      const warp = 1 + walk(t, 1.7) * (0.012 + d * 0.055) + walk(t, 9.3) * d * 0.012;
      glot += (nt.hz * warp) / sr;
      const g = glot % 1;
      /* glottal pulse: a sawtooth is not a voice, a skewed pulse is closer */
      const pulse = (Math.exp(-g * 5.5) - 0.22) * 2.4;
      const F = [lerp(430, 340, d), lerp(1010, 780, d), 2500];
      let v = 0;
      for (let k = 0; k < 3; k++) v += fmt[k](pulse, F[k], 7 + k * 3) * [1, 0.55, 0.18][k];
      shanty = v * env * 0.34;
      /* a mile of saltwater: the top goes first, then the body */
      shanty = lpShanty(shanty, lerp(2200, 320, d));
    }
    salt.push(shanty);
    shanty = shanty * lerp(0.75, 0.22, d) + salt.tap(0.38) * 0.3 + salt.tap(0.79) * 0.18;

    /* ---- RAIN · sonar rain of back home, already damaged ---------------- */
    /* bursts, not a wash: rain on a metal roof is impacts */
    /* and the rain thins — a memory does not get quieter, it gets rarer */
    const rain0 = (Math.abs(rr()) > lerp(0.9955, 0.9993, d) ? rr() * 4.2 : 0) + rr() * 0.03;
    let rain = bpRain(rain0, lerp(3600, 1500, d), 1.1);
    rain = hpRain(rain, 700);
    /* 78rpm: sparse, loud, and utterly unmusical */
    const crack = Math.abs(cr()) > 0.9993 ? cr() * 0.55 : 0;
    const rainWet = revRain(rain * 0.5 + crack * 0.6, lerp(0.28, 0.62, d));

    /* ---- HOME · the word, on the sonar interval ------------------------- */
    const PING = 3.0;
    const wp = (t % PING) / 0.62;                        // the word is 620ms long
    let word = 0;
    if (wp < 1 && t > 12) {
      const e = homeEnvelope(wp);
      /* the pitch of the ping falls as the depth grows — a sonar answering
         from further away, and a voice losing the will to hold a note */
      const f0 = lerp(146.8, 92.5, d) * (1 + walk(t, 2.3) * d * 0.06);
      wglot += f0 / sr;
      const wg = wglot % 1;
      const src = (Math.exp(-wg * 5.0) - 0.22) * 2.2 * e.voiced + rnd() * e.noise * 0.7;
      let v = wfmt[0](src, e.f1, 9) + wfmt[1](src, e.f2, 11) * 0.5;
      v *= e.open * 0.9 + 0.1;
      /* the stutter: as depth rises the word repeats inside itself, a loop
         eating its own head, which is what a ping and a memory have in common */
      const stut = d > 0.35 ? (Math.floor(wp * lerp(1, 7, d)) % 2 ? 1 : 0.35) : 1;
      /* and it bitcrushes — the signal survives, the voice does not */
      const bits = lerp(16, 4.2, d), q = Math.pow(2, bits);
      v = Math.round(v * q) / q;
      word = lpWord(v * stut, lerp(3200, 700, d)) * 0.5;
    }
    const wordWet = revWord(word, lerp(0.3, 0.6, d));

    /* ---- WHALE · the sob that is never in time -------------------------- */
    /* 17 seconds is prime against the 3s ping and the 0.5s lung, so the three
       never line up and the piece never resolves into a groove */
    const wcyc = (t % 23.0) / 23.0;
    let whale = 0;
    /* IT ANSWERS, IT DOES NOT ACCOMPANY. The first pass had it sweeping through
       the same band the voice sings in, at three harmonics, for most of every
       cycle — so it stopped being a distant animal and became the tune. It now
       sings only when the shanty is not, one harmonic above the fundamental,
       and it is sent to the far reverb rather than mixed dry. Contrast with the
       diesel was the brief; competition with the voice was not. */
    if (wcyc < 0.30 && t > 34 && !nt) {
      const q = wcyc / 0.30;
      const env = Math.sin(q * Math.PI) ** 2.1;
      const f = lerp(190, 520, smooth(q)) * (1 + Math.sin(t * 2 * Math.PI * 4.2) * 0.022);
      whalePh += f / sr;
      const s = Math.sin(whalePh * 2 * Math.PI) + Math.sin(whalePh * 4 * Math.PI) * 0.14;
      whale = s * env * 0.055 * lerp(0.5, 1, d);
    }

    /* ---- THE MIX -------------------------------------------------------- */
    /* THE LUNG IS A GATE ON THE WORLD, NOT AN INSTRUMENT IN IT.
       The first pass put the pulse in the sub and left everything else running
       flat underneath it, and the result had no silence anywhere — a spectrogram
       occupied edge to edge, which is the opposite of a machine breathing in a
       dark room. Everything is now ducked by the breath. When the lung misses,
       the ROOM misses: the rain, the voice and the reverb all drop with it, and
       what you hear is not a missing thump but a missing world. That is what
       makes a listener hold their own breath, and it is free. */
    const breath = alive ? lerp(0.30, 1.0, Math.min(1, Math.abs(lung) * 1.5)) : lerp(0.55, 0.10, d);
    const g = lerp(1, breath, lerp(0.45, 0.9, d));

    let y = lungOut
          + hull * lerp(1, 0.55 + 0.45 * breath, 0.7)
          + (shanty * lerp(0.95, 0.55, d)
            + rain * lerp(0.30, 0.10, d) + rainWet * lerp(0.22, 0.40, d)
            + word * lerp(0.7, 0.34, d) + wordWet * lerp(0.34, 0.6, d)
            + whale) * g;

    /* the descent, as one gesture: everything darkens together */
    y = lpMaster(y, lerp(15000, 1400, d));
    /* soft saturation — the iron, not the tape */
    /* the long arc: six decibels down across the descent, applied last so it
       shapes the whole world and not one layer of it */
    y *= lerp(1.0, 0.5, smooth(clamp((t / seconds - 0.15) / 0.85, 0, 1)));
    y = Math.tanh(y * 1.25) * 0.86;
    out[i] = y;
  }

  /* head and tail, so it arrives and leaves rather than starting and stopping */
  const fi = Math.round(3.0 * sr), fo = Math.round(9.0 * sr);
  for (let i = 0; i < fi; i++) out[i] *= smooth(i / fi);
  for (let i = 0; i < fo; i++) out[N - 1 - i] *= smooth(i / fo);
  return out;
}
