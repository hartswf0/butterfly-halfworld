#!/usr/bin/env node
/* ============================================================================
   build-master.mjs — THE MIX.

   Replaces the twenty lines inside build-film.mjs that added two mono arrays
   together and called it a soundtrack. Four layers, one clock, and the film's
   first stereo field.

   ---------------------------------------------------------------------------
   1. WHY STEREO, AND WHY IT IS THE ANSWER TO "THE VOICE VS THE SPEAKER".

   Five people talk in this film and every one of them was mixed to the same
   point in space — dead centre, mono, no room. Distinct prebuilt voices were
   assigned (Erinome, Puck, Gacrux, Leda) and it did not help, because the ear
   does not identify a speaker from timbre alone. It identifies them from
   WHERE THEY ARE, and then timbre confirms it. Take away position and you have
   removed the primary cue and kept the secondary one.

   So every character has a fixed seat:

       MARA  left        NIKO  right        IONA  centre

   Fixed for the whole film, not per scene, because this is a voice's identity
   and not a staging decision. Mara and Niko are the two halves of the argument
   and they sit on either side of it; Iona arrives from outside it and stands in
   the middle. The close-ups' eye lines are set from the same table, so a face
   that looks screen-right is a voice that comes from the left.

   ---------------------------------------------------------------------------
   2. A VOICE IN A ROOM SOUNDS LIKE THE ROOM.

   The second half of "voice vs speaker" is a distinction the film has never
   made at all: whether the person talking is PRESENT.

   Nine of this film's speaker labels are in the room and four are not — VO is
   an insect's interior monologue, (V.O.) is a telephone or a memory, (O.S.) is
   somebody through a wall. Mixed identically, a voice-over is indistinguishable
   from a person standing next to you, in a film whose entire subject is whether
   a testimony can be located and checked.

   In-room voices are therefore fed through the LOCATION's early reflections —
   a tiled laboratory, a brick mill lobby, an open lot, a concrete facility —
   and voice-overs get none. That is the whole treatment and it is enough: you
   can hear the mill in Iona's voice in BF-17 and you can hear that there is no
   room at all around her in BF-13. Two more treatments earn their place:
   (O.S.) is low-passed at 1.2kHz because it is through a door, and PROJECTED
   MARA is band-limited to 300–3000Hz with flutter because she is an optical
   track on a strip of film.

   ---------------------------------------------------------------------------
   3. THE ROOM DOES NOT STOP AT A CUT.

   The five locations occupy contiguous blocks of the film — maze, then thirteen
   scenes of laboratory, then eleven of mill, three of lot, twelve of facility.
   The old mixer restarted a room-tone loop at every scene boundary, so forty
   scene changes were forty tiny discontinuities in a sound that is supposed to
   be a continuous space.

   Here the bed runs for the whole BLOCK and cross-fades only where the location
   actually changes — four times in the film. Between BF-02 and BF-14 nothing in
   the room layer knows that a cut happened, which is the point: a cut is a
   change of view, not a change of place.

   ---------------------------------------------------------------------------
   4. DUCKING, AND WHAT IT IS ALLOWED TO TOUCH.

   The score, the room and the foley all duck under speech from a single
   envelope derived from the voice bus. Dialogue is the only layer that is never
   ducked by anything, because the reason to build a score for this film at all
   is that it stays underneath.

     node harness/build-master.mjs           write audio/master.wav (stereo)
     node harness/build-master.mjs --report  print the mix sheet, write nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { readWav } from "./measure-lines.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const FILM = path.join(ROOT, "film");
const CUT = JSON.parse(fs.readFileSync(path.join(FILM, "cut.json"), "utf8"));
const TIMING = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "line-timing.json"), "utf8"));
const SCRIPT = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "script.json"), "utf8"));
const REPORT = process.argv.includes("--report");
const SR = 24000, TAKE_GAP = 0.5;

/* ---- 1. WHERE EVERYONE SITS -------------------------------------------- */
const PLACE = {
  "MARA":            { pan: -0.36, room: 1.00, tilt: +0.00, gain: 1.00 },
  "NIKO":            { pan: +0.38, room: 1.00, tilt: +0.16, gain: 1.00 },
  "IONA":            { pan: +0.02, room: 1.00, tilt: -0.14, gain: 1.02 },
  "THE GIRL":        { pan: -0.14, room: 0.80, tilt: +0.22, gain: 1.00 },
  // not in the room. No reflections at any of these, ever.
  "VO":              { pan: 0.00, room: 0, tilt: -0.20, gain: 1.05, wide: true, sub: true },
  "IONA (V.O.)":     { pan: 0.00, room: 0, tilt: -0.06, gain: 1.05, near: true },
  "ELISE (V.O.)":    { pan: 0.00, room: 0, tilt: -0.02, gain: 1.05, near: true },
  "IONA (O.S.)":     { pan: -0.55, room: 0.55, tilt: 0, gain: 1.10, muffle: 1200 },
  "PROJECTED MARA":  { pan: 0.00, room: 0.30, tilt: 0, gain: 1.15, optical: true },
};

/* ---- 2. THE ROOMS ------------------------------------------------------
   taps are early reflections in ms; a bigger room has later, sparser ones.
   `bed` names the looping cue from audio/sound/ that carries the block. */
const ROOMS = {
  "the-maze":        { taps: [[7, 0.20], [11, 0.13]],                 wet: 0.30, bed: ["maze_fans"],                gain: 1.00 },
  "the-maze-inside": { taps: [[7, 0.20], [11, 0.13]],                 wet: 0.30, bed: ["maze_fans"],                gain: 1.00 },
  "the-laboratory":  { taps: [[19, 0.22], [31, 0.15], [47, 0.09]],    wet: 0.34, bed: ["room_lab", "fluorescent"],  gain: 1.00 },
  "the-mill":        { taps: [[37, 0.26], [61, 0.18], [89, 0.11]],    wet: 0.42, bed: ["room_mill"],                gain: 1.00 },
  "the-lot":         { taps: [[71, 0.07]],                            wet: 0.12, bed: ["room_lot", "wind_lot"],     gain: 1.05 },
  "the-facility":    { taps: [[27, 0.24], [43, 0.17], [67, 0.10]],    wet: 0.38, bed: ["fluorescent", "drip"],      gain: 0.95 },
};
const PLAN = {};
for (const f of fs.readdirSync(path.join(ROOT, "scenes")).filter((f) => /^BF-\d+\.mjs$/.test(f))) {
  const src = fs.readFileSync(path.join(ROOT, "scenes", f), "utf8");
  const id = (src.match(/export const id\s*=\s*"([^"]+)"/) || [])[1];
  const pl = (src.match(/export const plan\s*=\s*(?:"([^"]+)"|null)/) || [])[1];
  if (id) PLAN[id] = pl || null;
}

/* ---- 3. THE SCORE SHEET ------------------------------------------------
   Where music plays, and — as important — where it does not. A film scored
   wall to wall has no dynamics; the arrivals below only land because most of
   the film has nothing under it but a room.

   `at` is a scene id, `in` an offset into it, `gain` a multiplier. */
const SCORE_SHEET = [
  { at: "C00",   cue: "theme_mark",         in: 0.0,  gain: 1.00, why: "main title: the mark draws itself and the theme does not close either" },
  /* C01 — the Zhuangzi card — is DELIBERATELY SILENT. It is the film's oldest
     question and the only card that asks rather than tells. Music would answer
     it. */
  { at: "BF-01", cue: "theme_refusal",      in: 1.0,  gain: 0.85, why: "the third outcome: two pulses that agree and a third that will not" },
  { at: "C03",   cue: "theme_substitution", in: 0.0,  gain: 1.00, why: "the card IS a dissolve; the cue is the same law in sound" },
  { at: "BF-13", cue: "bed_open",           in: 2.0,  gain: 0.75, why: "29 seconds of voice with no body in the room; the bed is the only thing holding the frame" },
  { at: "C04",   cue: "theme_precedent",    in: 0.0,  gain: 1.00, why: "the card is the wall of dates and so is the cue" },
  { at: "BF-17", cue: "theme_arrival",      in: 0.5,  gain: 0.95, why: "she is at the door with the film in a bag" },
  { at: "BF-22", cue: "bed_open",           in: 1.0,  gain: 0.60, why: "under the warning; low enough that the third sentence lands dry" },
  { at: "BF-25", cue: "theme_refusal",      in: 0.0,  gain: 0.70, why: "the door opens and the animal goes out to kill itself" },
  { at: "BF-29", cue: "theme_precedent",    in: 0.5,  gain: 1.00, why: "the wall itself, finally seen, under the cue built from its dates" },
  { at: "BF-32", cue: "theme_refusal",      in: 0.0,  gain: 0.80, why: "the wall empties left to right and the disagreeing pulse is what crosses it" },
  { at: "BF-37", cue: "theme_mark",         in: 0.0,  gain: 0.90, why: "the film's first image returned to, from underneath" },
  { at: "BF-40", cue: "theme_wuhua",        in: 0.0,  gain: 1.00, why: "the mode changes by one note under a child listening to an empty thing" },
  { at: "CREDITS", cue: "theme_credits", in: 0.0,  gain: 1.00, why: "the whole score in order: the pulse, the mark three times further from home each pass, and the wall ascending underneath" },
  { at: "C05",   cue: "theme_wuhua",        in: 0.0,  gain: 1.00, why: "物化, and the film ends in the mode it did not begin in" },
];

/* ---- 4. THE FOLEY SHEET ------------------------------------------------
   Thirty-one events, each at a time inside a scene, each because something
   happens there. A film's foley sheet is a list of physical claims; these are
   the ones the corpus supports. */
const FOLEY_SHEET = [
  { at: "BF-02", t: 0.2, cue: "monitor", gain: 1.0, loop: true },
  { at: "BF-03", t: 0.6, cue: "sleeve", gain: 0.9 },
  { at: "BF-03", t: 6.2, cue: "breath_out", gain: 1.1 },      // "a woman held her breath"
  { at: "BF-04", t: 0.4, cue: "sleeve", gain: 0.7 },
  { at: "BF-06", t: 0.2, cue: "monitor", gain: 1.0, loop: true },
  { at: "BF-06", t: 8.0, cue: "glass_set", gain: 0.8 },
  { at: "BF-08", t: 1.2, cue: "step_soft", gain: 0.9 },
  { at: "BF-08", t: 2.0, cue: "step_soft", gain: 0.8 },
  { at: "BF-09", t: 0.8, cue: "paper", gain: 1.0 },
  { at: "BF-10", t: 0.5, cue: "photo_turn", gain: 1.1 },      // turning it over to read the back
  { at: "BF-12", t: 2.4, cue: "glass_set", gain: 0.7 },
  { at: "BF-14", t: 0.3, cue: "glass_set", gain: 0.6 },
  { at: "BF-15", t: 0.3, cue: "door_fire", gain: 1.15 },      // the scene's whole subject
  { at: "BF-16", t: 0.4, cue: "stairs", gain: 1.0 },
  { at: "BF-16", t: 3.9, cue: "coat", gain: 0.8 },
  { at: "BF-17", t: 0.6, cue: "coat", gain: 1.0 },            // the navy coat, arriving
  { at: "BF-17", t: 9.0, cue: "step_stone", gain: 0.8 },
  { at: "BF-18", t: 1.0, cue: "canister", gain: 1.0 },        // "I brought you the film."
  { at: "BF-18", t: 5.5, cue: "paper", gain: 0.9 },
  { at: "BF-19", t: 3.0, cue: "canister", gain: 0.75 },
  { at: "BF-20", t: 0.4, cue: "door_glass", gain: 0.9 },
  { at: "BF-21", t: 0.4, cue: "tin_set", gain: 1.1 },         // "Put it down."
  { at: "BF-22", t: 0.5, cue: "coat", gain: 0.7 },
  { at: "BF-25", t: 0.3, cue: "door_fire", gain: 1.0 },       // "Open the door."
  { at: "BF-26", t: 0.5, cue: "step_stone", gain: 0.9 },
  { at: "BF-26", t: 1.4, cue: "step_stone", gain: 0.8 },
  { at: "BF-26", t: 2.5, cue: "step_stone", gain: 0.6 },      // the one who loses the advance
  { at: "BF-28", t: 0.6, cue: "paper", gain: 0.6 },
  { at: "BF-31", t: 0.2, cue: "film_advance", gain: 1.0 },
  { at: "BF-36", t: 0.2, cue: "film_advance", gain: 0.9 },
  { at: "BF-38", t: 0.3, cue: "film_advance", gain: 0.7 },
  { at: "BF-39", t: 0.4, cue: "breath_in", gain: 1.0 },       // a body loading to move, twice
  { at: "BF-39", t: 2.6, cue: "breath_in", gain: 1.0 },
  { at: "BF-40", t: 3.2, cue: "shutter_close", gain: 1.1 },   // and then nothing
];

/* ============================================================ helpers ==== */
const clamp = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
const sm = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const load = (rel) => { const f = path.join(ROOT, rel);
  return fs.existsSync(f) ? readWav(f).pcm : null; };
/* constant-power pan: a voice moved off centre must not get quieter */
const panLR = (p) => { const a = (clamp(p) + 1) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; };
/* one-pole shelf: tilt > 0 brightens, < 0 darkens. One line, and it is enough
   to separate two voices that are already in different places. */
function tilt(sig, amount) {
  if (!amount) return sig;
  const a = Math.exp(-2 * Math.PI * 1400 / SR);
  let lp = 0;
  for (let i = 0; i < sig.length; i++) { lp = lp * a + sig[i] * (1 - a); sig[i] = sig[i] + amount * (sig[i] - lp); }
  return sig;
}
function lowpass(sig, hz) {
  const a = Math.exp(-2 * Math.PI * hz / SR); let lp = 0;
  for (let i = 0; i < sig.length; i++) { lp = lp * a + sig[i] * (1 - a); sig[i] = lp; }
  return sig;
}
function highpass(sig, hz) {
  const a = Math.exp(-2 * Math.PI * hz / SR); let lp = 0;
  for (let i = 0; i < sig.length; i++) { lp = lp * a + sig[i] * (1 - a); sig[i] = sig[i] - lp; }
  return sig;
}

/* ============================================================ the clock == */
const takesBy = {};
for (const t of TIMING.takes) (takesBy[t.scene] ||= []).push(t);
const sceneAt = {}; let clock = 0;
for (const sc of CUT.scenes) { sceneAt[sc.id] = clock; clock += sc.duration; }
const TOTAL = clock;
const N = Math.round(TOTAL * SR);

const L = new Float32Array(N), R = new Float32Array(N);
const roomL = new Float32Array(N), roomR = new Float32Array(N);
const scoreL = new Float32Array(N), scoreR = new Float32Array(N);
const foleyL = new Float32Array(N), foleyR = new Float32Array(N);
const voicePresence = new Float32Array(Math.ceil(TOTAL * 100) + 4);   // 100Hz control rate

/* ---- ROOM: one bed per contiguous BLOCK, crossfaded only where the place
   actually changes ------------------------------------------------------- */
const blocks = [];
for (const sc of CUT.scenes) {
  const pl = PLAN[sc.id] || null;
  const last = blocks[blocks.length - 1];
  if (last && last.plan === pl) last.t1 = sceneAt[sc.id] + sc.duration;
  else blocks.push({ plan: pl, t0: sceneAt[sc.id], t1: sceneAt[sc.id] + sc.duration, scenes: [sc.id] });
  if (last && last.plan === pl) last.scenes.push(sc.id);
}
const XF = 1.2;
for (const b of blocks) {
  const spec = ROOMS[b.plan]; if (!spec) continue;
  const beds = spec.bed.map((id) => load(`audio/sound/${id}.wav`) || load(`audio/foley/${id}.wav`)).filter(Boolean);
  if (!beds.length) continue;
  const i0 = Math.round(b.t0 * SR), i1 = Math.round(b.t1 * SR);
  const [pl, pr] = panLR(0);
  for (let i = i0; i < i1 && i < N; i++) {
    const t = (i - i0) / SR, len = (i1 - i0) / SR;
    const fade = sm(t / XF) * sm((len - t) / XF);
    let v = 0;
    for (const bd of beds) v += bd[(i - i0) % bd.length];
    v *= spec.gain * fade;
    // decorrelate the two channels by a few samples so the bed has width
    roomL[i] += v * pl;
    roomR[i] += (i > 97 ? (() => { let w = 0; for (const bd of beds) w += bd[(i - i0 - 97 + bd.length) % bd.length]; return w * spec.gain * fade; })() : v) * pr;
  }
}

/* ---- FOLEY: the per-scene cues named in the script, plus the event sheet */
let nEvents = 0;
for (const sc of CUT.scenes) {
  const spec = SCRIPT.scenes.find((s) => s.id === sc.id);
  const base = sceneAt[sc.id];
  // the script's own per-scene cues, but enveloped rather than hard-started
  for (const id of (spec?.sound || [])) {
    const a = load(`audio/sound/${id}.wav`); if (!a) continue;
    const i0 = Math.round(base * SR), n = Math.round(sc.duration * SR);
    for (let i = 0; i < n && i0 + i < N; i++) {
      const t = i / SR;
      const env = sm(t / 0.6) * sm((sc.duration - t) / 0.8);
      const v = a[i % a.length] * 0.80 * env;
      foleyL[i0 + i] += v; foleyR[i0 + i] += a[(i + 131) % a.length] * 0.80 * env;
    }
  }
  // the event sheet
  for (const ev of FOLEY_SHEET.filter((e) => e.at === sc.id)) {
    const a = load(`audio/foley/${ev.cue}.wav`); if (!a) continue;
    const i0 = Math.round((base + ev.t) * SR);
    const n = ev.loop ? Math.round((sc.duration - ev.t) * SR) : a.length;
    for (let i = 0; i < n && i0 + i < N; i++) {
      const env = ev.loop ? sm(i / SR / 0.5) * sm(((n - i) / SR) / 0.5) : 1;
      const v = a[i % a.length] * ev.gain * env;
      foleyL[i0 + i] += v * 0.95; foleyR[i0 + i] += v * 0.95;
    }
    nEvents++;
  }
}

/* ---- SCORE ------------------------------------------------------------- */
let nScore = 0;
for (const s of SCORE_SHEET) {
  const a = load(`audio/score/${s.cue}.wav`); if (!a) { console.warn(`  missing score cue ${s.cue}`); continue; }
  const sc = CUT.scenes.find((x) => x.id === s.at); if (!sc) { console.warn(`  no scene ${s.at}`); continue; }
  const i0 = Math.round((sceneAt[s.at] + (s.in || 0)) * SR);
  for (let i = 0; i < a.length && i0 + i < N; i++) {
    const v = a[i] * (s.gain ?? 1);
    scoreL[i0 + i] += v; scoreR[i0 + i] += (i > 211 ? a[i - 211] : a[i]) * (s.gain ?? 1);
  }
  nScore++;
}

/* ---- VOICE: placed, and only the ones in the room get the room --------- */
let nTakes = 0, nLines = 0;
const perSpeaker = {};
for (const sc of CUT.scenes) {
  const base = sceneAt[sc.id];
  const room = ROOMS[PLAN[sc.id]] || null;
  let off = base;
  for (const tk of (takesBy[sc.id] || [])) {
    const src = load(tk.file); if (!src) { off += tk.duration + TAKE_GAP; continue; }
    nTakes++;
    /* One take can hold two speakers, so it is placed LINE BY LINE using the
       measured boundaries. Before those existed this was impossible and every
       take had to be mixed as if one person spoke it. */
    for (const ln of tk.lines) {
      const P = PLACE[ln.who] || { pan: 0, room: 1, tilt: 0, gain: 1 };
      const s0 = Math.round(ln.t0 * SR), s1 = Math.min(src.length, Math.round((ln.t0 + ln.dur) * SR));
      if (s1 <= s0) continue;
      let seg = src.slice(s0, s1);
      if (P.muffle) lowpass(seg, P.muffle);
      if (P.optical) { highpass(seg, 300); lowpass(seg, 3000);
        for (let i = 0; i < seg.length; i++) seg[i] *= 1 + 0.10 * Math.sin(2 * Math.PI * 11 * i / SR); }
      tilt(seg, P.tilt);
      const [pl, pr] = panLR(P.pan);
      const at = Math.round((off - base + ln.t0) * SR) + Math.round(base * SR);
      for (let i = 0; i < seg.length && at + i < N; i++) {
        const v = seg[i] * P.gain;
        // WIDE: the insect's monologue is decorrelated so it has no point of
        // origin. It is the only voice in the film you cannot locate.
        const vl = P.wide && at + i > 331 ? seg[i - 331 > 0 ? i - 331 : i] * P.gain : v;
        L[at + i] += vl * pl; R[at + i] += v * pr;
        if (P.sub && i % 2 === 0) { const s = seg[i >> 1] * 0.18 * P.gain; L[at + i] += s; R[at + i] += s; }
      }
      // early reflections, but ONLY for a body that is actually in the room
      if (room && P.room > 0) {
        for (const [ms, g] of room.taps) {
          const d = Math.round(ms / 1000 * SR), amt = g * room.wet * P.room;
          for (let i = 0; i < seg.length && at + i + d < N; i++) {
            const v = seg[i] * P.gain * amt;
            L[at + i + d] += v * pr; R[at + i + d] += v * pl;    // reflections swap sides
          }
        }
      }
      // presence, for the duck
      for (let i = 0; i < seg.length; i += 240) {
        const k = Math.floor((at + i) / SR * 100);
        let m = 0; for (let j = i; j < Math.min(seg.length, i + 240); j++) m = Math.max(m, Math.abs(seg[j]));
        if (k < voicePresence.length) voicePresence[k] = Math.max(voicePresence[k], m);
      }
      nLines++;
      perSpeaker[ln.who] = (perSpeaker[ln.who] || 0) + ln.dur;
    }
    off += tk.duration + TAKE_GAP;
  }
}

/* ---- THE DUCK ---------------------------------------------------------- */
const DUCK = 0.62;                       // how much of the bed goes away under speech
const ATT = 0.06, REL = 0.45;
let g = 0;
const duck = new Float32Array(voicePresence.length);
for (let k = 0; k < voicePresence.length; k++) {
  const target = Math.min(1, voicePresence[k] * 3.2);
  const c = target > g ? 1 - Math.exp(-0.01 / ATT) : 1 - Math.exp(-0.01 / REL);
  g += (target - g) * c;
  duck[k] = 1 - DUCK * sm(g);
}
const duckAt = (i) => { const x = i / SR * 100, k = Math.floor(x), f = x - k;
  const a = duck[Math.min(duck.length - 1, k)], b = duck[Math.min(duck.length - 1, k + 1)];
  return a + (b - a) * f; };

/* ---- SUM --------------------------------------------------------------- */
let peak = 0;
const out = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const d = duckAt(i);
  let l = L[i] * 0.95 + (roomL[i] * 0.85 + foleyL[i] * 0.70 + scoreL[i] * 0.95) * d;
  let r = R[i] * 0.95 + (roomR[i] * 0.85 + foleyR[i] * 0.70 + scoreR[i] * 0.95) * d;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
  out.writeInt16LE(Math.round(clamp(l) * 32000), i * 4);
  out.writeInt16LE(Math.round(clamp(r) * 32000), i * 4 + 2);
}

/* ---- report ------------------------------------------------------------ */
console.log(`THE MIX — stereo, ${(TOTAL / 60).toFixed(2)} min\n`);
console.log(`  ROOM   ${blocks.filter((b) => ROOMS[b.plan]).length} continuous blocks, cross-faded only where the place changes:`);
for (const b of blocks.filter((x) => ROOMS[x.plan]))
  console.log(`         ${String(b.plan).padEnd(17)} ${(b.t1 - b.t0).toFixed(1).padStart(6)}s  ${b.scenes.length} scenes  ${b.scenes[0]}..${b.scenes[b.scenes.length - 1]}`);
console.log(`\n  VOICE  ${nLines} lines in ${nTakes} takes, placed line by line:`);
for (const [who, sec] of Object.entries(perSpeaker).sort((a, b) => b[1] - a[1])) {
  const P = PLACE[who] || {};
  const seat = P.pan < -0.1 ? "LEFT  " : P.pan > 0.1 ? "RIGHT " : "CENTRE";
  const sp = P.room > 0 ? `in the room (${(P.room * 100) | 0}%)` : "no room — not present";
  console.log(`         ${who.padEnd(16)} ${seat} ${sec.toFixed(1).padStart(5)}s  ${sp}${P.wide ? " · wide" : ""}${P.muffle ? " · through a door" : ""}${P.optical ? " · optical track" : ""}`);
}
console.log(`\n  SCORE  ${nScore} cues placed · ${CUT.scenes.length - nScore} scenes carry no music at all`);
console.log(`  FOLEY  ${nEvents} events + per-scene beds`);
console.log(`\n  peak ${peak.toFixed(3)}${peak > 0.99 ? "   ** CLIPPING" : peak < 0.35 ? "   ** quiet — the mix is not using its range" : "   headroom ok"}`);
const ducked = duck.filter((d) => d < 0.9).length / duck.length;
console.log(`  the bed is ducked for ${(ducked * 100).toFixed(0)}% of the film`);

if (!REPORT) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + out.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(out.length, 40);
  fs.writeFileSync(path.join(ROOT, "audio", "master.wav"), Buffer.concat([h, out]));
  console.log(`\n  wrote audio/master.wav — stereo, ${(N / SR).toFixed(3)}s`);
}
