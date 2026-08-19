#!/usr/bin/env node
/* ============================================================================
   shoot.mjs — LOOK AT THE PICTURE.

   Law 5 of the butterfly halfworld: every serious defect produced a plausible
   picture, and every one was caught by looking at an image rather than by a
   test. So this renders each world at real timestamps and writes PNGs, and it
   also reports the INK COVERAGE of each frame — a frame that is 0% or 96% ink
   is a bug the eye can miss in a contact sheet but a number cannot.

     node wygwyl/shoot.mjs                 all worlds, 4 frames each
     node wygwyl/shoot.mjs 01 07           only these
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "renders", "wygwyl");
fs.mkdirSync(OUT, { recursive: true });
const PORT = +(process.env.PORT || 8181);
const only = process.argv.slice(2);

const shells = fs.readdirSync(HERE).filter(f => /^\d\d-.*\.html$/.test(f)).sort()
  .filter(f => !only.length || only.includes(f.slice(0, 2)));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.log("  !! PAGE ERROR: " + e.message));
page.on("console", m => { if (m.type() === "error") console.log("  !! CONSOLE: " + m.text()); });

let bad = 0;
for (const shell of shells) {
  const n = shell.slice(0, 2);
  await page.goto(`http://127.0.0.1:${PORT}/wygwyl/${shell}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__hw, null, { timeout: 10000 });
  const info = await page.evaluate(() => ({
    total: window.__hw.runtime.total,
    labels: window.__hw.runtime.movements.map(m => m.label),
    starts: window.__hw.runtime.starts,
  }));
  console.log(`${n} · ${info.labels.length} movements · ${info.total.toFixed(0)}s`);
  for (let i = 0; i < info.labels.length; i++) {
    const t = info.starts[i] + (info.total / info.labels.length) * 0.0 +
      (i + 1 < info.starts.length ? info.starts[i + 1] - info.starts[i] : 5) * 0.55;
    const cov = await page.evaluate((tt) => {
      window.__hw.seek(tt);
      const f = window.__hw.runtime.renderField(tt);
      let ink = 0; for (let k = 0; k < f.length; k++) if (f[k] > 0.5) ink++;
      return ink / f.length;
    }, t);
    await page.waitForTimeout(90);
    const tag = `${n}-m${String(i).padStart(2, "0")}`;
    await page.locator("#stage").screenshot({ path: path.join(OUT, tag + ".png") });
    const flag = cov < 0.012 ? " <<< EMPTY" : cov > 0.93 ? " <<< SOLID" : "";
    if (flag) bad++;
    console.log(`   m${i} ${info.labels[i].padEnd(24)} ink ${(cov * 100).toFixed(1).padStart(5)}%${flag}`);
  }
}
await browser.close();
console.log(bad ? `\n${bad} frame(s) flagged — look at them.` : "\nno frame flagged empty or solid.");
