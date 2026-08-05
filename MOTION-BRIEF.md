# I REMEMBER BEING A BUTTERFLY — the motion brief

**This world animates. Read this before BUILD-BRIEF.**

The sibling world, ABIDING ACRES, is a photo-roman: still halftone frames, held. That was correct
there — 44% of it holds in silence and it is about a street being watched. **It would be wrong here.**

This text's central images do not exist in any single frame:

> *"The mark existed only when the wings were closed together."*
> *"The line gathered over itself, loop after loop, until a figure appeared."*
> *"a synchronized line passing across the wall from left to right"*

A difference-between-states, an accumulation, and a wavefront. **None of them is a picture.** If you
render this world as stills you will have deleted its subject — which is, precisely, the thing the
laboratory does when it deletes the path visualization and keeps the arm choice.

---

## THE CONSTRAINT THAT DECIDES EVERYTHING

The dot law forbids gradients and blur, so **you cannot cross-fade and you cannot motion-blur.** The
two cheapest tools in animation are gone.

Every transition must be **dots switching allegiance, one at a time, on an ordered schedule.**

This is not a limitation to work around. It is what the text describes. Scales do not fade from one
surface to another; they move, individually, and they *brighten* rather than dim. `dissolve()` in
`engine/motion.mjs` is a Bayer-ordered per-dot swap, and it reads as a substance transferring rather
than an image fading. **The constraint and the content agree — do not fight it.**

---

## THE EIGHT MOTIONS

Every scene declares one, in `atlas/source.json` and in its file header. Every one is a pure function
of normalised `u ∈ [0,1)` — **no wall clock, no accumulated state** — so frame *n* is reproducible on
any machine and renders identically every time.

| motion | from the text | what it is |
|---|---|---|
| **CYCLE** | *"Impact. Drop. A tilt of black-veined wings. Recovery. Impact."* | a seamless loop; the last frame's successor is frame 0 |
| **TRACE** | *"gathered over itself, loop after loop, until a figure appeared"* | accumulation; the figure is invisible in every instant |
| **SWEEP** | *"a synchronized line passing across the wall from left to right"* | a wavefront crossing elements in order |
| **TRANSFER** | scales: butterfly → glove → skin → tape → film → beam | discrete carriers crossing between surfaces |
| **ADVANCE** | *"She advanced the strip between her fingers."* | quantised frames past a gate, with dwell |
| **DISSOLVE** | *"Therefore the film changed."* | per-dot allegiance swap — **never a cross-fade** |
| **HOLD** | *"both hands inside the sleeves, although there was nothing left for her hands to do"* | stillness that breathes; never a frozen frame |
| **BREAK** | *"The lid opened."* · *"Summer entered."* | the **only** discontinuity permitted, and it must be declared |

### The one number that carries the theme

`cycle(u, { closed })`.

- **`closed: true`** returns exactly to its first state. That is a **trap** — the loop of questions
  where every answer is yes (BF-11), the tapping at equal intervals (BF-14, BF-21).
- **`closed: false`** drifts by `drift` per revolution: the same act, but the body is being worn down
  by it. **Never animate a living thing as a closed cycle.** The swallowtail striking the ceiling is
  open — it is dying of this — and the difference between those two calls is the difference between
  the machine and the animal.

Three units are authored `loop: true`. Every one is an apparatus, not a body. Check yours.

---

## HOW TO AUTHOR A SCENE

```js
import { cycle, trace, brokenCircle, hold } from "../engine/motion.mjs";

export const motion = "CYCLE";
export const seconds = 4.0;
export const loopClosed = false;      // it is alive
export const frames = 48;             // divides evenly into 4 beats

export function at(u, ctx) {
  const c = cycle(u, { beats: 4, closed: false, drift: 0.18 });
  // c.beat  0=rise 1=impact 2=drop 3=recover
  // c.strike  eased position within the beat
  // c.wear    accumulated cost of doing this
  return { /* the state your draw() consumes */ };
}
```

Rules:

1. **`at(u)` is pure.** No `Date.now()`, no module-level mutation, no reading the previous frame. If
   frame 30 cannot be rendered without rendering frame 29 first, it is authored wrong.
2. **A CYCLE must close seamlessly.** Render frame `n-1` and frame `0` and compare them. A visible
   step at the wrap destroys the sense of a body that cannot stop.
3. **HOLD is not a freeze.** A frozen frame reads as a crash. Use `hold()`; the breath is 4.1s and
   should be deniable — a viewer should not be able to say for certain that anything moved.
4. **Declare your BREAK.** One instant, stated in the header. An undeclared discontinuity is a bug.
5. **The broken circle is authored once**, in `brokenCircle()`. The flight path, the pen mark on the
   photograph, the scar at the base of Iona's thumb, the wing marking, and the new paint on the
   plywood are **provably the same shape**. Do not redraw it. Import it. If they differ, the world is
   lying about its own central claim.

---

## RENDERING

```bash
node harness/render-motion.mjs scenes/BF-01.mjs      # frame sequence → webm + gif
node harness/render-motion.mjs --all
```

Frames are rendered at 12fps. That is deliberate: 12 is slow enough that each frame is a *drawing*
rather than a sample of continuous motion, which is the right register for a world made of ink dots
on paper, and it matches the projector in the text.

**Judge the loop, not the frame.** The render loop for this world is:

> write → render the sequence → **watch the loop** → revise

A frame that reads well and a loop that reads well are different achievements. Log both in the ledger:
`saw` describes **the motion you watched**, not the still you paused on.

---

## WHAT THE TEXT WILL PUNISH YOU FOR

- **Rendering the mark as a picture.** It is the difference between two wing states. If it is legible
  in one frame, you have drawn the wrong thing.
- **Cross-fading anything.** There is no alpha in this world. Use `dissolve()`.
- **Closing a living cycle.** See above; it inverts the meaning.
- **Smoothing the tapping.** *"Not wildly. It moves around the circumference, testing the glass at
  equal intervals."* Equal intervals. Quantise it; do not ease it.
- **Letting the scales fade.** They **brighten** when rubbed. `transfer()` peaks their ink at the
  midpoint of the crossing. Anything that dims is wrong.
- **Animating the chrysalis wall as a haze.** *"Each seam split at once"* — narrow `width`, a zip in
  sequence, not weather.
- **Making the empty chrysalides move like they contain something.** They are empty. *"something
  passes through the husks without occupying them, a distortion like wind crossing tall grass."* The
  motion is in the field, not in the objects.

---

## THE NINTH MOTION: SPEAK

Everything above says the unit of authorship here is a **cycle**, because the text's central images
do not exist in any single frame. That argument is sound, and one class of unit breaks it.

A sentence is not periodic. It does not come round again. If it did it would not be a sentence.

`scenes/_close/CU-*.mjs` — ninety generated close-ups, one per speaker run — therefore declare
`motion = "SPEAK"`, `loopClosed: false`, `beats: null`, and their whole content is that they run once
and stop. Declared, not smuggled. The film's cycles are bodies and apparatus, which repeat; testimony
does not. In a film about a witness that cannot verify its own memory, the one thing that happens
exactly once ought to be somebody saying so.

The jaw in those units is driven by the **recorded waveform**, not by a wave function of `u` —
the envelope is baked into each module as a literal array so `at(u)` stays pure. See
[CLOSE-UP.md](CLOSE-UP.md) for the whole system, including the five passes the head took and the
four things I misdiagnosed on the way.

**The rule that carries over unchanged:** judge the loop, not the frame. Every defect in this
build — the eyes half a head too high, the hair that read as a beret, the anvil jaw, the drift at
assembly — was found by looking at a rendered image. Not one was found by a test.
