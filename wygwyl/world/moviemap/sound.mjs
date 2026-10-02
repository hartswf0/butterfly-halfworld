// WHAT THE CITY SOUNDS LIKE — every audible holding at its address, mixed through the camera as you move.
// The drone record is the ground: the passage of the poem whose district you are in. Over it, spatialised:
//   his reading at each poem's site · the line a building holds, spoken as you pass, and its sung mouth after ·
//   an echo at its corner, the phrase in each voice that carries it · hooks and loops in the clubs after dark ·
//   beds by the water, hits in industry, textures in the ruins, risers downtown · the radio from the mast.
// Only the nearest few sound at once; what is sounding is named on screen (the trace of the automation, and its captions).
import {srcURL} from './holdings.mjs';

// his words first (lines, echoes, his reading), then what the city plays; caps keep the pack and the clubs from crowding him out
const KIND = {reading: {r: 170, loop: 1, w: 1.0, g: 0.9}, line: {r: 40, once: 1, w: 1.7, g: 0.95, cap: 1}, mouth: {r: 40, after: 1, w: 1.5, g: 0.8, cap: 1}, echo: {r: 32, once: 1, w: 1.7, g: 0.95, cap: 1},
  hook: {r: 60, loop: 1, w: 0.7, g: 0.5, cap: 2}, pack: {r: 70, loop: 1, w: 0.45, g: 0.4, cap: 2}, radio: {r: 700, loop: 1, w: 0.35, g: 0.3, cap: 1}};
const ICON = {reading: '◉', line: '“', mouth: '♫', echo: '⟲', hook: '♪', pack: '≈', radio: '📻', passage: '∿'};
const MAX = 6;

export function makeSound(ledger, {captions}) {
  const all = ledger.holdings.filter(h => KIND[h.kind] && h.at), passages = ledger.holdings.filter(h => h.kind === 'passage');
  const G = new Map(); for (const h of all) { const key = Math.floor(h.at[0] / 200) + ',' + Math.floor(h.at[1] / 200); (G.get(key) || G.set(key, []).get(key)).push(h); }
  let ctx = null, master = null, on = false, bed = null, active = new Map(), heard = new Map(), cam = null, night = false, era = 5;
  function enable() {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); }
    ctx.resume(); on = true;
  }
  function disable() { on = false; for (const s of active.values()) kill(s, 0.3); active.clear(); if (bed) { bed.forEach(b => fade(b, 0, 0.6, true)); bed = null; } captions(''); }
  const fade = (s, to, sec, stop) => { const now = ctx.currentTime; s.gain.gain.cancelScheduledValues(now); s.gain.gain.setValueAtTime(s.gain.gain.value, now); s.gain.gain.linearRampToValueAtTime(to, now + sec);
    if (stop) setTimeout(() => { s.el.pause(); s.el.removeAttribute('src'); s.el.load(); try { s.node.disconnect(); } catch (e) {} }, sec * 1000 + 60); };
  function voice(src, {loop = false, spatial = null, at = 0, until = null, gain = 1} = {}) {
    const el = new Audio(); el.src = srcURL(src); el.loop = loop; el.preload = 'auto';
    const node = ctx.createMediaElementSource(el), g = ctx.createGain(); g.gain.value = 0; let out = g;
    if (spatial) { const p = ctx.createPanner(); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = spatial.ref || 10; p.rolloffFactor = 1.1; p.maxDistance = spatial.max || 400;
      p.positionX.value = spatial.x; p.positionY.value = spatial.z || 4; p.positionZ.value = spatial.y; node.connect(g); g.connect(p); p.connect(master); out = p; }
    else { node.connect(g); g.connect(master); }
    const s = {el, node, gain: g, out, target: gain};
    el.addEventListener('loadedmetadata', () => { if (at) el.currentTime = at; el.play().catch(() => {}); fade(s, gain, 0.8); }, {once: true});
    if (until != null) el.addEventListener('timeupdate', () => { if (el.currentTime >= until) { fade(s, 0, 0.25, true); s.done = true; } });
    el.addEventListener('ended', () => { s.done = true; });
    return s;
  }
  function kill(s, sec = 0.6) { if (!s || s.dead) return; s.dead = true; fade(s, 0, sec, true); }

  // the ground tone: the passage of the nearest poem, looping within its span of the record; crossfades when you cross into another
  function updateBed() {
    const p = passages.reduce((b, h) => { const d = Math.hypot(h.at[0] - cam.x, h.at[1] - cam.y); return !b || d < b.d ? {d, h} : b; }, null).h;
    if (bed && bed.id === p.id) { const s = bed[0]; if (s.el.currentTime > p.span[1] || s.el.currentTime < p.span[0] - 1) s.el.currentTime = p.span[0]; return; }
    if (bed) bed.forEach(b => fade(b, 0, 3, true));
    const s = voice(p.src, {at: p.span[0], gain: 0.32}); bed = [s]; bed.id = p.id; bed.title = p.title;
  }
  function near(R) { const out = []; for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) for (const h of G.get((Math.floor(cam.x / 200) + a) + ',' + (Math.floor(cam.y / 200) + b)) || []) {
    const K = KIND[h.kind], d = Math.hypot(h.at[0] - cam.x, h.at[1] - cam.y); if (d > K.r) continue; if (h.night && !night) continue; out.push({h, d, score: K.w * (1 - d / K.r)}); } return out; }
  function update(c, opts = {}) {
    cam = c; night = !!opts.night; era = opts.era ?? 5; if (!on || !ctx) return;
    const L = ctx.listener, fy = Math.cos(cam.yaw), fz = Math.sin(cam.yaw);
    if (L.positionX) { L.positionX.value = cam.x; L.positionY.value = cam.z; L.positionZ.value = cam.y; L.forwardX.value = fy; L.forwardY.value = 0; L.forwardZ.value = fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    else { L.setPosition(cam.x, cam.z, cam.y); L.setOrientation(fy, 0, fz, 0, 1, 0); }
    updateBed();
    const now = performance.now(), want = new Set();
    // one voice of his at a time: only the nearest reading speaks; the others wait their turn
    let cand = near(800).map(c => (c.h.kind === 'mouth' && heard.has('line:' + c.h.id.split(':')[1] + '_L' + String(c.h.n).padStart(2, '0')) ? {...c, score: c.score + 3} : c)).sort((a, b) => b.score - a.score); const nr = cand.filter(c => c.h.kind === 'reading').sort((a, b) => a.d - b.d)[0]; cand = cand.filter(c => c.h.kind !== 'reading' || c === nr);
    const WORDS = new Set(['line', 'mouth', 'echo']), fam = k => WORDS.has(k) ? 'words' : k, perKind = {}, perLot = new Set();
    for (const s of active.values()) if (!s.dead && !s.done && WORDS.has(s.h.kind)) perKind.words = (perKind.words || 0) + 1;      // his words, one at a time
    for (const {h} of cand) {
      if (want.size >= MAX) break; const K = KIND[h.kind];
      if (K.cap && (perKind[fam(h.kind)] || 0) >= K.cap && !active.has(h.id)) continue; if ((h.kind === 'pack' || h.kind === 'hook') && h.lot != null && perLot.has(h.lot)) continue;
      if (K.once || K.after) { if (!active.has(h.id) && heard.has(h.id) && now - heard.get(h.id) < 120000) continue; }       // heard in the last two minutes: let it rest
      if (!active.has(h.id) || !WORDS.has(h.kind)) perKind[fam(h.kind)] = (perKind[fam(h.kind)] || 0) + 1; if (h.lot != null && (h.kind === 'pack' || h.kind === 'hook')) perLot.add(h.lot);
      want.add(h.id);
      if (active.has(h.id)) continue;
      const sp = {x: h.at[0], y: h.at[1], z: (h.face ? h.face[2] + 4 : 3), ref: h.kind === 'radio' ? 60 : 9, max: K.r * 2};
      let s;
      if (h.kind === 'echo') { // the phrase in each voice that carries it, one after another
        const seq = h.voices.slice(); s = {seq, h, gain: null}; const next = () => { if (!on || !seq.length || s.dead) { s.done = true; return; } const [src, t0, t1] = seq.shift(); const v = voice(src, {spatial: sp, at: t0, until: t1, gain: K.g}); s.cur = v; v.el.addEventListener('pause', () => setTimeout(next, 250), {once: true}); };
        s.kill = () => { s.dead = true; if (s.cur) kill(s.cur, 0.3); }; next(); }
      else if (h.kind === 'mouth') { const lineId = 'line:' + h.id.split(':')[1] + '_L' + String(h.n).padStart(2, '0'); const ln = active.get(lineId); if (ln && !ln.done) { want.delete(h.id); continue; } s = voice(h.src, {spatial: sp, gain: K.g}); }
      else s = voice(h.src, {loop: !!K.loop, spatial: sp, gain: K.g * (h.kind === 'pack' && h.cls === 'HIT' ? 0.7 : 1)});
      s.h = h; active.set(h.id, s); if (K.once || K.after) heard.set(h.id, now);
    }
    for (const [id, s] of active) { const d = Math.hypot(s.h.at[0] - cam.x, s.h.at[1] - cam.y), K = KIND[s.h.kind];
      if (s.done || (!want.has(id) && (K.loop || d > K.r * 1.3))) { s.kill ? s.kill() : kill(s); active.delete(id); } }
    // the captions: what is sounding, which way, how far — the city's own subtitles
    const lines = [...active.values()].filter(s => !s.dead).map(s => { const h = s.h, d = Math.hypot(h.at[0] - cam.x, h.at[1] - cam.y), rel = Math.atan2(h.at[1] - cam.y, h.at[0] - cam.x) - cam.yaw, a = ((rel * 180 / Math.PI) % 360 + 540) % 360 - 180;
      const arrow = '↑↗→↘↓↙←↖'[Math.round(((a + 360) % 360) / 45) % 8]; const t = h.title.length > 64 ? h.title.slice(0, 62) + '…' : h.title; return [d, `${ICON[h.kind]} ${t} <i>${arrow} ${Math.round(d)} m</i>`]; })
      .sort((a, b) => a[0] - b[0]).slice(0, 4).map(a => a[1]);
    captions([bed ? `${ICON.passage} ${bed.title}` : '', ...lines].filter(Boolean).join('<br>'));
  }
  return {enable, disable, update, get on() { return on; }, get active() { return [...active.values()].map(s => s.h); }};
}
