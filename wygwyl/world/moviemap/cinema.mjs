// WATCH — WHERE YOU GO WHEN YOU LEAVE, played live: the same cut (film/cut.json), the same camera (filmcam.mjs) and the same frame
// (filmframe.mjs) as the rendered film, drawn by the engine as you watch. The drone record is the clock: each reading starts where
// the album puts it in its passage; the street keeps playing what it holds near the camera (sound.mjs: ambience), ducked under his
// voice; each coda's sung mouth answers his last line. A passage or the whole album; the rendered film too, where it is served.
//
// The surface shows only what is true now (states: CHOOSE · LOADING · PLAYING · PAUSED · END · FAULT):
//   playing — the film's own frame (its letterbox carries the chapter, the street, his words), a hairline of progress, Stop.
//   paused — resume, take the wheel here (the film's light becomes the street's), or back to where you were.
//   end — what was played; stay here, back to where you were, or again.
import {makeFilmRig} from './filmframe.mjs';
import {lineAt, lightAt, chapterAt} from './filmcam.mjs';
import {ambience, codaMouth} from './sound.mjs';

const FILM = '../../../film/WYGWYL-moviemap.mp4';

export function makeCinema(P) {
  const {$} = P, ui = $('watch');
  let cut = null, state = 'off', saved = null, rig = null, out = null, span = null, raf = 0, fault = '', last = null;
  let ctx = null, master = null, drone = null, reading = null, readingCh = null, amb = new Map(), mouth = null, wall0 = 0, pausedAt = 0;
  async function load() { if (!cut) cut = await fetch('film/cut.json').then(r => r.json()); return cut; }
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  // ——— CHOOSE: the whole film first, then the fourteen passages; the rendered film if it is served here ———
  async function choose() {
    if (state !== 'off') return; await load(); saved = P.snapshot(); state = 'choose'; P.chrome(false);
    const whole = await fetch(FILM, {method: 'HEAD'}).then(r => r.ok).catch(() => false);
    ui.className = 'choose'; ui.innerHTML = `<div class="sheet"><div class="hd"><b>Where You Go When You Leave</b><span>his readings drive the car through the city, live · take the wheel at any moment</span><button class="x" data-a="exit" aria-label="close">✕</button></div>
      <button class="whole" data-a="all"><b>the whole film</b><span>${mmss(cut.duration + cut.credits)} · fourteen passages on the album’s clock, over the drone record · drawn live</span></button>
      ${whole ? `<button class="whole alt" data-a="rendered"><b>the rendered film</b><span>the same cut, rendered frame by frame · plays as video</span></button>` : ''}
      <ol>${cut.chapters.map((c, i) => `<li><button data-i="${i}"><span class="n">${c.num}</span><span class="t">${c.title}</span><span class="m">${mmss(c.t1 - c.t0)} · ${c.light.why} · from ${cut.ways[c.path[0][3]]}</span></button></li>`).join('')}</ol></div>`;
    ui.querySelector('[data-a=exit]').onclick = () => leave();
    ui.querySelector('[data-a=all]').onclick = () => play(0, cut.duration + cut.credits);
    if (whole) ui.querySelector('[data-a=rendered]').onclick = () => rendered();
    ui.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { const c = cut.chapters[+b.dataset.i], n = cut.chapters[+b.dataset.i + 1]; play(c.t0, n ? n.t0 : cut.duration + cut.credits); });
    ui.querySelector('[data-a=all]').focus({preventScroll: true});
  }
  function rendered() { state = 'film'; ui.className = 'playing'; ui.innerHTML = `<video src="${FILM}" controls autoplay playsinline></video><button class="back" data-a="leave">↩ back to the street</button>`;
    ui.querySelector('[data-a=leave]').onclick = () => leave(); ui.querySelector('video').focus(); }

  // ——— LOADING → PLAYING ———
  async function play(t0, t1) {
    span = [t0, t1]; state = 'loading'; fault = '';
    ui.className = 'playing'; ui.innerHTML = `<div class="loadmsg">raising the city …</div><div class="sr" aria-live="polite"></div><div class="fault" hidden></div>
      <div class="pause" hidden><div class="pt"></div><div class="row"><button data-a="resume" class="dom">▶ resume</button><button data-a="wheel">take the wheel here</button><button data-a="leave">↩ back to where you were</button></div></div>
      <div class="end" hidden></div><button class="stop" data-a="stop" title="stop (Esc)" aria-label="stop">■</button>
      <div class="bar"><i></i>${cut.chapters.filter(c => c.t0 >= t0 && c.t0 < t1).map(c => `<b style="left:${(c.t0 - t0) / (t1 - t0) * 100}%"></b>`).join('')}</div>`;
    ui.querySelector('[data-a=stop]').onclick = () => state === 'loading' ? leave() : pause(); ui.querySelector('[data-a=resume]').onclick = () => resume();
    ui.querySelector('[data-a=wheel]').onclick = () => wheel(); ui.querySelector('[data-a=leave]').onclick = () => leave();
    ui.querySelector('.bar').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); seek(span[0] + Math.max(0, (e.clientX - r.left) / r.width) * (span[1] - span[0])); };
    audioInit();
    const eng = await P.ensureEngine(); if (state !== 'loading') return;
    // the film's own framing: a 2.39 picture with its lens, inside a 16:9 frame sized to this screen
    const scale = Math.min(1, P.stageWidth() * Math.min(devicePixelRatio || 1, 2) / 1280);
    out = document.createElement('canvas'); out.width = Math.round(1280 * scale); out.height = Math.round(720 * scale);
    P.filmLens(true, Math.round(cut.picture[0] * scale), Math.round(cut.picture[1] * scale), cut.hfov);
    rig = makeFilmRig({eng, cut, meta: P.meta, out, holdings: P.holdings(), idBuffer: !P.mobile});
    P.holdings().preload(cut.chapters.filter(c => c.t0 < t1 && (c.t1 > t0)).flatMap(c => c.path.filter((_, i) => i % 8 === 0)));
    P.onWallImage(() => { if (state === 'paused' && rig) rig.frame(pausedAt).then(() => P.blitFilm(out)); });       // a picture arriving while paused is drawn
    ui.querySelector('.loadmsg')?.remove(); state = 'playing'; startAt(t0); tick();
  }
  // ——— sound: the drone record is the clock; his reading where the album puts it; the street around the camera ———
  function el(src, g) { const a = new Audio(); if (src) a.src = '../../' + src; a.preload = 'auto'; const n = ctx.createMediaElementSource(a), gn = ctx.createGain(); gn.gain.value = g; n.connect(gn); gn.connect(master); return {a, g: gn}; }
  function audioInit() {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.connect(ctx.destination); }
    ctx.resume();
    if (!drone) { drone = el(cut.drone, 0.62); drone.a.onerror = () => { fault = 'the record did not load — the film runs on the wall clock'; showFault(); }; reading = el('', 1.0); }
  }
  function startAt(t) { wall0 = performance.now() - t * 1000; if (!fault && t < cut.duration) { drone.a.currentTime = t; drone.a.play().catch(() => pause(true)); } }
  const now = () => state === 'paused' ? pausedAt : (!fault && drone && !drone.a.paused && !drone.a.ended) ? drone.a.currentTime : (performance.now() - wall0) / 1000;
  function syncReading(t, ch) {
    const into = t - ch.read0;
    if (into < 0 || into > ch.readDur + 0.5) { if (!reading.a.paused) reading.a.pause(); return; }
    if (readingCh !== ch) { readingCh = ch; reading.a.src = '../../' + ch.reading; reading.a.addEventListener('loadedmetadata', () => { reading.a.currentTime = t - ch.read0 > 0 ? now() - ch.read0 : 0; reading.a.play().catch(() => {}); }, {once: true}); return; }
    if (reading.a.readyState < 2) return;
    if (reading.a.paused && into < ch.readDur) reading.a.play().catch(() => {});
    if (Math.abs(reading.a.currentTime - into) > 0.15) reading.a.currentTime = into;          // his voice stays on the record's clock
  }
  function street(t, A) {
    let want = [];
    if (A && !A.credits && !A.inCoda && !(A.ch === cut.chapters[0] && t < A.ch.read0)) { const L = lightAt(A.ch, t), p = A.pose;
      want = ambience(P.holdings().H, {x: p.px, y: p.py, yaw: p.yaw}, {speaking: lineAt(A.ch, t).speaking, night: L.hour >= 19 || L.hour < 6}); }
    const w = new Map(want.map(x => [x.id, x]));
    for (const x of want) if (!amb.has(x.id)) { const s = el(x.src, 0), pn = ctx.createStereoPanner(); s.g.disconnect(); s.g.connect(pn); pn.connect(master); s.a.loop = true; s.a.play().catch(() => {}); s.pn = pn; amb.set(x.id, s); }
    for (const [id, s] of amb) { if (id === 'coda') { if (performance.now() > s.off + 14000) { s.a.pause(); amb.delete(id); } continue; }
      const x = w.get(id); s.g.gain.setTargetAtTime(x ? x.gain * 0.8 : 0, ctx.currentTime, 0.4); if (x) s.pn.pan.setTargetAtTime(Math.max(-1, Math.min(1, x.pan)), ctx.currentTime, 0.2);
      if (!x) { if (!s.off) s.off = performance.now(); if (performance.now() - s.off > 2500) { s.a.pause(); amb.delete(id); } } else s.off = 0; }
    if (A && A.inCoda && mouth !== A.ch) { mouth = A.ch; const m = codaMouth(P.holdings().H, A.ch); if (m) { const v = el(m.src, 0.7); v.a.play().catch(() => {}); amb.set('coda', Object.assign(v, {off: performance.now() + 6000})); } }
  }
  function silence() { if (drone) drone.a.pause(); if (reading) reading.a.pause(); for (const s of amb.values()) s.a.pause(); amb.clear(); }

  // ——— the loop: a film frame at the record's time, laid into the stage ———
  let busy = false, lastAmb = 0;
  async function tick() {
    cancelAnimationFrame(raf); if (state !== 'playing' || !rig) return;
    const t = now();
    if (t >= span[1] - 0.02) { end(); return; }
    if (!busy) { busy = true; const dt = last != null ? Math.max(0, Math.min(0.25, t - last)) : 1 / 24; last = t;
      const A = rig.cam.at(t); syncReading(t, A.credits ? cut.chapters[cut.chapters.length - 1] : A.ch);
      if (performance.now() - lastAmb > 200) { lastAmb = performance.now(); street(t, A); }
      await rig.frame(t, dt); P.blitFilm(out); bar(t); speak(t, A); busy = false; }
    raf = requestAnimationFrame(tick);
  }
  const bar = t => { const i = ui.querySelector('.bar i'); if (i) i.style.width = Math.max(0, Math.min(1, (t - span[0]) / (span[1] - span[0]))) * 100 + '%'; };
  function speak(t, A) { const e = ui.querySelector('.sr'); if (!e || !A || A.credits) return; const L = lineAt(A.ch, t), txt = L.line && t < L.line.e + 0.5 ? L.line.text : ''; if (e.textContent !== txt) e.textContent = txt; }
  function draw() { if (out && (state === 'playing' || state === 'paused' || state === 'end')) P.blitFilm(out); }

  // ——— PAUSED · END · FAULT · leaving ———
  function pause(blocked = false) {
    if (state !== 'playing') return; pausedAt = now(); state = 'paused'; silence(); cancelAnimationFrame(raf);
    const p = ui.querySelector('.pause'); p.hidden = false; ui.querySelector('.stop').hidden = true; const ch = chapterAt(cut, pausedAt);
    p.querySelector('.pt').textContent = blocked ? 'tap to begin — the record and his voice need one touch' : ch === 'credits' ? 'the credits' : `${ch.num} ${ch.title} · ${mmss(Math.max(0, pausedAt - ch.t0))} into the passage`;
    p.querySelector('[data-a=resume]').textContent = blocked ? '▶ begin' : '▶ resume'; p.querySelector('[data-a=resume]').focus();
  }
  function resume() { if (state !== 'paused') return; ui.querySelector('.pause').hidden = true; ui.querySelector('.stop').hidden = false; state = 'playing'; ctx.resume(); last = null; readingCh = null; mouth = null; startAt(pausedAt); tick(); }
  function seek(t) { t = Math.max(span[0], Math.min(span[1] - 0.05, t)); if (state === 'paused') { pausedAt = t; rig && rig.frame(t).then(() => P.blitFilm(out)); bar(t); return; } if (state !== 'playing') return; silence(); last = null; readingCh = null; mouth = null; startAt(t); }
  function showFault() { const e = ui.querySelector('.fault'); if (!e) return; e.textContent = fault; e.hidden = false; }
  function end() {
    state = 'end'; silence(); cancelAnimationFrame(raf); ui.querySelector('.stop').hidden = true;
    const chs = cut.chapters.filter(c => c.t0 >= span[0] - 0.01 && c.t0 < span[1]), e = ui.querySelector('.end'); e.hidden = false;
    e.innerHTML = `<div class="et">${chs.length > 1 ? 'Where You Go When You Leave' : `<small>${chs[0].num}</small>${chs[0].title}`}</div><div class="em">${chs.length} passage${chs.length > 1 ? 's' : ''} · ${(chs.reduce((s, c) => s + c.metres, 0) / 1000).toFixed(1)} km driven · ${chs.map(c => c.light.why.split(';')[0]).slice(0, 3).join(' · ')}${chs.length > 3 ? ' …' : ''}</div>
      <div class="row"><button data-a="wheel" class="dom">stay here</button><button data-a="leave">↩ back to where you were</button><button data-a="again">again</button></div>`;
    e.querySelector('[data-a=wheel]').onclick = () => wheel(); e.querySelector('[data-a=leave]').onclick = () => leave(); e.querySelector('[data-a=again]').onclick = () => { const s = span; teardown(); play(s[0], s[1]); };
    e.querySelector('.dom').focus();
  }
  function teardown() { silence(); cancelAnimationFrame(raf); if (rig) P.filmLens(false); rig = null; out = null; last = null; readingCh = null; mouth = null; }
  // take the wheel: drive on from where the film stands, in the film's light (the street then says it is live, with the way back to the disc)
  function wheel() { const t = state === 'paused' ? pausedAt : now(), A = rig ? rig.cam.at(t) : null, L = A && !A.credits ? lightAt(A.ch, t) : null; teardown(); state = 'off'; ui.className = ''; ui.innerHTML = '';
    P.chrome(true); if (A) P.goToFilm(A.pose, L); }
  function leave() { ui.querySelector('video')?.pause(); teardown(); state = 'off'; ui.className = ''; ui.innerHTML = ''; P.chrome(true); if (saved) P.restore(saved); saved = null; }
  function key(e) {
    if (state === 'off') return false; const k = e.key;
    if (state === 'film') { if (k === 'Escape') leave(); return k === 'Escape'; }
    if (k === 'Escape') { state === 'choose' || state === 'end' || state === 'paused' || state === 'loading' ? leave() : pause(); return true; }
    if (k === ' ') { state === 'paused' ? resume() : pause(); return true; }
    if ((k === 'ArrowRight' || k === 'ArrowLeft') && rig && (state === 'playing' || state === 'paused')) { const t = state === 'paused' ? pausedAt : now(), ch = chapterAt(cut, t); if (ch === 'credits') return true;
      const L = ch.lines, j = L.findIndex(l => l.s > t + 0.05); seek(k === 'ArrowRight' ? (j >= 0 ? L[j].s : ch.t1) : L[Math.max(0, (j < 0 ? L.length : j) - 2)].s); return true; }
    return true;
  }
  return {get active() { return state !== 'off'; }, get state() { return state; }, choose, play, pause, resume, leave, key, draw, load, tap: () => { if (state === 'playing') pause(); },
    seekTo: t => seek(t), debug: () => ({t: now(), state, drone: drone && drone.a.currentTime, reading: reading && reading.a.currentTime, readingSrc: reading && reading.a.src, amb: [...amb.keys()]})};
}
