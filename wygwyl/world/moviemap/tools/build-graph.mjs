#!/usr/bin/env node
// THE STREET PLAN — the road graph the camera car drives, the names on the corners, and the lore set out on the street.
// Deterministic: city3d's roads.json + city.json + cover.bin → moviemap/plan.json. Same city in, same plan out.
//   node wygwyl/world/moviemap/tools/build-graph.mjs
// 1. snap: road ends that meet (or end on another road's side) become one intersection
// 2. cut: every road between intersections is a block (an edge); blocks chain into named ways (straightest continuation)
// 3. the disc: the blocks the camera car drives — spines, the processional avenue, arterials, the poem neighbourhoods
// 4. the steps: a frame every ~3 m (the "ten feet") down the centre of each disc block, with its heading
// 5. legibility: street-name blades, ward / precinct lines, zoning, bus stops with routes, highway shields, alleys, piers, cafés and their menus, historic markers
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url)), MM = join(HERE, '..'), CITY = join(MM, '..', 'city3d');
const meta = JSON.parse(readFileSync(join(CITY, 'city.json'), 'utf8'));
const roadsRaw = JSON.parse(readFileSync(join(CITY, 'roads.json'), 'utf8'));
const cover = new Uint8Array(readFileSync(join(CITY, 'cover.bin')));
const h16 = new Int16Array(readFileSync(join(CITY, 'height.bin')).buffer.slice(0));
const height = Float32Array.from(h16, v => v / 10);
const bb = readFileSync(join(CITY, 'buildings.f32')); const B = new Float32Array(bb.buffer, bb.byteOffset, bb.byteLength / 4);
const {nx, ny, cell} = meta;
const STEP = 3.0;                                   // metres between frames — Aspen's ten feet
const R1 = v => Math.round(v * 10) / 10, R3 = v => Math.round(v * 1000) / 1000;
const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const strHash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

// the ground as city3d's sampler reads it (the mesh's own triangles)
function ground(x, y) { const fx = Math.min(Math.max(x / cell, 0), nx - 1.001), fy = Math.min(Math.max(y / cell, 0), ny - 1.001), i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, k = j * nx + i, h = height;
  return a + b <= 1 ? h[k] + a * (h[k + 1] - h[k]) + b * (h[k + nx] - h[k]) : h[k + nx + 1] + (1 - a) * (h[k + nx] - h[k + nx + 1]) + (1 - b) * (h[k + 1] - h[k + nx + 1]); }
const coverAt = (x, y) => cover[Math.min(ny - 1, Math.max(0, Math.round(y / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.round(x / cell)))];

// ——— wards: the voting districts, exactly as city3d draws them (every urban cell votes with its nearest district) ———
const URBAN_BORN = {6: 1, 7: 2, 8: 1, 12: 3, 13: 1, 14: 3};
const urban = meta.districts.filter(d => !d.natural);
function wardAt(x, y) {
  const i = Math.min(nx - 1, Math.max(0, Math.round(x / cell))), j = Math.min(ny - 1, Math.max(0, Math.round(y / cell)));
  if (!URBAN_BORN[cover[j * nx + i]]) return null;
  let best = -1, bd = 2.2e6; urban.forEach((d, q) => { const dd = (d.x - i * cell) ** 2 + (d.y - j * cell) ** 2; if (dd < bd) { bd = dd; best = q; } });
  if (best < 0) return null; const d = urban[best];
  // precincts: each ward cut into four by the compass around its centre (NE, SE, SW, NW)
  const a = Math.atan2(i * cell - d.x, -(j * cell - d.y)); const p = 1 + (Math.floor(((a + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 2)) % 4);
  return {ward: best + 1, precinct: p, name: d.name};
}
const ZONES = {6: ['C-1', 'historic core'], 7: ['R-6', 'rowhouse residential'], 8: ['B-5', 'central business'], 12: ['R-1', 'detached residential'], 13: ['M-3', 'maritime industrial'], 14: ['M-2', 'heavy industrial'], 9: ['OS', 'ruins kept as open space'], 11: ['OS-F', 'fire-scarred open space'], 2: ['W', 'wetland'], 1: ['W', 'beach']};

// ——— 1. snap ———
const roads = roadsRaw.map(([cls, born, f], ri) => { const p = []; for (let i = 0; i < f.length; i += 2) p.push([f[i], f[i + 1]]); return {ri, cls, born, p}; });
const G = 8, segGrid = new Map(), gk = (x, y) => `${Math.floor(x / G)},${Math.floor(y / G)}`;
function indexSegs() { segGrid.clear(); roads.forEach((r, q) => r.p.forEach((a, k) => { if (k === r.p.length - 1) return; const b = r.p[k + 1];
  const x0 = Math.min(a[0], b[0]) - 4, x1 = Math.max(a[0], b[0]) + 4, y0 = Math.min(a[1], b[1]) - 4, y1 = Math.max(a[1], b[1]) + 4;
  for (let gx = Math.floor(x0 / G); gx <= Math.floor(x1 / G); gx++) for (let gy = Math.floor(y0 / G); gy <= Math.floor(y1 / G); gy++) { const key = gx + ',' + gy; (segGrid.get(key) || segGrid.set(key, []).get(key)).push([q, k]); } })); }
indexSegs();
// an end that stops on the side of another road splits that road there (a T)
const inserts = [];
for (const r of roads) for (const e of [r.p[0], r.p[r.p.length - 1]]) {
  let best = null; for (const [q, k] of segGrid.get(gk(e[0], e[1])) || []) { if (q === roads.indexOf(r)) continue; const o = roads[q], a = o.p[k], b = o.p[k + 1];
    const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy; if (!L2) continue; const t = Math.max(0, Math.min(1, ((e[0] - a[0]) * dx + (e[1] - a[1]) * dy) / L2));
    const px = a[0] + dx * t, py = a[1] + dy * t, d = Math.hypot(e[0] - px, e[1] - py); if (d > 3.5) continue;
    const L = Math.sqrt(L2), da = t * L, db = (1 - t) * L; if (da < 2 || db < 2) continue;             // close to a vertex: the vertex snap handles it
    if (!best || d < best.d) best = {q, k, t, d, px, py}; }
  if (best) { inserts.push(best); e[0] = best.px; e[1] = best.py; }
}
inserts.sort((a, b) => a.q - b.q || b.k - a.k || b.t - a.t);
for (const s of inserts) roads[s.q].p.splice(s.k + 1, 0, [s.px, s.py]);
// union every vertex within 2.5 m
const verts = []; roads.forEach((r, q) => r.p.forEach((pt, k) => verts.push({q, k, x: pt[0], y: pt[1], end: k === 0 || k === r.p.length - 1})));
const par = verts.map((_, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
const vg = new Map(); verts.forEach((v, i) => { const key = gk(v.x, v.y); (vg.get(key) || vg.set(key, []).get(key)).push(i); });
verts.forEach((v, i) => { const gx = Math.floor(v.x / G), gy = Math.floor(v.y / G);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (const j of vg.get((gx + a) + ',' + (gy + b)) || []) { if (j <= i) continue; const w = verts[j];
    if (Math.hypot(v.x - w.x, v.y - w.y) < 2.5 && (v.q !== w.q || Math.abs(v.k - w.k) > 2)) par[find(i)] = find(j); } });
const clusters = new Map(); verts.forEach((v, i) => { const c = find(i); (clusters.get(c) || clusters.set(c, []).get(c)).push(v); });
const isNode = new Map(); for (const [c, vs] of clusters) isNode.set(c, vs.some(v => v.end) || new Set(vs.map(v => v.q)).size > 1);
const vid = new Map(); verts.forEach((v, i) => vid.set(v.q + ':' + v.k, find(i)));

// ——— 2. cut into blocks ———
const nodeIx = new Map(), nodes = [];
function nodeOf(c) { if (nodeIx.has(c)) return nodeIx.get(c); const vs = clusters.get(c); const n = {id: nodes.length, x: vs.reduce((s, v) => s + v.x, 0) / vs.length, y: vs.reduce((s, v) => s + v.y, 0) / vs.length, e: []}; nodes.push(n); nodeIx.set(c, n.id); return n.id; }
const edges = [];
roads.forEach((r, q) => {
  let cur = [r.p[0]], a = nodeOf(vid.get(q + ':0'));
  for (let k = 1; k < r.p.length; k++) { const c = vid.get(q + ':' + k); cur.push(r.p[k]);
    if (isNode.get(c) || k === r.p.length - 1) { const b = nodeOf(c); const A = nodes[a], Bn = nodes[b];
      const pts = [[A.x, A.y], ...cur.slice(1, -1), [Bn.x, Bn.y]];
      let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (a !== b && len > 1.5) edges.push({id: edges.length, a, b, ri: r.ri, cls: r.cls, born: r.born, pts, len});
      a = b; cur = [r.p[k]]; } }
});
// one block per pair of corners per class (overlapping duplicates are dropped)
const seen = new Set(); for (const e of edges) { const k = [Math.min(e.a, e.b), Math.max(e.a, e.b), e.cls, Math.round(e.len)].join(); if (seen.has(k)) e.dup = true; seen.add(k); }
const E = edges.filter(e => !e.dup); E.forEach((e, i) => e.id = i);
nodes.forEach(n => n.e = []); E.forEach(e => { nodes[e.a].e.push(e.id); nodes[e.b].e.push(e.id); });
// heading of an edge leaving node n (unit vector), from the first ~12 m
function leave(e, n) { const P = e.a === n ? e.pts : [...e.pts].reverse(); let i = 1, acc = 0; while (i < P.length - 1 && (acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])) < 12) i++;
  const dx = P[i][0] - P[0][0], dy = P[i][1] - P[0][1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; }

// ——— ways: blocks chained through each corner by the straightest continuation of the same class ———
const wayOf = new Int32Array(E.length).fill(-1), next = new Map();
for (const n of nodes) { const cand = [];
  for (let i = 0; i < n.e.length; i++) for (let j = i + 1; j < n.e.length; j++) { const ei = E[n.e[i]], ej = E[n.e[j]]; if (ei.cls !== ej.cls || ei.id === ej.id) continue;
    const u = leave(ei, n.id), v = leave(ej, n.id), straight = -(u[0] * v[0] + u[1] * v[1]); if (straight > Math.cos(38 * Math.PI / 180)) cand.push([straight, ei.id, ej.id]); }
  cand.sort((a, b) => b[0] - a[0]); const used = new Set();
  for (const [, i, j] of cand) { if (used.has(i) || used.has(j)) continue; used.add(i); used.add(j); next.set(n.id + ':' + i, j); next.set(n.id + ':' + j, i); } }
const ways = [];
for (const e0 of E) { if (wayOf[e0.id] >= 0) continue; const w = {id: ways.length, cls: e0.cls, edges: [e0.id]}; wayOf[e0.id] = w.id;
  for (const [start, dirFront] of [[e0.b, true], [e0.a, false]]) { let n = start, cur = e0.id;
    for (;;) { const nx2 = next.get(n + ':' + cur); if (nx2 === undefined || wayOf[nx2] >= 0) break; wayOf[nx2] = w.id; dirFront ? w.edges.push(nx2) : w.edges.unshift(nx2); const ne = E[nx2]; n = ne.a === n ? ne.b : ne.a; cur = nx2; } }
  w.len = w.edges.reduce((s, i) => s + E[i].len, 0); w.born = Math.min(...w.edges.map(i => E[i].born));
  // house numbers run along the way: each block knows where it starts (w0) and whether it runs with the way (a→b) or against it
  { let acc = 0; for (let k = 0; k < w.edges.length; k++) { const e = E[w.edges[k]], nx2 = E[w.edges[k + 1]], pv = E[w.edges[k - 1]];
      const fwd = nx2 ? (e.b === nx2.a || e.b === nx2.b) : pv ? (e.a === pv.a || e.a === pv.b) : true; e.wr = fwd ? 0 : 1; e.w0 = acc; acc += e.len; } }
  const mid = E[w.edges[w.edges.length >> 1]]; const mp = mid.pts[mid.pts.length >> 1]; w.x = mp[0]; w.y = mp[1];
  ways.push(w); }

// ——— names ———
const POOLS = {
  nightlife: ['Neon', 'Wharf', 'Anchor', 'Lantern', 'Velvet', 'Mercury', 'Juke', 'Siren', 'Ember', 'Bass', 'Afterhours', 'Mirror', 'Sailor', 'Tinsel', 'Marquee', 'Jukebox'],
  industrial: ['Mill', 'Forge', 'Sugar', 'Coal', 'Foundry', 'Kiln', 'Cinder', 'Tannery', 'Rail', 'Ropewalk', 'Boiler', 'Slag', 'Sprocket', 'Tin', 'Gasworks', 'Spindle'],
  waterfront: ['Harbor', 'Tide', 'Pier', 'Gull', 'Fells', 'Boat', 'Salt', 'Oyster', 'Brine', 'Mooring', 'Ballast', 'Cutter', 'Skipjack', 'Crab', 'Breakwater', 'Buoy'],
  downtown: ['Exchange', 'Bank', 'Calvert', 'Charter', 'Mercer', 'Guild', 'Ledger', 'Crown', 'Ballot', 'Market', 'Courthouse', 'Telegraph', 'Hanover', 'Saratoga', 'Lexington', 'Mint'],
  'ruin field': ['Ash', 'Fallow', 'Cairn', 'Hollow', 'Bramble', 'Moss', 'Shard', 'Relic', 'Furrow', 'Lintel', 'Threshold', 'Cistern', 'Plinth', 'Rubble', 'Fern', 'Thistle'],
  suburb: ['Linden', 'Elm', 'Jacaranda', 'Laurel', 'Hawthorn', 'Maple', 'Willow', 'Aster', 'Juniper', 'Birch', 'Dogwood', 'Magnolia', 'Sycamore', 'Clover', 'Sumac', 'Larch'],
  'old town': ['Chapel', 'Cooper', 'Lamplighter', 'Net', 'Candle', 'Bell', 'Weaver', 'Saddler', 'Thimble', 'Chandler', 'Tallow', 'Bakehouse', 'Psalter', 'Vesper', 'Lantern', 'Cobbler'],
  rowhouses: ['Formstone', 'Marble Step', 'Stoop', 'Screen', 'Arabber', 'Painted', 'Hon', 'Rowhouse', 'Bay Window', 'Washline', 'Porch', 'Cornice', 'Transom', 'Dormer', 'Lintel', 'Sash'],
};
const POEM_ROOT = {'01': 'Out of Life', '02': 'Flashing Lights', '03': 'Engagement', '04': 'Nevermore', '05': 'Bloodline', '06': 'Resurrection', '07': 'Turn Me Up', '08': 'Newly Single', '09': 'Yet Heard', '10': 'Magic Ride', '11': 'New Day', '12': 'Reunion', '13': 'Win My Heart', '14': 'Hot Minute'};
const LM_ROOT = l => ({'the chapel · the white temple': 'Chapel', 'The Severn · the tower and its fire escapes': 'Severn', 'Washington Monument, Mount Vernon': 'Mount Vernon', 'Monumento a la Revolución': 'Revolución',
  'Bromo Seltzer Tower': 'Bromo', 'Domino Sugars sign': 'Domino', 'Angel of Independence': 'Angel', 'Torre Latinoamericana': 'Torre', 'Pyramid of the Sun': 'Sun Pyramid', 'radio mast': 'Mast Hill', 'phone booth': 'Booth',
  'neon sign': 'Neon Sign', 'palm row': 'Palm', 'lone tree': 'Lone Tree', 'lone peak': 'Peak', 'water tower': 'Water Tower', 'clock tower': 'Clock Tower', 'motorcycle': 'Motor', 'smokestacks': 'Stack'})[l.name] || l.name.replace(/^the /, '').replace(/\b\w/g, c => c.toUpperCase());
const districtAt = (x, y) => { const w = wardAt(x, y); if (w) return urban[w.ward - 1]; let b = null, bd = 1e18; for (const d of urban) { const dd = (d.x - x) ** 2 + (d.y - y) ** 2; if (dd < bd) { bd = dd; b = d; } } return b; };
const BALTIMERE = ['Pratt', 'Lombard', 'Eutaw', 'Paca', 'Greene', 'Howard', 'Fayette', 'Biddle', 'Preston', 'Chase', 'Read', 'Madison', 'Monument', 'Centre', 'Mulberry', 'Franklin', 'Fleet', 'Aliceanna', 'Thames', 'Lancaster', 'Fawn', 'Albemarle', 'Exeter', 'Caroline', 'Bond', 'Wolfe', 'Durham', 'Chester', 'Castle', 'Linwood', 'Ellwood', 'Belnord', 'Streeper', 'Potomac', 'Montford', 'Collington', 'Port', 'Bethel', 'Dallas', 'Spring', 'Washington', 'Patterson', 'Luzerne', 'Kenwood', 'Rose', 'Milton', 'Lakewood', 'Glover', 'Gough', 'Bank', 'Eastern', 'Hudson', 'Toone', 'Dillon', 'Boston', 'Elliott', 'Foster', 'Odonnell', 'Clinton', 'Haven', 'Conkling', 'Ponca', 'Oldham', 'Robinson', 'Curley', 'Decker', 'Bouldin', 'Highland', 'Grundy', 'Hampstead', 'Mosher', 'Lanvale', 'Lafayette', 'Mount Royal', 'Whitelock', 'Druid', 'Calhoun', 'Gilmor', 'Mount', 'Stricker', 'Carey', 'Fulton', 'Pulaski', 'Payson', 'Smallwood', 'Monroe', 'Hollins', 'Lemmon', 'Sarah Ann', 'Booth', 'Pierce', 'Lexington', 'Arch', 'Penn', 'Emory', 'Barre', 'Sharp', 'Hamburg', 'Cross', 'Ostend', 'Clement', 'Randall', 'Fort', 'Key', 'Hull', 'Cooksie', 'Towson', 'Beason', 'Cuba', 'Riverside', 'Webster', 'Light', 'Battery', 'Henry', 'Covington', 'Warren', 'Montgomery', 'Churchill', 'Grindall', 'Federal', 'Hill', 'Welcome', 'Ann', 'Wilkens', 'Fairmount', 'Baltimore', 'Hoffman', 'Oliver', 'Eager', 'Chew', 'Brentwood', 'Greenmount', 'Vineyard', 'Abell', 'Barclay', 'Guilford', 'Homewood', 'Charles', 'Calvert', 'Saint Paul', 'Cathedral', 'Park', 'Tyson', 'Read', 'Morton', 'Bolton', 'Mosher', 'Dolphin', 'Laurens', 'Wilson', 'Presstman', 'Baker', 'Walbrook', 'Poplar', 'Ashburton', 'Elgin'];
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth'];
const usedNames = new Set(), rootUse = new Map();
const HWY_NUM = [40, 83, 95, 9, 14, 27, 66, 1, 7, 13], BUS_NUM = [3, 5, 7, 10, 11, 13, 19, 22, 27, 35, 36, 44, 51, 64, 77, 89, 91, 99];
let hw = 0, bus = 0, ord = 0;
const byLen = [...ways].sort((a, b) => b.len - a.len || a.id - b.id);
for (const w of byLen) {
  const d = districtAt(w.x, w.y), dt = d ? d.type : 'old town', seed = strHash(`${w.id}:${R1(w.x)}:${R1(w.y)}`);
  const endA = nodes[E[w.edges[0]].a].e.length === 1 || nodes[E[w.edges[w.edges.length - 1]].b].e.length === 1;
  let root = null;
  const near = (list, R, f) => list.map(o => [Math.hypot(o.x - w.x, o.y - w.y), o]).filter(a => a[0] < R).sort((a, b) => a[0] - b[0]).map(a => f(a[1]));
  const cands = [...near(meta.poems, w.cls === 0 ? 160 : 600, p => POEM_ROOT[p.num]), ...near(meta.landmarks.filter(l => l.type !== 'bridge'), w.cls === 0 ? 220 : 900, LM_ROOT)];
  for (const c of cands) if ((rootUse.get(c) || 0) < (w.cls === 0 ? 2 : 1)) { root = c; break; }
  if (w.cls === 4) w.name = 'the Processional Way';
  else if (w.cls === 3) { const r = root || ['Shore', 'Harbor', 'Temple', 'Severn', 'Gates', 'Mast'][Math.floor(seed * 6)]; w.name = `${r} Spine`; }
  else if (w.cls === 2) { w.route = HWY_NUM[hw++ % HWY_NUM.length]; w.name = `Route ${w.route} · ${root || (POOLS[dt] || POOLS.downtown)[Math.floor(seed * 16)]} Expressway`; }
  else {
    const pool = POOLS[dt] || POOLS['old town'], k0 = Math.floor(seed * pool.length);
    const sufOf = r => w.cls === 1 ? (w.len > 1400 ? 'Boulevard' : 'Avenue') : endA && w.len < 120 ? 'Court' : dt === 'rowhouses' ? (seed * 7 % 1 < 0.5 ? 'Row' : 'Street') : w.born <= 1 && w.len < 260 ? 'Lane' : ['Street', 'Street', 'Way', 'Place', 'Street', 'Road', 'Walk', 'Terrace'][Math.floor(seed * 37 % 8)];
    const SUFS = w.cls === 1 ? ['Avenue', 'Boulevard', 'Parkway'] : ['Street', 'Lane', 'Way', 'Place', 'Row', 'Road', 'Walk', 'Terrace', 'Mews', 'Court'];
    const roots = [...(root ? [root] : []), ...(w.born === 3 && w.cls === 0 && dt !== 'suburb' && ord < ORD.length && seed < 0.3 ? [ORD[ord++]] : []),
      ...pool.map((_, i) => pool[(k0 + i * 7) % pool.length]), ...BALTIMERE.map((_, i) => BALTIMERE[(Math.floor(seed * 997) + i * 11) % BALTIMERE.length])];
    let nm = null;
    outer: for (const sf of [sufOf(), ...SUFS]) for (const r of roots) { const c = `${r} ${sf}`; if (!usedNames.has(c)) { nm = c; root = r; break outer; } }
    w.name = nm || `${roots[0]} ${sufOf()}`;
    if (w.cls === 1) w.route = BUS_NUM[bus++ % BUS_NUM.length];
  }
  rootUse.set(root, (rootUse.get(root) || 0) + 1);
  if (usedNames.has(w.name)) { const c = d ? [w.x > d.x ? 'East' : 'West', w.y > d.y ? 'South' : 'North'][Math.floor(seed * 13 % 2)] : 'Little'; w.name = `${c} ${w.name}`; }
  for (let k = 2; usedNames.has(w.name); k++) w.name = w.name.replace(/( \d+)?$/, ' ' + k);
  usedNames.add(w.name);
}

// ——— 3. the disc ———
// The camera car drives: every spine (the poet's own routes) and the processional avenue; the blocks right around each poem's site;
// and, from each poem, the cheapest way back to a spine (arterials preferred, the way a driver would go). The rest of the plan is
// still drivable in the player — rendered live, not from the disc.
const POEM_R = +(process.env.POEM_R || 38), ART_R = +(process.env.ART_R || 120), LINK_MAX = +(process.env.LINK_MAX || 0), poems = meta.poems, dPoem = (x, y) => Math.min(...poems.map(p => Math.hypot(p.x - x, p.y - y)));
const segD = (e, x, y) => { let m = 1e18; for (let i = 1; i < e.pts.length; i++) { const a = e.pts[i - 1], b = e.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)); m = Math.min(m, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t)); } return m; };
const nearPoem = (e, R) => poems.some(p => segD(e, p.x, p.y) < R);
for (const e of E) e.disc = e.cls === 3 || e.cls === 4 || (e.cls === 0 && nearPoem(e, POEM_R)) || (e.cls === 1 && nearPoem(e, ART_R));
{ const spineN = new Set(E.filter(e => e.cls === 3 || e.cls === 4).flatMap(e => [e.a, e.b]));
  for (const p of poems) {
    // start from the corner nearest the poem; Dijkstra over streets and arterials until a spine corner is reached
    let s = 0, sd = 1e18; nodes.forEach((n, i) => { if (!n.e.length) return; const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < sd) { sd = d; s = i; } });
    const dist = new Map([[s, 0]]), prev = new Map(), done = new Set(), q = [[0, s]]; let hit = null;
    while (q.length) { q.sort((a, b) => a[0] - b[0]); const [d, u] = q.shift(); if (done.has(u)) continue; done.add(u); if (spineN.has(u)) { hit = u; break; }
      for (const ei of nodes[u].e) { const e = E[ei]; if (e.cls === 2) continue; const v = e.a === u ? e.b : e.a, nd = d + e.len * (e.cls === 1 ? 0.6 : e.disc ? 0.3 : 1);
        if (nd < (dist.get(v) ?? 1e18)) { dist.set(v, nd); prev.set(v, ei); q.push([nd, v]); } } }
    if (process.env.DEBUG) console.log(p.num, 'corner at', Math.round(sd), 'm; to a spine', Math.round(dist.get(hit) ?? -1));
    if (hit !== null && dist.get(hit) <= LINK_MAX) for (let u = hit; u !== s && prev.has(u);) { const e = E[prev.get(u)]; e.disc = true; u = e.a === u ? e.b : e.a; }
  }
}

// ——— 4. steps: a frame every ~3 m down the centre, heading smoothed over ±6 m ———
function along(pts) { const s = [0]; for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return s; }
function at(pts, S, d) { d = Math.max(0, Math.min(S[S.length - 1], d)); let i = 1; while (i < S.length - 1 && S[i] < d) i++; const t = (d - S[i - 1]) / ((S[i] - S[i - 1]) || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; }
export function stepsOf(e) {
  const S = along(e.pts), L = S[S.length - 1], n = Math.max(2, Math.round(L / STEP) + 1), out = [];
  for (let i = 0; i < n; i++) { const d = L * i / (n - 1), p = at(e.pts, S, d), a = at(e.pts, S, d - 6), b = at(e.pts, S, d + 6);
    out.push([R1(p[0]), R1(p[1]), R3(Math.atan2(b[1] - a[1], b[0] - a[0]))]); }
  return out;
}

// ——— 5. legibility: what is set out along the disc ———
const discE = E.filter(e => e.disc), discN = new Set(discE.flatMap(e => [e.a, e.b]));
const nearDisc = (x, y, R) => discE.some(e => e.pts.some(p => Math.abs(p[0] - x) < R && Math.abs(p[1] - y) < R && Math.hypot(p[0] - x, p[1] - y) < R));
const W2 = [5, 9, 12, 7.5, 21];                        // half-widths by class (city3d's ribbon widths / 2)
const signs = [];
// street-name blades on the corner posts: at every disc corner where two ways cross
for (const nid of discN) { const n = nodes[nid]; const ws = [...new Set(n.e.map(i => wayOf[i]))]; if (ws.length < 2) continue;
  // the two ways that matter most: by class rank then length
  const rank = c => [1, 3, 0, 4, 5][c]; ws.sort((a, b) => rank(ways[b].cls) - rank(ways[a].cls) || ways[b].len - ways[a].len);
  const [w1, w2] = ws; const e1 = E[n.e.find(i => wayOf[i] === w1)], e2 = E[n.e.find(i => wayOf[i] === w2)];
  const u = leave(e1, nid), v = leave(e2, nid); let bx = u[0] + v[0], by = u[1] + v[1]; const bl = Math.hypot(bx, by) || 1; bx /= bl; by /= bl;
  const off = Math.max(W2[e1.cls], W2[e2.cls]) + 2.2;     // the corner between them, back of the kerb
  signs.push({k: 'blade', x: R1(n.x + bx * off * 1.2), y: R1(n.y + by * off * 1.2), a: [R3(Math.atan2(u[1], u[0])), R3(Math.atan2(v[1], v[0]))], t: [ways[w1].name, ways[w2].name], n: nid}); }
// wards, precincts and zoning: a sign wherever a disc block crosses a line, facing the way you come
for (const e of discE) { const st = stepsOf(e); let pw = null, pz = null;
  st.forEach(([x, y, h], i) => { const w = wardAt(x, y), z = ZONES[coverAt(x, y)] || null, wk = w ? `${w.ward}-${w.precinct}` : null, zk = z ? z[0] : null;
    if (i && wk && wk !== pw) { const prev = pw ? pw.split('-') : null;
      for (const s of [1, -1]) { const into = s === 1 ? w : prev ? {ward: +prev[0], precinct: +prev[1], name: urban[+prev[0] - 1].name} : null; if (!into) continue;
        const nrm = h + Math.PI / 2 * s, o = W2[e.cls] + 1.4;
        signs.push({k: 'ward', x: R1(x + Math.cos(nrm) * o), y: R1(y + Math.sin(nrm) * o), a: R3(s === 1 ? h + Math.PI : h), ward: into.ward, precinct: into.precinct, t: into.name.replace(/^the /, ''), line: s === 1 ? [R1(x), R1(y), R3(h)] : undefined, e: e.id}); } }
    if (i && zk && zk !== pz && i % 1 === 0) { const nrm = h - Math.PI / 2, o = W2[e.cls] + 1.4; signs.push({k: 'zone', x: R1(x + Math.cos(nrm) * o), y: R1(y + Math.sin(nrm) * o), a: R3(h + Math.PI), z: z[0], t: z[1], e: e.id}); }
    pw = wk; pz = zk; }); }
// bus stops: where city3d puts them (every ~380 m along each arterial), each with its route and the corner it serves
const stops = [];
roadsRaw.forEach(([cls, born, f], ri) => { if (cls !== 1) return; const W = 18 / 2 - 0.6; let stopAcc = 120 + hash(ri * 1.37, 1) * 200;
  for (let i = 0; i < f.length - 2; i += 2) { const ax = f[i], ay = f[i + 1], bx2 = f[i + 2], by = f[i + 3], L = Math.hypot(bx2 - ax, by - ay); if (!L) continue;
    const tx = (bx2 - ax) / L, ty = (by - ay) / L; stopAcc -= L;
    if (stopAcc < 0) { stopAcc = 380; const x = (ax + bx2) / 2 + ty * (W + 1.2), y = (ay + by) / 2 - tx * (W + 1.2), g = ground(x, y);
      if (g > 0.5) { const e = E.filter(q => q.cls === 1).map(q => [Math.min(...q.pts.map(p => Math.hypot(p[0] - x, p[1] - y))), q]).sort((a, b) => a[0] - b[0])[0][1];
        const w = ways[wayOf[e.id]]; const cn = [nodes[e.a], nodes[e.b]].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
        const cross = cn.e.map(i => ways[wayOf[i]]).find(o => o.id !== w.id);
        stops.push({x: R1(x), y: R1(y), a: R3(Math.atan2(ty, tx)), route: w.route, way: w.name, at: cross ? cross.name : null, disc: nearDisc(x, y, 30)}); } } } });
stops.forEach((s, i) => { s.id = i; if (s.disc) signs.push({k: 'bus', x: R1(s.x - Math.sin(s.a) * 0 + Math.cos(s.a) * 2.6), y: R1(s.y + Math.sin(s.a) * 2.6), a: s.a, route: s.route, t: s.at ? `${s.way.replace(/ (Avenue|Boulevard)$/, '')} & ${s.at}` : s.way, stop: i}); });
// highway shields: on the ramps where a disc block meets a route, and over the route itself where the disc can see it
for (const w of ways.filter(w => w.cls === 2)) for (const ei of w.edges) { const e = E[ei];
  for (const nid of [e.a, e.b]) { const n = nodes[nid]; const o = n.e.map(i => E[i]).find(q => q.disc && q.cls !== 2); if (!o) continue;
    const u = leave(o, nid), x = n.x + u[0] * 22 + -u[1] * 11, y = n.y + u[1] * 22 + u[0] * 11, v = leave(e, nid), card = Math.abs(v[0]) > Math.abs(v[1]) ? (v[0] > 0 ? 'EAST' : 'WEST') : (v[1] > 0 ? 'SOUTH' : 'NORTH');
    signs.push({k: 'shield', x: R1(x), y: R1(y), a: R3(Math.atan2(u[1], u[0]) + Math.PI), route: w.route, t: `TO ${card}`, n: nid}); } }
for (const w of ways.filter(w => w.cls === 2)) { let acc = 0; for (const ei of w.edges) { const e = E[ei]; for (const [x, y, h] of stepsOf(e)) { acc += STEP; if (acc < 600) continue; if (!nearDisc(x, y, 260)) continue; acc = 0;
  signs.push({k: 'shield', x: R1(x + Math.cos(h - Math.PI / 2) * 14), y: R1(y + Math.sin(h - Math.PI / 2) * 14), a: R3(h + Math.PI), route: w.route, t: w.name.split(' · ')[1].toUpperCase(), big: 1}); } } }
// cafés: where city3d sets out tables (the old and row houses' street faces), each with a name and a menu read from its district and the poem nearby
const MENU = {
  nightlife: [['neon highball', 9], ['crab fries', 7], ['last call coffee', 3], ['bass-line burger', 11], ['after-hours pho', 10], ['salt & lime', 4]],
  industrial: [['shift-change eggs', 6], ['coal-black coffee', 2], ['mill hand pie', 5], ['sugar-works doughnut', 2], ['foundry chili', 7], ['boilermaker', 6]],
  waterfront: [['crab cake platter', 16], ['oyster stew', 12], ['steamed shrimp (dozen)', 14], ['Old Bay chips', 3], ['harbor chowder', 8], ['rockfish sandwich', 13]],
  downtown: [['ledger lunch', 12], ['exchange espresso', 3], ['courthouse club', 10], ['mint julep', 9], ['broker’s bagel', 4], ['ballot box salad', 9]],
  'ruin field': [['fern tea', 3], ['ash-baked bread', 4], ['cairn honey toast', 6], ['walkers’ soup', 7], ['wild thistle salad', 8], ['monument lemonade', 3]],
  suburb: [['linden pancakes', 7], ['jacaranda soda', 3], ['tuna melt', 8], ['cul-de-sac cobbler', 6], ['lawn party lemonade', 3], ['Sunday roast', 14]],
  'old town': [['chapel bread & oil', 5], ['lamplighter stew', 9], ['candlewax cookies', 2], ['salt cod cakes', 10], ['bellringer coffee', 3], ['cooper’s ale', 6]],
  rowhouses: [['coddie & crackers', 4], ['lake trout', 9], ['pit beef', 10], ['snowball (egg custard)', 3], ['Berger cookies', 4], ['natty boh', 3]],
};
const ERA_DISH = ['shore bread', 'old-center soup', 'additions pie', 'boroughs blue-plate', 'flood rations (honoured)', 'white temple tea'];
const cafes = [];
const nb = B.length / 14;
const clear = [...meta.landmarks.filter(l => l.r > 0 && l.type !== 'bridge').map(l => [l.x, l.y, l.r * 1.25 + 10]), ...meta.plazas.map(p => [p.x, p.y, p.r + 8])];
for (let k = 0; k < nb; k++) { const o = k * 14, st = B[o + 6]; if (st > 1 || hash(k, 11) > 0.07) continue;
  const x = B[o], y = B[o + 1], d = B[o + 3], rot = B[o + 4], fx = x + Math.sin(rot) * (d / 2 + 2.6), fy = y - Math.cos(rot) * (d / 2 + 2.6);
  const born = Math.max(B[o + 7], 1), dies = B[o + 8] === 4 ? 4 : 9;
  if (!nearDisc(fx, fy, 40)) continue;
  const dd = districtAt(fx, fy), dt = dd ? dd.type : 'old town', menu = MENU[dt] || MENU['old town'];
  const p = poems.map(q => [Math.hypot(q.x - fx, q.y - fy), q]).sort((a, b) => a[0] - b[0])[0];
  const nm = p[0] < 400 ? `Café ${POEM_ROOT[p[1].num]}` : `The ${(POOLS[dt] || POOLS['old town'])[Math.floor(hash(k, 13) * 16)]} ${['Café', 'Lunch', 'Diner', 'Tavern', 'Coffee House', 'Bar & Grill'][Math.floor(hash(k, 14) * 6)]}`;
  const items = [0, 1, 2, 3].map(i => menu[Math.floor(hash(k, 20 + i) * menu.length)]).filter((v, i, a) => a.indexOf(v) === i);
  cafes.push({id: cafes.length, b: k, x: R1(fx), y: R1(fy), a: R3(-rot), born, dies, name: nm, menu: [...items, [ERA_DISH[5], 4]], poem: p[0] < 400 ? p[1].num : null}); }
cafes.forEach(c => signs.push({k: 'cafe', x: R1(c.x + Math.cos(c.a) * 3.2 * 0 + Math.sin(-c.a) * 0), y: c.y, a: c.a, cafe: c.id, t: c.name, born: c.born, dies: c.dies}));
// alleys: the paved lane behind the old and row houses; a small sign where it opens onto a disc street
const alleyMouths = new Map();
for (let k = 0; k < nb; k++) { const o = k * 14, st = B[o + 6]; if (st > 1) continue; const x = B[o], y = B[o + 1], w = B[o + 2], d = B[o + 3], rot = B[o + 4];
  if (!clear.every(([cx, cy, r]) => Math.hypot(x - cx, y - cy) > r + Math.max(w, d) / 2)) continue;
  const ax = x - Math.sin(rot) * (d / 2 + 2.4), ay = y + Math.cos(rot) * (d / 2 + 2.4);
  for (const s of [-1, 1]) { const mx = ax + Math.cos(rot) * (w / 2 + 1) * s, my = ay + Math.sin(rot) * (w / 2 + 1) * s;
    for (const e of discE) { if (e.cls === 2) continue; for (let i = 1; i < e.pts.length; i++) { const a = e.pts[i - 1], b = e.pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((mx - a[0]) * dx + (my - a[1]) * dy) / L2)), dist = Math.hypot(mx - a[0] - dx * t, my - a[1] - dy * t);
      if (dist < W2[e.cls] + 4 && dist > W2[e.cls] - 1) { const key = `${Math.round(mx / 25)},${Math.round(my / 25)}`; if (!alleyMouths.has(key)) alleyMouths.set(key, {x: mx, y: my, rot, e: e.id, b: k}); } } } } }
for (const m of alleyMouths.values()) { const w = ways[wayOf[m.e]]; const dd = districtAt(m.x, m.y); const root = (POOLS[dd ? dd.type : 'old town'] || POOLS['old town'])[Math.floor(hash(m.b, 17) * 16)];
  signs.push({k: 'alley', x: R1(m.x), y: R1(m.y), a: R3(m.rot + Math.PI / 2), t: `${root} Alley`, sub: `off ${w.name}`}); }
// piers: wherever port land meets water near the disc — the wharf gets its number
let pier = 0; const piers = [];
for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) { const k = j * nx + i; if (cover[k] !== 13 || height[k] < 0) continue;
  const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => height[k + a + b * nx] < 0); if (!nbs.length) continue; const [a, b] = nbs[0];
  const x = i * cell + a * 8, y = j * cell + b * 8; if (!nearDisc(x, y, 300)) continue; pier++; if (pier % 3) continue;
  piers.push({x, y}); signs.push({k: 'pier', x: R1(x - a * 6), y: R1(y - b * 6), a: R3(Math.atan2(b, a) + Math.PI), t: `PIER ${piers.length}`}); }
// historic markers: at each landmark the disc passes, its life in the eras, cast in iron
const ERA = meta.eras;
for (const lm of meta.landmarks) { if (lm.type === 'bridge') continue; const e = discE.map(q => [Math.min(...q.pts.map(p => Math.hypot(p[0] - lm.x, p[1] - lm.y))), q]).sort((a, b) => a[0] - b[0])[0]; if (!e || e[0] > (lm.r || 16) + 90) continue;
  const q = e[1]; let bp = q.pts[0], bd = 1e9; for (const p of q.pts) { const dd = Math.hypot(p[0] - lm.x, p[1] - lm.y); if (dd < bd) { bd = dd; bp = p; } }
  const ux = (lm.x - bp[0]) / (bd || 1), uy = (lm.y - bp[1]) / (bd || 1), o = W2[q.cls] + 2;
  const [b0, r0, as] = lm.era; const life = [`RAISED IN ${ERA[b0].toUpperCase()}`]; if (r0 < 9) life.push(`RUINED IN ${ERA[r0].toUpperCase()}`); if (as) life.push(`NOW ${as.toUpperCase()}`);
  signs.push({k: 'marker', x: R1(bp[0] + ux * o), y: R1(bp[1] + uy * o), a: R3(Math.atan2(uy, ux)), t: lm.name.split(' · ')[0].toUpperCase(), sub: life.join(' · '), lm: meta.landmarks.indexOf(lm)}); }

// ——— clearance: no sign or post may stand on a carriageway (a busy corner's bisector can point down a third street) ———
{ const SG = 30, grid = new Map(); E.forEach(e => { for (let i = 1; i < e.pts.length; i++) { const a = e.pts[i - 1], b = e.pts[i];
    for (let gx = Math.floor((Math.min(a[0], b[0]) - 30) / SG); gx <= Math.floor((Math.max(a[0], b[0]) + 30) / SG); gx++) for (let gy = Math.floor((Math.min(a[1], b[1]) - 30) / SG); gy <= Math.floor((Math.max(a[1], b[1]) + 30) / SG); gy++) {
      const k = gx + ',' + gy; (grid.get(k) || grid.set(k, []).get(k)).push([a, b, W2[e.cls]]); } } });
  const intrude = (x, y) => { let worst = 0, nx = 0, ny = 0; for (const [a, b, hw] of grid.get(Math.floor(x / SG) + ',' + Math.floor(y / SG)) || []) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2));
      const px = a[0] + dx * t, py = a[1] + dy * t, d = Math.hypot(x - px, y - py), need = hw + 1.3 - d; if (need > worst) { worst = need; nx = (x - px) / (d || 1); ny = (y - py) / (d || 1); } } return [worst, nx, ny]; };
  let moved = 0, dropped = 0;
  for (let k = signs.length - 1; k >= 0; k--) { const s = signs[k]; if (s.k === 'cafe') continue; let ok = false; const x0 = s.x, y0 = s.y;
    // try nudging out of every road it stands in; a corner sign that cannot find a kerb in its own corner tries the other corners of its node
    const tries = [[x0, y0]]; if (s.k === 'blade') { const n = nodes[s.n]; for (let a = 0; a < 16; a++) for (const r of [10, 14, 19]) tries.push([n.x + Math.cos(a * Math.PI / 8) * r, n.y + Math.sin(a * Math.PI / 8) * r]); }
    for (const [tx, ty] of tries) { s.x = R1(tx); s.y = R1(ty); for (let it = 0; it < 14; it++) { const [w, nx, ny] = intrude(s.x, s.y); if (w <= 0) { ok = true; break; } s.x = R1(s.x + nx * (w + 0.3)); s.y = R1(s.y + ny * (w + 0.3)); moved++; } if (ok) break; }
    if (!ok) { signs.splice(k, 1); dropped++; } }
  console.log('signs moved off the carriageway', moved, 'dropped', dropped); }

// ——— write ———
const plan = {
  version: 'moviemap-plan-v1', step: STEP,
  from: {city: meta.version, canon_checksum: meta.from.canon_checksum, city_checksum: meta.from.city_checksum},
  nodes: nodes.map(n => [R1(n.x), R1(n.y), n.e.length]),
  edges: E.map(e => ({a: e.a, b: e.b, cls: e.cls, born: e.born, w: wayOf[e.id], len: R1(e.len), w0: Math.round(e.w0), ...(e.wr ? {wr: 1} : {}), wz: (() => { const m = e.pts[e.pts.length >> 1], w = wardAt(m[0], m[1]), z = ZONES[coverAt(m[0], m[1])]; return [w ? w.ward : 0, w ? w.precinct : 0, z ? z[0] : '']; })(), pts: e.pts.flatMap(p => [R1(p[0]), R1(p[1])]), ...(e.disc ? {disc: 1, steps: stepsOf(e)} : {})})),
  ways: ways.map(w => ({name: w.name, cls: w.cls, len: Math.round(w.len), born: w.born, ...(w.route ? {route: w.route} : {})})),
  stops, cafes, signs,
  wards: urban.map((d, i) => ({ward: i + 1, name: d.name, type: d.type, x: d.x, y: d.y, use: d.use || null})),
  zones: Object.fromEntries(Object.values(ZONES).map(([k, t]) => [k, t])),
};
const discLen = discE.reduce((s, e) => s + e.len, 0), nSteps = discE.reduce((s, e) => s + stepsOf(e).length, 0);
plan.counts = {nodes: nodes.length, edges: E.length, ways: ways.length, discEdges: discE.length, discKm: Math.round(discLen) / 1000, steps: nSteps, frames: nSteps * 4, signs: signs.length,
  byKind: signs.reduce((o, s) => (o[s.k] = (o[s.k] || 0) + 1, o), {}), cafes: cafes.length, stops: stops.length};
const out = JSON.stringify(plan);
plan.checksum = createHash('sha1').update(out).digest('hex').slice(0, 12);
writeFileSync(join(MM, 'plan.json'), JSON.stringify(plan));
console.log(JSON.stringify(plan.counts), 'checksum', plan.checksum, (JSON.stringify(plan).length / 1024).toFixed(0) + ' KB');
const dk = [0, 1, 2, 3, 4].map(c => discE.filter(e => e.cls === c).reduce((s, e) => s + e.len, 0) / 1000);
console.log('disc km by class', dk.map(v => v.toFixed(2)).join(' / '), '· degree hist', JSON.stringify(nodes.reduce((o, n) => (o[n.e.length] = (o[n.e.length] || 0) + 1, o), {})));
