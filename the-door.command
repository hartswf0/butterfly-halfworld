#!/bin/bash
# THE DOOR — double-click this.
#
# The index lives at MARKOV_POET_ARCHIVE-FLY/INDEX.html and links outward to
# audio/ and wygwyl/, so it only resolves when the server's root is THIS folder,
# not the archive folder inside it. Getting that wrong is a 404 with no
# explanation, so nobody should have to know it. This script knows it.
cd "$(dirname "$0")" || exit 1
PORT=8191
# reuse a server already serving this folder rather than stacking another
if ! curl -fsS -o /dev/null "http://127.0.0.1:$PORT/MARKOV_POET_ARCHIVE-FLY/" 2>/dev/null; then
  while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT+1)); done
  echo "serving $(pwd) on $PORT"
  python3 -m http.server "$PORT" >/dev/null 2>&1 &
  for _ in $(seq 1 40); do
    curl -fsS -o /dev/null "http://127.0.0.1:$PORT/MARKOV_POET_ARCHIVE-FLY/" && break
    sleep 0.25
  done
fi
echo "THE DOOR  ->  http://127.0.0.1:$PORT/MARKOV_POET_ARCHIVE-FLY/"
open "http://127.0.0.1:$PORT/MARKOV_POET_ARCHIVE-FLY/"
