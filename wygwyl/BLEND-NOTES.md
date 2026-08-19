# BLEND-NOTES — 01b, the filmed version

`worlds/01b-out-of-life-blend.mjs` + `01b-out-of-life-blend.html`. Same poem,
same four lines, as `01-out-of-life.mjs` (untouched), with
`01-out-of-life-lead.mp4` let into the dot law. Read `EXPERIMENTS.md` first —
this file only records what changed from it and why.

## THE CLOCK IS THE CLIP'S NOW

The brief's first draft of this film scrubbed the footage independently per
movement, on whatever duration felt right. That was wrong: the clip is
already cut to its own reading of the poem, and once the shell plays the
clip's real audio (below), the picture has to follow the clip's real
timeline or the two go out of sync within seconds. So `movements[i].seconds`
is no longer a round production number — it is the clip's own measured
length for that passage, and `footage.movements[i].clipStart` is where in
the 88.38s file that passage begins.

**How the mapping was found.** No transcript and no ASR tool were available
in this environment, so two things stand in for a real transcription:

1. `ffmpeg -af silencedetect` over the whole file, to find the pause
   structure — a spoken-word edit tends to cut scenes on a breath.
2. The visual scene order, extracted by sampling stills every 2–4s across
   the clip (see the `f*`/`g*`/`t*` frames this pass pulled, since deleted —
   this file is the record). The author confirmed by ear that the clip's
   own order — room → haze → window/fire-escape → smoke — tracks the
   movement order one-to-one, which is the check this method can actually
   pass: it cannot recover word-for-word timing, but it can confirm the
   *segmentation* is right.

The four boundaries, each sitting inside its own silence gap:

| movement | clip start | clip end | seconds | words | pace |
|---|---|---|---|---|---|
| THE SEARCH | 3.08 | 28.75 | 25.67 | 31 | ~72 wpm |
| MORE HAZE | 28.75 | 54.50 | 25.75 | 22 | ~51 wpm |
| THE FALL | 54.50 | 75.80 | 21.30 | 26 | ~73 wpm |
| AS DARK AS BLACK | 75.80 | 88.38 | 12.58 | 26 | ~124 wpm |

Reasoning per boundary:
- **3.08** — `silence_end` right after the file's opening beat; the first
  sustained speech. Everything before it (the very first half-second) is a
  pre-roll, not a line.
- **28.75** — the clearest gap in the whole file (1.15s), and it lands
  exactly where the visual cuts from the static room shot to him standing
  and raising his hand into the haze. Room → haze, silence → speech, at the
  same second.
- **54.50** — inside a 0.9s gap, right where the kitchen-haze hunched shot
  cuts to the rooftop crouch — a hard scene change (interior to exterior),
  which is exactly the kind of cut a spoken-word edit puts a breath under.
- **75.80** — the largest gap in the back half (1.29s). This was the one
  genuine correction mid-pass: an earlier version of this file put the
  boundary at 82.2 (matched to a much smaller silence gap, chosen because it
  lined up with where the clip's own closing title card visually begins).
  That produced 124→27 wpm for THE FALL and 484→12 wpm for AS DARK AS
  BLACK — the last movement would have had to deliver 26 words in about the
  time it takes to say four. Moving the boundary to 75.80 makes both
  movements' pacing land within the same range as the other two (73 and 124
  wpm) and, as a side effect, means AS DARK AS BLACK's footage is the
  *continuous back half of the same shot* THE FALL was just in — the golden
  spark-burst blooming into a halo, the clip's own closing card fading over
  it, then true black — which reads better than the two movements owning
  visually unrelated material ever did.
- **88.38** — end of file.

AS DARK AS BLACK's 124 wpm is still the fastest of the four and is flagged
here as the least certain boundary, not corrected further: "I trip on my own
words" is, at least, a line that can survive being delivered a little
quickly.

## THE SOUND

The brief's first draft synthesised a drone and foley the same way every
other WYGWYL film does. That was reversed: this clip's audio track **is**
the poet reading the poem, and playing a synthesised bed under a real human
voice was judged (by reasoning about it, not by ear — this environment
cannot play audio for a listen-through) very likely to read as noise under
the voice rather than support under it, which is the opposite of what a
drone is for. So `01b-out-of-life-blend.html` never calls `makeSound`;
`world.drone` is kept only so the module still matches the documented shape.
The clip's own `<video>` audio is the soundtrack — muted by default (same
convention every other film's SOUND toggle uses, and required by browser
autoplay policy: an unmuted `video.play()` before a user gesture is
blocked), unmuted by the transport's VOICE button. Foley cues were dropped
outright rather than kept at low gain — the four durations above no longer
have a clean relationship to the original `at` fractions the old cues were
tuned against, and re-tuning cues against a voice this shell cannot play
back to check is guessing twice. If someone can actually listen to a build
of this, re-adding one or two quiet foley hits at *measured* beats (a
footstep, the fire-escape door) is a reasonable follow-up; it was not done
speculatively here.

**The clock corollary.** A voice wants to play forward, not be sought every
animation frame — `video.currentTime = ...` on every rAF is audible as a
stutter in most browsers. So once the title card's 5 computed seconds end,
the shell calls `video.play()` once and reads `video.currentTime` every
frame as the film's own clock (`movieFilmT()` in the shell); `currentTime`
is only ever *written* on an explicit seek (scrub, prev/next, the `__hw`
QA hook). See the shell's own header comment for the phase state machine.

## THE LUMA BUG THIS FILM FOUND

EXPERIMENTS.md's whole "CREAM FIGURE" recipe (`channel:"luma"`, narrow white
point, `invert`) was verified against exactly one shot: the room, which has
a warm practical light in it alongside the cool window glow. Reused
unchanged against the MORE HAZE and early THE FALL footage — which is
graded almost entirely into one blue channel, no warm light anywhere in
frame — it produced a mottled, illegible field with no visible figure at
any white point tried.

Cause: luma is `0.2126R + 0.7152G + 0.0722B`. A shot lit and graded almost
entirely blue has very little R or G *anywhere in the frame*, silhouette or
background alike — so luma discounts the one channel carrying nearly all of
the frame's real information, and the "shadow vs. glow" contrast the CREAM
FIGURE recipe depends on collapses. Reading the blue channel directly
(`channel:"b"`) restores it immediately — same silhouette, same crisp edge,
now legible — because blue is exactly the channel this footage's exposure
actually lives in.

**This is a correction to EXPERIMENTS.md's own generality, not a
contradiction of its result.** The room shot's CREAM FIGURE recipe (luma,
white 0.35, invert) is untouched here and is still correct for the room —
it just was never a general "night-shot" recipe, because it was only ever
tested against a shot with real color-temperature variation in it. The
practical rule going forward: **before trusting a channel, check what
channel the shot's own light actually lives in.** A predominantly blue (or
predominantly any single-hue) shot wants that raw channel, not luma; a
mixed-temperature shot is what luma is actually for.

Found by looking, the same way the levels-order bug in `EXPERIMENTS.md` was:
five different channel/white combinations on the kitchen-haze frame all
produced screenshots so similar they had to be checked pixel-for-pixel to
even confirm they *were* different fields (`canvas.toDataURL()` compared —
they were; the render just didn't show it under the wrong channel). Once
`channel:"b"` went in, the hunched silhouette that had been invisible the
whole time appeared at the very first white point tried.

## PER-MOVEMENT RECIPE

### 0 · THE SEARCH — clip 3.08 → 28.75

| seg | u range | clip | opts | blend |
|---|---|---|---|---|
| A | 0 – 0.348 | 3.08–~12 | `b`, white .45, invert | `swap`, mix .05→.22 |
| B | 0.348 – 1 | ~12–28.75 | `luma`, white .35, invert | `figureLock` (3.5), mix .22→1 |

Seg A is the exterior fog shot — a different vantage of the same man
(GUISES.poet, same figure the room walk uses), kept low in the mix on
purpose: this is atmosphere arriving *before* the room does, not the room
itself, so the drawn room is already visible underneath a thin wash of fog.
Seg B carries the neon title card's own fade (which halftones into
something closer to distant architecture than legible type — a happy
accident, kept) and then the static room shot. `figureLock` locks the drawn
walker in solid ink from `u=0`; the room around him rides footage→drawing
across the rest of the movement, exactly EXPERIMENTS.md's recommended ride.

### 1 · MORE HAZE — clip 28.75 → 54.50

| seg | u range | clip | opts | blend |
|---|---|---|---|---|
| A | 0 – .223 | 28.75–34.5 | `b`, white .45, invert | `byLevel` (dark-first), mix 0→.55 |
| B | .223 – .418 | 34.5–39.5 | `b`, white .45, invert | `figureLock` (3.5), mix .55→.75 |
| C | .418 – .670 | 39.5–46.0 | `luma`, white .38, invert | `noiseSwap` (.5), mix .75→.2 |
| D | .670 – 1 | 46.0–54.5 | `b`, white .4, invert | `byLevel` (dark-first), mix .2→.7 |

Four beats, all channel `b` except the TV insert (below). Seg A: the poet
raising his hand into the haze — `byLevel` with `reverse:false` means the
darkest mass (him) is the first thing to convert, which is "he empties out
before the room does" read literally off the footage's own tonal structure,
same as EXPERIMENTS' recommendation, just correctly channeled this time.
Seg B: the turned back at the fire-escape landing, GUISES.turned locked in
by `figureLock` against the real stairs and brick behind him. Seg C: a
framed TV in the room shows something else entirely — a distant riot,
nothing to do with this poem — and it does not belong in his room, so the
mix **drops** from .75 back to .2 rather than continuing to climb: the
drawing reasserts itself, and the TV is a ghost at the edge of the frame,
not a competing image. Even at low mix this shot needed its own correction:
`edge` read at full opacity turned the crowd into unreadable clutter no
matter the mix (checked directly, `mix=0`, three edge/channel variants, all
busy); a narrow-white plain invert (white .38) reduces it to the TV's own
bezel as a clean graphic frame with the footage inside reading as soft
marks, which is what "vision blurs" should look like — the frame is sharp,
the content isn't. Seg D: the kitchen haze closing back in as he fails to
reach the window, same `byLevel` idea as seg A.

### 2 · THE FALL — clip 54.50 → 75.80

| seg | u range | clip | opts | blend |
|---|---|---|---|---|
| 1 | 0 – .352 | 54.5–62.0 | `luma`, white .5, invert | `figureLockTorn` (.5 tear), mix .3→.55 |
| 2 | .352 – .728 | 62.0–70.0 | `luma`, white .7, invert, `warp` .6/.02 | `figureLock`, mix .55→.65 |
| 3 | .728 – 1 | 70.0–75.8 | `luma`, white .6, invert, `kaleido:"radial"` /8, `warp` .25/.03 | `figureLockTorn` (.75 tear), mix .65→.85 |

The one the brief asked to go furthest on, and `figureLock` (or its torn
composite, defined in the shell — see below) runs the whole way so the two
drawn bodies never dissolve even as the environment around them tears
itself apart. Seg 1 is the rooftop crouch and the leap — `figureLockTorn`
so the tension is torn, not evenly dithered, while the crouched/falling
silhouette (locked, drawn) stays solid. **Representative-frame correction**:
the segment's own timing (u=0 at clip 54.5) lands near the crouch, which
halftones as a huge, powerful silhouette; the mid-leap moment a few seconds
later (clip ~58) is a small dark speck against bright sky and reads as
almost empty on its own — checked directly, both channels, both mostly
paper. That's fine as a brief transitional beat inside a 7.5s segment whose
dominant image is the crouch, not a defect; it would have been a defect if
it were the *only* still in the segment, which is why this file records
checking more than one. Seg 2 is WARP RIPPLE (EXPERIMENTS #6) through the
sparks, unchanged from its recipe there — a coordinate remap costs the
locked bodies nothing, so they stay crisp while the field around them
buckles. Seg 3 is kaleido `"radial"` + a heavier torn noiseSwap: per
EXPERIMENTS this blots any *filmed* body caught in it into a Rorschach
smear, which is fine here on purpose, because the bodies that have to read
are the *drawn* ones — `figureLock` reads them off `b`, never `a`, so the
kaleido fold never touches them. Verified directly: the pure-footage frame
alone is a genuine rose-window mandala, gorgeous as abstract texture and
exactly what EXPERIMENTS predicted a filmed figure would become inside it.

**`figureLockTorn`** is not a `blend.mjs` export — `blend.mjs` is not
edited. It is a small composite written in the shell: call `noiseSwap(a, b,
t, s, opts)` for the torn field the environment dissolves through, then
apply `figureLock`'s own rule on top (wherever `b`'s ink is at or above
`threshold`, that dot is always `b`). This is the brief's own "torn
noiseSwap... against the drawn falling bodies" read literally — a torn
schedule *and* a protected figure at once, which neither function alone
provides.

### 3 · AS DARK AS BLACK — clip 75.80 → 88.38

| seg | u range | clip | opts | blend |
|---|---|---|---|---|
| — | 0 – 1 | 75.8–88.38 | `luma`, black .02, white .85, invert | `swap`, mix 0→1 by u≈.77 |

The NIGHT register from EXPERIMENTS #2, unchanged, and it is doing real work
here: the wide white point crushes everything but the clip's own fading
highlight (the halo, then the closing title card's glow) to full ink,
agreeing with the computed flood this movement is already doing on its own
schedule. No `figureLock` — the two drawn bodies here are faint on purpose
(levels 2–3, "the gap between us breathes") and are meant to be exactly as
dissolvable as the footage around them, not protected from it. Plain
`swap`, because the drama in this movement is the flood, not the footage;
the footage only needed to already agree with where the flood is going,
which — once the clip boundary moved to 75.80 — it does without being
pushed.

## WHAT VERIFIED HOW

**By decode**: nothing. This sandbox's Chromium ships without H.264 decode
(`DEMUXER_ERROR_NO_SUPPORTED_STREAMS`, same finding as EXPERIMENTS.md);
`footageUsable` stayed `false` through every real-browser test run against
`01b-out-of-life-blend.html`.

**By proxy** (real `ingest.mjs` + `blend.mjs` + the `figureLockTorn`
composite, fed real extracted stills through the same `sample()` call a
live `<video>` would drive — a disposable test page, `_dj-proxy.html`,
built and deleted the same way EXPERIMENTS.md's `dj.html` sweep was): every
segment's ingest opts and blend mode, screenshotted and read, is how the
luma bug above was found and how every recipe in the table was chosen. One
harness bug was found and fixed along the way — a reused `<img>` element
doesn't refire `load` for a repeated `src`, which silently left five
different "test" screenshots sampling the same stale frame; fixed with a
cache-busting query string, documented in the (now-deleted) harness's own
comment while it existed.

**By real shell, computed-only** (the actual degrade path this environment
forces, and the same path a browser without the codec or a slow first load
would take): `01b-out-of-life-blend.html` driven directly with Playwright,
`window.__hw.seek(t)` at 5 points across every movement, screenshotted —
`renders/wygwyl/01b-m0{1..4}-u{8,30,50,70,92}.png`. Confirms the computed
layer alone (guises, new durations, the whole choreography) is a complete,
correct film with no footage at all, which is the graceful-degrade
requirement. Also confirms, by clicking through every transport control
with Playwright, that play/pause/prev/next/scrub/VOICE/CINEMA all run
without a page error.

**Not verified**: the actual audio/video sync during real playback (this
sandbox cannot decode the file, so `video.play()` and the
`movieFilmT()`/`videoTimeFor()` mapping have been checked by reading the
code and by a hand-computed cross-check of `R.starts` against the clip
boundaries above, not by watching it play). Whoever opens this in a real
browser first should watch straight through at least once before trusting
it further.

## HONEST JUDGEMENT

Better than the computed version, and not narrowly. `01-out-of-life.mjs` is
a good abstract restaging of the poem's images; `01b` is the same restaging
with a real man in it, and the moments where the two substances actually
touch — the drawn walker locked into the real room in THE SEARCH, GUISES.turned
locked into the real fire-escape landing, the two drawn falling bodies
holding their shape while filmed sparks and a kaleidoscoped sky tear apart
around them — are pictures the computed film has no way to make, because it
never had a real body in it to begin with. The luma-bug section above is
the one place EXPERIMENTS.md's own recipes needed correcting, not
extending; everything else there held up once actually pointed at footage
whose light lives somewhere other than luma. If this ships, it should ship
as the second version the brief asked for — both files, both playable,
01-out-of-life.mjs as the pure computed statement, 01b as what happens when
the two go looking for the same door.
