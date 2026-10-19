#!/usr/bin/env node
/* ============================================================================
   tracks.mjs — THE PICTURE OF A SKATING FOOT.

     node wygwyl/scion/tracks.mjs                 → renders/scion/tracks.html

   A foot that skates is invisible in a frame and nearly invisible at speed —
   it reads as "goofy" and nobody can say why. It is completely obvious in one
   drawing: plot each foot's WORLD position against time.

     a planted foot draws a flat step, then jumps a stride to the next step
     a skating foot draws a smooth diagonal, parallel to the body

   The body's own line is drawn underneath. A correct walk is a staircase
   climbing beside a ramp; a skating walk is two parallel ramps. This is the
   same data GATE 3 reduces to one number, with the reduction undone, because
   a number tells you that something is wrong and a staircase tells you what.
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
const WORLD = opt("world", "zz-tread");
const N = +opt("n", 520);
/* A WINDOW, BECAUSE THE WHOLE WALK IS TOO SMALL TO READ. Plotting 150 cells of
   travel across 480 pixels makes one stride 38px and one plant 21px — present,
   and far too small to see the thing the drawing exists to show. Three cycles
   fill the frame instead. The first version of this page was technically
   correct and showed nothing, which is its own kind of wrong. */
const FROM = +opt("from", 0.26), TO = +opt("to", 0.42);
const OUT = path.join(ROOT, "renders", "scion");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("page error: " + e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/${WORLD}.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });

await page.evaluate(([a, b]) => { window.__from = a; window.__to = b; }, [FROM, TO]);
const lanes = await page.evaluate((n) => {
  const FW = 192, FH = 144;
  const R = window.__hw.runtime;
  return R.movements.map((m, mi) => {
    const rows = [];
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n;
      const ids = new Float32Array(FW * FH);
      const r = R.renderScene(R.starts[mi] + u * m.seconds, ids);
      if (r.mixing) continue;
      const c = r.cast.slice().sort((a, b) => b.height - a.height)[0];
      if (!c) continue;
      let y1 = -1; const cells = [];
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const i = y * FW + x;
        if (ids[i] === c.tag && r.levels[i] >= 0.45) { cells.push(x, y); if (y > y1) y1 = y; }
      }
      if (!cells.length) continue;
      const fx = [];
      for (let i = 0; i < cells.length; i += 2) if (cells[i + 1] >= y1 - 1) fx.push(cells[i]);
      fx.sort((a, b) => a - b);
      const g = [];
      for (const x of fx) { const L = g[g.length - 1];
        if (!L || x - L[L.length - 1] > 2) g.push([x]); else L.push(x); }
      if (u < window.__from || u > window.__to) continue;
      rows.push({ u, anchor: c.foot[0],
        feet: g.map(a => a.reduce((p, q) => p + q, 0) / a.length) });
    }
    return { label: m.label, rows };
  });
}, N);
await browser.close();

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const W = 560, H = 300, PAD = 42;

/* each lane: time down the page, world x across it */
function plot(lane) {
  const rows = lane.rows;
  if (rows.length < 3) return `<figure><figcaption>${esc(lane.label)} — no body</figcaption></figure>`;
  const xs = rows.flatMap(r => [r.anchor, ...r.feet]);
  const lo = Math.min(...xs), hi = Math.max(...xs);
  const X = (v) => PAD + (v - lo) / Math.max(1e-6, hi - lo) * (W - PAD * 2);
  const u0 = rows[0].u, u1 = rows[rows.length - 1].u;
  const Y = (u) => PAD * 0.6 + (u - u0) / Math.max(1e-9, u1 - u0) * (H - PAD * 1.4);
  const body = rows.map(r => `${X(r.anchor).toFixed(1)},${Y(r.u).toFixed(1)}`).join(" ");
  /* every foot sample as a dot; a planted foot stacks them into a vertical bar */
  const dots = rows.flatMap(r => r.feet.map(f =>
    `<circle cx="${X(f).toFixed(1)}" cy="${Y(r.u).toFixed(1)}" r="2.6"/>`)).join("");
  return `<figure>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="foot world position against time for ${esc(lane.label)}">
    <rect width="${W}" height="${H}" fill="var(--plot)"/>
    <polyline points="${body}" fill="none" stroke="var(--body)" stroke-width="3" stroke-dasharray="7 5"/>
    <g fill="var(--foot)">${dots}</g>
    <text x="${PAD}" y="${H - 12}" class="ax">world x →</text>
    <text x="8" y="${PAD * 0.6 + 4}" class="ax">t</text>
    <text x="8" y="${H - PAD * 0.8}" class="ax">↓</text>
  </svg>
  <figcaption>${esc(lane.label)}<br><span class="k">${rows.length} samples · world x spans ${(hi - lo).toFixed(0)} cells</span></figcaption></figure>`;
}

const html = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Foot Tracks</title>
<style>
:root{color-scheme:dark;--bg:#0b0410;--paper:#f6e7c8;--dim:#8d6a70;--hot:#f2a03c;--edge:#2a1220;
  --plot:#140718;--body:#9d6f82;--foot:#f2a03c}
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--bg);color:var(--paper);font:13px/1.6 ui-monospace,Menlo,monospace;
  padding-inline:20px;padding-block:22px 48px}
h1{font-size:15px;letter-spacing:.26em;color:var(--hot);margin:0 0 6px}
p{max-width:74ch;color:var(--paper)}
.k{color:var(--dim)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:14px;margin-top:20px}
figure{margin:0;border:1px solid var(--edge);background:#00000038;padding:9px;min-width:0}
svg{display:block;width:100%;height:auto}
figcaption{margin-top:7px;font-size:11.5px;color:var(--hot);letter-spacing:.04em}
.ax{fill:var(--dim);font:10px ui-monospace,Menlo,monospace}
.key{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-size:11.5px;color:var(--dim)}
.key b{color:var(--paper);font-weight:400}
</style>
<h1>FOOT TRACKS</h1>
<p>Each foot's <b>world</b> position, plotted against time running down the page. The dashed line is
the body. A planted foot stacks its samples into a <b>vertical bar</b> and then jumps a stride to the
next one — a staircase beside a ramp. A skating foot never stacks: it draws a second ramp parallel to
the body, which is what every walking shot in this suite was doing. Showing a window of the walk, not all of it: at full extent one stride is a few pixels.</p>
<div class="key"><span><b>⸺ ⸺</b> the body's anchor</span><span style="color:var(--hot)"><b>•</b> a foot, one dot per sample</span></div>
<div class="grid">${lanes.map(plot).join("")}</div>`;
fs.writeFileSync(path.join(OUT, "tracks.html"), html);
console.log(`${lanes.length} lanes · ${lanes.map(l => l.rows.length).join(", ")} samples`);
console.log(`→ renders/scion/tracks.html`);
