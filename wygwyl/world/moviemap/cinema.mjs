// WATCH — the poem drives the car. A film is a cut list compiled from his reading (films.json): the voice is the throttle,
// a breath is a held frame, a line looks where it is written into the city, the last line looks back, and then the place is
// shown across its six eras under a still camera. The audio is the clock; the frames follow it off the disc.
//
// The surface shows only what is true now (states: CHOOSE · TITLE · PLAYING · PAUSED · CODA · END · FAULT):
//   playing — the frame, the line being spoken, a hairline of progress, Stop. Nothing else.
//   a cut or a new street leaves a trace (the street's name, which line, what he looks at) that fades on its own.
//   paused — resume, take the wheel here, or leave (back to where you were).
//   end — what was driven; stay here, back to where you were, or again.
const ERA_N = ['The Shore', 'The Old Center', 'Additions', 'The New Boroughs', 'The Fall', 'Resurrection'];

export function makeCinema(P) {
  const {$, disc} = P;
  let films = null, F = null, state = 'off', audio = null, clock = null, saved = null, codaImgs = null, codaP = null, lastDraw = null, traceT = 0, lastKey = '', fault = '';
  const ui = $('watch');

  async function load() { if (!films) films = (await fetch('films.json').then(r => r.json())).films; return films; }
  // the film nearest you is offered first
  function nearest(list) { const here = P.pose(); return list.map(f => { const st = disc.segments.find(s => s.seg === f.path[0][0]).steps[f.path[0][1]]; return [Math.hypot(st[0] - here.x, st[1] - here.y), f]; }).sort((a, b) => a[0] - b[0]).map(a => a[1]); }

  // ——— CHOOSE ———
  async function choose() {
    if (state !== 'off') return; await load(); saved = P.snapshot(); state = 'choose'; P.chrome(false);
    const list = nearest(films), mm = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
    ui.className = 'choose'; ui.innerHTML = `<div class="sheet"><div class="hd"><b>Watch a poem</b><span>his reading drives the car · you can take the wheel at any moment</span><button class="x" data-a="exit" aria-label="close">✕</button></div>
      <ol>${list.map((f, k) => `<li><button data-n="${f.num}" class="${k ? '' : 'first'}"><span class="n">${f.num}</span><span class="t">${f.title}</span><span class="m">${mm(f.duration)} · ${f.metres >= 1000 ? (f.metres / 1000).toFixed(1) + ' km' : f.metres + ' m'} from ${f.from}${f.cuts ? ` · ${f.cuts} cuts` : ''}</span></button></li>`).join('')}</ol></div>`;
    ui.querySelector('[data-a=exit]').onclick = () => leave();
    ui.querySelectorAll('button[data-n]').forEach(b => b.onclick = () => play(films.find(f => f.num === b.dataset.n)));
    ui.querySelector('button.first').focus({preventScroll: true});
  }

  // ——— TITLE → PLAYING ———
  function play(f) {
    F = f; codaImgs = null; codaP = null; fault = ''; lastKey = ''; state = 'title'; P.discState();
    ui.className = 'playing'; ui.innerHTML = `<div class="title"><small>${f.num}</small>${f.title}<em>his reading · from ${f.from}</em></div>
      <div class="line" aria-live="polite"></div><div class="trace"></div><div class="fault" hidden></div>
      <div class="pause" hidden><div class="pt"></div><div class="row"><button data-a="resume" class="dom">▶ resume</button><button data-a="wheel">take the wheel here</button><button data-a="leave">↩ back to where you were</button></div></div>
      <div class="end" hidden></div>
      <button class="stop" data-a="stop" title="stop (Esc)">■</button><div class="bar"><i></i>${f.lines.map(l => `<b style="left:${(l.s / f.duration) * 100}%"></b>`).join('')}</div>`;
    ui.querySelector('[data-a=stop]').onclick = () => pause();
    ui.querySelector('[data-a=resume]').onclick = () => resume();
    ui.querySelector('[data-a=wheel]').onclick = () => wheel();
    ui.querySelector('[data-a=leave]').onclick = () => leave();
    ui.querySelector('.bar').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); seek(Math.max(0, (e.clientX - r.left) / r.width) * F.duration); };
    audio = new Audio(); audio.preload = 'auto'; audio.src = '../../' + f.audio;
    audio.onerror = () => { fault = 'the reading did not load — the words carry the film'; showFault(); };
    clock = {t0: performance.now() + f.pre * 1000, paused: null};
    prefetch(0); P.ensureEngine(true).catch(() => {});
    setTimeout(() => { if (state !== 'title') return; state = 'playing'; ui.querySelector('.title').classList.add('gone'); startAudio(0); }, f.pre * 1000);
    tick();
  }
  function startAudio(t) {
    if (fault) { clock.t0 = performance.now() - t * 1000; return; }
    audio.currentTime = t; audio.play().then(() => {}).catch(() => { pause(true); });   // a blocked autoplay waits for one touch
  }
  // the film's clock: the reading when it plays, else the wall clock (titles, a fault, the coda)
  function now() { if (state === 'paused') return clock.paused; if (state === 'title') return -(clock.t0 - performance.now()) / 1000;
    if (!fault && audio && !audio.paused && !audio.ended) return audio.currentTime; return (performance.now() - clock.t0) / 1000; }

  // ——— where the car is at time t ———
  function at(t) {
    const L = F.lines; let k = L.findIndex(l => t < l.e); if (k < 0) k = L.length;
    if (k === L.length) { const l = L[L.length - 1]; return {p: l.p1, view: l.view, k: L.length - 1, held: true}; }
    const l = L[k];
    if (t < l.s) { const pr = L[k - 1]; return pr ? {p: pr.p1, view: pr.view, k: k - 1, held: true} : {p: l.p0, view: l.view, k: 0, held: true}; }
    // moving only while a word is being spoken
    let spoken = 0, total = 0; for (const [, s, e] of l.words) { total += e - s; spoken += Math.max(0, Math.min(t, e) - s); }
    const p = Math.round(l.p0 + (l.p1 - l.p0) * (total ? spoken / total : 1));
    const prevView = k ? L[k - 1].view : l.view, pan = !l.cut && prevView !== l.view && t - l.s < 0.32 ? {from: prevView, u: (t - l.s) / 0.32} : null;
    return {p, view: l.view, k, pan};
  }
  const ref = (p, view) => { const [seg, i, dir] = F.path[Math.min(F.path.length - 1, Math.max(0, p))]; return P.frameRef(seg, i, dir, view); };
  function prefetch(t) { const a = at(Math.max(0, t)); for (const dp of [0, 32, 64]) ref(a.p + dp, a.view); const nx = F.lines[a.k + 1]; if (nx) ref(nx.p0, nx.view); }

  // ——— the picture ———
  function draw() {
    if (!F) return; P.layout(); const fit = P.fit(), fx = P.fx, t = now(); fx.fillStyle = '#000'; fx.fillRect(0, 0, fit.W, fit.H);
    fx.save(); fx.beginPath(); fx.rect(Math.max(0, fit.dx), fit.dy, Math.min(fit.W, fit.dw), fit.dh); fx.clip();
    const a = at(Math.max(0, t)), cur = ref(a.p, a.view);
    if (a.pan) { const from = ref(a.p, a.pan.from), sgn = ((a.view - a.pan.from + 4) % 4) === 1 ? 1 : ((a.view - a.pan.from + 4) % 4) === 3 ? -1 : 1, u = a.pan.u < .5 ? 2 * a.pan.u ** 2 : 1 - (-2 * a.pan.u + 2) ** 2 / 2;
      if (from.sheet.ready && cur.sheet.ready) { P.blit(from, -u * sgn); P.blit(cur, (1 - u) * sgn); lastDraw = cur; } else if (lastDraw) P.blit(lastDraw); }
    else if (cur.sheet.ready) { P.blit(cur); lastDraw = cur; $('search').classList.remove('on'); }
    else { if (lastDraw && lastDraw.sheet.ready) P.blit(lastDraw); $('search').classList.add('on'); }
    // the coda: the same frame across the six eras
    if (state === 'coda' && codaImgs) { const u = (performance.now() - clock.coda) / 1000, k = Math.min(5, Math.floor(u / 1.4)), f = Math.min(1, (u - k * 1.4) / 0.5);
      if (k > 0) { fx.globalAlpha = 1; fx.drawImage(codaImgs[k - 1], fit.dx, fit.dy, fit.dw, fit.dh); }
      fx.globalAlpha = k < 5 ? f : f * (1 - Math.min(1, (u - 7.6) / 0.6)); fx.drawImage(codaImgs[k], fit.dx, fit.dy, fit.dw, fit.dh); fx.globalAlpha = 1;
      ui.querySelector('.trace').innerHTML = `<b>${k} · ${ERA_N[k]}</b><span>the same place, under a still camera</span>`; ui.querySelector('.trace').classList.add('on'); }
    fx.restore(); P.clearOver();
    const ln = ui.querySelector('.line'); if (ln) { if (fit.tall) { ln.style.top = (fit.dy + fit.dh) / fit.d + 18 + 'px'; ln.style.bottom = 'auto'; } else { ln.style.top = ''; ln.style.bottom = ''; } }
    words(t, a); trace(a); bar(t);
  }
  function words(t, a) {
    const el = ui.querySelector('.line'); if (!el) return; const l = F.lines[a.k];
    if (!l || t < l.s - 0.2 || t > l.e + 1.6 || state === 'coda' || state === 'end') { el.innerHTML = ''; el.dataset.k = ''; return; }
    if (el.dataset.k !== String(a.k)) { el.dataset.k = a.k; el.innerHTML = l.words.map(([w]) => `<span>${w}</span>`).join(' '); }
    el.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', t >= l.words[i][1]));
  }
  // automation leaves a trace: a cut or a new street names itself, then lets go
  function trace(a) {
    if (state === 'coda') return; const [seg] = F.path[a.p], l = F.lines[a.k], key = `${P.wayOf(seg)}|${l ? l.look || '' : ''}|${l && l.cut ? a.k : ''}`; const el = ui.querySelector('.trace');
    if (key !== lastKey && state === 'playing') { lastKey = key; el.innerHTML = `<b>${P.wayOf(seg)}</b><span>line ${a.k + 1} of ${F.lines.length}${l && l.cut ? ' · a cut ahead' : ''}${l && l.look ? ` · looking at ${l.look}` : ''}</span>`; el.classList.add('on'); traceT = performance.now(); }
    if (performance.now() - traceT > 2600) el.classList.remove('on');
  }
  function bar(t) { const i = ui.querySelector('.bar i'); if (i) i.style.width = Math.max(0, Math.min(1, t / F.duration)) * 100 + '%'; }

  // ——— the loop ———
  let raf = 0;
  function tick() {
    cancelAnimationFrame(raf); if (state === 'off' || state === 'choose' || !F) return;
    const t = now();
    if (state === 'playing') { prefetch(t); if (t > F.duration - 18 && !codaP) codaP = renderCoda();
      if (t >= F.lines[F.lines.length - 1].e + 1.2 || (audio && audio.ended)) { if (codaImgs) { state = 'coda'; clock.coda = performance.now(); } else end(); } }
    if (state === 'coda' && (performance.now() - clock.coda) / 1000 > 8.4) end();
    draw(); raf = requestAnimationFrame(tick);
  }
  // render the last frame in each era with the engine, at the same registered pose; skipped if the city cannot be raised in time
  async function renderCoda() {
    try { const eng = await P.ensureEngine(true), l = F.lines[F.lines.length - 1], [seg, i, dir] = F.path[l.p1], imgs = [];
      for (let e = 0; e < 6; e++) { eng.setEra(e); P.poseEngine(seg, i, dir, l.view); eng.render(); const c = document.createElement('canvas'); c.width = eng.renderer.domElement.width; c.height = eng.renderer.domElement.height; c.getContext('2d').drawImage(eng.renderer.domElement, 0, 0); imgs.push(c); await new Promise(r => setTimeout(r, 0)); }
      eng.setEra(5); codaImgs = imgs; } catch (e) { codaImgs = null; }
  }

  // ——— PAUSED · END · FAULT · leaving ———
  function pause(blocked = false) {
    if (state !== 'playing' && state !== 'title' && state !== 'coda') return; clock.paused = now(); clock.was = state; clock.codaEl = performance.now() - (clock.coda || 0); state = 'paused'; audio && audio.pause();
    const p = ui.querySelector('.pause'); p.hidden = false; ui.querySelector('.stop').hidden = true;
    p.querySelector('.pt').textContent = blocked ? 'tap to begin his reading' : `${F.num} ${F.title} · line ${at(Math.max(0, clock.paused)).k + 1} of ${F.lines.length}`;
    p.querySelector('[data-a=resume]').textContent = blocked ? '▶ begin' : '▶ resume'; p.querySelector('[data-a=resume]').focus(); draw();
  }
  function resume() { if (state !== 'paused') return; const t = clock.paused; ui.querySelector('.pause').hidden = true; ui.querySelector('.stop').hidden = false;
    if (clock.was === 'coda') { state = 'coda'; clock.coda = performance.now() - clock.codaEl; } else if (t < 0) { state = 'title'; clock.t0 = performance.now() - t * 1000; setTimeout(() => { if (state === 'title') { state = 'playing'; startAudio(0); } }, -t * 1000); }
    else { state = 'playing'; clock.t0 = performance.now() - t * 1000; startAudio(t); } tick(); }
  function seek(t) { if (!F) return; if (state === 'paused') { clock.paused = t; draw(); return; } if (state !== 'playing') return; clock.t0 = performance.now() - t * 1000; if (!fault) audio.currentTime = t; lastKey = ''; }
  function showFault() { const el = ui.querySelector('.fault'); if (!el) return; el.textContent = fault; el.hidden = false; if (state === 'playing') clock.t0 = performance.now() - (audio.currentTime || 0) * 1000; }
  function end() {
    state = 'end'; audio && audio.pause(); cancelAnimationFrame(raf); ui.querySelector('.stop').hidden = true; ui.querySelector('.trace').classList.remove('on'); ui.querySelector('.line').innerHTML = '';
    const e = ui.querySelector('.end'); e.hidden = false;
    e.innerHTML = `<div class="et"><small>${F.num}</small>${F.title}</div><div class="em">driven ${F.metres >= 1000 ? (F.metres / 1000).toFixed(1) + ' km' : F.metres + ' m'} — ${F.ways.slice(0, 4).join(' → ')}${F.ways.length > 4 ? ' …' : ''} — toward ${F.toward}${F.cuts ? ` · ${F.cuts} cuts` : ''}${codaImgs ? ' · the last place in six eras' : ''}</div>
      <div class="row"><button data-a="wheel" class="dom">stay here</button><button data-a="leave">↩ back to where you were</button><button data-a="again">again</button></div>`;
    e.querySelector('[data-a=wheel]').onclick = () => wheel(); e.querySelector('[data-a=leave]').onclick = () => leave(); e.querySelector('[data-a=again]').onclick = () => { const f = F; stopAll(); play(f); };
    e.querySelector('.dom').focus(); P.markTrace(F.path);
  }
  function stopAll() { audio && audio.pause(); audio = null; cancelAnimationFrame(raf); }
  // take the wheel: drive from the frame you are on (the film's trace stays on the map)
  function wheel() { const a = at(Math.max(0, state === 'paused' ? clock.paused : now())); const [seg, i, dir] = F.path[a.p]; P.markTrace(F.path.slice(0, a.p + 1)); stopAll(); F = null; state = 'off'; ui.className = ''; ui.innerHTML = ''; P.chrome(true); P.goTo({e: seg, i, dir, view: a.view}); }
  // leave: everything as it was before you chose to watch
  function leave() { stopAll(); F = null; state = 'off'; ui.className = ''; ui.innerHTML = ''; P.chrome(true); if (saved) P.restore(saved); saved = null; }
  function key(e) {
    if (state === 'off') return false; const k = e.key;
    if (k === 'Escape') { state === 'choose' || state === 'end' ? leave() : state === 'paused' ? leave() : pause(); return true; }
    if (k === ' ') { state === 'paused' ? resume() : pause(); return true; }
    if ((k === 'ArrowRight' || k === 'ArrowLeft') && F && (state === 'playing' || state === 'paused')) { const t = state === 'paused' ? clock.paused : now(), L = F.lines, j = L.findIndex(l => l.s > t + 0.05);
      const target = k === 'ArrowRight' ? (j >= 0 ? L[j].s : F.duration) : (L[Math.max(0, (j < 0 ? L.length : j) - 2)].s); seek(target); return true; }
    return true;                                                     // while watching, the street's keys sleep
  }
  return {get active() { return state !== 'off'; }, get state() { return state; }, choose, play, pause, resume, leave, key, draw, tap: () => { state === 'playing' || state === 'title' || state === 'coda' ? pause() : null; }, load};
}
