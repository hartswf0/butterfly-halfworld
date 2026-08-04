#!/usr/bin/env node
// Decompose the whole ABIDING ACRES corpus into a halfworld atlas.
//
// Source: atlas/acres-source.json  (151 docs · 10 episodes · 20 characters · 11 concepts)
// Writes: atlas/world.json          the world index
//         atlas/scenes/<id>.md      every scene's screenplay, readable for ~1KB
//         atlas/cast/<id>.json      every character's typed entity graph + locks
//         atlas/locations.json      raw headings collapsed onto authored plans
//
// The collapse is the load-bearing decision: 25 raw location strings across 131
// scenes become ~10 authored plans, because a cul-de-sac is one continuous space
// and the show keeps walking across it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const A = path.join(ROOT, "atlas");
const S = JSON.parse(fs.readFileSync(path.join(A, "acres-source.json"), "utf8"));

/* ------------------------------------------------------------------ plans */
// Raw heading -> authored plan. Everything in `the-court` shares ONE plan space
// so a body can cross from one driveway to another without a cut.
const PLAN_OF = {
  "4 ABIDING COURT": "the-court",
  "5 ABIDING COURT": "the-court",
  "6 ABIDING COURT": "the-court",
  "8 ABIDING COURT": "the-court",
  "ABIDING COURT": "the-court",
  "ABIDING ACRES": "the-court",
  "THE BULB": "the-court",
  "THE CORNER": "the-court",
  "THE CORNER MAILBOX": "the-court",
  "CURB": "the-court",
  "THE EASEMENT": "the-easement",
  "LAND USE OFFICE": "land-use-office",
  "CITY LAND USE OFFICE": "land-use-office",
  "LIBRARY": "library",
  "MULTIPURPOSE ROOM": "multipurpose-room",
  // NOT `four-interior`. I mapped these to Four because the apple tree at Four
  // starts the series and I assumed it was Beth's house. The screenplay says
  // otherwise, three times: S101-5, S104-7 and S105-10 all sign "Beth Kovac,
  // 8 Abiding Court", and S102-7 / S102-8 are headed EXT. 8 ABIDING COURT —
  // her garage, her driveway. The interior of FOUR is Imogene Abbott's empty
  // house, already authored inside `the-court` as four_liv_*, with an amber
  // wall plate in it. The plate is Mona. Caught by the plans agent from the
  // primary source, in a show about checking primary sources.
  "BETH'S KITCHEN": "eight-interior",
  "BETH'S BEDROOM": "eight-interior",
  "COUNTY CLERK": "county",
  "COUNTY CASHIER": "county",
  "COUNTY BUILDING": "county",
  "HOLLIS DEAN'S OFFICE": "hollis-office",
  "HOLLIS DEAN'S CAR": "hollis-car",
  "RUTH'S KITCHEN, MICHIGAN": "ruth-kitchen",
  // The two cold opens are not rooms. They are a Nextdoor feed and the first
  // pilot's opening — text that a neighbourhood reads about itself. Season Two
  // is literally called THE SCREENS. Staging them as a surface, not a space.
  "COLD OPEN": "the-feed",
};

function heading(title) {
  const m = String(title || "").match(/^(INT\.|EXT\.|INT\/EXT\.)\s*(.+?)\s*--\s*(.*)$/);
  if (!m) return { int: null, loc: String(title || "").trim(), time: "" };
  return { int: m[1], loc: m[2].trim(), time: m[3].trim() };
}

/* ------------------------------------------------ scenes, in episode order */
// The source carries structural act markers ("## COLD OPEN", "## TAG",
// "## ACT TWO") as ACTION elements. Two of them — SA2-0 and SA2-17 — are the
// ENTIRE content of their document, so they are act boundaries wearing a scene
// heading, not scenes with missing bodies; six more sit inside real scenes and
// pollute the action. Strip them out, keep them as metadata, and mark the
// documents that are nothing else. Found because the agent staging EA2
// suspected the parser was dropping scene bodies — it was not, but it was
// right that something was wrong here.
const ACT_MARK = /^#{1,3}\s*(.+?)\s*$/;
function splitActs(el) {
  const acts = [], kept = [];
  for (const [k, v] of el || []) {
    const m = k === "ACTION" && ACT_MARK.exec(String(v));
    if (m) acts.push(m[1]);
    else kept.push([k, v]);
  }
  return { acts, kept };
}

const sceneDocs = S.docs.filter((d) => d.kind === "scene");
for (const d of sceneDocs) {
  const { acts, kept } = splitActs(d.el);
  d.acts = acts;
  d.markerOnly = kept.length === 0 && acts.length > 0;
  d.el = kept;
}
const byId = Object.fromEntries(sceneDocs.map((d) => [d.id, d]));

/* ------------------------------------------------------------- cast hints */
// 34 of 131 scenes carry an EMPTY cast list, and two scene agents independently
// reported the same consequence: S202-13 and S201-12 read as having nobody in
// them, when both are entirely the angel. The source is not wrong — those
// scenes genuinely never name him and never use a character cue. S202-13 says
// "eleven feet of open surface", "where the primaries are broken", "the wings
// hold nothing". A body is obviously present; only its name is absent.
//
// So annotate rather than overwrite. Hints come from distinctive NOUNS, not
// names — low false-positive risk — and every hint carries the word that
// triggered it, so a reader can judge the inference instead of trusting it.
const HINTS = {
  angel:    /\b(wings?|primaries|pinion|span|feather)\b/i,
  mona:     /\b(wall plate|plate|amber|indicator|bead)\b/i,
  deer:     /\b(deer|doe|does|yearling|fawn)\b/i,
  hap:      /\b(dog|muzzle|paws?)\b/i,
  crows:    /\b(crows?)\b/i,
  vultures: /\b(vultures?|dihedral)\b/i,
  trout:    /\b(trout)\b/i,
  cat:      /\b(cat|tabby)\b/i,
};
function castHintsFor(d) {
  const text = (d.el || []).map(([, v]) => String(v)).join(" ");
  const out = [];
  for (const [id, re] of Object.entries(HINTS)) {
    const m = re.exec(text);
    if (m) out.push({ id, evidence: m[0] });
  }
  return out;
}


// "SAME" inherits the previous scene's location within its episode.
const scenes = [];
for (const ep of S.eps) {
  let lastLoc = null;
  for (const sid of ep.scenes || []) {
    const d = byId[sid];
    if (!d) continue;
    const h = heading(d.title);
    let loc = h.loc;
    if (/^SAME$/i.test(loc) || !loc) loc = lastLoc || "ABIDING COURT";
    else lastLoc = loc;
    const plan = PLAN_OF[loc.toUpperCase()] || null;
    scenes.push({
      id: d.id, num: d.num, ep: ep.id, epnum: ep.num, eptitle: ep.title,
      part: ep.part || null, heading: d.title, int: h.int, loc, time: h.time,
      plan, cast: d.cast || [],
      acts: d.acts || [], markerOnly: !!d.markerOnly,
      castStated: (d.cast || []).length > 0,
      castHints: (d.cast || []).length ? [] : castHintsFor(d),
      el: d.el ? d.el.length : 0,
      words: (d.el || []).reduce((n, [, v]) => n + String(v).split(/\s+/).length, 0),
    });
  }
}

/* ------------------------------------------------------ concept weighting */
// Concepts carry weighted document references; invert them onto scenes.
const conceptOf = {};
for (const c of S.concepts) {
  for (const r of c.docs || []) {
    if (!r || !r.d) continue;
    (conceptOf[r.d] ||= []).push({ concept: c.id, name: c.name, h: r.h ?? 1 });
  }
}
for (const s of scenes) {
  s.concepts = (conceptOf[s.id] || []).sort((a, b) => b.h - a.h).slice(0, 4);
}

/* --------------------------------------------------------- the cast graph */
fs.mkdirSync(path.join(A, "cast"), { recursive: true });
const cast = [];
for (const c of S.chars) {
  const wt = typeof c.wt === "string" ? JSON.parse(c.wt) : c.wt;
  const cm = wt.character_model || wt;
  const ents = cm.entities || [];
  const person = ents.find((e) => e.type === "person" || e.type === "creature") || {};

  // The `states` are consistency LOCKS: face_locked, silhouette_locked,
  // genre_drift_allowed, expression_range, motion_complexity … i.e. an
  // already-authored CAST contract. Parse them into a flat map.
  const locks = {};
  for (const st of cm.states || []) {
    const o = typeof st === "string" ? safeJSON(st) : st;
    if (o && o.k) locks[String(o.k).split(".").slice(1).join(".")] = o.v;
  }

  const byType = {};
  for (const e of ents) (byType[e.type] ||= []).push(e);

  const rec = {
    id: c.id, name: c.name || c.id, key: c.key || null,
    kind: person.type === "creature" ? "creature" : "person",
    description: (cm.meta && cm.meta.description) || "",
    archetype: person.archetype || "", role: person.role || "",
    home: person.loc || "", traits: person.traits || [],
    locations: cm.locations || [],
    entities: byType,
    entityCount: ents.length,
    locks,
    relations: cm.relations || [],
    outputs: cm.outputs || [],
    scenes: scenes.filter((s) => (s.cast || []).includes(c.id)).map((s) => s.id),
  };
  fs.writeFileSync(path.join(A, "cast", c.id + ".json"), JSON.stringify(rec, null, 1));
  cast.push({
    id: rec.id, name: rec.name, kind: rec.kind, description: rec.description,
    entityCount: rec.entityCount, lockCount: Object.keys(locks).length,
    scenes: rec.scenes.length, eps: [...new Set(rec.scenes.map((id) => byId[id]?.ep))].filter(Boolean),
  });
}
function safeJSON(s) { try { return JSON.parse(s); } catch (_) { return null; } }

/* ------------------------------------------------ every scene, as markdown */
fs.mkdirSync(path.join(A, "scenes"), { recursive: true });
for (const s of scenes) {
  const d = byId[s.id];
  let out = `# ${s.num}  ${s.heading}\n\n`;
  out += `episode: ${s.epnum} — ${s.eptitle}\nlocation: ${s.loc}\nplan: ${s.plan || "UNMAPPED"}\n`;
  out += `cast: ${s.cast.join(", ") || "—"}\n`;
  out += `concepts: ${s.concepts.map((c) => `${c.concept}(${c.h})`).join(" ") || "—"}\n\n---\n\n`;
  for (const [k, v] of d.el || []) {
    if (k === "ACTION") out += `\n${v}\n`;
    else if (k === "CHAR") out += `\n**${v}**\n`;
    else if (k === "DIAL") out += `> ${v}\n`;
    else out += `\n[${k}] ${v}\n`;
  }
  fs.writeFileSync(path.join(A, "scenes", s.id + ".md"), out);
}

/* ------------------------------------------------------------- locations */
const planStats = {};
for (const s of scenes) {
  const p = s.plan || "UNMAPPED";
  const e = (planStats[p] ||= { plan: p, scenes: 0, headings: new Set(), eps: new Set(), cast: new Set() });
  e.scenes++; e.headings.add(s.loc); e.eps.add(s.ep);
  s.cast.forEach((c) => e.cast.add(c));
}
const plans = Object.values(planStats)
  .map((e) => ({ plan: e.plan, scenes: e.scenes, headings: [...e.headings].sort(), eps: [...e.eps].sort(), cast: [...e.cast].sort() }))
  .sort((a, b) => b.scenes - a.scenes);

/* --------------------------------------------------------------- prose */
const prose = S.docs.filter((d) => d.kind === "prose").map((d) => ({
  id: d.id, title: d.title, part: d.part || null,
  words: (d.el || []).reduce((n, [, v]) => n + String(v).split(/\s+/).length, 0),
  concepts: (conceptOf[d.id] || []).sort((a, b) => b.h - a.h).slice(0, 4),
}));

/* ---------------------------------------------------------------- write */
const world = {
  schema: "abiding/world/v1",
  built: new Date().toISOString(),
  title: "ABIDING ACRES",
  parts: S.parts,
  episodes: S.eps.map((e) => ({
    id: e.id, num: e.num, title: e.title, part: e.part,
    scenes: (e.scenes || []).filter((id) => byId[id]).length,
    plans: [...new Set(scenes.filter((s) => s.ep === e.id).map((s) => s.plan))],
    cast: [...new Set(scenes.filter((s) => s.ep === e.id).flatMap((s) => s.cast))].sort(),
  })),
  plans,
  cast,
  concepts: S.concepts.map((c) => ({
    id: c.id || c.key || c.name, gloss: c.gloss || c.desc || "",
    epigraph: c.epigraph || c.source || null,
    scenes: scenes.filter((s) => s.concepts.some((x) => x.concept === (c.id || c.key || c.name))).length,
  })),
  prose,
  scenes,
  totals: {
    episodes: S.eps.length, scenes: scenes.length, prose: prose.length,
    plans: plans.length, cast: cast.length,
    entities: cast.reduce((n, c) => n + c.entityCount, 0),
    locks: cast.reduce((n, c) => n + c.lockCount, 0),
    words: scenes.reduce((n, s) => n + s.words, 0),
    unmapped: scenes.filter((s) => !s.plan).length,
  },
};
fs.writeFileSync(path.join(A, "world.json"), JSON.stringify(world));
fs.writeFileSync(path.join(A, "locations.json"), JSON.stringify(plans, null, 1));

/* --------------------------------------------------------------- report */
const T = world.totals;
console.log(`ABIDING ACRES world atlas`);
console.log(`  ${T.episodes} episodes · ${T.scenes} scenes · ${T.prose} prose · ${T.words.toLocaleString()} words`);
console.log(`  ${T.cast} cast · ${T.entities} typed entities · ${T.locks} consistency locks`);
console.log(`  ${T.plans} authored plans from ${new Set(scenes.map((s) => s.loc)).size} raw headings`);
console.log(`\n  PLAN                SCENES  EPS  CAST  HEADINGS`);
for (const p of plans)
  console.log(`  ${p.plan.padEnd(18)} ${String(p.scenes).padStart(5)} ${String(p.eps.length).padStart(4)} ${String(p.cast.length).padStart(5)}  ${p.headings.slice(0, 3).join(" / ")}${p.headings.length > 3 ? ` +${p.headings.length - 3}` : ""}`);
if (T.unmapped) {
  console.warn(`\n  WARNING: ${T.unmapped} scene(s) have no plan:`);
  for (const s of scenes.filter((s) => !s.plan)) console.warn(`    ${s.id}  ${s.heading}`);
}
const unstated = scenes.filter((s) => !s.castStated && !s.markerOnly);
const hinted = unstated.filter((s) => s.castHints.length);
console.log(`
  ${unstated.length} scene(s) state no cast; ${hinted.length} carry evidence of a body anyway:`);
for (const s of hinted) console.log(`    ${s.id.padEnd(9)} ${s.castHints.map((h) => h.id + " (\"" + h.evidence + "\")").join(", ")}`);
const markers = scenes.filter((s) => s.markerOnly);
if (markers.length) {
  console.log(`
  ${markers.length} act-boundary marker(s) carry no screenplay — not stageable as scenes:`);
  for (const m of markers) console.log(`    ${m.id}  ${m.acts.join(" / ")}   (${m.heading})`);
}
const withActs = scenes.filter((s) => s.acts.length && !s.markerOnly);
if (withActs.length) console.log(`  ${withActs.length} scene(s) had act markers stripped out of their action lines`);
const noConcept = scenes.filter((s) => !s.concepts.length).length;
console.log(`\n  ${scenes.length - noConcept}/${scenes.length} scenes carry concept weight`);
