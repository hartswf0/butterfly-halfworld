/* ============================================================================
   radio-scapes.mjs — THE WATER OF ATLANTIS, PLAYING ITSELF.

   The engine is WYGWYL RADIO's, unchanged: an ink field is a spectrum, a read
   head sweeps it, horizontals sustain and verticals strike, and the picture
   and the sound come from the same instant so they cannot drift.

   What is new is the FIELD. Not a film — a SCAPE:

     THE WATER    two or three wave systems of different lengths and speeds
                  cross the frame; where they agree the crest darkens (and is
                  therefore HEARD — construction), where they cancel the ink
                  thins to nothing (destruction). Interference is not an
                  effect on this picture; it is the picture.
     THE TIDE     the waterline itself breathes across the whole piece.
     THE SOUNDS   the poem's own visualized sounds — the squiggle envelopes
                  from the sonic field — drift on the water as ridgelines,
                  each at its own speed, never agreeing.
     THE HEART    a vertical mark that strikes once a beat: the IV drip.
     THE MOUTHS   her reading plays WHOLE and untouched — audio first class,
                  no word ever cut. While she speaks the water calms and the
                  bank falls to a trickle; in her silences THE FLOOD: the
                  waves swell and the bank blooms far past politeness.
                  Louder and quieter at the same time, keyed to her breath.
                  When she has finished, the OTHER MOUTHS arrive — the codex
                  lines, sung whole — while the water disintegrates under
                  them, wave by wave, into the tide that started it.
   ========================================================================= */
import { engineOf, modeOf, foldRoot } from "./deep/prosody.mjs";
import { makePainter, inkToDisplay } from "./deep/paint.mjs";

const FW = 192, FH = 144, BANDS = 56, COLS = 64, CELL = 5;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SLUGS = ["01-out-of-life","02-flashing-lights","03-how-to-break-off-an-engagement",
  "04-nevermore","05-bloodlines","06-resurrecting-atlantis","07-dj-turn-me-up","08-newly-single",
  "09-yet-heard","10-magic-ride","11-new-day","12-reunion","13-how-to-win-my-heart","14-hot-minute"];

/* ---- the stations: each poem's world lends its LAW, its key, its sounds -- */
const [PW, CODEX, SONIC] = await Promise.all([
  fetch("poemworlds.json").then(r => r.json()),
  fetch("codex/lines.json").then(r => r.json()),
  fetch("sonic/sonic.json").then(r => r.json()),
]);
const SBYID = Object.fromEntries(SONIC.sounds.map(s => [s.id, s]));

const STATIONS = [];
for (let i = 0; i < SLUGS.length; i++) {
  const num = String(i + 1).padStart(2, "0");
  let world = {};
  try { world = (await import(`./worlds/${SLUGS[i]}.mjs`)).default; } catch (_) {}
  const w = PW.worlds.find(x => x.num === num);
  if (!w) continue;
  const timing = await fetch(`timings/${num}.json`).then(r => r.json()).catch(() => null);
  const words = timing ? timing.segments.flatMap(sg => sg.words || []) : [];
  const cx = CODEX.poems.find(p => p.num === num);
  const sc = world.score || {};
  /* the squiggles: this poem's own referred sounds' envelopes, else kin */
  let sq = (w.sounds || []).map(s => SBYID[s.id]).filter(s => s && s.c);
  if (sq.length < 4) sq = sq.concat(SONIC.sounds.filter(s => s.c && s.eco !== "song").slice(i * 7, i * 7 + 6 - sq.length));
  STATIONS.push({
    num, title: w.title, world, reading: w.reading, words,
    vDur: w.dur || (words.length ? words[words.length - 1].e + 1 : 60),
    mouths: (cx?.lines || []).slice().sort((a, b) => b.jaccard - a.jaccard).slice(0, 5),
    E: engineOf(sc.engine || ""), engine: sc.engine || "",
    mode: sc.mode || "aeolian", scale: modeOf(sc.mode || "aeolian"),
    root: foldRoot(sc.root || world.drone?.base || 41.2),
    bpm: 58 + ((i * 7) % 16),
    waves: [ { L: 47 + i * 2, v: 7.5, a: 6.2 }, { L: 29 - (i % 5), v: -12.5, a: 5.0 },
             { L: 16 + (i % 7), v: 19.5, a: 3.2 } ],
  });
}

function bandTable(st) {
  const hz = new Float32Array(BANDS);
  for (let b = 0; b < BANDS; b++) {
    const k = BANDS - 1 - b, step = Math.round(k / BANDS * (st.scale.length * 6));
    const oct = Math.floor(step / st.scale.length), deg = step % st.scale.length;
    hz[b] = st.root * Math.pow(2, oct + st.scale[deg] / 12);
  }
  return hz;
}

/* ---- reduce: identical arithmetic to WYGWYL RADIO ------------------------ */
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

/* ---- THE SCAPE: a pure function of (station, t, flood, phase) ------------ */
const G = new Float32Array(FW * FH);
const put = (x, y, v) => { x |= 0; y |= 0; if (x >= 0 && x < FW && y >= 0 && y < FH && v < G[y * FW + x]) G[y * FW + x] = v; };
function scape(st, t, flood, decay) {
  G.fill(7);                                        // the paper
  const tideY = 78 + 22 * Math.sin(t * 2 * Math.PI / 210);      // the tide breathes
  const amp = (0.25 + 0.75 * flood) * (1 - 0.8 * decay);
  /* the water: each system drawn, and their SUM drawn as the crest */
  for (let x = 0; x < FW; x++) {
    let sum = 0;
    for (const wv of st.waves) {
      const y = tideY + wv.a * amp * Math.sin(2 * Math.PI * (x / wv.L + t * wv.v / wv.L));
      sum += wv.a * amp * Math.sin(2 * Math.PI * (x / wv.L + t * wv.v / wv.L));
      if (decay < 0.9 || ((x + (t | 0)) % 3)){      // disintegration eats the lines
        put(x, y, 2);
        if (flood > 0.6) put(x, y + 1, 3);          // the flood thickens every wave
      }
    }
    const crest = Math.abs(sum) / (st.waves.reduce((a, w) => a + w.a, 0) * amp + 1e-9);
    if (crest > 0.55){                              // CONSTRUCTION: agreed crests darken
      const y = tideY + sum;
      put(x, y - 1, 1); put(x, y, 0); put(x, y + 1, 1);
      if (flood > 0.6){ put(x, y - 2, 0); put(x, y + 2, 1); }
      if (crest > 0.8) put(x, y - 3, 8);            // the shimmer on the biggest waves
    }
    for (let y = Math.ceil(tideY + 9); y < FH; y += 3) put(x, y, 6);   // the sea body
  }
  /* the visualized sounds drift, each at its own speed, bobbing on the water */
  st.sq?.forEach?.(() => {});
  const sqs = st._sq || (st._sq = (st.sqList || []));
  for (let k = 0; k < sqs.length; k++) {
    const s = sqs[k], c = s.c;
    const speed = 3.5 + (k % 5) * 2.3, W = 30 + (k % 3) * 10;
    const x0 = ((k * 41 + t * speed) % (FW + W)) - W;
    const bob = 5 * Math.sin(2 * Math.PI * (x0 / 60 + t * 0.05));
    const yb = tideY - 14 - (k % 4) * 11 + bob;
    for (let j = 0; j < c.length; j++) {
      const x = x0 + j / (c.length - 1) * W;
      put(x, yb - c[j] * (9 + 3 * flood), 1 + (k % 2));
    }
  }
  /* the heart: one vertical mark, struck on the beat — the IV drip */
  const beat = t * st.bpm / 60;
  if (beat % 1 < 0.09) {
    const x = (Math.floor(beat) * 37) % FW;
    for (let y = tideY - 26; y < tideY - 8; y += 2) put(x, y, 8);
    put(x, tideY - 28, 0);
  }
  return G;
}

/* ---- paint + transport --------------------------------------------------- */
const paint = makePainter($("screen"), FW, FH, CELL);
const DISP = new Float32Array(FW * FH);
function show(g, scan) {
  for (let i = 0; i < DISP.length; i++) DISP[i] = inkToDisplay(g[i]);
  paint(DISP, Math.round(scan * (FW - 1)));
}

let si = 0, t = 0, playing = false, ctx = null, node = null, lvl = 0;
let last = 0, scanPh = 0, flood = 1, phase = "tide", mouthI = -1;
const voice = new Audio(); voice.preload = "auto";
let mouthA = null, mouthUntil = 0;

async function audio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.audioWorklet.addModule("radio-worklet.js");
  node = new AudioWorkletNode(ctx, "bandbank", {
    numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2],
    processorOptions: { bands: BANDS, cols: COLS },
  });
  node.port.onmessage = (e) => { if (e.data.lvl !== undefined) lvl = e.data.lvl; };
  const g = ctx.createGain(); g.gain.value = 0.9;
  node.connect(g).connect(ctx.destination);
  node.port.postMessage({ hz: bandTable(STATIONS[si]) });
}

function tune(i) {
  si = ((i % STATIONS.length) + STATIONS.length) % STATIONS.length;
  t = 0; scanPh = 0; phase = "tide"; mouthI = -1;
  const st = STATIONS[si];
  st.sqList = st.sqList || (PW.worlds.find(x => x.num === st.num)?.sounds || [])
    .map(s => SBYID[s.id]).filter(s => s && s.c);
  if (st.sqList.length < 4)
    st.sqList = st.sqList.concat(SONIC.sounds.filter(s => s.c && s.eco !== "song")
      .slice(si * 9, si * 9 + 7 - st.sqList.length));
  st._sq = st.sqList;
  voice.pause(); voice.src = st.reading; voice.currentTime = 0;
  if (mouthA) { mouthA.pause(); mouthA = null; }
  if (node) { node.port.postMessage({ hz: bandTable(st) }); node.port.postMessage({ reset: 1 }); }
  for (const el of document.querySelectorAll("#dial b")) el.classList.toggle("on", +el.dataset.i === si);
  $("name").textContent = `${st.num} · ${st.title}`;
  $("tag").textContent = `${st.mouths.length} other mouths waiting`;
  $("trad").textContent = st.engine ? st.E.tradition : "the water before any law";
  $("key").textContent = `${st.mode} on ${st.root.toFixed(1)} Hz · heart ${st.bpm} bpm`;
  if (playing) voice.play().catch(() => {});
}

function speakingNow(st) {
  if (phase === "her") {
    const ct = voice.currentTime;
    return st.words.some(w => ct >= w.s - 0.04 && ct <= w.e + 0.08);
  }
  if (phase === "mouths") return mouthA && !mouthA.paused && !mouthA.ended;
  return false;
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const bar = (v, n = 16) => "▮".repeat(Math.round(clamp(v, 0, 1) * n)).padEnd(n, "▯");

function frame(now) {
  requestAnimationFrame(frame);
  const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
  last = now;
  const st = STATIONS[si];
  if (playing) t += dt;

  /* the phases: the tide alone → her → the other mouths → the tide again */
  if (playing) {
    if (phase === "tide" && t >= 6) { phase = "her"; voice.play().catch(() => {}); }
    if (phase === "her" && (voice.ended || (voice.duration && voice.currentTime >= voice.duration - 0.05))) {
      phase = st.mouths.length ? "mouths" : "ebb"; mouthI = -1; mouthUntil = t + 1.6;
    }
    if (phase === "mouths" && t >= mouthUntil && (!mouthA || mouthA.paused || mouthA.ended)) {
      mouthI++;
      if (mouthI >= st.mouths.length) { phase = "ebb"; mouthUntil = t + 14; }
      else {
        mouthA = new Audio(st.mouths[mouthI].file || st.mouths[mouthI].sung_clip);
        mouthA.play().catch(() => {});
        mouthUntil = t + 1.2;                       // the gap after each mouth
        mouthA.addEventListener("ended", () => { mouthUntil = t + 1.4; }, { once: true });
      }
    }
    if (phase === "ebb" && t >= mouthUntil) { if ($("chain").checked) return tune(si + 1); }
  }

  /* THE FLOOD: her breath drives the whole world — fast bow, slow bloom */
  const speaking = speakingNow(st);
  const target = speaking ? 0.10 : (phase === "tide" || phase === "ebb" ? 0.85 : 1.0);
  flood += (target - flood) * (1 - Math.exp(-dt / (speaking ? 0.05 : 0.55)));
  const decay = phase === "ebb" ? clamp((t - (mouthUntil - 14)) / 12, 0, 1)
              : phase === "mouths" ? 0.25 : 0;

  const u = clamp(t / 240, 0, 1);
  const sweep = Math.max(0.4, st.E.sweep(u));
  if (playing) { scanPh += dt / (2 * sweep); if (scanPh >= 1) scanPh -= 1; }
  const scan = scanPh < 0.5 ? scanPh * 2 : 2 - scanPh * 2;
  const gate = clamp(st.E.gate(u, scan), 0, 1);
  const gnd = clamp(st.E.ground(u), 0, 1) * (0.4 + 0.6 * flood);
  const atk = st.E.attack(u);

  const g = scape(st, t, flood, decay);
  reduce(g);
  show(g, scan);
  if (node && playing) {
    /* louder AND quieter at once: the bank's whole level rides the flood,
       far past politeness at the crest, a trickle under every word */
    node.port.postMessage({ amp: AMP.slice(), scan, gate,
      ground: gnd, attack: atk + 0.5 * flood, dt: Math.max(1 / 120, dt) });
  }

  $("clock").textContent = fmt(t);
  $("mTide").textContent = bar(0.5 + 0.5 * Math.sin(t * 2 * Math.PI / 210));
  $("mFlood").textContent = `${flood.toFixed(2)} ${bar(flood)}`;
  $("mHeart").textContent = (t * st.bpm / 60) % 1 < 0.12 ? "◆ " + st.bpm : "◇ " + st.bpm;
  $("mMouth").textContent = phase === "her" ? (speaking ? "HER — the water bows" : "her breath — the flood")
    : phase === "mouths" ? `OTHER MOUTH ${mouthI + 1}/${st.mouths.length}` : phase.toUpperCase();
  $("mLevel").textContent = `${lvl.toFixed(3)} ${bar(lvl * 1.15)}`;
  window.__scapes = { si, num: st.num, t, phase, flood, speaking, lvl, playing, mouthI };
}

$("dial").innerHTML = STATIONS.map((s, i) =>
  `<b data-i="${i}"><i>${s.num}</i>${s.title}<u>${s.engine || "—"} · ${s.mouths.length} mouths</u></b>`).join("");
$("dial").onclick = (e) => { const b = e.target.closest("b"); if (b) tune(+b.dataset.i); };
$("play").onclick = async () => {
  await audio();
  if (ctx.state === "suspended") await ctx.resume();
  playing = !playing;
  $("play").textContent = playing ? "◼ STOP" : "▶ PLAY";
  if (!playing) { voice.pause(); if (mouthA) mouthA.pause(); if (node) node.port.postMessage({ stop: 1 }); }
  else if (phase === "her") voice.play().catch(() => {});
};
$("prev").onclick = () => tune(si - 1);
$("next").onclick = () => tune(si + 1);
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === " ") { e.preventDefault(); $("play").click(); }
  if (e.key === "ArrowRight") tune(si + 1);
  if (e.key === "ArrowLeft") tune(si - 1);
});
tune(+(new URLSearchParams(location.search).get("s") || 5));
requestAnimationFrame(frame);
