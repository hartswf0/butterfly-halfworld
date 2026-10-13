// THE FILM'S CAMERA — one implementation, used by the offline render (tools/film.html), the app's Watch (cinema.mjs) and the
// sound mixer (tools/film-mix.mjs). Pure: no DOM, no engine; the ground comes in as a function.
// The camera moves on a fixed lattice of frame times (1/fps from each passage's first frame), so the live player and the render
// compute the same pose at the same album time, whatever the display's frame rate.
export const TAU = Math.PI * 2;
export const wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ease = u => u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
export const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// which passage a moment of the album belongs to (a passage runs to the next one's start; after the last, the credits)
export function chapterAt(cut, t) {
  const C = cut.chapters; for (let i = 0; i < C.length; i++) { const end = C[i + 1] ? C[i + 1].t0 : C[i].t1; if (t >= C[i].t0 && t < end) return C[i]; }
  return t >= C[C.length - 1].t1 ? 'credits' : C[0];
}
// the light of a passage at a moment: the treatment's hour swept across it, its weather (changing once, if it says so)
export function lightAt(ch, t) {
  const L = ch.light, u = clamp((t - ch.t0) / (ch.t1 - ch.t0), 0, 1), w = L.weather.length > 1 && u >= (L.at ?? 0.6) ? L.weather[1] : L.weather[0];
  return {hour: L.hour[0] + (L.hour[1] - L.hour[0]) * u, weather: w, wet: L.wet ?? (w === 'rain' || w === 'storm' ? 1 : 0)};
}
// the line being spoken (or just spoken) at a moment, and whether a word is in the air
export function lineAt(ch, t) { const L = ch.lines; let k = L.findIndex(l => t < l.e); if (k < 0) k = L.length - 1; const l = L[k];
  return {k: t < l.s ? k - 1 : k, line: t < l.s ? L[k - 1] || null : l, speaking: t >= l.s && t < l.e && l.words.some(([, a, b]) => t >= a && t < b + 0.12)}; }

export function makeFilmCam(cut, groundY) {
  const fps = cut.fps, dt = 1 / fps, EYE = cut.eye;
  let C = null, cam = null;
  const first = ch => Math.ceil(ch.t0 * fps - 1e-6) / fps;
  function enter(ch) { C = ch; const p0 = ch.lines[0].p0; cam = {s: p0, yaw: ch.path[Math.round(p0)][2], pitch: 0.02, line: -1, t: first(ch) - dt, pose: null}; }
  const P = s => { const a = C.path[clamp(Math.floor(s), 0, C.path.length - 1)], b = C.path[clamp(Math.ceil(s), 0, C.path.length - 1)], f = s - Math.floor(s);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + wrap(b[2] - a[2]) * f, f < 0.5 ? a[3] : b[3]]; };
  function target(t) {
    const Ls = C.lines; let k = Ls.findIndex(l => t < l.e); if (k < 0) k = Ls.length - 1;
    const l = Ls[k]; if (t < l.s) { const pr = Ls[k - 1]; return {s: pr ? pr.p1 : l.p0, line: pr ? k - 1 : -1, l: pr || null}; }
    if (t >= l.e) return {s: l.p1, line: k, l};
    let spoken = 0, total = 0; for (const [, a, b] of l.words) { total += b - a; spoken += clamp(t - a, 0, b - a); }
    return {s: l.p0 + (l.p1 - l.p0) * (total ? spoken / total : 1), line: k, l};
  }
  function step(t) {
    const tg = target(t);
    if (tg.line !== cam.line) { if (tg.l && tg.l.cut && tg.line > cam.line) cam.s = tg.l.p0; cam.line = tg.line; }
    cam.s += (tg.s - cam.s) * (1 - Math.exp(-dt / 0.45));
    const [px, py, hd, w] = P(cam.s), l = tg.l, gz = groundY(px, py) + EYE;
    let yaw = hd, pitch = 0.02;
    if (l && l.look) { yaw = Math.atan2(l.look[1] - py, l.look[0] - px); pitch = clamp(Math.atan2(l.look[2] - gz, Math.hypot(l.look[0] - px, l.look[1] - py)) * 0.6, -0.05, 0.3); }
    else if (l && l.back) yaw = hd + Math.PI;
    cam.yaw += wrap(yaw - cam.yaw) * (1 - Math.exp(-dt / (l && l.back ? 1.4 : 0.9))); cam.pitch += (pitch - cam.pitch) * (1 - Math.exp(-dt / 0.9));
    cam.pose = {px, py, gz, yaw: cam.yaw, pitch: cam.pitch, way: w};
  }
  // the camera at album time t: stepped forward on the lattice (re-entered and walked from rest if t is earlier, or in another passage)
  function at(t) {
    let ch = chapterAt(cut, t), credits = ch === 'credits'; if (credits) ch = cut.chapters[cut.chapters.length - 1];
    if (ch !== C || t < cam.t - 1e-6) enter(ch);
    const stop = credits ? (C.coda ? C.coda.t : C.t1) : C.coda ? Math.min(t, C.coda.t) : t;
    while (cam.t + dt <= stop + 1e-6) { cam.t += dt; step(cam.t); }
    if (!cam.pose) step(Math.max(cam.t, first(C)));
    return {ch: C, credits, pose: cam.pose, inCoda: !credits && !!C.coda && t >= C.coda.t};
  }
  return {at, get chapter() { return C; }, dt};
}
