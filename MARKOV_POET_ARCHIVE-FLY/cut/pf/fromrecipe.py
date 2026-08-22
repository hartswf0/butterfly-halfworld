#!/usr/bin/env python3
"""
THE BRIDGE BETWEEN THE TWO TRACKS.

    python3 fromrecipe.py paste-recipe.json out.json && python3 render.py out.json

PASTE emits a flat layer list. PATCHFIELD resolves a graph. Neither could read
the other, which quietly falsified J5: two operators with different powers over
different documents is exactly the situation the invariant forbids.

This converts one into the other, and the conversion is one-way for a reason.
A recipe is a graph that happens to have no branches — every layer is a leaf
feeding one stack. Going back would mean discarding the carriers, apertures and
metrics that only the graph can hold, so `place` nodes round-trip and nothing
else does. That asymmetry is reported, not hidden.
"""
import json, sys

MODE = {"source-over": "over", "multiply": "multiply", "screen": "screen",
        "overlay": "overlay", "darken": "darken", "lighten": "lighten",
        "difference": "diff", "exclusion": "diff"}


def convert(rec, out_png="out/pf/from_paste.png"):
    RW, RH = rec.get("w", 1280), rec.get("h", 800)
    nodes, ids, modes, opac, lost, unscreened = [], [], {}, {}, [], []
    for i, l in enumerate(sorted(rec["layers"], key=lambda l: l.get("z", 0))):
        if not l.get("on", True):
            continue
        src = l.get("src", {})
        if src.get("k") != "el":
            # a pasted screenshot lives as a data URL inside the recipe; the
            # graph names elements in a pile and has nowhere to put loose pixels
            lost.append(l.get("name", f"layer {i}")); continue
        nid = f"L{i}"
        # paste screens a single layer with `ht`. `place` has no screen — only
        # `aperture` does, and an aperture needs three inputs where a recipe
        # gives one. So halftoned layers cross as photographs and say so.
        if l.get("ht"):
            unscreened.append(l.get("name", nid))
        ids.append(nid); modes[nid] = MODE.get(l.get("mode"), "over")
        opac[nid] = l.get("op", 1.0)
        # paste's depth does three things — shrink, haze, blur — and the graph's
        # `stack` only hazes. The scale is baked into w/h here rather than added
        # to `stack`, because the converter's job is to preserve WHAT YOU SAW,
        # and changing depth's meaning in the graph would silently restate c01
        # and c02. The blur does not cross at all; that is reported below.
        k = 1 - 0.50 * float(l.get("depth", 0))          # paste's DEPTH_SCALE
        nodes.append({"id": nid, "op": "place", "params": {
            "element": src["id"], "tag": nid,
            "x": (l["x"] + l["w"] / 2) / RW, "y": (l["y"] + l["h"] / 2) / RH,
            "w": l["w"] * k / RW, "h": l["h"] * k / RH,
            "rot": l.get("r", 0), "flip": bool(l.get("flip")),
            "opacity": l.get("op", 1.0),
            # paste's depth is 0=near, patchfield's is 1=near. one of them had to
            # invert and the graph's convention wins because haze reads forward.
            "depth": 1.0 - float(l.get("depth", 0))}})
    nodes.append({"id": "comp", "op": "stack", "in": ids, "params": {
        "haze": rec.get("hazeAmt", 0), "modes": modes, "opacity": opac,
        "bg": [230, 239, 242]}})
    nodes.append({"id": "out", "op": "output", "in": ["comp"],
                  "params": {"path": out_png}})
    return {"name": "converted from a paste recipe",
            "note": ("Authored by dragging, resolved by the graph. "
                     + (f"{len(lost)} pasted-pixel layers could not cross: "
                        + ", ".join(lost) + ". " if lost else "every layer crossed. ")
                     + (f"{len(unscreened)} halftoned layers crossed unscreened: "
                        + ", ".join(unscreened) + " — `place` has no screen, only "
                        "`aperture` does, and an aperture needs three inputs. "
                        if unscreened else "")
                     + ("Depth-blur does not cross: the graph hazes by depth but "
                        "does not defocus." if rec.get("blurAmt", 0) > 0 else "")),
            "piles": {"studio": "out/studio/elements.json"},
            "nodes": nodes}, lost, unscreened


if __name__ == "__main__":
    rec = json.load(open(sys.argv[1]))
    D, lost, uns = convert(rec)
    json.dump(D, open(sys.argv[2], "w"), indent=1)
    print(f"{len(D['nodes']) - 2} placed · {len(lost)} dropped"
          + (" (" + ", ".join(lost) + ")" if lost else "")
          + (f" · {len(uns)} lost their screen (" + ", ".join(uns) + ")" if uns else ""))
