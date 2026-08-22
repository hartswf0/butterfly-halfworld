# PATCHFIELD · STEP A — the document, before any UI

    python3 render.py c01.json

Nothing here opens a window. That is the point.

Every tool this session produced was a terminal: the Composer holds its layers in
browser memory, `dress.py` in a Python dict, `glass.html` saves pixels and forgets
the mesh. None of them can be operated by both a person and an agent, none of them
accumulates, and none of them can say what it does not know.

Step A asks one question. **Can a composition be authored by writing JSON and
nothing else?** If yes, an interface is a *view* over this file rather than the
place the work lives, and invariant J5 — both operators have identical power —
is satisfiable. If no, no interface rescues it.

`c01.json` and `c02.json` were typed. Both render.

## the schema, entire

```json
{ "piles": {...}, "nodes": [ {"id":..., "op":..., "in":[...], "params":{...}} ] }
```

Four value types and that is the whole type system: `ROWS` (pile rows, named not
copied) · `RIG` (a persistent surface) · `LAYER` (rgb, alpha, depth, tag) ·
`FILE`.

## the ops

| op | what it is |
|---|---|
| `pile.select` | a rule over an append-only measurement. Never copies. Re-render against a grown pile and the composition picks up new elements. |
| `carrier.rig` | the halfworld's own `solve()`, over the bridge. The rig is not reimplemented in Python — a second rig would drift from the first. |
| `skin.assign` | photographs to sockets *by rule* (`{"p":"a wall","nth":1}`), not by hand-list |
| `dress` | for each cell the figure occupies, ask the chart what body coordinate it is and sample the photograph there. The dots move; the sample does not. |
| `plate` | a ground: flat colour, or an archive cutout |
| `aperture` | **the node type everything else was missing** — see below |
| `stack` | depth is the argument, not list order. Layers sort by their own depth and haze toward the paper, so *behind* is an amount of atmosphere. |
| `mortar` | BEFLIX where the collage could not reach, and the amber scar at the seam |
| `output` | a frame |

## the aperture

Until now a mark was either **figure** (it carries a photograph) or **mortar** (it
covers a failure). Both are things the dots *are*. But a halftone laid over a
street is neither — the dots are a **hole**. One image is the aperture, a second
is seen through it, a third fills between, and the marks belong to no image at
all. Nothing already built could express that, which is why it is here.

Its first render opened 0.39% of the frame. The map said so before I looked, and
the diagnosis was in the op, not the document: a screen is not a picture, so which
end opens (`polarity`) and whether its own contrast is used rather than its
absolute brightness (`stretch`) are properties of the composition. With those,
49.4%.

## the ignorance map

> `total strain 2.527 over 19 metrics · 4 exceeded`

Every node reports a Metric it **computed**, never one it was told (J2). Each
carries `worse` (which direction is bad) and `scale` (what one full unit of
badness *is* in its own units), so all of them land on one axis: **distance past
its own threshold.**

The scale is not decoration. Without it, `dropped_by_limit = 1133` against a
threshold of 0 reported strain 1133 next to a coverage metric reporting 0.97, and
the map became a chart of which metric happened to use the largest numbers.

Strain is deliberately **not clamped**. 3.0 has to be able to say *three times*.

`c02.json` puts a figure at h=18 on purpose. The map:

```
far    below_rig_floor  1      1 of 1 figures at h<22 use drawSmall,
                               which the chart does not model (step0 measured 78.7%)
bodyF  mortar_share     0.5    cells the collage could not reach
bodyF  coverage         0.5    62 painted, 62 mortar
far    nameable         0.726  share of drawn cells with a (bone,u,v)
```

It found the defect, traced it two nodes downstream to its consequence, and
**rendered anyway**. Ignorance is an output, not an error (J4). Nothing is
silently dropped — every cap is a line with a number on it (J7).

The resolver does four things and refuses a fifth: sort the graph (a cycle is an
error, not a fixpoint), run each node once, collect the ledger, print the map. It
does not choose parameters, retry, or improve anything. A node at strain 0.7 stays
at 0.7 and says so.

## what Step A does not have

No clock — the `clocks` key is unused, so there is no chronocollage and invariant
I5 is untested. No sequences: one document is one frame. No mesh nodes or
corrective keyframes, so the carrier is still the bottleneck. And `skin.assign`
picks by score, which is not the same as picking by *fit*.

## the two tracks, made to meet

PASTE (`cut/out/paste/index.html`) emits a **flat layer list**. PATCHFIELD
resolves a **graph**. Neither could read the other, which quietly falsified J5:
two operators with different powers over different documents is exactly the
situation the invariant forbids.

    python3 fromrecipe.py paste-recipe.json crossed.json && python3 render.py crossed.json
    2 placed · 0 dropped · 1 lost their screen (a person P006)

The conversion is **one-way on purpose**. A recipe is a graph with no branches —
every layer a leaf feeding one stack. Going back would mean discarding the
carriers, apertures and metrics only the graph can hold, so `place` nodes
round-trip and nothing else does.

Crossing it required a new op. `plate` can only fill the frame, which is why c01
and c02 are both one subject against one wall: **there was no way to say *this,
here, this big***. Every collage in this repo needed that and every one of them
got it by hand-editing a Python file. `place` is the op the flat recipe already
had and the graph did not.

What does not cross, reported rather than hidden:

- **halftoned layers cross unscreened.** `place` has no screen; only `aperture`
  does, and an aperture needs three inputs where a recipe gives one.
- **depth-blur does not cross.** The graph hazes by depth but does not defocus.
- **pasted pixels do not cross.** A screenshot lives as a data URL in the recipe;
  the graph names elements in a pile and has nowhere to put loose pixels.
- **depth-scale is baked into `w`/`h` by the converter**, not added to `stack` —
  the converter's job is to preserve what you saw, and changing depth's meaning
  in the graph would silently restate c01 and c02.

`place` first reported `cropped_away = -0.0096`. A negative share is not a near
miss, it is the wrong measurement: counting alpha pixels before and after a
linear warp is meaningless because upscaling *invents* alpha at every edge. A
placement is an affine map of a rectangle, so the rectangle is clipped instead —
exact, and indifferent to interpolation. It now reads 0 in frame and 0.38 when
38% hangs off it. J2 says a node reports a metric it computed; it does not
excuse computing the wrong one.
