// STREET NAMES — every road in Atlantis is named, deterministically, from the city's own lore:
// spines take the poems' titles (Nevermore Quay, Hot Minute Row), arterials the institutions and trades (Glaziers' Row, Tide Office Street),
// highways the gates, the avenue its procession, and the 1,600 small streets a word from the harbour's working life and a kind
// that suits their district (lanes and steps in the old town, rows in the rowhouses, yards in industry, quays on the water).
// Plates (ceramic, mono capitals, the emblem) stand at the street corners near you; the strip tells you where you are.
import * as THREE from 'three';
import {drawEmblem, TOKENS} from './kit.mjs';

const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const WORDS = ['Wick', 'Cooper', 'Anchor', 'Lantern', 'Brine', 'Chalk', 'Cistern', 'Quarry', 'Mercy', 'Hollow', 'Tern', 'Gull', 'Ash', 'Oyster', 'Kiln', 'Tallow', 'Rope', 'Ledger',
  'Bell', 'Pewter', 'Copper', 'Sail', 'Net', 'Pilot', 'Lamp', 'Loom', 'Drawer', 'Hallway', 'Ladder', 'Glass', 'Kettle', 'Mason', 'Cinder', 'Basin', 'Marrow', 'Thimble', 'Plaster',
  'Velvet', 'Ember', 'Harbour', 'Ferry', 'Spindle', 'Ink', 'Linen', 'Slate', 'Clay', 'Bolt', 'Rivet', 'Mooring', 'Hymn', 'Reel', 'Stair', 'Window', 'Salt', 'Seam', 'Line'];
const KINDS = {'old town': ['Lane', 'Alley', 'Steps', 'Court'], rowhouses: ['Street', 'Row', 'Street', 'Mews'], industrial: ['Yard', 'Road', 'Works Road'], waterfront: ['Quay', 'Wharf', 'Street'],
  nightlife: ['Street', 'Alley', 'Arcade'], downtown: ['Street', 'Place', 'Street'], suburb: ['Avenue', 'Close', 'Drive'], 'ruin field': ['Walk', 'Path', 'Way']};
const ART = ['Tide Office Street', "Glaziers' Row", "Keepers' Walk", 'Salt Street', 'Sugar Road', "Ferrymen's Way", 'Line Street', 'Seam Lane', 'Gate Street', 'Archive Road',
  "Wardens' Street", 'Resonance Road', 'Lamplighters Street', 'Flood Street', 'Ceramic Row', 'Relighting Road', 'First Tide Street', 'Kintsugi Lane', 'Datum Road', 'Two Gates Street',
  'Old Shore Road', 'Fall Street', 'Resurrection Avenue', 'Boroughs Road', 'Council Street', 'Pier Road', 'Halo Street', 'Skiff Lane', 'Maglev Street', 'White Trade Row'];

export function nameRoads(C) {
  const out = [], poems = C.meta.poems, dist = C.meta.districts.filter(d => !d.natural);
  let a = 0, hw = 0;
  C.roads.forEach(([cls, born, f], i) => { const mx = f[Math.floor(f.length / 4) * 2], my = f[Math.floor(f.length / 4) * 2 + 1];
    let name;
    if (cls === 4) name = 'the Processional Avenue';
    else if (cls === 3) { const p = poems.reduce((b, q) => Math.hypot(q.x - mx, q.y - my) < Math.hypot(b.x - mx, b.y - my) ? q : b); name = `${p.title} ${['Quay', 'Row', 'Walk', 'Parade'][i % 4]}`; }
    else if (cls === 2) name = ['the Gate Road', 'the Tide Road', 'the Salt Road', 'the Halo Road', 'the Line Road', 'the Engine Road', 'the Archive Road'][hw++ % 7];
    else if (cls === 1) name = ART[a++ % ART.length];
    else { const d = dist.reduce((b, q) => Math.hypot(q.x - mx, q.y - my) < Math.hypot(b.x - mx, b.y - my) ? q : b, dist[0]); const ks = KINDS[d.type] || ['Street'];
      name = `${WORDS[Math.floor(hash(i, 3) * WORDS.length)]} ${ks[Math.floor(hash(i, 5) * ks.length)]}`; }
    out.push({name, cls, born, f}); });
  return out;
}

export function makeNames(scene, C, S) {
  const R = nameRoads(C), root = new THREE.Group(); scene.add(root);
  const cache = new Map(), pool = [], POOL = 36;
  const matFor = name => { if (cache.has(name)) return cache.get(name); const c = document.createElement('canvas'); c.width = 512; c.height = 112; const x = c.getContext('2d');
    x.fillStyle = TOKENS.ceramic; x.fillRect(0, 0, 512, 112); x.fillStyle = TOKENS.tide; x.fillRect(0, 0, 112, 112); drawEmblem(x, 56, 56, 34);
    x.fillStyle = TOKENS.salt; x.fillRect(112, 112 * 0.6, 400, 4);                 // the Line, even on a street plate
    x.fillStyle = '#1c2024'; x.font = `600 ${name.length > 18 ? 30 : 38}px ui-monospace, Menlo, monospace`; x.textBaseline = 'middle'; x.fillText(name.toUpperCase(), 130, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({map: t, roughness: 0.45, side: THREE.DoubleSide}); cache.set(name, m); return m; };
  const postMat = new THREE.MeshStandardMaterial({color: TOKENS.verdigris, roughness: 0.5, metalness: 0.5});
  for (let i = 0; i < POOL; i++) { const g = new THREE.Group(), post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 3.0, 8), postMat); post.position.y = 1.5; g.add(post);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.33), matFor('')); plate.position.set(0.75, 2.75, 0); g.add(plate); g.visible = false; g.userData.plate = plate; root.add(g); pool.push(g); }
  let era = 5, lastKey = '';
  return {
    roads: R,
    setEra(e) { era = e; lastKey = ''; },
    at(x, y) {                                               // the street you are on: the nearest named road within 25 m
      let best = null, bd = 25 * 25;
      for (const r of R) { if (r.born > era) continue; const f = r.f; for (let i = 0; i < f.length - 2; i += 2) { const ax = f[i], ay = f[i + 1], bx = f[i + 2], by = f[i + 3], vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy || 1;
        const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L)), dx = ax + vx * t - x, dy = ay + vy * t - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = r; } } }
      return best;
    },
    update(fx, fy) {
      const key = Math.round(fx / 60) + ',' + Math.round(fy / 60) + era; if (key === lastKey) return; lastKey = key;
      const cand = [];
      for (const r of R) { if (r.born > era || r.cls === 2) continue; const f = r.f, sx = f[0], sy = f[1], d = Math.hypot(sx - fx, sy - fy); if (d < 320) cand.push([d, r, sx, sy, f[2] - sx, f[3] - sy]); }
      cand.sort((a, b) => a[0] - b[0]);
      pool.forEach((g, i) => { const c = cand[i]; if (!c) { g.visible = false; return; } const [, r, sx, sy, vx, vy] = c, L = Math.hypot(vx, vy) || 1, nx = -vy / L, ny = vx / L, w = (r.cls === 1 ? 9 : r.cls >= 3 ? 8 : 5.5);
        const x = sx + nx * w + vx / L * 3, y = sy + ny * w + vy / L * 3; g.position.set(x, Math.max(S.ground(x, y), 0.3), y); g.rotation.y = -Math.atan2(vy, vx);
        g.userData.plate.material = matFor(r.name); g.visible = true; });
    },
  };
}
