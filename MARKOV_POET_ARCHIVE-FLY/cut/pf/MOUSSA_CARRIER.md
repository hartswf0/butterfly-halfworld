# THE REAL CARRIER

    python3 pf/buildpack.py 12 24     # -> out/held/pack/

HELD walked a mannequin. `partsAt(t)` is fifteen invented segments with a hip, a
hat and a sway, and everything lassoed onto it was bound to something that does
not exist. MOUSSA has the actual poet, and it was already on disk:

    shots.json       135 shots, paths, durations
    atlas.json       role, place, cover, whether a subject was found
    bodycache/       142 tracked masks · 11,636 segmented frames · 307MB
    bodymask.py      SAM 2, seeded off panoptic, still working

## one bone, measured instead of authored

A silhouette has no joints, so it cannot offer `(bone, u, v)`. But it has second
moments: a centroid, a principal axis, an extent along it, a half-width across.
That is **one bone, derived rather than declared**, and it gives `u` and `v` the
same meaning the mannequin's limbs do — so `partsOf(f,t)` returns either kind and
nothing downstream knows the difference. Sockets, lassoing, hit-testing and
rendering needed no second path.

`contains()` is the one place the two differ. For a rig the bone *is* the shape;
for a body the bone is only a cheap reject and **the mask is the truth**. A
silhouette is not an oriented box, and pretending otherwise is what made the
mannequin a mannequin.

## which end is the head

The first rule was *the end with more mass* — shoulders are wider than ankles.
**It named the coat.** These are medium shots cropped at the hip, so the torso
fills the bottom of the frame and outweighs the head in every frame. The rule is
true of a whole figure and false of every shot in this archive.

The poet is never upside down in 135 shots, so image-up decides, and mass
imbalance became a **check** on that decision rather than the decision. Where
they disagree the frame is flagged:

    11 shots · 264 bodied frames · 87 where mass disputes image-up (33%) · 1 skipped

    P073  LIT FACE              cover 0.62   disputed  0/24
    P060  RED PLASMA FIGURE     cover 0.43   disputed 15/24
    P087  TRAIN WINDOW          cover 0.29   disputed 24/24
    P059  RED PLASMA FIGURE     cover 0.33   disputed 24/24

The 24/24 shots are close-ups where the head fills the frame — there the mass
*is* at the top, and head-to-foot is not a coordinate that shot can support. The
flag is doing real work: it marks where the surface should not be trusted, and
`castPoet` says so in the status line before you build on it.

## tone is not luminance

The first cast came back a solid black rectangle. MOUSSA learned this once
already — typing ink from absolute darkness gives a white silhouette with a black
outline, because a flat dark coat and the wall behind it are the same nothing to
that law. Its answer was local contrast.

HELD cannot run that law in a browser without writing a second copy that would
drift from the first, so it does the smaller honest thing: **each frame is
stretched to its own range inside the body**, packed as `tone: [lo, hi]`. P073
lives in `[21.5, 107.8]` — the bottom 42% of the scale, which is exactly why it
went solid. A night shot is now read by its modelling rather than its exposure.
This is not MOUSSA's law and does not claim to be; it is the same refusal to let
absolute darkness place ink.

A frame whose body spans less than 12 levels is recorded as `flat` rather than
amplified into marks.

## and one unit per carrier

The mannequin is drawn in a 150×210 space, a packed body in the 192×144 field.
One shared `unit` made the poet fill the screen four times over. `unitOf(f,L)`
picks by kind.

## verified

Cast P073, lassoed a socket onto the real tracked head, bound a neon-sign cut-out
from the archive, scrubbed to t=0.38 — nine frames of real footage later the
patch is still on his head, and the tool reports `held · 58 open at the seam`.
