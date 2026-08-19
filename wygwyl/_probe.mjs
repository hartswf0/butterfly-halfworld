import { chromium } from "playwright";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
page.on("pageerror", e => console.log("!! PAGE ERROR:", e.message));
await page.goto("http://127.0.0.1:8181/wygwyl/_test/harness.html", { waitUntil: "load" });
await page.waitForFunction(() => window.__t, null, { timeout: 10000 });

async function shot(frame, opts, name) {
  await page.evaluate((f) => window.__t.load("frames/" + f), frame);
  await page.evaluate((o) => window.__t.render(o), opts);
  await page.screenshot({ path: `/home/user/butterfly-halfworld/renders/wygwyl/dj-${name}.png` });
  console.log("shot", name);
}

// figure-readability sweep on poet close-up (f24)
await shot("f24.png", { channel:"luma", black:0.02, white:0.85, tone:"invert", dither:"bayer" }, "01-f24-default");
await shot("f24.png", { channel:"luma", black:0.0, white:0.32, tone:"invert", dither:"bayer" }, "02-f24-open-shadows");
await shot("f24.png", { channel:"luma", black:0.0, white:0.20, tone:"invert", dither:"bayer" }, "03-f24-open-more");
await shot("f24.png", { channel:"luma", black:0.0, white:0.20, tone:"gamma", gamma:0.6, dither:"bayer" }, "04-f24-gamma-noinvert");
await shot("f24.png", { channel:"g", black:0.0, white:0.30, tone:"invert", dither:"bayer" }, "05-f24-green-channel");
await shot("f24.png", { channel:"chroma", chromaHue:165, chromaTol:55, black:0.0, white:0.7, tone:"linear", dither:"bayer" }, "06-f24-chroma");

await browser.close();
console.log("done");
