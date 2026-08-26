/* ============================================================================
   radio.mjs — FOURTEEN STATIONS, EACH ONE A FILM PLAYING ITSELF.

   There is no audio file here and that is the whole design. A recording would
   have to be fetched, would drift against the picture, and would be a
   PERFORMANCE of the idea rather than the idea. Instead the field is rendered
   and sounded from the same `t`, thirty times a second, so the sync is not
   maintained — it is structural. You cannot get them out of step because there
   is only one clock and both of them are it.

   WHAT YOU SEE IS WHAT YOU HEAR, LITERALLY. The read head is drawn on the
   picture at the column it is sounding. A horizon is a sustained note and you
   can see it lying there; a mast is a chord and you can see the head arrive at
   it; a body walking left arrives earlier in each pass and the rhythm
   accelerates because someone is moving. The picture is painted through the
   same ramp and the same 8x8 Bayer as the printed plates, so a station and a
   print are one look.

   THE DIAL IS THE POEM'S LAW. Sweep, gate, ground and attack are shown as they
   move, because a tuning display on a radio has always been the part that
   tells you the machine is doing something. Gabay's ground sits at zero for a
   whole film. Imzad's breath lengthens to sixteen seconds and its gate spends
   most of a pass near nothing. You can watch a tradition happen.
   ========================================================================= */
import { makeRuntime } from "./halfworld.mjs";
import { engineOf, modeOf, foldRoot } from "./deep/prosody.mjs";
import { pal, BAYER8, RANGE } from "./deep/ramp.mjs";

const FW = 192, FH = 144, BANDS = 56, COLS = 64;
const SLUGS = [
  "00-title-e", "01-out-of-life", "02-flashing-lights",
  "03-how-to-break-off-an-engagement", "04-nevermore", "05-bloodlines",
  "06-resurrecting-atlantis", "07-dj-turn-me-up", "08-newly-single",
  "09-yet-heard", "10-magic-ride", "11-new-day", "12-reunion",
  "13-how-to-win-my-heart", "14-hot-minute",
];

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ---- the stations -------------------------------------------------------- */
const STATIONS = [];
for (const slug of SLUGS) {
  let world;
  try { world = (await import(`./worlds/${slug}.mjs`)).default; } catch (_) { continue; }
  const rt = makeRuntime(world);
  const sc = world.score || {};
  const E = engineOf(sc.engine || "");
  STATIONS.push({
    slug, world, rt, engine: sc.engine || "", E,
    mode: sc.mode || "aeolian", scale: modeOf(sc.mode || "aeolian"),
    root: foldRoot(sc.root || world.drone?.base || 41.203),
  });
}

/* six octaves of the station's declared mode, top of the frame at the top */
function bandTable(st) {
  const hz = new Float32Array(BANDS);
  for (let b = 0; b < BANDS; b++) {
    const k = BANDS - 1 - b, step = Math.round(k / BANDS * (st.scale.length * 6));
    const oct = Math.floor(step / st.scale.length), deg = step % st.scale.length;
    hz[b] = st.root * Math.pow(2, oct + st.scale[deg] / 12);
  }
  return hz;
}

/* ---- reduce a field to what the bank needs ------------------------------- */
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
        if (v > 8.5) continue;
        if (v >= 7.5) a8++;
        const lv = Math.min(7, Math.round(v)), d = lv - bg;
        n++;
        if (d === 0) { if (bg > 0) sg += 0.30; }
        else {
          /* figure is contrast in EITHER direction — a paper hole in a dark
             room is exactly as much a figure as a body on a pale one */
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

/* ---- the painter --------------------------------------------------------- */
const CELL = 5, PW = FW * CELL, PH2 = FH * CELL;
const cv = $("screen"); cv.width = PW; cv.height = PH2;
const cx = cv.getContext("2d", { alpha: false });
const img = cx.createImageData(PW, PH2);
const PX = img.data;
/* a 256-entry palette so a frame is a lookup and not eleven interpolations a
   pixel; and the Bayer threshold precomputed per output pixel modulo eight */
const LUT = new Uint8ClampedArray(256 * 3);
for (let i = 0; i < 256; i++) { const c = pal(i / 255); LUT[i * 3] = c[0]; LUT[i * 3 + 1] = c[1]; LUT[i * 3 + 2] = c[2]; }
const [RLO, RHI] = RANGE;
const THR = new Float32Array(64);
for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) THR[y * 8 + x] = (BAYER8[y][x] + 0.5) / 64;
for (let i = 3; i < PX.length; i += 4) PX[i] = 255;

function paint(g, scan, bg) {
  const headX = Math.round(scan * (FW - 1));
  for (let y = 0; y < PH2; y++) {
    const cy = (y / CELL) | 0, row = cy * FW, orow = y * PW;
    const th8 = (y & 7) * 8;
    for (let x = 0; x < PW; x++) {
      const cxx = (x / CELL) | 0;
      const raw = g[row + cxx];
      /* the film's own polarity: ink dark, paper bright, the same way the
         plates print, and the accent kept as the one bright thing */
      let v = raw > 8.5 ? 0.97 : RLO + (1 - Math.min(7, Math.round(raw)) / 7) * (RHI - RLO);
      /* THE HEAD IS A HOT LINE WITH DARK SHOULDERS, and it is drawn that way
         rather than added to what is underneath because half the suite is a
         pale field and the other half is a dark one — anything additive
         disappears into one of them. A bright core between two dark ones is
         legible against every value there is. */
      const dx = cxx - headX;
      if (dx === 0) v = 0.99; else if (dx === -1 || dx === 1) v = 0.02;
      const amp = 0.17 * 4 * v * (1 - v);
      const s = THR[th8 + (x & 7)] < v ? v + amp : v - amp;
      const q = ((s < 0 ? 0 : s > 1 ? 1 : s) * 255) | 0;
      const o = (orow + x) * 4, p3 = q * 3;
      PX[o] = LUT[p3]; PX[o + 1] = LUT[p3 + 1]; PX[o + 2] = LUT[p3 + 2];
    }
  }
  cx.putImageData(img, 0, 0);
}

/* ---- transport ----------------------------------------------------------- */
let si = 0, t = 0, playing = false, ctx = null, node = null, gainN = null;
let last = 0, scanPh = 0, lvl = 0, dead = 0;

async function audio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.audioWorklet.addModule("radio-worklet.js");
  node = new AudioWorkletNode(ctx, "bandbank", {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
    processorOptions: { bands: BANDS, cols: COLS },
  });
  node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
  gainN = ctx.createGain(); gainN.gain.value = 0.9;
  node.connect(gainN).connect(ctx.destination);
  node.port.postMessage({ hz: bandTable(STATIONS[si]) });
}

function tune(i) {
  si = ((i % STATIONS.length) + STATIONS.length) % STATIONS.length;
  t = 0; scanPh = 0;
  if (node) { node.port.postMessage({ hz: bandTable(STATIONS[si]) }); node.port.postMessage({ reset: 1 }); }
  for (const el of document.querySelectorAll("#dial b")) el.classList.toggle("on", +el.dataset.i === si);
  const st = STATIONS[si];
  $("name").textContent = `${st.world.n} · ${st.world.title}`;
  $("tag").textContent = st.world.tagline || "";
  $("trad").textContent = st.engine ? st.E.tradition : "no engine declared — the voice before it has learned anything";
  $("key").textContent = `${st.mode} on ${st.root.toFixed(2)} Hz`;
  document.querySelector("#dial b.on")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const bar = (v, n = 18) => "▮".repeat(Math.round(clamp(v, 0, 1) * n)).padEnd(n, "▯");

function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  const st = STATIONS[si], dur = st.rt.total;
  if (playing) { t += dt; if (t >= dur) { t = 0; if ($("chain").checked) return tune(si + 1); } }

  const u = clamp(t / dur, 0, 1);
  const sweep = Math.max(0.4, st.E.sweep(u));
  if (playing) { scanPh += dt / (2 * sweep); if (scanPh >= 1) scanPh -= 1; }
  const scan = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;
  const gate = clamp(st.E.gate(u, scan), 0, 1);
  const gnd = clamp(st.E.ground(u), 0, 1), atk = st.E.attack(u);

  const g = st.rt.renderField(t);
  const bg = reduce(g);
  paint(g, scan, bg);

  if (node && playing) {
    node.port.postMessage({ amp: AMP.slice(), scan, gate, ground: gnd, attack: atk, dt: Math.max(1 / 120, dt) });
  }
  if (!playing) dead = 0; else if (lvl < 0.002) dead += dt; else dead = 0;

  $("clock").textContent = `${fmt(t)} / ${fmt(dur)}`;
  $("seek").value = String(u * 1000);
  $("mSweep").textContent = `${sweep.toFixed(1)}s ${bar(1 - clamp((sweep - 2) / 15, 0, 1), 12)}`;
  $("mGate").textContent = `${gate.toFixed(2)} ${bar(gate, 12)}`;
  $("mGround").textContent = `${gnd.toFixed(2)} ${bar(gnd, 12)}`;
  $("mAttack").textContent = `${atk.toFixed(2)} ${bar((atk - 1.6) / 2, 12)}`;
  $("mLevel").textContent = `${lvl.toFixed(3)} ${bar(lvl * 1.15, 16)}`;
  $("mBg").textContent = `ground level ${bg}`;
  $("mDead").textContent = dead > 1.2 ? `silent ${dead.toFixed(1)}s` : "";
  $("mDead").className = dead > 4 ? "warn" : "";

  /* A HOOK FOR THE INSTRUMENT THAT STANDS IN FOR EARS. Nobody building this
     can hear it, so the page has to be answerable in numbers: what is the
     head doing, how open is the gate, how loud is the output right now. A
     harness samples this over a minute and two stations that claim to be
     different traditions have to come back with different envelopes, or the
     claim is decoration. */
  window.__radio = { i: si, slug: st.slug, engine: st.engine, t, u, sweep, scan, gate, ground: gnd, attack: atk, lvl, bg, playing };
}

/* ---- wiring -------------------------------------------------------------- */
$("dial").innerHTML = STATIONS.map((s, i) =>
  `<b data-i="${i}"><i>${s.world.n}</i>${s.world.title}<u>${s.engine || "—"}</u></b>`).join("");
$("dial").onclick = (e) => { const b = e.target.closest("b"); if (b) tune(+b.dataset.i); };
$("play").onclick = async () => {
  await audio();
  if (ctx.state === "suspended") await ctx.resume();
  playing = !playing;
  $("play").textContent = playing ? "◼ STOP" : "▶ PLAY";
  if (!playing && node) node.port.postMessage({ stop: 1 });
};
$("prev").onclick = () => tune(si - 1);
$("next").onclick = () => tune(si + 1);
$("seek").oninput = (e) => { t = +e.target.value / 1000 * STATIONS[si].rt.total; };
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  if (e.key === "ArrowRight") tune(si + 1);
  if (e.key === "ArrowLeft") tune(si - 1);
});
tune(+(new URLSearchParams(location.search).get("s") || 0));
requestAnimationFrame(frame);
