#!/usr/bin/env node
/* ============================================================================
   measure-lines.mjs — WHERE, EXACTLY, DOES EACH LINE START?

   THE PROBLEM THIS EXISTS TO FIX.

   audio/scene-takes.json carries a measured duration for every take, and inside
   each take it carries per-line t0/dur marked `"apportioned": true`. That flag
   is honest about what it is: the take's measured length divided among its
   lines in proportion to their WORD COUNTS. It was good enough for a film in
   which the picture is a loop and the voice is laid underneath it, because
   nothing on screen had to agree with any particular line.

   A close-up cannot use it. If the cut goes to Niko's face while Mara is still
   finishing her sentence, the film is not merely imprecise — it is wrong in the
   one way an audience detects instantly and cannot un-see. And a lip-sync built
   on an estimated boundary is worse than no lip-sync at all: it moves a mouth
   with conviction at a moment when that mouth is not the one making the sound.

   So before any face is drawn, the boundaries get MEASURED.

   ---------------------------------------------------------------------------
   THE METHOD.

   A take with N lines needs N-1 interior boundaries. Speech leaves them lying
   around: the reader pauses between sentences, and between speakers the pause
   is longer still. So:

     1. RMS envelope of the take at 100 Hz (10 ms hops).
     2. Noise floor from the 10th percentile; speech level from the 75th.
        Threshold sits low between them — this is finding SILENCE, not peaks,
        and a threshold set too high chops the quiet ends off real words.
     3. Every silence run >= MIN_GAP becomes a candidate boundary at its centre.
     4. Choose N-1 candidates, in order, by dynamic programming: cost is
        distance from the apportioned prior (which is a decent guess, just not
        a measurement) minus a bonus for a long gap. The prior supplies the
        ordering and rough position; the audio supplies the exact frame.

   If a take offers fewer than N-1 usable gaps, it KEEPS the apportioned values
   and is flagged `measured:false`. A run of two sentences with no breath
   between them is not a failure of this tool; it is a fact about the take, and
   the close-up builder is told about it so it can decline to cut there.

   ---------------------------------------------------------------------------
   THE INSTRUMENT.

   The report prints, per take, how far each boundary MOVED from where the word
   count guessed it would be. That number is the whole justification for this
   file: if every boundary moved by 20 ms, the apportioning was already fine and
   this was wasted work. Run it and read the displacement before believing any
   of it.

     node harness/measure-lines.mjs             measure, write, report
     node harness/measure-lines.mjs --dry       report only, write nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TAKES = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "scene-takes.json"), "utf8"));
const DRY = process.argv.includes("--dry");

const HOP = 0.010;          // 10 ms envelope hop
const MIN_GAP = 0.100;      // a pause shorter than this is inside a word
const EDGE_GUARD = 0.120;   // no boundary this close to either end of the take

/* ---- wav ---------------------------------------------------------------
   Parse the chunk table rather than assuming a 44-byte header. Every file in
   audio/scenes/ is in fact 44-byte mono PCM16 @24k, but a reader that assumes
   it will one day silently decode a LIST chunk as audio. */
export function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE")
    throw new Error(`not a RIFF/WAVE file: ${file}`);
  let off = 12, fmt = null, data = null;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { channels: b.readUInt16LE(off + 10), rate: b.readUInt32LE(off + 12),
                               bits: b.readUInt16LE(off + 22) };
    if (id === "data") data = b.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error(`no fmt/data chunk: ${file}`);
  if (fmt.bits !== 16) throw new Error(`only PCM16 supported, got ${fmt.bits}: ${file}`);
  const n = Math.floor(data.length / 2 / fmt.channels);
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = data.readInt16LE(i * 2 * fmt.channels) / 32768;
  return { pcm: a, rate: fmt.rate, seconds: n / fmt.rate };
}

/* ---- envelope ----------------------------------------------------------
   RMS per hop. Returned in dB-ish linear form (plain RMS); the thresholds are
   percentile-derived so the scale never has to be calibrated. */
export function envelope(pcm, rate, hop = HOP) {
  const win = Math.max(1, Math.round(rate * hop));
  const n = Math.floor(pcm.length / win);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * win; j < (i + 1) * win; j++) s += pcm[j] * pcm[j];
    e[i] = Math.sqrt(s / win);
  }
  return e;
}
const pct = (arr, p) => { const s = Float32Array.from(arr).sort(); return s[Math.min(s.length - 1,
  Math.max(0, Math.round(p * (s.length - 1))))]; };

/* ---- candidate boundaries ---------------------------------------------- */
function gaps(env, hop, total) {
  const floor = pct(env, 0.10), loud = pct(env, 0.75);
  // low, on purpose: we are locating SILENCE. A high threshold trims the quiet
  // tail off real words and reports a gap where there is only a soft syllable.
  const thr = floor + 0.14 * Math.max(1e-6, loud - floor);
  const out = [];
  let run = -1;
  for (let i = 0; i <= env.length; i++) {
    const quiet = i < env.length && env[i] < thr;
    if (quiet && run < 0) run = i;
    if (!quiet && run >= 0) {
      const t0 = run * hop, t1 = i * hop;
      if (t1 - t0 >= MIN_GAP && t0 > EDGE_GUARD && t1 < total - EDGE_GUARD)
        out.push({ t0, t1, mid: (t0 + t1) / 2, len: t1 - t0 });
      run = -1;
    }
  }
  return out;
}

/* ---- assignment --------------------------------------------------------
   Pick K = N-1 candidates, in time order, one per prior boundary. Cost is
   displacement from the prior in seconds, less a bonus that prefers a long
   pause when two candidates are equally close — a long pause is much more
   likely to be a speaker change than a comma. */
function assign(cands, priors) {
  const K = priors.length, M = cands.length;
  if (K === 0) return [];
  if (M < K) return null;
  const cost = (i, j) => Math.abs(cands[j].mid - priors[i]) - Math.min(0.45, cands[j].len) * 0.55;
  const D = Array.from({ length: K }, () => new Float64Array(M).fill(Infinity));
  const B = Array.from({ length: K }, () => new Int32Array(M).fill(-1));
  for (let j = 0; j < M; j++) D[0][j] = cost(0, j);
  for (let i = 1; i < K; i++)
    for (let j = i; j < M; j++) {
      let best = Infinity, bk = -1;
      for (let k = i - 1; k < j; k++) if (D[i - 1][k] < best) { best = D[i - 1][k]; bk = k; }
      D[i][j] = best + cost(i, j); B[i][j] = bk;
    }
  let j = -1, best = Infinity;
  for (let m = K - 1; m < M; m++) if (D[K - 1][m] < best) { best = D[K - 1][m]; j = m; }
  const pick = new Array(K);
  for (let i = K - 1; i >= 0; i--) { pick[i] = cands[j]; j = B[i][j]; }
  return pick;
}

/* ---- run ----------------------------------------------------------------
   Guarded. build-closeups.mjs imports readWav/envelope from this file, and an
   unguarded module body would silently re-measure and rewrite line-timing.json
   as a side effect of an import — the kind of action-at-a-distance that makes
   a build reproducible only by accident. */
const INVOKED_DIRECTLY = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (!INVOKED_DIRECTLY) { /* imported for readWav/envelope only */ } else {

const out = [];
let nMeasured = 0, nFallback = 0;
const moves = [];

console.log("MEASURING LINE BOUNDARIES FROM THE WAVEFORM\n");
for (const take of TAKES.takes) {
  const f = path.join(ROOT, take.file);
  if (!fs.existsSync(f)) { console.log(`  ${take.id}  MISSING WAV — kept apportioned`); nFallback++;
    out.push({ ...take, measured: false, reason: "wav missing" }); continue; }
  const { pcm, rate, seconds } = readWav(f);
  const env = envelope(pcm, rate);
  const cands = gaps(env, HOP, seconds);
  const priors = take.lines.slice(1).map((l) => l.t0);
  const picked = priors.length ? assign(cands, priors) : [];

  if (picked === null) {
    console.log(`  ${take.id}  ${take.lines.length} lines, only ${cands.length} pauses — kept apportioned`);
    nFallback++;
    out.push({ ...take, measured: false, reason: `${cands.length} pauses for ${priors.length} boundaries` });
    continue;
  }
  const bounds = [0, ...picked.map((c) => c.mid), seconds];
  const lines = take.lines.map((l, i) => ({
    ...l, t0: +bounds[i].toFixed(4), dur: +(bounds[i + 1] - bounds[i]).toFixed(4),
    apportioned: false, measured: true,
    // the gap AFTER this line: the close-up builder uses it to decide whether
    // a cut between two speakers has room to land
    gapAfter: i < picked.length ? +picked[i].len.toFixed(4) : 0,
  }));
  const disp = picked.map((c, i) => Math.abs(c.mid - priors[i]));
  moves.push(...disp);
  nMeasured++;
  out.push({ ...take, measured: true, lines });
  const who = [...new Set(take.lines.map((l) => l.who))].join("|");
  console.log(`  ${take.id.padEnd(12)} ${String(take.lines.length).padStart(2)} lines  ${who.padEnd(22)}` +
    ` ${cands.length} pauses  moved ` +
    disp.map((d) => `${d >= 0.5 ? "**" : ""}${d.toFixed(2)}s`).join(" "));
}

/* ---- the instrument ----------------------------------------------------- */
moves.sort((a, b) => a - b);
const med = moves.length ? moves[Math.floor(moves.length / 2)] : 0;
const p90 = moves.length ? moves[Math.floor(moves.length * 0.9)] : 0;
const big = moves.filter((m) => m >= 0.5).length;
console.log(`\n  ${nMeasured} takes measured · ${nFallback} kept apportioned`);
console.log(`  ${moves.length} boundaries relocated · median ${med.toFixed(3)}s · p90 ${p90.toFixed(3)}s` +
  ` · max ${(moves[moves.length - 1] || 0).toFixed(3)}s`);
console.log(`  ${big} boundaries moved by half a second or more`);
console.log(big === 0
  ? `  ** the word-count apportioning was already right. This file bought nothing.`
  : `  those ${big} are the ones that would have cut to the wrong face.`);

if (!DRY) {
  const p = path.join(ROOT, "audio", "line-timing.json");
  fs.writeFileSync(p, JSON.stringify({
    built: new Date().toISOString(),
    method: "rms envelope 100Hz -> silence runs >=100ms -> DP assignment against word-count prior",
    hop: HOP, minGap: MIN_GAP,
    measuredTakes: nMeasured, fallbackTakes: nFallback,
    displacement: { median: +med.toFixed(4), p90: +p90.toFixed(4), overHalfSecond: big },
    takes: out,
  }, null, 1));
  console.log(`\n  wrote audio/line-timing.json`);
}

}
