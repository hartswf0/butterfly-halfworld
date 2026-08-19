#!/usr/bin/env node
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = "/home/user/butterfly-halfworld/renders/wygwyl";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 8181;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.log("  !! PAGE ERROR: " + e.message));
page.on("console", m => { if (m.type() === "error" && !m.text().includes("404")) console.log("  !! CONSOLE: " + m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/wygwyl/01b-out-of-life-blend.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 10000 });
await page.waitForTimeout(1200);

const info = await page.evaluate(() => ({
  total: window.__hw.runtime.total,
  labels: window.__hw.runtime.movements.map(m => m.label),
  starts: window.__hw.runtime.starts,
  footageUsable: window.__hw.footageUsable,
}));
console.log("movements:", info.labels.join(" | "));
console.log("starts:", info.starts.map(s => s.toFixed(2)).join(" "), " total:", info.total.toFixed(2));
console.log("footageUsable:", info.footageUsable);

const AT = [0.08, 0.3, 0.5, 0.7, 0.92];
for (let i = 1; i < info.labels.length; i++) {
  const span = i + 1 < info.starts.length ? info.starts[i + 1] - info.starts[i] : info.total - info.starts[i];
  for (const at of AT) {
    const t = info.starts[i] + span * at;
    await page.evaluate((tt) => { window.__hw.seek(tt); }, t);
    await page.waitForTimeout(100);
    const tag = `01b-m${String(i).padStart(2, "0")}-u${Math.round(at * 100)}`;
    await page.locator("#stage").screenshot({ path: path.join(OUT, tag + ".png") });
    console.log("shot", tag, "t=" + t.toFixed(2));
  }
}
await browser.close();
