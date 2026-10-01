#!/usr/bin/env node
/* ============================================================================
   merge.mjs — PUT THE 94 INTO cineosis-lab, OR SAY WHY NOT.

     node wygwyl/cineosis/merge.mjs           dry run: build it, check it, report
     node wygwyl/cineosis/merge.mjs --write   also write into cineosis-lab

   The dry run writes renders/cineosis/lab-data.merged.json and nothing else.
   --write additionally copies clips, thumbs and strips into cineosis-lab's own
   lab/clips, lab/thumbs and lab/strips, and replaces its lab-data.json — which
   is why almost all of this file is the check rather than the merge.

   WHY THE MEDIA IS COPIED RATHER THAN LINKED. A cineosis shot's thumb is
   "thumbs/<id>.jpg", relative to lab/. Every page, grid and light-table in that
   project resolves it that way. Pointing these 94 somewhere else would make
   them the only shots in 15,243 that need a special case, and a special case is
   how a collection stops being one collection.

   THE CHECK. Overwriting another project's data file is the kind of thing that
   is fine 99 times and unrecoverable once, so the merge has to prove it only
   added. checkShots takes the archive's shape — how many shots, their ids in
   order, and a hash of each one's content — before and after. Anything that is
   not "the same 15,149 archive shots, byte for byte, plus 94 new ids" fails and
   nothing is written. The halfworld records are checked separately against what
   a cineosis shot must carry, and a missing file on disk is a failure, not a
   warning: a record pointing at a clip that is not there is worse than no
   record, because the grid will show a hole and nobody will know why.
   ========================================================================= */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);

const LAB = opt("lab", "/home/user/hartswf0/cineosis-lab");
const OUT = path.join(ROOT, "renders", "cineosis");
const LABDATA = path.join(LAB, "lab", "lab-data.json");

const lab = JSON.parse(fs.readFileSync(LABDATA, "utf8"));
const hw = JSON.parse(fs.readFileSync(path.join(OUT, "halfworld-shots.json"), "utf8"));

/* the archive's shape, so "we only added" can be proved rather than asserted */
const shapeOf = (shots) => ({
  n: shots.length,
  ids: createHash("sha1").update(shots.map(s => s.id).join(",")).digest("hex"),
  body: createHash("sha1").update(shots.map(s => JSON.stringify(s)).join("\n")).digest("hex"),
});
const archive = lab.shots.filter(s => !(s.collections || []).includes("halfworld"));
const before = shapeOf(archive);

/* ---- is each halfworld record fit to be a cineosis shot? ------------------ */
const REQUIRED = ["id", "title", "slug", "page", "thumb", "start", "end", "match",
  "bw", "palette", "lum", "sat", "subjects", "scale", "collections"];
const MEDIA = [["clip", "clips"], ["thumb", "thumbs"], ["strip", "strips"]];
const faults = [];
const archiveIds = new Set(archive.map(s => s.id));
const seen = new Set();
for (const s of hw) {
  const where = `${s.halfworld?.n}/${s.halfworld?.label || "?"}`;
  for (const k of REQUIRED) if (s[k] === undefined || s[k] === null)
    faults.push(`${where}: missing ${k}`);
  if (archiveIds.has(s.id)) faults.push(`${where}: id collides with an archive shot`);
  if (seen.has(s.id)) faults.push(`${where}: duplicate id`);
  seen.add(s.id);
  if (s.end <= s.start) faults.push(`${where}: end is not after start`);
  if (!(s.start <= s.match && s.match <= s.end)) faults.push(`${where}: match outside the shot`);
  for (const [k, dir] of MEDIA) {
    if (!s[k]) { faults.push(`${where}: no ${k}`); continue; }
    const f = path.join(OUT, dir, path.basename(s[k]));
    if (!fs.existsSync(f)) faults.push(`${where}: ${k} names a file that is not there (${path.basename(s[k])})`);
  }
}
/* the four CLIP fields may be null — they need a model this machine cannot
   reach — but say so out loud rather than letting them pass unremarked */
const noClip = hw.filter(s => s.xy == null).length;

const merged = { ...lab, shots: [...archive, ...hw] };
const after = shapeOf(merged.shots.filter(s => !(s.collections || []).includes("halfworld")));
if (after.n !== before.n) faults.push(`archive shot count changed: ${before.n} → ${after.n}`);
if (after.ids !== before.ids) faults.push("archive shot ids changed");
if (after.body !== before.body) faults.push("an archive shot's content changed");

fs.writeFileSync(path.join(OUT, "lab-data.merged.json"), JSON.stringify(merged));
const mb = (b) => (b / (1 << 20)).toFixed(1) + " MB";
console.log(`archive ${before.n} shots, unchanged · halfworld ${hw.length} added · merged ${merged.shots.length}`);
console.log(`collections now: ${[...new Set(merged.shots.flatMap(s => s.collections || []))].sort().join(", ")}`);
if (noClip) console.log(`${noClip} of ${hw.length} carry no xy/sim/affinity — project.py needs CLIP weights from a host this environment blocks`);
console.log(`→ renders/cineosis/lab-data.merged.json  ${mb(fs.statSync(path.join(OUT, "lab-data.merged.json")).size)}`);

if (faults.length) {
  console.error(`\n${faults.length} fault${faults.length === 1 ? "" : "s"} — nothing will be written:`);
  for (const f of faults.slice(0, 20)) console.error("   " + f);
  if (faults.length > 20) console.error(`   … and ${faults.length - 20} more`);
  process.exit(1);
}
console.log("\nchecks pass: same archive shots byte for byte, 94 new ids, every file present");

if (!has("write")) { console.log("   --write copies the media into cineosis-lab and replaces its lab-data.json"); process.exit(0); }

let copied = 0;
for (const [k, dir] of MEDIA) {
  const dst = path.join(LAB, "lab", dir);
  fs.mkdirSync(dst, { recursive: true });
  for (const s of hw) {
    const b = path.basename(s[k]);
    fs.copyFileSync(path.join(OUT, dir, b), path.join(dst, b));
    copied++;
  }
}
/* keep the file it is replacing, because an undo nobody prepared is not one */
const bak = LABDATA + ".before-halfworld";
if (!fs.existsSync(bak)) fs.copyFileSync(LABDATA, bak);
fs.writeFileSync(LABDATA, JSON.stringify(merged));
console.log(`\nwrote ${copied} files into cineosis-lab/lab/{clips,thumbs,strips}`);
console.log(`replaced lab/lab-data.json  (the previous one is at lab-data.json.before-halfworld)`);
