#!/usr/bin/env node
/* ============================================================================
   encode.mjs — THE 94 SHOTS AS FILES CINEOSIS CAN PLAY.

     node harness/serve.mjs &
     node wygwyl/cineosis/emit.mjs            (first: the records)
     node wygwyl/cineosis/encode.mjs          → renders/cineosis/{clips,thumbs,strips}
     node wygwyl/cineosis/encode.mjs --film 07 --fps 12

   Measured off cineosis's own files rather than chosen: clips are 320x240
   h264 with aac, thumbs 320x240 jpg, strips 1920x180 — eight frames of
   240x180 laid side by side. Matching those means a halfworld shot drops into
   the same grids, players and light-tables with nothing special-cased.

   THE PICTURE comes from the suite page, because the film IS that page: the
   halftone pass lives in makePost and re-implementing it here would give two
   answers for what level 4 looks like. renderAt(t) paints the stage canvas and the
   field's rect inside it is arithmetic — cell = min(w/192, h/144), centred —
   so the crop is exact and never guessed from pixels. The stage is ~790px
   wide and the clip is 320, so every frame is supersampled 2.5x on the way
   down, which is the right direction for a picture made of hard dots.

   THE SOUND comes from cineosis's own WYGWYL_Suite_Audio.mp3, cut at the
   shot's start. That file is on the cut's clock and so are these shots, so
   the cut is a straight -ss with no offset to get wrong.

   TWO CLOCKS, ONE CONVERSION, DONE PER FILM. A shot's start is on the
   cineosis clock; the page runs on the suite clock, which is 59s longer
   because it carries a title film. Converting through the film — local =
   start - container[0], then page = filmStart + local — is exact for all
   fourteen and carries the 402ms hole between NEVERMORE and BLOODLINES
   automatically. A single global offset would be right for four films and
   wrong for ten.
   ========================================================================= */
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);

const PORT = +(process.env.PORT || 8181);
const FPS = +opt("fps", 24);
const ONLY = opt("film", "");
const LAB = opt("lab", "/home/user/hartswf0/cineosis-lab");
const BATCH = +opt("batch", 24);
const OUT = path.join(ROOT, "renders", "cineosis");
const FF = fs.realpathSync(path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg"));
const AUDIO = path.join(LAB, "lab", "wygwyl", "WYGWYL_Suite_Audio.mp3");
const hasAudio = fs.existsSync(AUDIO);
for (const d of ["clips", "thumbs", "strips"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const SHOTS = JSON.parse(fs.readFileSync(path.join(OUT, "halfworld-shots.json"), "utf8"));
const CONT = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(LAB, "lab", "lab-data.json"), "utf8"))
    .wygwyl.films.map(f => [f.n, f.container]));
if (!hasAudio) console.log("  (no WYGWYL_Suite_Audio.mp3 — encoding silent)");

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1100, height: 820 } });
page.on("pageerror", e => console.error("page error: " + e.message));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });

/* the page's own film starts, so a cineosis time can be converted per film */
const PAGE = Object.fromEntries(await page.evaluate(() =>
  window.__hw.films.map(f => [f.world.n, f.start])));

await page.evaluate(() => {
  /* ONE GRAB, DEFINED ONCE IN THE PAGE. Crossing the bridge per frame to set
     up a canvas is the whole cost of this script, so everything that can live
     on the far side does. */
  const o = document.createElement("canvas");
  window.__grab = (times, w, h, q) => {
    const c = document.getElementById("stage");
    o.width = w; o.height = h;
    const g = o.getContext("2d");
    const out = [];
    for (const t of times) {
      window.__hw.renderAt(t);
      const cell = Math.min(c.width / 192, c.height / 144);
      const ox = (c.width - cell * 192) / 2, oy = (c.height - cell * 144) / 2;
      g.drawImage(c, ox, oy, cell * 192, cell * 144, 0, 0, w, h);
      out.push(o.toDataURL("image/jpeg", q));
    }
    return out;
  };
});
const grab = async (times, w, h, q = 0.88) =>
  (await page.evaluate(([t, a, b, c]) => window.__grab(t, a, b, c), [times, w, h, q]))
    .map(u => Buffer.from(u.slice(u.indexOf(",") + 1), "base64"));

const t0all = Date.now();
let done = 0, frames = 0;
for (const s of SHOTS) {
  const n = s.halfworld.n;
  if (ONLY && n !== ONLY) continue;
  const clip = path.join(OUT, "clips", s.id + ".mp4");
  const thumb = path.join(OUT, "thumbs", s.id + ".jpg");
  const strip = path.join(OUT, "strips", s.id + ".jpg");
  if (!has("force") && fs.existsSync(clip) && fs.existsSync(thumb) && fs.existsSync(strip)) {
    s.clip = `clips/${s.id}.mp4`; s.thumb = `thumbs/${s.id}.jpg`; s.strip = `strips/${s.id}.jpg`;
    done++; continue;
  }
  const dur = s.end - s.start;
  const toPage = (t) => PAGE[n] + (t - CONT[n][0]);          // cineosis → suite
  const nF = Math.max(1, Math.round(dur * FPS));

  /* ---- the clip ---------------------------------------------------------- */
  const args = ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
  if (hasAudio) args.push("-ss", s.start.toFixed(3), "-t", dur.toFixed(3), "-i", AUDIO,
    "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "128k");
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23", "-preset", "veryfast",
    "-movflags", "+faststart", "-shortest", clip);
  const ff = spawn(FF, args, { stdio: ["pipe", "ignore", "pipe"] });
  let ffErr = "";
  ff.stderr.on("data", d => { ffErr += d; });
  const ended = new Promise((res, rej) => {
    ff.on("close", c => c === 0 ? res() : rej(new Error(`ffmpeg ${c}: ${ffErr.slice(0, 300)}`)));
    ff.on("error", rej);
  });
  /* EPIPE, HONESTLY: if ffmpeg dies the writes must stop, or node throws an
     unhandled error that looks nothing like the real cause. */
  let broken = false;
  ff.stdin.on("error", () => { broken = true; });
  for (let k = 0; k < nF && !broken; k += BATCH) {
    const times = [];
    for (let j = k; j < Math.min(nF, k + BATCH); j++) times.push(toPage(s.start + (j + 0.5) / FPS));
    for (const buf of await grab(times, 320, 240)) {
      if (broken) break;
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    }
    frames += times.length;
  }
  if (!broken) ff.stdin.end();
  await ended;

  /* ---- the thumb: the representative instant, not the first frame -------- */
  fs.writeFileSync(thumb, (await grab([toPage(s.match)], 320, 240, 0.9))[0]);

  /* ---- the strip: eight frames across the shot, 240x180 each ------------- */
  const st = [];
  for (let k = 0; k < 8; k++) st.push(toPage(s.start + (k + 0.5) / 8 * dur));
  const cells = await grab(st, 240, 180, 0.9);
  const tmp = cells.map((b, i) => {
    const p = path.join(OUT, `.strip-${i}.jpg`); fs.writeFileSync(p, b); return p;
  });
  const cat = spawnSync(FF, ["-v", "error", "-y", ...tmp.flatMap(p => ["-i", p]),
    "-filter_complex", `hstack=inputs=8`, "-q:v", "4", strip]);
  for (const p of tmp) fs.unlinkSync(p);
  if (cat.status !== 0) throw new Error("strip: " + String(cat.stderr).slice(0, 300));

  s.clip = `clips/${s.id}.mp4`; s.thumb = `thumbs/${s.id}.jpg`; s.strip = `strips/${s.id}.jpg`;
  s.video = `https://hartswf0.github.io/butterfly-halfworld/renders/cineosis/clips/${s.id}.mp4`;
  s.frames = 8;
  done++;
  const el = (Date.now() - t0all) / 1000;
  process.stdout.write(`\r  ${String(done).padStart(3)}/${SHOTS.length}  ${n} ${s.halfworld.label.slice(0, 22).padEnd(24)}`
    + ` ${nF} frames · ${el.toFixed(0)}s elapsed · ${(frames / Math.max(1, el)).toFixed(0)} fps   `);
}
await browser.close();
fs.writeFileSync(path.join(OUT, "halfworld-shots.json"), JSON.stringify(SHOTS, null, 1));
console.log(`\n\n${done} shots encoded · ${frames} frames at ${FPS}fps`);
console.log(`→ renders/cineosis/clips · thumbs · strips   (and the shot records now carry their paths)`);
