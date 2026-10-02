# Watch — the poem drives the car

The interface contract for the film mode (`cinema.mjs`). Films are compiled by `tools/compile-films.mjs` into `films.json`: 14 cut lists, deterministic.

## 1. Way
- **Actor:** a viewer.
- **Object:** one of his readings, played as a drive through the disc.
- **Operation:** watch. You may stop, take the wheel at the frame you are on, or leave.
- **Consequence:** the car is moved. Leaving restores where you were and what the street was set to (era, season, hour, weather, rendering).
- **Completion:** the drive is over and its trace is on the map. Nothing is asked of you.

## 2. Obstruction found in the street surface
- Drive chrome would compete with the film: the map, the place card, the transport, the views and the tools.
- The transport offered actions that could not be taken: Stop while stopped, Play while playing.
- The frame forensics (segment, corners, coordinates) sat in the HUD as if they were a current concern.
- A tap meant "pick a building". During a film it has to mean "pause".

## 3. Keep / cut ledger

| element | claim | verdict |
|---|---|---|
| frame | where the car is now | keep: it is the object |
| line, words lit as spoken | what he is saying now | keep |
| hairline progress with line ticks | how far through, where the lines fall; seek | keep, 2 px |
| ■ Stop | active work can be stopped | keep while playing, faint until hovered |
| trace (street · line n of N · looking at …) | automation moved you; why the view turned | keep, fades after 2.6 s |
| title card | which poem, from where | keep for the pre-roll only |
| SEARCH | the frame is late; the voice goes on | keep only while true |
| map above the horizon | position | cut while watching; the trace goes onto it at the end |
| place card, badge, transport, view rose, tools | driving state and actions | cut while watching (not valid) |
| frame forensics in the HUD | technical detail | moved to the "in place" panel |
| Stop in the drive bar while stopped; Play while driving | invalid actions | hidden until valid |

## 4. State map
- **CHOOSE:** the street, dimmed, with the 14 films nearest first. Dominant action: the first film. Exit: ✕ or Esc, which changes nothing.
- **TITLE:** the first frame with the title. The reading starts after 3.2 s. Stop is available.
- **PLAYING:** frame, words, hairline, Stop. A tap or Space pauses; ← and → move by a line.
- **PAUSED:** resume (dominant), take the wheel here, or back to where you were. Seeking still works.
- **CODA:** the last frame in the six eras, rendered live at the same pose. It is skipped if the city cannot be raised in time.
- **END:** what was driven. Stay here (dominant), back to where you were, or again.
- **FAULT:**
  - The reading fails to load: a red pill says so and the words carry the film on a wall clock.
  - Autoplay is blocked: PAUSED with "▶ begin".
  - A frame is late: SEARCH, and the last frame holds.
- **RECOVERY:** back to where you were restores the position, view and settings. Take the wheel keeps the trace.

## 5. Wireframes
```
PLAYING                                 PAUSED
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│Domino Spine                      │    │                                  │
│line 4 of 32 · looking at …       │    │            (frame held)          │
│                                  │    │   ┌──────────────────────────┐   │
│          (the frame)             │    │   │ 13 … · line 4 of 32      │   │
│                                  │    │   │ ▶ resume  take the wheel │   │
│  discovering water on Jupiter's… │    │   │ ↩ back to where you were │   │
│                               ■  │    │   └──────────────────────────┘   │
│▔▔▔▔▔▔▔▔▔╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵│    │▔▔▔▔▔▔▔▔▔╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵╵│
└──────────────────────────────────┘    └──────────────────────────────────┘
```

## 6. Void contract
- While a film plays, nothing on screen asks for anything except Stop.
- Every automatic turn and cut names itself once, then lets go.
- No control is shown that cannot act.
- Leaving always returns the street exactly as it was.

## 7. Failure
- The routes are disc-only, so some poems share a spine: 03, 11 and 12 start on Domino Spine.
- Where the disc does not reach the site (03, 11), the film opens up to ~300 m away and his first lines cannot be seen.
- Line of sight is tested on the plan (footprints, landmark ground, terrain), not in the image. A look may still find a tree.

## The street surface, under the same contract
| element | claim | verdict |
|---|---|---|
| DISC badge (always on) | the normal state | cut; the disc says nothing |
| LIVE badge | why the frame is live: off the disc, era, season, hour, weather, rendering | shown only while true |
| ↩ back to the disc | recovery from a setting change | beside the LIVE badge, only when a setting caused it |
| SPEED / VIEW labels | — | cut |
| transport | stopped: ◂ ▸ ▶ ▶▶; moving: ■ and the other speed | only valid actions |
| "pulled up to the façade" / map jump | an automatic move happened | names itself with ↩ back beside it (8 s) |
| map note paragraph | explanation | cut to a one-line key (filmed · your trace · tap to go) |
| live city failed to load | fault | says the disc still plays, with retry |
| motion | slides, pans, map zooms | instant when reduced motion is asked for |
| icon buttons | — | labelled for screen readers; focus is visible |

## Listening and the walls
| element | claim | verdict |
|---|---|---|
| ♪ listen | the city can be heard here | shown once the ledger is loaded; pressed state is visible (aria-pressed) |
| captions (bottom right) | what is sounding now, which way, how far | while listening; hidden behind the in-place panel; read aloud politely |
| a picture or film on a wall | this building holds it | drawn only where the ID buffer sees that building; touch opens it |
| "What it holds · A·nn·k" | the building's address and contents | in its sheet, one action per item (play, watch, lay over the frame) |
| holdings on the map | where everything is | dots once the field is a few km |
| sound in Watch | — | the street falls silent while a film plays, and resumes after |

## The film
`tools/film-plan.mjs` → `film/cut.json`, then `tools/film-render.mjs` → `film/WYGWYL-moviemap.mp4` at the repo root (git-ignored; 1280×720, 24 fps, 2.39 picture in a letterbox, H.264 with AAC, soft English subtitles, 15 chapters) and `film/WYGWYL-moviemap.vtt` here. The watch chooser offers "the whole film" only where that file is served. While it plays, the browser's controls are its Stop, seek and volume. Esc or "↩ back to the street" leaves.

## 8. Implementation
- `cinema.mjs`: state machine, clock, drawing.
- `player.mjs`: hooks for drawing, keys, taps, chrome, snapshot and restore.
- `index.html`: `#watch`.
- `tools/compile-films.mjs`: the cut lists.
