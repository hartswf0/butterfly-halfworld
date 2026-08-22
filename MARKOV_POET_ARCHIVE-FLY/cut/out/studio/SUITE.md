# THE SUITE — what each reference actually requires

Reverse-engineered from the eight boards. Every one is the same library through a
different *multiplier*. Nothing here is a filter; each is an operation that turns
one placed element into a structure.

## A. SOURCES — things that make a layer
| # | source | produces |
|---|---|---|
| A1 | **element** | one of 2,033 SAM cut-outs, RGBA |
| A2 | **world ink** | a halfworld's field at time *t*, transparent paper |
| A3 | **world figure** | ONE drawn body, cut by its own tag, at its own footing |
| A4 | **sky** | gradient, or a photographic `the sky` element stretched |
| A5 | **flat shape** | rect / bar / line in accent — the blue railing in ref 4 |
| A6 | **title bar** | the rule + label of refs 2, 5, 6 |
| A7 | **underlay** | schematic grid / noise, the technical wash under ref 2 |

## B. TREATMENTS — per layer, non-destructive
`move · scale · stretch · rotate · flip · opacity`
`halftone(cell, mode: keep-colour | ink | accent)` · `glow(radius, colour)`
`silhouette(host)` — clip this layer to another layer's alpha
`dither-edge` — the ragged pixel margins of refs 1 and 7

## C. MULTIPLIERS — one layer becomes many. **This is what was missing.**
| # | multiplier | control | makes |
|---|---|---|---|
| C1 | **ROW** | count, gap | a fence, a colonnade |
| C2 | **GRID** | cols, rows, gap | the facade of ref 6 |
| C3 | **PATH** | count, vanishing point, depth-scale, jitter | the causeway crowd, refs 1 & 8 |
| C4 | **SCATTER** | count, box, rotation spread, flow angle | the falling bodies of ref 2 |
| C5 | **ATTACH** | host layer, count, cling | climbers on the tower, ref 5 |
| C6 | **TIME-ARRAY** | world, N, t0..t1 | ref 6's *334 frames of figures* — each cell a **different moment** |

C6 is the one that reframes the whole thing: a multiplier whose axis is TIME, so
a grid of cells is a filmstrip laid out as architecture.

## D. COMPOSITION AIDS
`horizon` (shared y) · `vanishing point` (shared, so every PATH agrees) ·
`depth-sort` (draw order by foot y, automatic) · `panel split` · `callout`
(leader + label + thumbnail — the MAPPING panel of ref 3)

## E. OUTPUT
`PNG` · `frame sequence` (drive any time-bound source across a range) ·
`recipe` — save the *operations*, never the pixels, so a composition is
reproducible and re-renderable at any size

## THE EIGHT BOARDS, AS RECIPES
1. **causeway crowd** — A4 sky · A1 skyline ×C1 + halftone · A1 person ×C3(p=0.85) + depth-sort
2. **THE FALL** — A7 underlay · A1 `a person in mid-air` ×C4(rot ±40°, flow 25°) + halftone(ink) · A6
3. **the editor** — three panels; C5 explode + D callout
4. **street** — A1 buildings ×C1 + halftone · A5 bar · A1 person ×C1 on horizon
5. **TOWER ASCENT** — A1 building (tall, halftone) · A1 person ×C5(attach) · one +glow · A6
6. **INHABITED FACADE** — A1 window ×C2(grid) · A3 figure ×**C6 time-array** · A1 person ×C1 · A6
7. **floating city** — A4 photographic sky · A1 masses + dither-edge · A3 figures + glow
8. **procession** — as 1, plus glow per figure and perspective guides
