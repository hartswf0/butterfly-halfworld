// THE SKY — every place keeps the light its poem was written in.
// A look is {top, hor, key, key_i, el, az, amb, amb_i, fog, near, far, stars, prac, exp, rain}
// (after the Odyssey cinerium's sky.js: pinned sun elevation, weather presets, a set's own
// override, a shot's own mood). Looks blend: walk between two sets and the light walks with you.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const NUM = ['key_i', 'el', 'az', 'amb_i', 'near', 'far', 'stars', 'exp', 'rain'];
const COL = ['top', 'hor', 'key', 'amb', 'fog', 'prac'];

export function blend(looks, weights) {
  const out = {}; let tw = 0;
  for (const w of weights) tw += w;
  for (const k of NUM) out[k] = looks.reduce((s, l, i) => s + (l[k] ?? (k === 'az' ? 120 : 0)) * weights[i], 0) / tw;
  for (const k of COL) {
    const c = new THREE.Color(0, 0, 0);
    looks.forEach((l, i) => { const ci = new THREE.Color(l[k]); c.r += ci.r * weights[i] / tw; c.g += ci.g * weights[i] / tw; c.b += ci.b * weights[i] / tw; });
    out[k] = '#' + c.getHexString();
  }
  return out;
}

export function makeSky(scene, renderer, camera) {
  const U = {
    top: {value: new THREE.Color('#203050')}, hor: {value: new THREE.Color('#a0a8b0')},
    sunDir: {value: new THREE.Vector3(0, 1, 0)}, sunCol: {value: new THREE.Color('#fff')},
    stars: {value: 0}, t: {value: 0}, below: {value: new THREE.Color('#202020')},
  };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: `varying vec3 vDir; void main(){ vec4 w = modelMatrix * vec4(position,1.); vDir = normalize(w.xyz - cameraPosition);
      gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 top, hor, sunCol, below; uniform vec3 sunDir; uniform float stars, t; varying vec3 vDir;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5); }
      void main(){
        vec3 d = normalize(vDir); float y = d.y;
        vec3 c = mix(hor, top, smoothstep(-0.02, 0.55, y));
        c = mix(c, below, smoothstep(0.0, -0.25, y));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 900.0) * 3.0 + pow(s, 24.0) * 0.35 + pow(s, 4.0) * 0.08) * smoothstep(-0.12, 0.05, sunDir.y + 0.1);
        if (stars > 0.0 && y > 0.0) {
          vec2 g = vec2(atan(d.z, d.x) * 180.0, asin(y) * 360.0);
          vec2 cell = floor(g); float r = h21(cell);
          float tw = 0.6 + 0.4 * sin(t * (1.0 + r * 3.0) + r * 40.0);
          float star = step(0.9965, r) * smoothstep(0.5, 0.0, length(fract(g) - 0.5)) * tw;
          c += vec3(star) * stars * smoothstep(0.0, 0.25, y);
        }
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  dome.renderOrder = -1; dome.frustumCulled = false;
  scene.add(dome);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x404030, 0.6); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1); scene.add(key); scene.add(key.target);
  scene.fog = new THREE.Fog(0x888888, 300, 3000);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // rain: streaks that follow the camera
  const RN = 2400, rp = new Float32Array(RN * 6);
  for (let i = 0; i < RN; i++) { const x = (Math.random() - .5) * 120, y = Math.random() * 60, z = (Math.random() - .5) * 120; rp.set([x, y, z, x + .15, y - 1.1, z], i * 6); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({color: 0xaabbcc, transparent: true, opacity: 0.35, fog: false}));
  rain.frustumCulled = false; scene.add(rain);
  let cur = null;
  const api = {
    look: null,
    set(look, k = 1) {
      if (!cur) cur = {...look};
      else cur = blend([cur, look], [1 - k, k]);
      api.look = cur;
      U.top.value.set(cur.top); U.hor.value.set(cur.hor); U.below.value.set(cur.fog);
      const el = THREE.MathUtils.degToRad(cur.el), az = THREE.MathUtils.degToRad(cur.az ?? 120);
      // island coords: x east, z south — azimuth 90 = east
      const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      U.sunDir.value.copy(dir); U.sunCol.value.set(cur.key);
      U.stars.value = cur.stars;
      key.color.set(cur.key); key.intensity = cur.key_i * (el > -0.05 ? 1 : 0.6);
      hemi.color.set(cur.amb); hemi.groundColor.set(cur.fog); hemi.intensity = cur.amb_i * 1.4;
      scene.fog.color.set(cur.fog); scene.fog.near = cur.near; scene.fog.far = cur.far;
      renderer.toneMappingExposure = cur.exp;
      rain.visible = cur.rain > 0.05; rain.material.opacity = 0.35 * Math.min(1, cur.rain);
      api.dir = dir;
    },
    update(cam, dt, focus) {
      U.t.value += dt;
      dome.position.copy(cam.position);
      if (focus) { key.position.set(focus.x + api.dir.x * 400, focus.y + api.dir.y * 400 + 20, focus.z + api.dir.z * 400); key.target.position.copy(focus); }
      if (rain.visible) {
        rain.position.set(cam.position.x, cam.position.y - 20, cam.position.z);
        const a = rg.attributes.position.array;
        for (let i = 0; i < RN; i++) {
          let y = a[i * 6 + 1] - dt * 38; if (y < 0) y += 60;
          a[i * 6 + 1] = y; a[i * 6 + 4] = y - 1.1;
        }
        rg.attributes.position.needsUpdate = true;
      }
    },
  };
  return api;
}

// the halfworld grade: paper, ink, one blue — luminance becomes dot size
export function makeHalftone(renderer) {
  const rt = new THREE.WebGLRenderTarget(2, 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {tex: {value: rt.texture}, res: {value: new THREE.Vector2(2, 2)}, cell: {value: 5.0}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tex; uniform vec2 res; uniform float cell; varying vec2 vUv;
      void main(){
        vec2 px = vUv * res; vec2 c = (floor(px / cell) + 0.5) * cell;
        vec3 s = texture2D(tex, c / res).rgb; float L = dot(s, vec3(0.299, 0.587, 0.114));
        float r = sqrt(1.0 - clamp(L, 0.0, 1.0)) * cell * 0.62;
        float d = length(px - c);
        float blue = smoothstep(0.08, 0.25, s.b - max(s.r, s.g));
        vec3 paper = vec3(0.957, 0.957, 0.941), ink = mix(vec3(0.078), vec3(0.0, 0.2, 0.8), blue);
        gl_FragColor = vec4(mix(ink, paper, smoothstep(r - 0.7, r + 0.7, d)), 1.0);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const sc = new THREE.Scene(); sc.add(quad);
  const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    render(scene, camera) {
      const w = renderer.domElement.width, h = renderer.domElement.height;
      if (rt.width !== w || rt.height !== h) { rt.setSize(w, h); mat.uniforms.res.value.set(w, h); }
      mat.uniforms.cell.value = Math.max(4, Math.round(w / 260));
      renderer.setRenderTarget(rt); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(sc, oc);
    },
  };
}
