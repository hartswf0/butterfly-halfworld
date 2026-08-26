# loom

`cut/out/loom`

Made by `cut/loom.py`.

## What it was for

THE LOOM — a weave that moves, where the marks keep their identity.

beflix-E stamps each cell with an element whose ink weight matches its level. Run
that per frame and the obvious thing happens: every cell re-picks, and the picture
boils. It reads as noise, because nothing on screen persists long enough to be a
thing.

So the elements are AGENTS. Each one is a specific cut-out — this person, that
window — and it keeps that identity for the whole film. What changes is where it
stands. Every frame the ink field is recomputed from the source, and each agent
seeks a cell that needs ink, preferring the one it already holds. When the picture
changes, they do not blink out and reappear: they MIGRATE, and the city reorganises
itself out of the same population.

That is the difference between a filter and a loom. A filter re-renders. A loom
moves the same threads.

  HYSTERESIS   an agent keeps its cell while that cell still wants ink, so a
               standing figure stays standing instead of flickering
  ASSIGNMENT   homeless agents claim the nearest unclaimed hungry cell, so the
               crowd flows rather than teleports
  DAMPING      positions ease toward their target, which is what makes it read as
               motion instead of a cut
  SIZE follows the level, so an agent walking into shadow grows heavier
  RESERVE      an agent with nowhere to go does not die. It drifts and waits at the
               margin, small, and is available the moment the picture opens a cell
               for it. The first version let them shrink to nothing and the crowd
               fell from 929 to 333 over two hundred frames, which is a population
               collapse dressed up as an effect.

THE MORPH is what persistence is for. Given two sources, the field crossfades
between them while the AGENTS DO NOT CHANGE — the same fourteen hundred cut-outs
that built a city walk into the shape of a face. Nothing dissolves; everybody
moves. That is a claim about the archive: the same material makes both pictures,
and you can watch it change its mind.

    python3 cut/loom.py world 06 20        20 seconds of poem 06's halfworld
    python3 cut/loom.py shot P133 12

## What is in it

- `shot_P031_into_11.mp4` · video · 3.4MB
- `shot_P133.mp4` · video · 3.5MB
- `world_06.mp4` · video · 2.6MB
- `world_06_into_P133.mp4` · video · 6.2MB
- `index.html` · page · 4.1KB
