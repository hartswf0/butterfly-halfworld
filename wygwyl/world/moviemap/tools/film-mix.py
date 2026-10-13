#!/usr/bin/env python3
"""Render the film's street sound from film/.tmp/moviemap/ambience.json (tools/film-mix.mjs): each source decoded once, laid where the
camera met it, looped while it stays near, its gain and equal-power pan following the envelopes; the coda mouths at their codas.
Writes film/.tmp/moviemap/ambience.wav (48 kHz stereo), aligned to the album clock."""
import json, os, subprocess, sys, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); MM = os.path.dirname(HERE); W = os.path.dirname(os.path.dirname(MM)); ROOT = os.path.dirname(W)
TMP = os.path.join(ROOT, 'film', '.tmp', 'moviemap'); SR = 48000
A = json.load(open(os.path.join(TMP, 'ambience.json'))); fps = A['fps']; total = A['total']
out = np.zeros((int(total * SR) + SR, 2), np.float32)
cache = {}
def pcm(src):
    if src not in cache:
        b = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(W, src), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        cache[src] = np.frombuffer(b, np.float32).reshape(-1, 2)
    return cache[src]
for sid, entries in A['tracks'].items():
    x = pcm(A['sources'][sid]); sess = []
    for e in entries:
        if len(e) > 3 and e[3] == 'start': sess.append([e])
        elif sess: sess[-1].append(e)
    for s in sess:
        n0, n1 = s[0][0], s[-1][0]; a, b = int(n0 / fps * SR), int((n1 + 1) / fps * SR); L = b - a
        if L <= 0 or len(x) == 0: continue
        sig = np.tile(x, (L // len(x) + 1, 1))[:L]                       # a held sound loops while the camera stays near it
        fr = np.array([e[0] for e in s], float) / fps * SR - a
        g = np.interp(np.arange(L), fr, [e[1] for e in s]); p = np.interp(np.arange(L), fr, [e[2] for e in s])
        th = (p + 1) * np.pi / 4
        out[a:b, 0] += sig[:, 0] * g * np.cos(th) * 1.4142; out[a:b, 1] += sig[:, 1] * g * np.sin(th) * 1.4142
for m in A['mouths']:
    x = pcm(m['src']); a = int(m['t'] * SR); b = min(len(out), a + len(x)); env = np.minimum(1, np.minimum(np.arange(b - a) / (0.3 * SR), (b - a - np.arange(b - a)) / (0.8 * SR)))
    out[a:b] += x[:b - a] * m['gain'] * env[:, None]
out = out[:int(total * SR)]
pk = np.abs(out).max(); print('ambience peak', round(float(pk), 3), '· sources', len(cache))
if pk > 0.98: out *= 0.98 / pk
(np.clip(out, -1, 1) * 32767).astype('<i2').tofile(os.path.join(TMP, 'ambience.s16'))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', os.path.join(TMP, 'ambience.s16'), os.path.join(TMP, 'ambience.wav')], check=True)
os.remove(os.path.join(TMP, 'ambience.s16'))
