#!/usr/bin/env node
/* ============================================================================
   analyse.mjs — FULL-SPECTRUM ANALYSIS, AND A CUT SHEET.

     node wygwyl/cut/analyse.mjs "path/to/QUIET COMES THROUGH THE BODY"
     node wygwyl/cut/analyse.mjs one-song.mp3 --out renders/cut

   Point it at a folder of audio and it writes, per song:

     <name>.analysis.json   every number below
     <name>.cuts.tsv        the cut sheet, ranked, with a type and a risk
     <name>.map.png         the song as a picture: spectrum, bands, onsets,
                            the beat grid, the sections and the cut marks
     SUMMARY.md             the folder read across itself

   WHAT IT MEASURES, AND WHY EACH ONE IS THERE FOR AN EDITOR

     loudness       integrated LUFS and range. A song with 3 LU of range has no
                    dynamics to cut against and the picture must supply them.
     bands          sub / low / low-mid / mid / presence / air over time. The
                    band that carries the pulse is not always the one you hear
                    as the beat, and a cut that lands where the sub drops out
                    reads as weightless.
     onsets         half-wave rectified spectral flux with an adaptive floor.
                    These are the moments the music actually changes, which is
                    not the same as the beats.
     tempo & grid   autocorrelation of the onset envelope, with the half and
                    double checked explicitly, because a slow song and its
                    double are the same curve and the wrong one makes every
                    downbeat land on an offbeat.
     sections       a self-similarity matrix over band vectors with a
                    checkerboard kernel. These are the free cuts — the places
                    the song has already decided something changes.
     rests          where the song stops. A rest longer than about 180 ms is a
                    door; it is the only cut that costs nothing.

   THE CUT SHEET IS THE POINT. Every candidate gets a TYPE and two numbers:

     mask   how much broadband energy is at that instant. A cut inside a loud
            transient is HIDDEN by it — you spend a hit and get no cut. A cut
            in a rest is NAKED and reads as a decision.
     kill   how likely a cut there flattens the song's momentum, which is a
            different question from whether it is audible.

   Nothing here decides for you. It says where the doors are.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { print, png } from "../deep/screen.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);
const VALUED = new Set(["--out", "--sr", "--hop"]);
const target = argv.find((a, i) => !a.startsWith("--") && !VALUED.has(argv[i - 1]));
if (!target) { console.error("usage: analyse.mjs <folder-or-file> [--out DIR]"); process.exit(1); }
const OUT = path.resolve(ROOT, flag("out", "renders/cut"));
fs.mkdirSync(OUT, { recursive: true });

const FF = (() => {
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  const p = path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg");
  return fs.existsSync(p) ? fs.realpathSync(p) : null;
})();
if (!FF) { console.error("no ffmpeg — cannot decode audio"); process.exit(1); }

const AUDIO = /\.(mp3|wav|m4a|aac|flac|ogg|opus|aif|aiff|wma)$/i;
const files = fs.statSync(target).isDirectory()
  ? fs.readdirSync(target).filter(f => AUDIO.test(f)).sort().map(f => path.join(target, f))
  : [target];
if (!files.length) { console.error(`no audio files in ${target}`); process.exit(1); }

/* ---- decode ---------------------------------------------------------------
   Straight to raw mono float at 22050, which is Nyquist 11 kHz — everything an
   edit decision depends on lives under that, and it halves every transform. */
const SR = +flag("sr", 22050);
function decode(file) {
  const r = spawnSync(FF, ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR),
    "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) return null;
  const b = r.stdout;
  return new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4));
}
function loudness(file) {
  const r = spawnSync(FF, ["-v", "info", "-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 1 << 26 });
  const txt = (r.stderr || "") + (r.stdout || "");
  /* THE LAST MATCH, NOT THE FIRST. ebur128 prints a running value every frame,
     so the first "I:" in the log is one near-silent moment at the top of the
     song and taking it reports a -70 LUFS master. */
  const grab = (re) => { let m, last = null; const g = new RegExp(re, "g"); while ((m = g.exec(txt))) last = m[1]; return last === null ? null : +last; };
  return { lufs: grab("I:\\s*(-?[\\d.]+)\\s*LUFS"), lra: grab("LRA:\\s*(-?[\\d.]+)\\s*LU"),
           peak: grab("Peak:\\s*(-?[\\d.]+)\\s*dBFS") };
}

/* ---- transform ------------------------------------------------------------ */
const N = 2048, HOP = +flag("hop", 256);           // 93 ms window, 11.6 ms hop
const re = new Float64Array(N), im = new Float64Array(N);
const rev = new Uint32Array(N);
{ const bits = Math.log2(N); for (let i = 0; i < N; i++) { let r = 0; for (let k = 0; k < bits; k++) r = (r << 1) | ((i >> k) & 1); rev[i] = r; } }
const CS = new Float64Array(N / 2), SN = new Float64Array(N / 2);
for (let i = 0; i < N / 2; i++) { CS[i] = Math.cos(-2 * Math.PI * i / N); SN[i] = Math.sin(-2 * Math.PI * i / N); }
const WIN = new Float64Array(N);
for (let i = 0; i < N; i++) WIN[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
function fft() {
  for (let i = 0; i < N; i++) if (rev[i] > i) { let t = re[i]; re[i] = re[rev[i]]; re[rev[i]] = t; t = im[i]; im[i] = im[rev[i]]; im[rev[i]] = t; }
  for (let size = 2; size <= N; size <<= 1) {
    const half = size >> 1, step = N / size;
    for (let i = 0; i < N; i += size) for (let j = 0; j < half; j++) {
      const c = CS[j * step], s = SN[j * step], a = i + j, d = a + half;
      const tr = re[d] * c - im[d] * s, ti = re[d] * s + im[d] * c;
      re[d] = re[a] - tr; im[d] = im[a] - ti; re[a] += tr; im[a] += ti;
    }
  }
}
const BANDS = [["sub", 20, 60], ["low", 60, 160], ["lowmid", 160, 400],
               ["mid", 400, 1000], ["pres", 1000, 4000], ["air", 4000, 11000]];

function spectra(x) {
  const frames = Math.max(1, Math.floor((x.length - N) / HOP));
  const half = N / 2;
  const mag = new Float32Array(frames * half);
  const band = Array.from(BANDS, () => new Float32Array(frames));
  const bIdx = BANDS.map(([, lo, hi]) => [Math.max(1, Math.round(lo * N / SR)), Math.min(half - 1, Math.round(hi * N / SR))]);
  for (let f = 0; f < frames; f++) {
    const o = f * HOP;
    re.fill(0); im.fill(0);
    for (let i = 0; i < N; i++) re[i] = (x[o + i] || 0) * WIN[i];
    fft();
    for (let k = 0; k < half; k++) mag[f * half + k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    for (let b = 0; b < BANDS.length; b++) {
      let s = 0; const [a, z] = bIdx[b];
      for (let k = a; k <= z; k++) { const m = mag[f * half + k]; s += m * m; }
      band[b][f] = Math.sqrt(s / Math.max(1, z - a + 1));
    }
  }
  return { frames, half, mag, band };
}

/* ---- onset envelope -------------------------------------------------------
   Log-compressed magnitude, positive difference only, summed. Compression
   matters more than it looks: on a mastered song the linear difference is
   dominated by whatever is loudest, so a quiet hi-hat pattern that is carrying
   the pulse contributes nothing and the envelope tracks the bass alone. */
function onsetEnvelope(S) {
  const { frames, half, mag } = S;
  const flux = new Float32Array(frames);
  let prev = new Float32Array(half);
  for (let f = 0; f < frames; f++) {
    let s = 0;
    for (let k = 1; k < half; k++) {
      const v = Math.log1p(400 * mag[f * half + k]);
      const d = v - prev[k];
      if (d > 0) s += d;
      prev[k] = v;
    }
    flux[f] = s;
  }
  return flux;
}
const fps = SR / HOP;
function smooth(a, w) {
  const o = new Float32Array(a.length);
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i]; if (i >= w) s -= a[i - w];
    o[i] = s / Math.min(i + 1, w);
  }
  return o;
}
/* peaks above a local median plus a fraction of the local spread */
function pickOnsets(flux) {
  const W = Math.round(fps * 0.6), out = [];
  const med = new Float32Array(flux.length);
  for (let i = 0; i < flux.length; i++) {
    const a = Math.max(0, i - W), b = Math.min(flux.length, i + W);
    const win = Array.from(flux.slice(a, b)).sort((p, q) => p - q);
    med[i] = win[Math.floor(win.length / 2)] + 0.55 * (win[Math.floor(win.length * 0.9)] - win[Math.floor(win.length / 2)]);
  }
  let lastT = -1;
  for (let i = 2; i < flux.length - 2; i++) {
    if (flux[i] <= med[i]) continue;
    if (!(flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1] && flux[i] > flux[i - 2] && flux[i] > flux[i + 2])) continue;
    const t = i / fps;
    if (t - lastT < 0.055) continue;                     // 55 ms refractory
    out.push({ t, i, s: flux[i] });
    lastT = t;
  }
  const mx = out.reduce((a, c) => Math.max(a, c.s), 1e-9);
  for (const o of out) o.s /= mx;
  return out;
}

/* ---- tempo ---------------------------------------------------------------
   Autocorrelation of the onset envelope, then the half and the double checked
   explicitly. A song and its double are the same curve; picking the wrong one
   puts every downbeat you cut on an offbeat, which is the single most common
   way an edit ends up feeling drunk. */
function tempo(flux) {
  const f = smooth(flux, 3);
  const mean = f.reduce((a, c) => a + c, 0) / f.length;
  const d = Float32Array.from(f, v => v - mean);
  const loLag = Math.round(fps * 60 / 200), hiLag = Math.round(fps * 60 / 55);
  let best = { bpm: 0, score: -1 };
  const scores = [];
  for (let lag = loLag; lag <= hiLag; lag++) {
    let s = 0, n = 0;
    for (let i = 0; i + lag < d.length; i++) { s += d[i] * d[i + lag]; n++; }
    const sc = s / Math.max(1, n) / (1 + 0.35 * Math.abs(Math.log2((fps * 60 / lag) / 110)));
    scores.push({ bpm: fps * 60 / lag, sc });
    if (sc > best.score) best = { bpm: fps * 60 / lag, score: sc };
  }
  const at = (bpm) => { const s = scores.reduce((a, c) => Math.abs(c.bpm - bpm) < Math.abs(a.bpm - bpm) ? c : a, scores[0]); return s.sc; };
  const alt = [best.bpm / 2, best.bpm * 2].filter(b => b >= 55 && b <= 200);
  const cands = [{ bpm: best.bpm, sc: best.score }, ...alt.map(b => ({ bpm: b, sc: at(b) }))];
  const win = cands.reduce((a, c) => (c.sc > a.sc ? c : a));
  /* CONFIDENCE MUST MEASURE PEAKINESS, NOT THE WINNER OVER ITSELF. The first
     version divided the best lag's score by the maximum of the same array,
     which is 1 by construction — so a 24-minute record of drones came back
     "161.5 BPM, confidence 100%", and an editor trusting that would have built
     a grid onto a song that has no beat at all. What matters is how far the
     winning lag stands above the rest of the distribution: a real pulse towers
     over the 90th percentile, a drone barely clears it. */
  const vals = scores.map(s => s.sc).sort((a, b) => a - b);
  const p90 = vals[Math.floor(vals.length * 0.9)] || 1e-9;
  const mx = Math.max(...vals, 1e-9);
  /* phase: slide a comb of impulses at this period over the envelope */
  const per = fps * 60 / win.bpm;
  let bestPh = 0, bestV = -1;
  for (let ph = 0; ph < per; ph += 0.5) {
    let s = 0;
    for (let k = 0; ph + k * per < f.length; k++) s += f[Math.round(ph + k * per)] || 0;
    if (s > bestV) { bestV = s; bestPh = ph; }
  }
  const conf = Math.max(0, Math.min(1, (win.sc / Math.max(1e-9, p90) - 1)));
  return { bpm: win.bpm, confidence: conf, period: per / fps, phase: bestPh / fps,
           alternatives: cands.map(c => ({ bpm: +c.bpm.toFixed(1), score: +(c.sc / mx).toFixed(3) })) };
}

/* ---- sections -------------------------------------------------------------
   A self-similarity matrix over normalised band vectors, read with a
   checkerboard kernel. Where the kernel spikes, the song stopped being the
   thing it was — those are the cuts the music has already made for you. */
function sections(S, dur) {
  const step = Math.max(1, Math.round(fps * 0.25));      // a quarter-second grid
  const M = Math.floor(S.frames / step);
  if (M < 8) return [];
  const V = [];
  for (let m = 0; m < M; m++) {
    const v = BANDS.map((_, b) => {
      let s = 0; for (let k = 0; k < step; k++) s += S.band[b][m * step + k] || 0;
      return s / step;
    });
    const n = Math.hypot(...v) || 1;
    V.push(v.map(x => x / n));
  }
  const K = Math.max(4, Math.round(4 / 0.25));           // a four-second kernel
  const nov = new Float32Array(M);
  for (let m = K; m < M - K; m++) {
    let same = 0, cross = 0, n1 = 0, n2 = 0;
    for (let a = 1; a <= K; a++) for (let b = 1; b <= K; b++) {
      const dotAB = V[m - a].reduce((s, x, i) => s + x * V[m - b][i], 0);
      const dotCD = V[m + a].reduce((s, x, i) => s + x * V[m + b][i], 0);
      const dotX = V[m - a].reduce((s, x, i) => s + x * V[m + b][i], 0);
      same += dotAB + dotCD; n1 += 2; cross += dotX; n2++;
    }
    nov[m] = same / Math.max(1, n1) - cross / Math.max(1, n2);
  }
  const mx = Math.max(...nov, 1e-9);
  const out = [];
  for (let m = 2; m < M - 2; m++) {
    if (nov[m] < mx * 0.30) continue;
    if (!(nov[m] >= nov[m - 1] && nov[m] >= nov[m + 1])) continue;
    const t = m * step / fps;
    if (out.length && t - out[out.length - 1].t < 6) { if (nov[m] > out[out.length - 1].s * mx) out[out.length - 1] = { t, s: nov[m] / mx }; continue; }
    out.push({ t, s: nov[m] / mx });
  }
  return out;
}

/* ---- rests ---------------------------------------------------------------- */
function rests(S) {
  const tot = new Float32Array(S.frames);
  for (let f = 0; f < S.frames; f++) { let s = 0; for (let b = 0; b < BANDS.length; b++) s += S.band[b][f] * S.band[b][f]; tot[f] = Math.sqrt(s); }
  const sorted = Float32Array.from(tot).sort();
  const med = sorted[Math.floor(sorted.length / 2)];
  const thr = med * 0.30;
  const out = []; let run = -1;
  for (let f = 0; f < S.frames; f++) {
    if (tot[f] < thr) { if (run < 0) run = f; }
    else if (run >= 0) { const d = (f - run) / fps; if (d >= 0.18) out.push({ t: run / fps, dur: d }); run = -1; }
  }
  if (run >= 0) { const d = (S.frames - run) / fps; if (d >= 0.18) out.push({ t: run / fps, dur: d }); }
  return { rests: out, energy: tot, floor: thr };
}

/* ---- the cut sheet -------------------------------------------------------- */
function cutSheet(dur, T, onsets, secs, R, S) {
  const at = (t) => Math.min(S.frames - 1, Math.max(0, Math.round(t * fps)));
  const eMax = Math.max(...R.energy, 1e-9);
  const mask = (t) => R.energy[at(t)] / eMax;
  const near = (t, list, w) => list.find(o => Math.abs(o.t - t) < w);
  const cands = new Map();
  const put = (t, type, why, extra = {}) => {
    if (t < 0.15 || t > dur - 0.15) return;
    const key = t.toFixed(2);
    const cur = cands.get(key);
    if (!cur || RANK[type] > RANK[cur.type]) cands.set(key, { t, type, why, ...extra });
  };
  const RANK = { BEAT: 1, ONSET: 2, TAIL: 2, BAR: 3, TEXTURE: 4, BREATH: 5, SECTION: 6 };
  for (const s of secs) put(s.t, "SECTION", "the song already changed here", { strength: +s.s.toFixed(3) });
  for (const r of R.rests) {
    put(r.t, "BREATH", `a ${r.dur.toFixed(2)}s rest opens`, { rest: +r.dur.toFixed(3) });
    if (r.dur > 0.4) put(r.t + r.dur, "BREATH", "the song comes back in", { rest: +r.dur.toFixed(3) });
  }
  if (T.confidence > 0.2) {
    for (let k = 0, t = T.phase; t < dur; k++, t = T.phase + k * T.period) {
      const bar = k % 4 === 0;
      put(t, bar ? "BAR" : "BEAT", bar ? "downbeat of the grid" : "on the grid", { beat: k });
    }
  }
  for (const o of onsets) if (o.s > 0.35 && !near(o.t, secs, 0.4)) put(o.t, "ONSET", "a transient lands here", { strength: +o.s.toFixed(3) });

  const list = [...cands.values()].sort((a, b) => a.t - b.t);
  for (const c of list) {
    c.mask = +mask(c.t).toFixed(3);
    /* KILL RISK — the chance a cut here flattens the song rather than riding it.
       A rest is a door and costs nothing. A section boundary is a door the song
       opened itself. A cut inside a loud transient is hidden by it: you spend a
       hit and get no cut. A cut in a decaying tail amputates the room, which is
       the one the ear notices and cannot name. And a cut on the grid is safe
       and, past the third one, is the thing that kills momentum by being
       predictable — that risk is not in the signal, so it is stated and not
       scored. */
    const decaying = R.energy[at(c.t)] < R.energy[at(Math.max(0, c.t - 0.12))] * 0.72;
    c.kill = +Math.min(1, Math.max(0,
      (c.type === "BREATH" ? 0.05 : c.type === "SECTION" ? 0.10 : c.type === "BAR" ? 0.32 : c.type === "TEXTURE" ? 0.30 : 0.55)
      + (c.type === "ONSET" ? c.mask * 0.35 : 0)
      + (decaying ? 0.30 : 0))).toFixed(3);
    c.tail = decaying;
  }
  return list;
}

/* ---- the picture ---------------------------------------------------------- */
const PW = 384, PH = 168;
function mapImage(file, S, T, onsets, secs, R, cuts, dur) {
  const F = new Float32Array(PW * PH);
  const rows = 112;
  /* the spectrum, log rows, peak per row — the same estimator the rest of this
     project settled on after summing filled every high row with leakage */
  const half = S.half, LO = 40, HI = 10500;
  for (let x = 0; x < PW; x++) {
    const f0 = Math.floor(x / PW * S.frames), f1 = Math.max(f0 + 1, Math.floor((x + 1) / PW * S.frames));
    for (let r = 0; r < rows; r++) {
      const hz = LO * Math.pow(HI / LO, (rows - 1 - r) / (rows - 1));
      const hz2 = LO * Math.pow(HI / LO, (rows - r) / (rows - 1));
      const k0 = Math.max(1, Math.round(hz * N / SR)), k1 = Math.min(half - 1, Math.max(k0, Math.round(hz2 * N / SR)));
      let m = 0;
      for (let f = f0; f < f1; f++) for (let k = k0; k <= k1; k++) { const v = S.mag[f * half + k]; if (v > m) m = v; }
      F[r * PW + x] = m;
    }
  }
  let pk = 0; for (let i = 0; i < rows * PW; i++) if (F[i] > pk) pk = F[i];
  for (let i = 0; i < rows * PW; i++) F[i] = Math.pow(F[i] / (pk || 1), 0.42);
  /* the onset envelope as a strip under it, then the marks */
  const eMax = Math.max(...R.energy, 1e-9);
  for (let x = 0; x < PW; x++) {
    const f = Math.floor(x / PW * S.frames);
    const h = Math.round((R.energy[f] / eMax) * 26);
    for (let y = 0; y < h; y++) F[(rows + 30 - y) * PW + x] = 0.85;
  }
  const col = (t) => Math.round(t / dur * (PW - 1));
  for (const o of onsets) if (o.s > 0.3) { const x = col(o.t); for (let y = rows + 32; y < rows + 38; y++) F[y * PW + x] = 0.55 + o.s * 0.45; }
  if (T.confidence > 0.2) for (let k = 0, t = T.phase; t < dur; k++, t = T.phase + k * T.period) {
    const x = col(t); if (x < 0 || x >= PW) continue;
    for (let y = rows + 40; y < rows + (k % 4 === 0 ? 48 : 44); y++) F[y * PW + x] = 1;
  }
  for (const c of cuts) {
    if (c.kill > 0.20) continue;          // only the doors, or the row is a wall
    const x = col(c.t);
    for (let y = rows + 50; y < PH - 2; y++) F[y * PW + x] = c.type === "SECTION" ? 1 : 0.72;
  }
  for (const s of secs) { const x = col(s.t); for (let y = 0; y < rows; y++) F[y * PW + x] = Math.max(F[y * PW + x], 0.9); }
  const pr = print(F, PW, PH, { cell: 3 });
  const out = path.join(OUT, base(file) + ".map.png");
  png(out, pr.px, pr.W, pr.H);
  return out;
}
const base = (f) => path.basename(f).replace(/\.[^.]+$/, "").replace(/[^\w.\- ]+/g, "_");

/* ---- run ------------------------------------------------------------------ */
const summary = [];
for (const file of files) {
  process.stdout.write(`\n${path.basename(file)}\n`);
  const x = decode(file);
  if (!x || x.length < SR) { console.log("  could not decode"); continue; }
  const dur = x.length / SR;
  const L = loudness(file);
  const S = spectra(x);
  const flux = onsetEnvelope(S);
  const onsets = pickOnsets(flux);
  const T = tempo(flux);
  const secs = sections(S, dur);
  const R = rests(S);
  const cuts = cutSheet(dur, T, onsets, secs, R, S);
  const bandMean = BANDS.map(([n], b) => {
    const a = S.band[b]; let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i];
    return [n, Math.sqrt(s / a.length)];
  });
  const bTot = bandMean.reduce((a, c) => a + c[1], 0) || 1;
  const balance = Object.fromEntries(bandMean.map(([n, v]) => [n, +(v / bTot).toFixed(3)]));
  /* which band the pulse actually lives in: correlate each band's own flux with
     the beat comb. It is regularly not the one you would call "the beat". */
  const pulseBand = (() => {
    if (T.confidence <= 0.2) return null;
    let best = null;
    for (let b = 0; b < BANDS.length; b++) {
      const a = S.band[b]; let s = 0;
      for (let k = 0, t = T.phase; t < dur; k++, t = T.phase + k * T.period) {
        const i = Math.round(t * fps); if (i < 1 || i >= a.length) continue;
        s += Math.max(0, a[i] - a[i - 1]);
      }
      if (!best || s > best.s) best = { band: BANDS[b][0], s };
    }
    return best?.band || null;
  })();
  const free = cuts.filter(c => c.kill <= 0.2);
  const rec = free.length ? free : cuts.filter(c => c.kill <= 0.35);

  const A = {
    file: path.basename(file), seconds: +dur.toFixed(2),
    loudness: L, bpm: +T.bpm.toFixed(1), tempo_confidence: +T.confidence.toFixed(3),
    beat_period: +T.period.toFixed(4), beat_phase: +T.phase.toFixed(3),
    tempo_alternatives: T.alternatives, pulse_band: pulseBand,
    band_balance: balance,
    onsets: onsets.length, onsets_per_min: +(onsets.length / (dur / 60)).toFixed(1),
    sections: secs.map(s => ({ t: +s.t.toFixed(2), strength: +s.s.toFixed(3) })),
    rests: R.rests.map(r => ({ t: +r.t.toFixed(2), dur: +r.dur.toFixed(3) })),
    rest_seconds: +R.rests.reduce((a, c) => a + c.dur, 0).toFixed(2),
    cuts: cuts.map(c => ({ t: +c.t.toFixed(3), type: c.type, mask: c.mask, kill: c.kill, tail: !!c.tail, why: c.why })),
    free_cuts: free.length,
  };
  fs.writeFileSync(path.join(OUT, base(file) + ".analysis.json"), JSON.stringify(A, null, 1));
  fs.writeFileSync(path.join(OUT, base(file) + ".cuts.tsv"),
    "time\ttype\tmask\tkill\ttail\twhy\n" + cuts.map(c =>
      `${c.t.toFixed(3)}\t${c.type}\t${c.mask}\t${c.kill}\t${c.tail ? "yes" : ""}\t${c.why}`).join("\n") + "\n");
  const img = mapImage(file, S, T, onsets, secs, R, cuts, dur);

  console.log(`  ${fmt(dur)}  ${L.lufs ?? "?"} LUFS  range ${L.lra ?? "?"} LU`);
  console.log(`  ${T.bpm.toFixed(1)} BPM  confidence ${(T.confidence * 100).toFixed(0)}%  ${T.alternatives.map(a => a.bpm + "@" + a.score).join("  ")}`);
  console.log(`  pulse in the ${pulseBand ?? "—"} band · balance ${Object.entries(balance).map(([k, v]) => k + " " + (v * 100).toFixed(0) + "%").join("  ")}`);
  console.log(`  ${onsets.length} onsets (${A.onsets_per_min}/min) · ${secs.length} sections · ${R.rests.length} rests totalling ${A.rest_seconds}s`);
  console.log(`  ${cuts.length} candidates · ${free.length} FREE (kill<=0.20) · first five:`);
  for (const c of rec.slice(0, 5)) console.log(`     ${fmt(c.t).padStart(7)}  ${c.type.padEnd(8)} kill ${c.kill}  mask ${c.mask}  ${c.why}`);
  console.log(`  → ${path.relative(ROOT, img)}`);
  summary.push({ ...A, img: path.basename(img) });
}
function fmt(s) { const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(2).padStart(5, "0")}`; }

/* ---- the folder, read across itself --------------------------------------- */
if (summary.length) {
  const L = [];
  L.push(`# ${path.basename(target)} — cut analysis\n`);
  L.push(`${summary.length} songs · analysed at ${SR} Hz, ${N}-point window, ${(HOP / SR * 1000).toFixed(1)} ms hop\n`);
  L.push(`| song | length | LUFS | range | BPM | conf | pulse | onsets/min | sections | rest s | free cuts |`);
  L.push(`|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const s of summary) L.push(`| ${s.file} | ${fmt(s.seconds)} | ${s.loudness.lufs ?? "?"} | ${s.loudness.lra ?? "?"} | ${s.bpm} | ${(s.tempo_confidence * 100).toFixed(0)}% | ${s.pulse_band ?? "—"} | ${s.onsets_per_min} | ${s.sections.length} | ${s.rest_seconds} | ${s.free_cuts} |`);
  L.push(`\n## how to read this\n`);
  L.push(`**range** under about 4 LU means the song has no dynamics of its own to cut against and the picture has to supply them.`);
  L.push(`**conf** under about 30% means the tempo estimate is a guess — check the alternatives in the JSON before trusting any grid.`);
  L.push(`**pulse** is the band whose own attacks line up with the beat, which is regularly not the band you would call the beat.`);
  L.push(`**free cuts** are candidates with kill risk at or under 0.20 — rests and section boundaries, the doors the song opened itself.`);
  fs.writeFileSync(path.join(OUT, "SUMMARY.md"), L.join("\n") + "\n");
  console.log(`\n→ ${path.relative(ROOT, path.join(OUT, "SUMMARY.md"))}`);
}
