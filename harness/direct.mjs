#!/usr/bin/env node
/* ============================================================================
   direct.mjs — WHICH SHOTS EARN A FACE.

   THE ERROR THIS FILE EXISTS TO CORRECT.

   The first speaking cut gave a close-up to every one of the ninety speaker
   runs, because that was a rule and rules are easy to apply to ninety things.
   The result was that 45% of the picture became a talking head, and the film
   cut away from its own best images to get there — away from a green line
   gathering over itself, away from a wall of dated husks emptying left to
   right, away from 1945 being replaced dot by dot by thirty minutes ago.

   Those images are the reason the film exists. The dialogue is spare and mostly
   belongs OVER them. Covering a conversation from both sides on every line is
   not direction; it is television coverage, and it is what you do when you have
   not decided what the scene is about.

   ---------------------------------------------------------------------------
   THE LAW, and it is the film's own motion vocabulary read back at it.

       A CLOSE-UP MAY ONLY INTERRUPT A MOTION THAT COMES ROUND AGAIN.

   CYCLE repeats and HOLD persists. You can leave one of those and come back,
   and the shot will still be there, doing what it was doing.

   TRACE, SWEEP, DISSOLVE, ADVANCE, TRANSFER and BREAK happen ONCE and
   ACCUMULATE. Their whole content is the difference between the beginning and
   the end. Cutting away from a TRACE means the line gathers while nobody is
   watching; cutting away from a SWEEP means the wavefront crosses off-screen;
   cutting away from a DISSOLVE means the substitution — the film's central
   idea, and the thing the dot law was bent to allow — happens in a shot the
   audience is not in.

   MOTION-BRIEF already said this about stills: "Rendering the mark as a
   picture… if it is legible in one frame, you have drawn the wrong thing."
   The same sentence governs the cut. If a shot's content is legible in one
   frame, you may cut away from it. Six of the eight motions exist precisely
   because their content is not.

   ---------------------------------------------------------------------------
   AND THEN: THE TURNS.

   The law says where a close-up is PERMITTED. It does not say where one is
   DESERVED. That is not a rule and cannot be — it is a reading of the script,
   and every entry in TURNS below carries the line it is for and the argument
   for putting a face on it. Fifteen moments in forty scenes.

   Two of them are REACTIONS: the camera is on the person receiving the line,
   not the person saying it. Those are the shots this film most needed and had
   none of. "I remembered it" is not interesting on the face of the woman who
   knows it is true. It is interesting on the face of the man who has just been
   told that a building was assembled out of somebody's memory.

     node harness/direct.mjs            write film/direction.json
     node harness/direct.mjs --report   print the cut, write nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { readWav, envelope } from "./measure-lines.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CLOSE = JSON.parse(fs.readFileSync(path.join(ROOT, "film", "closeups.json"), "utf8"));
const REPORT = process.argv.includes("--report");

/* ---- the law ------------------------------------------------------------ */
const INTERRUPTIBLE = new Set(["CYCLE", "HOLD"]);
const MOTION = {};
for (const f of fs.readdirSync(path.join(ROOT, "scenes")).filter((f) => /^BF-\d+\.mjs$/.test(f))) {
  const src = fs.readFileSync(path.join(ROOT, "scenes", f), "utf8");
  const id = (src.match(/export const id\s*=\s*"([^"]+)"/) || [])[1];
  const m = (src.match(/export const motion\s*=\s*"([^"]+)"/) || [])[1];
  const subj = (src.match(/export const subject\s*=\s*"([^"]+)"/) || [])[1];
  if (id) MOTION[id] = { motion: m, subject: subj };
}

/* ---- the budget --------------------------------------------------------- */
const MIN_SHOT = 1.30;    // 16 frames at 12fps. Under this it is a flinch, not a shot.
const MAX_PER_SCENE = 4;
const MAX_SHARE = 0.55;   // no scene may become mostly faces

/* ---- THE TURNS ----------------------------------------------------------
   scene · the line · who is ON SCREEN · why. `on` differs from the speaker
   only for reactions, and where it does, that is the whole point of the shot. */
const TURNS = [
  { scene: "BF-03", line: "No, it isn't.", on: "NIKO",
    why: "the first crack between them. Three exchanges of a procedural correction, and then he refuses her the retreat. It is the moment the scene stops being about the odour." },

  { scene: "BF-05", line: "It rejected the premise.", on: "MARA",
    why: "the film's thesis, said out loud by a scientist who knows how it sounds. She is choosing to believe an animal declined a question. You have to see her decide it." },

  { scene: "BF-10", line: "She said she remembered being there.", on: "NIKO", react: true,
    why: "REACTION. Mara says the film's title claim about her own mother; the shot is on the man hearing it, because his problem — that this is not a claim a person can make — is the audience's problem." },

  /* BF-11 is the one scene built for coverage: a CYCLE whose declared subject is
     'two people arriving back at the question they started from'. Shot and
     reverse IS the content, so it is the only scene that gets the ping-pong.
     ORDER MATTERS HERE — the budget takes turns in the order they are written,
     and the first pass of this list put the two procedural questions above the
     line the whole scene is for, so the scene filled up and the 1945 line was
     dropped by my own ranking. It goes first. */
  { scene: "BF-11", line: "Then why are we looking at a photograph from 1945?", on: "NIKO",
    why: "the loop closing on the question it began with, and the only line in the scene that is not a procedure" },
  { scene: "BF-11", line: "Could it have gotten into the intake?", on: "NIKO",
    why: "the loop, first pass — a procedure being run on something that is not going to yield to one" },
  { scene: "BF-11", line: "Could the sensor be wrong?", on: "NIKO", why: "the loop, second pass" },

  { scene: "BF-17", line: "You have her shoulders.", on: "IONA",
    why: "the only scene in the corpus whose declared subject IS a face — 'a face arriving before its features can contain it'. At MEDIUM that face is 150px; the text's one animation note has nowhere to happen. This is the close-up the film was always missing." },
  { scene: "BF-17", line: "That depends which paper you're reading.", on: "IONA",
    why: "her evasion, on the face that arrives before it can contain anything" },

  { scene: "BF-19", line: "The version that survived.", on: "IONA",
    why: "she answers a contamination protocol with an epistemology. One line, one face, then back to the canister." },

  { scene: "BF-22", line: "Because then you will remember being there.", on: "IONA",
    why: "the scene belongs to the scar on her thumb and stays there for three sentences. This is the fourth, and it is the threat the whole film turns on — the only line that earns leaving the scar." },

  { scene: "BF-24", line: "Of course it can be photographed.", on: "NIKO",
    why: "the last time anyone in this film is certain about anything. It should be on a face so the certainty has somewhere to be wrong." },

  { scene: "BF-27", line: "Marking is not memory.", on: "IONA",
    why: "the counter-thesis, and the sentence that makes the film an argument rather than a mystery. The scene is a butterfly's foot on lavender and returns to it immediately." },

  /* Same lesson as BF-11, and it cost the most important cut in the film: I
     listed 'the part that keeps reappearing' first, it took the scene's budget,
     and the climax reaction — the one I had just argued was the single most
     important cut — was dropped by my own ordering. The ranking is the
     authoring order, so the ranking has to be written down correctly. */
  { scene: "BF-29", line: "I remembered it.", on: "NIKO", react: true,
    why: "REACTION, and the most important cut in the film. Iona has just answered 'You built this' with a claim that a building was assembled out of memory. It is not interesting on the face of the woman who believes it. It is interesting on the face of the man who has to decide what to do with it." },

  { scene: "BF-29", line: "This is the part that keeps reappearing.", on: "IONA",
    why: "in front of the wall of dated husks — the film's largest image — she reclassifies the building as a symptom. Hold the wall, take her face for one sentence, give the wall back." },

  { scene: "BF-30", line: "Enough to keep it from becoming evidence.", on: "IONA",
    why: "the admission that the record has been managed — spoken over a white rectangle that waits, which is the film telling you the same thing in the other channel" },
];

/* ---- selection ----------------------------------------------------------
   Three passes, in this order, because the order is the argument.

   1. MATCH every authored turn to the run that carries its line. A turn that
      matches nothing is a typo in the script above, not a directorial choice,
      and must be reported as such rather than silently vanishing.
   2. THE LAW. A scene whose motion accumulates keeps its picture, even if I
      wanted a face there. This runs BEFORE the budget so that "the law forbade
      it" and "there was no room for it" are never confused.
   3. THE BUDGET, in AUTHORING ORDER — the order the turns are written above is
      the order I would defend them in. When a scene runs out of room the last
      turn listed is the one that goes, so the ranking is visible in the source
      rather than emerging from whichever line happened to come first in time. */
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const kept = [], cut = [], unmatched = [];
const byScene = {};
for (const u of CLOSE.units) if (u.face) (byScene[u.scene] ||= []).push(u);

// 1. match
for (const t of TURNS) {
  const units = byScene[t.scene] || [];
  const key = norm(t.line).slice(0, 26);
  t.unit = units.find((u) => norm(u.text).includes(key));
  if (!t.unit) unmatched.push(t);
}

// 2. the law, and the minimum shot
for (const t of TURNS) {
  if (!t.unit) continue;
  const info = MOTION[t.scene] || {};
  if (!INTERRUPTIBLE.has(info.motion))
    t.forbidden = `${info.motion} accumulates — leaving it means the audience misses the only time it happens`;
  else if (t.unit.seconds < MIN_SHOT && !t.react)
    t.forbidden = `${t.unit.seconds.toFixed(2)}s — a flinch, not a shot`;
}

// 3. the budget, in authoring order
const sceneTaken = {}, sceneSec = {};
for (const [sc, us] of Object.entries(byScene)) sceneSec[sc] = us.reduce((n, u) => n + u.seconds, 0);
for (const t of TURNS) {
  if (!t.unit || t.forbidden) continue;
  const st = (sceneTaken[t.scene] ||= { n: 0, sec: 0 });
  if (st.n >= MAX_PER_SCENE) { t.forbidden = `scene already has ${MAX_PER_SCENE} faces`; continue; }
  if ((st.sec + t.unit.seconds) / Math.max(1, sceneSec[t.scene]) > MAX_SHARE) {
    t.forbidden = "the scene would become mostly faces; a later turn yielded to an earlier one"; continue;
  }
  st.n++; st.sec += t.unit.seconds;
  const info = MOTION[t.scene] || {};
  kept.push({ ...t.unit, on: t.on, react: !!t.react, why: t.why, line: t.line,
    motion: info.motion, sceneSubject: info.subject,
    // A REACTION is a different asset: the listener's face over the speaker's
    // clock. It is generated below, and it is NOT the speaker's clip with a
    // different label — that mistake would put the talker's own mouth on screen
    // and call it a reaction.
    id: t.react ? `${t.unit.id}-react-${t.on.toLowerCase().replace(/[^a-z]/g, "")}` : t.unit.id,
    src: t.react ? `renders/motion/${t.unit.id}-react-${t.on.toLowerCase().replace(/[^a-z]/g, "")}.webm` : t.unit.src,
    speaker: t.unit.who });
}
for (const t of TURNS) if (t.unit && t.forbidden)
  cut.push({ id: t.unit.id, scene: t.scene, who: t.unit.who, seconds: t.unit.seconds,
             reason: t.forbidden, authored: true, line: t.line });
const keptIds = new Set(kept.map((k) => k.speaker ? `${k.scene}|${k.line}` : null));
for (const [sc, us] of Object.entries(byScene)) for (const u of us)
  if (!TURNS.some((t) => t.unit === u))
    cut.push({ id: u.id, scene: sc, who: u.who, seconds: u.seconds, reason: "no turn here — the image is the shot" });

/* ---- REACTION SHOTS -----------------------------------------------------
   Generated here rather than in build-closeups.mjs, because whether a shot is a
   reaction is a directorial decision and this is the file that makes those.

   A reaction gets a HOLD. The speaker's clip ends when their words do, because
   its mouth has to agree with them; a listener's face has nothing to agree with
   and can stay on screen after the line lands. That extra second is where a
   reaction shot does its work — "I remembered it" is 1.4s of speech and about
   four seconds of consequence. The hold is capped by the next shot's start, so
   it can never run over somebody else's line. */
const REACT_HOLD = 1.6;
const TIMING = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "line-timing.json"), "utf8"));
const takeOf = Object.fromEntries(TIMING.takes.map((t) => [t.id, t]));
const CLOSE_DIR = path.join(ROOT, "scenes", "_close");
const ENV_HZ = CLOSE.envHz || 50, FPS = CLOSE.fps || 12;

for (const k of kept.filter((x) => x.react)) {
  const take = takeOf[k.take];
  const sibling = (byScene[k.scene] || []).filter((u) => u.take === k.take)
    .sort((a, b) => a.t0 - b.t0).find((u) => u.t0 >= k.t1 - 1e-6);
  /* PASS 2. Capping the hold at the take's own end gave "I remembered it" no
     hold at all — it is the LAST run of the last take in its scene, so the take
     ends the moment she stops speaking, and the most important reaction in the
     film was 1.4 seconds long. But the SCENE does not end there: BF-29 runs
     13.5s and the take occupies a fraction of it. The rest is recorded silence
     in the master, which is exactly what a held reaction should sit over.
     So the hold runs past the take, the envelope is padded with the zeros that
     silence actually is, and build-film-close.mjs clamps it to the scene end —
     which it already did for every other shot. */
  const limit = sibling ? sibling.t0 : take.duration + REACT_HOLD;
  const t1 = Math.min(k.t1 + REACT_HOLD, limit);
  const seconds = +(t1 - k.t0).toFixed(3);
  const frames = Math.max(2, Math.round(seconds * FPS));

  const { pcm, rate } = readWav(path.join(ROOT, take.file));
  const e = envelope(pcm, rate, 1 / ENV_HZ);
  const sorted = Float32Array.from(e).sort();
  const loud = sorted[Math.floor(sorted.length * 0.90)] || 1e-4;
  const need = Math.ceil(t1 * ENV_HZ) - Math.floor(k.t0 * ENV_HZ);
  const slice = Array.from(e.slice(Math.floor(k.t0 * ENV_HZ), Math.ceil(t1 * ENV_HZ)),
    (v) => +Math.min(1.35, v / loud).toFixed(2));
  while (slice.length < need) slice.push(0);        // the hold, which is silence
  const env = slice;

  const faceKey = k.on.toLowerCase().replace(/[^a-z]/g, "");
  const seed = ["mara", "niko", "iona", "elise", "thegirl"].indexOf(faceKey);
  k.seconds = seconds; k.frames = frames; k.t1 = t1; k.face = faceKey;

  if (!REPORT) fs.writeFileSync(path.join(CLOSE_DIR, `${k.id}.mjs`), `\
/* ============================================================================
   ${k.id} — REACTION · ${k.on} hearing ${k.speaker}
   GENERATED by harness/direct.mjs. Do not hand-edit; edit the TURNS list.

     ${k.speaker}: ${JSON.stringify(k.line)}

   ${seconds.toFixed(2)}s · ${frames} frames. The line itself is ${(k.t1 - REACT_HOLD - k.t0).toFixed(2)}s;
   the rest is the hold, which is where a reaction shot does its work.

   WHY THIS SHOT EXISTS:
   ${k.why.replace(/(.{1,72})(\s|$)/g, "   $1\n").trim()}

   The envelope below is the SPEAKER's, not this face's. Nothing about a
   listener can be derived from its own voice, because it does not have one.
   ========================================================================= */
import { listenCarriage } from "../../engine/speech.mjs";
import { NW, NH } from "../../assets/set/_stage.mjs";
import { FACES, drawCloseup, closeGeom, idleFace } from "../../assets/character/_face.mjs";

export const id = ${JSON.stringify(k.id)};
export const title = ${JSON.stringify(k.on + " hears it")};
export const place = ${JSON.stringify(k.scene)};
export const plan = null;
export const motion = "LISTEN";         // the tenth motion, and the quietest
export const beats = null;
export const seconds = ${seconds};
export const loopClosed = false;
export const frames = ${frames};
export const declaredBreak = null;
export const breakAt = null;
export const subject = ${JSON.stringify(k.on + " deciding what to do with what was just said")};
export const distance = "CLOSE";
export const speaker = ${JSON.stringify(k.speaker)};
export const face = ${JSON.stringify(faceKey)};
export const leftOut = ["the person talking — that is the point of a reaction"];

const ENV_HZ = ${ENV_HZ};
const ENV = ${JSON.stringify(env)};
const AXIS = ${-1};
const SEED = ${seed};

export function at(u) {
  const t = u * seconds;
  const c = listenCarriage(ENV, ENV_HZ, t, SEED);
  const i = idleFace(t, SEED + 3);
  return {
    t,
    jaw: 0, wide: 0, press: c.press, teeth: 0, tongue: 0,
    // blink suppressed while the other voice is loud, released in the gaps
    blink: i.blink * c.blinkGate,
    gazeX: AXIS * 0.30 + i.gazeX * 0.20,
    gazeY: i.gazeY * 0.4 + 0.05,
    headYaw: AXIS * 0.11 + c.yaw,
    headPitch: c.pitch,
    headRoll: c.roll,
    browUp: 0.05 + c.brow,
    browKnit: c.brow * 0.5,
    chest: c.chest,
  };
}

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.lineJoin = "round"; g.lineCap = "round";
  drawCloseup(g, FACES[face], s, closeGeom(NW, NH));
  g.restore();
}

export const SCENE_VERSION = "reaction/1.0.0";
`);
}

/* ---- report ------------------------------------------------------------- */
const missed = unmatched;
console.log(`DIRECTION\n`);
console.log(`  ${CLOSE.units.filter((u) => u.face).length} runs had a face available`);
console.log(`  ${kept.length} earn one · ${cut.length} give the shot back to the image`);
console.log(`  ${kept.reduce((n, k) => n + k.seconds, 0).toFixed(1)}s of face in a 409s film ` +
  `(${(100 * kept.reduce((n, k) => n + k.seconds, 0) / 409).toFixed(1)}%, was 45.1%)\n`);

console.log(`  THE CUT\n`);
for (const k of kept) {
  console.log(`  ${k.scene.padEnd(6)} ${k.motion.padEnd(9)} ${(k.react ? "REACT " : "      ")}${String(k.on).padEnd(6)} ` +
    `${k.seconds.toFixed(1)}s  ${JSON.stringify(k.line)}`);
}
if (missed.length) {
  console.log(`\n  ** ${missed.length} authored turn(s) matched no run — a typo above, not a decision:`);
  for (const t of missed) console.log(`      ${t.scene}  ${JSON.stringify(t.line)}  (${t.on})`);
}
const overruled = cut.filter((c) => c.authored);
if (overruled.length) {
  console.log(`\n  TURNS I WANTED AND DID NOT GET (${overruled.length})`);
  for (const c of overruled) console.log(`      ${c.scene}  ${JSON.stringify(c.line)}\n           ${c.reason}`);
}
const byReason = {};
for (const c of cut) byReason[c.reason.split(";")[0].split(" —")[0]] = (byReason[c.reason.split(";")[0].split(" —")[0]] || 0) + 1;
console.log(`\n  WHY THE OTHER ${cut.length} STAY ON THE IMAGE`);
for (const [r, n] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) console.log(`      ${String(n).padStart(3)}  ${r}`);

const nonInt = Object.entries(MOTION).filter(([, m]) => !INTERRUPTIBLE.has(m.motion));
console.log(`\n  ${nonInt.length} scenes carry a motion that cannot be interrupted and were never candidates:`);
console.log(`      ${nonInt.map(([s, m]) => `${s}(${m.motion})`).join(" ")}`);

if (!REPORT) {
  fs.writeFileSync(path.join(ROOT, "film", "direction.json"), JSON.stringify({
    built: new Date().toISOString(),
    law: "a close-up may only interrupt a motion that comes round again (CYCLE, HOLD)",
    interruptible: [...INTERRUPTIBLE], minShot: MIN_SHOT, maxPerScene: MAX_PER_SCENE, maxShare: MAX_SHARE,
    kept, cut, unmatched: unmatched.map((t) => ({ scene: t.scene, line: t.line })),
  }, null, 1));
  console.log(`\n  wrote film/direction.json`);
}
