# Four things you could not reach

## You could not see what you were adding to

The pads are fixed to the bottom of the screen and were tall enough to cover the
board, and the backdrop dimmed whatever was left. Opening AUTHOR to put a piece
in the frame **hid the frame**. You chose a face for a picture you could not
see, then closed the pad to find out what you had done.

The board is not resized by the pad — it is refitted *above* it. `padFit`
measures the strip of stage still showing, `fitBoard` scales the board into
that, the stage pins it to the top, and the backdrop's top edge moves down to
the stage's bottom so the picture stays at full brightness.

The stage keeps its own height. Shrinking it was the first attempt and it
dragged the whole bottom of the app — toolbar, tab bar — up into the middle of
the pad, because the stage is one item in a flex column and everything under it
moves when it moves. Only the board is refitted.

The pad yields enough room for the board to stay at a size you can judge a
placement by: `max(240px, min(58vh, 100vh - 560px))`. On a short screen the
floor wins and the board goes small rather than the pad becoming unusable.

## A pick had no corners

Pick could take a thing out of the frame by name and then only *slide* it.
WIDEN, LIFT, COPY, CUT — every verb but the one you reach for first, which is
"make it bigger". A layer had four corners and a selection had none, and they
are the same gesture on two kinds of thing.

A pick now carries a quad over its bounding box and shows the same handles. The
reshape samples the **picked cells** instead of an image, inverse-mapping every
destination cell back through the quad into the selection's own box — the
identical projective map the placements use, reading a grid rather than a
photograph. Ownership travels with the cell it came from, so the next pick finds
the thing where it now is. The box and its corners are re-derived after every
LIFT, COPY and WIDEN, because handles left behind by cells that moved are
handles pointing at nothing.

### The event-ordering bug underneath it

The first version cleared the selection the moment you grabbed a corner.
`stopPropagation()` does **not** stop other listeners on the element it fires
from — and Pick listens on the same `board`, in the same phase. So a corner
dragged out over empty ink also reached Pick, which read it as "select what is
under the pointer", found nothing, and cleared the pick the corner belonged to.
`stopImmediatePropagation()` is the one that stops siblings.

That fixes listeners registered *after* the handle code. The **pen** is
registered before it and cannot be stopped at all, so it has to decline the
event itself: it now returns early when a handle is under the pointer. Before
that, every corner grab with the Pen selected also laid a dot of ink at the
grab point.

The click that follows a drag is swallowed too, and the swallow is cleared by
the click it eats or by the next press — never by a timer. `setTimeout(0)` fired
before the click was dispatched, so the swallow had already expired by the time
it was needed.

## The film was one tap away and nobody found it

Tapping a world in the empty frame put a single still in it, and the way to a
whole film was a mode tab, a scroll and a disclosure away — so in practice
everyone got one frame and concluded that was the tool.

**Hold a world tile, or right-click it**, and the choice is there: this moment ·
the whole drawn film · the *n* shots filmed for it · both. One binding covers
`contextmenu` and a 520ms press, because a phone has no right button and a
desktop should not have to learn a long press. Under the gallery there is also a
plain button that says what it does.

## The scrollbars were the operating system's

Every scrolling surface — pads, the archive grid, the strip, the layers rail,
the menus — was drawing soft grey lozenges on a page made of hard black rules.
They are square, black, and bordered in the page's own ink now, and go blue on
hover like everything else that answers.
