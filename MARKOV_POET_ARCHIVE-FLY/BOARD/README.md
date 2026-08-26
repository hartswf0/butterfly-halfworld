# THE BOARD

Every image in the project on one deck, each with the prompt that goes with it,
and a way to take a whole column away with you.

```bash
python3 -m http.server 8177     # then open /BOARD/
```

**2,275 rows · 135 moving · 2,140 still · every one carries a prompt.**

## What it is

Columns are groups; cells are images; a playhead line runs across the deck at a
fixed height. Click any cell to read its prompt beside it. The header of each
column carries what you do to a whole column at once:

- **ZIP** — every image in the column plus a `PROMPTS.md`, as one archive
- **TXT** — just the prompts, as markdown
- **X** — dim the column out of the way

Group by **POEM**, **TYPE** or **WORK**; filter to **VIDEO** or **IMAGE**; or
search the prompt text. `DOWNLOAD ALL PROMPTS` takes the current grouping and
writes the whole thing out in column order.

## Where the rows come from

Four sources that agreed on nothing, reconciled into one row shape:

| source | rows | what it supplies |
|---|---|---|
| `COLLAGE_ZETTELS/` | 107 | composed collages and their cineosis prompts |
| `MARKOV_POET*/manifest.json` | 135 | generated shots, thumbnails, and the prompt **as sent** |
| `cut/out/thumbs/index.json` | 2,033 | cut-outs and the noun the segmenter gave each one |
| `WYGWYL_COVERAGE_MAP.json` | — | which poem each shot belongs to, which is the only thing that lets any of it group by poem |

The zettels name their poem by title and the coverage map numbers it, so the same
poem arrived twice under two spellings; the bare titles are folded onto the
numbered ones rather than shipping thirty-two columns for fourteen poems.

## Two things worth knowing

**The ZIP is written here.** No CDN is reachable from this page by design, so
rather than import an archiver it implements one: store-only ZIP with CRC32, about
sixty lines. Verified with `unzip -t` — valid archive, all entries extract. If
some files cannot be fetched the archive still builds and contains a
`MISSING.txt` saying how many are absent, rather than being quietly short.

**Images load on intersection, not on layout.** Asking for 2,275 images at once
gets 2,275 queued requests and no pictures; `loading="lazy"` does not help inside
a scroller the browser already considers near the viewport. Each cell gets its
`src` when it is actually looked at.

## Rebuilding

```bash
python3 cut/pf/board.py      # -> BOARD/board.json and board.csv
```
