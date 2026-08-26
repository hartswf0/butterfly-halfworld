/* ============================================================================
   prosody.mjs — FOURTEEN LAWS FOR HOW SPEECH OCCUPIES TIME.

   The film already makes its own music: `sonify.mjs` reads the field as a
   spectrum and a read head crosses it, so a horizon sustains and a body
   strikes. What that engine did not have was a REASON for the head to move the
   way it does. This is the reason. Each poem declares a prosodic engine, and
   the engine governs the scan.

   THE SECOND NARRATIVE. Under the written one there is another: the poet
   begins trapped inside his own voice and gradually learns fourteen different
   ways a human voice can live among other bodies. Malḥūn discovers a pulse.
   Gabay needs no accompaniment. The dirge turns sorrow into ceremony. Izibongo
   rebuilds a body by naming it. Jaliya carries genealogy on a cycle that will
   not stop. Ahellil turns a solo into a society. Taasu makes drum and word
   argue. Sega turns grief into locomotion. Kabary makes listening the
   ceremony. The epic makes travel the meter. Qene puts one language underneath
   another. T'heydinn makes memory a collective possession. Taarab lets desire
   move sideways. Imzad finally makes silence large enough to hold an ending.

   WHAT AN ENGINE ACTUALLY CONTROLS, and it is deliberately small — four
   numbers, because a law with fifty knobs is a preference and not a law:

     sweep(u)    seconds for the head to cross the frame — the breath
     gate(u,p)   0..1, applied to everything — where the vacancies are, and
                 `p` is the scan's own phase, so an engine can put its silence
                 at a place in the line rather than at a place in the clock
     ground(u)   0..1, how much of the picture's own background is allowed to
                 speak. 0 is the figure alone; 1 is the wallpaper singing too
     attack(u)   the amplitude exponent — low is atmospheric, high is
                 declarative, because an exponent on ink is the difference
                 between a wash and a statement

   `u` is position through the film, 0 to 1. Every engine is a pure function of
   it, which is the same law the pictures run under and the reason a film and
   its music can be seeked to the same instant.
   ========================================================================= */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
/* a soft window: 1 inside, 0 outside, no click at either edge */
const win = (p, a, b, e = 0.06) =>
  smooth(clamp((p - a) / e, 0, 1)) * (1 - smooth(clamp((p - b) / e, 0, 1)));

export const ENGINES = {

  /* 01 · MALḤŪN — the poem discovers a pulse.
     Free at the head and inevitable at the end: the sweep begins long and
     irregular and tightens, and the ground stays quiet so the picture speaks
     in objects rather than atmosphere until the descent gathers. */
  malhun: {
    tradition: "Morocco · Malḥūn / qṣida",
    sweep: (u) => lerp(9.5, 4.2, smooth(u)) * (1 + Math.sin(u * 17.3) * 0.16 * (1 - u)),
    gate: (u, p) => lerp(0.55, 0.92, smooth(u)) * (0.45 + 0.55 * win(p, 0.06, 0.94, 0.10)),
    ground: (u) => smooth(clamp((u - 0.35) / 0.6, 0, 1)) * 0.45,
    attack: (u) => lerp(2.6, 1.9, smooth(u)),
  },

  /* 02 · GABAY — language needs no accompaniment.
     A constant, disciplined sweep and an exact silence. The ground is mute:
     nothing accompanies. What carries the line is the line. */
  gabay: {
    tradition: "Somalia · Gabay",
    sweep: () => 6.4,
    gate: (u, p) => 0.30 + 0.70 * win(p, 0.10, 0.62, 0.05),
    ground: () => 0.0,
    attack: () => 2.9,
  },

  /* 03 · DIRGE — sorrow becomes ceremony, then debris.
     Density climbs as the storm takes the chapel, and at the shattering the
     rhythmic floor is removed entirely — the last fifth is surf and breath. */
  dirge: {
    tradition: "Ghana · funeral lament",
    sweep: (u) => lerp(11.0, 5.0, smooth(clamp(u / 0.78, 0, 1))),
    gate: (u, p) => (u > 0.82 ? lerp(0.9, 0.16, smooth((u - 0.82) / 0.18)) : lerp(0.5, 1.0, smooth(u / 0.82)))
      * (0.5 + 0.5 * win(p, 0.04, 0.96, 0.12)),
    ground: (u) => smooth(clamp(u / 0.8, 0, 1)) * 0.6,
    attack: (u) => lerp(2.4, 1.7, smooth(u)),
  },

  /* 04 · IZIBONGO — speech rebuilds the body.
     Bursts separated by complete silence. Every declaration is shorter and
     harder than the last, and the vacancies between them do not soften. */
  izibongo: {
    tradition: "Xhosa / Zulu · Izibongo",
    sweep: (u) => lerp(7.0, 2.6, smooth(u)),
    gate: (u, p) => {
      const burst = win(p, 0.0, lerp(0.55, 0.34, smooth(u)), 0.03);
      return 0.06 + 0.94 * burst;                       // silence is real silence
    },
    ground: () => 0.12,
    attack: (u) => lerp(2.6, 3.4, smooth(u)),
  },

  /* 05 · JALIYA — repetition carries genealogy.
     The cycle does not vary. That is the whole point: the instrumental time is
     stable and the voice is free above it, so the sweep is a constant and only
     the ground opens as generations are added. */
  jaliya: {
    tradition: "Mali / Guinea / Gambia · Jaliya",
    sweep: () => 5.85,
    gate: (u, p) => 0.72 + 0.28 * win(p, 0.02, 0.98, 0.14),
    ground: (u) => smooth(u) * 0.85,
    attack: () => 2.0,
  },

  /* 06 · AHELLIL — a solo becomes a society.
     One voice, then many. The ground rises steadily because the ground IS the
     others arriving, and by the end the protagonist is one body among them. */
  ahellil: {
    tradition: "Algerian Sahara · Ahellil",
    sweep: (u) => lerp(8.4, 5.4, smooth(u)),
    gate: (u, p) => lerp(0.34, 0.95, smooth(u)) * (0.55 + 0.45 * win(p, 0.05, 0.95, 0.10)),
    ground: (u) => smooth(clamp(u * 1.15, 0, 1)) * 0.95,
    attack: (u) => lerp(2.8, 1.85, smooth(u)),
  },

  /* 07 · TAASU — drum and word attack each other.
     Acceleration by subdivision rather than by tempo: the sweep halves, and
     halves again, so the density rises while the breath stays a breath. */
  taasu: {
    tradition: "Senegal · Taasu + Sabar",
    sweep: (u) => 5.2 / Math.pow(2, Math.floor(smooth(u) * 2.9) * 0.62),
    gate: (u, p) => 0.35 + 0.65 * win(p, 0.0, lerp(0.72, 0.94, smooth(u)), 0.04),
    ground: (u) => smooth(clamp((u - 0.22) / 0.7, 0, 1)) * 0.7,
    attack: (u) => lerp(3.0, 2.2, smooth(u)),
  },

  /* 08 · SEGA — grief becomes locomotion.
     One number does it: the sweep shortens continuously and the gate opens
     with it, so nothing is announced and the room is simply moving by the end.
     The soul returning is a collapse, not a climax — the last tenth reverses. */
  sega: {
    tradition: "Mauritius · Sega Tipik",
    sweep: (u) => (u > 0.9 ? lerp(3.0, 7.5, smooth((u - 0.9) / 0.1)) : lerp(7.6, 3.0, smooth(u / 0.9))),
    gate: (u, p) => (u > 0.9 ? lerp(0.95, 0.35, smooth((u - 0.9) / 0.1)) : lerp(0.52, 0.95, smooth(u / 0.9)))
      * (0.6 + 0.4 * win(p, 0.02, 0.98, 0.10)),
    ground: (u) => smooth(u) * 0.8,
    attack: () => 2.05,
  },

  /* 09 · KABARY — listening becomes the ceremony.
     A long rhetorical arc and then unusually generous silence where an answer
     could have been. The gate's vacancy is the largest in the film, and it is
     placed at the END of the line, which is where an answer would go. */
  kabary: {
    tradition: "Madagascar · Kabary",
    sweep: () => 7.8,
    gate: (u, p) => 0.10 + 0.90 * win(p, 0.03, 0.58, 0.09),
    ground: () => 0.22,
    attack: () => 2.5,
  },

  /* 10 · EPIC — travel becomes meter.
     A steady gait that episodically quickens and then, as dawn arrives, thins
     rather than resolves: percussion leaves and the bow continues. */
  epic: {
    tradition: "Egypt · Al-Sīrah al-Hilāliyya",
    sweep: (u) => 4.6 * (1 - 0.22 * Math.sin(u * Math.PI * 5.3)) * lerp(1, 1.35, smooth(clamp((u - 0.7) / 0.3, 0, 1))),
    gate: (u, p) => lerp(0.9, 0.42, smooth(clamp((u - 0.62) / 0.38, 0, 1))) * (0.6 + 0.4 * win(p, 0.02, 0.97, 0.08)),
    ground: (u) => lerp(0.7, 0.15, smooth(clamp((u - 0.55) / 0.45, 0, 1))),
    attack: () => 2.15,
  },

  /* 11 · QENE — one language underneath another.
     Every phrase dictates its own breath, so the sweep wanders slowly and
     never settles; and the ground OPENS late, which is the second meaning
     arriving inside a sentence that had already finished. */
  qene: {
    tradition: "Ethiopia · Qene + Bägänna",
    sweep: (u) => 9.6 + Math.sin(u * 6.1) * 2.3,
    gate: (u, p) => 0.38 + 0.62 * win(p, 0.08, 0.88, 0.16),
    ground: (u) => smooth(clamp((u - 0.45) / 0.55, 0, 1)) * 0.75,
    attack: (u) => lerp(2.7, 2.0, smooth(u)),
  },

  /* 12 · T'HEYDINN — memory becomes collective possession.
     The poem is repeatedly interrupted by life, so the gate is punched through
     at irregular places rather than shaped, and the ground is loud from the
     start because the others were always in the room. */
  theydinn: {
    tradition: "Mauritania · T'heydinn",
    sweep: () => 4.9,
    gate: (u, p) => {
      const hole = Math.sin(p * 31.4 + u * 11) > 0.72 ? 0.35 : 1;   // somebody cuts in
      return (0.68 + 0.32 * win(p, 0.02, 0.98, 0.1)) * hole;
    },
    ground: (u) => 0.55 + smooth(u) * 0.4,
    attack: () => 2.0,
  },

  /* 13 · TAARAB — desire moves sideways.
     The music approaches the tonic and delays arrival: the sweep lengthens
     very slightly across the film, so every pass is a fraction later to
     resolve than the last. And when the eyes meet, instruments are REMOVED. */
  taarab: {
    tradition: "Zanzibar / Swahili coast · Taarab",
    sweep: (u) => lerp(5.6, 6.9, smooth(u)),
    gate: (u, p) => (u > 0.88 ? lerp(0.85, 0.22, smooth((u - 0.88) / 0.12)) : 0.85)
      * (0.5 + 0.5 * win(p, 0.06, 0.90, 0.13)),
    ground: () => 0.3,
    attack: () => 2.35,
  },

  /* 14 · IMZAD — distance itself is the meter.
     The longest breath in the film and the largest vacancies. Nothing
     accumulates. The last stretch removes almost everything that the other
     thirteen engines built, and what continues after the voice stops is one
     bowed line and the room. */
  imzad: {
    tradition: "Tuareg · Imzad",
    sweep: (u) => lerp(12.5, 16.0, smooth(u)),
    gate: (u, p) => lerp(0.55, 0.20, smooth(clamp((u - 0.5) / 0.5, 0, 1)))
      * (0.12 + 0.88 * win(p, 0.14, 0.52, 0.14)),
    ground: (u) => lerp(0.25, 0.04, smooth(u)),
    attack: () => 2.6,
  },
};

/* the engine, resolved, with a default that is honest about being one */
export function engineOf(name) {
  const e = ENGINES[name];
  if (e) return e;
  return {
    tradition: "unnamed",
    sweep: () => 5.0, gate: () => 0.8, ground: () => 0.4, attack: () => 2.1,
  };
}

/* ============================================================================
   MODES — the second half of a prosodic engine, because meter is not the only
   thing a tradition decides.

   The sonifier quantises picture rows to a scale so that any field at all is
   in key. Which scale is not a neutral choice: a neutral second is the
   difference between a Moroccan qṣida and a European lament, and the two
   Ethiopian kiñit below do more to place a sound than any rhythm could. The
   entries are semitones and they are allowed to be FRACTIONAL, because the
   quantiser is a ratio and not a piano — 1.5 is the neutral second that half
   these traditions actually use and that no keyboard can play.
   ========================================================================= */
export const MODES = {
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixo: [0, 2, 4, 5, 7, 9, 10],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  hijaz: [0, 1, 4, 5, 7, 8, 10],          // Moorish / Saharan
  bayati: [0, 1.5, 3, 5, 7, 8, 10],       // the neutral second
  rast: [0, 2, 3.5, 5, 7, 9, 10.5],       // two neutral degrees — the Swahili coast
  penta: [0, 3, 5, 7, 10],                // minor pentatonic
  penta2: [0, 2, 4, 7, 9],                // anhemitonic — Nguni bow, Mande
  ambassel: [0, 1, 5, 7, 8],              // an Ethiopian kiñit
};
export function modeOf(name) { return MODES[name] || MODES.aeolian; }

/* A film declares its key as a drone base — 16.35, 49.00, 98.00 — and those
   span three octaves, which would make one film sub-audible and another shrill
   for reasons that have nothing to do with the film. Fold the pitch class into
   one octave so the KEY differs between films and the REGISTER does not. */
export function foldRoot(hz, lo = 32.0) {
  if (!(hz > 0)) return 41.203;
  while (hz < lo) hz *= 2;
  while (hz >= lo * 2) hz /= 2;
  return hz;
}
