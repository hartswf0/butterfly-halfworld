#!/usr/bin/env node
/* ============================================================================
   build-atlas-index.mjs — THE PERIODIC TABLE, DERIVED.

   THE IDEA, and it is not a decoration.

   This world is made of a small number of PRIMITIVES that combine, and forty
   COMPOUNDS that are combinations of them. That is not a metaphor reached for
   after the fact — it is how the repo is actually built. A scene imports two
   or three assets, declares one of ten motions, names one of five plans, and
   lists the sound cues it wants. Nothing else. Every unit of the film is a
   formula over the same forty-odd elements.

   So:

     ELEMENTS   the things you cannot decompose — a motion, a body, a room, a
                cue. Each has a symbol, a number, and a group.
     COMPOUNDS  the scenes, written as formulas over the elements they use.

   BF-17 is not "a scene". It is Mi·Io·HOLD·Rm — a mill, Iona, a hold, and the
   mill's room tone — and once it is written that way you can see that BF-18,
   BF-19, BF-20, BF-22 and BF-25 are the same four columns with one substituted,
   which is a fact about the film that no amount of watching it will tell you.

   NOTHING HERE IS HAND-TYPED. The elements are read out of the filesystem, the
   formulas out of each scene's own imports and exports. If a scene starts using
   a new asset, the table changes. An atlas that has to be maintained by hand is
   an atlas that is wrong within a week.

     node harness/build-atlas-index.mjs           write atlas/periodic.json
     node harness/build-atlas-index.mjs --report  print the table, write nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const REPORT = process.argv.includes("--report");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/* ---- GROUPS -------------------------------------------------------------
   Ordered left to right the way a periodic table is: the things that DO
   something first, then the things that ARE something, then the things you
   hear. Column position is meaning, not layout. */
const GROUPS = [
  { id: "motion",  name: "MOTION",  gloss: "the ten ways this world is allowed to change over time" },
  { id: "cast",    name: "CAST",    gloss: "bodies with a state machine and a face" },
  { id: "creature",name: "ANIMAL",  gloss: "the lepidoptera, which are rigs and not characters" },
  { id: "place",   name: "PLACE",   gloss: "the five plans — a coordinate space with named stations" },
  { id: "set",     name: "SET",     gloss: "surfaces, apparatus and objects" },
  { id: "room",    name: "ROOM",    gloss: "the beds: what a place sounds like when nothing happens" },
  { id: "foley",   name: "FOLEY",   gloss: "the things that happen once" },
  { id: "score",   name: "SCORE",   gloss: "music, rooted on the 60Hz the laboratory hums at" },
];

/* ---- symbols ------------------------------------------------------------
   Two letters, chemistry-style, and they must be unique — a symbol that
   collides is a symbol that cannot be read in a formula. */
const used = new Set();
function symbolFor(name, hint) {
  const clean = String(hint || name).replace(/^_/, "").replace(/[^A-Za-z0-9]/g, "");
  const tries = [
    clean.slice(0, 1).toUpperCase() + clean.slice(1, 2).toLowerCase(),
    clean.slice(0, 1).toUpperCase() + clean.slice(2, 3).toLowerCase(),
    clean.slice(0, 1).toUpperCase() + clean.slice(3, 4).toLowerCase(),
    clean.slice(0, 2).toUpperCase(),
    clean.slice(0, 1).toUpperCase() + "x",
  ];
  for (const t of tries) if (t.length === 2 && !used.has(t)) { used.add(t); return t; }
  let i = 1; let t;
  do { t = clean.slice(0, 1).toUpperCase() + (i++); } while (used.has(t));
  used.add(t); return t;
}

const elements = [];
let Z = 0;
const add = (group, o) => { const e = { z: ++Z, group, ...o }; elements.push(e); return e; };

/* ---- 1. MOTION — read from engine/motion.mjs plus the two declared later -- */
const motionSrc = read("engine/motion.mjs");
const MOTION_DOC = {
  CYCLE: "a body that comes round again. Never closed — a closed cycle is apparatus, not an animal.",
  TRACE: "a line gathering over itself. Exists only as an accumulation; no single frame holds it.",
  SWEEP: "a wavefront crossing a field, left to right.",
  TRANSFER: "material moving from one surface to another. It brightens at the midpoint; nothing dims.",
  ADVANCE: "discrete steps with a dwell. Stepping, not sliding.",
  DISSOLVE: "an ordered per-dot swap. This world has no alpha, so a dissolve is an allegiance change.",
  HOLD: "not a freeze. A breath under 1% of frame — you should not be able to say for certain it moved.",
  BREAK: "the one permitted discontinuity, declared in the module that uses it.",
  SPEAK: "the ninth motion. A sentence runs once and stops; if it came round again it would not be a sentence.",
  LISTEN: "the tenth, and the quietest. A face responding to a voice it is not making.",
};
for (const [m, gloss] of Object.entries(MOTION_DOC))
  add("motion", { id: m, name: m, symbol: symbolFor(m, m), gloss,
    from: ["SPEAK", "LISTEN"].includes(m) ? "engine/speech.mjs" : "engine/motion.mjs",
    declared: motionSrc.includes(`--- ${m} ---`) || motionSrc.includes(m) });

/* ---- 2. CAST + 3. CREATURE — every asset module that is not private ------ */
for (const [dir, group] of [["assets/character", "cast"], ["assets/creature", "creature"]]) {
  for (const f of fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))) {
    const src = read(`${dir}/${f}`);
    const id = f.replace(/\.mjs$/, "");
    const name = (src.match(/name:\s*"([^"]+)"/) || [])[1] || id;
    const gloss = (src.match(/^\/\*\s*(?:character|creature)\.[a-z]+\s*—\s*([^\n]+)/m) || [])[1]
      || (src.split("\n")[0] || "").replace(/^\/\*+\s*/, "").trim();
    const states = [...src.matchAll(/^\s+(\w+):\s*\{\s*preview:/gm)].map((m) => m[1]);
    const motions = [...src.matchAll(/^\s{2}(\w+)(?:\(u[^)]*\))?\s*[:(]/gm)].map((m) => m[1]);
    add(group, { id, name, symbol: symbolFor(id, id), gloss, file: `${dir}/${f}`,
      states: [...new Set(states)],
      motions: [...new Set((src.match(/motions:\s*\{([\s\S]*?)\n\s{2}\}/) || ["", ""])[1]
        .matchAll(/^\s{4}(\w+)/gm))].map((m) => m[1]) });
  }
}

/* ---- 4. PLACE — the plans, with their station counts --------------------- */
for (const f of fs.readdirSync(path.join(ROOT, "scenes/_plans")).filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))) {
  const src = read(`scenes/_plans/${f}`);
  const id = f.replace(/\.mjs$/, "");
  const stations = [...src.matchAll(/^\s*(\w+):\s*\{\s*x:/gm)].map((m) => m[1]);
  const gloss = (src.split("\n").find((l) => /^\s{3}[A-Z].{20,}/.test(l)) || "").trim();
  add("place", { id, name: id.replace(/^the-/, "").toUpperCase(), symbol: symbolFor(id, id.replace(/^the-/, "")),
    gloss, file: `scenes/_plans/${f}`, stations: stations.length, stationNames: stations.slice(0, 40) });
}

/* ---- 5. SET — the drawable set modules ---------------------------------- */
for (const f of fs.readdirSync(path.join(ROOT, "assets/set")).filter((f) => f.endsWith(".mjs"))) {
  const src = read(`assets/set/${f}`);
  const id = f.replace(/\.mjs$/, "");
  const fns = [...src.matchAll(/^export function (\w+)/gm)].map((m) => m[1]);
  if (!fns.length) continue;
  const gloss = (src.split("\n").slice(0, 8).find((l) => /[a-z]{6}/.test(l) && !/^import|^\/\*=|^\s*\*?\s*$/.test(l)) || "")
    .replace(/^\s*\*?\s*/, "").replace(/^\/\*+\s*/, "").trim();
  add("set", { id, name: id.replace(/^_/, "").replace(/-/g, " ").toUpperCase(),
    symbol: symbolFor(id, id.replace(/^_/, "")), gloss, file: `assets/set/${f}`,
    exports: fns, private: f.startsWith("_") });
}

/* ---- 6/7/8. SOUND — beds, events, score --------------------------------- */
for (const [dir, group] of [["audio/sound", "room"], ["audio/foley", "foley"], ["audio/score", "score"]]) {
  if (!exists(dir)) continue;
  const idx = exists(`${dir}/index.json`) ? JSON.parse(read(`${dir}/index.json`)) : null;
  const list = idx ? (idx.cues || idx.events || []) : [];
  for (const c of list)
    add(group, { id: c.id, name: c.id.replace(/_/g, " ").toUpperCase(), symbol: symbolFor(c.id, c.id),
      gloss: "", file: c.file, seconds: c.sec, peak: c.peak, rms: c.rms });
}

/* ---- COMPOUNDS — every scene, as a formula ------------------------------
   Read out of the module: its declared motion, its plan, the assets it
   imports, and the cues the script gives it. */
const SCRIPT = JSON.parse(read("audio/script.json"));
const soundOf = Object.fromEntries(SCRIPT.scenes.map((s) => [s.id, s.sound || []]));
/* PASS 2. Twenty-nine elements came back with a valence of zero, and they were
   the foley, the score and the two speech motions — which is to say, every
   element that a SCENE MODULE does not mention. The foley and score sheets live
   in the mixer and the speech motions live in generated close-ups, so reading
   only scenes/ meant the table declared a third of the world unused. An index
   that reads one directory describes one directory. */
const masterSrc = read("harness/build-master.mjs");
for (const m of masterSrc.matchAll(/\{\s*at:\s*"([\w-]+)",\s*cue:\s*"(\w+)"/g))
  (soundOf[m[1]] ||= []).push(m[2]);
for (const m of masterSrc.matchAll(/\{\s*at:\s*"([\w-]+)",\s*t:\s*[\d.]+,\s*cue:\s*"(\w+)"/g))
  (soundOf[m[1]] ||= []).push(m[2]);
/* the close-ups: generated, one per thing somebody says, and the only place
   SPEAK and LISTEN are ever used. */
const closeDir = path.join(ROOT, "scenes", "_close");
const closeUnits = fs.existsSync(closeDir)
  ? fs.readdirSync(closeDir).filter((f) => f.endsWith(".mjs")) : [];
const bySym = Object.fromEntries(elements.map((e) => [e.id, e]));
const compounds = [];
for (const f of fs.readdirSync(path.join(ROOT, "scenes")).filter((f) => /^(BF-\d+|C\d+|P\d+|CREDITS)\.mjs$/.test(f))) {
  const src = read(`scenes/${f}`);
  const get = (k) => (src.match(new RegExp(`export const ${k}\\s*=\\s*(?:"([^"]*)"|([\\w.]+))`)) || [])
    .slice(1).find(Boolean);
  const id = get("id"); if (!id) continue;
  const imports = [...src.matchAll(/from\s+"\.\.\/assets\/(character|creature|set)\/([\w-]+)\.mjs"/g)].map((m) => m[2]);
  const parts = [];
  const plan = get("plan");
  if (plan && bySym[plan]) parts.push(bySym[plan]);
  for (const i of [...new Set(imports)]) if (bySym[i]) parts.push(bySym[i]);
  const motion = get("motion");
  if (motion && bySym[motion]) parts.push(bySym[motion]);
  for (const c of (soundOf[id] || [])) if (bySym[c]) parts.push(bySym[c]);
  compounds.push({
    id, title: get("title") || "", motion, plan: plan || null,
    seconds: +(get("seconds") || 0), distance: get("distance") || null,
    subject: (src.match(/export const subject\s*=\s*"([^"]+)"/) || [])[1] || "",
    formula: parts.map((p) => p.symbol).join("·"),
    elements: parts.map((p) => p.id),
    file: `scenes/${f}`,
    render: exists(`renders/motion/${id}.webm`) ? `renders/motion/${id}.webm` : null,
    contact: exists(`renders/motion/${id}-contact.png`) ? `renders/motion/${id}-contact.png` : null,
  });
}
/* the generated close-ups enter as compounds too — they are the film's units
   even though no human wrote their files. Rolled up per speaker rather than
   listed 95 times, because 95 rows of "MARA speaking" is not a table. */
const closeBy = {};
for (const f of closeUnits) {
  const src = read(`scenes/_close/${f}`);
  const face = (src.match(/export const face = "(\w+)"/) || [])[1];
  const motion = (src.match(/export const motion = "(\w+)"/) || [])[1];
  if (!face || !motion) continue;
  const k = `${face}·${motion}`;
  (closeBy[k] ||= { face, motion, n: 0, seconds: 0 });
  closeBy[k].n++;
  closeBy[k].seconds += +(src.match(/export const seconds = ([\d.]+)/) || [0, 0])[1];
}
for (const [k, v] of Object.entries(closeBy)) {
  const parts = [bySym[v.face], bySym[v.motion]].filter(Boolean);
  compounds.push({
    id: `CU·${v.face.toUpperCase()}`, title: `${v.face} ${v.motion.toLowerCase()}ing`,
    motion: v.motion, plan: null, seconds: +v.seconds.toFixed(1), distance: "CLOSE",
    subject: `${v.n} generated close-up${v.n > 1 ? "s" : ""} — one per thing they say`,
    formula: parts.map((p) => p.symbol).join("·"), elements: parts.map((p) => p.id),
    file: "scenes/_close/", generated: true, count: v.n, render: null, contact: null,
  });
}
compounds.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

/* ---- VALENCE — how many compounds each element appears in ---------------
   The number that makes the table worth having: it says which primitives the
   film is actually built out of, and which ones it used once and forgot. */
for (const e of elements) e.valence = compounds.filter((c) => c.elements.includes(e.id)).length;

/* ---- report -------------------------------------------------------------- */
console.log(`THE PERIODIC TABLE OF I REMEMBER BEING A BUTTERFLY\n`);
for (const g of GROUPS) {
  const es = elements.filter((e) => e.group === g.id);
  console.log(`  ${g.name.padEnd(9)} ${String(es.length).padStart(2)}  ${g.gloss}`);
  if (REPORT) for (const e of es)
    console.log(`      ${String(e.z).padStart(3)} ${e.symbol.padEnd(3)} ${e.name.padEnd(22)} used in ${e.valence}`);
}
console.log(`\n  ${elements.length} elements · ${compounds.length} compounds`);
const unused = elements.filter((e) => e.valence === 0 && !["set"].includes(e.group));
if (unused.length) console.log(`  ${unused.length} element(s) appear in no compound: ${unused.map((e) => e.symbol).join(" ")}`);
const busiest = [...elements].sort((a, b) => b.valence - a.valence).slice(0, 6);
console.log(`  most-used: ${busiest.map((e) => `${e.symbol}(${e.valence})`).join(" ")}`);
console.log(`\n  a few formulas:`);
for (const c of compounds.filter((c) => /^BF-(01|17|22|29|32)$/.test(c.id)))
  console.log(`      ${c.id.padEnd(7)} ${c.formula.padEnd(28)} ${c.subject.slice(0, 52)}`);

if (!REPORT) {
  fs.mkdirSync(path.join(ROOT, "atlas"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "atlas", "periodic.json"), JSON.stringify({
    built: new Date().toISOString(), groups: GROUPS, elements, compounds,
  }, null, 1));
  console.log(`\n  wrote atlas/periodic.json`);
}
