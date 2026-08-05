#!/usr/bin/env node
/* ============================================================================
   serve.mjs — a static server, because ES modules will not load from file://

   periodic.html imports the film's actual modules. A browser refuses to import
   an ES module over the file: protocol, so opening the page by double-clicking
   it gets you a blank screen and a CORS error. That is the whole reason this
   exists; there is no build step and nothing is bundled.

     node harness/serve.mjs          → http://127.0.0.1:8181/periodic.html
     node harness/serve.mjs 9000     → pick a port
   ========================================================================= */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, normalize, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = +(process.argv[2] || 8181);
const MIME = {
  ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif",
  ".webm": "video/webm", ".mp4": "video/mp4", ".wav": "audio/wav",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || "/").split("?")[0]);
    if (p === "/") p = "/periodic.html";
    /* keep the server inside the repo: a path that normalises above ROOT is a
       directory-traversal attempt, and a dev server is still a server. */
    const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ""));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end("outside the repo"); return; }
    const s = await stat(file);
    if (s.isDirectory()) { res.writeHead(404).end("not found"); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "content-length": body.length,
      "cache-control": "no-cache",       // the point is that editing a module reloads
      "accept-ranges": "bytes",
    });
    res.end(body);
  } catch { res.writeHead(404).end("not found"); }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`\n  I REMEMBER BEING A BUTTERFLY — the atlas\n`);
  console.log(`  http://127.0.0.1:${PORT}/periodic.html    the periodic table`);
  console.log(`  http://127.0.0.1:${PORT}/butterfly-chat.html   the memory chat`);
  console.log(`\n  serving ${ROOT}\n  ctrl-c to stop\n`);
});
