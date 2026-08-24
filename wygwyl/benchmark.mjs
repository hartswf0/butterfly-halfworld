#!/usr/bin/env node
/* ============================================================================
   benchmark.mjs — EMIT A MOTION DATASET WITH EXACT GROUND TRUTH.

     node wygwyl/benchmark.mjs                   8 samples per film
     node wygwyl/benchmark.mjs --per 24 --dt 24  denser, at 24fps
     node wygwyl/benchmark.mjs 09 13             only these films

   WHY THIS IS NOT AN ORDINARY DATASET. Optical-flow ground truth on real
   footage cannot be measured, only annotated, which is why the field runs on
   synthetic renders and why those cost what they cost. These films are pure
   functions of u AND they remember who drew what: `renderTagged` fills a
   parallel field with which draw call owns each cell, so the same object is
   located in two frames by identity rather than by resemblance. The
   correspondence is not estimated. It is recalled.

   WHAT COMES OUT, per sample, as raw little-endian binaries plus one manifest:

     <id>.a.u8      192x144 ink levels at t          (0-8)
     <id>.b.u8      192x144 ink levels at t + dt
     <id>.flow.f32  192x144x2 displacement, b relative to a, in cells
     <id>.valid.u8  192x144, 1 where the flow is known

   `valid` is the honest part. A cell is 0 when its ink arrived in frame b with
   no counterpart in a — new ink has no displacement, and inventing one is
   exactly the lie an estimator tells. Score only where valid is 1.

   THE FIRST RESULT IT PRODUCED. Scoring ICARO's `computeKinematics` — 9x9
   integer block matching, the flow engine this project was studied against —
   over 60 samples: mean endpoint error 1.26 cells, against 0.39 cells for
   simply claiming nothing moved. Beaten by the null hypothesis on 42 of 60
   samples, 3.2x worse overall, 20% of vectors within one cell against the null
   baseline's 93%.

   The reason is the same one that made its frame predictor lose to repeating
   the last frame: TRUE MOTION HERE IS PREDOMINANTLY SUB-CELL. Ninety percent
   of cells are moving and almost all of them are moving less than one cell per
   frame. An estimator whose search is over integer offsets cannot express
   that, so every vector it emits is either zero — which is the baseline — or
   an overshoot. On a coarse lattice, estimate motion at sub-cell precision or
   do not estimate it.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const PORT = +(process.env.PORT || 8181);
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const PER = +flag("per", 8), FPS = +flag("dt", 12);
const VALUED = new Set(["--per", "--dt"]);
const only = argv.filter((a, i) => /^\d\d$/.test(a) && !VALUED.has(argv[i - 1]));
const OUT = path.join(ROOT, "renders", "benchmark");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("  page error: " + e.message.split("\n")[0]));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw?.films?.length, null, { timeout: 30000 });
await page.evaluate(() => window.__hw.halt());

const films = (await page.evaluate(() => window.__hw.films.map(f => ({ n: f.world.n, title: f.world.title, start: f.start, dur: f.rt.total }))))
  .filter(f => !only.length || only.includes(f.n));
console.log(`${films.length} film(s) · ${PER} samples each · dt = 1/${FPS}s · 192x144\n`);

const manifest = { lattice: [192, 144], levels: 9, dt: 1 / FPS, samples: [] };
let nInk = 0, nValid = 0, nSub = 0, nMoving = 0;

for (const f of films) {
  for (let k = 0; k < PER; k++) {
    const t = f.start + f.dur * (0.06 + 0.88 * k / Math.max(1, PER - 1));
    const s = await page.evaluate(async ({ t, fps }) => {
      const m = await import("/wygwyl/flow.mjs");
      const FW = 192, FH = 144, dt = 1 / fps;
      const F = window.__hw.films; let fi = F.length - 1;
      while (fi > 0 && t < F[fi].start) fi--;
      const rt = F[fi].rt, base = t - F[fi].start;
      const a = Float32Array.from(rt.renderTagged(base, new Int32Array(FW * FH)));
      const d = m.denseFlow(rt, base, dt, FW, FH);
      const stat = m.trueFlow(rt, base, dt, FW, FH);
      const A = new Uint8Array(FW * FH), B = new Uint8Array(FW * FH);
      for (let q = 0; q < FW * FH; q++) { A[q] = Math.min(8, Math.round(a[q])); B[q] = Math.min(8, Math.round(d.levels[q])); }
      const fl = new Float32Array(FW * FH * 2);
      for (let q = 0; q < FW * FH; q++) { fl[q * 2] = d.fx[q]; fl[q * 2 + 1] = d.fy[q]; }
      return { A: [...A], B: [...B], flow: [...fl], valid: [...d.valid],
               ink: stat.ink, sub: stat.subCellShare, moving: stat.movingInk, disp: stat.meanDisp };
    }, { t, fps: FPS });

    const id = `${f.n}-${String(k).padStart(2, "0")}`;
    fs.writeFileSync(path.join(OUT, id + ".a.u8"), Buffer.from(Uint8Array.from(s.A)));
    fs.writeFileSync(path.join(OUT, id + ".b.u8"), Buffer.from(Uint8Array.from(s.B)));
    fs.writeFileSync(path.join(OUT, id + ".flow.f32"), Buffer.from(Float32Array.from(s.flow).buffer));
    fs.writeFileSync(path.join(OUT, id + ".valid.u8"), Buffer.from(Uint8Array.from(s.valid)));
    const valid = s.valid.reduce((a2, c) => a2 + c, 0);
    manifest.samples.push({ id, film: f.n, title: f.title, t: +t.toFixed(3),
      ink: s.ink, valid, meanDisp: +s.disp.toFixed(4), subCellShare: +s.sub.toFixed(4) });
    nInk += s.ink; nValid += valid; nSub += s.sub; nMoving += s.moving;
  }
  process.stdout.write(`  ${f.n} ${f.title.slice(0, 28).padEnd(30)} ${PER} samples\n`);
}

const N = manifest.samples.length;
manifest.summary = {
  samples: N,
  meanValidCells: Math.round(nValid / N),
  meanSubCellShare: +(nSub / N).toFixed(4),
  meanMovingShare: +(nMoving / N).toFixed(4),
  note: "score only where valid=1; sub-cell share is of ink that moves at all",
};
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));
const bytes = fs.readdirSync(OUT).reduce((a, f2) => a + fs.statSync(path.join(OUT, f2)).size, 0);
console.log(`\n  ${N} samples · ${(bytes / 1048576).toFixed(1)} MB · renders/benchmark/`);
console.log(`  mean known-flow cells ${manifest.summary.meanValidCells} of 27648`);
console.log(`  of the ink that moves, ${(manifest.summary.meanSubCellShare * 100).toFixed(0)}% moves less than one cell per frame`);
console.log(`\n  THAT LAST NUMBER IS THE POINT. An estimator searching integer offsets`);
console.log(`  cannot express most of the motion in this dataset, and will lose to`);
console.log(`  claiming nothing moved. Score against zero-flow before anything else.`);
await browser.close();
