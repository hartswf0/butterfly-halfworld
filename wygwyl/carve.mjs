#!/usr/bin/env node
/* ============================================================================
   carve.mjs — CUT A VIDEO INTO SPATIOTEMPORAL PATCHES.

   The mechanical half of a patch carve, so the judgement half has something to
   look at. Point it at any video file:

     node wygwyl/carve.mjs path/to/clip.mp4
     node wygwyl/carve.mjs path/to/clip.mp4 --tcbase 01:00:00:00 --fps 24
     node wygwyl/carve.mjs some/directory            every video in it

   It writes, per source, into renders/carve/<stem>/ :

     sheets/sheet00.png …   the whole file at 1fps, tiled 6x4, in order
     zones/zone-<t>.png     every candidate boundary at 2fps, +/- 5s
     scene.txt              every frame whose scene score clears 0.02
     silence.txt            the audio's own phrase structure
     shots.tsv              the machine's guess at the shot table
     carve.json            probe + candidates, for whatever reads this next

   WHAT IT WILL NOT DO. It will not tell you where the cuts are. On material
   like this one — dark silhouettes against teal and white — ffmpeg's scene
   score misses half the hard cuts outright, because consecutive shots have
   near-identical luma histograms and the metric cannot see a room change. It
   found three of six on OUT OF LIFE. So the sheets exist to be LOOKED AT, and
   the shot table it prints is a hypothesis with a confidence column on it.
   Anything marked WEAK was below the threshold that would normally be trusted
   and is in the list only because something nearby moved.

   The eye is not an optional refinement step here. It is the instrument.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");

function findFfmpeg() {
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  for (const p of [
    path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg"),
    "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg",
  ]) if (fs.existsSync(p)) return fs.realpathSync(p);
  console.error("no ffmpeg. `npm i ffmpeg-static`, or install one on PATH.");
  process.exit(1);
}
const FF = findFfmpeg();
const FFPROBE = FF.replace(/ffmpeg$/, "ffprobe");

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const TCBASE = flag("tcbase", "01:00:00:00");
const VIDEO = /\.(mp4|mov|m4v|mkv|webm|avi)$/i;
const targets = argv.filter((a, i) => !a.startsWith("--") && !["--tcbase", "--fps"].includes(argv[i - 1]));
if (!targets.length) { console.error("usage: node wygwyl/carve.mjs <file-or-directory> [...]"); process.exit(1); }

const files = [];
for (const t of targets) {
  if (!fs.existsSync(t)) { console.error(`  !! not found: ${t}`); continue; }
  if (fs.statSync(t).isDirectory()) {
    for (const f of fs.readdirSync(t).sort()) if (VIDEO.test(f)) files.push(path.join(t, f));
  } else if (VIDEO.test(t)) files.push(t);
}
if (!files.length) { console.error("no video files found in what you gave me."); process.exit(1); }
console.log(`${files.length} source(s) to carve\n`);

const run = (args) => spawnSync(FF, args, { encoding: "utf8", maxBuffer: 1 << 28 });

/* seconds -> SMPTE, offset by the timecode base */
function smpte(sec, fps, base) {
  const [bh, bm, bs, bf] = base.split(":").map(Number);
  let f = Math.round(sec * fps) + bf + (bs + bm * 60 + bh * 3600) * fps;
  const ff = f % fps; f = (f - ff) / fps;
  const ss = f % 60; f = (f - ss) / 60;
  const mm = f % 60, hh = (f - mm) / 60;
  return [hh, mm, ss, ff].map(n => String(n).padStart(2, "0")).join(":");
}

for (const src of files) {
  const stem = path.basename(src).replace(/\.[^.]+$/, "");
  const out = path.join(ROOT, "renders", "carve", stem);
  fs.mkdirSync(path.join(out, "sheets"), { recursive: true });
  fs.mkdirSync(path.join(out, "zones"), { recursive: true });
  console.log(`── ${stem}`);

  /* ---- probe ---------------------------------------------------------- */
  const pr = spawnSync(FFPROBE, ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
    "-show_entries", "format=duration", "-of", "json", src], { encoding: "utf8" });
  let W = 0, H = 0, FPS = +flag("fps", 0) || 24, DUR = 0;
  try {
    const j = JSON.parse(pr.stdout);
    const s = j.streams?.[0] || {};
    W = +s.width || 0; H = +s.height || 0;
    if (!+flag("fps", 0) && s.r_frame_rate) { const [a, b] = s.r_frame_rate.split("/").map(Number); FPS = Math.round(a / (b || 1)); }
    DUR = +j.format?.duration || 0;
  } catch { /* ffprobe absent in some static builds; fall through */ }
  if (!DUR || !W) {
    /* ffmpeg-static ships no ffprobe, so read the banner instead — it carries
       everything this needs and is there in every build. */
    const err = run(["-hide_banner", "-i", src]).stderr || "";
    const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(err);
    if (d && !DUR) DUR = +d[1] * 3600 + +d[2] * 60 + +d[3];
    const v = /Video:.*?, (\d+)x(\d+)[ ,]/.exec(err);
    if (v && !W) { W = +v[1]; H = +v[2]; }
    const r = /, ([\d.]+) fps,/.exec(err);
    if (r && !+flag("fps", 0)) FPS = Math.round(+r[1]);
  }
  console.log(`   ${W}x${H} · ${FPS}fps · ${DUR.toFixed(2)}s · tc base ${TCBASE}`);

  /* ---- scene scores, threshold deliberately low ------------------------ */
  const sc = run(["-hide_banner", "-v", "error", "-i", src,
    "-filter_complex", "select='gt(scene,0.02)',metadata=print:file=-", "-f", "null", "-"]);
  const cand = [];
  {
    const txt = (sc.stdout || "") + (sc.stderr || "");
    const re = /pts_time:([\d.]+)[\s\S]*?lavfi\.scene_score=([\d.]+)/g;
    let m; while ((m = re.exec(txt))) cand.push({ t: +m[1], score: +m[2] });
  }
  fs.writeFileSync(path.join(out, "scene.txt"),
    cand.map(c => `${c.t.toFixed(2)}\t${smpte(c.t, FPS, TCBASE)}\t${c.score.toFixed(3)}`).join("\n") + "\n");

  /* cluster: adjacent hits within 0.6s are one candidate, keep the strongest */
  const peaks = [];
  for (const c of cand) {
    const last = peaks[peaks.length - 1];
    if (last && c.t - last.t < 0.6) { if (c.score > last.score) { last.t = c.t; last.score = c.score; } }
    else peaks.push({ ...c });
  }

  /* ---- audio phrase structure ------------------------------------------ */
  const sd = run(["-hide_banner", "-i", src, "-af", "silencedetect=noise=-34dB:d=0.45", "-f", "null", "-"]);
  const sil = ((sd.stderr || "") + (sd.stdout || "")).split("\n")
    .map(l => /silence_(start|end): ([\d.-]+)/.exec(l)).filter(Boolean)
    .map(m => `${m[1].toUpperCase().padEnd(5)}\t${(+m[2]).toFixed(2)}\t${smpte(Math.max(0, +m[2]), FPS, TCBASE)}`);
  fs.writeFileSync(path.join(out, "silence.txt"), sil.join("\n") + "\n");

  /* ---- contact sheets, the whole file at 1fps -------------------------- */
  const scrub = path.join(out, "_1fps");
  fs.mkdirSync(scrub, { recursive: true });
  run(["-hide_banner", "-v", "error", "-i", src, "-vf", "fps=1,scale=304:-2", "-q:v", "4",
       "-y", path.join(scrub, "f%04d.jpg")]);
  const n = fs.readdirSync(scrub).filter(f => f.endsWith(".jpg")).length;
  const PER = 24;
  for (let s = 0; s * PER < n; s++) {
    run(["-hide_banner", "-v", "error", "-start_number", String(s * PER + 1),
         "-i", path.join(scrub, "f%04d.jpg"),
         "-vf", `tile=6x4:margin=4:padding=4:color=0x202020`, "-frames:v", "1",
         "-y", path.join(out, "sheets", `sheet${String(s).padStart(2, "0")}.png`)]);
  }
  fs.rmSync(scrub, { recursive: true, force: true });

  /* ---- a strip at 2fps around every candidate -------------------------- */
  for (const p of peaks) {
    const a = Math.max(0, p.t - 5);
    run(["-hide_banner", "-v", "error", "-ss", String(a), "-t", "10", "-i", src,
         "-vf", "fps=2,scale=304:-2,tile=5x4:margin=4:padding=4:color=0x202020",
         "-frames:v", "1", "-y",
         path.join(out, "zones", `zone-${p.t.toFixed(2).replace(".", "_")}.png`)]);
  }

  /* ---- the hypothesis, with its confidence stated --------------------- */
  const bounds = [0, ...peaks.map(p => p.t), DUR];
  const rows = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i], b = bounds[i + 1];
    const conf = i === 0 ? "HEAD" : peaks[i - 1].score >= 0.25 ? "FIRM" : "WEAK";
    rows.push([`S${String(i + 1).padStart(2, "0")}`, smpte(a, FPS, TCBASE), smpte(b, FPS, TCBASE),
               (b - a).toFixed(2), conf, i === 0 ? "" : peaks[i - 1].score.toFixed(3)].join("\t"));
  }
  fs.writeFileSync(path.join(out, "shots.tsv"),
    "SHOT\tIN\tOUT\tDUR\tCONFIDENCE\tSCORE\n" + rows.join("\n") + "\n");
  fs.writeFileSync(path.join(out, "carve.json"), JSON.stringify(
    { src, stem, width: W, height: H, fps: FPS, duration: DUR, tcbase: TCBASE,
      candidates: peaks, silences: sil.length }, null, 2) + "\n");

  const firm = rows.filter(r => r.includes("FIRM")).length;
  const weak = rows.filter(r => r.includes("WEAK")).length;
  console.log(`   ${peaks.length} candidate boundaries · ${firm} firm · ${weak} weak`);
  console.log(`   ${Math.ceil(n / PER)} contact sheet(s), ${peaks.length} zone strip(s)`);
  console.log(`   → renders/carve/${stem}/`);
  console.log(`   NOW LOOK AT THE SHEETS. The weak ones are where the cuts hide, and`);
  console.log(`   on dark material the metric misses hard cuts entirely.\n`);
}
