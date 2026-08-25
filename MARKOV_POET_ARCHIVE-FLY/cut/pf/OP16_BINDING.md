# Binding — a patch carried by something else's motion

Everything placed so far is placed **in the frame**. Span it across a passage and
it sits exactly where it sat while the world underneath walks out from under it.
That is fine for a title and useless for a hat.

A binding says: *this patch belongs to that part of that layer.* Not "at these
coordinates" but "there, relative to the trail" — and when the trail moves,
turns or comes closer, the patch goes with it.

    binding = { to: <host lineage>, part: <name>, ref: <anchor when bound> }

## One measurement

Take the cells a part inks. Compute their centroid and second moments. That
gives a centre, a principal axis, and a length along it — **one bone from a
silhouette**. It is the same measurement the MOUSSA track surface makes of a
tracked body, which is why a drawn world's named part and a filmed body's mask
can be bound to through the same door:

- a **world** host renders the named part alone and measures the result;
- a **clip** host reads the mask panel of its packed sheet at frame `k`, laid
  into the field at the clip's own quad, and measures that.

At bake time the anchor is measured again on *this* frame, and the similarity
that carries `ref` onto `now` — translate, rotate, scale — is applied to the
patch's four corners. The quad was already the right representation for this;
binding is the quad being driven by somebody else instead of by your hand.

The axis is only defined to within a half turn, so the turn taken is always the
small one. Without that, a part flips 180° between frames and everything bound
to it cartwheels.

## Why `ref` is captured at bind time

Because it makes binding a **no-op on the frame you bind**. The patch does not
jump. It only diverges as the host does — which is the only honest way to make
this checkable: if it moves the moment you bind it, something is wrong.

## Two things this got wrong first

**The span dropped the binding.** `patchSpanApply` copies `{kind, src, place,
repeat, name}` onto each frame; `binding` was not in that list. A patch carried
on frame one and stranded on frame two is not carried at all.

**Binding named an id instead of a lineage.** Each frame holds its own cast of
the host, with its own patch id. Binding to `host.id` bound to one frame's copy
and to nothing else. It stores `host._from || host.id` — the lineage — and
resolves with the same key, which is exactly what the track lane already uses to
know that a row of casts is one layer.

## What the measurement says about the material

Binding was first tested against NEVERMORE's `trail`, and the frame barely
changed. Measuring the world directly explains why, and it is not the code:

    gardenNight   moves 0.44 cells over one second, scale x1.009
    trail         moves 2.42 cells,                 scale x1.132
    heart         moves 4.73 cells,                 scale x0.968

On a 192-cell-wide field those are displacements you cannot see. **NEVERMORE is
a world whose named parts hold still and whose movement is elsewhere** — in the
`movement` tags the part map deliberately excludes. That is worth knowing before
binding to it and expecting travel.

## Verified: a bound patch travels

ATLANTIS at 10.7 s has a `comet` — the one part in the whole suite that really
moves, 28 cells a second. A piece was stamped over it, bound to `comet`, and
both were spanned across sixteen frames.

    frame 1    the piece is centred at about (400, 382) on the board
    frame 16   it is at about (542, 357) — right and up

and the comet, on frame 16, is at the top right of the field. The piece went
where the comet went. Unbinding on frame 16 puts it back inside its own quad,
which is drawn dashed and stays where it was placed: **the corners say where it
was put, the ink says where it is carried.**

`cut/out/op16/partmotion.html` measures this for every named part in every
world, sorted by distance travelled, because "binding looks broken" is almost
always "that part holds still". The suite is mostly still: outside the comet,
the largest movers are `heardRings` in REUNION (6.1 cells/s) and `aggressions`
in MAGIC RIDE (3.9), and most named parts move under one cell a second.

## Fixed: the engine was loaded twice

The world modules import the engine as `"../halfworld.mjs"`. OPERATOR imported
it as `"halfworld.mjs?b=7"` to defeat caching during development — and a query
string makes a **different module instance**. So the runtime came from one copy
of the engine and every primitive a world calls came from the other, each with
its own module-level scratch and identity field.

Measured on 04-nevermore at the same moment, the two copies disagree:

    one instance    13270 inked cells    trail 137 cells
    forked          13283 inked cells    trail 157 cells

The cache-buster is gone. It cannot come back in that form: the world's own
import is a bare specifier, so the only way to have one engine is to import it
bare here too. This is a strong candidate for the unexplained world-patch bake
drift recorded elsewhere — two engines with separate state, composited as one.

## Earlier confusion, resolved

An earlier note here reported the bind menu's counts as wrong by 10×. That was
two mistakes of mine stacked: comparing against the un-forked instance, and
reading a label the narrow menu had clipped (`2112 cells` shown as `211`). With
one engine the menu and a direct render agree — `clipLine 789`, `windows 714`,
`waterBelow 606`, `building 279`, `gate 144`, `facewindow 91`.
