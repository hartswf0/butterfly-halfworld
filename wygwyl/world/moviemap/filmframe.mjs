// THE FILM'S FRAME — one compositor for WHERE YOU GO WHEN YOU LEAVE, used by the offline render and by the app's Watch.
// A frame at album time t: the engine's picture (2.39:1, posed by filmcam.mjs) with what the city holds on its walls, laid in a
// 16:9 frame; above, the chapter and the street (or what is happening: an era, a picture); below, his words lighting as spoken;
// titles as passages open; the coda across six eras; the overture's descent; the credits rising out of the last place.
import {makeFilmCam, lightAt, clamp, ease, sstep} from './filmcam.mjs';

export function makeFilmRig({eng, cut, meta, out, holdings = null, offline = false, idBuffer = true}) {
  const [PW, PH] = cut.picture, W = cut.width, H = cut.height, TOP = (H - PH) / 2, ERA_N = meta.eras;
  const x = out.getContext('2d'), gl = eng.renderer.domElement, S = out.width / W;
  const fcam = makeFilmCam(cut, (a, b) => eng.groundY(a, b));
  const ROOT = offline ? '../../' : '../';                          // the rig runs from moviemap/tools/ offline, from moviemap/ in the app
  const pics = new Map(); const pic = cid => { let im = pics.get(cid); if (!im) { im = new Image(); im.src = `${ROOT}iconic/c/${cid}.webp`; pics.set(cid, im); } return im.complete && im.naturalWidth ? im : null; };
  for (const c of cut.chapters) for (const l of c.lines) if (l.shot) pic(l.shot.cid);
  const fmtH = h => { h = ((h % 24) + 24) % 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; };
  let C = null, weatherNow = null, codaImgs = null, codaFor = null, lastT = null;

  function bars(way, extra) {
    x.fillStyle = '#000'; x.fillRect(0, 0, W, TOP); x.fillRect(0, TOP + PH, W, H - TOP - PH);
    x.textBaseline = 'middle'; x.font = '600 15px Georgia, serif'; x.fillStyle = '#cdbf9f'; x.textAlign = 'left';
    if (C) { x.save(); if (x.letterSpacing !== undefined) x.letterSpacing = '0.16em'; x.fillText(`${C.num}  ·  ${C.title.toUpperCase()}`, 36, TOP / 2); x.restore(); }
    x.textAlign = 'right'; x.font = 'italic 15px Georgia, serif'; x.fillStyle = '#a99f8c'; x.fillText(extra || way || '', W - 36, TOP / 2);
  }
  function subtitle(t) {
    if (!C) return; const l = C.lines.find(l => t >= l.s - 0.25 && t <= l.e + 0.9); if (!l) return;
    const a = sstep(l.s - 0.25, l.s + 0.05, t) * (1 - sstep(l.e + 0.5, l.e + 0.9, t));
    x.font = '25px Georgia, serif'; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    const ws = l.words, sp = x.measureText(' ').width, rows = [[]], maxW = W - 180; let wNow = 0;
    for (const w of ws) { const ww = x.measureText(w[0]).width; if (wNow + ww > maxW && rows[rows.length - 1].length) { rows.push([]); wNow = 0; } rows[rows.length - 1].push(w); wNow += ww + sp; }
    const b0 = TOP + PH + (H - TOP - PH) / 2 - (rows.length - 1) * 15 + 8;
    rows.slice(0, 3).forEach((r, i) => { const tw = r.reduce((s, w) => s + x.measureText(w[0]).width + sp, -sp); let cx = W / 2 - tw / 2;
      for (const w of r) { x.globalAlpha = a * (t >= w[1] ? 1 : 0.34); x.fillStyle = '#fff6e4'; x.fillText(w[0], cx, b0 + i * 30); cx += x.measureText(w[0]).width + sp; } });
    x.globalAlpha = 1;
  }
  function card(lines, alpha) {
    if (alpha <= 0) return; x.globalAlpha = alpha; x.textAlign = 'center'; x.textBaseline = 'middle';
    let y = TOP + PH / 2 - (lines.length - 1) * 26; for (const [txt, font, col] of lines) { x.font = font; x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 18; x.fillStyle = col; x.fillText(txt, W / 2, y); y += font.includes('54px') || font.includes('46px') ? 60 : 32; }
    x.shadowBlur = 0; x.globalAlpha = 1;
  }
  const filmCam = (p, z, yaw, pitch) => ({x: p.px, y: p.py, z, yaw, pitch, hfov: cut.hfov * Math.PI / 180, aspect: PW / PH});
  function walls(cam, night) {
    if (!holdings) return;
    lastWalls = holdings.draw(x, cam, {dx: 0, dy: TOP, dw: PW, dh: PH, d: 1}, {era: eng.st.era, night, idAt: idBuffer ? (u, v) => eng.pickAt(u, v) : null});
  }
  let lastWalls = [];

  // ——— one frame at album time t (async: offline, the films on the walls are seeked to their frame first) ———
  async function frame(t, dtReal = 1 / cut.fps) {
    const A = fcam.at(t), ch = A.ch; x.setTransform(S, 0, 0, S, 0, 0);
    if (ch !== C) { C = ch; codaImgs = null; const L = lightAt(ch, t); eng.setEra(5); eng.setHour(L.hour); weatherNow = L.weather; eng.setWeather(weatherNow); eng.setWet(L.wet); }
    let extra = null;
    if (A.credits) {
      const u = clamp((t - cut.duration) / cut.credits, 0, 1), last = A.pose;
      const z = Math.exp(Math.log(last.gz) + (Math.log(5200) - Math.log(last.gz)) * ease(u)), pitch = -Math.PI / 2 * sstep(0, 0.5, u) + 0.02;
      eng.poseFree(last.px, last.py, z, last.yaw, Math.max(-1.5605, pitch)); eng.advance(dtReal); eng.renderFilm();
      x.drawImage(gl, 0, TOP, PW, PH); x.fillStyle = `rgba(0,0,0,${0.55 * sstep(0.1, 0.4, u)})`; x.fillRect(0, TOP, PW, PH); bars('', '');
      const a = sstep(0.12, 0.3, u) * (1 - sstep(0.92, 1, u));
      card([['Where You Go When You Leave', 'italic 46px Georgia, serif', '#fff6e4'], ['a movie map of Atlantis', '20px Georgia, serif', '#d8ccb4'], ['', '12px Georgia', '#fff'],
        ['his fourteen readings, over the unified drone record', '16px Georgia, serif', '#cfc4ad'], ['the city: the WYGWYL worldtext, canon ' + cut.from.canon + ' · city ' + cut.from.city, '13px ui-monospace, Menlo, monospace', '#9f978a'],
        ['what the city holds on its walls and in its streets · the light of each poem from its treatment', '14px Georgia, serif', '#b7ad99'],
        ['after the Aspen Movie Map, MIT Architecture Machine Group, 1978', '14px Georgia, serif', '#b7ad99'], ['rendered frame by frame by the movie map engine · cut ' + cut.checksum, '12px ui-monospace, Menlo, monospace', '#8f887d']], a);
      return {t, credits: true};
    }
    const L = lightAt(ch, t); eng.setHourFast(L.hour);
    if (L.weather !== weatherNow) { weatherNow = L.weather; eng.setWeather(weatherNow); eng.setWet(L.wet); }
    const night = L.hour >= 19 || L.hour < 6 ? 1 : 0, p = A.pose;
    if (!A.inCoda) {
      const overture = ch === cut.chapters[0] && t < ch.read0;
      if (overture) { const era = Math.min(5, Math.floor(t / (ch.read0 * 0.9) * 6)); if (era !== eng.st.era) eng.setEra(era); extra = `${era} · ${ERA_N[era]}`;
        const v = ease(clamp(t / (ch.read0 - 0.6), 0, 1)), z = Math.exp(Math.log(4200) + (Math.log(p.gz) - Math.log(4200)) * v);
        eng.poseFree(p.px, p.py, z, p.yaw, -Math.PI / 2 * (1 - sstep(0.55, 1, v)) + 0.0305); }
      else { if (eng.st.era !== 5) eng.setEra(5); eng.poseFree(p.px, p.py, p.gz, p.yaw, p.pitch); }
      eng.advance(dtReal); eng.renderFilm(); x.drawImage(gl, 0, TOP, PW, PH);
      if (!overture) { const cam = filmCam(p, p.gz, p.yaw, p.pitch); if (holdings && offline) await holdings.prepare(cam, t); walls(cam, night); }
    } else {
      // the coda: the same place, under a still camera, from the Shore to Resurrection (the last pose, rendered once per era)
      if (!codaImgs || codaFor !== ch) { codaFor = ch; codaImgs = []; for (let e = 0; e < 6; e++) { eng.setEra(e); eng.poseFree(p.px, p.py, p.gz, p.yaw, p.pitch); eng.advance(0); eng.renderFilm();
          const c = document.createElement('canvas'); c.width = gl.width; c.height = gl.height; c.getContext('2d').drawImage(gl, 0, 0); codaImgs.push(c); } eng.setEra(5); }
      const v = (t - ch.coda.t) / ch.coda.dur, k = clamp(Math.floor(v * 6), 0, 5), f = sstep(0, 0.45, v * 6 - k);
      x.drawImage(codaImgs[Math.max(0, k - 1)], 0, TOP, PW, PH); x.globalAlpha = f; x.drawImage(codaImgs[k], 0, TOP, PW, PH); x.globalAlpha = 1;
      extra = `${k} · ${ERA_N[k]}`;
    }
    for (const l of ch.lines) { if (!l.shot || t < l.shot.t || t > l.shot.t + l.shot.dur) continue; const im = pic(l.shot.cid); if (!im) continue;
      const a = 0.62 * sstep(0, 0.5, t - l.shot.t) * (1 - sstep(l.shot.dur - 0.6, l.shot.dur, t - l.shot.t)), s = Math.max(PW / im.width, PH / im.height);
      x.globalAlpha = a; x.drawImage(im, (PW - im.width * s) / 2, TOP + (PH - im.height * s) / 2, im.width * s, im.height * s); x.globalAlpha = 1;
      extra = `the picture that saw this · ${l.shot.cid} · ${l.shot.source}`; }
    bars(A.inCoda ? null : `${cut.ways[p.way]}  ·  ${fmtH(eng.st.hour)}`, extra);
    subtitle(t);
    if (ch === cut.chapters[0] && t < ch.read0 + 1) card([['Where You Go When You Leave', 'italic 54px Georgia, serif', '#fff6e4'], ['a movie map of Atlantis', '20px Georgia, serif', '#e6dcc6']], sstep(2, 5, t) * (1 - sstep(ch.read0 - 9, ch.read0 - 5, t)));
    if (ch === cut.chapters[0] && t >= ch.read0 - 5 && t < ch.read0 + 6) card([[ch.num, '600 15px ui-monospace, Menlo, monospace', '#9fd8ff'], [ch.title, '46px Georgia, serif', '#fff6e4'], [ch.light.why, 'italic 16px Georgia, serif', '#e2d6bf']], sstep(ch.read0 - 4.5, ch.read0 - 3.5, t) * (1 - sstep(ch.read0 + 1, ch.read0 + 2.4, t)));
    else if (ch !== cut.chapters[0]) { const a = sstep(ch.t0, ch.t0 + 0.7, t) * (1 - sstep(ch.t0 + 3.6, ch.t0 + 4.6, t)); card([[ch.num, '600 15px ui-monospace, Menlo, monospace', '#9fd8ff'], [ch.title, '46px Georgia, serif', '#fff6e4'], [ch.light.why, 'italic 16px Georgia, serif', '#e2d6bf']], a); }
    lastT = t;
    const w = lastWalls; lastWalls = [];
    return {t, ch, pose: p, night, inCoda: A.inCoda, walls: w.map(h => h.h.id)};
  }
  return {frame, cam: fcam, PW, PH, W, H, TOP};
}
