# Layers in sight, and poemfields as passages

## the layers were hidden, which is the same as not having them

The stack was inside a collapsed panel behind a mode tab — **four gestures from
the thing it describes**. A rail now sits on the stage itself, 62px on the right
of the board, always on while the frame has anything in it:

    LAYERS
    ◈ 24f     ← the world patch, its span badge
    ▤         ← the ground

Each tile is that patch **alone**, baked and drawn small. Tap to select — the
same selection the panel uses, so there is one and not two. Double-tap to hide
it. The panel keeps the detailed controls; the rail answers *what is this frame
made of* without leaving the frame.

## a poem is a duration, not a picture of one

Everything landed on one frame, so a poemfield arrived as a **still** and a clip
sat at a single `k`. Putting a duration into a film as a picture of itself is the
same mistake as storing a frame instead of its parts, one level up.

`across [n] FRAMES` on any patch walks forward along the branch — making frames
when the branch runs out — and puts a copy on each **with its own moment**:

    ◈ world    `t` advances 1/8s a frame — the world plays
    ▶ clip     `k` advances one packed frame each — the shot plays
    ■ element  held as it is, which is how a mosaic carries across a passage

    LOCAL 1/24 · LOCAL BRANCH · 24
    frame 1   the city low, the dome closed
    frame 16  the buildings risen, the dome moved, the waterline shifted

The frames are ordinary nodes and each keeps **its own stack**, so anything
already on them survives and any one of them can still be edited by hand
afterwards without the others caring. Re-spanning replaces the previous cast
rather than piling a second copy on top — each frame remembers which patch its
copy came from.

## what this does not do yet

The span is applied, not **live**: changing the source patch after spanning does
not re-run the passage, you press FRAMES again. A live span would mean the
downstream frames have no independent existence, and they should — that is what
makes them editable. The honest version is a re-apply, and it says so.

Spanning is a bake, not a preview: 24 frames of a halfworld is 24 renders behind
a progress bar. The model does not make that cheaper. It makes it **re-doable**,
which is what matters when you want the same passage two seconds later in the
cut.

---

## The track lane — a passage you can see and pull

The span used to be a number in a popup: *across [12] frames*. You typed it,
it happened somewhere off-screen, and the only way to know a layer's reach was
to walk the strip and look. A reach that is invisible is a reach you cannot
compose against — you could not see that the world ran twelve frames while the
figure over it ran three.

So the reach is drawn where reach belongs: **in the timeline, under the strip**,
one bar per layer, on its own row.

    ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐   the strip
    │ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│11│12│
    └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
    ▓▓▓▓▓▓▓▓▓▓▓▓ ◈ ATLANTIS 6f ▓▓▓▓▓▓▓░              ← the lane
       ▓▓▓▓▓ ✦ THE POET 3f ▓░

Nothing new had to be stored to draw this. A spanned patch already leaves a copy
on each frame carrying `_from` — the id of the patch it came from. The lineage
was already recorded; the bar is just that lineage's extent along the path.
`trackData()` groups `PSTACK` along `_stripPath` by `p._from||p.id` and takes
the min and max index. The bar sits at `from*STRIP_CARD_W+6` and runs
`(to-from+1)*STRIP_CARD_W-5` wide, so its left edge is the first cell's left
edge and its right edge is the last cell's right edge, to the pixel.

### Three things this got wrong first, and what they taught

**The lane painted against a stale path.** `renderStrip()` does not lay the
strip — it sets `_dirty.strip` and returns; `renderStripNow()` runs on the next
frame and is where `_stripPath` is assigned. Wrapping the scheduler meant the
lane read the path from *before* the span, so every passage, however long,
drew exactly one frame wide. The lane follows `renderStripNow` now. The lesson
is general: in a dirty-flag renderer, decorate the painter, never the scheduler.

**A shorter span did not retract.** `patchSpanApply` laid copies forward and
stopped; it never took any back. Pulling a bar's grip leftward therefore looked
inert — the copies were still out on frames 7–12 and the extent redrew at its
old reach. It now walks the branch past the new end, strips every patch with
`_from===pid`, and re-bakes those frames. `n===1` is no longer an early return
either: one frame is a retraction to here, not a no-op.

**The gesture committed nothing on a fast drag.** The reach was read from the
last `pointermove`, and a quick flick can land with no move between down and
up. It reads the release point instead. `setPointerCapture` is wrapped in a
try/catch for the same reason — a gesture should not be lost to a throw.

### Right-click, or hold

The same bar (and the same tile in the layers rail) answers `contextmenu` and a
520 ms long-press with the five things you actually want:

    Duplicate · Hide/Show · Bring to front · Send to back · Delete

Ordinary quality of life, and it is the surface where **binding** will live —
the patch record has carried a `binding` field since the beginning and nothing
has filled it yet.
