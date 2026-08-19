import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
page.on("pageerror", e => console.log("!! PAGE ERROR:", e.message));
await page.goto("http://127.0.0.1:8181/wygwyl/_test/harness.html", { waitUntil: "load" });
await page.waitForFunction(() => window.__t, null, { timeout: 10000 });

async function shot(frame, opts, name) {
  await page.evaluate((f) => window.__t.load("frames/" + f), frame);
  await page.evaluate((o) => window.__t.render(o), opts);
  const s = await page.evaluate(() => window.__t.stats());
  await page.screenshot({ path: `/home/user/butterfly-halfworld/renders/wygwyl/dj-${name}.png` });
  console.log("shot", name, "mean", s.mean.toFixed(2), "hist", s.hist.join(","));
}

await shot("f24.png", { channel:"luma", black:0.02, white:0.85, tone:"invert", dither:"bayer" }, "20-f24-default-fixed");
await shot("f24.png", { channel:"luma", black:0.0, white:0.35, tone:"invert", dither:"bayer" }, "21-f24-invert-tuned");
await shot("f24.png", { channel:"luma", black:0.0, white:0.5, tone:"invert", dither:"bayer" }, "22-f24-invert-tuned2");
await browser.close();
console.log("done");
