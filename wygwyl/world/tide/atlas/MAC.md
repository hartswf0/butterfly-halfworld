# Sapiens2 on the Mac

Body tracking (Meta's Sapiens2, 308 keypoints per person) is the slow step: about 12-28 s a person on the cloud
session's 4 CPU cores. An Apple-silicon Mac runs it on its GPU through PyTorch's Metal backend, about a second a person.

The Mac only does the bodies. Everything else (Gemini person boxes, Atlas pose and depth, the 3D lift, the films and the
viewer) stays in the cloud session. Each take's frames and person boxes are in the repo, so the Mac needs nothing else.

## Run it

```bash
cd ~/path/to/butterfly-halfworld
bash wygwyl/world/tide/atlas/run_bodies_mac.sh
```

The first run makes a virtual environment (`.venv-sapiens`, about 2 GB with PyTorch) and downloads the Sapiens2 pose
model from Hugging Face (`facebook/sapiens2-pose-0.4b`, about 1.6 GB). It then tracks every prepped take, commits the
`bodies.json` files and pushes them to `claude/magical-pasteur-keilrw`. It is safe to stop and run again.

Needs: macOS on Apple silicon (M1 or later), Python 3.10 or newer, git with push access to the repo, about 5 GB free.
Keep the laptop plugged in; it will run warm.
