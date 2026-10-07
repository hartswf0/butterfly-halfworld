// THE OBJECT KIT — the small things of Atlantis, all drawn from one grammar.
//   THE LINE  a salt-white band at 4/10 of every object's height: the flood, remembered at every scale
//   THE SEAM  a cyan kintsugi seam: repair, and light
//   ceramic for what you touch · verdigris iron for what holds up · cyan only for light and repair · salt only for memory · rings for thresholds
// Each object is a list of parts; the kit viewer builds them as meshes, the city as instanced geometry. One design, every use.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const TOKENS = {
  salt: '#ecebe4', ceramic: '#f1eee7', seam: '#5fe8ff', verdigris: '#5f9c8a', iron: '#23292e', brick: '#7a3426',
  tide: '#1c3a44', sodium: '#ffb35c', neon: '#ff4fd8', stone: '#8c8e8c', ink: '#ece6da',
};
const C = k => new THREE.Color(TOKENS[k] || k);
const cyl = (r1, r2, h, s = 16) => new THREE.CylinderGeometry(r1, r2, h, s).translate(0, h / 2, 0);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
const at = (g, x, y, z, rx = 0, ry = 0, rz = 0) => { g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g; };
const P = (geo, col, glow = 0) => ({geo, col, glow});
const LINE = (r, y, s = 16) => P(at(new THREE.CylinderGeometry(r * 1.04, r * 1.04, Math.max(0.03, y * 0.035), s), 0, y, 0), 'salt');   // the line, as a band
const SEAM = (r, y) => P(at(new THREE.TorusGeometry(r * 1.01, Math.max(0.012, r * 0.05), 6, 24), 0, y, 0, Math.PI / 2), 'seam', 1);

export const KIT = {
  'tide lamp': {h: 5.6, about: 'The street lamp. A verdigris column; a ceramic sleeve at hand height carrying the Line; a ceramic ring for a head (a threshold, like the Light Gate) with the Seam inside it and the lamp in its eye. It brightens for a minute when the gates rise.',
    parts: () => [P(cyl(0.09, 0.12, 5.2, 10), 'verdigris'), P(cyl(0.16, 0.16, 1.4, 16).translate(0, 1.4, 0), 'ceramic'), LINE(0.16, 2.24), P(cyl(0.2, 0.24, 0.3, 16), 'iron'),
      P(at(new THREE.TorusGeometry(0.42, 0.07, 10, 32), 0, 5.4, 0), 'ceramic'), P(at(new THREE.TorusGeometry(0.35, 0.02, 6, 32), 0, 5.4, 0), 'seam', 1), P(at(new THREE.CircleGeometry(0.3, 24), 0, 5.4, 0), 'sodium', 2), P(at(new THREE.CircleGeometry(0.3, 24), 0, 5.4, 0, 0, Math.PI), 'sodium', 2)]},
  'line post': {h: 4.6, about: 'The flood datum, set in the street. A ceramic post whose salt band sits at exactly +4.00 m above the sea, wherever the post stands, so the Line on every wall can be read against it. Marks for the Shore, the Old Centre and the Fall are cut into it.',
    parts: () => [P(cyl(0.14, 0.17, 4.6, 12), 'ceramic'), P(cyl(0.2, 0.22, 0.25, 12), 'iron'), P(cyl(0.18, 0.18, 0.12, 12).translate(0, 4.6, 0), 'verdigris'),
      ...[0.9, 1.7, 2.6].map(y => P(at(new THREE.BoxGeometry(0.3, 0.02, 0.3), 0, y, 0), 'iron')), P(at(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 12), 0, 4.6, 0), 'seam', 1)], datum: true},
  'bollard': {h: 1.0, about: 'Ceramic, verdigris-capped, the Line at 0.4 m. Along every quay, at every pedestrian edge. Sailors tie off on them; the salt band is where the spray dries.',
    parts: () => [P(cyl(0.16, 0.19, 0.9, 14), 'ceramic'), LINE(0.18, 0.4, 14), P(cyl(0.2, 0.2, 0.1, 14).translate(0, 0.9, 0), 'verdigris'), P(at(new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0, 1.0, 0), 'verdigris')]},
  'bench': {h: 0.9, about: 'A ceramic slab on two iron frames, a seam drawn across its seat where it was once broken and mended. Faces the water wherever there is water.',
    parts: () => [P(at(new THREE.BoxGeometry(2.0, 0.09, 0.5), 0, 0.46, 0), 'ceramic'), P(at(new THREE.BoxGeometry(2.0, 0.42, 0.07), 0, 0.72, 0.24, -0.18), 'ceramic'),
      P(at(new THREE.BoxGeometry(0.02, 0.012, 0.5), 0.3, 0.51, 0, 0, 0.5), 'seam', 1), ...[-0.85, 0.85].map(x => P(at(new THREE.BoxGeometry(0.06, 0.46, 0.46), x, 0.23, 0), 'iron'))]},
  'tide board': {h: 2.7, about: 'At every pier, stop and square: the next two gates and their heights, rising or falling, live. The Tide Office posts nothing else. Mono type, salt on tide blue, a cyan seam under the gate times.',
    parts: () => [P(cyl(0.06, 0.06, 2.7, 8).translate(-0.7, 0, 0), 'iron'), P(cyl(0.06, 0.06, 2.7, 8).translate(0.7, 0, 0), 'iron'), P(at(new THREE.BoxGeometry(1.6, 1.1, 0.08), 0, 1.4, 0), 'ceramic'),
      P(at(new THREE.TorusGeometry(0.22, 0.04, 8, 24), 0, 2.45, 0), 'ceramic')], board: true},
  'shelter': {h: 2.9, about: 'The bus shelter, rebuilt as the city\'s smallest building: a curved ceramic canopy with a seam of light along its edge, glass behind, a ceramic bench, the route on a ring.',
    parts: () => { const sh = new THREE.Shape(); sh.absarc(0, 0, 2.4, Math.PI * 0.18, Math.PI * 0.82, false); sh.absarc(0, 0, 2.28, Math.PI * 0.82, Math.PI * 0.18, true);
      const canopy = new THREE.ExtrudeGeometry(sh, {depth: 4.2, bevelEnabled: false}); canopy.translate(0, 0.65, -2.1); canopy.rotateY(Math.PI / 2);
      return [P(canopy, 'ceramic'), P(at(new THREE.BoxGeometry(4.2, 0.03, 0.03), 0, 2.98, 1.1), 'seam', 1), P(at(new THREE.BoxGeometry(4.0, 2.3, 0.04), 0, 1.25, -0.8), 'glass'),
        ...[-2, 2].map(x => P(cyl(0.05, 0.05, 2.9, 8).translate(x, 0, -0.8), 'verdigris')), P(at(new THREE.BoxGeometry(2.6, 0.08, 0.45), 0, 0.46, -0.45), 'ceramic'),
        P(cyl(0.04, 0.04, 2.8, 6).translate(2.4, 0, 0.6), 'iron'), P(at(new THREE.TorusGeometry(0.28, 0.05, 8, 24), 2.4, 2.95, 0.6), 'ceramic'), P(at(new THREE.CircleGeometry(0.24, 20), 2.4, 2.95, 0.6), 'tide')]; }},
  'poem plaque': {h: 1.3, about: 'Where a poem happens, a ceramic plate on a verdigris stand carries its number and its first line in serif italic. The line is set at 4/10 of the plate.',
    parts: () => [P(cyl(0.05, 0.07, 1.0, 8), 'verdigris'), P(at(new THREE.BoxGeometry(0.9, 0.6, 0.05), 0, 1.0, 0, -0.35), 'ceramic')], plaque: true},
  'ward sign': {h: 3.2, about: 'At each ward boundary, a post and a disc: the ward number in mono, the district\'s name, and the district\'s own colour as a band (the palettes are cut from each district\'s footage).',
    parts: () => [P(cyl(0.05, 0.06, 3.2, 8), 'iron'), P(at(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 28), 0, 2.8, 0, Math.PI / 2), 'ceramic'), P(at(new THREE.TorusGeometry(0.45, 0.03, 6, 28), 0, 2.8, 0.03), 'seam', 1)], ward: true},
  'salt fountain': {h: 1.6, about: 'A ring basin of ceramic and a single jet. The water is from the bay; on First Tide the Salt Guild fills cups here before the climb.',
    parts: () => [P(at(new THREE.TorusGeometry(1.2, 0.18, 12, 40), 0, 0.5, 0, Math.PI / 2), 'ceramic'), P(cyl(1.1, 1.1, 0.4, 32), 'stone'), P(at(new THREE.CircleGeometry(1.08, 32), 0, 0.42, 0, -Math.PI / 2), 'tide'),
      P(cyl(0.08, 0.1, 1.2, 8), 'verdigris'), P(at(new THREE.ConeGeometry(0.25, 0.9, 12, 1, true), 0, 1.6, 0), 'glass')]},
  'planter': {h: 1.4, about: 'A ceramic tub with the Line and a seam, an agave or a jacaranda sapling. The city plants what the shots show: jacarandas from the high city, agaves from the desert edge.',
    parts: () => [P(cyl(0.5, 0.42, 0.7, 20), 'ceramic'), LINE(0.47, 0.28, 20), P(cyl(0.46, 0.46, 0.05, 20).translate(0, 0.66, 0), 'brick'),
      ...[0, 1, 2, 3, 4, 5, 6].map(i => P(at(new THREE.ConeGeometry(0.06, 0.8, 4), Math.cos(i) * 0.15, 0.95, Math.sin(i) * 0.15, 0, i, 0.5 * Math.cos(i * 2)), 'verdigris'))]},
  'archive frame': {h: 1.8, about: 'The Archive comes down to the street: on a few walls in every district, a ceramic-framed panel shows one of the canon\'s frames, the shot that was taken nearest that spot. The Keepers move them at First Tide.',
    parts: () => [P(at(new THREE.BoxGeometry(1.5, 1.0, 0.06), 0, 1.6, 0), 'ceramic'), P(at(new THREE.BoxGeometry(1.5, 0.025, 0.07), 0, 1.6 + 0.4 * 0.5 - 0.1, 0.01), 'salt')], frame: true},
};

const MAT = {};
export function materialFor(col, glow) {
  const k = col + glow; if (MAT[k]) return MAT[k];
  const c = C(col); const m = col === 'glass' ? new THREE.MeshStandardMaterial({color: 0xbfe8f0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.3, depthWrite: false})
    : new THREE.MeshStandardMaterial({color: c, roughness: col === 'ceramic' || col === 'salt' ? 0.38 : col === 'verdigris' ? 0.5 : 0.6, metalness: col === 'verdigris' || col === 'iron' ? 0.5 : 0.02, emissive: glow ? c : 0x000000, emissiveIntensity: glow ? 1.6 : 0});
  if (glow) m.userData.glow = glow; MAT[k] = m; return m;
}
export function buildObject(name) {
  const g = new THREE.Group(); for (const p of KIT[name].parts()) { const m = new THREE.Mesh(p.geo, materialFor(p.col, p.glow)); m.castShadow = m.receiveShadow = p.col !== 'glass'; g.add(m); } return g;
}
// for the city: merged vertex-coloured bodies + a merged glowing part, instanced together
export function kitGeometry(name) {
  const body = [], glow = [];
  for (const p of KIT[name].parts()) { if (p.col === 'glass') continue; const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo).clone(); const c = C(p.col), a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k); (p.glow ? glow : body).push(g); }
  return {body: mergeGeometries(body), glow: glow.length ? mergeGeometries(glow) : null};
}

// the emblem: a ring (the gates, the tide), cut by the Line at 4/10, crossed by a seam — as SVG, and as a canvas for textures
export const EMBLEM_SVG = `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="42" fill="none" stroke="${TOKENS.ceramic}" stroke-width="7"/>
<line x1="8" y1="66.8" x2="92" y2="66.8" stroke="${TOKENS.salt}" stroke-width="4"/><path d="M58 9 L52 30 L60 41 L49 58 L55 70 L47 91" fill="none" stroke="${TOKENS.seam}" stroke-width="3" stroke-linecap="round"/></svg>`;
export function drawEmblem(x, cx, cy, r, ink = TOKENS.ceramic) {
  x.save(); x.strokeStyle = ink; x.lineWidth = r * 0.16; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
  x.strokeStyle = TOKENS.salt; x.lineWidth = r * 0.09; x.beginPath(); x.moveTo(cx - r * 1.0, cy + r * 0.4); x.lineTo(cx + r * 1.0, cy + r * 0.4); x.stroke();
  x.strokeStyle = TOKENS.seam; x.lineWidth = r * 0.07; x.lineCap = 'round'; x.beginPath(); [[0.19, -0.98], [0.05, -0.48], [0.24, -0.21], [-0.02, 0.19], [0.12, 0.48], [-0.07, 0.98]].forEach(([a, b], i) => i ? x.lineTo(cx + a * r, cy + b * r) : x.moveTo(cx + a * r, cy + b * r)); x.stroke(); x.restore();
}
// the tide board's face: one canvas, every board shares it, redrawn once a minute
export function tideBoardTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 352; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.userData.draw = (now, tideAt) => { const x = c.getContext('2d'); x.fillStyle = TOKENS.tide; x.fillRect(0, 0, 512, 352); drawEmblem(x, 446, 64, 34);
    x.fillStyle = TOKENS.salt; x.font = '600 26px ui-monospace, Menlo, monospace'; x.fillText('THE TIDE OFFICE', 28, 52); x.font = '18px ui-monospace, Menlo, monospace'; x.fillStyle = '#9fb8c0'; x.fillText('NEXT TWO GATES', 28, 86);
    const period = 12.42 * 3600e3, phase = ((now.getTime() / period) % 1 + 1) % 1, nextHigh = new Date(now.getTime() + ((0.25 - phase + 1) % 1) * period);
    for (let i = 0; i < 2; i++) { const d = new Date(nextHigh.getTime() + i * period), hh = String(d.getUTCHours() - 4 < 0 ? d.getUTCHours() + 20 : d.getUTCHours() - 4).padStart(2, '0'), mm = String(d.getUTCMinutes()).padStart(2, '0');
      x.fillStyle = TOKENS.salt; x.font = '700 64px ui-monospace, Menlo, monospace'; x.fillText(`${hh}:${mm}`, 28, 160 + i * 92); x.font = '22px ui-monospace, Menlo, monospace'; x.fillStyle = TOKENS.seam; x.fillText('+0.90 m', 250, 136 + i * 92); x.fillStyle = '#9fb8c0'; x.fillText('GATES UP', 250, 162 + i * 92); }
    x.fillStyle = TOKENS.seam; x.fillRect(28, 182, 456, 3);
    const h = tideAt(now), rising = Math.cos(2 * Math.PI * now.getTime() / period) > 0; x.fillStyle = '#9fb8c0'; x.font = '20px ui-monospace, Menlo, monospace'; x.fillText(`NOW ${h >= 0 ? '+' : ''}${h.toFixed(2)} m · ${rising ? 'FLOODING ↑' : 'EBBING ↓'}`, 28, 330); t.needsUpdate = true; };
  return t;
}
