# partswap

`cut/out/partswap`

Made by `cut/partswap.py`.

## What it was for

PART SWAP — trade the halfworld's named set pieces for photographed ones.

The halfworld does not need a segmentation pass. It already reports 803 distinct
objects in a single frame, and with the parts log every one of them carries the
name the author gave it: `building`, `windows`, `gate`, `waterBelow`, `facewindow`,
`clipLine`. Running SAM over it would be asking a model to guess at things we
wrote. SAM was needed for the VIDEO, which nobody here authored. It is not needed
here and never will be.

So the composite is a per-part decision, and every part is addressable by name:

    building     -> photographed buildings from the archive
    windows      -> photographed windows
    facewindow   -> photographed faces, which is what the author called them
    waterBelow   -> KEPT DRAWN. 693 objects of line and ink; nothing photographed
                    replaces a computed waterline, and the author knew that when
                    they wrote it as 693 lines instead of one shape.
    the figures  -> photographed people, at their own footing and height

Nothing is matched by appearance. The noun in the archive and the noun in the
world are the same word, because both were named by someone who knew what they
were looking at.

    python3 cut/partswap.py 06 44

## What is in it

- `06_ADMISSION_44s.png` · still · 143.3KB
