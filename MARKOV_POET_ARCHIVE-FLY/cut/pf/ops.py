#!/usr/bin/env python3
"""
THE OPERATIONS.

A node is {id, op, in, params}. Every op is a pure function of (inputs, params,
doc) returning (value, [Metric]). It may not reach outside its inputs, and it may
not report a number it did not compute (J2).

An op returns one of four VALUES, and that is the whole type system:
    ROWS    a list of pile rows, named not copied
    RIG     {figures:[{cells,uv,bones}]}  — a persistent surface
    LAYER   {rgb:(H,W,3)f32, a:(H,W)f32, depth:float, tag:str}
    FIELD   {cells:{idx:level}} — beflix levels, for mortar and aperture
"""
import json, os, subprocess
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
FW, FH, CELL = 192, 144, 6
W, H = FW * CELL, FH * CELL
PAPER = np.array([230, 239, 242], np.float32)   # BGR
INK = np.array([19, 21, 22], np.float32)
SCAR = np.array([34, 168, 240], np.float32)

from doc import Metric, Pile, PILES, _get   # noqa: E402

REG = {}
def op(name):
    def deco(fn):
        REG[name] = fn
        return fn
    return deco


def blank(depth=0.0, tag="", fill=None):
    rgb = np.zeros((H, W, 3), np.float32)
    if fill is not None:
        rgb[:] = fill
    return dict(kind="LAYER", rgb=rgb, a=np.zeros((H, W), np.float32),
                depth=depth, tag=tag)


# ── PILES ─────────────────────────────────────────────────────────────────────
@op("pile.select")
def _select(ins, p, ctx):
    pile = ctx["piles"][p["pile"]]
    rows, capped = pile.select(p.get("where"), p.get("order"), p.get("limit"))
    ms = [Metric("selected", len(rows), p.get("expect", len(rows)), "low",
                 f"{p['pile']} of {len(pile.rows)}")]
    # J7: a cap is not a detail, it is ignorance with a number on it
    if capped:
        ms.append(Metric("dropped_by_limit", capped, 0, "high",
                         f"{capped} of {capped + len(rows)} matching rows were not used",
                         scale=float(capped + len(rows))))
    if pile.absent:
        ms.append(Metric("pile_missing", 1, 0, "high", pile.path, scale=1.0))
    return dict(kind="ROWS", rows=rows), ms


# ── CARRIERS ──────────────────────────────────────────────────────────────────
@op("carrier.rig")
def _rig(ins, p, ctx):
    figs = p["figures"]
    req = json.dumps(dict(figures=figs, fw=FW, fh=FH))
    r = subprocess.run(["node", f"{HERE}/rig.mjs"], input=req,
                       capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError(r.stderr[-800:])
    out = json.loads(r.stdout)
    cov = [len(f["uv"]) / max(1, len(f["cells"])) for f in out["figures"]]
    small = [f for f in figs if f["h"] < 22]
    ms = [Metric("nameable", float(np.mean(cov)), 0.90, "low",
                 "share of drawn cells with a (bone,u,v)")]
    if small:
        # measured, not assumed: below h=22 drawFigure hands off to drawSmall,
        # which the chart does not model. step0 measured 78.7% there.
        ms.append(Metric("below_rig_floor", len(small), 0, "high",
                         f"{len(small)} of {len(figs)} figures at h<22 use drawSmall, "
                         f"which the chart does not model (step0 measured 78.7% there)",
                         scale=float(len(figs))))
    return dict(kind="RIG", figures=out["figures"], spec=figs), ms


# ── SKINS ─────────────────────────────────────────────────────────────────────
def _cutout(eid):
    p = f"{BASE}/out/elements/{eid}.png"
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if im is None:
        return None
    if im.shape[2] == 3:
        im = np.dstack([im, np.full(im.shape[:2], 255, np.uint8)])
    a = im[:, :, 3]
    ys, xs = np.nonzero(a > 8)
    if len(ys) == 0:
        return None
    # crop to content: a skin mapped across the canvas instead of the subject
    # measured 22% coverage; cropping to the alpha bbox took it to 62%.
    return im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


@op("skin.assign")
def _assign(ins, p, ctx):
    """Assign pile rows to sockets. `by` is a rule, not a hand-list — so the
       same document rendered against a grown pile picks up new elements."""
    rows = ins[0]["rows"] if ins else []
    idx = {r["id"]: r for r in rows}
    got, miss = {}, []
    for soc, spec in p["sockets"].items():
        if isinstance(spec, str):
            cand = [idx[spec]] if spec in idx else []
        else:
            c = [r for r in rows if (not spec.get("p") or r.get("p") == spec["p"])]
            k = spec.get("order", "-sc").lstrip("-")
            c.sort(key=lambda r: r.get(k, 0), reverse=spec.get("order", "-sc").startswith("-"))
            cand = c[spec.get("nth", 0):spec.get("nth", 0) + 1]
        img = _cutout(cand[0]["id"]) if cand else None
        if img is None:
            miss.append(soc)
        else:
            got[soc] = dict(img=img, id=cand[0]["id"], row=cand[0])
    ms = [Metric("sockets_filled", len(got) / max(1, len(p["sockets"])), 1.0, "low",
                 ("unfilled: " + ",".join(miss)) if miss else "all")]
    return dict(kind="SKINS", skins=got), ms


SOCKETS = {"head": ["head"], "torso": ["spine"],
           "armA": ["upperA", "foreA"], "armB": ["upperB", "foreB"],
           "legs": ["thighA", "shinA", "thighB", "shinB"]}
OWNER = {b: s for s, bs in SOCKETS.items() for b in bs}


def _disc(rgb, a, cx, cy, r, col, alpha=1.0):
    R = int(np.ceil(r))
    y0, y1 = max(0, cy - R), min(H, cy + R + 1)
    x0, x1 = max(0, cx - R), min(W, cx + R + 1)
    if y0 >= y1 or x0 >= x1:
        return
    yy, xx = np.ogrid[y0 - cy:y1 - cy, x0 - cx:x1 - cx]
    m = (yy * yy + xx * xx) <= r * r
    sub = rgb[y0:y1, x0:x1]
    sub[m] = sub[m] * (1 - alpha) + np.asarray(col, np.float32) * alpha
    a[y0:y1, x0:x1][m] = np.maximum(a[y0:y1, x0:x1][m], alpha)


@op("dress")
def _dress(ins, p, ctx):
    """THE BINDING. For every cell the figure occupies, ask the chart what body
       coordinate it is and sample the photograph there. The dots move; the
       sample does not."""
    rig = next(i for i in ins if i["kind"] == "RIG")
    skins = next((i["skins"] for i in ins if i["kind"] == "SKINS"), {})
    L = blank(p.get("depth", 0.5), p.get("tag", "dress"))
    mortar_cells, painted_n, total_n = [], 0, 0
    radius = CELL * p.get("radius", 0.62)
    for fig in rig["figures"]:
        names = fig["boneNames"]
        named = {c: (names[bi], u, v) for c, bi, u, v in fig["uv"]}
        for c in fig["cells"]:
            total_n += 1
            q = named.get(c)
            soc = OWNER.get(q[0]) if q else None
            sk = skins.get(soc)
            if sk is None:
                mortar_cells.append(c); continue
            img = sk["img"]
            ih, iw = img.shape[:2]
            u, v = q[1], q[2]
            xi = min(iw - 1, max(0, int(u * iw)))
            yi = min(ih - 1, max(0, int((v + 1) / 2 * ih)))
            px = img[yi, xi]
            if px[3] < 110:
                mortar_cells.append(c); continue    # the skin has a hole here
            painted_n += 1
            _disc(L["rgb"], L["a"], int((c % FW + .5) * CELL),
                  int((c // FW + .5) * CELL), radius, px[:3].astype(np.float32))
    L["mortar"] = mortar_cells
    L["figcells"] = [c for f in rig["figures"] for c in f["cells"]]
    cov = painted_n / max(1, total_n)
    return L, [Metric("coverage", cov, 0.75, "low",
                      f"{painted_n} painted, {len(mortar_cells)} mortar"),
               Metric("mortar_share", len(mortar_cells) / max(1, total_n), 0.25, "high",
                      "cells the collage could not reach")]


@op("plate")
def _plate(ins, p, ctx):
    """A ground. Either a flat colour, or an element cutout stretched to fill —
       the archive as backdrop rather than as figure."""
    L = blank(p.get("depth", 0.0), p.get("tag", "plate"))
    if "element" in p:
        img = _cutout(p["element"])
        if img is None:
            return L, [Metric("plate_missing", 1, 0, "high", p["element"], scale=1.0)]
        fit = p.get("fit", "cover")
        ih, iw = img.shape[:2]
        s = max(W / iw, H / ih) if fit == "cover" else min(W / iw, H / ih)
        rs = cv2.resize(img, (max(1, int(iw * s)), max(1, int(ih * s))),
                        interpolation=cv2.INTER_LINEAR)
        oy = max(0, (rs.shape[0] - H) // 2); ox = max(0, (rs.shape[1] - W) // 2)
        rs = rs[oy:oy + H, ox:ox + W]
        hh, ww = rs.shape[:2]
        L["rgb"][:hh, :ww] = rs[:, :, :3]
        L["a"][:hh, :ww] = rs[:, :, 3] / 255.0
        filled = float((L["a"] > 0.4).mean())
        return L, [Metric("plate_fill", filled, 0.85, "low",
                          "share of frame the ground actually covers")]
    L["rgb"][:] = np.asarray(p.get("color", PAPER.tolist()), np.float32)
    L["a"][:] = 1.0
    return L, [Metric("plate_fill", 1.0, 0.85, "low", "flat")]


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16.0


def _levels(rgb, a, gamma=0.80, ped=0.30, polarity=1, stretch=True):
    """the dot law's front half: luminance -> 8 ordered levels at cell resolution.

       POLARITY exists because a screen is not a picture. When the aperture is
       driven by a bright plate, dark-opens gives eight-tenths of one percent of
       the frame and the whole node does nothing. Which end opens is a property
       of the composition, not of the law, so it is a parameter.

       STRETCH is the same argument about range: a plate occupying levels 4..6
       is a mask with three settings. Stretching to its own extremes uses the
       plate's actual contrast rather than its absolute brightness."""
    g = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    g = cv2.resize(g, (FW, FH), interpolation=cv2.INTER_AREA)
    av = cv2.resize(a, (FW, FH), interpolation=cv2.INTER_AREA)
    if stretch:
        m = av >= 0.35
        if m.any():
            lo, hi = np.percentile(g[m], 2), np.percentile(g[m], 98)
            if hi - lo > 1e-3:
                g = np.clip((g - lo) / (hi - lo), 0, 1)
    if polarity < 0:
        g = 1.0 - g
    t = np.power(np.clip(g, 0, 1), gamma) * (1 - ped) + ped
    d = np.tile(BAYER, (FH // 4 + 1, FW // 4 + 1))[:FH, :FW]
    lv = np.clip(np.floor((1 - t) * 8 + d), 0, 7)
    lv[av < 0.35] = 0
    return lv


@op("aperture")
def _aperture(ins, p, ctx):
    """THE APERTURE — the node type every tool in this repo was missing.

       Until now a mark was either FIGURE (it carries a photograph) or MORTAR (it
       covers a failure). Both are things the dots ARE. But a halftone laid over
       a street is neither: the dots are a HOLE. One image is the aperture, a
       second is seen through it, a third fills between. The marks belong to no
       image at all, which is why nothing already built could express it.

       in: [screen, through, between] — screen's tone sizes the discs."""
    scr, thru = ins[0], ins[1]
    betw = ins[2] if len(ins) > 2 else None
    lv = _levels(scr["rgb"], scr["a"], p.get("gamma", 0.80), p.get("ped", 0.30),
                 p.get("polarity", 1), p.get("stretch", True))
    L = blank(p.get("depth", 0.5), p.get("tag", "aperture"))
    if betw is not None:
        L["rgb"][:] = betw["rgb"]; L["a"][:] = betw["a"]
    else:
        L["rgb"][:] = np.asarray(p.get("between_color", INK.tolist()), np.float32)
        L["a"][:] = 1.0
    k = p.get("k", 1.24); ex = p.get("exp", 0.72)
    open_px = 0
    ys, xs = np.nonzero(lv > 0)
    for y, x in zip(ys, xs):
        r = CELL * 0.5 * ((lv[y, x] / 7.0) ** ex) * k
        if r < 0.4:
            continue
        cx, cy = int((x + .5) * CELL), int((y + .5) * CELL)
        R = int(np.ceil(r))
        y0, y1 = max(0, cy - R), min(H, cy + R + 1)
        x0, x1 = max(0, cx - R), min(W, cx + R + 1)
        yy, xx = np.ogrid[y0 - cy:y1 - cy, x0 - cx:x1 - cx]
        m = (yy * yy + xx * xx) <= r * r
        m &= thru["a"][y0:y1, x0:x1] > 0.02
        L["rgb"][y0:y1, x0:x1][m] = thru["rgb"][y0:y1, x0:x1][m]
        L["a"][y0:y1, x0:x1][m] = 1.0
        open_px += int(m.sum())
    frac = open_px / float(W * H)
    return L, [Metric("aperture_open", frac, 0.12, "low",
                      "share of frame the holes actually reveal"),
               Metric("screen_range", float(lv.max() - lv[lv > 0].min()) if (lv > 0).any() else 0,
                      3, "low", "levels used by the screen; a flat screen is a flat mask",
                      scale=7.0)]


BLEND = {
    "over":     lambda b, f: f,
    "multiply": lambda b, f: b * f / 255.0,
    "screen":   lambda b, f: 255.0 - (255.0 - b) * (255.0 - f) / 255.0,
    "darken":   lambda b, f: np.minimum(b, f),
    "lighten":  lambda b, f: np.maximum(b, f),
    "diff":     lambda b, f: np.abs(b - f),
    "overlay":  lambda b, f: np.where(b < 128, 2 * b * f / 255.0,
                                      255 - 2 * (255 - b) * (255 - f) / 255.0),
}


@op("stack")
def _stack(ins, p, ctx):
    """DEPTH IS THE ARGUMENT, not the list order. Layers sort by their own depth,
       and a layer further back is hazed toward the paper — so 'behind' is a
       measurable amount of atmosphere rather than a z-index."""
    layers = sorted([i for i in ins if i["kind"] == "LAYER"], key=lambda l: l["depth"])
    modes = p.get("modes", {})
    haze = p.get("haze", 0.0)
    hcol = np.asarray(p.get("haze_color", PAPER.tolist()), np.float32)
    out = blank(1.0, p.get("tag", "stack"))
    out["rgb"][:] = np.asarray(p.get("bg", PAPER.tolist()), np.float32)
    out["a"][:] = 1.0
    depths = []
    for L in layers:
        f = L["rgb"].copy()
        d = float(L["depth"])
        depths.append(d)
        if haze > 0:
            k = haze * (1.0 - d)
            f = f * (1 - k) + hcol * k
        mode = modes.get(L["tag"], p.get("mode", "over"))
        blended = BLEND[mode](out["rgb"], f)
        al = (L["a"] * p.get("opacity", {}).get(L["tag"], 1.0))[:, :, None]
        out["rgb"] = out["rgb"] * (1 - al) + blended * al
    for L in layers:
        if "mortar" in L:
            out["mortar"] = L["mortar"]; out["figcells"] = L["figcells"]
    sep = (max(depths) - min(depths)) if len(depths) > 1 else 0.0
    return out, [Metric("layers", len(layers), 1, "low", "", scale=1.0),
                 Metric("depth_separation", sep, 0.25, "low",
                        "if every layer shares a depth, the stack is flat and haze does nothing")]


@op("mortar")
def _mortar(ins, p, ctx):
    """BEFLIX where the collage could not reach, and the AMBER SCAR at the seam.
       Colour is a report of damage; it is permitted nowhere else."""
    L = dict(ins[0]); L["rgb"] = ins[0]["rgb"].copy(); L["a"] = ins[0]["a"].copy()
    mort = set(L.get("mortar", [])); fig = set(L.get("figcells", []))
    painted = fig - mort
    r = CELL * p.get("radius", 0.42)
    for c in mort:
        _disc(L["rgb"], L["a"], int((c % FW + .5) * CELL), int((c // FW + .5) * CELL),
              r, np.asarray(p.get("ink", INK.tolist()), np.float32))
    scars = 0
    if p.get("scar", True):
        for c in mort:
            x, y = c % FW, c // FW
            if any(((y + dy) * FW + (x + dx)) in painted
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                scars += 1
                _disc(L["rgb"], L["a"], int((x + .5) * CELL), int((y + .5) * CELL),
                      CELL * p.get("scar_radius", 0.24),
                      np.asarray(p.get("scar_color", SCAR.tolist()), np.float32))
    L["tag"] = p.get("tag", "mortared")
    return L, [Metric("scar_length", scars, p.get("scar_budget", 220), "high",
                      f"{scars} seam cells of {len(fig)} figure cells; a long seam "
                      f"means the skins do not meet",
                      scale=max(1.0, float(len(fig)) * 0.25))]


@op("output")
def _output(ins, p, ctx):
    L = ins[0]
    path = os.path.join(BASE, p["path"])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    cv2.imwrite(path, np.clip(L["rgb"], 0, 255).astype(np.uint8))
    g = cv2.cvtColor(np.clip(L["rgb"], 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY)
    return dict(kind="FILE", path=path), [
        Metric("tonal_range", float(np.percentile(g, 97) - np.percentile(g, 3)) / 255.0,
               0.55, "low", "a frame with no range is a grey card"),
        Metric("ink_share", float((g < 90).mean()), 0.55, "high",
               "mass of dark; past this the page has closed up")]


@op("place")
def _place(ins, p, ctx):
    """An element PUT SOMEWHERE — position, size, rotation, flip.

       `plate` can only fill the frame, which is why c01 and c02 are both one
       subject against one wall: there was no way to say 'this, here, this big'.
       Every collage in this repo needed that and every one of them got it by
       hand-editing a Python file. It is the op the flat recipe already had and
       the graph did not.

       Coordinates are FRACTIONS of the frame, not pixels, so a document renders
       the same at any output size."""
    L = blank(p.get("depth", 0.5), p.get("tag", "place"))
    img = _cutout(p["element"]) if "element" in p else None
    if img is None:
        return L, [Metric("placed", 0, 1, "low", p.get("element", "?"), scale=1.0)]
    ih, iw = img.shape[:2]
    tw = max(2, int(p.get("w", 0.3) * W))
    th = max(2, int(p.get("h", p.get("w", 0.3) * (ih / iw) * (W / H)) * H))
    im = cv2.resize(img, (tw, th), interpolation=cv2.INTER_LINEAR)
    if p.get("flip"):
        im = im[:, ::-1]
    cx, cy = p.get("x", 0.5) * W, p.get("y", 0.5) * H
    M = cv2.getRotationMatrix2D((tw / 2, th / 2), -p.get("rot", 0), 1.0)
    M[0, 2] += cx - tw / 2
    M[1, 2] += cy - th / 2
    warped = cv2.warpAffine(im, M, (W, H), flags=cv2.INTER_LINEAR,
                            borderValue=(0, 0, 0, 0))
    L["rgb"][:] = warped[:, :, :3]
    L["a"][:] = warped[:, :, 3] / 255.0 * p.get("opacity", 1.0)
    on = float((L["a"] > 0.05).mean())
    # J7: a placement mostly outside the frame is not a composition choice you
    # can see, it is pixels you paid for and threw away.
    #
    # Counting alpha pixels before and after the warp measures the WRONG THING:
    # a linear resample of an upscaled cut-out invents alpha at every edge, so
    # the ratio exceeds 1 and the metric reports a negative share cropped. The
    # placement is an affine map of a rectangle, so clip the rectangle instead
    # — that is exact, and it does not care about interpolation.
    corners = np.array([[0, 0, 1], [tw, 0, 1], [tw, th, 1], [0, th, 1]], np.float64)
    quad = (M @ corners.T).T
    whole = cv2.contourArea(quad.astype(np.float32))
    clipped, _ = cv2.intersectConvexConvex(
        quad.astype(np.float32),
        np.array([[0, 0], [W, 0], [W, H], [0, H]], np.float32))
    cropped = 1.0 - (clipped / whole if whole > 1e-6 else 1.0)
    return L, [Metric("on_frame", on, 0.02, "low",
                      "share of frame this element occupies", scale=0.02),
               Metric("cropped_away", max(0.0, cropped), 0.15, "high",
                      "share of the placed rectangle that fell outside the frame",
                      scale=0.5)]
