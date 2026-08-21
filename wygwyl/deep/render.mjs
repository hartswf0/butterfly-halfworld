#!/usr/bin/env node
/* ============================================================================
   render.mjs — write the piece, then LOOK at it.

     node wygwyl/deep/render.mjs                     186s, seed 1953
     node wygwyl/deep/render.mjs --seconds 60        a shorter descent
     node wygwyl/deep/render.mjs --seed 7            a different sea

   Nobody here can hear it. That is not a reason to ship it unheard — it is a
   reason to build the instrument that stands in for hearing, which is what this
   project does with pictures and can do with sound. So this also writes a
   spectrogram and a waveform and measures loudness, and the spectrogram is
   read the way a contact sheet is read: the layers should be visible as bands,
   the lung should be visible as vertical ribs at 2 Hz, and the descent should
   be visible as the whole image sinking.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { render, SR } from "./abyss.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT = path.join(ROOT, "renders", "deep");
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const SECONDS = +flag("seconds", 186), SEED = +flag("seed", 1953);

function findFfmpeg() {
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  for (const p of [path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg"),
                   "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"])
    if (fs.existsSync(p)) return fs.realpathSync(p);
  return null;
}
const FF = findFfmpeg();

function writeWav(file, pcm, sr = SR) {
  const n = pcm.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++)
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}

console.log(`rendering ${SECONDS}s at ${SR}Hz, seed ${SEED}`);
const t0 = Date.now();
const pcm = render({ seconds: SECONDS, seed: SEED });
console.log(`  ${((Date.now() - t0) / 1000).toFixed(1)}s of compute for ${SECONDS}s of sound`);

/* determinism is the whole law: render a second of it again and compare */
const again = render({ seconds: SECONDS, seed: SEED });
let drift = 0;
for (let i = 0; i < pcm.length; i++) if (pcm[i] !== again[i]) drift++;
console.log(`  determinism: ${drift} sample(s) differ on a second render`);

let peak = 0, sum = 0, clipped = 0;
for (const v of pcm) { const a = Math.abs(v); if (a > peak) peak = a; if (a >= 0.999) clipped++; sum += v * v; }
const rms = Math.sqrt(sum / pcm.length);
console.log(`  peak ${(20 * Math.log10(peak || 1e-9)).toFixed(1)} dBFS · rms ${(20 * Math.log10(rms || 1e-9)).toFixed(1)} dBFS · ${clipped} clipped`);

const wav = path.join(OUT, `abyss-${SEED}.wav`);
writeWav(wav, pcm);
console.log(`  → ${path.relative(ROOT, wav)}  (${(fs.statSync(wav).size / 1e6).toFixed(1)} MB)`);

if (!FF) { console.log("\nno ffmpeg — skipping the look and the mp3"); process.exit(0); }
const run = (a) => spawnSync(FF, a, { encoding: "utf8", maxBuffer: 1 << 26 });

const mp3 = path.join(OUT, `abyss-${SEED}.mp3`);
run(["-hide_banner", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "192k", mp3]);
if (fs.existsSync(mp3)) console.log(`  → ${path.relative(ROOT, mp3)}  (${(fs.statSync(mp3).size / 1e6).toFixed(1)} MB)`);

/* THE LOOK. Log frequency, so the sub and the formants both get room. */
const spec = path.join(OUT, `abyss-${SEED}.spectrum.png`);
run(["-hide_banner", "-v", "error", "-y", "-i", wav,
     "-lavfi", "showspectrumpic=s=1600x800:mode=combined:scale=log:fscale=log:legend=1:gain=3", spec]);
const wave = path.join(OUT, `abyss-${SEED}.wave.png`);
run(["-hide_banner", "-v", "error", "-y", "-i", wav,
     "-lavfi", "showwavespic=s=1600x300:colors=0x111111", wave]);
/* and one close-up: eight seconds mid-descent, where the lung's ribs and the
   ping's stutter should both be countable rather than inferred */
const near = path.join(OUT, `abyss-${SEED}.near.png`);
run(["-hide_banner", "-v", "error", "-y", "-ss", String(Math.round(SECONDS * 0.55)), "-t", "8", "-i", wav,
     "-lavfi", "showspectrumpic=s=1600x600:mode=combined:scale=log:fscale=log:legend=1:gain=4", near]);

const lu = run(["-hide_banner", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"]);
/* take the LAST summary block: ebur128 prints running values too, and the
   first match is a frame near silence, which is how a -70 LUFS reading for a
   -13.6 dBFS file happens */
const all = [...(lu.stderr || "").matchAll(/I:\s*(-?[\d.]+) LUFS[\s\S]{0,400}?LRA:\s*(-?[\d.]+) LU/g)];
const m = all.length ? all[all.length - 1] : null;
if (m) console.log(`  integrated ${m[1]} LUFS · range ${m[2]} LU`);
console.log(`  → spectrum, waveform and an eight-second close-up in renders/deep/`);
