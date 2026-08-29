/* ============================================================================
   watertable.mjs — THE WATER TABLE: the organism, at its smallest viable size.

   ONE SUBSTANCE  everything on air is her voice or its states — the reading
                  (the spring), the codex mouths (the choir), the unified
                  drone (the ground: the 2025 timeline itself, audible).
   ONE CLOCK      the dial IS the clock. Tuning moves through WHEN. The drone
                  plays at dial time; the poem whose span you are inside is
                  what is on air; her reading joins at its place in the span.
   AN ECOLOGY     the choir LISTENS: a mouth may begin only after the spring
                  has been silent for a moment, plays WHOLE (never cut), and
                  yields — not stops — if she resumes. No razor anywhere.
   IT COSTS       a wear ledger persists across sessions. Every second a take
                  is on air adds wear; wear darkens it (lowpass) and opens
                  dropouts in it — the spring included. Erosion is the
                  medium's price, not an editor's cut. Export the ledger;
                  the archive is changed by being heard.
   THE WAVES      the picture is drawn from live analysers of the three
                  voices and scanned by the bandbank — sound makes the ink,
                  the ink makes sound. One clock, closed loop.
   THE EAR        K keep · X kill · N note — the listening ledger, at last.
   ========================================================================= */
import { engineOf, modeOf, foldRoot } from "./deep/prosody.mjs";
import { makePainter, inkToDisplay } from "./deep/paint.mjs";

const FW = 192, FH = 144, BANDS = 56, COLS = 64, CELL = 5;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SLUGS = ["01-out-of-life","02-flashing-lights","03-how-to-break-off-an-engagement",
  "04-nevermore","05-bloodlines","06-resurrecting-atlantis","07-dj-turn-me-up","08-newly-single",
  "09-yet-heard","10-magic-ride","11-new-day","12-reunion","13-how-to-win-my-heart","14-hot-minute"];

const CLOCK = await fetch("clock.json").then(r => r.json());
const WORLD = {};
for (let i = 0; i < SLUGS.length; i++)
  try { WORLD[String(i+1).padStart(2,"0")] = (await import(`./worlds/${SLUGS[i]}.mjs`)).default; } catch(_){}

/* ---- the wear ledger: the archive, changed by being heard ---------------- */
const WEAR = JSON.parse(localStorage.getItem("wt_wear") || "{}");
const LEDGER = JSON.parse(localStorage.getItem("wt_ledger") || "[]");
const wearOf = (k) => WEAR[k] || 0;
function wearAdd(k, s){ WEAR[k] = (WEAR[k] || 0) + s; }
setInterval(() => localStorage.setItem("wt_wear", JSON.stringify(WEAR)), 4000);

/* ---- the three voices ---------------------------------------------------- */
let ctx = null, node = null, master = null, wavesG = null;
function voiceChain(el, key){
  const src = ctx.createMediaElementSource(el);
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
  const g = ctx.createGain();
  const an = ctx.createAnalyser(); an.fftSize = 1024;
  src.connect(lp); lp.connect(g); g.connect(an); an.connect(master);
  return { el, lp, g, an, key, base: 1, dropUntil: 0,
    buf: new Float32Array(1024), spec: new Uint8Array(an.frequencyBinCount) };
}
function applyWear(v, dt){
  const w = wearOf(v.key());
  v.lp.frequency.value = 8000 * Math.exp(-w / 900) + 300;      // it darkens
  if (!v.el.paused){
    wearAdd(v.key(), dt);
    const p = Math.min(0.35, w / 700) * dt;                     // it opens holes
    const t = ctx.currentTime;
    if (t > v.dropUntil && Math.random() < p){
      const d = 0.09 + Math.random() * 0.17;
      v.g.gain.setTargetAtTime(0.0, t, 0.012);
      v.g.gain.setTargetAtTime(v.base, t + d, 0.02);
      v.dropUntil = t + d + 0.4;
      lastDrop = performance.now();
    } else if (t > v.dropUntil) v.g.gain.value += (v.base - v.g.gain.value) * 0.2;
  }
}
const rms = (v) => { v.an.getFloatTimeDomainData(v.buf);
  let s = 0; for (let i = 0; i < v.buf.length; i++) s += v.buf[i] * v.buf[i];
  return Math.sqrt(s / v.buf.length); };

let spring = null, choir = null, ground = null, lastDrop = 0;
let T = 0, playing = false, t0ms = 0, onAir = null, springQuiet = 0, mouthI = -1, mouthWait = 0;
const curT = () => playing ? ((performance.now() - t0ms) / 1000) % CLOCK.duration : T;

function span(t){ return CLOCK.spans.find(s => t >= s.t0 && t < s.t1); }

function retune(hard){
  const t = curT(), s = span(t);
  if (!s) return;
  if (!onAir || s.num !== onAir.num || hard){
    onAir = s; mouthI = -1; mouthWait = t + 4;
    const w = WORLD[s.num] || {}, sc = w.score || {};
    if (node) node.port.postMessage({ hz: bandTable(modeOf(sc.mode || "aeolian"),
      foldRoot(sc.root || w.drone?.base || 41.2)) });
    spring.el.src = s.reading;
    const into = t - s.t0;
    spring.el.currentTime = 0;
    if (into > 0.5) spring.el.addEventListener("loadedmetadata",
      () => { if (into < spring.el.duration) spring.el.currentTime = into; }, { once: true });
    if (playing) spring.el.play().catch(()=>{});
    choir.el.pause();
    $("name").textContent = `${s.num} · ${s.title}`;
    $("tag").textContent = `${s.mouths.length} mouths in the choir · span ${Math.round(s.t0)}–${Math.round(s.t1)}s of the record`;
  }
  if (Math.abs(ground.el.currentTime - t) > 1.5) ground.el.currentTime = t;
}

function bandTable(scale, root){
  const hz = new Float32Array(BANDS);
  for (let b = 0; b < BANDS; b++){
    const k = BANDS - 1 - b, step = Math.round(k / BANDS * (scale.length * 6));
    hz[b] = root * Math.pow(2, Math.floor(step / scale.length) + scale[step % scale.length] / 12);
  }
  return hz;
}

/* ---- reduce (the house arithmetic) + the field --------------------------- */
const AMP = new Float32Array(BANDS * COLS * 3);
const XB = new Int32Array(COLS + 1), YB = new Int32Array(BANDS + 1);
for (let c = 0; c <= COLS; c++) XB[c] = Math.floor(c / COLS * FW);
for (let b = 0; b <= BANDS; b++) YB[b] = Math.floor(b / BANDS * FH);
const HIST = new Uint32Array(9);
function reduce(g){
  HIST.fill(0);
  for (let q = 0; q < FW * FH; q++){ const v = Math.round(g[q]); if (v >= 0 && v <= 8) HIST[v]++; }
  let bg = 0; for (let v = 1; v <= 7; v++) if (HIST[v] > HIST[bg]) bg = v;
  const N = BANDS * COLS;
  for (let c = 0; c < COLS; c++){
    const x0 = XB[c], x1 = Math.max(x0 + 1, XB[c + 1]);
    for (let b = 0; b < BANDS; b++){
      const y0 = YB[b], y1 = Math.max(y0 + 1, YB[b + 1]);
      let sf = 0, sg2 = 0, a8 = 0, n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++){
        const v = g[y * FW + x];
        if (v > 8.5) continue;
        if (v >= 7.5) a8++;
        const lv = Math.min(7, Math.round(v)), d = lv - bg;
        n++;
        if (d === 0){ if (bg > 0) sg2 += 0.30; }
        else { const head = d > 0 ? Math.max(1, 7 - bg) : Math.max(1, bg);
          const con = Math.abs(d) / head;
          if (con >= 0.28) sf += con; else sg2 += con * 0.7; }
      }
      const i = b * COLS + c;
      AMP[i] = n ? sf / n : 0; AMP[N + i] = n ? sg2 / n : 0; AMP[2 * N + i] = n ? a8 / n : 0;
    }
  }
}
const G = new Float32Array(FW * FH);
const put = (x, y, v) => { x |= 0; y |= 0; if (x >= 0 && x < FW && y >= 0 && y < FH && v < G[y * FW + x]) G[y * FW + x] = v; };
let memory = new Float32Array(FW);          // the water remembers her, slowly
function field(){
  G.fill(7);
  spring.an.getFloatTimeDomainData(spring.buf);
  let sr = 0; for (let i = 0; i < spring.buf.length; i++) sr += spring.buf[i] * spring.buf[i];
  const speaking = Math.sqrt(sr / spring.buf.length) > 0.02;
  for (let x = 0; x < FW; x++){
    const w = spring.buf[Math.floor(x / FW * spring.buf.length)];
    /* while she speaks the water is NOT her mirror — it lies flat and does not
       echo her; her shape settles into the water only as she leaves it */
    memory[x] += ((speaking ? 0 : w) - memory[x]) * (speaking ? 0.008 : 0.06);
    const y = 66 - memory[x] * 150;
    put(x, y, Math.abs(memory[x]) > 0.1 ? 0 : 2);
    if (Math.abs(memory[x]) > 0.18) put(x, y - 1, 8);
  }
  /* the choir's spectrum rises as ridgelines above */
  choir.an.getByteFrequencyData(choir.spec);
  for (let x = 0; x < FW; x++){
    const m = choir.spec[Math.floor(x / FW * 48)] / 255;
    if (m > 0.1) put(x, 40 - m * 26, 1);
  }
  /* the ground's spectrum is the sea body below — thin, not a wash */
  ground.an.getByteFrequencyData(ground.spec);
  for (let x = 0; x < FW; x += 2){
    const m = ground.spec[Math.floor(x / FW * 40)] / 255;
    for (let y = 100; y < 100 + m * 30; y += 5) put(x, y, 6);
  }
  /* wear shows: recent dropouts tear vertical gaps */
  if (performance.now() - lastDrop < 350){
    const x0 = (Math.floor(performance.now() / 350) * 53) % FW;
    for (let y = 0; y < FH; y++){ G[y * FW + ((x0) % FW)] = 7; G[y * FW + ((x0 + 1) % FW)] = 7; }
  }
  return G;
}

const paint = makePainter($("screen"), FW, FH, CELL);
const DISP = new Float32Array(FW * FH);
let scanPh = 0, last = 0, lvl = 0;

/* the station's LOGIC runs on wall time — it must survive a hidden tab */
let lastTick = performance.now();
setInterval(() => {
  if (!ctx) return;
  const now = performance.now(), dt = Math.min(0.6, (now - lastTick) / 1000);
  lastTick = now;
  if (playing) T = curT();
  retune();
  const sRms = rms(spring);
  springQuiet = sRms < 0.015 ? springQuiet + dt : 0;
  const springDone = spring.el.ended || spring.el.paused;
  /* NEGATIVE SPACE LAW: while she reads, no other spoken word exists.
     The choir gets the poem's aftermath — one mouth, then long air, then
     the next. Spoken words never mix with spoken words. */
  if (playing && onAir && springDone && springQuiet > 2.0
      && (choir.el.paused || choir.el.ended) && T > mouthWait){
    mouthI = (mouthI + 1) % Math.max(onAir.mouths.length, 1);
    const m = onAir.mouths[mouthI];
    if (m){ choir.el.src = m.file; choir.base = 0.85; choir.el.play().catch(()=>{});
      choir.el.addEventListener("ended", () => { mouthWait = T + 7; }, { once: true });
      mouthWait = T + 10;
      $("mMouth").textContent = "“" + m.text + "”"; }
  }
  choir.g.gain.value += (((sRms > 0.02) ? 0.0 : choir.base) - choir.g.gain.value) * 0.3;
  /* the water recedes: barely there under her, present in silence, fuller after */
  ground.g.gain.value += ((sRms > 0.02 ? 0.05 : springDone ? 0.16 : 0.10) - ground.g.gain.value) * 0.2;
  if (wavesG) wavesG.gain.setTargetAtTime(sRms > 0.02 ? 0.03 : springDone ? 0.30 : 0.14,
    ctx.currentTime, sRms > 0.02 ? 0.06 : 0.6);
  applyWear(spring, dt); applyWear(choir, dt); applyWear(ground, dt);
  const wk = onAir ? wearOf("read:" + onAir.num) : 0;
  $("mWear").textContent = `${wk.toFixed(0)}s worn ${"▮".repeat(Math.min(16, wk / 40 | 0)).padEnd(16, "▯")}`;
  $("mSpring").textContent = springDone ? "finished — the drone holds" : sRms > 0.02 ? "SPEAKING" : "breath";
  $("clock").textContent = `${String(Math.floor(T/60)).padStart(2,"0")}:${String(Math.floor(T%60)).padStart(2,"0")} / 24:00`;
  window.__wt = { T, num: onAir?.num, playing, sRms, wear: wk, mouthI,
    choirPlaying: !choir.el.paused && !choir.el.ended };
}, 250);

function frame(now){
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  if (!ctx) return;
  const w = WORLD[onAir?.num] || {}, E = engineOf((w.score || {}).engine || "");
  const u = onAir ? clamp((T - onAir.t0) / (onAir.t1 - onAir.t0), 0, 1) : 0;
  const sweep = Math.max(0.4, E.sweep(u));
  if (playing){ scanPh += dt / (2 * sweep); if (scanPh >= 1) scanPh -= 1; }
  const scan = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;

  const g = field();
  reduce(g);
  for (let i = 0; i < DISP.length; i++) DISP[i] = inkToDisplay(g[i]);
  paint(DISP, Math.round(scan * (FW - 1)));
  if (node && playing)
    node.port.postMessage({ amp: AMP.slice(), scan, gate: clamp(E.gate(u, scan), 0, 1),
      ground: clamp(E.ground(u), 0, 1) * 0.5, attack: E.attack(u), dt: Math.max(1/120, dt) });

  drawDial();
}

/* ---- the dial: the clock itself ------------------------------------------ */
const dial = $("dialcv");
function drawDial(){
  const d = Math.min(devicePixelRatio || 1, 2), W = dial.clientWidth || innerWidth - 40;
  if (dial.width !== W * d){ dial.width = W * d; dial.height = 46 * d;
    dial.getContext("2d").setTransform(d, 0, 0, d, 0, 0); }
  const g = dial.getContext("2d");
  g.fillStyle = "#04090b"; g.fillRect(0, 0, W, 46);
  for (const s of CLOCK.spans){
    const x = s.t0 / CLOCK.duration * W, ww = (s.t1 - s.t0) / CLOCK.duration * W;
    const worn = Math.min(1, wearOf("read:" + s.num) / 500);
    g.fillStyle = s === onAir ? "#4dd9cc" : `rgba(141,106,112,${0.35 + 0.4 * (1 - worn)})`;
    g.fillRect(x + 1, 14, ww - 2, 18);
    if (worn > 0.05){ g.fillStyle = "#e0532c"; g.fillRect(x + 1, 33, (ww - 2) * worn, 3); }
    g.fillStyle = s === onAir ? "#04090b" : "#0b0410";
    if (ww > 26) g.fillText(s.num, x + 4, 27);
  }
  g.strokeStyle = "#f6e7c8"; g.beginPath();
  const px = T / CLOCK.duration * W;
  g.moveTo(px, 2); g.lineTo(px, 44); g.stroke();
}
dial.addEventListener("pointerdown", (e) => {
  const W = dial.clientWidth;
  T = clamp(e.offsetX / W, 0, 1) * CLOCK.duration;
  t0ms = performance.now() - T * 1000;
  retune(true);
});

/* ---- power + the ear ----------------------------------------------------- */
$("power").onclick = async () => {
  if (!ctx){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.audioWorklet.addModule("radio-worklet.js");
    master = ctx.createGain(); master.gain.value = 0.95; master.connect(ctx.destination);
    node = new AudioWorkletNode(ctx, "bandbank", { numberOfInputs: 0, numberOfOutputs: 1,
      outputChannelCount: [2], processorOptions: { bands: BANDS, cols: COLS } });
    node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
    wavesG = ctx.createGain(); wavesG.gain.value = 0.0;
    node.connect(wavesG).connect(ctx.destination);
    spring = voiceChain($("aSpring")); spring.key = () => "read:" + (onAir?.num || "?");
    choir = voiceChain($("aChoir")); choir.key = () => "mouth:" + (choir.el.src.split("/").pop() || "?");
    ground = voiceChain($("aGround")); ground.key = () => "drone"; ground.base = 0.24;
    ground.el.src = CLOCK.drone; ground.el.loop = true;
  }
  await ctx.resume();
  playing = !playing;
  $("power").textContent = playing ? "◼ OFF AIR" : "⏻ ON AIR";
  if (playing){ t0ms = performance.now() - T * 1000;
    ground.el.play().catch(()=>{}); retune(true); }
  else { spring.el.pause(); choir.el.pause(); ground.el.pause();
    if (node) node.port.postMessage({ stop: 1 }); }
};
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === " "){ e.preventDefault(); $("power").click(); }
  const verdict = e.key === "k" ? "keep" : e.key === "x" ? "kill" : e.key === "n" ? "note" : null;
  if (verdict && onAir){
    const entry = { t: Math.round(T), num: onAir.num, verdict,
      note: verdict === "note" ? (prompt("the ear says:") || "") : "" };
    LEDGER.push(entry);
    localStorage.setItem("wt_ledger", JSON.stringify(LEDGER));
    $("mEar").textContent = `${LEDGER.length} verdicts · last: ${entry.verdict} @${entry.num}`;
  }
});
$("export").onclick = () => {
  const blob = new Blob([JSON.stringify({ wear: WEAR, ledger: LEDGER }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "watertable-ledger.json"; a.click();
};
$("mEar").textContent = LEDGER.length ? `${LEDGER.length} verdicts on record` : "no verdicts yet — K keep · X kill · N note";
requestAnimationFrame(frame);
