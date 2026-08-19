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
const only = args.filter(a => !a.startsWith("--"));
const AT = SWEEP ? [0.2, 0.5, 0.8] : [0.55];

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
    const span = i + 1 < info.starts.length ? info.starts[i + 1] - info.starts[i]
                                            : info.total - info.starts[i];
    const covs = [];
    for (const at of AT) {
      const t = info.starts[i] + span * at;
      /* Coverage alone lies. A field entirely at level 1 is a light haze and
         reads as 100% "covered"; a field entirely at level 7 is a blackout.
         So carry the mean level too, and only call something SOLID when the
         ink is both everywhere and dark. */
      const cov = await page.evaluate((tt) => {
        window.__hw.seek(tt);
        const f = window.__hw.runtime.renderField(tt);
        let ink = 0, sum = 0;
        for (let k = 0; k < f.length; k++) { if (f[k] > 0.5) ink++; sum += Math.min(7, f[k]); }
        return { c: ink / f.length, m: sum / f.length };
      }, t);
      await page.waitForTimeout(90);
      const tag = `${n}-m${String(i).padStart(2, "0")}` + (SWEEP ? `-u${Math.round(at * 100)}` : "");
      await page.locator("#stage").screenshot({ path: path.join(OUT, tag + ".png") });
      covs.push(cov);
    }
    /* The title card is ink-flooded on purpose — white carved out of black —
       so it is exempt from the SOLID flag rather than reported every run. */
    const flag = covs.some(c => c.c < 0.012) ? " <<< EMPTY"
      : (i > 0 && covs.some(c => c.c > 0.93 && c.m > 5.5)) ? " <<< SOLID" : "";
    if (flag) bad++;
    const shown = covs.map(c => `${(c.c * 100).toFixed(0).padStart(3)}%/${c.m.toFixed(1)}`).join(" ");
    console.log(`   m${i} ${info.labels[i].padEnd(24)} ${shown}${flag}`);
  }
}
await browser.close();
console.log(bad ? `\n${bad} frame(s) flagged — look at them.` : "\nno frame flagged empty or solid.");
