/* ============================================================
   render-strip.mjs — drives harness/strip-harness.html and writes
   renders/strip__<id>.png: one row per motion, eight frames across one cycle.

   Usage:  node harness/render-strip.mjs assets/character/mara.mjs [...]
           node harness/render-strip.mjs assets/creature/oldbutterfly.mjs --state closed
   ============================================================ */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RENDERS = resolve(ROOT, "renders");
if (!existsSync(RENDERS)) mkdirSync(RENDERS, { recursive: true });
const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript",
               ".json": "application/json", ".png": "image/png", ".css": "text/css" };

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

const args = process.argv.slice(2);
const state = args.includes("--state") ? args[args.indexOf("--state") + 1] : "";
const files = args.filter(a => a.endsWith(".mjs"));

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on("console", m => { if (m.type() === "error") console.error("  [page]", m.text()); });

for (const rel of files) {
  const url = `http://127.0.0.1:${port}/harness/strip-harness.html?mod=/${rel}${state ? `&state=${state}` : ""}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction("window.__DONE__===true", { timeout: 30000 }).catch(() => {});
  const r = await page.evaluate("window.__RESULT__ || {ok:false,errors:['no result']}");
  const id = rel.split("/").pop().replace(/\.mjs$/, "");
  if (r.dataURL) {
    const png = resolve(RENDERS, `strip__${id}${state ? "__" + state : ""}.png`);
    writeFileSync(png, Buffer.from(r.dataURL.split(",")[1], "base64"));
    console.error(`[${r.ok ? "OK  " : "FAIL"}] ${rel}  motions: ${(r.motions || []).join(", ")}  -> ${relative(ROOT, png)}`);
  } else {
    console.error(`[FAIL] ${rel}  ${(r.errors || []).join(" | ")}`);
  }
}
await browser.close(); srv.close();
