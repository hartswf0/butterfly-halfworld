# One language for the pictures and the city

The 100 views were never taken anywhere. "Where was this taken from" means: the standing point, height, heading, pitch and lens in the city from which the city's own layout best explains the picture. After that, the city changes, in its own vocabulary (buildings, structures, water, planting, lamps, surfaces), until it agrees. The photo is never stretched over the world.

That needs a language that a photograph and a rendered frame can both be read into, and in which they can be compared fairly. It has layers. Each layer is read from the photograph by a model and from the city exactly.

| layer | the photograph | the city | status |
|---|---|---|---|
| L1 classes: sky, facade, roof, ground, water, planting, structure, rock, figure, vehicle | mask2former panoptic → `lang.py` | `engine.semBatch` (mesh → class) | built, checked by eye |
| L2 depth: how far each pixel is | needs a depth model (none on this machine) | the depth buffer, exact | city side built |
| L3 camera geometry: horizon, vanishing point, lens | sky/ground boundary, Hough lines → `lang.py` | exact from the pose | photo side built; not yet used as a constraint |
| L4 boundaries: where one thing ends and the next begins | segment edges plus strong image edges | class and depth discontinuities | next |
| L5 light: the emitters and their colours | bright, saturated, not sky → `lang.py` | lamps, neon, lit windows | photo side built |
| L6 material: brick, rust, glass, concrete per region | CLIP on segment crops vs the material library | the material each surface wears | next |
| L7 meaning: what the whole frame is of | CLIP | CLIP | a tie-breaker, never the judge |

## The search (`moviemap/tools/posefind.html`, `posefind-run.mjs`)

1. **Where a body can stand:** every street of the plan every 30 m, 2,000 rooftops, 600 high points; 8 headings × 3 pitches.
2. **The index:** 237,792 frames in L1 at 64×36, scored in the page against every view under the view's own lens and horizon hypotheses. 12 minutes; 16,383 frames rejected for standing inside a wall.
3. **Evolution:** a (μ, λ) evolution strategy over (x, y, height, heading, pitch, lens) from each view's 8 most different good candidates, on the full 96×54 grid.
4. **Checks:** the found frame against all 100 views (does it pick its own?), and against random poses (the null).

## What failed, and why: the first run stopped after 3 views

L1 alone can be cheated by a close-up. View 3 reads as all "structure", and the search pressed the camera into a bus-shelter roof for a perfect 1.00. View 2 filled the frame with the side of a shelter. View 1 matched the undercroft's layout with a street sign. Its own-view rank was 1 in all three, so that check is not enough either.

## What stops the cheating

- **Depth (L2):** a reference's near/far structure has to match the frame's. A shelter at 1 m cannot pass for a deck spanning 5–100 m. This needs a monocular depth model for the photographs.
- **Boundaries (L4):** many columns receding versus one sign: an edge-structure distance (chamfer) between the two boundary maps.
- **Geometry (L3):** the vanishing point and horizon become hard constraints on pitch, heading and lens, not just a starting guess.
- **Information:** a reading that is ≥ 85% one class carries no place, and it is reported as *not placeable in this language*, never scored.
- **Scale prior:** the share of the frame nearer than 3 m is bounded by what the reference's depth says.

Only after poses pass these does the second half start: the residual in each layer becomes an edit list for the city (a facade where the picture has one, water where it has water, lamps where it has light), the edits are applied with the city's own parts, and the frame is read again.
