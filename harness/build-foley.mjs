#!/usr/bin/env node
/* ============================================================================
   build-foley.mjs — THE THINGS THAT HAPPEN ONCE.

   build-sound.mjs made fourteen cues and thirteen of them are BEDS: room tone,
   fans, fluorescent, a wingbeat, a projector. They loop, they establish a
   place, and they are why the film does not sound like it was recorded in a
   vacuum. What it has none of is EVENTS — the discrete sounds a body makes
   when it does something, which is what foley actually is.

   A film with beds and no events sounds like a photograph of a room. Somebody
   picks up a canister in BF-18 and it is silent. Somebody comes down a
   staircase in BF-16 and it is silent. A fire door opens in BF-15 — the scene
   whose entire subject is a smell crossing the gap under it — and it is silent.

   Nineteen events, all synthesised, none sampled. Each one is a physical
   argument: what is the object made of, what hits it, and how big is the room
   it rings into. That is all a foley artist is deciding either.

   ---------------------------------------------------------------------------
   THE ONE RULE THAT KEEPS THIS IN THE WORLD.

   The picture is quantised to eight ink levels and a 3.4px lattice. The sound
   should not be smoother than the picture. So every event here is built from a
   small number of decaying partials and a burst of shaped noise, and none of
   them uses a reverb tail longer than the room it is in — because a long tail
   is the audio equivalent of a gradient, and this world does not have those.
   The space comes from the MASTER, which places each event in the room the
   scene is actually in. An event that carried its own room would be wrong in
   four of the five locations.

     node harness/build-foley.mjs           write audio/foley/*.wav
     node harness/build-foley.mjs --report  analyse only
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "audio", "foley");
const SR = 24000;
const REPORT = process.argv.includes("--report");

const rng = (seed) => { let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; }; };
const buf = (sec) => new Float32Array(Math.round(sec * SR));
const clamp = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
function band(sig, lo, hi) {
  const a = Math.exp(-2 * Math.PI * lo / SR), b = Math.exp(-2 * Math.PI * hi / SR);
  let lp = 0, hp = 0;
  for (let i = 0; i < sig.length; i++) { lp = lp * b + sig[i] * (1 - b); hp = hp * a + lp * (1 - a); sig[i] = lp - hp; }
  return sig;
}
/** a struck body: partials + a contact transient. The whole vocabulary. */
function hit(out, at, { f = 800, decay = 0.08, gain = 0.4, partials = [1, 2.4, 4.1], noise = 0.4,
                       nDecay = 0.006, seed = 1 } = {}) {
  const r = rng(seed), i0 = Math.round(at * SR), n = Math.round(Math.max(decay, nDecay) * 6 * SR);
  for (let i = 0; i < n && i0 + i < out.length && i0 + i >= 0; i++) {
    const t = i / SR;
    let v = 0;
    for (const p of partials) v += Math.sin(2 * Math.PI * f * p * t) / p;
    v *= Math.exp(-t / decay);
    v += r() * noise * Math.exp(-t / nDecay);
    out[i0 + i] += clamp(v * gain);
  }
}
/** a rub: shaped noise with an envelope. Cloth, paper, a shoe on stone. */
function rub(out, at, sec, lo, hi, gain, { seed = 2, shape = 1.4 } = {}) {
  const r = rng(seed), i0 = Math.round(at * SR), n = Math.round(sec * SR);
  const tmp = new Float32Array(n);
  for (let i = 0; i < n; i++) tmp[i] = r();
  band(tmp, lo, hi);
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const u = i / n;
    out[i0 + i] += tmp[i] * gain * Math.pow(Math.sin(Math.PI * u), shape);
  }
  return out;
}

const F = {};

/* ---- BODIES IN ROOMS --------------------------------------------------- */

/* A shoe on a stone floor. Two components, and the second is the one people
   hear without knowing: the heel is a click, the sole is a scuff, and they are
   30ms apart. One without the other is a knock on a door. */
F.step_stone = (sec = 0.9) => {
  const out = buf(sec);
  hit(out, 0.02, { f: 240, decay: 0.035, gain: 0.30, partials: [1, 3.2, 6.4], noise: 0.7, nDecay: 0.004, seed: 21 });
  rub(out, 0.05, 0.11, 900, 5200, 0.055, { seed: 22, shape: 2.2 });
  return band(out, 90, 8000);
};
F.step_soft = (sec = 0.9) => {           // the same body on a lab floor, in soft shoes
  const out = buf(sec);
  hit(out, 0.02, { f: 170, decay: 0.028, gain: 0.16, partials: [1, 2.6], noise: 0.45, nDecay: 0.006, seed: 23 });
  rub(out, 0.04, 0.10, 400, 2400, 0.038, { seed: 24, shape: 2.6 });
  return band(out, 70, 4200);
};
F.stairs = (sec = 3.2) => {              // BF-16: a body descending five columns of light
  const out = buf(sec);
  const t = [0.10, 0.62, 1.18, 1.76, 2.34];   // slowing, because she is looking
  t.forEach((x, k) => {
    hit(out, x, { f: 210 + k * 9, decay: 0.045, gain: 0.26 - k * 0.015, partials: [1, 3.1, 5.9], noise: 0.6, nDecay: 0.005, seed: 30 + k });
    rub(out, x + 0.03, 0.13, 800, 4800, 0.045, { seed: 40 + k, shape: 2.0 });
  });
  return band(out, 90, 8000);
};

/* Cloth. A coat has weight; a lab sleeve does not. */
F.coat = (sec = 1.1) => band(rub(buf(sec), 0.05, 0.9, 260, 3400, 0.075, { seed: 51, shape: 1.1 }), 120, 5000);
F.sleeve = (sec = 0.7) => band(rub(buf(sec), 0.03, 0.55, 700, 6000, 0.042, { seed: 52, shape: 1.3 }), 300, 8000);

/* ---- OBJECTS ------------------------------------------------------------ */

/* The canister, changing hands. BF-18 and BF-19 are both ABOUT this object and
   neither of them makes a sound. Steel film can: a low ring, a lid rattle. */
F.canister = (sec = 2.2) => {
  const out = buf(sec);
  hit(out, 0.00, { f: 168, decay: 0.62, gain: 0.30, partials: [1, 2.09, 3.41, 5.72], noise: 0.5, nDecay: 0.004, seed: 61 });
  hit(out, 0.045, { f: 940, decay: 0.10, gain: 0.14, partials: [1, 1.87], noise: 0.6, nDecay: 0.003, seed: 62 });
  rub(out, 0.09, 0.16, 1800, 7000, 0.028, { seed: 63 });
  return band(out, 80, 9000);
};
/* A sealed tin with something alive inside it. BF-21. The tin is the same
   object as the canister one size smaller, and the point is what it does after
   you put it down. */
F.tin_set = (sec = 2.4) => {
  const out = buf(sec);
  hit(out, 0.00, { f: 320, decay: 0.34, gain: 0.26, partials: [1, 2.3, 3.9], noise: 0.55, nDecay: 0.004, seed: 71 });
  for (let k = 0; k < 3; k++)                        // and then, from inside it
    hit(out, 0.75 + k * 0.50, { f: 2600, decay: 0.008, gain: 0.055, partials: [1, 2.7], noise: 0.5, nDecay: 0.002, seed: 75 + k });
  return band(out, 100, 9000);
};
/* Glass on a bench. The jar, the vial, the slide. */
F.glass_set = (sec = 1.6) => {
  const out = buf(sec);
  hit(out, 0.00, { f: 1820, decay: 0.22, gain: 0.22, partials: [1, 2.76, 5.40], noise: 0.35, nDecay: 0.002, seed: 81 });
  return band(out, 300, 11000);
};
/* Paper. The envelope, the photograph, the assessment nobody reopens. */
F.paper = (sec = 1.4) => band(rub(buf(sec), 0.02, 1.1, 1400, 9000, 0.055, { seed: 91, shape: 0.9 }), 700, 11000);
F.photo_turn = (sec = 1.0) => {          // BF-10: turning it over to read the back
  const out = buf(sec);
  rub(out, 0.00, 0.30, 1800, 9000, 0.050, { seed: 95, shape: 1.0 });
  hit(out, 0.34, { f: 1400, decay: 0.02, gain: 0.05, partials: [1, 2.2], noise: 0.7, nDecay: 0.003, seed: 96 });
  return band(out, 800, 11000);
};

/* ---- DOORS -------------------------------------------------------------- */
/* BF-15's entire subject is a smell crossing the gap under a fire door, and the
   door is silent. A fire door is a heavy slab on a closer: a bar, a swing, a
   long low seal against the frame. */
F.door_fire = (sec = 3.0) => {
  const out = buf(sec);
  hit(out, 0.00, { f: 620, decay: 0.05, gain: 0.20, partials: [1, 2.1, 3.7], noise: 0.8, nDecay: 0.006, seed: 101 });  // the bar
  rub(out, 0.12, 0.85, 90, 900, 0.075, { seed: 102, shape: 1.0 });                                                      // the swing
  hit(out, 1.30, { f: 120, decay: 0.30, gain: 0.26, partials: [1, 1.9, 3.2], noise: 0.5, nDecay: 0.012, seed: 103 });   // the seal
  return band(out, 45, 6000);
};
F.door_glass = (sec = 2.0) => {          // the mill lobby's glass door
  const out = buf(sec);
  rub(out, 0.00, 0.55, 200, 2600, 0.045, { seed: 111, shape: 1.2 });
  hit(out, 0.62, { f: 780, decay: 0.16, gain: 0.16, partials: [1, 2.4, 4.6], noise: 0.4, nDecay: 0.004, seed: 112 });
  return band(out, 90, 8000);
};

/* ---- THE APPARATUS ------------------------------------------------------ */
/* A CRT under a green line. BF-02 and BF-06 are both a monitor and neither
   hums. 15.6kHz is the line-scan whistle, which most people cannot hear and
   all of them notice when it stops. */
F.monitor = (sec = 6) => {
  const out = buf(sec);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = Math.sin(2 * Math.PI * 15625 * t) * 0.020 + Math.sin(2 * Math.PI * 120 * t) * 0.012;
  }
  return out;
};
/* Sprockets. BF-31 is a strip advancing between fingers; BF-36 is nine frames
   going into water. Both are the same mechanism at different speeds. */
F.film_advance = (sec = 3.0) => {
  const out = buf(sec);
  for (let k = 0; k * 0.25 < sec; k++)
    hit(out, k * 0.25, { f: 1500, decay: 0.006, gain: 0.075, partials: [1, 2.3, 4.9], noise: 0.9, nDecay: 0.0025, seed: 120 + k });
  return band(out, 400, 9000);
};
F.shutter_close = (sec = 1.2) => {       // the projector stopping. The film's last mechanical act.
  const out = buf(sec);
  for (let k = 0; k < 5; k++)
    hit(out, k * (0.083 + k * 0.022), { f: 900, decay: 0.010, gain: 0.10 - k * 0.017, partials: [1, 2.6], noise: 0.8, nDecay: 0.003, seed: 130 + k });
  hit(out, 0.62, { f: 150, decay: 0.18, gain: 0.10, partials: [1, 2.2], noise: 0.3, nDecay: 0.010, seed: 139 });
  return band(out, 80, 8000);
};

/* ---- WEATHER AND AIR ---------------------------------------------------- */
F.wind_lot = (sec = 8) => {              // BF-26..28, outdoors, and the only wide air in the film
  const out = buf(sec), r = rng(141);
  for (let i = 0; i < out.length; i++) out[i] = r();
  band(out, 60, 1800);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] *= 0.085 * (1 + 0.55 * Math.sin(2 * Math.PI * t / 5.3) + 0.30 * Math.sin(2 * Math.PI * t / 1.9));
  }
  return out;
};
F.drip = (sec = 7) => {                  // the facility. Water, and not on a grid.
  const out = buf(sec);
  const t = [0.4, 2.1, 2.6, 4.3, 6.05];
  t.forEach((x, k) => hit(out, x, { f: 1150 + k * 90, decay: 0.045, gain: 0.11, partials: [1, 3.4], noise: 0.35, nDecay: 0.002, seed: 150 + k }));
  return band(out, 200, 8000);
};

/* ---- THE BODY ----------------------------------------------------------- */
/* A held breath released. BF-03's subject is "two gloved hands inside the box,
   with nothing left to do"; the corpus says "a woman held her breath". */
F.breath_out = (sec = 1.8) => band(rub(buf(sec), 0.10, 1.35, 200, 2800, 0.060, { seed: 161, shape: 0.8 }), 120, 4000);
F.breath_in  = (sec = 1.2) => band(rub(buf(sec), 0.05, 0.80, 350, 3600, 0.048, { seed: 162, shape: 1.8 }), 180, 5000);

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
console.log(`FOLEY — the things that happen once\n`);
for (const [id, make] of Object.entries(F)) {
  const sig = make();
  let peak = 0, sum = 0;
  for (const v of sig) { const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
  const sec = sig.length / SR, rms = Math.sqrt(sum / sig.length);
  if (!REPORT) fs.writeFileSync(path.join(OUT, `${id}.wav`), wav(sig));
  index.push({ id, sec: +sec.toFixed(2), peak: +peak.toFixed(3), rms: +rms.toFixed(4), file: `audio/foley/${id}.wav` });
  console.log(`  ${id.padEnd(16)} ${sec.toFixed(2).padStart(5)}s  peak ${peak.toFixed(3)}  rms ${rms.toFixed(4)}`);
}
const silent = index.filter((c) => c.peak < 0.01);
console.log(`\n  ${index.length} events · loudest ${Math.max(...index.map((c) => c.peak)).toFixed(3)}`);
console.log(silent.length ? `  ** ${silent.length} came out silent: ${silent.map((s) => s.id).join(", ")}`
  : `  none came out silent`);
if (!REPORT) {
  fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ sr: SR, events: index }, null, 1));
  console.log(`  wrote ${index.length} events to audio/foley/`);
}
