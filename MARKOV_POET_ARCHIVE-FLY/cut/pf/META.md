# The meta collage

Everything we had made combined by **averaging**. Elements laid over one another,
result soft: the poem-fields dissolve, the type-composites blur into weather,
GRID_ALL scatters. That is one way to put images together, and after 107 of them
it was the only look we had.

A cut-paper collage does the opposite. It **commits**. Every patch has a hard
torn edge, sits at a declared depth, and does not blend with its neighbour — the
seam is the point. So this makes that, out of what we already made:

```
SKY       a wash, plus torn patches of the sky and water composites
SKYLINE   blocks torn from the building and window composites
STREET    a run of small rectangles, the rowhouse register
HERO      one large figure — a real archive silhouette — filled with that
          poem's own collage, so the body is made of its poem
THOUGHT   a cloud over the head, filled with water
FRAME     cream margin, title in the foot
```

## Three things do the work, and none of them is compositing

**1. The value ladder.** Sky light, city middle, ground darker, figure darkest.
This is the whole poster: it is why you can read one as a thumbnail, and it is
what our averaged fields never had. Each register gets its own hue *and* its own
band of lightness; the patch's own detail survives only as variation inside that
band.

**2. Torn edges.** Every patch boundary is perturbed by low-frequency 1-D noise
before use, so nothing has a machine edge.

**3. A visible seam.** Each patch is outlined in a darkened version of its own
colour. Removing that line is the fastest way to watch the image collapse back
into looking like a composite.

## Four things this got wrong first, and what each taught

**The hue came from the wrong pixels.** Taking the most *common* colours meant
taking near-greys whose hue is numerical noise; amplifying that noise turned a
pale-blue poem magenta. The hue now comes from the most *saturated* tenth — the
part of the image with a colour opinion — and the scheme is built analogously
around it with exactly one loud accent.

**One shared palette produced pink mush.** Correct colours, no picture, because
without registers there is no ladder. Splitting the palette into named roles with
fixed lightness was the fix.

**Sorting figures by area sorted them by width.** The thumbnails are height-capped
at 256, so every candidate reports the same height and "largest" silently means
"widest" — which selects the least figure-like blob in the set. Candidates are
now scored on shape: a standing person is about 0.42 wide for its height and its
mask fills roughly 45% of its box, because a body has gaps between its limbs and
a blob does not.

**The figure disappeared into the floor.** It was dark, but so was the ground.
The ground moved up the ladder and the figure was given a narrow band well below
it: on a value ladder the figure has to own the bottom rung alone.

## What is still weak

All fourteen share **one composition**. The palette, the figure, the material and
the tearing all differ, but the layout does not — the reference poster has a
specific composition, and this has a template. Composition variation is the next
thing, not more colour work.

```bash
python3 cut/pf/meta.py         # all fourteen + CONTACT.png
python3 cut/pf/meta.py 06      # one
```
