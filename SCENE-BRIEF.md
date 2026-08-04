# SCENE BRIEF — forty loops

Read `MOTION-BRIEF.md` and `BUILD-BRIEF.md` first. This adds the rules for authoring the forty units.

**In this world a scene is a LOOP, not a frame.** Everything below follows from that.

---

## 0 · THE CONTRACT

Copy the shape of `scenes/BF-01.mjs`, which is the reference and already renders:

```js
export const id         = "BF-07";
export const title      = "THE SCALES BRIGHTEN";
export const place      = "INT. LABORATORY · HER HAND";
export const plan       = "the-laboratory";
export const motion     = "TRANSFER";          // one of the eight
export const beats      = 4;                    // CYCLE only
export const seconds    = 3.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12, beats);
export const declaredBreak = null;              // BREAK only: the u of the discontinuity

export const subject    = "the scales in the lines of her palm";   // ONE. Name it before writing.
export const distance   = "CLOSE";                                  // CLOSE | MEDIUM | WIDE
export const leftOut    = ["Niko", "the bench", "the windows"];      // what you deliberately excluded

export function at(u, ctx) { /* pure: no clock, no mutation, no previous frame */ }
export function draw(g, W, H, s) { /* consumes only `s` */ }

export const INITIAL = exitOccupancyBF06;       // imported from the previous scene
export const MOVES   = [ /* ... */ ];
export const exitOccupancy = occupancyAt(plan, MOVES, T, INITIAL);
```

Render and watch:

```bash
node harness/render-motion.mjs scenes/BF-07.mjs --contact
```

---

## 1 · THE LOOP IS THE UNIT OF JUDGEMENT

> write → render the sequence → **read the contact sheet** → revise

A frame that reads well and a loop that reads well are different achievements. The contact sheet is a
**lossy instrument** — it samples every ~10 source px and has already lost an entire acrylic lid that
was fine at full resolution. When something matters and is thin, cross-check a full-res frame.

Put your **two-second read of the MOTION** in the ledger's `saw` field: not "a woman at a bench" but
"a body doing something it cannot stop." If you cannot say what the loop is doing in one clause, the
loop has failed however good the drawing is.

**For every CYCLE, report the loop-closure number** the renderer prints. A ratio near 1.0 is seamless.
Near 0 means a duplicated frame. Wildly above 1 means a discontinuity. Do not assert it passed — quote it.

---

## 2 · OCCUPANCY CHAINS THROUGH ALL FORTY

This is one continuous movement, not an anthology. Every scene imports the previous scene's
`exitOccupancy` as its `INITIAL` and exports its own via `occupancyAt()` — **never hand-written**.

Your act hands off at its boundary. Export a named aggregate at your last scene so the next act can
import it. If you break the chain the world teleports and nobody will see it in a still.

---

## 3 · COMPOSITION — inherited, and it cost a fleet a day to learn

- **One subject per frame**, named in `export const subject` before you write the file.
- **Choose a distance and commit.** Wide is expensive.
- **Paper is the budget** — half the frame stays cream. Everything renders 2–3 ink levels too dark.
- **Do not crop bodies at the frame edge.** Separate overlapping figures in depth.
- **A plan is a map, not a shot list.** `the-facility` has 131 stations; a frame that uses 131 of them
  is an unreadable field of dots. Use `lens()`-style framing: crop in, preserve relative arrangement.
- **List what you left out** in `export const leftOut`. It is the cheapest defence against the failure
  above.

---

## 4 · WHAT THIS TEXT WILL PUNISH

- **Rendering the mark as a picture.** It is the *difference* between two wing states. Import
  `brokenCircle()` and let closure do the union — measured, the two halves land within 0.018 of each
  other at closure 1 and 1.027 apart at closure 0. Never draw a whole mark.
- **Cross-fading.** There is no alpha here. Use `dissolve()` — an ordered per-dot swap.
- **Closing a living cycle.** `loopClosed: true` is for apparatus only. The insect striking the
  ceiling is open, because it is being worn down by this.
- **Easing the tapping.** *"Not wildly… testing the glass at equal intervals."* Quantise it.
- **Fading the scales.** They **brighten** when rubbed. `transfer()` peaks ink at the crossing midpoint.
- **Hazing the chrysalis wall.** *"Each seam split at once"* — narrow `width`, a zip in sequence.
  And the husks are **empty**: the motion is in the field passing through them, not in the objects.
- **Freezing a HOLD.** A frozen frame reads as a crash. Use `hold()`; the breath should be deniable.

---

## 5 · THE ROOMS ARE BUILT — 350 stations, verified

`node harness/verify-plans.mjs` exits 0 with 14,504 separation checks. Read the header of the plan you
need; reference stations **by name**; an unknown name throws.

**Ordered runs are exported for the motions that need them** — a motion cannot sweep an unordered set:

| run | plan | for |
|---|---|---|
| `chrysalisWallRun` (75, date order) | the-facility | the SWEEP in BF-32 |
| `reelRollRun` (9) | the-facility | the ADVANCE cascade in BF-36 |
| `landingsDescending`, `lightColumnsDescending` | the-mill | the ADVANCE in BF-16 |
| `reflectedSeatRow` (7) | the-mill | the bus reflection in BF-20 |
| `flightTraceArc` + `flightTraceStroke` | the-laboratory | the TRACE in BF-02 |
| `pursuitRun` (11) | the-lot | the ADVANCE in BF-26 |
| `strikeCycleRun` | the-maze | the CYCLE in BF-01 / BF-37 |

**The maze has two cameras from one geometry.** `theMaze` deletes height — *it literally cannot see the
striking*, which is why the trial reads as non-completion. `theMazeInside` deletes length — the choice
has no extent, and Mara at the lid renders at scale 1.112 against the floor's 0.694. Use the right one.

---

## 6 · TWO RINGS THE PLANS REFUSED

BF-14's vial and BF-21's canister both tap *"around the circumference at equal intervals."* Eight
stations around a 30mm object project ~0.4px apart — below a plan's resolution. **Those rings belong to
you**, drawn in scene space at `recovery_rack_vial` and `lobby_floor_canister`. Quantise them; they are
the same figure twice and should rhyme.

---

## 7 · THE FURNITURE IS YOURS

There are no set assets yet. Your act owns its rooms, so no other agent will touch them — draw what
your scenes need, in `assets/set/`, using `assets/set/_kit.mjs`. Full-width horizontals stripe the
frame: break every span. Cold surfaces — acrylic, stainless, plastic sheeting, tile, waxed paper, rust,
fluorescent tube. **Lavender is a smell, never a purple.**

---

## 8 · LEDGER

Append to `process/scene-<ACT>.jsonl` as you work: `{t, step, artifact, iteration, note, saw, changed}`.
`t` from `date -u +%Y-%m-%dT%H:%M:%SZ`. `saw` describes **the loop you watched**. Record failures and
rejected passes — a ledger with no failures is a falsified ledger.

Never run `git add -A`. Do not commit. Touch only your own scenes, your own set assets, your own ledger.
