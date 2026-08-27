# RADIO-FRESCO — the stepping stones
### one clock, one wall: earsketch + observatory + radio in a single space

The target: **radio-fresco.html** — a wall (fresco) where sampled voice, mined
sound, measured prosody, and picture-films all play under ONE clock. Stations
are arrangements; every sounding thing shows its lanes; every image can sound
and every sound can draw. We are not far in miles but in *contracts* — each
stone below is one contract made real, and each is useful on its own the day
it lands.

## Where we stand (stones already placed)

- **S0 · THE CORPUS SPEAKS** — voice registry, word-level timings, recut grades
  (A/B/C), 439 chops, 267 lines, reconstitute. `cuts.json` is the voice contract.
- **S1 · THE MINE** — 210 seam-tested segments + voice shelf = 916 sounds in
  EarSketch schema (`atlantis-standard.json`). The library contract.
- **S2 · THE SEAL** — `seal-earsketch.html`: ES+ vendored, STATIC pointed
  same-origin. The workshop eats the corpus. No remote backend to hang on.

## The stones ahead

- **S3 · ONE SCORE FORMAT** ✓ *placed* — fresco-score v0.1 is live:
  `fresco.html` is the bare reader (transport, seek, per-track mute, marker +
  contour lanes, honest source accounting); writers so far: `fresco_compile.py`
  (the 2025 unified-drone OTIO timeline replays as `scores/unified-drone.fresco.json`,
  14 voice clips + 132 accents over 24 min; `scores/reading-06.fresco.json`
  rebuilds a reading from its line cuts), reconstitute ⬇ score, observatory
  SCORE. Remaining inside this stone: the seal exports/imports the same
  contract.

- **S4 · VOICE AS TRACK**
  Reconstitute emits score clips (not just WAV); pack/sampler get "send to
  seal" (clip lands in the workshop timeline via localStorage handoff).
  Prosody events (ACCENT, PHRASE_END, BREATH) arrive as a marker lane —
  quantize targets, cut points, bar-line candidates. The voice arranges.

- **S5 · SHAPE AS MODULATION**
  COPY ITS SHAPE lands in the DAW: pitch/energy contours from `lanes/` and
  `pack.json` become automation lanes (gain, filter, rate). A phrase's arc
  bends a synth; a word's envelope gates a drone. Analysis → affordance.

- **S6 · PICTURES ENTER THE CLOCK**
  Radio's scan-synthesis (`radio.mjs` prosodic engines) refactored into an
  instrument: a picture is a clip on a track; the read-head is the playhead.
  The fourteen halfworld films become schedulable sources beside the voice
  they came from.

- **S7 · THE FRESCO**
  `radio-fresco.html`: stations = scores on one wall. Left: the dial
  (stations, halfworlds, readings). Center: the picture + read-head. Below:
  observatory lanes of WHATEVER is sounding now (voice lanes for voice,
  contour lanes for segments, scan lanes for pictures). Transport is the one
  clock; everything scrubs together. Mobile-lazy: a station loads only its
  own assets.

- **S8 · THE LOOP CLOSES** *(the bidirectional ecology)*
  Mic input analyzed live with the same lanes → the fresco answers (harmony
  from pitch, cuts from phrase ends) → the speaker hears and drifts → the
  system hears the drift. Voice → world → voice. The instrument becomes an
  ecology.

## Laws that hold across all stones

1. One clock. No component owns time; the score does.
2. Every sounding thing can show its measurement; every measurement can sound.
3. Same-origin, static, phone-capable. No backends that can strand a page.
4. Every derived thing cites its source path + time span back into the corpus.
5. Analysis must produce affordances, not merely measurements.
