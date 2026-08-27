#!/usr/bin/env node
/* ============================================================================
   listen.mjs — THE INSTRUMENT THAT STANDS IN FOR EARS.

     node wygwyl/deep/listen.mjs                       imzad, ICON, 16s
     node wygwyl/deep/listen.mjs gabay music 22        one station, one law
     node wygwyl/deep/listen.mjs kabary icon 20        and its fidelity

   Nobody building these pages can hear them, and "it seems to work" is not a
   claim. So the page publishes what it is doing — `window.__sketchradio` — and
   this drives a real browser, plays a station for a while, and reports the
   numbers: how open the gate ran, how loud the output got, what window the
   analyser settled on, and the correlation between what was drawn and what
   came back out of the transform.

   Every real finding in this part of the project came out of this loop rather
   than out of reading. Two of them reversed a decision that had been reasoned
   carefully and confidently in the wrong direction.
   ========================================================================= */
import { chromium } from "playwright";
const [engine, bank, secs] = [process.argv[2] || "imzad", process.argv[3] || "icon", +(process.argv[4] || 16)];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--autoplay-policy=no-user-gesture-required"] });
const p = await b.newPage({ viewport: { width: 1400, height: 980 } });
const errs = []; p.on("pageerror", e => errs.push(e.message.split("\n")[0]));
p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 110)); });
await p.goto("http://127.0.0.1:8181/wygwyl/sketch-radio.html", { waitUntil: "load" });
await p.waitForTimeout(900);
await p.selectOption("#bank", bank);
await p.selectOption("#engine", engine);
await p.waitForTimeout(200);
await p.click("#play");
const t0 = Date.now(); let best = null;
while (Date.now() - t0 < secs * 1000) {
  const s = await p.evaluate(() => window.__sketchradio);
  if (s?.fidelity !== null && s?.fidelity !== undefined) best = s;
  await p.waitForTimeout(250);
}
await p.screenshot({ path: "/tmp/claude-0/-home-user-butterfly-halfworld/859be15e-8e84-5422-8ba9-e33a36eb6e97/scratchpad/sketch-radio.png" });
await b.close();
console.log(`${engine.padEnd(10)} ${bank.padEnd(6)} bands ${String(best?.bands).padStart(3)}  sweep ${best?.sweep.toFixed(1)}  out ${best?.lvl.toFixed(3)}  FIDELITY ${best?.fidelity?.toFixed(3)}`);
if (errs.length) console.log("ERRORS:", errs.slice(0, 3).join(" | "));
