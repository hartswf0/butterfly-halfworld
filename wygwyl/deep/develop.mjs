#!/usr/bin/env node
/* ============================================================================
   develop.mjs — READ THE PICTURE BACK OUT OF THE SOUND.

     node wygwyl/deep/develop.mjs 13              develop renders/deep/sonify-13.wav
     node wygwyl/deep/develop.mjs 13 --plate      and print the frame beside it
     node wygwyl/deep/develop.mjs 13 --at 40      which frame the plate is

   `sonify.mjs --icon` transmits a frame as sound. This receives it. And it
   does so by ANALYSING THE AUDIO — a short-time Fourier transform of the
   rendered wav — rather than by printing the amplitudes that were sent, which
   would prove nothing at all. If a harbour comes out of the far end of an
   FFT, the harbour was in the sound.

   The row-to-frequency mapping is inverted exactly: six octaves from 120 Hz
   were laid out logarithmically across 144 rows, so each row's band is
   gathered back and the picture stands up straight. Magnitudes are printed
   through `screen.mjs`, the same halftone and the same ramp the film frames
   are printed through, so what you are looking at is not a diagnostic of the
   sound. It is the sound, developed.

   THE LOW ROWS ARE SOFT AND THAT IS PHYSICS, NOT A BUG. A row near the bottom
   of the picture is about three hertz wide; a window long enough to resolve
   three hertz is a fifth of a second long, and a column of this picture is ten
   milliseconds. The bottom of the frame is therefore smeared horizontally by
   roughly a column and a half no matter how the transform is arranged. Six
   octaves from 120 Hz rather than seven from 55 buys back the bottom third.
   ========================================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { print, png } from "./screen.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT = path.join(ROOT, "renders", "deep");
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);
const VALUED = new Set(["--at", "--cell", "--fft", "--gain", "--lo", "--hi", "--rows", "--cols", "--wav", "--gamma", "--win", "--fft"]);
const film = argv.find((a, i) => !a.startsWith("--") && !VALUED.has(argv[i - 1])) || "13";

const ROWS = +flag("rows", 144), COLS = +flag("cols", 192);
const LO = +flag("lo", 300), HI = +flag("hi", 9600);
const CELL = +flag("cell", 6), GAIN = +flag("gain", 1.0);

/* ---- wav in --------------------------------------------------------------- */
const wav = flag("wav", path.join(OUT, `sonify-${film}.wav`));
if (!fs.existsSync(wav)) { console.error(`no wav at ${wav} — run sonify.mjs ${film} --icon first`); process.exit(1); }
const b = fs.readFileSync(wav);
let p = 12, sr = 44100, ch = 2, dataOff = 0, dataLen = 0;
while (p < b.length - 8) {
  const id = b.toString("ascii", p, p + 4), len = b.readUInt32LE(p + 4);
  if (id === "fmt ") { ch = b.readUInt16LE(p + 10); sr = b.readUInt32LE(p + 12); }
  if (id === "data") { dataOff = p + 8; dataLen = len; break; }
  p += 8 + len + (len & 1);
}
const NS = Math.floor(dataLen / (2 * ch));
const x = new Float32Array(NS);
for (let i = 0; i < NS; i++) {
  let s = 0;
  for (let c = 0; c < ch; c++) s += b.readInt16LE(dataOff + (i * ch + c) * 2) / 32768;
  x[i] = s / ch;
}
console.log(`${path.basename(wav)} — ${(NS / sr).toFixed(1)}s, ${sr} Hz, ${ch}ch`);

/* ---- STFT ----------------------------------------------------------------
   THE WINDOW IS THE COLUMN. Not a number anybody picks: a column of this
   picture occupies NS/COLS samples of the wav, and the transform that reads it
   should be exactly that long. Shorter and the row spacing is not resolved;
   longer and the column is read together with its neighbours. Measured across
   4096 / 8192 / 16384 on a 70-second transmission whose column is 16078
   samples, the fidelity runs 0.534 / 0.755 / 0.830 and the winner is the power
   of two that lands on the column. So it is computed, not chosen — which also
   means a slower transmission automatically gets a longer window and a finer
   picture, and that is why sending slowly works at all. */
const NFFT = argv.includes("--fft") ? +flag("fft", 16384)
  : Math.max(1024, Math.min(65536, 1 << Math.round(Math.log2(NS / COLS))));
const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
const rev = new Uint32Array(NFFT);
for (let i = 0, bits = Math.log2(NFFT); i < NFFT; i++) {
  let r = 0; for (let k = 0; k < bits; k++) r = (r << 1) | ((i >> k) & 1);
  rev[i] = r;
}
const COS = new Float64Array(NFFT / 2), SIN = new Float64Array(NFFT / 2);
for (let i = 0; i < NFFT / 2; i++) { COS[i] = Math.cos(-2 * Math.PI * i / NFFT); SIN[i] = Math.sin(-2 * Math.PI * i / NFFT); }
function fft() {
  for (let i = 0; i < NFFT; i++) if (rev[i] > i) {
    let t = re[i]; re[i] = re[rev[i]]; re[rev[i]] = t;
    t = im[i]; im[i] = im[rev[i]]; im[rev[i]] = t;
  }
  for (let size = 2; size <= NFFT; size <<= 1) {
    const half = size >> 1, step = NFFT / size;
    for (let i = 0; i < NFFT; i += size) for (let j = 0; j < half; j++) {
      const c = COS[j * step], s = SIN[j * step];
      const a = i + j, d = a + half;
      const tr = re[d] * c - im[d] * s, ti = re[d] * s + im[d] * c;
      re[d] = re[a] - tr; im[d] = im[a] - ti;
      re[a] += tr; im[a] += ti;
    }
  }
}
/* HANN, AND THE REASON IS THE ESTIMATOR RATHER THAN THE WINDOW. The argument
   for Blackman-Harris is that its sidelobes are 92 dB down instead of 31, and
   that argument is correct exactly as long as a row's value is a SUM over its
   bins — sum, and you integrate every sidelobe in the band. Take the peak
   instead and the sidelobes are simply never read, the only thing that still
   matters is how wide the main lobe is, and Hann's is half the width. Measured
   against a known frame: Hann 0.607, Blackman-Harris 0.510. The better window
   lost because the estimator changed underneath it. */
const WIN = flag("win", "hann");
const wind = new Float64Array(NFFT);
for (let i = 0; i < NFFT; i++) {
  const t = 2 * Math.PI * i / NFFT;
  wind[i] = WIN === "hann"
    ? 0.5 - 0.5 * Math.cos(t)
    : 0.35875 - 0.48829 * Math.cos(t) + 0.14128 * Math.cos(2 * t) - 0.01168 * Math.cos(3 * t);
}

/* which rows each bin belongs to: the exact inverse of sonify's ICON mapping */
const rowOf = (hz) => (hz <= 0 ? -1 : Math.round(Math.log(hz / LO) / Math.log(HI / LO) * (ROWS - 1)));
const field = new Float32Array(ROWS * COLS);
const rowN = new Float64Array(ROWS);
for (let k = 1; k < NFFT / 2; k++) { const r = rowOf(k * sr / NFFT); if (r >= 0 && r < ROWS) rowN[r]++; }
/* THE BOTTOM ROWS ARE NARROWER THAN A BIN. Near 120 Hz a row's band is about
   three hertz wide and a bin is five, so several rows own no bin at all and
   would print as bars of pure black across the foot of the picture — a
   printing artefact that looks exactly like a compositional decision. Any row
   that owns nothing is given the bin nearest its own centre frequency, which
   is what it would have owned had the transform been longer. */
const rowBin = new Int32Array(ROWS).fill(-1);
for (let r = 0; r < ROWS; r++) {
  if (rowN[r]) continue;
  const hz = LO * Math.pow(HI / LO, r / (ROWS - 1));
  rowBin[r] = Math.max(1, Math.min(NFFT / 2 - 1, Math.round(hz * NFFT / sr)));
}
const borrowed = rowBin.reduce((a, v) => a + (v >= 0 ? 1 : 0), 0);
if (borrowed) console.log(`  ${borrowed} of ${ROWS} rows are narrower than a bin and borrow the nearest`);

const hop = NS / COLS;
let peak = 0;
for (let c = 0; c < COLS; c++) {
  const c0 = Math.round(c * hop + hop / 2 - NFFT / 2);
  re.fill(0); im.fill(0);
  for (let i = 0; i < NFFT; i++) { const j = c0 + i; if (j >= 0 && j < NS) re[i] = x[j] * wind[i]; }
  fft();
  /* PEAK, NOT SUM, AND THE DIFFERENCE IS THE TOP HALF OF THE PICTURE. Rows are
     spaced logarithmically, so a row near 300 Hz owns one bin and a row near
     9600 owns forty-three. Adding a row's bins together therefore integrates
     forty-three bins' worth of leakage for the high rows and one bin's worth
     for the low ones, and the sky arrives as noise while the ground arrives
     clean — a gradient that is purely an artefact of the estimator. ICON puts
     exactly one sinusoid in each row's band, so the quantity being measured is
     a peak, and taking the peak throws every other bin's leakage away. */
  const acc = new Float64Array(ROWS);
  for (let k = 1; k < NFFT / 2; k++) {
    const r = rowOf(k * sr / NFFT);
    if (r < 0 || r >= ROWS) continue;
    const m = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    if (m > acc[r]) acc[r] = m;
  }
  for (let r = 0; r < ROWS; r++) {
    /* row 0 of the picture was the TOP of the frame and the top of the range */
    const kb = rowBin[r];
    const v = rowN[r] ? acc[r] : Math.sqrt(re[kb] * re[kb] + im[kb] * im[kb]);
    field[(ROWS - 1 - r) * COLS + c] = v;
    if (v > peak) peak = v;
  }
}
/* LINEAR, NOT dB, AND THAT IS THE WHOLE POINT. What went out was ink level as
   amplitude — a level-4 cell at four sevenths of a level-7 cell — so what
   comes back linear IS the ink level, and any decibel curve laid over it is a
   second opinion about a number that already means something. A spectrogram
   needs dB because nobody knows what its numbers are; this one does. `--db`
   is there for looking at ordinary sound, not for looking at this.
   Normalised to a high percentile rather than the peak, because one bin of
   ringing at the cut should not set the exposure for a whole picture. */
const sorted = Float32Array.from(field).sort();
const P = sorted[Math.floor(sorted.length * 0.995)] || peak || 1;
const DB = has("db"), FLOOR = -60, GAMMA = +flag("gamma", 1.0);
for (let i = 0; i < field.length; i++) {
  let v;
  if (DB) {
    const db = 20 * Math.log10(Math.max(1e-9, field[i] / P));
    v = Math.max(0, Math.min(1, (db - FLOOR) / -FLOOR));
  } else {
    /* NO EXPANSION AT THE RECEIVER, even though the sender compressed. Undoing
       the square root exactly should be right and measurably is not — squaring
       multiplies the error in the shadows along with the shadows. 1.0 scores
       0.607 where the theoretically correct 2.0 scores 0.569. */
    v = GAMMA === 1 ? Math.max(0, Math.min(1, field[i] / P))
      : Math.pow(Math.max(0, Math.min(1, field[i] / P)), GAMMA);
  }
  field[i] = Math.max(0, Math.min(1, v * GAIN));
}
/* THE SOUND PRINTS IN THE FILM'S POLARITY, NOT THE SPECTROGRAM'S. In a
   spectrogram nothing is black; on a sheet of paper nothing is white. Printed
   as a spectrogram this picture is a photographic negative of the frame it
   came from — legible, and impossible to lay beside the film. Inverted, the
   ink goes dark and the paper goes bright and the two prints are one look,
   which is the entire object of the exercise. `--positive` for the negative. */
const NEG = !has("positive");
const stem = path.join(OUT, `develop-${film}`);
const sound = print(field, COLS, ROWS, { cell: CELL, invert: NEG });
console.log(`  sound  → renders/deep/${path.basename(stem)}.png`, png(stem + ".png", sound.px, sound.W, sound.H));

/* ---- and the frame it came from, through the same printer ----------------- */
if (has("plate") || has("score")) {
  const { chromium } = await import("playwright");
  const AT = +flag("at", 40);
  const br = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const pg = await br.newPage({ viewport: { width: 900, height: 700 } });
  await pg.goto(`http://127.0.0.1:${process.env.PORT || 8181}/wygwyl/suite.html`, { waitUntil: "load" });
  await pg.waitForFunction(() => window.__hw?.films?.length, null, { timeout: 30000 });
  await pg.evaluate(() => window.__hw.halt());
  const g = await pg.evaluate(({ f, at }) => {
    const F = window.__hw.films.find(z => z.world.n === f || z.slug.startsWith(f));
    return Array.from(F.rt.renderField(at));
  }, { f: film, at: AT });
  await br.close();
  /* THE FIDELITY, AS A NUMBER. The whole claim of ICON is that a frame
     survives being turned into sound and back, and "it looks about right" is
     not a claim, it is a hope. The true field is right here; correlate it with
     what came out of the transform. Reported in thirds, because the bottom of
     the picture is where the physics bites and an average would hide it. */
  if (has("score")) {
    const T = new Float64Array(ROWS * COLS);
    for (let y = 0; y < ROWS; y++) for (let xq = 0; xq < COLS; xq++) {
      const sy = Math.min(143, Math.floor(y / ROWS * 144)), sx = Math.min(191, Math.floor(xq / COLS * 192));
      const v = g[sy * 192 + sx];
      T[y * COLS + xq] = Math.min(7, Math.round(v > 8.5 ? 7 : v)) / 7;
    }
    const r = (lo, hi) => {
      let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
      for (let y = lo; y < hi; y++) for (let xq = 0; xq < COLS; xq++) {
        const a = T[y * COLS + xq], b2 = field[y * COLS + xq];
        n++; sa += a; sb += b2; saa += a * a; sbb += b2 * b2; sab += a * b2;
      }
      const num = n * sab - sa * sb;
      const den = Math.sqrt(Math.max(1e-12, (n * saa - sa * sa) * (n * sbb - sb * sb)));
      return num / den;
    };
    const t3 = Math.floor(ROWS / 3);
    console.log(`  fidelity  all ${r(0, ROWS).toFixed(3)}`
      + `   sky ${r(0, t3).toFixed(3)}   middle ${r(t3, 2 * t3).toFixed(3)}   ground ${r(2 * t3, ROWS).toFixed(3)}`);
  }
  const fld = new Float32Array(192 * 144);
  /* the frame prints INVERTED against the sound: a spectrogram's nothing is
     black and a sheet of paper's nothing is not, so ink goes to the dark end
     and the paper goes to the bright, and the two prints are one look */
  for (let i = 0; i < fld.length; i++) fld[i] = Math.min(7, Math.round(g[i] > 8.5 ? 7 : g[i])) / 7;
  if (has("plate")) {
    const pr = print(fld, 192, 144, { cell: CELL, invert: true });
    console.log(`  frame  → renders/deep/${path.basename(stem)}.plate.png`, png(stem + ".plate.png", pr.px, pr.W, pr.H));
    /* the two beside each other, which is the only way to see whether the
       claim is true — one printer, one palette, one screen, and a gutter */
    const GUT = 16, W2 = pr.W + GUT + sound.W, H2 = Math.max(pr.H, sound.H);
    const px = Buffer.alloc(W2 * H2 * 3);
    for (let y = 0; y < H2; y++) {
      pr.px.copy(px, (y * W2) * 3, y * pr.W * 3, (y + 1) * pr.W * 3);
      sound.px.copy(px, (y * W2 + pr.W + GUT) * 3, y * sound.W * 3, (y + 1) * sound.W * 3);
    }
    console.log(`  pair   → renders/deep/${path.basename(stem)}.pair.png`, png(stem + ".pair.png", px, W2, H2));
  }
}
