#!/usr/bin/env node
/* ============================================================================
   score.mjs — DID THE GENERATION DO WHAT THE PROMPT ASKED?

     node wygwyl/see/score.mjs <manifest.json> <masks-dir>

   The prose prompt goes to the generator; its noun phrases go to the segmenter;
   this compares what was promised against what was found. See PROTOCOL.md.

   The verdict has four values and only the fourth is unusual:

     OBEYED      every promised noun present, persistent, in band, none forbidden
     PARTIAL     present but thin — flickering, wrong count, or out of band
     DISOBEYED   a promised noun missing, or a forbidden one found
     AMBIGUOUS   two different nouns claiming substantially the same pixels

   AMBIGUOUS is not a failure and must not be collapsed into one. It is the
   `bird` case: a wrong noun was seeded on a falling man and locked on, because
   arms-out and cruciform is genuinely both. The generator did not disobey — it
   made an image that supports two readings, and that is worth being told about
   rather than re-rolled. A loop that reports it finds the best frame in the
   film on purpose instead of by luck.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";

const [manifestPath, dir] = process.argv.slice(2);
if (!manifestPath || !dir) {
  console.error("usage: node wygwyl/see/score.mjs <manifest.json> <masks-dir>");
  process.exit(1);
}
const M = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const W = M.w || 192, H = M.h || 144, CELLS = W * H;

/* a noun's masks: <shot>.<noun>.<instance>.u8, frames x H x W of 0/1 */
function load(shot, noun) {
  const out = [];
  for (let i = 0; ; i++) {
    const f = path.join(dir, `${shot}.${noun}.${i}.u8`);
    if (!fs.existsSync(f)) break;
    const b = fs.readFileSync(f);
    const frames = Math.max(1, Math.round(b.length / CELLS));
    out.push({ instance: i, frames, buf: b });
  }
  return out;
}
const per = (inst, k) => inst.buf.subarray(k * CELLS, (k + 1) * CELLS);
function stat(m) {
  let n = 0, sx = 0, sy = 0;
  for (let i = 0; i < CELLS; i++) if (m[i]) { n++; sx += i % W; sy += (i / W) | 0; }
  return n ? { n, cx: sx / n, cy: sy / n } : null;
}
/* longest unbroken run of true, as a fraction — a thing that flickers in and
   out of a shot was never really in it, and mean presence hides that */
function longestRun(flags) {
  let best = 0, run = 0;
  for (const f of flags) { run = f ? run + 1 : 0; if (run > best) best = run; }
  return flags.length ? best / flags.length : 0;
}

console.log(`SEE · ${M.shots.length} shot(s) · masks from ${dir}\n`);
const cards = [];
for (const shot of M.shots) {
  const expect = shot.expect || [];
  const rows = [], claims = [];
  for (const e of expect) {
    const inst = load(shot.id, e.noun);
    const nF = inst.length ? inst[0].frames : (shot.frames || 1);
    const present = [], areas = [], drifts = [];
    let last = null;
    for (let k = 0; k < nF; k++) {
      let n = 0, cx = 0, cy = 0, hits = 0;
      const union = new Uint8Array(CELLS);
      for (const I of inst) {
        const s = stat(per(I, Math.min(k, I.frames - 1)));
        if (!s) continue;
        hits++; n += s.n; cx += s.cx * s.n; cy += s.cy * s.n;
        const m = per(I, Math.min(k, I.frames - 1));
        for (let i = 0; i < CELLS; i++) if (m[i]) union[i] = 1;
      }
      present.push(hits > 0);
      areas.push(n / CELLS);
      if (hits) {
        const c = [cx / n, cy / n];
        if (last) drifts.push(Math.hypot(c[0] - last[0], c[1] - last[1]));
        last = c;
      } else last = null;
      if (hits) claims.push({ noun: e.noun, frame: k, union });
    }
    const presence = present.filter(Boolean).length / Math.max(1, nF);
    const persistence = longestRun(present);
    const band = e.area
      ? areas.filter((a, k) => present[k] && a >= e.area[0] && a <= e.area[1]).length /
        Math.max(1, present.filter(Boolean).length)
      : 1;
    rows.push({
      noun: e.noun, want: e.count ?? null, found: inst.length,
      presence, persistence, band,
      drift: drifts.length ? drifts.reduce((a, c) => a + c, 0) / drifts.length : 0,
      forbidden: e.count === 0 && inst.length > 0,
      missing: (e.count ?? 1) > 0 && presence === 0,
    });
  }
  /* AMBIGUOUS: two different nouns claiming substantially the same pixels */
  let ambiguous = null;
  for (let a = 0; a < claims.length && !ambiguous; a++)
    for (let b = a + 1; b < claims.length; b++) {
      const A = claims[a], B = claims[b];
      if (A.noun === B.noun || A.frame !== B.frame) continue;
      let inter = 0, uni = 0;
      for (let i = 0; i < CELLS; i++) {
        const p = A.union[i], q = B.union[i];
        if (p || q) uni++; if (p && q) inter++;
      }
      if (uni && inter / uni > 0.6) { ambiguous = { a: A.noun, b: B.noun, iou: inter / uni, frame: A.frame }; break; }
    }

  const verdict = rows.some(r => r.forbidden || r.missing) ? "DISOBEYED"
    : ambiguous ? "AMBIGUOUS"
    : rows.every(r => r.persistence >= 0.8 && r.band >= 0.8 && (r.want === null || r.found === r.want)) ? "OBEYED"
    : "PARTIAL";

  console.log(`${shot.id}  ${verdict}${ambiguous ? `  (${ambiguous.a} ≈ ${ambiguous.b}, IoU ${ambiguous.iou.toFixed(2)} at f${ambiguous.frame})` : ""}`);
  for (const r of rows) {
    const note = r.forbidden ? "  <<< FORBIDDEN, FOUND" : r.missing ? "  <<< PROMISED, ABSENT" : "";
    console.log(`   ${r.noun.padEnd(12)} want ${String(r.want ?? "-").padStart(2)} found ${String(r.found).padStart(2)}`
      + `  present ${(r.presence * 100).toFixed(0).padStart(3)}%  persist ${(r.persistence * 100).toFixed(0).padStart(3)}%`
      + `  in-band ${(r.band * 100).toFixed(0).padStart(3)}%  drift ${r.drift.toFixed(2)}${note}`);
  }
  cards.push({ shot: shot.id, verdict, ambiguous, rows });
}
const tally = cards.reduce((a, c) => (a[c.verdict] = (a[c.verdict] || 0) + 1, a), {});
console.log(`\n${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
fs.writeFileSync(path.join(dir, "compliance.json"), JSON.stringify(cards, null, 1));
console.log(`→ ${path.join(dir, "compliance.json")}`);
