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
