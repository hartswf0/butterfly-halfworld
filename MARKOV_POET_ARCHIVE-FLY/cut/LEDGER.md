# LEDGER

> *A ledger with no failures is a falsified ledger.* — the fifth law

What this pass saw, what it changed, and what it got wrong on the way.

---

## What was already here

| file | what it claims | what it is |
| :-- | :-- | :-- |
| `WYGWYL_135SHOT_MASTER_CUT.mp4` | 135 shots, zero repeat, 11:15 | 20:46 of h264. 71 of 135 shots inside poem 01; poem 02 gets three. Every shot laid down at a flat 5s regardless of its real length. |
| `WYGWYL_HDR_MASTER_CUT.mp4` | the HDR cut | 8-bit h264, `color_transfer=unknown`, 374s. There are 21 HDR shots in the archive and they total 106s. Whatever this is, it is not the HDR. |
| `WYGWYL_14POEM_DIRECTORS_CUT.mp4` | the directors cut | 212s, SDR. |
| `WYGWYL_COVERAGE_MAP.json` | `coverage_percentage: 48.8`, `gap_stanzas: 19` | measures a misfile, not the archive. See below. |

---

## Defects found, in the order they were found

**1. The category field is a garbage bucket.**
68 of 135 shots carry `visual_category: POET_DIM_BEDROOM`, and every one of them routes
to a single stanza, `01_S3`. Extracting a mid-frame from all 68 and looking at them shows
fewer than twenty are that room. The bucket had also absorbed:

- `P054` — the film's **OUT OF LIFE neon title card**
- `P104` — the **NEVERMORE raven title card**
- `P109` — the **NEVERMORE typewriter card**
- `P049 P050 P051 P052 P053` — **all five credit slates** ("Poems by Mark Anthony Thomas",
  "Prompts by Watson Hartsoe")
- `P066` the DJ booth · `P092 P125` the television walls · `P119 P120` the subway ·
  `P058` the LOVELESS motel with a car on fire

The tell was in the source data all along: the shots in that bucket are exactly the ones
whose `visual_prompt` is empty or is a fragment like `"the dj s right hand"`. The category
was assigned where the prompt was unreadable, and the default was the bedroom. Every
number downstream of that field inherits the error.

**2. Durations were assumed.** The catalogue's `duration_seconds` column reads `5` for
`P055`, which is 39.17s. Real durations run 5.04s → 39.17s. The prior cut used the
catalogue value.

**3. The HDR was thrown away.** 21 shots are HEVC, `yuv420p10le`, `bt2020nc`, `smpte2084`.
Fed into an SDR timeline without conversion they go milky and desaturated — which is what
they look like in every existing cut. Three tone-map operators were rendered side by side
and compared as images before one was chosen; `hable` at `npl=100` holds the blacks and
the neon. Cut A avoids the question entirely by never re-encoding.

**4. The suite's own script was never cut to.** `wygwyl_suite_mapping.json` carries 111
stanzas with screen text, voiceover, a Deleuzian image-function and a card/motion flag.
Nothing in the previous cuts references it. 135 shots against 111 stanzas is 1.22:1.

**5. The archive contains exactly one shot of an open, lit doorway** (`P014`), and poem 14
ends *"the kind I once fell out of a window to escape. This time, I choose the door."*
`P014` had been sitting in the middle of poem 01.

---

## What the second pass found

**The source film exists and it labels itself.**
`~/Downloads/WHERE YOU GO WHEN YOU LEAVE (CODEX) _ POEMS BY MARK ANTHONY THOMAS.mp4`, 1767.6s,
880×720. Every frame burns `POEM`, a running clock, `FRAME (n/N)`, the image-function and the
line into the picture. OCR of 1768 one-second samples of the header strip gave 13 poems, each
exactly 131s, 5s of black between, 924 codex frames, and the whole text.

- **NEW DAY is not in it.** Fourteen poems in the archive, thirteen in the film. Remove
  `11 NEW DAY` and the orders match poem for poem.
- **`full_verse` is a summary.** OUT OF LIFE: 64 words in the archive, 25 lines in the film (34 frames),
  and the film's version has images the summary doesn't. Everything cut so far, ours included,
  was routed against the condensation.
- **The burned clock is wrong twice.** It fits `slot·131 + (frame−1)·rate` for all thirteen and
  matches playback for eleven. 03 plays third and burns slot 4; 13 plays twelfth and burns
  slot 2. Slot 4 is claimed twice, slot 11 by nobody.
- **`ID` is not `FRAME`.** `ID:BL002` sits at `FRAME (2/77)`, `ID:BL023` at `(31/77)`,
  `ID:BL059` at `(75/77)`. And the stamp format is not uniform: BLOODLINE burns `MM:SS:mmm`,
  HOW TO BREAK OFF burns `MM:SS:FF`.
- **The CONTAINER ranges match nothing.** 14 poems over 1440.07s, lengths from 72.4s to 135.3s.
  The CODEX gives every poem 131s. They don't correlate with codex frame count either. They are
  recorded as a claim and are not used to time anything.

---

## Mistakes made in this pass

- **First reading of the 68-shot grid was wrong.** The grid was built from a filtered list
  whose indices did not line up with patch ids, so `P033` was recorded as the OUT OF LIFE
  neon when it is a bedroom, and the neon is `P054`. Caught by extracting twelve specific
  patch ids by name and looking at them. Everything after that point was re-derived from
  per-patch mid-frames in patch order, six grids of twenty-four.
- **First allocation starved three poems.** Poem 13 was assigned zero shots, 12 got two.
  The validator (`all 135 placed once` + `all 111 stanzas occupied`) caught it; the table
  was rebalanced from a budget rather than by feel.
- **First render died at segment 83.** `drawtext` was given
  `WHAT ISN'T MINE, I STILL CAN NOT GIVE.` inside single quotes; the apostrophe closed the
  quote and the next comma split the filter chain. Fixed by writing card text to a file and
  using `textfile=`, and by escaping the commas in the alpha ramp. Card text now uses a
  typographic apostrophe, which the archive's own credit slate also uses.
- **`tile` silently dropped inputs three times** when the frames had mixed aspect ratios.
  Each time the montage came back with three tiles instead of twenty-six and looked like a
  successful render. Every contact grid after that is padded to a fixed frame first.

Four of the five were caught by looking at an image. One was caught by a count. None were
caught by the code running without error — all five ran clean and produced a plausible
picture.

## What the third pass found — and it was my own defect

**"Every shot used once" was the wrong law and it made three bad films.** It is a
coverage guarantee. Fingerprinting nine frames of every shot and measuring the
distances says what the eye already said:

```
61 distinct pictures across 135 shots
24 pictures with 2–18 takes;  98 of 135 shots are a repeat of something already on screen
largest: THE ROOM 18 · THE FOG ROOM 8 · NEON SKELETON 7 · THE STARBURST 6
         SCREEN IN THE ROOM 5 · CREDIT SLATE 5 · TRAIN WINDOW 5
```

Cut D replaces the law with ONE PICTURE, ONE APPEARANCE and drops 84 of the 135.
Six more were disqualified outright on resolution — the archive contains 640x352
takes that had been going out at 1280x720.

**A limit of the fingerprint, stated:** the perceptual hash is trustworthy for
finding true duplicates (distance 0.00–0.12; P044/P045 measured 0.000, P008/P009
0.008) and unreliable above ~0.15, where it starts pairing a burning car with a
shoreline. So the second cull of twelve was done by eye and each one is named in
`cut/final_selection.json` rather than attributed to a metric that did not decide it.

## Mistakes made in the second pass

- **A regex matched every line except the one it was for.** `P0?EM` matches `PEM` and `P0EM`
  but not `POEM`, so all 1768 OCR rows parsed to `poem: None`. The failure looked like *the
  film has no poems in it*, which is a conclusion, not a bug report. Caught by printing one raw
  OCR line instead of the parse. The same class of error had already happened once this session
  (`p0?em` vs `p[o0]em`) and it happened again anyway.
- **The first grid of the 68-shot bucket was indexed off a filtered list.** Recorded in the
  first pass; the fix — extract per patch id, in patch order, and read six grids of twenty-four
  — is what made the second pass's classification trustworthy.
- **The deck lost 45 frames and nothing errored.** Each segment carried an `anullsrc` audio
  track marginally longer than its video; concat offsets the next segment by *container*
  duration, so 144 segments drifted 1.8s and `-shortest` trimmed the picture to fit. Container
  duration said 512.000 and the file was wrong. Caught by counting frames
  (`-count_frames`), which is now an assertion in `deck.py`: 12 288, or the build fails.
  Fixed by rendering the deck's segments video-only.
- **Three shots would have looped visibly.** The first beat allotment handed 11-beat slots to
  5-second takes while 33-second takes sat at the same length. Caught by a report line, fixed
  by water-filling the spare beats into the takes that can hold them. Zero loops now.
- **`hidden` did nothing.** `#left{display:flex}` beats the UA stylesheet's
  `[hidden]{display:none}`, so the concordance rendered *underneath* the player rather than
  instead of it. Caught by a screenshot; the JS had reported everything correct.

---

## What changed

- Classification is now by eye, from extracted mid-frames, recorded in `cutsheet.py::LOOKED_AT`.
- Routing is stanza-level: 111 named stations, each occupied, 135 shots placed once.
- Poem 01 holds 15 shots instead of 71. The narrowest poem holds 7. Longest movement 84s,
  shortest 42s.
- The room became the refrain rather than the first act: twelve takes stay in poem 01, the
  rest return as the closing card of poems 02–13.
- The five credit slates became the end roll, which is what they are.
- `P014`, the door, moved to `14_S6`.
- `14_S4` is a declared BREAK — the only place a frame is seen twice, and the poem asks for
  it by name in the order it asks for it.

## Mistakes made in the third pass

- **`cut/select.py` shadowed the standard library.** `cut/` is on `sys.path`, so
  `import subprocess` → `import selectors` → `import select` found my file and died
  with `module 'select' has no attribute 'select'`. Renamed to `pick.py`.
- **Cut D came out 17 frames short of its own arithmetic.** Lengths were declared in
  seconds; the sum of `round(dur*24)` is not `round(sum(dur)*24)`. Lengths are now
  declared in frames. Caught by the frame-count assertion added after the deck lost
  45 frames the same way — the check worked, which is the only reason this entry is
  short.
- **The first DJ leads gave a 5-second take a 10.7-second slot** and it restarted
  mid-shot, which reads as a dropout, not a loop. Rebuilt on eight one-bar slots
  cycling the poem's pictures instead, so nothing loops inside a slot.
- **The distance metric was nearly used for a cull it cannot support.** It ranked
  `P132 HEART AT SHORE ~ P058 LOVELESS / BURNING CAR` at 0.227 — two pictures with
  nothing in common. Caught by reading the pair list instead of applying it.
