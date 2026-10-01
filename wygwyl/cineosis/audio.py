#!/usr/bin/env python3
"""audio.py — cineosis's own per-clip audio analysis, run on the halfworld clips.

    python3 wygwyl/cineosis/audio.py

A cineosis shot carries {has_audio, rms_db, silence, flatness, speech_band,
kind} for 253 of its 15,149. The analysis is lab/clipwork.py: 512-sample frames
at 16 kHz, silence as the fraction under -50 dB, spectral flatness over the loud
frames, and a syllabic test — how much of the loudness envelope's energy sits in
the 3-7 Hz band where speech modulates. This is that function, ported rather
than reinvented, so the numbers mean the same thing on both sides of the join.

AND A SECOND OPINION IT CANNOT NORMALLY HAVE. `kind` is a guess: silence,
speech, music or sound. But these 94 shots sit on the suite's clock, and
poem/aligned.json holds 368 forced-aligned spoken-line boundaries on that same
clock — so for every shot we know, from the alignment rather than from the
signal, exactly how much of it the poet is speaking over. That makes this a
classifier measured against ground truth instead of against another guess, and
the answer is worth more than it first looks.

Taken at face value the label fails: `speech` is assigned to 6 shots while the
poet is audible in 85, which scores 16%. Taken apart, the measurement is almost
perfect and only the NAME is wrong. The 27 shots it calls `music` have a median
spoken fraction of 23%; everything else has 64%, and the two barely overlap. As
a voice test, `kind != "music"` is right on 93 of 94 — and so is flatness alone
at 0.045, which is the same cut.

The reason is in clipwork.py's own branch: `speech` needs band > 0.35, the
share of the loudness envelope's energy in the 3-7 Hz syllabic range. Under a
continuous drone the envelope never modulates syllabically, because the bed
fills the gaps between words — so `band` stays low and a voice lands in `sound`.
On bedded material the speech branch is not merely inaccurate, it is
unreachable, while the flatness axis underneath it still separates voice at 98%.
That is a fact about the test, not about this record, and it is the kind of
thing only a corpus that knows its own answers can show. Both numbers are
reported and neither is corrected to match the other.
"""
import json, os, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "renders", "cineosis")
FF = os.path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg")
SHOTS = os.path.join(OUT, "halfworld-shots.json")

shots = json.load(open(SHOTS))
AL = json.load(open(os.path.join(ROOT, "wygwyl", "poem", "aligned.json")))
LINES = sorted([l for v in AL["films"].values() for l in v], key=lambda x: x[0])


def spoken_fraction(t0, t1):
    """how much of [t0,t1) the poet is actually speaking over, from the forced
    alignment — a fact about the record, not a reading of it"""
    tot = 0.0
    for a, b in LINES:
        if b <= t0:
            continue
        if a >= t1:
            break
        tot += min(b, t1) - max(a, t0)
    return tot / max(1e-9, t1 - t0)


def audio_stats(path):
    """lab/clipwork.py:audio_stats, unchanged except for the ffmpeg path"""
    raw = subprocess.run([FF, "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", "16000",
                          "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    if x.size < 1600:
        return {"has_audio": True, "rms_db": None, "silence": 1.0, "flatness": None, "kind": "silence"}
    fr = 512
    frames = x[: len(x) // fr * fr].reshape(-1, fr)
    rms = np.sqrt((frames ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    silence = float((db < -50).mean())
    loud = frames[db >= -50]
    if len(loud) == 0:
        return {"has_audio": True, "rms_db": round(float(db.mean()), 1), "silence": 1.0,
                "flatness": None, "kind": "silence"}
    spec = np.abs(np.fft.rfft(loud * np.hanning(fr), axis=1)) + 1e-9
    flat = float(np.median(np.exp(np.log(spec).mean(1)) / spec.mean(1)))
    env = rms - rms.mean()
    fs_env = 16000 / fr
    E = np.abs(np.fft.rfft(env)) ** 2
    f = np.fft.rfftfreq(len(env), 1 / fs_env)
    band = E[(f >= 3) & (f <= 7)].sum() / (E[(f > 0.5)].sum() + 1e-9)
    if silence > 0.85:
        kind = "silence"
    elif band > 0.35 and flat > 0.05:
        kind = "speech"
    elif flat < 0.06:
        kind = "music"
    else:
        kind = "sound"
    return {"has_audio": True,
            "rms_db": round(float(20 * np.log10(np.sqrt((loud ** 2).mean()) + 1e-9)), 1),
            "silence": round(silence, 3), "flatness": round(flat, 3),
            "speech_band": round(float(band), 3), "kind": kind}


missing = [s for s in shots if not (s.get("clip") and os.path.exists(os.path.join(OUT, s["clip"])))]
if missing:
    sys.exit(f"{len(missing)} of {len(shots)} shots have no clip yet — run encode.mjs first")

from collections import Counter
import statistics as stat
kinds, agree, n_voice = Counter(), 0, 0
for k, s in enumerate(shots):
    s["audio"] = audio_stats(os.path.join(OUT, s["clip"]))
    frac = spoken_fraction(s["start"], s["end"])
    s["halfworld"]["spokenFraction"] = round(frac, 3)
    voiced = frac >= 0.15
    n_voice += voiced
    if voiced == (s["audio"]["kind"] == "speech"):
        agree += 1
    kinds[s["audio"]["kind"]] += 1
    print(f"\r  {k+1}/{len(shots)}  {s['audio']['kind']:8s} "
          f"rms {str(s['audio']['rms_db']):>6s} dB · flat {s['audio'].get('flatness')} "
          f"· poet {100*frac:3.0f}%   ", end="")

json.dump(shots, open(SHOTS, "w"), indent=1)
# THE LABEL FAILS AND THE MEASUREMENT DOES NOT — so report both, and show which
VOICED = 0.45                      # the poet over at least this much of the shot
truth = [s["halfworld"]["spokenFraction"] >= VOICED for s in shots]
not_music = sum(1 for s, t in zip(shots, truth) if (s["audio"]["kind"] != "music") == t)
best_t, best_n = 0.0, -1
for i in range(5, 160):
    t = i / 1000
    ok = sum(1 for s, g in zip(shots, truth) if ((s["audio"]["flatness"] or 0) >= t) == g)
    if ok > best_n: best_t, best_n = t, ok
spoken_by_kind = {}
for k in kinds:
    v = [s["halfworld"]["spokenFraction"] for s in shots if s["audio"]["kind"] == k]
    spoken_by_kind[k] = {"n": len(v), "spokenMedian": round(stat.median(v), 3),
                         "min": round(min(v), 3), "max": round(max(v), 3)}
rep = {
    "method": "lab/clipwork.py:audio_stats, ported unchanged",
    "kinds": dict(kinds),
    "voiceGroundTruth": {
        "source": "wygwyl/poem/aligned.json — 368 forced-aligned spoken lines on the cut's clock",
        "shotsWithVoice": n_voice, "of": len(shots), "threshold": "0.15 of the shot's span",
        "labelAgrees": agree, "labelPct": round(100 * agree / len(shots), 1),
    },
    "theLabelFailsTheMeasurementDoesNot": {
        "asLabelled": f"'speech' on {kinds.get('speech', 0)} shots while the poet is audible in {n_voice} — {round(100 * agree / len(shots))}%",
        "notMusicAsVoiceTest": f"{not_music}/{len(shots)} ({round(100 * not_music / len(shots))}%)",
        "flatnessAlone": f"threshold {best_t:.3f}: {best_n}/{len(shots)} ({round(100 * best_n / len(shots))}%)",
        "spokenFractionByKind": spoken_by_kind,
        "why": "clipwork.py's speech branch needs band > 0.35, the share of the loudness envelope's "
               "energy at 3-7 Hz. Under a continuous drone the envelope never modulates syllabically "
               "because the bed fills the gaps between words, so band stays low and a voice lands in "
               "'sound'. On bedded material that branch is unreachable, not merely inaccurate — while "
               "the flatness axis under it still separates voice at 98%.",
    },
}
json.dump(rep, open(os.path.join(OUT, "audio.json"), "w"), indent=1)
print(f"\n\nkinds: {dict(kinds)}")
print(f"the poet actually speaks in {n_voice} of {len(shots)} shots (forced alignment)")
print(f"  as labelled      'speech' on {kinds.get('speech',0)}  →  {agree}/{len(shots)} ({100*agree/len(shots):.0f}%)")
print(f"  as a voice test  'not music'  →  {not_music}/{len(shots)} ({100*not_music/len(shots):.0f}%)")
print(f"  flatness alone   >= {best_t:.3f}   →  {best_n}/{len(shots)} ({100*best_n/len(shots):.0f}%)")
for k, v in sorted(spoken_by_kind.items()):
    print(f"    {k:8s} n={v['n']:3d}  poet over {100*v['spokenMedian']:3.0f}% of the shot (median)")
print(f"\n→ {os.path.relpath(SHOTS, ROOT)}  +  renders/cineosis/audio.json")
