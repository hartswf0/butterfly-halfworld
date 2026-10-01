#!/usr/bin/env python3
"""project.py — put the 94 halfworld shots INTO cineosis's space, not beside it.

    python3 wygwyl/cineosis/project.py
    python3 wygwyl/cineosis/project.py --k 24 --lab /path/to/cineosis-lab

The four fields emit.mjs leaves null — xy, sim, affinity, aff_top — are all
positions in a space that was fitted once over 15,149 shots. The failure mode
is not getting them wrong; it is getting them PLAUSIBLY wrong by re-fitting.
A fresh t-SNE over 94 points produces beautiful coordinates in a space that
shares no axes with the archive, and every neighbour it reports is false. So
nothing here is fitted. Everything is projected.

Three places the archive's own numbers must be reused rather than recomputed:

  the 45 sign prototypes   text side: mean CLIP text embedding of each sign's
                           shot_criteria plus its queries; image side: mean
                           embedding of the editor's exemplars from picks.json.
                           Same prototypes, so the same question is being asked.

  the z-score              affinity.py z-scores each sign's score ACROSS THE
                           CORPUS so a sign CLIP likes everywhere cannot
                           dominate. Z-scoring 94 shots against themselves
                           instead would measure which halfworld is most
                           Deleuzian compared to the other halfworlds, which is
                           not the question. The archive's mean and sd are
                           computed here and applied to the new rows.

  t-SNE                    has no out-of-sample transform, so there is no exact
                           answer and this does not pretend there is one. A new
                           shot is placed at the cosine-weighted mean of its k
                           nearest archive neighbours' coordinates, which is the
                           standard extension and is recorded on each shot as
                           `xyMethod` with the neighbours it was placed from.
                           Anyone reading these coordinates can see they were
                           interpolated and from what.

The image embedded is thumbs/<id>.jpg, one per shot, because that is exactly
what analyze.py embeds. Matching the method matters more than improving it: an
average over eight frames would be a better description of a shot and would put
these 94 somewhere the other 15,149 are not.

It also prints a thing neither project could get alone. cineosis infers `scale`
and `subjects` from CLIP; the halfworld KNOWS them, because the films drew the
bodies. So the same 94 shots carry both, and the agreement between them is a
measurement of cineosis's classifier against ground truth rather than against
another guess.
"""
import argparse, glob, json, os, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("--lab", default="/home/user/hartswf0/cineosis-lab")
ap.add_argument("--shots", default=None)
ap.add_argument("--k", type=int, default=16, help="neighbours used to place a new shot")
ap.add_argument("--device", default="cpu")
A = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "renders", "cineosis")
SHOTS = A.shots or os.path.join(OUT, "halfworld-shots.json")
LAB, C = A.lab, os.path.join(A.lab, "lab", "cache")

shots = json.load(open(SHOTS))
missing = [s for s in shots if not os.path.exists(os.path.join(OUT, "thumbs", s["id"] + ".jpg"))]
if missing:
    sys.exit(f"{len(missing)} of {len(shots)} shots have no thumb yet — run encode.mjs first")

print(f"archive: loading embeddings")
E = np.load(os.path.join(C, "emb.npy")).astype(np.float32)
ids = json.load(open(os.path.join(C, "emb_ids.json")))
row = {i: k for k, i in enumerate(ids)}
lab = json.load(open(os.path.join(LAB, "lab", "lab-data.json")))
XY = {s["id"]: s["xy"] for s in lab["shots"] if s.get("xy")}
SIM = {s["id"]: s["sim"] for s in lab["shots"] if s.get("sim") is not None}
print(f"  {E.shape[0]} shots x {E.shape[1]} dims · {len(XY)} with xy")

import torch, open_clip
from PIL import Image
dev = A.device
model, _, pre = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
model = model.to(dev).eval()
tok = open_clip.get_tokenizer("ViT-B-32")

# ---- embed the halfworld thumbs, exactly as analyze.py embeds the archive's --
print(f"embedding {len(shots)} halfworld thumbs")
ims = [pre(Image.open(os.path.join(OUT, "thumbs", s["id"] + ".jpg")).convert("RGB")) for s in shots]
with torch.no_grad():
    N = model.encode_image(torch.stack(ims).to(dev))
    N = (N / N.norm(dim=-1, keepdim=True)).cpu().numpy().astype(np.float32)

# ---- the 45 sign prototypes, rebuilt from the archive's own grounding -------
g = [s for f in sorted(glob.glob(os.path.join(LAB, "grounding", "g*.json"))) for s in json.load(open(f))]
picks = json.load(open(os.path.join(LAB, "picks.json")))
ns = [str(s["n"]) for s in g]
print(f"rebuilding {len(ns)} sign prototypes")
Tp = []
with torch.no_grad():
    for s in g:
        texts = [f"a film still: {s['shot_criteria'][:300]}"] + [f"a film still of {q}" for q in s["queries"]]
        t = model.encode_text(tok(texts, context_length=77).to(dev))
        t = t / t.norm(dim=-1, keepdim=True)
        m = t.mean(0)
        Tp.append((m / m.norm()).cpu().numpy())
Tp = np.stack(Tp).astype(np.float32)

ex = {n: [row[c] for c, _ in picks.get(n, []) if c in row] for n in ns}
def sign_scores(X):
    """affinity.py's score, before the z-score: half the text prototype, half
    the exemplar prototype. No leave-one-out — these shots are nobody's
    exemplar, and applying it would silently subtract a row that is not there."""
    St = X @ Tp.T
    Si = np.zeros_like(St)
    for j, n in enumerate(ns):
        rows = ex[n]
        if not rows:
            Si[:, j] = St[:, j]; continue
        tot = E[rows].sum(0)
        Si[:, j] = X @ (tot / np.linalg.norm(tot))
    return 0.5 * St + 0.5 * Si

print("taking the archive's own mean and sd per sign (not the newcomers')")
S_arch = sign_scores(E)
mu, sd = S_arch.mean(0), S_arch.std(0) + 1e-6
Z = (sign_scores(N) - mu) / sd
P = torch.softmax(torch.tensor(Z) * 1.2, dim=1).numpy()

# ---- subjects and scale, cineosis's way, so the two are comparable ----------
SUBJECTS = ["a face in close-up", "a person", "a crowd of people", "hands", "an animal", "birds",
            "a machine", "a vehicle", "buildings and architecture", "a room interior", "a landscape",
            "water or the sea", "the sky and clouds", "plants or trees", "text or a title card",
            "an animated cartoon", "a diagram or map", "an object close-up", "a screen or television",
            "a microscope or abstract pattern"]
LABELS = ["face close-up", "person", "crowd", "hands", "animal", "birds", "machine", "vehicle",
          "architecture", "interior", "landscape", "water", "sky", "plants", "text", "animation",
          "diagram", "object", "screen", "pattern"]
SCALES = ["extreme close-up", "close-up", "medium shot", "long shot", "extreme long shot"]
with torch.no_grad():
    def text(ps):
        t = model.encode_text(tok(ps).to(dev)); return (t / t.norm(dim=-1, keepdim=True)).cpu().numpy()
    Ts = text([f"a film still of {s}" for s in SUBJECTS]).astype(np.float32)
    Tc = text([f"a film still, {s}" for s in SCALES]).astype(np.float32)
ps = torch.softmax(torch.tensor(N @ Ts.T) * 100, dim=1).numpy()
pc = torch.softmax(torch.tensor(N @ Tc.T) * 100, dim=1).numpy()

# ---- xy and sim: placed among neighbours, never re-fitted -------------------
print(f"placing each shot among its {A.k} nearest archive neighbours")
have = np.array([k for k, i in enumerate(ids) if i in XY])
XYa = np.array([XY[ids[k]] for k in have], dtype=np.float32)
SIMa = np.array([SIM.get(ids[k], 0) for k in have], dtype=np.float32)
cos = N @ E[have].T

agree_scale = 0
for k, s in enumerate(shots):
    nb = np.argpartition(-cos[k], A.k)[:A.k]
    nb = nb[np.argsort(-cos[k][nb])]
    w = np.maximum(0.0, cos[k][nb]); w = w / (w.sum() + 1e-9)
    s["xy"] = [round(float(XYa[nb, 0] @ w), 4), round(float(XYa[nb, 1] @ w), 4)]
    s["sim"] = int(round(float(SIMa[nb] @ w)))
    order = np.argsort(-P[k])
    s["aff_top"] = [[ns[j], round(float(P[k, j]) * 100, 1)] for j in order[:8]]
    s["affinity"] = {ns[j]: round(float(P[k, j]) * 100, 1) for j in range(len(ns))}
    top3 = np.argsort(-ps[k])[:3]
    clip_scale = SCALES[int(np.argmax(pc[k]))]
    truth = s["scale"]
    if clip_scale == truth: agree_scale += 1
    s["scale"] = clip_scale                       # cineosis is the target shape
    s["subjects"] = [{"label": LABELS[j], "p": round(float(ps[k, j]), 3)} for j in top3]
    s["halfworld"]["scaleTruth"] = truth
    s["halfworld"]["subjectsTruth"] = s["halfworld"].pop("subjectsTruth", None) or None
    s["halfworld"]["xyMethod"] = {
        "how": "cosine-weighted mean of the k nearest archive shots' t-SNE coordinates; t-SNE has no out-of-sample transform, so this is an interpolation and is marked as one",
        "k": A.k,
        "neighbours": [ids[int(have[j])] for j in nb[:5]],
        "cos": [round(float(cos[k][j]), 4) for j in nb[:5]],
    }
    s["halfworld"]["affinityMethod"] = "affinity.py's prototypes and score, z-scored with the ARCHIVE's per-sign mean and sd"

json.dump(shots, open(SHOTS, "w"), indent=1)

# ---- what the join measures ------------------------------------------------
from collections import Counter
rep = {
    "projectedInto": {"embeddings": "lab/cache/emb.npy (15149x512, ViT-B-32 laion2b_s34b_b79k)",
                      "zScore": "archive mean/sd per sign", "xy": f"k={A.k} cosine-weighted neighbour mean"},
    "scaleAgreement": {"agree": agree_scale, "of": len(shots),
                       "pct": round(100 * agree_scale / len(shots), 1),
                       "note": "cineosis's CLIP scale against the halfworld's own draw calls. The films know the figure's height in rows; this is a classifier measured against ground truth rather than against another guess."},
    "clipScale": dict(Counter(s["scale"] for s in shots)),
    "truthScale": dict(Counter(s["halfworld"]["scaleTruth"] for s in shots)),
    "clipSubjects": dict(Counter(o["label"] for s in shots for o in s["subjects"]).most_common()),
    "topSigns": dict(Counter(s["aff_top"][0][0] for s in shots).most_common(10)),
}
json.dump(rep, open(os.path.join(OUT, "projection.json"), "w"), indent=1)
print(f"\nscale: CLIP agrees with the films' own figure heights on {agree_scale}/{len(shots)}"
      f" ({100*agree_scale/len(shots):.0f}%)")
print("  CLIP says :", rep["clipScale"])
print("  truth says:", rep["truthScale"])
print("  top signs :", rep["topSigns"])
print(f"\n→ {os.path.relpath(SHOTS, ROOT)}  +  renders/cineosis/projection.json")
