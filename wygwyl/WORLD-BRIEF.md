# WRITING A WYGWYL WORLD

One poem, one world module, one file: `wygwyl/worlds/<NN>-<slug>.mjs`.
Read `wygwyl/worlds/01-out-of-life.mjs` and `02-flashing-lights.mjs` first — they
are the house style, and the style is the point.

---

## THE LAWS (these are not suggestions)

**1. The dot law.** You draw into a 192×144 field of *ink levels*, 0 (paper) to 7
(full ink). Level 8 is the world's single accent colour, used for at most one
thing per film. One halftone pass runs over the whole field at the end, so a face
and a wall are quantised by the same lattice. **No gradients, no blur, no alpha.**
A "fade" is therefore never a cross-fade — it is a per-dot allegiance swap on the
Bayer schedule (`F.bayer(x,y) < amount`), which reads as one substance
*replacing* another rather than two briefly coexisting.

**2. Pure time.** `draw(u, F)` is a pure function of normalised `u ∈ [0,1)`. No
`Date.now()`, no `Math.random()`, no state kept between frames, no reading the
previous frame. Frame *n* must render identically whether or not frame *n−1* ever
existed. For randomness use `F.noise(x,y)`, `F.n2`, `F.fbm`, or `F.rng(k)` — all
seeded and deterministic. **This is enforced by review; a module that keeps state
will be rejected.**

**3. Break every full-width horizontal span.** An unbroken edge-to-edge bar
stripes the frame under the halftone. Draw a floor as two or three runs with gaps.
The only permitted exception is a surface whose *whole meaning* is that it has no
gap in it — and if you take that exception, say so in a comment.

**4. Nothing is decoration.** Every movement is one line of the poem and every
element on screen is in that line. If the line does not say it, do not draw it.
Conversely: find the image the line actually contains and build the mechanism for
it, do not illustrate the mood. "The gap between us breathes, and never closes" is
a number that oscillates and never reaches zero — that is the scene.

**5. Look at the picture.** Your work is not done when the file parses. Run the
shooter, open the PNGs, and *look*. Every serious defect produces a plausible
picture.

---

## THE FIELD KIT — `F`

```
F.W, F.H              192, 144
F.clear(l)            fill the field
F.put(x,y,l)          set (overwrite)
F.ink(x,y,l)          set only if darker than what's there  ← the usual one
F.rect(x,y,w,h,l)     filled
F.box(x,y,w,h,l,th)   outline
F.line(x0,y0,x1,y1,l,th)
F.disc(cx,cy,r,l)
F.ring(cx,cy,r,l,th)
F.arc(cx,cy,r,a0,a1,l,th)
F.word(text,cx,cy,pixelHeight,l,set)   rasterised mono, cached. ph ≥ 6 to be legible.
F.wordW(text,ph)                        measure it first if you need to lay out
F.fig(x,y,h,pose,l)   A BODY. x,y is the FEET. h is total height. See figure.mjs.
                      Volumetric: tapered limbs, a real torso, contour plus fill,
                      and parts emitted back-to-front so a body occludes itself.
                      Keep |rot| under ~1.6 rad or it stops reading as a person.
F.noise(x,y)          deterministic 0..1
F.n2(x,y)             smooth value noise
F.fbm(x,y,octaves)    0..1
F.rng(k)              seeded generator, call it for a stream
F.bayer(x,y)          0..1 — the ordered schedule. USE THIS FOR EVERY DISSOLVE.
F.map((x,y,v) => newValue | undefined)   rewrite the whole field
```

Helpers imported from `../halfworld.mjs`:
`TAU, lerp, clamp01, smooth, ss(a,b,x), win(u,a,b,c,d)`
— `ss` is a smoothstep between two edges, `win` is a rise-and-fall window.

---

## THE POSE — WHAT A BODY CAN DO

```
mode      'stand' | 'walk' | 'sit' | 'fall'
phase     the gait/breath clock. NEVER an integer multiple of u — see below.
face      1 | -1        which way the body is turned
arms      'down' | 'open' | 'up' | 'reach' | 'hold' | 'swing'
lean      shear, small; a body pushing into or away from something
rot       whole-body rotation about the hip, in radians. |rot| < ~1.6.
```

and the performance controls, which are what separate a body from a diagram:

```
weight    0..1   WHICH LEG THE BODY IS STANDING ON. 0.5 is even and dead;
                 0.15 or 0.85 is contrapposto — the free hip drops, the
                 shoulders counter-tilt. One number, and most of the
                 difference between a person standing and a drawing of one.
breath    0..1   scales the idle rise and fall. Under 1% of frame, deniable,
                 and it is what keeps a held figure alive. Default 1.
                 Set 0 for a body that is not breathing — the dead, a statue,
                 a ghost — and that reads, because everything else breathes.
crouch    0..1   sinks hips and shoulders. Grief, cold, bracing, listening.
headTurn  -1..1  the head leads the body. A figure that looks before it walks
                 reads as intending; one that does not reads as dragged.
headTilt  -1..1  the jaw swings with it. Tilt down is shame or reading;
                 tilt up is looking at a moon.
gesture   [x,y]  put the near hand HERE, in body-local coordinates (origin at
                 the feet, +y up). The elbow solves itself. Use this to make
                 a hand touch a thing that exists in the scene rather than
                 miming near it.
```

**Phase must not be an integer multiple of `u`.** The gait sends both feet to
the same offset twice per stride; if your rate is `u*6` the QA sample at u=0.5
lands exactly there and the body collapses into one vertical stroke. Two films
hit this independently. Use `u*6.35`, not `u*6`.

**A held figure still needs a clock.** `phase` drives breath as well as gait, so
a standing body given `phase: 0` is holding its breath for the whole movement.
Pass `phase: u * 1.7` even when nobody is walking.

---

## THE MODULE SHAPE

```js
export default {
  n: "07", slug: "07-dj-turn-me-up", title: "DJ TURN ME UP",
  tagline: "eight words, lower case, what this world is",
  accent: "#5aa7ff",          // keep this; the suite has one accent
  seed: 707,                  // NN*101 or similar, must be unique
  drone: { base: 55, steps: [0, 3, 7, 5], bright: false },
      // base Hz of the bed; steps are semitone offsets, one per movement
      // (index 0 is the title card). Low + minor for grief, higher + bright
      // for the ones that lift.
  movements: [ /* ONE PER VOICEOVER LINE, in order */ {
    label: "SHORT CAPS LABEL", seconds: 12,      // 12–15
    line: "the poem line, verbatim, exactly as given",
    fx: { /* optional, see below */ },
    cues: [ { at: 0.28, f: 420, decay: 0.1, gain: 0.5,
              partials: [1, 2.7, 5.3], noise: 0.7, nDecay: 0.02, seed: 71 } ],
    draw(u, F) { ... },
  } ],
};
```

A title card is prepended automatically. Do not write one.

### fx — use them because the line asks for them, never as garnish

```
fx.smear  {taps, spread, fall}   extra SAMPLES of your own draw() at u-k*spread,
                                 each k*fall levels lighter. Motion blur without
                                 alpha. Costs a full redraw per tap — max 3.
fx.kaleido 'x' | 'y' | 'quad'    mirror the field. 'x' for a real mirror,
                                 'quad' for a rose window / a kaleidoscope.
fx.invert (u) => 0..1            dot-schedule inversion. A strobe is
                                 `u => Math.sin(u*TAU*9) > .72 ? .85 : 0`.
fx.shake  (u) => amplitude       whole-field offset in cells. Under ~3.
```

### cues — foley, synthesised, no samples

A cue is a struck body: `f` is its pitch, `partials` its material (integer-ish =
metal/bell, inharmonic = wood/glass), `decay` its size, `noise` the contact
transient. Tail must never be longer than the room. 1–3 cues per movement, on
the beat the line actually names. `at` is a `u` value.

---

## HOUSE STYLE FOR THE COMMENTS

The header comment says what the world's *grammar* is in three or four lines —
the one formal idea that the poem gave you. Inline comments explain the choices a
reader would otherwise assume were arbitrary, and **record what you rejected**:

```js
/* THE CITY STREAKS UPWARD. It is held at levels 2–4 and pushed to the edges,
   because the two bodies are the subject and a body at 7 has to have somewhere
   to be legible. The first pass gave the towers the whole frame at full ink and
   the fall became a smear on wallpaper. */
```

Never write a comment that says what the next line does.

---

## HOW TO CHECK YOUR WORK

```bash
node harness/serve.mjs 8181 &          # probably already running
node wygwyl/build-shells.mjs           # after adding your file
node wygwyl/shoot.mjs 07               # your number only
```

It prints ink coverage per movement and writes `renders/wygwyl/07-mNN.png`.
**Then read those PNGs with the Read tool and look at them.** Coverage under 2%
is an empty frame; over 93% is a solid one; both are usually bugs. But the
numbers only catch the extremes — the middle is your eye's job. Fix and re-shoot
until every frame is a picture you would put in the film.

---

## KEEP THE FRAME UNDER BUDGET

A field is 27,648 cells and the film wants 16.6 ms. Two things blow that:

- **`F.map` with expensive noise inside it.** `F.fbm(x, y, 3)` per cell is twelve
  value-noise lookups times 27,648. Two octaves is usually indistinguishable and
  costs a third less. Prefer `F.n2` over `F.fbm` when you only need softness.
- **`fx.smear` multiplies everything.** Each tap is a *full redraw* of your
  movement. A 6 ms draw with three taps is 24 ms and drops frames. If your draw
  already ends in a per-cell `F.map`, you get at most one tap.

Measure rather than guess: `renderField` is on `window.__hw.runtime`, so in the
page console `performance.now()` around `__hw.runtime.renderField(t)` tells you
the truth for the timestamp you are actually worried about.

**Measure the frame twice.** `F.word` rasterises a glyph run the first time it
sees one and caches it forever after, so the first render of a movement full of
words pays for all of them at once and every render after it pays nothing. A
movement that measured 49 ms cold measured 5.3 ms warm; only the warm number is
the film's frame rate. Sample each movement once to fill the cache, then again
to read the cost.
