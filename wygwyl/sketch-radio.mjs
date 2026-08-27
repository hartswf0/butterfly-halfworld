/* ============================================================================
   sketch-radio.mjs — THE RADIO WHERE ONE OF THE STATIONS IS YOUR OWN HAND.

   Two pages met to make this one. SKETCHSONG (word-sketch-song) has the better
   IDEA: a surface where a drawing becomes a piece of music, the translation
   theory is visible and contestable, the result is drawn back as a spectrum,
   and marks you make on that spectrum feed the next version. FROM, THROUGH, TO,
   and a loop. WYGWYL RADIO has the better CHANNEL: a measured, invertible path
   between a field of ink and a sound, where a frame transmitted as audio comes
   back out of a Fourier transform at 0.918 correlation with the frame that went
   in, and fourteen prosodic engines decide how a picture is read in time.

   WHAT SKETCHSONG'S LOOP CANNOT DO, AND WHY THIS EXISTS. Its spectrogram is a
   PICTURE OF the audio, and every arrow back out of it is a language model: the
   marks you draw are sent as a PNG to a vision model, described in words, and a
   second model recomposes the notes. Nothing in that chain puts energy at 400
   hertz because you drew at 400 hertz. It is a semantic loop wearing the
   clothes of a signal loop, and the giveaway is in its own schema — sixteen
   synthesis effects are required, generated and stored, and the synthesiser
   reads exactly one of them, `cutoff`. Fifteen declared, fifteen discarded, and
   no error message, ever.

   So this page closes the same loop through signal instead. The three things
   that only exist when you do that:

     1. THE SPECTRUM IS AN INSTRUMENT, NOT A REPORT. What you draw sounds. Now,
        with no key, no request, no round trip.
     2. THE READING RATE IS A DECLARED LAW. Sketchsong has bars and a tempo,
        which is a theory of METRE. The fourteen engines are a theory of how a
        voice occupies time, and the same drawing under gabay and under imzad is
        two different pieces — one exact and unaccompanied, one enormous and
        mostly silence.
     3. THE THEORY IS TESTABLE. Sketchsong's THEORY panel asserts a mapping.
        This one measures it: what you hear is transformed back into a picture
        as it plays, and the correlation with what you drew is on screen. A
        mapping that cannot survive the trip is not a translation, it is a
        decoration, and now you can watch the number say so.

   The language half is not here and is not faked. There is no key gate and no
   network; the seam where a word-to-sketch model would attach is marked in the
   page. What is here runs offline forever.
   ========================================================================= */
import { makeRuntime } from "./halfworld.mjs";
import { ENGINES, engineOf, modeOf, foldRoot } from "./deep/prosody.mjs";
import { makePainter, inkToDisplay, energyToDisplay } from "./deep/paint.mjs";

const FW = 192, FH = 144;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ---- the field, which is the only document this page has ------------------
   192 x 144 cells, levels 0..7, plus 8 for the accent. Every station in the
   WYGWYL suite is one of these; so is anything you draw. That they are the
   same object is what lets a hand share a dial with a film. */
const FIELD = new Float32Array(FW * FH);
const UNDO = [];

/* ---- stations to trace from ---------------------------------------------- */
const SLUGS = ["00-title-e", "01-out-of-life", "02-flashing-lights",
  "03-how-to-break-off-an-engagement", "04-nevermore", "05-bloodlines",
  "06-resurrecting-atlantis", "07-dj-turn-me-up", "08-newly-single",
  "09-yet-heard", "10-magic-ride", "11-new-day", "12-reunion",
  "13-how-to-win-my-heart", "14-hot-minute"];
const FILMS = [];
for (const slug of SLUGS) {
  try {
    const world = (await import(`./worlds/${slug}.mjs`)).default;
    FILMS.push({ slug, world, rt: makeRuntime(world) });
  } catch (_) { /* a world not yet written is simply absent */ }
}

/* ---- MUSIC and ICON, which want opposite things --------------------------
   MUSIC quantises rows to a mode so any picture at all is in key, and that is
   exactly what stops the sound's own spectrum from looking like the picture:
   144 rows collapsed onto seven pitches an octave is a picture with its
   vertical resolution thrown away. ICON gives up the key to get the picture
   back — one band per row, continuous log frequency, no gate. One is a station.
   The other is a proof. */
const ICON_LO = 300, ICON_HI = 9600;
let MODE = "music";
let BANDS = 56, hz = null, binLo = null, binHi = null;

function bandTable(engine, modeName) {
  const N = MODE === "icon" ? 144 : 56;
  const out = new Float32Array(N);
  if (MODE === "icon") {
    for (let b = 0; b < N; b++)
      out[b] = ICON_LO * Math.pow(ICON_HI / ICON_LO, (N - 1 - b) / (N - 1));
  } else {
    const SCALE = modeOf(modeName), root = foldRoot(ROOT_HZ);
    for (let b = 0; b < N; b++) {
      const k = N - 1 - b, step = Math.round(k / N * (SCALE.length * 6));
      out[b] = root * Math.pow(2, Math.floor(step / SCALE.length) + SCALE[step % SCALE.length] / 12);
    }
  }
  BANDS = N;
  return out;
}

/* ---- reduce the field to what the band bank eats -------------------------
   Identical to the node sonifier, including the part that matters: figure is
   contrast in EITHER direction. Counting only ink above the frame's modal
   level makes every dark picture silent — when the room is level 7 and the
   window is a paper hole, the composition is carried by the hole. */
let AMP = new Float32Array(56 * 64 * 3);
const COLS = 64;
const XB = new Int32Array(COLS + 1);
for (let c = 0; c <= COLS; c++) XB[c] = Math.floor(c / COLS * FW);
const HIST = new Uint32Array(9);
let YB = null;
function rebuildBins() {
  YB = new Int32Array(BANDS + 1);
  for (let b = 0; b <= BANDS; b++) YB[b] = Math.floor(b / BANDS * FH);
  AMP = new Float32Array(BANDS * COLS * 3);
  RET = new Float32Array(BANDS * FW);
  SEEN = new Uint8Array(BANDS * FW);
  retPeak = 1e-6;
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
        if (MODE === "icon") { sf += lv / 7; continue; }   // a transmission, not a reading
        if (d === 0) { if (bg > 0) sg += 0.30; }
        else {
          const head = d > 0 ? Math.max(1, 7 - bg) : Math.max(1, bg);
          const con = Math.abs(d) / head;
          if (con >= 0.28) sf += con; else sg += con * 0.7;
        }
      }
      const i = b * COLS + c;
      AMP[i] = n ? sf / n : 0;
      AMP[N + i] = n ? sg / n : 0;
      AMP[2 * N + i] = n ? a8 / n : 0;
    }
  }
  return bg;
}

/* ---- the return: what is actually coming out of the speakers -------------
   An analyser on the master, read once a frame and written into the column the
   head is currently at — so the picture does not scroll past like a
   spectrogram, it ACCUMULATES INTO THE SAME GEOMETRY AS THE DRAWING, one
   column at a time, and after a pass you have a complete picture of what was
   heard laid over exactly where you drew it. Then the two can be correlated,
   which is the whole reason this page exists. */
let RET = new Float32Array(56 * FW), SEEN = new Uint8Array(56 * FW), retPeak = 1e-6;
let analyser = null, SPEC = null;
/* how far behind the loudspeaker the analyser's reading is, in seconds —
   half its window, plus what the smoothing constant adds */
let LAG = 0.09;
function rebuildBinRanges(sr) {
  binLo = new Int32Array(BANDS); binHi = new Int32Array(BANDS);
  const n = analyser.fftSize;
  for (let b = 0; b < BANDS; b++) {
    /* half a row's spacing either side; a peak inside that window is this
       row's, and every other bin's leakage is simply never read */
    const lo = b > 0 ? Math.sqrt(hz[b] * hz[b - 1]) : hz[b] * 0.97;
    const hi = b < BANDS - 1 ? Math.sqrt(hz[b] * hz[b + 1]) : hz[b] * 1.03;
    binLo[b] = clamp(Math.floor(Math.min(lo, hi) * n / sr), 1, n / 2 - 1);
    binHi[b] = clamp(Math.ceil(Math.max(lo, hi) * n / sr), binLo[b], n / 2 - 1);
  }
}
/* THE WINDOW IS SET BY THE ROWS, NOT BY THE COLUMN — AND THAT IS THE OPPOSITE
   OF WHAT THE OFFLINE PIPELINE FOUND.

   Offline, sizing the transform to the column was decisively right: across
   4096 / 8192 / 16384 on a 70-second transmission the fidelity ran
   0.534 / 0.755 / 0.830 and the winner landed exactly on the column. So this
   page was built to compute its window from the breath. Fidelity fell from
   0.604 to 0.277, and the sweep says why:

     fft   1024   23ms   0.287        fft   8192  186ms   0.718
     fft   2048   46ms   0.360        fft  16384  372ms   0.753
     fft   4096   93ms   0.528        fft  32768  743ms   0.614

   at a breath of 7.8s, whose column is 41ms. The optimum is NINE TIMES the
   column — and it is exactly what the rows require: 144 of them across five
   octaves puts the tightest pair 7.35 Hz apart at the bottom, and separating
   7.35 Hz needs about 370 milliseconds.

   The offline law was not wrong, it was a coincidence: a 365ms column was long
   enough to satisfy both constraints at once, so the two answers agreed and
   only one of them was the reason. At a musical breath the constraints fight,
   and resolution wins — unresolved rows are information that never arrives,
   while horizontal smear is a known shift that has already been compensated
   for. Past the point where smear overtakes it, the curve turns over: that is
   the 0.614 at 743ms, and it is where the cap comes from. */
function fitWindow() {
  if (!analyser || !ctx || !hz) return;
  let gap = Infinity;
  for (let b = 1; b < BANDS; b++) { const d = Math.abs(hz[b] - hz[b - 1]); if (d > 0 && d < gap) gap = d; }
  let want = clamp(1 << Math.round(Math.log2(2.7 / gap * ctx.sampleRate)), 1024, 16384);
  if (window.__forceFft) want = window.__forceFft;
  if (want === analyser.fftSize) return;
  analyser.fftSize = want;
  SPEC = new Float32Array(analyser.frequencyBinCount);
  LAG = analyser.fftSize / (2 * ctx.sampleRate) + 0.012;
  rebuildBinRanges(ctx.sampleRate);
}

/* Ride the master so the bank stops squaring. There is no future to
   peak-normalise against in a live signal, so the level is walked toward a
   target instead — slowly, because a gain that moves fast is a gain you can
   hear, and the point is to change the level without changing the piece. */
let ride = 1;
function rideMaster() {
  if (!node) return;
  const want = lvl > 0.75 ? ride * 0.92 : lvl < 0.22 ? ride * 1.04 : ride;
  const next = clamp(want, 0.05, 8);
  if (Math.abs(next - ride) > 1e-4) { ride = next; node.port.postMessage({ gain: ride / Math.sqrt(BANDS) }); }
}

function readReturn(col) {
  if (!analyser || !SPEC) return;
  analyser.getFloatFrequencyData(SPEC);
  for (let b = 0; b < BANDS; b++) {
    let m = -Infinity;
    for (let k = binLo[b]; k <= binHi[b]; k++) if (SPEC[k] > m) m = SPEC[k];
    const a = m === -Infinity ? 0 : Math.pow(10, m / 20);
    if (a > retPeak) retPeak = a;
    const i = b * FW + col;
    RET[i] = SEEN[i] ? RET[i] * 0.55 + a * 0.45 : a;   // one column, lightly held
    SEEN[i] = 1;
  }
  retPeak *= 0.99995;                                   // let a loud moment fade
}

/* the number that decides whether the mapping is a translation or a decoration */
function fidelity() {
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let b = 0; b < BANDS; b++) {
    const y0 = YB[b], y1 = Math.max(y0 + 1, YB[b + 1]);
    for (let x = 0; x < FW; x++) {
      const i = b * FW + x;
      if (!SEEN[i]) continue;
      let s = 0, c = 0;
      for (let y = y0; y < y1; y++) { const v = FIELD[y * FW + x]; s += v > 8.5 ? 7 : Math.min(7, Math.round(v)); c++; }
      const A = c ? s / c / 7 : 0, B = clamp(RET[i] / retPeak, 0, 1);
      n++; sa += A; sb += B; saa += A * A; sbb += B * B; sab += A * B;
    }
  }
  if (n < 200) return null;
  const den = Math.sqrt(Math.max(1e-12, (n * saa - sa * sa) * (n * sbb - sb * sb)));
  return (n * sab - sa * sb) / den;
}

/* ---- painters ------------------------------------------------------------ */
const paintSketch = makePainter($("sketch"), FW, FH, 4);
const paintHeard = makePainter($("heard"), FW, FH, 4);
const DISP = new Float32Array(FW * FH), HDISP = new Float32Array(FW * FH);
function showSketch(head) {
  for (let i = 0; i < FIELD.length; i++) DISP[i] = inkToDisplay(FIELD[i]);
  paintSketch(DISP, head);
}
function showHeard(head) {
  for (let y = 0; y < FH; y++) {
    const b = Math.min(BANDS - 1, Math.floor(y / FH * BANDS));
    for (let x = 0; x < FW; x++) {
      const i = b * FW + x;
      HDISP[y * FW + x] = SEEN[i] ? energyToDisplay(RET[i] / retPeak) : energyToDisplay(0);
    }
  }
  paintHeard(HDISP, head);
}

/* ---- drawing ------------------------------------------------------------- */
let level = 7, brush = 4, painting = false;
function cellAt(e) {
  const r = $("sketch").getBoundingClientRect();
  return [Math.floor((e.clientX - r.left) / r.width * FW), Math.floor((e.clientY - r.top) / r.height * FH)];
}
function stamp(cx0, cy0) {
  const r = brush, rr = r * r;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > rr) continue;
    const x = cx0 + dx, y = cy0 + dy;
    if (x < 0 || y < 0 || x >= FW || y >= FH) continue;
    FIELD[y * FW + x] = level;
  }
}
function pushUndo() { UNDO.push(Float32Array.from(FIELD)); if (UNDO.length > 24) UNDO.shift(); }
let lastCell = null;
function drawTo(e) {
  const [x, y] = cellAt(e);
  if (lastCell) {                                    // interpolate, or a fast hand draws dots
    const [px, py] = lastCell, n = Math.max(Math.abs(x - px), Math.abs(y - py));
    for (let k = 1; k <= n; k++) stamp(Math.round(px + (x - px) * k / n), Math.round(py + (y - py) * k / n));
  } else stamp(x, y);
  lastCell = [x, y];
}
const sc = $("sketch");
sc.addEventListener("pointerdown", (e) => {
  e.preventDefault(); pushUndo(); painting = true; lastCell = null;
  sc.setPointerCapture?.(e.pointerId); drawTo(e);
});
sc.addEventListener("pointermove", (e) => { if (painting) { e.preventDefault(); drawTo(e); } });
for (const ev of ["pointerup", "pointercancel", "pointerleave"])
  sc.addEventListener(ev, () => { painting = false; lastCell = null; });

/* ---- transport and law --------------------------------------------------- */
let t = 0, playing = false, scanPh = 0, lastRaf = 0, lvl = 0;
let ctx = null, node = null, gainN = null;
let ENAME = "malhun", MNAME = "bayati", ROOT_HZ = 41.203, LOOP = 60;

async function audio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.audioWorklet.addModule("radio-worklet.js");
  gainN = ctx.createGain(); gainN.gain.value = 0.9;
  analyser = ctx.createAnalyser();
  analyser.fftSize = 8192; analyser.smoothingTimeConstant = 0.35;
  SPEC = new Float32Array(analyser.frequencyBinCount);
  LAG = analyser.fftSize / (2 * ctx.sampleRate) + 0.012;
  gainN.connect(ctx.destination); gainN.connect(analyser);
  buildNode();
}
function buildNode() {
  if (!ctx) return;
  if (node) { try { node.disconnect(); } catch (_) {} }
  hz = bandTable(ENAME, MNAME);
  rebuildBins();
  node = new AudioWorkletNode(ctx, "bandbank", {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
    processorOptions: { bands: BANDS, cols: COLS },
  });
  node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
  node.port.postMessage({ hz });
  ride = 1; node.port.postMessage({ gain: ride / Math.sqrt(BANDS) });
  node.connect(gainN);
  rebuildBinRanges(ctx.sampleRate);
}
function retune() {
  hz = bandTable(ENAME, MNAME);
  rebuildBins();
  if (node) { node.port.postMessage({ hz }); node.port.postMessage({ reset: 1 }); }
  if (analyser) rebuildBinRanges(ctx.sampleRate);
}

const bar = (v, n = 14) => "▮".repeat(Math.round(clamp(v, 0, 1) * n)).padEnd(n, "▯");

function frame(now) {
  requestAnimationFrame(frame);
  const dt = lastRaf ? Math.min(0.1, (now - lastRaf) / 1000) : 0;
  lastRaf = now;
  if (playing) { t += dt; if (t >= LOOP) t -= LOOP; }

  const E = engineOf(ENAME), u = clamp(t / LOOP, 0, 1);
  const sweep = Math.max(0.4, E.sweep(u));
  if (playing) { scanPh += dt / (2 * sweep); if (scanPh >= 1) scanPh -= 1; }
  const scan = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;
  const iconic = MODE === "icon";
  const gate = iconic ? 1 : clamp(E.gate(u, scan), 0, 1);
  const gnd = iconic ? 1 : clamp(E.ground(u), 0, 1);
  const atk = iconic ? 1 : E.attack(u);

  const bg = reduce(FIELD);
  if (node && playing)
    node.port.postMessage({ amp: AMP.slice(), scan, gate, ground: gnd, attack: atk, dt: Math.max(1 / 120, dt) });

  const head = Math.round(scan * (FW - 1));
  /* THE ANALYSER REPORTS THE PAST, SO THE RETURN IS WRITTEN INTO THE PAST'S
     COLUMN. Its window is centred about ninety milliseconds back, and at forty
     columns a second the head has moved four columns on by the time the reading
     arrives. Written into the head's current column the picture comes out
     sheared — and on a triangle scan it shears one way going out and the other
     coming back, so the error doubles into a smear rather than an offset. The
     scan is a known function of the clock, so where the head WAS is simply
     computed: run the phase backwards by the latency and take the triangle
     there. Measured against a traced frame, this is the difference between a
     return that correlates at about .35 and one that correlates at .75. */
  if (playing) { fitWindow(); rideMaster(); }
  const lagPh = ((scanPh - LAG / (2 * sweep)) % 1 + 1) % 1;
  const lagScan = lagPh < 0.5 ? lagPh * 2 : 2 - lagPh * 2;
  if (playing) readReturn(Math.round(lagScan * (FW - 1)));
  showSketch(head);
  showHeard(head);

  const f = fidelity();
  $("mSweep").textContent = `${sweep.toFixed(1)}s ${bar(1 - clamp((sweep - 2) / 15, 0, 1))}`;
  $("mGate").textContent = `${gate.toFixed(2)} ${bar(gate)}`;
  $("mGround").textContent = `${gnd.toFixed(2)} ${bar(gnd)}`;
  $("mAttack").textContent = `${atk.toFixed(2)} ${bar((atk - 1.6) / 2)}`;
  $("mLevel").textContent = `${lvl.toFixed(3)} ${bar(lvl * 1.15)}`;
  $("mField").textContent = `ground ${bg} · ${BANDS} bands`;
  $("mFft").textContent = analyser
    ? `${analyser.fftSize} · ${(analyser.fftSize / ctx.sampleRate * 1000).toFixed(0)}ms`
    : "—";
  $("mFid").textContent = f === null ? "listening…" : f.toFixed(3);
  $("mFid").className = f === null ? "" : f > 0.6 ? "good" : f > 0.3 ? "" : "warn";
  $("clock").textContent = `${t.toFixed(1)}s / ${LOOP}s`;
  window.__sketchradio = { t, u, scan, lagScan, LAG, ride, fft: analyser?.fftSize, sweep, gate, ground: gnd, attack: atk, lvl, bg, fidelity: f, mode: MODE, engine: ENAME, bands: BANDS, playing };
}

/* ---- wiring -------------------------------------------------------------- */
$("engine").innerHTML = `<option value="">— none (default law) —</option>`
  + Object.entries(ENGINES).map(([k, e]) => `<option value="${k}">${k} · ${e.tradition}</option>`).join("");
$("engine").value = ENAME;
$("engine").onchange = () => { ENAME = $("engine").value; retune(); };
$("mode").onchange = () => { MNAME = $("mode").value; retune(); };
$("root").onchange = () => { ROOT_HZ = +$("root").value; retune(); };
$("loop").onchange = () => { LOOP = clamp(+$("loop").value || 60, 8, 600); $("loop").value = LOOP; };
$("bank").onchange = () => {
  MODE = $("bank").value;
  document.body.classList.toggle("iconMode", MODE === "icon");
  hz = bandTable(ENAME, MNAME);
  rebuildBins();
  $("modeTag").textContent = `${BANDS} bands`;
  buildNode();
};

$("levels").innerHTML = Array.from({ length: 9 }, (_, l) =>
  `<button data-l="${l}" class="${l === 7 ? "on" : ""}" style="background:${
    l === 8 ? "#5aa7ff" : `rgb(${[0, 1, 2, 3, 4, 5, 6, 7].map(() => 0)})`}">${l === 8 ? "A" : l}</button>`).join("");
for (const b of $("levels").querySelectorAll("button")) {
  if (+b.dataset.l < 8) {
    const v = inkToDisplay(+b.dataset.l), c = 255 * v;
    b.style.background = `rgb(${Math.round(c * 0.95)},${Math.round(c * 0.55)},${Math.round(c * 0.2)})`;
    b.style.color = v > 0.5 ? "#1a0a10" : "#f6e7c8";
  }
  b.onclick = () => {
    level = +b.dataset.l;
    for (const o of $("levels").querySelectorAll("button")) o.classList.toggle("on", o === b);
  };
}
$("brush").oninput = (e) => { brush = +e.target.value; $("brushN").textContent = brush * 2 + 1; };

$("play").onclick = async () => {
  await audio();
  if (ctx.state === "suspended") await ctx.resume();
  playing = !playing;
  $("play").textContent = playing ? "◼ STOP" : "▶ PLAY";
  if (!playing && node) node.port.postMessage({ stop: 1 });
};
$("clear").onclick = () => { pushUndo(); FIELD.fill(0); };
$("undo").onclick = () => { const p = UNDO.pop(); if (p) FIELD.set(p); };
$("invert").onclick = () => { pushUndo(); for (let i = 0; i < FIELD.length; i++) if (FIELD[i] <= 8.5) FIELD[i] = 7 - Math.min(7, Math.round(FIELD[i])); };

/* THE RETURN PATH, AND THE ONE BUTTON THAT MAKES THIS A LOOP.
   Sketchsong has this button — SPECTRUM→SKETCH — and it copies pixels of a
   picture OF the sound into the drawing. This one copies what was actually
   heard: the analyser's own reading, quantised back to eight levels, in the
   same geometry it was drawn in. Press it a few times in a row and you are
   listening to a channel talk to itself, which is a real thing to be able to
   do and is the closest this gets to Lucier. */
$("heardToSketch").onclick = () => {
  pushUndo();
  for (let y = 0; y < FH; y++) {
    const b = Math.min(BANDS - 1, Math.floor(y / FH * BANDS));
    for (let x = 0; x < FW; x++) {
      const i = b * FW + x;
      FIELD[y * FW + x] = SEEN[i] ? Math.round(clamp(RET[i] / retPeak, 0, 1) * 7) : 0;
    }
  }
};

$("film").innerHTML = FILMS.map((f, i) => `<option value="${i}">${f.world.n} ${f.world.title}</option>`).join("");
$("trace").onclick = () => {
  const f = FILMS[+$("film").value];
  if (!f) return;
  pushUndo();
  FIELD.set(f.rt.renderField(clamp(+$("at").value, 0, f.rt.total - 0.01)));
  /* a film carries its own law; adopt it, so tracing a station tunes to it too */
  const sc2 = f.world.score || {};
  ENAME = sc2.engine || ""; MNAME = sc2.mode || "aeolian";
  ROOT_HZ = f.world.drone?.base || 41.203;
  LOOP = Math.round(f.rt.total);
  $("engine").value = ENAME; $("mode").value = MNAME; $("root").value = String(ROOT_HZ); $("loop").value = LOOP;
  retune();
};

addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  if (e.key === "z" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $("undo").click(); }
  if (e.key >= "0" && e.key <= "7") $("levels").querySelector(`[data-l="${e.key}"]`)?.click();
});

/* THE BANK EXISTS BEFORE THE AUDIO DOES. Building the band table only when the
   AudioContext is created means the very first frame reduces the field against
   a null bin table — and the page throws sixty times a second while looking
   completely fine, because a canvas that never repaints looks exactly like a
   canvas that has nothing on it yet. Drawing does not depend on sound, so
   neither should the geometry that describes it. */
hz = bandTable(ENAME, MNAME);
rebuildBins();

/* something on the canvas at load, so the first thing anyone does is press play
   rather than face an empty grid and wonder what the page is */
FIELD.set(FILMS.find(f => f.world.n === "13")?.rt.renderField(40) || FIELD);
$("loop").value = LOOP;
$("modeTag").textContent = `${BANDS} bands`;
requestAnimationFrame(frame);
