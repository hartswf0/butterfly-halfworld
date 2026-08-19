#!/usr/bin/env node
/* ============================================================================
   render-film.mjs — THE FILM IS AN OUTPUT OF THIS REPOSITORY, NOT A FILE IN IT.

   The pages are the work: fourteen halfworlds that compute themselves in a
   browser. This renders them to one watchable file for people who do not have
   a browser open, and it does it from the same modules the pages run — there
   is no second copy of any picture or any sound anywhere in here.

     node wygwyl/render-film.mjs                  the whole suite → film/WYGWYL.mp4
     node wygwyl/render-film.mjs 07               one film → film/WYGWYL-07.mp4
     node wygwyl/render-film.mjs --fps 12         default is 12
     node wygwyl/render-film.mjs --silent         picture only, skip the score

   ffmpeg is found on PATH, in the usual places, or in node_modules — install
   it with `npm i ffmpeg-static` if this machine has none.

   ---------------------------------------------------------------------------
   TWO REALISATIONS OF ONE SPECIFICATION

   The browser plays the score through WebAudio; this writes it as samples. That
   is two pieces of code making sound, which is exactly the duplication the rest
   of this repository refuses — so what is shared is the thing that matters and
   what differs is only the plumbing. `drone` and `cues` in the world modules
   are the score. Neither renderer invents a note; both read those, and the
   world module remains the only place a sound can be changed.

   The picture has no such split. Frames come out of the page itself, through
   the same engine, the same halftone pass and the same canvas the viewer sees.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const OUT = path.join(ROOT, "film");
const TMP = path.join(ROOT, "renders", "wygwyl", "_frames");
const PORT = +(process.env.PORT || 8181);
const SR = 24000;

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const FPS = +flag("fps", 12);
const SILENT = argv.includes("--silent");
const only = argv.filter(a => /^\d\d$/.test(a));

/* ---------------------------------------------------------------- ffmpeg -- */
function findFfmpeg() {
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  const guesses = [
    path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg"),
    "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg",
  ];
  return guesses.find(p => fs.existsSync(p)) || null;
}
const FF = findFfmpeg();
if (!FF) {
  console.error("no ffmpeg. `npm i ffmpeg-static`, or install one on PATH.");
  process.exit(1);
}

/* ------------------------------------------------------------- the score --
   A struck body: partials for the material, a burst of shaped noise for the
   contact, and no tail longer than the room it rings into. Same argument as
   the browser's cue(), same numbers off the same world module. */
const clamp = (x) => (x < -1 ? -1 : x > 1 ? 1 : x);
const rng = (seed) => { let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) * 2 - 1; }; };

function renderScore(films, total) {
  const out = new Float32Array(Math.ceil(total * SR));
  for (const f of films) {
    const spec = f.world.drone || { base: 55, steps: [0, 3, 7, 10] };
    const air = spec.bright ? 900 : 260;
    /* THE BED. Three detuned partials, and the root steps with the movements.
       The browser sweeps between roots with setTargetAtTime; the same
       exponential approach is written here by hand so the two agree. */
    const partials = [[1, 0.16], [1.007, 0.05], [2.003, 0.045]];
    const phase = partials.map(() => 0);
    let root = spec.base * Math.pow(2, spec.steps[0] / 12);
    const nz = rng(f.world.seed || 1);
    let lp = 0;
    const i0 = Math.round(f.start * SR), i1 = Math.min(out.length, Math.round(f.end * SR));
    for (let i = i0; i < i1; i++) {
      const t = (i - i0) / SR;
      const [mi] = f.rt.locate(t);
      const target = spec.base * Math.pow(2, spec.steps[mi % spec.steps.length] / 12);
      root += (target - root) * (1 - Math.exp(-1 / (1.2 * SR)));      // τ = 1.2s
      let v = 0;
      for (let p = 0; p < partials.length; p++) {
        phase[p] += (root * partials[p][0]) / SR;
        v += Math.sin(phase[p] * Math.PI * 2) * partials[p][1];
      }
      const k = Math.exp(-2 * Math.PI * air / SR);
      lp = lp * k + nz() * 0.5 * (1 - k);
      out[i] += (v + lp * 0.05) * 0.55;
    }
    /* THE FOLEY, at the absolute second each cue's beat falls on. */
    for (let mi = 0; mi < f.rt.movements.length; mi++) {
      const m = f.rt.movements[mi];
      for (const c of m.cues || []) {
        const at = f.start + f.rt.starts[mi] + c.at * m.seconds;
        strike(out, at, c);
      }
    }
  }
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0.001 ? 0.89 / peak : 1;
  for (let i = 0; i < out.length; i++) out[i] = clamp(out[i] * g);
  return out;
}

function strike(out, at, c) {
  const i0 = Math.round(at * SR);
  const f = c.f || 800, decay = c.decay || 0.15, gain = (c.gain ?? 0.5) * 0.5;
  const ps = c.partials || [1, 2.4, 4.1];
  const n = Math.round(Math.max(decay * 2.5, (c.nDecay || 0.05) * 4) * SR);
  for (let i = 0; i < n; i++) {
    const q = i0 + i;
    if (q < 0 || q >= out.length) continue;
    const t = i / SR;
    let v = 0;
    for (let p = 0; p < ps.length; p++) {
      v += Math.sin(2 * Math.PI * f * ps[p] * t) * (gain / (p + 1)) * Math.exp(-t / (decay * (1 + p * 0.2)));
    }
    out[q] += v;
  }
  if (c.noise) {
    const dur = c.nDecay || 0.05, r = rng(c.seed || 1);
    const nn = Math.round(dur * 4 * SR);
    let b1 = 0, b2 = 0;
    const w = 2 * Math.PI * f * 2.2 / SR;
    for (let i = 0; i < nn; i++) {
      const q = i0 + i;
      if (q < 0 || q >= out.length) continue;
      /* one biquad-ish bandpass, to match the browser's bandpass on the burst */
      const x = r() * Math.exp(-i / (SR * dur));
      const y = x - b2;
      b2 = b1; b1 = y * 0.5 + b1 * Math.cos(w) * 1.4;
      out[q] += y * gain * c.noise;
    }
  }
}

function writeWav(file, data) {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.round(clamp(data[i]) * 32767), 44 + i * 2);
  fs.writeFileSync(file, buf);
}

/* ------------------------------------------------------------- the picture */
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.error("  page error: " + e.message));

const url = `http://127.0.0.1:${PORT}/wygwyl/suite.html`;
await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw, null, { timeout: 20000 });
await page.evaluate(() => {
  /* Render the picture alone: the chrome is for a person at a desk, and a
     film that carries its own transport controls is a screen recording. */
  document.body.classList.add("cinema");
  document.getElementById("linebar").style.display = "none";
  window.dispatchEvent(new Event("resize"));
});
await page.waitForTimeout(300);

const meta = await page.evaluate(() => ({
  total: window.__hw.total,
  films: window.__hw.films.map(f => ({ n: f.world.n, title: f.world.title, start: f.start, end: f.end })),
}));

const picked = only.length ? meta.films.filter(f => only.includes(f.n)) : null;
const T0 = picked ? picked[0].start : 0;
const T1 = picked ? picked[picked.length - 1].end : meta.total;
const N = Math.floor((T1 - T0) * FPS);
console.log(`${meta.films.length} films · ${(meta.total / 60).toFixed(1)} min · rendering ${N} frames @ ${FPS}fps`);

/* THE SCORE FIRST, then the picture. ffmpeg wants both inputs open at once and
   the frames are piped rather than written: fourteen films at 12fps is 14,400
   PNGs, and staging 700MB of them on disk to hand straight to an encoder is
   work nobody asked for. The pipe also means the encode runs *while* Chromium
   renders, instead of after it. */
let wav = null;
if (!SILENT) {
  console.log("  synthesising the score");
  /* The runtimes are needed to place the cues in absolute time, and they come
     from the same modules the page imported. */
  const mods = fs.readdirSync(path.join(HERE, "worlds")).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort();
  /* The engine imports cleanly under Node: nothing touches `document` at module
     scope, and the score never calls draw(). makeRuntime is wanted here only
     for its clock — starts, seconds, and the movement a second belongs to. */
  const { makeRuntime } = await import(pathToFileURL(path.join(HERE, "halfworld.mjs")).href);
  const films = []; let T = 0;
  for (const f of mods) {
    const world = (await import(pathToFileURL(path.join(HERE, "worlds", f)).href)).default;
    const rt = makeRuntime(world);
    films.push({ world, rt, start: T, end: T + rt.total });
    T += rt.total;
  }
  const use = picked ? films.filter(f => picked.some(p => p.n === f.world.n)) : films;
  const span = use.map(f => ({ ...f, start: f.start - T0, end: f.end - T0 }));
  wav = path.join(TMP, "score.wav");
  writeWav(wav, renderScore(span, T1 - T0));
}

const name = picked ? `WYGWYL-${picked.map(f => f.n).join("-")}.mp4` : "WYGWYL.mp4";
const dest = path.join(OUT, name);
const args = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
if (wav) args.push("-i", wav);
args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", String(flag("crf", "18")),
  "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2");
if (wav) args.push("-c:a", "aac", "-b:a", "160k", "-shortest");
args.push(dest);

const ff = spawn(FF, args, { stdio: ["pipe", "ignore", "pipe"] });
let ffErr = "";
ff.stderr.on("data", d => { ffErr += d; });
const done = new Promise((res, rej) => {
  ff.on("close", c => c === 0 ? res() : rej(new Error(ffErr.slice(-1800))));
  ff.on("error", rej);
});
/* If ffmpeg dies the pipe breaks; without this the process exits on EPIPE
   with no explanation of what ffmpeg actually objected to. */
ff.stdin.on("error", () => {});

const stage = page.locator("#stage");
for (let i = 0; i < N; i++) {
  const t = T0 + i / FPS;
  await page.evaluate((tt) => window.__hw.seek(tt), t);
  const png = await stage.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once("drain", r));
  if (i % (FPS * 10) === 0) {
    const f = meta.films.find(x => t >= x.start && t < x.end);
    const pct = ((i / N) * 100).toFixed(0).padStart(3);
    process.stdout.write(`\r  ${pct}%  ${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")} · ${f ? f.n + " " + f.title : ""}                    `);
  }
}
ff.stdin.end();
console.log("\n  frames done, finishing the encode");
await browser.close();
await done;

fs.rmSync(TMP, { recursive: true, force: true });
const mb = (fs.statSync(dest).size / 1e6).toFixed(1);
console.log(`  → film/${name}  ${mb} MB  ${((T1 - T0) / 60).toFixed(1)} min  ${N} frames @ ${FPS}fps`);
