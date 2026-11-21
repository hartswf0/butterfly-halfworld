#!/usr/bin/env python3
"""Bake prompts.json and prompts.html: a thick prompt per poem for a real-time world model.
Two layers: what the world model is sent (a thick seed, then thin timed cues), and what the director
model holds (the cineosis operation, the signs, what must be seen, who is in frame).
Reads the cineosis-lab treatment beats if that repo is checked out beside this one. Run from this folder."""
import json, os, html, re, glob
CL = '../../../../cineosis-lab/lab/wygwyl/'
cat = json.load(open(CL + 'WYGWYL_Forage_Catalogue.json')); idx = json.load(open(CL + 'WYGWYL_Mood_and_Scene_Index.json'))
T = json.load(open('tide.json')); CH = json.load(open('characters.json')); R = json.load(open('../foundry/refs.json'))
signs = {s['code']: s for s in cat['signs']}
frames = {}
for f in sorted(glob.glob(CL + 'Halfworld_Reference_Frames/*.png')):
    frames.setdefault(os.path.basename(f)[:2], []).append('https://hartswf0.github.io/cineosis-lab/lab/wygwyl/Halfworld_Reference_Frames/' + os.path.basename(f))
MAXW = 12; out = []
for ci, film in enumerate(cat['films']):
    num = film['n']; w = idx['worlds'][ci]; p = next(x for x in T['poems'] if x['num'] == num); t0 = film['poem'][0]
    beats = [b for b in cat['beats'] if b['chapter'] == ci]
    S = p['scenes']; D = T['districts']; dists = []
    for s in S:
        if s['d'] not in dists: dists.append(s['d'])
    d0 = D[S[0]['d']]
    names = list(w['characters'])
    def cast(b):
        txt = ' '.join([b['title'], b['operation'], b['edit'], ' '.join(b.get('items', []))]).lower()
        c = [n for n in names if re.search(r'\b' + re.escape(n.lower().replace('the ', '')) + r'\b', txt)]
        if re.search(r'\bex\b', txt) and 'EX' not in c: c.append('EX')
        if 'poet' in txt and not any(n.startswith('POET') for n in c): c.insert(0, 'POET')
        return c
    pre = [b for b in beats if b['start'] - t0 < 0]
    in_film = ['POET'] + (['EX'] if any('EX' in cast(b) for b in beats) or 'EX' in names else [])
    seed = '\n'.join([
        'STYLE. ' + CH['style'] + ' ' + CH['skin'],
        'PLACE. ' + ' '.join(b['title'].rstrip('.') + '.' for b in pre[:3]) + ' ' + S[0]['what'] + ' ' + S[0]['here'].capitalize() + '.',
        'PEOPLE. ' + ' '.join(CH['cast'][c]['lock'] for c in in_film) + (' ' + CH['cast']['PAIR'] if 'EX' in in_film else ''),
        'OTHERS. ' + '; '.join(f"{k}: {v}" for k, v in w['characters'].items() if k not in ('POET', 'EX')) if len(w['characters']) > len([c for c in w['characters'] if c in ('POET', 'EX')]) else 'OTHERS. None.',
        f"LIGHT. {p['why']}. {d0['weather']}. {d0['light']}.",
        f"SOUND. {d0['sound']}. Under it, room for one man's speaking voice.",
        'MOOD. ' + ', '.join(w['moods'][:6]) + '. ' + w['tone'],
        'RULES. ' + ' '.join(f"{k}: {v}." for k, v in list(w['motifs'].items())[:3]),
    ])
    rows = []
    for b in beats:
        rows.append(dict(t=round(b['start'] - t0, 1), end=round(b['end'] - t0, 1), mode=b['mode'], title=b['title'], cue=' '.join(b['title'].split()[:MAXW]),
                         operation=b['operation'], edit=b['edit'], see=b.get('items', []), design=b['gap'], cast=cast(b),
                         signs=[dict(name=signs[c]['name'], test=signs[c].get('test') or signs[c]['quote']) for c in b['codes'] if c in signs]))
    seeds = dict(halfworld=frames.get(num, []), refs=['../foundry/' + r['img'] for r in R['refs'] if r['poem'] == num],
                 views=[dict(n=v, src=f'../districts/t/{v:03d}.webp', scene=s['name']) for s in S for v in s['views'][:2]])
    out.append(dict(num=num, title=p['title'], dur=p['dur'], accent=w['accent'], logline=w['logline'], thesis=w['thesis'], tone=w['tone'], tagline=w['tagline'],
                    moods=w['moods'], symbols=w['symbols'], districts=[dict(name=D[d]['name'], body=D[d]['body'], glow=D[d]['glow'], mood=D[d]['mood']) for d in dists],
                    cast=in_film, others={k: v for k, v in w['characters'].items() if k not in ('POET', 'EX')}, seed=seed, seed_words=len(seed.split()), beats=rows, seeds=seeds))
    print(num, p['title'][:24].ljust(24), 'beats', len(rows), 'pre-roll', len(pre), 'seed words', len(seed.split()), 'candidates', len(seeds['halfworld']) + len(seeds['refs']) + len(seeds['views']), 'cast', in_film)
json.dump(dict(characters=CH, poems=out), open('prompts.json', 'w'), ensure_ascii=False, separators=(',', ':'))
e = html.escape; f = lambda s: ('−' if s < 0 else '') + f"{int(abs(s) // 60)}:{abs(s) % 60:04.1f}"
secs = []
for p in out:
    chips = ''.join(f"<span class='pal' title='{e(d['name'])}'>" + ''.join(f"<i style='background:{c}'></i>" for c in d['body'] + d['glow']) + f"</span>" for d in p['districts'])
    strip = lambda items, lab: (f"<div class='lab'>{lab}</div><div class='strip'>" + ''.join(items) + '</div>') if items else ''
    imgs = (strip([f"<a href='{u}'><img loading='lazy' src='{u}' alt='Halfworld frame'></a>" for u in p['seeds']['halfworld']], 'Halfworld frames — drawn, already staged')
            + strip([f"<a href='{u}'><img loading='lazy' src='{u}' alt='Archive reference'></a>" for u in p['seeds']['refs']], 'Foundry references — photographic, matched to lines')
            + strip([f"<a href='{v['src']}' title='{e(v['scene'])}'><img loading='lazy' src='{v['src']}' alt='{e(v['scene'])}'><b>{v['n']:03d}</b></a>" for v in p['seeds']['views']], 'Shot lab views — Afrofuturist Atlantis, with depth and cut-outs'))
    tr = ''.join(f"<tr><td>{f(b['t'])}<br><small>{b['mode']}</small></td><td><b>{e(b['cue'])}</b>" + (f"<br><small>{e(' + '.join(b['cast']))}</small>" if b['cast'] else '')
                 + f"</td><td>{e(b['operation'])}<small>{e(' · '.join(s['name'] for s in b['signs']))}</small></td><td>{e(' · '.join(b['see']))}<small>to design: {e(b['design'])}</small></td></tr>" for b in p['beats'])
    secs.append(f"""<section id='p{p['num']}' style='--a:{p['accent']}'><h2>{p['num']} · {e(p['title'])}</h2><p class='tag'>{e(p['tagline'])}</p>
<p>{e(p['logline'])}</p><p class='m'><b>Thesis</b> {e(p['thesis'])}</p><p class='m'><b>Moods</b> {e(' · '.join(p['moods']))}</p><p class='m'><b>Symbols</b> {e(' · '.join(p['symbols']))}</p>
<p class='m'><b>Colour</b> {chips}</p>
<h3>Seed image candidates</h3>{imgs}
<h3>Seed text — sent once, at the start ({p['seed_words']} words)</h3><pre>{e(p['seed'])}</pre>
<h3>Beats — a thin cue for the world, a thick brief for the director</h3><div class='tw'><table><tr><th>Time</th><th>Cue sent ({MAXW} words)</th><th>Operation the director holds</th><th>Must be seen</th></tr>{tr}</table></div></section>""")
C = CH['cast']
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Prompt Book · WYGWYL</title><link rel="icon" href="../../dot.svg">
<style>
:root{{--ink:#eaf2ff;--dim:#93a7cc;--bg:#061433;--panel:#0b1e47;--edge:rgba(234,242,255,.16)}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{background:var(--bg);color:var(--ink);font:15px/1.5 "Iowan Old Style",Palatino,Georgia,serif}}
main{{max-width:1140px;margin:0 auto;padding:18px 16px 70px}}a{{color:inherit}}
.k,th,.lab,nav a,small,td:first-child{{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}}
.k{{font-weight:700;font-size:11px;letter-spacing:.2em;color:#ffd23f;text-transform:uppercase}}
h1{{font-size:clamp(26px,5vw,40px);font-weight:400;line-height:1.1;margin:6px 0}}
h2{{font-size:26px;font-weight:400;margin:44px 0 0;padding-top:14px;border-top:3px solid var(--a,#ffd23f)}}
h3{{font:800 11px "Helvetica Neue",Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--a,#ffd23f);margin:20px 0 6px}}
p{{max-width:860px}}.note,.m,.tag{{color:var(--dim)}}.tag{{font-style:italic;margin-bottom:6px}}.m{{font-size:13.5px;margin-top:4px}}.m b{{font:800 10px "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-right:6px}}
.locks{{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px;margin:14px 0}}
.locks div{{background:var(--panel);border:1px solid var(--edge);border-top:3px solid var(--c);padding:10px 12px;font-size:14px}}
.locks b{{display:block;font:800 10.5px "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;color:var(--c);margin-bottom:3px}}
nav{{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}}nav a{{border:1px solid var(--edge);border-radius:14px;padding:4px 10px;font-size:12px;text-decoration:none}}
.lab{{font-size:11px;color:var(--dim);margin:8px 0 3px}}.strip{{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}}
.strip a{{flex:0 0 auto;position:relative;display:block}}.strip img{{height:92px;width:auto;display:block;border:1px solid var(--edge);background:#000}}
.strip b{{position:absolute;left:3px;bottom:3px;font:700 10px "Helvetica Neue",Arial,sans-serif;background:rgba(0,0,0,.6);padding:0 4px}}
pre{{white-space:pre-wrap;background:var(--panel);border:1px solid var(--edge);padding:12px 14px;font:12.5px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#d8e6ff}}
.pal{{display:inline-flex;margin-right:8px;vertical-align:middle}}.pal i{{width:16px;height:16px;display:block}}
.tw{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;min-width:760px;font-size:13.5px}}
th{{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);text-align:left}}th,td{{padding:7px 12px 7px 0;border-bottom:1px solid var(--edge);vertical-align:top}}
td:first-child{{font-size:12px;color:var(--dim);white-space:nowrap}}small{{display:block;font-size:11px;color:var(--dim);margin-top:2px}}
</style></head><body><main>
<div class="k"><a href="../survey/index.html">The Survey</a> · <a href="index.html">The Tideline</a> · <a href="xsheet.html">Exposure Sheet</a> · The Prompt Book</div>
<h1>The Prompt Book — a thick prompt for each poem</h1>
<p class="note">A world model takes one long description at the start and only short cues after it. So the thickness goes in two places: the seed, which carries the style, the place, the two men, the light, the sound and the rules; and a brief the director model holds for every beat, which carries the cineosis operation and what must be seen. Generated from the treatment beats in cineosis-lab, the scene book, and the locks below.</p>
<div class="locks">
<div style="--c:#ffd23f"><b>STYLE LOCK · DRAFT</b>{e(CH['style'])}</div>
<div style="--c:#eaf2ff"><b>THE POET · DRAFT</b>{e(C['POET']['lock'])}</div>
<div style="--c:#ff9a4a"><b>THE EX · DRAFT</b>{e(C['EX']['lock'])}</div>
<div style="--c:#ff3d6e"><b>THE PAIR · DRAFT</b>{e(C['PAIR'])} {e(CH['skin'])}</div>
</div>
<p class="note">The four locks are a first draft to be rewritten; they live in <code>characters.json</code> and every prompt below is rebuilt from them. Times are on the reading's clock; a minus sign is the lead-in before he speaks.</p>
<nav>{''.join(f"<a href='#p{p['num']}'>{p['num']} {e(p['title'])}</a>" for p in out)}</nav>
{''.join(secs)}
</main></body></html>"""
open('prompts.html', 'w').write(page)
print(sum(len(p['beats']) for p in out), 'beats;', os.path.getsize('prompts.html') // 1024, 'KB page')
