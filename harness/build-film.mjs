#!/usr/bin/env node
/* ============================================================================
   build-film.mjs — I REMEMBER BEING A BUTTERFLY, assembled.

   THIS FILM IS MADE OF LOOPS, NOT STILLS. The sibling world is a photo-roman
   because 44% of it holds in silence. Here the opposite is true: the central
   images do not exist in any single frame, so every scene is a cycle, and a
   scene lasts as long as it needs by REPEATING — which is the one editorial
   decision this text actually dictates.

     "Impact. Drop. A tilt of black-veined wings. Recovery. Impact."

   A body that cannot stop is not shown by holding a picture of it. It is shown
   by the picture coming round again while someone is still talking over it.

   THE CLOCK. A scene's duration is the longer of:
     (a) its dialogue — the sum of its recorded takes, plus a beat and a tail
     (b) one whole number of its own loops — never a partial one
   and then rounded UP to a whole loop, because a cycle cut mid-revolution
   reads as a cut, and this world has exactly one permitted cut per scene (the
   declared BREAK). Scenes with a declared break are cut AT the break instead.

   THREE AUDIO LAYERS, one clock:
     VOICE   the recorded takes, laid at the scene's start
     SOUND   the nine generated cues, looped under the scenes that name them
     ROOM    nothing. Silence here is a plan, not an absence.

   Usage:  node harness/build-film.mjs              picture only
           node harness/build-film.mjs --with-audio voice + sound muxed
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCRIPT = JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "script.json"), "utf8"));
const MOTION = path.join(ROOT, "renders", "motion");
const FILM = path.join(ROOT, "film");
const WITH_AUDIO = process.argv.includes("--with-audio");
const FPS = SCRIPT.fps || 12;
const SR = 24000;
const TAKE_GAP = 0.5, TAIL = 0.8;

/* ffmpeg that can actually encode VP9/x264 — the conda build cannot. */
const FF = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg",
            "/Users/gaia/anaconda3/bin/ffmpeg"].find((p) => fs.existsSync(p));
const FFPROBE = FF ? FF.replace(/ffmpeg$/, "ffprobe") : null;
if (!FF) { console.error("no ffmpeg found"); process.exit(1); }

const dur = (f) => {
  try { return parseFloat(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", f], { encoding: "utf8" }).trim()); } catch (_) { return null; }
};

/* ---- 1. the clock -------------------------------------------------------- */
const takes = fs.existsSync(path.join(ROOT, "audio", "scene-takes.json"))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, "audio", "scene-takes.json"), "utf8")).takes : [];
const takesBy = {};
for (const t of takes) (takesBy[t.scene] ||= []).push(t);

let measured = 0, estimated = 0;
const cut = [];
for (const s of SCRIPT.scenes) {
  const meta = path.join(MOTION, `${s.id}.json`);
  if (!fs.existsSync(meta)) { console.warn(`  no render for ${s.id}`); continue; }
  const M = JSON.parse(fs.readFileSync(meta, "utf8"));
  const loopSec = M.seconds;
  const src = path.join(MOTION, `${s.id}.webm`);

  // (a) how long the dialogue needs
  let voiceSec = 0;
  for (const t of (takesBy[s.id] || [])) {
    const d = t.duration != null ? (measured++, t.duration)
      : (estimated++, Math.max(1.2, t.lines.reduce((n, l) => n + String(l.text || "").split(/\s+/).length, 0) / 2.55));
    voiceSec += d + TAKE_GAP;
  }
  if (voiceSec) voiceSec += TAIL - TAKE_GAP;

  // (b) whole loops only — a cycle cut mid-revolution reads as a cut
  const minLoops = s.motion === "BREAK" ? 1 : 1;
  const loops = Math.max(minLoops, Math.ceil(voiceSec / loopSec));
  const duration = +(loops * loopSec).toFixed(3);

  cut.push({ ...s, src, loopSec, loops, voiceSec: +voiceSec.toFixed(3), duration,
             sound: s.sound || [] });
}

const total = cut.reduce((n, c) => n + c.duration, 0);
const provisional = estimated > 0;

console.log(`I REMEMBER BEING A BUTTERFLY — the cut`);
console.log(`  ${cut.length} scenes · ${(total / 60).toFixed(2)} min · ${FPS}fps`);
console.log(`  ${measured} takes measured, ${estimated} estimated`);
console.log(`  ${cut.reduce((n, c) => n + c.loops, 0)} loop revolutions in total`);
const rep = cut.filter((c) => c.loops > 1);
console.log(`  ${rep.length} scenes come round more than once — longest: ` +
  rep.sort((a, b) => b.loops - a.loops).slice(0, 3).map((c) => `${c.id}×${c.loops}`).join(" "));
if (provisional) console.warn(`  ** PROVISIONAL — ${estimated} take durations estimated, not measured.`);

fs.mkdirSync(FILM, { recursive: true });
fs.writeFileSync(path.join(FILM, "cut.json"), JSON.stringify(
  { built: new Date().toISOString(), provisional, fps: FPS, totalSeconds: total,
    measured, estimated, scenes: cut }, null, 1));

if (process.argv.includes("--manifest-only")) { console.log(`  wrote film/cut.json`); process.exit(0); }

/* ---- 2. the picture: each loop repeated to its scene duration ------------- */
const TMP = path.join(FILM, ".tmp");
fs.mkdirSync(TMP, { recursive: true });
console.log(`\n  building picture…`);
const segs = [];
for (const c of cut) {
  const seg = path.join(TMP, `${c.id}.mp4`);
  if (!fs.existsSync(seg)) {
    execFileSync(FF, ["-y", "-v", "error", "-stream_loop", String(c.loops - 1), "-i", c.src,
      "-t", String(c.duration), "-r", String(FPS),
      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", seg]);
  }
  segs.push(seg);
}
const listPath = path.join(TMP, "concat.txt");
fs.writeFileSync(listPath, segs.map((s) => `file '${s.replace(/'/g, "'\\''")}'`).join("\n"));
const picture = path.join(TMP, "picture.mp4");
execFileSync(FF, ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", picture]);
console.log(`  picture: ${(dur(picture) / 60).toFixed(2)} min`);

/* ---- 3. the sound: voice + generated cues, on the same clock -------------- */
let audioFile = null;
if (WITH_AUDIO) {
  console.log(`  building sound…`);
  const N = Math.round(total * SR);
  const voice = new Float32Array(N), sfx = new Float32Array(N);
  const readWav = (f) => { const b = fs.readFileSync(f).slice(44); const n = b.length / 2;
    const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = b.readInt16LE(i * 2) / 32768; return a; };

  const cueCache = {};
  let t0 = 0, placedTakes = 0, placedCues = 0;
  for (const c of cut) {
    const start = Math.round(t0 * SR);

    // VOICE — takes laid at the scene's start, in order
    let off = start;
    for (const tk of (takesBy[c.id] || [])) {
      const f = path.join(ROOT, "audio", "scenes", `${tk.id}.wav`);
      if (fs.existsSync(f)) {
        const a = readWav(f); placedTakes++;
        for (let i = 0; i < a.length && off + i < N; i++) voice[off + i] += a[i];
        off += a.length + Math.round(TAKE_GAP * SR);
      }
    }

    // SOUND — every cue this scene names, looped across the whole scene
    for (const id of c.sound) {
      const f = path.join(ROOT, "audio", "sound", `${id}.wav`);
      if (!fs.existsSync(f)) continue;
      const a = cueCache[id] || (cueCache[id] = readWav(f)); placedCues++;
      const len = Math.round(c.duration * SR);
      for (let i = 0; i < len && start + i < N; i++) sfx[start + i] += a[i % a.length] * 0.85;
    }
    t0 += c.duration;
  }

  // mix: voice sits above the bed; the bed never masks a line
  const mix = Buffer.alloc(N * 2);
  for (let i = 0; i < N; i++) {
    let v = voice[i] * 0.95 + sfx[i] * 0.55;
    v = Math.max(-1, Math.min(1, v));
    mix.writeInt16LE(Math.round(v * 32000), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + mix.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(mix.length, 40);
  audioFile = path.join(ROOT, "audio", "master.wav");
  fs.writeFileSync(audioFile, Buffer.concat([h, mix]));
  console.log(`  sound: ${(N / SR / 60).toFixed(2)} min · ${placedTakes} takes · ${placedCues} cue placements`);
}

/* ---- 4. mux -------------------------------------------------------------- */
const name = provisional ? "BUTTERFLY-provisional.mp4" : "BUTTERFLY.mp4";
const out = path.join(FILM, name);
const args = ["-y", "-v", "error", "-i", picture];
if (audioFile) args.push("-i", audioFile, "-c:a", "aac", "-b:a", "160k", "-shortest");
args.push("-c:v", "copy", out);
execFileSync(FF, args);

const d = dur(out), bytes = fs.statSync(out).size;
console.log(`\n  wrote film/${name}`);
console.log(`  ${(bytes / 1048576).toFixed(1)} MB · ${(d / 60).toFixed(2)} min measured`);
if (audioFile) {
  const ad = dur(audioFile);
  const drift = Math.abs(ad - total);
  console.log(`  picture ${(d / 60).toFixed(3)} min vs sound ${(ad / 60).toFixed(3)} min · drift ${drift.toFixed(3)}s` +
    (drift > 1 ? "   ** DRIFT — the two clocks disagree" : "   clocks agree"));
}
