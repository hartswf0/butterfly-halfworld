# The 14 poemfields, streamed

    op/index.html → AUTHOR → Halfworld → Stream the poemfield

`Add a short run` samples a world at a dozen moments. A poemfield is 72–135
seconds of authored motion, one per poem, and sampling it is like quoting a film
by its posters.

So it comes in **the way the twinstrips do** — as a stream through OPERATOR's own
`streamStripReader`, fed by a reader that renders frames instead of reading
bytes. Not a parallel importer: the same function. Everything that makes that
road good comes free — nodes arrive carrying **commands, not pixels**, so 600
frames cost strings rather than 7 MB of grids; the strip pools; the atlas caches;
frames appear before the render finishes.

    STREAMED · 280 FRAMES · READY          00-title-a, 35s at 8fps, 46s to build
    ~8.7 frames a second

**Every frame remembers its moment.** The node's note carries `hw:<slug>@<t>`,
so a frame streamed out of a world can be put back in front of the runtime that
made it and taken apart by name — the difference between importing a picture of a
world and importing the world. `Break this frame down` does exactly that:
verified recovering `00-title-a` at 0.0s from a streamed node.

And a part can be taken **out** as well as put in: `Take them out` writes level 0
over exactly the cells a part owns, so the frame keeps everything else. That is
editing rather than re-rendering.

## how much of each world actually comes apart

This is the honest part, and it varies enormously. Five samples per world, all
fourteen:

| poemfield | secs | parts | ink named |
|---|---|---|---|
| 10-magic-ride | 106 | 16 | **100%** |
| 03-how-to-break-off-an-engagement | 72 | 5 | 96% |
| 07-dj-turn-me-up | 109 | 11 | 80% |
| 08-newly-single | 101 | 9 | 75% |
| 05-bloodlines | 91 | 3 | 60% |
| 02-flashing-lights | 91 | 4 | 54% |
| 06-resurrecting-atlantis | 110 | 10 | 54% |
| 12-reunion | 75 | 10 | 37% |
| 01-out-of-life | 123 | 4 | 37% |
| 11-new-day | 111 | 10 | 24% |
| 04-nevermore | 135 | 11 | 19% |
| 13-how-to-win-my-heart | 110 | 1 | 14% |
| 09-yet-heard | 118 | 1 | **9%** |
| **all fourteen** | | | **41%** |

A world whose drawing lives in **named helper functions** tags beautifully. A
world that draws inline from its movement function reports one part and nothing
can be pulled out of it. That is a property of how each world was written, not of
the tool.

### a fallback that half worked

The runtime records which **primitive** made each mark, so a world with no names
could still come apart by kind. Measured:

    04-nevermore   10 named + 6 kinds (~arc ~line ~disc ~fig ~rect ~ring)
    11-new-day      9 named + 3 kinds
    09-yet-heard    1 named + 0 kinds     — no change
    13-how-to-win   1 named + 0 kinds     — no change

It helps the middle and does **nothing** for the worst two, because their ink
never passes through the tagging wrapper at all — it is not that the marks are
anonymous, it is that they are invisible to the annotator. Those two would need
their world files changed, which is a different job from this one. A `~` marks
the weaker separation, because lifting out all the rings is not the same as
lifting out the gate.

## two engine bugs found on the way

**The stack walk started at a fixed index.** `who()` skipped three frames before
looking for a name — a guess about how many frames the engine puts between the
annotator and the drawing function. V8 in a browser does not lay them out the way
V8 in node does, so the same walk that read `movement` under node read *the
caller's own function name* in Chrome, and a sixth of the frame came back
labelled `hwScan`. Names are facts; positions are not. It starts at 1 and skips
by name now.

**It also stopped at the wrong boundary.** The pattern captured only the first
token of a dotted frame, so `rt.renderScene(…)` read as `Object`, was skipped as
noise, and the walk went straight past the render boundary into whoever asked.
Fixed by stopping at `renderScene`/`renderTagged`/`renderField` — everything
below those frames is the caller, not the drawing.

## a yield that survives losing focus

`setTimeout(0)` between batches is clamped to about a second in a background tab.
A 600-frame world then takes ten minutes instead of one: put the phone down
mid-stream and the film stops building. A `MessageChannel` task is not throttled
that way. Measured in the same unfocused pane: **under 1 frame a second before,
11 a second after.**
