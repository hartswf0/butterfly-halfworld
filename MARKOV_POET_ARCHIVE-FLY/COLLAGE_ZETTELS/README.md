# The collage zettels

**107 collage images, each with the film it is asking for.**

Open `index.html`. Every image sits beside its own zettel, in the CINEOSIS
schema, with a text-to-cinema prompt written for that image and no other.

## How the signs were assigned

Each zettel is filed against one of Deamer's forty-four signs. Not decoratively —
the sign names the operation the image is **already performing**, and the
assignment is an argument that can be wrong.

- `GRID_ALL` lays 2,033 elements at uniform scale with no foreground, so it is
  **gaseous perception**.
- `type_a-human-face` stacks 99 faces until one at the edge survives unmerged and
  carries the affect, so it is **dividual**.
- The `quilt` rebuilds three bodies entirely out of the archive they came from,
  so it is **imprint** — the world made durable inside a character.
- The `cutsheet`s put the city on a diagram with their own confidence scores
  composited into the frame, so they are **cinema of the brain**.
- The `scene` pairs — photographic plate and beflix dot field — are **limpid and
  opaque**, because which one counts as the original depends entirely on what you
  intend to do next.

## The Lucier finding

`cut/lucier.py` segments an image, rebuilds it from its own parts, and repeats.
Laid out in order, the nine generations walk Deamer's perception series — and
nobody chose that order:

| g0–g1 | solid perception | a centre, and a world arranged around it |
| g2–g3 | liquid perception | the centre transfers between the three figures |
| g4–g5 | gaseous perception | no centre; three presences implied by arrangement alone |
| g6 | demark | readable only against the generation before it |
| g7 | powers of the false | forms appear that were never in the source |
| g8 | lectosign | nothing to see, something to read |

Stated as an argument, not a result: generation loss is a property of the
instrument, so the ladder may be a portrait of the segmenter rather than of
perception. The control that would settle it — the same recursion under a
different segmenter — has not been run.

## Where the honesty is

Every zettel keeps its `TENSION`, `MISSING` and `BOUNDARY` fields filled with the
actual objection to its own reading. Several say plainly that the image could be
style rather than sign: a field of lights on black is beautiful by default; a
settings chart is instructional by intent; a photomosaic is a technique with its
own history. The `TEST` field in each is a thing you could actually run.

## Rebuilding

    python3 cut/pf/zettels.py

Zettels are hand-authored markdown with front matter in `zettels/`. The script
only reads the directory and renders, so adding a zettel is adding a file.
