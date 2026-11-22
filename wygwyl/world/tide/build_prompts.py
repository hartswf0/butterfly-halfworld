#!/usr/bin/env python3
"""Bake prompts.json and prompts.html: a thick prompt per poem for a real-time world model.
  seed     - sent once: style, eye and light, place, every person with gender/race/outfit, water rule, sound, mood
  patches  - 8 to 10 seconds each: the cue sent, who is in frame (tagged), the water's state, and the brief the
             director model holds (cineosis operation, signs, what must be seen)
Sources: cineosis-lab treatment beats and mood index, the scene book, the shot lab's measured cameras,
his word timings, and characters.json.  Run from this folder with the sibling repos checked out."""
import json, os, html, re, glob, statistics as st, collections
CL = '../../../../cineosis-lab/lab/wygwyl/'
cat = json.load(open(CL + 'WYGWYL_Forage_Catalogue.json')); idx = json.load(open(CL + 'WYGWYL_Mood_and_Scene_Index.json'))
T = json.load(open('tide.json')); CH = json.load(open('characters.json')); R = json.load(open('../foundry/refs.json'))
signs = {s['code']: s for s in cat['signs']}
cams = {}
for f in glob.glob('../../../../wygwyl-world-arch/shots/out/*/shot.json'):
    s = json.load(open(f)); cams[s['bible_no']] = s['camera']
frames = {}
for f in sorted(glob.glob(CL + 'Halfworld_Reference_Frames/*.png')):
    frames.setdefault(os.path.basename(f)[:2], []).append('https://hartswf0.github.io/cineosis-lab/lab/wygwyl/Halfworld_Reference_Frames/' + os.path.basename(f))

# ---- people: every human is stated with gender, race and outfit --------------------------------------
PEOPLE = CH['people']
tag = lambda q: f"{q['name']} ({q['race']} {q['gender']}, {q['age']}; {q['outfit']})"
short = lambda q: f"{q['name']} ({q['race']} {q['gender']}, {q['outfit'].split(';')[0].split(',')[0]})"
def who(text):
    t = text.lower(); return [q for q in PEOPLE if re.search(q['match'], t)]
HUMAN = re.compile(r"\b(poet|ex|lover|mother|father|parents?|child|boy|girl|ancestors?|elders?|friends?|guests?|dj|dancers?|crowd|people|angels?|choir|bystanders?|strangers?|muse|couple|pair|figures?|silhouettes?|man|men|woman|women|person|citizens?|bodies)\b", re.I)
def untagged(text, people):
    """human words in a sent text that no tag in that text accounts for"""
    bare = re.sub(r"\([^)]*\)", '', text)                       # the tags themselves are not untagged people
    return [m for m in set(x.lower() for x in HUMAN.findall(bare)) if not any(re.search(q['match'], m) for q in people)]

# ---- water: what the words turn into, and how thick it runs ------------------------------------------
MEDIA = [('vapour', r'haze|vape|vapou?r|smoke|fog|mist', ['along the floor', 'knee-high', 'waist-high', 'to the chest', 'filling the room']),
         ('rain', r'\brain|storm|drizzle', ['first drops', 'steady', 'sheeting', 'pooling ankle-deep', 'a standing flood']),
         ('tide water', r'flood|sea\b|ocean|tide|drain|water|harbou?r|pool|wave|river|swim', ['at the soles', 'ankle-deep', 'knee-deep', 'waist-deep', 'chest-deep']),
         ('liquid light', r'light|star|galax|glow|comet|candle|neon|sun', ['a thread on the ground', 'a shallow sheen', 'knee-high and bright', 'waist-high', 'a full bright flood']),
         ('silt', r'dust|sand|ash|ember|soil', ['a film on the floor', 'drifting ankle-deep', 'in low dunes', 'in the air', 'settling over everything'])]
def medium(text):
    sc = [(len(re.findall(rx, text.lower())) * (.3 if name == 'liquid light' else 1), -i) for i, (name, rx, _) in enumerate(MEDIA)]; return MEDIA[-max(sc)[1]]
def thickness(wps):
    return ('thin and quick as rain', 0.2) if wps >= 2.35 else ('with the weight of water', 0.4) if wps >= 2.15 else ('slow as oil', 0.7) if wps >= 1.9 else ('thick as honey', 0.9)

MAXW = 12; out = []; problems = 0
for ci, film in enumerate(cat['films']):
    num = film['n']; w = idx['worlds'][ci]; p = next(x for x in T['poems'] if x['num'] == num); t0 = film['poem'][0]
    beats = [dict(b, lt=b['start'] - t0, le=b['end'] - t0) for b in cat['beats'] if b['chapter'] == ci]
    S, D, L = p['scenes'], T['districts'], p['lines']
    dists = []
    for s in S:
        if s['d'] not in dists: dists.append(s['d'])
    d0 = D[S[0]['d']]
    alltext = ' '.join([w['logline'], w['thesis'], ' '.join(w['motifs'].values()), ' '.join(s['what'] for s in S), ' '.join(b['title'] for b in beats)])
    med, _, levels = medium(alltext)
    nw = lambda l: len(l['words']) or len(l['text'].split())
    words = sum(nw(l) for l in L); wps = words / p['dur']; spoken = sum(l['t1'] - l['t0'] for l in L); silent = 1 - spoken / p['dur']
    thick, visc = thickness(wps)
    # the eye: measured from this poem's own shots
    cs = [cams[v] for s in S for v in s['views'] if v in cams]
    eye = (f"{st.median([c['focal_35mm_equiv'] for c in cs if c.get('focal_35mm_equiv')] or [35]):.0f}mm equivalent, camera {st.median([c['height_m'] for c in cs if c.get('height_m')] or [1.6]):.1f} m off the ground, "
           f"{collections.Counter(c['shot_class'] for c in cs).most_common(1)[0][0]}, measured across {len(cs)} of this poem's shots") if cs else 'no measured shots'
    # ---- patches: 8 to 10 seconds, cut at his line ends -------------------------------------------
    cuts, a, i = [], 0.0, 0
    while i < len(L):
        j = i
        while j < len(L) - 1 and L[j]['t1'] - a < 8: j += 1
        end = L[j + 1]['t0'] if j < len(L) - 1 else p['dur']
        if end - a > 12.5 and j > i: j -= 1; end = L[j + 1]['t0']
        cuts.append((a, end, i, j)); a = end; i = j + 1
    said = 0; patches = []; lastbeat = lastscene = None
    pre = [b for b in beats if b['lt'] < 0]
    for k, (a, b_, i, j) in enumerate(cuts):
        mid = (a + b_) / 2; ls = L[i:j + 1]
        beat = next((b for b in beats if b['lt'] <= mid < b['le']), beats[-1]); sc = S[collections.Counter(l['scene'] for l in ls).most_common(1)[0][0]]
        n = sum(nw(l) for l in ls); said += n; rate = n / max(.1, b_ - a); sil = 1 - sum(l['t1'] - l['t0'] for l in ls) / max(.1, b_ - a)
        flow = 'stills and mirrors' if sil > .35 else 'runs' if rate > wps * 1.15 else 'pools' if rate < wps * .85 else 'flows'
        level = levels[min(4, int(said / words * 5))]
        people = who(' '.join([beat['title'], ' '.join(beat.get('items', [])), sc['what']]))
        if not any(q['id'] == 'POET' for q in people) and re.search('poet', sc['what'] + beat['title'], re.I): people.insert(0, PEOPLE[0])
        newbeat = beat['id'] != lastbeat; newscene = sc['name'] != lastscene; lastbeat, lastscene = beat['id'], sc['name']
        action = ' '.join(beat['title'].split()[:MAXW]) if newbeat else sc['name'] if newscene else 'Hold the place. Nothing new enters.'
        cue = f"{action.rstrip('.')}. {med.capitalize()} {flow}, {level}." + (' In frame: ' + '; '.join(short(q) for q in people) + '.' if people else ' Nobody in frame.')
        bad = untagged(cue, people); problems += len(bad)
        patches.append(dict(id=f"P{k + 1:02d}", t=round(a, 1), end=round(b_, 1), said=' '.join(l['text'] for l in ls), cue=cue, kind='BEAT' if newbeat else 'SCENE' if newscene else 'HOLD',
                            water=f"{flow}, {level}", people=[q['id'] for q in people], camera=sc['camera'], here=sc['here'], district=D[sc['d']]['name'], light=D[sc['d']]['light'],
                            operation=beat['operation'], edit=beat['edit'], see=beat.get('items', []), design=beat['gap'], mode=beat['mode'], untagged=bad,
                            signs=[signs[c]['name'] for c in beat['codes'] if c in signs]))
    # ---- the seed ------------------------------------------------------------------------------------
    cast_ids = []
    for pt in patches:
        for q in pt['people']:
            if q not in cast_ids: cast_ids.append(q)
    for b in pre:
        for q in who(b['title']):
            if q['id'] not in cast_ids: cast_ids.append(q['id'])
    if 'POET' not in cast_ids: cast_ids.insert(0, 'POET')
    place = ' '.join(b['title'].rstrip('.') + '.' for b in pre[:3]) + ' ' + S[0]['what'] + ' ' + S[0]['here'].capitalize() + '.'
    cast_ids += [q['id'] for q in who(place) if q['id'] not in cast_ids]
    cast = [q for q in PEOPLE if q['id'] in cast_ids]
    seed = '\n'.join([
        'STYLE. ' + CH['style'],
        f"EYE. {eye}. {S[0]['camera'].capitalize()}.",
        f"LIGHT. {p['why'].capitalize()}. {d0['weather'].capitalize()}. {d0['light'].capitalize()}. {CH['skin']}",
        'PLACE. ' + place,
        'PEOPLE. Everyone here is Black. ' + ' '.join(f"{tag(q)[0].upper() + tag(q)[1:]}; {q['body']}." for q in cast) + (' ' + CH['pair'] if any(q['id'] == 'EX' for q in cast) else ''),
        f"WATER. His words become {med}. When he speaks, {med} rises from where he stands; when he is silent it stills and mirrors the light. It runs {thick}. "
        f"It starts {levels[0]} and ends {levels[4]}. It never puts out a light and never hides a face.",
        f"SOUND. {d0['sound'].capitalize()}. Under it, room for one man's speaking voice.",
        'MOOD. ' + ', '.join(w['moods'][:6]) + '. ' + w['tone'],
    ])
    bad = untagged(place, cast); problems += len(bad)
    seeds = dict(halfworld=frames.get(num, []), refs=['../foundry/' + r['img'] for r in R['refs'] if r['poem'] == num],
                 views=[dict(n=v, src=f'../districts/t/{v:03d}.webp', scene=s['name']) for s in S for v in s['views'][:2]])
    out.append(dict(num=num, title=p['title'], dur=p['dur'], accent=w['accent'], logline=w['logline'], thesis=w['thesis'], tagline=w['tagline'], moods=w['moods'], symbols=w['symbols'],
                    districts=[dict(name=D[d]['name'], body=D[d]['body'], glow=D[d]['glow']) for d in dists], eye=eye,
                    water=dict(medium=med, thickness=thick, viscosity=visc, wps=round(wps, 2), silent=round(silent, 2), levels=levels),
                    cast=[q['id'] for q in cast], seed=seed, seed_words=len(seed.split()), seed_untagged=bad, patches=patches, seeds=seeds))
    print(num, p['title'][:22].ljust(22), 'patches', len(patches), 'mean', f"{p['dur'] / len(patches):.1f}s", '|', med.ljust(12), thick.ljust(22), '| cast', len(cast), '| seed', len(seed.split()), 'w | untagged', sum(len(x['untagged']) for x in patches) + len(bad))
json.dump(dict(characters=CH, poems=out), open('prompts.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('PEOPLE CHECK: human words sent without a gender/race/outfit tag:', problems)

e = html.escape; f = lambda s: f"{int(s // 60)}:{s % 60:04.1f}"
KC = dict(BEAT='#7fe0ff', SCENE='#ffd23f', HOLD='#7d8cb5'); secs = []
for p in out:
    chips = ''.join(f"<span class='pal' title='{e(d['name'])}'>" + ''.join(f"<i style='background:{c}'></i>" for c in d['body'] + d['glow']) + "</span>" for d in p['districts'])
    strip = lambda items, lab: (f"<div class='lab'>{lab}</div><div class='strip'>" + ''.join(items) + '</div>') if items else ''
    imgs = (strip([f"<a href='{u}'><img loading='lazy' src='{u}' alt='Halfworld frame'></a>" for u in p['seeds']['halfworld']], 'Halfworld frames — drawn, already staged')
            + strip([f"<a href='{u}'><img loading='lazy' src='{u}' alt='Archive reference'></a>" for u in p['seeds']['refs']], 'Foundry references — photographic, matched to lines')
            + strip([f"<a href='{v['src']}' title='{e(v['scene'])}'><img loading='lazy' src='{v['src']}' alt='{e(v['scene'])}'><b>{v['n']:03d}</b></a>" for v in p['seeds']['views']], 'Shot lab views — Afrofuturist Atlantis, with depth and cut-outs'))
    W = p['water']; bar = f"<span class='visc'><i style='width:{W['viscosity'] * 100:.0f}%'></i></span>"
    tr = ''.join(f"<tr><td><b style='color:{KC[x['kind']]}'>{x['id']}</b><br>{f(x['t'])}–{f(x['end'])}<small>{x['kind'].lower()} · {x['mode']}</small></td>"
                 f"<td><i>“{e(x['said'])}”</i></td><td>{e(x['cue'])}<small>{e(x['here'])} · {e(x['district'])}</small></td>"
                 f"<td>{e(x['operation'])}<small>{e(' · '.join(x['signs']))}</small><small>must see: {e(' · '.join(x['see']))}</small><small>camera: {e(x['camera'])}</small></td></tr>" for x in p['patches'])
    secs.append(f"""<section id='p{p['num']}' style='--a:{p['accent']}'><h2>{p['num']} · {e(p['title'])}</h2><p class='tag'>{e(p['tagline'])}</p>
<p>{e(p['logline'])}</p><p class='m'><b>Thesis</b> {e(p['thesis'])}</p><p class='m'><b>Moods</b> {e(' · '.join(p['moods']))}</p><p class='m'><b>Colour</b> {chips}</p>
<p class='m'><b>Eye</b> {e(p['eye'])}</p>
<p class='m'><b>Water</b> {e(W['medium'])}, {e(W['thickness'])} {bar} — he speaks {W['wps']} words a second and is silent {W['silent'] * 100:.0f}% of the time. From “{e(W['levels'][0])}” to “{e(W['levels'][4])}”.</p>
<h3>Seed image candidates</h3>{imgs}
<h3>Seed text — sent once ({p['seed_words']} words)</h3><pre>{e(p['seed'])}</pre>
<h3>Patches — {len(p['patches'])} of about {p['dur'] / len(p['patches']):.0f} seconds</h3><div class='tw'><table><tr><th>Patch</th><th>He says</th><th>Sent to the world</th><th>Held by the director</th></tr>{tr}</table></div></section>""")
ppl = ''.join(f"<tr><td>{e(q['name'])}</td><td>{e(q['race'])} {e(q['gender'])}, {e(q['age'])}</td><td>{e(q['outfit'])}</td><td>{e(q['body'])}</td></tr>" for q in PEOPLE)
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Prompt Book · WYGWYL</title><link rel="icon" href="../../dot.svg">
<style>
:root{{--ink:#eaf2ff;--dim:#93a7cc;--bg:#061433;--panel:#0b1e47;--edge:rgba(234,242,255,.16)}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{background:var(--bg);color:var(--ink);font:15px/1.5 "Iowan Old Style",Palatino,Georgia,serif}}
main{{max-width:1200px;margin:0 auto;padding:18px 16px 70px}}a{{color:inherit}}
.k,th,.lab,nav a,small,td:first-child{{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}}
.k{{font-weight:700;font-size:11px;letter-spacing:.2em;color:#ffd23f;text-transform:uppercase}}
h1{{font-size:clamp(26px,5vw,40px);font-weight:400;line-height:1.1;margin:6px 0}}
h2{{font-size:26px;font-weight:400;margin:44px 0 0;padding-top:14px;border-top:3px solid var(--a,#ffd23f)}}
h3{{font:800 11px "Helvetica Neue",Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:var(--a,#ffd23f);margin:20px 0 6px}}
p{{max-width:900px}}.note,.m,.tag{{color:var(--dim)}}.tag{{font-style:italic;margin-bottom:6px}}.m{{font-size:13.5px;margin-top:4px}}.m b{{font:800 10px "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-right:6px}}
.rules{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;margin:14px 0}}
.rules div{{background:var(--panel);border:1px solid var(--edge);border-top:3px solid var(--c);padding:10px 12px;font-size:14px}}
.rules b{{display:block;font:800 10.5px "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;color:var(--c);margin-bottom:3px}}
nav{{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}}nav a{{border:1px solid var(--edge);border-radius:14px;padding:4px 10px;font-size:12px;text-decoration:none}}
.lab{{font-size:11px;color:var(--dim);margin:8px 0 3px}}.strip{{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}}
.strip a{{flex:0 0 auto;position:relative;display:block}}.strip img{{height:92px;width:auto;display:block;border:1px solid var(--edge);background:#000}}
.strip b{{position:absolute;left:3px;bottom:3px;font:700 10px "Helvetica Neue",Arial,sans-serif;background:rgba(0,0,0,.6);padding:0 4px}}
pre{{white-space:pre-wrap;background:var(--panel);border:1px solid var(--edge);padding:12px 14px;font:12.5px/1.55 ui-monospace,Menlo,Consolas,monospace;color:#d8e6ff}}
.pal{{display:inline-flex;margin-right:8px;vertical-align:middle}}.pal i{{width:16px;height:16px;display:block}}
.visc{{display:inline-block;width:90px;height:8px;border:1px solid var(--edge);vertical-align:middle;margin:0 4px}}.visc i{{display:block;height:100%;background:#7fe0ff}}
.tw{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;min-width:860px;font-size:13.5px}}
th{{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);text-align:left}}th,td{{padding:8px 14px 8px 0;border-bottom:1px solid var(--edge);vertical-align:top}}
td:first-child{{font-size:12px;color:var(--dim);white-space:nowrap}}td:nth-child(2){{color:var(--dim);max-width:230px}}small{{display:block;font-size:11px;color:var(--dim);margin-top:3px}}
</style></head><body><main>
<div class="k"><a href="../survey/index.html">The Survey</a> · <a href="index.html">The Tideline</a> · <a href="xsheet.html">Exposure Sheet</a> · The Prompt Book</div>
<h1>The Prompt Book — a thick prompt for each poem</h1>
<p class="note">Each poem gets one long seed, sent once, and then a patch every eight to ten seconds. Every patch says what is sent to the world, who is in frame, what the water is doing, and what the director model should hold. Generated from the cineosis-lab treatment, the scene book, the shot lab's measured cameras, his word timings, and the people table below.</p>
<div class="rules">
<div style="--c:#ff3d6e"><b>EVERY PERSON IS STATED</b>No human appears in any prompt without gender, race and outfit. The build checks every sent text for an untagged person: {problems} found.</div>
<div style="--c:#7fe0ff"><b>WORDS ARE THE WATER</b>Each poem's words become one medium. It rises when he speaks and stills when he is silent. How thick it runs comes from how fast he reads; how deep it stands comes from how much of the poem has been said.</div>
<div style="--c:#ffd23f"><b>THE EYE IS MEASURED</b>Lens and camera height are the medians of that poem's own analysed shots, not a guess.</div>
<div style="--c:#c58cff"><b>THE DIRECTOR HOLDS THE OPERATION</b>The cineosis operation, its signs and what must be seen stay with the director model; the world is sent only the action, the water and the people.</div>
</div>
<h3 style="--a:#ff3d6e">The people — draft, edit in characters.json</h3>
<p class="note">{e(CH['pair'])} {e(CH['skin'])}</p>
<div class="tw"><table><tr><th>Who</th><th>Race, gender, age</th><th>Outfit</th><th>Body and manner</th></tr>{ppl}</table></div>
<nav>{''.join(f"<a href='#p{p['num']}'>{p['num']} {e(p['title'])}</a>" for p in out)}</nav>
{''.join(secs)}
</main></body></html>"""
open('prompts.html', 'w').write(page)
print(sum(len(p['patches']) for p in out), 'patches;', os.path.getsize('prompts.html') // 1024, 'KB page')
