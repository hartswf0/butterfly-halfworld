#!/usr/bin/env node
/* ============================================================================
   emit.mjs — THE HALFWORLD SUITE AS CINEOSIS SHOTS.

     node harness/serve.mjs &                  (the page imports ES modules)
     node wygwyl/cineosis/emit.mjs             → renders/cineosis/halfworld-shots.json
     node wygwyl/cineosis/emit.mjs --samples 9 more instants per shot
     node wygwyl/cineosis/emit.mjs --film 07   one film

   WHAT A CINEOSIS SHOT IS. 15,149 records in `lab/lab-data.json`, each a clip
   of an archive film: id, title, slug, page, video, thumb, start, end, match,
   bw, palette, lum, sat, subjects, scale, xy, sim, affinity, aff_top,
   collections. Membership is the `collections` array — ["cineosis"],
   ["cineosis","wygwyl"], ["cineosis","wygwyl","forage"] — so joining is adding
   a name to a list, not a schema change.

   WHY THE JOIN IS FREE. The suite's films carry a `window` apiece and
   cineosis's `wygwyl.films[].container` carries the same fourteen spans; they
   agree to within 5 ms on all fourteen. The movements inside a film are
   already a shot list — label, duration, and the line it carries — and the
   runtime's stretch rule turns the weights into absolute seconds. So the
   boundaries are not estimated here. They are read.

   TWO THINGS THAT WILL PUT YOU 59 SECONDS OUT IF YOU MISS THEM.

     The suite runs 1498.66s and the cineosis cut 1440.07s. The difference is
     the title film at the head of the suite, which the cut does not carry. We
     emit films 01-14 only and address every shot from its film's cineosis
     container, never from the suite's running total.

     cineosis's own containers hold one 402 ms hole, between NEVERMORE and
     BLOODLINES. Everything from film 05 on sits 402 ms later in the cut than
     a naive sum of the films would put it. Addressing from the container
     carries that automatically; summing durations does not.

   WHAT THE HALFWORLD GIVES BACK. cineosis infers `scale` and `subjects` with a
   model and has hand-labelled signs for 253 of its 15,149 shots. These films
   are code, so `renderScene` hands back the 8-level field, a per-cell instance
   id, and a cast: every figure's guise, pose, facing, foot and height. We are
   not inferring where the body is. We put it there. Those two fields come out
   of this as ground truth, and so does every photometric field, because the
   colour is arithmetic on the level and not a measurement of a photograph.

   WHAT IT CANNOT GIVE. `xy`, `sim`, `affinity` and `aff_top` are CLIP, and the
   coordinates must be a PROJECTION INTO the existing map — fitting a fresh
   t-SNE puts these 80 shots in a space that shares no axes with the other
   15,149 and every neighbour reads as a lie. Those fields are emitted null
   with the reason attached, and `report.json` says what each one costs.
   ========================================================================= */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };

const PORT = +(process.env.PORT || 8181);
const SAMPLES = +opt("samples", 7);
const ONLY = opt("film", "");
const LAB = opt("lab", "/home/user/hartswf0/cineosis-lab");
const OUT = path.join(ROOT, "renders", "cineosis");
fs.mkdirSync(OUT, { recursive: true });

/* the cineosis clock, if it is on this machine; the module windows otherwise */
let CONTAINERS = null, ARCHIVE = null;
try {
  const d = JSON.parse(fs.readFileSync(path.join(LAB, "lab", "lab-data.json"), "utf8"));
  CONTAINERS = Object.fromEntries(d.wygwyl.films.map(f => [f.n, f.container]));
  /* the archive's own distributions, so the report can say what these shots
     ADD rather than only what they are */
  const n = d.shots.length, sc = {};
  for (const x of d.shots) sc[x.scale] = (sc[x.scale] || 0) + 1;
  const med = (k) => { const v = d.shots.map(x => x[k]).filter(x => typeof x === "number").sort((a, b) => a - b); return +v[v.length >> 1].toFixed(3); };
  ARCHIVE = { shots: n, scale: sc, lum: med("lum"), sat: med("sat") };
} catch (_) { console.log("  (no cineosis lab-data.json — addressing from each film's own window)"); }

/* A DETERMINISTIC ID. cineosis ids are v5 UUIDs, so these are too: the same
   movement gets the same id on every machine and on every re-run, which is the
   only way a second emit can update rather than duplicate. */
const NS = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";                 // the URL namespace
function uuid5(name) {
  const h = createHash("sha1");
  h.update(Buffer.from(NS.replace(/-/g, ""), "hex"));
  h.update(Buffer.from(name, "utf8"));
  const b = h.digest();
  b[6] = (b[6] & 0x0f) | 0x50; b[8] = (b[8] & 0x3f) | 0x80;
  const x = b.subarray(0, 16).toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}

const hex = ([r, g, b]) => "#" + [r, g, b].map(v =>
  Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/* THE COLOUR OF A LEVEL, AS THE FILM ACTUALLY PRINTS IT. The first version of
   this read the inferno ramp out of deep/ramp.mjs and reported every shot at
   saturation 0.93 — a confident number describing the wrong picture. That ramp
   belongs to the spectrogram surfaces. A FILM is cream paper with one ink and
   one accent, and a level is a DOT SIZE: halfworld.mjs draws level lv at radius
   cell·0.5·(lv/7)^0.72·1.24, and anything above 7.5 as an accent dot at 0.44.
   So the colour of a cell is the paper seen under that much ink, and the right
   number for coverage is the dot's area over the cell's. */
const PAPER = rgb("#f2efe6"), INK = rgb("#161513");
const inkCover = (lv) => Math.min(1, Math.PI * Math.pow(0.5 * Math.pow(lv / 7, 0.72) * 1.24, 2));
const ACCENT_COVER = Math.min(1, Math.PI * 0.44 * 0.44);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function levelColour(lv, accent) {
  if (lv <= 0) return PAPER;                       // below 0.45 nothing is drawn
  if (lv > 7.5) return mix(PAPER, rgb(accent), ACCENT_COVER);
  return mix(PAPER, INK, inkCover(Math.min(7, lv)));
}

/* RGB → the three numbers cineosis stores. Its `lum` is 0..1 and its `hue` is
   degrees; `sat` is 0..1 and absent rather than zero on a neutral frame. */
function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-9) return { h: null, s: 0, l };
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

/* SHOT SCALE FROM THE BODY WE DREW. cineosis's vocabulary is five terms and a
   model picks one. Here the figure's height in rows is a number the film
   passed to fig(), so the only judgement left is where the thresholds go, and
   they go where film grammar puts them: a body is read by how much of it the frame
   holds. Nothing is ever clipped in this suite — no movement draws a figure
   taller than the 144-row field — so the two closest terms cannot be reached,
   and saying so is more honest than stretching the scale to use them. */
const FH = 144;
function scaleOf(maxH) {
  if (maxH == null) return "extreme long shot";       // no body: the frame is weather
  const f = maxH / FH;
  if (f >= 1.30) return "extreme close-up";
  if (f >= 0.95) return "close-up";
  if (f >= 0.55) return "medium shot";
  if (f >= 0.20) return "long shot";
  return "extreme long shot";
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("page error: " + e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });

const films = await page.evaluate(() => window.__hw.films.map((f, i) => ({
  i, slug: f.slug, n: f.world.n, title: f.world.title, tagline: f.world.tagline,
  accent: f.world.accent, score: f.world.score || null, window: f.world.window || null,
  movements: f.rt.movements.map(m => ({ label: m.label, line: m.line || "", seconds: m.seconds })),
  starts: f.rt.starts, total: f.rt.total,
})));

const shots = [];
const notes = { skippedTitle: 0, mixingAvoided: 0 };
for (const f of films) {
  if (f.n === "00") { notes.skippedTitle++; continue; }     // not in the cineosis cut
  if (ONLY && f.n !== ONLY) continue;
  const base = CONTAINERS?.[f.n]?.[0] ?? 0;

  for (let mi = 0; mi < f.movements.length; mi++) {
    const m = f.movements[mi];
    const t0 = f.starts[mi], t1 = t0 + m.seconds;

    /* SAMPLE INSIDE THE SHOT, NOT ACROSS ITS EDGES. The last 1.5s of every
       movement is a dissolve with the next one on screen at the same time;
       renderScene reports that as `mixing`, and a cast read during it belongs
       to two shots at once. Sample the interior and drop any frame that still
       comes back mixing. */
    const sampled = [];
    for (let k = 0; k < SAMPLES; k++) {
      const u = (k + 0.5) / SAMPLES * 0.92 + 0.02;
      const s = await page.evaluate(([fi, t]) => {
        const rt = window.__hw.films[fi].rt;
        const ids = new Float32Array(192 * 144);
        const r = rt.renderScene(t, ids);
        const hist = new Array(9).fill(0);
        for (let i = 0; i < r.levels.length; i++) {
          const lv = Math.round(r.levels[i]);
          hist[lv > 8 ? 8 : lv < 0 ? 0 : lv]++;
        }
        /* area per cast member, by intersecting the id field with its tag */
        const area = {};
        for (const c of r.cast) {
          let n = 0;
          for (let i = 0; i < ids.length; i++) if (ids[i] === c.tag) n++;
          area[c.tag] = n;
        }
        return { hist, mixing: r.mixing, label: r.label, u: r.u,
          cast: r.cast.map(c => ({ guise: c.guise, mode: c.mode, face: c.face,
            foot: c.foot, height: c.height, area: area[c.tag] || 0 })) };
      }, [f.i, t0 + u * m.seconds]);
      if (s.mixing) { notes.mixingAvoided++; continue; }
      sampled.push(s);
    }
    if (!sampled.length) continue;

    /* the representative instant is the one carrying the most ink away from
       the modal level — the frame with the most picture in it */
    let best = sampled[0], bestScore = -1, bestK = 0;
    sampled.forEach((s, k) => {
      const tot = s.hist.reduce((a, b) => a + b, 0);
      const mode = s.hist.indexOf(Math.max(...s.hist));
      let c = 0;
      for (let lv = 0; lv <= 8; lv++) c += s.hist[lv] * Math.abs(lv - mode);
      const sc = c / tot;
      if (sc > bestScore) { bestScore = sc; best = s; bestK = k; }
    });
    const matchU = (bestK + 0.5) / SAMPLES * 0.92 + 0.02;

    /* photometry, summed over every sample so a shot that changes is described
       by the whole shot and not by one frame of it */
    const hist = new Array(9).fill(0);
    for (const s of sampled) for (let lv = 0; lv <= 8; lv++) hist[lv] += s.hist[lv];
    const cells = hist.reduce((a, b) => a + b, 0);
    const order = hist.map((n, lv) => [lv, n]).filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 5);
    const palette = order.map(([lv]) => hex(levelColour(lv, f.accent)));
    let L = 0, S = 0, hx = 0, hy = 0, hw = 0;
    for (const [lv, n] of hist.map((n, lv) => [lv, n])) {
      if (!n) continue;
      const c = hsl(levelColour(lv, f.accent)), w = n / cells;
      L += c.l * w; S += c.s * w;
      if (c.h != null) { const r = c.h * Math.PI / 180; hx += Math.cos(r) * c.s * w; hy += Math.sin(r) * c.s * w; hw += c.s * w; }
    }
    const hue = hw > 1e-6 ? ((Math.atan2(hy, hx) * 180 / Math.PI) + 360) % 360 : null;

    /* the cast, pooled: a guise that appears in any sample is in the shot */
    const guises = new Map();
    let maxH = null;
    for (const s of sampled) for (const c of s.cast) {
      const g = guises.get(c.guise) || { label: c.guise, area: 0, n: 0, modes: new Set() };
      g.area += c.area; g.n++; g.modes.add(c.mode);
      guises.set(c.guise, g);
      if (maxH == null || c.height > maxH) maxH = c.height;
    }
    const subjects = [...guises.values()]
      .map(g => ({ label: g.label, p: +(g.area / (sampled.length * 27648)).toFixed(4),
        modes: [...g.modes].sort() }))
      .sort((a, b) => b.p - a.p);

    shots.push({
      id: uuid5(`halfworld:${f.slug}:${mi}`),
      title: f.title, slug: f.slug,
      page: `https://hartswf0.github.io/butterfly-halfworld/wygwyl/${f.slug}.html`,
      /* ON THE CINEOSIS CLOCK, from the container — never from a running sum */
      start: +(base + t0).toFixed(3), end: +(base + t1).toFixed(3),
      match: +(base + t0 + matchU * m.seconds).toFixed(3),
      bw: S < 0.05, palette, lum: +L.toFixed(3), sat: +S.toFixed(3),
      ...(hue == null ? {} : { hue: +hue.toFixed(1) }),
      subjects, scale: scaleOf(maxH),
      collections: ["halfworld", "wygwyl"],
      /* its own block, the way cineosis gives its shots a `wygwyl` one */
      halfworld: {
        n: f.n, movement: mi, label: m.label, line: m.line,
        accent: f.accent, engine: f.score?.engine || null, mode: f.score?.mode || null,
        figureHeight: maxH, frameRows: FH,
        truth: "scale and subjects are the film's own draw calls, not a classifier",
      },
      /* NOT GUESSED, AND NOT LEFT TO LOOK LIKE AN OVERSIGHT */
      video: null, clip: null, thumb: null, strip: null,
      xy: null, sim: null, affinity: null, aff_top: null, signs: null,
    });
  }
  process.stdout.write(`  ${f.n} ${f.title.padEnd(31)} ${String(f.movements.length).padStart(2)} movements\n`);
}
await browser.close();

const need = {
  "video, clip, thumb, strip":
    "encode. The renderer already draws every frame; this is an ffmpeg pass per shot plus one thumb and one strip, and nothing has to be decided.",
  "xy, sim, affinity, aff_top":
    "CLIP ViT-B-32 on the sampled frames, then a PROJECTION INTO cineosis's existing t-SNE and 45-way affinity. Fitting a new map instead puts these shots in a space sharing no axes with the other 15,149 and every neighbour it reports is false.",
  "signs":
    "a person. cineosis has them for 253 of 15,149 shots. These 80 come with their own line and label, which is a better starting point than a thumbnail, but the sign is still a reading.",
};
const byScale = {};
for (const s of shots) byScale[s.scale] = (byScale[s.scale] || 0) + 1;
const report = {
  generated: new Date().toISOString().slice(0, 10),
  shots: shots.length, samplesPerShot: SAMPLES,
  clock: {
    addressedFrom: CONTAINERS ? "cineosis wygwyl.films[].container" : "each film's own window",
    titleFilmExcluded: "the suite runs 1498.66s and the cut 1440.07s; the difference is the title film, which the cut does not carry",
    knownHole: "cineosis's containers hold one 402 ms hole between NEVERMORE and BLOODLINES; addressing from the container carries it, summing durations does not",
  },
  span: shots.length ? [shots[0].start, shots[shots.length - 1].end] : null,
  scales: byScale,
  /* THE POINT OF THE JOIN, IN ONE TABLE. The archive is 66% medium shots and
     0.6% long shots; this suite is 0% medium and 47% long. The two corpora are
     very nearly disjoint in shot scale — which is the honest case for putting
     them in one collection, and the honest limit of it: the halfworld can give
     cineosis the wide figure-in-field shot it hardly has, and cannot give it a
     face, because no movement in the suite draws one. */
  versusArchive: ARCHIVE ? {
    archiveShots: ARCHIVE.shots,
    scale: Object.fromEntries(["extreme long shot", "long shot", "medium shot", "close-up", "extreme close-up"]
      .map(k => [k, { halfworld: byScale[k] || 0, archive: ARCHIVE.scale[k] || 0 }])),
    lumMedian: { halfworld: null, archive: ARCHIVE.lum },
    satMedian: { halfworld: null, archive: ARCHIVE.sat },
  } : null,
  subjects: [...new Set(shots.flatMap(s => s.subjects.map(x => x.label)))].sort(),
  stillNeeded: need,
};
if (report.versusArchive && shots.length) {
  const med = (k) => { const v = shots.map(x => x[k]).sort((a, b) => a - b); return +v[v.length >> 1].toFixed(3); };
  report.versusArchive.lumMedian.halfworld = med("lum");
  report.versusArchive.satMedian.halfworld = med("sat");
}
fs.writeFileSync(path.join(OUT, "halfworld-shots.json"), JSON.stringify(shots, null, 1));
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
console.log(`\n${shots.length} shots · ${report.span ? report.span[0] + "s → " + report.span[1] + "s" : ""} on the cineosis clock`);
console.log("scale:", Object.entries(byScale).map(([k, v]) => `${v} ${k}`).join(" · "));
console.log("subjects:", report.subjects.join(", "));
console.log(`\n→ renders/cineosis/halfworld-shots.json  +  report.json`);
