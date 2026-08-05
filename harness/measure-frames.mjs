#!/usr/bin/env node
/* ============================================================================
   measure-frames.mjs — IS THERE ANYTHING IN THIS SHOT?

   "many of the frames are bad and crowded, can't read." Both halves of that
   sentence are true and they are opposite faults, which is why looking at a
   contact sheet and squinting was never going to sort them out. So: measure.

   Two numbers per scene, off the rendered webm, and each answers a different
   complaint.

   ---------------------------------------------------------------------------
   1. FILL — what fraction of the frame the subject actually occupies.

   Computed as the bounding box of everything darker than paper, ignoring the
   sparse background lattice, expressed as a share of the frame. A shot whose
   ink occupies a fifth of the frame is not composed, it is a thing floating in
   a field, and the eye has no idea what it is being shown. BF-19 is twelve
   seconds of an object at 8% fill; BF-13 is THIRTY-THREE SECONDS, the longest
   scene in the film, of a handset in an empty rectangle.

   The fix for a low fill is a push-in, and every scene already has the dial —
   `ZOOM` in its framing block, which lens() folds into the station scale. This
   file does not change anything; it says which ones to change and by how much.

   2. SPREAD — how many distinct ink levels the frame actually uses.

   The dot law gives eight levels. A frame that puts 90% of its ink into ONE of
   them has no value hierarchy, and with no hierarchy every object competes
   equally for attention — which is exactly what "crowded, can't read" is. It
   is not that there is too much in BF-16; it is that the brick, the stairs and
   the tiles are all the same grey, so there is no way to look at one of them.

   A low spread is not fixed by pushing in. It is fixed by moving a plane.

   ---------------------------------------------------------------------------
   THE THRESHOLDS ARE STATED, NOT DISCOVERED. fill < 0.34 and spread < 2.6 are
   my numbers, chosen by looking at which scenes they flag and agreeing with the
   flags. They are here so the judgement is visible and arguable rather than
   buried in an eye.

     node harness/measure-frames.mjs           report every scene
     node harness/measure-frames.mjs --bad     only the ones that fail
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CUT = JSON.parse(fs.readFileSync(path.join(ROOT, "film", "cut.json"), "utf8"));
const BAD_ONLY = process.argv.includes("--bad");
const FF = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"].find((p) => fs.existsSync(p));
const TMP = path.join(ROOT, "film", ".measure");
fs.mkdirSync(TMP, { recursive: true });

const COVER_MIN = 0.070;    // below this there is not enough ink to look at
const FILL_MIN = 0.34;      // below this the subject is floating in a field
const SPREAD_MIN = 2.6;     // below this there is no value hierarchy

/* PASS 3. Measuring ONE frame reported BF-37 as blank — 0.0% ink — and it is
   one of the best shots in the film. The sample happened to land inside an
   authored WHITEOUT: the animal strikes the lid, the frame blows out for three
   frames, and the picture returns over the next four as an ordered per-dot
   swap. A single sample cannot tell that from a scene that draws nothing.

   So every scene is decoded WHOLE and reported at its MEDIAN frame. A median
   is immune to an authored extreme in either direction — a whiteout, a BREAK,
   the dark frame at the bottom of a cycle — and those are exactly the moments
   this world builds on purpose. The blank-frame count is still reported,
   because three blank frames is worth knowing about either way; it is just no
   longer allowed to be the whole verdict. */
function measure(file) {
  const raw = path.join(TMP, "f.gray");
  try {
    execFileSync(FF, ["-y", "-v", "error", "-i", file,
      "-vf", "scale=280:190", "-pix_fmt", "gray", "-f", "rawvideo", raw]);
  } catch { return null; }
  const all = fs.readFileSync(raw), W = 280, H = 190, FR = W * H;
  const nFrames = Math.floor(all.length / FR);
  if (!nFrames) return null;
  const per = [];
  for (let f = 0; f < nFrames; f++) {
    let k = 0;
    for (let i = f * FR; i < (f + 1) * FR; i++) if (all[i] < 200) k++;
    per.push({ f, cover: k / FR });
  }
  const blanks = per.filter((p) => p.cover < 0.005).length;
  const mid = per.slice().sort((a, b) => a.cover - b.cover)[nFrames >> 1];
  const b = all.subarray(mid.f * FR, (mid.f + 1) * FR);
  /* The background lattice is a faint dot every cell; counting it as ink would
     make every frame 100% full. 210 sits below the paper and the lattice and
     above nothing that matters. */
  const INKY = 200;
  let x0 = W, x1 = -1, y0 = H, y1 = -1, n = 0;
  const hist = new Array(8).fill(0);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = b[y * W + x];
    if (v >= INKY) continue;
    n++;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
    hist[Math.min(7, Math.floor((255 - v) / 32))]++;
  }
  if (n === 0) return { fill: 0, spread: 0, cover: 0, box: [0, 0, 0, 0] };
  const fill = ((x1 - x0) * (y1 - y0)) / (W * H);
  /* spread: the effective number of ink levels in use — 2^entropy, so one
     level gives 1.0 and eight equally used levels give 8.0. A count of
     distinct levels would score a frame that puts 0.1% into each of six of
     them as "six", which is not what the eye sees. */
  let ent = 0;
  for (const c of hist) if (c > 0) { const p = c / n; ent -= p * Math.log2(p); }
  return { fill, spread: Math.pow(2, ent), cover: n / (W * H), blanks, frames: nFrames,
           box: [x0 / W, y0 / H, x1 / W, y1 / H] };
}

/* PASS 4. The report billed BF-13 seventeen empty seconds AFTER it had been
   intercut down to three pieces, none longer than 10.5s, because it was reading
   scene durations from cut.json — how long the scene IS — rather than how long
   it is actually on screen. Those stopped being the same number the moment the
   assembler learned to cut away. An instrument that does not know about the
   edit will keep charging for a shot the edit already fixed. */
const CLOSE_CUT = path.join(ROOT, "film", "close-cut.json");
const onScreen = {};
if (fs.existsSync(CLOSE_CUT)) {
  for (const seg of JSON.parse(fs.readFileSync(CLOSE_CUT, "utf8")).segments) {
    const id = (seg.label.split(" · ")[0] || "").trim();
    if (/^BF-\d+$/.test(id)) onScreen[id] = (onScreen[id] || 0) + seg.seconds;
  }
}
const rows = [];
for (const sc of CUT.scenes) {
  if (!/^BF-/.test(sc.id)) continue;
  const f = path.join(ROOT, "renders", "motion", `${sc.id}.webm`);
  if (!fs.existsSync(f)) continue;
  const m = measure(f);
  if (!m) continue;
  rows.push({ id: sc.id, dur: onScreen[sc.id] ?? sc.duration,
              held: onScreen[sc.id] != null && onScreen[sc.id] < sc.duration - 0.05, ...m });
}

const bad = rows.filter((r) => r.cover < COVER_MIN || r.spread < SPREAD_MIN || r.fill < FILL_MIN);
console.log(`FRAMES — ${rows.length} scenes measured\n`);
console.log(`  ${"".padEnd(7)}${"dur".padStart(6)}${"fill".padStart(7)}${"spread".padStart(8)}${"ink%".padStart(7)}   verdict`);
for (const r of rows.sort((a, b) => a.cover - b.cover)) {
  /* PASS 2. Ranking on the bounding box alone was wrong, and wrong in the way
     that let the film's single emptiest shot pass: one horizon line spanning
     the frame gives BF-13 a fill of 0.70 while its actual ink coverage is
     THREE PER CENT, held for thirty-three seconds. A bounding box measures
     where the ink reaches. Coverage measures whether there is any. */
  const lowCover = r.cover < COVER_MIN, lowSpread = r.spread < SPREAD_MIN;
  const lowFill = r.fill < FILL_MIN;
  if (BAD_ONLY && !lowCover && !lowSpread && !lowFill) continue;
  const v = r.cover < 0.005 ? "** BLANK — nothing is being drawn"
    : lowCover && lowFill ? "an object in a void — push in hard"
    : lowCover ? "too little ink to look at — push in"
    : lowSpread ? "no value hierarchy — everything competes"
    : "";
  console.log(`  ${r.id.padEnd(7)}${r.dur.toFixed(1).padStart(6)}${r.fill.toFixed(2).padStart(7)}` +
    `${r.spread.toFixed(2).padStart(8)}${(r.cover * 100).toFixed(1).padStart(7)}   ${v}` +
    (r.held ? "   [intercut]" : "") +
    (r.blanks ? `   [${r.blanks}/${r.frames} frames blank — authored?]` : ""));
}
/* the number that ranks the work: an empty frame held for 33 seconds is worse
   than an empty frame held for three, and no per-frame metric knows that. */
const cost = rows.map((r) => ({ ...r, cost: r.dur * (1 - Math.min(1, r.cover / COVER_MIN)) }))
  .filter((r) => r.cost > 0).sort((a, b) => b.cost - a.cost);
console.log(`\n  ${bad.length} of ${rows.length} scenes fail (cover < ${COVER_MIN}, spread < ${SPREAD_MIN} or fill < ${FILL_MIN})`);
console.log(`\n  WORST BY ACTUAL SCREEN-TIME in the speaking cut, which is the order to fix them in:`);
for (const r of cost.slice(0, 8))
  console.log(`      ${r.id}  ${r.dur.toFixed(1)}s at fill ${r.fill.toFixed(2)}  →  ${r.cost.toFixed(1)} empty-seconds`);
fs.rmSync(TMP, { recursive: true, force: true });
