# The canvas answers

## Why "I still cannot add a whole film" survived being built three times

The gallery that offers the fourteen only appeared on an **empty** frame. Put
anything down and it vanished; come back to a saved film and it was never there
at all. Everything else — layers in a rail, a poem behind a mode tab and a
disclosure, blending nowhere — lived somewhere other than the picture.

So the picture itself answers now. **Right-click it, or hold it**, anywhere, on
any frame, empty or not:

    FRAME · CELL 69,87 · 1 LAYER
    Pick what is here          take this thing out by name or by shape
    ── PUT IN ──
    A whole poem…              its drawn film, its filmed shots, or both
    A piece from the archive…  2,033 cut from 135 shots
    ── LAYERS · TOP FIRST ──
    ◈ NEW DAY                  over
    ── THE NEW DAY ──
    Blend…                     how it meets what is under it
    More…                      duplicate, hide, reorder, bind, delete

`A whole poem…` opens the fourteen with their shot counts, and each one offers
the drawn film, the filmed shots, both, or just this moment. It is the same
routing `poems.json` carries and the same streamers — reachable from the thing
you are working on instead of from a panel three gestures away.

### Two bugs the right button was hiding

Neither the pen nor Pick checked **which button** went down, so a right-click on
the canvas opened the menu *and* laid a dot of ink under it, or cleared the
selection. Both decline anything but the primary button now.

And the pen's first mark used to land the instant the pointer went down, so
holding the canvas to open a menu inked a dot before the menu appeared. The
first mark now waits: a tap still makes a dot on the way up, a drag still starts
where it started, and a hold that becomes a menu marks nothing.

### The film now appears while it is being made

A six-hundred-frame span is about two and a half minutes, and the strip stayed
at `1/1` for all of it — the only evidence anything was happening was a progress
bar, and the honest conclusion from watching that is that it failed. The strip
re-renders every sixteen frames now, so the film grows in front of you.

## Blending, in ink

Layers only ever covered each other. Whatever was on top won every cell it
touched, which is one way to combine two pictures and not a good one — it is the
only one a stack of opaque cards can do.

This field is not colour, it is **eight weights of ink**, 0 empty to 7 heaviest,
so the blends that belong here are the ones a printer would name:

| | |
|---|---|
| **OVER** | it covers what is under it |
| **BEHIND** | only where nothing is yet |
| **DEEPEN** | adds its weight — burn |
| **LIFT** | takes its weight away — **dodge** |
| **DARKEST** | the heavier of the two |
| **LIGHTEST** | the lighter of the two |
| **DIFFER** | the distance between them |
| **MASK** | keeps what is under it, only here |
| **KNOCK** | takes what is under it away here |

It is one string on the patch, chosen from the layer card or the canvas menu.
`over` still goes down the original path — commands applied straight onto the
stack, so a layer can legitimately paint level 0 and erase what is under it —
and every other mode rasterises the layer by itself first and folds the two
together a cell at a time.

Verified: a pale disc stamped over a temple covers it under OVER, and under LIFT
takes weight out of it instead — the columns show through, dodged.
