#!/usr/bin/env node
/* ============================================================================
   sonify.mjs — THE FILM IS THE SCORE.

     node wygwyl/deep/sonify.mjs 13            sound a film, under its own law
     node wygwyl/deep/sonify.mjs 13 --full     the whole film
     node wygwyl/deep/sonify.mjs 13 --from 6 --secs 40 --fps 24
     node wygwyl/deep/sonify.mjs 07 --engine imzad --mode penta   bench a law
     node wygwyl/deep/sonify.mjs --cards       print all fourteen prosodies

   A spectrogram is a field: x is time, y is frequency, the value is magnitude.
   A beflix frame is a field: x, y, and the value is ink. They are the same
   object and one of them has simply never been asked to make a sound. So:
   read the film's own field as a spectrum and resynthesise it. Watch it and
   you are looking at the score; hear it and you are listening to the picture.

   THE MAPPING, WHICH IS THE WHOLE CRAFT

   X IS TIME. A READ HEAD SWEEPS THE FRAME WHILE THE FILM MOVES UNDER IT.
   The first pass averaged each row across all 192 columns, which collapses the
   composition into one number per band and returns a wall of drone — every
   band loud always, and the boat and the quay and the seated man all inaudible
   because they had been added together. But x was never a spare dimension; it
   is the axis the whole idea rests on. So there are two clocks: the film's, at
   its own frame rate, and the SCAN, one left-to-right pass whose duration the
   film's prosodic engine decides. The head reads a narrow column of the
   CURRENT frame.

   What that buys is the composition becoming the music, exactly:
     a horizon, a quay, a waterline — a horizontal run — is a SUSTAINED note
     a mast, a figure, a post — a vertical mark — is a CHORD, struck once per
       sweep, so the film's furniture becomes the rhythm section
     a body crossing the frame arrives EARLIER in each sweep as it walks left,
       which is a rhythm accelerating because someone is moving

   THE HEAD MOVES FOR A REASON, AND THE REASON IS THE POEM. A fixed sweep rate
   is a metronome, and a metronome is the one thing none of these fourteen
   poems is. Each film declares a `score` naming a prosodic engine — Malḥūn,
   Gabay, Izibongo, Jaliya, Taasu, Kabary, T'heydinn, Imzad — and the engine
   returns four numbers as a function of position through the film:

     sweep(u)    how long the head takes to cross — the breath
     gate(u,p)   where the vacancies are, `p` being the scan's own phase, so a
                 tradition can put its silence at a place in the LINE
     ground(u)   how much of the picture's own background is allowed to speak
     attack(u)   the amplitude exponent — a wash, or a statement

   Because sweep varies, the head's phase is INTEGRATED rather than taken from
   a modulo: a modulo on a changing period teleports the head, and a teleport
   is a click. Integration means the breath can lengthen across a film and
   nothing ever jumps.

   FIGURE, HAZE, AND GROUND — THREE POPULATIONS, NOT TWO. Sounding every inked
   cell makes a film that is 100% covered — a harbour built entirely out of
   tone — into a wall, because its sky and its water and its quay are all ink
   and all sound at once. What a viewer actually sees there is not the tone; it
   is what STANDS OUT of the tone. So each frame's modal level is found (the
   same background detection the token decompiler uses) and the ink is split
   three ways: what rises two levels or more above the ground is FIGURE and
   always sounds; what rises by only one is HAZE; ink at or below the ground is
   GROUND. Haze and ground are admitted by `ground(u)`, so a poem can begin
   with the man alone in the room and end with the room itself singing. The
   split is measured, not assumed: across the suite the ground-ink population
   runs from 0% (MAGIC RIDE, which is all figure and has no wallpaper to let
   in) to 69% (YET, HEARD).

   ROW TO PITCH, NOT ROW TO HERTZ. A linear or log sweep across 144 rows makes
   a siren. The rows are quantised to the film's declared mode instead, so any
   picture at all is in key and the composition decides the harmony rather than
   the ruler. y=0 is the top of the frame and the top of the range: sky is
   high, ground is low, which is the only assignment a viewer would ever guess.
   The root is the film's own drone base, folded into one octave so the KEY
   differs between films and the REGISTER does not.

   INK IS AMPLITUDE ABOVE THAT GROUND. Level 0 makes no sound. That is not
   a convenience — it means the `--texture` index becomes audible: a film built
   out of tone is a wall of sound and a film built out of line is a few points
   in the dark. The instrument that reads the pictures and the instrument that
   plays them agree, because they are reading the same number.

   INK COLUMN TO STEREO. Within a band, where the ink sits left to right sets
   where it sits in the field. A figure walking across the frame pans.

   INTERPOLATE, OR IT BUZZES. Twelve frames a second stepping amplitudes gives
   a 12 Hz amplitude modulation on every partial — a harsh buzz that is the
   frame rate and not the film. Amplitudes glide between frames, per sample.

   LEVEL 8 IS THE ACCENT AND IT GETS ITS OWN VOICE. One thing per film is
   allowed to be the colour; here it is allowed to be the one detuned partial.
   ========================================================================= */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SR, secs, buf, lerp, clamp, smooth } from "./ops.mjs";
import { ENGINES, engineOf, modeOf, foldRoot } from "./prosody.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "..");
const OUT = path.join(ROOT, "renders", "deep");
fs.mkdirSync(OUT, { recursive: true });
const PORT = +(process.env.PORT || 8181);
const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf("--" + n); return i < 0 ? d : argv[i + 1]; };
const has = (n) => argv.includes("--" + n);
const VALUED = new Set(["--from", "--secs", "--fps", "--bands", "--root", "--sweep", "--slit", "--engine", "--mode", "--tx"]);
const film = argv.find((a, i) => !a.startsWith("--") && !VALUED.has(argv[i - 1])) || "13";
/* TWO FIDELITIES, AND THEY PULL AGAINST EACH OTHER.

   MUSIC mode quantises the rows to a mode so that any picture at all is in
   key; that is what makes a film listenable, and it is also what makes the
   sound's spectrogram stop looking like the film — 144 rows collapsed onto
   five or seven pitches an octave is a picture with its vertical resolution
   thrown away, and the triangle head prints every frame beside its own mirror.

   ICON mode gives up the key to get the picture back: one band per row,
   continuous log frequency so that a log-scaled spectrogram undoes the mapping
   exactly and y comes back linear in row, one column per column, one single
   left-to-right pass with no return, no gate, no mode, no accent detune, and
   the frame held still. What comes out the other end is not a piece of music.
   It is the frame, transmitted as sound and developed back into a picture, and
   it is the proof that the mapping is a mapping and not a decoration. */
const ICON = has("icon"), HOLD = has("hold") || ICON;
const FPS = +flag("fps", ICON ? 12 : 24), SLIT = +flag("slit", ICON ? 1 : 5);
const BANDS = +flag("bands", ICON ? 144 : 56);
/* NO COMPANDING. Compressing at the sender and expanding at the receiver is
   how every noisy analogue channel was ever rescued, and measured against a
   known frame it loses here: linear 0.830, square-root 0.697 even with the
   receiver expanding to match. The channel is not noise-limited, it is
   RESOLUTION-limited — the errors are neighbouring rows bleeding into each
   other, and companding does nothing to a neighbour. `--tx` keeps the dial. */
const TX = +flag("tx", 1.0);
const FROM = +flag("from", 6);
const FIXED_SWEEP = argv.includes("--sweep") ? +flag("sweep", 4) : 0;   // 0 = let the poem decide

/* --cards: what the fourteen laws actually do, without rendering anything.
   A law you cannot read the shape of is a preference. */
if (has("cards")) {
  const P = [0.12, 0.30, 0.55, 0.80];
  console.log("engine      tradition                          sweep s (u=0/.5/1)   gate mean/min   ground 0>1   attack");
  for (const [k, e] of Object.entries(ENGINES)) {
    const sw = [0, 0.5, 1].map(u => e.sweep(u).toFixed(1)).join("/");
    let sum = 0, min = 1, n = 0;
    for (let u = 0; u <= 1.0001; u += 0.05) for (const p of P) { const g = e.gate(u, p); sum += g; if (g < min) min = g; n++; }
    console.log(`${k.padEnd(11)} ${e.tradition.padEnd(34)} ${sw.padStart(18)}   `
      + `${(sum / n).toFixed(2)}/${min.toFixed(2)}        ${e.ground(0).toFixed(2)}>${e.ground(1).toFixed(2)}   `
      + `${e.attack(0).toFixed(1)}>${e.attack(1).toFixed(1)}`);
  }
  process.exit(0);
}

/* ---- pull band vectors out of the film ------------------------------------
   The browser reduces each 192x144 field to BANDS x COLS amplitudes, so what
   crosses the wire is a few thousand numbers instead of megabytes of field,
   and the reduction happens where the field already lives. */
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on("pageerror", e => console.error("  page error: " + e.message.split("\n")[0]));
await page.goto(`http://127.0.0.1:${PORT}/wygwyl/suite.html`, { waitUntil: "load" });
await page.waitForFunction(() => window.__hw?.films?.length, null, { timeout: 30000 });
await page.evaluate(() => window.__hw.halt());

const info = await page.evaluate((f) => {
  const F = window.__hw.films.find(x => x.world.n === f || x.slug.startsWith(f));
  return F ? {
    n: F.world.n, slug: F.slug, title: F.world.title, start: F.start, dur: F.rt.total,
    score: F.world.score || null, base: F.world.drone?.base || 0,
  } : null;
}, film);
if (!info) { console.error(`no film matched "${film}"`); process.exit(1); }

const ENAME = flag("engine", info.score?.engine || "");
const E = engineOf(ENAME);
const MNAME = flag("mode", info.score?.mode || "aeolian");
const SCALE = modeOf(MNAME);
const ROOT_HZ = argv.includes("--root") ? +flag("root", 41.203) : foldRoot(info.score?.root || info.base);
/* six octaves of whatever mode the film declared — or, in ICON mode, a
   continuous log sweep whose inverse the spectrogram's own log axis performs */
/* WHERE THE BOTTOM OF THE PICTURE GOES, AND WHY IT IS NOT AT THE BOTTOM OF
   HEARING. 144 rows across six octaves puts neighbouring rows 2.9% apart in
   frequency; at 120 Hz that is three and a half hertz, and a transform that
   separates three and a half hertz needs a window a third of a second long —
   longer than the column it is trying to read. So the bottom of the frame
   cannot arrive, at any speed, and no amount of care at the receiving end
   invents it. Five octaves from 300 Hz puts the tightest row spacing at seven
   hertz, which an eight-thousand-point window resolves comfortably inside a
   two-hundred-millisecond column. The picture stops being a wash. It also
   stops being anything anyone would call music, which is the trade ICON makes
   and MUSIC mode refuses. */
const ICON_LO = 300, ICON_HI = 9600;
function bandHz(k, n) {
  if (ICON) return ICON_LO * Math.pow(ICON_HI / ICON_LO, k / Math.max(1, n - 1));
  const step = Math.round(k / n * (SCALE.length * 6));
  const oct = Math.floor(step / SCALE.length), deg = step % SCALE.length;
  return ROOT_HZ * Math.pow(2, oct + SCALE[deg] / 12);
}

const rest = info.dur - FROM;
const SECS = argv.includes("--secs") ? +flag("secs", 40) : (has("full") ? rest : (ICON ? 90 : 40));
const span = Math.min(SECS, rest);
const NF = Math.round(span * FPS);
const swAt = (u) => FIXED_SWEEP || E.sweep(clamp(u, 0, 1));
console.log(`${info.n} ${info.title}\n  ${span.toFixed(1)}s from ${FROM}s of ${info.dur.toFixed(0)}s · ${NF} frames at ${FPS}fps · ${BANDS} bands`
  + (ICON
    ? `\n  ICON — one band per row, ${ICON_LO}-${ICON_HI} Hz continuous, one pass, frame held at ${FROM}s`
    : `\n  prosody: ${ENAME || "(none declared)"} — ${E.tradition} · ${MNAME} on ${ROOT_HZ.toFixed(2)} Hz`
      + `\n  breath: ${FIXED_SWEEP ? FIXED_SWEEP + "s fixed" : `${swAt(FROM / info.dur).toFixed(1)}s > ${swAt((FROM + span) / info.dur).toFixed(1)}s per pass`}`));

const frames = await page.evaluate(({ start, from, nf, fps, bands, hold, cols, icon, txp }) => {
  const FW = 192, FH = 144;
  const F = window.__hw.films; let fi = F.length - 1;
  while (fi > 0 && start < F[fi].start) fi--;
  const rt = F[fi].rt, out = [];
  for (let k = 0; k < (hold ? 2 : nf); k++) {
    const g = rt.renderField(hold ? from : from + k / fps);
    /* the frame's own background: the level it is mostly made of */
    const hist = new Uint32Array(9);
    for (let q = 0; q < FW * FH; q++) { const v = Math.round(g[q]); if (v >= 0 && v <= 8) hist[v]++; }
    let bg = 0; for (let v = 1; v <= 7; v++) if (hist[v] > hist[bg]) bg = v;
    /* a band x column matrix: the film's own field, reduced only in y.
       fig = what stands clear of the ground, IN EITHER DIRECTION, and always
             sounds. Counting only ink ABOVE the modal level silenced every
             dark-room passage in the suite outright — when the room is level 7
             and the mirror and the window are paper holes, the composition is
             carried by the holes, and a rule that only looks upward finds no
             figure at all and returns eight seconds of digital black. A pale
             form on a dark field is exactly as much a figure as a dark form on
             a pale one; that is what the word means. Contrast is normalised by
             the headroom available in whichever direction it went, so a cell
             two levels up from a bright ground and a cell two levels down from
             a dark one weigh the same.
       grd = low-contrast cells and the ground's own ink, admitted by the poem's
             `ground(u)` rather than by this reduction */
    const COLS = cols;                               // read positions across x
    const fig = new Float32Array(bands * COLS), grd = new Float32Array(bands * COLS);
    const acc = new Float32Array(bands * COLS);
    const MARGIN = 0.28;                             // figure if it departs this far
    for (let c = 0; c < COLS; c++) {
      const x0 = Math.floor(c / COLS * FW), x1 = Math.max(x0 + 1, Math.floor((c + 1) / COLS * FW));
      for (let b = 0; b < bands; b++) {
        const y0 = Math.floor(b / bands * FH), y1 = Math.max(y0 + 1, Math.floor((b + 1) / bands * FH));
        let sf = 0, sg = 0, n = 0, acc8 = 0;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const v = g[y * FW + x];
          if (v > 8.5) continue;
          if (v >= 7.5) acc8++;
          const lv = Math.min(7, Math.round(v)), d = lv - bg;
          n++;
          /* ICON is a TRANSMISSION, not an interpretation: no background
             detection, no figure and ground, no margin. Every level goes out at
             its own weight and comes back at its own weight, because the claim
             being tested is that the field survives the trip. */
          /* COMPANDED, THE WAY A NOISY CHANNEL ALWAYS IS. Sent linearly, a
             level-2 cell is eleven decibels under a level-7 one and sits close
             enough to the transform's own leakage floor to be printed on top
             of it. Sent as a square root, every level is lifted clear; the
             receiver squares it back and the leakage goes down twice as far as
             the picture does. This is Dolby's trick and it is exactly as
             honest here: nothing is added, the channel is used. */
          if (icon) { sf += Math.pow(lv / 7, txp); continue; }
          if (d === 0) { if (bg > 0) sg += 0.30; }   // the ground, where it is ink
          else {
            const head = d > 0 ? Math.max(1, 7 - bg) : Math.max(1, bg);
            const con = Math.abs(d) / head;          // 0..1 departure from the ground
            if (con >= MARGIN) sf += con;            // figure
            else sg += con * 0.7;                    // haze: nearly the ground
          }
        }
        fig[b * COLS + c] = n ? sf / n : 0;
        grd[b * COLS + c] = n ? sg / n : 0;
        acc[b * COLS + c] = n ? acc8 / n : 0;
      }
    }
    out.push({ fig: Array.from(fig), grd: Array.from(grd), acc: Array.from(acc), cols: COLS, bg });
  }
  return out;
}, { start: info.start, from: FROM, nf: NF, fps: FPS, bands: BANDS, hold: HOLD, cols: ICON ? 192 : 64, icon: ICON, txp: TX });
await browser.close();

/* ---- resynthesise ---------------------------------------------------------
   One oscillator per band, amplitude glided between video frames so the frame
   rate does not become a buzz, panned by where the ink sits in the row. */
const N = secs(span);
const L = buf(N), R = buf(N);
const ph = new Float64Array(BANDS);
const hz = Array.from({ length: BANDS }, (_, b) => bandHz(BANDS - 1 - b, BANDS));
const perFrame = SR / FPS;
let loudest = 0, quietest = 1e9, gsum = 0, gmin = 1;

const COLS = frames[0].cols;
const halfSlit = Math.max(0, Math.floor(SLIT / 2 * COLS / 192));
/* THE HEAD TURNS ROUND RATHER THAN JUMPING BACK. A sawtooth scan snaps from
   the right edge to the left every pass, and that discontinuity is a click at
   the scan rate — the reader, audible, which is the one thing it must never
   be. A triangle reads the frame forwards and then backwards, so every picture
   is heard as a palindrome and nothing ever jumps. Two sweeps to the cycle. */
let scanPh = 0;
/* the gate is smoothed at the instrument, not at the law: an engine is allowed
   to declare a hard edge (somebody cuts in) and the instrument is responsible
   for it not being a click. 30 ms is a consonant, not a fade. */
const gk = 1 - Math.exp(-1 / (SR * 0.030));
let gs = 0;

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const u = clamp((FROM + t) / info.dur, 0, 1);
  const fpos = i / perFrame, f0 = Math.min(frames.length - 1, Math.floor(fpos));
  const f1 = Math.min(frames.length - 1, f0 + 1), fr = smooth(fpos - f0);

  scanPh += 1 / (SR * 2 * Math.max(0.4, swAt(u)));
  if (scanPh >= 1) scanPh -= 1;
  /* ICON reads once, left to right, and stops — a return pass would print the
     picture next to its own mirror, and a mirror is not the frame */
  const scan = ICON ? clamp(i / (N - 1), 0, 1) : (scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2);
  const cf = scan * (COLS - 1), c0 = Math.floor(cf), cfr = cf - c0;
  /* the head is at a position, so it pans there — you hear where you are looking */
  const th = ICON ? Math.PI / 4 : scan * Math.PI / 2;      // ICON is centred: a pan blurs
  const cl = Math.cos(th), cr = Math.sin(th);

  /* `p` is where we are in the LINE, not in the bar: 0 at the left edge, 1 at
     the right, on the way out and on the way back alike */
  const gt = ICON ? 1 : clamp(E.gate(u, scan), 0, 1);
  gs += (gt - gs) * gk;
  gsum += gt; if (gt < gmin) gmin = gt;
  const gnd = ICON ? 1 : clamp(E.ground(u), 0, 1), atk = ICON ? 1 : E.attack(u);

  let l = 0, r = 0, tot = 0;
  for (let b = 0; b < BANDS; b++) {
    /* average the slit, then interpolate between frames AND between columns:
       a hard column step is a click at the scan rate, which is the reader and
       not the picture */
    let a = 0, ac = 0, n = 0;
    for (let d = -halfSlit; d <= halfSlit; d++) {
      const ca = clamp(c0 + d, 0, COLS - 1), cb = clamp(c0 + d + 1, 0, COLS - 1);
      const i0 = b * COLS + ca, i1 = b * COLS + cb;
      const A0 = frames[f0], A1 = frames[f1];
      const va = lerp(A0.fig[i0] + gnd * A0.grd[i0], A1.fig[i0] + gnd * A1.grd[i0], fr);
      const vb = lerp(A0.fig[i1] + gnd * A0.grd[i1], A1.fig[i1] + gnd * A1.grd[i1], fr);
      a += lerp(va, vb, cfr);
      ac += lerp(A0.acc[i0], A1.acc[i0], fr);
      n++;
    }
    a /= n; ac /= n;
    ph[b] += hz[b] / SR;
    if (a < 0.004) continue;
    /* ink to loudness: a curve, because a level-1 haze covering the frame and
       a level-7 body should not carry the same weight, and the curve is the
       poem's, because a wash and a statement are the same ink */
    const g = Math.pow(a, atk) * 1.15;
    tot += g;
    let v = Math.sin(ph[b] * 2 * Math.PI);
    /* the accent gets one detuned partial — the only colour in the field is
       the only colour in the sound */
    if (ac > 0.002 && !ICON) v += Math.sin(ph[b] * 2 * Math.PI * 1.4983) * ac * 6;
    l += v * g * cl; r += v * g * cr;
  }
  tot *= gs;
  if (tot > loudest) loudest = tot;
  if (tot < quietest) quietest = tot;
  L[i] = l * gs; R[i] = r * gs;
}
/* SCALED BY THE ROOT OF THE BAND COUNT, WHICH IS THE ONLY HONEST CONSTANT.
   Partials at unrelated frequencies sum in power rather than in amplitude, so
   a bank of B of them is about sqrt(B) times one of them and dividing by
   sqrt(B) makes the master level independent of how finely the picture was
   sliced. Without it, 56 bands ran three times into the limiter and 144 ran
   nine — ICON was transmitting a square wave and still reconstructing at
   0.830, which is the sort of thing that only shows up on a meter.
   The tanh stays, as a safety and not as a mixing decision: the difference in
   loudness BETWEEN films is the texture index made audible and must survive. */
let clipPk = 0;
for (let i = 0; i < N; i++) {
  const a = Math.abs(L[i]), b2 = Math.abs(R[i]);
  if (a > clipPk) clipPk = a; if (b2 > clipPk) clipPk = b2;
}
/* AND A TRANSMISSION IS NORMALISED WHERE A PIECE OF MUSIC IS LIMITED. There is
   no reason for one ICON to be louder than another — nothing is being
   compared, a picture is being carried — so it simply gets all the headroom
   there is, and the limiter never runs at all. Peak-normalising instead of
   limiting took the reconstruction from 0.830 to 0.923: every decibel the tanh
   was flattening was a level of ink. */
const MASTER = ICON ? 0.92 / Math.max(1e-6, clipPk) : 1 / Math.sqrt(BANDS);
for (let i = 0; i < N; i++) {
  L[i] = ICON ? L[i] * MASTER : Math.tanh(L[i] * MASTER) * 0.9;
  R[i] = ICON ? R[i] * MASTER : Math.tanh(R[i] * MASTER) * 0.9;
}
clipPk *= ICON ? MASTER : 1 / Math.sqrt(BANDS);
const fi = secs(0.4), fo = secs(1.2);
for (let i = 0; i < fi; i++) { const g = smooth(i / fi); L[i] *= g; R[i] *= g; }
for (let i = 0; i < fo; i++) { const g = smooth(i / fo); L[N - 1 - i] *= g; R[N - 1 - i] *= g; }
console.log(`  band energy: loudest ${loudest.toFixed(2)} · quietest ${quietest.toFixed(3)}`
  + ` · gate mean ${(gsum / N).toFixed(2)} min ${gmin.toFixed(2)}`
  + ` · peak into the limiter ${clipPk.toFixed(2)}${clipPk > 1.6 ? " — SQUARING" : ""}`);

function writeWav(file, l, r, sr = SR) {
  const n = l.length, b = Buffer.alloc(44 + n * 4);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 4, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l[i] * 32767))), 44 + i * 4);
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r[i] * 32767))), 46 + i * 4);
  }
  fs.writeFileSync(file, b);
}
const stem = path.join(OUT, `sonify-${info.n}`);
writeWav(stem + ".wav", L, R);
console.log(`  → renders/deep/sonify-${info.n}.wav`);

const FF = (() => {
  const w = spawnSync("sh", ["-c", "command -v ffmpeg"], { encoding: "utf8" });
  if (w.status === 0 && w.stdout.trim()) return w.stdout.trim();
  const p = path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg");
  return fs.existsSync(p) ? fs.realpathSync(p) : null;
})();
if (FF) {
  const run = (a) => spawnSync(FF, a, { encoding: "utf8", maxBuffer: 1 << 26 });
  run(["-hide_banner", "-v", "error", "-y", "-i", stem + ".wav", "-c:a", "libmp3lame", "-b:a", "192k", stem + ".mp3"]);
  /* THE VERIFICATION. Take the spectrogram of the sound the film made. If the
     mapping is honest it should look like the film — the horizon as a line,
     the sky as a band, a body as a vertical stroke that moves — and two films
     under different prosodies should not look alike. */
  /* THE DEVELOPING BATH. In ICON the spectrogram is not a diagnostic, it is the
     print: `fscale=log` is the exact inverse of the log band mapping, so the
     row that went in comes back out at the height it started, and the picture
     develops. 1152x864 is 192x144 at six dots to the cell.

     AND THE TRANSMISSION IS SLOW ON PURPOSE. A frame sent in twelve seconds
     gives each of its 192 columns 62 ms, and a window long enough to resolve
     the bottom rows is 186 ms — so every column arrives smeared across three
     of its neighbours and the print is a wash. Forty seconds gives a column
     208 ms, which is longer than the window, and the smear goes away. The
     picture is not being sharpened at the far end; it is being sent slowly
     enough to survive.

     AND THERE IS A SECOND, TIGHTER SPEED LIMIT. The head crossing 192 columns
     amplitude-modulates every band at the column rate, and an amplitude
     modulated at R hertz puts sidebands R hertz either side of its carrier. At
     forty seconds that is 4.8 Hz of sidebands against a 7.3 Hz row spacing, so
     every row bleeds into the row below it — the reader, printed over the
     picture. Ninety seconds brings the modulation to 2.1 Hz and the sidebands
     stay inside their own row. A frame takes a minute and a half to send. It
     is a transmission, not a performance. */
  run(ICON
    ? ["-hide_banner", "-v", "error", "-y", "-i", stem + ".wav", "-lavfi",
       "showspectrumpic=s=1152x864:mode=combined:scale=log:fscale=log:legend=0"
       + `:start=${ICON_LO}:stop=${ICON_HI}:gain=1.4:saturation=1`, stem + ".spectrum.png"]
    : ["-hide_banner", "-v", "error", "-y", "-i", stem + ".wav", "-lavfi",
       "showspectrumpic=s=1600x720:mode=combined:scale=log:fscale=log:legend=1:gain=2.5", stem + ".spectrum.png"]);
  console.log(`  → mp3 and the spectrogram of what the film sounds like`);
}
