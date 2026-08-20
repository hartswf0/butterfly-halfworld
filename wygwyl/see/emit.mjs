#!/usr/bin/env node
/* ============================================================================
   emit.mjs — A CALIBRATION SET WITH MASKS THAT WERE NEVER ANNOTATED.

     node wygwyl/see/emit.mjs 09            one film, 12 samples
     node wygwyl/see/emit.mjs 09 13 --per 24
     node wygwyl/see/emit.mjs --levels 2,4,8   the same content at three depths

   Before a compliance score means anything you have to know the segmenter's
   error rate in the regime you are scoring in. These films can state it exactly:
   `renderScene` hands back the levels, a field of which draw call owns each
   cell, and a cast naming what those calls drew. A labelled instance mask is
   one comparison per cell. Nothing here is annotated — it is recalled.

   --levels is the part no other corpus can offer. Quantisation is the LAST step
   in this render, so the same motion, the same bodies and the same composition
   can be emitted at two levels or at two hundred and fifty-six, and the only
   thing that differs is the representation. Segmentation accuracy as a function
   of bit depth, with content held exactly constant.

   Frames inside the runtime's 1.5s crossfade are skipped and counted: for those
   seconds two movements are on screen at once and an instance mask that spans a
   cut is a lie about what is in the shot.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const PORT = +(process.env.PORT || 8181);
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const PER = +flag("per", 12);
const LEVELS = String(flag("levels", "8")).split(",").map(Number);
const VALUED = new Set(["--per", "--levels"]);
const only = argv.filter((a, i) => /^\d\d$/.test(a) && !VALUED.has(argv[i - 1]));

const OUT = path.join(ROOT, "renders", "see");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("  page error: " + e.message.split("\n")[0]));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw?.films?.length, null, { timeout: 30000 });
await page.evaluate(() => window.__hw.halt());

const films = await page.evaluate(() => window.__hw.films.map(f => ({ n: f.world.n, slug: f.slug, start: f.start, dur: f.rt.total })));
const picked = films.filter(f => !only.length || only.includes(f.n));
if (!picked.length) { console.error("no films matched"); process.exit(1); }

console.log(`${picked.length} film(s) · ${PER} samples each · levels ${LEVELS.join(", ")}\n`);
const manifest = { generated_by: "wygwyl/see/emit.mjs", w: 192, h: 144, levels: LEVELS, shots: [] };
let skipped = 0;

for (const f of picked) {
  for (let k = 0; k < PER; k++) {
    const t = f.start + f.dur * (0.06 + 0.88 * k / (PER - 1 || 1));
    const S = await page.evaluate(({ tt, levels }) => {
      const FW = 192, FH = 144;
      const F = window.__hw.films; let fi = F.length - 1;
      while (fi > 0 && tt < F[fi].start) fi--;
      const rt = F[fi].rt, ids = new Int32Array(FW * FH);
      const s = rt.renderScene(tt - F[fi].start, ids);
      if (s.mixing) return { mixing: true };
      /* quantise the SAME field to each requested depth. 8 is the film's own
         law; anything else is the same picture said in fewer or more words. */
      const bands = {};
      for (const L of levels) {
        const q = new Uint8Array(FW * FH);
        for (let i = 0; i < q.length; i++) {
          const v = Math.max(0, Math.min(7, s.levels[i])) / 7;
          q[i] = Math.round(v * (L - 1));
        }
        bands[L] = Array.from(q);
      }
      const cast = s.cast.map(c => {
        const m = new Uint8Array(FW * FH);
        let n = 0, x0 = FW, y0 = FH, x1 = -1, y1 = -1, sx = 0, sy = 0;
        for (let i = 0; i < m.length; i++) {
          if (ids[i] !== c.tag || s.levels[i] <= 0) continue;
          m[i] = 1; n++;
          const x = i % FW, y = (i / FW) | 0; sx += x; sy += y;
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        return { ...c, area: n, box: [x0, y0, x1, y1],
                 centroid: n ? [+(sx / n).toFixed(2), +(sy / n).toFixed(2)] : null,
                 mask: Array.from(m) };
      }).filter(c => c.area > 0);
      return { movement: s.movement, label: s.label, u: s.u, bands, cast };
    }, { tt: t, levels: LEVELS });

    if (S.mixing) { skipped++; continue; }
    const id = `${f.n}-m${String(S.movement).padStart(2, "0")}-${String(k).padStart(3, "0")}`;
    for (const L of LEVELS)
      fs.writeFileSync(path.join(OUT, `${id}.L${L}.u8`), Buffer.from(S.bands[L]));
    S.cast.forEach((c, j) =>
      fs.writeFileSync(path.join(OUT, `${id}.${c.kind}.${j}.u8`), Buffer.from(c.mask)));
    manifest.shots.push({
      id, film: f.n, slug: f.slug, t: +t.toFixed(3), movement: S.label, u: +S.u.toFixed(4),
      /* nouns true by construction — this is what the segmenter is scored against */
      expect: [{ noun: "person", count: S.cast.filter(c => c.kind === "figure").length }],
      cast: S.cast.map((c, j) => ({
        file: `${id}.${c.kind}.${j}.u8`, kind: c.kind, guise: c.guise, mode: c.mode,
        face: c.face, height: c.height, foot: c.foot.map(v => +v.toFixed(2)),
        area: c.area, box: c.box, centroid: c.centroid,
      })),
    });
  }
  const mine = manifest.shots.filter(s => s.film === f.n);
  const bodies = mine.reduce((a, s) => a + s.cast.length, 0);
  console.log(`  ${f.n} ${f.slug.padEnd(34)} ${String(mine.length).padStart(3)} shots · ${String(bodies).padStart(3)} labelled bodies`);
}

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
const bodies = manifest.shots.reduce((a, s) => a + s.cast.length, 0);
console.log(`\n${manifest.shots.length} shots · ${bodies} masks · ${skipped} skipped inside a crossfade`);
console.log(`→ renders/see/   (manifest.json + ${LEVELS.length} level band(s) per shot)`);
if (!bodies) console.log(`\nNo bodies found. That is a real answer for a film with no figures in it,\nand a bug if it is not — check the film draws through F.fig.`);
await browser.close();
