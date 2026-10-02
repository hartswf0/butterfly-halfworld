# Atlantis Movie Map

Surrogate travel through the WYGWYL invented city, after the Aspen Movie Map (MIT Architecture Machine Group, 1978). Open `index.html` over http.

## Pipeline (deterministic)

1. `node tools/build-graph.mjs` reads `../city3d/` (roads.json, city.json, cover.bin, height.bin, buildings.f32) and writes `plan.json`:
   - **Snapping.** Road ends that meet, or stop on another road's side, are snapped into intersections. Roads are cut into blocks, and blocks chain into 1,012 named ways.
   - **The disc.** Every spine, the processional avenue, arterials within 120 m of a poem, and streets within 38 m of one.
   - **Steps.** A step every ~3 m down each disc block's centre, with its heading smoothed over ±6 m.
   - **Signs.** Street-name blades and overhead names, ward and precinct lines, zoning, bus stops with routes, route shields, alleys, cafés with menus, and historic markers. Each is kept off every carriageway.
2. `tools/capture-run.mjs <scratch>` drives `tools/capture.html` headless with Playwright: four views (front, right, back, left; 90° each) at a 2.8 m eye height, at 12:00 on 22 September in Resurrection, clear sky. It also renders the aerial.
3. `python3 tools/pack.py <scratch>` presses each segment × view into WebP sheets of 32 frames (`disc/e5/{seg}_{view}_{chunk}.webp`, 432×288 per frame). It writes `disc.json`, the index that ties every frame to the plan: segment, its two intersections, and each frame's position and heading.

## Player

- **The disc.** `player.mjs` steps through the disc frames.
- **Live render.** Off the disc, or in another era, season, hour or weather, or in the flat, wireframe or ID-buffer styles, `engine.mjs` renders the same registered pose live from city3d's modules (with `legible.mjs` for the signs).
- **Touching a façade.** A touch runs an ID-buffer pass to name the building. The car then pulls up to the building's street front.
- **The map.** `map.mjs` draws the plan, the aerial and Lynch's notation, with a Powers-of-Ten zoom.

## Watch

`node tools/compile-films.mjs` compiles the 14 readings (`../../timings/NN.json`, word timings) into `films.json`. In each film:
- The car leaves the poem's site down the disc toward the next poem, moving only while he speaks.
- It jumps at a line's start when the road outruns the reading.
- Each line looks where it is written into the city, or at a landmark in clear sight.
- The last line looks back.
- The coda shows the last frame in all six eras.

`cinema.mjs` plays a film; `WATCH.md` is its interface contract. Link straight to a film with `index.html?watch=06`.

## The film: Where You Go When You Leave

One film of the whole album on the album's own clock (`../../clock.json`): the unified drone record (1,440 s) is the score, and each reading sits in its poem's passage.
- **Light.** Each passage keeps its treatment's hour and weather (`../world.json`): 01 dusk into night, 03 a day into storm, 10 the end of night into dawn on wet streets, 11 morning fog, 13 daylight into harbour haze.
- **The drive.** The car leaves each site through the whole street plan, rendered live, moving while he speaks. It looks at his written lines and at landmarks in clear sight, and looks back on the last line.
- **Pictures.** The canon's pictures surface where they were taken.
- **Coda.** Each passage's tail shows the last place in its six eras.
- **Frame.** Powers of Ten opens and closes it. His words are in the lower letterbox; the chapter, street and local hour are in the upper.

Build it:
- `node tools/film-plan.mjs` writes `film/cut.json`.
- `node tools/film-render.mjs` renders `../../../film/WYGWYL-moviemap.mp4`. It needs Playwright and ffmpeg, renders chapter by chapter and resumes where it stopped.

## What the city holds

The city is the index.
- `node tools/build-holdings.mjs` gives every published item an address in `holdings.json`.
- Addresses come from rendezvous hashing: each item takes the eligible lot with the highest hash(item@lot), so adding items never moves an existing one. The city grows by infill.

What is held, and where:

| item | where it lives |
|---|---|
| his readings | the poem sites |
| each of 267 lines | a building nearby, with its sung mouth (157) |
| 140 echoes | corners |
| 79 hooks | clubs |
| the 210-piece sound pack | by district: loops in the nightlife, beds by the water, hits in industry, textures in the ruins, risers downtown |
| 14 radio stations | the mast |
| the drone record | each district's passage of it is that district's ground tone |
| 354 canon pictures, 104 foundry references, 16 films | on walls |

- Walls go where the disc actually sees them. `tools/visibility.mjs` counts ID-buffer pixels per building over every disc frame and writes `vis.json`; a holding hangs on whichever face that view sees.
- `holdings.mjs` projects each wall into the frame through the frame's own camera, so it works on disc frames and live renders alike. It is hidden when the ID buffer sees something else there.
- `sound.mjs` mixes the audible holdings through the camera with WebAudio:
  - his words one at a time: a line, then its sung answer;
  - his nearest reading only;
  - caps on the pack and the clubs;
  - the district's drone passage under everything.
- ♪ listen turns the sound on; the captions say what is sounding, which way, and how far.
