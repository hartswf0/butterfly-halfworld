#!/usr/bin/env node
/* ============================================================================
   song.mjs — render a song, then LOOK at it.

     node wygwyl/deep/song.mjs message
     node wygwyl/deep/song.mjs message --seed 7

   Nobody here can hear. That is a reason to build the instrument that stands
   in for hearing, not a reason to ship unheard: this also writes a spectrogram
   and a waveform and measures loudness, and every fault found in this room so
   far was found by reading one of those rather than by reading the source.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SR } from "./ops.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT = path.join(ROOT, "renders", "deep");
fs.mkdirSync(OUT, { recursive: true });
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const name = argv.find((a, i) => !a.startsWith("--") && argv[i - 1] !== "--seed") || "message";
const SEED = +flag("seed", 1959);

const mod = await import(pathToFileURL(path.join(HERE, "songs", name + ".mjs")).href);
const { meta, compose } = mod;
console.log(`${meta.title} · ${meta.seconds}s · seed ${SEED}`);

const t0 = Date.now();
const pcm = compose({ seed: SEED });
console.log(`  ${((Date.now() - t0) / 1000).toFixed(1)}s of compute`);
const again = compose({ seed: SEED });
let drift = 0; for (let i = 0; i < pcm.length; i++) if (pcm[i] !== again[i]) drift++;
console.log(`  determinism: ${drift} sample(s) differ on a second render`);

let peak = 0, sum = 0, clip = 0, silent = 0;
for (const v of pcm) { const a = Math.abs(v); if (a > peak) peak = a; if (a >= 0.999) clip++; if (a < 1e-5) silent++; sum += v * v; }
console.log(`  peak ${(20 * Math.log10(peak || 1e-9)).toFixed(1)} dBFS · rms ${(20 * Math.log10(Math.sqrt(sum / pcm.length) || 1e-9)).toFixed(1)} dBFS`
  + ` · ${clip} clipped · ${(silent / pcm.length * 100).toFixed(1)}% at digital silence`);

function writeWav(file, x, sr = SR) {
  const n = x.length, b = Buffer.alloc(44 + n * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(file, b);
}
const stem = path.join(OUT, name + "-" + SEED);
writeWav(stem + ".wav", pcm);
console.log(`  → renders/deep/${name}-${SEED}.wav`);

function findFfmpeg() {
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  for (const p of [path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg")]) if (fs.existsSync(p)) return fs.realpathSync(p);
  return null;
}
const FF = findFfmpeg();
if (!FF) process.exit(0);
const run = (a) => spawnSync(FF, a, { encoding: "utf8", maxBuffer: 1 << 26 });
run(["-hide_banner", "-v", "error", "-y", "-i", stem + ".wav", "-c:a", "libmp3lame", "-b:a", "192k", stem + ".mp3"]);
run(["-hide_banner", "-v", "error", "-y", "-i", stem + ".wav",
     "-lavfi", "showspectrumpic=s=1700x800:mode=combined:scale=log:fscale=log:legend=1:gain=3", stem + ".spectrum.png"]);
run(["-hide_banner", "-v", "error", "-y", "-i", stem + ".wav",
     "-lavfi", "showwavespic=s=1700x260:colors=0x111111", stem + ".wave.png"]);
const lu = run(["-hide_banner", "-i", stem + ".wav", "-af", "ebur128=peak=true", "-f", "null", "-"]);
const all = [...(lu.stderr || "").matchAll(/I:\s*(-?[\d.]+) LUFS[\s\S]{0,400}?LRA:\s*(-?[\d.]+) LU/g)];
if (all.length) { const m = all[all.length - 1]; console.log(`  integrated ${m[1]} LUFS · range ${m[2]} LU`); }
console.log(`  → mp3, spectrum and waveform written`);
