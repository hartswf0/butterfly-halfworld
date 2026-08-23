#!/usr/bin/env python3
"""
    python3 pf/stations.py   ->  out/held/pack/stations.json

THE CLOCK.

Everything HELD could do was one frame wide. Its scrub ran over twenty-four
frames of one shot, looping, and the fourteen finished films sat beside it
untouched — as if the archive were a bag of pictures rather than a thing with a
duration and a running order already decided.

MOUSSA decided it. `moussa.json` holds fourteen timelines: which shot is on
screen at which second, which poem it belongs to, which halfworld is drawn when
the footage has nothing fresh, and which song runs underneath. `words.json` holds
2,805 word timings from the poet's own recitation. Neither needed making; they
needed reading.

So a station is a clock, and the clock is the poet's:

    t -> the shot on screen, the words being said, the drawn world if any

THE METER IS NOT A BAR LINE. An event boundary here is a place the voice broke.
That is why the cut list is kept as it is rather than resampled to a grid — a
grid would be a different film.

This is a projection, not a copy: only what a browser needs to run the clock.
The 1.3GB of rendered film stays where it is.
"""
import json, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{BASE}/out/held/pack"
os.makedirs(OUT, exist_ok=True)

stations = json.load(open(f"{BASE}/out/moussa/moussa.json"))
words = json.load(open(f"{BASE}/words.json"))
tempo = json.load(open(f"{BASE}/music_tempo.json")) if os.path.exists(f"{BASE}/music_tempo.json") else {}

out = []
for st in stations:
    num = st["number"]
    W = words.get(num, {})
    wl = W.get("words", [])
    ev = []
    for e in st["timeline"]:
        row = dict(k="w" if e["kind"] == "world" else "s",
                   a=round(e["rec_in"], 3), d=round(e["dur"], 3),
                   role=e.get("role"))
        if e["kind"] == "shot":
            row["p"] = e["patch"]
        else:
            # the drawn world's slug, not its path — HELD has the worlds already
            row["world"] = os.path.basename(e["src"]).replace(".mp4", "")
            row["seek"] = round(e.get("seek", 0), 3)
        ev.append(row)
    shots = [e for e in ev if e["k"] == "s"]
    drawn = [e for e in ev if e["k"] == "w"]
    out.append(dict(
        n=num, slug=st["slug"], title=st["title"], secs=round(st["seconds"], 2),
        line=st.get("line"), song=st.get("song"),
        events=ev, n_shot=len(shots), n_drawn=len(drawn),
        # DRAWN SHARE is not a style number. where the footage had nothing fresh
        # to say, the poem's own halfworld was drawn instead, so this measures how
        # thin the archive is at this station.
        drawn_share=round(sum(e["d"] for e in drawn) / max(1e-6, st["seconds"]), 3),
        words=[[w["w"], round(w["a"], 2), round(w["b"], 2)] for w in wl],
        n_words=len(wl),
        speaks=[round(wl[0]["a"], 2), round(wl[-1]["b"], 2)] if wl else None,
    ))

tot_w = sum(s["n_words"] for s in out)
json.dump(dict(stations=out, n=len(out), words=tot_w,
               secs=round(sum(s["secs"] for s in out), 1)),
          open(f"{OUT}/stations.json", "w"))
print(f"{len(out)} stations · {sum(s['secs'] for s in out)/60:.1f} min · "
      f"{sum(len(s['events']) for s in out)} events · {tot_w} words")
for s in out:
    silent = "" if s["speaks"] else "  (no timings)"
    print(f"  {s['n']} {s['title'][:30]:<31} {s['secs']:>6.1f}s  "
          f"{s['n_shot']:>2} shot {s['n_drawn']:>2} drawn  "
          f"drawn {s['drawn_share']*100:>4.0f}%  {s['n_words']:>4} words{silent}")
print(f"\n{os.path.getsize(f'{OUT}/stations.json')/1024:.0f} KB")
