#!/usr/bin/env python3
"""Bake xsheet.json and xsheet.html: an exposure sheet per poem for driving a real-time world model
from the reading.  Rules are at the top so they can be argued with.  Run from this folder."""
import json, os, html, collections
GAP = 4.0        # seconds between cues, so one change resolves before the next
MAXW = 12        # words per mid-session cue
SESSION = 90.0   # seconds before a new session is seeded (the model is steadiest under this)
LEAD = 1.0       # send a cue this long before the line if there is no pause to use
RATE = 0.10      # dollars per second, the figure quoted for the preview; check before relying on it
T = json.load(open('tide.json'))
WS = '../../../../wygwyl-world-arch/shots/wordscan/index.json'
seen = {s['n']: s['seen'] for s in json.load(open(WS))['shots']} if os.path.exists(WS) else {}
FLAT = {'SKY', 'FLOOR', 'WALL', 'CEILING', 'ROAD', 'EARTH', 'THING', 'SIDEWALK'}
def cue(sc):
    a = sc['name'].replace(' / ', ', '); b = f"{a} — {sc['here']}"
    return b if len(b.split()) <= MAXW else ' '.join(a.split()[:MAXW])
def nouns(sc):
    c = collections.Counter(w for v in sc['views'] for w in seen.get(v, []) if w not in FLAT)
    return [w for w, _ in c.most_common(5)]
out = []
for p in T['poems']:
    L, S, D = p['lines'], p['scenes'], T['districts']
    rows, last, first_of = [], -99, {}
    for i, l in enumerate(L):
        if l['hit'] and l['scene'] not in first_of: first_of[l['scene']] = i
    order = sorted(first_of.items(), key=lambda kv: kv[1])
    s0 = S[order[0][0]] if order else S[0]; d0 = D[s0['d']]
    rows.append(dict(t=0, kind='SEED', text=f"{s0['what']} {s0['here']}. {d0['weather']}. {d0['light']}.", line='', check=nouns(s0), view=(s0['views'] or [None])[0]))
    for si, li in order[1:]:
        l = L[li]; prev_end = L[li - 1]['t1'] if li else 0; pause = l['t0'] - prev_end
        want = prev_end + .1 if pause >= .6 else l['t0'] - LEAD          # anticipate: use the breath before the line
        t = max(want, last + GAP); late = t - l['t0']
        rows.append(dict(t=round(t, 1), kind='KEY', text=cue(S[si]), line=l['text'], check=nouns(S[si]), late=round(late, 1) if late > .5 else 0, pause=round(pause, 1)))
        last = t
    # a breakdown where one place is held a long time: change the light, not the geometry
    keys = [r['t'] for r in rows] + [p['dur']]
    for a, b, r in zip(keys, keys[1:], list(rows)):
        if b - a > 22:
            sc = S[order[[x['t'] for x in rows].index(a)][0]] if order else s0
            rows.append(dict(t=round((a + b) / 2, 1), kind='BREAKDOWN', text=' '.join(('light and air: ' + D[sc['d']]['mood'].split(';')[0].split('·')[0]).split()[:MAXW]), line='', check=[]))
    # holds: the silences of a second or more where nothing is sent and the walker stops
    for a, b in zip(L, L[1:]):
        if b['t0'] - a['t1'] >= 1.0 and not any(abs(r['t'] - a['t1']) < 1.2 for r in rows):
            rows.append(dict(t=round(a['t1'], 1), kind='HOLD', text=f"{b['t0'] - a['t1']:.1f} s of silence. Send nothing. Stop walking.", line='', check=[]))
    rows.sort(key=lambda r: r['t'])
    # sessions: reseed on the key nearest the middle when the reading runs past the steady window
    sess = [0]
    if p['dur'] > SESSION:
        ks = [r for r in rows if r['kind'] == 'KEY']
        n = int(p['dur'] // SESSION) + 1
        for j in range(1, n):
            k = min(ks, key=lambda r: abs(r['t'] - p['dur'] * j / n)); k['kind'] = 'RESEED'; sess.append(k['t'])
    cues = [r for r in rows if r['kind'] in ('KEY', 'RESEED', 'BREAKDOWN')]
    out.append(dict(num=p['num'], title=p['title'], dur=p['dur'], lines=len(L), rows=rows, sessions=len(sess),
                    cues=len(cues), late=sum(1 for r in cues if r.get('late')), unsent=sum(1 for l in L if not l['hit']), cost=round(p['dur'] * RATE, 2)))
    print(p['num'], p['title'][:22].ljust(22), f"{p['dur']:5.0f}s", 'sessions', len(sess), 'cues', len(cues), 'late', out[-1]['late'], 'lines not sent', out[-1]['unsent'], 'of', len(L))
json.dump(dict(rules=dict(gap=GAP, max_words=MAXW, session=SESSION, lead=LEAD, rate=RATE), poems=out), open('xsheet.json', 'w'), ensure_ascii=False, separators=(',', ':'))
e = html.escape; f = lambda s: f"{int(s // 60)}:{s % 60:04.1f}"
C = dict(SEED='#ffd23f', RESEED='#ffd23f', KEY='#7fe0ff', BREAKDOWN='#c58cff', HOLD='#7d8cb5')
body = []
for p in out:
    tr = ''.join(f"<tr class='{r['kind'].lower()}'><td>{f(r['t'])}</td><td><b style='color:{C[r['kind']]}'>{r['kind']}</b></td><td>{e(r['text'])}"
                 + (f"<i>as he says: “{e(r['line'])}”</i>" if r['line'] else '') + (f"<u>arrives {r['late']} s after the line starts</u>" if r.get('late') else '')
                 + f"</td><td>{e(' · '.join(r['check']))}</td></tr>" for r in p['rows'])
    body.append(f"<section id='p{p['num']}'><h2>{p['num']} · {e(p['title'])}</h2><p class='m'>{p['dur']:.0f} s · {p['sessions']} session{'s' if p['sessions'] > 1 else ''} · {p['cues']} cues · "
                f"{p['unsent']} of {p['lines']} lines carried by his voice alone · about ${p['cost']:.0f} a take</p><div class='tw'><table><tr><th>Time</th><th>Kind</th><th>What is sent</th><th>Director checks for</th></tr>{tr}</table></div></section>")
tot = sum(p['cost'] for p in out)
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Exposure Sheet · WYGWYL</title><link rel="icon" href="../../dot.svg">
<style>
:root{{--ink:#eaf2ff;--dim:#93a7cc;--bg:#061433;--panel:#0b1e47;--edge:rgba(234,242,255,.16)}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{background:var(--bg);color:var(--ink);font:15px/1.5 "Iowan Old Style",Palatino,Georgia,serif}}
main{{max-width:1100px;margin:0 auto;padding:18px 16px 70px}}a{{color:inherit}}
.k,th,td:nth-child(1),td:nth-child(2),nav a{{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}}
.k{{font-weight:700;font-size:11px;letter-spacing:.2em;color:#ffd23f;text-transform:uppercase}}
h1{{font-size:clamp(26px,5vw,40px);font-weight:400;line-height:1.1;margin:6px 0}}h2{{font-size:22px;font-weight:400;margin:34px 0 2px}}
p{{max-width:820px}}.note,.m{{color:var(--dim)}}.m{{font:12.5px "Helvetica Neue",Arial,sans-serif;margin-bottom:8px}}
.rules{{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px;margin:16px 0}}
.rules div{{background:var(--panel);border:1px solid var(--edge);border-top:3px solid var(--c);padding:10px 12px;font-size:13.5px}}
.rules b{{display:block;font:800 10.5px "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;color:var(--c);margin-bottom:3px}}
nav{{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0}}nav a{{border:1px solid var(--edge);border-radius:14px;padding:4px 10px;font-size:12px;text-decoration:none}}
.tw{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;min-width:640px;font-size:14px}}
th{{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);text-align:left}}th,td{{padding:7px 12px 7px 0;border-bottom:1px solid var(--edge);vertical-align:top}}
td:nth-child(1){{font-size:12px;color:var(--dim);white-space:nowrap}}td:nth-child(2){{font-size:10.5px;letter-spacing:.1em;white-space:nowrap}}td:nth-child(4){{font:11.5px "Helvetica Neue",Arial,sans-serif;color:var(--dim);min-width:150px}}
td i{{display:block;color:var(--dim);font-size:13px}}td u{{display:block;text-decoration:none;color:#ff8fa8;font:11.5px "Helvetica Neue",Arial,sans-serif}}tr.hold td{{color:var(--dim);font-size:13px}}
</style></head><body><main>
<div class="k"><a href="../survey/index.html">The Survey</a> · <a href="index.html">The Tideline</a> · The Exposure Sheet</div>
<h1>The Exposure Sheet — when to say what to the world</h1>
<p class="note">An animator does not draw every frame; they draw keys, mark the holds, and let the in-betweens follow. The same sheet works for a world model. This page is generated from his readings and the scene book: one sheet per poem, saying what is sent, when, and what a director should look for afterwards.</p>
<div class="rules">
<div style="--c:#ffd23f"><b>SEED = THE PASSAGE</b>One picture and one paragraph start a session. Sessions stay under {SESSION:.0f} seconds; a longer reading reseeds at the scene change nearest the middle, from its last frame.</div>
<div style="--c:#7fe0ff"><b>KEY = THE SCENE</b>Only a change of place is sent as an event, in {MAXW} words or fewer, at least {GAP:.0f} seconds apart. It goes in the breath before the line, so the place arrives as he names it.</div>
<div style="--c:#c58cff"><b>BREAKDOWN = THE LIGHT</b>Where one place is held more than 22 seconds, one cue changes light and air only, so nothing solid moves.</div>
<div style="--c:#7d8cb5"><b>HOLD = THE SILENCE</b>In his pauses nothing is sent and the walker stops. Lines that name no place are never sent; his voice carries them.</div>
<div style="--c:#9fe08a"><b>CHECK = THE DIRECTOR</b>After each key a director model looks at a frame for the things the shot lab found in that scene's pictures, and sends one short correction if they are missing.</div>
</div>
<p class="note">All fourteen once through is {sum(p['dur'] for p in out)/60:.0f} minutes of session time, about ${tot:.0f} at the preview rate you quoted. No session has been run; these sheets are a plan.</p>
<nav>{''.join(f"<a href='#p{p['num']}'>{p['num']} {e(p['title'])}</a>" for p in out)}</nav>
{''.join(body)}
</main></body></html>"""
open('xsheet.html', 'w').write(page)
