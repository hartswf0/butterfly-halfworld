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
