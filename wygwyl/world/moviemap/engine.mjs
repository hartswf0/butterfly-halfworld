// THE CAMERA CAR'S CITY — city3d's Atlantis raised once more, as a stage for registered frames.
// One engine serves both the capture (frames rendered headless down the street centres) and the player's live render
// (other eras, seasons, hours, weather, the QADAS-like abstractions and the ID buffer that turns a touch into a building).
// A pose is (x, y, heading, view): the four views are front, right, back, left, 90° each, at a fixed eye height.
import * as THREE from 'three';
import {loadCity, sampler, makeTerrain, makeRoads, makeBuildings, makeTrees, makeStreetLife} from '../city3d/city.mjs';
import {buildLandmark, tickClocks, MATS, NIGHTLIT} from '../city3d/landmarks.mjs';
import {makeHeavens, makeSea} from '../city3d/heavens.mjs';
import {makeLegible} from './legible.mjs';

export const EYE = 2.8;                       // camera above the road surface (a rig on a car roof)
export const VIEWS = ['front', 'right', 'back', 'left'];
export const hfovToV = (hfovDeg, aspect) => 2 * Math.atan(Math.tan(hfovDeg * Math.PI / 360) / aspect) * 180 / Math.PI;
export const SEASONS = {summer: 172, autumn: 290, winter: 20, spring: 112};
const TAG = {body: 1, ruins: 2, roofs: 3, cafe: 4, stop: 5, sign: 6, lm0: 10};

// the camera car drives the centre of the street: a tree the city planted on the carriageway (or a spine's median) is moved off it
function clearCarriageways(C) {
  const HW = [5, 9, 12, 7.5, 21], G = 40, grid = new Map();
  C.roads.forEach(([cls, born, f]) => { for (let i = 0; i < f.length - 2; i += 2) { const x0 = Math.min(f[i], f[i + 2]) - 25, x1 = Math.max(f[i], f[i + 2]) + 25, y0 = Math.min(f[i + 1], f[i + 3]) - 25, y1 = Math.max(f[i + 1], f[i + 3]) + 25;
    for (let gx = Math.floor(x0 / G); gx <= Math.floor(x1 / G); gx++) for (let gy = Math.floor(y0 / G); gy <= Math.floor(y1 / G); gy++) { const k = gx + ',' + gy; (grid.get(k) || grid.set(k, []).get(k)).push([f[i], f[i + 1], f[i + 2], f[i + 3], HW[cls] + 1.2]); } } });
  const T = C.trees, keep = [];
  for (let k = 0; k < T.length; k += 6) { const x = T[k], y = T[k + 1]; let on = false;
    for (const [ax, ay, bx, by, r] of grid.get(Math.floor(x / G) + ',' + Math.floor(y / G)) || []) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
      if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < r) { on = true; break; } }
    if (!on) for (let j = 0; j < 6; j++) keep.push(T[k + j]); }
  C.trees = new Float32Array(keep); C.treesCleared = (T.length - keep.length) / 6;
}

export async function makeEngine({canvas, width, height, plan, base = '../city3d/', shadows = true, pixelRatio = 1, preserve = false, hfov = 90, onStep = () => {}}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: preserve, powerPreference: 'high-performance'});
  renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(hfovToV(hfov, width / height), width / height, 0.5, 30000);
  const U = {night: {value: 0}, era: {value: 5}, time: {value: 0}, wet: {value: 0}, snow: {value: 0}, season: {value: 0}};

  onStep(10, 'reading the worldtext');
  const C = await loadCity(base), S = sampler(C), meta = C.meta;
  clearCarriageways(C);
  onStep(30, 'the ground, the sea, the sky');
  const heav = makeHeavens(scene, renderer, {lat: meta.lat, lon: meta.lon, shadows});
  if (shadows) { const c = heav.sun.shadow.camera; c.left = c.bottom = -260; c.right = c.top = 260; c.updateProjectionMatrix(); heav.sun.shadow.bias = -0.0003; }
  const fill = new THREE.AmbientLight(0xdfe6f0, 0.5); scene.add(fill);      // a soft fill so the shade side of a street is a colour, not a hole
  const terrain = makeTerrain(C); scene.add(terrain);
  const sea = makeSea(scene, C.height, meta, heav);
  onStep(45, 'the streets');
  const roads = makeRoads(C, S, U); scene.add(roads);
  // city3d winds the road ribbons facing down, so with DoubleSide the lit normal flips and the streets go black: turn them face-up
  { const ix = roads.geometry.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } roads.geometry.index.needsUpdate = true; }
  onStep(55, 'the buildings');
  const blds = makeBuildings(C, U); scene.add(blds);
  onStep(65, 'trees, cafés, bus stops');
  const trees = makeTrees(C); scene.add(trees);
  const street = makeStreetLife(C, S, U); scene.add(street);
  onStep(75, 'the landmarks');
  const LM = meta.landmarks, ERA = meta.eras;
  const lmState = (lm, e) => { const [b, r, as] = lm.era; if (b > e) return null; if (r < 9 && e >= r) return e >= 5 && as ? 'reuse' : 'ruin'; return 'intact'; };
  const lmGroups = LM.map((lm, i) => { const g = new THREE.Group(); g.position.set(lm.x, lm.type === 'bridge' ? 0 : Math.max(lm.z, 0.2), lm.y); g.rotation.y = -(lm.rot || 0); g.userData = {lm, i, state: undefined, cache: {}}; scene.add(g); return g; });
  const mats = MATS(); for (const k of NIGHTLIT) mats[k].userData.base = mats[k].emissiveIntensity;
  onStep(85, 'the names on the street');
  const legible = makeLegible(plan, C, S, U); scene.add(legible.group);
  // the worldtext: his lines written into the place where he sees them
  const words = meta.words.map(w => { const c = document.createElement('canvas'); c.width = 1024; c.height = 128; const x = c.getContext('2d');
    x.font = 'italic 44px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#000'; x.shadowBlur = 10; x.fillStyle = '#fff3d8';
    x.fillText(w.t.length > 54 ? w.t.slice(0, 54) + '…' : w.t, 512, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: t, transparent: true, depthWrite: false, fog: false})); s.scale.set(16, 2, 1); s.position.set(w.x, w.z + 6, w.y); s.userData.w = w; scene.add(s); return s; });

  // ——— seasons: the trees turn, drop their leaves and flower; snow settles on the flat ———
  const treeMat = trees.children[0].material;
  treeMat.onBeforeCompile = sh => {
    sh.uniforms.uSeason = U.season; sh.uniforms.uSnow = U.snow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW; varying float vTH;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 tw4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          tw4 = instanceMatrix * tw4;
        #endif
        vTW = (modelMatrix * tw4).xyz; vTH = transformed.y;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSeason, uSnow; varying vec3 vTW; varying float vTH;\nfloat th(vec3 p){ return fract(sin(dot(floor(p * 1.7), vec3(127.1, 311.7, 74.7))) * 43758.5453); }')
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec3 c = diffuseColor.rgb; float leaf = step(c.r * 1.12, c.g) * step(c.b, c.g) * step(1.2, vTH);
          float h = th(vTW), h2 = th(vTW + 7.3);
          if (uSeason > 0.5 && uSeason < 1.5) diffuseColor.rgb = mix(c, mix(vec3(0.78, 0.30, 0.07), vec3(0.86, 0.62, 0.13), h) * (0.75 + 0.4 * h2), leaf * 0.9);
          if (uSeason > 1.5 && uSeason < 2.5) { if (leaf > 0.5 && h > 0.18) discard; diffuseColor.rgb = mix(c, vec3(0.32, 0.27, 0.22), leaf); }
          if (uSeason > 2.5) diffuseColor.rgb = mix(c, mix(vec3(0.98, 0.78, 0.86), vec3(0.98, 0.97, 0.94), h), leaf * step(0.55, h2) * 0.9);
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.98), uSnow * smoothstep(0.55, 0.85, normal.y) * 0.85);');
  };
  // snow on the façades' tops and the gable roofs, the roads wet or white
  const chain = (m, extra) => { const o = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { o && o(sh, r); sh.uniforms.uSnow = U.snow; extra(sh); }; m.customProgramCacheKey = () => 'snow' + (o ? o.toString().length : 0); m.needsUpdate = true; };
  const snowFrag = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ vec3 wn = inverseTransformDirection(normal, viewMatrix); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.94, 0.95, 0.98), uSnow * smoothstep(0.45, 0.8, wn.y) * 0.9); }'); };
  chain(blds.userData.meshes.body.material, snowFrag); chain(blds.userData.meshes.roofs.material, snowFrag);
  chain(roads.material, sh => { sh.fragmentShader = sh.fragmentShader.replace('uniform float uEra', 'uniform float uSnow, uEra').replace('diffuseColor.rgb = c;', 'c = mix(c, vec3(0.86, 0.87, 0.9), uSnow * (0.55 + 0.35 * step(0.3, abs(u - 0.5))));\n      diffuseColor.rgb = c;'); });

  // ——— time, light, weather, era ———
  const st = {era: 5, hour: 12, doy: 265, weather: 'clear', season: null, style: 'photo'};
  const dateOf = () => new Date(Date.UTC(2026, 0, 1) + (st.doy - 1) * 864e5 + (st.hour + 4) * 36e5);   // local = UTC−4
  function settleSky() { heav.setDate(dateOf()); heav.setWeather(st.weather); for (let i = 0; i < 160; i++) heav.update(0, camera, camera.position); }
  function setLandmarks(e) {
    for (const g of lmGroups) { const s = lmState(g.userData.lm, e); if (s === g.userData.state) continue; g.userData.state = s;
      g.children.forEach(c => c.visible = false); if (!s) continue;
      const c = g.userData.cache[s] || (g.userData.cache[s] = buildLandmark(g.userData.lm, s)); if (!c.parent) g.add(c); c.visible = true; }
  }
  function setEra(e) {
    st.era = e; U.era.value = e; blds.userData.setEra(e); trees.userData.setEra(e); street.userData.setEra(e); setLandmarks(e); legible.setEra(e);
    terrain.userData.paint(e, null); snowGround(); restyle();
  }
  // snow on open ground: brighten the flat land toward white (painted once per era / season)
  const tcol = terrain.geometry.attributes.color, tnrm = terrain.geometry.attributes.normal;
  function snowGround() { if (!U.snow.value) return; const a = tcol.array, s = U.snow.value;
    for (let k = 0; k < a.length / 3; k++) { if (C.height[k] < 0.3) continue; const f = s * Math.min(1, Math.max(0, (tnrm.array[k * 3 + 1] - 0.8) * 6)) * 0.85;
      a[k * 3] += (0.93 - a[k * 3]) * f; a[k * 3 + 1] += (0.94 - a[k * 3 + 1]) * f; a[k * 3 + 2] += (0.97 - a[k * 3 + 2]) * f; } tcol.needsUpdate = true; }
  function setSeason(s) { st.season = s; st.doy = SEASONS[s] ?? st.doy; U.season.value = {summer: 0, autumn: 1, winter: 2, spring: 3}[s] ?? 0;
    U.snow.value = s === 'winter' ? 1 : 0; terrain.userData.paint(st.era, null); snowGround(); settleSky(); }
  function setHour(h) { st.hour = h; settleSky(); applyNight(); }
  function setDoy(d) { st.doy = d; settleSky(); applyNight(); }
  function setWeather(w) { st.weather = w; U.wet.value = w === 'rain' || w === 'storm' ? 1 : 0; settleSky(); applyNight(); }
  function applyNight() {
    const night = heav.state.night; U.night.value = THREE.MathUtils.smoothstep(night, 0.15, 0.7); fill.intensity = 0.5 * (1 - night) + 0.08;
    for (const k of NIGHTLIT) mats[k].emissiveIntensity = mats[k].userData.base * (0.08 + 0.92 * U.night.value);
    tickClocks({getHours: () => Math.floor(st.hour), getMinutes: () => Math.floor((st.hour % 1) * 60)});
    for (const g of lmGroups) g.traverse(o => { if (o.userData.beam) { o.visible = U.night.value > 0.2; o.material.opacity = 0.1 * U.night.value; }
      if (o.material?.userData?.nightlit) o.material.emissiveIntensity = (o.material.userData.nightlit === true ? 1.6 : 1.2) * (0.12 + 0.88 * U.night.value); });
    legible.setNight(U.night.value);
  }

  // ——— the pose ———
  const groundY = (x, y) => Math.max(S.ground(x, y), 0.35) + 0.22;
  function pose(x, y, heading, view = 0, pitch = 0, yawOff = 0) {
    const yaw = heading + view * Math.PI / 2 + yawOff, ey = groundY(x, y) + EYE;
    camera.position.set(x, ey, y);
    camera.lookAt(x + Math.cos(yaw) * Math.cos(pitch), ey + Math.sin(pitch), y + Math.sin(yaw) * Math.cos(pitch));
    camera.updateMatrixWorld();
    heav.update(0, camera, camera.position); sea.update(0);
    if (st.style !== 'photo') SKY.forEach(o => o.visible = false);
    for (const s of words) { const d = camera.position.distanceTo(s.position); s.visible = d < 160 && st.style === 'photo'; s.material.opacity = THREE.MathUtils.clamp((160 - d) / 80, 0, 1); }
  }

  // ——— abstraction: QADAS-like flat shading and the hidden-line wireframe of the same frame ———
  const SKY = new Set(); scene.children.forEach(o => { if (o.isSprite || o.isPoints || o.isLineSegments || (o.isMesh && (o.material.isShaderMaterial || o.material.isSpriteMaterial) && !o.isInstancedMesh && o !== terrain && o !== roads)) SKY.add(o); });
  SKY.delete(sea.sea);
  const edgeMat = (fill, line, world = false) => new THREE.ShaderMaterial({
    uniforms: {uFill: {value: new THREE.Color(fill)}, uLine: {value: new THREE.Color(line)}}, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    vertexShader: `varying vec2 vUv; varying float vD; varying vec3 vWP;
      void main(){ vUv = uv; vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        vec4 w = modelMatrix * p; vWP = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uFill, uLine; varying vec2 vUv; varying float vD; varying vec3 vWP;
      void main(){ vec2 q = ${world ? 'vWP.xz / 20.0' : 'vUv'}; vec2 d = ${world ? 'abs(fract(q) - 0.5)' : 'min(fract(q), 1.0 - fract(q))'}; vec2 w = fwidth(q);
        vec2 e = ${world ? 'smoothstep(0.5 - w * 1.2, 0.5 - w * 0.3, d)' : '1.0 - smoothstep(w * 0.4, w * 1.4, d)'};
        float edge = max(e.x, e.y); float fade = exp(-vD * ${world ? '0.004' : '0.0016'});
        gl_FragColor = vec4(mix(uFill, uLine, edge * fade), 1.0); }`});
  const roadWire = new THREE.ShaderMaterial({uniforms: {uEra: U.era}, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide,
    vertexShader: 'attribute vec4 aRoad; varying vec4 vR; varying vec2 vUv; varying float vD; void main(){ vR = aRoad; vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform float uEra; varying vec4 vR; varying vec2 vUv; varying float vD;
      void main(){ if (vR.y > uEra + 0.5) discard; float x = vUv.x * vR.w, fw = fwidth(x);
        float kerb = 1.0 - smoothstep(fw * 0.5, fw * 1.5, min(x, vR.w - x));
        float cl = (1.0 - smoothstep(fw * 0.5, fw * 1.5, abs(x - vR.w * 0.5))) * step(mod(vUv.y, 6.0), 3.0);
        float fade = exp(-vD * 0.003); gl_FragColor = vec4(vec3(0.95, 0.75, 0.3) * max(kerb, cl * 0.7) * fade, 1.0); }`});
  const STYLE_MATS = {};
  function styleMat(o, style) {
    const ud = o.userData; ud.photo = ud.photo || o.material; const key = style + ':' + o.uuid;
    if (STYLE_MATS[key]) return STYLE_MATS[key];
    const pm = ud.photo; let m;
    if (style === 'flat') {
      if (o === roads) m = new THREE.MeshLambertMaterial({color: 0x4a4a52, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide});
      else if (o === sea.sea) m = new THREE.MeshLambertMaterial({color: 0x4f7fa0});
      else if (o === terrain) m = new THREE.MeshLambertMaterial({vertexColors: true, flatShading: true});
      else m = new THREE.MeshLambertMaterial({color: pm.color && !o.instanceColor && !o.geometry.attributes.color ? pm.color : 0xffffff, vertexColors: !!o.geometry.attributes.color, flatShading: true, map: pm.map || null, transparent: !!pm.transparent, alphaTest: pm.alphaTest || 0, side: pm.side});
      if (o === roads) { /* roads keep their era: born later are hidden by the shader in photo; in flat we keep them all */ }
    } else if (style === 'wire') {
      if (o === roads) m = roadWire;
      else if (o === terrain) m = edgeMat(0x000000, 0x1f4a2e, true);
      else if (o === sea.sea) m = new THREE.MeshBasicMaterial({color: 0x02060c});
      else if (o.isInstancedMesh && o.parent === trees) m = new THREE.MeshBasicMaterial({color: 0x2f8a4a, wireframe: true});
      else if (o.isInstancedMesh || ud.legible) m = edgeMat(0x000000, ud.legible ? 0xffffff : 0x9ff2c0);
      else m = edgeMat(0x000000, 0xffd28a);
    }
    STYLE_MATS[key] = m; return m;
  }
  function restyle() {
    const s = st.style;
    scene.traverse(o => { if (SKY.has(o)) { o.visible = s === 'photo' ? (o.userData.vis ?? true) : false; return; }
      if (!(o.isMesh || o.isInstancedMesh)) return; if (o.material && !o.userData.photo) o.userData.photo = o.material;
      if (s === 'photo') o.material = o.userData.photo; else o.material = styleMat(o, s); });
    // the sky keeps its own fog (the heavens write into it every pose); the abstractions swap theirs in only while they render
    if (s === 'photo') { scene.background = null; styleFog = null; renderer.toneMapping = THREE.ACESFilmicToneMapping; }
    else if (s === 'flat') { scene.background = new THREE.Color(0xc9d6e2); styleFog = new THREE.Fog(0xc9d6e2, 300, 2200); renderer.toneMapping = THREE.NoToneMapping; }
    else { scene.background = new THREE.Color(0x000000); styleFog = 'none'; renderer.toneMapping = THREE.NoToneMapping; }
  }
  let styleFog = null;
  function setStyle(s) { st.style = s; restyle(); }

  // ——— the ID buffer: every pixel names what it shows (building index, landmark, café, bus stop, sign) ———
  const idMat = (tag, attr) => new THREE.ShaderMaterial({uniforms: {uTag: {value: tag}}, toneMapped: false,
    vertexShader: `uniform float uTag; ${attr ? 'attribute float aId;' : ''} flat varying vec4 vC;
      void main(){ vec4 p = vec4(position, 1.0); float id = 0.0;
        #ifdef USE_INSTANCING
          p = instanceMatrix * p; id = float(gl_InstanceID);
        #endif
        ${attr ? 'id = aId;' : ''}
        gl_Position = projectionMatrix * modelViewMatrix * p;
        vC = vec4(uTag / 255.0, mod(id, 256.0) / 255.0, floor(id / 256.0) / 255.0, 1.0); }`,
    fragmentShader: 'flat varying vec4 vC; void main(){ gl_FragColor = vC; }'});
  const ID0 = idMat(0), idRT = new THREE.WebGLRenderTarget(1, 1, {depthBuffer: true}); let idBuf = null, idKey = '';
  function idTarget(o) {
    const mm = blds.userData.meshes;
    if (o === mm.body) return [TAG.body]; if (o === mm.ruins) return [TAG.ruins]; if (o === mm.roofs) return [TAG.roofs];
    if (o.userData.legible) return [TAG.sign, true];
    let p = o; while (p && p.userData?.lm === undefined) p = p.parent; if (p) return [TAG.lm0 + p.userData.i];
    if (o.isInstancedMesh && o.parent === street && o.userData.kind === 'cafe') return [TAG.cafe];
    if (o.isInstancedMesh && o.parent === street && o.userData.kind === 'stop') return [TAG.stop];
    return [0];
  }
  // name the street-life meshes so a pixel can say café or bus stop (city3d adds them in order: lamps, stops, cafés, docks, …)
  street.children[1].userData.kind = 'stop'; street.children[2].userData.kind = 'cafe';
  const ID_MATS = new Map();
  function renderIds(w, h) {
    const key = [camera.position.toArray().map(v => v.toFixed(2)), camera.quaternion.toArray().map(v => v.toFixed(4)), st.era, w, h].join();
    if (key === idKey && idBuf) return idBuf;
    if (idRT.width !== w || idRT.height !== h) idRT.setSize(w, h);
    const saved = []; scene.traverse(o => { if (SKY.has(o) || o.isSprite || o.isPoints || o.isLine) { saved.push([o, o.visible, null]); o.visible = false; return; }
      if (!(o.isMesh)) return; saved.push([o, o.visible, o.material]); const [tag, attr] = idTarget(o);
      const k = tag + ':' + !!attr; o.material = ID_MATS.get(k) || ID_MATS.set(k, tag ? idMat(tag, attr) : ID0).get(k); });
    const bg = scene.background, fog = scene.fog, sm = renderer.shadowMap.autoUpdate; scene.background = new THREE.Color(0); scene.fog = null; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(idRT); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
    idBuf = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(idRT, 0, 0, w, h, idBuf); idKey = key;
    for (const [o, v, m] of saved) { o.visible = v; if (m) o.material = m; }
    scene.background = bg; scene.fog = fog; renderer.shadowMap.autoUpdate = sm;
    return idBuf;
  }
  // decode the pixel at (u, v) ∈ [0,1]² (v from the top) into what it is
  const eraItems = (o, era) => o.userData.items.filter(it => it.born <= era && (it.dies ?? 9) > era);
  function decode(tag, id) {
    const mm = blds.userData.meshes, own = blds.userData.owner;
    if (!tag) return null;
    if (tag === TAG.body) return {kind: 'building', k: own.body[id]};
    if (tag === TAG.ruins) return {kind: 'building', k: own.ruins[id]};
    if (tag === TAG.roofs) return {kind: 'building', k: own.roofs[id]};
    if (tag === TAG.sign) return {kind: 'sign', i: id, sign: legible.signs[id]};
    if (tag === TAG.cafe) { const it = eraItems(street.children[2], st.era)[id]; return {kind: 'cafe', item: it, x: it && it.m.elements[12], y: it && it.m.elements[14]}; }
    if (tag === TAG.stop) { const it = eraItems(street.children[1], st.era)[id]; return {kind: 'stop', item: it, x: it && it.x, y: it && it.y}; }
    if (tag >= TAG.lm0) return {kind: 'landmark', i: tag - TAG.lm0};
    return null;
  }
  const idSize = () => [320, Math.round(320 / camera.aspect)];
  function pickAt(u, v) {
    const [w, h] = idSize(), buf = renderIds(w, h), px = Math.min(w - 1, Math.max(0, Math.floor(u * w))), py = Math.min(h - 1, Math.max(0, Math.floor((1 - v) * h))), i = (py * w + px) * 4;
    return decode(buf[i], buf[i + 1] + buf[i + 2] * 256);
  }
  // a mask of every pixel that shows the same thing as `hit` (rows from the top), for the highlight drawn over the frame
  function maskOf(hit) {
    const [w, h] = idSize(), buf = renderIds(w, h), img = new ImageData(w, h); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4; const d = decode(buf[i], buf[i + 1] + buf[i + 2] * 256); if (!d || d.kind !== hit.kind) continue;
      if ((d.kind === 'building' && d.k === hit.k) || (d.kind === 'landmark' && d.i === hit.i) || (d.kind === 'sign' && d.i === hit.i) || ((d.kind === 'cafe' || d.kind === 'stop') && d.item === hit.item)) { img.data[(y * w + x) * 4 + 3] = 255; n++; } }
    return n ? img : null;
  }
  // the whole ID frame drawn in false colour (an abstraction of its own)
  function idImage(w = idSize()[0], h = idSize()[1]) { const buf = renderIds(w, h), img = new ImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((h - 1 - y) * w + x) * 4, o = (y * w + x) * 4, t = buf[i], id = buf[i + 1] + buf[i + 2] * 256;
      if (!t) { img.data[o] = img.data[o + 1] = img.data[o + 2] = 16; img.data[o + 3] = 255; continue; }
      const hh = Math.sin((t * 7.13 + id * 0.6180339) * 12.9898) * 43758.5453, f = hh - Math.floor(hh);
      const c = new THREE.Color().setHSL(t >= TAG.lm0 ? 0.08 : t === TAG.sign ? 0.55 : f, t >= TAG.lm0 ? 0.95 : 0.55, t >= TAG.lm0 ? 0.6 : 0.35 + 0.3 * ((f * 7) % 1));
      img.data[o] = c.r * 255; img.data[o + 1] = c.g * 255; img.data[o + 2] = c.b * 255; img.data[o + 3] = 255; }
    return img; }

  function render() { U.time.value = 0; const f = scene.fog; if (styleFog) scene.fog = styleFog === 'none' ? null : styleFog; renderer.render(scene, camera); scene.fog = f; }
  function resize(w, h, pr = pixelRatio) { renderer.setPixelRatio(pr); renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = hfovToV(hfov, w / h); camera.updateProjectionMatrix(); }
  function setHfov(d) { hfov = d; camera.fov = hfovToV(hfov, camera.aspect); camera.updateProjectionMatrix(); }

  setEra(5); setHour(12); setStyle('photo');
  onStep(100, '');
  return {renderer, scene, camera, C, S, meta, U, st, heav, blds, legible, street, lmGroups, lmState,
    pose, render, resize, setHfov, setEra, setHour, setDoy, setWeather, setSeason, setStyle, pickAt, maskOf, idImage, groundY,
    buildingState: (k, e) => blds.userData.state(k, e ?? st.era)};
}
