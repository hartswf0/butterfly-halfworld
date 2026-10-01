# AUDIO RADIOLOGY

Every sound in the repo, imaged in five planes, measured, and — where a model can
say so — named.

```bash
python3 -m http.server 8177   # then open /AUDIO/
```

## Two layers, deliberately separate

**The physics layer** (`cut/pf/audio_scan.py`) runs on every file in under a
second each and downloads nothing. It cannot fail for want of a network.

**The semantic layer** (`cut/pf/audio_label.py`) needs a 2 GB model and can fail.
It is a separate pass writing into the same index, so the imaging is never held
hostage to the labelling.

## The plate

A waveform is one projection of a sound the way an X-ray is one projection of a
body: useful, and not the thing. Each file gets five planes taken by different
physics, read side by side:

| plane | what it is | what it shows |
|---|---|---|
| **WAVEFORM** | amplitude in time | the X-ray — shape, transients, silence |
| **MEL** | energy across frequency in time | the MRI — where the body is |
| **CHROMA** | the twelve pitch classes | the harmonic slice — what key |
| **ONSET + BEAT** | attack envelope with detected beats | the ECG — its pulse |
| **H / P** | harmonic and percussive separated | tissue contrast — pitched vs hit |

with a measurement line: duration, peak and RMS dBFS, crest factor, spectral
centroid, rolloff, bandwidth, flatness, zero-crossing rate, onset count and
density, tempo, estimated key, harmonic ratio, and silence share.

Key is Krumhansl–Schmuckler: correlate the chroma against every rotation of a
major and a minor template and take the best. It is an estimate and is stored
with its correlation so you can see how much to trust it.

Plates image the **first 45 seconds**. A 512-second score is a different kind of
object and is marked `TRUNC` rather than silently summarised.

## The cohort view

One plate tells you about one sound. The scatter at the top tells you what kind
of library this is: spectral centroid against harmonic ratio, radius by duration,
colour by family. Clusters are the house sound; the outliers are where the
interesting material is.

## The naming

`audio_label.py` uses LAION-CLAP, which maps audio and language into one vector
space the way CLIP does for images. The taxonomy is embedded **once** and only
the audio is embedded per file — the obvious pipeline re-embeds the same phrases
for every file, which is the difference between minutes and hours.

Four axes, because a flat classifier cannot produce a compound name and the
EarSketch constant is `[CREATOR]_[GENRE]_[TYPE]_[ID]`:

- **type** — mainbeat, kick, snare, hihat, perc, bass, sub, pad, lead, pluck,
  guitar, strings, brass, vox, spoken, riser, texture, fx, field, silence
- **genre** — hiphop, trap, house, edm, dubstep, funk, rnb, soul, rock, jazz,
  ambient, orch, pop, noise
- **character** — bright/dark, clean/dirty, wet/dry, acoustic/synth
- **motion** — loop, oneshot, phrase, bed

**On confidence.** Zero-shot scores are relative, not absolute: something always
wins. Every label carries its margin over the runner-up, and anything under the
floor is written `?` rather than guessed. A library labelled confidently and
wrongly is worse than one that admits where it is unsure.

## What the corpus turned out to be

1,095 sounds imaged, 0 failed. 985 samples, 110 tracks.

```
SAMPLE   type      16 distinct · top HIHAT 18%
         genre     14 distinct · top HOUSE 41%
         character  9 distinct · top WET   40%
         motion     5 distinct · top PHRASE 28%

TRACK    type      11 distinct · top "?"  34%   declines rather than guesses
         genre     10 distinct · top "?"  35%
         mood       7 distinct · top CALM 45%      confidently, gap 0.062
         production 7 distinct · top POLISHED 75%  confidently, gap 0.112
```

**Uniform is not the same as stuck**, and the report distinguishes them. If one
answer dominates *and* the winning margins are wide, the corpus really is that
way — 75% POLISHED at a median gap of 0.112 is a library of studio renders,
correctly described. If one answer dominates on thin margins, the vocabulary has
no purchase and is defaulting. Only the second is a problem, and only the second
is worth rewriting a taxonomy over.

For comparison, the first taxonomy — one sample vocabulary applied to everything
— answered PLUCK for 46% of finished tracks and POP for 54%, on thin margins.
That is what stuck looks like.

## Rebuilding

```bash
python3 cut/pf/audio_scan.py              # physics, all files
python3 cut/pf/audio_scan.py wygwyl/chops # or a subset
python3 cut/pf/audio_label.py --limit 24  # semantics, a taste first
```

Both are resumable: already-imaged files are skipped, already-labelled files are
skipped.
