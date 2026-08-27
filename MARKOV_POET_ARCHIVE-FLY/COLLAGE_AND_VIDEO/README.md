# COLLAGE_AND_VIDEO

Every experiment in one place: 45 works, 834 moving pieces, 4384 stills, 10.0GB.

- **`index.html`** — open this. Every work, what it was for, and what it made,
  playing in place. Video loads on click, not on load.
- **`INDEX.md`** — the same thing as text.
- **`prompts/THE_PROMPTS.md`** — every generation prompt, as sent.
- **`prompts/<work>.md`** — one file per work: what it was for, and what is in it.
- **`catalogue.csv` / `.json`** — the same thing as a table.
- each entry links straight to where the work really lives.

## Two things to know

**Nothing is copied.** The media is 10.0GB and duplicating it would double the
repository to save a click. Each entry links by relative path to where the work
actually lives, so this folder browses all of it and costs about a megabyte.
It used to do this with directory symlinks; forty-three of them were committed and
the build runner's tar died reading links to directories a checkout does not have,
which took down every deploy. Relative paths cost the same and cannot do that.

**Not all of it is in git.** `cut/out/` is committed and travels with the repo.
`MARKOV_POET/` and `MARKOV_POET_00/` — the generated source archive, and the only
place the real prompts live — are **not tracked**: they are gigabytes of video
that a repository should not carry. On this machine the links resolve and
everything plays. On a fresh clone the source-archive links will dangle, and
`prompts/THE_PROMPTS.md` is then the only surviving record of what was asked for.
That file is small, it is text, and it is committed for exactly that reason.

## Rebuilding

    python3 cut/pf/gather.py

It reads the scripts' own docstrings, the two manifests, and the directories
themselves. Nothing here is hand-maintained, so nothing here goes stale silently.
