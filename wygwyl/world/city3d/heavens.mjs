// THE HEAVENS AND THE WATER — a sky you can set a scene by.
// The sun is placed by date, hour and the poem's latitude (Baltimere, 39.29°N), so a sunset is a real sunset;
// the night has the real bright stars (positions by sidereal time), a faint field and the Milky Way, and a moon
// with its phase; weather is cloud, fog, rain, storm; the sea has tides (12.42 h) and waves, mirrors the sky,
// glints toward the sun or the moon, and foams where it meets the shore.
import * as THREE from 'three';
import {Sky} from 'three/addons/objects/Sky.js';

const D2R = Math.PI / 180;
// [name, RA°, Dec°, magnitude, B−V colour]
const STARS = [
  ['Sirius', 101.29, -16.72, -1.46, 0.0], ['Canopus', 95.99, -52.70, -0.74, 0.15], ['Arcturus', 213.92, 19.18, -0.05, 1.23], ['Vega', 279.23, 38.78, 0.03, 0.0],
  ['Capella', 79.17, 46.00, 0.08, 0.8], ['Rigel', 78.63, -8.20, 0.13, -0.03], ['Procyon', 114.83, 5.22, 0.34, 0.42], ['Betelgeuse', 88.79, 7.41, 0.5, 1.85],
  ['Achernar', 24.43, -57.24, 0.46, -0.16], ['Altair', 297.70, 8.87, 0.76, 0.22], ['Aldebaran', 68.98, 16.51, 0.86, 1.54], ['Antares', 247.35, -26.43, 0.96, 1.83],
  ['Spica', 201.30, -11.16, 0.97, -0.23], ['Pollux', 116.33, 28.03, 1.14, 1.0], ['Fomalhaut', 344.41, -29.62, 1.16, 0.09], ['Deneb', 310.36, 45.28, 1.25, 0.09],
  ['Regulus', 152.09, 11.97, 1.35, -0.11], ['Adhara', 104.66, -28.97, 1.5, -0.21], ['Castor', 113.65, 31.89, 1.58, 0.03], ['Shaula', 263.40, -37.10, 1.62, -0.22],
  ['Bellatrix', 81.28, 6.35, 1.64, -0.22], ['Elnath', 81.57, 28.61, 1.65, -0.13], ['Alnilam', 84.05, -1.20, 1.69, -0.18], ['Alnitak', 85.19, -1.94, 1.74, -0.21],
  ['Alioth', 193.51, 55.96, 1.77, -0.02], ['Dubhe', 165.93, 61.75, 1.79, 1.07], ['Mirfak', 51.08, 49.86, 1.79, 0.48], ['Wezen', 107.10, -26.39, 1.83, 0.68],
  ['Sargas', 264.33, -43.00, 1.86, 0.4], ['Kaus Australis', 276.04, -34.38, 1.85, -0.03], ['Alkaid', 206.89, 49.31, 1.86, -0.19], ['Menkalinan', 89.88, 44.95, 1.9, 0.03],
  ['Alhena', 99.43, 16.40, 1.93, 0.0], ['Mirzam', 95.67, -17.96, 1.98, -0.23], ['Polaris', 37.95, 89.26, 1.98, 0.6], ['Alphard', 141.90, -8.66, 1.98, 1.44],
  ['Hamal', 31.79, 23.46, 2.0, 1.15], ['Nunki', 283.82, -26.30, 2.05, -0.13], ['Diphda', 10.90, -17.99, 2.04, 1.02], ['Mizar', 200.98, 54.93, 2.04, 0.02],
  ['Saiph', 86.94, -9.67, 2.06, -0.18], ['Alpheratz', 2.10, 29.09, 2.06, -0.11], ['Kochab', 222.68, 74.16, 2.08, 1.47], ['Rasalhague', 263.73, 12.56, 2.08, 0.15],
  ['Algol', 47.04, 40.96, 2.12, -0.05], ['Denebola', 177.26, 14.57, 2.14, 0.09], ['Mirach', 17.43, 35.62, 2.05, 1.58], ['Schedar', 10.13, 56.54, 2.24, 1.17],
  ['Eltanin', 269.15, 51.49, 2.23, 1.52], ['Mintaka', 83.00, -0.30, 2.23, -0.22], ['Caph', 2.29, 59.15, 2.28, 0.34], ['Sadr', 305.56, 40.26, 2.23, 0.67],
  ['Merak', 165.46, 56.38, 2.37, -0.02], ['Enif', 326.05, 9.88, 2.39, 1.53], ['Phecda', 178.46, 53.69, 2.44, 0.0], ['Scheat', 345.94, 28.08, 2.42, 1.67],
  ['Markab', 346.19, 15.21, 2.49, -0.04], ['Algenib', 3.31, 15.18, 2.83, -0.23], ['Navi', 14.18, 60.72, 2.15, -0.15], ['Ruchbah', 21.45, 60.24, 2.66, 0.13],
  ['Segin', 28.60, 63.67, 3.35, -0.15], ['Megrez', 183.86, 57.03, 3.31, 0.08], ['Albireo', 292.68, 27.96, 3.05, 1.13], ['Alphecca', 233.67, 26.71, 2.22, -0.02],
  ['Vindemiatrix', 195.54, 10.96, 2.85, 0.94], ['Zubeneschamali', 229.25, -9.38, 2.61, -0.11], ['Menkar', 45.57, 4.09, 2.54, 1.63], ['Unukalhai', 236.07, 6.43, 2.63, 1.17],
];
function bvColor(bv) {
  const t = Math.max(-0.4, Math.min(2, bv));
  if (t < 0) return new THREE.Color(0.7, 0.8, 1.0);
  if (t < 0.6) return new THREE.Color(1.0, 0.98, 0.94);
  if (t < 1.2) return new THREE.Color(1.0, 0.85, 0.6);
  return new THREE.Color(1.0, 0.7, 0.45);
}
function julian(date) { return date.getTime() / 86400000 + 2440587.5; }
function lstDeg(date, lon) { const d = julian(date) - 2451545.0; return ((280.46061837 + 360.98564736629 * d + lon) % 360 + 360) % 360; }
function altaz(raDeg, decDeg, lat, lst) {
  const H = (lst - raDeg) * D2R, dec = decDeg * D2R, la = lat * D2R;
  const alt = Math.asin(Math.sin(dec) * Math.sin(la) + Math.cos(dec) * Math.cos(la) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H) * Math.cos(dec), Math.cos(la) * Math.sin(dec) - Math.sin(la) * Math.cos(dec) * Math.cos(H));
  return [alt, az];                                                   // az from north, clockwise
}
function sunRaDec(date) {
  const d = julian(date) - 2451545.0, g = (357.529 + 0.98560028 * d) * D2R, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R, e = (23.439 - 0.00000036 * d) * D2R;
  return [Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / D2R, Math.asin(Math.sin(e) * Math.sin(L)) / D2R];
}
function moonRaDec(date) {
  const d = julian(date) - 2451545.0;
  const L = (218.316 + 13.176396 * d) * D2R, M = (134.963 + 13.064993 * d) * D2R, F = (93.272 + 13.229350 * d) * D2R;
  const lon = L + 6.289 * D2R * Math.sin(M), lat = 5.128 * D2R * Math.sin(F), e = 23.439 * D2R;
  const ra = Math.atan2(Math.sin(lon) * Math.cos(e) - Math.tan(lat) * Math.sin(e), Math.cos(lon));
  const dec = Math.asin(Math.sin(lat) * Math.cos(e) + Math.cos(lat) * Math.sin(e) * Math.sin(lon));
  const phase = ((d - 6.4) % 29.530588 + 29.530588) % 29.530588 / 29.530588;   // 0 new · 0.5 full
  return [ra / D2R, dec / D2R, phase];
}
// world: x east, z south, y up. az clockwise from north → direction
const dirOf = (alt, az) => new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));

export function makeHeavens(scene, renderer, opts) {
  const lat = opts.lat, lon = opts.lon;
  const sky = new Sky(); sky.scale.setScalar(45000); scene.add(sky);
  const U = sky.material.uniforms;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // the night dome: the physical sky goes muddy below the horizon, so night is painted over it — deep blue at the zenith, the city's glow at the horizon
  const domeMat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, fog: false, side: THREE.BackSide, uniforms: {a: {value: 0}, glow: {value: new THREE.Color(0.32, 0.2, 0.12)}},
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float a; uniform vec3 glow; varying vec3 vD; void main(){ float h = max(vD.y, 0.); vec3 c = mix(vec3(.012, .02, .045), vec3(.003, .006, .016), smoothstep(0., .6, h)); c += glow * exp(-h * 9.) * .35; gl_FragColor = vec4(c, a); }'});
  const dome = new THREE.Mesh(new THREE.SphereGeometry(40000, 32, 16), domeMat); dome.renderOrder = -3; dome.frustumCulled = false; scene.add(dome);
  const sun = new THREE.DirectionalLight(0xffffff, 3); sun.castShadow = !!opts.shadows;
  if (opts.shadows) { sun.shadow.mapSize.set(2048, 2048); const c = sun.shadow.camera; c.left = c.bottom = -700; c.right = c.top = 700; c.near = 10; c.far = 6000; sun.shadow.bias = -0.0004; }
  scene.add(sun); scene.add(sun.target);
  const hemi = new THREE.HemisphereLight(0xbcd0ff, 0x5a5040, 0.8); scene.add(hemi);
  const moonLight = new THREE.DirectionalLight(0x9fb4ff, 0); scene.add(moonLight); scene.add(moonLight.target);
  scene.fog = new THREE.FogExp2(0x9aa8b8, 0.00018);
  // stars: the named bright ones + a faint field + the Milky Way, on a sphere that turns with sidereal time
  const starGeo = new THREE.BufferGeometry();
  const N = 5200, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
  const radec = [];
  STARS.forEach((s, i) => radec.push([s[1], s[2], s[3], s[4]]));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = radec.length; i < N; i++) {
    let ra, dec;
    if (i < 2600) {                                        // the galactic plane, roughly: a band through Cygnus, Aquila, Sagittarius, Cassiopeia, Auriga
      const l = rnd() * 360 * D2R, b = (rnd() + rnd() + rnd() - 1.5) * 9 * D2R;
      const ngpRa = 192.86 * D2R, ngpDec = 27.13 * D2R, lNcp = 122.93 * D2R;
      const sd = Math.sin(b) * Math.sin(ngpDec) + Math.cos(b) * Math.cos(ngpDec) * Math.cos(lNcp - l);
      dec = Math.asin(sd);
      ra = ngpRa + Math.atan2(Math.cos(b) * Math.sin(lNcp - l), Math.cos(ngpDec) * Math.sin(b) - Math.sin(ngpDec) * Math.cos(b) * Math.cos(lNcp - l));
      ra /= D2R; dec /= D2R;
    } else { ra = rnd() * 360; dec = Math.asin(rnd() * 2 - 1) / D2R; }
    radec.push([ra, dec, 4.2 + rnd() * 2.3, rnd() * 1.4 - 0.1]);
  }
  radec.forEach(([ra, dec, mag, bv], i) => { const c = bvColor(bv); col.set([c.r, c.g, c.b], i * 3); size[i] = Math.max(1.2, 7.5 - mag * 1.45); });
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(size, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: {vis: {value: 0}}, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float size; attribute vec3 color; varying vec3 vC; varying float vA; uniform float vis; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; gl_PointSize = size * (0.8 + 0.6 * vis); vA = smoothstep(-0.05, 0.12, normalize(position).y) * vis; }',
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC, a * a * vA); }',
  });
  const stars = new THREE.Points(starGeo, starMat); stars.frustumCulled = false; stars.renderOrder = -2; scene.add(stars);
  // the moon: a lit disc with its phase
  const mc = document.createElement('canvas'); mc.width = mc.height = 128;
  const moonTex = new THREE.CanvasTexture(mc);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({map: moonTex, transparent: true, depthWrite: false, fog: false})); moon.scale.setScalar(900); scene.add(moon);
  let lastPhase = -1;
  function drawMoon(ph) {
    const c = mc.getContext('2d'); c.clearRect(0, 0, 128, 128);
    const g = c.createRadialGradient(64, 64, 20, 64, 64, 64); g.addColorStop(0, 'rgba(220,230,255,.35)'); g.addColorStop(1, 'rgba(220,230,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#20242c'; c.beginPath(); c.arc(64, 64, 22, 0, 7); c.fill();
    const k = Math.cos(ph * 2 * Math.PI);                         // terminator
    c.fillStyle = '#f4f2e8'; c.beginPath();
    const right = ph < 0.5;
    c.arc(64, 64, 22, -Math.PI / 2, Math.PI / 2, !right);
    c.ellipse(64, 64, Math.abs(k) * 22, 22, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === right);
    c.fill(); moonTex.needsUpdate = true;
  }
  // clouds: a slow fbm sheet lit by the sun
  const cloudMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: {t: {value: 0}, cover: {value: 0.3}, sunCol: {value: new THREE.Color(1, 1, 1)}, shade: {value: new THREE.Color(0.5, 0.55, 0.6)}, night: {value: 0}},
    vertexShader: 'varying vec2 vU; varying float vD; void main(){ vU = position.xz * 0.00012; vec4 w = modelMatrix * vec4(position,1.); vD = length(w.xz - cameraPosition.xz); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float t, cover, night; uniform vec3 sunCol, shade; varying vec2 vU; varying float vD;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n(p); p *= 2.03; a *= .5; } return s; }
      void main(){ vec2 p = vU * 6. + vec2(t * .004, t * .002); float c = fbm(p); float d = fbm(p * 2.3 + 3.1);
        float m = smoothstep(1. - cover, 1.15 - cover * .5, c + .15 * d);
        vec3 col = mix(shade, sunCol, smoothstep(.3, .9, d)) * (1. - .85 * night);
        gl_FragColor = vec4(col, m * .92 * smoothstep(42000., 14000., vD)); }`,
  });
  const clouds = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000, 1, 1).rotateX(-Math.PI / 2), cloudMat);
  clouds.position.y = 1600; clouds.renderOrder = -1; scene.add(clouds);
  // rain
  const RN = 6000, rp = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) { const x = (rnd() - .5) * 260, y = rnd() * 140, z = (rnd() - .5) * 260; rp.set([x, y, z, x + .3, y - 2.2, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({color: 0xaabbcc, transparent: true, opacity: 0.4})); rain.frustumCulled = false; scene.add(rain);
  const state = {date: new Date(opts.date || '2026-09-22T19:05:00-04:00'), weather: 'clear', tide: 0, lightning: 0, night: 0, sunDir: new THREE.Vector3(), skyTop: new THREE.Color(), skyHor: new THREE.Color()};
  const W = {clear: {cloud: .22, turb: 2.2, ray: 1.4, fog: 0.00012, rain: 0}, cloudy: {cloud: .62, turb: 7, ray: 2.4, fog: 0.00022, rain: 0},
             fog: {cloud: .5, turb: 10, ray: 3, fog: 0.0011, rain: 0}, rain: {cloud: .82, turb: 12, ray: 3.2, fog: 0.0005, rain: 1}, storm: {cloud: .95, turb: 16, ray: 3.6, fog: 0.0007, rain: 1}};
  const api = {
    state, stars, sun,
    setDate(d) { state.date = d; },
    setWeather(w) { state.weather = w; },
    update(dt, camera, focus) {
      const Wx = W[state.weather];
      const lst = lstDeg(state.date, lon);
      const [sra, sdec] = sunRaDec(state.date); const [salt, saz] = altaz(sra, sdec, lat, lst);
      const sd = dirOf(salt, saz); state.sunDir.copy(sd);
      U.sunPosition.value.copy(sd); U.turbidity.value = Wx.turb; U.rayleigh.value = Wx.ray; U.mieCoefficient.value = 0.005; U.mieDirectionalG.value = 0.8;
      const el = salt / D2R;
      const day = THREE.MathUtils.smoothstep(el, -8, 6);
      state.night = 1 - THREE.MathUtils.smoothstep(el, -14, -3);
      renderer.toneMappingExposure = 0.55 + 0.45 * (1 - day) * (1 - state.night) + 0.35 * state.night;
      sun.position.copy(focus).addScaledVector(sd, 3000); sun.target.position.copy(focus);
      const warm = THREE.MathUtils.smoothstep(el, -2, 18);
      sun.color.setRGB(1, 0.55 + 0.42 * warm, 0.3 + 0.62 * warm);
      sun.intensity = 3.2 * day * (1 - 0.7 * Wx.cloud);
      hemi.intensity = 0.25 + 0.85 * day * (1 - 0.3 * Wx.cloud) + 0.12 * state.night;
      hemi.color.setRGB(0.55 + 0.2 * day, 0.62 + 0.2 * day, 0.85);
      // the moon
      const [mra, mdec, ph] = moonRaDec(state.date); const [malt, maz] = altaz(mra, mdec, lat, lst);
      const md = dirOf(malt, maz); moon.position.copy(camera.position).addScaledVector(md, 20000); moon.visible = malt > -0.02;
      if (Math.abs(ph - lastPhase) > 0.01) { drawMoon(ph); lastPhase = ph; }
      moon.material.opacity = 0.25 + 0.75 * state.night;
      const full = 1 - Math.abs(ph - 0.5) * 2;
      moonLight.intensity = state.night * Math.max(0, md.y) * 0.9 * full * (1 - Wx.cloud * 0.8);
      moonLight.position.copy(focus).addScaledVector(md, 3000); moonLight.target.position.copy(focus);
      // stars, turned by sidereal time
      const p = starGeo.attributes.position.array;
      for (let i = 0; i < radec.length; i++) { const [a, z] = altaz(radec[i][0], radec[i][1], lat, lst); const v = dirOf(a, z); p[i * 3] = v.x * 30000; p[i * 3 + 1] = v.y * 30000; p[i * 3 + 2] = v.z * 30000; }
      starGeo.attributes.position.needsUpdate = true;
      stars.position.copy(camera.position); dome.position.copy(camera.position); domeMat.uniforms.a.value = Math.pow(state.night, 1.4) * 0.97;
      starMat.uniforms.vis.value = state.night * (1 - Wx.cloud * 0.9);
      // fog, clouds, sky colour for the water
      state.skyHor.setRGB(0.55 + 0.35 * day, 0.6 + 0.3 * day, 0.7 + 0.22 * day).lerp(new THREE.Color(0.95, 0.55, 0.32), (1 - warm) * day * 0.8).multiplyScalar(0.12 + 0.88 * day);
      state.skyTop.setRGB(0.22, 0.38, 0.7).multiplyScalar(0.06 + 0.94 * day);
      scene.fog.color.copy(state.skyHor).lerp(new THREE.Color(0.45, 0.48, 0.52), Wx.cloud * 0.6);
      scene.fog.density = Wx.fog * (state.night > 0.5 ? 0.8 : 1);
      cloudMat.uniforms.t.value += dt; cloudMat.uniforms.cover.value += (Wx.cloud - cloudMat.uniforms.cover.value) * 0.02;
      cloudMat.uniforms.sunCol.value.copy(sun.color).multiplyScalar(0.6 + 0.6 * day); cloudMat.uniforms.shade.value.setRGB(0.42, 0.45, 0.52).multiplyScalar(0.3 + 0.7 * day);
      cloudMat.uniforms.night.value = state.night;
      clouds.position.x = camera.position.x; clouds.position.z = camera.position.z;
      // rain and lightning
      rain.visible = Wx.rain > 0; if (rain.visible) {
        rain.position.set(camera.position.x, camera.position.y - 60, camera.position.z);
        const a = rg.attributes.position.array; for (let i = 0; i < RN; i++) { let y = a[i * 6 + 1] - dt * 60; if (y < 0) y += 140; a[i * 6 + 1] = y; a[i * 6 + 4] = y - 2.2; } rg.attributes.position.needsUpdate = true;
      }
      if (state.weather === 'storm' && Math.random() < dt * 0.25) state.lightning = 1;
      state.lightning *= Math.pow(0.02, dt); hemi.intensity += state.lightning * 3;
      // the tide: semidiurnal, ±0.9 m
      const hours = state.date.getTime() / 3600000; state.tide = 0.9 * Math.sin(2 * Math.PI * hours / 12.42);
      state.sunEl = el;
    },
  };
  return api;
}

export function makeSea(scene, heights, meta, heav) {
  // a shader sea: deep colour → sky by fresnel, sun / moon glitter, waves, and foam where it is shallow (read from the land's own heights)
  const {nx, ny, cell} = meta;
  const ht = new Float32Array(nx * ny); for (let i = 0; i < nx * ny; i++) ht[i] = heights[i];
  const tex = new THREE.DataTexture(ht, nx, ny, THREE.RedFormat, THREE.FloatType); tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    transparent: true, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {t: {value: 0}, sunDir: {value: new THREE.Vector3()}, sunCol: {value: new THREE.Color()}, top: {value: new THREE.Color()}, hor: {value: new THREE.Color()},
      land: {value: tex}, size: {value: new THREE.Vector2(meta.W, meta.H)}, level: {value: 0}, night: {value: 0}, storm: {value: 0}}]),
    vertexShader: `varying vec3 vW;
${THREE.ShaderChunk.fog_pars_vertex}
void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
${THREE.ShaderChunk.fog_vertex}
}`,
    fragmentShader: `uniform float t, level, night, storm; uniform vec3 sunDir, sunCol, top, hor; uniform sampler2D land; uniform vec2 size; varying vec3 vW;

${THREE.ShaderChunk.fog_pars_fragment}
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      void main(){
        vec2 p = vW.xz;
        float a = 1. + storm * 2.;
        vec2 g = .35 * vec2(n(p * .03 + t * .2) - n(p * .03 + vec2(3.1, 1.7) - t * .18), n(p * .027 + vec2(7., 2.) + t * .17) - n(p * .027 + vec2(1.2, 9.) - t * .2));
        g += .45 * vec2(n(p * .17 + t * .9) - .5, n(p * .15 + 5. - t * 1.) - .5);
        g += .3 * vec2(n(p * .7 + t * 2.1) - .5, n(p * .63 + 9. - t * 2.3) - .5);
        float fade = exp(-length(cameraPosition - vW) * .0004);
        vec3 N = normalize(vec3(g.x * .22 * a * (.3 + .7 * fade), 1., g.y * .22 * a * (.3 + .7 * fade)));
        vec3 V = normalize(cameraPosition - vW);
        float fr = pow(1. - max(dot(N, V), 0.), 5.) * .7 + .06;
        vec3 R = reflect(-V, N);
        vec3 skyc = mix(hor, top, smoothstep(0., .5, R.y));
        vec3 deep = vec3(.02, .07, .1) * (1. - .8 * night) + vec3(.0, .01, .02);
        vec3 col = mix(deep, skyc, fr);
        float spec = pow(max(dot(R, normalize(sunDir)), 0.), 220.) * (1. - storm);
        col += sunCol * spec * 3.5;
        float ground = texture2D(land, vec2(vW.x / size.x, vW.z / size.y)).r;
        float depth = level - ground;
        float foam = smoothstep(1.2, 0., depth) * (.6 + .4 * n(p * .6 + t * 2.));
        col = mix(col, vec3(.9, .93, .95) * (.25 + .75 * (1. - night)), foam * .75);
        gl_FragColor = vec4(col, mix(.82, .98, smoothstep(0., 8., depth)));

${THREE.ShaderChunk.fog_fragment}
      }`,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(meta.W * 4, meta.H * 4, 1, 1).rotateX(-Math.PI / 2), mat);
  sea.position.set(meta.W / 2, 0, meta.H / 2); scene.add(sea);
  return {
    sea, update(dt) {
      const s = heav.state; mat.uniforms.t.value += dt; sea.position.y = s.tide; mat.uniforms.level.value = s.tide;
      mat.uniforms.sunDir.value.copy(s.sunDir.y > -0.05 ? s.sunDir : new THREE.Vector3(0.3, 0.4, -0.5));
      mat.uniforms.sunCol.value.copy(heav.sun.color).multiplyScalar(s.sunDir.y > -0.05 ? 1 : 0.35);
      mat.uniforms.top.value.copy(s.skyTop); mat.uniforms.hor.value.copy(s.skyHor);
      mat.uniforms.night.value = s.night; mat.uniforms.storm.value = s.weather === 'storm' ? 1 : s.weather === 'rain' ? 0.4 : 0;
    },
  };
}
