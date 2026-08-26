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

---

# THE FILM PLAYS ITSELF

    node wygwyl/deep/sonify.mjs 13              a film, under its own prosody
    node wygwyl/deep/sonify.mjs --cards         what the fourteen laws do
    node wygwyl/deep/sonify.mjs 13 --icon       transmit one frame as sound
    node wygwyl/deep/develop.mjs 13 --plate --score    and read it back

A beflix frame is a field: x, y, and a magnitude. A spectrogram is a field: x,
y, and a magnitude. They are the same object and one of them has simply never
been asked to make a sound.

## FOURTEEN LAWS FOR HOW SPEECH OCCUPIES TIME

A fixed scan rate is a metronome, and a metronome is the one thing none of
these poems is. Every film declares a `score` naming an African prosodic
engine — the same kind of declaration as `drone` and `window` — and the engine
returns four numbers as a function of position through the film:

| | |
|---|---|
| `sweep(u)` | seconds for the head to cross the frame — the breath |
| `gate(u,p)` | where the vacancies are, `p` being the scan's own phase, so a tradition puts its silence at a place in the **line** rather than in the clock |
| `ground(u)` | how much of the picture's own background is allowed to speak |
| `attack(u)` | the amplitude exponent — a wash, or a statement |

Four, and not more, because a law with fifty knobs is a preference. Gabay's
ground is mute for the whole film: nothing accompanies. Jaliya's cycle does not
vary and only its ground opens, because the ground is the generations being
added. Izibongo's floor is 0.06, so its silence is real silence. Imzad has the
longest breath and the largest vacancy in the suite and nothing accumulates.
The title declares no engine at all, which is the point of the title: the voice
before it has learned anything.

Eleven modes come with them and their semitones may be **fractional**, because
the quantiser is a ratio and not a piano. Bayati's neutral second and rast's
two neutral degrees are most of the distance between a qsida and a lament. The
root is each film's own drone base folded into one octave, so the suite keeps
one key area and gets fourteen prosodies inside it.

Because the breath varies, scan phase is **integrated** rather than taken from
a modulo. A modulo on a changing period teleports the head, and a teleport is a
click.

## FIGURE IS CONTRAST IN EITHER DIRECTION

Sounding only ink above the frame's modal level silenced every dark-room
passage outright — eight seconds of digital black in FLASHING LIGHTS, which
gabay's gate floor of 0.30 cannot produce. When the room is level 7 and the
mirror and the window are paper holes, the composition is carried by the holes.
A pale form on a dark field is exactly as much a figure as a dark form on a
pale one. Contrast is normalised by the headroom in whichever direction it
went, so two levels up from a bright ground and two levels down from a dark one
weigh the same.

Measured across the suite, the ground-ink population runs from **0%** in MAGIC
RIDE, which is all figure and has no wallpaper to let in, to **69%** in YET,
HEARD. On MAGIC RIDE the `ground` knob is honestly inert.

## ICON: A FRAME, TRANSMITTED

`--icon` gives up the key to get the picture back — one band per row, six
octaves of continuous log frequency, one column per column, a single
left-to-right pass with no return, no gate, no mode, and the frame held still.
What comes out is not music. It is the frame, sent as sound.

`develop.mjs` receives it by **transforming the rendered audio**, not by
reprinting the amplitudes that were sent, which would prove nothing at all. If
a harbour comes out of the far end of an FFT, the harbour was in the sound.

Both go through one printer, `screen.mjs`: the spectrogram's ramp and the
film's own 8×8 ordered Bayer, applied in output pixels so the dot grid is
continuous across the print, with the dot's contrast closing at both ends —
solids stay solid, paper stays paper, and only the midtones are made of dots,
which is what a halftone actually does. The sound prints in the film's
polarity, ink dark, because a spectrogram's nothing is black and a sheet of
paper's nothing is not.

## FOUR THINGS I REASONED MY WAY INTO AND THE NUMBER REFUTED

The true field is right there, so "it looks about right" was never the test.
`--score` correlates the developed field against the frame it came from, in
thirds, because the bottom is where the physics bites and an average hides it.

| change | fidelity | why the reasoning failed |
|---|---|---|
| peak per row, not sum | 0.389 → 0.607 | a row at 9600 Hz owns 43 bins; summing integrates 43 bins of leakage for the sky and one for the ground |
| Hann, not Blackman-Harris | 0.510 → 0.607 | BH's 92 dB sidelobes only matter if you *sum* them; a peak never reads a sidelobe, and then only main-lobe width counts |
| window sized to the column | 0.607 → 0.830 | 16384 samples is 371 ms and a column of a 70 s transmission is 365 ms — so it is computed, not chosen |
| no companding | 0.697 → 0.830 | the channel is resolution-limited, not noise-limited, and a neighbouring row is not helped by Dolby |

**0.830 overall, 0.841 sky, 0.842 ground.** The moon with its bands, the lit
shed windows, the boat, the dancers and the benches all come back.

## AND THE PART THAT CANNOT BE FIXED

144 rows over six octaves puts the lowest rows three and a half hertz apart. A
transform that separates three and a half hertz needs a window a third of a
second long — longer than the column it is reading. The bottom of the frame
therefore cannot arrive at any speed, and nothing at the receiving end invents
it. Five octaves from 300 Hz moves the tightest spacing to seven hertz and the
picture stands up.

There is a second, tighter limit that is easy to miss: the head crossing 192
columns amplitude-modulates every band at the column rate, and sidebands land a
column-rate either side of each carrier. At 40 seconds that is 4.8 Hz against a
7.3 Hz row spacing — every row bleeding into the one below it, the reader
printed over the picture. Ninety seconds brings it to 2.1 Hz. A frame takes a
minute and a half to send. It is a transmission, not a performance.
