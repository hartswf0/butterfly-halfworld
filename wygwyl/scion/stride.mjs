#!/usr/bin/env node
/* ============================================================================
   stride.mjs — HOW FAR A FOOT ACTUALLY TRAVELS.

     node wygwyl/scion/stride.mjs                  the probe lane of zz-tread
     node wygwyl/scion/stride.mjs --world zz-tread --mv 3 --n 64

   The ground contract needs one number: the screen-space excursion of a foot
   across one gait cycle. figure.mjs says the foot sits at sin(q)*stride with
   stride = 0.15h — but it also foreshortens the sagittal span by `turn`, and
   between that number and a dot on a 192x144 lattice there is quantisation,
   a foot that rolls, and a heel that is not the same cell as a toe.

   Deriving the constant from the source gave a phase rule that cut skating
   from 0.60 to 0.40 and not to zero, which is the signature of a right shape
   with a wrong scale. So this stops reading the source and measures the
   picture: stand the body still, sweep one cycle, and watch where the feet go.
   ========================================================================= */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const PORT = +(process.env.PORT || 8181);
const WORLD = opt("world", "zz-tread");
const MV = +opt("mv", 3);
const N = +opt("n", 64);

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("page error: " + e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/${WORLD}.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });

const rows = await page.evaluate(([mv, n]) => {
  const FW = 192, FH = 144;
  const R = window.__hw.runtime;
  const t0 = R.starts[mv], dur = R.movements[mv].seconds;
  const out = [];
  for (let k = 0; k < n; k++) {
    const u = (k + 0.5) / n;
    const ids = new Float32Array(FW * FH);
    const r = R.renderScene(t0 + u * dur, ids);
    if (r.mixing) continue;
    const c = r.cast.slice().sort((a, b) => b.height - a.height)[0];
    if (!c) continue;
    const cells = [];
    let y1 = -1;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const i = y * FW + x;
      if (ids[i] === c.tag && r.levels[i] >= 0.45) { cells.push(x, y); if (y > y1) y1 = y; }
    }
    if (!cells.length) continue;
    /* the feet: the bottom two rows of the body's own ink, clustered on a gap */
    const fx = [];
    for (let i = 0; i < cells.length; i += 2) if (cells[i + 1] >= y1 - 1) fx.push(cells[i]);
    fx.sort((a, b) => a - b);
    const g = [];
    for (const x of fx) { const last = g[g.length - 1];
      if (!last || x - last[last.length - 1] > 2) g.push([x]); else last.push(x); }
    out.push({ u: +u.toFixed(4), phase: +u.toFixed(4), anchor: c.foot[0], h: c.height,
      feet: g.map(a => +(a.reduce((p, q) => p + q, 0) / a.length).toFixed(2)) });
  }
  return out;
}, [MV, N]);
await browser.close();

if (argv.includes("--raw")) {
  console.log("    u   anchor   feet (world cells)            foot - anchor");
  let prev = null;
  for (const r of rows) {
    const rel = r.feet.map(f => (f - r.anchor).toFixed(2).padStart(6));
    let held = "";
    if (prev) {
      let best = Infinity;
      for (const b of r.feet) for (const a of prev.feet) best = Math.min(best, Math.abs(b - a));
      held = `   body +${(r.anchor - prev.anchor).toFixed(2).padStart(5)}   nearest foot moved ${best.toFixed(2).padStart(5)}`;
    }
    console.log(`  ${r.u.toFixed(3)}  ${r.anchor.toFixed(2).padStart(6)}   ${r.feet.map(f => f.toFixed(2).padStart(7)).join("")}   ${rel.join("")}${held}`);
    prev = r;
  }
  console.log();
}
const all = rows.flatMap(r => r.feet.map(f => f - r.anchor));
const lo = Math.min(...all), hi = Math.max(...all);
const h = rows[0]?.h || 0;
console.log(`${rows.length} samples · body height ${h} cells · anchor x ${rows[0]?.anchor}`);
console.log(`foot excursion about the anchor: ${lo.toFixed(2)} … ${hi.toFixed(2)} cells`);
console.log(`  peak-to-peak            ${(hi - lo).toFixed(2)} cells`);
console.log(`  amplitude (half of that) ${((hi - lo) / 2).toFixed(2)} cells = ${((hi - lo) / 2 / h).toFixed(4)} h`);
console.log(`  figure.mjs's nominal     ${(0.15 * h).toFixed(2)} cells = 0.1500 h`);
console.log(`  measured / nominal       ${((hi - lo) / 2 / (0.15 * h)).toFixed(4)}`);
console.log(`\nTHE CONTRACT: a foot is pinned when the body advances 2x the amplitude`);
console.log(`per half cycle, so  phase = (x - x0) / (4 * amplitude) = (x - x0) / ${(4 * (hi - lo) / 2).toFixed(2)}`);
console.log(`  as a multiple of h:  phase = (x - x0) / (${((4 * (hi - lo) / 2) / h).toFixed(4)} * h)`);
