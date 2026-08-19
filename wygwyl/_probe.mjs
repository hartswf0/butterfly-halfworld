import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on("pageerror", e => console.log("!! PAGE ERROR:", e.message));
page.on("response", r => console.log("HTTP", r.status(), r.url()));
page.on("requestfailed", r => console.log("!! REQ FAILED:", r.url(), r.failure()?.errorText));
await page.goto("http://127.0.0.1:8181/wygwyl/dj.html", { waitUntil: "load" });
await page.waitForTimeout(2500);
await browser.close();
