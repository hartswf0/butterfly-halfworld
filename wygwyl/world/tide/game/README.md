# Magic Ride — the game

Built with the video-to-game method (lovisdotio/video-to-game): the grey-box Magic Ride take
(`full/out/10ride-grey-1122-0119/film.mp4`) is the design document; `study/` holds its contact sheet and palette.

**Play:** open `index.html` from the site. `?autostart` skips the title, `?t=72` starts at that second of the reading, `?seed=N` fixes the city.

**Mechanic:** his reading is the clock. Each word arrives on the road as he says it. Ride through it and it turns to
water; caught words switch the city's windows on. The world changes on his lines, eight zones from the shots of the take:
kerb under a lamp, the street, empty plaza and tunnel, the crowded avenue (the crowd turns to watch), the raised road at
moonset, the mountain road at first light (birds burst), the ridge, the top of the pass. At the end the city below
appears in lidar.

**Controls:** ← → or A D steer · hold ↑ or W faster · ↓ or S slower · Space opens his arms · L lidar · R ride again.
Touch: drag left or right. Gamepad: left stick, right trigger.

**Look:** every surface is one shader with two modes sharing the same uniforms: grey-box (flat blocks, procedural
windows, fog, ACES tone mapping, vignette, grain) and lidar (height ramp blue→red, scanlines by height, rings pulsing
out from the rider, black sky).

**Assets:** none generated. Geometry is procedural; the audio is his reading from `wygwyl/audio/`; the words and their
timings come from `tide.json`. This departs from the video-to-game rule that every asset comes from fal: the archive
already holds what the game needs.

**Checked:** a scripted rider that steers toward the next word played the full 97 s twice in headless Chromium
(software WebGL) with zero console errors, caught about half the words, passed all eight zones and reached the end;
six frames per run were inspected. Not checked: frame rate on a real phone, audio sync on a phone, touch steering by
hand.

**Differs from the take:** a straight road instead of the take's changing ground; the rider is blocky; the crowd is
coloured boxes; the moon and sun are only sky colour.

## Naraka Market (`naraka.html`)

Poem 01, Out of Life, on foot. He walks down through the container stalls of Naraka Market: containers stacked two to
five high in rusted teal, turquoise and rust, corrugated awnings, lit stall openings, neon, string lights across the
street, AC units, light rain on wet asphalt, teal haze. A man in an orange coat walks ahead with his back turned and
can never be reached. Six zones on his lines: the Container Rows, the crush under the string lights, the stair alley
two people wide, the underpass shadow-pool (roofed, standing water, children in it), vapour outside the teahouse, the
Severn with its fire escapes. The crowd turns to look as he passes. His words hang at three heights across the alley.
Ends in black on "out of life". Same lidar mode (L). Checked the same way: full 88 s, zero console errors, all zones.

## The Light Gates (`gates.html`)

Poem 06, Resurrecting Atlantis, on foot. He walks with the ancestors across a night field to two marble pillars and
closed winged gates; the closed gate stops him. After a 5.5-second walk in, his reading starts, and every image is
pinned to the word that causes it:
"open" the wings swing open · "hymns" bright blue water made of the poem's own letters spreads over the lake ·
"yellow" a road of yellow bricks rises out of the water ahead of him · "comets" comets fall and throw up the first
towers · "resurrecting" the water drains and the white ceramic city, mended with seams of light, rises out of it with
waterfalls · "nature" vines climb · "safe" windows wake in blue and pink and the city's people come out ·
"currency" the windows pulse together · "candlelight" candles · "narrow" the towers lean in · "rainbows" the sky ·
"continuums" a ring of light widens from his feet · "welcoming" he turns to face us and opens his arms.
Same controls and lidar mode. Checked: full 100 s headless, zero console errors, a frame at each key word.
