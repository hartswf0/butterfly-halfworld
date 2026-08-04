/* ============================================================================
   render-motion.mjs · butterfly-halfworld — THE ANIMATION RENDERER

   The sibling world renders stills. This world does not hold still, and its
   central images (a difference-between-states, an accumulation, a wavefront)
   do not exist in any single frame. So the unit of delivery here is a LOOP.

   Usage:
     node harness/render-motion.mjs scenes/BF-01.mjs            one scene
     node harness/render-motion.mjs --all                       every scene
     node harness/render-motion.mjs scenes/BF-01.mjs --contact  + contact sheet
     node harness/render-motion.mjs scenes/BF-01.mjs --keep     keep the PNGs

   Flags: --fps 12  --pipeline MESH  --w 1120 --h 760 --dpr 1  --nocard
          --step N (contact sheet: every Nth frame)  --contact-only

   Same skeleton as harness/render-scene.mjs: serve the project over http (real
   module origin), drive one Chromium page via Playwright, read pixels back.
   The page stays loaded for the whole sequence; see render-motion-harness.html.

   ---------------------------------------------------------------------------
   THE ONE DETAIL THAT DECIDES WHETHER THE LOOP WORKS

       u = i / frames          NOT i / (frames - 1)

   A cycle's frames are the SAMPLES OF AN INTERVAL, not the endpoints of a
   span. The last frame must sit one step BEFORE returning to frame 0, because
   the frame after the last one IS frame 0 — the player supplies it. Divide by
   (frames - 1) and frame n-1 lands exactly on u = 1.0, which is the same state
   as u = 0.0: the loop then holds frame 0 twice and stutters once per
   revolution, forever, in a way that is very hard to see in a still and
   impossible to un-see in motion.

   Step 5 below is the instrument that catches this: it compares the last frame
   to frame 0 and prints the difference. A seamless cycle differs by roughly
   one frame's worth of change (ratio ~1.0 against the mean adjacent step);
   ~0% means a duplicated frame; wildly more means a discontinuity.

   The instrument is falsifiable: `--endpoint-bug` reruns the same scene with
   the wrong divisor. On BF-01 the ratio drops from 0.976 to 0.083 and the
   verdict flips to DUPLICATE FRAME. Run it if you ever doubt the number.
   (0.083 rather than 0.000 because BF-01 is an OPEN cycle: with the wrong
   divisor the last frame lands on u=1.0, which is frame 0 plus one full
   revolution of wear. The residue is the wear. That is a good sign — the
   instrument is measuring the drawing, not the arithmetic.)
   ========================================================================= */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, resolve, extname, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT   = resolve(__dirname, "..");
const OUT    = resolve(ROOT, "renders/motion");
const MIME = { ".html":"text/html", ".mjs":"text/javascript", ".js":"text/javascript",
               ".json":"application/json", ".png":"image/png", ".css":"text/css" };

/* ---------------------------------------------------------------- ffmpeg ---
   The brief names /Users/gaia/anaconda3/bin/ffmpeg. That build (4.3.2,
   conda-forge) has NO libvpx — `-encoders` lists gif and libx264 and nothing
   else usable here — so it physically cannot write the VP9 webm this file is
   required to produce. Rather than hard-code a path that silently degrades,
   probe the candidates and pick the first that can actually encode VP9. */
const FFMPEG_CANDIDATES = [
  process.env.FFMPEG,
  "/Users/gaia/anaconda3/bin/ffmpeg",
  "/opt/homebrew/bin/ffmpeg",
  "/usr/local/bin/ffmpeg",
  "ffmpeg",
].filter(Boolean);

function probeFfmpeg() {
  const tried = [];
  let anyBin = null;
  for (const bin of FFMPEG_CANDIDATES) {
    let enc = "";
    try { enc = execFileSync(bin, ["-hide_banner", "-encoders"], { encoding: "utf8", stdio: ["ignore","pipe","ignore"] }); }
    catch { tried.push({ bin, ok: false, why: "not runnable" }); continue; }
    anyBin = anyBin || bin;
    const vp9 = /libvpx-vp9/.test(enc);
    tried.push({ bin, ok: vp9, why: vp9 ? "has libvpx-vp9" : "no libvpx-vp9" });
    if (vp9) return { bin, vp9: true, tried };
  }
  return { bin: anyBin, vp9: false, tried };   // gif still possible without vp9
}

/* --------------------------------------------------------------- server --- */
function startServer() {
  return new Promise(res => {
    const srv = createServer(async (req, resp) => {
      try {
        let p = decodeURIComponent(req.url.split("?")[0]);
        if (p === "/") p = "/harness/render-motion-harness.html";
        const f = resolve(ROOT, "." + p);
        if (!f.startsWith(ROOT)) { resp.writeHead(403); return resp.end(); }
        const body = await readFile(f);
        resp.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
        resp.end(body);
      } catch (e) { resp.writeHead(404); resp.end("404 " + e.message); }
    });
    srv.listen(0, "127.0.0.1", () => res({ srv, port: srv.address().port }));
  });
}

const arg = (args, name, dflt) => args.includes(name) ? args[args.indexOf(name) + 1] : dflt;
const bytes = p => { try { return statSync(p).size; } catch { return null; } };
const kb = n => n == null ? "—" : (n / 1024).toFixed(0) + "KB";

function run(bin, argv) {
  return execFileSync(bin, argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/* ------------------------------------------------------------ encoding ---
   VP9: -crf 15 -b:v 0 is constant-quality. Halftone is the worst case for a
   video codec (high-frequency isolated dots), so quality sits high; anything
   soft turns the ordered dots into porridge.

   GIF: palettegen/paletteuse, two passes, and dither=none on purpose. The
   image is ALREADY dithered — it is an ordered halftone — and a second,
   error-diffused dither laid over the first is exactly what destroys it. */
function encodeWebm(ffmpeg, pattern, fps, dest) {
  run(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps), "-i", pattern,
    "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p",
    "-crf", "15", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
    "-an", dest]);
}
function encodeGif(ffmpeg, pattern, fps, dest, palette, maxColors = 64) {
  run(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps), "-i", pattern,
    "-vf", `palettegen=max_colors=${maxColors}:stats_mode=full`, palette]);
  run(ffmpeg, ["-y", "-hide_banner", "-loglevel", "error",
    "-framerate", String(fps), "-i", pattern, "-i", palette,
    "-filter_complex", "[0:v][1:v]paletteuse=dither=none",
    "-loop", "0", dest]);
}
function probeDuration(ffmpeg, file) {
  const probe = ffmpeg.replace(/ffmpeg$/, "ffprobe");
  try {
    const s = run(probe, ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", file]);
    return +(+s.trim()).toFixed(3);
  } catch { return null; }
}

/* ------------------------------------------------------------------ main -- */
async function main() {
  const args = process.argv.slice(2);
  const fps       = +arg(args, "--fps", 12);
  const pipeline  = arg(args, "--pipeline", "MESH");
  const W         = +arg(args, "--w", 1120);
  const H         = +arg(args, "--h", 760);
  const DPR       = +arg(args, "--dpr", 1);
  const stepArg   = args.includes("--step") ? +arg(args, "--step", 0) : 0;
  const keep      = args.includes("--keep");
  const wantSheet = args.includes("--contact") || args.includes("--contact-only");
  const sheetOnly = args.includes("--contact-only");
  const card      = !args.includes("--nocard");
  const FLAGVALS  = new Set([String(fps), pipeline, String(W), String(H), String(DPR), String(stepArg)]);

  let files = args.filter(a => !a.startsWith("--") && !FLAGVALS.has(a));
  if (args.includes("--all")) {
    files = readdirSync(resolve(ROOT, "scenes"))
      .filter(f => f.endsWith(".mjs") && !f.startsWith("_"))
      .sort().map(f => `scenes/${f}`);
  }
  if (!files.length) { console.error("usage: node harness/render-motion.mjs scenes/BF-01.mjs [--all] [--contact] [--keep]"); process.exit(2); }

  const ff = probeFfmpeg();
  if (!ff.bin) console.error("! no ffmpeg found; frames only");
  else if (!ff.vp9) console.error(`! ${ff.bin} has no libvpx-vp9 — webm will be SKIPPED (gif still written)`);
  else console.error(`ffmpeg: ${ff.bin} (vp9 ok)`);

  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const { srv, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  page.on("console", m => { if (m.type() === "error") console.error("  [page error]", m.text()); });

  const results = [];
  for (const rel of files) {
    const t0 = Date.now();
    const modUrl = "/" + rel.replace(/^\/+/, "");
    const url = `${base}/harness/render-motion-harness.html?mod=${encodeURIComponent(modUrl)}`
      + `&pipeline=${pipeline}&w=${W}&h=${H}&dpr=${DPR}&card=${card ? 1 : 0}`
      + (args.includes("--endpoint-bug") ? "&endpointbug=1" : "");
    await page.goto(url, { waitUntil: "load" });
    await page.waitForFunction("window.__DONE__===true", { timeout: 30000 }).catch(() => {});
    const head = await page.evaluate("window.__RESULT__ || {ok:false,errors:['no result'],warnings:[]}");
    if (!head.ok) {
      console.error(`[FAIL] ${rel} · ${(head.errors || []).join(" | ")}`);
      results.push({ mod: rel, ok: false, errors: head.errors }); continue;
    }
    const meta = head.meta;
    const id = meta.id;
    const N = meta.frames;
    const frameDir = resolve(OUT, `.frames-${id}`);
    if (existsSync(frameDir)) rmSync(frameDir, { recursive: true, force: true });
    mkdirSync(frameDir, { recursive: true });

    /* ---- 2. render every frame -------------------------------------------
       u = i / frames. Not i/(frames-1). The file header explains why; this is
       the line that decides whether the loop stutters. */
    const steps = [];      // adjacent-frame differences, for the loop check
    let wrap = null;       // last frame vs frame 0
    for (let i = 0; i < N; i++) {
      const r = await page.evaluate("window.__FRAME__(" + i + ")");
      writeFileSync(resolve(frameDir, `f-${String(i).padStart(4, "0")}.png`),
        Buffer.from(r.dataURL.split(",")[1], "base64"));
      if (r.diffPrev) steps.push(r.diffPrev);
      if (i === N - 1) wrap = r.diffFirst;     // the wrap: frame n-1 → frame 0
      if (i % 12 === 0) process.stderr.write(`\r  ${id} frame ${i + 1}/${N}   `);
    }
    process.stderr.write(`\r  ${id} frame ${N}/${N}   \n`);

    /* ---- 5. verify the loop closes ---------------------------------------
       The frame after the last is frame 0. So the last→first difference must
       look like any other adjacent step. Reported, not asserted. */
    const mean = k => +(steps.reduce((a, s) => a + s[k], 0) / (steps.length || 1)).toFixed(4);
    const max  = k => +Math.max(...steps.map(s => s[k])).toFixed(4);
    const loop = {
      wrapChangedPct: wrap ? wrap.changedPct : null,
      wrapMeanAbs:    wrap ? wrap.meanAbs    : null,
      meanStepChangedPct: mean("changedPct"),
      maxStepChangedPct:  max("changedPct"),
      meanStepMeanAbs:    mean("meanAbs"),
      ratio: wrap && mean("changedPct") ? +(wrap.changedPct / mean("changedPct")).toFixed(3) : null,
    };
    loop.verdict =
      meta.motion !== "CYCLE" ? "n/a (not a CYCLE)"
      : loop.ratio == null ? "unmeasured"
      : loop.ratio < 0.15 ? "DUPLICATE FRAME — last frame ≈ frame 0; check u = i/frames"
      : loop.ratio > 3.0  ? "DISCONTINUITY — the wrap jumps"
      : loop.ratio > 1.8  ? "open drift at the wrap (expected if loopClosed:false)"
      : "seamless";

    /* ---- 3. encode -------------------------------------------------------- */
    const pattern = resolve(frameDir, "f-%04d.png");
    const webm = resolve(OUT, `${id}.webm`), gif = resolve(OUT, `${id}.gif`);
    const enc = { webm: null, gif: null, errors: [] };
    if (!sheetOnly && ff.bin) {
      if (ff.vp9) { try { encodeWebm(ff.bin, pattern, fps, webm); enc.webm = webm; }
                    catch (e) { enc.errors.push("webm: " + String(e.stderr || e.message).slice(0, 300)); } }
      else enc.errors.push("webm: skipped, ffmpeg has no libvpx-vp9");
      try { encodeGif(ff.bin, pattern, fps, gif, resolve(frameDir, "palette.png")); enc.gif = gif; }
      catch (e) { enc.errors.push("gif: " + String(e.stderr || e.message).slice(0, 300)); }
    }

    /* ---- 6. contact sheet ------------------------------------------------- */
    let sheet = null;
    if (wantSheet) {
      // default step: aim for ~16 cells, the most a reader can hold at once
      const step = stepArg > 0 ? stepArg : Math.max(1, Math.round(N / 16));
      const idx = []; for (let i = 0; i < N; i += step) idx.push(i);
      const durl = await page.evaluate(([ix]) => window.__CONTACT__(ix, { cols: 4, cellW: 356 }), [idx]);
      sheet = resolve(OUT, `${id}-contact.png`);
      writeFileSync(sheet, Buffer.from(durl.split(",")[1], "base64"));
    }

    /* ---- 4. the json report ----------------------------------------------- */
    const rec = {
      id, mod: rel, ok: true, t: new Date().toISOString(),
      motion: meta.motion, seconds: meta.seconds, loopClosed: meta.loopClosed,
      beats: meta.beats, declaredBreak: meta.declaredBreak,
      frames: { declared: meta.frames, rendered: N, fps },
      duration: {
        nominalSec: +(N / fps).toFixed(3),
        webmSec: enc.webm ? probeDuration(ff.bin, enc.webm) : null,
        gifSec:  enc.gif  ? probeDuration(ff.bin, enc.gif)  : null,
        renderWallSec: +((Date.now() - t0) / 1000).toFixed(1),
      },
      size: { w: W * DPR, h: H * DPR, pipeline, card },
      loop,
      files: {
        webm: enc.webm ? { path: relative(ROOT, enc.webm), bytes: bytes(enc.webm) } : null,
        gif:  enc.gif  ? { path: relative(ROOT, enc.gif),  bytes: bytes(enc.gif)  } : null,
        contact: sheet ? { path: relative(ROOT, sheet), bytes: bytes(sheet) } : null,
        frames: keep ? relative(ROOT, frameDir) : null,
      },
      encodeErrors: enc.errors,
      ffmpeg: ff.bin, warnings: head.warnings,
    };
    writeFileSync(resolve(OUT, `${id}.json`), JSON.stringify(rec, null, 2));

    // frames are scaffolding, not a deliverable: 40 scenes x 48 frames = 1920 PNGs
    if (!keep) rmSync(frameDir, { recursive: true, force: true });

    console.error(`[OK  ] ${id}  ${meta.motion} ${N}f/${fps}fps ${(N / fps).toFixed(2)}s`
      + `  webm ${kb(rec.files.webm?.bytes)}  gif ${kb(rec.files.gif?.bytes)}`
      + `  loop: wrap ${loop.wrapChangedPct}% vs mean step ${loop.meanStepChangedPct}%`
      + ` (ratio ${loop.ratio}) → ${loop.verdict}`);
    if (enc.errors.length) enc.errors.forEach(e => console.error("       ! " + e));
    results.push(rec);
  }

  await browser.close(); srv.close();
  console.log(JSON.stringify({ fps, pipeline, ffmpeg: ff.bin, vp9: ff.vp9, results }, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
