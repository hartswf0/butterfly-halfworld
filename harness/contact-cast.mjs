/* Drives harness/contact-cast.html and writes renders/_contact-cast.png */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RENDERS = resolve(ROOT, "renders");
if (!existsSync(RENDERS)) mkdirSync(RENDERS, { recursive: true });
const MIME = { ".html":"text/html", ".mjs":"text/javascript", ".js":"text/javascript",
               ".json":"application/json", ".png":"image/png", ".css":"text/css" };

const srv = createServer(async (req, resp) => {
  try {
    const p = decodeURIComponent(req.url.split("?")[0]);
    const f = resolve(ROOT, "." + p);
    if (!f.startsWith(ROOT)) { resp.writeHead(403); return resp.end(); }
    const body = await readFile(f);
    resp.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    resp.end(body);
  } catch (e) { resp.writeHead(404); resp.end("404 " + e.message); }
});
await new Promise(r => srv.listen(0, "127.0.0.1", r));
const port = srv.address().port;
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on("console", m => { if (m.type() === "error") console.error("  [page]", m.text()); });
await page.goto(`http://127.0.0.1:${port}/harness/contact-cast.html`, { waitUntil: "load" });
await page.waitForFunction("window.__DONE__===true", { timeout: 40000 }).catch(() => {});
const r = await page.evaluate("window.__RESULT__ || {ok:false,errors:['no result']}");
if (r.dataURL) {
  const png = resolve(RENDERS, "_contact-cast.png");
  writeFileSync(png, Buffer.from(r.dataURL.split(",")[1], "base64"));
  console.error("wrote", png);
}
console.error(JSON.stringify({ ok: r.ok, errors: r.errors, names: r.names }));
await browser.close(); srv.close();
