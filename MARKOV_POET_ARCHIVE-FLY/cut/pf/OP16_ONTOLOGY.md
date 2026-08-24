# OP-16 — a theory of the program

## What is actually in this project

| | what it is | what it has |
|---|---|---|
| the poems | fourteen texts in the poet's voice | 2,805 word timings — a **duration** |
| the halfworlds | fourteen **programs** that draw a poem | movements, named parts, a runtime |
| the archive | 135 filmed shots | 2,033 cut elements, 85 tracked bodies |
| MOUSSA | a running order over both | 349 events cut to the voice |
| the field | 192×144, eight levels | the one surface all of it renders onto |
| OPERATOR | a tree of frames | branch, vault, stream, export |

The first four rows are **things with duration and parts**. The last row stores
**frames without parts**. Every frame is a flattening, and that is the whole
problem.

## The symptom I have been treating instead of the disease

Look at what this session built, in order:

- owner maps, to recover parts after stamping
- connected-region segmentation, to recover parts when there is no map
- `hw:<slug>@<t>` notes, to recover the moment a frame came from
- `WIDEN`, to recover a coarser grouping than the names give
- `Pick`, to recover anything at all from a baked frame

**Five mechanisms for recovering information that was destroyed at the moment of
storage.** Each one works. None of them should have to exist.

PATCHFIELD said this before any of them were written:

> Do not bind photographs directly to temporary dots or pixels. Bind them to a
> persistent surface underneath the marks.

The dots are the render. I have been storing the render and reconstructing the
thing.

## The missing noun: the PATCH

A **patch** is not a frame edit. It is:

    SOURCE     where the material comes from
               — a world part, an archive element, a lifted region, a stroke, text
    PLACEMENT  where it sits — position, size, turn, blend, tone floor
    SPAN       which frames it is on — this one, a run, the whole film
    BINDING    what it holds onto — the frame, or a carrier that moves

A frame becomes **the composite of the patches whose span covers it**, plus
whatever was drawn by hand on it.

That one noun answers all four complaints at once:

- *we don't add the whole poem* — a world is a patch whose span is the poem's
  duration, rendered per frame from the runtime. Not a stamp of one moment.
- *layers aren't in any of ABCDE* — the patch stack **is** the layer list.
- *collage for every frame and across many frames* — that is what SPAN is.
- *without mucking up the UI* — see below. It needs no new screen.

## Why it does not need new UI

The five letters are already five views. They have been showing one object —
the frame — from five angles. Give them a second object and each already has the
right angle on it:

| | shows the frame as | shows a patch as |
|---|---|---|
| **A** AUTHOR | marks you make | its **source and placement** — the drawers already do this |
| **B** BRANCH | versions of the tree | versions of the **stack** — a collage variant, not just a frame variant |
| **C** CREW | who is here | **who owns which patch** |
| **D** DIRECT | the running order | its **span across that order** — tracks under the strip |
| **E** IN/OUT | the film in and out | patches in and out — a `@PATCH` segment beside `@SEQ` |

**D is the load-bearing one.** It is already the across-frames mode: you are
looking at the cut. So "this patch runs from frame 40 to 120" is edited exactly
where you are already looking at frames 40 to 120. That is how collage gets a
duration without a new screen — the screen exists, it just has nothing on it yet
but frames.

## Why PATCHFIELD specifically

PATCHFIELD already is the document this needs: `{piles, nodes, edges}`, every
node emitting a Metric it computed, ignorance as a first-class output. Its
operations are already patch sources and placements — `pile.select`, `place`,
`stack`, `aperture`, `mortar`, `carrier.rig`.

What it has never had is a **clock** and a **host**. OPERATOR is the host and has
the clock. Neither tool is missing the other's ideas; they are missing each
other.

## The hard problem, named rather than deferred

Two sources of truth. I hit this exact wall between PASTE and PATCHFIELD, and the
lesson stands: a recipe and a render that can both be edited will drift.

The resolution has to be a rule, chosen in advance:

> **Patches bake forward into commands. Commands never bake back.**
> The node's `cmds` stay authoritative for render, stream and export — one truth
> for the film. The patch list is the recipe that produced them and can re-bake.
> A hand edit on a baked frame **breaks that patch's claim on that frame**, and
> the frame is marked as overridden rather than silently diverging.

Visible divergence, not silent. That is the same principle as the amber seam and
the ignorance map: the tool says what it does not know.

## Build order

1. **The patch record and the bake.** `{id, source, placement, span, binding}`
   → `applyNodeDelta` per covered frame. No UI. The test: a patch authored as
   JSON composites across a run of frames.
2. **D gets tracks.** Patches as bars under the existing strip; drag an end to
   change the span. This is the whole "across many frames" feature and it is one
   panel in a mode that already exists.
3. **A stops stamping.** The drawers make patches instead of writing commands
   directly. Everything already built keeps working — it becomes a patch with a
   span of one.
4. **The poem as a patch.** A world's span is its duration; each covered frame
   renders from the runtime at its own `t`. This is what "add the whole poem"
   means, and it is only possible after 1 and 2.
5. **B and E.** Branch a stack; carry patches in the twinstrip as `@PATCH`.

Steps 1 and 2 are the ones that change what the program *is*. The rest is
consequence.

## What this costs

Honesty about scale: the halfworld renders at ~9 frames a second, so a patch
spanning a 984-frame film is not a live composite — it is a bake with a progress
bar, exactly like the poemfield stream already is. The span model does not make
that cheaper. It makes it **re-doable**, which is the thing that matters when you
want the same collage two seconds later in the cut.
