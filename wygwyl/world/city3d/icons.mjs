// THE ICONS — Atlantis's signature structures, hand-built, sited by the land, witnessed by the shots, alive with the tide.
import * as THREE from 'three';

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: o.r ?? 0.5, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.t ?? 1, side: o.side ?? THREE.FrontSide, depthWrite: o.dw ?? true});
const M = {
  steel: mat(0xd7dde2, {r: 0.18, m: 0.9}), concrete: mat(0x8f8b84, {r: 0.9}), ceramic: mat(0xf1eee7, {r: 0.4}), dark: mat(0x22272c, {r: 0.4, m: 0.6}),
  copper: mat(0x6fa592, {r: 0.45, m: 0.6}), stone: mat(0x7e7a72, {r: 0.85}), glass: mat(0xbfe8f0, {r: 0.05, m: 0.2, t: 0.3, dw: false}),
  cyan: mat(0x9ff4ff, {e: 0x5fe8ff, ei: 2}), warm: mat(0xffd9a0, {e: 0xffb860, ei: 2}), red: mat(0xff3020, {e: 0xff2010, ei: 3}),
};
const add = (g, geo, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = !m.transparent; g.add(o); return o; };

const BUILD = {
  'tide engine'(g, ic) {                                   // piers and steel hoods across the narrows; sector gates that turn up out of the water with the tide
    const L = ic.site.span, n = 6; g.userData.gates = [];
    for (let i = 0; i < n; i++) { const x = -L / 2 + i * L / (n - 1);
      add(g, new THREE.BoxGeometry(14, 22, 44), M.concrete, x, -5, 0);
      const hood = add(g, new THREE.SphereGeometry(10, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.steel, x, 6, 0); hood.scale.set(0.75, 1.45, 1.7);   // the steel hood: a tall shell like a hull on end
      for (let k = -3; k <= 3; k++) { const rib = add(g, new THREE.TorusGeometry(10.05, 0.18, 6, 40, Math.PI), M.dark, x, 6, 0); rib.rotation.y = k * 0.22 + Math.PI / 2; rib.scale.set(1.7, 1.45, 0.75); }
      add(g, new THREE.SphereGeometry(0.8, 10, 8), M.red, x, 6 + 14.8, 0).userData.blink = i;
      if (i < n - 1) { const gx = x + L / (n - 1) / 2, w = L / (n - 1) - 14;           // the gate: a curved steel sector on a horizontal axle
        const pivot = new THREE.Group(); pivot.position.set(gx, -1, 0); g.add(pivot);
        const sector = add(pivot, new THREE.CylinderGeometry(14, 14, w, 24, 1, true, -Math.PI / 4, Math.PI / 2), mat(0xbfc7cc, {r: 0.3, m: 0.85, side: THREE.DoubleSide}), 0, 0, 0); sector.rotation.z = Math.PI / 2;
        add(pivot, new THREE.BoxGeometry(w, 0.6, 0.6), M.cyan, 0, 14, 0);
        g.userData.gates.push(pivot); } }
    add(g, new THREE.BoxGeometry(L + 20, 1.2, 4), M.dark, 0, 18.5, -18);                  // the service bridge over the hoods
  },
  archive(g, ic, ctx) {                                    // a spire of turning drums faced with the canon's own frames
    const tex = ctx.mosaic; g.userData.drums = [];
    add(g, new THREE.CylinderGeometry(34, 38, 4, 48), M.stone, 0, 2, 0); for (let k = 0; k < 4; k++) add(g, new THREE.CylinderGeometry(38 + k * 2, 38 + k * 2, 1, 48), M.stone, 0, -k * 1 + 0.5, 0);
    let y = 4;
    for (let i = 0; i < 8; i++) { const r = 24 - i * 1.6, h = 15;
      const geo = new THREE.CylinderGeometry(r, r, h, 64, 1, true); const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setY(k, (7 - i + uv.getY(k)) / 8);
      const m = new THREE.MeshStandardMaterial({map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.35, side: THREE.DoubleSide});
      const d = add(g, geo, m, 0, y + h / 2, 0); d.userData.spin = (i % 2 ? -1 : 1) * (0.04 + i * 0.006); g.userData.drums.push(d);
      add(g, new THREE.CylinderGeometry(r + 0.6, r + 0.6, 1.2, 64), M.ceramic, 0, y + h + 0.6, 0); add(g, new THREE.TorusGeometry(r + 0.7, 0.3, 6, 64), M.cyan, 0, y + h + 1.25, 0).rotation.x = Math.PI / 2;
      add(g, new THREE.CylinderGeometry(r - 2, r - 2, h, 32), M.dark, 0, y + h / 2, 0); y += h + 1.2; }
    add(g, new THREE.ConeGeometry(6, 40, 12), M.ceramic, 0, y + 20, 0); add(g, new THREE.SphereGeometry(1.5, 12, 8), M.cyan, 0, y + 41, 0).userData.blink = 9;
  },
  resonator(g) {                                           // an arc of copper pipes on the summit, tallest in the middle; their tips light in sequence
    g.userData.tips = []; const N = 60, R = 70;
    add(g, new THREE.CylinderGeometry(R + 12, R + 16, 6, 64, 1, false, -Math.PI / 3 - 0.1, Math.PI * 2 / 3 + 0.2), M.stone, 0, 0, 0);
    for (let i = 0; i < N; i++) { const t = i / (N - 1), a = -Math.PI / 3 + t * Math.PI * 2 / 3, h = 20 + 70 * Math.pow(Math.sin(t * Math.PI), 1.6) + (i % 3) * 3, r = 1.6 + 1.2 * Math.sin(t * Math.PI);
      const x = Math.sin(a) * R, z = Math.cos(a) * R;
      add(g, new THREE.CylinderGeometry(r, r * 1.1, h, 14), M.copper, x, h / 2 + 3, z);
      add(g, new THREE.CylinderGeometry(r * 1.35, r * 1.35, 1.0, 14), M.dark, x, h * 0.18 + 3, z);
      const tip = add(g, new THREE.CylinderGeometry(r * 1.05, r * 1.05, 1.6, 14), mat(0x9ff4ff, {e: 0x5fe8ff, ei: 0.2}), x, h + 3.8, z); tip.userData.order = t; g.userData.tips.push(tip); }
  },
  'light gate'(g) {                                        // a ring of white ceramic over the avenue, its seam drawn in light
    const R = 52, ring = new THREE.Group(); ring.position.y = R - 5; g.add(ring);
    add(ring, new THREE.TorusGeometry(R, 3.6, 18, 128), M.ceramic, 0, 0, 0).rotation.y = Math.PI / 2;
    add(ring, new THREE.TorusGeometry(R - 3.7, 0.5, 8, 128), M.cyan, 0, 0, 0).rotation.y = Math.PI / 2;
    add(ring, new THREE.TorusGeometry(R + 3.7, 0.35, 8, 128), M.cyan, 0, 0, 0).rotation.y = Math.PI / 2;
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, p = add(ring, new THREE.BoxGeometry(1.2, 2.2, 8.4), M.dark, 0, Math.sin(a) * R, Math.cos(a) * R); p.rotation.x = -a; }
    for (const s of [-1, 1]) add(g, new THREE.BoxGeometry(14, 10, 14), M.ceramic, 0, 2, s * (R - 4));
    g.userData.ring = ring;
  },
  'drowned cathedral'(g) {                                 // a cathedral settled nine metres into the bay, tilted, lamps in its windows
    const c = new THREE.Group(); g.add(c); g.userData.body = c;
    add(c, new THREE.BoxGeometry(26, 30, 64), M.stone, 0, 15, 0);
    const roof = new THREE.Shape(); roof.moveTo(-14, 0); roof.lineTo(14, 0); roof.lineTo(0, 12); roof.closePath();
    const r = add(c, new THREE.ExtrudeGeometry(roof, {depth: 64, bevelEnabled: false}), mat(0x3d4a48, {r: 0.6, m: 0.3}), 0, 30, -32);
    for (const s of [-1, 1]) { add(c, new THREE.BoxGeometry(11, 52, 11), M.stone, s * 9, 26, -36); add(c, new THREE.ConeGeometry(7.5, 16, 4), mat(0x3d4a48, {m: 0.3}), s * 9, 60, -36).rotation.y = Math.PI / 4; }
    for (const s of [-1, 1]) for (let k = 0; k < 7; k++) add(c, new THREE.BoxGeometry(0.4, 9, 3), M.warm, s * 13.1, 13, -26 + k * 8);
    add(c, new THREE.CircleGeometry(5.5, 24), mat(0x8050ff, {e: 0x8050ff, ei: 1.2}), 0, 30, -42.6).rotation.y = Math.PI;
  },
  skywalk(g, ic, ctx) {                                    // a ring of glass and ceramic forty-five metres up, threading the towers, lit underneath
    const R = ic.site.r, N = 120, H = 45;
    for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R, seg = new THREE.Group(); seg.position.set(x, 0, z); seg.rotation.y = -a; g.add(seg);
      const len = 2 * Math.PI * R / N + 0.2, gz = ctx.groundAt(ic.site.x + x, ic.site.y + z) - ic.site.z;
      add(seg, new THREE.BoxGeometry(6, 0.8, len), M.ceramic, 0, H, 0); add(seg, new THREE.BoxGeometry(5.6, 0.12, len), M.cyan, 0, H - 0.46, 0);
      for (const s of [-1, 1]) add(seg, new THREE.BoxGeometry(0.06, 1.1, len), M.glass, s * 2.9, H + 0.95, 0);
      if (i % 8 === 0) add(seg, new THREE.CylinderGeometry(0.8, 1.3, H - gz, 10), M.ceramic, 0, gz + (H - gz) / 2, 0); }
  },
  'salt stair'(g, ic, ctx) {                               // the oldest street: worn flights and landings, a lamp at every landing
    const s = ic.site, L = Math.hypot(s.x2 - s.x, s.y2 - s.y), n = Math.floor(L / 0.45), W = 9; let landing = 0, prev = null;
    for (let i = 0; i < n; i++) { const t = i / n, x = (s.x2 - s.x) * t, y = (s.y2 - s.y) * t, gz = ctx.groundAt(s.x + x, s.y + y) - s.z;
      const z = prev == null ? gz : Math.min(prev, gz + 0.02); prev = z;
      const st = add(g, new THREE.BoxGeometry(W, Math.max(0.2, z - (gz - 1.5)), 0.5), M.stone, 0, (z + gz - 1.5) / 2, 0); st.position.set(x, (z + gz - 1.5) / 2, y); st.rotation.y = -Math.atan2(s.y2 - s.y, s.x2 - s.x) + Math.PI / 2;
      if (i % 40 === 0) { const p = new THREE.Group(); p.position.set(x, z, y); g.add(p); for (const sd of [-1, 1]) { const ox = Math.cos(-Math.atan2(s.y2 - s.y, s.x2 - s.x) + Math.PI / 2) * sd * (W / 2 + 0.4), oz = -Math.sin(-Math.atan2(s.y2 - s.y, s.x2 - s.x) + Math.PI / 2) * sd * (W / 2 + 0.4);
        add(p, new THREE.CylinderGeometry(0.08, 0.12, 4.2, 6), M.dark, ox, 2.1, oz); add(p, new THREE.SphereGeometry(0.32, 10, 8), M.warm, ox, 4.3, oz); } } }
  },
};

export function makeIcons(scene, C, S, U, heav) {
  const root = new THREE.Group(); scene.add(root); let D = null; const groups = [];
  // the archive's facade: a mosaic of the canon's own frames
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const cx = cv.getContext('2d'); cx.fillStyle = '#111'; cx.fillRect(0, 0, 2048, 1024);
  const mosaic = new THREE.CanvasTexture(cv); mosaic.colorSpace = THREE.SRGBColorSpace; mosaic.wrapS = THREE.RepeatWrapping;
  const cids = C.meta.shots.map(s => s.cid).filter((c, i, a) => a.indexOf(c) === i).filter((_, i) => i % 6 === 0).slice(0, 128);
  cids.forEach((cid, i) => { const im = new Image(); im.onload = () => { const col = i % 16, row = Math.floor(i / 16); cx.drawImage(im, col * 128 + 2, row * 128 + 2, 124, 124); mosaic.needsUpdate = true; }; im.src = `../iconic/c/${cid}.webp`; });
  const ctx = {mosaic, groundAt: (x, y) => S.ground(x, y)};
  const stateOf = (ic, era) => { const [b, r, as] = ic.era; if (b > era) return null; if (r < 9 && era >= r) return era >= 5 && as ? 'reuse' : 'ruin'; return 'intact'; };
  return {
    root, get groups() { return groups; }, get data() { return D; },
    async load(url) { D = await fetch(url).then(r => r.json()).catch(() => null); if (!D) return null;
      for (const ic of D.icons) { const g = new THREE.Group(); g.userData.icon = ic; try { BUILD[ic.kind](g, ic, ctx); } catch (e) { console.warn(ic.kind, e); }
        g.position.set(ic.site.x, ic.kind === 'tide engine' || ic.kind === 'drowned cathedral' ? 0 : ic.site.z, ic.site.y); g.rotation.y = -ic.site.rot; root.add(g); groups.push(g); }
      return D; },
    footprints() { if (!D) return []; const out = [];
      for (const ic of D.icons) { const s = ic.site;
        if (ic.kind === 'archive') out.push([s.x, s.y, 46, ic.era[0]]); if (ic.kind === 'light gate') out.push([s.x, s.y, 60, ic.era[0]]);
        if (ic.kind === 'resonator') out.push([s.x, s.y, 95, ic.era[0]]);
        if (ic.kind === 'salt stair') { const L = Math.hypot(s.x2 - s.x, s.y2 - s.y); for (let d = 0; d < L; d += 8) out.push([s.x + (s.x2 - s.x) * d / L, s.y + (s.y2 - s.y) * d / L, 8, ic.era[0]]); } }
      return out; },
    setEra(era) { for (const g of groups) { const ic = g.userData.icon, st = stateOf(ic, era); g.visible = !!st; g.userData.state = st;
      if (ic.kind === 'drowned cathedral' && g.userData.body) { const sunk = era >= 4; g.userData.body.position.y = sunk ? ic.site.z - 1 : 0.6; g.userData.body.rotation.set(sunk ? 0.07 : 0, 0, sunk ? -0.11 : 0); } } },
    update(dt, t) {
      const night = U.night.value, tide = heav.state.tide;
      M.cyan.emissiveIntensity = 0.6 + 2.2 * night; M.warm.emissiveIntensity = 0.3 + 2.4 * night; M.red.visible = true;
      for (const g of groups) { if (!g.visible) continue; const ic = g.userData.icon;
        if (g.userData.gates) { const working = g.userData.state !== 'ruin', up = working ? THREE.MathUtils.smoothstep(tide, 0.15, 0.6) : 0;
          g.userData.gates.forEach(p => p.rotation.x = THREE.MathUtils.lerp(p.rotation.x, -Math.PI / 2 + up * Math.PI / 2 - Math.PI / 4, Math.min(1, dt * 0.6))); }
        if (g.userData.drums) g.userData.drums.forEach(d => d.rotation.y += d.userData.spin * dt);
        if (g.userData.drums) g.userData.drums.forEach(d => d.material.emissiveIntensity = 0.25 + 0.9 * night);
        if (g.userData.tips) g.userData.tips.forEach(tp => { const ph = (t * 0.25 - tp.userData.order) % 1; tp.material.emissiveIntensity = (0.2 + 3.5 * Math.exp(-Math.pow((ph < 0 ? ph + 1 : ph) * 9, 2))) * (0.3 + night); });
        g.traverse(o => { if (o.userData.blink !== undefined) o.visible = Math.sin(t * 2 + o.userData.blink) > -0.3; });
      }
    },
  };
}
