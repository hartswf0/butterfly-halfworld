# The two films

Every poem in the suite exists twice.

**Drawn** — the halfworld. A program that runs for 70 to 135 seconds, and every
cell it inks remembers which part drew it, so it can be taken apart by name.

**Filmed** — the shots out of the MARKOV POET archive, packed as sheets of
photographs above masks, cut apart by a segmenter and measured.

OPERATOR could stream the drawn one from a button. The filmed one would load
only if you knew a URL or had a file to pick, which in practice meant it did not
load at all. That is what *"we still can't get the whole film for each poem
streamed into this"* was about, and it was never a missing capability — it was a
missing index.

## The index was already written

`WYGWYL_COVERAGE_MAP.json` routes all 135 shots to poems: which poem, which
stanza, the line the shot illustrates, how sure the routing is, and what else it
could have served. `cut/pf/poemfilms.py` writes that out as `poems.json` —
fourteen poems, a world slug on one side and ordered shots on the other, sorted
by **stanza** so the film reads in the order of the poem rather than in the
order the renders happened to finish.

    14 poems, 135 shots routed and packed
      01 OUT OF LIFE                71 shots
      06 RESURRECTING ATLANTIS      12 shots
      09 YET, HEARD                  7 shots
      12 REUNION                     7 shots
      …
      02 FLASHING LIGHTS             1 shot

That distribution is real, not a bug in the routing: every one of OUT OF LIFE's
71 shots is a 99%-confidence match, most of them takes of the same setup
(`POET_DIM_BEDROOM`, line `01_S3`). The poem was shot heavily and the rest were
not. The panel shows the count so you know what you are asking for before you
ask for it — FLASHING LIGHTS is one shot, and that is the whole filmed poem.

## It arrives as patches, not as pixels

Each frame is a node carrying a **clip patch** — a shot id and an index into the
packed sheet. So a streamed film is still a stack: select a frame's layer and it
has corners you can drag, a FRAME control that walks the sheet, and it can be
bound to a body or collaged over. Streaming it as baked commands would have been
less code and would have discarded every reason OP16 exists.

The node's note carries `film:<poem>/<patch>@<k>` and the strip cell shows the
shot id, so a frame always says which shot it came from.

## BOTH, and why it is a branch

Two films of one poem are not two projects. They are two takes, and the tree
already knows how to hold two takes of the same moment.

**BOTH** streams the drawn film where you are, then goes back to the frame you
started from, opens a sibling there, and streams the filmed one onto it. After
that, `B BRANCH` is the switch: the two films hang off one root and you move
between them without loading anything again.

The second stream waits for the first rather than racing it — `Progress.isActive`
is polled — because two films interleaved onto one branch is not two takes, it
is one ruined one.

## The drawn film is a span, not a stream

`hwStream` builds a twinstrip and hands it to OPERATOR's strip loader, and that
loader **adopts** — it replaces the film. Right for opening a twinstrip, fatal
for BOTH: the drawn film arrived and the filmed one it was meant to sit beside
was gone. Measured plainly — 24 filmed frames plus 729 drawn ones left a tree
of 729.

So DRAWN lays a **world patch spanned across the frames**, and `patchSpanApply`
already advances `t` by 1/8 s per frame. The poemfield was always a span,
described twice. Two things follow: it does not replace anything, and the drawn
film becomes what the filmed film already is — a stack of patches on every
frame, still decomposable by name, rather than a picture of a world.

The Poemfield section keeps `hwStream` for opening a world as a fresh film.

A span caps at 600 frames — 75 seconds at 8fps — and FLASHING LIGHTS runs 91.
The cap is not silent: it says how long the poem is and how much it is laying.

## What to expect of the sizes

The drawn film is the poem's duration at 8 fps, capped at 600: FLASHING LIGHTS
wants 729 and lays 600. The filmed film is the sum of its shots' packed frames:
NEVERMORE is 120 frames across 5 shots, FLASHING LIGHTS is 24 across 1. Both are
checked against `NODE_MAX` before anything is laid down, and refused with the
number rather than half-built.

Verified end to end on FLASHING LIGHTS: BOTH left a tree of **624 nodes** — 601
on the drawn branch, the filmed ones on a sibling — with the fork visible in
BRANCH as two columns off one root.
