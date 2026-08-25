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

## Open: the bind menu's counts disagree with the engine

The menu reported `gardenNight 211 cells` where a direct render of the same
world at the same moment counts 2196, and listed two named parts where the
engine exposes four. The direct measurement is stable — cold runtime and
scrubbed runtime agree exactly — so the disagreement is on the tool's side of
the line. Binding works regardless of the count (the anchor is computed from the
part's own render, not from these numbers), but the numbers shown to the user
are wrong and the menu is hiding parts you could bind to. Not yet explained.
