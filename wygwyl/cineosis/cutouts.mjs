#!/usr/bin/env node
/* ============================================================================
   cutouts.mjs — EVERY BODY IN THE SUITE, CUT OUT EXACTLY.

     node harness/serve.mjs &
     node wygwyl/cineosis/cutouts.mjs      → renders/cineosis/cutouts/*.png

   A cineosis cutout is {png, label, p, bbox, area}: a transparent PNG of one
   object, a label, a confidence, a normalised box and an area fraction. They
   come from SAM plus a classifier, they are expensive, and the archive has
   them for 125 shots of 15,149 — eight tenths of one percent.

   This suite can hand them over exactly, for nothing. renderScene fills a
   parallel field with which draw call owns each cell, and fig() deposits its
   tag beside what it drew, so intersecting the two gives one body's silhouette
   with its name already attached. There is no segmentation step because there
   is nothing to segment: we are not finding the body, we are the ones who put
   it there.

   So `p` is 1 on every one of these and each carries src:"drawn". A confidence
   is a statement about a guess, and writing 0.97 here to look like the
   neighbouring records would be a lie in the shape of a convention.

   THE PNG IS DRAWN BY THE SAME LAW AS THE FILM: dots at radius
   cell·0.5·(lv/7)^0.72·1.24, accent above 7.5. A cutout rendered by any other
   rule would be a picture of the mask rather than a piece of the film.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };

const PORT = +(process.env.PORT || 8181);
const CELL = +opt("cell", 4);
const MINAREA = +opt("minarea", 0.0008);     // a body smaller than this is a smudge
const LAB = opt("lab", "/home/user/hartswf0/cineosis-lab");
const OUT = path.join(ROOT, "renders", "cineosis");
fs.mkdirSync(path.join(OUT, "cutouts"), { recursive: true });

const SHOTS = JSON.parse(fs.readFileSync(path.join(OUT, "halfworld-shots.json"), "utf8"));
const CONT = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(LAB, "lab", "lab-data.json"), "utf8"))
    .wygwyl.films.map(f => [f.n, f.container]));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("page error: " + e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });

const idx = Object.fromEntries(await page.evaluate(() =>
  window.__hw.films.map((f, i) => [f.world.n, i])));

await page.evaluate(() => {
  const FW = 192, FH = 144, TAU = Math.PI * 2;
  window.__cut = (fi, tLocal, cell, minArea) => {
    const rt = window.__hw.films[fi].rt;
    const accent = window.__hw.films[fi].world.accent;
    const ids = new Float32Array(FW * FH);
    const r = rt.renderScene(tLocal, ids);

    /* A SMEAR TAP IS A SECOND DRAWING OF THE WHOLE MOVEMENT. Several films set
       fx.smear, and every tap re-runs the movement's draw — so the cast comes
       back with the same bodies twice, and the second pass runs with the tag
       counter already spent, which lands every figure in it on ONE id. In MORE
       HAZE that shared id owns 2023 cells across the full width of the frame,
       and taking it for a body produced a 22-row figure with a bbox spanning
       the whole picture. A tag claimed by more than one cast entry is not an
       instance, it is a pass; drop it, and keep each body's first appearance,
       which is the one drawn before any tap. */
    const perTag = new Map();
    for (const c of r.cast) perTag.set(c.tag, (perTag.get(c.tag) || 0) + 1);
    const once = new Set();
    const cast = r.cast.filter(c => {
      if (perTag.get(c.tag) > 1) return false;
      const key = c.guise + "|" + c.mode + "|" + Math.round(c.height);
      if (once.has(key)) return false;
      once.add(key); return true;
    });

    const out = [];
    for (let k = 0; k < cast.length; k++) {
      const c = cast[k];
      /* the body's own cells, and its box, in one pass */
      let x0 = FW, y0 = FH, x1 = -1, y1 = -1, n = 0;
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const i = y * FW + x;
        if (ids[i] !== c.tag || r.levels[i] < 0.45) continue;
        n++;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      if (n === 0 || n / (FW * FH) < minArea) continue;
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      /* AND THE CHECK THAT WOULD HAVE CAUGHT IT. fig() was told the body's
         height in rows, so the mask's own height is a prediction we can test
         against a number nobody had to infer. A silhouette more than half again
         taller or shorter than the figure it claims to be is not that figure. */
      if (bh > c.height * 1.6 || bh < c.height * 0.5) continue;
      const cv = document.createElement("canvas");
      cv.width = Math.round(bw * cell); cv.height = Math.round(bh * cell);
      const g = cv.getContext("2d");                       // transparent by default
      /* the film's own dot law, nothing else */
      const batches = Array.from({ length: 8 }, () => []);
      const acc = [];
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * FW + x;
        if (ids[i] !== c.tag) continue;
        const v = r.levels[i];
        if (v < 0.45) continue;
        if (v > 7.5) { acc.push(x - x0, y - y0); continue; }
        batches[Math.min(7, Math.round(v))].push(x - x0, y - y0);
      }
      g.fillStyle = "#161513";
      for (let lv = 1; lv <= 7; lv++) {
        const pts = batches[lv]; if (!pts.length) continue;
        const rad = cell * 0.5 * Math.pow(lv / 7, 0.72) * 1.24;
        g.beginPath();
        for (let j = 0; j < pts.length; j += 2) {
          const px = (pts[j] + 0.5) * cell, py = (pts[j + 1] + 0.5) * cell;
          g.moveTo(px + rad, py); g.arc(px, py, rad, 0, TAU);
        }
        g.fill();
      }
      if (acc.length) {
        g.fillStyle = accent; const rad = cell * 0.44;
        g.beginPath();
        for (let j = 0; j < acc.length; j += 2) {
          const px = (acc[j] + 0.5) * cell, py = (acc[j + 1] + 0.5) * cell;
          g.moveTo(px + rad, py); g.arc(px, py, rad, 0, TAU);
        }
        g.fill();
      }
      out.push({
        label: c.guise, mode: c.mode, face: c.face, height: c.height,
        bbox: [+(x0 / FW).toFixed(4), +(y0 / FH).toFixed(4), +(bw / FW).toFixed(4), +(bh / FH).toFixed(4)],
        area: +(n / (FW * FH)).toFixed(4),
        png: cv.toDataURL("image/png"),
      });
    }
    return { mixing: r.mixing, label: r.label, cutouts: out };
  };
});

let shotsWith = 0, made = 0;
for (const s of SHOTS) {
  const n = s.halfworld.n;
  const local = s.match - CONT[n][0];
  const r = await page.evaluate(([fi, t, cell, ma]) => window.__cut(fi, t, cell, ma),
    [idx[n], local, CELL, MINAREA]);
  if (!r.cutouts.length) { s.cutouts = []; continue; }
  s.cutouts = r.cutouts.map((c, k) => {
    const rel = `cutouts/${s.id}_${k}.png`;
    fs.writeFileSync(path.join(OUT, rel),
      Buffer.from(c.png.slice(c.png.indexOf(",") + 1), "base64"));
    made++;
    return { png: rel, label: c.label, p: 1, bbox: c.bbox, area: c.area,
      src: "drawn", mode: c.mode, face: c.face, heightRows: c.height };
  });
  shotsWith++;
  process.stdout.write(`\r  ${shotsWith} shots · ${made} cutouts   `);
}
await browser.close();
/* merge rather than overwrite — see the note in encode.mjs; any two of these
   tools can be in flight at once and the last one to finish must not be the
   only one whose work survives */
{
  let live = SHOTS;
  try { live = JSON.parse(fs.readFileSync(path.join(OUT, "halfworld-shots.json"), "utf8")); } catch (_) {}
  const by = new Map(SHOTS.map(s => [s.id, s]));
  for (const s of live) { const m = by.get(s.id); if (m && m.cutouts !== undefined) s.cutouts = m.cutouts; }
  fs.writeFileSync(path.join(OUT, "halfworld-shots.json"), JSON.stringify(live, null, 1));
}
const byLabel = {};
for (const s of SHOTS) for (const c of s.cutouts || []) byLabel[c.label] = (byLabel[c.label] || 0) + 1;
console.log(`\n\n${made} cutouts across ${shotsWith} of ${SHOTS.length} shots`);
console.log("labels:", Object.entries(byLabel).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(" · "));
console.log(`cineosis has cutouts for 125 of its 15,149 shots; these ${shotsWith} are exact`);
console.log(`→ renders/cineosis/cutouts/`);
