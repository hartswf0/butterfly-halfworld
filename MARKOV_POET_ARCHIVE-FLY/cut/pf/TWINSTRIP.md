# The strip

    held/index.html?strip=strips/01-out-of-life-BEATKILLER.twinstrip&mp3=audio/unified-drones.mp3

OPERATOR's `.twinstrip` is a stronger spine than anything HELD had, and
`01-out-of-life` is **station 01**: 984 nodes at 8fps, 123 seconds, with an
audio lock that says where the drone gives way to the poem.

    #TWINSTRIP v1
    {"title":"OUT OF LIFE","fps":8,"frames":984,"audio_lock":{…}}
    <root>~984 \f id|parent|author|meta> CLR 0 / PNT x y w h v \f …

## the trick worth stealing

**A node carries its commands, not its pixels.** 984 grids at 128×96 is 12 MB
held forever; 984 command strings are 1.4 MB, and a grid is built only when it
is looked at, then dropped. OP-14 keeps 128 hot and calls that *"what makes
frame count irrelevant"* — it is right, and it is why that tool holds a whole
film on a phone while HELD was holding **two seconds**.

HELD now does the same: `stripGrid(i)` materialises on demand behind a 128-entry
LRU. The film streams; the memory does not grow.

## the field is a property of the film

OPERATOR draws on **128×96**. MOUSSA and the halfworlds draw on **192×144**.
Both are 4:3 and neither is wrong — they are different films. Resampling one
onto the other would repeat every second cell, which is the exact fault that
made MOUSSA's dots *never the film's* two commits ago. So the field is set by
whatever is loaded, and the frame border follows it.

## what HELD gains

**Sound.** The songs sat beside films too large to ship, so the one thing this
whole archive is cut *to* was the one thing the tool could not hear. The strip's
`audio_lock` gives the offset, and the line names the section you are in —
`DRONE` before 29.76s, `poem` after. The scrub marks those two boundaries
instead of drawing 984 frame ticks, which would be a fog rather than a cut list.

**A real duration.** A packed shot was 2 seconds and a long hold froze on its
last frame. A strip is the whole 123 seconds, authored.

**Collage over an authored film.** Verified: an archive person lifted onto frame
394 of the poem, moved twenty cells, switched to photographic —
`a person · 44,48 · 36x43 · 0° · over`.

## what does not cross yet

The export. HELD can read a strip and cannot yet write one, so a composition
made here cannot go back to OPERATOR to be branched, ordered and rendered to
video. `frameToCmds` is a dozen lines — the real question is the field: writing
192×144 into a 128×96 strip loses a third of the resolution, and writing a
192×144 strip would produce a file OP-14 renders at the wrong size, since its
`W`/`H` are constants. That is a decision about which tool's field is canonical,
not a coding problem.

Audio needs a gesture before it plays, as every browser requires. The first tap
starts it.

Branches are read but not offered: `parseTwinstrip` follows the first child at
every step, the same walk OP-14 calls `activePath` minus the branch choices,
because nothing in HELD is choosing a branch yet.
