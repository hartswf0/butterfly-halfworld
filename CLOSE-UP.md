# THE SPEAKING CUT

### a ninth motion, a second head, and a mouth that is making the sound you are hearing

---

## THE COMPLAINT

> *"the issue with many of the voices is we dont see a mouth talking"*

Twelve people speak in this film for three minutes and eleven seconds. In the wide cut not one
visible mouth ever opens. The voice arrives from beside the picture rather than out of it, and
because the film is *about* testimony — a witness making a claim it has no way to verify — a
disembodied voice was not a neutral choice. It was the film accidentally agreeing with its own
doubt about everything, including the parts that are supposed to land.

This is the fix, and it is four files.

---

## 1. WHERE, EXACTLY, DOES EACH LINE START?

`harness/measure-lines.mjs` → `audio/line-timing.json`

`audio/scene-takes.json` carried a measured duration per take, and inside each take it split that
duration among the lines **in proportion to their word counts**, flagged honestly as
`"apportioned": true`. For a film whose picture is a loop laid under the voice, that was fine —
nothing on screen had to agree with any particular line.

A close-up cannot use it. Cut to Niko's face while Mara is still finishing her sentence and the
film is not imprecise, it is wrong in the one way an audience detects instantly.

So the boundaries get measured off the waveform: RMS envelope at 100 Hz, silence runs of 100 ms or
more become candidate boundaries, and a dynamic program picks *N−1* of them in order — cost is
distance from the word-count guess, less a bonus for a long pause, because a long pause is far more
likely to be a speaker change than a comma.

**The instrument, and the whole justification for the file:**

```
72 boundaries relocated · median 0.281s · p90 0.831s · max 1.392s
17 boundaries moved by half a second or more
```

Seventeen cuts would have landed on the wrong face. One by nearly a second and a half. If that
number had come back at 0.02s the file would have bought nothing and should have been deleted.

---

## 2. THE MOUTH

`engine/speech.mjs`

> **THE WAVEFORM DECIDES *IF* THE MOUTH IS OPEN.
> THE TEXT DECIDES *WHAT SHAPE* IT IS IN.**

Every lip-sync failure is one of these two doing the other's job.

Drive a mouth from text alone — spell the line, allocate the syllables, animate — and it flaps
through pauses, breaths, and the half-second before a sentence starts. A mouth moving in silence is
the tell, and it is why cheap lip-sync reads as a puppet rather than a speaker.

Drive it from the envelope alone and you get a hinge. Loud/quiet is one channel; it cannot tell an
*/ee/* from an */oo/*, and it never closes on an */m/*, because during a bilabial the voice
continues and only the lips stop.

So the recorded envelope gates and the spelled line shapes. And the gate is a **floor, not a mask**:

```js
jaw = max( visemeJaw · gate , FLOOR · gate ) · seal
```

If the recording is loud where the text expects a rest — which happens whenever timing drifts —
something opens anyway, on a neutral shape. Drift then costs *articulation*, which is a blur. The
other arrangement costs *closure*, which is a lie. `seal` is the bilabial term, and it multiplies
last so an */m/* closes **through** a loud vowel.

**Ten visemes, not forty phonemes.** At 12fps a frame is 83ms — about one phoneme. There is no
budget for distinctions the frame rate cannot carry, and finer shapes would only be quantised away
by the dot lattice. Grapheme rules, not a pronunciation dictionary: this *will* mis-shape "though",
and that is the right trade, because a wrong-but-plausible shape inside a correctly gated aperture
is invisible. Where it matters — the closures — spelling is completely reliable. `m`, `b` and `p`
are bilabial in every English word without exception.

---

## 3. THE HEAD

`assets/character/_face.mjs`

`figure-hero` draws a whole body and gives its head a radius of 40–75px. At the MESH pipeline's
3.4px dot pitch that is a mouth twelve dots wide and eleven tall at full gape — enough to say A
MOUTH IS OPEN, not enough to say WHICH SHAPE. So there is a second head, built for one job.

> **THE UPPER LIP BELONGS TO THE SKULL. THE LOWER LIP RIDES THE JAW.**

Almost every bad lip-sync draws the mouth as one shape growing about its own centre. Real speech is
not symmetrical — the maxilla never moves and the mandible swings about an axis through the ears.
So `jaw` here is not a mouth parameter, it is a **bone**: the chin travels, the face lengthens, the
jawline swings back, and the aperture is a *consequence* of that rotation rather than a drawing of
it. The silhouette is computed per frame as one closed path (cranium joined to rotated mandible) and
filled and contoured once — two overlapping shapes would print a seam across the cheek, and in a
world whose identity is hard contour a spurious contour is not a small error.

### the five passes, and what each one cost

The head took five passes and **four of them were misdiagnoses**, all of the same kind: I read a
symptom on the contact sheet, named the wrong organ, and fixed something that was not broken.

| pass | symptom | what I blamed | what it was |
|---|---|---|---|
| 1 | reads as a mannequin | — | baseline |
| 2 | long jaw, beret-like hair | the jaw, the hair | **the eyes were 0.2R too high.** Everything below them lengthened to compensate |
| 3 | hair reads as a hat | hair styling | the mass stopped at temple height — hair that does not pass the ears is a hat whatever shape it is |
| 4 | scalloped flaps at the jaw | the hair, again | not the hair at all |
| 5 | same scallop | — | **`jawW` was an absolute multiplier.** At 0.70 the gonion sat 0.43R inside the cheekbone across 0.32R of drop; the curve overshot into an anvil |

Pass 5 is the instructive one. The artefact appeared on Iona (0.76), The Girl (0.70) and Mara
(0.86) and *never* on Niko (0.98) — a pattern I read twice as a hairstyle problem and twice fixed in
the hair code. It was a cliff in the silhouette. The jaw is now a **proportion of the face**
(0.55–0.95 of the cheekbone) with an intermediate point to travel through, so no face can express a
taper the curve cannot round.

Every one of those five was found by **looking at a rendered image**. None was found by a test. That
is the fourth time this pattern has held in this repo and it is starting to look like a law:
a defect that produces a plausible picture will not announce itself.

---

## 4. THE CUT

`harness/build-closeups.mjs` → 90 modules · `harness/build-film-close.mjs` → `film/BUTTERFLY-CLOSE.mp4`

**The unit is a speaker RUN** — the maximal stretch of consecutive lines by one person. Not a take
(often a whole two-person exchange: one face, two voices) and not a line (cuts on every full stop,
including the ones inside a single person's speech, which is a stammer). Ninety-four runs; ninety
have a body in the room.

**The mouth track is baked into each module.** Scene modules are imported by a browser page and must
be pure functions of `u`, so reading a wav at draw time is out. Each module carries its own envelope
— quantised to two decimals at 50Hz, about 150 numbers for a three-second run — as a literal array.
Inspectable, diffable, and it cannot drift from the audio because it was sampled *from* the audio.

### the declared exception

MOTION-BRIEF's first claim is that the unit of authorship here is a **cycle**, because the text's
central images do not exist in any single frame. That argument is sound and these units break it. A
sentence is not periodic. It does not come round again. If it did it would not be a sentence.

So `motion` is **SPEAK** — a ninth motion, declared rather than smuggled, `loopClosed: false`, no
beats, and its whole content is that it runs once and stops. The film's cycles are bodies and
apparatus, which repeat. Testimony does not. In a film about a witness that cannot check its own
memory, the one thing that happens exactly once ought to be somebody saying so.

### the constraint that makes the assembly safe

> **THE SOUND IS NOT REBUILT. NOT ONE SAMPLE MOVES.**

`audio/master.wav` is reused exactly as the wide cut mixed it and every scene keeps the duration
`film/cut.json` gave it. Only the picture inside each scene changes. Drift is therefore not
arithmetic that happens to come out even — it is a quantity this program has no way to alter. A
scene of length *D* stops being one looping shot and becomes a timeline of length *D*:

```
0 ─── wide loop ─── close-up ─ close-up ─── wide loop ─── D
                   ^ Niko      ^ Mara
```

Close-ups sit at the absolute times their voices already occupy, recovered by re-running the mixer's
own rule rather than guessing it: *take k starts at Σ(durations before it) + k · TAKE_GAP*.

Consecutive shots **abut exactly** — 60 of 60 cuts, zero gaps, zero overlaps — and not by tuning.
The measured boundary sits at the *centre* of each pause, so each shot already carries half the
silence and the cut lands where a cut belongs.

### what stays wide, and why it is not laziness

Voice-over and off-screen lines get no face. A close-up asserts that a body is in the room making
this sound; for `VO`, `(V.O.)` and `(O.S.)` that assertion is false. Iona's twenty-nine-second
voice-over in BF-13 is the longest single speech in the picture and it never shows her. In a film
whose subject is testimony that cannot be corroborated, putting a face on an unverifiable voice is
the one lie it cannot afford.

---

## RUNNING IT

```bash
node harness/measure-lines.mjs                  # boundaries, + the displacement report
node harness/build-closeups.mjs                 # 90 modules + film/closeups.json
node harness/render-motion.mjs scenes/_close/*.mjs --nocard
node harness/build-film-close.mjs --plan        # read the timeline first
node harness/build-film-close.mjs               # film/BUTTERFLY-CLOSE.mp4
```

Two instruments, and they are worth running before believing any of it:

```bash
node harness/render-motion.mjs scenes/_test-visemes.mjs --contact --step 1
# do ten mouth shapes survive the lattice? (they do — REST/MM closed, AH open, OH/OO rounded)

node harness/render-motion.mjs scenes/_test-cast.mjs --contact --step 1
# can you tell five faces apart at the close framing? (this is the sheet that caught the anvil)
```
