// THE SETS — each poem's place, built so you can get out of the car and walk in.
// After the Odyssey cinerium's set kinds ({fog, sky, paint, relief} laid round a centre with
// walkable corridors): every builder lays a staged set in a local frame (a = toward the street /
// the sea, b = across), returns its colliders (wall segments), its levels (raised floors you can
// fall from), its doors (that carry you up or out) and its practical lights.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const M = {};
const mat = (c, o = {}) => M[c + JSON.stringify(o)] ||= new THREE.MeshLambertMaterial({color: c, ...o});
const glow = c => M['g' + c] ||= new THREE.MeshBasicMaterial({color: c});

export function buildSet(S, ctx) {
  const {hAt} = ctx;
  const cx = S.x, cy = S.y, z0 = Math.max(hAt(cx, cy), 0.2);
  const u = ctx.front, v = {x: -u.y, y: u.x};
  const W = (a, b) => [cx + u.x * a + v.x * b, cy + u.y * a + v.y * b];
  const rotY = Math.atan2(-u.y, u.x);
  const g = new THREE.Group();
  const out = {group: g, walls: [], levels: [], doors: [], lights: [], marks: {}, cast: [], z0, W, front: u};
  const box = (a, b, z, la, lb, hh, color, opts = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(la, hh, lb), opts.glow ? glow(color) : mat(color, opts.mat || {}));
    const [x, y] = W(a, b); m.position.set(x, z0 + z + hh / 2, y); m.rotation.y = rotY + (opts.rot || 0);
    g.add(m); return m;
  };
  const cyl = (a, b, z, r, hh, color, seg = 12, r2) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2 ?? r, r, hh, seg), mat(color));
    const [x, y] = W(a, b); m.position.set(x, z0 + z + hh / 2, y); g.add(m); return m;
  };
  const wall = (a0, b0, a1, b1, z = 0) => { const p = W(a0, b0), q = W(a1, b1); out.walls.push([p[0], p[1], q[0], q[1], z0 + z]); };
  // a walled room: perimeter walls with gaps [{side:'front'|'back'|'left'|'right', at, w}]
  const room = (a, b, la, lb, hh, color, gaps = [], z = 0, collide = true) => {
    const sides = {front: [[a + la / 2, b - lb / 2], [a + la / 2, b + lb / 2]], back: [[a - la / 2, b - lb / 2], [a - la / 2, b + lb / 2]],
      left: [[a - la / 2, b - lb / 2], [a + la / 2, b - lb / 2]], right: [[a - la / 2, b + lb / 2], [a + la / 2, b + lb / 2]]};
    for (const [side, [p, q]] of Object.entries(sides)) {
      const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const gs = gaps.filter(x => x.side === side).sort((x, y) => x.at - y.at);
      let t0 = 0;
      const seg = (t1) => {
        if (t1 - t0 < 0.05) return;
        const ma = p[0] + (q[0] - p[0]) * (t0 + t1) / 2 / L, mb = p[1] + (q[1] - p[1]) * (t0 + t1) / 2 / L;
        const along = side === 'front' || side === 'back';
        box(ma, mb, z, along ? 0.3 : t1 - t0, along ? t1 - t0 : 0.3, hh, color);
        if (collide) wall(p[0] + (q[0] - p[0]) * t0 / L, p[1] + (q[1] - p[1]) * t0 / L, p[0] + (q[0] - p[0]) * t1 / L, p[1] + (q[1] - p[1]) * t1 / L, z);
      };
      for (const gp of gs) { seg(gp.at - gp.w / 2); t0 = gp.at + gp.w / 2; }
      seg(L);
    }
  };
  const figure = (a, b, z, color, h = 1.75, glowHands) => {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, h - 0.75, 4, 8), mat(color));
    body.position.y = (h - 0.25) / 2 + 0.05; grp.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(color)); head.position.y = h - 0.12; grp.add(head);
    if (glowHands) for (const s of [-1, 1]) { const hnd = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), glow(glowHands)); hnd.position.set(0.32 * s, h * 0.55, 0.15); grp.add(hnd); }
    const [x, y] = W(a, b); grp.position.set(x, z0 + z, y); grp.rotation.y = rotY - Math.PI / 2;
    g.add(grp); out.cast.push(grp); return grp;
  };
  const lamp = (a, b, z, color, post = 4.2) => {
    if (post > 0) box(a, b, z, 0.14, 0.14, post, '#2a2a2a');
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), glow(color));
    const [x, y] = W(a, b); s.position.set(x, z0 + z + post + 0.1, y); g.add(s);
    out.lights.push([x, z0 + z + post, y, color]);
  };
  const level = (id, z, rects, label) => {
    out.levels.push({id, z: z0 + z, label, polys: rects.map(([a0, b0, a1, b1]) => [W(a0, b0), W(a1, b0), W(a1, b1), W(a0, b1)])});
  };
  const door = (a, b, z, toA, toB, toZ, label, level) => {
    const fr = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 20, Math.PI), glow('#ffd23f'));
    const [x, y] = W(a, b); fr.position.set(x, z0 + z + 1.2, y); fr.rotation.y = rotY + Math.PI / 2; g.add(fr);
    const [tx, ty] = W(toA, toB);
    out.doors.push({x, y, z: z0 + z, to: {x: tx, y: ty, z: z0 + toZ}, label, level});
  };
  const C = (k) => S.light.prac;
  const T = S.type;

  if (T === 'tower') {                     // 01: nine storeys of brick, the room at the top, the fire escape outside the window
    const A0 = -11, la = 16, lb = 16;
    box(A0, 0, 0, la, lb, 29.5, '#7a4a3c');
    room(A0, 0, la, lb, 0, '#000', []);   // collider round the base
    room(A0, 0, la, lb, 4, '#8a5446', [{side: 'front', at: 8, w: 3.2}], 29.5, false);
    box(A0, 0, 33.6, la, lb, 0.4, '#3a2a26');
    box(A0 - 3, -3, 29.5, 2.2, 3.4, 0.6, '#d8d0c0');                     // the bed
    box(A0 - 6, 4, 29.5, 0.4, 1.6, 1.1, '#3fa0ff', {glow: true});        // the TV and its chaos
    for (let k = 0; k < 10; k++) {                                        // fire escape: landings and stairs up the front
      box(A0 + la / 2 + 0.8, 0, k * 3, 1.4, 3.2, 0.12, '#222');
      box(A0 + la / 2 + 0.8, (k % 2 ? 1 : -1) * 0.6, k * 3 + 1.4, 1.2, 2.6, 0.08, '#333', {rot: 0});
    }
    box(A0 + la / 2 + 1.5, 0, 29.6, 0.06, 3.2, 1.0, '#222');              // the railing on the top landing
    figure(A0 + la / 2 + 0.8, 0.8, 30.0, '#1b1b22');                      // the EX, already out on the ledge
    lamp(A0 - 1, -5, 29.5, '#ffcf8a', 0);
    level('room', 29.5, [[A0 - la / 2 + 0.3, -lb / 2 + 0.3, A0 + la / 2, lb / 2 - 0.3], [A0 + la / 2, -1.5, A0 + la / 2 + 1.5, 1.5]], 'the room at the top');
    door(A0 + la / 2 + 0.6, -4, 0, A0 - 2, 0, 29.5, 'go up to the room', null);
    door(A0 - 6, -6, 29.5, A0 + la / 2 + 2.5, -4, 0, 'take the stairs down', 'room');
    for (let k = -2; k <= 2; k++) lamp(3, k * 9, 0, '#ffb45c');
    out.marks.window = W(A0 + la / 2, 0);
  }
  if (T === 'house') {                     // 02: the childhood house, the window on the street, the curb, the streetlights
    room(-7, 0, 9, 11, 3.2, '#d2c2a4', [{side: 'front', at: 3, w: 1.4}, {side: 'front', at: 7.6, w: 2.4}]);
    box(-7, 0, 3.2, 9.4, 11.4, 0.3, '#6a4a3a');
    box(-9, 1.5, 0, 2.2, 0.9, 0.8, '#7a5a8a');                            // sofa
    lamp(-9.5, -3.5, 0, '#ffb070', 1.4);
    box(2, -3, 0, 4.2, 1.8, 1.3, '#9a1f1f');                              // the car at the curb
    for (let k = -2; k <= 2; k++) lamp(3.4, k * 8, 0, k === 0 ? '#ff4040' : '#ffb45c');
    figure(-8, 2, 0, '#2a2a30');
  }
  if (T === 'chapel') {                    // 03: the chapel on the eroding shore, walls broken, side doors onto ivy and stone
    const L = 18, B = 9;
    for (let k = 0; k < 6; k++) {
      const h1 = 6 - Math.abs(Math.sin(k * 1.7)) * 3;
      box(-L / 2 + 1.5 + k * 3, -B / 2, 0, 3, 0.4, h1, '#b8b2a4');
      box(-L / 2 + 1.5 + k * 3, B / 2, 0, 3, 0.4, k === 2 ? 0 : h1 * 0.9, '#b8b2a4');
    }
    wall(-L / 2, -B / 2, L / 2, -B / 2); wall(-L / 2, B / 2, -L / 2 + 6, B / 2); wall(-L / 2 + 9, B / 2, L / 2, B / 2);
    box(-L / 2, 0, 0, 0.4, B, 7.5, '#a8a294'); wall(-L / 2, -B / 2, -L / 2, B / 2);
    box(-L / 2 + 7.5, B / 2 + 1.2, 0, 3, 2.4, 0.18, '#8a8478');           // the stone threshold
    for (let k = 0; k < 7; k++) box(-L / 2 + 3 + k * 2, -1.8, 0, 0.5, 2.6, 0.9, '#5a4434'), box(-L / 2 + 3 + k * 2, 1.8, 0, 0.5, 2.6, 0.9, '#5a4434');
    box(-L / 2 + 0.8, 0, 0, 1.2, 2.4, 1.1, '#cfc8b8');                    // the altar
    for (let k = 0; k < 9; k++) box(-L / 2 + 1 + k * 2, B / 2 + 0.25, 1 + (k % 3), 1.6, 0.2, 2.2, '#3f6a32');  // ivy
    figure(2, 0, 0, '#2a2a30'); figure(5, 0.8, 0, '#e8e2d6');
    lamp(-L / 2 + 1, -3, 0, '#e8e2c8', 0.6);
  }
  if (T === 'beach') {                     // 04: night beach, the chapel's wreckage washed in, burned trees, the trail up the dune
    for (let k = 0; k < 7; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(9 + k % 3 * 3, 14, 8), mat('#d9c99e'));
      const [x, y] = W(-14 - (k % 3) * 9, (k - 3) * 11); m.position.set(x, z0 - 6.5, y); m.scale.y = 0.55; g.add(m);
    }
    for (let k = 0; k < 14; k++) {
      const a = 2 + Math.sin(k * 5.1) * 5, b = (k - 7) * 3.4;
      box(a, b, 0, 0.3 + (k % 3) * 0.6, 2.4 + (k % 4), 0.25, k % 3 ? '#5a4030' : '#7a6a58', {rot: k * 0.9});
    }
    box(4, -3, 0, 2.1, 1.0, 0.12, '#6a4a32', {rot: 0.4});                  // the chapel door in the sand
    for (let k = 0; k < 10; k++) {
      const a = -26 - (k % 4) * 4, b = -14 + k * 3.1;
      cyl(a, b, 0, 0.18, 5 + (k % 3) * 1.5, '#16110e', 6);
      box(a, b, 3.5 + (k % 2), 2.2, 0.12, 0.12, '#16110e', {rot: k});
    }
    for (let k = 0; k < 12; k++) box(-4 - k * 2.4, 6, k * 0.35, 2.2, 1.2, 0.12, '#8a7a62');  // planks up the dune
    figure(0, 4, 0, '#2a2a30');
    lamp(-6, 8, 0, '#ff8a50', 0.3); lamp(1, -6, 0, '#ff6a30', 0.2);       // embers, ash
  }
  if (T === 'meadow') {                    // 05: the processional path, the ancestors, stars passed hand to hand
    for (let k = 0; k < 11; k++) {
      lamp(-30 + k * 6, -3, 0, '#ffe9a8', 1.6); lamp(-30 + k * 6, 3, 0, '#ffe9a8', 1.6);
      if (k % 2 === 0) { figure(-30 + k * 6, -4.6, 0, '#14100c', 2.1, '#ffe9a8'); figure(-30 + k * 6, 4.6, 0, '#14100c', 2.1, '#ffe9a8'); }
    }
    box(0, 0, 0, 66, 2.2, 0.05, '#a89a70');
    for (let k = 0; k < 40; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), glow('#fff6d0'));
      const [x, y] = W(-20 + Math.random() * 40, (Math.random() - .5) * 6); s.position.set(x, z0 + 1.4 + Math.random() * 2.2, y); g.add(s);
    }
    figure(-32, 0, 0, '#2a2a30');
  }
  if (T === 'gates') {                     // 06: wings gifted from evolution, made of marble stones
    for (const s of [-1, 1]) {
      box(0, 8 * s, 0, 4.5, 4.5, 26, '#ece8de'); wall(-2.2, 8 * s - 2.2, 2.2, 8 * s - 2.2); wall(-2.2, 8 * s + 2.2, 2.2, 8 * s + 2.2);
      box(0.6, 12.5 * s, 9, 1.0, 9, 16, '#f4f0e6', {rot: 0.0}).rotation.z = 0;
      const w = box(0.4, 15 * s, 14, 0.6, 7, 12, '#ffffff'); w.rotation.y += 0.5 * s;
    }
    box(0, 0, 22, 4, 21, 3, '#ece8de');
    for (let k = 0; k < 6; k++) { box(-14 - k * 9, -9, 0, 8, 6, 9 + (k % 3) * 3, '#b9b0a2'); box(-14 - k * 9, 9, 0, 8, 6, 8 + (k % 2) * 4, '#a99f90'); }
    for (let k = 0; k < 6; k++) lamp(-12 - k * 9, -5.5, 0, '#ff3d9a', 3), lamp(-12 - k * 9, 5.5, 0, '#7fe0ff', 3);
    figure(6, 0, 0, '#2a2a30');
  }
  if (T === 'party') {                     // 07: the house party: bar, DJ booth, the open mic
    room(-8, 0, 13, 11, 3.6, '#5a3448', [{side: 'front', at: 5.5, w: 1.6}]);
    box(-8, 0, 3.6, 13.4, 11.4, 0.3, '#2a1a24');
    box(-12, -3, 0, 1, 4, 1.1, '#4a2a1a'); box(-13.8, 2.5, 0, 1.2, 3, 1.2, '#222');
    box(-13.6, 2.5, 1.2, 0.2, 3, 0.4, '#ff3d9a', {glow: true});
    cyl(-6, 3.6, 0, 0.03, 1.5, '#888', 6);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) box(-9 + i * 1.6, -2 + j * 1.6, 0.01, 1.5, 1.5, 0.04, ['#ff3d9a', '#7fe0ff', '#c58cff', '#ffd23f'][(i + j) % 4], {glow: true});
    for (let k = 0; k < 9; k++) figure(-10 + (k % 3) * 2, -3 + Math.floor(k / 3) * 2, 0, ['#1b1b22', '#2a2030', '#20282a'][k % 3]);
    lamp(-8, -4, 3.0, '#ff3d9a', 0); lamp(-8, 4, 3.0, '#7fe0ff', 0);
  }
  if (T === 'rooftop') {                   // 08: the open-air club on the roof, the city below, unfamiliar mountains
    const A0 = -13, s = 20, Hh = 58;
    box(A0, 0, 0, s, s, Hh, '#6a7486'); room(A0, 0, s, s, 0, '#000', []);
    for (let k = 0; k < 4; k++) box(A0, 0, Hh, s - 0.1, 0.3, 1.1, '#9fd8ff', {rot: k * Math.PI / 2, glow: k % 2 === 0});
    box(A0 - 5, 0, Hh, 1.4, 4, 1.1, '#222'); box(A0 - 5.1, 0, Hh + 1.1, 1.0, 3.6, 0.25, '#c58cff', {glow: true});
    for (let k = 0; k < 7; k++) figure(A0 + (k % 3) * 3 - 2, (k - 3) * 1.8, Hh, '#1b1b22');
    lamp(A0, -8, Hh, '#ff3d9a', 2.4); lamp(A0, 8, Hh, '#7fe0ff', 2.4);
    level('roof', Hh, [[A0 - s / 2 + 0.4, -s / 2 + 0.4, A0 + s / 2 - 0.4, s / 2 - 0.4]], 'the rooftop club');
    door(A0 + s / 2 + 0.6, 3, 0, A0, 4, Hh, 'take the lift to the roof', null);
    door(A0 + 6, 6, Hh, A0 + s / 2 + 2, 3, 0, 'take the lift down', 'roof');
  }
  if (T === 'booth') {                     // 09: the lit phone booth on the sidewalk, the motorcycle at the curb
    const b = box(-2, 0, 0, 1.2, 1.2, 2.4, '#9fd8ff', {mat: {transparent: true, opacity: 0.35}});
    box(-2, 0, 2.4, 1.3, 1.3, 0.12, '#ffd27a', {glow: true});
    lamp(-2, 0, 2.0, '#ffd27a', 0);
    box(1.5, 2.5, 0.3, 2.0, 0.4, 0.6, '#151515'); cyl(1.5 - 0.8, 2.5, 0, 0.32, 0.12, '#000', 12); cyl(1.5 + 0.8, 2.5, 0, 0.32, 0.12, '#000', 12);
    lamp(1.5, -4, 0, '#ffb45c');
    figure(-2, 0, 0, '#2a2a30');
    out.marks.bike = W(1.5, 2.5);
  }
  if (T === 'ride') {                      // 10: the motorcycle, and the road toward the mountains
    box(1.5, 0, 0.3, 2.0, 0.4, 0.6, '#151515');
    lamp(1, -5, 0, '#ffd9a0'); lamp(1, 5, 0, '#ffd9a0');
    out.marks.bike = W(1.5, 0);
  }
  if (T === 'temple') {                    // 11: the white temple raised on the chapel's ruins
    for (let k = 0; k < 7; k++) box(-12 + k * 4, -11, 0, 2.6, 0.5, 1 + (k % 3) * 0.6, '#9a9284');
    cyl(-2, 0, 0, 10, 1.2, '#f4f2ec', 32);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2;
      cyl(-2 + Math.cos(a) * 8.4, Math.sin(a) * 8.4, 1.2, 0.45, 8, '#fbfaf6', 10);
      const p = W(-2 + Math.cos(a) * 8.4, Math.sin(a) * 8.4); out.walls.push([p[0] - 0.4, p[1], p[0] + 0.4, p[1], z0]);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(8.4, 0.5, 8, 40), mat('#ffffff'));
    const [x, y] = W(-2, 0); ring.position.set(x, z0 + 9.6, y); ring.rotation.x = Math.PI / 2; g.add(ring);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(7.8, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#ffffff'));
    dome.position.set(x, z0 + 9.6, y); g.add(dome);
    figure(2, 0, 1.2, '#2a2a30');
  }
  if (T === 'hall') {                      // 12: the gathering hall, the meadow for football, a lit porch
    room(-9, 0, 22, 11, 5, '#b89a72', [{side: 'front', at: 5.5, w: 3.2}, {side: 'right', at: 11, w: 3}]);
    box(-9, 0, 5, 22.4, 11.4, 0.4, '#5a4030');
    for (let k = 0; k < 5; k++) box(-16 + k * 3.5, 0, 0, 2.6, 1.1, 0.8, '#7a5a3a');
    for (let k = 0; k < 4; k++) lamp(-15 + k * 5, 0, 4.2, '#ffc070', 0);
    for (const s of [-1, 1]) { box(8, 30 * s, 0, 0.2, 7, 2.4, '#ffffff'); }
    box(10, -18, 0, 4, 6, 3, '#d8c8a8'); lamp(12.3, -18, 0, '#ffc070', 2.2);
    for (let k = 0; k < 10; k++) figure(-14 + (k % 5) * 3, -2.5 + Math.floor(k / 5) * 5, 0, ['#2a2a30', '#3a2a24', '#24303a'][k % 3]);
  }
  if (T === 'cafe') {                      // 13: the corner café, the window table, the promenade and the old church
    room(-7, 0, 10, 9, 3.6, '#c08a5a', [{side: 'front', at: 2.5, w: 1.4}, {side: 'front', at: 6.5, w: 4}]);
    box(-7, 0, 3.6, 10.4, 9.4, 0.3, '#5a3a24');
    box(-2.2, 2.2, 0, 0.05, 4, 2.6, '#bfe6ff', {mat: {transparent: true, opacity: 0.3}});
    box(-3.2, 2.2, 0, 1, 1, 0.75, '#6a4a32'); figure(-3.6, 1.6, 0, '#2a2a30'); figure(-3.6, 2.8, 0, '#e8e2d6');
    box(-1.4, 0, 2.7, 1.2, 9.4, 0.1, '#7a2a24', {rot: 0});
    for (let k = -3; k <= 3; k++) lamp(6, k * 7, 0, '#ffe0a0', 3.2), box(5, k * 7 + 3, 0, 0.6, 1.8, 0.5, '#5a4030');
    const tw = box(-18, 16, 0, 6, 6, 22, '#b4aaa0'); const sp = new THREE.Mesh(new THREE.ConeGeometry(3.6, 10, 4), mat('#6a6058'));
    const [x, y] = W(-18, 16); sp.position.set(x, z0 + 27, y); sp.rotation.y = rotY + Math.PI / 4; g.add(sp);
    room(-18, 16, 6, 6, 0, '#000', []);
  }
  if (T === 'door') {                      // 14: the black void, an old vintage door, and behind it the party of poem one
    const disc = new THREE.Mesh(new THREE.CircleGeometry(16, 40), new THREE.MeshBasicMaterial({color: '#000'}));
    const [x, y] = W(0, 0); disc.position.set(x, z0 + 0.06, y); disc.rotation.x = -Math.PI / 2; g.add(disc);
    box(0, -1.1, 0, 0.25, 0.25, 2.6, '#5a3a24'); box(0, 1.1, 0, 0.25, 0.25, 2.6, '#5a3a24'); box(0, 0, 2.6, 0.3, 2.5, 0.3, '#5a3a24');
    const d = box(-0.5, 0.5, 0, 0.08, 1.9, 2.5, '#3a2416'); d.rotation.y += 0.9;
    const B = 160;                                                    // the ballroom, floating in the black
    box(-8, 0, B - 0.3, 24, 18, 0.3, '#c8b088');
    room(-8, 0, 24, 18, 6, '#4a1a1a', [], B, true);
    for (let k = 0; k < 3; k++) { lamp(-14 + k * 6, 0, B + 4.4, '#ffd27a', 0); }
    for (let k = 0; k < 14; k++) figure(-16 + (k % 7) * 2.6, -4 + Math.floor(k / 7) * 6, B, ['#1b1b22', '#3a2a24', '#d8c8b0'][k % 3]);
    level('ballroom', B, [[-19.6, -8.6, 3.6, 8.6]], 'the vintage party');
    door(0.4, 0, 0, -4, 0, B, 'open the old door', null);
    door(3, -6, B, 3, -4, 0, 'back into the black', 'ballroom');
  }
  for (const c of out.cast) c.userData.sway = Math.random() * 6;
  return out;
}
