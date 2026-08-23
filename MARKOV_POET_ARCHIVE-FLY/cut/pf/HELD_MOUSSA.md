# HELD-MOUSSA — the clock, and the whole archive

    python3 pf/buildpack2.py     # 135 shots -> out/held/pack/*.webp
    python3 pf/stations.py       # 14 timelines -> out/held/pack/stations.json
    python3 pf/reindex.py        # rebuild the index from whatever is on disk

HELD knew eleven shots and nothing about the poems. Its scrub ran over
twenty-four frames of one of them, on a loop, while fourteen finished films sat
beside it untouched — as if the archive were a bag of pictures rather than a
thing with a duration and a running order already decided.

**MOUSSA decided it, and none of it needed making.** `moussa.json` holds fourteen
timelines: which shot is on screen at which second, which halfworld is drawn when
the footage has nothing fresh, which song runs underneath. `words.json` holds
2,805 word timings from the poet's own recitation. They needed reading.

    14 stations · 24.0 min · 349 events · 2805 words · 98 KB

## a station is a clock, and the clock is the poet's

An event boundary here is a place the voice broke — 302 of them, found by
tracking the speech band. That is why the cut list is kept as it is rather than
resampled to a grid. **A grid would be a different film.** The scrub shows every
boundary: dark for a shot, teal for a drawn world, so it stops being a slider and
becomes the film's own cut list.

At any second the line says what MOUSSA is doing:

    01 OUT OF LIFE · 0:34 · P008 POET · TO

Station, time, the shot on screen, and the word being said — underlined amber
while it is still being said, plain once it has passed, because a pause is part
of a recitation and not an absence.

`drawn_share` is not a style number. Where the footage had nothing fresh to say
the poem's own halfworld was drawn instead, so it measures **how thin the archive
is at that station** — 20% at HOT MINUTE, 45% at REUNION.

## the payoff: a socket belongs to a shot

A region drawn on the frame while P073 is up is not a region of "the ground" —
the ground is a different photograph two seconds later. It is keyed to the shot,
so **it comes back every time MOUSSA cuts back**, which is nine times in some
stations. Mark one thing and you have marked every return of it.

## the pack

v1 wrote a vertical PNG strip, n photographs above n masks. Eleven shots came to
16 MB, so 135 would have come to 200 and the pack would have joined the 1.1 GB of
cut-outs in the list of things that exist only on one machine.

**28–68 KB per shot now**, about thirty times smaller, because a photograph
belongs in a photographic codec. Shots with no subject still pack: a ground is
not a failure, it is the other half of a frame — those carry `body: false` and
HELD uses them as plates instead of carriers. The segmenter is only asked about
shots the atlas says have someone in them, which is what keeps this a lunch break
rather than a day.

### the elegant version that lost half the data

The mask went in the **alpha channel** first: one channel instead of three,
half the pixels, no second panel. It was wrong. `drawImage` composites, so
wherever alpha is 0 the source contributes nothing and the canvas keeps
transparent black — **the photograph outside the body is destroyed on load.** The
body carrier never noticed, because it only ever reads inside the mask. The
plate, which needs the whole frame, would have shown a poet floating in nothing.

Two panels cost the same 43 KB at q78 and the mask survives the codec at
**100.00%** agreement after thresholding, measured on a real sheet. Elegance that
loses half the data is not elegance.

## the warning that fired on the healthy case

The pack's first trust signal reported every frame where the mass check
disagreed with image-up. On the eleven-shot sample that was 33% and looked like
useful ignorance. Across all **2,040 bodied frames it is 69%** — and, worse, it
fires on **78% of the frames whose axis is actually upright**.

    disputed frames    cover 0.18   axis tilt 14 deg
    undisputed frames  cover 0.32   axis tilt 36 deg

It was flagging the good frames. Disagreement is the normal, expected condition
for a figure cropped at the hip: the torso outweighs the head every time. A
warning that fires on the healthy case is not a warning.

What is worth testing is whether the axis is a **plausible head-to-foot line at
all**. The poet is upright in all 135 shots, so that line should be near
vertical; a mask whose principal axis lies far off it is not a standing body seen
badly, it is a fragment or a mask that leaked sideways into the room.

    axis within 25 deg of vertical            1606 / 2040   79%
    ...and carrying more than 10% of the frame 1268 / 2040   62%

**62%** is the number the tool shows now. `agrees` is still recorded, because it
is a real measurement of a real thing — it is just not evidence of damage.

Shot scale does not predict any of this (MS 75%, WS 72%, CU 46%). Cover does.

## the frame, and why the aspect was wrong

The cell grid was `min(W,H)/112` spread over the whole window — a number with no
relation to anything. **The field this entire archive is drawn on is 192x144**:
MOUSSA's law, the halfworlds' law, the beflix dot law, all of it. So a shot
arriving as 192x144 was being resampled onto a grid of some other size, and one
of its cells landed across two of ours or half of one. The dots were never the
film's.

The field is real now: 192x144 centred in the window with a visible border, and
the paper around it is the paper the film is printed on. Every mapping became a
cell lookup instead of an aspect calculation, because there is no longer an
aspect to reconcile — `plateAt` is one array index.

Cell size took three tries. Whole CSS pixels put a **192px postage stamp** in the
middle of a phone, because 359px is 1.87 cells across and flooring that gives 1.
Whole device pixels was better and still threw away a fifth of the width. The
marks are `arc()` discs, which antialias, so the whole-number argument was
solving a problem this renderer does not have. **Exact** uses all of it.

## pieces: separating, modifying, collaging

Everything HELD could put on the field was **bound**. A socket is a hole in a
surface and it goes where the surface goes; there was no way to take a thing out
and put it somewhere else.

A **piece** is the other kind of thing: a cut-out with its own position, size,
turn and blend, owing nothing to any carrier. And the separation was already
done — SAM cut 2,033 elements out of these shots and every one remembers which
shot it came from, so *what is this frame made of* is a filter, not a new pass:

    P008 is made of 10 — a person, three windows, two walls, a bed, two skies

`parts` lists them; tapping one lifts it out. Position is in **field cells**, so
a piece at 96,72 is at the middle of the field at every window size. Drag to
move, corner to size, stalk to turn, and the keys are the precision a lasso can
never have:

    arrows  one cell        shift-arrows  ten
    [ ]     one degree      shift          fifteen
    - =     size            f  flip        h  screened / photographic
    b       blend           o  opacity     delete

`h` decides whether the piece joins the film or sits on it: screened, it is
reported as tone in the field's own law; photographic, it blends as itself.

The clock **stops** while a piece is in hand. Composing against a frame that
changes under you is not composing, and the cut you are working on is the one
you stopped at.

## what is still missing

The station plays the drawn worlds and the shots, but not the songs — the audio
is in `MOUSSA_*_SOUND.m4a` beside films too large to ship. A shot event can be
longer than the two seconds packed, so a long hold freezes on its last frame
rather than playing out. And a socket on a shot's **body** (rather than its
frame) is not keyed per shot yet, so it does not yet come back with the cut.
