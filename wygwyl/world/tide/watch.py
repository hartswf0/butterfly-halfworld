#!/usr/bin/env python3
"""Build watch.html: every take as a playable video, newest and strongest first, each with its tally from the triage and,
where one exists, its extracted storymap. Videos are files in this repo, so the page plays when served from it."""
import html, json, os, subprocess
T = os.path.dirname(os.path.abspath(__file__)); R = {r['id']: r for r in json.load(open(T + '/triage/triage.json'))}; e = html.escape
V = [('Full poems', [('ride-grey', 'Magic Ride, grey-box, eight shots', 'full/out/10ride-grey-1122-0119'), ('ride-greyfig', 'Magic Ride, rider drawn into the seed, two shots', 'full/out/10ride-greyfig-1122-0135'), ('ride-cel', 'Magic Ride, cel-shaded, first half', 'full/out/10ride-cel-1122-0129'),
                     ('shots-12', 'Reunion as nine shots', 'full/out/12shots-1122-0105'), ('full-12', 'Reunion, text only, one take', 'full/out/12-1122-0036'), ('full-06', 'Resurrecting Atlantis, one continuous take', 'full/out/06-1122-0025')]),
     ('Word to world', [('poemwalk-greybox', 'Poem 06 walk, grey-box', 'litmus/out/poemwalk-greybox.mp4'), ('poemwalk-cel020', 'Poem 06 walk, cel-shaded', 'litmus/out/poemwalk-cel020.mp4'), ('03-sheet', 'Poem 03 from the lectern', 'litmus/out/poem03-take2.mp4'), ('03-film-', 'Poem 03, first full take', 'litmus/out/poem03-take1.mp4')]),
     ('Walking and probes', [('street-091', 'Street walk: the arcade', 'litmus/out/street-091.mp4'), ('street-020', 'Street walk: Naraka market', 'litmus/out/street-020.mp4'), ('street-098', 'Street walk: cenotaph walkway', 'litmus/out/street-098.mp4'),
                             ('probe-life', 'Probe: exaggerated life', 'litmus/out/probe-life.mp4'), ('probe-plan', 'Probe: a map as the seed', 'litmus/out/probe-plan.mp4'), ('probe-sheet', 'Probe: a contact sheet as the seed', 'litmus/out/probe-sheet.mp4'), ('probe-spin', 'Probe: the spin', 'litmus/out/probe-spin.mp4')])]
os.makedirs(T + '/posters', exist_ok=True); out = []
for group, items in V:
    cards = []
    for rid, title, p in items:
        film = p + '/film.mp4' if not p.endswith('.mp4') else p; ver = p + '/verify.mp4' if not p.endswith('.mp4') else None; poster = f'posters/{rid.strip("-")}.jpg'
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{T}/{film}'], capture_output=True, text=True).stdout)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{dur * .35:.1f}', '-i', f'{T}/{film}', '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '6', f'{T}/{poster}'])
        r = R[rid]; ty = {h: sum(a.get('happened') == h for a in r['asks']) for h in ('yes', 'partly', 'no')}; n = sum(ty.values())
        bar = ''.join(f"<s class='{h}' style='flex:{ty[h]}'></s>" for h in ty if ty[h])
        sm = f'{T}/{p}/storymap.md' if not p.endswith('.mp4') else ''; extra = ''
        if sm and os.path.exists(sm): extra += f"<details><summary>Storymap (patches, camera, rebuild seeds)</summary><pre>{e(open(sm).read())}</pre><p><a href='{p}/genome.yaml'>Patch genome (YAML)</a></p></details>"
        links = f"<a href='triage/index.html'>Triage</a>" + (f" · <a href='{ver}'>Version with timecode and sent lines</a>" if ver else '') + (f" · <a href='{p}/manifest.json'>Everything sent</a>" if ver else '')
        cards.append(f"""<article><video controls playsinline preload="none" poster="{poster}" src="{film}"></video><h3>{e(title)}</h3><p class="t">{dur:.0f} s · {ty['yes']} of {n} asks happened, {ty['partly']} partly, {ty['no']} not</p><div class="bar">{bar}</div><p class="l">{links}</p>{extra}</article>""")
    out.append(f"<h2>{group}</h2><div class='g'>{''.join(cards)}</div>")
open(T + '/watch.html', 'w').write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Screening · WYGWYL</title>
<style>:root{{--bg:#050d24;--ink:#eef3ff;--dim:#8fa1c7;--line:rgba(238,243,255,.13);--yes:#8fe39a;--partly:#ffd24a;--no:#ff6f8c}}*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:var(--bg);color:var(--ink);font:16px/1.5 "Iowan Old Style",Palatino,Georgia,serif}}main{{max-width:1180px;margin:0 auto;padding:28px 16px 90px}}a{{color:#9fd0ff}}
h1{{font-size:clamp(30px,7vw,52px);font-weight:400;line-height:1.05}}.lede{{color:var(--dim);max-width:640px;margin-top:10px}}
h2{{font:700 12px Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin:38px 0 14px;padding-top:16px;border-top:1px solid var(--line)}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:30px 20px}}video{{display:block;width:100%;aspect-ratio:16/9;background:#000;border-radius:4px}}
h3{{font-size:19px;font-weight:400;margin-top:10px}}.t,.l,summary{{font:13px Helvetica,Arial,sans-serif;color:var(--dim)}}.l{{margin-top:8px}}
.bar{{display:flex;height:4px;gap:2px;margin-top:6px;border-radius:2px;overflow:hidden}}.bar s{{display:block}}s.yes{{background:var(--yes)}}s.partly{{background:var(--partly)}}s.no{{background:var(--no)}}
details{{margin-top:8px}}summary{{cursor:pointer;min-height:36px;display:flex;align-items:center}}pre{{white-space:pre-wrap;font:12px/1.5 ui-monospace,Menlo,monospace;color:#cfdcff;border-left:2px solid var(--line);padding-left:12px;max-height:420px;overflow:auto}}</style></head><body><main>
<h1>Screening</h1><p class="lede"><a href='game/index.html'>Play Magic Ride</a> · Every take, playable, with his reading and the world's sound. Under each: how many of the things we asked for happened, and where one was extracted, the patch-by-patch storymap.</p>
{''.join(out)}</main></body></html>""")
print('watch.html', sum(len(i) for _, i in V), 'videos')
