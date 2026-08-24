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
