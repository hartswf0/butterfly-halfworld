#!/usr/bin/env node
/* ============================================================================
   analyse-score.mjs — measure wygwyl/footage/unified-drones.mp3 on its own
   terms: tonal centre, low-register partials, and pulse (or the honest
   absence of one). No audio library — ffmpeg only decodes; every number
   below (windowing, FFT, chroma folding, spectral flux, autocorrelation) is
   plain JS over the raw PCM, so what this prints is exactly what was
   measured and nothing a library decided for us.

     node wygwyl/analyse-score.mjs

   Writes wygwyl/score-analysis.json alongside the printed report.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const MP3 = path.join(HERE, "footage", "unified-drones.mp3");
const MANIFEST = "/workspace/hartswf0/prompt-language/WYGWYL-BK/OP-51/wygwyl-site/manifest.json";
const OUT_JSON = path.join(HERE, "score-analysis.json");
const SR = 22050;

/* ------------------------------------------------------------- decode --- */
function findFfmpeg() {
  const guess = path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg");
  if (fs.existsSync(guess)) return guess;
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  throw new Error("no ffmpeg found (node_modules/ffmpeg-static or PATH)");
}
function decode(file) {
  const ff = findFfmpeg();
  const r = spawnSync(ff, ["-i", file, "-f", "f32le", "-ar", String(SR), "-ac", "1", "-"],
    { maxBuffer: 1 << 30 });
  if (r.status !== 0 && (!r.stdout || !r.stdout.length)) {
    throw new Error("ffmpeg decode failed: " + (r.stderr || "").toString().slice(-800));
  }
  const buf = r.stdout;
  const n = Math.floor(buf.length / 4);
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i++) pcm[i] = buf.readFloatLE(i * 4);
  return pcm;
}

/* ---------------------------------------------------------------- FFT ---
   Iterative radix-2 Cooley-Tukey, in place, real+imag typed arrays reused
   across frames by the caller. N must be a power of two. */
function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { const tr = re[i]; re[i] = re[j]; re[j] = tr; const ti = im[i]; im[i] = im[j]; im[j] = ti; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curWr = 1, curWi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * curWr - im[i + k + len / 2] * curWi;
        const vi = re[i + k + len / 2] * curWi + im[i + k + len / 2] * curWr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nwr = curWr * wr - curWi * wi, nwi = curWr * wi + curWi * wr;
        curWr = nwr; curWi = nwi;
      }
    }
  }
}
function hann(n) { const w = new Float32Array(n); for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); return w; }

/* ------------------------------------------------------------- pitch ---- */
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function freqToPc(f) { const midi = 69 + 12 * Math.log2(f / 440); return ((Math.round(midi) % 12) + 12) % 12; }
function freqToNoteName(f) {
  const midi = 69 + 12 * Math.log2(f / 440);
  const r = Math.round(midi);
  const oct = Math.floor(r / 12) - 1;
  return `${NOTE_NAMES[((r % 12) + 12) % 12]}${oct}`;
}
/* Krumhansl-Kessler key profiles, used only to characterise the overall
   piece for the report — the per-film mode is chosen by the film, not by
   this correlation. */
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function corr(a, b) {
  const ma = a.reduce((s, x) => s + x, 0) / a.length, mb = b.reduce((s, x) => s + x, 0) / b.length;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { const x = a[i] - ma, y = b[i] - mb; num += x * y; da += x * x; db += y * y; }
  return num / Math.sqrt(da * db || 1);
}
function bestKey(chroma) {
  let best = { pc: 0, mode: "major", score: -Infinity };
  for (let root = 0; root < 12; root++) {
    const rotMaj = chroma.map((_, i) => chroma[(i + root) % 12]);
    const rotMin = rotMaj;
    const sMaj = corr(rotMaj, KK_MAJOR);
    const sMin = corr(rotMin, KK_MINOR);
    if (sMaj > best.score) best = { pc: root, mode: "major", score: sMaj };
    if (sMin > best.score) best = { pc: root, mode: "minor", score: sMin };
  }
  return best;
}

/* ------------------------------------------------------- manifest windows */
function loadFilmWindows() {
  if (fs.existsSync(MANIFEST)) {
    try {
      const j = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
      const films = j.films.map(f => ({ n: f.number, title: f.title, start: f.container_s[0], end: f.container_s[1] }));
      return { films, source: "manifest.json container_s" };
    } catch (e) { /* fall through */ }
  }
  // fallback: divide by the films' own movement-second totals, read from worlds/*.mjs
  const worldsDir = path.join(HERE, "worlds");
  const files = fs.readdirSync(worldsDir).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort();
  const films = []; let t = 0;
  for (const fn of files) {
    const src = fs.readFileSync(path.join(worldsDir, fn), "utf8");
    const n = fn.slice(0, 2);
    const secs = [...src.matchAll(/seconds:\s*(\d+(?:\.\d+)?)/g)].map(m => +m[1]);
    const dur = secs.reduce((s, x) => s + x, 0) + 5; // +5s TITLE card, per makeRuntime
    films.push({ n, title: fn, start: t, end: t + dur });
    t += dur;
  }
  return { films, source: "worlds/*.mjs seconds (fallback, no manifest)" };
}

/* ------------------------------------------------------------------ main */
console.log("decoding", MP3, `→ f32 mono @ ${SR}Hz`);
const pcm = decode(MP3);
const totalS = pcm.length / SR;
console.log(`  ${pcm.length.toLocaleString()} samples, ${(totalS / 60).toFixed(2)} min`);

const { films, source } = loadFilmWindows();
console.log(`film windows from: ${source}`);

/* ---------------------------------------------------- PASS A: chroma + bass
   N=8192 (≈2.69 Hz/bin @ 22050), hop=4096 (50% overlap). Long-window
   magnitude spectrum folded into 12 pitch classes; a running long-term
   average spectrum restricted to the low register for partial-picking. */
const NA = 8192, HOPA = 4096;
const winA = hann(NA);
const reA = new Float32Array(NA), imA = new Float32Array(NA);
const chromaGlobal = new Float64Array(12);
const ltasBass = new Float64Array(NA / 2); // long-term average spectrum, all frames
const perFilmChroma = films.map(() => new Float64Array(12));
let framesA = 0;

for (let start = 0; start + NA <= pcm.length; start += HOPA) {
  for (let i = 0; i < NA; i++) { reA[i] = pcm[start + i] * winA[i]; imA[i] = 0; }
  fftInPlace(reA, imA);
  const tCenter = (start + NA / 2) / SR;
  // find which film window this frame center belongs to
  let filmIdx = -1;
  for (let k = 0; k < films.length; k++) if (tCenter >= films[k].start && tCenter < films[k].end) { filmIdx = k; break; }
  for (let k = 1; k < NA / 2; k++) {
    const f = (k * SR) / NA;
    const mag = Math.hypot(reA[k], imA[k]);
    ltasBass[k] += mag;
    if (f >= 27.5 && f <= 5000) {
      const pc = freqToPc(f);
      chromaGlobal[pc] += mag;
      if (filmIdx >= 0) perFilmChroma[filmIdx][pc] += mag;
    }
  }
  framesA++;
}
console.log(`  pass A: ${framesA} frames (chroma + bass LTAS)`);

// normalise chroma to sum 1 for readability
function norm(v) { const s = v.reduce((a, b) => a + b, 0) || 1; return Array.from(v, x => x / s); }
const chromaGlobalN = norm(chromaGlobal);
const globalKey = bestKey(chromaGlobalN);

// bass partial peaks: local maxima of ltasBass below 200 Hz, parabolic-interpolated
function pickPeaks(spectrum, N, sr, fMin, fMax, count) {
  const kMin = Math.max(1, Math.floor((fMin * N) / sr));
  const kMax = Math.min(spectrum.length - 2, Math.ceil((fMax * N) / sr));
  const cands = [];
  for (let k = kMin; k <= kMax; k++) {
    if (spectrum[k] > spectrum[k - 1] && spectrum[k] > spectrum[k + 1]) {
      const a = spectrum[k - 1], b = spectrum[k], c = spectrum[k + 1];
      const denom = a - 2 * b + c;
      const delta = denom !== 0 ? 0.5 * (a - c) / denom : 0;
      const kInterp = k + Math.max(-0.5, Math.min(0.5, delta));
      const f = (kInterp * sr) / N;
      cands.push({ f, mag: b });
    }
  }
  cands.sort((x, y) => y.mag - x.mag);
  return cands.slice(0, count);
}
const bassPeaks = pickPeaks(ltasBass, NA, SR, 25, 200, 10)
  .map(p => ({ hz: +p.f.toFixed(2), note: freqToNoteName(p.f), mag: +p.mag.toFixed(1) }));

const perFilmReport = films.map((f, i) => {
  const cn = norm(perFilmChroma[i]);
  const top = cn.map((v, pc) => ({ pc, v })).sort((a, b) => b.v - a.v).slice(0, 3);
  return {
    n: f.n, title: f.title, start: f.start, end: f.end, seconds: +(f.end - f.start).toFixed(2),
    chroma: cn.map(x => +x.toFixed(4)),
    topPitchClasses: top.map(t => ({ note: NOTE_NAMES[t.pc], pc: t.pc, weight: +t.v.toFixed(4) })),
  };
});

/* ------------------------------------------------------ PASS B: pulse ---
   Spectral flux onset envelope (N=2048, hop=1024, ~46.4ms/frame), then
   autocorrelation over the 40–220 BPM lag range. A real tempo needs a
   clear, sharply-peaked autocorrelation; a flat one means the piece is
   pulseless and this SAYS SO instead of picking a lag anyway. */
const NB = 2048, HOPB = 1024;
const winB = hann(NB);
const reB = new Float32Array(NB), imB = new Float32Array(NB);
let prevMag = new Float64Array(NB / 2);
const onset = [];
for (let start = 0; start + NB <= pcm.length; start += HOPB) {
  for (let i = 0; i < NB; i++) { reB[i] = pcm[start + i] * winB[i]; imB[i] = 0; }
  fftInPlace(reB, imB);
  let flux = 0;
  for (let k = 1; k < NB / 2; k++) {
    const mag = Math.hypot(reB[k], imB[k]);
    const d = mag - prevMag[k];
    if (d > 0) flux += d;
    prevMag[k] = mag;
  }
  onset.push(flux);
}
console.log(`  pass B: ${onset.length} onset frames (${(HOPB / SR * 1000).toFixed(1)}ms/frame)`);

// mean-remove, half-wave rectify already done via flux>0 accumulation; now normalise
const onsetArr = Float64Array.from(onset);
const meanOn = onsetArr.reduce((a, b) => a + b, 0) / onsetArr.length;
for (let i = 0; i < onsetArr.length; i++) onsetArr[i] -= meanOn;

const frameRate = SR / HOPB; // frames per second
const bpmToLag = (bpm) => Math.round((60 / bpm) * frameRate);
// widened past the nominal 40-220bpm musical range so a slow swell period
// (a "pulse" too slow to call a beat) would still show up in the curve
const lagMin = bpmToLag(240), lagMax = Math.min(onsetArr.length - 2, bpmToLag(20));
let ac0 = 0; for (let i = 0; i < onsetArr.length; i++) ac0 += onsetArr[i] * onsetArr[i];
const acVals = [];
for (let lag = lagMin; lag <= lagMax; lag++) {
  let s = 0;
  for (let i = 0; i + lag < onsetArr.length; i++) s += onsetArr[i] * onsetArr[i + lag];
  acVals.push({ lag, bpm: +(60 * frameRate / lag).toFixed(2), ac: ac0 > 0 ? s / ac0 : 0 });
}
/* THE ARTIFACT TO GUARD AGAINST: normalised autocorrelation of an onset
   envelope decays smoothly with lag on its own — overlapping analysis
   windows and any slow envelope drift correlate neighbouring frames with
   NO periodicity involved. Naively taking argmax(ac) picks the shortest
   searched lag every time, which is exactly what a first pass here did
   (a "215 BPM" that was really just the lag-6 edge of a monotone decay,
   with every candidate below it strictly smaller — no bump anywhere).
   The fix: detrend with a wide moving average, then only trust a LOCAL
   PEAK in the residual — a lag where the curve bumps up above its own
   smooth trend and above both neighbours. A true beat produces such a
   bump (and usually harmonically related ones); a driftless texture does
   not, no matter how the raw curve is sorted. */
const smoothWin = Math.max(3, Math.round((lagMax - lagMin) / 6) | 1);
const trend = acVals.map((_, i) => {
  let s = 0, n = 0;
  for (let j = Math.max(0, i - smoothWin); j <= Math.min(acVals.length - 1, i + smoothWin); j++) { s += acVals[j].ac; n++; }
  return s / n;
});
const resid = acVals.map((v, i) => v.ac - trend[i]);
const residMean = resid.reduce((a, b) => a + b, 0) / resid.length;
const residStd = Math.sqrt(resid.reduce((s, x) => s + (x - residMean) ** 2, 0) / resid.length) || 1e-9;
const peaks = [];
for (let i = 1; i < acVals.length - 1; i++) {
  if (resid[i] > resid[i - 1] && resid[i] > resid[i + 1] && resid[i] > 0) {
    peaks.push({ ...acVals[i], residual: resid[i], z: resid[i] / residStd });
  }
}
peaks.sort((a, b) => b.z - a.z);
const top5 = peaks.slice(0, 5).length ? peaks.slice(0, 5) : acVals.slice().sort((a, b) => b.ac - a.ac).slice(0, 5);
const bestPeak = peaks[0] || null;
// confidence: z-score of the strongest genuine local peak against the
// residual noise floor, squashed to [0,1]. A flat/monotone curve has no
// peaks at all (bestPeak === null) → confidence 0, full stop.
const confidence = bestPeak ? Math.max(0, Math.min(1, bestPeak.z / 8)) : 0;
const PULSE_CONFIDENT = confidence >= 0.35 && !!bestPeak; // threshold: below this, no credible pulse

let bpm = 0, phaseS = 0, bestLag = -1;
if (PULSE_CONFIDENT) {
  bestLag = bestPeak.lag;
  bpm = bestPeak.bpm;
  // phase: which offset within one period best aligns with onset peaks
  let bestPhase = 0, bestPhaseScore = -Infinity;
  for (let ph = 0; ph < bestLag; ph++) {
    let s = 0, n = 0;
    for (let i = ph; i < onset.length; i += bestLag) { s += onset[i]; n++; }
    const avg = n ? s / n : 0;
    if (avg > bestPhaseScore) { bestPhaseScore = avg; bestPhase = ph; }
  }
  phaseS = +(bestPhase * HOPB / SR).toFixed(3);
}

/* -------------------------------------------------------------- report -- */
console.log("\n================ TONAL CENTRE (whole piece) ================");
chromaGlobalN.forEach((v, pc) => {
  const bar = "#".repeat(Math.round(v * 200));
  console.log(`  ${NOTE_NAMES[pc].padEnd(3)} ${(v * 100).toFixed(1).padStart(5)}%  ${bar}`);
});
console.log(`\n  best Krumhansl-Schmuckler fit: ${NOTE_NAMES[globalKey.pc]} ${globalKey.mode} (r=${globalKey.score.toFixed(3)})`);
const topPc = chromaGlobalN.map((v, pc) => ({ pc, v })).sort((a, b) => b.v - a.v)[0];
console.log(`  strongest pitch class overall: ${NOTE_NAMES[topPc.pc]} (${(topPc.v * 100).toFixed(1)}% of folded energy)`);

console.log("\n================ LOW-REGISTER PARTIALS (whole piece) ========");
for (const p of bassPeaks) console.log(`  ${p.hz.toFixed(2).padStart(8)} Hz  ${p.note.padEnd(5)} mag=${p.mag}`);

console.log("\n================ PER-FILM TONAL CENTRE (manifest windows) ===");
for (const f of perFilmReport) {
  const tp = f.topPitchClasses.map(t => `${t.note}(${(t.weight * 100).toFixed(0)}%)`).join(", ");
  console.log(`  ${f.n}  ${f.title.padEnd(28)} [${f.start.toFixed(1).padStart(7)}–${f.end.toFixed(1).padStart(7)}s]  ${tp}`);
}

console.log("\n================ PULSE ========================================");
console.log(`  onset envelope: ${onset.length} frames @ ${(HOPB / SR * 1000).toFixed(1)}ms, searched ${lagMin}-${lagMax} frame lags (20-240bpm)`);
console.log(`  detrended autocorrelation, strongest LOCAL PEAKS (bump above the curve's own smooth trend):`);
if (peaks.length) {
  for (const t of top5) console.log(`    ${String(t.lag).padStart(4)} frames → ${t.bpm.toFixed(1).padStart(6)} bpm → ac=${t.ac.toFixed(4)}  z=${t.z.toFixed(2)}`);
} else {
  console.log(`    none — the autocorrelation curve is monotone/flat across the whole searched range,`);
  console.log(`    i.e. no lag stands above the curve's own smooth decay. Top raw (undetrended) values,`);
  console.log(`    shown only to demonstrate they are NOT a peak (they just decrease from the shortest lag):`);
  for (const t of top5) console.log(`    ${String(t.lag).padStart(4)} frames → ${t.bpm.toFixed(1).padStart(6)} bpm → ac=${t.ac.toFixed(4)}`);
}
console.log(`  confidence=${confidence.toFixed(3)} (z-score of best local peak / 8, clamped; 0 if no local peak exists)`);
if (PULSE_CONFIDENT) {
  console.log(`  VERDICT: credible pulse at ~${bpm} BPM, phase (first beat) ≈ ${phaseS}s (confidence ${confidence.toFixed(2)} ≥ 0.35 threshold).`);
} else {
  console.log(`  VERDICT: NO credible pulse. The autocorrelation of the onset envelope is flat/monotone`);
  console.log(`  (confidence ${confidence.toFixed(2)} < 0.35) — no lag bumps above the curve's own smooth trend,`);
  console.log(`  which is what a sustained-drone texture with no beat looks like. This is sustained/drone`);
  console.log(`  material with no metric grid to lock foley to; a "bpm" would be invented, not measured.`);
  console.log(`  Step 3 (lock the foley to a beat) will be SKIPPED for this reason.`);
}

const report = {
  source: { mp3: path.relative(ROOT, MP3), sampleRate: SR, seconds: +totalS.toFixed(3), filmWindowSource: source },
  tonalCentre: {
    chromaGlobal: chromaGlobalN.map(x => +x.toFixed(5)),
    strongestPitchClassOverall: NOTE_NAMES[topPc.pc],
    krumhanslSchmuckler: { pc: NOTE_NAMES[globalKey.pc], mode: globalKey.mode, r: +globalKey.score.toFixed(4) },
  },
  lowRegisterPartials: bassPeaks,
  perFilm: perFilmReport,
  pulse: {
    onsetFrames: onset.length, frameHopMs: +(HOPB / SR * 1000).toFixed(2),
    bpm, phaseSeconds: phaseS, confidence: +confidence.toFixed(4),
    credible: PULSE_CONFIDENT,
    topCandidates: top5,
  },
};
fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
console.log(`\nwrote ${path.relative(ROOT, OUT_JSON)}`);
