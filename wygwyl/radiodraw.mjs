/* ============================================================================
   radiodraw.mjs — A COLLAGE OF PATCHES THAT IS A PICTURE AND A SOUND AT ONCE.

   One field. 192 columns of time, 144 rows of pitch, eight levels of ink. Every
   layer in the scene is a PATCH of that same material, and there is no
   separate audio document anywhere — the picture IS the score.

   THE ONE MAPPING THAT MAKES THE WHOLE THING WORK

   Analysis and playback share a single row-to-frequency law:

       row r  <->  LO * (HI/LO)^((ROWS-1-r)/(ROWS-1))

   A song is dropped in, transformed, and quantised to eight levels through
   that law; the read head crosses the field and resynthesises through the same
   law. So a patch laid down where it was analysed plays back as itself, and
   every collage move is a signal operation you can see:

       move it UP        it is higher
       move it RIGHT     it happens later
       stretch it WIDE   it is slower
       stretch it TALL   its intervals open out
       lower its level   it is quieter
       cut a hole in it  that band goes silent

   Nothing here is a metaphor for that. Those are the same thing said twice.

   PATCHES COME FROM ANYWHERE AND STOP REMEMBERING WHERE

   A voice, a song, a slice of the suite's own record, a frame of any of the
   fourteen films, or a rectangle you paint by hand. Once it is in the field it
   is eight-level ink like everything else, and it will be sounded whether it
   began as a picture or as a sound. Drop a shed roof into the top of the frame
   and it is a chord; drop a saxophone into the water and it is weather.

   BLEND MODES ARE THE COLLAGE VERBS: over, max, add, cut. `cut` is the one
   worth having — it removes a region from everything beneath it, which on this
   field means notching a band out of the sound.
   ========================================================================= */
import { makeRuntime } from "./halfworld.mjs";
import { makePainter, energyToDisplay } from "./deep/paint.mjs";

const FW = 192, FH = 144;
const LO = 140, HI = 7168;                  // the canonical range, 5.68 octaves
const rowHz = (r) => LO * Math.pow(HI / LO, (FH - 1 - r) / (FH - 1));
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ---- the film frames, as a source of patches ----------------------------- */
const SLUGS = ["01-out-of-life", "02-flashing-lights", "03-how-to-break-off-an-engagement",
  "04-nevermore", "05-bloodlines", "06-resurrecting-atlantis", "07-dj-turn-me-up",
  "08-newly-single", "09-yet-heard", "10-magic-ride", "11-new-day", "12-reunion",
  "13-how-to-win-my-heart", "14-hot-minute"];
const FILMS = [];
for (const slug of SLUGS) {
  try {
    const world = (await import(`./worlds/${slug}.mjs`)).default;
    FILMS.push({ slug, world, rt: makeRuntime(world) });
  } catch (_) {}
}

/* ---- the scene ------------------------------------------------------------ */
let LOOP = 12;                                // seconds the 192 columns span
let PATCHES = [], sel = null, nextId = 1;
const FIELD = new Float32Array(FW * FH);

function composite() {
  FIELD.fill(0);
  for (const p of PATCHES) {
    if (!p.on) continue;
    const x0 = Math.round(p.x), y0 = Math.round(p.y);
    const sw = Math.max(1, Math.round(p.sw)), sh = Math.max(1, Math.round(p.sh));
    for (let dy = 0; dy < sh; dy++) {
      const fy = y0 + dy; if (fy < 0 || fy >= FH) continue;
      const py = Math.min(p.h - 1, Math.floor(dy / sh * p.h));
      for (let dx = 0; dx < sw; dx++) {
        const fx = x0 + dx; if (fx < 0 || fx >= FW) continue;
        const px = Math.min(p.w - 1, Math.floor(dx / sw * p.w));
        const raw = p.data[py * p.w + px];
        if (!raw) { if (p.blend === "cut") continue; else continue; }
        const v = clamp(Math.round(raw * p.gain), 0, 7);
        const i = fy * FW + fx, cur = FIELD[i];
        FIELD[i] = p.blend === "over" ? v
          : p.blend === "max" ? Math.max(cur, v)
          : p.blend === "add" ? Math.min(7, cur + v)
          : 0;                                    // cut
      }
    }
  }
  return FIELD;
}

/* ---- audio in, patch out --------------------------------------------------
   The transform is a plain radix-2 FFT and the estimator is a PEAK inside each
   row's band rather than a sum: rows are spaced logarithmically, so a row near
   7 kHz owns forty times as many bins as one near 140 Hz, and adding them up
   fills the top of every patch with integrated noise while the bottom arrives
   clean — a gradient that is purely an artefact of the arithmetic. */
const SR = 22050, NFFT = 4096;
const re = new Float64Array(NFFT), im = new Float64Array(NFFT);
const rev = new Uint32Array(NFFT);
{
  const bits = Math.log2(NFFT);
  for (let i = 0; i < NFFT; i++) { let r = 0; for (let k = 0; k < bits; k++) r = (r << 1) | ((i >> k) & 1); rev[i] = r; }
}
const CS = new Float64Array(NFFT / 2), SN = new Float64Array(NFFT / 2);
for (let i = 0; i < NFFT / 2; i++) { CS[i] = Math.cos(-2 * Math.PI * i / NFFT); SN[i] = Math.sin(-2 * Math.PI * i / NFFT); }
const HANN = new Float64Array(NFFT);
for (let i = 0; i < NFFT; i++) HANN[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / NFFT);
function fft() {
  for (let i = 0; i < NFFT; i++) if (rev[i] > i) {
    let t = re[i]; re[i] = re[rev[i]]; re[rev[i]] = t;
    t = im[i]; im[i] = im[rev[i]]; im[rev[i]] = t;
  }
  for (let size = 2; size <= NFFT; size <<= 1) {
    const half = size >> 1, step = NFFT / size;
    for (let i = 0; i < NFFT; i += size) for (let j = 0; j < half; j++) {
      const c = CS[j * step], s = SN[j * step], a = i + j, d = a + half;
      const tr = re[d] * c - im[d] * s, ti = re[d] * s + im[d] * c;
      re[d] = re[a] - tr; im[d] = im[a] - ti; re[a] += tr; im[a] += ti;
    }
  }
}
/* which bins belong to which row, computed once */
const BLO = new Int32Array(FH), BHI = new Int32Array(FH);
for (let r = 0; r < FH; r++) {
  const f = rowHz(r);
  const a = r < FH - 1 ? Math.sqrt(f * rowHz(r + 1)) : f * 0.985;
  const b = r > 0 ? Math.sqrt(f * rowHz(r - 1)) : f * 1.015;
  BLO[r] = clamp(Math.floor(Math.min(a, b) * NFFT / SR), 1, NFFT / 2 - 1);
  BHI[r] = clamp(Math.ceil(Math.max(a, b) * NFFT / SR), BLO[r], NFFT / 2 - 1);
}
async function audioToPatch(arrayBuf, name, from = 0, len = 0) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const buf = await new OAC(1, 1024, SR).decodeAudioData(arrayBuf);
  const all = buf.getChannelData(0);
  const a0 = clamp(Math.floor(from * SR), 0, all.length - 1);
  const a1 = len > 0 ? clamp(a0 + Math.floor(len * SR), a0 + SR / 4, all.length) : all.length;
  const d = all.subarray(a0, a1), dur = (a1 - a0) / SR;
  /* the patch's width is its REAL duration on the field's clock, so a four
     second sample in a twelve second loop is sixty-four columns wide and
     nothing has to be told what tempo anything is */
  const cols = clamp(Math.round(dur / LOOP * FW), 4, FW * 4);
  const data = new Uint8Array(cols * FH);
  const hop = d.length / cols;
  let peak = 1e-9;
  const mag = new Float32Array(cols * FH);
  for (let c = 0; c < cols; c++) {
    const s0 = Math.round(c * hop + hop / 2 - NFFT / 2);
    re.fill(0); im.fill(0);
    for (let i = 0; i < NFFT; i++) { const j = s0 + i; if (j >= 0 && j < d.length) re[i] = d[j] * HANN[i]; }
    fft();
    for (let r = 0; r < FH; r++) {
      let m = 0;
      for (let k = BLO[r]; k <= BHI[r]; k++) { const v = re[k] * re[k] + im[k] * im[k]; if (v > m) m = v; }
      const v = Math.sqrt(m);
      mag[r * cols + c] = v; if (v > peak) peak = v;
    }
  }
  /* a percentile, not the peak: one bin of a snare should not set the exposure
     for a whole patch */
  const sorted = Float32Array.from(mag).sort();
  const P = sorted[Math.floor(sorted.length * 0.995)] || peak;
  for (let i = 0; i < mag.length; i++) {
    const v = Math.pow(clamp(mag[i] / P, 0, 1), 0.55);      // lift the quiet parts into ink
    data[i] = v < 0.06 ? 0 : clamp(Math.round(v * 7), 1, 7);
  }
  return addPatch({
    kind: "audio", name: name.replace(/\.[^.]+$/, "").slice(0, 22),
    w: cols, h: FH, data,
    x: 0, y: 0, sw: Math.min(FW, cols), sh: FH, blend: "max", gain: 1,
    note: `${dur.toFixed(1)}s`,
  });
}
function frameToPatch(i, t) {
  const f = FILMS[i]; if (!f) return null;
  const g = f.rt.renderField(clamp(t, 0, f.rt.total - 0.01));
  const data = new Uint8Array(FW * FH);
  for (let q = 0; q < FW * FH; q++) { const v = g[q]; data[q] = v > 8.5 ? 7 : clamp(Math.round(v), 0, 7); }
  return addPatch({
    kind: "frame", name: `${f.world.n} ${f.world.title}`.slice(0, 22),
    w: FW, h: FH, data, x: 0, y: 0, sw: FW, sh: FH, blend: "max", gain: 1, note: `${t | 0}s`,
  });
}
function blankPatch() {
  return addPatch({
    kind: "paint", name: "painted", w: 96, h: 72, data: new Uint8Array(96 * 72),
    x: 48, y: 36, sw: 96, sh: 72, blend: "max", gain: 1, note: "paint on it",
  });
}
function addPatch(p) {
  p.id = nextId++; p.on = true;
  PATCHES.push(p); sel = p; renderLayers(); return p;
}

/* ---- sound out ------------------------------------------------------------ */
let ctx = null, node = null, gainN = null, lvl = 0, ride = 1, playing = false;
const COLS = 96, BANDS = FH;
const AMP = new Float32Array(BANDS * COLS * 3);
const XB = new Int32Array(COLS + 1);
for (let c = 0; c <= COLS; c++) XB[c] = Math.floor(c / COLS * FW);
function reduce(g) {
  const N = BANDS * COLS;
  for (let c = 0; c < COLS; c++) {
    const x0 = XB[c], x1 = Math.max(x0 + 1, XB[c + 1]);
    for (let b = 0; b < BANDS; b++) {
      let s = 0, n = 0;
      for (let x = x0; x < x1; x++) { s += g[b * FW + x] / 7; n++; }
      AMP[b * COLS + c] = n ? s / n : 0;
    }
  }
}
async function boot() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.audioWorklet.addModule("radio-worklet.js");
  gainN = ctx.createGain(); gainN.gain.value = 0.9; gainN.connect(ctx.destination);
  node = new AudioWorkletNode(ctx, "bandbank", {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
    processorOptions: { bands: BANDS, cols: COLS },
  });
  node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
  const hz = new Float32Array(BANDS);
  for (let b = 0; b < BANDS; b++) hz[b] = rowHz(b);     // the same law, backwards
  node.port.postMessage({ hz });
  node.port.postMessage({ gain: 1 / Math.sqrt(BANDS) });
  node.connect(gainN);
}

/* ---- the surface ---------------------------------------------------------- */
const CELL = 5;
const paint = makePainter($("scene"), FW, FH, CELL);
const DISP = new Float32Array(FW * FH);
const ov = $("overlay"), ox = ov.getContext("2d");
ov.width = FW * CELL; ov.height = FH * CELL;

function drawOverlay(head) {
  ox.clearRect(0, 0, ov.width, ov.height);
  for (const p of PATCHES) {
    const on = p === sel;
    ox.strokeStyle = on ? "#e0532c" : "rgba(246,231,200,.30)";
    ox.lineWidth = on ? 2 : 1;
    ox.setLineDash(on ? [] : [3, 4]);
    ox.strokeRect(p.x * CELL, p.y * CELL, p.sw * CELL, p.sh * CELL);
    if (on) {
      ox.setLineDash([]);
      ox.fillStyle = "#e0532c";
      ox.fillRect((p.x + p.sw) * CELL - 7, (p.y + p.sh) * CELL - 7, 9, 9);   // resize
      ox.font = "11px ui-monospace,monospace";
      ox.fillText(p.name, p.x * CELL + 2, p.y * CELL - 4);
    }
  }
  ox.setLineDash([]);
  if (head >= 0) { ox.fillStyle = "#7fd67f"; ox.fillRect(head * CELL, 0, 2, ov.height); }
}

let t = 0, lastRaf = 0, mode = "move";
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = lastRaf ? Math.min(0.08, (ts - lastRaf) / 1000) : 0;
  lastRaf = ts;
  if (playing) { t += dt; if (t >= LOOP) t -= LOOP; }
  const u = t / LOOP;
  /* A SAWTOOTH, NOT A TRIANGLE. A mirrored head plays every collage forwards
     and then backwards, which is charming once and wrong for a sample of a
     song. The wrap is faded rather than cut, which is the only reason a
     sawtooth is usable at all. */
  const scan = u;
  const g = composite();
  reduce(g);
  /* SPECTROGRAM POLARITY, NOT PAPER. On the other pages ink is dark on a bright
     field, which is what a beflix frame is. Here the field IS a spectrum, and
     an empty region of a spectrum is SILENCE — printed as paper it came out as
     a blinding slab of yellow across everything nobody had put a patch on yet.
     Nothing is dark, energy is bright, and a film frame dropped in reads as the
     spectrogram it has become, which is the entire point of the page. */
  for (let i = 0; i < g.length; i++) DISP[i] = energyToDisplay(1 - g[i] / 7);
  paint(DISP, -1);
  drawOverlay(playing ? Math.round(scan * (FW - 1)) : -1);

  if (node && playing) {
    const edge = Math.min(1, Math.min(u, 1 - u) / 0.02);        // 2% fade at the seam
    node.port.postMessage({ amp: AMP.slice(), scan, gate: edge, ground: 0, attack: 1, dt: Math.max(1 / 120, dt) });
    const want = lvl > 0.75 ? ride * 0.93 : lvl < 0.22 ? ride * 1.04 : ride;
    const nx = clamp(want, 0.05, 8);
    if (Math.abs(nx - ride) > 1e-4) { ride = nx; node.port.postMessage({ gain: nx / Math.sqrt(BANDS) }); }
  }
  $("clock").textContent = `${t.toFixed(1)} / ${LOOP}s`;
  $("out").textContent = `${lvl.toFixed(3)} ` + "▮".repeat(Math.round(clamp(lvl * 1.15, 0, 1) * 12)).padEnd(12, "▯");
  window.__radiodraw = { t, playing, patches: PATCHES.length, sel: sel?.id ?? null, lvl,
    layers: PATCHES.map(p => ({ id: p.id, kind: p.kind, name: p.name, x: p.x | 0, y: p.y | 0, w: p.sw | 0, h: p.sh | 0, blend: p.blend, on: p.on })) };
}

/* ---- direct manipulation --------------------------------------------------
   Patches are grabbed, not configured. Body drags, corner resizes, and in
   PAINT mode the pointer writes into the selected patch's own bitmap so a
   hand-made mark is the same kind of object as a sampled one. */
let drag = null;
const at = (e) => {
  const r = ov.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * FW, (e.clientY - r.top) / r.height * FH];
};
ov.addEventListener("pointerdown", (e) => {
  e.preventDefault(); ov.setPointerCapture?.(e.pointerId);
  const [x, y] = at(e);
  if (mode === "paint" && sel) { paintInto(x, y); drag = { kind: "paint" }; return; }
  if (sel && x > sel.x + sel.sw - 2.2 && x < sel.x + sel.sw + 1.4
          && y > sel.y + sel.sh - 2.2 && y < sel.y + sel.sh + 1.4) {
    drag = { kind: "size", p: sel, x, y, sw: sel.sw, sh: sel.sh }; return;
  }
  for (let i = PATCHES.length - 1; i >= 0; i--) {
    const p = PATCHES[i];
    if (p.on && x >= p.x && y >= p.y && x < p.x + p.sw && y < p.y + p.sh) {
      sel = p; renderLayers();
      drag = { kind: "move", p, x, y, px: p.x, py: p.y }; return;
    }
  }
  sel = null; renderLayers();
});
ov.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const [x, y] = at(e);
  if (drag.kind === "paint") return paintInto(x, y);
  const p = drag.p;
  if (drag.kind === "move") { p.x = Math.round(drag.px + (x - drag.x)); p.y = Math.round(drag.py + (y - drag.y)); }
  else { p.sw = Math.max(2, Math.round(drag.sw + (x - drag.x))); p.sh = Math.max(2, Math.round(drag.sh + (y - drag.y))); }
  syncFields();
});
for (const ev of ["pointerup", "pointercancel"]) ov.addEventListener(ev, () => { drag = null; });
function paintInto(fx, fy) {
  const p = sel; if (!p) return;
  const px = Math.floor((fx - p.x) / p.sw * p.w), py = Math.floor((fy - p.y) / p.sh * p.h);
  const r = +$("brush").value, lvlv = +$("plevel").value;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (dx * dx + dy * dy > r * r) continue;
    const X = px + dx, Y = py + dy;
    if (X >= 0 && Y >= 0 && X < p.w && Y < p.h) p.data[Y * p.w + X] = lvlv;
  }
}

/* ---- layers panel ---------------------------------------------------------- */
function thumb(p) {
  const c = document.createElement("canvas"); c.width = 52; c.height = 39;
  const x = c.getContext("2d"), im = x.createImageData(52, 39);
  for (let y = 0; y < 39; y++) for (let xx = 0; xx < 52; xx++) {
    const v = p.data[Math.min(p.h - 1, (y / 39 * p.h) | 0) * p.w + Math.min(p.w - 1, (xx / 52 * p.w) | 0)];
    const d = energyToDisplay(1 - v / 7), o = (y * 52 + xx) * 4;
    im.data[o] = 255 * d * .95; im.data[o + 1] = 255 * d * .55; im.data[o + 2] = 255 * d * .2; im.data[o + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c.toDataURL();
}
function renderLayers() {
  $("layers").innerHTML = PATCHES.length ? PATCHES.slice().reverse().map(p => `
    <div class="lay${p === sel ? " on" : ""}" data-id="${p.id}">
      <img src="${thumb(p)}" alt="">
      <div class="li"><b>${p.name}</b><i>${p.kind} · ${p.note || ""}</i></div>
      <div class="lc">
        <select data-f="blend">${["max", "over", "add", "cut"].map(b => `<option${b === p.blend ? " selected" : ""}>${b}</option>`).join("")}</select>
        <input data-f="gain" type="range" min="0.1" max="1.6" step="0.05" value="${p.gain}">
        <button data-f="on" class="${p.on ? "" : "off"}">${p.on ? "◉" : "○"}</button>
        <button data-f="up">▲</button><button data-f="kill">×</button>
      </div>
    </div>`).join("") : `<div class="empty">no patches yet — add a sound, a frame, or a blank one and paint into it</div>`;
  for (const el of $("layers").querySelectorAll(".lay")) {
    const p = PATCHES.find(q => q.id === +el.dataset.id);
    el.onclick = (e) => { if (e.target.tagName === "DIV" || e.target.tagName === "IMG" || e.target.tagName === "B") { sel = p; renderLayers(); } };
    el.querySelector("[data-f=blend]").onchange = (e) => { p.blend = e.target.value; };
    el.querySelector("[data-f=gain]").oninput = (e) => { p.gain = +e.target.value; };
    el.querySelector("[data-f=on]").onclick = () => { p.on = !p.on; renderLayers(); };
    el.querySelector("[data-f=up]").onclick = () => {
      const i = PATCHES.indexOf(p); if (i < PATCHES.length - 1) { PATCHES.splice(i, 1); PATCHES.splice(i + 1, 0, p); renderLayers(); }
    };
    el.querySelector("[data-f=kill]").onclick = () => { PATCHES = PATCHES.filter(q => q !== p); if (sel === p) sel = null; renderLayers(); };
  }
  syncFields();
}
function syncFields() {
  const p = sel;
  $("sel").textContent = p ? `${p.name} · ${p.sw | 0}x${p.sh | 0} at ${p.x | 0},${p.y | 0}` : "nothing selected";
  if (!p) return;
  $("hint").textContent = `${(p.sw / FW * LOOP).toFixed(1)}s wide · ${rowHz(clamp(p.y + p.sh, 0, FH - 1)).toFixed(0)}–${rowHz(clamp(p.y, 0, FH - 1)).toFixed(0)} Hz`;
}

/* ---- wiring ---------------------------------------------------------------- */
function state(m, c = "") { $("state").textContent = m; $("state").className = c; }
$("film").innerHTML = FILMS.map((f, i) => `<option value="${i}">${f.world.n} ${f.world.title}</option>`).join("");
$("addFrame").onclick = () => { frameToPatch(+$("film").value, +$("at").value || 0); state("frame added", "ok"); };
$("addBlank").onclick = () => { blankPatch(); mode = "paint"; syncMode(); state("painting into the new patch", "ok"); };
$("file").onchange = async (e) => {
  const f = e.target.files?.[0]; if (!f) return;
  state(`analysing ${f.name}`);
  try { await audioToPatch(await f.arrayBuffer(), f.name); state(`${f.name} is a patch now`, "ok"); }
  catch (err) { state(err.message, "warn"); }
  e.target.value = "";
};
$("addAudio").onclick = () => $("file").click();
$("addRecord").onclick = async () => {
  state("slicing the record");
  try {
    const b = await fetch("footage/unified-drones.mp3").then(r => r.arrayBuffer());
    await audioToPatch(b, `record ${(+$("rat").value | 0)}s`, +$("rat").value || 0, +$("rlen").value || 6);
    state("the record is a patch now", "ok");
  } catch (e) { state("could not read the record", "warn"); }
};
$("play").onclick = async () => {
  await boot(); if (ctx.state === "suspended") await ctx.resume();
  playing = !playing; $("play").textContent = playing ? "◼ STOP" : "▶ PLAY";
  if (!playing && node) node.port.postMessage({ stop: 1 });
};
$("loop").onchange = () => { LOOP = clamp(+$("loop").value || 12, 2, 120); $("loop").value = LOOP; syncFields(); };
function syncMode() {
  for (const b of ["move", "paint"]) $("m" + b).classList.toggle("on", mode === b);
  $("paintbits").style.display = mode === "paint" ? "" : "none";
}
$("mmove").onclick = () => { mode = "move"; syncMode(); };
$("mpaint").onclick = () => { mode = "paint"; syncMode(); };
$("clear").onclick = () => { PATCHES = []; sel = null; renderLayers(); };
addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  if (e.key === "Backspace" && sel) { PATCHES = PATCHES.filter(q => q !== sel); sel = null; renderLayers(); }
  if (e.key === "m") $("mmove").click();
  if (e.key === "p") $("mpaint").click();
});

/* something in the field on arrival, so the first act is to move a thing */
frameToPatch(12, 40);
const sky = PATCHES[0]; sky.sh = 78; sky.blend = "max";
renderLayers(); syncMode();
state("add a sound, then drag it into the picture", "");
requestAnimationFrame(frame);
