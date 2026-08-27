/* ============================================================================
   sketchradio.mjs — WORD · VOICE · TIMED MARK · WORLD · SCORE.

   Built to the shape of k2's Sketchradio, which had it right and which I had
   to be told twice to actually look at. Its architecture is not a node graph
   and not an editor. It is a PERFORMANCE INSTRUMENT, and three decisions make
   it one:

     THE CLOCK IS THE RECORDING. `radioClockTime()` returns the voice's own
     `currentTime`. Nothing else is master, ever.

     THE DRAWING IS TIMED. Every point carries the moment it was made, and
     replay shows only the strokes whose time has come. You do not draw a
     picture of the voice — you draw ALONG WITH IT, and the mark is a
     performance that happens again when the record does.

     THE RELATION IS THE PARAMETER. HARMONIZE, ANSWER, SHADOW, COUNTERPOINT,
     RESIST, EMBODY. Not a style, not a genre, not a mood — six ways an
     accompaniment can attend to a voice that is already speaking.

   WHAT THIS VERSION HAS THAT THE ORIGINAL COULD NOT

   The original sends the drawing and the sound-map to a language model as
   images and gets notes back, so it needs a key, a network and a wait, and the
   mark you made is described before it is heard. Here the field IS the
   spectrum — rows are frequency, columns are time, ink is amplitude — so a
   stroke sounds the instant it is drawn, and the six relations are DSP rather
   than prompt text: real rules connecting the live envelope of the poet's
   voice to the read head's breath, gate, ground and attack.

   And the voice is the actual one. `footage/unified-drones.mp3` is the suite's
   own 24-minute record, and `poem/beats.json` carries 111 beats lifted from the
   twin EDLs, so the line being spoken appears in sync without anyone being
   asked to guess it.

   THE SEAM WHERE THE MODEL WOULD GO is marked and empty: HEAR (ask a model to
   read the sound-map back to you) and VOICE→SKETCH (ask it to draw what it
   heard) are the two places the original calls out, and both are offline here.
   ========================================================================= */
import { makeRuntime } from "./halfworld.mjs";
import { ENGINES, engineOf, modeOf, foldRoot } from "./deep/prosody.mjs";
import { makePainter, inkToDisplay } from "./deep/paint.mjs";

const FW = 192, FH = 144, COLS = 64, BANDS = 56;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* ---- the record, and the poem that runs on it ---------------------------- */
const BEATS = await fetch("poem/beats.json").then(r => r.json()).catch(() => ({ films: [] }));
const SLUGS = ["01-out-of-life", "02-flashing-lights", "03-how-to-break-off-an-engagement",
  "04-nevermore", "05-bloodlines", "06-resurrecting-atlantis", "07-dj-turn-me-up",
  "08-newly-single", "09-yet-heard", "10-magic-ride", "11-new-day", "12-reunion",
  "13-how-to-win-my-heart", "14-hot-minute"];
const FILMS = [];
for (const slug of SLUGS) {
  try {
    const world = (await import(`./worlds/${slug}.mjs`)).default;
    FILMS.push({ slug, world, rt: makeRuntime(world), beats: BEATS.films.find(f => f.slug === slug) || null });
  } catch (_) {}
}

const audio = new Audio();
audio.preload = "auto";
/* the harness has to be able to put the record anywhere and read what happened */
window.__audio = audio;
let VOICE = { url: "", dur: 0, env: null, sil: null, rms: 0, name: "" };

/* THE WHOLE ENVELOPE UP FRONT, BECAUSE YOU CANNOT PERFORM AGAINST A CURVE YOU
   CANNOT SEE COMING. A live analyser only ever shows you the past, and drawing
   along with a voice means knowing that a phrase ends in two seconds. So the
   file is decoded once — at 8 kHz into an OfflineAudioContext, which resamples
   on the way in and turns twenty-four minutes from a quarter of a gigabyte into
   something a page can hold — reduced to an envelope, and the buffer dropped. */
async function analyse(arrayBuf, name) {
  state("READING THE RECORD");
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const oac = new OAC(1, 1024, 8000);
  const buf = await oac.decodeAudioData(arrayBuf);
  const d = buf.getChannelData(0), n = buf.length;
  const BINS = 2048, env = new Float32Array(BINS);
  let sum = 0, cnt = 0;
  for (let b = 0; b < BINS; b++) {
    const a0 = Math.floor(b * n / BINS), a1 = Math.floor((b + 1) * n / BINS);
    let s = 0, c = 0;
    for (let i = a0; i < a1; i += 3) { const v = d[i]; s += v * v; c++; }
    env[b] = Math.sqrt(s / Math.max(1, c));
    sum += s; cnt += c;
  }
  const rms = Math.sqrt(sum / Math.max(1, cnt));
  let mx = 1e-6; for (const v of env) if (v > mx) mx = v;
  for (let i = 0; i < BINS; i++) env[i] /= mx;
  /* silence is not zero — it is below a third of the mean, which on a record
     mixed with a drone under it is where the voice actually stops */
  const thr = Math.max(0.05, (rms / mx) * 0.34);
  const sil = new Uint8Array(BINS);
  for (let i = 0; i < BINS; i++) sil[i] = env[i] < thr ? 1 : 0;
  VOICE = { url: VOICE.url, dur: buf.duration, env, sil, rms, name,
            silRatio: sil.reduce((a, c) => a + c, 0) / BINS };
  const own = FILMS.some(f => f.beats);
  state(`${name} · ${fmt(buf.duration)} · ${own
    ? "speech from the EDL, energy from the wave"
    : `no beat map — silence from amplitude (${(VOICE.silRatio * 100) | 0}%)`}`, "ok");
}
/* SILENCE IS NOT QUIET, AND THE METER SAID SO. Amplitude silence on this
   record is 2% — because `unified-drones.mp3` is a drone with a voice on top of
   it, and the drone never stops. ANSWER, whose whole material is the space the
   voice leaves, came out mute: gate 0.04, because `sil` was almost never true.

   But the real silence structure is not in the waveform at all. It is declared
   in the suite's own twin EDLs: each beat carries the line being spoken and how
   long it lasts, so "the poet is speaking" is a fact this project already owns.
   Measured across the fourteen films, thirteen of them hold 4.4–5.4 seconds
   before the voice enters and film 01 holds 29.8 — that is the material, and no
   envelope threshold was ever going to find it under a drone.

   So: the ENVELOPE stays, as the record's energy. SPEAKING comes from the EDL.
   For a file loaded from outside the suite there is no beat map and amplitude
   is all there is, so it falls back — and says so. */
/* AND THE EDL'S `duration_seconds` IS THE SHOT, NOT THE UTTERANCE. Film 01's
   second beat runs 24.25 seconds and carries 33 words; taking the shot length
   as the speaking length made the poet speak essentially without pause, and
   ANSWER had nowhere to enter — the same fault as the amplitude threshold,
   arriving from the other direction.

   The words are there, so the utterance can be estimated from them. 2.4 words a
   second is an unhurried reading voice, and it is an ESTIMATE, which is the
   honest word: the EDL records what was said and how long the shot held, never
   how long the saying took. Capped at the shot, because a line cannot outlast
   the picture it was spoken over. Film 01 then speaks 29.8–43.5 and rests
   43.5–54.0, which is a poem with breathing in it. */
const WORDS_PER_SECOND = 2.4;
const spokenFor = (b) => Math.min(b.d || 3.4, Math.max(1.2, (b.v || "").trim().split(/\s+/).length / WORDS_PER_SECOND));
function speakingAt(t) {
  const f = FILMS[filmAt(t)];
  if (!f?.beats) return !silAtEnv(t);
  for (const b of f.beats.beats) {
    if (!b.v) continue;
    if (t >= b.t && t < b.t + spokenFor(b)) return true;
  }
  return false;
}
/* how long the voice has been away, and how long until it returns — ANSWER
   needs the first, and anyone performing against a record needs the second */
function quietSince(t) {
  const f = FILMS[filmAt(t)];
  if (!f?.beats) return quietForEnv(t);
  let last = f.beats.container[0];
  for (const b of f.beats.beats) { if (!b.v) continue; const e = b.t + spokenFor(b); if (e <= t && e > last) last = e; }
  return Math.max(0, t - last);
}
function untilSpeech(t) {
  const f = FILMS[filmAt(t)];
  if (!f?.beats) return 99;
  for (const b of f.beats.beats) if (b.v && b.t > t) return b.t - t;
  return 99;
}
const envAt = (t) => {
  if (!VOICE.env || !VOICE.dur) return 0;
  const i = clamp(Math.floor(t / VOICE.dur * VOICE.env.length), 0, VOICE.env.length - 1);
  return VOICE.env[i];
};
const silAtEnv = (t) => {
  if (!VOICE.sil || !VOICE.dur) return 1;
  const i = clamp(Math.floor(t / VOICE.dur * VOICE.sil.length), 0, VOICE.sil.length - 1);
  return VOICE.sil[i];
};
/* how long the voice has been quiet, and how long until it speaks again —
   ANSWER needs the first and a performer needs the second */
function quietForEnv(t) {
  if (!VOICE.sil) return 0;
  const per = VOICE.dur / VOICE.sil.length;
  let i = clamp(Math.floor(t / per), 0, VOICE.sil.length - 1), n = 0;
  while (i >= 0 && VOICE.sil[i]) { n++; i--; }
  return n * per;
}


/* ---- the field, and the timed mark --------------------------------------- */
const BASE = new Float32Array(FW * FH);      // the traced film frame
const FIELD = new Float32Array(FW * FH);     // base + performed strokes + poem
const WMASK = new Uint8Array(FW * FH);
let STROKES = [], live = null, level = 7, brush = 3;

/* ---- the six relations, as rules rather than as instructions --------------
   Each returns multipliers and offsets on the read head's four knobs, from the
   voice's live energy `v`, whether it is silent, and how long it has been. */
const RELATIONS = {
  HARMONIZE: {
    note: "find space around the voice — thin while it speaks, fill when it rests",
    fn: (v, sil, q) => ({ gate: 1 - 0.52 * v, ground: 0.30 * (1 - v), breath: 1, attack: 1 }),
  },
  ANSWER: {
    note: "phrase endings are entrances — enter only in what the voice left",
    fn: (v, sil, q) => ({ gate: sil ? clamp(q / 1.1, 0.1, 1) : 0.08, ground: 0.1, breath: 1, attack: 1.05 }),
  },
  SHADOW: {
    note: "an acoustic double, quiet and late — never a literal doubling",
    fn: (v, sil, q, vd) => ({ gate: 0.22 + 0.55 * vd, ground: 0.18, breath: 1, attack: 0.94 }),
  },
  COUNTERPOINT: {
    note: "an independent line whose coincidences with the voice feel earned",
    fn: (v, sil, q, vd, lfo) => {
      const meet = 1 - Math.abs(v - lfo);
      return { gate: 0.35 + 0.5 * lfo + 0.3 * Math.pow(meet, 6), ground: 0.25, breath: 1.15, attack: 1 };
    },
  },
  RESIST: {
    note: "a stable pressure against free speech — the voice is never quantised",
    fn: (v, sil, q, vd, lfo, pulse) => ({ gate: 0.25 + 0.75 * pulse, ground: 0.35, breath: 0.62, attack: 1.1 }),
  },
  EMBODY: {
    note: "the voice changes the WORLD, and the world is what makes the sound",
    fn: (v) => ({ gate: 1, ground: 0.5, breath: 1, attack: 1, world: v }),
  },
};
let REL = "ANSWER";

/* ---- audio out ------------------------------------------------------------ */
let ctx = null, node = null, gainN = null, srcNode = null, lvl = 0, ride = 1;
const AMP = new Float32Array(BANDS * COLS * 3);
const XB = new Int32Array(COLS + 1), YB = new Int32Array(BANDS + 1);
for (let c = 0; c <= COLS; c++) XB[c] = Math.floor(c / COLS * FW);
for (let b = 0; b <= BANDS; b++) YB[b] = Math.floor(b / BANDS * FH);
const HIST = new Uint32Array(9);
function reduce(g) {
  HIST.fill(0);
  for (let q = 0; q < FW * FH; q++) { const v = Math.round(g[q]); if (v >= 0 && v <= 8) HIST[v]++; }
  let bg = 0; for (let v = 1; v <= 7; v++) if (HIST[v] > HIST[bg]) bg = v;
  const N = BANDS * COLS;
  for (let c = 0; c < COLS; c++) {
    const x0 = XB[c], x1 = Math.max(x0 + 1, XB[c + 1]);
    for (let b = 0; b < BANDS; b++) {
      const y0 = YB[b], y1 = Math.max(y0 + 1, YB[b + 1]);
      let sf = 0, sg = 0, a8 = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const v = g[y * FW + x];
        if (v > 8.5) { a8++; n++; continue; }
        const lv = Math.min(7, Math.round(v)), d = lv - bg;
        n++;
        if (d === 0) { if (bg > 0) sg += 0.30; }
        else {
          const head = d > 0 ? Math.max(1, 7 - bg) : Math.max(1, bg);
          const con = Math.abs(d) / head;
          if (con >= 0.28) sf += con; else sg += con * 0.7;
        }
      }
      const i = b * COLS + c;
      AMP[i] = n ? sf / n : 0; AMP[N + i] = n ? sg / n : 0; AMP[2 * N + i] = n ? a8 / n : 0;
    }
  }
  return bg;
}
let ROOT = 41.203, MNAME = "aeolian", ENAME = "malhun";
function bandTable() {
  const S = modeOf(MNAME), root = foldRoot(ROOT), out = new Float32Array(BANDS);
  for (let b = 0; b < BANDS; b++) {
    const k = BANDS - 1 - b, step = Math.round(k / BANDS * (S.length * 6));
    out[b] = root * Math.pow(2, Math.floor(step / S.length) + S[step % S.length] / 12);
  }
  return out;
}
async function boot() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.audioWorklet.addModule("radio-worklet.js");
  gainN = ctx.createGain(); gainN.gain.value = 0.9; gainN.connect(ctx.destination);
  /* THE RECORD GOES THROUGH THE SAME OUTPUT, so the voice and the score are
     one signal and the balance between them is a thing you set once */
  srcNode = ctx.createMediaElementSource(audio);
  const vg = ctx.createGain(); vg.gain.value = +$("voiceLvl").value;
  srcNode.connect(vg); vg.connect(ctx.destination);
  $("voiceLvl").oninput = (e) => { vg.gain.value = +e.target.value; };
  node = new AudioWorkletNode(ctx, "bandbank", {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
    processorOptions: { bands: BANDS, cols: COLS },
  });
  node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
  node.port.postMessage({ hz: bandTable() });
  node.port.postMessage({ gain: 1 / Math.sqrt(BANDS) });
  node.connect(gainN);
}

/* ---- the poem, cut into the field ---------------------------------------- */
const wc = document.createElement("canvas"), wx = wc.getContext("2d", { willReadFrequently: true });
function inkLine(text, yTop = 96) {
  WMASK.fill(0);
  if (!text) return;
  const S = 4, px = 7;
  wc.width = FW * S; wc.height = FH * S;
  wx.clearRect(0, 0, wc.width, wc.height);
  wx.fillStyle = "#fff"; wx.textBaseline = "top";
  wx.font = `700 ${px * S}px ui-monospace, Menlo, monospace`;
  const lines = []; let cur = "";
  for (const w of String(text).toUpperCase().split(/\s+/)) {
    const t = cur ? cur + " " + w : w;
    if (wx.measureText(t).width / S > FW - 14) { if (cur) lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  lines.slice(0, 4).forEach((ln, i) =>
    wx.fillText(ln, (FW * S - wx.measureText(ln).width) / 2, (yTop + i * (px + 2)) * S));
  const im = wx.getImageData(0, 0, wc.width, wc.height).data;
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    let a = 0, n = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { a += im[(((y * S + sy) * wc.width) + x * S + sx) * 4 + 3]; n++; }
    if (a / n > 74) WMASK[y * FW + x] = 1;
  }
  for (let y = 1; y < FH - 1; y++) for (let x = 1; x < FW - 1; x++) {
    if (WMASK[y * FW + x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
      if (WMASK[(y + dy) * FW + x + dx] === 1) { WMASK[y * FW + x] = 2; dy = dx = 2; }
  }
}

/* ---- compose the field for a given moment -------------------------------- */
function buildField(t) {
  FIELD.set(BASE);
  /* the mark replays: only the strokes whose time has come. A stroke made at
     0:42 is not on the field at 0:41 — that is the difference between a
     drawing and a performance. */
  for (const s of STROKES) {
    if (s.points[0].t > t) continue;
    for (let i = 0; i < s.points.length; i++) {
      const p = s.points[i];
      if (p.t > t) break;
      stamp(FIELD, p.x, p.y, s.level, s.brush);
      if (i > 0) {                                    // fill between samples
        const q = s.points[i - 1], n = Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y));
        for (let k = 1; k < n; k++)
          stamp(FIELD, Math.round(q.x + (p.x - q.x) * k / n), Math.round(q.y + (p.y - q.y) * k / n), s.level, s.brush);
      }
    }
  }
  for (let i = 0; i < FIELD.length; i++)
    if (WMASK[i] === 1) FIELD[i] = 0; else if (WMASK[i] === 2) FIELD[i] = 7;
  return FIELD;
}
function stamp(F, cx0, cy0, l, r) {
  const rr = r * r;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > rr) continue;
    const x = cx0 + dx, y = cy0 + dy;
    if (x >= 0 && y >= 0 && x < FW && y < FH) F[y * FW + x] = l;
  }
}

/* ---- the panels ----------------------------------------------------------- */
const paintScene = makePainter($("scene"), FW, FH, 5);
const DISP = new Float32Array(FW * FH);
const wcv = $("world"), wcx = wcv.getContext("2d");
wcv.width = 960; wcv.height = 190;

/* THE WORLD IS THE VOICE AS TERRAIN. Silence is not an absence drawn in grey —
   it is open ground, and it is the material ANSWER is made of, so it is the
   brightest thing on the panel. */
function drawWorld(t) {
  const W = wcv.width, H = wcv.height;
  wcx.fillStyle = "#150818"; wcx.fillRect(0, 0, W, H);
  if (!VOICE.env) {
    wcx.fillStyle = "#8d6a70"; wcx.font = "12px ui-monospace,monospace";
    wcx.fillText("no record loaded", 12, 24); return;
  }
  const f = FILMS[filmIdx], w0 = f?.beats ? f.beats.container[0] : 0;
  const w1 = f?.beats ? f.beats.container[1] : VOICE.dur;
  const span = Math.max(1, w1 - w0), N = VOICE.env.length;
  const xOf = (tt) => (tt - w0) / span * W;
  const i0 = Math.max(0, Math.floor(w0 / VOICE.dur * N)), i1 = Math.min(N, Math.ceil(w1 / VOICE.dur * N));
  /* the amber is where the poet is NOT speaking, taken from the EDL and not
     from the waveform — it is the material ANSWER is made of, so it has to be
     the true one */
  if (f?.beats) {
    wcx.fillStyle = "rgba(242,160,60,.15)";
    wcx.fillRect(0, 0, W, H);
    wcx.fillStyle = "#150818";
    for (const b of f.beats.beats) if (b.v) wcx.fillRect(xOf(b.t), 0, Math.max(2, spokenFor(b) / span * W), H);
  } else for (let i = i0; i < i1; i++) if (VOICE.sil[i]) {
    wcx.fillStyle = "rgba(242,160,60,.16)";
    wcx.fillRect(xOf(i / N * VOICE.dur), 0, W / (i1 - i0) + 1, H);
  }
  wcx.beginPath(); wcx.moveTo(0, H);
  for (let i = i0; i < i1; i++) wcx.lineTo(xOf(i / N * VOICE.dur), H - 14 - VOICE.env[i] * (H - 34));
  wcx.lineTo(W, H); wcx.closePath();
  wcx.fillStyle = "rgba(246,231,200,.14)"; wcx.fill();
  wcx.strokeStyle = "#f6e7c8"; wcx.lineWidth = 1.4; wcx.stroke();
  /* the poem's own beats, from the EDLs — landmarks to perform against */
  if (f?.beats) for (const b of f.beats.beats) {
    const x = xOf(b.t);
    wcx.fillStyle = b.v ? "#e0532c" : "#8d6a70";
    wcx.fillRect(x, 0, 1.5, b.v ? 16 : 8);
  }
  const px = xOf(t);
  wcx.fillStyle = "#7fd67f"; wcx.fillRect(px, 0, 2, H);
  wcx.fillStyle = "#8d6a70"; wcx.font = "10px ui-monospace,monospace";
  wcx.fillText(`${fmt(t)}  ·  ${f ? f.world.n + " " + f.world.title : ""}`, 8, 13);
}

/* ---- transport ------------------------------------------------------------ */
let filmIdx = 0, beatI = -1, beatText = "", scanPh = 0, lastRaf = 0, lfoPh = 0, pulsePh = 0;
const now = () => audio.currentTime || 0;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function state(m, cls = "") { $("state").textContent = m; $("state").className = cls; }

function beatAt(t) {
  const f = FILMS[filmIdx]; if (!f?.beats) return { i: -1, text: "" };
  const B = f.beats.beats;
  let i = -1;
  for (let k = 0; k < B.length; k++) if (B[k].t <= t) i = k; else break;
  return i < 0 ? { i: -1, text: "" } : { i, text: B[i].v || B[i].s || "" };
}
function filmAt(t) { let i = 0; for (let k = 0; k < FILMS.length; k++) if (FILMS[k].beats && t >= FILMS[k].beats.container[0]) i = k; return i; }

function frame(ts) {
  requestAnimationFrame(frame);
  const dt = lastRaf ? Math.min(0.08, (ts - lastRaf) / 1000) : 0;
  lastRaf = ts;
  const t = now(), playing = !audio.paused;

  if ($("followFilm").checked) {
    const fi = filmAt(t);
    if (fi !== filmIdx) { filmIdx = fi; adoptFilm(); }
  }
  const B = beatAt(t);
  if (B.i !== beatI) { beatI = B.i; beatText = B.text; inkLine(beatText); $("line").textContent = beatText || "—"; }
  if ($("traceLive").checked && FILMS[filmIdx]) {
    const f = FILMS[filmIdx], c0 = f.beats ? f.beats.container[0] : 0;
    BASE.set(f.rt.renderField(clamp(t - c0, 0, f.rt.total - 0.01)));
  }

  /* --- the relation --- */
  const v = envAt(t), sil = speakingAt(t) ? 0 : 1, q = quietSince(t), vd = envAt(Math.max(0, t - 0.55));
  lfoPh = (lfoPh + dt * 0.11) % 1;
  pulsePh = (pulsePh + dt * (71.8 / 60)) % 1;
  const lfo = 0.5 - 0.5 * Math.cos(lfoPh * 6.283);
  const pulse = Math.pow(Math.max(0, 1 - pulsePh * 2.6), 1.6);
  const R = RELATIONS[REL].fn(v, sil, q, vd, lfo, pulse) || {};
  const E = engineOf(ENAME), u = clamp(FILMS[filmIdx] ? (t - (FILMS[filmIdx].beats?.container[0] || 0)) / Math.max(1, FILMS[filmIdx].rt.total) : 0, 0, 1);
  const scan = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;
  const breath = clamp(E.sweep(u) * (R.breath ?? 1), 0.6, 24);
  const gate = clamp(E.gate(u, scan) * (R.gate ?? 1), 0, 1);
  const ground = clamp((E.ground(u) + (R.ground ?? 0)), 0, 1);
  const attack = clamp(E.attack(u) * (R.attack ?? 1), 1.1, 3.6);
  if (playing) { scanPh += dt / (2 * breath); if (scanPh >= 1) scanPh -= 1; }

  /* --- the field, at this instant --- */
  const g = buildField(t);
  /* EMBODY is the one relation that changes the picture rather than the score,
     and then the picture is what makes the sound — the long way round, on
     purpose. The voice raises the ground and the room answers by being read. */
  if (REL === "EMBODY" && R.world !== undefined) {
    const lift = Math.round(R.world * 3);
    if (lift) for (let i = 0; i < g.length; i++) if (g[i] > 0 && g[i] <= 7) g[i] = Math.min(7, g[i] + lift);
  }
  reduce(g);
  const head = Math.round(scan * (FW - 1));
  for (let i = 0; i < g.length; i++) DISP[i] = inkToDisplay(g[i]);
  paintScene(DISP, head);
  drawWorld(t);

  if (node && playing) {
    node.port.postMessage({ amp: AMP.slice(), scan, gate, ground, attack, dt: Math.max(1 / 120, dt) });
    const want = lvl > 0.75 ? ride * 0.93 : lvl < 0.22 ? ride * 1.04 : ride;
    const nx = clamp(want, 0.05, 8);
    if (Math.abs(nx - ride) > 1e-4) { ride = nx; node.port.postMessage({ gain: ride / Math.sqrt(BANDS) }); }
  }

  const bar = (x, n = 12) => "▮".repeat(Math.round(clamp(x, 0, 1) * n)).padEnd(n, "▯");
  $("clock").textContent = `${fmt(t)} / ${fmt(VOICE.dur)}`;
  $("mVoice").textContent = `${v.toFixed(2)} ${bar(v)}${sil ? "  quiet " + q.toFixed(1) + "s" : ""}`;
  $("mBreath").textContent = `${breath.toFixed(1)}s ${bar(1 - clamp((breath - 2) / 15, 0, 1))}`;
  $("mGate").textContent = `${gate.toFixed(2)} ${bar(gate)}`;
  $("mGround").textContent = `${ground.toFixed(2)} ${bar(ground)}`;
  $("mAttack").textContent = `${attack.toFixed(2)} ${bar((attack - 1.6) / 2)}`;
  $("mOut").textContent = `${lvl.toFixed(3)} ${bar(lvl * 1.15)}`;
  const nxt = untilSpeech(t);
  $("next").textContent = !VOICE.env ? "" : sil ? (nxt < 90 ? `voice in ${nxt.toFixed(1)}s` : "no more voice here") : "speaking";
  window.__sketchradio = { t, v, sil, q, until: nxt, rel: REL, breath, gate, ground, attack, lvl,
    strokes: STROKES.length, film: FILMS[filmIdx]?.world.n, beat: beatI, line: beatText, playing };
}

/* ---- drawing, in time ----------------------------------------------------- */
const sc = $("scene");
function cellAt(e) {
  const r = sc.getBoundingClientRect();
  return [clamp(Math.floor((e.clientX - r.left) / r.width * FW), 0, FW - 1),
          clamp(Math.floor((e.clientY - r.top) / r.height * FH), 0, FH - 1)];
}
sc.addEventListener("pointerdown", (e) => {
  e.preventDefault(); sc.setPointerCapture?.(e.pointerId);
  const [x, y] = cellAt(e);
  live = { level, brush, points: [{ x, y, t: now() }] };
  STROKES.push(live); refreshTake();
});
sc.addEventListener("pointermove", (e) => {
  if (!live) return; e.preventDefault();
  const [x, y] = cellAt(e);
  live.points.push({ x, y, t: now() });
});
for (const ev of ["pointerup", "pointercancel", "pointerleave"])
  sc.addEventListener(ev, () => { live = null; });

function refreshTake() {
  const n = STROKES.length;
  $("take").textContent = n ? `${n} stroke${n > 1 ? "s" : ""} performed` : "nothing performed yet";
}

/* ---- VOICE → FIELD, without a model --------------------------------------
   The original asks a vision model to turn the sound-map into a drawing. The
   envelope is right here, so: write it into the field as a horizon whose
   height is the voice. It is not a picture OF the sound, it is the sound
   placed where the read head will cross it — so the drawing you get back
   sounds like the voice it came from. */
function voiceToField() {
  if (!VOICE.env) return state("load a record first", "warn");
  const f = FILMS[filmIdx];
  const w0 = f?.beats ? f.beats.container[0] : 0, w1 = f?.beats ? f.beats.container[1] : VOICE.dur;
  BASE.fill(0);
  for (let x = 0; x < FW; x++) {
    const tt = w0 + (x / (FW - 1)) * (w1 - w0);
    const e = envAt(tt), s = silAt(tt);
    const top = Math.round(FH - 8 - e * (FH - 26));
    for (let y = top; y < FH - 6; y++) BASE[y * FW + x] = s ? 2 : Math.min(7, 3 + Math.round(e * 4));
    if (!s) BASE[Math.max(0, top - 1) * FW + x] = 7;
  }
  state("the voice is the ground now", "ok");
}

/* ---- wiring --------------------------------------------------------------- */
function adoptFilm() {
  const f = FILMS[filmIdx]; if (!f) return;
  /* a blank field makes no sound, and a page that opens silent reads as a page
     that is broken. The film's own frame is the ground the mark is performed
     over, so it is there from the first second. */
  if (!$("traceLive").checked) BASE.set(f.rt.renderField(clamp(2, 0, f.rt.total - 0.01)));
  const sc2 = f.world.score || {};
  ENAME = sc2.engine || ENAME; MNAME = sc2.mode || "aeolian"; ROOT = f.world.drone?.base || 41.203;
  $("engine").value = ENAME; $("film").value = String(filmIdx);
  beatI = -1;
  if (node) node.port.postMessage({ hz: bandTable() });
}
$("film").innerHTML = FILMS.map((f, i) => `<option value="${i}">${f.world.n} ${f.world.title}</option>`).join("");
$("engine").innerHTML = Object.entries(ENGINES).map(([k, e]) => `<option value="${k}">${k} · ${e.tradition}</option>`).join("");
$("rel").innerHTML = Object.entries(RELATIONS).map(([k, r]) => `<option value="${k}">${k}</option>`).join("");
$("rel").value = REL; $("relNote").textContent = RELATIONS[REL].note;
$("rel").onchange = () => { REL = $("rel").value; $("relNote").textContent = RELATIONS[REL].note; state(`${REL} · ${RELATIONS[REL].note}`, "ok"); };
$("engine").onchange = () => { ENAME = $("engine").value; };
$("film").onchange = () => {
  filmIdx = +$("film").value; adoptFilm();
  const f = FILMS[filmIdx];
  if (f?.beats && VOICE.dur) audio.currentTime = f.beats.container[0] + 0.05;
};
$("play").onclick = async () => {
  await boot();
  if (ctx.state === "suspended") await ctx.resume();
  if (audio.paused) { await audio.play().catch(() => {}); $("play").textContent = "◼ STOP"; }
  else { audio.pause(); $("play").textContent = "▶ PLAY"; if (node) node.port.postMessage({ stop: 1 }); }
};
$("clearTake").onclick = () => { STROKES = []; live = null; refreshTake(); };
$("undoTake").onclick = () => { STROKES.pop(); refreshTake(); };
$("voiceToField").onclick = voiceToField;
$("levels").innerHTML = Array.from({ length: 8 }, (_, l) => `<button data-l="${l}"${l === 7 ? ' class="on"' : ""}>${l}</button>`).join("");
for (const b of $("levels").querySelectorAll("button")) {
  const c = 255 * inkToDisplay(+b.dataset.l);
  b.style.background = `rgb(${Math.round(c * .95)},${Math.round(c * .55)},${Math.round(c * .2)})`;
  b.style.color = inkToDisplay(+b.dataset.l) > 0.5 ? "#1a0a10" : "#f6e7c8";
  b.onclick = () => { level = +b.dataset.l; for (const o of $("levels").querySelectorAll("button")) o.classList.toggle("on", o === b); };
}
$("brush").oninput = (e) => { brush = +e.target.value; $("brushN").textContent = brush * 2 + 1; };
$("load").onclick = () => $("file").click();
$("file").onchange = async (e) => {
  const f = e.target.files?.[0]; if (!f) return;
  audio.src = URL.createObjectURL(f);
  await analyse(await f.arrayBuffer(), f.name);
};
$("world").onclick = (e) => {
  if (!VOICE.dur) return;
  const f = FILMS[filmIdx], w0 = f?.beats ? f.beats.container[0] : 0, w1 = f?.beats ? f.beats.container[1] : VOICE.dur;
  const r = wcv.getBoundingClientRect();
  audio.currentTime = w0 + (e.clientX - r.left) / r.width * (w1 - w0);
};
addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  if (e.key >= "0" && e.key <= "7") $("levels").querySelector(`[data-l="${e.key}"]`)?.click();
});

/* the suite's own record, already in this repository, loaded by default so the
   first thing anyone does is press play and draw rather than find a file */
adoptFilm(); refreshTake();
audio.src = "footage/unified-drones.mp3";
fetch("footage/unified-drones.mp3").then(r => r.arrayBuffer())
  .then(b => analyse(b, "unified-drones.mp3"))
  .catch(() => state("could not read the record — LOAD a file", "warn"));
requestAnimationFrame(frame);
