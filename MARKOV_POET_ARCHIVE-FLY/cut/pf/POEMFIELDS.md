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

## on the empty frame

The tool opened on a blank board that said *draw here*, and all fourteen
poemfields were four steps away: a mode tab, a scroll, a disclosure triangle, a
wait. **Nothing on the opening screen said they existed.**

The empty frame is where "where are the worlds" gets asked, so it is where the
answer goes. `THE FOURTEEN` sits on the board itself while the frame is empty —
fourteen thumbnails, one tap, and the world is the frame. The first mark you make
takes them away, because then you are working.

The panel keeps the full drawer. This is the door.

One CSS lesson on the way: the empty-state hint had `opacity:.4` on its
container, and **a parent's opacity is a ceiling** — the thumbnails could not be
more solid than the text they sat under, so fourteen worlds arrived as a grey
smudge. It belongs on the words.

## where they are

They were in a **dropdown of slugs**. A slug is a filename, and picking a
poemfield by filename is like picking a record by its catalogue number — possible
only if you already know what you want.

Every world module already carries what a card needs: `n`, `title`, `tagline`,
and a `movements` array whose length is the movement count and whose entries hold
the poem's lines. The runtime supplies the duration. So the picker looks like the
index the worlds already have, and nothing was authored twice:

    01 OUT OF LIFE      the maze, the haze, the fall, the ember     4 MOVEMENTS · 123s
    02 FLASHING LIGHTS  the scream that travels inward             6 MOVEMENTS ·  91s
    04 NEVERMORE        a trail followed twice, a vow made twice   6 MOVEMENTS · 135s
    12 REUNION          less time for words, more space for laughter 5 MOVEMENTS · 75s

Fourteen cards, each with a live thumbnail rendered from the world itself at 45%
through. They render **one at a time with a yield between**, because fourteen
halfworld renders back to back is a second of frozen page on a phone, and a
gallery that appears row by row beats one that appears late.

Scrubbing now also shows **where you are in the poem** — the movement number, its
label, and the line spoken during it, read from the module.

## ingested, not linked

A gallery is still a website: you look at fourteen worlds and then go elsewhere
to use one. Two things close that.

**A tap on a card puts the world in the frame.** Not select-then-find-a-button —
the card opens the world and stamps its moment into the frame you are standing
on, in one gesture. `Tap = just look` turns it off for browsing.

**`Ingest all fourteen`** streams the whole suite in as ONE film. Not fourteen
links: fourteen worlds rendered in order into a single node tree, through the
same `streamStripReader` the twinstrips arrive on.

    STREAMED · 112 FRAMES · READY        14 worlds × 8 frames, ~50s
    LOCAL 8/112 · LOCAL BRANCH           navigable, every cell authored HALFWORLD

Rate is a dial because the honest full version is not tractable in one press:
twenty-four minutes of drawn film at 8fps is 11,760 frames and twenty-two
minutes of rendering. At 24 frames each it is 336 nodes and about a minute — the
whole poem cycle sitting in the tree rather than behind a fetch.

Every frame keeps `hw:<slug>@<t>`, so an ingested frame is still a frame of a
world: draw on it, branch from it, or press `Break this frame down` and put it
back in front of the runtime that made it.

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
