# The quad — scale, rotation and warp as one thing

A patch used to be placed with `{x, y, size}`: a centre and a width. That can be
moved and it can be made bigger, and nothing else. You could not turn a figure.
You could not lean a window to match a wall. And there was nowhere for a control
point to write, because **a control point is a corner** and there were no
corners — only a centre.

So a placement is four corners now, `TL TR BR BL`, in field coordinates:

    place.quad = [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]

- **Scale** is dragging one corner outward.
- **Rotation** is the four of them turning together.
- **Warp** is one corner leaving the plane of the others — which no affine
  transform can express and a projective one can.
- **Binding** is those same corners carried by somebody else's motion.

`{x, y, size}` still works and still means what it meant: when no quad is
stored, one is derived from the centre, the size and the image's aspect. Nothing
already authored has to change, and the first time you touch a layer's corners
the quad is materialised from what was already there.

## How the stamp works

`quadMatrix` builds Heckbert's mapping from the unit square onto the quad and
returns its **inverse**, because the stamp walks destination pixels and asks
where each one came from. For every cell in the quad's bounding box it maps
`(x+0.5, y+0.5)` back to `(u,v)`, discards anything outside the unit square,
samples the source, and applies the same per-piece 3rd–97th-percentile
luminance stretch the old stamp used — so a warped piece has exactly the tonal
behaviour of an unwarped one. Sampling is nearest-neighbour, which is not a
compromise here: the field is 192×144 and every value lands on one of eight
ordered-dither levels, so interpolating before quantising would buy nothing.

The source pixels are read once per image into a small cache. A warp samples
tens of thousands of times and `getImageData` per sample would be absurd.

A mosaic inherits the corners: each tile is the same quad moved and rescaled
about its own centre, so **a warped patch tiles warped**.

## Control points

Four corner handles and a centre, drawn on the board when a placeable layer is
selected. Only those five small spots take the pointer — everywhere else the pen
still draws, because a selected layer must not turn the canvas into a dead
surface. Drawing over what you placed is half of collage.

The hit box is measured in **screen** pixels, not field cells, so the target
stays the same size whatever the zoom. A hit box measured in cells is a hit box
that disappears when the board is small.

Two things this got wrong first:

- **Selecting a layer did not repaint the board**, so the corners of the thing
  you had just selected were not on it. Nothing else in the selection path
  touches the canvas; the wrapper now repaints when `PSEL` changes.
- **The gesture committed nothing on a fast drag** — the same defect the span
  grip had. Both the move and the release run through one `qdragTo`.
