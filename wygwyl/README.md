# WYGWYL — FOURTEEN HALFWORLDS

### *Where You Go When You Leave*, Part 2 of 3: Future — each poem remade as its own world

```bash
node harness/serve.mjs        # → http://127.0.0.1:8181/wygwyl/
```

Two doors. [`index.html`](index.html) is fourteen films you choose between — every card
on it is the real film running, not a thumbnail of one. [`suite.html`](suite.html) is one
film that happens to have fourteen parts: a single clock, a single transport, the whole
running order down the side, and no way to be in two places at once.

---

## WHAT THIS IS, AND WHAT IT IS NOT

There is already a film. The [beflix suite
player](https://hartswf0.github.io/prompt-language/WYGWYL-BK/OP-51/wygwyl-site/wygwyl-suite-player.html)
plays fourteen poems as one 24-minute reel: a 128×96 field, eight shades, one mp3, and a
recorded command stream — `PNT`, `LIN`, `CLR` — replayed at eight frames a second. It is a
*recording*, and a recording is a thing that already happened.

This is not that. Each poem here is **remade as its own halfworld** under the laws of
[I REMEMBER BEING A BUTTERFLY](../README.md): the picture is computed, the sound is
synthesised, and neither exists until you open the page. There is no video file, no audio
file, no sprite sheet and no build step — the pages import the modules and run them, and
they need nothing installed. (The two harnesses that look at the films from outside —
`shoot.mjs` and `render-film.mjs` — do need Playwright, and the film renderer needs an
ffmpeg. Nothing you *watch* does.) Fourteen films, eighty movements, nineteen minutes, and
the whole suite is a few thousand lines of arithmetic.

The trade is deliberate. A recording can be anything and remembers nothing; a world has
rules, and **the rules do the authoring**. Ask a recording for a dissolve and you get a
cross-fade. Ask this for one and it *cannot* give you a cross-fade — there is no alpha
channel to build one from — so it gives you the thing the law permits instead, and the
thing the law permits turns out to be what the poems were about.

---

## THE LAWS

### 1. The dot law

Eight ink levels, ordered halftone, cream paper. Every movement draws flat quantised
tones into a 192×144 ink field, and **one halftone pass runs over the whole field at the
end**, so a body and a wall are quantised by the same lattice. No gradients, no blur, no
alpha.

The constraint is generative rather than decorative. Because there is no alpha, a
dissolve cannot be a cross-fade — it has to be a **per-dot allegiance swap on an ordered
(Bayer) schedule**, which reads as one substance *replacing* another rather than two
briefly coexisting. Then look at what the poems actually ask for:

> *"The vape gathers, inside and out … More haze."* — 01
> *"everything I built here learns to be weather"* — 14
> *"the night that has covered me"* — 10

Every one of those is a substitution, not a blend. The constraint and the content agree,
and they agree because the constraint was chosen from the content.

### 2. Pure time

Every movement is `draw(u, F)` — a pure function of normalised time `u ∈ [0,1)` and
nothing else. No wall clock, no accumulated state, no reading frame *n−1*. Frame 400
renders identically whether or not frame 399 ever existed, which is why you can drag the
scrubber anywhere in any film and land on a correct picture instantly.

This has a consequence that turned out to be the most useful thing in the engine.
**Motion blur is not a trail that was stored.** It is the same pure function sampled two
or three more times, a little way into its own past, and drawn lighter:

```js
fx: { smear: { taps: 3, spread: 0.010, fall: 1.8 } }
```

A world with state would have to remember what it drew. A world without state can simply
*ask itself what it was doing a moment ago* — and get an exact answer.

### 3. Break every full-width horizontal span

An unbroken edge-to-edge bar stripes the frame under the halftone lattice. Floors are
drawn as two or three runs with gaps in them. The exception is a surface whose whole
meaning is that it has no gap — and taking that exception requires saying so in a
comment, which is a cheap way of making sure it is never taken by accident.

### 4. Sound no smoother than the picture

The bed is three detuned partials whose root **steps with the movements** — the harmony
is the structure of the poem, not an accompaniment to it. Foley is a struck body: a few
decaying partials for the material, a burst of shaped noise for the contact, and no
reverb tail longer than the room it rings into.

A long tail is the audio equivalent of a gradient, and this world does not have those.

**And it is in the same key as the record.** There is a real 24-minute score for this
suite — the drone piece the beflix cut played under. [`analyse-score.mjs`](analyse-score.mjs)
decodes it and measures it: folded chroma, the low-register partials, and an onset
envelope autocorrelated for a pulse. The answers:

- **Tonal centre C**, with G a close second pole. The strongest bass partial is 64.15 Hz
  (C2), and the top nine bass partials spell C D E F♯ G A B — no F natural. That is C
  Lydian and G major, which are the same seven notes read from two places.
- **No credible pulse.** Confidence 0.30 against a 0.35 threshold, no autocorrelation
  peak standing above its own decay anywhere from 20 to 240 BPM. It is sustained
  material with no metric grid, and the honest thing was to report that rather than
  quantise to an invented tempo.

So the fourteen synthesised beds were retuned onto C and G at four octaves, with one
modal palette across the suite: Phrygian and Aeolian for the films of loss, Dorian for
the ones that turn, Ionian and Lydian for the ones that lift, and 14 ending on the
tonic because it is the last film. Verified by rendering the audio back out and
measuring it, not by asserting it.

The absence of a pulse has a consequence for the picture: **the film's rhythm has to
come from the film.** There is no beat to cut to, so the beats are the movements
themselves and the foley strikes, and the picture is asked to accent where they do.

### 5. Look at the picture

Law 5 of the butterfly halfworld, inherited without changes, because it held here too:
**every serious defect produced a plausible picture.**

```bash
node wygwyl/shoot.mjs --sweep      # three frames per movement → PNG, + numbers
node wygwyl/contact-sheet.mjs      # all eighty movements on one page
```

### the instrument had to be rebuilt twice, and each rebuild found something

The shooter started by reporting **ink coverage**, because 0% and 96% are bugs a contact
sheet can hide but a number cannot. That was wrong twice over, and both errors were
instructive.

**First: coverage cannot tell a haze from a blackout.** A field entirely at level 1 is a
light mist and reports as 100% covered. The end of 01's MORE HAZE — the room finally,
completely taken — was flagged as a blackout on every single run. Carrying the **mean ink
level** alongside coverage separated them: the haze reads 97%/1.5, an actual blackout
reads 87%/6.1.

**Then: coverage cannot see a subject drawn in reserve.** 14's *"All black again. But no
walls this time"* is a figure cut out of the ink — paper as the subject, on a horizon with
no verticals anywhere. 99% covered, mean level 6.8, and the rule called it dead. It is the
best frame in the film.

So the flag now counts **edges**: cells whose level differs from a neighbour by three or
more. That measures whether anything is *drawn*, and it does not care which side of the
contrast the subject is on. Coverage and mean level are still printed, because they say
useful things about a frame; they no longer get a vote. On its first run the new rule
found something neither predecessor could: the end of 14's opening movement has **zero**
edges — everything the suite built has finished learning to be weather, which is exactly
what the line says, and which read as static rather than as a place that is gone.

### and the numbers still only catch the extremes

Every one of these had perfectly ordinary coverage:

- **The fall in 01 was a smear on wallpaper.** The city streaking upward past the falling
  bodies was drawn at full ink across the whole frame, so the two people the scene is
  about had nowhere to be legible. Held the towers at levels 2–4 and pushed them to the
  edges. The number said 14%; the picture said nothing.
- **The tambourine in 03 shattered inward.** Each shard was rebased to the centre before
  being moved outward, so all eleven flew into a single pile.
- **The pupil in 02 opened onto nothing.** The road's vanishing point is the one part of a
  road with no width, so for the first seconds of *"my eyes dilate — and we go through"*
  the aperture contained no picture at all. A single sample per movement never saw it;
  `--sweep` did.
- **A walk cycle sampled at a degenerate phase reads as a flagpole.** Two films hit this
  independently. `F.fig`'s gait sends both feet to the same offset twice per stride, and
  if your phase rate is an integer multiple the QA sample lands exactly there — a person
  collapses into one vertical stroke. The fix is a non-integer phase rate, and the lesson
  is that a frame can be a correct render of a wrong instant.
- **Figures vanished into the floor they were standing on.** 08's dance floor lit its
  brightest tiles at level 5 and its dancers at 4, and `F.ink` keeps the darker value — so
  bodies crossing a lit square were absorbed by it.
- **The subtitle covered the bottom sixth of every film**, because it was drawn over the
  canvas. It has its own strip now. No instrument would ever have flagged that one.

The pattern from the butterfly build held without a single exception: **every serious
defect produced a plausible picture.**

---

## THE BODY

The first pass drew people as stick figures — single-cell lines from a hip to a shoulder
to a head-disc. They read as people, which is why they survived fourteen films. But they
cannot **act**: a line has no mass, so it cannot take weight on one leg; no width, so it
cannot turn; no volume, so nothing can be occluded by it and a body can never be in front
of its own arm.

[`figure.mjs`](figure.mjs) replaces it, and keeps the same call — `F.fig(x, y, h, pose, l)`
with `x,y` at the feet — so all fourteen films improved without one of them being edited.

**Volume.** Every limb is a tapered capsule: a run of discs whose radius interpolates from
proximal to distal, so a thigh is thicker than a shin. The torso is a real quadrilateral
from shoulders to hips.

**Contour then fill, with the dot law intact.** Each part goes down twice — the whole shape
at the contour level with `ink` (which only darkens, so it never erases the world behind
it), then the shape inset by a cell at the fill level with `put` (which overwrites, but
only inside ground the contour pass just claimed). Hard black edge, flat mid tone, no
gradient anywhere.

**Drawing order is occlusion**, and this is the one that matters. Because the fill pass
overwrites, a part drawn later hides one drawn earlier — so parts are emitted far arm, far
leg, torso, near leg, near arm, head, and a body is suddenly in front of itself. That is
what makes a reach read as a reach instead of as a line crossing a line, and it costs
nothing but the order of six calls.

Two things the lattice forced that the anatomy book does not say. **Widths had to go up**:
an arm at the correct 0.031 of height is under three cells across at h=44 and the halftone
eats it. And **a small body must be a stockier body** — width scales with height, but
legibility is set by the lattice, which does not get finer when the figure does. Widths are
multiplied back up as height falls: identity at 40 cells, half again as wide by 16. Below
16 a different drawing takes over with the same silhouette, because crowds get staged at
h=9 and they have to stay people.

The performance controls — `weight`, `breath`, `crouch`, `headTurn`, `headTilt`, `gesture`
— are in [`WORLD-BRIEF.md`](WORLD-BRIEF.md). `weight` is the one that matters most: which
leg the body is standing on, and therefore whether it is a person or a diagram of one.

---

## THE TITLE SEQUENCE

John Whitney's work is **harmonic motion**, not animation of shapes: a field of N identical
elements where element *k* is driven at *k* times a base rate. Let it run and the field
passes through order, apparent chaos, and order again, and every rosette, cardioid and
caustic is a by-product of that one differential. Nothing is keyframed.

Which gives the title its mechanism: **the title is not typed on, it is resolved into.**
Points fly in a Whitney field; at a resonant instant they arrive at the positions that spell
the words, hold, and dissolve back into a field that never stopped moving.

Three options, three different formal devices — a rosette, a nested counter-rotating
arabesque, and a live catalogue of Lissajous cells. See [`titles.html`](titles.html).

---

## THE FOOTAGE

There is live-action for the first poem: a poet in a dim room, a rain-wet street in fog,
streetlights in green and cyan. Compositing it over the halftone would be a lie about the
world, so instead it **enters the law** — sampled down to the 192×144 ink field, quantised
to eight levels, and halftoned by the same pass that draws everything else. Once it is in
the lattice, footage and drawing are the same substance, and a transition between them is
what every other transition here is: a per-dot allegiance swap.

- [`ingest.mjs`](ingest.mjs) — video to ink. Tone, levels, channel (this clip is green-cyan,
  so a chroma read gives a completely different image from a luma read), dither, Sobel edge,
  kaleido, warp.
- [`blend.mjs`](blend.mjs) — the transitions, all per-dot: straight swap, directional wipe,
  by-level (dark dots change allegiance first, so one image is eaten out of the other),
  noise-torn, and **figureLock** — footage everywhere except where the drawing has ink, so a
  drawn body moves through a filmed room.
- [`dj.html`](dj.html) — the instrument. Every treatment on a fader, both sources running,
  eight cue slots, and an export that dumps a look as JSON to paste into a film module.
- [`EXPERIMENTS.md`](EXPERIMENTS.md) — the looks that worked, with their settings, and the
  dead ends.

---

## THE SHAPE OF A WORLD

```js
export default {
  n: "07", slug: "07-dj-turn-me-up", title: "DJ TURN ME UP",
  seed: 707, accent: "#5aa7ff",
  drone: { base: 55, steps: [0, 3, 7, 5] },
  movements: [{
    label: "TURN ME UP", seconds: 13,
    line: "DJ, turn me up, please. Eyes wide shut, chin nested…",   // the poem, verbatim
    fx: { smear: {…} },                                             // optional
    cues: [{ at: 0.28, f: 420, partials: [1, 2.7, 5.3], noise: 0.7 }],
    draw(u, F) { … },
  }],
};
```

**One movement per line of the poem.** Not per stanza, not per image — per line, because
the line is the unit the poet wrote in and the voiceover is the film's clock. Fourteen
poems came in at 4 to 7 movements each, which is the poem's shape and not a template's.

The title card is prepended by the engine, and it carves itself white out of full black
on the same Bayer schedule everything else dissolves on.

Full API and house style: [`WORLD-BRIEF.md`](WORLD-BRIEF.md).

---

## THE FILMS

<!-- FILMS:BEGIN — generated by build-shells.mjs, do not edit by hand -->
| | | | mv | |
|---|---|---|---|---|
| **01** | [OUT OF LIFE](01-out-of-life.html) | the maze, the haze, the fall, the ember | 4 | 58s |
| **02** | [FLASHING LIGHTS](02-flashing-lights.html) | the scream that travels inward | 6 | 83s |
| **03** | [HOW TO BREAK OFF AN ENGAGEMENT](03-how-to-break-off-an-engagement.html) | the storm takes everything that was ever called goods | 6 | 84s |
| **04** | [NEVERMORE](04-nevermore.html) | a trail followed twice, a vow made twice | 6 | 85s |
| **05** | [BLOODLINES](05-bloodlines.html) | he names the stars after the people who made him | 5 | 75s |
| **06** | [RESURRECTING ATLANTIS](06-resurrecting-atlantis.html) | a city comes up out of the water | 6 | 87s |
| **07** | [DJ TURN ME UP](07-dj-turn-me-up.html) | amplitude, and eleven petals | 7 | 100s |
| **08** | [NEWLY SINGLE](08-newly-single.html) | a soul leaves a body on a dance floor | 7 | 99s |
| **09** | [YET, HEARD](09-yet-heard.html) | three calls before leaving | 4 | 74s |
| **10** | [MAGIC RIDE](10-magic-ride.html) | night replaced by morning, dot by dot | 6 | 85s |
| **11** | [NEW DAY](11-new-day.html) | the temple assembles, one course at a time | 6 | 85s |
| **12** | [REUNION](12-reunion.html) | less time for words, more space for laughter | 5 | 67s |
| **13** | [HOW TO WIN MY HEART](13-how-to-win-my-heart.html) | orbits, close and counted | 6 | 85s |
| **14** | [HOT MINUTE](14-hot-minute.html) | everything learns to be weather, then a door | 6 | 91s |
| | **14 films** | | **80** | **19m 18s** |
<!-- FILMS:END -->

The suite is a sequence and it behaves like one. The tambourine thrown through a window
in **02** arrives through a rose window in **03**, still whole, and leaves in pieces; the
shore those pieces wash up on is where **04** opens. **14** is the payoff for having
watched the other thirteen: *"A life flashes the way a reel does: the window, the
tambourine, the field, the stars, the candle, the daisy, the ride, the temple, the
hourglass"* — nine motifs, one from each of nine earlier films, in the order the poem
names them.

---

## KEYS

`space` play · `←` `→` movement · `F` cinema · `S` sound · double-click for cinema.

Sound is off until you ask for it, because a page that makes noise on load is a page
nobody trusts. Press **SOUND** in any film.

---

## THE FILM IS AN OUTPUT, NOT A FILE

```bash
node wygwyl/render-film.mjs             # the whole suite  → film/WYGWYL.mp4
node wygwyl/render-film.mjs 07          # one film
node wygwyl/render-film.mjs --silent    # picture only
```

The pages are the work. This exists for people who do not have a browser open, and it is
built from the same modules the pages run — frames come out of the page itself, through
the same engine, the same halftone pass and the same canvas a viewer sees, with the chrome
hidden because a film that carries its own transport controls is a screen recording.

The score is the one place with two implementations, and it is worth saying why that is
allowed. The browser plays it through WebAudio; the renderer writes it as samples. What is
shared is the part that matters — `drone` and `cues` in the world modules **are** the
score, neither realisation invents a note, and a world module stays the only place a sound
can be changed. Only the plumbing differs.

Frames are piped into ffmpeg rather than written out. Fourteen films at 12fps is about
14,000 PNGs, and staging 700MB of them on disk to hand straight to an encoder is work
nobody asked for; the pipe also runs the encode while Chromium is still rendering.

---

## RUNNING AND EXTENDING

```bash
node harness/serve.mjs 8181       # the static server (ES modules need http://)
node wygwyl/build-shells.mjs      # one thin shell per world module
node wygwyl/shoot.mjs             # every world, every movement, to PNG
node wygwyl/shoot.mjs 07 11       # only these
```

A shell is a `mount()` call and nothing else. Every law lives in `halfworld.mjs` and
every choice lives in `worlds/NN-slug.mjs`, so there is never a second place to fix a
bug. Add a module, re-run `build-shells.mjs`, and it appears in the suite index —
the index imports the worlds themselves and runs each card as a live film, not a
thumbnail of one.
