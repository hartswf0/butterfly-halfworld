#!/usr/bin/env node
/* ============================================================================
   snap.mjs — MOVE A CUT OFF THE POET'S VOICE.

     node wygwyl/cut/snap.mjs                      report on all four cuts
     node wygwyl/cut/snap.mjs --cut suite --max 2  one cut, a wider nudge
     node wygwyl/cut/snap.mjs --write              write the snapped patch files

   cineosis-lab cuts the WYGWYL suite four ways, 169 patches each, and its
   patch boundaries carry t0/t1 on exactly the clock this repository uses —
   container starts 123.0, 214.1, 286.5, 422.2, 513.2. Nothing has to be
   mapped. The two projects were already addressing the same instants.

   WHAT IS WRONG WITH THE BOUNDARIES, MEASURED. Against the 368 spoken lines in
   `poem/aligned.json`, 47% of them land within half a second of a line edge —
   so the grid knows roughly where the lines are — but 51% land INSIDE a line,
   against a 55% chance baseline. The grid is 1.10x better than chance, which
   is to say barely. It lands JUST EARLY rather than just late: close to an
   edge, on the wrong side of it, cutting the poet off mid-word.

   WHAT THIS DOES. For every boundary inside a line, find the nearest moment
   the poet is not speaking and move it there, subject to three rules:

     the nudge is bounded          a boundary is corrected, not relocated
     patches keep a minimum length a cut is not worth a frame of picture
     the grid stays contiguous     t1 of a patch is t0 of the next, always,
                                   so one move fixes one seam and never
                                   leaves a hole or an overlap

   It prefers waiting to jumping: of two gaps equally far, the one AFTER the
   line wins, because a picture that arrives late reads as a response and a
   picture that arrives early reads as an interruption.

   THE NINE SEAMS THAT ARE NOT SEAMS. The grid is contiguous at 159 of its 168
   joins and gapped at nine, by 1 to 30 ms. All nine are film changes, and they
   are cineosis-lab's own: they are there before this script runs and identical
   after it. They are the residue of assembling fourteen containers into one
   record — 13 film changes, 9 of them carrying a sub-frame hole. This script
   does not close them and must not: a hole between two films is the join, and
   a measurement that silently repairs its input has destroyed the evidence.
   It skips them (the seam test below) and `checkGrid` proves it did.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);

const LAB = opt("lab", "/home/user/hartswf0/cineosis-lab");
const MAXNUDGE = +opt("max", 1.25);        // seconds a boundary may move
const MINPATCH = +opt("min", 2.0);         // seconds a patch must stay
const LATE_BIAS = +opt("bias", 0.35);      // how much later is preferred to earlier
const CUTS = opt("cut", "suite,scenes,cineosis,drift").split(",");
const OUT = path.join(ROOT, "renders", "cut", "snap");
fs.mkdirSync(OUT, { recursive: true });

const AL = JSON.parse(fs.readFileSync(path.join(ROOT, "wygwyl", "poem", "aligned.json"), "utf8"));
const LINES = Object.values(AL.films).flat().sort((a, b) => a[0] - b[0]);
if (!LINES.length) { console.error("no aligned lines"); process.exit(1); }
const lineAt = (t) => {
  let lo = 0, hi = LINES.length - 1, found = null;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (LINES[m][0] <= t) { found = LINES[m]; lo = m + 1; } else hi = m - 1; }
  return found && t < found[1] ? found : null;
};
const speaking = (t) => !!lineAt(t);

/* the nearest instant the poet is not speaking, with a thumb on the scale for
   arriving after rather than before */
function nearestGap(t) {
  const L = lineAt(t);
  if (!L) return t;
  const after = L[1] + 0.02;                       // just past the end of this line
  const prev = LINES.filter(x => x[1] <= L[0]).pop();
  const before = prev ? Math.max(prev[1] + 0.02, L[0] - 0.02) : L[0] - 0.02;
  const dA = after - t, dB = t - before;
  if (dA <= dB + LATE_BIAS) return after;
  return before;
}

/* THE GUARD. --write overwrites another project's edit data, so the only
   honest version of this script is one that can prove it changed nothing but
   the boundaries it reports. checkGrid returns the grid's shape: the patch
   ids, the total duration, and every join that is not contiguous. Snapping may
   change boundary VALUES and nothing else, so a diff of two of these is the
   whole proof. A new discontinuity, a lost patch or a changed duration fails
   the write. */
const SEAMTOL = 0.0005;
const checkGrid = (P) => ({
  ids: P.map(p => p.id).join(","),
  n: P.length,
  span: +(P[P.length - 1].t1 - P[0].t0).toFixed(3),
  breaks: P.slice(0, -1)
    .map((a, i) => [a.id, +a.t1.toFixed(4), +P[i + 1].t0.toFixed(4)])
    .filter(([, t1, t0]) => Math.abs(t0 - t1) > SEAMTOL)
    .map(x => x.join(">")).join(" "),
});

const report = [];
for (const cut of CUTS) {
  const file = path.join(LAB, "lab", "wygwyl", "cuts", cut, "patches.json");
  if (!fs.existsSync(file)) { console.log(`  ${cut}: no patches.json`); continue; }
  const P = JSON.parse(fs.readFileSync(file, "utf8"));
  P.sort((a, b) => a.t0 - b.t0);
  const shapeBefore = checkGrid(P);

  /* the boundaries are the seams BETWEEN patches; the first t0 and the last t1
     are the ends of the record and do not move */
  let moved = 0, blocked = 0, totalNudge = 0;
  const before = { inside: 0, n: 0 }, after = { inside: 0, n: 0 };
  const moves = [];
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1];
    if (Math.abs(a.t1 - b.t0) > 0.001) continue;    // not a shared seam
    const t = a.t1;
    before.n++; if (speaking(t)) before.inside++;
    if (!speaking(t)) { after.n++; continue; }
    const want = nearestGap(t);
    const d = want - t;
    const ok = Math.abs(d) <= MAXNUDGE
      && (want - a.t0) >= MINPATCH && (b.t1 - want) >= MINPATCH;
    if (ok) {
      a.t1 = +want.toFixed(3); b.t0 = +want.toFixed(3);
      moved++; totalNudge += Math.abs(d);
      moves.push({ at: +t.toFixed(3), to: +want.toFixed(3), by: +d.toFixed(3), patch: a.id });
    } else blocked++;
    after.n++; if (speaking(P[i].t1)) after.inside++;
  }
  const pct = (x, n) => (n ? (x / n * 100).toFixed(0) : "0") + "%";
  console.log(`${cut.padEnd(9)} seams ${String(before.n).padStart(3)} · inside a line `
    + `${String(before.inside).padStart(3)} (${pct(before.inside, before.n)}) → `
    + `${String(after.inside).padStart(3)} (${pct(after.inside, after.n)}) · `
    + `moved ${moved}, blocked ${blocked}, mean nudge ${(moved ? totalNudge / moved : 0).toFixed(2)}s`);
  /* did anything but the boundary values move? */
  const shapeAfter = checkGrid(P);
  const faults = [];
  if (shapeAfter.ids !== shapeBefore.ids) faults.push("patch ids changed");
  if (shapeAfter.span !== shapeBefore.span) faults.push(`span ${shapeBefore.span} → ${shapeAfter.span}`);
  if (shapeAfter.breaks !== shapeBefore.breaks) faults.push("new discontinuity");
  const nBreaks = shapeBefore.breaks ? shapeBefore.breaks.split(" ").length : 0;
  console.log(`          ${nBreaks} pre-existing film-join gap${nBreaks === 1 ? "" : "s"} left alone`
    + ` · grid ${faults.length ? "FAILED: " + faults.join("; ") : "intact"}`);

  const outFile = path.join(OUT, `${cut}.patches.snapped.json`);
  fs.writeFileSync(outFile, JSON.stringify(P, null, 1));
  fs.writeFileSync(path.join(OUT, `${cut}.moves.json`), JSON.stringify(moves, null, 1));
  report.push({ cut, seams: before.n, before: before.inside, after: after.inside, moved, blocked,
    meanNudge: +(moved ? totalNudge / moved : 0).toFixed(3),
    preExistingGaps: nBreaks, gridIntact: !faults.length });
  if (has("write")) {
    /* refuse rather than warn. a warning next to a completed write is not a
       guard, it is an apology. */
    if (faults.length) { console.error(`           → REFUSED to write ${cut}: ${faults.join("; ")}`); process.exitCode = 1; }
    else { fs.copyFileSync(outFile, file); console.log(`           → wrote ${path.relative(LAB, file)}`); }
  }
}
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({
  maxNudge: MAXNUDGE, minPatch: MINPATCH, lateBias: LATE_BIAS,
  lines: LINES.length, speechSeconds: +LINES.reduce((a, [x, y]) => a + (y - x), 0).toFixed(1),
  cuts: report,
}, null, 1));
console.log(`\n→ renders/cut/snap/  (snapped patches, the move list, and the report)`);
console.log(`   --write copies them over cineosis-lab's own patches.json`);
