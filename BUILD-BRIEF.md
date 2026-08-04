# I REMEMBER BEING A BUTTERFLY — build brief

**READ `MOTION-BRIEF.md` FIRST. This world animates; that changes everything below.**

A halfworld of a single continuous story: a laboratory butterfly refuses a choice maze and draws, by
striking the ceiling, a broken circle its keeper recognises from a 1945 photograph.

```
 40 units · one movement · 7 cast · 14 concepts · 102 spoken lines
 5 authored rooms — 8.0 units per room
 8 motions, every scene declaring one
```

| file | what |
|---|---|
| `atlas/source.json` | the corpus: units with `beats`, `el`, `motion`, `loop`, `plan` |
| `engine/motion.mjs` | the eight motions, all pure functions of `u ∈ [0,1)` |
| `MOTION-BRIEF.md` | **the contract that makes this world move** |

**The look.** Same first law as the sibling world: all geometry bottoms out in ink dots on paper,
eight quantized levels, ordered halftone, hard black contour, no gradients, no blur. But the register
is different — this is a laboratory, a converted textile mill, and a rearing facility behind a paper
warehouse. Cold surfaces: acrylic, stainless steel, plastic sheeting, tile, waxed paper, rust,
fluorescent tube. One accent. Lavender is a *smell*, not a colour, and must never be drawn purple.

**The central object.** The broken circle is authored once in `brokenCircle()`. It appears as a flight
trace, a pen mark, a scar, a wing marking and fresh paint. They are the same shape or the world is
lying.

---

## 1. THE LOOK

Same substrate, different vocabulary. Halfworld's first law holds: **all geometry bottoms out in ink
dots on paper**, eight quantized levels, ordered-dot halftone, hard black contour, no gradients, no
blur, no photorealism. Cream paper, ink, one accent.

But this is not Ithaca. The forms are domestic and bureaucratic: vinyl siding, folding chairs, a
laminate counter, a mailbox, a cul-de-sac bulb, fluorescent ceiling grids, a projector screen, deer
at the treeline. Draw the suburb with the same discipline the Odyssey drew a megaron.

Read `odyssey-halfworld/engine/halfworld-engine.mjs` (dot law, `renderAsset`, `placeInstance`,
`inkCutout`) and `odyssey-halfworld/engine/figure-hero.mjs` (the figure rig) before writing anything.

## 2. ROOMS ARE AUTHORED ONCE — from day one

The Odyssey learned this late and paid for it. Here it is a starting condition.

Author each recurring space **once**, in top-down plan space (`x` 0..1 left→right, `z` 0..1 far→near),
using `odyssey-halfworld/engine/blocking.mjs` (`makePlan`, `blockingAt`, `occupancyAt`). Scenes
reference **stations by name** and never hand-place a figure.

Episode 101 needs four plans, and one of them carries most of the show:

- **`the-court`** — the cul-de-sac as ONE continuous exterior: the bulb, the mouth of the street, the
  driveways and mailboxes of 4, 5, 6 and 8 Abiding Court, the treeline where the deer stand. Five of
  eleven scenes play here. The geometry is the argument: proximity without neighbourliness, so
  stations must be near each other and *facing away*.
- **`multipurpose-room`** — folding chairs in rows, a table at the front, a screen, a door at the back.
  The room where standing is granted or refused.
- **`land-use-office`** — a counter, a queue line, desks behind, a wall of forms.
- **`library`** — stacks, a public terminal, a reading table.

Include **contact pairs** (two stations a hand's width apart) anywhere bodies might touch, hand
something over, or block each other. Export `exitOccupancy` computed via `occupancyAt()` — never
hand-written — and have each scene import the previous scene's as its `INITIAL`.

## 3. CHARACTERS COME PRE-WRITTEN — use their world-text

Read `atlas/cast/<id>.json`. **This is the spec — do not invent a character.** Marjorie is "a cheerful
sixty-eight-year-old association president who delivers sanctions warmly and never raises her voice";
that sentence should be legible in her rig.

Each record carries an already-authored CAST contract, far more than a description:

- **`entities`, grouped by type** — 176 across the world: `person`/`creature`, `morphology` (47 — face,
  hair, body, hands, drawn separately), `costume` (15), `behavior` (20), `voice` (20), `psychology` (14),
  `constraint` (20), `grounding` (20). Each has `traits`. Marjorie's face is specified down to "small
  deep-set eyes with heavy upper lids" and "sun spots on temples and forearms, no scars".
- **`locks`** — 226 across the world: `identity_locked`, `face_locked`, `body_locked`, `hair_locked`,
  `wardrobe_locked`, `silhouette_locked`, `voice_locked`, `motion_logic_locked`, `genre_drift_allowed`,
  `expression_range`, `motion_complexity`, `dialogue_density`. **A lock is a constraint on your rig, not
  a suggestion.** `silhouette_locked: true` means the silhouette may not change between states — which is
  exactly the guise pattern's base spec. `expression_range` and `motion_complexity` bound the liveness
  layer. Obey them and log in your ledger which lock forced which decision.
- **`relations`**, **`outputs`**, and **`scenes`** — every scene that character appears in, world-wide.

Six of the twenty are **creatures**: a very old dog with a cloudy left eye, three white-tailed deer,
a tabby fed at four houses under three names, three crows that remove objects from the debris, turkey
vultures holding a dihedral V, and trout in a creek that appears on no plat.

> **Correction, logged.** An earlier draft of this brief said the deer "cross at the same hour". That
> was wrong, and the plans agent caught it from the scene headings, which show both morning and evening
> crossings. The world-text says they cross **at the identical point in the identical order, because
> their route predates the plat.** The constant is the route, not the clock. That is the whole series
> in one animal, and `DeerLock` enforces it: *do not alter the crossing point or the crossing order ·
> no golden-hour glow, no lens flare, no slow motion · they are ordinary suburban deer at all times.*
> Note that scene A2.03's heading reads MAGIC HOUR. **The lock wins.** Draw ordinary dusk. One is an **angel** with permanently spread wings working as a licensed restoration contractor.
One, Mona, is **a household intelligence with no body** — solve that as a drawing problem, not by
drawing a person.

One module per character, **one body with named state variants** (the Odyssey's `guise` pattern — see
`odyssey-halfworld/engine/guise.mjs`). Never two modules for one person. Keep hand-drawn `ctx`
overpaint at **zero** if you can: the rig should do the work. Overpaint is exactly what made six
Odysseus modules drift out of family.

## 4. THE CONCEPT GRAPH IS A DIRECTOR

`atlas/acres-source.json` → `concepts[]`: eleven concepts (MANSION/STAYING, STANDING/THE PARTY,
NEIGHBOUR/CUL-DE-SAC, WATCHED OVER, LOVING GRACE/CARE, THE MEADOW…), each with a gloss, a source
epigraph (Turing, Brautigan, Scholem, Benjamin) and **weighted document references**.
`atlas/ep101.json` carries each scene's top concepts.

Use them. A scene weighted `watched` should be framed differently from one weighted `standing`. The
concept is what the scene is *about*, which is information the Odyssey never had.

## 5. KNOWN TRAPS — inherited, do not rediscover

- Everything comes out 2–3 ink levels **too dark** on a first draft. Prefer light planes with dark
  accents; plenty of paper must show.
- Full-width horizontal bars (counters, ceiling grids, fences, shelves) **stripe the frame**. Break every span.
- Small type **dissolves** in the dot lattice. Draw numerals and signage as geometry, or size ≥33px.
- A blue accent mark **prints black** — the post pass quantizes by luminance. Accents are semantic.
- Effects take a **normalised 0..1 progress**, not elapsed seconds. Feeding seconds froze 56 of 60
  Odyssey effects at their final frame, undetected, for months.
- `placeInstance` fits the **measured ink**, not the nominal box. Do not reintroduce fixed-box drawing.

## 6. THE LOOP

Write → render → **read the PNG with the Read tool** → revise. Up to 3 iterations. Judge the image,
not the code. Log every pass to the process ledger, including what you saw and rejected.

Verify with the Odyssey harness (`odyssey-halfworld/harness/render.mjs`, `render-scene.mjs`) or a local
copy of it; report real numbers, never impressions.

## 7. HONESTY

Report what is weak. A self-assessment with no weakness is worthless and will be treated as unread.
If an instruction in this brief makes the work worse, say so instead of obeying it.
