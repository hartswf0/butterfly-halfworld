# CUTTING TO THESE SONGS

Twenty-seven full-length tracks measured — fourteen `transmission`, thirteen
`onecut` — at 22050 Hz through a 2048-point window on an 11.6 ms hop. Open
[the cut book](index.html) to audition any point in it.

## THE FINDING THAT DECIDES EVERYTHING ELSE

**Cut against `onecut`, not `transmission`.**

| | free cuts | mean rest | range |
|---|---|---|---|
| **transmission** | **70** across 14 tracks | 2.0 s | 5.1 – 15.0 LU |
| **onecut** | **136** across 13 tracks | 8.0 s | 8.8 – 13.8 LU |

Twice the doors, four times the rest, and dynamics that never collapse.
`transmission` has four tracks squeezed under 6.6 LU — 02 at 5.1, 13 at 6.3,
05 at 6.4, 12 at 6.6 — where the song has no dynamics of its own left and the
picture has to supply all of them. `onecut`'s worst is 8.8.

The two exceptions are worth knowing: **transmission 11** has 9.95 s of rest and
14.1 LU, the most generous track in either set, and there is no `onecut 11` to
compare it to. And **transmission 06** at 15.0 LU has the widest range anywhere.

## DO NOT CUT THIS CORPUS TO A GRID

Tempo confidence runs **8 % to 47 %**, median about 19 %. Only two tracks even
approach half. Meanwhile onset density is nearly identical everywhere —
250 to 323 events a minute, about five a second, in all twenty-seven.

Events everywhere, pulse nowhere. That is a texture corpus, and a downbeat edit
would be cutting to a grid that mostly is not there. What confidence measures
here is how far the winning lag stands above the rest of the autocorrelation
distribution; under about 30 % the estimate is a shape in noise. The tool
suppresses the beat grid below 20 % for exactly this reason.

Cut to the **sections** and the **rests** instead. Both are in the sheet.

## WHERE THE PULSE LIVES, AND WHAT ANSWERS IT

Where a pulse is found at all it sits in the **low** band, 60–160 Hz. Never sub,
never presence, never air.

That tells you which picture change answers it. A pulse in the low band is
**weight**, so the edit that lands on it is a change of weight — wide to close,
dark frame to light, empty to full. Grain and texture changes will not touch it;
those are the answer to a pulse in presence or air, and there isn't one here.

## HOW TO KILL THE BEAT

### Deliberately

You do not remove the beat. **You remove its confirmation.**

1. **Cut on the downbeat into stillness, and hold past the next downbeat.** The
   ear keeps counting; the eye is given nothing to land on. One bar kills it.
   Two and the music is underwater.
2. **Cut on the last beat before a rest** — the `BREATH` rows. The song already
   stopped; the picture appears to have caused it. This is the cheapest kill
   there is and it is why the rest column matters more than the tempo column.
3. **Break the cut cadence, not the music.** Three cuts on the grid, then one a
   beat early. The eye had learned the meter and you took it away. Costs nothing
   musically.
4. **Kill it in the band it lives in** — here, weight.

### Accidentally, which is the usual way

- **Cutting on every strong transient.** Read the `mask` column: a cut inside a
  loud transient is *hidden by it*. You spend the hit and get no cut. Cut
  slightly early instead — picture leads, sound confirms. At 24 fps that is two
  or three frames; **at 8 fps it is exactly one frame.**
- **Cutting in a decaying tail** — the `tail` flag. You amputate the room. This
  is the one the ear notices and cannot name, and it is the highest-scoring risk
  in the sheet.
- **Equal shot lengths.** A cadence of identical durations flattens whatever the
  music is doing underneath it.
- **Trusting a grid that isn't there.** See above: on this corpus that is most
  of the time.

## THE COLUMNS

Every candidate in `cuts.tsv` carries a type and two numbers that answer
different questions.

**`mask`** — broadband energy at that instant. High means the cut is *audible
cover*: the music hides it. Low means the cut is naked and will read as a
decision.

**`kill`** — how likely a cut there flattens momentum, which is not the same
question. A rest scores 0.05, a section boundary 0.10, a downbeat 0.32, a bare
transient 0.55, and anything in a decaying tail takes +0.30 on top. **Free cuts
are those at or under 0.20** — the rests and the section boundaries, the doors
the song opened itself.

## RUNNING IT ON ANYTHING ELSE

```bash
npm i                                   # or have brew's ffmpeg
node wygwyl/cut/analyse.mjs "path/to/an/album"
node wygwyl/cut/bake.mjs                # to put it in the cut book
```

Per song you get an `analysis.json`, a `cuts.tsv` and a `map.png`, plus a
`SUMMARY.md` across the folder.
