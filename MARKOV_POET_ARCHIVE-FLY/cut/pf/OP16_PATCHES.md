# OP-16 · step 1 — the frame is an assemblage

    cut/out/op16/index.html  →  AUTHOR › The stack

A frame was a grid, and everything put into it was destroyed on arrival. That is
why five separate mechanisms grew this session to recover what the storage threw
away. The fix is not a sixth. It is to stop throwing it away.

**A frame is now a stack, and nothing sits outside it:**

    ▤ ground    what the frame already was — a streamed film's own commands,
                or nothing. Opaque, always at the bottom, and honest: 984 frames
                of twinstrip cannot be decomposed after the fact, so it is ONE
                patch and says so rather than pretending otherwise.
    ◈ world     a halfworld at a moment, optionally only certain parts
    ■ element   an archive cut-out, quantised and placed
    ✒ ink       raw commands — a pen stroke, a lifted region, stamped text

The node's `cmds` remain the single truth for render, stream and export — nothing
downstream changed. But they are now **derived**: a pure function of the stack.
That is the difference between a layer and a memory of having drawn something.

**There is no way to edit a frame that is not adding a patch.** `draw()` — the
one door every source in the tool already funnelled through — now makes an `ink`
patch, so the bake-forward rule needs no special case. Consecutive strokes
coalesce for 1.4s, or a scribble would be four hundred layers.

## verified

    ◈ RESURRECTING ATLANTIS    ▲▼ ON ✕
    ◈ NEVERMORE                ▲▼ ON ✕
    ▤ as it arrived                ON
    2 patches over the ground

    both worlds on   19,100 ink px
    NEVERMORE off     9,560          ← the frame rebuilt without it
    back on          19,192

Two worlds stacked over a ground, one switched off, the frame rebuilt from what
remained. The patch stays in the list marked OFF and comes back.

## the honest caveat: a world patch is not bit-reproducible

Removal is **exact** — switching the only patch off gives 0 ink, the ground and
nothing else. Restoring it does not return the identical frame:

    A on 9,560 → A off 0 → A back on 9,648      +88 cells, ~0.9%

The delta is **exactly 88 both times**, so it is deterministic rather than noise:
the first render of a world differs from every later one by a fixed amount.

Two causes tested and ruled out:

- **runtime churn** — `hwRenderAt` built a fresh runtime per bake; caching one
  per world changed nothing.
- **the word rasteriser's cache** — the only module-level memo in the engine.
  ATLANTIS never calls `word`.

So something in the engine warms up on first render and I have not found what.
Ground, ink and element patches are exact; world patches are exact to within one
percent of their ink. The central claim — *the frame is a function of its stack*
— holds for three of the four kinds and **very nearly** for the fourth, which is
worth stating precisely rather than rounding up.

## not yet

`span` is on the record and unused: every patch is still a patch of one frame.
That is step 2, and it belongs in **D DIRECT** — the mode that is already looking
at the running order, so a patch's reach across frames is edited exactly where
those frames already are.
