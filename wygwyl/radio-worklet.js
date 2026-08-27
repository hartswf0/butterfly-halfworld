/* ============================================================================
   radio-worklet.js — THE BAND BANK, RUNNING ON THE AUDIO THREAD.

   Everything about how a film becomes a sound is decided elsewhere; this only
   holds the oscillators and the read head, because those are the two things
   that must not be interrupted by a garbage collection or a slow frame. The
   page posts a picture and a law thirty times a second and this runs at
   forty-eight thousand.

   WHAT ARRIVES: one flat Float32Array holding three band x column matrices —
   figure, ground, accent — and four numbers that are the poem's law at this
   instant. The head's position arrives too rather than being integrated here,
   so the line drawn on the picture and the column being sounded are the same
   number and cannot drift apart. Between messages the head is RAMPED, not
   held: a pass takes seconds and a frame takes a fortieth of one, so a
   straight line between two frames' positions is exact to well under a dot.

   WHY EVERYTHING RAMPS: at this sample rate any value that steps is a click,
   and a click is the machinery becoming audible. Amplitudes cross-fade over
   the frame, the gate runs through a thirty-millisecond one-pole so that a
   law allowed to declare a hard edge still arrives as a consonant, and the
   phase accumulators are never reset — a band that goes silent keeps turning,
   so that when it comes back it comes back in phase with itself.
   ========================================================================= */
class BandBank extends AudioWorkletProcessor {
  constructor(opts) {
    super();
    const o = opts.processorOptions || {};
    this.B = o.bands | 0 || 56;
    this.C = o.cols | 0 || 64;
    const n = this.B * this.C;
    this.hz = new Float32Array(this.B);
    this.ph = new Float32Array(this.B);
    this.A = new Float32Array(n * 3);          // what is sounding
    this.Z = new Float32Array(n * 3);          // what is arriving
    this.xf = 1; this.xfInc = 0;               // the cross-fade between them
    this.scan = 0; this.scanTo = 0; this.scanInc = 0;
    this.gate = 0; this.gateTo = 1;
    this.gnd = 0.4; this.gndTo = 0.4;
    this.atk = 2.1; this.atkTo = 2.1;
    this.gk = 1 - Math.exp(-1 / (sampleRate * 0.030));
    this.on = false;
    /* unrelated partials sum in power, so a bank of B of them is sqrt(B) times
       one of them; divide it out and the master level stops depending on how
       finely the picture was sliced */
    this.master = 1 / Math.sqrt(this.B);
    this.lvl = 0;                              // for the page's own meter
    this.tick = 0;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m.hz) { this.hz.set(m.hz); return; }
      if (m.stop !== undefined) { this.on = !m.stop; return; }
      if (m.reset) { this.ph.fill(0); this.A.fill(0); this.Z.fill(0); return; }
      /* the page may ride the master. A transmission that saturates loses ink:
         offline, peak-normalising instead of limiting moved a reconstruction
         from 0.830 to 0.918, and live there is no future to normalise against,
         so the level is walked instead. */
      if (m.gain !== undefined) { this.master = m.gain; return; }
      if (m.amp) {
        this.A.set(this.mix());                // freeze where the fade got to
        this.Z.set(m.amp);
        const frames = Math.max(1, (m.dt || 1 / 30) * sampleRate);
        this.xf = 0; this.xfInc = 1 / frames;
        this.scan = this.scanNow();
        this.scanTo = m.scan;
        this.scanInc = (m.scan - this.scan) / frames;
        /* a pass that has just wrapped must not be ramped BACKWARDS across the
           whole frame — that is the head sprinting the wrong way once a pass */
        if (Math.abs(m.scan - this.scan) > 0.5) { this.scan = m.scan; this.scanInc = 0; }
        this.gateTo = m.gate; this.gndTo = m.ground; this.atkTo = m.attack;
        this.on = true;
      }
    };
    this.tmp = new Float32Array(this.B * this.C * 3);
  }
  mix() {
    const t = this.xf < 0 ? 0 : this.xf > 1 ? 1 : this.xf, u = 1 - t;
    const T = this.tmp, A = this.A, Z = this.Z;
    for (let i = 0; i < T.length; i++) T[i] = A[i] * u + Z[i] * t;
    return T;
  }
  scanNow() { return this.scan < 0 ? 0 : this.scan > 1 ? 1 : this.scan; }
  process(_inputs, outputs) {
    const out = outputs[0], L = out[0], R = out[1] || out[0];
    if (!this.on) { L.fill(0); if (R !== L) R.fill(0); return true; }
    const B = this.B, C = this.C, n = B * C;
    const A = this.A, Z = this.Z;
    let peak = 0;
    for (let i = 0; i < L.length; i++) {
      this.xf += this.xfInc; if (this.xf > 1) this.xf = 1;
      this.scan += this.scanInc;
      if (this.scan < 0) this.scan = 0; else if (this.scan > 1) this.scan = 1;
      this.gate += (this.gateTo - this.gate) * this.gk;
      this.gnd += (this.gndTo - this.gnd) * this.gk;
      this.atk += (this.atkTo - this.atk) * this.gk;
      const t = this.xf, u1 = 1 - t;
      const cf = this.scan * (C - 1), c0 = cf | 0, cr = cf - c0;
      const c1 = c0 + 1 < C ? c0 + 1 : c0;
      /* the head is at a place in the frame, so it is at a place in the room */
      const th = this.scan * Math.PI / 2, gl = Math.cos(th), gr = Math.sin(th);
      let l = 0, r = 0;
      for (let b = 0; b < B; b++) {
        const i0 = b * C + c0, i1 = b * C + c1;
        const f0 = A[i0] * u1 + Z[i0] * t, f1 = A[i1] * u1 + Z[i1] * t;
        const g0 = A[n + i0] * u1 + Z[n + i0] * t, g1 = A[n + i1] * u1 + Z[n + i1] * t;
        const a = (f0 + this.gnd * g0) * (1 - cr) + (f1 + this.gnd * g1) * cr;
        let p = this.ph[b] + this.hz[b] / sampleRate;
        if (p >= 1) p -= (p | 0);
        this.ph[b] = p;
        if (a < 0.004) continue;
        const ac = (A[2 * n + i0] * u1 + Z[2 * n + i0] * t);
        const g = Math.pow(a, this.atk) * 1.15;
        let v = Math.sin(p * 6.283185307179586);
        if (ac > 0.002) v += Math.sin(p * 6.283185307179586 * 1.4983) * ac * 6;
        l += v * g * gl; r += v * g * gr;
      }
      l *= this.gate * this.master; r *= this.gate * this.master;
      const m = l > r ? l : r; if (m > peak) peak = m;
      L[i] = Math.tanh(l) * 0.9;
      R[i] = Math.tanh(r) * 0.9;
    }
    this.lvl = this.lvl * 0.85 + peak * 0.15;
    if ((this.tick = (this.tick + 1) % 6) === 0) this.port.postMessage({ lvl: this.lvl });
    return true;
  }
}
registerProcessor("bandbank", BandBank);
