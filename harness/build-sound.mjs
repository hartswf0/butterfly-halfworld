#!/usr/bin/env node
/* ============================================================================
   build-sound.mjs — THE SOUND ELEMENTS, SYNTHESISED ON THE FILM'S OWN CLOCK.

   Nine cues, every one named by the text. They are generated rather than
   sampled for the same reason the picture is drawn rather than photographed:
   a sample carries a room this world does not have, and a generator can be
   locked to the frame rate.

   THE THREE THAT ARE NOT AMBIENCE — they are the picture, in another medium:

   tap_ring          EIGHT hits per loop, dead-quantised, on the same eight
                     stations the scene draws. "Not wildly. It moves around the
                     circumference, testing the glass at equal intervals."
                     An eased tap is the wrong sound AND the wrong drawing.

   chrysalis_cascade SEVENTY-FIVE clicks in date order, oldest first, riding the
                     same wavefront the picture sweeps across the wall. The
                     sound and the image are one event, not two synchronised.

   projector         AT 12 Hz — the film's own frame rate, chosen so each frame
                     is a drawing rather than a sample. The shutter is not an
                     effect laid over the picture; it is the picture's clock
                     made audible. Where the projection is the subject, the
                     shutter IS the beat.

   Everything is deterministic: one seeded PRNG, no Math.random, so a rebuild
   produces byte-identical audio and the film can be reproduced.

   Writes audio/sound/<cue>.wav and audio/sound/index.json
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCRIPT = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "script.json"), "utf8"));
const OUT = path.join(ROOT, "audio", "sound");
const SR = 24000;                 // matches the voice track; no resampling at mux
const FPS = SCRIPT.fps || 12;

/* deterministic noise — xorshift, seeded per cue so cues never correlate */
function rng(seed) { let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; }; }

const buf = (sec) => new Float32Array(Math.round(sec * SR));
const clamp = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);

/** one-pole bandpass-ish shaping, cheap and stable */
function band(sig, lo, hi) {
  const a = Math.exp(-2 * Math.PI * lo / SR), b = Math.exp(-2 * Math.PI * hi / SR);
  let lp = 0, hp = 0;
  for (let i = 0; i < sig.length; i++) {
    lp = lp * b + sig[i] * (1 - b);          // low-passed at hi
    hp = hp * a + lp * (1 - a);              // then remove below lo
    sig[i] = lp - hp;
  }
  return sig;
}

/** a struck body: exponentially decaying partials. `glass` is bright and short. */
function strike(out, at, { f = 2400, decay = 0.06, gain = 0.5, partials = [1, 2.7, 5.1], seed = 1 }) {
  const r = rng(seed);
  const i0 = Math.round(at * SR);
  const n = Math.round(decay * 4 * SR);
  for (let i = 0; i < n && i0 + i < out.length; i++) {
    const t = i / SR, env = Math.exp(-t / decay);
    let v = 0;
    for (const p of partials) v += Math.sin(2 * Math.PI * f * p * t) / p;
    v += r() * 0.35 * Math.exp(-t / (decay * 0.25));   // the click of contact
    out[i0 + i] += clamp(v * env * gain);
  }
}

/* ------------------------------------------------------------------ cues */
const CUES = {};

/* ---- THE PAIRING — the cause of everything, and never seen -------------
   A scent arriving, a gap, then the tick. The gap is the point: the animal
   had time to notice the smell before anything happened to it. That interval
   is what makes it a memory rather than a reflex.                          */
CUES.shock_pairing = (sec = 4.0) => {
  const out = buf(sec), r = rng(313);
  const per = 1.6;
  for (let k = 0; k * per < sec; k++) {
    const t0 = k * per;
    // the scent: a soft rising hiss, 0.9s
    const i0 = Math.round(t0 * SR), n = Math.round(0.9 * SR);
    for (let i = 0; i < n && i0 + i < out.length; i++) {
      const u = i / n;
      out[i0 + i] += r() * 0.10 * Math.sin(Math.PI * u);
    }
    // the gap — 0.35s of nothing. This is the interval that makes it learning.
    // then the tick: brief, dry, small. Never a zap.
    strike(out, t0 + 0.9 + 0.35, { f: 900, decay: 0.008, gain: 0.16, partials: [1, 3.7], seed: 700 + k });
  }
  return band(out, 200, 6000);
};

/* ---- ROOM TONES — three rooms that must not sound alike ---------------- */
function room(seed, lo, hi, drift, hum, gain) {
  return (sec = 8) => {
    const out = buf(sec), r = rng(seed);
    for (let i = 0; i < out.length; i++) out[i] = r() * 0.5;
    band(out, lo, hi);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      let v = out[i] * gain * (1 + drift * Math.sin(2 * Math.PI * t / 6.7));
      if (hum) v += Math.sin(2 * Math.PI * hum * t) * gain * 0.35;
      out[i] = v;
    }
    return out;
  };
}
CUES.room_lab  = room(1009, 70, 320, 0.02, 60, 0.075);    // mains hum under a high room
CUES.room_mill = room(2011, 50, 260, 0.05, 0,  0.060);    // brick, no machine
CUES.room_lot  = room(3019, 90, 2400, 0.10, 0, 0.055);    // open air, wide band

/* ---- THE HINGE — not a flutter ----------------------------------------
   "I remember striking it with the soft hinge of my body." A dull soft
   contact at 9 Hz, felt more than heard, with no attack worth the name.  */
CUES.wingbeat = (sec = 4.0) => {
  const out = buf(sec), hz = 9;
  const per = 1 / hz;
  for (let k = 0; k * per < sec; k++) {
    const i0 = Math.round(k * per * SR), n = Math.round(0.055 * SR);
    for (let i = 0; i < n && i0 + i < out.length; i++) {
      const u = i / n;
      out[i0 + i] += Math.sin(Math.PI * u) * Math.sin(2 * Math.PI * 62 * (i / SR)) * 0.055;
    }
  }
  return out;
};


/** THE TAP — eight, quantised, one revolution per loop. */
CUES.tap_ring = (sec = 4.0) => {
  const out = buf(sec), hits = 8;
  for (let k = 0; k < hits; k++) {
    // dead-quantised: exactly k/hits of the loop. No easing, no humanisation.
    strike(out, (k / hits) * sec, { f: 3100, decay: 0.045, gain: 0.42, seed: 11 + k });
  }
  return out;
};

/** the maze fans — a bed that sighs rather than hums */
CUES.maze_fans = (sec = 6) => {
  const r = rng(7), out = buf(sec);
  for (let i = 0; i < out.length; i++) out[i] = r() * 0.5;
  band(out, 180, 900);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] *= 0.30 * (1 + 0.20 * Math.sin(2 * Math.PI * t / 5.3));   // the sigh
  }
  return out;
};

/** the ductwork's soft metallic complaint — a falling sweep, once */
CUES.vent_complaint = (sec = 2.4) => {
  const out = buf(sec), r = rng(23);
  const [f0, f1] = [420, 300];
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR, u = Math.min(1, t / 1.8);
    const f = f0 + (f1 - f0) * u;
    ph += 2 * Math.PI * f / SR;
    const env = Math.sin(Math.PI * Math.min(1, t / 1.8)) * 0.22;
    out[i] = (Math.sin(ph) * 0.7 + Math.sin(ph * 2.02) * 0.3 + r() * 0.12) * env;
  }
  return out;
};

/** legs on glass — "slow, dry sounds too small for the room" */
CUES.legs_on_glass = (sec = 5) => {
  const out = buf(sec), r = rng(41);
  const per = 1 / 5;
  for (let k = 0; k * per < sec; k++) {
    const at = k * per + Math.abs(r()) * 0.02;
    strike(out, at, { f: 5200, decay: 0.012, gain: 0.10, partials: [1, 3.3], seed: 100 + k });
  }
  return out;
};

/** THE WALL — 75 clicks, date order, riding the picture's own wavefront */
CUES.chrysalis_cascade = (sec = 6) => {
  const out = buf(sec), n = 75, width = 0.06;
  for (let k = 0; k < n; k++) {
    const p = k / (n - 1);
    // the same front the SWEEP uses: front = u*(1+width) - width, open when it passes p
    const u = (p + width) / (1 + width);
    strike(out, u * sec, { f: 1800 + k * 6, decay: 0.030, gain: 0.24, partials: [1, 2.3, 4.1], seed: 500 + k });
  }
  return out;
};

/** THE PROJECTOR — shutter at the film's own frame rate, plus the fan rising */
CUES.projector = (sec = 6) => {
  const out = buf(sec), r = rng(97);
  // fan rises to speed over the first second
  for (let i = 0; i < out.length; i++) {
    const t = i / SR, spin = Math.min(1, t / 1.0);
    out[i] = r() * 0.5 * spin;
  }
  band(out, 90, 240);
  for (let i = 0; i < out.length; i++) out[i] *= 0.26;
  // the shutter: one soft occlusion per FRAME
  const per = 1 / FPS;
  for (let k = 0; k * per < sec; k++) {
    strike(out, k * per, { f: 620, decay: 0.010, gain: 0.11, partials: [1, 1.9], seed: 900 + k });
  }
  return out;
};

/** the pool — chlorine, faint but unmistakable */
CUES.water = (sec = 6) => {
  const r = rng(131), out = buf(sec);
  for (let i = 0; i < out.length; i++) out[i] = r() * 0.5;
  band(out, 120, 480);
  for (let i = 0; i < out.length; i++) out[i] *= 0.13 * (1 + 0.3 * Math.sin(2 * Math.PI * (i / SR) / 8.1));
  return out;
};

/** the fluorescent tubes — mains hum, no drift, because it is a machine */
CUES.fluorescent = (sec = 6) => {
  const out = buf(sec);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * 120 * t) * 0.6 + Math.sin(2 * Math.PI * 100 * t) * 0.4) * 0.055;
  }
  return out;
};

/** SUMMER — seven bands arriving at once on the declared break, no ramp */
CUES.summer = (sec = 5.0) => {
  const out = buf(sec), at = 0.58 * sec, r = rng(211);
  const i0 = Math.round(at * SR);
  const bands = [[60, 180], [180, 420], [420, 900], [900, 1800], [1800, 3200], [3200, 5200], [5200, 8000]];
  for (const [lo, hi] of bands) {
    const tmp = buf(sec - at);
    for (let i = 0; i < tmp.length; i++) tmp[i] = r() * 0.5;
    band(tmp, lo, hi);
    for (let i = 0; i < tmp.length && i0 + i < out.length; i++) out[i0 + i] += tmp[i] * 0.11;  // NO ramp
  }
  return out;
};

/* ------------------------------------------------------------------ write */
function wav(f32) {
  const pcm = Buffer.alloc(f32.length * 2);
  for (let i = 0; i < f32.length; i++) pcm.writeInt16LE(Math.round(clamp(f32[i]) * 32000), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

fs.mkdirSync(OUT, { recursive: true });
const index = [];
for (const cue of SCRIPT.sound) {
  const gen = CUES[cue.id];
  if (!gen) { console.warn(`  no generator for ${cue.id}`); continue; }
  const sig = gen();
  const file = path.join(OUT, `${cue.id}.wav`);
  fs.writeFileSync(file, wav(sig));
  let peak = 0, sum = 0;
  for (const v of sig) { const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
  index.push({ id: cue.id, kind: cue.kind, scenes: cue.scenes,
               sec: +(sig.length / SR).toFixed(3),
               peak: +peak.toFixed(3), rms: +Math.sqrt(sum / sig.length).toFixed(4),
               file: `audio/sound/${cue.id}.wav` });
}
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ sr: SR, fps: FPS, cues: index }, null, 1));

console.log(`sound elements — generated, deterministic, ${SR}Hz\n`);
console.log(`  CUE                KIND        SEC   PEAK    RMS   SCENES`);
for (const c of index)
  console.log(`  ${c.id.padEnd(18)} ${c.kind.padEnd(11)} ${String(c.sec).padStart(5)} ${String(c.peak).padStart(6)} ${String(c.rms).padStart(7)}   ${c.scenes.length}`);
console.log(`\n  the tap is 8 hits/loop, dead-quantised · the wall is 75 clicks in date order`);
console.log(`  the projector shutter runs at ${FPS} Hz — the film's own frame rate`);
