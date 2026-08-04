#!/usr/bin/env node
/* ============================================================================
   gate.mjs — THE LOOP, MADE EXECUTABLE.

   Every stage of a halfworld has a condition that must hold before the next
   stage is worth starting. Written as prose in a brief, those conditions get
   skipped. Written here, they exit non-zero.

     node harness/gate.mjs            run every gate, report, exit 1 on failure
     node harness/gate.mjs 3          run one gate
     node harness/gate.mjs --json     machine-readable, for a supervising agent

   THIS IS THE ORCHESTRATION CONTRACT. An agent driving a build loops:

       for gate in 1..7:
           while not gate.passes:
               do the work the gate names
               re-run the gate
           checkpoint

   Each gate reports WHAT failed and WHICH STAGE fixes it, because a gate that
   only says "false" makes the loop guess.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const has = (p) => fs.existsSync(path.join(ROOT, p));
const JSON_OUT = process.argv.includes("--json");
const ONLY = process.argv.find((a) => /^\d+$/.test(a));

/* A gate: { n, name, fixedBy, run() -> {pass, detail, numbers} } */
const GATES = [];
const gate = (n, name, fixedBy, run) => GATES.push({ n, name, fixedBy, run });

/* ---------------------------------------------------------------- GATE 1 */
gate(1, "corpus is well formed", "STAGE 1 — segment (prompts/01-segment.poml)", () => {
  // The corpus filename is the config's business, not this gate's. Hardcoding
  // "source.json" made this gate fail against the world it was written in.
  const cfg = has("world.config.json") ? J("world.config.json") : {};
  const src = path.join("atlas", cfg.source || "source.json");
  if (!has(src)) return { pass: false, detail: `no ${src} (set "source" in world.config.json if it is named differently)` };
  const S = J(src);
  const d = (S.docs || []).filter((x) => x.kind === "scene");
  const ids = new Set(d.map((x) => x.id));
  const dup = d.length - ids.size;
  const noTitle = d.filter((x) => !x.title).length;
  const noEl = d.filter((x) => !x.el || !x.el.length).length;
  const emptyCast = d.filter((x) => !x.cast || !x.cast.length).length;
  const bad = [];
  if (!d.length) bad.push("no units at all");
  if (dup) bad.push(`${dup} duplicate id(s)`);
  if (noTitle) bad.push(`${noTitle} unit(s) with no title`);
  if (noEl) bad.push(`${noEl} unit(s) with empty el`);
  if (d.length > 3000) bad.push(`${d.length} units — over the 3000 ceiling; your unit is too small, re-segment one level up`);
  return {
    pass: !bad.length,
    detail: bad.join(" · ") || `${d.length} units, all ids unique`,
    // NOT a failure: the source is often right to name nobody.
    numbers: { units: d.length, emptyCast, note: emptyCast ? `${emptyCast} unit(s) name no cast — usually correct; gate 2 annotates them` : "" },
  };
});

/* ---------------------------------------------------------------- GATE 2 */
gate(2, "every unit has a plan", "STAGE 4 — the collapse (world.config.json)", () => {
  if (!has("atlas/world.json")) return { pass: false, detail: "no atlas/world.json — run build-atlas.mjs" };
  const W = J("atlas/world.json");
  const unmapped = W.scenes.filter((s) => !s.plan);
  const ratio = W.totals.scenes / Math.max(1, W.totals.plans);
  const warn = ratio < 4 ? ` — only ${ratio.toFixed(1)} units per room; you are authoring a travelogue` : "";
  return {
    pass: unmapped.length === 0,
    detail: unmapped.length ? `${unmapped.length} unmapped: ${unmapped.slice(0, 8).map((s) => s.id).join(" ")}` : `all ${W.totals.scenes} mapped${warn}`,
    numbers: { scenes: W.totals.scenes, plans: W.totals.plans, unitsPerRoom: +ratio.toFixed(1) },
  };
});

/* ---------------------------------------------------------------- GATE 3 */
gate(3, "every principal has a world-text with locks", "STAGE 2 — world-text (prompts/02-world-text.poml)", () => {
  if (!has("atlas/world.json")) return { pass: false, detail: "no atlas/world.json" };
  const W = J("atlas/world.json");
  // A principal is anyone in >= 8 units. Below that a thinner model is allowed.
  const principals = W.cast.filter((c) => c.scenes >= 8);
  const naked = principals.filter((c) => !c.lockCount);
  const thin = principals.filter((c) => c.entityCount < 5);
  const bad = [];
  if (naked.length) bad.push(`${naked.length} principal(s) with NO locks: ${naked.map((c) => c.id).join(" ")}`);
  if (thin.length) bad.push(`${thin.length} principal(s) with <5 entities: ${thin.map((c) => c.id).join(" ")}`);
  return {
    pass: !bad.length,
    detail: bad.join(" · ") || `${principals.length} principals, all with locks`,
    numbers: { cast: W.totals.cast, principals: principals.length, entities: W.totals.entities, locks: W.totals.locks },
  };
});

/* ---------------------------------------------------------------- GATE 4 */
gate(4, "plan geometry holds", "STAGE 6 — plans", () => {
  const vs = ["harness/verify-plans.mjs", "harness/verify-plans-b.mjs"].filter(has);
  if (!vs.length) return { pass: false, detail: "no verifier — write one; it must assert no two stations collide, every station is in frame, and projected depth matches z-order" };
  const out = [];
  for (const v of vs) {
    try { execFileSync("node", [v], { stdio: "pipe" }); out.push(`${path.basename(v)} exit 0`); }
    catch (e) { return { pass: false, detail: `${path.basename(v)} FAILED — ${String(e.stdout || e).slice(-300)}` }; }
  }
  return { pass: true, detail: out.join(" · ") };
});

/* ---------------------------------------------------------------- GATE 5 */
gate(5, "every unit is staged and rendered", "STAGE 8 — scenes", () => {
  if (!has("atlas/world.json")) return { pass: false, detail: "no atlas/world.json" };
  const W = J("atlas/world.json");
  const wrote = new Set(has("scenes") ? fs.readdirSync(path.join(ROOT, "scenes")).filter((f) => /\.mjs$/.test(f) && !f.startsWith("_")).map((f) => f.replace(/\.mjs$/, "")) : []);
  const drew = new Set(has("renders") ? fs.readdirSync(path.join(ROOT, "renders")).filter((f) => f.startsWith("scene__")).map((f) => f.replace(/^scene__|\.png$/g, "")) : []);
  const missW = W.scenes.filter((s) => !wrote.has(s.id) && !s.markerOnly);
  const missR = W.scenes.filter((s) => !drew.has(s.id) && !s.markerOnly);
  return {
    pass: !missW.length && !missR.length,
    detail: (missW.length || missR.length)
      ? `${missW.length} unstaged, ${missR.length} unrendered — e.g. ${[...missW, ...missR].slice(0, 6).map((s) => s.id).join(" ")}`
      : `${wrote.size} staged, ${drew.size} rendered`,
    numbers: { staged: wrote.size, rendered: drew.size, of: W.scenes.length },
  };
});

/* ---------------------------------------------------------------- GATE 6 */
gate(6, "the record is real", "the LEDGER law — every agent writes as it works", () => {
  if (!has("process/index.json")) return { pass: false, detail: "no process/index.json — run build-process-index.mjs" };
  const P = J("process/index.json");
  const lanes = Object.entries(P.lanes || {});
  const fake = lanes.filter(([, v]) => v.syntheticClock).map(([k]) => k);
  const arts = Object.values(P.artifacts || {});
  const unlooked = arts.filter((a) => !a.saw || !a.saw.length);
  const bad = [];
  // A ledger with no failures is a falsified ledger — check somebody revised something.
  const revisions = arts.reduce((n, a) => n + (a.revisions || 0), 0);
  if (fake.length) bad.push(`${fake.length} lane(s) invented their clock: ${fake.join(" ")}`);
  if (!revisions) bad.push("zero revisions recorded anywhere — no agent rejected a single pass, which is not credible");
  return {
    pass: !bad.length,
    detail: bad.join(" · ") || `${P.steps.length} steps, ${lanes.length} lanes, ${revisions} recorded revisions`,
    numbers: { steps: P.steps.length, lanes: lanes.length, revisions, artifactsNobodyLookedAt: unlooked.length },
  };
});

/* ---------------------------------------------------------------- GATE 7 */
gate(7, "picture and sound agree", "STAGE 10 — the cut", () => {
  if (!has("film/cut.json")) return { pass: false, detail: "no film/cut.json — run build-film.mjs" };
  const C = J("film/cut.json");
  const notes = [];
  let pass = true;

  // the 74-second bug: both clocks must be built from ONE rule
  const master = ["audio/master.m4a", "audio/master.wav"].find(has);
  if (master) {
    try {
      const d = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path.join(ROOT, master)], { encoding: "utf8" }).trim());
      const drift = Math.abs(d - C.totalSeconds);
      notes.push(`master ${(d / 60).toFixed(2)}min vs cut ${(C.totalSeconds / 60).toFixed(2)}min · drift ${drift.toFixed(2)}s`);
      if (drift > 1.0) { pass = false; notes.push("DRIFT — picture and sound are using different rules for some duration"); }
    } catch (_) { notes.push("ffprobe unavailable; drift unchecked"); }
  } else notes.push("no audio master yet");

  if (C.provisional) {
    const pct = (C.realLines / (C.realLines + C.estimatedLines) * 100).toFixed(1);
    notes.push(`PROVISIONAL — ${pct}% of lines measured; the cut must stay labelled provisional`);
  }
  return { pass, detail: notes.join(" · "), numbers: { minutes: +(C.totalSeconds / 60).toFixed(2), provisional: !!C.provisional } };
});

/* ------------------------------------------------------------------ run */
const chosen = ONLY ? GATES.filter((g) => String(g.n) === ONLY) : GATES;
const results = chosen.map((g) => {
  let r; try { r = g.run(); } catch (e) { r = { pass: false, detail: "gate threw: " + e.message }; }
  return { ...g, ...r, run: undefined };
});

if (JSON_OUT) { console.log(JSON.stringify({ pass: results.every((r) => r.pass), gates: results }, null, 1)); }
else {
  console.log("HALFWORLD GATES\n");
  for (const r of results) {
    console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.n}. ${r.name}`);
    console.log(`        ${r.detail}`);
    if (r.numbers && r.numbers.note) console.log(`        ${r.numbers.note}`);
    if (!r.pass) console.log(`        → fixed by: ${r.fixedBy}`);
  }
  const failed = results.filter((r) => !r.pass);
  console.log(`\n  ${results.length - failed.length}/${results.length} gates pass`);
  if (failed.length) console.log(`  next: ${failed[0].fixedBy}`);
}
process.exit(results.every((r) => r.pass) ? 0 : 1);
