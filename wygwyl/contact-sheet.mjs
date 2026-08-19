#!/usr/bin/env node
/* ============================================================================
   contact-sheet.mjs — the whole suite on one page.

   A film gets looked at a frame at a time and judged a reel at a time. Fourteen
   films is eighty movements, and the thing you cannot see by opening them one
   after another is whether they belong to each other: whether the ink weight
   holds, whether two films have accidentally made the same picture, whether one
   of them is carrying half the frame in blank paper.

     node wygwyl/contact-sheet.mjs           → renders/wygwyl/CONTACT.png
     node wygwyl/contact-sheet.mjs --at 0.2  → sample each movement at u=0.2

   One cell per movement, in running order, labelled. Title cards are skipped:
   fourteen identical black rectangles say nothing about the films behind them.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "renders", "wygwyl");
fs.mkdirSync(OUT, { recursive: true });
const PORT = +(process.env.PORT || 8181);
const argv = process.argv.slice(2);
const AT = +((argv[argv.indexOf("--at") + 1]) || 0.5) || 0.5;

const CW = 288, CH = 216, PAD = 3, LABEL = 15, COLS = 8;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
page.on("pageerror", e => console.error("page error: " + e.message));

await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });

const cells = await page.evaluate((at) => {
  const out = [];
  for (const f of window.__hw.films) {
    for (let i = 1; i < f.rt.movements.length; i++) {           // skip the title card
      out.push({ n: f.world.n, label: f.rt.movements[i].label,
                 t: f.start + f.rt.starts[i] + f.rt.movements[i].seconds * at });
    }
  }
  return out;
}, AT);
console.log(`${cells.length} movements across ${new Set(cells.map(c => c.n)).size} films`);

/* Every cell is drawn by the page itself, into an offscreen canvas at contact
   size, so the sheet is made of the same halftone the film is made of rather
   than a downscale of a screenshot — a resampled halftone is a moiré. */
const png = await page.evaluate(async ({ cells, CW, CH, PAD, LABEL, COLS }) => {
  const { makePost } = await import("./halfworld.mjs");
  const rows = Math.ceil(cells.length / COLS);
  const sheet = document.createElement("canvas");
  sheet.width = COLS * (CW + PAD) + PAD;
  sheet.height = rows * (CH + LABEL + PAD) + PAD + 34;
  const g = sheet.getContext("2d");
  g.fillStyle = "#f2efe6"; g.fillRect(0, 0, sheet.width, sheet.height);
  g.fillStyle = "#161513";
  g.font = "900 18px ui-monospace, Menlo, monospace";
  g.fillText("WYGWYL · WHERE YOU GO WHEN YOU LEAVE · " + cells.length + " MOVEMENTS", PAD + 2, 23);

  const cell = document.createElement("canvas");
  cell.style.width = CW + "px"; cell.style.height = CH + "px";
  const post = makePost(cell, "#5aa7ff");
  post.fit(CW, CH, 1);

  for (let k = 0; k < cells.length; k++) {
    const c = cells[k];
    const f = window.__hw.films.find(x => x.world.n === c.n);
    post.draw(f.rt.renderField(c.t - f.start));
    const x = PAD + (k % COLS) * (CW + PAD);
    const y = 34 + PAD + Math.floor(k / COLS) * (CH + LABEL + PAD);
    g.drawImage(cell, x, y);
    g.strokeStyle = "#c6bcab"; g.lineWidth = 1;
    g.strokeRect(x + .5, y + .5, CW - 1, CH - 1);
    g.fillStyle = "#161513";
    g.font = "700 10px ui-monospace, Menlo, monospace";
    g.fillText(c.n + " " + c.label.slice(0, 30), x + 1, y + CH + 11);
  }
  return sheet.toDataURL("image/png");
}, { cells, CW, CH, PAD, LABEL, COLS });

fs.writeFileSync(path.join(OUT, "CONTACT.png"), Buffer.from(png.split(",")[1], "base64"));
await browser.close();
const mb = (fs.statSync(path.join(OUT, "CONTACT.png")).size / 1e6).toFixed(1);
console.log(`→ renders/wygwyl/CONTACT.png  ${mb} MB  (sampled at u=${AT})`);
