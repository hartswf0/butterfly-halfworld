# ICARO FLOW / FLOW-SP — theory of the program, and a reality check

Two pages pulled verbatim from `hartswf0/abc-flix` @ `55571ff` and studied here.
`icaro-flow.html` (5140 lines) and `icaro-flow-sp.html` (4926 lines) share **167
functions**. SP adds **twelve** and removes one. They are not two programs; they are
one program and its hypothesis.

Everything numeric below was measured by running these pages headless against real
OUT OF LIFE frames, not read off the source.

---

## 1 · THEORY OF THE PROGRAM

### The invariant both pages hold

A film is **a stack of 128×96 grids of 3-bit ink**. Not pixels, not footage — a
quantised field with 12,288 cells and 8 legal values per cell. Everything else in
both programs is a way of getting into that representation, moving inside it, or
getting back out.

That is the same law as our own halfworld (192×144, 8 levels, one halftone pass).
These two projects arrived at the same constraint independently, which is the first
thing worth saying about them.

### The three-layer frame

    frame = { src, scriptLayer, handLayer }

`src` is a fitted 640×480 canvas of the original image. `scriptLayer` is what the
machine wrote — the quantiser's output, or a macro's output, painted as 5×5 dot
stamps. `handLayer` is what a person drew. They composite in that order, and the
separation is load-bearing: it is what lets a person draw *on* an analysis without
destroying it, and it is why `applyBeflixProcess` can be re-run non-destructively.

**This is the single best idea in either file.** Our own engine has no equivalent —
`renderField()` returns one composited array and a hand mark would have nowhere to
live.

### The quantiser is a choice of world, not a filter

`applyBeflixProcess` offers five modes and they are not five looks, they are five
different claims about what a frame *is*:

| mode | claim |
|---|---|
| `raw` | there is no grid; keep the photograph |
| `threshold` | a frame is a binary figure/ground decision |
| `edge` | a frame is its Sobel discontinuities |
| `posterize` | a frame is 8 nearest-ink samples |
| `halftone` | a frame is 8 inks on a 4×4 Bayer schedule |

Section 2 shows that this menu is not cosmetic. **The mode you pick decides whether
the rest of the program works at all**, and nothing in either page says so.

### FLOW: the film as a moving fluid

`icaro-flow.html` reads a stack of grids as a **velocity field**. `computeKinematics`
does 9×9 block matching on every other cell, penalised by displacement, and returns
per-cell `{dx, dy, mag, angle, accel}` plus a scalar `heat` = summed absolute
inter-frame difference. HEAT / FLOW / BURN visualise it. `predictNextFrame` and
`dreamForward` extrapolate it.

Theory: **a film is a fluid and the next frame is where the fluid is going.**

### FLOW-SP: the film as a program that wrote itself

SP keeps all of that and adds a second, incompatible theory on top. `decompileToTokens`
run-length-encodes a grid into BEFLIX commands (`CLR`, `PNT x y w h ink`), merges
vertically adjacent runs, and returns a token list. `matchTokens` pairs tokens between
consecutive frames by overlap × ink-similarity ÷ centroid distance. `_predictSingleFrameInternal`
extrapolates each matched token by its own velocity **and acceleration** — second-order
motion, per object rather than per cell. `computeWaveField` builds potential / velocity /
acceleration fields; `inferFieldSources` tests them against radial, linear, and
divergent hypotheses; `synthesizeInceptionCode` emits the BEFLIX macro that would
reproduce the observed motion.

Theory: **a film is the output of a program, and analysis is decompilation.**
`exportKinematicTensor` writes all three tensors — pixel, code, delta — as one JSON.

That is a real and unusual idea. It is also the part that does not work yet, and the
reason is measurable.

---

## 2 · REALITY CHECK

### What is real

**The heat metric beats the industry-standard cut detector on this material.** This is
the finding. Measured at the source's own 24fps across the known hard cut at 11.58s in
OUT OF LIFE:

| detector | signal at the cut | verdict |
|---|---|---|
| ffmpeg `select='gt(scene,…)'` | score **0.098** | below any usable threshold — missed |
| ICARO heat, halftone | **9× median**, peak within **1 frame** | found |
| ICARO heat, threshold | **24× median**, peak within **1 frame** | found |

ffmpeg compares full-range luma histograms; two dark teal shots look nearly identical
to it. Quantising to 8 ink levels *first* discards the tonal similarity that was hiding
the structural change. **The constraint is the instrument.** The 8-level palette looks
like a retro aesthetic limit and is in fact a better shot-boundary detector than the
metric everyone uses, on exactly the kind of footage that defeats that metric.

**Second-order token prediction is the right shape.** Per-object velocity *and*
acceleration, extrapolated per token rather than per pixel, is a genuinely better model
of animation than optical flow. On drawn material it should work.

**The three-layer frame** is a better data structure than ours.

### What is bullshit

**"Compression" is not compression on the mode you will actually use.** `decompileToTokens`
reports `tokens.length / (128 × 96)` as a compression ratio. Measured over 40 real
frames:

| mode | tokens/frame | % of raw | decompile ms/frame |
|---|---|---|---|
| threshold | 280 | **2.3%** | 2 |
| edge | 707 | 5.8% | 4 |
| posterize | 1157 | 9.4% | 13 |
| **halftone** | **6322** | **51.4%** | **297** |

Halftone produces **22× more tokens and runs 150× slower** than threshold. A Bayer
dither is *designed* to alternate every cell, so run-length encoding — which needs runs
— is defeated by the exact quantiser that makes footage look like BEFLIX. At 51.4% of
raw there is no code left, only 6,000 one-cell rectangles with a `PNT` in front of each.
Every downstream claim in SP — code tensor, token-delta prediction, inception rules —
inherits that. **The architecture works on drawn material and collapses on photographic
material, and nothing in the program admits it.**

**The memory gauge lies by exactly 3×.** `updateMemGauge` counts `frames × W × H × 4`.
A frame holds `scriptLayer` *and* `handLayer` (1.23 MB each) *and* a fitted `src`
canvas. Measured at 40 frames: the gauge said **47 MB**; the page was holding **141 MB**.
The "1 GB" ceiling on the bar is really about 340 MB of headroom, and the bar will read
one third full when the tab is about to die.

**`inferFieldSources` fires on noise.** Run against the CRT-monitor shot — a static
frame of a television — it returned `radial(0.66)`. The acceptance test is `bestRadial > 0.5`
over 5 hand-placed candidate centres. With velocities that are mostly quantisation
churn, a coin-flip alignment clears 0.5 routinely. `synthesizeInceptionCode` will then
happily emit a "RADIAL WAVE from (64, 48)" rule for footage containing no wave.

**"INCEPTION" emits comments, not code.** Look at what `synthesizeInceptionCode`
actually returns: `C for t = 0..N:` and `C   LIN cx-r cy r*2 r*2 7`. Those lines begin
with the comment token. It is pseudocode about a program, printed in the costume of the
program. Nothing executes it. The feature is a label on an intention.

### What will not work

**You cannot put OUT OF LIFE through either page.** Three independent walls:

1. `MAX_CLIP_FRAMES = 12 * BASE_FPS` — **12 seconds per ingest**. The clip is 88.38s.
   Eight ingests minimum, and the cap is not exposed in the UI.
2. At 12fps × 88.38s = 1,060 frames × ~3.5 MB measured = **3.7 GB**. The tab dies
   somewhere north of 300 frames. The full suite film (24:58) is not worth computing.
3. Halftone decompile at **297 ms/frame** × 1,060 frames = **5.3 minutes** of blocking
   main-thread work for one pass, with no worker and no yield.

**The prediction cannot invent.** `_predictSingleFrameInternal` carries unmatched tokens
forward unchanged and extrapolates matched ones. Nothing enters that was not already
there. `DREAM (12F)` therefore does not dream — it coasts, and it degrades, because each
predicted frame becomes the input to the next and quantisation error compounds. On live
action this will smear to mud within a dozen frames. That is not a bug to fix; it is
what the algorithm is.

**Two theories in one file, neither told about the other.** `computeKinematics` (per-cell
block matching) and `matchTokens` (per-object overlap) both estimate motion, disagree,
and never reconcile. FLOW draws its arrows from one; PREDICT builds its frames from the
other. SP is a program with two minds about what a film is, and the file does not
choose. That is the honest reason it feels like it almost works.

---

## 3 · THE DECEPTIVE STEPPING STONE

**The dumbest function in either file is the one that works.**

`heat` is a triple-nested loop summing `|a − b|` over every other cell. No block
matching, no tokens, no field inference, no tensor. It is the part a reviewer would cut
first as unsophisticated. It is also the only measurement in either program that
outperforms a professional tool on real footage — and it does so **because** of the
8-level constraint the whole project treats as an aesthetic, not as an instrument.

Everything sophisticated in SP is downstream of `decompileToTokens`, which is defeated
by halftone. Everything crude is downstream of the quantiser, which is *strengthened* by
it.

The obvious reading of this repository is "the token/inception layer is the future and
the flow layer is the old version." The measurement says the reverse.

---

## 4 · STEPPING STONES, NOT A ROADMAP

Six directions. They do not converge and are not meant to. Each is worth taking on its
own terms whether or not it leads anywhere near a film.

**S1 · The quantiser as detector.**
Take only `heat`, throw away the rest of both files, and run it over a whole archive at
native frame rate as a shot-boundary detector, benchmarked against ffmpeg per clip. If
it holds at 24×-median on material that scores 0.098 to the standard metric, that is a
publishable result about quantisation as preprocessing, and it has nothing to do with
making a film. **Our `carve.mjs` already has the harness for the comparison.**

**S2 · Two grids, one law.**
128×96×8 and our 192×144×8 are the same world at different resolutions. A grid
interchange — their `getGridForFrame()` out, our `renderField()` in — means their flow
analysis runs on our films and our sound engine runs on their frames. Neither project
needs to adopt the other.

**S3 · Analyse the field, never the halftone.**
Their token decompiler dies on dithered input. Our `renderField()` returns levels
*before* the halftone pass. Feed the pre-halftone field to `decompileToTokens` and
compression should land near threshold's 2.3% instead of halftone's 51.4%. If it does,
SP's entire code-tensor architecture comes alive on our fourteen films — on material it
was never written for, by a route its author did not take.

**S4 · The third layer we do not have.**
`handLayer` is a mark on top of a machine's output that survives re-analysis. Our engine
composites to one array and has no room for a hand. Adding one would let a person draw
*into* a WYGWYL film without editing its module — the first thing in this project that
would let someone who is not writing code make a mark in it.

**S5 · Heat as a score, not a picture.**
`heat` is a per-frame scalar of how much the picture changed. Our films already
synthesise their own foley from `drone` and `cues`. Drive amplitude from heat and the
sound stops being written against the picture and starts being *derived* from it. This
is the one branch that reaches the audio side, and it needs none of SP's machinery.

**S6 · The failure as a signature.**
Halftone defeats run-length encoding because dither maximises run fragmentation. Then
**token count is a measurement of dither density**, which is a measurement of tone. A
6,322-token frame and a 5,303-token frame differ in how grey they are. The compressor's
failure is a tone meter that nobody built on purpose. Whether that is useful is exactly
the wrong question to ask about it yet.

---

## 5 · WHAT WAS MEASURED, AND HOW

Both pages served locally, driven headless, fed real OUT OF LIFE frames through the
pages' own `fitSource()` + `applyBeflixProcess()` path — the same path `ripFrames()`
uses, minus an H.264 decode this container cannot do.

- Boot: both pages load clean. All twelve SP-only functions are live on `window`.
- Ingest: 40 frames at 1fps, all five quantiser modes.
- Token compression and decompile cost: 40 frames × 4 modes.
- Heat vs ffmpeg: 48 frames at native 24fps across the 11.58s cut.
- Memory: measured against the page's own `state.frames`, compared to its gauge.

**A correction to my own reading.** I first ran heat at 1fps and said it had found the
cut boundaries. It had not. At 1fps every consecutive pair differs enormously and the
series is a *regime* map — it separates the neon build (a high plateau), the ten-second
bedroom hold (78–320, dead flat), and the rest — which is real and useful and is not cut
detection. Heat only becomes a cut detector at the source's own frame rate, where the
result above holds. The first reading was mine, not the program's.

External dependencies: `cdn.jsdelivr.net/gif.js` for GIF export, and
`api.openai.com/v1/chat/completions` behind a user-typed key for text→BEFLIX macro
generation. No embedded credentials. Neither is on the analysis path.

---

# PART TWO — WHAT CAME OF FOLLOWING S3

S3 was: *their token decompiler dies on dithered input, and our `renderField()`
returns levels before the halftone pass — so feed it the field.* Followed, with
their code unmodified and only `getGridForFrame` overridden. 192×144 downsamples to
their 128×96 by exactly 1.5, nearest-neighbour, never averaging — an average would
mint levels the dot law does not have.

## THE BRANCH HELD, AND BY MORE THAN PREDICTED

Same decompiler, 90 fields across all fifteen films:

| input | tokens/frame | % of raw | ms/frame |
|---|---|---|---|
| OUT OF LIFE, halftoned (their path) | 6322 | 51.45% | 297 |
| OUT OF LIFE, thresholded (their best) | 280 | 2.28% | 2 |
| **our pre-halftone field** | **686** | **5.58%** | **6.8** |

**Nine times fewer tokens and forty-four times faster than the mode that makes footage
look like BEFLIX.** The whole code-tensor architecture is viable on our films. It was
never viable on the pictures it was written for, because it only ever meets them after
the halftone.

## AND THEN THE ARCHITECTURE FAILED ITS FIRST HONEST TEST

Our films are pure functions of `u`. Frame N+1 is not the future — it is computable,
exactly, at any `t`. **That makes this suite the ground truth a frame predictor never
gets**, and it is the reason the following measurement was possible at all. Their own
project cannot run it: a predicted frame there has nothing to be checked against.

Their token-delta predictor against exact truth, one frame ahead at 12fps, 75 samples,
scored where either field has ink:

| | predictor | repeat the last frame | delta |
|---|---|---|---|
| overall | **85.5%** | **89.8%** | **−4.3** |
| films where the predictor wins | **0 / 15** | | |

It loses on every film, by 0.8 to 11.4 points. Sweeping the gap between the two frames
it learns from, across a 32× range:

| gap (s) | mean token displacement | predictor | persistence | delta |
|---|---|---|---|---|
| 0.042 | 0.14 cells | 89.9% | 92.9% | −3.0 |
| 0.083 | 0.18 | 85.8% | 90.3% | −4.5 |
| 0.167 | 0.28 | 80.3% | 85.9% | −5.6 |
| 0.333 | 0.43 | 74.2% | 80.6% | −6.4 |
| 0.667 | 0.61 | 64.3% | 71.1% | −6.8 |
| 1.333 | 1.13 | 55.7% | 63.3% | −7.5 |

**No crossover, and the gap widens as motion grows.** That is the opposite of a
predictor that merely needs more signal.

### THE LAW UNDERNEATH IT

Mean token displacement is 0.14 to 1.13 cells. The predictor is estimating **sub-cell
motion on a quantised lattice** and rounding the answer to integers. For most tokens
the estimate rounds to 0 — which is persistence — or to ±1, which is a wrong move that
costs twice: the rectangle is wrong where it went and wrong where it left. Persistence
is wrong once.

> **On a quantised lattice, a displacement predictor cannot beat persistence until mean
> displacement exceeds about one cell per step — and by then the matcher's own error has
> grown with it, so it never catches up. The lattice that makes the picture legible is
> the lattice that makes motion unestimable.**

This also reconciles the two projects rather than scoring a point off one. Their
predictor is *correct for material authored in their own macro language*, where motion
arrives as `SHF dx dy` — integer by construction, many cells at a time. It is wrong for
anything sampled from continuous motion. **The tool is right about the world it was made
for.** Ours is not that world.

## THE INSTRUMENT THAT CAME OUT OF THE FAILURE

Token count is not ink coverage: across the fourteen films they correlate at only
**0.690**, so half of what a token count knows, coverage does not. The remainder is
**texture** — how broken up a picture is, independent of how much of it there is.

    texture = tokens / (coverage × 100)

`wygwyl/tokens.mjs` is the decompiler ported to our lattice and parameterised, with the
O(n²) vertical merge replaced by a keyed single pass. `shoot.mjs --texture` runs it over
every movement in the suite.

It reads the films correctly. `10 MOON SETTLES` is **8** — night and morning as large
flat fields. `03 COBWEBS` is **102** — a picture made of scattered fragments, which is
what the poem is. `13 WON'T LEAVE` is **10** at *100% coverage*, because nearly all of
that is one tone; `13 HARVESTED POWER` is **74** at the same coverage, because it is a
meadow of two hundred and fifty separate heads.

### AND IT FOUND SOMETHING NOTHING ELSE COULD

The suite's quality bar in the author's words is *"each of these frames should be a
painting that the poet would be proud to hang on his wall."* A painting is built out of
tone. A diagram is line on paper. **High texture at low coverage is the signature of a
diagram**, and one film reads that way from beginning to end:

    09 YET, HEARD — the longest film in the suite, 118 seconds
      m1 THE SHARED MOON        8.0% coverage   texture 65
      m2 TEARS, AN ABYSS        7.5%            texture 61
      m3 HIS FOOTSTEPS          7.7%            texture 73
      m4 EAST, AT THE HARBOR    6.6%            texture 63

Every other instrument passed it. `--motion` reported 8.3 step / 10.2 span — moving.
`--sweep` flagged nothing empty or solid. Coverage alone read 7–8%, which in this suite
means *spare*, not *wrong*. Looking at `HIS FOOTSTEPS, RETRACED` confirms the number:
two well-drawn bodies and a dotted line, floating on bare cream. No ground plane, no
light, no space. It is the one film with no toned movement anywhere in it.

**A foreign project's broken compressor, run on the one input it was never given, became
the instrument that found the last structural weakness in our film.** That is the whole
argument for collecting stepping stones rather than solving problems, and it is not an
argument — it is a measurement.

## FURTHER STONES, FROM HERE

**S7 · The suite is a computed benchmark.** Video benchmarks are expensive because
ground truth must be annotated by people. Ours is *computed*: pure functions of `u`, so
exact truth at any timestamp, at any frame rate, for free, with no ambiguity. Frame
prediction was measured against it above in an afternoon. Optical flow, shot detection,
compression and interpolation are all measurable the same way, and the films do not care
that they are being used this way.

**S8 · Emit the true motion field.** Worse: we do not merely know the next frame, we
know *why*. `F.fig(x, y, …)` is called with a position we compute. A film could export
its own exact per-object motion field alongside its picture — the annotation that costs
real datasets the most, generated for nothing. Nobody asked for this and it has no
bearing on the poems.

**S9 · Texture as a direction, not a score.** The index has no good or bad end. What it
gives is a vocabulary the project did not have: mass or scatter, independent of amount.
Once a film can be placed on it, a film can be *moved* along it deliberately — a
movement that begins at 90 and ends at 10 is a picture resolving out of noise into
substance, and that is a shot nobody has written here yet.

**S10 · Heat as a score.** Still untaken from Part One, and cheaper than it looked now
that texture works: `heat` is a per-frame scalar of change, and our films already
synthesise foley from `drone` and `cues`. Derive amplitude from heat and the sound stops
being written against the picture and starts being caused by it.

**S11 · The failed predictor is a rehearsal detector.** It loses because it moves things
that did not move. Where it loses *least* — 04 NEVERMORE at −0.8, 13 at −0.8 — the
picture's motion is genuinely token-like: whole objects translating. Where it loses most
— 09 at −11.4, 00 at −7.5, 08 at −7.4 — motion is continuous and sub-cell. **Prediction
error is therefore a classifier of what kind of motion a film has**, which is a use for
a broken predictor that requires it to stay broken.
