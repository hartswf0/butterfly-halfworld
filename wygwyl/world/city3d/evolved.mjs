// ATLANTIS RISING — the evolved structures, built from their genomes, and the city set moving:
// maglev on its pylons, skiffs between the crowns, halos turning, dishes tracking the moon, sea gates rising with the tide,
// and a pulse that runs out across the city from wherever you touch it.
import * as THREE from 'three';

// the Atlantean palette: white ceramic shells, verdigris, teal glass, light in thin cyan bands — the white temple's family
const M = {
  shell: new THREE.MeshStandardMaterial({color: 0xeeebe3, roughness: 0.45, metalness: 0.05}),
  shell2: new THREE.MeshStandardMaterial({color: 0xd9d4c8, roughness: 0.6}),
  glass: new THREE.MeshStandardMaterial({color: 0x3f7f86, roughness: 0.08, metalness: 0.85}),
  dark: new THREE.MeshStandardMaterial({color: 0x23292e, roughness: 0.4, metalness: 0.7}),
  verd: new THREE.MeshStandardMaterial({color: 0x5f9c8a, roughness: 0.5, metalness: 0.4}),
  green: new THREE.MeshStandardMaterial({color: 0x3f6f34, roughness: 0.9}),
  concrete: new THREE.MeshStandardMaterial({color: 0x9a978f, roughness: 0.9}),
  band: new THREE.MeshStandardMaterial({color: 0x9ff4ff, emissive: 0x5fe8ff, emissiveIntensity: 1.5}),
  warm: new THREE.MeshStandardMaterial({color: 0xffd9a0, emissive: 0xffb860, emissiveIntensity: 1.5}),
  red: new THREE.MeshStandardMaterial({color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 3}),
  domeGlass: new THREE.MeshStandardMaterial({color: 0xbfe6ee, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false}),
};
const LIT = [M.band, M.warm, M.red]; LIT.forEach(m => m.userData.base = m.emissiveIntensity);
const add = (g, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = m !== M.domeGlass; g.add(o); return o; };

const B = {
  spire(g, s) {
    const segs = s.seg, H = s.H; let y = 0;
    for (let k = 0; k < segs; k++) {
      const f0 = k / segs, f1 = (k + 1) / segs, r0 = s.r * (1 - s.taper * f0), r1 = s.r * (1 - s.taper * f1) * 0.97, h = H * 0.86 / segs;
      const m = add(g, new THREE.CylinderGeometry(r1, r0, h, s.sides, 1), k % 2 ? M.glass : M.shell, 0, y + h / 2, 0); m.rotation.y = s.twist * f0;
      add(g, new THREE.CylinderGeometry(r1 * 1.04, r1 * 1.04, 1.4, Math.max(16, s.sides)), M.band, 0, y + h, 0).userData.band = y + h;
      y += h;
    }
    for (let i = 0; i < s.fins; i++) { const a = i / s.fins * Math.PI * 2, fh = H * 0.42; const f = add(g, new THREE.BoxGeometry(1.6, fh, s.r * 0.9), M.shell2, Math.cos(a) * s.r * 1.1, fh / 2, Math.sin(a) * s.r * 1.1); f.rotation.y = -a; }
    if (s.butt) for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, L = H * 0.3; const b = add(g, new THREE.CylinderGeometry(1.5, 3.5, L, 6), M.verd, Math.cos(a) * s.r * 1.7, L * 0.45, Math.sin(a) * s.r * 1.7); b.lookAt(0, L, 0); b.rotateX(Math.PI / 2); }
    const top = y, rt = s.r * (1 - s.taper);
    if (s.crown === 'needle') add(g, new THREE.ConeGeometry(rt * 0.7, H * 0.14, 8), M.shell, 0, top + H * 0.07, 0);
    if (s.crown === 'halo') { const t = add(g, new THREE.TorusGeometry(rt * 2.4, 0.9, 8, 48), M.band, 0, top + 8, 0); t.rotation.x = Math.PI / 2; t.userData.spin = 0.4; add(g, new THREE.CylinderGeometry(rt * 0.5, rt * 0.8, 14, 12), M.shell, 0, top + 7, 0); }
    if (s.crown === 'beacon') { add(g, new THREE.CylinderGeometry(rt * 0.4, rt * 0.7, H * 0.08, 8), M.dark, 0, top + H * 0.04, 0); add(g, new THREE.SphereGeometry(rt * 0.6, 16, 8), M.red, 0, top + H * 0.09, 0).userData.blink = 1; }
  },
  arcology(g, s) {
    const n = s.tiers, H = s.H, h = H / n;
    for (let k = 0; k < n; k++) {
      const w = s.r * 2 * (1 - s.inset * k), y = k * h;
      if (s.hollow && k < n - 1) { const t = w * 0.22; for (const [x, z, a, b] of [[0, (w - t) / 2, w, t], [0, -(w - t) / 2, w, t], [(w - t) / 2, 0, t, w - 2 * t], [-(w - t) / 2, 0, t, w - 2 * t]]) add(g, new THREE.BoxGeometry(a, h * 0.92, b), k % 3 === 2 ? M.glass : M.shell, x, y + h * 0.46, z); }
      else add(g, new THREE.BoxGeometry(w, h * 0.92, w), k % 3 === 2 ? M.glass : M.shell, 0, y + h * 0.46, 0);
      add(g, new THREE.BoxGeometry(w + 0.6, 0.8, w + 0.6), M.band, 0, y + h * 0.92, 0).userData.band = y + h;
      if (s.garden && k > 0) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const gx = Math.cos(a) * (w / 2 + 2), gz = Math.sin(a) * (w / 2 + 2);
        const pl = add(g, new THREE.BoxGeometry(i % 2 ? 3 : w * 0.9, 1.2, i % 2 ? w * 0.9 : 3), M.green, gx, y + 0.6, gz); }
    }
    if (s.hollow) add(g, new THREE.CylinderGeometry(s.r * 0.25, s.r * 0.25, 4, 24), M.band, 0, 2, 0);
  },
  ring(g, s) {
    const R = s.R, lift = s.lift, ring = new THREE.Group(); ring.position.y = lift; ring.rotation.z = s.tilt; g.add(ring);
    const t = add(ring, new THREE.TorusGeometry(R, s.th, 12, 120), M.shell, 0, 0, 0); t.rotation.x = Math.PI / 2;
    const b = add(ring, new THREE.TorusGeometry(R - s.th * 0.9, 0.8, 6, 120), M.band, 0, 0, 0); b.rotation.x = Math.PI / 2; b.userData.band = lift;
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; add(ring, new THREE.BoxGeometry(2, s.th * 2.3, 6), M.glass, Math.cos(a) * R, 0, Math.sin(a) * R).rotation.y = -a; }
    ring.userData.spin = 0.03;
    for (let i = 0; i < s.legs; i++) { const a = i / s.legs * Math.PI * 2 + 0.3, x = Math.cos(a) * R * 0.92, z = Math.sin(a) * R * 0.92, L = lift - Math.sin(s.tilt) * x;
      const leg = add(g, new THREE.CylinderGeometry(s.th * 0.35, s.th * 0.8, Math.max(10, L), 8), M.verd, x * 1.1, Math.max(10, L) / 2, z * 1.1); }
  },
  dish(g, s) {
    add(g, new THREE.CylinderGeometry(s.r * 0.25, s.r * 0.45, s.H, 10), M.shell2, 0, s.H / 2, 0);
    const head = new THREE.Group(); head.position.y = s.H; g.add(head); head.userData.track = true;
    const cup = add(head, new THREE.SphereGeometry(s.D / 2, 32, 10, 0, Math.PI * 2, 0, 0.6), new THREE.MeshStandardMaterial({color: 0xf2f0ea, roughness: 0.35, side: THREE.DoubleSide}), 0, -s.D / 2 * 0.82, 0);
    head.userData.cup = cup; add(head, new THREE.CylinderGeometry(0.4, 0.4, s.D * 0.45, 6), M.dark, 0, s.D * 0.12, 0); add(head, new THREE.SphereGeometry(1.4, 10, 8), M.red, 0, s.D * 0.35, 0).userData.blink = 2;
  },
  dome(g, s) {
    add(g, new THREE.CylinderGeometry(s.r * 1.01, s.r * 1.03, 6, 64), M.concrete, 0, 3, 0);
    const d = add(g, new THREE.SphereGeometry(s.r, 48, 18, 0, Math.PI * 2, 0, Math.PI / 2), M.domeGlass, 0, 6, 0); d.scale.y = s.hr * 2;
    for (let i = 0; i < s.ribs; i++) { const rib = add(g, new THREE.TorusGeometry(s.r, 0.7, 4, 48, Math.PI), M.shell, 0, 6, 0); rib.rotation.y = i / s.ribs * Math.PI; rib.scale.y = s.hr * 2; }
    for (let k = 1; k < 4; k++) { const y = s.r * s.hr * 2 * k / 4 * 0.5, rr = s.r * Math.sqrt(1 - Math.pow(k / 4, 2)); const t = add(g, new THREE.TorusGeometry(rr, 0.5, 4, 64), M.band, 0, 6 + s.r * s.hr * 2 * Math.sin(Math.asin(k / 4)) / 1, 0); t.rotation.x = Math.PI / 2; t.position.y = 6 + Math.sin(Math.asin(k / 4)) * s.r * s.hr * 2; t.userData.band = t.position.y; }
    for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = s.r * 0.55 * Math.sqrt((i + 1) / 9); add(g, new THREE.ConeGeometry(4, 12, 6), M.green, Math.cos(a) * rr, 6 + 6, Math.sin(a) * rr); }
    add(g, new THREE.SphereGeometry(s.r * 0.18, 16, 8), M.warm, 0, 6 + s.r * 0.2, 0);
  },
  seawall(g, s, state) {
    const L = s.L, n = s.gates, seg = L / (n * 2 + 1), base = -12, H = s.H;
    for (let k = 0; k < n * 2 + 1; k++) {
      const x = -L / 2 + seg * (k + 0.5);
      if (k % 2 === 0) { if (state === 'ruin' && k % 4 === 2) { add(g, new THREE.BoxGeometry(seg * 0.6, (H - base) * 0.4, 16), M.concrete, x, base + (H - base) * 0.2, 0); continue; }
        add(g, new THREE.BoxGeometry(seg, H - base, 18), M.concrete, x, base + (H - base) / 2, 0); add(g, new THREE.BoxGeometry(seg, 1, 18.6), M.band, x, H, 0).userData.band = H;
        add(g, new THREE.BoxGeometry(6, 14, 6), M.shell, x, H + 7, 0); add(g, new THREE.SphereGeometry(1, 8, 6), M.red, x, H + 15, 0).userData.blink = 3; }
      else if (state !== 'ruin') { const gate = add(g, new THREE.BoxGeometry(seg * 0.98, H - base, 10), M.verd, x, base + (H - base) / 2, 0); gate.userData.gate = {base, H}; }
    }
  },
  vfarm(g, s) {
    add(g, new THREE.CylinderGeometry(s.r * 0.35, s.r * 0.45, s.H, 16), M.glass, 0, s.H / 2, 0);
    for (let k = 0; k < s.layers; k++) { const y = (k + 0.6) / s.layers * s.H, rr = s.r * (0.75 + 0.35 * Math.sin(k * 1.3));
      add(g, new THREE.CylinderGeometry(rr, rr * 0.92, 1.4, 24), M.shell, 0, y, 0); add(g, new THREE.CylinderGeometry(rr * 0.98, rr * 0.9, 3.2 * s.canopy * 2, 24), M.green, 0, y + 2, 0);
      add(g, new THREE.TorusGeometry(rr, 0.4, 4, 32), M.band, 0, y + 0.8, 0).rotation.x = Math.PI / 2; }
    add(g, new THREE.ConeGeometry(s.r * 0.4, s.r * 1.2, 16), M.shell, 0, s.H + s.r * 0.6, 0);
  },
  platform(g, s) {
    const deck = 14, rr = s.r; const top = new THREE.Group(); g.add(top); top.userData.bob = true;
    add(top, new THREE.CylinderGeometry(rr, rr * 0.92, 5, 40), M.concrete, 0, deck, 0);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(g, new THREE.CylinderGeometry(4, 5, deck + 30, 10), M.dark, Math.cos(a) * rr * 0.7, (deck - 30) / 2, Math.sin(a) * rr * 0.7); }
    add(top, new THREE.CylinderGeometry(rr * 0.3, rr * 0.3, 0.4, 32), M.band, rr * 0.45, deck + 2.7, 0);
    for (let i = 0; i < s.masts; i++) { const a = i / s.masts * Math.PI * 2 + 1, x = Math.cos(a) * rr * 0.6, z = Math.sin(a) * rr * 0.6, h = s.H + (i % 3) * 12;
      add(top, new THREE.CylinderGeometry(0.8, 1.6, h, 6), M.shell2, x, deck + h / 2, z); add(top, new THREE.SphereGeometry(1, 8, 6), M.red, x, deck + h, z).userData.blink = i; }
    add(top, new THREE.BoxGeometry(rr * 0.5, 18, rr * 0.35), M.shell, -rr * 0.2, deck + 11, -rr * 0.2);
  },
};

export function makeRising(scene, C, S, heav, U) {
  const root = new THREE.Group(); scene.add(root);
  let data = null, variant = null, groups = [], lines = [], trains = [], skiffs = null, skiffData = [], causes = null;
  const stateOf = (s, era) => { const [b, r, as] = s.era; if (b > era) return null; if (r < 9 && era >= r) return era >= 5 && as ? 'intact' : 'ruin'; return 'intact'; };
  function clear() { root.clear(); groups = []; lines = []; trains = []; skiffs = null; }
  function build(vi, era) {
    clear(); if (!data || vi < 0) return; variant = data.variants[vi];
    for (const s of variant.structures) {
      const g = new THREE.Group(), st = stateOf(s, era); g.userData = {s, st}; if (!st) { g.visible = false; }
      try { B[s.t](g, s, st); } catch (e) { console.warn('structure', s.t, e); }
      const gz = s.t === 'platform' || s.t === 'seawall' ? 0 : Math.max(S.ground(s.x, s.y), 0.3) - 1;
      g.position.set(s.x, gz, s.y); g.rotation.y = -s.rot; root.add(g); groups.push(g);
    }
    // maglev: track on pylons; trains of three cars shuttle along each line
    if (era >= 5) for (const pl of variant.maglev) {
      const pts = pl.map(p => new THREE.Vector3(p[0], p[2], p[1])); if (pts.length < 2) continue;
      const curve = new THREE.CatmullRomCurve3(pts); const L = curve.getLength();
      const track = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, Math.round(L / 12)), 1.6, 6), M.shell); track.castShadow = true; root.add(track);
      const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, Math.round(L / 12)), 0.35, 4), M.band); rail.position.y = 1.7; rail.userData.band = 26; root.add(rail);
      for (let d = 30; d < L - 10; d += 64) { const p = curve.getPointAt(d / L), gh = Math.max(S.ground(p.x, p.z), -6); const h = p.y - gh;
        const py = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, h, 8), M.shell2); py.position.set(p.x, gh + h / 2, p.z); py.castShadow = true; root.add(py); }
      const train = new THREE.Group(); for (let c = 0; c < 3; c++) { const car = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 16, 4, 10), M.shell); car.rotation.z = Math.PI / 2; car.position.x = -c * 19; train.add(car);
        const win = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 3.4), M.warm); win.position.set(-c * 19, 0.5, 0); train.add(win); }
      root.add(train); trains.push({curve, L, train, t: (pl.length * 37) % L, v: 38});
      lines.push(curve);
    }
    // skiffs: small craft on lanes between the crowns
    if (era >= 5) {
      const tops = variant.structures.filter(s => s.t !== 'seawall').map(s => new THREE.Vector3(s.x, (s.t === 'platform' ? 0 : S.ground(s.x, s.y)) + (s.H || 60) * 0.8, s.y));
      if (tops.length > 1) {
        const NS = 70; skiffs = new THREE.InstancedMesh(new THREE.CapsuleGeometry(1.2, 5, 3, 8).rotateX(Math.PI / 2), M.shell2, NS); root.add(skiffs); skiffData = [];
        for (let i = 0; i < NS; i++) { const a = tops[i % tops.length], b = tops[(i * 7 + 3) % tops.length]; if (a === b) continue;
          const mid = a.clone().lerp(b, 0.5); mid.y = Math.max(a.y, b.y) + 40 + (i % 5) * 12;
          skiffData.push({c: new THREE.QuadraticBezierCurve3(a.clone().setY(a.y + 10), mid, b.clone().setY(b.y + 10)), t: (i * 0.137) % 1, v: 0.02 + (i % 4) * 0.006}); }
        const lp = new Float32Array(skiffData.length * 3), lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
        root.userData.skLights = new THREE.Points(lg, new THREE.PointsMaterial({color: 0xbff6ff, size: 5, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending})); root.add(root.userData.skLights);
      }
    }
    // causes: faint lines from each shot stand that called for a structure to the structure it got
    const shotBy = new Map(C.meta.shots.map(s => [s.cid, s])), cp = [];
    for (const s of variant.structures) for (const cid of s.causes) { const q = shotBy.get(cid); if (!q) continue; cp.push(q.x, q.z + 2, q.y, s.x, (s.t === 'platform' ? 0 : S.ground(s.x, s.y)) + (s.H || 40) * 0.6, s.y); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    causes = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({color: 0xd88cff, transparent: true, opacity: 0.35, depthWrite: false})); causes.visible = api.showCauses; root.add(causes);
  }
  // the pulse: an expanding ring of light across the facades (uniforms shared with the facade shader)
  U.pulseO = U.pulseO || {value: new THREE.Vector2(-1e5, -1e5)}; U.pulseT = U.pulseT || {value: 99};
  const api = {
    root, showCauses: false,
    async load(url) { data = await fetch(url).then(r => r.json()); return data; },
    get data() { return data; }, get variant() { return variant; }, get groups() { return groups; },
    build, footprints(vi) { if (!data || vi < 0) return []; return data.variants[vi].structures.map(s => [s.x, s.y, (s.t === 'seawall' ? 0 : s.t === 'ring' ? s.R * 0.25 : s.r * 1.15 + 12), s.era[0]]).filter(f => f[2] > 0); },
    setCauses(v) { api.showCauses = v; if (causes) causes.visible = v; },
    pulse(x, y) { U.pulseO.value.set(x, y); U.pulseT.value = 0; },
    update(dt, t) {
      U.pulseT.value += dt;
      const night = U.night.value, tide = heav.state.tide;
      for (const m of LIT) m.emissiveIntensity = m.userData.base * (0.25 + 0.75 * night);
      const pr = U.pulseT.value * 420, po = U.pulseO.value;
      for (const g of groups) g.traverse(o => {
        if (o.userData.spin) o.rotation.z += dt * o.userData.spin;
        if (o.userData.blink !== undefined) o.visible = Math.sin(t * 2.2 + o.userData.blink) > -0.2;
        if (o.userData.gate) { const k = THREE.MathUtils.clamp((tide + 0.3) / 1.2, 0, 1); o.position.y = o.userData.gate.base + (o.userData.gate.H - o.userData.gate.base) * (0.5 * k) - (1 - k) * 18; }
        if (o.userData.bob) o.position.y = Math.sin(t * 0.6 + g.position.x) * 0.6 + tide;
        if (o.userData.track) { const sd = heav.state.sunDir; const a = Math.atan2(sd.x, sd.z) + Math.PI + t * 0.02; o.rotation.y = a - g.rotation.y; if (o.userData.cup) o.userData.cup.rotation.x = 0.6; }
      });
      // the pulse arriving at a structure lights its bands
      for (const g of groups) { const d = Math.hypot(g.position.x - po.x, g.position.z - po.y), hit = Math.exp(-Math.pow((d - pr) / 60, 2)) * Math.exp(-U.pulseT.value * 0.25);
        g.scale.setScalar(1 + hit * 0.01); g.userData.hit = hit; }
      M.band.emissiveIntensity = M.band.userData.base * (0.25 + 0.75 * night) + Math.max(0, ...groups.map(g => g.userData.hit || 0)) * 4;
      for (const tr of trains) { tr.t = (tr.t + dt * tr.v) % (tr.L * 2); const u = tr.t < tr.L ? tr.t / tr.L : 2 - tr.t / tr.L; const p = tr.curve.getPointAt(u), q = tr.curve.getPointAt(Math.min(1, u + 0.002));
        tr.train.position.copy(p).y += 2.6; tr.train.lookAt(q.x, q.y + 2.6, q.z); tr.train.rotateY(Math.PI / 2); }
      if (skiffs) { const m = new THREE.Matrix4(), lp = root.userData.skLights.geometry.attributes.position.array;
        skiffData.forEach((s, i) => { s.t = (s.t + dt * s.v) % 1; const p = s.c.getPoint(s.t), q = s.c.getPoint(Math.min(1, s.t + 0.01)); m.lookAt(q, p, new THREE.Vector3(0, 1, 0)); m.setPosition(p); skiffs.setMatrixAt(i, m); lp.set([p.x, p.y - 1.4, p.z], i * 3); });
        skiffs.instanceMatrix.needsUpdate = true; root.userData.skLights.geometry.attributes.position.needsUpdate = true; root.userData.skLights.material.opacity = 0.3 + 0.7 * night; }
    },
  };
  return api;
}
