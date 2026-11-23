#!/usr/bin/env bash
# Sapiens2 body tracking for every grey-box take, on an Apple-silicon Mac's GPU (Metal / MPS).
# Run from anywhere inside the butterfly-halfworld checkout:   bash wygwyl/world/tide/atlas/run_bodies_mac.sh
# Resumable: frames already in a take's bodies.json are skipped, so stopping and re-running is safe.
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT/wygwyl/world/tide"
BRANCH="${BRANCH:-claude/magical-pasteur-keilrw}"
git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull --ff-only origin "$BRANCH"
if [ ! -d "$ROOT/.venv-sapiens" ]; then
  python3 -m venv "$ROOT/.venv-sapiens"
  "$ROOT/.venv-sapiens/bin/pip" install -q --upgrade pip
  "$ROOT/.venv-sapiens/bin/pip" install -q torch torchvision "transformers>=5.24" safetensors huggingface_hub pillow numpy opencv-python-headless
fi
PY="$ROOT/.venv-sapiens/bin/python"
"$PY" -c "import torch; print('Metal GPU available:', torch.backends.mps.is_available())"
export PYTORCH_ENABLE_MPS_FALLBACK=1 SAP_THREADS=8
for d in atlas/takes/*/; do
  t="$(basename "$d")"
  ls "$d"s1/frames/*.jpg >/dev/null 2>&1 && ls "$d"s1/boxes.json >/dev/null 2>&1 || { echo "skip $t (not prepped yet)"; continue; }
  echo "== $t"; "$PY" atlas/bodies.py "takes/$t" 2>&1 | grep -v "Loading weights" || true
done
git add atlas/takes/*/bodies.json
git commit -m "Sapiens2 bodies tracked on the Mac GPU" || echo "nothing new to commit"
git pull --rebase origin "$BRANCH" && git push origin "HEAD:$BRANCH"
echo "Done. Tell Claude in the cloud session: bodies pushed."
