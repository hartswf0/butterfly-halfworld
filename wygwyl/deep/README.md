# ABYSS — a machine trying to cry and only producing a signal

    node wygwyl/deep/render.mjs                 186s → renders/deep/
    node wygwyl/deep/render.mjs --seed 7        a different sea
    node wygwyl/deep/render.mjs --seconds 60    a shorter descent

Pure synthesis, same law as the pictures: a function of time, seeded, no wall
clock. Rendered twice it is byte-identical — checked on every run, and printed.
That is what lets a sound be **revised** rather than re-rolled.

## ONE NUMBER RUNS THE PIECE

`depth(t)` goes 0 to 1 and every layer reads it. Deeper is darker (the lowpass
closes), slower (the lung's period drifts long), further (reverb up, dry down),
more broken (detune, bitcrush, dropout) and lonelier (the voice loses its
consonants before it loses its pitch). A descent is one gesture, so it is one
variable. It is held near 1 rather than reaching it — a bottom is a resolution
and this does not get one.

## THE TWO THINGS THE FIRST PASS GOT WRONG

Nobody here can hear. That is not a reason to ship unheard — it is a reason to
build the instrument that stands in for hearing, so `render.mjs` also writes a
spectrogram, a waveform and an eight-second close-up. Both faults below were
invisible in the source and obvious in the picture.

**The lung was an instrument in the mix instead of a gate on the world.** The
pulse sat in the sub and everything else ran flat underneath it. The spectrogram
came back occupied edge to edge — no silence anywhere, which is the opposite of
a machine breathing in a dark room. Everything is now ducked by the breath, so
when the lung misses a beat the *room* misses: rain, voice and reverb all drop
together and what you hear is not a missing thump but a missing world.

**The whale was the tune.** Three harmonics sweeping through the same band the
voice sings in, for most of every cycle — a distant animal that had become the
melody. It now sings only when the shanty does not, one harmonic above the
fundamental, and it goes to the far reverb rather than the dry bus. Contrast
with the diesel was the brief; competition with the voice was not.

A third came from a number rather than a picture: integrated loudness range read
**0.7 LU**, which is a flat line pretending to be a descent. The fix was not
volume automation. The rests between the phrases now grow, and the rain thins
with depth — *a voice you hear less often is further away than a voice you hear
more quietly.* Range is now 5.7 LU.

## THE SIX LAYERS

| | |
|---|---|
| **lung** | 120 BPM, asymmetric — 0.18s intake against 0.32s ragged exhale, because a bellows is not a metronome. As depth rises it begins to *miss* beats. A failing iron lung is not a slower pulse, it is a pulse with holes. |
| **hull** | the diesel, 38 Hz with slow FM. The only layer with no reverb at all — it is inside with you. |
| **shanty** | an original modal phrase in E aeolian, sung by three formants over a glottal pulse train, then put under a mile of water. |
| **rain** | noise bursts through a bandpass into a Schroeder reverb with a ten-second tail, plus 78rpm crackle. Memory arrives already damaged. |
| **home** | the word built from phonemes — /h/ a noise burst, /oʊ/ two formants gliding as the lips round, /m/ a nasal murmur with the mouth shut. Looped on a 3s sonar interval, degraded until only the vowel is left, then only the pitch, then only the interval. |
| **whale** | a glissando where whale song and a human sob overlap, on a 23s cycle that is prime against the 3s ping and the 0.5s lung, so the three never line up and the piece never settles into a groove. |

## WHY THE VOICE IS SYNTHESISED AND NOT SAMPLED

Two reasons, and the second is the real one.

Cyril Tawney's songs are in copyright and his recordings are not ours to warp,
so the phrase here is written rather than borrowed — modal, naval, in that
idiom. But even with a licence a sample would be wrong: **the brief asks for a
voice that decays, and a sample can only be processed.** A formant model can be
*starved* — the consonants taken before the vowel, the vowel before the pitch —
which is how a memory actually goes. That is what the last minute is doing.

## WHAT IT WOULD TAKE TO GO FURTHER

The obvious next move is not more layers. It is the same loop the pictures got:
state what the sound should be, then measure whether it came out that way. The
lung's period, the ping's interval, the loudness range and the spectral centroid
over time are all checkable against a declared intent, and three of the four
faults above were found by exactly that. `wygwyl/see/` does this for images. The
audio version is the same shape and does not exist yet.

---

# THE OPERATORS

The jukebox stops being a reference list at the moment you notice that each
ancestor contributes a different **operation**, and that the operations
compose. `ops.mjs` implements six, with signatures, on buffers:

| | from | what it does |
|---|---|---|
| **LOCK** | Tawney · *The Grey Funnel Line* | a human tempo entrains to a machine one. The machine never bends; only the man does, and that asymmetry is the song. |
| **INHABIT** | Tawney · *Diesel and Shale* | one small hard compartment, and everything goes through it until sailor and submarine stop being separable. |
| **ADDRESS** | Anderson · *O Superman* | a syllable becomes the infrastructure. Not a drum part that sounds like a voice — the voice, *being* the time. |
| **RECURSE** | Lucier · *I Am Sitting in a Room* | generation *n* is made from *n−1* through a room. The master is never consulted again. |
| **DECAY** | Basinski · *The Disintegration Loops* | a destructive read: the loop buffer is mutated as it plays, so pass eleven is built from the damage pass ten did. |
| **SHELTER** | Bryars · *Jesus' Blood* | consonance gathers around a fragment, tuned to the fragment's own pitch, gain-limited so the fragment always wins. |

## THE LAW THAT MAKES IT A THEORY

**Every derived signal descends from one utterance, by operators only.** Nothing
is added from outside. In `songs/message.mjs` the diesel, the sonar ping and the
120 BPM breath are not *like* the voice — they are the voice, resampled and
filtered. So when the piece opens its bandwidth at 3:26 and lets you hear what
its pulse is made of, that isn't a gesture. It's a fact, and you can check it by
reading the file upward.

## TWO FAULTS THE PICTURE CAUGHT

**A fourteen-second hole at 74–88s.** Section II ended before section IV began
and nothing covered the seam. Invisible in the source, a black band in the
spectrogram.

**The whole middle was one unchanging drone.** Each RECURSE generation was mixed
in *once* — 600 milliseconds every 9.5 seconds, which is 93% silence. Lucier's
effect is not a sequence of blips; it is a room **arriving**. Each generation now
repeats across its own thirteen-second window until you have stopped hearing it
as a sound and started hearing it as a condition, and the next generation
replaces the condition. On the spectrogram the four generations are now four
visibly different blocks: wide formant structure at generation 0 collapsing into
a few tight harmonic lines by generation 11. What changes is not the note. It is
the room.

And one bug the crash caught: `RECURSE` returned a bare buffer without `keep`
and an object with it, so a caller who wanted only the last generation
destructured `final` off a Float32Array. An operator whose return type depends on
an optional argument is a trap set for the person composing with it, which is the
entire point of the file.

## STILL TO WRITE

The six single-operator pieces — *One More Day Out*, *The Boat Gets Inside You*,
*Mother Is On The Machine*, *The Room Learns Your Voice*, *Every Playback Costs
Something*, *The Absent Singer Remains*. Each is one operator in the foreground
instead of six in sequence, and each is now a short declarative file, because the
hard part is built.
