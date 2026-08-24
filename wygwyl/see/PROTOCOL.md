# SEE — the prompt / generate / see / score loop

    prompt ──> generate ──> see ──> score ──> decide
      │          (Ray)      (SAM)     │          │
      └──────────── the same noun phrases ───────┘

The idea is not "segment the video." It is that **the prompt is both the
instruction and the test.** You ask for a man falling past a window; you ask the
segmenter to find a man and a window; what it finds is a measurement of whether
the generator obeyed. The loop closes because the same words go in both ends.

The `bird` frame is the loop already working. A wrong noun was seeded and it
locked onto the falling man — arms out, cruciform. That is not a failure. It is
the finding: **at that moment the generated image is genuinely ambiguous between
a man and a bird**, and a loop that can tell you that is worth building.

## WHAT SAM VERSION THIS NEEDS

The loop requires **text-prompted segmentation**: hand it a noun phrase, get
every instance. If SAM 3 does open-vocabulary concept prompting, step 3 is one
call per noun and the loop is closed. SAM 2 cannot — it takes points and boxes,
so a noun has to be turned into a box by a detector first, and that detector
becomes an uncontrolled variable sitting inside your measurement. **Confirm which
before building step 3**, because it decides whether the seed is a phrase or a
click, and a click is not a prompt.

## 1 · THE MANIFEST — what the prompt promised

The prose prompt goes to the generator. Its **noun phrases** go to the
segmenter. Write them once:

```json
{
  "shot": "P11-fall-tunnel",
  "prompt": "a man falling away from camera through a tunnel of streaking city light, arms out, back to the lens",
  "expect": [
    { "noun": "man",     "count": 1, "persist": [0.0, 1.0], "area": [0.02, 0.20] },
    { "noun": "arms",    "count": 2, "persist": [0.2, 1.0] },
    { "noun": "window",  "count": 0 }
  ],
  "fps": 24, "frames": 60
}
```

`count: 0` is the important one and the one everybody forgets. **Naming what must
NOT be there is half the test** — it is how you catch a generator that answered a
different prompt convincingly.

`persist` is the fraction of the shot the thing must be present for. A man who
appears for four frames is not the man you asked for.
`area` is fraction of frame, as a sanity band — it catches the case where the
segmenter finds "a man" who is three pixels of background texture.

## 2 · THE MASK FORMAT — what the segmenter saw

One file per noun per shot. Raw, no library needed on either side:

    <shot>.<noun>.<instance>.u8      frames × h × w, one byte per pixel, 0 or 1
    <shot>.masks.json                { shot, noun, instance, w, h, frames, score[] }

`score[]` is the segmenter's own confidence per frame, if it gives one. Keep it.
The interesting failures are the confident wrong ones.

## 3 · THE SCORE — a compliance card

`node wygwyl/see/score.mjs <manifest> <masks-dir>` produces, per noun:

| field | what it catches |
|---|---|
| **presence** | fraction of frames the noun was found at all |
| **persistence** | longest unbroken run, as a fraction of the shot — a thing that flickers in and out was never really there |
| **count error** | found instances vs promised |
| **area band** | fraction of frames inside the promised area range |
| **drift** | centroid movement per frame — a mask that teleports is tracking texture, not an object |
| **forbidden** | anything with `count: 0` that was found anyway |

And one verdict per shot: **OBEYED / PARTIAL / DISOBEYED / AMBIGUOUS**.
`AMBIGUOUS` is reserved for the `bird` case — two different nouns claiming
substantially the same pixels. That is not the generator failing; it is the
generator producing an image that supports both readings, and it should be
reported as its own thing rather than collapsed into a pass or a fail.

## 4 · CALIBRATION — and why this project can do it and others cannot

A compliance score is worthless until you know the segmenter's error rate **in
this visual regime**. Before trusting "SAM found the man, therefore the
generation obeyed," you need to know how often SAM finds a man when there is
definitely one, and how often it finds one when there is definitely not.

Our fourteen films can answer that exactly. `renderScene()` returns the levels,
a field of which draw call owns each cell, and a **cast** naming what each of
those calls drew. Intersect the id field with a cast entry's tag and you have
that body's exact silhouette, labelled — not annotated, *recalled*. We are not
inferring where the body is; we are the ones who put it there.

    node wygwyl/see/emit.mjs 09 --per 24

writes a calibration set: frames, exact labelled masks, and a manifest whose
nouns are true by construction. Run SAM over it and the difference between what
it finds and what is there is its error rate — free, unambiguous, and available
at any bit depth, because quantisation is the last step in our render and the
content underneath does not change.

That last clause is the part no other corpus has. **Bit depth is a parameter
here and motion is held exactly constant across it**, so the calibration can be
run as a curve rather than a number: at what representation does the segmenter
stop finding the man. Video tokenizers quantise to discrete codes and nobody
knows what that costs the object signal.

## 5 · DECIDE

Three outcomes, and only the third is new:

- **OBEYED** — keep the take.
- **DISOBEYED** — re-prompt. The card says which noun failed and how, which is a
  far better re-prompt than watching it again.
- **AMBIGUOUS** — the interesting one. Do not re-prompt. Look at it. A shot that
  reads as both a man and a bird may be the best frame in the film, and the loop
  has just told you where it is instead of you finding it by luck.
