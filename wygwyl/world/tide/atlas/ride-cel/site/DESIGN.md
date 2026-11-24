# The LiDAR as a stage you direct

The viewer has one stage: the world fills the screen. There are three bands: the reel and place at the top, his words low, and time and tools at the bottom. Every new tool goes into a band that already exists, so none adds a panel.

## The six principles, as they show up here

| Principle | In the viewer |
|---|---|
| Surface the invisible | **Paths** draws the lines of flight. The take's camera is blue. Each tracked body's hips appear as its own hue, dim at the start of the shot and bright at the end, so you can read direction. |
| Overcome cognitive limits | One button per idea, each cycling or toggling. The choices are remembered per reel in `localStorage`, and the page works without it. |
| Support multiple modes | **LiDAR / Splats / Mesh** set what the world is made of. **Look** sets how it feels. **Skeleton / Mannequin / Blocks / Figure** set what stands on the bodies. |
| Direct manipulation | Tap a body to choose it. A chip floats over its head with **Jerrycan**, **Become** and ×. Dragging drives. A tap no longer starts driving. |
| Semantic zoom | Next step (see the roadmap). |
| Constrained play | Every choice can be undone with one press. The take keeps playing whatever you do: voice, words and bodies. |

## Look: the same points felt six ways

All six run in one vertex shader (`LIDAR_VS`), switched by the `uMode` uniform. They are driven by `uTime` (wall clock), `uU` (progress through the shot), `uLevel` (his voice level, from a WebAudio analyser made on the first press of Play) and `uBeat` (a decay that restarts on every spoken word onset from `words.json`).

| Look | What it does |
|---|---|
| Height | The survey ramp: blue ground to red top, brightness from the image. |
| Water | A swell whose height grows with his voice, deep blue, with caustic light that flashes on each word. |
| Rain | The place falls into being over the shot: ground first, then upward. Each point drops from above and lands. |
| Shore | A tide line washes in from far to near. Behind it the world is wet and blue; at the front there is foam that flares on each word. |
| Memory | Sepia, fading with distance. Points flicker and thin out as the shot runs on. |
| Pulse | Points swell and brighten with his voice, and jump on each word. |

## Props: the jerrycan

The jerrycan follows make-photo's carry format: a prop held at the tracked wrists (Sapiens2 308-point indices 62 = left wrist, 41 = right wrist).

- It is 20 litres: 47 × 35 × 16.5 cm, with the handle on top and the spout at the front.
- It is scaled to each body's shoulder width (40 cm is taken as 1:1).
- If the two wrists are close, it hangs between both hands; otherwise it hangs from the lower hand, the carrying hand.
- Its long side is turned along the way the body faces.

## Scene file (where this is going)

Each reel's `reel/<slug>.json` already holds `places` (LiDAR, splats, mesh, camera keys) and points at `bodies/<take>.json`. The layers to add:

```jsonc
{
  "places": [ /* as now: lidar, splat, mesh, keys, t0, t1 */ ],
  "bodies": "bodies/<take>.json",         // Sapiens2 308-point tracks lifted into Atlas space, by person id
  "cast": {                               // who stands on each tracked person: swap a character without re-tracking
    "<place>:<id>": { "figure": "figures/anny_adult_m.glb", "skin": "#3b2416", "outfit": "…", "cycle": "walk-carry" }
  },
  "props": [ { "kind": "jerrycan", "on": "<place>:<id>", "at": "wrists" } ],
  "media": [ { "kind": "image|video|audio|text", "src": "…", "at": [x, y, z], "t0": 0, "t1": 5 } ],
  "look": { "mode": "Shore", "beat": "words", "level": "voice" }
}
```

Today the viewer saves `look`, `paths` and the props chosen in the browser. Writing them to the scene file instead makes a staged reading something you can share.

## Roadmap

1. **Semantic zoom.** Far out, each place becomes a single card on a timeline of the poem. Mid range shows the place with its paths. Close in shows a body with its cast, props and joints.
2. **Animation cycles.** Use mesh2motion clips from make-photo (`walk`, `walk-carry`, …) to fill the gaps between Sapiens2 keyframes, and when a body leaves the frame.
3. **Swap characters.** A cast picker on the chip: Anny adult male, adult female, child or elder from `human-forge/assets`, each with stated skin tone and clothing.
4. **Media pins.** Drop an image, a clip or a line of the poem at a point in the place for a span of time.
5. **Beat tools.** Choose the beat source (words, voice onsets, or a tapped tempo) and how strongly Rain, Shore and Pulse respond.
