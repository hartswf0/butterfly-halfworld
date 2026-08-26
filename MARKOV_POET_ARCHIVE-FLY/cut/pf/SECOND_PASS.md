# The second pass — how to make the work harder to exhaust

## The diagnosis

Every one of the 107 images is **one operation applied uniformly**.

- `GRID_ALL` scatters everything.
- The type-composites stack everything.
- The poem-fields average everything.
- The meta-collages template everything.

That is why they share a look regardless of what they are made of: **the
operation is doing the talking, not the material.** An image made this way is
exhausted in about four seconds, because once you have seen the rule there is
nothing further to find. Nothing rewards a second look because nothing in it was
decided twice.

Six things were missing. Each is now a mechanism, not an intention.

## 1. Passages, not fields

A canvas divided into unequal regions by recursive uneven splits — a dense corner
against a nearly empty half. Not a grid: a grid is a spreadsheet.

**And a region is a bias, not a fence.** The first version clipped each operation
to its own torn rectangle and produced a patchwork of stamps — precisely the grid
the passages were meant to replace. Operations now overflow their bounds by a
third or more, so a passage begins in one place and ends in another.

## 2. Registers of making

Photographic transfer is *one* mark. A surface that holds up has several, and all
of ours are derivable from data we already own:

| register | derived from |
|---|---|
| drawn line | `cv2.findContours` on the segmenter's own masks |
| halftone | the beflix dot law, eight weights, ordered |
| type | the poem's actual line, from the coverage map |
| measurement | leader lines and confidence scores, used as composition |
| erasure | subtraction back to paper |
| wash · stack · field · enlargement | the photographic registers we already had |

## 3. Scale jump

Three elements in a scatter are huge; the rest are crumbs — at least 25:1 inside
a single passage. Everything we made before sat at one scale of fragment, which
is why the eye had nowhere to travel.

## 4. Palimpsest

Built in ordered passes where later passes only partly cover earlier ones, so the
picture shows its own sequence. **A single pass cannot look like a decision
because it never had to survive another one.**

## 5. Local colour

The accent appears in exactly **one** region. A palette applied globally is a
filter; a palette applied locally is a choice.

## 6. One event

Each image gets a focal incident — one register that occurs nowhere else in that
image. Without it there is nothing to look at first, and an image with no first
place to look has no second place either.

## Where the voice actually comes from

Not a style setting. From what each poem's archive **measurably is**:

```
01  1106 elements / 67 shots of one room   PALIMPSEST   superabundance → erasure
02    14 elements / 1 shot                 ENLARGEMENT  poverty → magnification
05   58% one noun                          SATURATION
06   253 elements / 12 shots               DISPERSAL
10   dominated by hands                    GESTURE
11   dominated by windows                  APERTURE
13   dominated by walls                    SURFACE
14   64% one noun, most concentrated       SATURATION
```

Superabundance gets erasure. Poverty gets magnification. A poem whose archive is
mostly hands is composed out of reaching. No two are alike **for a reason**
rather than by seed — which is the only kind of difference that survives being
looked at twice.

## Two things this got wrong, and they are instructive

**Type ate everything.** At a third of a region's height, language became the
loudest thing in eight of fourteen images and they all started to look like the
same poster. A register that always wins is not a register, it is a template. It
is now an incident: one per image, a tenth of a region, allowed to be covered.

**Erasure fogged instead of scraping.** Smooth grain multiplied into a torn mask
produced soft white cauliflower — the one texture in the whole set that looked
like a filter rather than a decision. Thresholded hard, the paper comes back in
flakes.

## The correction: hue is the LAST thing to vary, not the first

The first version of everything above still produced fourteen images that looked
alike, and the reason is worth stating plainly because it is the most common way
generative work fails.

**Structure was identical and only hue changed.** Every image got the same
recursive rectangle split, the same five or six passes, the same full-bleed
coverage, the same torn edge, the same palette *relationship* — five roles at
fixed lightness with an accent at the same saturation. Only the hue differed.

But the eye reads structure long before it reads colour. Fourteen identical
structures in fourteen hues is **one image recoloured fourteen times**, and no
amount of further palette work can fix that, because the palette was never the
problem.

So the things that now differ are the ones that are read first:

| what varies | range |
|---|---|
| **geometry** | eight: quarters · strata · figure · constellation · spine · corner · flood · fold |
| **format** | five: portrait · wide · square · tall · panorama |
| **coverage** | 0.34 to 1.00 — from a sheet mostly untouched to one with no paper left |
| **palette structure** | mono (one hue, value only) · duo (two hues, nothing between) · bleached (near-paper plus one dark) · full |
| **register count** | three to six |
| **mark weight** | scaled inversely with coverage |

That last one matters more than it sounds. When coverage first dropped, the
sparse images went *thin* rather than spare — they read as unfinished. **Sparse is
not thin.** A sheet that is a third touched needs those touches to be emphatic, so
mark weight is now `1 + (1 - coverage) × 1.7`: fewer marks, each much larger.

Two collisions found by looking at the contact sheet rather than the code: three
voices had been assigned the same geometry, which is why three images rhymed; and
one voice's coverage was so low it read as unstarted rather than as restraint.

## What is still missing

Honestly, three things, and none of them is more mechanism:

1. **Nothing is ever wrong on purpose.** Every mark here is placed by a rule that
   is trying to succeed. Work that holds a wall usually contains a passage the
   maker fought with — something overworked, painted out, left ugly and kept.
   There is no mechanism for that, and possibly there cannot be one.
2. **The compositions have no subject.** They have structure, register and
   incident, but nothing in any of them is *about* something the way the man on
   the balcony is about waiting. The meta-collage had a subject and less
   sophistication; this has sophistication and no subject. Those should meet.
3. **Nothing has been rejected.** Fourteen went in and fourteen came out. Making
   forty and keeping six would do more for the work than any further parameter.

```bash
python3 cut/pf/second.py         # all fourteen + CONTACT
python3 cut/pf/second.py 01      # one
```
