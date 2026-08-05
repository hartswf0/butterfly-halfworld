#!/usr/bin/env node
/* ============================================================================
   build-script.mjs — THE VOICES AND THE SOUND OF THIS WORLD.

   Unlike the sibling world, this corpus arrived with no character bible, so the
   delivery direction is derived from the prose and quoted beside it. Every
   direction below cites the sentence it comes from; nothing is invented.

   TWO TRACKS, NOT ONE.

   VOICE — 102 spoken lines across 7 speakers. Plus one that is not a speaker:
   the opening is first-person interior monologue by the insect ("I remember
   being a butterfly"), which is a VOICE-OVER and must never sound like a person
   in a room.

   SOUND — this text is unusually loud for something so quiet. It names its own
   sound design repeatedly and precisely:
     "a dry tapping … around the circumference at equal intervals"
     "Fans sighed inside the maze."
     "The ventilation system changed pressure. A soft metallic complaint."
     "its legs making slow, dry sounds too small for the room"
     "A clicking came from the wall … the sound travelled down the rows."
     "the projector … its fan rose to speed"
   These are not ambience. They are events on the same clock as the picture, and
   several of them ARE the picture — the tapping's equal intervals are the same
   quantised eight stations the scene draws.

   THE PROJECTOR RUNS AT THE FILM'S OWN FRAME RATE. 12fps is the rate this world
   renders at, chosen so each frame is a drawing rather than a sample. A
   projector shutter at 12Hz is therefore not a sound effect laid over the film;
   it is the film's own clock made audible. Every projector cue is generated at
   exactly FPS, and where the projection is the subject the shutter is the beat.

   Writes: audio/script.json
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const S = JSON.parse(fs.readFileSync(path.join(ROOT, "atlas", "source.json"), "utf8"));
const FPS = 12;

/* ---- casting, each direction quoted from the prose ---------------------- */
const CAST = {
  "VO": { id: "swallowtail", voice: "Enceladus", rate: 0.88,
    note: "the insect's own interior monologue, not a person in a room",
    from: "\"I remember being a butterfly. I remember the roof as a brightness I could not enter.\"",
    dir: "Interior monologue, close and unplaced — no room around it. Past tense recalled without nostalgia. Very slow. No performance of wonder; it is stating what it did." },

  "MARA": { id: "mara", voice: "Erinome", rate: 0.96,
    note: "a researcher deciding in real time whether to delete her own evidence",
    from: "\"both hands inside the sleeves, although there was nothing left for her hands to do\" · \"a woman held her breath\"",
    dir: "Level, precise, under-pitched. She answers questions with the fewest words that are true. Never raises. Where she is certain she gets shorter, not louder. Audible held breath before the sentences that cost her something." },

  "NIKO": { id: "niko", voice: "Puck", rate: 1.08,
    note: "treats procedural distinctions as moral ones",
    from: "\"He still treated procedural distinctions as if they were moral ones.\"",
    dir: "Quick, clean, faintly indignant — the tone of someone quoting a rule he believes in. Rising on the correction. He is younger than her and it shows in how fast he answers." },

  "IONA": { id: "iona", voice: "Gacrux", rate: 0.86,
    note: "expressions arrive before the features can contain them",
    from: "\"the expressions moving beneath it were quick, almost juvenile, arriving before the features could contain them\"",
    dir: "Old, dry, unhurried, and faintly amused at being doubted. She answers a question with a different question's answer. Aphoristic — each line lands like something she has said before and expects not to be believed." },

  "IONA (V.O.)": { id: "iona", voice: "Gacrux", rate: 0.82,
    note: "the voicemail — through a phone, over breathing like water on stone",
    from: "\"a larger rhythm, rough and receding, like water dragged over stone\"",
    dir: "The same woman, through a telephone. Slower. Breath audible before and after each clause. Flat, certain, and not addressed to anyone who can reply." },

  "ELISE (V.O.)": { id: "elise", voice: "Autonoe", rate: 1.0,
    note: "not the voice from the illness — the voice from childhood",
    from: "\"impatient and amused, calling from the front seat while Mara knelt backward in the car\"",
    dir: "Warm, impatient, amused. Calling forward over road noise to a child in the back. Absolutely ordinary — this is a mother telling a kid to face front, and it must not sound supernatural." },

  "THE GIRL": { id: "thegirl", voice: "Leda", rate: 0.94,
    note: "quiet, embarrassed, sorry to require attention",
    from: "\"The sound was quiet, embarrassed, as if the child had been waiting a long time and was sorry to require attention.\"",
    dir: "Eight years old. Small, level, apologetic. Not frightened and not sing-song. She is delivering information she assumes is unwelcome." },

  "IONA (O.S.)": { id: "iona", voice: "Gacrux", rate: 0.86,
    note: "the same woman, speaking from the dark at the pool's edge",
    from: "\"Iona's voice came from the dark. 'You see why it survives.'\"",
    dir: "Iona exactly, but unplaced — she is behind the listener, in a room with the lights out. No projection, no raise. Closer than a room should allow." },

  "PROJECTED MARA": { id: "mara", voice: "Erinome", rate: 0.96,
    note: "Mara's own voice, off a film that has no soundtrack",
    from: "\"Her lips moved. This time there was sound.\"",
    dir: "Mara exactly, but recorded — thinner, band-limited, one room further away. She is saying the film's first line back to her own face." },
};

/* ---- the sound elements, each cited ------------------------------------- */
const SOUND = [
  { id: "shock_pairing", cue: "the pairing that made the memory", scenes: ["BF-02", "BF-11", "BF-27"],
    from: "the referent: a scent paired with a mild shock at the caterpillar stage — the levels tested on the researcher's own arm first",
    kind: "pair", spec: { sec: 0.9, gap: 0.35 },
    note: "THE CAUSE OF EVERYTHING IN THIS FILM, and it is never seen. A soft scent-hiss, a gap, then a tick. It plays under the scenes that are ABOUT the memory rather than the scenes that contain it." },

  { id: "room_lab", cue: "the laboratory", scenes: ["BF-02","BF-03","BF-04","BF-06","BF-07","BF-08","BF-09","BF-12"],
    from: "\"a converted textile mill … windows too tall for modern use\"", kind: "room",
    spec: { band: [70, 320], drift: 0.02, hum: 60 } },

  { id: "room_mill", cue: "the stairwell and the lobby", scenes: ["BF-15","BF-16","BF-17","BF-18","BF-19","BF-20","BF-22"],
    from: "\"Fabric scraps pushed against the baseboards when the air system turned on.\"", kind: "room",
    spec: { band: [50, 260], drift: 0.05 } },

  { id: "room_lot", cue: "outside", scenes: ["BF-26","BF-27","BF-28"],
    from: "\"Heat, traffic, hot rubber, river damp, cut weeds, diesel, sunlight.\"", kind: "room",
    spec: { band: [90, 2400], drift: 0.10 } },

  { id: "wingbeat", cue: "the soft hinge of the body", scenes: ["BF-01","BF-23","BF-24","BF-25","BF-37"],
    from: "\"I remember striking it with the soft hinge of my body\"", kind: "beat",
    spec: { hz: 9, soft: true },
    note: "Not a flutter. A hinge — a dull soft contact, nine per second, felt more than heard." },

  { id: "tap_ring", cue: "the tapping at equal intervals", scenes: ["BF-14", "BF-21"],
    from: "\"Not wildly. It moves around the circumference, testing the glass at equal intervals.\"",
    kind: "quantised", spec: { hits: 8, perLoop: 1, timbre: "glass", quantise: true },
    note: "EIGHT hits per loop, on the same eight stations the scene draws. Must be dead-quantised — an eased tap is the wrong sound and the wrong drawing." },

  { id: "maze_fans", cue: "fans inside the maze", scenes: ["BF-01", "BF-03", "BF-37"],
    from: "\"Fans sighed inside the maze.\"", kind: "bed",
    spec: { band: [180, 900], drift: 0.06 } },

  { id: "vent_complaint", cue: "the ventilation changing pressure", scenes: ["BF-10", "BF-13"],
    from: "\"The ventilation system changed pressure. A soft metallic complaint moved through the ductwork.\"",
    kind: "event", spec: { sweep: [420, 300], sec: 1.8 } },

  { id: "legs_on_glass", cue: "legs making slow dry sounds too small for the room", scenes: ["BF-05", "BF-13"],
    from: "\"its legs making slow, dry sounds too small for the room\"",
    kind: "grain", spec: { rate: 5, tiny: true } },

  { id: "chrysalis_cascade", cue: "the clicking travelling down the rows", scenes: ["BF-32"],
    from: "\"A clicking came from the wall. One chrysalis moved. Then another. The sound travelled down the rows.\"",
    kind: "sweep", spec: { count: 75, order: "date", width: 0.06 },
    note: "SEVENTY-FIVE clicks, in date order, oldest first, on the same wavefront the picture sweeps. The sound and the image are one event." },

  { id: "projector", cue: "the shutter", scenes: ["BF-30", "BF-33", "BF-35", "BF-36", "BF-38", "BF-40"],
    from: "\"The projector turned on. Its fan rose to speed.\"",
    kind: "shutter", spec: { hz: FPS, fan: [90, 240] },
    note: "AT THE FILM'S OWN FRAME RATE. 12Hz is not an effect over the picture; it is the picture's clock made audible." },

  { id: "water", cue: "the pool", scenes: ["BF-30", "BF-36", "BF-39", "BF-40"],
    from: "\"Mara smelled water. Not rainwater or drainage. Chlorine, faint but unmistakable.\"",
    kind: "bed", spec: { band: [120, 480], drift: 0.03 } },

  { id: "summer", cue: "everything at once, at the break", scenes: ["BF-25"],
    from: "\"Heat, traffic, hot rubber, river damp, cut weeds, diesel, sunlight.\"",
    kind: "break", spec: { at: 0.58, bands: 7 },
    note: "Enters ON the declared break with no ramp. Before it: interior. After it: seven bands at once." },

  { id: "fluorescent", cue: "the tubes", scenes: ["BF-29", "BF-30", "BF-31", "BF-32"],
    from: "\"Inside, fluorescent tubes came on one after another.\"",
    kind: "bed", spec: { band: [100, 120], drift: 0.0 } },
];

/* ---- extract the spoken lines ------------------------------------------- */
const order = Object.fromEntries(S.docs.map((d, i) => [d.id, i]));
const lines = [];
const unknown = new Map();
for (const d of S.docs) {
  let who = null, n = 0;
  for (const [k, v] of d.el || []) {
    if (k === "CHAR") { who = String(v).trim().toUpperCase(); continue; }
    if (k === "VO") { who = "VO"; }
    if (k !== "DIAL" && k !== "VO") continue;
    const text = String(v).trim();
    const row = CAST[who];
    if (!row) { unknown.set(who, (unknown.get(who) || 0) + 1); continue; }
    lines.push({
      id: `${d.id}-L${String(++n).padStart(2, "0")}`,
      scene: d.id, sceneOrder: order[d.id], motion: d.motion,
      who, character: row.id, voice: row.voice, rate: row.rate,
      words: text.split(/\s+/).length, text,
      direction: `${row.note}. ${row.dir} Source: ${row.from}`,
    });
    if (k === "VO") who = null;
  }
}

/* ---- per-scene sound plan ----------------------------------------------- */
const soundFor = {};
for (const s of SOUND) for (const sc of s.scenes) (soundFor[sc] ||= []).push(s.id);

const scenes = S.docs.map((d) => ({
  id: d.id, title: d.title, plan: d.plan, motion: d.motion, loop: !!d.loop,
  lines: lines.filter((l) => l.scene === d.id).length,
  sound: soundFor[d.id] || [],
}));

const out = {
  schema: "butterfly/script/v1", built: new Date().toISOString(), fps: FPS,
  totals: {
    scenes: scenes.length, lines: lines.length,
    words: lines.reduce((n, l) => n + l.words, 0),
    speakers: new Set(lines.map((l) => l.who)).size,
    silentScenes: scenes.filter((s) => !s.lines).length,
    soundCues: SOUND.length,
    scenesWithSound: scenes.filter((s) => s.sound.length).length,
  },
  cast: CAST, sound: SOUND, scenes, lines,
};
fs.mkdirSync(path.join(ROOT, "audio"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "audio", "script.json"), JSON.stringify(out, null, 1));

const T = out.totals;
console.log(`I REMEMBER BEING A BUTTERFLY — script`);
console.log(`  ${T.lines} spoken lines · ${T.words} words · ${T.speakers} voices`);
console.log(`  ${T.silentScenes} of ${T.scenes} scenes have no dialogue`);
console.log(`  ${T.soundCues} sound cues across ${T.scenesWithSound} scenes\n`);
console.log(`  SPEAKER            VOICE       RATE  LINES`);
for (const [who, r] of Object.entries(CAST)) {
  const n = lines.filter((l) => l.who === who).length;
  console.log(`  ${who.padEnd(17)} ${r.voice.padEnd(11)} ${String(r.rate).padEnd(5)} ${String(n).padStart(4)}`);
}
console.log(`\n  SOUND CUE          KIND        SCENES`);
for (const s of SOUND) console.log(`  ${s.id.padEnd(17)} ${s.kind.padEnd(11)} ${s.scenes.length}`);
if (unknown.size) { console.warn(`\n  uncast:`); for (const [w, n] of unknown) console.warn(`    ${w} (${n})`); }
