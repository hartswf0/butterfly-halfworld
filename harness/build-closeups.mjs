#!/usr/bin/env node
/* ============================================================================
   build-closeups.mjs — GENERATE ONE SCENE PER THING SOMEBODY SAYS.

   Input   audio/line-timing.json   (measured boundaries — run measure-lines first)
           audio/scenes/*.wav       (the recorded takes)
   Output  scenes/_close/CU-*.mjs   one motion scene per speaker run
           film/closeups.json       the manifest the close cut is assembled from

   ---------------------------------------------------------------------------
   THE UNIT IS A SPEAKER RUN, NOT A LINE AND NOT A TAKE.

   A take is a recording — often a whole exchange, "NIKO|MARA", five lines,
   two people. Cutting per take would put one face on screen while two people
   talk. Cutting per line would cut on every full stop, including the ones
   inside a single person's speech, which is a stammer.

   A RUN is the maximal stretch of consecutive lines by one speaker. It is the
   natural shot: it begins when someone starts talking and ends when they stop.
   Ninety-four runs across thirty-three takes; ninety of them have a body in the
   room and get a face.

   ---------------------------------------------------------------------------
   THE DECLARED EXCEPTION.

   MOTION-BRIEF's first sentence is that the unit of authorship in this world is
   a CYCLE, because the text's central images do not exist in any single frame.
   That argument is sound and these units break it. A sentence is not periodic.
   It does not come round again. If it did it would not be a sentence.

   So `motion` here is SPEAK — a ninth motion, declared rather than smuggled,
   with loopClosed:false and no beats — and its whole content is that it runs
   ONCE and stops. That is not a hole in the law; it is the law's own logic
   applied to different material. The film's cycles are bodies and apparatus,
   which repeat. Testimony does not repeat. In a film about a witness who
   cannot verify what it remembers, the one thing that happens exactly once
   ought to be somebody saying so.

   ---------------------------------------------------------------------------
   WHY THE MOUTH TRACK IS BAKED INTO EACH MODULE.

   Scene modules are imported by a browser page and must be PURE functions of u
   — no fetch, no clock, no shared state — so frame n renders identically
   whether or not frame n-1 ever existed. That rules out reading a wav at draw
   time. So each module carries its own envelope, quantised to two decimals at
   50Hz, as a literal array: about 150 numbers for a three-second run. It is
   inspectable, diffable, and it cannot drift from the audio because it was
   sampled FROM the audio.

     node harness/build-closeups.mjs           write modules + manifest
     node harness/build-closeups.mjs --report  report only, write nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { readWav, envelope } from "./measure-lines.mjs";
import { visemeTrack } from "../engine/speech.mjs";
import { FACES, SPEAKER_FACE, FACELESS } from "../assets/character/_face.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "scenes", "_close");
const REPORT_ONLY = process.argv.includes("--report");
const FPS = 12, ENV_HZ = 50;

const TIMING = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "line-timing.json"), "utf8"));

/* ---- 1. runs ------------------------------------------------------------ */
const runs = [];
for (const take of TIMING.takes) {
  let cur = null;
  for (const l of take.lines) {
    if (!cur || cur.who !== l.who) {
      cur = { take: take.id, scene: take.scene, file: take.file, who: l.who,
              t0: l.t0, t1: l.t0 + l.dur, lines: [l], measured: take.measured !== false };
      runs.push(cur);
    } else { cur.t1 = l.t0 + l.dur; cur.lines.push(l); }
  }
}

/* ---- 1b. HANDLES --------------------------------------------------------
   A shot that starts on the first phoneme and ends on the last is not a shot,
   it is a clip. Two consequences, and the second is the one that forced this:

   Cutting on the exact word boundary means every pause between two speakers —
   a third of a second, the length of a breath — becomes a return to the wide
   loop and then straight back to a face. Three frames of establishing shot is
   not an establishing shot; it is a flash frame, and at twelve per second it
   reads as a fault in the projector.

   So each run is given HANDLES: it opens a little before its first word and
   holds a little after its last. Where two runs are separated by less than a
   second the handles SPLIT THAT GAP ENTIRELY (0.55 to the outgoing shot, 0.45
   to the incoming) so the two shots abut and the cut lands in the silence,
   which is where a cut belongs. Only a pause longer than a second survives as
   a real return to the room.

   This is free, and it is free for an interesting reason: the envelope is
   sampled from the whole take, so a run extended into its neighbouring silence
   samples actual recorded silence. The mouth stays shut through the handle
   because the gate says so — not because anything was told to hold it shut. */
const MAX_PRE = 0.40, MAX_POST = 0.50, BRIDGE = 1.00;
for (const take of TIMING.takes) {
  const rs = runs.filter((r) => r.take === take.id);
  const takeEnd = take.duration;
  rs.forEach((r, i) => {
    const prevEnd = i === 0 ? 0 : rs[i - 1].t1;
    const nextStart = i === rs.length - 1 ? takeEnd : rs[i + 1].t0;
    const preGap = r.t0 - prevEnd, postGap = nextStart - r.t1;
    r.head = preGap <= BRIDGE && i > 0 ? preGap * 0.45 : Math.min(MAX_PRE, preGap);
    r.tail = postGap <= BRIDGE && i < rs.length - 1 ? postGap * 0.55 : Math.min(MAX_POST, postGap);
  });
  // apply after measuring, so one run's handle is never computed off another's
  for (const r of rs) { r.t0 = +(r.t0 - Math.max(0, r.head)).toFixed(4);
                        r.t1 = +(r.t1 + Math.max(0, r.tail)).toFixed(4); }
}

/* ---- 2. envelopes ------------------------------------------------------- */
const wavCache = {};
function envFor(run) {
  const key = run.file;
  const W = wavCache[key] || (wavCache[key] = (() => {
    const { pcm, rate } = readWav(path.join(ROOT, key));
    const e = envelope(pcm, rate, 1 / ENV_HZ);
    // normalise by the TAKE's loud level, not the run's: a line delivered
    // quietly should print a smaller mouth than the one shouted next to it,
    // and per-run normalisation would flatten exactly that difference.
    const s = Float32Array.from(e).sort();
    const loud = s[Math.floor(s.length * 0.90)] || 1e-4;
    return Float32Array.from(e, (v) => Math.min(1.35, v / loud));
  })());
  const i0 = Math.floor(run.t0 * ENV_HZ), i1 = Math.ceil(run.t1 * ENV_HZ);
  return Array.from(W.slice(i0, i1), (v) => +v.toFixed(2));
}

/* how much of a clip is silence at each end. 0.12 of the take's loud level is
   below any voiced sound and above the room tone every one of these files has. */
const FLOOR = 0.12;
function silentHead(env, hz) {
  let i = 0; while (i < env.length && env[i] < FLOOR) i++;
  return +(i / hz).toFixed(3);
}
function silentTail(env, hz) {
  let i = env.length - 1; while (i >= 0 && env[i] < FLOOR) i--;
  return +((env.length - 1 - i) / hz).toFixed(3);
}

/* ---- 3. write ----------------------------------------------------------- */
if (!REPORT_ONLY) { fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true }); }

const manifest = [];
let nFace = 0, nFaceless = 0, faceSec = 0;
const perFace = {};

/* eye lines. In a two-hander the two faces must look at EACH OTHER, or the
   cut reads as two separate monologues. Whoever speaks first in a take is
   given screen-left and looks right; their partner is given screen-right and
   looks left. Constant within a take, so a scene never flips its axis. */
const axisOf = {};
for (const take of TIMING.takes) {
  const order = [...new Set(take.lines.map((l) => l.who))];
  axisOf[take.id] = Object.fromEntries(order.map((w, i) => [w, i === 0 ? 1 : -1]));
}

for (const run of runs) {
  const seconds = +(run.t1 - run.t0).toFixed(3);
  const faceKey = SPEAKER_FACE[run.who];
  if (FACELESS(run.who) || !faceKey || !FACES[faceKey]) {
    nFaceless++;
    manifest.push({ scene: run.scene, take: run.take, who: run.who, t0: run.t0, t1: run.t1,
      seconds, face: null, reason: FACELESS(run.who) ? "not in the room" : "no face in the cast table" });
    continue;
  }
  const idx = manifest.filter((m) => m.take === run.take).length;
  const id = `CU-${run.take.replace("__", "-")}-${idx}`;
  const frames = Math.max(2, Math.round(seconds * FPS));
  const env = envFor(run);
  // one viseme track per line, laid end to end at the line's own measured start
  const track = [];
  for (const l of run.lines) {
    const off = l.t0 - run.t0;
    for (const seg of visemeTrack(l.text, l.dur))
      track.push([+(seg.t0 + off).toFixed(3), +(seg.t1 + off).toFixed(3), seg.v]);
  }
  const axis = (axisOf[run.take] || {})[run.who] || 0;
  const seed = Object.keys(FACES).indexOf(faceKey);
  const text = run.lines.map((l) => l.text).join(" ");

  nFace++; faceSec += seconds;
  perFace[faceKey] = (perFace[faceKey] || 0) + seconds;
  manifest.push({ id, scene: run.scene, take: run.take, who: run.who, face: faceKey,
    t0: run.t0, t1: run.t1, seconds, frames, lines: run.lines.length,
    // PASS 2. These were the AUTHORED handles, and for the first run of every
    // take they came out at exactly zero — the take's own leading silence is
    // already inside line one's span, so there was nothing to extend backwards
    // into and twenty-seven scenes opened on a face. What the assembler
    // actually needs is not what was added but WHAT IS ACTUALLY SILENT, so
    // these are MEASURED off the baked envelope: the time before the first
    // sample above the speech floor, and after the last. Trimming into them
    // cannot desync anything, because there is nothing there to sync to.
    head: silentHead(env, ENV_HZ), tail: silentTail(env, ENV_HZ),
    src: `renders/motion/${id}.webm`, text });

  if (REPORT_ONLY) continue;
  fs.writeFileSync(path.join(OUT, `${id}.mjs`), `\
/* ============================================================================
   ${id} — ${run.who} · ${run.scene}
   GENERATED by harness/build-closeups.mjs. Do not hand-edit; edit the builder.

     ${JSON.stringify(text)}

   ${seconds.toFixed(2)}s · ${frames} frames @${FPS}fps · ${run.lines.length} line(s)
   Boundaries MEASURED from the waveform (audio/line-timing.json), not
   apportioned by word count. The envelope below is this run's own recorded RMS
   at ${ENV_HZ}Hz, normalised against the take's loud level — it is what decides
   whether the mouth is open at all. The viseme track decides what shape.
   ========================================================================= */
import { sampleMouth, speechCarriage } from "../../engine/speech.mjs";
import { NW, NH } from "../../assets/set/_stage.mjs";
import { FACES, drawCloseup, closeGeom, idleFace } from "../../assets/character/_face.mjs";
import { INK } from "../../engine/halfworld-engine.mjs";

export const id = ${JSON.stringify(id)};
export const title = ${JSON.stringify(run.who)};
export const place = ${JSON.stringify(run.scene)};
export const plan = null;
export const motion = "SPEAK";          // the ninth motion; see build-closeups.mjs
export const beats = null;
export const seconds = ${seconds};
export const loopClosed = false;        // a sentence does not come round again
export const frames = ${frames};
export const declaredBreak = null;
export const breakAt = null;
export const subject = ${JSON.stringify(`${run.who} saying it, with a mouth`)};
export const distance = "CLOSE";
export const speaker = ${JSON.stringify(run.who)};
export const face = ${JSON.stringify(faceKey)};
export const leftOut = ["the room — a close-up is a claim about a face, not a place"];

const ENV_HZ = ${ENV_HZ};
const ENV = ${JSON.stringify(env)};
const TRACK = ${JSON.stringify(track)}.map(([t0, t1, v]) => ({ t0, t1, v }));
const AXIS = ${axis};                   // +1 looks screen-right, -1 screen-left
const SEED = ${seed};
/* Set only on an INTRODUCTION — the first time this person speaks in the film.
   harness/direct.mjs rewrites this one line and nothing else. */
const NAME = null;

export function at(u) {
  const t = u * seconds;
  const m = sampleMouth(TRACK, ENV, ENV_HZ, t);
  const c = speechCarriage(ENV, ENV_HZ, t, SEED);
  const i = idleFace(t, SEED);
  return {
    t, ...m,
    blink: i.blink,
    // the eye line is held toward the other speaker and only wanders within a
    // few degrees of it; a speaking face that looks around the room is not
    // listening to anyone
    gazeX: AXIS * 0.34 + i.gazeX * 0.28,
    gazeY: i.gazeY * 0.5 + 0.04,
    headYaw: AXIS * 0.13 + c.yaw,
    headPitch: c.pitch,
    headRoll: c.roll,
    browUp: 0.06 + c.brow,
    chest: c.chest,
  };
}

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";
  drawCloseup(g, FACES[face], s, closeGeom(NW, NH));
  if (NAME) {
    /* A name, once, the first time you see the person. Bottom left, mono, and
       held for the whole shot rather than faded in — this world has no alpha
       and a caption that arrives is a caption you notice arriving. */
    g.fillStyle = INK;
    g.font = "700 34px ui-monospace, Menlo, monospace";
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    let x = NW * 0.055;
    for (const c of NAME) { g.fillText(c, x, NH * 0.935); x += g.measureText(c).width + 9; }
    g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); g.moveTo(NW * 0.055, NH * 0.958); g.lineTo(x - 9, NH * 0.958); g.stroke();
  }
  g.restore();
}

export const SCENE_VERSION = "closeup/1.0.0";
`);
}

/* ---- 4. report ---------------------------------------------------------- */
console.log(`CLOSE-UPS\n`);
console.log(`  ${runs.length} speaker runs across ${TIMING.takes.length} takes`);
console.log(`  ${nFace} get a face · ${(faceSec / 60).toFixed(2)} min of speaking picture`);
console.log(`  ${nFaceless} stay on the wide loop:`);
for (const m of manifest.filter((x) => !x.face))
  console.log(`      ${m.scene.padEnd(7)} ${m.who.padEnd(18)} ${m.seconds.toFixed(1)}s — ${m.reason}`);
console.log(`\n  screen time by face:`);
for (const [k, v] of Object.entries(perFace).sort((a, b) => b[1] - a[1]))
  console.log(`      ${k.padEnd(9)} ${(v / 60).toFixed(2)} min  ${"█".repeat(Math.round(v / 3))}`);
const shortest = manifest.filter((m) => m.face).sort((a, b) => a.seconds - b.seconds);
console.log(`\n  shortest runs (a cut this brief is a flinch, not a shot):`);
for (const m of shortest.slice(0, 5)) console.log(`      ${m.id.padEnd(18)} ${m.seconds.toFixed(2)}s  ${m.who}`);

if (!REPORT_ONLY) {
  fs.writeFileSync(path.join(ROOT, "film", "closeups.json"), JSON.stringify({
    built: new Date().toISOString(), fps: FPS, envHz: ENV_HZ,
    runs: runs.length, withFace: nFace, faceless: nFaceless,
    faceSeconds: +faceSec.toFixed(2), byFace: perFace, units: manifest,
  }, null, 1));
  console.log(`\n  wrote ${nFace} modules to scenes/_close/ and film/closeups.json`);
}
