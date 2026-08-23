# Selecting every part of a poemfield

Names are the good handles and they are **not guaranteed**. A world whose drawing
lives in helper functions names all of its ink; one that draws inline names
almost none. Selection cannot depend on how somebody wrote a world two years ago,
so two things had to happen: fix what was fixable, and guarantee the rest.

## what was fixable: the effects had no owner

Every post-effect wrote **straight to the buffer**, bypassing `K.put`/`K.ink`, so
the ink they made had no identity and could not be selected. Twelve of the
fourteen poemfields use at least one.

| effect | what it does | who owns the result |
|---|---|---|
| `kaleido` | mirrors a cell | **what it mirrors** |
| `shake` | moves the whole frame | ownership moves with it |
| `smear` | re-renders the movement, displaced in time | **whatever drew it in the tap** |
| `invert` | flips level | already-inked keeps its owner; ink invented from paper is `~invert` |
| `clear(7)` | fills the field with ink | `~ground` |

`smear` needed a scratch identity field and a `tagSwap` that does **not** reset
the serial — a reset would make the tap's tags collide with the frame's own.

Measured, before → after:

    02-flashing-lights   54% → 99%     4 → 11 parts
    03-break-off          96% → 100%    5 → 11 parts
    04-nevermore          19% → 50%    11 → 17 parts
    06-atlantis           54% → 54%    10 → 16 parts
    07-dj-turn-me-up      80% → 81%    11 → 17 parts

Part counts went up almost everywhere even where coverage did not, because the
effects were previously hiding whole parts, not just anonymous ink.

## the guarantee: whatever names do not reach is segmented

Every inked cell with no owner is grouped into **connected regions**, biggest
first, and offered as `#1 #2 #3` with a dashed border. On YET, HEARD — the world
that names nothing:

    3 handles · 0% named, 99% found · 25,279 inked

They are worse handles, and marked as such: a region is a shape, not a thing, and
it does not survive a scrub the way a name does. Regions under 24 cells are
dropped and only the twelve largest are offered, because a hundred three-cell
specks is not a set of handles, it is a mess with numbers on it. But between
names and regions, **every inked cell on the field belongs to something you can
pick**, in every world.

Named handles sort first, so the good ones are where the thumb lands. Selected
parts can be stamped into the frame or **taken out of it** — erase writes level 0
over exactly the cells that part owns, leaving everything else.

## a fix I tried and reverted

The stack walk that names a part occasionally returned the *caller's* function
name. I tried breaking on any frame whose URL is not the engine or a world —
principled, and wrong: it removed the rare leak **and every real name with it**,
8% named to 0%. The leak was 84 cells in 25,129. A fix that costs every name to
remove three tenths of a percent of wrong ones is not a fix, so it is reverted
and the reasoning is left in the file.

Two smaller things that were real: a tag pushed when `__parts` was not being
collected showed up as an unnameable `?` handle, and a module URL is cached hard
enough that three engine fixes were live on the server and invisible in the
browser — hence `HW_BUILD`.
