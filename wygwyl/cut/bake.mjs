#!/usr/bin/env node
/* ============================================================================
   bake.mjs — turn the analyses into one file the cut book can fetch.

     node wygwyl/cut/bake.mjs

   `renders/cut/` is a working directory and is gitignored, which is correct —
   the maps and the full sheets are outputs. But the CUT BOOK has to work for
   anyone who clones this, so the part it needs is baked into `data/book.json`:
   the numbers, the cut list, a 192x48 spectrum and a 192-point envelope per
   song, about six kilobytes each. One fetch, no build step, no server beyond a
   static one.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const SRC = path.join(ROOT, "renders", "cut");
const OUT = path.join(HERE, "data");
fs.mkdirSync(OUT, { recursive: true });

/* where each set's audio actually lives, relative to the cut book */
const SETS = {
  transmission: { dir: "../transmission", note: "whole readings over disintegrating tape loops" },
  onecut: { dir: "../onecut", note: "one take — her reading is the spine, the song carries the strong lines" },
};
/* titles, where the set already carries them */
const titles = (() => {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, "wygwyl", "onecut", "onecut.json"), "utf8"));
    return Object.fromEntries((j.cuts || []).map(c => [c.num, c.title]));
  } catch (_) { return {}; }
})();

const book = { built: new Date().toISOString().slice(0, 10), sets: [] };
for (const [name, meta] of Object.entries(SETS)) {
  const dir = path.join(SRC, name);
  if (!fs.existsSync(dir)) { console.log(`skip ${name} — not analysed yet`); continue; }
  const songs = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".analysis.json")).sort()) {
    const a = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const n = a.file.replace(/\.[^.]+$/, "");
    songs.push({
      n, title: titles[n] || null, audio: `${meta.dir}/${a.file}`,
      seconds: a.seconds, lufs: a.loudness.lufs, lra: a.loudness.lra,
      bpm: a.bpm, conf: a.tempo_confidence, period: a.beat_period, phase: a.beat_phase,
      pulse: a.pulse_band, balance: a.band_balance,
      onsets_per_min: a.onsets_per_min, rest_seconds: a.rest_seconds,
      sections: a.sections, rests: a.rests,
      /* only what an editor would actually consider */
      cuts: a.cuts.filter(c => c.kill <= 0.35),
      spectrum: a.spectrum, envelope: a.envelope,
    });
  }
  if (songs.length) book.sets.push({ name, note: meta.note, songs });
  console.log(`${name}: ${songs.length} songs`);
}
const file = path.join(OUT, "book.json");
fs.writeFileSync(file, JSON.stringify(book));
console.log(`→ wygwyl/cut/data/book.json  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
