# OPERATOR is the host

    cut/out/op/index.html
    cut/out/op/index.html?strip=strips/01-out-of-life-BEATKILLER.twinstrip&mp3=audio/unified-drones.mp3

HELD was the wrong thing to build on. It held two seconds of one shot, its
compositor was a lasso and a socket, and every capability it needed — a strip, a
tree, branches, a vault, an exporter — I would have had to write badly.
**OPERATOR-14 already has all of it**, so the archive moves in rather than the
other way round.

What was already here, and is now reachable from the archive:

- a **frame tree**, not a list, so branches are native
- **lazy grids** behind a 128-slot LRU — nodes carry commands, not pixels, which
  is what makes 984 frames weigh nothing
- a **recycled strip** with a bounded pool over any film length
- a **thumb atlas**, one offscreen canvas, repainted only when a node's rev moves
- a **vault** — IndexedDB film, audio and edit journal; reload is free and offline
- **streaming** twinstrip, MP4/WEBM export, EDL, a peer mesh

## the fourth source

The Lens films what is in front of you; FILE loads what you hand it. Neither can
reach what was **already filmed**. The Archive drawer adds that: 2,033 pieces cut
from 135 shots, and 85 of those shots with the poet's body tracked through them.

Nothing here invents a new kind of object.

    a piece  -> stampCmds()   -> draw(lines)        one frame
    a shot   -> grids         -> appendSequence()   a run of frames

From that moment they are ordinary nodes. They branch, they journal, they blit
from the atlas, they export. **That is the whole point of building on this and
not beside it** — the tool I was writing had none of those and would have needed
all of them.

## two conversions, both decisions

**Tone, not edges.** `gridFromSource` runs `edgeGrid`, which is right for a
camera feed — a face on the least network is carried by its outlines. A cut-out
is already isolated, so what it has to give is its **modelling**; an edge pass
would throw that away and hand back an outline of a shape you can already see.
A stamp quantises luminance to the eight levels directly.

**Its own range, not the absolute one.** A night shot mapped by absolute
luminance comes back a black rectangle — the same lesson MOUSSA learned when a
flat dark coat and the wall behind it typed as the same nothing. Each piece is
stretched to its own 3rd–97th percentile first.

## verified

- drawer opens, index streams: **2,033 pieces**, sixteen nouns
- `P006_a-person_0` stamped into the current frame at 70 cells — the coat heavy,
  the face modelled, in OPERATOR's own board and OPERATOR's own eight levels
- shot `P006` streamed in at 10 frames: strip went **1 → 11 cells**, one run of
  nodes via `appendSequence`
- the remote film loads into this copy unchanged: `LOCAL 1/984 · LOCAL BRANCH`,
  24.8 MB record fetched and vaulted

A bare `strips/x.twinstrip` resolves back to the OP-51 site, because this copy
sits beside the archive rather than beside the strips and every existing link
uses the bare form.

## the halfworld, taken apart by name

Confirmed, and it is better than I expected. The drawn worlds are not pictures,
they are **programs**, and the runtime tags every cell it inks with the part that
drew it. One frame of RESURRECTING ATLANTIS at 49.6s:

    7 parts · clipLine 777 · waterBelow 726 · windows 653 · movement 603
              building 271 · gate 144 · facewindow 98
    3272 inked · 3272 tagged · lossless

**Nothing unassigned.** So a world can be stamped by name — the water and the
building without the windows, the gate without the movement — which is a kind of
access no amount of work on a photograph will ever give. 20 worlds, 109 parts.

### the grids do not match

A halfworld is 192×144 and OPERATOR is 128×96: both 4:3, ratio exactly 1.5, so
each cell here covers a cell and a half there. Averaging dissolves single-cell
marks and these worlds are largely made of them, so the default is **max** over
the covered rect — a mark survives at the cost of thickening. `mid` is there for
parts that are washes rather than lines.

### a bug the integration exposed

The first scan reported a part called **`hwScan`** — my own function's name. The
engine derives a part name by walking the stack for the first frame not on a
denylist, and a denylist cannot know about a caller it has never met. Worse, the
pattern captured only the first token of a dotted frame, so `rt.renderScene(…)`
read as `Object`, got skipped as noise, and the walk went straight past the
render boundary into whoever asked for it.

Fixed at the boundary rather than by adding another name to the list: the walk
**stops** at `renderScene`/`renderTagged`/`renderField`, because everything below
those frames is the caller and not the drawing. Verified from a caller named
`hwScan`: `movement 603`, still 3272 = 3272.

## placing: drop it and drag it

Stamping by slider is remote control, not authoring — type an X, type a Y, press,
look, adjust, press again. The rest of this tool is pointer-driven.

Drop an image on the board, or drag a piece out of the Archive, and it becomes
**pending**: drag to move, wheel or ± to size, PLACE to commit. What you see
while dragging is the real quantisation — the same `stampGrid()` that will be
written — because a preview prettier than the result is a lie you find out about
after you press the button. Nothing touches the node until PLACE, so a placement
can be abandoned without an undo.

Paste works, and on a touch screen a tap sends the piece straight to the middle
of the board to be moved with a finger, since there is no drag there.

## a crash in the atlas

`atlasDrop` deleted a map entry without returning its **slot**, while `atlasUsed`
only ever counted up. After 128 slots had been handed out and edits emptied the
map, the allocator took the eviction branch, scanned an empty map and
dereferenced null. A free list closes the invariant — a slot is in the map or on
the list and never lost between them — with a fallback so it can never
dereference null again.

## not done

The stamp has no handles — position and size are sliders, not a drag on the
board. OPERATOR's own drawing tools are pointer-driven and this should be too.

The tracked body masks are packed and unused here: a stamp could be masked to
the poet alone rather than to the cut-out's alpha, which is a different and
better isolation for the 85 shots that have one.
