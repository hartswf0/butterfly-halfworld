# NOTES — OUT OF LIFE, the test suite

Source: `wygwyl/footage/01-out-of-life-lead.mp4`, 1280×720/24fps/88.38s, its own
audio track (the poet reading the poem, cut to match). Read `EXPERIMENTS.md` and
`BLEND-NOTES.md` first — this file assumes both and only records what's new:
treatments neither one had (`treatments.mjs`, all seventeen exports), what broke
while building them, and where they change or correct what came before.

## THE ACTUAL SHAPE OF THE PROBLEM, ONCE YOU LOOK

The brief calls this "hiding AI crimes" — the footage is synthetic and the job is
to make the tells (smooth gradients, uncanny faces, temporal shimmer, too-clean
light) disappear into the dot law. Fair enough as a design brief, but looking at
the actual stills before building anything (as instructed) turns up something
worth saying plainly: **this footage is already hiding its own tells, by choice,
before it ever reaches `ingest.mjs`.** Every one of the fourteen stills pulled for
this pass (`frames/*.jpg`) is a hard backlit silhouette against fog, smoke, or a
window — no shot shows a face with any legibility, no shot shows a hand doing
anything complicated, nothing moves fast enough to need to resolve difficult
motion. That is exactly the cinematographic strategy a person would use to hide
the weak points of a video model, and it means the dot law isn't fighting an
uphill battle against a shot that WANTS to reveal itself — it's finishing a job
the footage was already halfway through. The practical consequence: **treatments
that lean into the silhouette (figure extraction, contour, structure) are pushing
with the material's own grain, and consistently produced the strongest pictures.**
Treatments that fight it (trying to recover continuous tone, e.g. `contourFill`
with many bands) produced the weakest ones. That correlation held all the way
through this pass and is the single biggest thing to take from it.

## HOW THIS WAS TESTED

**By decode**: nothing, same finding as both prior documents — this sandbox's
Chromium has no H.264 decoder (`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`). Confirmed
again directly: `tool.html` and `index.html` both attempt the real file first
(fetch → blob → `<video>`, the same workaround `dj.html` uses for this dev
server's broken Range support) and both fall back cleanly — `footageUsable`
stays `false`, the status line says so, and every treatment runs unchanged
against the still standing in for that frame. `index.html`'s footer states this
live; `tool.html`'s does too (bottom-left status chip).

**By proxy**: the entire `treatments.mjs` module, verified against sixteen
real extracted stills (`frames/*.jpg`, one to three per movement beat) plus an
89-frame 1fps scrub set (`frames/scrub/`), through a disposable Playwright
harness built and deleted the same way `EXPERIMENTS.md`'s `dj.html` sweep and
`BLEND-NOTES.md`'s `_dj-proxy.html` were (`_probe.html` / `_probe-shot.mjs`,
deleted once every treatment had been looked at and tuned). Every setting named
below was chosen this way, not guessed.

**By real UI**: `index.html`'s 30 cells and `tool.html`'s full control surface
— every A treatment × every combine mode × all 14 worlds × A/B compare × cue
store/recall × JSON export — driven end to end with Playwright, screenshotted,
read. Two real bugs were caught this way (below), not by inspection.

**Not verified**: real-time playback sync, real video decode of any kind, and
therefore the *actual* smoothness of the footage-follows-timeline path in
`tool.html` when a real `<video>` is playing forward rather than being
seeked-per-still. The code path is the same one `01b-out-of-life-blend.html`
already ships and trusts for exactly this reason; nothing here reimplements it.

## TWO REAL BUGS, FOUND BY LOOKING

**`figureSilhouette` eroded after choosing, not before.** The first version
found the largest connected dark blob, then eroded IT to clean up noise. Wrong
order: this footage is dark almost everywhere a figure stands (a wall, a floor,
a doorway all read "dark" too), so a shoulder touching a doorframe silently
produces one component the size of half the room, erosion or no erosion — by
the time erosion runs, the wrong blob already won "largest." First symptom:
`tracedFigure` on the fire-escape turn and the rooftop crouch both produced a
figure lying flat on its side, arms akimbo, nothing like the source pose.
Fixed with **morphological opening** (erode, then dilate the same amount)
run **before** labelling, which severs a bridge narrower than the opening
radius without needing to guess which side of it is the person. Second
symptom, found immediately after: a `marginBottom` option (excise the ground
from the foreground test, since a figure's own ground is usually as dark as
they are) fixed the "wrong blob" problem but broke the RIGHT blob — it cut the
figure's own legs off along with the floor, so a correctly-isolated torso came
out with a mask width bigger than its height and `tracedFigure` read that as
"lying down" all over again, from a completely different cause than the first
bug. Fixed with a **legs-recovery pass**: grow the winning mask back down into
the *original, uncut* foreground (not the cut one — an earlier attempt at this
reused the wrong array and silently recovered nothing), corridor-constrained
so a floor spanning the whole frame can't walk back in sideways. All three
pieces are in `treatments.mjs`'s `figureSilhouette`, with the reasoning kept
in the comments, including one deliberately-rejected idea (preferring a
"taller than wide" component over plain-largest) that measured worse, not
better, and is left as a comment so it isn't tried again the same way.

**`windowLock`'s crossfade leaked across the whole field.** First version
applied the Bayer-scheduled A⇄B swap to every cell in the frame and only
*special-cased* the window rect for the "always-locked frame" rule — backwards.
At `t` near 1 the entire drawn room dissolved to footage, not just the glass.
Fixed by defaulting every cell to the drawn field and only touching cells
strictly inside the window rect. Caught by literally looking at two screenshots
at `t=.3` and `t=.8` side by side and noticing the room outside the window had
changed when it had no business to.

## THE TREATMENTS, RANKED

Ranked on the brief's own standard — how completely a treatment erases the
question "was this filmed or drawn," and only secondarily on how interesting
the idea is in principle. A technically interesting, ugly result is marked
DEAD END, per the brief, and the reasoning for saying so is given rather than
just the verdict.

### tier 1 — ship these

**1. EDGE SKETCH** — `structureLines(img, {channel, blur:1.4}).edge`, the
continuous Sobel magnitude quantised straight to ink, no line-picking. The
single most convincing "this was drawn" result in the whole pass, and it works
on every kind of shot tried (the room, the vape-raise, the fire-escape). It
reads as pen-and-ink contour work because that is structurally what it is —
there is no photographic tone left in it anywhere, only edges, so there is
nothing left for the eye to recognise as a photograph. `channel:"b"` on the
haze shots, `luma` on the room shot (same channel rule `BLEND-NOTES.md`
found, inherited without change). Not in `EXPERIMENTS.md` or `BLEND-NOTES.md`
— new this pass.

**2. FIGURE LOCK, register-swap** (`blend.figureLock`, unchanged from
`blend.mjs` — the treatment here is *which footage* to run it against). Both
prior documents recommend this against the room shot in THE SEARCH; this pass
found a stronger application against **the vape-raise in MORE HAZE**
(`haze-vape.jpg`, `channel:"luma", white:.35, invert`, `figureLock` against
the drawn walker at `t≈.35`) — `renders/outoflife/tool-final.png` is the
frame, found by hand in `tool.html` while testing, not planned. The drawn
window and dresser-boxes sit inside the smoke-lit room as if they were always
there, and a ghost-thin drawn figure crosses in front of the real one. This is
the clearest single evidence in the whole pass for the brief's second half —
"words become worlds" — because nothing marks which dots belong to which
substance.

**3. TRACED FIGURE → DRAWN RIG**, on **THE FALL only**
(`fall-crouch.jpg`: `channel:"luma", threshold:.30, erode:3, marginBottom:16`,
`tracedFigure({guise:"poet"})`; `fall-leap.jpg`: `threshold:.35`, no margin
needed — nothing else in that frame is dark enough to contest the mask,
`tracedFigure({guise:"poet", arms:"open"})`). Not a mask, not a filter — the
footage's own silhouette becomes a bounding box, a centroid and a lean angle,
and figure.mjs's real volumetric rig performs THAT. The output contains zero
footage pixels and is still recognisably his crouch, his leap. This is the
most literal possible reading of "hand the drawn world a pose, not a
picture," and figure.mjs was already built to make exactly this call
(`GUISES.poet`/`GUISES.turned`, measured off this same clip) — this pass is
the first thing to actually use that door.
**Caveat, load-bearing:** only reliable where the silhouette is genuinely
isolated. Tried against the fire-escape turn (`haze-turned.jpg`) it produces
the same "lying down" read the bug above was fixed for, for a *third*, purely
material reason: the torso/hood mass simply outweighs the recovered legs in
the second-moment angle estimate, no matter how clean the mask is. Documented
honestly rather than cherry-picked around — see DEAD ENDS.

### tier 2 — real, useful, situational

**4. FIGURE IN RESERVE** (`paperFigure`, `haze-turned.jpg`,
`channel:"b", threshold:.30, marginBottom:10, floodLevel:7`) — the mask cut
OUT of a flooded field instead of filled. README calls the equivalent move
the best frame in the whole fourteen-film suite when 14 does it; this is the
same move from a real silhouette. Ranked below the top three only because it
is a mood/beat treatment (needs a flooded moment to sit inside, like AS DARK
AS BLACK already has) rather than a whole-scene one.

**5. WINDOW LOCK / WINDOW PORTAL** (registration — see below for why the
rect can only be approximate) — intellectually the purest "same window in the
same place" result, and it works exactly as designed (verified: the mullions
never move, only the glass), but the payoff on screen is a small rectangle of
texture, not a hero image. Worth one beat, not a register to live in.

**6. RESONANT KALEIDO** (`resonantKaleido(img, tri(t/5), {slicesA:6,
slicesB:11})`, `fall-sparks.jpg`) and plain **KALEIDO FIELD** — gorgeous, and
a genuinely new idea (the per-dot allegiance law applied to a fold count
instead of a substance, so the mandala itself breathes on the same schedule
every dissolve in the suite obeys). Ranked here rather than tier 1 because it
doesn't so much hide the footage's origin as replace the question — a mandala
has no "was this filmed" to ask of it at all. Extraordinary for THE FALL's
climax specifically; doesn't generalise to shots without radial symmetry.

**7. STRUCTURE LINES**, sparse (`structureLines(img).field`, defaults:
`blur:2.4, threshold:.20, minVoteRatio:.4`) — a real, working guided-Hough
line extraction (see below), reads as "the room's dominant perspective
vectors, and nothing else." Legitimate and different from EDGE SKETCH, but
more abstract — worth having both, lead with EDGE SKETCH.

**8. HELD MEMORY** (`heldMemory(held, drawnLoop(t), tri(t/9))`) — the
concept (a photograph corrodes to grain while a drawn figure keeps moving
through it) is strong and matches the poem's own "the gap between us
breathes, and never closes," but the picture is only as good as `holdU`
happens to be at the moment you look — genuinely a LIVE treatment, hard to
represent as a single still. Best judged in the running page, not a
screenshot.

**9. BY STRUCTURE** (`byStructure(a, b, t, edge)`) — works, reads correctly
(the room's architecture converts before the haze does), functional rather
than beautiful in every still tried. A transition tool, not a hero shot.

**10. MOTION INK / LONG EXPOSURE** — both correct and both real (the smoke in
MORE HAZE actually moves, `motionInk` actually only inks what moved), but
modest as pictures next to the tier-1 results. `longExposure` wants a LOW
white point (`.32`, not ingest's default `.35`+) or the average washes out —
tuned this way after the first pass looked nearly blank.

### the reverse direction — a different axis, not competing with the above

**CRUSH / GRAIN / VIGNETTE / stacked** (`crushReverse`, `grainReverse`,
`vignetteReverse`) all do exactly what they say: push a COMPUTED field toward
the footage's own darkness, tear its perfectly regular Bayer grain, and add a
lens's own vignette — all through the same "continuous amount, resolved by
the ordered schedule" move the rest of the dot law already uses, so nothing
here is a new kind of gradient, just the old kind of dot pointed at a new
target. These aren't in competition with the erase-the-tell ranking above —
they run on the DRAWN side, making 01's own computed passages sit in the same
material world as 01b's footage passages, which is a real and separate use:
if 01 and 01b are ever cut together, a `crushReverse(field,{curve:"soft"})`
pass over 01's own frames is the cheapest way to keep the two from announcing
which one is which.

### dead ends — tried, and here's why they stop here

- **CONTOUR FILL, many bands** (`contourFill(img,{bands:5})`, room shot) —
  this footage's own lighting is close to bimodal (silhouette dark / window
  bright, very little real midtone), so 5 bands collapse to what reads as 2
  regardless of tuning; the result is an abstract ink-blot, not a room.
  **Not a bug** — checked by hand against the actual pixel histogram via the
  probe, the midtones genuinely aren't there to band. `bands:3` on a
  deliberately graphic shot (the kitchen hunch, the fire-escape turn) is a
  legitimate bold-poster look; more bands than that is chasing tone the
  footage never recorded. Keep in the toolkit for a graphic/poster beat only.
- **`figureSilhouette`/`tracedFigure` on `haze-turned`** — see tier 1's
  caveat above. Real limitation, not a settings problem: threshold sweeps
  from .10 to .30, marginBottom 0 to 20, erode 0 to 3 were all tried (the
  probe's own debug log has the bbox/angle for each). The honest fix is a
  second-moment computation that weights by distance from the mask's own
  skeleton rather than raw pixel count, which is a real piece of follow-up
  work, not a tuning problem — left as a comment in `treatments.mjs` rather
  than papered over.
- **Pixel-exact window REGISTRATION** — worked through with real numbers,
  not just tried and abandoned: the footage's own window occupies ~30% of
  the SOURCE frame's width; landing it at the drawn window's screen position
  (82–96% across a 192-cell field, `windowAt(F,158,FLOOR)` in
  `01-out-of-life.mjs`) would need a crop wide enough to make it only 14% of
  THAT crop's own width — solving the ratio needs roughly 2,800px of source
  width, and the source is 1,280px wide. There simply isn't enough field of
  view in the shot to zoom out far enough. `REGISTRATION.search` in
  `treatments.mjs` is therefore a REGION match (the footage's window lands in
  the same right-of-centre third of frame the drawn one occupies), not a
  pixel one, and `windowPortal`/`windowLock` are written to take whatever
  `rect` you hand them rather than assume this one — say so plainly rather
  than claim more precision than a 1280px source can give.

## CORRECTIONS TO EXPERIMENTS.md / BLEND-NOTES.md

Nothing either document *asserted* turned out to be wrong when re-checked —
CREAM FIGURE, NIGHT FIGURE, CREAM CONTOUR, WARP RIPPLE, the five blend modes'
character, and the blue-channel finding for the MORE HAZE/THE FALL passages
all held up unchanged and are reused as-is throughout `treatments.mjs`'s
defaults and `index.html`'s cells. What's new is scope, not correction:
neither document attempted figure isolation, structure extraction, temporal
differencing, or registration at all — this pass is the first pass at all
four, which is exactly the gap the brief asked this suite to fill. The one
place worth flagging as a genuine addition to their own method rather than
just new material: **BLEND-NOTES.md's channel rule ("check what channel the
shot's own light actually lives in") turns out to matter for figure
ISOLATION at least as much as it matters for tone** — `figureSilhouette` on
`haze-vape` under `luma` merges the figure into the wall behind him; the same
call under `channel:"b"` isolates him almost cleanly. Same rule, a use
neither document had reason to apply it to yet.

## THE THREE TO BUILD A FILM FROM

**1. FIGURE LOCK, register-swap.** Already the shipped choice in
`01b-out-of-life-blend.mjs`, and this pass didn't find anything to make it
back off that — only a second, possibly stronger place to point it
(MORE HAZE's vape-raise, not just THE SEARCH's room walk). Build the film out
of this because it's the only treatment tried that keeps a whole ROOM
legible while a body moves through it in a different substance, which is
what "he is drawn, and everything around him is filmed" actually requires —
nothing else here does both halves of that sentence at once.

**2. EDGE SKETCH.** Not shipped anywhere yet, and it should be — it is the
strongest single "this is drawn, not filmed" result this pass produced, on
every shot tried, with no figure-isolation fragility to manage (it needs
nothing to work except a Sobel read, which never fails the way a connected-
component search can). Build a beat out of this for whichever movement wants
the room to feel most explicitly *inked* rather than inhabited — MORE HAZE's
opening beat, before the figure enters, is the obvious candidate: the room
as a line drawing, then a body walks into it.

**3. TRACED FIGURE → DRAWN RIG, THE FALL only.** The riskiest of the three —
it only works where the silhouette is genuinely alone in frame — but where it
works (the crouch, the leap) it does something none of the other nine
treatments do: it moves the footage's own PERFORMANCE, not its picture, into
the drawn world. THE FALL is already "the one the brief asked to go furthest
on" per `BLEND-NOTES.md`; this is the furthest this pass found a way to go.
Build the crouch-to-leap transition out of it specifically, and keep
`figureLockTorn` (the existing shell composite) for the spark-plunge that
follows, where the environment needs to tear and the earlier, footage-based
figures were already being protected by exactly that function.

## RENDERS

`renders/outoflife/index-full.png` — the whole contact sheet, thirty cells,
nine sections. `renders/outoflife/tool-final.png` — the strongest single
frame this pass produced (see tier 1, #2). `tool-t24.png`, `tool-fs.png`,
`tool-sl.png`, `tool-portal.png`, `tool-compare.png` — functional
verification of, respectively, footage seeking, figure silhouette + legs
recovery, structure lines, window registration, and A/B split-view holding
two different recipes on one frame. `tool-traced.png` is kept deliberately
as the DOCUMENTED FAILURE case (`haze-turned` through `tracedFigure`) rather
than deleted — the point of keeping it is that the tool reproduces the same
honest limitation `NOTES.md` names above, on request, instead of hiding it.
