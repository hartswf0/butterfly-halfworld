#!/usr/bin/env python3
"""Run the cinematic extraction engine over our own takes. The model is shown one frame every two seconds with its timecode,
plus the timed lines of the reading as the speech track. Writes genome.yaml and storymap.md beside each film.
    GEMINI_API_KEY=... python3 extract/run.py"""
import base64, io, json, os, re, ssl, subprocess, sys, time, urllib.request, yaml
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); KEY = os.environ['GEMINI_API_KEY']; CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE')); TIDE = json.load(open(T + '/tide.json'))['poems']
FILMS = [('full/out/12shots-1122-0105', 12, 'Poem 12 as nine shots'), ('full/out/10ride-grey-1122-0119', 10, 'Magic Ride, grey-box'), ('full/out/10ride-cel-1122-0129', 10, 'Magic Ride, cel-shaded (first half)'),
         ('full/out/06-1122-0025', 6, 'Poem 06, one continuous take'), ('full/out/12-1122-0036', 12, 'Poem 12, text only')]
SYS = open(T + '/extract/POML.txt').read()
for d, pn, title in FILMS:
    if os.path.exists(f'{T}/{d}/genome.yaml') and '--force' not in sys.argv: continue
    v = f'{T}/{d}/film.mp4'; dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v], capture_output=True, text=True).stdout)
    tmp = '/tmp/claude-0/ex'; subprocess.run(['rm', '-rf', tmp]); os.makedirs(tmp); subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', v, '-vf', 'fps=1/2,scale=512:288', tmp + '/%04d.jpg'])
    fs = sorted(os.listdir(tmp)); speech = '\n'.join(f"{l['t0']:.1f}–{l['t1']:.1f} s: “{l['text']}”" for l in TIDE[pn - 1]['lines'] if l['t0'] < dur)
    parts = [{'text': f"INPUT: a {dur:.0f}-second film, “{title}”. You are given one frame every 2 seconds with its time. You cannot hear it; the only audio you may log is the SPEECH TRACK below (one man reading a poem) plus 'world sound not observed'. "
              f"Describe only what is visible in the frames. State every person's apparent gender, race and clothing.\n\nSPEECH TRACK\n{speech}\n\nReturn JSON only: {{\"genome_yaml\": \"<OUTPUT_A as a YAML string>\", \"storymap_md\": \"<OUTPUT_B as Markdown>\", "
              "\"quickcheck\": {\"diegesis_logged\": true, \"macro_structure_mapped\": true, \"patches_sliced\": true, \"rehydration_seeds_drafted\": true, \"standby_outputs_held\": true}}"}]
    for i, f in enumerate(fs): parts += [{'text': f't = {i * 2 + 1} s'}, {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(open(f'{tmp}/{f}', 'rb').read()).decode()}}]
    ok = False
    for m in ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-4-argon']:
        try:
            rq = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent', headers={'x-goog-api-key': KEY, 'content-type': 'application/json'},
                 data=json.dumps({'systemInstruction': {'parts': [{'text': SYS}]}, 'contents': [{'parts': parts}], 'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0, 'maxOutputTokens': 30000}}).encode())
            r = json.load(urllib.request.urlopen(rq, timeout=170, context=CTX)); o = json.loads(r['candidates'][0]['content']['parts'][0]['text']); g = yaml.safe_load(o['genome_yaml'])
            open(f'{T}/{d}/genome.yaml', 'w').write(f"# extracted by {m} from one frame every 2 s of film.mp4 plus the reading's timed lines; world sound was not heard\n" + o['genome_yaml'].strip() + '\n')
            open(f'{T}/{d}/storymap.md', 'w').write(o['storymap_md'].strip() + '\n'); ok = True
            print(f"{d.split('/')[-1]}: {m}, {len(fs)} frames, {len(g['patch_timeline'])} patches, {len(g['beat_structure'])} beats, {len(g['macro_structure'])} units, quickcheck {o.get('quickcheck')}", flush=True); break
        except Exception as e: print('  retry', m, type(e).__name__, str(e)[:120], flush=True); time.sleep(5)
    if not ok: print(d, 'FAILED')
