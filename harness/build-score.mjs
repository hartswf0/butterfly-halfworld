#!/usr/bin/env node
/* ============================================================================
   build-score.mjs — THE SCORE, GROWN OUT OF THE ROOM TONE.

   The film had fourteen sound cues and no music. This adds a score, and the
   single decision that shapes all of it is:

       THE SCORE AND THE ROOM TONE ARE THE SAME MATERIAL AT DIFFERENT DENSITIES.

   Every room in this film already hums. `room_lab` is mains at 60Hz under a
   band of filtered noise; `fluorescent` is the tube; `maze_fans` is air moving.
   A score laid on top of that would be a second, unrelated layer competing with
   it — the usual arrangement, and the reason most scored documentaries sound
   like two recordings played at once.

   So the score is what happens when the room's own hum RESOLVES INTO PITCH.
   The drone sits on 60Hz and its harmonics, which is the frequency the
   laboratory is already humming at. When the film needs to lift, the hum
   sharpens into a chord that was always latent in it; when it needs to drop,
   the chord decays back into the room. There is no moment where music starts.
   That is also the answer to shots not connecting: the bed does not stop at a
   cut, so a cut cannot break it.

   ---------------------------------------------------------------------------
   THE MATERIAL IS THE FILM'S OWN.

   PULSE — the text says the animal tests the glass "at equal intervals", and
   build-sound.mjs quantises that to a dead 0.5s (measured max deviation
   0.00133s). 0.5s is 120bpm; halved, it is a 60bpm pulse, one beat a second,
   which is a resting heart rate and also the projector's frame period times
   twelve. The score's clock is the butterfly's tapping. Nothing else.

   THEME — the chrysalis wall is dated husks from 1951 to 2024. Seventy-three
   years mapped onto the mode gives an ascending line that is not a tune anybody
   wrote; it is the wall, read left to right. It plays under every unit about
   precedent.

   THE MARK — the broken circle. A four-note figure that returns to a pitch ONE
   STEP AWAY from where it started, so it never closes. It is the audio of the
   thing the animal draws on the ceiling, and like the drawing it is legible
   only as a whole.

   THE SUBSTITUTION — ethyl acetate becomes lavender. In picture that is a
   per-dot ordered swap, because this world forbids cross-fades. Sound gets the
   same law: the two chords do not cross-fade, they exchange HARMONIC BY
   HARMONIC on an ordered schedule, so you hear one substance replacing another
   rather than two substances briefly coexisting. Same constraint, same solution,
   different medium — which is the only reason to have a rule at all.

   MODE — 物化, the transformation of things. The film opens in Aeolian and ends
   in Dorian: identical except for the sixth degree. One note different, and
   that is what a chrysalis is. Nothing announces the change.

   ---------------------------------------------------------------------------
     node harness/build-score.mjs            write audio/score/*.wav + index
     node harness/build-score.mjs --report   analyse only
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "audio", "score");
const SR = 24000;
const REPORT = process.argv.includes("--report");

const rng = (seed) => { let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; }; };
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const clamp = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

function band(sig, lo, hi) {
  const a = Math.exp(-2 * Math.PI * lo / SR), b = Math.exp(-2 * Math.PI * hi / SR);
  let lp = 0, hp = 0;
  for (let i = 0; i < sig.length; i++) {
    lp = lp * b + sig[i] * (1 - b); hp = hp * a + lp * (1 - a); sig[i] = lp - hp;
  }
  return sig;
}

/* ---- THE MODE ------------------------------------------------------------
   Root is 60Hz — the mains frequency the laboratory hums at, dropped nowhere
   and transposed nowhere. The score is literally in the key of the building.
   Aeolian and Dorian differ in one degree (b6 vs 6). */
const HUM = 60;                       // the mains frequency the laboratory hums at
const AEOLIAN = [0, 2, 3, 5, 7, 8, 10];
const DORIAN  = [0, 2, 3, 5, 7, 9, 10];        // <- the one note
const st = (n) => Math.pow(2, n / 12);
const deg = (mode, i, oct = 0) => HUM * st(mode[((i % 7) + 7) % 7] + 12 * (oct + Math.floor(i / 7)));

/* ---- voices --------------------------------------------------------------
   Four, and no more, because eight ink levels deserve four timbres. Each is a
   few lines of arithmetic; none of them is trying to be an instrument that
   exists. They are trying to be four things that can be told apart on a phone
   speaker under a voice. */

/* BOW — a filtered saw with slow vibrato. The body of the score. */
function bow(out, at, sec, f, gain, { seed = 7, vib = 0.004, attack = 0.9 } = {}) {
  const i0 = Math.round(at * SR), n = Math.round(sec * SR);
  const r = rng(seed);
  let ph = 0, breath = 0;
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const t = i / SR, u = i / n;
    const env = sm(t / attack) * sm((1 - u) / 0.30 > 1 ? 1 : (1 - u) / 0.30);
    breath = breath * 0.999 + r() * 0.001;
    const fr = f * (1 + vib * Math.sin(2 * Math.PI * 4.7 * t + seed) + breath * 0.4);
    ph += 2 * Math.PI * fr / SR;
    // a saw made of five partials: cheap, and the roll-off is the timbre
    let v = 0;
    for (let k = 1; k <= 5; k++) v += Math.sin(ph * k) / (k * k);
    out[i0 + i] += clamp(v * env * gain);
  }
}

/* GLASS — a struck partial stack, short. The theme is played on this because
   the film's own struck object is a jar. */
function glass(out, at, f, gain, { decay = 1.6, seed = 3 } = {}) {
  const i0 = Math.round(at * SR), n = Math.round(decay * 3.5 * SR);
  const r = rng(seed);
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const t = i / SR;
    const env = Math.exp(-t / decay);
    let v = 0;
    for (const [p, a] of [[1, 1], [2.76, 0.42], [5.40, 0.18], [8.93, 0.07]])
      v += Math.sin(2 * Math.PI * f * p * t) * a;
    v += r() * 0.5 * Math.exp(-t / 0.004);          // contact
    out[i0 + i] += clamp(v * env * gain * 0.5);
  }
}

/* AIR — a noise swell. Not a pad: it has no pitch, and it is what the film
   uses where another film would use strings. */
function air(out, at, sec, lo, hi, gain, seed = 11) {
  const i0 = Math.round(at * SR), n = Math.round(sec * SR);
  const r = rng(seed);
  const tmp = new Float32Array(n);
  for (let i = 0; i < n; i++) tmp[i] = r();
  band(tmp, lo, hi);
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const u = i / n;
    out[i0 + i] += tmp[i] * gain * Math.sin(Math.PI * u) ** 1.6;
  }
}

/* PULSE — the tap, at half its own rate. Felt, not heard. */
function pulse(out, at, sec, f, gain, { bpm = 60, seed = 5 } = {}) {
  const per = 60 / bpm;
  for (let k = 0; k * per < sec; k++) {
    const t0 = at + k * per;
    const i0 = Math.round(t0 * SR), n = Math.round(0.42 * SR);
    for (let i = 0; i < n && i0 + i < out.length; i++) {
      const t = i / SR;
      const env = Math.exp(-t / 0.11) * sm(t / 0.008);
      out[i0 + i] += clamp(Math.sin(2 * Math.PI * f * t) * env * gain);
    }
  }
}

/* ============================================================ the cues ==== */
const SCORE = {};

/* ---- BED — the hum, resolved. Two octaves of the root plus a fifth, drifting.
   This is what plays under most of the film and it is meant to be almost
   inaudible: it exists so that a cut never lands on silence. */
const bed = (mode, seed, gain = 0.055) => (sec = 24) => {
  const out = buf(sec);
  bow(out, 0, sec, deg(mode, 0, -1), gain, { seed, vib: 0.0015, attack: 3.0 });
  bow(out, 0, sec, deg(mode, 4, -1), gain * 0.5, { seed: seed + 1, vib: 0.002, attack: 4.0 });
  bow(out, 0, sec, deg(mode, 0, 0), gain * 0.28, { seed: seed + 2, vib: 0.003, attack: 5.0 });
  return band(out, 35, 900);
};
SCORE.bed_open  = bed(AEOLIAN, 101);          // the film before it knows anything
SCORE.bed_close = bed(DORIAN, 131);           // the same bed, one note different

/* ---- THE MARK — four notes that do not come home ----------------------- */
SCORE.theme_mark = (sec = 12) => {
  const out = buf(sec), mode = AEOLIAN;
  /* 0, 4, 2, 1 — and 1 is a step from 0, so the figure lands NEXT to its own
     beginning instead of on it. Played on glass, over the bed's root. */
  const fig = [0, 4, 2, 1];
  const step = sec / (fig.length + 1);
  fig.forEach((d, i) => glass(out, i * step, deg(mode, d, 1), 0.16, { decay: 1.9, seed: 40 + i }));
  bow(out, 0, sec, deg(mode, 0, -1), 0.045, { seed: 44, attack: 2.4 });
  air(out, sec * 0.55, sec * 0.45, 900, 5200, 0.020, 46);
  return band(out, 40, 7000);
};

/* ---- THE PRECEDENT — the wall, read left to right ----------------------
   Seventy-three dated husks, 1951 to 2024, mapped onto the mode. It is not a
   melody anybody composed; it is a data series, and it ascends because the
   dates do. Under it, the pulse, because the wall is a record of repetitions. */
SCORE.theme_precedent = (sec = 20) => {
  const out = buf(sec), mode = AEOLIAN;
  const YEARS = 2024 - 1951;
  const N = 14;                              // one note per five-and-a-bit years
  for (let i = 0; i < N; i++) {
    const yr = 1951 + Math.round(i * YEARS / (N - 1));
    const d = Math.round((yr - 1951) / YEARS * 9);       // nine degrees of climb
    glass(out, 0.35 + i * (sec - 2) / N, deg(mode, d, 1), 0.085 + 0.05 * (i / N),
      { decay: 1.1, seed: 300 + yr });
  }
  bow(out, 0, sec, deg(mode, 0, -1), 0.050, { seed: 61, attack: 3.0 });
  bow(out, sec * 0.4, sec * 0.6, deg(mode, 2, -1), 0.030, { seed: 62, attack: 4.0 });
  pulse(out, 0, sec, deg(mode, 0, -2), 0.055, { bpm: 60 });
  return band(out, 35, 7000);
};

/* ---- THE SUBSTITUTION — an ordered swap, not a cross-fade ---------------
   The picture's dissolve law, in sound. Chord A is the tritone-inflected
   version (the killing agent); chord B is the plain minor (the lavender). Each
   HARMONIC crosses on its own schedule, low ones first, so the two chords are
   never simply mixed — the sound is progressively RE-SPELLED. Halfway through,
   the low partials belong to B and the high ones still belong to A, which is
   an unstable object rather than an average of two stable ones. */
SCORE.theme_substitution = (sec = 14) => {
  const out = buf(sec), mode = AEOLIAN;
  const A = [deg(mode, 0, 0), deg(mode, 2, 0) * st(1), deg(mode, 4, 0) * st(1), deg(mode, 6, 0)];
  const B = [deg(mode, 0, 0), deg(mode, 2, 0), deg(mode, 4, 0), deg(mode, 5, 0)];
  A.forEach((fa, k) => {
    const fb = B[k];
    const at = sec * (0.18 + 0.52 * (k / A.length));     // low partials swap first
    bow(out, 0, at + 0.2, fa, 0.055, { seed: 200 + k, attack: 1.2 });
    bow(out, at, sec - at, fb, 0.055, { seed: 220 + k, attack: 0.7 });
  });
  air(out, sec * 0.10, sec * 0.5, 1800, 7000, 0.028, 233);   // the scent
  return band(out, 35, 8000);
};

/* ---- THE REFUSAL — the third outcome ----------------------------------
   50/50 and 70/30 are the two results in the literature; the animal in this
   film produces neither. So: two pulses at a stable interval, and then a third
   that does not fit either — a beat displaced against both, held under a rising
   air. It is the only cue in the score that gets loud. */
SCORE.theme_refusal = (sec = 16) => {
  const out = buf(sec), mode = AEOLIAN;
  pulse(out, 0, sec * 0.55, deg(mode, 0, -2), 0.075, { bpm: 60 });
  pulse(out, sec * 0.30, sec * 0.45, deg(mode, 4, -2), 0.050, { bpm: 84 });   // the disagreement
  bow(out, sec * 0.18, sec * 0.82, deg(mode, 0, -1), 0.075, { seed: 401, attack: 2.0 });
  bow(out, sec * 0.42, sec * 0.58, deg(mode, 3, -1), 0.058, { seed: 402, attack: 1.4 });
  bow(out, sec * 0.62, sec * 0.38, deg(mode, 6, 0), 0.042, { seed: 403, attack: 0.9 });
  air(out, sec * 0.45, sec * 0.5, 400, 3600, 0.055, 404);
  for (let k = 0; k < 5; k++) glass(out, sec * (0.66 + k * 0.055), deg(mode, 4 - k, 1), 0.10, { decay: 1.2, seed: 410 + k });
  return band(out, 30, 7000);
};

/* ---- THE ARRIVAL — someone did this before, and is at the door ---------- */
SCORE.theme_arrival = (sec = 14) => {
  const out = buf(sec), mode = AEOLIAN;
  bow(out, 0, sec, deg(mode, 5, -1), 0.060, { seed: 501, attack: 2.6 });
  bow(out, sec * 0.25, sec * 0.75, deg(mode, 0, 0), 0.042, { seed: 502, attack: 2.0 });
  glass(out, sec * 0.06, deg(mode, 0, 1), 0.13, { decay: 2.6, seed: 511 });
  glass(out, sec * 0.52, deg(mode, 4, 1), 0.11, { decay: 2.4, seed: 512 });
  air(out, 0, sec * 0.4, 700, 4200, 0.022, 513);
  return band(out, 35, 7000);
};

/* ---- 物化 — the last cue, and the only one in Dorian --------------------
   The bed's sixth degree moves up a semitone under a held root. Nothing else
   changes and nothing announces it. If a listener notices, they have noticed
   the whole film's argument; if they do not, it still works, which is the
   correct relationship between a score and a thesis. */
SCORE.theme_wuhua = (sec = 22) => {
  const out = buf(sec);
  bow(out, 0, sec, deg(AEOLIAN, 0, -1), 0.062, { seed: 601, attack: 3.4 });
  bow(out, 0, sec * 0.52, deg(AEOLIAN, 5, 0), 0.038, { seed: 602, attack: 2.6 });
  bow(out, sec * 0.44, sec * 0.56, deg(DORIAN, 5, 0), 0.038, { seed: 603, attack: 2.6 });
  glass(out, sec * 0.70, deg(DORIAN, 0, 1), 0.12, { decay: 3.4, seed: 611 });
  air(out, sec * 0.55, sec * 0.45, 300, 2600, 0.026, 612);
  return band(out, 30, 6000);
};

/* ---- CREDITS — the whole score, in order, over the pulse ---------------- */
SCORE.theme_credits = (sec = 68) => {
  const out = buf(sec), mode = DORIAN;
  pulse(out, 0, sec, deg(mode, 0, -2), 0.052, { bpm: 60 });
  bow(out, 0, sec, deg(mode, 0, -1), 0.058, { seed: 701, attack: 4.0 });
  bow(out, sec * 0.14, sec * 0.86, deg(mode, 4, -1), 0.034, { seed: 702, attack: 3.0 });
  // the mark, three times, each a little further from home
  const fig = [0, 4, 2, 1];
  for (let pass = 0; pass < 3; pass++)
    fig.forEach((d, i) => glass(out, sec * (0.10 + pass * 0.27) + i * 1.15,
      deg(mode, d + pass, 1), 0.115 - pass * 0.018, { decay: 2.1, seed: 720 + pass * 8 + i }));
  // the wall, ascending underneath, one note per credit block
  for (let i = 0; i < 12; i++)
    glass(out, 2.5 + i * (sec - 6) / 12, deg(mode, Math.round(i * 9 / 11), 0), 0.055, { decay: 1.6, seed: 760 + i });
  air(out, sec * 0.62, sec * 0.36, 500, 4000, 0.024, 790);
  return band(out, 30, 7000);
};

/* ============================================================ write ======= */
function wav(f32) {
  const n = f32.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(clamp(f32[i]) * 32000), 44 + i * 2);
  return b;
}

if (!REPORT) fs.mkdirSync(OUT, { recursive: true });
const index = [];
console.log(`THE SCORE — root ${HUM}Hz, the frequency the laboratory hums at\n`);
for (const [id, make] of Object.entries(SCORE)) {
  const sig = make();
  let peak = 0, sum = 0;
  for (const v of sig) { const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
  const rms = Math.sqrt(sum / sig.length);
  const sec = sig.length / SR;
  if (!REPORT) fs.writeFileSync(path.join(OUT, `${id}.wav`), wav(sig));
  index.push({ id, sec: +sec.toFixed(2), peak: +peak.toFixed(3), rms: +rms.toFixed(4),
    file: `audio/score/${id}.wav` });
  const mode = id.includes("close") || id.includes("wuhua") || id.includes("credits") ? "DORIAN" : "AEOLIAN";
  console.log(`  ${id.padEnd(20)} ${sec.toFixed(1).padStart(5)}s  peak ${peak.toFixed(3)}  rms ${rms.toFixed(4)}  ${mode}`);
}
/* the check that matters: nothing in the score may be louder than the voice it
   sits under. The voice track peaks near 1.0 by construction; a score cue over
   0.35 will fight it, and a score that fights the voice is a mixing decision
   made by accident. */
const loud = index.filter((c) => c.peak > 0.35);
console.log(`\n  ${index.length} cues · loudest ${Math.max(...index.map((c) => c.peak)).toFixed(3)}`);
console.log(loud.length ? `  ** ${loud.length} cue(s) over 0.35 and will fight the dialogue: ${loud.map((c) => c.id).join(", ")}`
  : `  every cue sits under the dialogue by construction`);
if (!REPORT) {
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({
    sr: SR, root: HUM, modes: { aeolian: AEOLIAN, dorian: DORIAN }, cues: index }, null, 1));
  console.log(`\n  wrote ${index.length} cues to audio/score/`);
}
