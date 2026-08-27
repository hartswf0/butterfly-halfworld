# THREE PROGRAMS, THREE ANSWERS TO WHERE TIME COMES FROM

Read from the source rather than from the descriptions.

| | theory of time | primary operation | what is given | what can change |
|---|---|---|---|---|
| **ARCHIVE RADIO** | time is **found** | listen / select / juxtapose | recordings that already happened | sequence, collision, context |
| **WYGWYL SUITE** | time is **shared** | synchronise / layer | poem, voice, drone, films | the relation of media around one clock |
| **SKETCHSONG** | time is **constructed** | translate / perturb | word, mark, image | the rule that produces musical form |

## THE DIFFERENCE THAT MAKES A DIFFERENCE IS WHERE THE ARROWS POINT

**The suite player is a temporal join, and a join is not a relation.** One
`<audio>` element is the clock. Everything else is a lookup on it:

```js
const local = Math.floor((t - f.container[0]) * FPS);   // FPS = 8
const h     = headFor(item, local);                     // binary search the poem
const node  = item.twin.nodes[local];                   // the frame's BEFLIX commands
```

Every medium is a **child of `t`** and none is a **parent of any other**. Poem,
film, frame, drone and metadata are siblings joined on a key. There is no
expression anywhere in that program whose value depends on another medium — only
on the clock. Which is why nothing in it can make the drone respond to the poem:
not because the feature is missing, but because the shape has no place to put it.

**Sketchsong does have the arrow, and that is the real advance** — the
translation rule is written where you can argue with it. But it is compiled by a
language model, runs one way per generation, and is not live. Its own schema
shows what an arrow nobody can measure costs: sixteen synthesis effects are
required, generated, stored, carried through history and exported, and grepping
the synthesiser for each gives `cutoff 2` and **thirteen zeroes**. One of sixteen
is wired. Valid JSON, real names, legal types, no error message, ever.

So the missing thing is not another medium and not a bigger model. It is an arrow
that is **live, reversible, and measurable**.

## WHAT THE SUITE'S OWN DATA ALREADY KNOWS

Lifting the beat map out of the fourteen twin EDLs — 111 beats, 80 with voice,
26 KB — the poet's real timing turns out to carry a structural constant nobody
wrote down:

| | |
|---|---|
| median gap between beats | **14.1 s** |
| silence before the voice enters | **4.4–5.4 s in 13 of 14 films** |
| except film 01 | **29.8 s** |

Thirteen films hold almost exactly five seconds of silence before the poem
begins, and the first one holds thirty. That held breath is the temporal commons
the whole suite leans against, and it was in the data before it was in anyone's
theory. It is now `wygwyl/poem/beats.json`, and it is what RADIODRAW's POET is
made of.

## RADIODRAW — `cool-sketch-radio.html`

*(Rebuilt as a patch collage. The relation-graph version described below was the
wrong shape — kept here only because the falsification finding stands on its
own. What the page actually is now: one field, and every layer is a patch of it.)*

### ONE LAW, USED BOTH WAYS

    row r  <->  LO * (HI/LO)^((143-r)/143)          140 Hz .. 7168 Hz

A sound dropped in is transformed through it and quantised to eight levels; the
read head crosses the field and resynthesises through it. So a patch laid where
it was analysed plays back as itself, and every collage move is a signal
operation you can see:

| | |
|---|---|
| move it **up** | it is higher |
| move it **right** | it happens later |
| stretch it **wide** | it is slower |
| stretch it **tall** | its intervals open out |
| lower its **level** | it is quieter |
| **cut** a hole in it | that band goes silent |

Those are not metaphors for one another. They are the same thing said twice. A
six-second slice of the record becomes exactly 96 columns wide in a 12-second
loop, because the field's width **is** the clock — nothing has to be told what
tempo anything is.

A patch stops remembering where it came from: a voice, a song, a slice of the
suite's own record, a frame of any of the fourteen films, or a rectangle painted
by hand. Once it is in the field it is eight-level ink and it will be sounded
whichever it began as. **max** lays a patch over what is beneath without erasing
it, **over** replaces, **add** accumulates, **cut** notches a band out.

And the polarity flips here: on every other page ink is dark on a bright field,
because that is what a beflix frame is. This field **is** a spectrum, and an
empty region of a spectrum is silence — printed as paper it came out as a
blinding slab across everything nobody had put a patch on yet. Nothing is dark,
energy is bright, and a film frame dropped in reads as the spectrogram it has
become.

---

### the earlier relation-graph version


**Characters** emit; **targets** receive; **arrows** relate them with one of six
relations — FOLLOW, RESIST, ANSWER, SHADOW, UNDERMINE, DRIFT. Six ways one thing
can attend to another, not fifty parameters.

**The clock is not a master.** Each character offers a rate at which it thinks
time should advance, and the clock is a weighted compromise. POET holds time
still through the silences; PULSE advances it in steps; FIELD makes a dense
picture slow to cross; RADIO hands the scene to an outsider. Blend them and the
clocks negotiate — mortar in a literal computational sense. `clock poet 0.8
pulse 0.2` measurably moved the rate from 1.00 to 1.15.

**The fourteen prosodic engines were already relation graphs.** `sweep`, `gate`,
`ground` and `attack` are four arrows whose source is hard-wired to the clock.
Malḥūn is CLOCK → BREATH, tightening. Gabay is GROUND ← nothing. Making the
*source* assignable is not a new system bolted on — it is the same four knobs
with the question of who turns them handed over. **With no arrows at all this
page is exactly the sketch radio.**

### THE LAW: A CORRESPONDENCE MUST BE FALSIFIABLE

Every arrow runs **twice each frame** — once with it, once with it muted — and
the difference it made to its target, in that target's own units, is printed
beside it. Tested by planting arrows that cannot possibly work:

```
POET  → GATE   ANSWER  w0.9   influence 0.444   strong
RADIO → ATTACK FOLLOW  w0     influence 0.000   DEAD
SKY   → CUT    RESIST  w0.05  influence 0.004   DEAD
```

The third is the one worth noticing: it is wired, weighted, and visible in the
graph, and it is dead because RESIST pushes a target that is already sitting on
its rail. No schema check finds that. Only running it without itself does.

**And the law applies upward.** The first run had FIELD and RADIO both reading
exactly 1.000 forever — a fixed multiplier saturates them, because ink density
runs about 0.5 on a tone film and 0.05 on a line drawing. Arrows drawn from a
constant carry no information while the influence meter goes on reporting a
healthy number. So each character now carries its own slow range and the panel
says FLAT when it loses one. A rule you enforce on arrows has to hold for the
things arrows come from.

### WHERE THE THEORY MEETS A MACHINE AND LOSES

"Any arrow can reverse" is true of a diagram and not of a program. A **source**
is something that emits a value; a **target** is something with a base and a
span. Most nodes are one or the other, so ↺ works only where both ends are both
— SKY and PULSE. And POET can never be a target: it is present as timing and
text, never as audio, so there is nothing to process. The ethic that the recorded
poet stays untouched is **structural, not a setting**.

### THE POEM IS THE PICTURE IS THE SOUND

The line being spoken is cut into the same 192×144 field the read head crosses —
the glyph as **paper**, its edge as **full ink**. Drawn at level 6 it vanished:
half this suite is tone, film 13's water sits at level 4 or 5, and one level of
contrast is swallowed by the halftone. 552 cells of ink a beat, none of them
visible.

Paper-and-edge is right twice. A caption in a beflix frame has always been a hole
cut in the field. And a paper hole in a dark ground is a **figure** by the
sonifier's own rule — contrast in either direction — so the words are not on the
picture, they are crossed by the head and they sound.

## WHERE THIS IS HEADING

Away from generating media objects, toward **programming the conditions under
which media can affect one another**. Whitney found the correspondence; Knowlton
made it writable; Eno made the generating system the work. The move left is to
make the correspondence **playable and falsifiable** — so that a machine full of
relations can be asked, at any moment, which of them are actually relating.
