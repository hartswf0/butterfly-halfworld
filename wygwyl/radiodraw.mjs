/* ============================================================================
   radiodraw.mjs — cool-sketch-radio. A SCENE UNDER INFLUENCE.

   Three programs, three answers to where time comes from and who may change it.

     ARCHIVE RADIO   time is FOUND. Its verbs are NEXT, RANDOM, AUTO, LOOP. The
                     cadence is already inside the recording and the program
                     arranges encounters with it.
     WYGWYL SUITE    time is SHARED. One <audio> element is the clock and
                     everything is a lookup on it: frame = (t - start) x 8,
                     poem line = binary search on frame, film = which window
                     contains t. Fourteen films, fourteen poems, one key.
     SKETCHSONG      time is CONSTRUCTED. FROM -> THROUGH -> TO, and the
                     THROUGH is a written translation theory you can argue with.

   THE DIFFERENCE THAT MAKES A DIFFERENCE IS NOT THEIR SUBJECT, IT IS WHERE
   THEIR ARROWS POINT, and you can read it straight off the source.

   In the suite player every medium is a child of t and NONE of them is a
   parent of any other. Poem, film, frame, drone and metadata are siblings
   joined on a key. Nothing in that program can make the drone respond to the
   poem, because there is no expression in it whose value depends on another
   medium — only on the clock. It is a temporal JOIN, and a join is not a
   relation.

   In Sketchsong the arrow between media does exist and is editable, which is
   the real advance. But it is compiled by a language model, runs one way per
   generation, and is not live: the marks you draw on the spectrum go out as a
   PNG, come back as words, and a second model rewrites the notes. Its own
   schema shows the cost of an arrow nobody can measure — sixteen synthesis
   effects required, generated, stored and exported, and the synthesiser reads
   exactly one of them.

   So the missing thing is not another medium and not a bigger model. It is an
   arrow that is LIVE, REVERSIBLE, and MEASURABLE. That is this page.

   AND THE FOURTEEN PROSODIC ENGINES WERE ALREADY RELATION GRAPHS. `sweep`,
   `gate`, `ground` and `attack` are four arrows, and in every engine their
   source is hard-wired to the clock. Malhun is CLOCK -> BREATH, tightening.
   Gabay is GROUND <- nothing. Making the SOURCE of each arrow assignable is
   not a new system bolted onto the old one; it is the same four knobs with the
   question of who turns them handed to the user. With no arrows at all this
   page is exactly the sketch radio.

   THE LAW OF THIS INSTRUMENT: A CORRESPONDENCE MUST BE FALSIFIABLE. Every
   arrow is run twice each frame — once with it and once with it muted — and
   the difference it actually made to its target is displayed beside it. An
   arrow that changes nothing says DEAD. That is the generalisation of the
   one-of-sixteen finding into a design rule, and it is the only defence
   against a machine full of relations that do not relate.
   ========================================================================= */
import { makeRuntime } from "./halfworld.mjs";
import { ENGINES, engineOf, modeOf, foldRoot } from "./deep/prosody.mjs";
import { makePainter, inkToDisplay } from "./deep/paint.mjs";

const FW = 192, FH = 144, COLS = 64;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* ---- the material ---------------------------------------------------------
   The poet is present as TIMING AND TEXT ONLY — 111 beats lifted out of the
   suite's twin EDLs, 26 kilobytes. Not as audio. That is a limitation which
   turns out to be the correct ethic: the recorded poet cannot be processed
   because the recording is not here, so POET hears nothing and affects
   everything, by construction rather than by good intentions. */
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

/* ---- the field, and the poem written into it -----------------------------
   The line the poet is speaking is rasterised into the same 192x144 field the
   picture lives in, so it is inked, so it is scanned, so it is SOUNDED. The
   poem is not a caption beside the work and not a layer above it. It is part
   of what the read head crosses, which is the whole claim: the poem is the
   picture and the picture is the sound. */
const FIELD = new Float32Array(FW * FH);
/* 0 = nothing here · 1 = the glyph itself · 2 = its edge */
const WMASK = new Uint8Array(FW * FH);
const wc = document.createElement("canvas"), wx = wc.getContext("2d", { willReadFrequently: true });
/* THE POEM IS A HOLE IN THE PICTURE, NOT A LAYER OVER IT.

   First attempt drew the line at level 6 and it disappeared: half this suite is
   tone, film 13's water sits at level 4 or 5, and six against five is one level
   of contrast, which the halftone swallows whole. 552 cells of ink were being
   written every beat and none of them could be seen.

   So the glyph is PAPER and its edge is full ink — the same hot-line-with-dark-
   shoulders trick the read head uses, and for the same reason: it is the only
   pair of values legible against every background there is. It is also right
   twice over. A caption in a beflix frame has always been a hole cut in the
   field. And a paper hole in a dark ground is a FIGURE by the sonifier's own
   rule — contrast in either direction — so the words do not merely appear on
   the picture, they are crossed by the head and they sound. */
function inkLine(text, _level, yTop = 92) {
  WMASK.fill(0);
  if (!text) return;
  const S = 4, px = 7;                                    // supersample, then average
  wc.width = FW * S; wc.height = FH * S;
  wx.clearRect(0, 0, wc.width, wc.height);
  wx.fillStyle = "#fff";
  wx.font = `700 ${px * S}px ui-monospace, Menlo, monospace`;
  wx.textBaseline = "top";
  const words = String(text).toUpperCase().split(/\s+/);
  const lines = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (wx.measureText(t).width / S > FW - 12) { if (cur) lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const use = lines.slice(0, 5);
  use.forEach((ln, i) => {
    const w = wx.measureText(ln).width;
    wx.fillText(ln, (FW * S - w) / 2, (yTop + i * (px + 2)) * S);
  });
  const im = wx.getImageData(0, 0, wc.width, wc.height).data;
  /* coverage, not point sampling: a point sample at this size loses whole
     letters and the line comes out as a different word */
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    let a = 0, n = 0;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      a += im[(((y * S + sy) * wc.width) + x * S + sx) * 4 + 3]; n++;
    }
    if (a / n > 74) WMASK[y * FW + x] = 1;
  }
  /* one cell of edge around every glyph, and only where the glyph is not */
  for (let y = 1; y < FH - 1; y++) for (let x = 1; x < FW - 1; x++) {
    if (WMASK[y * FW + x]) continue;
    if (WMASK[(y - 1) * FW + x] === 1 || WMASK[(y + 1) * FW + x] === 1
      || WMASK[y * FW + x - 1] === 1 || WMASK[y * FW + x + 1] === 1
      || WMASK[(y - 1) * FW + x - 1] === 1 || WMASK[(y - 1) * FW + x + 1] === 1
      || WMASK[(y + 1) * FW + x - 1] === 1 || WMASK[(y + 1) * FW + x + 1] === 1) WMASK[y * FW + x] = 2;
  }
}

/* ---- characters -----------------------------------------------------------
   Each is a scalar in 0..1 that other things may listen to. HEARS is a fact
   about the graph, not a decoration: POET's is empty and always will be. */
const CH = {
  POET:  { v: 0, hears: [], note: "timing and text, never audio" },
  PULSE: { v: 0, hears: ["POET"], note: "a body, 71.8 bpm, elastic" },
  FIELD: { v: 0, hears: [], note: "ink under the read head" },
  LAND:  { v: 0, hears: ["FIELD"], note: "what the field sounds like" },
  SKY:   { v: 0.5, hears: [], note: "openness — a target as well as a source" },
  RADIO: { v: 0, hears: [], note: "happenstance: another film, drifting" },
};
const CHARS = Object.keys(CH);

/* ---- targets: the four prosody knobs, plus sky and cut -------------------- */
const TGT = {
  BREATH: { base: 6, v: 6, span: 4.0, lo: 1.2, hi: 22 },
  GATE:   { base: 1, v: 1, span: 0.6, lo: 0, hi: 1 },
  GROUND: { base: 0, v: 0, span: 0.6, lo: 0, hi: 1 },
  ATTACK: { base: 2.1, v: 2.1, span: 0.8, lo: 1.2, hi: 3.6 },
  SKY:    { base: 0.5, v: 0.5, span: 0.6, lo: 0, hi: 1 },
  CUT:    { base: 0, v: 0, span: 0.5, lo: 0, hi: 1 },
  /* the body's own rate, so the pulse can be bent by what it hears — and so
     that at least one pair in this graph is genuinely reversible */
  PULSE:  { base: 71.8, v: 71.8, span: 20, lo: 34, hi: 168 },
};
const TARGETS = Object.keys(TGT);

/* ---- the six relations ----------------------------------------------------
   Each returns a contribution in -1..1. These are the whole vocabulary and it
   is deliberately short: six ways one thing can attend to another, not fifty
   parameters. The state object is per-arrow so SHADOW can remember and ANSWER
   can time a silence. */
const MODES = {
  FOLLOW:    (v) => v - 0.5,
  RESIST:    (v) => 0.5 - v,
  /* enters the room the other one left: rises only after the source has been
     quiet, which is what an accompaniment that answers actually does */
  ANSWER:    (v, s, dt) => { s.q = v < 0.18 ? (s.q || 0) + dt : 0; return clamp(s.q / 1.4, 0, 1) - 0.5; },
  /* an acoustic double, quiet and late */
  SHADOW:    (v, s, dt, d) => { (s.buf ||= []).push(v); const n = Math.max(1, Math.round(d / Math.max(dt, 1e-3)));
                                while (s.buf.length > n) s.buf.shift(); return (s.buf[0] - 0.5) * 0.45; },
  /* contradicts, but only at the peak — tender speech against a machine */
  UNDERMINE: (v) => (v > 0.55 ? -(v - 0.5) * 1.6 : 0),
  /* declines to listen, audibly. A token independence is still a relation. */
  DRIFT:     (v, s, dt) => { s.p = (s.p || 0) + dt * 0.037; return Math.sin(s.p * 6.283) * 0.5; },
};
let ARROWS = [];
let nextId = 1;
function addArrow(src, dst, mode, w = 0.6, delay = 0.6) {
  if (!CH[src] || !TGT[dst] || !MODES[mode]) return null;
  const a = { id: nextId++, src, dst, mode, w, delay, s: {}, s2: {}, infl: 0, acc: 0, n: 0 };
  ARROWS.push(a); renderArrows(); return a;
}

/* ---- the clock, which is the primitive worth having ----------------------
   Not one permanent master. Each character offers a RATE at which it thinks
   time should advance, and the clock is a weighted compromise between them.
   POET holds time still through the silences; PULSE advances it in steps;
   FIELD makes a dense picture take longer to cross; RADIO hands the scene to
   an outsider; FREE is wall time. Blend them and the clocks negotiate, which
   is the mortar in a literal computational sense. */
const CLOCK = { POET: 0, PULSE: 0, FIELD: 0, RADIO: 0, FREE: 1 };
function clockRate(dt) {
  const r = {
    POET: CH.POET.v > 0.06 ? 1.35 : 0.12,          // the piece waits for the voice
    PULSE: 0.35 + CH.PULSE.v * 1.6,                 // advances in the beats
    FIELD: 1.6 - CH.FIELD.v * 1.1,                  // a dense picture is slow to cross
    RADIO: 0.4 + CH.RADIO.v * 1.7,                  // hostage to an outside signal
    FREE: 1,
  };
  let sum = 0, tot = 0;
  for (const k of Object.keys(CLOCK)) { sum += CLOCK[k] * r[k]; tot += CLOCK[k]; }
  return tot > 0 ? sum / tot : 1;
}

/* ---- audio: the same band bank, driven by the same reduction ------------- */
let ctx = null, node = null, gainN = null, lvl = 0, ride = 1;
const BANDS = 56;
const AMP = new Float32Array(BANDS * COLS * 3);
const XB = new Int32Array(COLS + 1), YB = new Int32Array(BANDS + 1);
for (let c = 0; c <= COLS; c++) XB[c] = Math.floor(c / COLS * FW);
for (let b = 0; b <= BANDS; b++) YB[b] = Math.floor(b / BANDS * FH);
const HIST = new Uint32Array(9);
const MERGED = new Float32Array(FW * FH);
function merge() {
  for (let i = 0; i < MERGED.length; i++)
    MERGED[i] = WMASK[i] === 1 ? 0 : WMASK[i] === 2 ? 7 : FIELD[i];
  return MERGED;
}
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
let ROOT = 41.203, MODE_NAME = "aeolian", ENAME = "malhun";
function bandTable() {
  const S = modeOf(MODE_NAME), root = foldRoot(ROOT), out = new Float32Array(BANDS);
  for (let b = 0; b < BANDS; b++) {
    const k = BANDS - 1 - b, step = Math.round(k / BANDS * (S.length * 6));
    out[b] = root * Math.pow(2, Math.floor(step / S.length) + S[step % S.length] / 12);
  }
  return out;
}
async function audio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.audioWorklet.addModule("radio-worklet.js");
  gainN = ctx.createGain(); gainN.gain.value = 0.85; gainN.connect(ctx.destination);
  node = new AudioWorkletNode(ctx, "bandbank", {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
    processorOptions: { bands: BANDS, cols: COLS },
  });
  node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
  node.port.postMessage({ hz: bandTable() });
  node.port.postMessage({ gain: 1 / Math.sqrt(BANDS) });
  node.connect(gainN);
}
/* PULSE is heard as well as felt: a short low body, so the temporal commons
   the whole scene leans against is something you can actually hear it lean on */
function thump(at, amp) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(96, at); o.frequency.exponentialRampToValueAtTime(41, at + 0.10);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.004, 0.34 * amp), at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.30);
  o.connect(g); g.connect(gainN); o.start(at); o.stop(at + 0.34);
}

/* ---- the scene ------------------------------------------------------------ */
const paint = makePainter($("scene"), FW, FH, 5);
const DISP = new Float32Array(FW * FH);
function show(g, head, sky) {
  /* SKY is not a decoration painted over the picture — it lifts the whole
     plate toward paper, which in this printer means the room opening */
  const k = lerp(0, 0.30, clamp(sky, 0, 1));
  for (let i = 0; i < g.length; i++) DISP[i] = clamp(inkToDisplay(g[i]) + k * (1 - inkToDisplay(g[i])), 0, 1);
  paint(DISP, head);
}

/* ---- transport ------------------------------------------------------------ */
let playing = false, t = 0, u = 0, scanPh = 0, last = 0, LOOP = 90;
let filmIdx = 12, traceT = 40, beatI = -1, beatText = "", pulsePh = 0, radioPh = 0;
let TEMPO = 71.8, ELAST = 0.18;

function poetAt(time) {
  const f = FILMS[filmIdx]; if (!f?.beats) return { v: 0, text: "" };
  const B = f.beats.beats, c0 = f.beats.container[0], span = f.beats.container[1] - c0;
  const local = c0 + (time / LOOP) * span;
  let i = -1;
  for (let k = 0; k < B.length; k++) if (B[k].t <= local) i = k; else break;
  if (i < 0) return { v: 0, text: "", i: -1 };
  const b = B[i], age = local - b.t, dur = b.d || 3.4;
  const env = age > dur ? 0 : Math.min(1, age / 0.25) * (1 - Math.max(0, (age - dur * 0.6) / (dur * 0.4)));
  return { v: b.v ? clamp(env, 0, 1) : 0, text: b.v || b.s || "", i };
}

function frame(now) {
  requestAnimationFrame(frame);
  const raw = last ? Math.min(0.08, (now - last) / 1000) : 0;
  last = now;

  /* --- who says how fast time goes --- */
  const dt = playing ? raw * clockRate(raw) : 0;
  t += dt; if (t >= LOOP) t -= LOOP;
  u = clamp(t / LOOP, 0, 1);

  /* --- characters speak --- */
  const P = poetAt(t);
  CH.POET.v = P.v;
  if (P.i !== beatI) { beatI = P.i; beatText = P.text; inkLine(beatText); }
  pulsePh += raw * (TEMPO / 60) * (1 + ELAST * (CH.POET.v - 0.4));
  if (pulsePh >= 1) { pulsePh -= 1; if (ctx && playing) thump(ctx.currentTime + 0.02, 0.6 + CH.PULSE.v * 0.4); }
  CH.PULSE.v = Math.pow(Math.max(0, 1 - pulsePh * 3.2), 2);
  CH.LAND.v = ranged(CH.LAND, lvl);
  radioPh += raw * 0.07; if (radioPh >= 1) radioPh -= 1;
  const rf = FILMS[(filmIdx + 5) % FILMS.length];
  CH.RADIO.v = rf ? ranged(CH.RADIO, inkDensity(rf.rt.renderField(radioPh * rf.rt.total))) : 0;

  /* --- the arrows, each run twice: with, and muted --- */
  const E = engineOf(ENAME);
  const scanNow = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;
  TGT.BREATH.base = E.sweep(u); TGT.GATE.base = E.gate(u, scanNow);
  TGT.GROUND.base = E.ground(u); TGT.ATTACK.base = E.attack(u);
  TGT.SKY.base = 0.42; TGT.CUT.base = 0; TGT.PULSE.base = 71.8;
  const contrib = new Map();
  for (const a of ARROWS) contrib.set(a.id, a.w * MODES[a.mode](CH[a.src].v, a.s, Math.max(raw, 1e-3), a.delay));
  for (const k of TARGETS) {
    const T = TGT[k];
    let sum = 0;
    for (const a of ARROWS) if (a.dst === k) sum += contrib.get(a.id);
    T.v = clamp(T.base + sum * T.span, T.lo, T.hi);
    /* THE FALSIFICATION. Same target, one arrow removed. The difference is
       what that arrow is actually worth, in the units of the thing it claims
       to move — not a confidence the machine asserts about itself. */
    for (const a of ARROWS) if (a.dst === k) {
      const without = clamp(T.base + (sum - contrib.get(a.id)) * T.span, T.lo, T.hi);
      a.acc += Math.abs(T.v - without) / T.span; a.n++;
      if (a.n > 180) { a.infl = a.acc / a.n; a.acc *= 0.5; a.n = 90; }
    }
  }
  CH.SKY.v = TGT.SKY.v; TEMPO = TGT.PULSE.v;
  if (TGT.CUT.v > 0.62 && playing && Math.random() < 0.02) {
    traceT = (traceT + 7.3) % Math.max(1, FILMS[filmIdx].rt.total);
    FIELD.set(FILMS[filmIdx].rt.renderField(traceT));
  }

  /* --- the head, the picture, the sound --- */
  const sweep = Math.max(0.4, TGT.BREATH.v);
  if (playing) { scanPh += raw / (2 * sweep); if (scanPh >= 1) scanPh -= 1; }
  const scan = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;
  const head = Math.round(scan * (FW - 1));
  const g = merge();
  CH.FIELD.v = ranged(CH.FIELD, colDensity(g, head));
  reduce(g);
  show(g, head, TGT.SKY.v);
  if (node && playing) {
    node.port.postMessage({ amp: AMP.slice(), scan, gate: TGT.GATE.v, ground: TGT.GROUND.v, attack: TGT.ATTACK.v, dt: Math.max(1 / 120, raw) });
    const want = lvl > 0.75 ? ride * 0.93 : lvl < 0.22 ? ride * 1.04 : ride;
    const next = clamp(want, 0.05, 8);
    if (Math.abs(next - ride) > 1e-4) { ride = next; node.port.postMessage({ gain: ride / Math.sqrt(BANDS) }); }
  }
  paintMeters();
  window.__radiodraw = {
    t, u, rate: clockRate(raw), scan, playing, beat: beatI, text: beatText,
    inkedWords: (() => { let n = 0; for (let i = 0; i < WMASK.length; i++) if (WMASK[i] === 1) n++; return n; })(),
    ch: Object.fromEntries(CHARS.map(c => [c, +CH[c].v.toFixed(3)])),
    tgt: Object.fromEntries(TARGETS.map(k => [k, +TGT[k].v.toFixed(3)])),
    arrows: ARROWS.map(a => ({ id: a.id, src: a.src, dst: a.dst, mode: a.mode, w: a.w, influence: +a.infl.toFixed(4) })),
  };
}
function inkDensity(g) { let s = 0; for (let i = 0; i < g.length; i += 7) s += Math.min(7, g[i]) / 7; return s / (g.length / 7); }
function colDensity(g, x) { let s = 0; for (let y = 0; y < FH; y++) s += Math.min(7, g[y * FW + x]) / 7; return s / FH; }

/* A CHARACTER PINNED AT ITS RAIL IS A DEAD SOURCE, and a fixed multiplier pins
   them: ink density runs about 0.5 on a tone film and about 0.05 on a line
   drawing, so any constant that makes one of them audible saturates the other.
   The first run of this page had FIELD and RADIO both reading exactly 1.000
   forever — arrows drawn from them could not have carried information, and the
   influence meter would have gone on reporting a healthy number for an arrow
   whose source was a constant. So each character carries its own slow range and
   normalises into it. The rule the page enforces on arrows has to apply to the
   things the arrows come from. */
function ranged(ch, raw) {
  ch.lo = ch.lo === undefined ? raw : Math.min(ch.lo + 0.00004, raw);
  ch.hi = ch.hi === undefined ? raw + 1e-3 : Math.max(ch.hi - 0.00004, raw);
  const span = Math.max(0.02, ch.hi - ch.lo);
  return clamp((raw - ch.lo) / span, 0, 1);
}

/* ---- the panels ----------------------------------------------------------- */
const bar = (v, n = 10) => "▮".repeat(Math.round(clamp(v, 0, 1) * n)).padEnd(n, "▯");
function paintMeters() {
  $("chars").innerHTML = CHARS.map(c => {
    const ch = CH[c];
    /* a source with no range is as dead as an arrow with no influence */
    const flat = ch.hi !== undefined && ch.hi - ch.lo < 0.03;
    return `<div class="ch"><b>${c}</b><i>${ch.hears.length ? "hears " + ch.hears.join(",") : "hears nothing"}</i>`
      + `<span class="${flat ? "flat" : ""}">${flat ? "FLAT" : bar(ch.v)}</span></div>`;
  }).join("");
  $("tgts").innerHTML = TARGETS.map(k => {
    const T = TGT[k], d = T.v - T.base;
    return `<div class="tg"><b>${k}</b><span>${T.v.toFixed(k === "PULSE" ? 1 : 2)}</span>`
      + `<em class="${Math.abs(d) > 0.02 * T.span ? "moved" : ""}">${d >= 0 ? "+" : ""}${d.toFixed(2)}</em></div>`;
  }).join("");
  for (const a of ARROWS) {
    const el = document.querySelector(`[data-infl="${a.id}"]`);
    if (!el) continue;
    const dead = a.infl < 0.02;
    el.textContent = dead ? "DEAD" : a.infl.toFixed(3);
    el.className = "infl " + (dead ? "dead" : a.infl > 0.15 ? "strong" : "");
  }
}
function renderArrows() {
  $("arrows").innerHTML = ARROWS.length ? ARROWS.map(a => `
    <div class="arrow" data-id="${a.id}">
      <b>${a.src}</b><s>→</s><b>${a.dst}</b>
      <select data-f="mode">${Object.keys(MODES).map(m => `<option${m === a.mode ? " selected" : ""}>${m}</option>`).join("")}</select>
      <input data-f="w" type="range" min="0" max="1.4" step="0.05" value="${a.w}">
      <span class="infl" data-infl="${a.id}">—</span>
      <button data-f="flip" title="reverse the arrow — possible only where both ends are both">↺</button>
      <button data-f="kill">×</button>
    </div>`).join("") : `<div class="empty">no arrows. with none, this page is exactly the sketch radio: the engine turns its own four knobs.</div>`;
  for (const el of $("arrows").querySelectorAll(".arrow")) {
    const a = ARROWS.find(x => x.id === +el.dataset.id);
    el.querySelector("[data-f=mode]").onchange = (e) => { a.mode = e.target.value; a.s = {}; a.acc = 0; a.n = 0; };
    el.querySelector("[data-f=w]").oninput = (e) => { a.w = +e.target.value; a.acc = 0; a.n = 0; };
    el.querySelector("[data-f=kill]").onclick = () => { ARROWS = ARROWS.filter(x => x.id !== a.id); renderArrows(); };
    /* REVERSING AN ARROW IS ONLY POSSIBLE WHERE BOTH ENDS ARE BOTH, and the
       refusal is the interesting part. "Any arrow can reverse" is true of a
       diagram and not of a machine: a SOURCE is something that emits a value
       and a TARGET is something with a base and a span, and most nodes are one
       or the other. SKY and PULSE are both, so those flip. POET can never be a
       target — it is present as timing and text, there is no audio to process,
       and so the ethic that the recorded poet stays untouched is structural
       rather than a promise. */
    el.querySelector("[data-f=flip]").onclick = () => {
      if (CH[a.dst] && TGT[a.src]) {
        const s0 = a.src; a.src = a.dst; a.dst = s0;
        a.s = {}; a.acc = 0; a.n = 0; renderArrows();
        return say(`${a.src} → ${a.dst} — reversed`, "ok");
      }
      if (a.src === "POET")
        return say("POET cannot be a target. It is here as timing and text, never as audio, so there is nothing to process — the ethic is structural, not a setting.", "warn");
      say(`${a.dst} does not emit and ${a.src} does not receive. Only SKY and PULSE are both a character and a target.`, "warn");
    };
  }
}

/* ---- a tiny language, because a relation you cannot state is not editable --
   Knowlton's law: intent becomes program, and the program stays visible. No
   model is involved and none is pretended. */
const PHRASES = [
  [/answer.*poem|music.*answer/i, "poet -> gate answer 0.8"],
  [/follow.*poem|music.*follow/i, "poet -> gate follow 0.7"],
  [/breath.*late|one breath late/i, "poet -> breath shadow 0.7"],
  [/pulse.*resist|mechanical/i, "poet -> breath resist 0.6"],
  [/open.*sky|sky.*open/i, "poet -> sky follow 0.8"],
  [/radio.*only.*silence|radio.*enter/i, "radio -> ground answer 0.7"],
  [/disagree|contradict|undermine/i, "poet -> attack undermine 0.8"],
  [/wait for (the )?(poet|voice)/i, "clock poet 1"],
  [/let the (body|pulse) keep time/i, "clock pulse 1"],
];
function say(msg, cls = "") { const l = $("log"); l.innerHTML = `<div class="${cls}">${msg}</div>` + l.innerHTML; }
function run(line) {
  const raw = line.trim(); if (!raw) return;
  say(`<u>${raw}</u>`);
  let cmd = raw;
  for (const [re, sub] of PHRASES) if (re.test(raw)) { cmd = sub; say(`→ ${sub}`, "dim"); break; }
  const p = cmd.toLowerCase().replace(/->|→/g, " ").split(/\s+/).filter(Boolean);
  if (p[0] === "help") return say("SRC -> TGT MODE W · clock NAME W … · engine NAME · trace NN T · loop N · clear · or plain English like “let the music answer the poem”", "dim");
  if (p[0] === "clear") { ARROWS = []; renderArrows(); return say("all arrows removed", "dim"); }
  if (p[0] === "clock") {
    for (const k of Object.keys(CLOCK)) CLOCK[k] = 0;
    for (let i = 1; i < p.length; i += 2) { const k = p[i].toUpperCase(); if (k in CLOCK) CLOCK[k] = +p[i + 1] || 1; }
    if (!Object.values(CLOCK).some(v => v > 0)) CLOCK.FREE = 1;
    syncClock(); return say(`clock = ${Object.entries(CLOCK).filter(([, v]) => v > 0).map(([k, v]) => k + " " + v).join(" · ")}`, "ok");
  }
  if (p[0] === "engine") { ENAME = p[1]; $("engine").value = ENAME; return say(`engine ${ENAME} — ${engineOf(ENAME).tradition}`, "ok"); }
  if (p[0] === "trace") { const i = FILMS.findIndex(f => f.slug.startsWith(p[1])); if (i >= 0) { filmIdx = i; traceT = +p[2] || 40; doTrace(); } return; }
  if (p[0] === "loop") { LOOP = clamp(+p[1] || 90, 10, 900); $("loop").value = LOOP; return say(`loop ${LOOP}s`, "ok"); }
  const src = (p[0] || "").toUpperCase(), dst = (p[1] || "").toUpperCase(), mode = (p[2] || "follow").toUpperCase();
  if (!CH[src]) return say(`no character “${src}”. try: ${CHARS.join(" ")}`, "warn");
  if (!TGT[dst]) return say(`no target “${dst}”. try: ${TARGETS.join(" ")}`, "warn");
  if (!MODES[mode]) return say(`no relation “${mode}”. try: ${Object.keys(MODES).join(" ")}`, "warn");
  addArrow(src, dst, mode, p[3] ? +p[3] : 0.7);
  say(`${src} → ${dst} · ${mode}`, "ok");
}

/* ---- wiring --------------------------------------------------------------- */
function doTrace() {
  const f = FILMS[filmIdx];
  FIELD.set(f.rt.renderField(clamp(traceT, 0, f.rt.total - 0.01)));
  const sc = f.world.score || {};
  ENAME = sc.engine || ENAME; MODE_NAME = sc.mode || "aeolian"; ROOT = f.world.drone?.base || 41.203;
  if (f.beats) LOOP = Math.round(f.beats.container[1] - f.beats.container[0]);
  $("engine").value = ENAME; $("loop").value = LOOP; $("film").value = String(filmIdx);
  beatI = -1;
  if (node) node.port.postMessage({ hz: bandTable() });
  say(`traced ${f.world.n} ${f.world.title} at ${traceT}s · engine ${ENAME} · loop ${LOOP}s`, "ok");
}
$("film").innerHTML = FILMS.map((f, i) => `<option value="${i}">${f.world.n} ${f.world.title}</option>`).join("");
$("engine").innerHTML = Object.entries(ENGINES).map(([k, e]) => `<option value="${k}">${k} · ${e.tradition}</option>`).join("");
$("film").onchange = () => { filmIdx = +$("film").value; doTrace(); };
$("engine").onchange = () => { ENAME = $("engine").value; };
$("loop").onchange = () => { LOOP = clamp(+$("loop").value || 90, 10, 900); };
$("at").onchange = () => { traceT = +$("at").value || 0; doTrace(); };
$("play").onclick = async () => {
  await audio(); if (ctx.state === "suspended") await ctx.resume();
  playing = !playing; $("play").textContent = playing ? "◼ STOP" : "▶ PLAY";
  if (!playing && node) node.port.postMessage({ stop: 1 });
};
$("ask").onkeydown = (e) => { if (e.key === "Enter") { run(e.target.value); e.target.value = ""; } };
$("addSrc").innerHTML = CHARS.map(c => `<option>${c}</option>`).join("");
$("addDst").innerHTML = TARGETS.map(c => `<option>${c}</option>`).join("");
$("addMode").innerHTML = Object.keys(MODES).map(c => `<option>${c}</option>`).join("");
$("add").onclick = () => run(`${$("addSrc").value} -> ${$("addDst").value} ${$("addMode").value} 0.7`);
function syncClock() {
  $("clock").innerHTML = Object.keys(CLOCK).map(k =>
    `<label>${k}<input data-c="${k}" type="range" min="0" max="1" step="0.05" value="${CLOCK[k]}"></label>`).join("");
  for (const el of $("clock").querySelectorAll("input"))
    el.oninput = (e) => { CLOCK[e.target.dataset.c] = +e.target.value; };
}
addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
});

syncClock(); renderArrows(); doTrace();
/* a scene that already has an opinion, so the first thing anyone does is
   change one rather than face an empty graph */
addArrow("POET", "GATE", "ANSWER", 0.85);
addArrow("PULSE", "SKY", "FOLLOW", 0.5);
addArrow("POET", "BREATH", "SHADOW", 0.6);
say("try: <b>let the music answer the poem</b> · <b>poet -> sky follow 0.9</b> · <b>clock poet 0.7 pulse 0.3</b> · <b>help</b>", "dim");
requestAnimationFrame(frame);
