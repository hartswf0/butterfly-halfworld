# One language for the pictures and the city

The 100 views were never taken anywhere. "Where was this taken from" means: the standing point, height, heading, pitch and lens in the city from which the city's own layout best explains the picture. After that, the city changes, in its own vocabulary (buildings, structures, water, planting, lamps, surfaces), until it agrees. The photo is never stretched over the world.

That needs a language that a photograph and a rendered frame can both be read into, and in which they can be compared fairly. It has layers. Each layer is read from the photograph by a model and from the city exactly.

| layer | the photograph | the city | status |
|---|---|---|---|
| L0 the prompt: what made the picture | the Midjourney prompt in each PNG → `prompt_read.py`: lens → field of view, vantage → height and pitch, subjects, atmosphere, siblings | the pose's lens, height, pitch | built; priors in the search |
| L1 classes: sky, facade, roof, ground, water, planting, structure, rock, figure, vehicle | mask2former panoptic → `lang.py` | `engine.semBatch` (mesh → class) | built, checked by eye |
| L2 depth: how far each pixel is | Depth Anything V2 Small → `depth.py` | the depth buffer, exact | built, compared by rank |
| L3 camera geometry: horizon, vanishing point, lens | sky/ground boundary, Hough lines → `lang.py` | exact from the pose | photo side built; not yet used as a constraint |
| L4 boundaries: where one thing ends and the next begins | class and depth discontinuities | class and depth discontinuities | built (chamfer) |
| L5 light: the emitters and their colours | bright, saturated, not sky → `lang.py` | lamps, neon, lit windows | photo side built |
| L6 material: brick, rust, glass, concrete per region | CLIP on segment crops vs the material library | the material each surface wears | next |
| L7 meaning: what the whole frame is of | CLIP, BLIP caption → `eye_server.py` | CLIP, BLIP caption | a report and an edit list, never the judge |

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

## The eye (`eye_server.py`, port 8232)

So the search can see for itself instead of a person looking at every frame. `/likeness`: both readings drawn as the same kind of picture (class colour × nearness) and compared patch by patch by DINOv2; 20% of the fitness. `/describe`: BLIP's caption and CLIP's nearest words from the archive's vocabulary, for the photograph and the found frame.

## Results, all 100 (`../poses.html`)

- Every view beats the 95th percentile of random poses; 52 pick their own view first of 100, 88 are in the top 5.
- Only 19 land in their own scene-book district: the city explains most views better somewhere else.
- Against the pilot without the eye, own-view rank went from 7 to 8 of 8 first and the window and sign close-ups went away, but CLIP likeness stayed at 0.41. The found frames keep reading as "a city at night", "a clock tower": that is the city's whole vocabulary.
- 8 views still cheat with a perfect one-class match (3, 10, 34, 67, 70, 82, 83, 99).
- What the references show that no found frame does, counted: fog 21, rain 18, mist 17, a tunnel 16, blue light 16, reflections in water 15, a marketplace 12, a bridge 11, neon 10, stairs 9, fire escapes 8, chandeliers 8, a lit pier 8. The search has run out of city, not of search; this is the edit list's first draft.

## L0: the prompt (`prompt_read.py`)

Every view is a Midjourney image and still carries its full prompt. Read as a shot list it gives the camera body and lens (66 of 100: a field of view, not a guess), the vantage (58: platform level, aerial view, beneath an overpass, from a rooftop), the place nouns (stairwell, stacked air conditioners, underpass, canal), and the atmosphere (haze, smoke, neon). The prompts are poems, so only camera phrasing counts: 'drone' is often a machine in the scene, 'beneath' a metaphor, 'from above' where the light comes from.

It also gives **siblings**: 100 views come from 81 prompts, and views made from one prompt are one place shot as different takes. Before the prompt was used, siblings were placed a median 2.2 km apart (none within 100 m); views 1–4, "shot from platform level", were all found at street height; the found lens missed the prompt's by a median 16.5°.

In the search: the prompt's lens is the lens hypothesis (σ 3° in the evolution); the vantage is a soft prior on height and pitch; the fitness is the picture score × (0.5 + 0.5 × prior), so the picture still decides. The class term is weighted by how much the reading carries (class entropy), so a one-class reading is placed by depth, boundaries and DINO instead of cheating. Then the best-placed sibling anchors its group, and the others are searched again around it at any heading.

Results with the prompt (all 100, `.work/pose-prompt`, published in `../poses.html`); before → after:
- one-class cheats 8 → 1; lens error 16.6° → 0.6°; height by vantage now follows the prompt (platform level 1.7 → 12.6 m, aerial 2.4 → 72 m, high 15 → 32 m)
- siblings within 150 m of each other: 0 of 26 pairs → 26 of 26
- own view first 52 → 45, top 5 88 → 79; CLIP likeness 0.403 → 0.409. The poses now agree with how the pictures were made, and the picture-match drops where the city has nothing at that height: no platform where the haze views stand, no deck to be beneath. That drop is the edit list, located.

## One map of places (`places.py` → `../places.json`)

166 places already in plan space (city3d landmarks, Lynch districts, plazas, poem sites; iconic's 89 Lynch elements; language's palettes) and 767 placed canon shots with their CLIP rows, each given to a scene-book district, and per district what its prompts ask for and what it already has. Position against meaning: the canon shots inside a district's ring rank first or second of 12 for its views' CLIP in hive, bay, naraka, ascent, plaza, arcade; not in overseer, commons, temple, ankhu, cenotaph, haze. Cenotaph and temple have none of their 25 best-matching canon shots inside their rings; hive, overseer and ankhu all point at the one tower cluster by the Severn (2028, 2371).
