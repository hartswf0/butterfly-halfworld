# A part is a slot

Binding began as **FOLLOW**: a patch keeps its own shape and is carried by a
part's centre, angle and scale. That is right for a hat above a head, and it is
not what a beflix body is for.

A dotted figure is an **armature** — a head, a torso, an upper arm, a forearm, a
hand. The thing you want to do with it is put a real photograph *into* one of
those, so the picture takes the part's shape and then moves with it. The same is
true of a wall in a drawn building, a handle on a drawn jug, a panel of a
facade, a plank, a pane. **The part is a slot.**

## FIT

The part is rendered by itself, and from its cells come two things:

- an **oriented box** — centre, principal axis, length along it, width across.
  Along its axis, not along the screen: a forearm lying at forty degrees wants a
  sleeve at forty degrees, and an upright rectangle round it is not the same
  thing at all.
- a **mask** — the part's own silhouette.

The image is warped into the box through the same projective map placements use,
then cut to the mask. So it lands *in the part's shape*, not in a rectangle over
it. Every frame it is measured again, so when the part turns, moves or comes
closer the picture goes with it.

    binding = { to: <host lineage>, part: <name>, fit: true }

One field distinguishes the two. `fit` takes the part's shape; without it the
patch keeps its own and only rides along. There is no `ref` on a fit, because
the patch's own placement stops mattering the moment it is put inside something
else. `loose: true` fits the box but skips the mask, for when you want the
picture to overflow the shape.

Verified: an archive piece stamped over a temple, then fitted into the world's
named `sunDisc` — it leaves its rectangle and fills the disc.

## What this reaches, and what it does not

**Reaches now**

- **Drawn worlds** — 109 named parts across the twenty. Every one is a slot:
  `sunDisc`, `gate`, `windows`, `waterBelow`, `archWall`, `trail`, `heart`.
  This is the architecture, props and texture case in full.
- **Filmed clips** — the tracked body's mask is a part, so a photograph can be
  fitted into a moving silhouette.
- Both **follow** and **fit**, and both survive a span, so a fitted piece stays
  fitted across a whole passage.

**Does not reach yet — the honest gap**

A beflixified *photograph* of a person has **no limbs**. The tracked body is one
silhouette; there is no head/torso/upper-arm/forearm/hand breakdown, so the
board's `03 SELECT` on a photographic figure cannot be done by name. The archive
does hold 2,033 cut pieces with labels like `human face`, `hand`, `person` — but
those are cut-outs, not a rigged body.

The missing link is small and specific: **a picked region is not yet a bindable
part.** Pick can already select any connected shape or any named region on a
frame. If a pick could be named and registered as a part of that frame, then the
whole of Scenario 03 follows from what already exists — beflixify the figure,
pick the forearm by shape, name it `forearm`, fit a sleeve into it, and it is a
slot like any other. That is the next thing to build, and it is one step, not a
system.
