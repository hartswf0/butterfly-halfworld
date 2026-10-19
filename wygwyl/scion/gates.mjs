#!/usr/bin/env node
/* ============================================================================
   gates.mjs — THE FOUR INVARIANTS, MEASURED.

     node harness/serve.mjs &
     node wygwyl/scion/gates.mjs                  every shot with a body in it
     node wygwyl/scion/gates.mjs --film 01        one film
     node wygwyl/scion/gates.mjs --fps 12         sample harder

   Classical animation enforced its laws by eye, at a lightbox, one flip at a
   time. The laws are right and the enforcement was a human bottleneck. These
   films are code: renderScene returns the eight-level field, a per-cell
   instance id, and a cast — every figure's guise, pose, facing, foot and
   height. So a body's silhouette is not estimated from pixels, it is the set
   of cells its own draw call wrote, and the four structural invariants become
   arithmetic rather than judgement.

   WHAT EACH GATE ACTUALLY MEASURES HERE.

   GATE 1 · SILHOUETTE SEPARABILITY
     solidity = mask area / convex-hull area. A pose whose limbs are tangled
     into the torso fills its own hull; a pose that reads has negative space
     cut into it. Also counts enclosed holes (an arm away from the body makes
     one) and measures CONTAMINATION: how much of the figure's bounding box is
     other ink at the same level or darker, which is the thing that makes a
     character disappear into its own set.

   GATE 2 · VOLUME CONSERVATION
     the mask's area divided by h^2 across the shot. The field is flat, so
     there is no perspective term to divide out: a body that holds its volume
     holds this number. Reports the coefficient of variation, and separately
     the high-frequency part of it, because a slow swell is a body turning and
     a frame-to-frame flicker is boiling.

   GATE 3 · CONTACT PINNING
     the one that matters, and the one this suite was always going to fail.
     figure.mjs puts the swing foot at sin(phase)*stride in BODY-LOCAL space,
     so a foot is pinned in the world only if the body advances exactly as the
     local foot retreats. Nothing couples them: 01 moves the body on a
     smoothstep ping-pong while phase runs linearly off u. So this takes the
     bottom eighth of the mask, clusters it into feet, and asks the only
     question that matters — between two frames, did ANY foot hold still?

       slip = min over feet |dx_foot| / |dx_body|

     0 means a foot was planted. 1 means the whole body translated and every
     foot went with it: the character is a drawing being dragged across a
     background, which is what a skating foot reads as even when nobody can
     say why.

   GATE 4 · ARCS AND PHASE LAG
     tracks the head centroid and the body anchor. Curvature is the mean
     turning of the head's path: a mechanical interpolation runs straight and
     a living one does not. Lag is the cross-correlation delay between the
     anchor's speed and the head's — the hips lead and the head follows, and a
     rig with no drag chain reports zero.

   GATE 5 is a checkpoint comparison between two passes and needs a before and
   an after, so it lives with whatever edit is being judged, not here.
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
const FPS = +opt("fps", 8);              // samples per second inside a shot
const ONLY = opt("film", "");
const LAB = opt("lab", "/home/user/hartswf0/cineosis-lab");
const OUT = path.join(ROOT, "renders", "scion");
fs.mkdirSync(OUT, { recursive: true });

/* --world measures a BENCH from its own shell: one movement per lane, judged
   against each other. The suite page only carries the fourteen films, and a
   bench is not one — but a bench is exactly where a contract gets tested
   before it goes near a poem. */
const WORLD = opt("world", "");
let SHOTS = null, CONT = null;
if (!WORLD) {
  SHOTS = JSON.parse(fs.readFileSync(path.join(ROOT, "renders", "cineosis", "halfworld-shots.json"), "utf8"));
  CONT = Object.fromEntries(
    JSON.parse(fs.readFileSync(path.join(LAB, "lab", "lab-data.json"), "utf8"))
      .wygwyl.films.map(f => [f.n, f.container]));
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("page error: " + e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/${WORLD ? WORLD + ".html" : "suite.html"}`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });
/* a shell exposes __hw.runtime; the suite exposes __hw.films */
const IDX = WORLD ? null : Object.fromEntries(await page.evaluate(() =>
  window.__hw.films.map((f, i) => [f.world.n, i])));
if (WORLD) {
  const mv = await page.evaluate(() => {
    const R = window.__hw.runtime;
    return R.movements.map((m, i) => ({ i, label: m.label, start: R.starts[i], seconds: m.seconds }));
  });
  SHOTS = mv.map(m => ({ id: `${WORLD}:${m.i}`, start: m.start, end: m.start + m.seconds,
    halfworld: { n: WORLD, label: m.label } }));
  CONT = { [WORLD]: [0, 0] };
}

await page.evaluate(() => {
  const FW = 192, FH = 144;

  /* a body's own cells: the instance id it wrote, where there is ink */
  function maskOf(levels, ids, tag) {
    const cells = [];
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const i = y * FW + x;
      if (ids[i] === tag && levels[i] >= 0.45) cells.push(x, y);
    }
    return cells;
  }
  /* monotone chain, on the cell centres */
  function hullArea(cells) {
    const pts = [];
    for (let i = 0; i < cells.length; i += 2) pts.push([cells[i], cells[i + 1]]);
    if (pts.length < 3) return pts.length;
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (src) => { const h = [];
      for (const p of src) { while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); }
      h.pop(); return h; };
    const H = [...half(pts), ...half([...pts].reverse())];
    let a = 0;
    for (let i = 0; i < H.length; i++) { const p = H[i], q = H[(i + 1) % H.length];
      a += p[0] * q[1] - q[0] * p[1]; }
    return Math.abs(a) / 2 || pts.length;
  }
  /* holes: background cells inside the bbox that cannot reach its border */
  function holesIn(cells, x0, y0, w, h) {
    const on = new Uint8Array(w * h);
    for (let i = 0; i < cells.length; i += 2) on[(cells[i + 1] - y0) * w + (cells[i] - x0)] = 1;
    const seen = new Uint8Array(w * h), st = [];
    for (let x = 0; x < w; x++) { st.push(x, 0, x, h - 1); }
    for (let y = 0; y < h; y++) { st.push(0, y, w - 1, y); }
    while (st.length) { const y = st.pop(), x = st.pop();
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x; if (seen[i] || on[i]) continue; seen[i] = 1;
      st.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1); }
    let holes = 0, hole = 0;
    for (let i = 0; i < w * h; i++) if (!on[i] && !seen[i]) hole++;
    /* count components, not cells */
    const vis = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (on[i] || seen[i] || vis[i]) continue;
      holes++; const s = [x, y];
      while (s.length) { const yy = s.pop(), xx = s.pop();
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx; if (on[j] || seen[j] || vis[j]) continue; vis[j] = 1;
        s.push(xx + 1, yy, xx - 1, yy, xx, yy + 1, xx, yy - 1); }
    }
    return { holes, holeCells: hole };
  }

  window.__gate = (fi, tLocal) => {
    const rt = fi === null ? window.__hw.runtime : window.__hw.films[fi].rt;
    const ids = new Float32Array(FW * FH);
    const r = rt.renderScene(tLocal, ids);
    /* a tag claimed by more than one cast entry is a redraw pass, not a body
       (fx.smear re-runs the whole movement) — the same rule cutouts.mjs uses */
    const per = new Map();
    for (const c of r.cast) per.set(c.tag, (per.get(c.tag) || 0) + 1);
    const seen = new Set();
    const cast = r.cast.filter(c => {
      if (per.get(c.tag) > 1) return false;
      const k = c.guise + "|" + c.mode + "|" + Math.round(c.height);
      if (seen.has(k)) return false; seen.add(k); return true;
    });

    const out = [];
    for (const c of cast) {
      const cells = maskOf(r.levels, ids, c.tag);
      if (cells.length < 24) continue;                      // 12 cells of body
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, cx = 0, cy = 0;
      for (let i = 0; i < cells.length; i += 2) {
        const x = cells[i], y = cells[i + 1];
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
        cx += x; cy += y;
      }
      const n = cells.length / 2;
      cx /= n; cy /= n;
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (bh > c.height * 1.6 || bh < c.height * 0.5) continue;   // not this body

      /* head: the centroid of the top fifth of the mask */
      let hx = 0, hn = 0;
      const headCut = y0 + bh * 0.2;
      for (let i = 0; i < cells.length; i += 2)
        if (cells[i + 1] <= headCut) { hx += cells[i]; hn++; }

      /* feet: the bottom eighth, clustered left/right on an x gap */
      const footCut = y1 - Math.max(1, bh * 0.08);
      const fx = [];
      for (let i = 0; i < cells.length; i += 2) if (cells[i + 1] >= footCut) fx.push(cells[i]);
      fx.sort((a, b) => a - b);
      const groups = [];
      for (const x of fx) {
        const g = groups[groups.length - 1];
        if (!g || x - g[g.length - 1] > 2) groups.push([x]); else g.push(x);
      }
      const feet = groups.map(g => g.reduce((a, b) => a + b, 0) / g.length);

      /* contamination: cells in the bbox that are ink at this level or darker
         and belong to somebody else */
      let other = 0, box = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * FW + x; box++;
        if (ids[i] !== c.tag && r.levels[i] >= 0.45) other++;
      }
      const H = holesIn(cells, x0, y0, bw, bh);
      out.push({
        guise: c.guise, mode: c.mode, face: c.face, height: c.height,
        anchor: c.foot, area: n, bbox: [x0, y0, bw, bh],
        centroid: [+cx.toFixed(3), +cy.toFixed(3)],
        headX: hn ? +(hx / hn).toFixed(3) : null,
        feet: feet.map(v => +v.toFixed(3)),
        solidity: +(n / Math.max(1, hullArea(cells))).toFixed(4),
        holes: H.holes, holeCells: H.holeCells,
        contamination: +(other / Math.max(1, box)).toFixed(4),
      });
    }
    return { label: r.label, mixing: r.mixing, bodies: out };
  };
});

/* ---- sample every shot, then judge the series ----------------------------- */
const mean = (a) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };

const results = [];
for (const s of SHOTS) {
  const n = s.halfworld.n;
  if (ONLY && n !== ONLY) continue;
  const dur = s.end - s.start, base = CONT[n][0];
  const N = Math.max(3, Math.min(220, Math.round(dur * FPS)));
  const series = [];
  for (let k = 0; k < N; k++) {
    const t = base === null ? 0 : s.start - base + (k + 0.5) / N * dur;
    const r = await page.evaluate(([fi, tt]) => window.__gate(fi, tt), [IDX ? IDX[n] : null, t]);
    if (!r.mixing) series.push(r);
  }
  /* follow one body: the tallest, which is the one the shot is about */
  const track = [];
  for (const f of series) {
    const b = f.bodies.slice().sort((a, b2) => b2.height - a.height)[0];
    if (b) track.push(b);
  }
  if (track.length < 3) { results.push({ shot: s.id, film: n, label: s.halfworld.label, bodies: 0 }); continue; }

  /* GATE 2 — volume: area / h^2 */
  const vol = track.map(b => b.area / (b.height * b.height));
  const dvol = vol.slice(1).map((v, i) => Math.abs(v - vol[i]));

  /* GATE 3 — pinning: between frames, did ANY foot hold still? */
  /* GATE 3 — HOW FAR DOES THE BODY TRAVEL WHILE ONE FOOT STAYS PUT?

     Two earlier estimators failed for instructive reasons. A mean of
     per-sample ratios min_foot_dx / body_dx, and the ratio of their sums,
     both bottom out around 0.4 on a bench that is provably pinned — because a
     planted foot's measured centroid still wobbles about a cell as the foot
     rolls heel to toe and the halftone requantises it, so the numerator has a
     noise floor the ratio can never get under.

     The physical question has no such floor. A walking body plants a foot and
     travels one stride over it. So: find the longest run of samples in which
     SOME fixed world position holds a foot throughout, and measure how far the
     body moved during it. A correct walk gives one stride. A skating walk
     gives nothing, because no position ever holds a foot for long.

        plant = body cells travelled over the longest planted run
        ratio = plant / (2 * amplitude)        1.0 is a full correct stance

     TOL is a cell and a half, which is the wobble measured on the bench, not a
     number chosen to make the answer come out. */
  const TOL = 1.5;
  const feetAt = track.map(b => b.feet);
  const anchorAt = track.map(b => b.anchor[0]);
  let plant = 0, plantRun = 0;
  for (let i = 0; i < track.length; i++) {
    for (const a of feetAt[i]) {
      let j = i;
      while (j + 1 < track.length && feetAt[j + 1].some(f => Math.abs(f - a) <= TOL)) j++;
      const travel = Math.abs(anchorAt[j] - anchorAt[i]);
      if (travel > plant) { plant = travel; plantRun = j - i + 1; }
    }
  }
  /* the amplitude this body actually swings, read off the samples themselves */
  const rel = track.flatMap(b => b.feet.map(f => f - b.anchor[0]));
  const amp = rel.length ? (Math.max(...rel) - Math.min(...rel)) / 2 : 0;
  const travelled = Math.abs(anchorAt[anchorAt.length - 1] - anchorAt[0]);
  let gross = 0;
  for (let i = 1; i < anchorAt.length; i++) gross += Math.abs(anchorAt[i] - anchorAt[i - 1]);
  /* ALIASING, SAID OUT LOUD. If the body covers more than half a stride
     between samples the feet swap identity unseen and every number here is a
     wagon wheel. At 24 samples a second on a bench whose cycle is 24 cells of
     travel this sat at 0.5 and read as a static offset; the gate must say so
     rather than report the aliased figure as a finding. */
  const perSample = gross / Math.max(1, anchorAt.length - 1);
  const alias = amp > 0 ? +(perSample / (2 * amp)).toFixed(3) : null;

  /* AND THE OTHER HALF OF GATE 3: DOES THE BODY FACE WHERE IT IS GOING?
     A skating foot and a reversed facing are the same kind of defect — a body
     whose drawing disagrees with its own travel — and neither is visible in a
     still. The cast carries `face`; the anchor carries the direction. Compare
     them wherever the body actually moved. */
  let faceOK = 0, faceN = 0;
  for (let i = 1; i < track.length; i++) {
    const dx = track[i].anchor[0] - track[i - 1].anchor[0];
    if (Math.abs(dx) < 0.3) continue;
    faceN++; if (Math.sign(dx) === track[i].face) faceOK++;
  }

  /* GATE 4 — arc of the head, and whether the head lags the hips */
  const hx = track.map(b => b.headX).filter(v => v != null);
  const hy = track.map(b => b.centroid[1]);
  let curve = 0;
  for (let i = 2; i < hx.length; i++) {
    const d1 = [hx[i - 1] - hx[i - 2], hy[i - 1] - hy[i - 2]];
    const d2 = [hx[i] - hx[i - 1], hy[i] - hy[i - 1]];
    const m1 = Math.hypot(...d1), m2 = Math.hypot(...d2);
    if (m1 < 1e-6 || m2 < 1e-6) continue;
    const cos = (d1[0] * d2[0] + d1[1] * d2[1]) / (m1 * m2);
    curve += Math.acos(Math.max(-1, Math.min(1, cos)));
  }
  const vA = track.slice(1).map((b, i) => Math.abs(b.anchor[0] - track[i].anchor[0]));
  const vH = hx.slice(1).map((v, i) => Math.abs(v - hx[i]));
  let lag = 0, bestR = -2;
  for (let L = 0; L <= Math.min(6, vA.length - 3); L++) {
    const a = vA.slice(0, vA.length - L), b = vH.slice(L);
    const m = Math.min(a.length, b.length);
    if (m < 3) break;
    const ma = mean(a.slice(0, m)), mb = mean(b.slice(0, m));
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < m; i++) { const u = a[i] - ma, v = b[i] - mb; num += u * v; da += u * u; db += v * v; }
    const r = num / (Math.sqrt(da * db) + 1e-9);
    if (r > bestR) { bestR = r; lag = L; }
  }

  results.push({
    shot: s.id, film: n, label: s.halfworld.label, frames: track.length,
    guise: track[0].guise, mode: track[0].mode, bodies: track.length,
    g1: { solidity: +mean(track.map(b => b.solidity)).toFixed(3),
          holes: +mean(track.map(b => b.holes)).toFixed(2),
          contamination: +mean(track.map(b => b.contamination)).toFixed(3) },
    g2: { vol: +mean(vol).toFixed(4), cv: +(sd(vol) / (mean(vol) + 1e-9)).toFixed(4),
          flicker: +(mean(dvol) / (mean(vol) + 1e-9)).toFixed(4) },
    g3: gross < 2 ? { plant: null, why: "the body never travelled" }
      : { plant: +plant.toFixed(2), ratio: +(plant / Math.max(1e-6, 2 * amp)).toFixed(3),
          runSamples: plantRun, amplitude: +amp.toFixed(2),
          grossTravel: +gross.toFixed(1), cellsPerSample: +perSample.toFixed(2),
          alias, aliased: alias != null && alias > 0.5 },
    g3b: faceN ? { facesTravel: +(faceOK / faceN).toFixed(3), n: faceN } : { facesTravel: null, n: 0 },
    g4: { curvePerFrame: +(curve / Math.max(1, hx.length - 2)).toFixed(4), lagFrames: lag, r: +bestR.toFixed(3) },
  });
  process.stdout.write(`\r  ${results.length}/${SHOTS.length}  ${n} ${s.halfworld.label.slice(0, 20).padEnd(22)}`);
}
await browser.close();

const withBody = results.filter(r => r.bodies);
const walked = withBody.filter(r => r.g3.plant != null && !r.g3.aliased);
const aliased = withBody.filter(r => r.g3.aliased).length;
fs.writeFileSync(path.join(OUT, (WORLD ? WORLD + "-" : "") + "gates.json"), JSON.stringify({
  sampledAt: `${FPS} fps inside each shot`, shots: results.length, withBodies: withBody.length,
  gate3: { travelled: walked.length, aliasedAndNotJudged: aliased,
    meanPlantRatio: walked.length ? +mean(walked.map(r => r.g3.ratio)).toFixed(3) : null,
    planted: walked.filter(r => r.g3.ratio >= 0.6).length,
    skating: walked.filter(r => r.g3.ratio < 0.25).length },
  results,
}, null, 1));

console.log(`\n\n${withBody.length} of ${results.length} shots have a body the gates can read\n`);
const row = (k, v) => console.log(`  ${k.padEnd(34)} ${v}`);
console.log("GATE 1 · SILHOUETTE");
row("mean solidity (lower reads better)", mean(withBody.map(r => r.g1.solidity)).toFixed(3));
row("mean enclosed holes per frame", mean(withBody.map(r => r.g1.holes)).toFixed(2));
row("mean contamination of the bbox", mean(withBody.map(r => r.g1.contamination)).toFixed(3));
console.log("\nGATE 2 · VOLUME");
row("mean area/h^2", mean(withBody.map(r => r.g2.vol)).toFixed(4));
row("coefficient of variation", mean(withBody.map(r => r.g2.cv)).toFixed(4));
row("frame-to-frame flicker", mean(withBody.map(r => r.g2.flicker)).toFixed(4));
console.log("\nGATE 3 · CONTACT PINNING");
row("shots where the body travelled", `${walked.length}`);
row("too aliased to judge (not counted)", `${aliased}`);
if (walked.length) {
  row("mean plant ratio (1 = full stance)", mean(walked.map(r => r.g3.ratio)).toFixed(3));
  row("shots that plant a foot (>=0.6)", walked.filter(r => r.g3.ratio >= 0.6).length);
  row("shots that skate (<0.25)", walked.filter(r => r.g3.ratio < 0.25).length);
}
const faced = withBody.filter(r => r.g3b.facesTravel != null);
if (faced.length) {
  row("shots where facing was testable", faced.length);
  row("mean agreement with direction", mean(faced.map(r => r.g3b.facesTravel)).toFixed(3));
  row("shots walking backwards (<0.5)", faced.filter(r => r.g3b.facesTravel < 0.5).length);
}
console.log("\nGATE 4 · ARCS AND LAG");
row("mean head curvature per frame", mean(withBody.map(r => r.g4.curvePerFrame)).toFixed(4));
row("shots where the head lags (>0)", withBody.filter(r => r.g4.lagFrames > 0).length + " / " + withBody.length);
console.log(`\n→ renders/scion/${WORLD ? WORLD + "-" : ""}gates.json`);
if (WORLD) for (const r of results) console.log(`  ${String(r.label).padEnd(34)}`
  + ` plant ${String(r.g3.plant ?? "—").padStart(6)} cells · ratio ${String(r.g3.ratio ?? "—").padStart(5)}`
  + `${r.g3.aliased ? "  ALIASED" : ""}`);
