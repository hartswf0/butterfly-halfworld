# Undo, and getting the controls out of the way

## undo

There was none. Every patch operation was final, which is a strange thing to say
about a tool whose whole claim is that nothing is final — a stack you can restack
but not un-restack is half a promise.

It is cheap here **because a frame is derived**. A step is a snapshot of the
stacks it is about to touch; undoing puts them back and re-bakes. No inverse
operations to get wrong, no command log to replay. The thing that made the frame
rebuildable makes it revertable.

    add · hide · show · remove · restack · span      all marked
    UNDO in the rail, and ⌘Z / ctrl-Z
    bounded at 40 steps

Bounded because a snapshot of a spanned passage is 24 arrays, and an unbounded
history of those is a leak with good intentions. A span marks **every frame it
will touch**, so undoing a 24-frame passage puts all 24 back.

Verified: layer removed → frame empty → UNDO → the city and its layer both back,
and the button greys out when the history is spent.

## the panel was covering the thing it described

Selecting a layer opened a full-height sheet over the board, so you chose a layer
and then could not see the thing you had chosen it in.

The controls now live in a **card on the stage**, beside the rail, never over the
frame: the patch's name, `▲ ▼` to restack, `ON/OFF`, `✕` to remove, and its own
controls underneath — position and size for an element, the frame index for a
clip, the world and second for a world, and `across [n] FRAMES` for any of them.

Reordering was always possible and never reachable: the arrows were inside the
collapsed sheet. They are on the stage now, next to the picture they reorder.

## branching kept the frame and lost the layers

`fork()` copied the **grid**. A branch got a baked frame with no stack — you
could see what the other branch had made and not take it apart, which defeats the
point of branching a collage.

Fork and duplicate now deep-copy the stack with fresh patch ids, so the two
branches **diverge** rather than sharing patches, and the toast says how many
came across.

## still thin

`C CREW` and `D DIRECT` have no layer awareness yet. D is the one that matters —
it is where a span should be edited as a bar under the strip rather than typed as
a number, and that is the next real step.
