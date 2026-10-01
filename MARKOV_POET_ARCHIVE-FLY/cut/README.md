# WYGWYL — FIVE CUTS, A CONCORDANCE AND A MUSIC MAP

Carved from `MARKOV_POET` + `MARKOV_POET_00` — 135 shots, 20.7 minutes of source —
against the 111-stanza script the suite was already carrying in
`wygwyl_suite_mapping.json` and that nothing had ever been cut to.

```bash
python3 -m http.server 8787   # then open http://127.0.0.1:8787/cut/index.html
```

*(`http.server` does not serve byte ranges, so the player will not scrub. Any server that
does — or GitHub Pages — will.)*

---

## E · THE DOOR, ON THE MUSIC — `out/WYGWYL_E_THE_DOOR_mareamemory_06.mp4`  ← **start here**

**58 events · 51 pictures · 220.000 s · 55 bars · 5280 frames**

The track was not chosen for mood. It was chosen because it is the only one in the
library that needs nothing done to it:

> `mareamemory-06` · *Ecstatic Dawn* · MAREA MEMORY
> 220.079 s · **measured 60.00 BPM** · beat phase 0.016 s · 55.02 bars

60.00 BPM is the halfworld's own clock — `harness/build-score.mjs`: the butterfly tests
the glass at 0.5 s, halved, *"one beat a second. The score's clock is the butterfly's
tapping. Nothing else."* So there is **no time-stretch, no pitch shift, no conform**. At
24 fps a beat is exactly 24 frames and a bar exactly 96, and it locks to CUT C for free.

The track's own form, measured off its loudness curve, all on whole bars — and the film
is cut to that rather than to itself:

| bar | at | | the film |
| --: | --: | :-- | :-- |
| 12 | 48 s | +11.5 dB first lift | 03 HOW TO BREAK OFF AN ENGAGEMENT begins |
| **30** | **120 s** | **+12.5 dB THE DROP** | **08 NEWLY SINGLE** — *"the soul has escaped my body … & left him on the dance floor"* |
| 38 | 152 s | −5.6 dB it empties | 11 NEW DAY — *"that we too can walk on water"* |
| **53** | **212 s** | **−15.7 dB the floor goes out** | **THE DOOR** |

Swap the track with `python3 cut/musiccut.py <slug>`; `BARS` in that file is the poem→bar
map and is written for this track's form.

## D · THE DOOR — `out/WYGWYL_D_THE_DOOR.mp4`  (the same cut, silent)

**57 events · 51 pictures, each seen once · 3:18**

Cuts A, B and C obeyed *"every shot used once."* That is a coverage guarantee, not
an edit, and it is why they showed the neon skeleton seven times, the starburst six,
the credit slate five, the train window five, and one bedroom eighteen times.
Measured, by fingerprinting nine frames of every shot:

```
61 distinct pictures across 135 shots
24 of those pictures have between 2 and 18 takes
98 of the 135 shots are a repeat of something already on screen
```

**The law here is ONE PICTURE, ONE APPEARANCE.** Two exceptions, both declared:
`THE FALL` (P024 leap → P038 falling: two states of one event) and `THE ROOM`
(P009 at the start, P042 at the end — it is the refrain). Everything else appears
once and never again. The only other repeat is THE REEL, which the poem asks for
by name.

Three more cuts that came out of the same complaint:

- **No poem gets a title slate.** Fourteen four-second cards was 56 seconds of the
  viewer's life spent reading. The poem's name is now an 18px mark in the corner of
  a picture that is already doing something, and it leaves after a beat.
- **One line per poem, off the CODEX** — the real text, not the archive's summary —
  burned over the poem's first shot. Fourteen lines in three and a bit minutes:
  a spine, not a lyric video.
- **Three acts, continuous**, instead of fourteen labelled chapters in a row.
  I `67s` THE ROOM WILL NOT OPEN · II `75s` THE BODY AND THE CITY · III `54s` THE DOOR

Twelve pictures were cut by hand on top of the automatic dedupe, each named in
`cut/final_selection.json`: the second skeleton, the second NEVERMORE card, the
featureless grey, the murky water, the third foggy street, the duplicate golden
field, the second orange subway, the second motion-burst, the redundant
face-behind-glass, the static pier, the subjectless bokeh, and the underexposed one.

## THE MUSIC — `out/MUSIC.md` · `cut/music.json`

Thirty-four tracks measured off the decoded samples: duration, tempo (spectral-flux onset
envelope, autocorrelated with a four-lag comb), beat phase, bar count, the drop (largest
sustained rise in the 1-second RMS curve), intro, and the whole loudness curve. **Every
*note* in that table is yours, verbatim** — the measurements are mine, the taste is not.

Two things worth knowing:

- **AEOLIAN DRIFT is the WYGWYL album.** Its tracks are the poems: 02 *Flashing Lights
  (Roadside Omen)*, 03 *How to Break Off an Engagement*, 13 *How to Win My Heart
  (Dial-Tone)*. The cover file is `Album_cover_Aeolian_Drift_WYGWYL_202606092015.jpeg`.
- **`aeolian-09` drops at 79.0 s, not 120.** Your note said 120 and *"then it's all over the
  place"*; measured, the step is +7.2 dB at 79 s and the curve is flat from 80 s to the end,
  which is probably what the second half of that sentence is hearing. Treated exactly as you
  asked — the record slowed (`asetrate` 0.86, so tempo and pitch fall together, −2.6
  semitones), a 5.2 kHz lowpass to take the air off, three echo taps at 380 / 760 / 1550 ms
  — it becomes **3:50 at 94.6 BPM with the drop at 91.9 s**, down the hall:
  `out/music/aeolian-09_pitched_distant-room.m4a`

## FOOTAGE FOR THE DJ INSTRUMENT — `out/footage/*.mp4`

`wygwyl/dj.html` blends **SOURCE A = FOOTAGE** against **SOURCE B = the DRAWING**
(`worlds/NN-slug.mjs`) with swap / wipe / byLevel / noiseSwap / figureLock. All
fourteen drawing worlds are live; only `footage/01-out-of-life-lead.mp4` existed —
the other thirteen were 404, so the instrument was one-fourteenth fed.

Fourteen leads are now built, one per poem:

```
768 frames · 32.000s · one 8-bar phrase at 60 BPM · silent
1280x720 · 24fps · h264 High · yuv420p   (matching the one lead that existed)
8 slots of one bar each, cycling only that poem's distinct pictures
```

One bar is 4.000s and the shortest source is 5.04s, so nothing loops inside a slot.
Every lead carries the same one-bar cut rhythm, which is what lets them intercut
with each other and with the drawing side without anything being re-timed. Copy
what you want into `wygwyl/footage/` — nothing live has been touched.

## A · THE PQ REEL — `out/WYGWYL_A_THE_PQ_REEL.mp4`

**21 shots · 1:46 · HEVC 10-bit · BT.2020 · SMPTE-2084 · stream-copied**

Twenty-one of the 135 shots were generated in HDR and nothing had ever played them as HDR.
This cut is all of them, in the order the story cut stages them, joined without a single
re-encode — the PQ transfer curve on the master is bit-for-bit the curve that came out of
the generator.

Two things fall out of that constraint and neither was planned:

- **Not one of the 21 is the teal bedroom.** The HDR pass is, by accident, the archive's
  own selects reel — every image in it is a different place.
- **1:46 is the whole of it.** 21 × 5.04s is every HDR frame that exists. A longer HDR cut
  would have to repeat or fake something.

`WYGWYL_HDR_MASTER_CUT.mp4`, the file this replaces, is 8-bit h264 with
`color_transfer=unknown` and runs 374s.

## C · THE DECK — `out/WYGWYL_C_THE_DECK_60BPM*.mp4`

**144 events · 135 shots each used once · 512.000 s · 16 phrases · 60 BPM · frame-exact**

The same routing as cut B, put on the halfworld's own clock so it can be mixed with anything.
The clock is not a choice — it is in `harness/build-score.mjs`:

> the text says the animal tests the glass "at equal intervals", and build-sound.mjs quantises
> that to a dead 0.5s … 0.5s is 120bpm; halved, it is a 60bpm pulse, one beat a second. The
> score's clock is the butterfly's tapping. Nothing else.

```
60 BPM   1 beat = 1.000s = 24 frames   1 bar = 4.000s   1 phrase = 8 bars = 32.000s
         poems 01–13   one phrase each      416s
         poem 14       three phrases         96s
                                            ────
                                            512.000s   16 phrases   12 288 frames
```

Every cut lands on a beat. Every poem starts on a phrase line and burns its number and title
for the first bar, so a DJ always knows where the downbeat is. Both masters are **12 288
frames at 24 fps, exactly** — verified by frame count, not by container duration, because the
first build of this silently lost 45 frames (see the ledger).

Against a **120 BPM** track the picture cuts every two bars and the phrase line lands on every
eighth — drop it anywhere and it is already locked. Against 128 it drifts ~6.7 %; use the
silent master and stretch, or don't.

| file | what it is |
| :-- | :-- |
| `..._SILENT.mp4` | picture only, **no audio stream at all**. This is the DJ tool. |
| `..._60BPM.mp4` | picture + the bed, for playing on its own |
| `..._SCORE.wav` | the bed alone, 24 kHz mono, for layering |
| `..._60BPM.cue` | CUE sheet, one hot cue per poem |
| `..._60BPM.json` | the grid: every event's beat count, in-point and phrase |

**The bed is generated, not sampled.** `build-deck-score.mjs` is the four voices and three
constants out of `harness/build-score.mjs` — root 60 Hz, Aeolian for the first eight phrases
and Dorian for the last eight, the pulse at 60 BPM, the wall read left to right one degree per
phrase. The hum runs in two unbroken spans rather than sixteen, because there is no moment
where the music starts, which is also why a cut cannot break it. It peaks at 0.20: it is a bed,
and the thing on top of it is yours.

## B · THE WINDOW AND THE DOOR — `out/WYGWYL_B_THE_WINDOW_AND_THE_DOOR.mp4`

**144 events · 135 shots, each used once · 13:03 · all 111 stanzas occupied**

| | prior 135-shot master | this cut |
| :-- | --: | --: |
| shots in poem 01 | 71 (53%) | 15 (11%) |
| shots in poem 02 | 3 | 12 |
| poems under 5 shots | 7 of 14 | 0 |
| stanzas with no shot | — (poem-level only) | 0 of 111 |
| longest / shortest movement | 355s / 10s | 84s / 42s |
| shot durations | flat 5s | measured, 0.55–9.5s |
| HDR handling | fed to SDR raw | tone-mapped (hable, npl 100) |

**The spine.** Poem 01 ends at a window that will not open. Poem 14 ends *"the kind I once
fell out of a window to escape. This time, I choose the door."* The archive holds exactly
one shot of a lit, open doorway — `P014` — and it had been sitting in the middle of poem 01.
It is now the last image before the credits, and the man walks through it.

**The room is the refrain, not the first act.** Twelve takes of the teal bedroom stay in
poem 01; the remaining thirteen come back as the closing card of poems 02–13. The text does
this itself — *"What isn't mine, I still can not give"* closes poem 01, closes poem 02 word
for word, and comes back a third time as poem 08's final card.

**The reel.** 14_S4 reads *"A life flashes the way a reel does: the window, the tambourine,
the field, the stars, the candle, the daisy, the ride, the temple, the hourglass."* Nine
images, named, in order. They are cut as nine 0.55s flashes of the nine shots where those
images actually live in this cut. It is the only place a frame is seen twice, and it is
declared as a BREAK rather than smuggled.

**Cards.** The 32 card events carry their stanza's screen text, in the archive's own
typographic register — the same small centred sans as its credit slates. The five credit
slates, which the coverage map had filed under poem 04, are the end roll, which is what
they are.

---

## THE CONCORDANCE — which poem, when

`out/CONCORDANCE.md` · `out/CONCORDANCE.json` · the **when** tab of the player

The source film was found: `WHERE YOU GO WHEN YOU LEAVE (CODEX) _ POEMS BY MARK ANTHONY
THOMAS.mp4`, 1767.6 s. Every frame of it burns its own metadata into the picture — poem, a
running clock, `FRAME (n/N)`, the image-function, and **the line**. It was read by OCR'ing 1768
one-second samples of the header strip.

**What it is:** 13 poems, each exactly **131 seconds**, 5 seconds of black between them and 5
before the first. The period is 136 s and does not vary once. 924 codex frames in total.

Two findings that change the earlier work:

- **NEW DAY is not in the CODEX.** The archive's suite has fourteen poems; the source film has
  thirteen. Remove `11 NEW DAY` from the archive's order and the two lists match poem for poem,
  in sequence — so the archive's numbering is right and the CODEX is the same film with one
  poem missing, not a different edit.
- **The archive's `full_verse` is a condensation, not the poem.** OUT OF LIFE is one 64-word
  paragraph in `WYGWYL_POEMS_MASTER.json`; the CODEX gives it 34 frames carrying 25 distinct
  lines and 86 words, including images the paragraph does not contain — *haven—*,
  *of the otherworlds*, *that calls for you*, *In photographs & film*. Every cut made from this archive, ours included, was routed against
  the summary. The real text is in `cut/codex_poems.json`, line by line, with the second it
  appears.

**Four reference frames exist and they disagree**, so the concordance states each one
separately rather than averaging them into a number that is true in none:

| frame | what it is | trust |
| :-- | :-- | :-- |
| CODEX | the source film's own boundaries | **measured** — every one landed on an exact second |
| BURNED | the clock the CODEX draws on itself | **fitted** — `t = slot·131 + (frame−1)·rate`, max residual 1.7 s |
| CONTAINER | the ranges in `wygwyl_suite_mapping.json` | **claimed** — nothing here reproduces them |
| CUT B / CUT C | our own cuts | **derived** |

The burned clock agrees with playback for 11 of 13 poems. It disagrees for two: **03 HOW TO
BREAK OFF AN ENGAGEMENT** plays third and burns slot 4; **13 HOW TO WIN MY HEART** plays
twelfth and burns slot 2. That leaves slot 4 claimed twice and slot 11 claimed by nobody —
which is exactly where NEW DAY would sit. It is therefore not a coherent alternative running
order; it is the playback order with two entries wrong. Everything is timed from measured
playback.

---

## The halfworld laws this obeys

| law | how |
| :-- | :-- |
| the dot law | hard cuts only, both cuts. A dissolve is two substances briefly coexisting; this world has no alpha. |
| a cycle, not a picture | 68 near-identical takes of one room are not redundancy, they are a TRACE — a line gathering over itself. They are dealt out as a refrain instead of stacked. |
| blocking by name | every shot is staged at a stanza id. An unknown id throws; the validator refuses to build a cut with an unoccupied station or a shot used twice. |
| measure the ink | every duration was probed. The catalogue says `5` for a shot that is 39.17s long. |
| a ledger with no failures is falsified | [`LEDGER.md`](LEDGER.md) records the four mistakes made building this, including the two that produced a perfectly plausible picture. |
| BREAK | declared once, at 14_S4, in the module that uses it. |
| the score's clock | cut C's grid and cut C's bed are both 60 BPM out of `harness/build-score.mjs` — the butterfly's tapping at half rate. Nothing about the tempo was chosen. |

---

## Files

```
cutsheet.py    the cut, as data. LOOKED_AT is the by-eye classification;
               CUT_B is stanza -> shots; REEL is the declared BREAK.
build_db.py    probes all 135 sources -> shots.json  (run first)
render.py      builds both cuts + EDL + OTIO + JSON   (`python3 cut/render.py a|b|both`)
matrices.py    emits Matrix O / A / B / E / F from the rendered timeline
pagedata.py    one JSON for the player page
index.html     player: two cuts, timeline strip, script with clickable shot chips
frames/        one measured mid-frame per shot, HDR tone-mapped
segments/      144 conformed intermediates. Safe to delete; re-render is
               incremental, so deleting one segment re-renders only that one.
dedupe.py      fingerprints all 135 shots (9 frames each) -> fingerprints.json
pick.py        one picture, one take: the measured selector -> selection.json
bastard.py     builds cut D, the deduped cut     (`python3 cut/bastard.py`)
leads.py       builds the 14 DJ leads            (`python3 cut/leads.py`)
music.py       measures the 34 VOLHOLLA tracks -> music.json  (notes kept verbatim)
musiccut.py    builds cut E on a track's own bar grid  (`python3 cut/musiccut.py <slug>`)
deck.py        builds cut C on the 60 BPM grid   (`python3 cut/deck.py --all`)
build-deck-score.mjs   the bed, from the halfworld's own four voices
concordance.py builds CONCORDANCE.md / .json from the OCR
codex_ocr.json   1768 parsed header samples off the source film
codex_poems.json the actual poems: 13 × N lines, each with its second
deck_segments/ 144 video-only intermediates for cut C
out/           the masters and the conform data
```

**Conform.** `out/*.edl` (CMX3600, non-drop, origin `01:00:00:00`) and `out/*.otio`
(Timeline.1, 24fps) both come off the same timeline object as the render, so they cannot
drift from the picture.

**Matrices.** `MATRIX_O_OLOG.md` (diagnosis + relations) · `MATRIX_A_GENOME.yaml`
(111 beats, 144 patches) · `MATRIX_B_STORYMAP.md` (poem → stanza → shot) ·
`MATRIX_E_BLUEPRINT.json` (previous/current/update per entity) ·
`MATRIX_F_REFORGE.md` (six reconstruction prompts per patch, derived from the probed file
and the line it serves).

## Re-cutting

Edit `CUT_B` in `cutsheet.py`, then:

```bash
python3 cut/render.py b && python3 cut/matrices.py && python3 cut/pagedata.py
```

Segments are named `<index>_<patch>.mp4`, so anything whose position or source changed gets
a new name and re-renders while the rest are reused; the concat only ever reads the names the
current timeline asks for. Stale files are inert — `rm cut/segments/*.mp4` when they pile up.
