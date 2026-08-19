# EXPERIMENTS — footage entering the dot law

Source: `wygwyl/footage/01-out-of-life-lead.mp4`, 1280x720/24fps/88s. Frames sampled
at t = 15, 20, 24, 32, 44, 62, 75 (dim room / graffiti wall / window and street,
kitchen haze, the fall through sparks). Screenshots for every look below are in
`renders/wygwyl/dj-*.png`, produced by driving `ingest.mjs` and `blend.mjs` directly
through Playwright — the exact code `dj.html`'s render loop calls, fed a still frame
in place of a live video frame (see **A NOTE ON HOW THIS WAS TESTED**, bottom).

## A BUG, FOUND BY LOOKING

The first render pass was unusable: every treatment produced either a near-solid
black field or three light flecks on black, no matter where `black`/`white` were
set. Cause: **levels was being applied after the tone curve** — `invert` ran on the
raw channel value, and only *then* did the black/white remap clamp the *already
inverted* value, so almost every cell clipped to full ink regardless of the levels
fader. Fixed by applying levels (black/white → clamp01) *before* the tone curve, on
the raw channel reading, which is also what the module doc now says the pipeline
does. This mattered enough to name here because it's the difference between every
"tuned invert" experiment below being a picture or being mud — **levels is the
fader that finds the room's actual exposure; tone decides what that exposure means.**

## REGISTERS: THE SUITE HAS TWO GROUNDS, NOT ONE

Every WYGWYL film draws on **cream paper with black ink** — that's the dot law's
own ground. Poem 01 only leaves it once: `AS DARK AS BLACK`, its last movement,
floods to a near-solid ink field and holds there. `THE SEARCH`, `MORE HAZE`, and
`THE FALL` are all cream. So a footage treatment that only exists in one polarity
can only be cut into one part of the film. Ingest's polarity is controlled by two
different faders depending on treatment:

- **Plain channel read** (no edge): polarity is the **white point**, under a fixed
  `tone:"invert"`. A *narrow* white point (~0.35) means only the footage's true
  shadow — which in this shot is the poet himself, backlit against a room lit by
  street glow — clips to full ink; the room around him stays paper. A *wide* white
  point (~0.85) pulls the whole dim room up into ink and leaves only genuine
  highlights (the window) as paper. Same tone, same channel, same everything else —
  the exposure fader alone is the register switch.
- **Edge read** (`edge` > 0): polarity is **tone itself**, `invert` vs `linear`.
  Edge magnitude is near-zero everywhere except at a contour, so with `invert` the
  *flat* areas (low edge) end up near 1 (full ink) and the *contours* end up near 0
  (paper) — a paper line reserved out of a solid ink field. With `linear` it's the
  reverse: flat areas sit near 0 (paper), and only the contour itself climbs to
  high ink — a drawn line on cream. Two completely different pictures from the same
  Sobel read, selected by one dropdown.

Every look below is labelled CREAM or NIGHT for exactly this reason.

## THE LOOKS

### 1. CREAM FIGURE — the default register — `dj-32-f24-cream-figure.png`
`channel:"luma", black:0, white:0.35, tone:"invert", dither:"bayer"`
The poet as a solid dark silhouette on a cream, lightly-inked room — the graffiti
wall, window mullions and bed all survive as fine paper-toned texture instead of
crushing to black. **This is now `ingest.mjs`'s `DEFAULTS`.** Cuts straight against
`THE SEARCH` and `MORE HAZE`, which are the same paper the whole time. Best of the
set for "does footage belong in this world, not video-with-a-filter" — the graffiti
wall's fine detail reads as if it were drawn with the same halftone that draws
everything else. **Ship it.**

### 2. NIGHT FIGURE — `dj-33-f24-night-figure.png`
`channel:"luma", black:0.02, white:0.85, tone:"invert", dither:"bayer"`
Same shot, white point pulled wide: the room floods to near-full ink, the poet's
silhouette nearly merges into it, and only the window stays paper. Not a worse
picture than #1 — a *different moment*. This is the register for `AS DARK AS
BLACK`, where the poem's own text asks for exactly this: the room folding into the
dark until only a light remains. **Ship it, but only for that movement.**

### 3. CREAM CONTOUR — `dj-30-f24-edge-cream.png`
`channel:"luma", black:0, white:0.6, tone:"linear", edge:0.85, dither:"bayer"`
Sobel edge read, cream polarity: the poet's profile, hairline, jaw, the window
frame and its mullions, the bed's folds — all as clean black contour line on
paper. This is the single most convincing "this is drawn, not filmed" result in
the whole set: it doesn't read as a filter over video, it reads as inked line
work, because the line weight and the paper ground are the same lattice the rest
of the film uses. **Ship it — strongest cream-register look.**

### 4. NIGHT CONTOUR — `dj-31-f24-edge-night.png`
`channel:"luma", black:0, white:0.6, tone:"invert", edge:0.85, dither:"bayer"`
Same Sobel read, `tone` flipped to `invert`: now the contour is a paper-white line
reserved out of a near-solid ink field — moodier, more dramatic, the poet's outline
glowing faintly against black. Equally legible as #3, opposite ground. Pairs with
`AS DARK AS BLACK` the way #3 pairs with `THE SEARCH`. **Ship it.**

### 5. CHROMA GLOW — night register, atmosphere only — `dj-71-f15-chroma-night.png`
`channel:"chroma", chromaHue:170, chromaTol:45, black:0, white:0.55, tone:"linear", dither:"bayer"`
On the exterior fog/streetlight shot (f15), keying to this footage's own green-cyan
hue isolates the streetlight glow as a soft paper-coloured cloud surrounded by dark
ink buildings and trees — genuinely different information from a luma read on the
same frame (`dj-70-f15-chroma-cream.png`, same key but `tone:"invert"`, is busier
and worse — the cream version of this particular key doesn't earn its keep here).
No figure in this frame, so this is an **atmosphere treatment for `MORE HAZE`'s
exterior beats, not for the poet** — chroma-keying a person against a room lit by
the same colour temperature as his skin tends to key the room and the man
together, which defeats the point. **Ship for exteriors only.**

### 6. WARP RIPPLE — `THE FALL` register — `dj-74-f62-warp.png`
`channel:"luma", black:0, white:0.7, tone:"invert", dither:"bayer", warp:0.6, warpScale:0.02`
On the falling-through-sparks frame (f62): the falling figure's silhouette stays
perfectly crisp (warp is a coordinate remap, not a blur, so it doesn't cost the
figure anything) while the spark field around him ripples and buckles. Reads as
vertigo without losing the body — the one surreal-register treatment that keeps
the subject legible. **Ship it for `THE FALL`.**

### 7. GHOST REVERSE — a usable oddity — `dj-11` settings, re-verified post-fix
`channel:"luma", black:0, white:0.2, tone:"gamma", gamma:0.55, dither:"bayer"` (no invert)
Flip the whole idea: without invert, the poet's own shadow reads as *paper* — a
bright cutout figure against a darker-inked room. Distinct from CREAM FIGURE (#1),
not a mistake — a spectral positive/negative read that could sell a single beat
(the moment just before he becomes fully drawn, perhaps) but reads as "wrong way
round" if held for more than a couple of seconds, because every other figure in
the suite is drawn in solid ink, not paper. **Usable for one beat, not a register
to live in.**

### DEAD ENDS — tried, rejected

- **POSTERISE BLOCK** — `dj-72-f44-posterise.png`,
  `black:0, white:0.6, tone:"posterise", posterise:4`. Collapses the hunched
  kitchen-haze pose into one or two big flat blocks. Reads as gesture/silhouette,
  not as a person — recognisable as "a body bent over," not as *him*. **Dead end
  for any shot where the poet needs to be READABLE as himself; keep in the toolkit
  only for a genuinely distant/symbolic beat that doesn't need the face.**
- **KALEIDO QUAD** — `dj-73-f62-kaleido-quad.png`, mirrored quad on the spark
  frame. Gorgeous mandala, but the mirror axis runs straight through the falling
  body and turns him into a Rorschach blot — no figure survives. **Dead end for
  the poet. Fine as pure abstract texture (a vision-insert, not a body-insert).**
- **DIFFUSE DITHER on a figure shot** — `dj-75-f24-diffuse.png`, same settings as
  CREAM FIGURE but `dither:"diffuse"`. The picture itself is fine — arguably a
  nicer, more photographic grain than Bayer — but Floyd-Steinberg error diffusion
  does not obey the 8x8 ordered schedule every dissolve in this world is keyed to.
  Cut a `swap`/`wipe`/`byLevel` transition against a diffuse-dithered field and the
  boundary tears against a *different* grain than the one it's dissolving into,
  which reads as a seam. **Fine as a static grain choice for a shot that never
  transitions; never for a shot a blend will touch.**
- **The pre-fix "narrow white + invert" results** (not shipped as files — this is
  the bug above). Before the levels-order fix, tightening the white point under
  `invert` produced a handful of light flecks on solid black, no visible figure at
  any setting. That was never a real treatment, just the bug; CREAM FIGURE (#1) is
  what that same idea looks like fixed.

## BLEND MODES — all five work; here's what each is FOR

Tested against `THE SEARCH`'s own walking figure (`R.renderField` at u≈0.65–0.85,
where the drawn figure has walked clear of the footage poet's own screen position —
see the note on `figureLock` below for why that positioning matters), footage in
the CREAM register.

- **`swap`** — `dj-50-swap-t50.png`. Even, grainy, reads exactly as advertised:
  one substance replacing another at the pixel level, no ghosting, no visible
  "layer." The baseline every other mode is a variation of.
- **`wipe`** — `dj-51-wipe-t50.png`, angle 0. A clean directional front — left half
  drawing, right half footage, dithered seam between. Reads as a wipe, not a swap;
  use when the transition should have a direction the eye can follow (e.g. him
  walking INTO the drawn side of the room).
- **`byLevel`** — `dj-80-byLevel-t50.png`. Keyed to the footage's own darkness: the
  poet, being the darkest mass in frame, is the FIRST thing to convert, and because
  the drawing underneath him is mostly paper there too, he empties out into blank
  paper before the room around him changes. Thematically strong — "he goes first,
  the room follows" — worth deliberately choosing this mode for a movement about
  a person disappearing before his surroundings do.
- **`noiseSwap`** — `dj-81-noiseSwap-t50.png`. A torn, irregular boundary — patches
  of drawing break through the footage unevenly rather than as a clean front or an
  even grain. Reads as combustion/dissolution rather than a mechanical wipe. Good
  for `THE FALL` or the haze claiming the room.
- **`figureLock`** — see below. The one built specifically for "him going."

None of the five are dead ends; the choice between them is about what kind of
replacement the moment is (mechanical / directional / darkness-led / torn /
figure-locked), not about which one is broken.

## THE RECOMMENDATION: THE POET, FILMED → DRAWN

**Register: CREAM. Blend mode: `figureLock`.**

`dj-44-figurelock-u65.png` and `dj-44-figurelock-u85.png` are the evidence: footage
of the room in the CREAM FIGURE register (#1 above — `black:0, white:0.35,
tone:"invert"`), crossfader `t` near 0 so the room stays footage, `figureLock`'s
`threshold` at its default (≈3.5, the engine's own "has ink" line). `THE SEARCH`'s
drawn walking figure is locked in at full ink at every `t`, and where he's walked
clear of the real poet's own screen position, he reads as a small, crisp, solid-ink
body **standing inside the actual filmed room** — the drawer boxes, the perspective
hallway lines and the window are all still footage-cream underneath him. That is
"a drawn body moving through a filmed room," not a composite of two layers — because
under the dot law it isn't a composite, it's one ink field where some dots belong to
one substance and some to the other.

Two things that matter for cutting this into the film:

1. **Position, not just timing, decides whether this reads.** At u≈0.15–0.35 in
   `THE SEARCH` the drawn figure's screen position overlaps the real poet's own
   dark silhouette in this particular frame (`dj-41`/`dj-42`) — both are already
   near-max ink there, so the locked figure doesn't visually separate from the
   footage figure, it just thickens him. The technique needs the drawn figure's
   path to cross a part of the frame that's footage-*paper* (the walk in `THE
   SEARCH` does this once he's past the dresser, heading toward the window) — which
   is exactly where the poem's own blocking already sends him, so no compromise
   is needed, just picking the right few seconds of the walk cycle.
2. **`t` is not idle.** Start at `t≈0` (room fully footage, figure locked) and ride
   it up through the shot — by `t≈1` the room itself has gone over to drawing too
   (`dj-43-figurelock-cream-t100.png`, indistinguishable from the pure drawing,
   `dj-40-drawing-search.png`), so `figureLock` alone plays the *whole* transition
   from "he is drawn in a filmed room" to "he is drawn in a drawn room" without
   switching blend modes mid-shot.

If a harder cut is wanted instead of that ride, `swap` or `noiseSwap` between the
CREAM FIGURE footage field and the drawing (no `figureLock`) both read cleanly too
— but they take the whole room out with him. `figureLock` is the one that keeps
the room behind while only he changes substance, which is the image the brief
describes.

## A NOTE ON HOW THIS WAS TESTED

The Playwright/Chromium build available in this environment is the open-source
Chromium binary, which ships without the proprietary H.264 decoder — the source
`.mp4` fails to decode here (`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`) regardless of
how it's loaded. This is a sandbox limitation, not a defect in `dj.html`: a real
Chrome/Firefox/Safari has the codec and will play the file directly. `dj.html`
itself also works around a real, separate bug in this repo's dev server — it
advertises `Accept-Ranges: bytes` but doesn't actually serve partial content, which
aborts a plain `<video src>` load under Chromium the moment it issues a ranged
request; `dj.html` fetches the file as a blob and hands the video element an
object URL instead, sidestepping ranged requests entirely (see the comment at
`loadFootage()` in `dj.html`).

To verify `ingest.mjs`'s actual pixel pipeline against real frames despite the
codec gap, `ingest.mjs`'s `videoWidth`/`videoHeight` read was given a fallback to
`naturalWidth`/`naturalHeight` (one line, in the shipped module — see its comment),
which lets the exact same `sample()` the DJ tool calls every frame run against a
still `<img>` instead of a `<video>`. Every look above was produced this way: real
`ingest.mjs` and `blend.mjs` code, real extracted frames, a disposable test page
that was deleted once the sweep was done (`dj.html`, `ingest.mjs`, `blend.mjs` are
the only shipped files). `dj.html`'s own UI, transport, cue store/recall, and JSON
export were verified separately and directly (`dj-61-full-page.png`,
`dj-60-ui-drawing-only.png` — the latter is the DRAWING-only path at 100%
crossfade, which needs no video decode at all and confirms the whole render loop,
blend wiring, and `makePost` integration are correct end to end).
