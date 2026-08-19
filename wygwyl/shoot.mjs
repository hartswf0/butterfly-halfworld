#!/usr/bin/env node
/* ============================================================================
   shoot.mjs — LOOK AT THE PICTURE.

   Law 5 of the butterfly halfworld: every serious defect produced a plausible
   picture, and every one was caught by looking at an image rather than by a
   test. So this renders each world at real timestamps and writes PNGs, and it
   also reports the INK COVERAGE of each frame — a frame that is 0% or 96% ink
   is a bug the eye can miss in a contact sheet but a number cannot.

     node wygwyl/shoot.mjs                 every world, one frame per movement
     node wygwyl/shoot.mjs 01 07           only these
     node wygwyl/shoot.mjs --sweep 04      three frames per movement (u=.2/.5/.8)
     node wygwyl/shoot.mjs --motion        no pictures: does each movement MOVE?

   --sweep is the one that finds real defects. A movement that is a picture at
   its midpoint can still be empty paper for its first three seconds, and a
   single sample per movement will never say so.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "renders", "wygwyl");
fs.mkdirSync(OUT, { recursive: true });
const PORT = +(process.env.PORT || 8181);
const args = process.argv.slice(2);
const SWEEP = args.includes("--sweep");
const MOTION = args.includes("--motion");
const only = args.filter(a => !a.startsWith("--"));
const AT = SWEEP ? [0.2, 0.5, 0.8] : [0.55];

const shells = fs.readdirSync(HERE).filter(f => /^\d\d-.*\.html$/.test(f)).sort()
  .filter(f => !only.length || only.some(o => f.startsWith(o)));  /* by number, or by any stem prefix */

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.log("  !! PAGE ERROR: " + e.message));
page.on("console", m => { if (m.type() === "error") console.log("  !! CONSOLE: " + m.text()); });

/* LABEL THE COLUMNS. A reader took the third number for milliseconds and
   reported two movements as being nine times over the frame budget; they were
   in fact at 1.7ms and 2.4ms, and the 92 and 142 were edge percentages, which
   can exceed 100 because each cell is compared to two neighbours. A number
   with no unit on it will be given one by whoever reads it. */
/* --motion: DOES THIS MOVEMENT MOVE?
   Stretching every film to its own passage of the record made each movement
   about half again as long. Coverage and edge percentages cannot answer
   whether that extra time has anything in it — a figure walking clean across
   the frame barely changes either number, and a still picture held for
   twenty-eight seconds does not change them at all. So this samples the field
   itself at nine points and counts the cells that differ: `step` is the mean
   change between consecutive samples, `span` is how much of the field is
   different at the end of the movement from the start. A movement with a low
   step and a low span is a photograph, and the retime just made it a longer
   one. */
console.log(MOTION
  ? "per movement: seconds · step% (mean change between samples) · span% (start vs end)"
  : "per sample: coverage% / mean-ink-level / edge% · samples at u=" + AT.join(", "));
let bad = 0;
for (const shell of shells) {
  /* TAG BY THE WHOLE STEM, NOT THE NUMBER. Three title options all carry the
     number 00, and tagging by the first two characters made them write over
     each other's PNGs — so a sweep of three films left one film's renders on
     disk under all three names. The selector still matches on the number. */
  const n = shell.replace(/\.html$/, "");
  await page.goto(`http://127.0.0.1:${PORT}/wygwyl/${shell}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__hw, null, { timeout: 10000 });
  const info = await page.evaluate(() => ({
    total: window.__hw.runtime.total,
    labels: window.__hw.runtime.movements.map(m => m.label),
    starts: window.__hw.runtime.starts,
  }));
  console.log(`${n} · ${info.labels.length} movements · ${info.total.toFixed(0)}s`);
  for (let i = 0; i < info.labels.length; i++) {
    const span = i + 1 < info.starts.length ? info.starts[i + 1] - info.starts[i]
                                            : info.total - info.starts[i];
    if (MOTION) {
      const mv = await page.evaluate(({ t0, span }) => {
        const R = window.__hw.runtime, N = 9, W = 192, H = 144, CELLS = W * H;
        const shots = [];
        for (let k = 0; k < N; k++) {
          const f = R.renderField(t0 + span * (0.02 + 0.96 * k / (N - 1)));
          shots.push(Float32Array.from(f));
        }
        const diff = (a, b) => {
          let d = 0;
          for (let q = 0; q < CELLS; q++) if (Math.abs(a[q] - b[q]) >= 0.5) d++;
          return d / CELLS;
        };
        let step = 0;
        for (let k = 1; k < N; k++) step += diff(shots[k - 1], shots[k]);
        return { step: step / (N - 1), span: diff(shots[0], shots[N - 1]) };
      }, { t0: info.starts[i], span });
      /* A held picture is a legitimate thing to do for eight seconds and a
         mistake at twenty-five, so the flag reads both numbers and the clock.
         Two tiers, because they call for different repairs: STILL wants
         something to happen at all, QUIET wants the beat it already has to be
         worth the time it now takes. Stretching the films onto the record made
         every movement about half again as long, and half again as long is
         exactly how a small gesture turns into a wait. */
      const still = mv.step < 0.012 && mv.span < 0.05 && span > 12;
      const quiet = !still && mv.step < 0.035 && mv.span < 0.12 && span > 12;
      if (still || quiet) bad++;
      console.log(`   m${i} ${info.labels[i].padEnd(24)} ${span.toFixed(0).padStart(3)}s`
        + `  step ${(mv.step * 100).toFixed(1).padStart(5)}%  span ${(mv.span * 100).toFixed(1).padStart(5)}%`
        + (still ? "  <<< A LONG HOLD WITH NOTHING IN IT" : quiet ? "  <<< QUIET FOR THIS LONG" : ""));
      continue;
    }
    const covs = [];
    for (const at of AT) {
      const t = info.starts[i] + span * at;
      /* WHAT THE INSTRUMENT IS ACTUALLY LOOKING FOR IS A PICTURE.
         Coverage alone lies twice. A field entirely at level 1 is a light haze
         and reports as 100% covered; a field at level 7 with a body cut out of
         it in reserve also reports as ~99% covered, and one of those is a
         blackout while the other is the best frame in film 14.
         So the flag is decided by EDGES — cells whose level differs from a
         neighbour by 3 or more. That is a direct measure of whether anything
         is drawn, and it does not care whether the subject is ink on paper or
         paper cut out of ink. Coverage and mean level are still reported,
         because they say useful things about the frame; they just no longer
         get a vote. */
      const cov = await page.evaluate((tt) => {
        window.__hw.seek(tt);
        const f = window.__hw.runtime.renderField(tt);
        const W = 192, H = 144;
        let ink = 0, sum = 0, edges = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const q = y * W + x, v = Math.min(7, f[q]);
          if (v > 0.5) ink++;
          sum += v;
          if (x + 1 < W && Math.abs(v - Math.min(7, f[q + 1])) >= 3) edges++;
          if (y + 1 < H && Math.abs(v - Math.min(7, f[q + W])) >= 3) edges++;
        }
        return { c: ink / f.length, m: sum / f.length, e: edges / f.length };
      }, t);
      await page.waitForTimeout(90);
      const tag = `${n}-m${String(i).padStart(2, "0")}` + (SWEEP ? `-u${Math.round(at * 100)}` : "");
      await page.locator("#stage").screenshot({ path: path.join(OUT, tag + ".png") });
      covs.push(cov);
    }
    const flag = covs.some(c => c.e < 0.0015) ? " <<< NO PICTURE" : "";
    if (flag) bad++;
    const shown = covs.map(c => `${(c.c * 100).toFixed(0).padStart(3)}%/${c.m.toFixed(1)}/${(c.e * 100).toFixed(1)}`).join("  ");
    console.log(`   m${i} ${info.labels[i].padEnd(24)} ${shown}${flag}`);
  }
}
await browser.close();
console.log(MOTION
  ? (bad ? `\n${bad} movement(s) flagged — they are photographs, and long ones.`
         : "\nevery movement moves.")
  : (bad ? `\n${bad} frame(s) flagged — look at them.` : "\nno frame flagged empty or solid."));
