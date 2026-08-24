# CARVE — cutting a source into spatiotemporal patches

## WHAT IS HERE

`OUT-OF-LIFE.matrix-*` — a complete carve of `wygwyl/footage/01-out-of-life-lead.mp4`,
the only live-action source mounted in the session that produced it.

| file | what it is |
|---|---|
| `matrix-O.md` | structural diagnosis + olog map + segmentation logic |
| `matrix-A.yaml` | patch genome: diegesis, macro units, beats, 13 timestamped patches |
| `matrix-B.md` | story map, generated from A |
| `matrix-E.json` | scene blueprint — MAN, CAMERA, SMOKE, each in three states |
| `matrix-F.md` | reforge stack: 6 reconstruction prompts per patch, 78 total |

Matrix C (EDL) and Matrix D (OTIO) are not here. They are locked and emitted on request only.

## THE FINDING THAT MATTERS MOST

**The scene detector is nearly blind on this material, and that is a property of the
footage.** Only three of six hard cuts score above 0.25. The other three score 0.06–0.10,
below any threshold a person would trust, because every shot is a dark silhouette against
teal or white and consecutive shots have near-identical luma histograms. Three more space
changes are hidden inside dissolves and produce no peak at all.

Any automatic conform against this source, or against anything else shot this way, will
drop half the cuts. **Cut it by eye or cut it wrong.**

The segmentation logic the source actually uses is **light state**, not location and not
action: TEAL → BLUE → WHITE → GOLD → BLACK. Every hard cut in the piece falls on a
light-state boundary, and every dissolve falls inside one. A conform that respects light
state matches the source's own machine; one that respects location fights it.

## RUNNING IT ON SOMETHING ELSE

    node wygwyl/carve.mjs path/to/clip.mp4
    node wygwyl/carve.mjs path/to/an/archive/directory
    node wygwyl/carve.mjs clip.mp4 --tcbase 01:00:00:00 --fps 24

Writes to `renders/carve/<stem>/`: contact sheets of the whole file at 1fps, a 2fps strip
around every candidate boundary, the full scene-score dump, the audio's own phrase
structure from silence detection, and a shot table with a **confidence column**.

The tool does the mechanical half. It does not tell you where the cuts are — it tells you
where to look, and it marks WEAK every candidate that a normal threshold would have thrown
away, because on this kind of material those are the ones that turn out to be real cuts.
The sheets exist to be looked at. The eye is not an optional refinement step; it is the
instrument.

## WHY THIS SOURCE AND NOT THE ARCHIVE

The session that produced this was asked to carve `MARKOV_POET_ARCHIVE`. That archive lives
on a local machine and the session runs in a cloud container — there is no shared
filesystem, so nothing in `/Users/...` is reachable, whatever it is renamed to or moved
into. Three routes get footage to a container session:

1. **Attach the files to the conversation.** Proven for this repo — the OUT OF LIFE clip
   arrived that way and is what got carved here.
2. **Commit and push them.** From a local clone: add, commit, push. Then the session pulls.
   GitHub rejects single files over 100MB, so large sources need Git LFS or a trim first.
3. **Run `carve.mjs` locally** and hand back `renders/carve/<stem>/`. The mechanical half
   runs anywhere ffmpeg does; the judgement half needs the sheets, which are small.
