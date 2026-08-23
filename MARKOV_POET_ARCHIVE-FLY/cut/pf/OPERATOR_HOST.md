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

## not done

The stamp has no handles — position and size are sliders, not a drag on the
board. OPERATOR's own drawing tools are pointer-driven and this should be too.

The tracked body masks are packed and unused here: a stamp could be masked to
the poet alone rather than to the cut-out's alpha, which is a different and
better isolation for the 85 shots that have one.
