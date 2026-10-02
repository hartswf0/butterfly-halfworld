// ATLANTIS HDL — a hero building as one description, compiled to a building you can walk through, and proved buildable.
// (After the builder traces' house HDL gauntlets: mass → resolved → proof → reference fit; after the Odyssey kits' checker:
// nothing floats, nothing clashes, walls lift off to show inside; after henry-house: one model, every view, a facts register.)
import * as THREE from 'three';

// ——— materials from the archive library, laid in metres ———
const MAT = new Map(); let LIB = null, ATLAS = null;
export function useLibrary(lib, atlas) { LIB = lib; ATLAS = atlas; MAT.clear(); }
const libIdx = name => { const m = LIB.materials.find(m => m.name === name.split('@')[0].split('#')[0]); return m ? m.base : 0; };
export function tile(name, opt = {}) {
  if (name.includes('@')) { const [n, t] = name.split('@'); return tile(n, {...opt, tint: '#' + t}); }   // 'cantera@8a8a88' → tinted
  if (name.includes('#')) { const [n, v] = name.split('#'); return tile(n, {...opt, variant: +v}); }   // 'red brick#1' → the second cut of red brick
  const key = name + (opt.variant || 0) + (opt.scale || 1) + (opt.tint || '');
  const tintKey = opt.tint || '';
  if (MAT.has(key)) return MAT.get(key);
  const m = new THREE.MeshStandardMaterial({color: opt.tint || 0xffffff, roughness: opt.rough ?? 0.85, metalness: opt.metal ?? 0, side: opt.side ?? THREE.FrontSide});
  const role = LIB.materials.find(m => m.name === name)?.role, idx = libIdx(name) + (opt.variant || 0), sc = opt.scale || (role === 'wall' || role === 'atlantean' ? 3.0 : role === 'roof' ? 2.4 : 2.0);
  m.onBeforeCompile = sh => {
    sh.uniforms.uA = {value: ATLAS}; sh.uniforms.uG = {value: new THREE.Vector2(LIB.cols, LIB.rows)};
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vM;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvM = uv;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uA; uniform vec2 uG; varying vec2 vM;')
      .replace('#include <map_fragment>', `{ vec2 mm = vM / ${sc.toFixed(2)}; vec2 cell = vec2(mod(${idx.toFixed(1)}, uG.x), floor(${idx.toFixed(1)} / uG.x)); vec2 f = fract(mm);
        vec2 uv = vec2((cell.x + f.x) / uG.x, 1.0 - (cell.y + 1.0 - f.y) / uG.y); vec4 t = textureGrad(uA, uv, dFdx(mm) / uG, dFdy(mm) / uG); diffuseColor.rgb *= mix(vec3(dot(t.rgb, vec3(0.33))), t.rgb, 0.85) * 1.12; }`);
  };
  m.customProgramCacheKey = () => `tile-${idx}-${sc}-${tintKey}`;   // the tile index is baked into the shader: without this every tile shares the first one's program
  m.map = null; m.userData.lib = name; MAT.set(key, m); return m;
}
const flat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.t ?? 1, side: o.side ?? THREE.FrontSide});
const IRON = flat(0x1d2024, {r: 0.5, m: 0.6}), WOOD = () => tile('wood siding', {rough: 0.7}), GLASS = flat(0x9fc6d2, {r: 0.05, m: 0.2, t: 0.28});

// a box in HDL coordinates (x along the front, y back, z up) → three (x, z up as y, y as z); its UVs are world metres, so tiles run on across pieces
function box(x0, x1, y0, y1, z0, z1, mat) {
  const w = Math.max(0.001, x1 - x0), d = Math.max(0.001, y1 - y0), h = Math.max(0.001, z1 - z0);
  const g = new THREE.BoxGeometry(w, h, d); g.translate((x0 + x1) / 2, (z0 + z1) / 2, (y0 + y1) / 2);
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    if (ax > 0.5) uv.setXY(i, p.getZ(i), p.getY(i)); else if (ay > 0.5) uv.setXY(i, p.getX(i), p.getZ(i)); else uv.setXY(i, p.getX(i), p.getY(i)); }
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
}
const rnd = s => { const x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };

// ——— expand the description: level ranges, wildcards ———
export function expand(h) {
  const H = JSON.parse(JSON.stringify(h)); const L = H.levels.length;
  const lv = s => typeof s === 'number' ? [s] : String(s).includes('-') ? (([a, b]) => Array.from({length: b - a + 1}, (_, i) => a + i))(String(s).split('-').map(Number)) : [Number(s)];
  const W = [];
  for (const w of H.windows || []) for (const k of lv(w.level)) { if (k >= L) continue;
    const rooms = H.levels[k].rooms.filter(r => w.room.endsWith('*') ? r.id.startsWith(w.room.slice(0, -1)) : r.id === w.room);
    for (const r of rooms) W.push({...w, level: k, room: r.id}); }
  H.windows = W;
  H.levels.forEach((l, k) => l.rooms.forEach(r => { r.level = k; r.z = l.z; r.h = r.h || l.h; if (r.wall === 'tin ceiling') { r.ceiling = 'tin ceiling'; r.wall = 'plaster'; } }));
  return H;
}

// ——— walls: every room edge, split where rooms meet; shared stretches are interior walls, the rest are the envelope ———
function wallsOf(level, H) {
  const E = new Map(), add = (o, c, a, b, room, side) => { const k = o + ':' + c.toFixed(3); (E.get(k) || E.set(k, {o, c, list: []}).get(k)).list.push({a, b, room, side}); };
  for (const r of level.rooms) { add('h', r.y, r.x, r.x + r.w, r, +1); add('h', r.y + r.d, r.x, r.x + r.w, r, -1); add('v', r.x, r.y, r.y + r.d, r, +1); add('v', r.x + r.w, r.y, r.y + r.d, r, -1); }
  const segs = [];
  for (const {o, c, list} of E.values()) {
    const bp = [...new Set(list.flatMap(e => [e.a, e.b]))].sort((a, b) => a - b);
    let cur = null;
    for (let i = 0; i < bp.length - 1; i++) { const a = bp[i], b = bp[i + 1], m = (a + b) / 2;
      const P = list.find(e => e.side > 0 && e.a <= m && m <= e.b)?.room || null, N = list.find(e => e.side < 0 && e.a <= m && m <= e.b)?.room || null;
      if (!P && !N) { cur = null; continue; }
      const key = (P?.id || '') + '|' + (N?.id || '');
      if (cur && cur.key === key && Math.abs(cur.b - a) < 1e-6) cur.b = b; else { cur = {o, c, a, b, key, P, N, ext: !P || !N, openings: []}; segs.push(cur); } }
  }
  const [FW, FD] = H.footprint;
  for (const s of segs) { s.side = s.o === 'h' ? (Math.abs(s.c) < 1e-3 ? 'front' : 'back') : (Math.abs(s.c) < 1e-3 ? 'left' : Math.abs(s.c - FW) < 1e-3 ? 'right' : 'inner');
    if (s.o === 'h' && s.ext && !(Math.abs(s.c) < 1e-3)) s.side = s.P ? (s.c <= 0.01 ? 'front' : 'front*') : 'back';
    if (s.o === 'h' && s.ext) s.side = s.P ? 'front' : 'back';       // the room is behind (+y) a front-facing edge
    if (s.o === 'v' && s.ext) s.side = s.P ? 'left' : 'right';
    s.party = s.ext && (H.party || []).includes(s.side) && (s.side === 'left' ? Math.abs(s.c) < 1e-3 : Math.abs(s.c - FW) < 1e-3);
    s.h = Math.max(s.P?.h || 0, s.N?.h || 0); s.z = Math.min(s.P?.z ?? 1e9, s.N?.z ?? 1e9); }
  return segs;
}

// ——— openings: doors between rooms (or to the street), windows on a room's envelope ———
function placeOpenings(H, LW, issues) {
  for (const d of H.doors || []) {
    const segs = LW[d.level] || [], outside = ['street', 'yard'].includes(d.a) ? d.a : ['street', 'yard'].includes(d.b) ? d.b : null;
    let cand;
    if (outside) { const rid = outside === d.a ? d.b : d.a, side = d.side || (outside === 'yard' ? 'back' : 'front');
      cand = segs.filter(s => s.ext && ((s.P?.id || s.N?.id) === rid) && s.side === side); }
    else cand = segs.filter(s => !s.ext && [s.P?.id, s.N?.id].includes(d.a) && [s.P?.id, s.N?.id].includes(d.b));
    cand.sort((a, b) => (b.b - b.a) - (a.b - a.a));
    const s = cand[0], w = d.w || 0.9;
    if (!s || s.b - s.a < w + 0.2) { issues.push({rule: 'doors on walls', door: d, msg: `door ${d.a}→${d.b} on level ${d.level} has no wall long enough to sit in`}); continue; }
    const at = d.at != null ? Math.min(Math.max(d.at, s.a + w / 2 + 0.1), s.b - w / 2 - 0.1) : (s.a + s.b) / 2;
    s.openings.push({s: at, w, z0: 0, z1: d.h || 2.2, kind: 'door', outside: !!outside, door: d, shape: d.shape});
    d._seg = s; d._at = at;
  }
  for (const wd of H.windows || []) {
    const segs = (LW[wd.level] || []).filter(s => s.ext && (s.P?.id || s.N?.id) === wd.room && s.side === wd.side);
    if (!segs.length || segs.every(s => s.party)) { issues.push({rule: 'windows on walls', msg: `${wd.room} has no ${wd.side} wall to the outside${segs.some(s => s.party) ? ' (it is a party wall)' : ''}`}); continue; }
    const s = segs.sort((a, b) => (b.b - b.a) - (a.b - a.a))[0], L = s.b - s.a;
    for (let i = 0; i < wd.n; i++) { let at = s.a + L * (i + 0.5) / wd.n;
      const clash = a => s.openings.some(o => Math.abs(o.s - a) < (o.w + wd.w) / 2 + 0.2) || a - wd.w / 2 < s.a + 0.2 || a + wd.w / 2 > s.b - 0.2;
      if (clash(at)) { let found = null; for (let d = 0.1; d < L && found == null; d += 0.1) for (const t of [at + d, at - d]) if (found == null && !clash(t)) found = t;
        if (found == null) { issues.push({rule: 'windows on walls', msg: `no room for a window in ${wd.room}'s ${wd.side} wall beside its door`}); continue; } at = found; }   // slide beside the door, never drop it silently
      s.openings.push({s: at, w: Math.min(wd.w, L / wd.n - 0.3), z0: wd.sill, z1: wd.sill + wd.h, kind: 'window', shape: wd.shape}); }
  }
}

// ——— the flights: risers, treads, and the hole each cuts in the floor it arrives at ———
function flightsOf(H) {
  return (H.stairs || []).map(s => { const z0 = H.levels[s.from].z, z1 = H.levels[s.to].z, rise = z1 - z0, n = Math.ceil(rise / 0.185), run = s.dir.includes('y') ? s.d : s.w;
    const dirS = s.dir[0] === '+' ? 1 : -1, ax = s.dir[1];
    // where the flight comes within 2.1 m of the floor above, that floor must be open
    const f = Math.max(0, 1 - 2.1 / rise), hole = {...s};
    if (ax === 'y') { if (dirS > 0) { hole.y = s.y + s.d * f; hole.d = s.d * (1 - f); } else hole.d = s.d * (1 - f); }
    else { if (dirS > 0) { hole.x = s.x + s.w * f; hole.w = s.w * (1 - f); } else hole.w = s.w * (1 - f); }
    return {...s, z0, z1, rise, n, riser: rise / n, tread: run / n, run, ax, dirS, hole,
      heightAt(x, y) { const t = ax === 'y' ? (dirS > 0 ? (y - s.y) / s.d : (s.y + s.d - y) / s.d) : (dirS > 0 ? (x - s.x) / s.w : (s.x + s.w - x) / s.w); return z0 + rise * Math.min(1, Math.max(0, t)); },
      contains(x, y, m = 0) { return x >= s.x - m && x <= s.x + s.w + m && y >= s.y - m && y <= s.y + s.d + m; } }; });
}
function subtract(r, h) {                                          // rect minus rect → up to four rects
  const x0 = Math.max(r.x, h.x), x1 = Math.min(r.x + r.w, h.x + h.w), y0 = Math.max(r.y, h.y), y1 = Math.min(r.y + r.d, h.y + h.d);
  if (x1 <= x0 || y1 <= y0) return [r];
  const out = []; if (y0 > r.y) out.push({x: r.x, y: r.y, w: r.w, d: y0 - r.y}); if (y1 < r.y + r.d) out.push({x: r.x, y: y1, w: r.w, d: r.y + r.d - y1});
  if (x0 > r.x) out.push({x: r.x, y: y0, w: x0 - r.x, d: y1 - y0}); if (x1 < r.x + r.w) out.push({x: x1, y: y0, w: r.x + r.w - x1, d: y1 - y0}); return out;
}
const ov = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y));

// ——— the proofs ———
export function prove(Hraw) {
  const H = expand(Hraw), out = [], push = (rule, ok, detail, warn) => out.push({rule, state: ok ? (warn ? 'WARN' : 'PASS') : 'FAIL', detail});
  const [FW, FD] = H.footprint, rooms = H.levels.flatMap(l => l.rooms), issues = [];
  const LW = H.levels.map(l => wallsOf(l, H)); placeOpenings(H, LW, issues);
  const F = flightsOf(H);
  // 1 contained
  const outside = rooms.filter(r => r.x < -1e-6 || r.y < -1e-6 || r.x + r.w > FW + 1e-6 || r.y + r.d > FD + 1e-6);
  push('contained', !outside.length, outside.length ? outside.map(r => `${r.name} leaves the footprint`).join('; ') : `${rooms.length} rooms inside ${FW} × ${FD} m`);
  // 2 clashes, in plan and in height (a tall room may not run into the floor above)
  const cl = [];
  H.levels.forEach((l, k) => { for (let i = 0; i < l.rooms.length; i++) for (let j = i + 1; j < l.rooms.length; j++) if (ov(l.rooms[i], l.rooms[j]) > 0.01) cl.push(`${l.rooms[i].name} × ${l.rooms[j].name}`);
    for (const r of l.rooms) for (let m = k + 1; m < H.levels.length; m++) if (r.z + r.h > H.levels[m].z + 0.01) for (const q of H.levels[m].rooms) if (ov(r, q) > 0.01) cl.push(`${r.name} rises into ${q.name}`); });
  push('no clashes', !cl.length, cl.length ? cl.join('; ') : 'no two rooms fill the same space');
  // 3 supported (cantilever ≤ 1.5 m)
  const sup = [], cant = [];
  H.levels.forEach((l, k) => { if (!k) return; const below = H.levels.slice(0, k).flatMap(q => q.rooms).filter(q => q.z + q.h >= l.z - 0.01);
    for (const r of l.rooms) { let rest = [{x: r.x, y: r.y, w: r.w, d: r.d}]; for (const b of below) rest = rest.flatMap(p => subtract(p, b));
      const area = rest.reduce((a, p) => a + p.w * p.d, 0), deep = Math.max(0, ...rest.map(p => Math.min(p.w, p.d)));
      if (area > 0.05) (deep > 1.51 ? sup : cant).push(`${r.name} overhangs ${deep.toFixed(1)} m`); } });
  push('supported', !sup.length, sup.length ? sup.join('; ') : cant.length ? 'cantilevers within 1.5 m: ' + cant.join('; ') : 'every room stands on the room below', cant.length && !sup.length);
  // 4 reachable from the street (doors and stairs)
  const adj = new Map(), link = (a, b) => { (adj.get(a) || adj.set(a, []).get(a)).push(b); (adj.get(b) || adj.set(b, []).get(b)).push(a); };
  for (const d of H.doors || []) if (d._seg) link(d.a === 'yard' ? 'street' : d.a, d.b === 'yard' ? 'street' : d.b);
  for (const f of F) { const top = f.ax === 'y' ? (f.dirS > 0 ? [f.x + f.w / 2, f.y + f.d - 0.05] : [f.x + f.w / 2, f.y + 0.05]) : (f.dirS > 0 ? [f.x + f.w - 0.05, f.y + f.d / 2] : [f.x + 0.05, f.y + f.d / 2]);
    const bot = f.ax === 'y' ? (f.dirS > 0 ? [f.x + f.w / 2, f.y + 0.05] : [f.x + f.w / 2, f.y + f.d - 0.05]) : (f.dirS > 0 ? [f.x + 0.05, f.y + f.d / 2] : [f.x + f.w - 0.05, f.y + f.d / 2]);
    const inRoom = (lv, [x, y]) => H.levels[lv].rooms.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.d);
    const A = inRoom(f.from, bot), B = inRoom(f.to, top); f._a = A; f._b = B; if (A && B) link(A.id, B.id); }
  for (const e of H.exterior || []) if (e.kind === 'fireescape') { for (let k = e.from; k <= e.to; k++) for (const r of H.levels[k].rooms) if (r.x < e.x + e.w && r.x + r.w > e.x && r.y < 0.01) link('fire escape', r.id); link('fire escape', 'street'); }
  const seen = new Set(['street']), q = ['street']; while (q.length) { const a = q.shift(); for (const b of adj.get(a) || []) if (!seen.has(b)) { seen.add(b); q.push(b); } }
  const lost = rooms.filter(r => !seen.has(r.id));
  push('reachable', !lost.length, lost.length ? 'cannot be reached: ' + lost.map(r => r.name + ' (' + H.levels[r.level].name + ')').join(', ') : `all ${rooms.length} rooms reached from the street`);
  // 5 doors and windows on real walls
  const di = issues.filter(i => i.rule === 'doors on walls'), wi = issues.filter(i => i.rule === 'windows on walls');
  push('doors on walls', !di.length, di.length ? di.map(i => i.msg).join('; ') : `${(H.doors || []).length} doors, each in a wall that is there`);
  push('windows on walls', !wi.length, wi.length ? wi.map(i => i.msg).join('; ') : `${LW.flat().reduce((a, s) => a + s.openings.filter(o => o.kind === 'window').length, 0)} windows on the envelope, none on a party wall`);
  // 6 daylight for rooms people live and work in (borrowed light through a wide opening counts, as a warning)
  const lit = new Set(LW.flat().flatMap(s => s.openings.some(o => o.kind === 'window') ? [s.P?.id, s.N?.id] : []).filter(Boolean));
  const need = rooms.filter(r => ['home', 'cafe', 'kitchen', 'shop'].includes(r.use)), dark = [], borrowed = [];
  for (const r of need) if (!lit.has(r.id)) { const via = (H.doors || []).find(d => (d.w || 0.9) >= 1.8 && [d.a, d.b].includes(r.id) && lit.has(d.a === r.id ? d.b : d.a)); (via ? borrowed : dark).push(r.name + (via ? ` (through the opening to the ${rooms.find(x => x.id === (via.a === r.id ? via.b : via.a)).name})` : '')); }
  push('daylight', !dark.length, dark.length ? 'dark: ' + dark.join(', ') : borrowed.length ? 'borrowed light: ' + borrowed.join(', ') : `${need.length} lived-in rooms each have a window`, borrowed.length && !dark.length);
  // 7 stairs: riser ≤ 0.2 m, tread ≥ 0.25 m, both ends land in a room
  const sb = F.filter(f => f.riser > 0.2 || f.tread < 0.25 || !f._a || !f._b);
  push('stairs', !sb.length, F.length ? (sb.length ? sb.map(f => `flight ${f.from}→${f.to}: riser ${f.riser.toFixed(3)}, tread ${f.tread.toFixed(2)}${!f._a || !f._b ? ', an end lands nowhere' : ''}`).join('; ') : F.map(f => `${f.from}→${f.to}: ${f.n} risers of ${(f.riser * 100).toFixed(1)} cm, treads ${(f.tread * 100).toFixed(0)} cm`).join(' · ')) : 'single storey');
  // 8 headroom
  const low = rooms.filter(r => r.h - 0.25 < 2.3);
  push('headroom', !low.length, low.length ? low.map(r => `${r.name} ${(r.h - 0.25).toFixed(2)} m clear`).join('; ') : `every room ≥ 2.3 m clear; ${F.length} floor openings cut over the flights for 2.1 m over every stair`);
  // 9 egress: a lived-in storey above the second needs two ways down
  const fe = (H.exterior || []).filter(e => e.kind === 'fireescape'), eg = [];
  H.levels.forEach((l, k) => { if (k < 2 || !l.rooms.some(r => r.use === 'home')) return; const ways = F.filter(f => f.to === k).length + fe.filter(e => e.from <= k && e.to >= k).length; if (ways < 2) eg.push(`${l.name}: ${ways} way down`); });
  push('two ways down', !eg.length, eg.length ? eg.join('; ') : fe.length ? `the stair and ${fe.length} fire escape${fe.length > 1 ? 's' : ''} serve every upper flat` : 'no lived-in storey above the second');
  // 10 spans
  const sp = rooms.filter(r => Math.min(r.w, r.d) > 7.5 && !r.trusses && !r.columns), tr = rooms.filter(r => r.trusses || r.columns);
  push('spans', !sp.length, sp.length ? sp.map(r => `${r.name} spans ${Math.min(r.w, r.d)} m with nothing to carry it`).join('; ') : tr.length ? 'long spans carried: ' + tr.map(r => `${r.name} ${Math.min(r.w, r.d)} m on ${r.trusses ? 'trusses' : 'columns'}`).join(', ') : 'every floor spans ≤ 7.5 m between walls');
  // 11 facts register
  const fc = {}; for (const f of H.facts || []) fc[f.status] = (fc[f.status] || 0) + 1;
  push('facts register', true, Object.entries(fc).map(([k, v]) => `${v} ${k}`).join(' · ') + ' — nothing here is a construction document', !!fc.invented);
  return out;
}

// ——— props: a small kit, in metres ———
function prop(kind, x, y, z, rot, g) {
  const P = new THREE.Group(), b = (x0, x1, y0, y1, z0, z1, m) => P.add(box(x0, x1, y0, y1, z0, z1, m));
  const wood = tile('panelling', {rough: 0.6}), fabric = c => flat(c, {r: 0.95}), metal = flat(0x8a8d90, {r: 0.4, m: 0.6});
  switch (kind) {
    case 'bed': b(-0.8, 0.8, -1, 1, 0, 0.45, wood); b(-0.75, 0.75, -0.95, 0.95, 0.45, 0.6, fabric(0xe8e2d4)); b(-0.8, 0.8, 0.95, 1.05, 0, 1.0, wood); b(-0.6, 0.6, 0.55, 0.9, 0.6, 0.72, fabric(0xf4f0e6)); break;
    case 'drawers': b(-0.5, 0.5, -0.25, 0.25, 0, 1.15, wood); for (let i = 0; i < 4; i++) b(-0.45, 0.45, -0.27, -0.25, 0.08 + i * 0.27, 0.3 + i * 0.27, tile('wood siding')); break;
    case 'table': b(-0.6, 0.6, -0.4, 0.4, 0.72, 0.76, wood); for (const [a, c] of [[-0.55, -0.35], [0.55, -0.35], [-0.55, 0.35], [0.55, 0.35]]) b(a - 0.03, a + 0.03, c - 0.03, c + 0.03, 0, 0.72, wood); break;
    case 'chair': b(-0.22, 0.22, -0.22, 0.22, 0.44, 0.48, wood); b(-0.22, 0.22, 0.18, 0.22, 0.48, 0.95, wood); for (const [a, c] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) b(a - 0.02, a + 0.02, c - 0.02, c + 0.02, 0, 0.44, wood); break;
    case 'sofa': b(-1, 1, -0.45, 0.45, 0, 0.45, fabric(0x7a3a34)); b(-1, 1, 0.3, 0.45, 0.45, 0.9, fabric(0x7a3a34)); b(-1, -0.85, -0.45, 0.45, 0.45, 0.65, fabric(0x6a3030)); b(0.85, 1, -0.45, 0.45, 0.45, 0.65, fabric(0x6a3030)); break;
    case 'counter': b(-1.6, 1.6, -0.35, 0.35, 0, 1.05, tile('panelling')); b(-1.65, 1.65, -0.4, 0.4, 1.05, 1.1, tile('marble')); break;
    case 'shelves': b(-1, 1, -0.2, 0.2, 0, 2.2, wood); for (let i = 1; i < 5; i++) for (let j = 0; j < 6; j++) b(-0.95 + j * 0.32, -0.75 + j * 0.32, -0.15, 0.1, i * 0.45, i * 0.45 + 0.25 + rnd(i * 7 + j) * 0.1, fabric([0xb33a2e, 0x3a6fa8, 0xe8d8a0, 0x5a8a4a][(i + j) % 4])); break;
    case 'mailboxes': b(-0.6, 0.6, -0.08, 0.08, 1.0, 1.8, metal); break;
    case 'machines': for (let i = 0; i < 4; i++) { b(-0.35, 0.35, -2 + i * 0.8, -1.35 + i * 0.8, 0, 0.9, flat(0xe8e6e0)); } break;
    case 'typewriter': b(-0.6, 0.6, -0.4, 0.4, 0.72, 0.76, wood); b(-0.22, 0.22, -0.15, 0.15, 0.76, 0.9, flat(0x1a1a1a, {m: 0.4})); b(-0.15, 0.15, 0.08, 0.12, 0.9, 1.05, flat(0xf4f0e6)); break;
    case 'font': b(-0.35, 0.35, -0.35, 0.35, 0, 0.9, tile('marble')); break;
    case 'pews': b(-1.8, 1.8, -0.3, 0.3, 0.42, 0.47, wood); b(-1.8, 1.8, 0.25, 0.32, 0.47, 0.95, wood); b(-1.85, -1.78, -0.3, 0.32, 0, 0.95, wood); b(1.78, 1.85, -0.3, 0.32, 0, 0.95, wood); break;
    case 'altar': b(-1.1, 1.1, -0.5, 0.5, 0, 1.0, tile('marble')); b(-1.15, 1.15, -0.55, 0.55, 1.0, 1.06, flat(0xf4f0e6)); break;
    case 'candles': b(-0.05, 0.05, -0.05, 0.05, 0, 1.3, flat(0xc9a03a, {m: 0.8, r: 0.3})); b(-0.03, 0.03, -0.03, 0.03, 1.3, 1.5, flat(0xfff4d0, {e: 0xffc060, ei: 2})); break;
    case 'booth': b(-1, 1, -0.8, 0.8, 0, 2.4, tile('panelling')); b(-0.7, 0.7, -0.82, -0.8, 1.0, 1.8, GLASS); break;
    case 'ropes': for (let i = 0; i < 4; i++) b(-1.8 + i * 1.2 - 0.04, -1.8 + i * 1.2 + 0.04, -0.04, 0.04, 0, 0.95, flat(0xc9a03a, {m: 0.8})); b(-1.8, 1.8, -0.02, 0.02, 0.85, 0.88, flat(0x8a1a2a)); break;
    case 'posters': for (let i = 0; i < 3; i++) b(-0.03, 0.03, -2 + i * 1.6, -1 + i * 1.6, 1.0, 2.4, flat([0x2a5a8a, 0xb8322a, 0xd8b040][i], {e: [0x2a5a8a, 0xb8322a, 0xd8b040][i], ei: 0.25})); break;
    case 'seats': for (let i = 0; i < 10; i++) { const sx = -6.3 + i * 1.4; b(sx - 0.6, sx + 0.6, -0.3, 0.3, 0.3, 0.48, tile('velvet')); b(sx - 0.6, sx + 0.6, 0.25, 0.35, 0.3, 1.0, tile('velvet')); } break;
    case 'screen': b(-6, 6, -0.05, 0.05, 2.0, 8.0, flat(0xf2f0ea, {e: 0xbfd0ff, ei: 0.25})); break;
    case 'stage': b(-7.5, 7.5, -1.4, 1.4, 0, 1.0, tile('floorboards')); break;
    case 'projector': b(-0.3, 0.3, -0.6, 0.6, 0.9, 1.4, flat(0x2a2d30, {m: 0.6})); b(-0.12, 0.12, -0.8, -0.6, 1.05, 1.25, flat(0x111111)); break;
    case 'stools': for (let i = 0; i < 4; i++) { b(-1.5 + i - 0.18, -1.5 + i + 0.18, -0.18, 0.18, 0.7, 0.76, flat(0xb8322a)); b(-1.5 + i - 0.03, -1.5 + i + 0.03, -0.03, 0.03, 0, 0.7, metal); } break;
    case 'stove': b(-0.4, 0.4, -0.35, 0.35, 0, 0.9, flat(0xe4e0d4, {r: 0.3})); b(-0.4, 0.4, -0.35, 0.35, 0.9, 0.92, flat(0x1a1a1a)); break;
    case 'sink': b(-0.5, 0.5, -0.3, 0.3, 0, 0.88, flat(0xf0f0ea, {r: 0.2})); break;
    case 'gears': for (let i = 0; i < 5; i++) { const gm = new THREE.Mesh(new THREE.CylinderGeometry(0.4 + i * 0.25, 0.4 + i * 0.25, 0.08, 24), flat(0x8a6a2a, {m: 0.8, r: 0.35})); gm.rotation.x = Math.PI / 2; gm.position.set(-0.8 + i * 0.4, 1.2 + (i % 2) * 0.6, 0); P.add(gm); } b(-0.06, 0.06, -0.06, 0.06, 0, 3.5, metal); break;
    case 'column': { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 3.4, 12), flat(0x2a2d30, {m: 0.7, r: 0.4})); c.position.y = 1.7; P.add(c); break; }
    case 'lamp': b(-0.03, 0.03, -0.03, 0.03, 0, 1.5, metal); b(-0.2, 0.2, -0.2, 0.2, 1.4, 1.7, flat(0xfff0d0, {e: 0xffc070, ei: 1.2})); break;
    default: b(-0.4, 0.4, -0.4, 0.4, 0, 0.8, wood);
  }
  P.position.set(x, z, y); P.rotation.y = -rot * Math.PI / 180; g.add(P);
}

// ——— the exterior kit ———
function exterior(H, e, g, top) {
  const [FW, FD] = H.footprint, L = H.levels;
  if (e.kind === 'fireescape') {                                    // landings at every storey; between them one long diagonal flight across the facade, as the shots show it
    for (let k = e.from; k <= e.to; k++) { const z = L[k].z;
      g.add(box(e.x, e.x + e.w, -1.3, -0.15, z - 0.06, z, IRON));
      g.add(box(e.x, e.x + e.w, -1.33, -1.28, z + 0.95, z + 1.0, IRON)); for (let i = 0; i <= 10; i++) g.add(box(e.x + i * e.w / 10 - 0.012, e.x + i * e.w / 10 + 0.012, -1.31, -1.29, z, z + 1.0, IRON));
      g.add(box(e.x - 0.03, e.x + 0.03, -1.3, -0.15, z + 0.95, z + 1.0, IRON)); g.add(box(e.x + e.w - 0.03, e.x + e.w + 0.03, -1.3, -0.15, z + 0.95, z + 1.0, IRON));
      if (k < e.to) { const z2 = L[k + 1].z, n = Math.ceil((z2 - z) / 0.2), ltr = k % 2 === 0, x0 = ltr ? e.x + 0.4 : e.x + e.w - 0.4, x1 = ltr ? e.x + e.w - 0.4 : e.x + 0.4;
        for (let i = 0; i < n; i++) { const f = (i + 0.5) / n, xx = x0 + (x1 - x0) * f, zz = z + (z2 - z) * (i + 1) / n; g.add(box(xx - 0.13, xx + 0.13, -1.0, -0.45, zz - 0.035, zz, IRON)); }
        const len = Math.hypot(x1 - x0, z2 - z), ang = Math.atan2(z2 - z, x1 - x0);
        for (const [yy, dz] of [[-1.02, 0.0], [-0.43, 0.0], [-1.02, 0.9], [-0.43, 0.9]]) { const st = new THREE.Mesh(new THREE.BoxGeometry(len, dz ? 0.04 : 0.12, 0.04), IRON); st.position.set((x0 + x1) / 2, (z + z2) / 2 + dz, yy); st.rotation.z = ang; g.add(st); } } }
    const z = L[e.from].z; for (let i = 0; i < Math.floor((z - 1.8) / 0.3); i++) g.add(box(e.x + 0.3, e.x + 0.8, -1.2, -1.15, z - 0.3 - i * 0.3, z - 0.27 - i * 0.3, IRON));
    g.add(box(e.x + 0.28, e.x + 0.31, -1.2, -1.15, 1.8, z, IRON)); g.add(box(e.x + 0.79, e.x + 0.82, -1.2, -1.15, 1.8, z, IRON));
  }
  if (e.kind === 'stoop') { const n = Math.ceil(e.rise / 0.17), m = tile(e.material || 'marble', {rough: 0.4});
    for (let i = 0; i < n; i++) g.add(box(e.x, e.x + e.w, -(n - i) * 0.3, 0, 0, (i + 1) * e.rise / n, m)); }
  if (e.kind === 'watertank') { const t = new THREE.Group(); const z = top;
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t.add(box(e.x + a * 1.2 - 0.06, e.x + a * 1.2 + 0.06, e.y + b * 1.2 - 0.06, e.y + b * 1.2 + 0.06, z, z + 2.6, IRON));
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3.6, 18), tile('wood siding')); c.position.set(e.x, z + 4.4, e.y); t.add(c);
    const r = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.2, 18), IRON); r.position.set(e.x, z + 6.8, e.y); t.add(r); g.add(t); }
  if (e.kind === 'awning') { const z = e.z ?? 3, n = Math.round(e.w / 0.5);
    for (let i = 0; i < n; i++) { const a = box(e.x + i * e.w / n, e.x + (i + 1) * e.w / n, -1.6, 0, z - 0.04, z, flat(i % 2 && e.stripes !== false ? 0xf1ece0 : 0xb8322a, {side: THREE.DoubleSide})); a.rotation.x = 0; a.geometry.rotateX(0); g.add(a); }
    g.add(box(e.x, e.x + e.w, -1.62, -1.58, z - 0.35, z, flat(0xb8322a))); }
  if (e.kind === 'cornice') { g.add(box(-0.3, FW + 0.3, -0.45, 0.2, top - 0.6, top - 0.2, tile(H.skin.trim))); g.add(box(-0.35, FW + 0.35, -0.55, 0.2, top - 0.2, top, tile(H.skin.trim))); }
  if (e.kind === 'bellcote') {                                      // the bell hung in the front gable itself: a wall rising past the ridge, pierced, capped
    const zr = top + (H.roof.rise || 0), w = e.w || 2.6, z0 = zr - 2.2, z1 = zr + 2.6, t = 0.7, m = tile(H.skin.wall);
    g.add(box(e.x - w / 2, e.x - 0.55, -0.2, t - 0.2, z0, z1, m)); g.add(box(e.x + 0.55, e.x + w / 2, -0.2, t - 0.2, z0, z1, m)); g.add(box(e.x - 0.55, e.x + 0.55, -0.2, t - 0.2, z0, zr - 0.2, m));
    g.add(box(e.x - 0.55, e.x + 0.55, -0.2, t - 0.2, zr + 1.5, z1, m));
    for (let i = 0; i < 4; i++) { const k = 0.55 * (i + 1) / 4; g.add(box(e.x - 0.55, e.x - 0.55 + k, -0.2, t - 0.2, zr + 1.0 + i * 0.12, zr + 1.12 + i * 0.12, m)); g.add(box(e.x + 0.55 - k, e.x + 0.55, -0.2, t - 0.2, zr + 1.0 + i * 0.12, zr + 1.12 + i * 0.12, m)); }
    const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.15, 0); sh.lineTo(w / 2 + 0.15, 0); sh.lineTo(0, 1.1); sh.closePath();
    const cap = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, {depth: t + 0.2, bevelEnabled: false}), tile(H.skin.roof)); cap.position.set(e.x, z1, -0.3); g.add(cap);
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.7, 16, 1, true), flat(0x8a6a2a, {m: 0.9, r: 0.3, side: THREE.DoubleSide})); bell.position.set(e.x, zr + 0.55, 0.15); g.add(bell);
    g.add(box(e.x - 0.04, e.x + 0.04, 0.1, 0.2, z1 + 1.1, z1 + 2.1, IRON)); g.add(box(e.x - 0.3, e.x + 0.3, 0.1, 0.2, z1 + 1.65, z1 + 1.75, IRON)); }
  if (e.kind === 'belfry') { const z = top + 0.2 + (e.onRidge ? (H.roof.rise || 0) - 1.2 : 0), h = e.h; g.add(box(e.x - 1.4, e.x + 1.4, e.y - 1.4, e.y + 1.4, z - 3, z + h * 0.55, tile(H.skin.wall)));
    for (const [a, b] of [[-1.4, -1.4], [1.0, -1.4], [-1.4, 1.0], [1.0, 1.0]]) g.add(box(e.x + a, e.x + a + 0.4, e.y + b, e.y + b + 0.4, z + h * 0.55, z + h * 0.85, tile(H.skin.wall)));
    g.add(box(e.x - 1.6, e.x + 1.6, e.y - 1.6, e.y + 1.6, z + h * 0.85, z + h * 0.9, tile(H.skin.trim)));
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.55, 0.8, 16, 1, true), flat(0x8a6a2a, {m: 0.9, r: 0.3, side: THREE.DoubleSide})); bell.position.set(e.x, z + h * 0.7, e.y); g.add(bell);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.6, 4), tile(H.skin.roof)); roof.rotation.y = Math.PI / 4; roof.position.set(e.x, z + h * 0.9 + 1.3, e.y); g.add(roof);
    g.add(box(e.x - 0.05, e.x + 0.05, e.y - 0.05, e.y + 0.05, z + h * 0.9 + 2.6, z + h * 0.9 + 3.8, IRON)); g.add(box(e.x - 0.4, e.x + 0.4, e.y - 0.05, e.y + 0.05, z + h * 0.9 + 3.3, z + h * 0.9 + 3.4, IRON)); }
  if (e.kind === 'marquee') {                                       // the canopy, its bulbs, its letters
    const z = e.z; g.add(box(0.6, FW - 0.6, -3.2, 0, z - 0.3, z + 0.1, flat(0x1a1c20, {m: 0.5}))); g.add(box(0.5, FW - 0.5, -3.3, -3.0, z - 0.3, z + 1.6, flat(0xf2ead8, {e: 0xffe6b0, ei: 0.35})));
    const c = document.createElement('canvas'); c.width = 1024; c.height = 220; const x2 = c.getContext('2d'); x2.fillStyle = '#f6eedc'; x2.fillRect(0, 0, 1024, 220);
    x2.fillStyle = '#c0202c'; x2.font = 'bold 120px Futura, Helvetica, Arial'; x2.textAlign = 'center'; x2.fillText(e.text, 512, 128); x2.fillStyle = '#222'; x2.font = '38px Helvetica, Arial'; x2.fillText(e.sub || '', 512, 192);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(FW - 1.2, 1.7), new THREE.MeshStandardMaterial({map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.55})); pl.position.set(FW / 2, z + 0.65, -3.32); pl.rotation.y = Math.PI; g.add(pl);
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), flat(0xfff2c0, {e: 0xffd27a, ei: 3}), 160); let k = 0; const M = new THREE.Matrix4();
    for (let i = 0; i < 80; i++) { const x = 0.6 + i * (FW - 1.2) / 79; M.setPosition(x, z - 0.35, -3.25); bulbs.setMatrixAt(k++, M); M.setPosition(x, z + 1.65, -3.35); bulbs.setMatrixAt(k++, M); } g.add(bulbs); bulbs.userData.marquee = true; }
  if (e.kind === 'blade') { const c = document.createElement('canvas'); c.width = 200; c.height = 1000; const x2 = c.getContext('2d'); x2.fillStyle = '#1a1c20'; x2.fillRect(0, 0, 200, 1000);
    x2.fillStyle = '#ff4fd8'; x2.shadowColor = '#ff4fd8'; x2.shadowBlur = 24; x2.font = 'bold 120px Futura, Helvetica'; x2.textAlign = 'center'; [...e.text.replace(' ', '')].forEach((ch, i) => x2.fillText(ch, 100, 120 + i * 105));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 1.4, side: THREE.DoubleSide});
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 1.2), [flat(0x1a1c20), flat(0x1a1c20), flat(0x1a1c20), flat(0x1a1c20), m, m]); b.rotation.y = Math.PI / 2; b.position.set(e.x, e.z + 3, -0.8); g.add(b); }
  if (e.kind === 'terrace') { g.add(box(-0.5, FW + 0.5, -e.d, 0, 0, L[0].z, tile('planks')));
    for (let i = 0; i < 4; i++) { prop('table', 1.6 + i * 2.8, -e.d / 2, L[0].z, 0, g); prop('chair', 1.6 + i * 2.8, -e.d / 2 - 0.7, L[0].z, 180, g); prop('chair', 1.6 + i * 2.8, -e.d / 2 + 0.7, L[0].z, 0, g); } }
  if (e.kind === 'piles') for (let x = 0; x <= FW; x += 3.5) for (let y = -4; y <= FD; y += 3) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 4, 8), flat(0x2a2420)); p.position.set(x, -2, y); g.add(p); }
  if (e.kind === 'porch') { const z = L[0].z; g.add(box(0, FW, FD - 1.5 - 0.01 - 0, FD - 1.5 + e.d, z - 0.1, z, tile('planks')));
    for (let i = 0; i < 6; i++) g.add(box(FW - 1.2, FW - 0.1, FD - 1.5 + e.d + i * 0.28, FD - 1.5 + e.d + (i + 1) * 0.28, 0, z - (i + 1) * z / 6, tile('planks'))); }
  if (e.kind === 'pergola') { const z = L[0].z, h = 3.0, d = e.d || 4;               // timber posts and beams over the terrace, canvas between
    for (let x = 0; x <= FW + 0.01; x += FW / 4) { g.add(box(x - 0.1, x + 0.1, -d - 0.1, -d + 0.1, z, z + h, tile('wood siding'))); }
    g.add(box(-0.2, FW + 0.2, -d - 0.12, -d + 0.12, z + h, z + h + 0.25, tile('wood siding'))); for (let x = 0; x <= FW + 0.01; x += FW / 8) g.add(box(x - 0.06, x + 0.06, -d - 0.3, 0, z + h + 0.25, z + h + 0.4, tile('wood siding')));
    for (let x = 0; x < FW; x += 1.2) g.add(box(x, x + 1.0, -d, 0, z + h + 0.4, z + h + 0.42, flat(0xf1ece0, {side: THREE.DoubleSide, t: 0.85})));
    g.add(box(-0.2, FW + 0.2, -d - 0.05, -d + 0.05, z + 0.9, z + 1.0, tile('wood siding'))); for (let x = 0; x <= FW; x += 0.25) g.add(box(x - 0.02, x + 0.02, -d - 0.02, -d + 0.02, z, z + 0.9, tile('wood siding'))); }
  if (e.kind === 'posters') { const z = L[0].z; for (let i = 0; i < e.n; i++) { const x = e.x0 + i * (e.x1 - e.x0) / Math.max(1, e.n - 1), c = [0xff3a6a, 0xffb020, 0x40c8ff, 0xff6020, 0xc040ff, 0x40ff9a][i % 6];
      g.add(box(x - 0.6, x + 0.6, -0.5, -0.3, z + 0.4, z + 2.4, flat(c, {e: c, ei: 1.6}))); g.add(box(x - 0.66, x + 0.66, -0.32, -0.16, z + 0.34, z + 2.46, flat(0x1a1c20, {m: 0.6}))); } }
  if (e.kind === 'buttress') for (const [x, y] of [[0, 0], [FW, 0], [0, FD], [FW, FD]]) { const sx = x ? 1 : -1, sy = y ? 1 : -1;
    for (let k = 0; k < 3; k++) g.add(box(x + sx * (0.0 + 0) - (sx < 0 ? 0.7 - k * 0.15 : 0), x + (sx > 0 ? 0.7 - k * 0.15 : 0), y - (sy < 0 ? 0.7 - k * 0.15 : 0), y + (sy > 0 ? 0.7 - k * 0.15 : 0), k * top / 3, (k + 1) * top / 3 - 0.3, tile(H.skin.wall))); }
  if (e.kind === 'bay') { const z0 = L[e.from].z, z1 = L[e.to].z + L[e.to].h, x = e.x, w = e.w, dd = 0.9;          // a bay window: three faces of glass pushed out from the front
    g.add(box(x, x + w, -dd, 0, z0 - 0.3, z0, tile(H.skin.trim))); g.add(box(x - 0.05, x + w + 0.05, -dd - 0.05, 0, z1 - 0.25, z1, tile(H.skin.trim)));
    for (let k = e.from; k <= e.to; k++) { const zb = L[k].z + 0.6, zt = L[k].z + L[k].h - 0.5;
      g.add(box(x + 0.15, x + w - 0.15, -dd - 0.01, -dd + 0.01, zb, zt, GLASS)); g.add(box(x, x + 0.02, -dd, -0.1, zb, zt, GLASS)); g.add(box(x + w - 0.02, x + w, -dd, -0.1, zb, zt, GLASS));
      g.add(box(x, x + w, -dd - 0.04, 0, zb - 0.6, zb, tile(H.skin.wall))); g.add(box(x, x + w, -dd - 0.04, 0, zt, L[k].z + L[k].h, tile(H.skin.wall)));
      for (const xx of [x, x + 0.12, x + w / 2 - 0.05, x + w - 0.12]) g.add(box(xx, xx + 0.1, -dd - 0.03, -dd + 0.03, zb, zt, tile(H.skin.trim))); } }
  if (e.kind === 'spire') { const s = new THREE.Mesh(new THREE.ConeGeometry(0.4, e.h, 8), tile(H.skin.roof)); s.position.set(FW / 2, top + 6 + e.h / 2, FD / 2); g.add(s); }
}

// ——— compile ———
export function build(Hraw, opt = {}) {
  const H = expand(Hraw), era = opt.state || 'intact', ruin = era === 'ruin' || (era === 'reuse' && H.eras.reuse === 'white temple');   // the temple keeps the ruin inside it
  const LW = H.levels.map(l => wallsOf(l, H)), issues = []; placeOpenings(H, LW, issues);
  const F = flightsOf(H), G = new THREE.Group(), levels = [], walls2d = [];
  const skin = tile(H.skin.wall, {variant: 0}), trim = tile(H.skin.trim, {rough: 0.5});
  H.levels.forEach((l, k) => {
    const lg = new THREE.Group(); lg.userData.level = k; G.add(lg); levels.push(lg); const w2 = []; walls2d.push(w2);
    // floors (with holes over arriving flights) and ceilings
    for (const r of l.rooms) {
      let parts = [{x: r.x, y: r.y, w: r.w, d: r.d}];
      for (const f of F) if (f.to === k || (f.from === k && false)) parts = parts.flatMap(p => subtract(p, f.hole));
      for (const p of parts) lg.add(box(p.x, p.x + p.w, p.y, p.y + p.d, r.z - 0.25, r.z, tile(r.floor || 'floorboards', {rough: 0.7})));
      if (!ruin || k === 0) { const c = box(r.x, r.x + r.w, r.y, r.y + r.d, r.z + r.h - 0.27, r.z + r.h - 0.25, tile(r.ceiling || 'plaster')); c.userData.ceiling = true; lg.add(c); }
      for (const p of r.props || []) if (!ruin || rnd(p[1] * 3 + p[2]) < 0.4) prop(p[0], p[1], p[2], r.z, p[3], lg);
    }
    if (k === 0) { const z = l.z; if (z > 0.05) lg.add(box(-0.15, H.footprint[0] + 0.15, -0.15, H.footprint[1] + 0.15, -0.6, z - 0.25, tile(H.skin.base))); }
    // walls with their openings
    for (const s of LW[k]) {
      const z0 = s.z, Hh = s.h, t = s.ext ? 0.3 : 0.12, ops = s.openings.sort((a, b) => a.s - b.s);
      const along = (a, b, za, zb, inner) => {                         // one piece of wall between a and b (along the segment), za..zb high
        if (b - a < 0.005 || zb - za < 0.005) return;
        const cut = ruin && s.ext ? (0.35 + 0.6 * rnd(a * 3.1 + s.c)) : 1, top = za + Math.min(zb - za, (zb - za) * cut + (zb === z0 + Hh ? 0 : 0));
        const lay = (o0, o1, mat) => { const m = s.o === 'h' ? box(a, b, s.c + o0, s.c + o1, za, ruin ? Math.min(zb, z0 + Hh * cut) : zb, mat) : box(s.c + o0, s.c + o1, a, b, za, ruin ? Math.min(zb, z0 + Hh * cut) : zb, mat);
          m.userData.wall = {ext: s.ext, side: s.side}; lg.add(m); };
        if (s.ext) { const inSide = s.P ? 1 : -1, room = s.P || s.N; if (inSide > 0) { lay(-0.15, 0.03, skin); lay(0.03, 0.15, tile(room.wall || 'plaster')); } else { lay(-0.03, 0.15, skin); lay(-0.15, -0.03, tile(room.wall || 'plaster')); } }
        else { lay(0, 0.06, tile(s.P.wall || 'plaster')); lay(-0.06, 0, tile(s.N.wall || 'plaster')); }
      };
      let cur = s.a;
      for (const o of ops) { const a = o.s - o.w / 2, b = o.s + o.w / 2; along(cur, a, z0, z0 + Hh); along(a, b, z0, z0 + o.z0); along(a, b, z0 + o.z1, z0 + Hh); cur = b;
        // the opening itself: frame, glass, a door leaf half open
        const fr = (a0, a1, b0, b1) => lg.add(s.o === 'h' ? box(a0, a1, s.c - (s.ext ? 0.2 : 0.08), s.c + (s.ext ? 0.2 : 0.08), b0, b1, trim) : box(s.c - (s.ext ? 0.2 : 0.08), s.c + (s.ext ? 0.2 : 0.08), a0, a1, b0, b1, trim));
        fr(a - 0.08, a, z0 + o.z0, z0 + o.z1 + 0.08); fr(b, b + 0.08, z0 + o.z0, z0 + o.z1 + 0.08); fr(a - 0.1, b + 0.1, z0 + o.z1, z0 + o.z1 + 0.14);
        if (o.shape === 'lancet') {                 // a pointed arch: wall wedges fill the top corners of the opening
          const hh = Math.min(o.w * 0.9, (o.z1 - o.z0) * 0.4), zt = z0 + o.z1, n = 6;
          for (let i = 0; i < n; i++) { const f0 = i / n, f1 = (i + 1) / n, zA = zt - hh + hh * f0, zB = zt - hh + hh * f1, cut = (o.w / 2) * (1 - Math.sqrt(Math.max(0, 1 - Math.pow(1 - f1, 2) * 0 - f1 * f1)) * 0) * f1;
            const wl = (o.w / 2) * (1 - Math.sqrt(1 - f1 * f1)) + (o.w / 2) * f1 * 0.0;
            const ww = (o.w / 2) * (1 - Math.cos(Math.asin(Math.min(1, f1))));
            const k = (o.w / 2) * f1;                                  // straight pointed: the wedge grows linearly to the apex
            lg.add(s.o === 'h' ? box(a, a + k, s.c - 0.16, s.c + 0.16, zA, zB, skin) : box(s.c - 0.16, s.c + 0.16, a, a + k, zA, zB, skin));
            lg.add(s.o === 'h' ? box(b - k, b, s.c - 0.16, s.c + 0.16, zA, zB, skin) : box(s.c - 0.16, s.c + 0.16, b - k, b, zA, zB, skin)); } }
        if (o.kind === 'window' && H.skin.surround && s.ext && o.shape !== 'lancet' && o.shape !== 'clock') {   // stone surrounds: a deeper frame, a keystone
          const out = s.P ? -1 : 1, sur = (a0, a1, b0, b1) => lg.add(s.o === 'h' ? box(a0, a1, s.c + out * 0.16, s.c + out * 0.26, b0, b1, trim) : box(s.c + out * 0.16, s.c + out * 0.26, a0, a1, b0, b1, trim));
          sur(a - 0.25, a - 0.05, z0 + o.z0 - 0.1, z0 + o.z1 + 0.1); sur(b + 0.05, b + 0.25, z0 + o.z0 - 0.1, z0 + o.z1 + 0.1); sur(a - 0.3, b + 0.3, z0 + o.z1 + 0.05, z0 + o.z1 + 0.32); sur(o.s - 0.14, o.s + 0.14, z0 + o.z1 + 0.05, z0 + o.z1 + 0.5); sur(a - 0.3, b + 0.3, z0 + o.z0 - 0.18, z0 + o.z0 - 0.05); }
        if (o.kind === 'window') { fr(a - 0.12, b + 0.12, z0 + o.z0 - 0.08, z0 + o.z0);
          if (!ruin) { const gl = s.o === 'h' ? box(a, b, s.c - 0.01, s.c + 0.01, z0 + o.z0, z0 + o.z1, o.shape === 'rose' ? flat(0x6040a0, {e: 0x8050ff, ei: 0.5, t: 0.75}) : o.shape === 'clock' ? flat(0xf3ecd8, {e: 0xfff0c8, ei: 0.25, t: 0.85}) : GLASS)
              : box(s.c - 0.01, s.c + 0.01, a, b, z0 + o.z0, z0 + o.z1, GLASS); gl.castShadow = false; lg.add(gl);
            const mul = s.o === 'h' ? box(o.s - 0.025, o.s + 0.025, s.c - 0.03, s.c + 0.03, z0 + o.z0, z0 + o.z1, trim) : box(s.c - 0.03, s.c + 0.03, o.s - 0.025, o.s + 0.025, z0 + o.z0, z0 + o.z1, trim); lg.add(mul); } }
        if (o.kind === 'door' && !ruin) { const leaf = new THREE.Group(), ww = o.w * (o.w > 1.5 ? 0.5 : 1);
          const lm = box(0, ww, -0.025, 0.025, 0, o.z1 - 0.02, o.outside ? tile('panelling') : tile('wood siding')); leaf.add(lm);
          if (s.o === 'h') { leaf.position.set(a, z0, s.c); leaf.rotation.y = -1.15; } else { leaf.position.set(s.c, z0, a); leaf.rotation.y = -Math.PI / 2 - 1.15; }
          lg.add(leaf); }
        w2.push({o: s.o, c: s.c, a, b, z0: z0 + o.z0, z1: z0 + o.z1, kind: o.kind}); }
      along(cur, s.b, z0, z0 + Hh);
      w2.push({o: s.o, c: s.c, a: s.a, b: s.b, z0, z1: z0 + Hh, kind: 'wall', ops: ops.map(o => [o.s - o.w / 2, o.s + o.w / 2, z0 + o.z0, z0 + o.z1, o.kind])});
    }
  });
  // stairs: true treads and risers, stringers, a rail
  const sg = new THREE.Group(); G.add(sg);
  for (const f of F) { const m = tile(H.levels[f.from].rooms.find(r => r === f._a)?.floor || 'floorboards'), g = new THREE.Group(); g.userData.level = f.from;
    for (let i = 0; i < f.n; i++) { const t0 = i / f.n, t1 = (i + 1) / f.n, z = f.z0 + f.riser * (i + 1);
      if (f.ax === 'y') { const y0 = f.dirS > 0 ? f.y + t0 * f.d : f.y + f.d - t1 * f.d, y1 = f.dirS > 0 ? f.y + t1 * f.d : f.y + f.d - t0 * f.d; g.add(box(f.x, f.x + f.w, y0, y1, Math.max(f.z0, z - 0.35), z, m)); }
      else { const x0 = f.dirS > 0 ? f.x + t0 * f.w : f.x + f.w - t1 * f.w, x1 = f.dirS > 0 ? f.x + t1 * f.w : f.x + f.w - t0 * f.w; g.add(box(x0, x1, f.y, f.y + f.d, Math.max(f.z0, z - 0.35), z, m)); } }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, Math.hypot(f.run, f.rise), 6), flat(0x4a3220, {r: 0.4}));
    const xr = f.ax === 'y' ? f.x + f.w - 0.05 : f.x + f.w / 2, yr = f.ax === 'y' ? f.y + f.d / 2 : f.y + f.d - 0.05;
    rail.position.set(xr, (f.z0 + f.z1) / 2 + 0.9, yr); rail.rotation[f.ax === 'y' ? 'x' : 'z'] = (f.ax === 'y' ? 1 : -1) * f.dirS * (Math.PI / 2 - Math.atan2(f.rise, f.run)) * (f.ax === 'y' ? 1 : 1); g.add(rail);
    sg.add(g); }
  // roofs: over every room with nothing above it
  const rg = new THREE.Group(); G.add(rg); let top = 0;
  const rooms = H.levels.flatMap(l => l.rooms);
  for (const r of rooms) top = Math.max(top, r.z + r.h);
  if (!ruin) {
    if (H.roof.type === 'flat') { for (const r of rooms) { const above = rooms.some(q => q.z >= r.z + r.h - 0.01 && q.z < r.z + r.h + 0.5 && ov(q, r) > 0.01); if (!above) rg.add(box(r.x - 0.15, r.x + r.w + 0.15, r.y - 0.15, r.y + r.d + 0.15, r.z + r.h - 0.25, r.z + r.h, tile(H.skin.roof))); }
      const [W, D] = H.footprint, p = H.roof.parapet || 0.6; rg.add(box(-0.15, W + 0.15, -0.15, 0.15, top, top + p, skin)); rg.add(box(-0.15, W + 0.15, D - 0.15, D + 0.15, top, top + p, skin)); rg.add(box(-0.15, 0.15, -0.15, D + 0.15, top, top + p, skin)); rg.add(box(W - 0.15, W + 0.15, -0.15, D + 0.15, top, top + p, skin)); }
    if (H.roof.type === 'gable') { const [W, D] = H.footprint, o = H.roof.overhang || 0.3, along = H.roof.axis === 'y', span = along ? W : D, len = along ? D : W, rise = H.roof.rise;
      const sh = new THREE.Shape(); sh.moveTo(-span / 2 - o, 0); sh.lineTo(span / 2 + o, 0); sh.lineTo(0, rise); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, {depth: len + 2 * o, bevelEnabled: false}); const p = geo.attributes.position, uv = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i), p.getX(i) + p.getY(i));
      const m = new THREE.Mesh(geo, tile(H.skin.roof)); m.castShadow = true;
      if (along) { m.rotation.y = 0; m.position.set(W / 2, top, -o); } else { m.rotation.y = Math.PI / 2; m.position.set(-o, top, D / 2); }
      rg.add(m); for (const yy of along ? [0, D] : []) { const gs = new THREE.Shape(); gs.moveTo(-W / 2, 0); gs.lineTo(W / 2, 0); gs.lineTo(0, rise); gs.closePath(); const gm = new THREE.Mesh(new THREE.ShapeGeometry(gs), skin); gm.position.set(W / 2, top, yy); gm.rotation.y = yy ? Math.PI : 0; rg.add(gm); } }
    if (H.roof.type === 'pyramid') { const [W, D] = H.footprint; const c = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(W, D) / 2 + 0.3, H.roof.rise, 4), tile(H.skin.roof)); c.rotation.y = Math.PI / 4; c.position.set(W / 2, top + H.roof.rise / 2, D / 2); rg.add(c); }
  }
  const xg = new THREE.Group(); G.add(xg); for (const e of H.exterior || []) { if (ruin && ['marquee', 'blade', 'awning', 'terrace', 'watertank'].includes(e.kind)) continue; exterior(H, e, xg, top); }
  const vg = new THREE.Group(); G.add(vg);
  if (era === 'reuse' && H.eras.reuse === 'white temple') {      // the Resurrection's vault, over the ruin
    const [W, D] = H.footprint, R = W * 0.95, shell = new THREE.CylinderGeometry(R, R, D + 12, 40, 1, true, -Math.PI / 2, Math.PI); shell.rotateX(Math.PI / 2);
    const v = new THREE.Mesh(shell, flat(0xf4f2ec, {r: 0.5, side: THREE.DoubleSide, t: 0.82})); v.position.set(W / 2, 0, D / 2); vg.add(v);
    for (let k = 0; k <= 12; k++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(R + 0.3, 0.25, 6, 40, Math.PI), flat(0xffffff)); rib.position.set(W / 2, 0, -6 + k * (D + 12) / 12 + 0); vg.add(rib); } }
  // the mass model: each room as a block, coloured by use
  const MASS = {home: 0xd9b38c, hall: 0xb8c4cc, stair: 0x8fa3b0, shop: 0xe0c070, assembly: 0xc9a0dc, service: 0x9a9a9a, cafe: 0xe8a080, kitchen: 0xd0d080};
  const mass = new THREE.Group(); for (const r of rooms) { const m = box(r.x + 0.05, r.x + r.w - 0.05, r.y + 0.05, r.y + r.d - 0.05, r.z, r.z + r.h - 0.3, flat(MASS[r.use] || 0xcccccc, {t: 0.55})); m.castShadow = false; m.userData.room = r; mass.add(m); }
  return {H, group: G, levels, mass, flights: F, walls2d, top, rooms, roof: rg, ext: xg, stairs: sg};
}
