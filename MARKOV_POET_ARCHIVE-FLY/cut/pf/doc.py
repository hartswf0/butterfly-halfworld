#!/usr/bin/env python3
"""
THE DOCUMENT — patchfield as a file, not a session.

Every tool this session produced was a terminal: the Composer holds layers in
browser memory, dress.py in a Python dict, glass.html saves pixels. None can be
operated by both a person and an agent, none accumulates, and none can say what it
does not know. They are films with knobs.

STEP A IS THE WHOLE BET. If a composition can be authored as JSON and rendered
with no interface at all, then invariant J5 is satisfiable — anything the
dashboard can do, a JSON edit can do — and a dashboard becomes a VIEW over this
document rather than the place the truth lives. If it cannot, no interface
rescues it.

  J1  the graph is the only mutable truth; renders are derived and disposable
  J2  every node reports a Metric it computed, never one it was told
  J3  piles are append-only; a measurement is superseded, never edited
  J4  ignorance is a first-class output, not a warning
  J5  both operators have identical power
  J7  nothing is silently discarded — every cap is logged as ignorance

A document is {piles, nodes, edges, clocks}. A node is {id, op, in, params}. That
is the entire schema. Everything else is an operation.
"""
import json, os, subprocess, sys
import numpy as np
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARCH = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # .../cut
FW, FH = 192, 144
PAPER = np.array([242, 239, 230], np.float32)
INK = np.array([22, 21, 19], np.float32)
SCAR = np.array([240, 168, 34], np.float32)
sys.path.insert(0, BASE)


# ── METRICS ───────────────────────────────────────────────────────────────────
class Metric:
    """A node that cannot say how well it fits is not finished (J2).

       `worse` names the direction of badness. `scale` is what a full unit of
       badness IS in this metric's own units — without it a count metric whose
       threshold is 0 divides by nothing and reports strain 1133 next to a
       coverage metric reporting 0.97, and the ignorance map becomes a chart of
       which metric happens to use the largest numbers. The scale is the whole
       reason the map is comparable, so it is required whenever the threshold
       cannot serve as its own denominator."""

    def __init__(self, name, value, threshold, worse="high", note="", scale=None):
        self.name, self.value, self.threshold = name, float(value), float(threshold)
        self.worse, self.note = worse, note
        self.scale = float(scale) if scale is not None else (
            abs(float(threshold)) if threshold else 1.0)

    @property
    def strain(self):
        """0 = comfortably inside threshold, 1 = one full unit of badness past
           it. Deliberately NOT clamped: 3.0 must be able to say three times."""
        d = (self.value - self.threshold) if self.worse == "high" else (self.threshold - self.value)
        return max(0.0, d / self.scale)

    def as_dict(self):
        return dict(name=self.name, value=round(self.value, 4),
                    threshold=self.threshold, worse=self.worse, scale=self.scale,
                    strain=round(self.strain, 4), note=self.note)


# ── PILES ─────────────────────────────────────────────────────────────────────
class Pile:
    """append-only upstream measurement. `select` never copies; it names."""

    def __init__(self, key, path):
        self.key, self.path = key, path
        self.rows = json.load(open(path)) if os.path.exists(path) else []
        self.absent = not os.path.exists(path)

    def select(self, where=None, order=None, limit=None):
        rows = list(self.rows.values()) if isinstance(self.rows, dict) else list(self.rows)
        capped = 0
        if where:
            rows = [r for r in rows if _match(r, where)]
        if order:
            k, d = (order[1:], -1) if order.startswith("-") else (order, 1)
            rows.sort(key=lambda r: _get(r, k) if _get(r, k) is not None else 0,
                      reverse=(d < 0))
        if limit and len(rows) > limit:
            capped = len(rows) - limit
            rows = rows[:limit]
        return rows, capped


def _get(r, path):
    cur = r
    for p in path.split("."):
        cur = cur.get(p) if isinstance(cur, dict) else None
        if cur is None:
            return None
    return cur


def _match(r, where):
    for k, want in where.items():
        v = _get(r, k)
        if isinstance(want, dict):
            if "gt" in want and not (v is not None and v > want["gt"]): return False
            if "lt" in want and not (v is not None and v < want["lt"]): return False
            if "in" in want and v not in want["in"]: return False
        elif v != want:
            return False
    return True


PILES = {
    "elements": f"{BASE}/sam3_index.json",
    "atlas":    f"{BASE}/atlas.json",
    "vocab":    f"{BASE}/part_vocab.json",
    "words":    f"{BASE}/words.json",
    "drone":    f"{BASE}/drone.json",
    "music":    f"{BASE}/music_tempo.json",
}
