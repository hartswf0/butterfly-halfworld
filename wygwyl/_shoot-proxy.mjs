#!/usr/bin/env node
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
const OUT = "/home/user/butterfly-halfworld/renders/wygwyl";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 8181;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 990, height: 750 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.log("!! PAGE ERROR", e.message));
page.on("console", m => { if (m.type() === "error") console.log("!! CONSOLE", m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/_dj-proxy.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__ready, null, { timeout: 10000 });

const cases = [
  // [tag, movIdx, u, segIdx, frame]
  ["m1-segA-fog",       1, 0.15, 0, "_test-frames/t8.png"],
  ["m1-segB-room",      1, 0.70, 1, "_test-frames/t20_48.png"],
  ["m1-segB-titlefade", 1, 0.42, 1, "_test-frames/t14_0.png"],
  ["m2-segA-haze",      2, 0.10, 0, "_test-frames/t31.png"],
  ["m2-segB-turned",    2, 0.32, 1, "_test-frames/t37.png"],
  ["m2-segC-tv",        2, 0.55, 2, "_test-frames/t43.png"],
  ["m2-segD-kitchen",   2, 0.85, 3, "_test-frames/t50.png"],
  ["m3-seg1-roof",      3, 0.15, 0, "_test-frames/t58.png"],
  ["m3-seg2-warp",      3, 0.50, 1, "_test-frames/t66.png"],
  ["m3-seg3-kaleido",   3, 0.85, 2, "_test-frames/t73.png"],
  ["m4-early",          4, 0.30, 0, "_test-frames/t80.png"],
  ["m4-late",           4, 0.70, 0, "_test-frames/t85.png"],
];

for (const [tag, movIdx, u, segIdx, frame] of cases) {
  const info = await page.evaluate(([movIdx, u, segIdx, frame]) =>
    window.__proxy.render(movIdx, u, segIdx, frame), [movIdx, u, segIdx, `./${frame}`]);
  await page.waitForTimeout(60);
  await page.locator("#stage").screenshot({ path: path.join(OUT, `01b-proxy-${tag}.png`) });
  console.log(tag, JSON.stringify(info));
}
await browser.close();
