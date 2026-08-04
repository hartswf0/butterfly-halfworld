#!/usr/bin/env node
// Collate every agent's process ledger into one index the dual-track page can play.
//
// Two clocks come out of this:
//   MAKING TIME — wall clock, every step every agent took, as lanes.
//   PROVENANCE  — artifact id -> its construction record, so a frame can show
//                 exactly how the things inside it came to be drawn.
//
// Reads  process/*.jsonl
// Writes process/index.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDIR = path.join(ROOT, "process");

function readLedgers() {
  if (!fs.existsSync(PDIR)) return [];
  const out = [];
  for (const f of fs.readdirSync(PDIR).filter((f) => f.endsWith(".jsonl"))) {
    const lane = f.replace(/\.jsonl$/, "");
    const lines = fs.readFileSync(path.join(PDIR, f), "utf8").split("\n");
    let n = 0, bad = 0;
    for (const line of lines) {
      const s = line.trim();
      if (!s) continue;
      try {
        const o = JSON.parse(s);
        o.lane = lane;
        o.seq = n++;
        out.push(o);
      } catch (_) {
        bad++; // a half-written line from a live agent; skip, count, report
      }
    }
    if (bad) console.warn(`  ${lane}: ${bad} unparseable line(s) (agent may still be writing)`);
  }
  return out;
}

// An artifact reference can arrive as a path, an id, or neither. Normalise to a
// stable key: the basename without extension, which is how scenes name their cast.
function keyOf(a) {
  if (!a) return null;
  return path.basename(String(a)).replace(/\.(mjs|json|png|js)$/i, "");
}

function build() {
  const steps = readLedgers().sort((a, b) => String(a.t || "").localeCompare(String(b.t || "")));

  // A lane whose timestamps are all round increments (00:00:00Z, 00:01:00Z, …)
  // did not read a clock; it made one up. Say so rather than normalising it away.
  function synthetic(list) {
    const ts = list.map((s) => Date.parse(s.t || "")).filter(Number.isFinite);
    if (ts.length < 3) return false;
    const allRound = list.every((s) => /T\d\d:\d\d:00(\.000)?Z?$/.test(String(s.t || "")));
    const gaps = ts.slice(1).map((v, i) => v - ts[i]);
    const uniform = new Set(gaps).size <= 2 && gaps.every((g) => g >= 0);
    return allRound && uniform;
  }

  const lanes = {};
  const byArtifact = {};
  let t0 = null, t1 = null;

  for (const s of steps) {
    (lanes[s.lane] ||= []).push(s);
    const k = keyOf(s.artifact);
    if (k) (byArtifact[k] ||= []).push(s);
    const ms = Date.parse(s.t || "");
    if (Number.isFinite(ms)) {
      if (t0 === null || ms < t0) t0 = ms;
      if (t1 === null || ms > t1) t1 = ms;
    }
  }

  // Per-artifact summary: how many passes, how many rejected, what changed.
  const artifacts = {};
  for (const [k, list] of Object.entries(byArtifact)) {
    const iters = new Set(list.map((s) => s.iteration).filter((n) => Number.isFinite(n)));
    const revisions = list.filter((s) => s.step === "revise");
    artifacts[k] = {
      id: k,
      steps: list.length,
      iterations: iters.size || 1,
      revisions: revisions.length,
      lane: list[0].lane,
      first: list[0].t || null,
      last: list[list.length - 1].t || null,
      // what the agent SAW, in order — the honest record
      saw: list.filter((s) => s.saw).map((s) => ({ t: s.t, iteration: s.iteration ?? null, saw: s.saw })),
      changed: list.filter((s) => s.changed).map((s) => ({ t: s.t, iteration: s.iteration ?? null, changed: s.changed })),
      notes: list.filter((s) => s.note).map((s) => ({ t: s.t, step: s.step ?? null, note: s.note })),
    };
  }

  const index = {
    schema: "abiding/process/v1",
    built: new Date().toISOString(),
    span: { start: t0 ? new Date(t0).toISOString() : null, end: t1 ? new Date(t1).toISOString() : null, ms: t0 && t1 ? t1 - t0 : 0 },
    lanes: Object.fromEntries(
      Object.entries(lanes).map(([k, v]) => [
        k,
        { steps: v.length, first: v[0].t || null, last: v[v.length - 1].t || null, syntheticClock: synthetic(v) },
      ])
    ),
    steps,
    artifacts,
  };

  fs.mkdirSync(PDIR, { recursive: true });
  fs.writeFileSync(path.join(PDIR, "index.json"), JSON.stringify(index));

  const mins = index.span.ms ? (index.span.ms / 60000).toFixed(1) : "0";
  console.log(`process index: ${steps.length} steps · ${Object.keys(lanes).length} lanes · ${Object.keys(artifacts).length} artifacts · ${mins} min of making time`);
  for (const [k, v] of Object.entries(index.lanes))
    console.log(`  ${k.padEnd(14)} ${String(v.steps).padStart(4)} steps${v.syntheticClock ? "   [SYNTHETIC CLOCK — timestamps invented, not read]" : ""}`);

  const noSaw = Object.values(artifacts).filter((a) => a.saw.length === 0);
  if (noSaw.length) console.warn(`  WARNING: ${noSaw.length} artifact(s) have no "saw" entry — nobody looked at the render: ${noSaw.slice(0, 8).map((a) => a.id).join(", ")}`);

  return index;
}

build();
