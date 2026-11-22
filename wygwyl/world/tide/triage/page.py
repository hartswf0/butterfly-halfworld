#!/usr/bin/env python3
"""Rebuild triage/index.html from triage.json as ONE self-contained file: pictures and sound are inside the page, so it
shows anywhere. Each ask is a card: the frame, the verdict, his words at that moment, what was sent, what was seen, and
four seconds of the take's sound.     python3 triage/page.py"""
import base64, html, io, json, os, subprocess
from PIL import Image
T = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R = json.load(open(T + '/triage/triage.json')); TIDE = json.load(open(T + '/tide.json'))['poems']; TMP = '/tmp/claude-0/triage'; os.makedirs(TMP, exist_ok=True)
SRC = {'03-film-': ('pcm', 'runs/03-film-20261121-232051/world.pcm'), '03-sheet': ('pcm', 'runs/03-sheet-20261121-233235/world.pcm'), 'street-020': ('v', 'litmus/out/street-020.mp4'), 'street-091': ('v', 'litmus/out/street-091.mp4'), 'street-098': ('v', 'litmus/out/street-098.mp4'),
       'poemwalk-greybox': ('v', 'litmus/out/poemwalk-greybox.mp4'), 'poemwalk-cel020': ('v', 'litmus/out/poemwalk-cel020.mp4'), 'probe-sheet': ('v', 'litmus/out/probe-sheet.mp4'), 'probe-plan': ('v', 'litmus/out/probe-plan.mp4'), 'probe-life': ('v', 'litmus/out/probe-life.mp4'), 'probe-spin': ('v', 'litmus/out/probe-spin.mp4'),
       'full-06': ('v', 'full/out/06-1122-0025/film.mp4'), 'full-12': ('v', 'full/out/12-1122-0036/film.mp4'), 'shots-12': ('v', 'full/out/12shots-1122-0105/film.mp4'), 'ride-grey': ('v', 'full/out/10ride-grey-1122-0119/film.mp4'), 'ride-cel': ('v', 'full/out/10ride-cel-1122-0129/film.mp4'), 'ride-greyfig': ('v', 'full/out/10ride-greyfig-1122-0135/film.mp4')}
POEM = {'03-film-': 3, '03-sheet': 3, 'poemwalk-greybox': 6, 'poemwalk-cel020': 6, 'full-06': 6, 'full-12': 12, 'shots-12': 12, 'ride-grey': 10, 'ride-cel': 10, 'ride-greyfig': 10}
VOICED = {'poemwalk-greybox', 'poemwalk-cel020', 'full-06', 'full-12', 'shots-12', 'ride-grey', 'ride-cel', 'ride-greyfig'}
def b64(path, mime): return f"data:{mime};base64," + base64.b64encode(open(path, 'rb').read()).decode()
def pic(path, w=420, q=62):
    im = Image.open(path).convert('RGB'); im.thumbnail((w, w)); b = io.BytesIO(); im.save(b, 'JPEG', quality=q); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
def sound(rid, t):
    kind, p = SRC[rid]; o = TMP + '/c.mp3'; a = max(0, t - 2.5)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + (['-f', 's16le', '-ar', '48000', '-ac', '2'] if kind == 'pcm' else []) + ['-ss', f'{a:.2f}', '-t', '4.5', '-i', f'{T}/{p}', '-vn', '-ac', '1', '-ar', '22050', '-b:a', '24k', o]
    subprocess.run(cmd); return b64(o, 'audio/mpeg') if os.path.exists(o) and os.path.getsize(o) > 500 else None
def words(rid, t):
    if rid not in POEM: return None
    if rid == 'ride-greyfig' and t > 13: t = 53.3 + (t - 13)
    L = TIDE[POEM[rid] - 1]['lines']; c = [l for l in L if l['t0'] - .5 <= t <= l['t1'] + 1.5] or [min(L, key=lambda l: abs((l['t0'] + l['t1']) / 2 - t))]; return c[-1]['text']
e = html.escape; n = dict(yes=0, partly=0, no=0); secs = []
for r in R:
    tally = {h: sum(a.get('happened') == h for a in r['asks']) for h in n}
    for h in n: n[h] += tally[h]
    cards = []
    for a in r['asks']:
        sx = r['sent'][a['ref']] if 'ref' in a else None; snd = sound(r['id'], a['t']); w = words(r['id'], a['t'])
        when = (f"sent at {sx['t']} s" + (f" for “{e(sx['word'])}”" if 'word' in sx else '') + (f" · {e(sx['by'])}" if sx['by'] != 'script' else '')) if sx else 'asked in the opening text'
        claim = a['claim'] if not (sx and len(sx['text']) > 500) else a['claim']
        cards.append(f"""<article class="c {a['happened']}"><div class="f"><img loading="lazy" src="{pic(T + '/triage/' + a['kf'])}" alt="Frame at {a['t']:.0f} seconds"><b>{a['happened']}</b><i>{a['t']:.0f} s</i>{f'<button data-a="{snd}" aria-label="Play four seconds of sound from this moment">▶ sound</button>' if snd else ''}</div>
<dl>{f'<dt>He says</dt><dd class="w">“{e(w)}”</dd>' if w else ''}<dt>Asked · {when}</dt><dd>{e(claim)}</dd><dt>Seen</dt><dd>{e(a['seen'])}</dd></dl></article>""")
    for pr in r.get('prior') or []:
        cards.append(f"""<article class="c wide"><div class="f"><img loading="lazy" src="{pic(T + '/triage/' + pr['strip'], 1100, 55)}" alt="Frames from this take"></div><dl>{''.join(f"<dt>{e(str(x['t']))} s · {e(str(x['claim']))}</dt><dd>{e(str(x['verdict']))}</dd>" for x in pr['rows'])}</dl></article>""")
    kr = [k for k in r['key_rows'] if k['motion'] is not None]; st = r.get('still'); keys = ''
    if kr:
        fw = [k for k in kr if k['key'] == 'key_w']; tu = [k for k in kr if k['key'] != 'key_w']
        bits = []
        if fw: bits.append(f"forward held {len(fw)}×" + (f": {sum(k['motion'] > st * 1.25 for k in fw)} moved more than the still stretches" if st else ' (no still stretch to compare with)'))
        if tu: bits.append(f"other keys {len(tu)}×, movement {', '.join(str(k['motion']) for k in tu)}" + (f" against {st} when still" if st else ''))
        keys = f"<p class='k'>Keys · {'; '.join(bits)}.</p>"
    seedimg = ''
    if r['seed_image'] and os.path.exists(T + '/' + r['seed_image']): seedimg = f"<img class='seed' loading='lazy' src='{pic(T + '/' + r['seed_image'], 300)}' alt='Starting picture'>"
    bar = ''.join(f"<s class='{h}' style='flex:{tally[h]}'></s>" for h in n if tally[h])
    secs.append(f"""<details class="run" data-y="{tally['yes']}" data-p="{tally['partly']}" data-n="{tally['no']}"><summary><h2>{e(r['title'])}</h2><span class="t">{(f"{tally['yes']} yes · {tally['partly']} partly · {tally['no']} no") if r['asks'] else 'frames and original results only; no video was kept'}{f" · {r['dur']:.0f} s" if r['dur'] else ''}</span><span class="bar">{bar}</span></summary>
{f"<p class='k'>{e(r['note'])}</p>" if r['note'] else ''}{keys}<details class="o"><summary>Opening text{' and picture' if seedimg else ''}</summary>{seedimg}<pre>{e(r['seed_text'])}</pre></details><div class="g">{''.join(cards)}</div></details>""")
tot = sum(n.values())
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Triage · WYGWYL</title>
<style>
:root{{--bg:#050d24;--ink:#eef3ff;--dim:#8fa1c7;--line:rgba(238,243,255,.13);--yes:#8fe39a;--partly:#ffd24a;--no:#ff6f8c}}
*{{box-sizing:border-box;margin:0;padding:0}}body{{background:var(--bg);color:var(--ink);font:16px/1.5 "Iowan Old Style",Palatino,Georgia,serif;-webkit-text-size-adjust:100%}}
main{{max-width:1180px;margin:0 auto;padding:28px 16px 90px}}
h1{{font-size:clamp(30px,7vw,52px);font-weight:400;line-height:1.05;letter-spacing:-.01em}}
.lede{{color:var(--dim);max-width:640px;margin-top:10px}}
.sum{{display:flex;gap:26px;margin:26px 0 8px;font-family:Helvetica,Arial,sans-serif}}.sum b{{display:block;font:300 44px/1 Helvetica,Arial,sans-serif}}.sum span{{font-size:12px;color:var(--dim);letter-spacing:.08em;text-transform:uppercase}}
.bar{{display:flex;height:4px;gap:2px;border-radius:2px;overflow:hidden}}.bar s{{display:block}}s.yes,.c.yes b{{background:var(--yes)}}s.partly,.c.partly b{{background:var(--partly)}}s.no,.c.no b{{background:var(--no)}}
nav{{position:sticky;top:0;z-index:3;background:rgba(5,13,36,.94);backdrop-filter:blur(8px);display:flex;gap:8px;padding:12px 0;margin-top:14px;border-bottom:1px solid var(--line)}}
nav button{{font:600 13px Helvetica,Arial,sans-serif;color:var(--ink);background:none;border:1px solid var(--line);border-radius:20px;padding:8px 14px;min-height:40px;cursor:pointer}}nav button[aria-pressed=true]{{background:var(--ink);color:var(--bg);border-color:var(--ink)}}
.run{{border-bottom:1px solid var(--line)}}.run>summary{{list-style:none;cursor:pointer;padding:20px 0 16px;display:grid;gap:6px}}.run>summary::-webkit-details-marker{{display:none}}
h2{{font-size:22px;font-weight:400;line-height:1.2}}h2::after{{content:" +";color:var(--dim)}}.run[open] h2::after{{content:" –"}}
.t,.k,dt,.f i,.o summary{{font-family:Helvetica,Arial,sans-serif}}.t{{font-size:12.5px;color:var(--dim)}}.k{{font-size:13px;color:var(--dim);max-width:760px;margin-bottom:8px}}
.o{{margin:6px 0 16px}}.o summary{{font-size:13px;color:var(--dim);cursor:pointer;min-height:36px;display:flex;align-items:center}}.seed{{display:block;width:220px;margin:8px 0;border-radius:4px}}
pre{{white-space:pre-wrap;font:12.5px/1.55 ui-monospace,Menlo,monospace;color:#cfdcff;border-left:2px solid var(--line);padding-left:12px;max-width:820px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px 18px;padding-bottom:28px}}.c.wide{{grid-column:1/-1}}
.f{{position:relative}}.f img{{display:block;width:100%;border-radius:4px;background:#000}}
.f b{{position:absolute;left:8px;top:8px;font:800 11px Helvetica,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#06102a;padding:3px 9px;border-radius:12px}}
.f i{{position:absolute;right:8px;top:8px;font-style:normal;font-size:11px;background:rgba(0,0,0,.6);padding:2px 7px;border-radius:10px}}
.f button{{position:absolute;right:8px;bottom:8px;font:600 12px Helvetica,Arial,sans-serif;color:var(--ink);background:rgba(0,0,0,.66);border:1px solid rgba(255,255,255,.35);border-radius:16px;padding:6px 12px;min-height:34px;cursor:pointer}}.f button.on{{background:var(--ink);color:var(--bg)}}
dl{{margin-top:10px}}dt{{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:9px}}dd{{font-size:14.5px}}dd.w{{font-style:italic;font-size:16px}}
.hide{{display:none}}
</style></head><body><main>
<h1>Did it happen?</h1>
<p class="lede">Every thing we asked the world model for, across {len(R)} runs. Each card is one ask: the frame from when it should be visible, an independent verdict from that frame alone, his words at that moment, and four seconds of the take's sound.</p>
<div class="sum"><div><b style="color:var(--yes)">{n['yes']}</b><span>yes</span></div><div><b style="color:var(--partly)">{n['partly']}</b><span>partly</span></div><div><b style="color:var(--no)">{n['no']}</b><span>no</span></div><div><b>{tot}</b><span>asks</span></div></div>
<div class="bar"><s class="yes" style="flex:{n['yes']}"></s><s class="partly" style="flex:{n['partly']}"></s><s class="no" style="flex:{n['no']}"></s></div>
<nav aria-label="Show"><button data-f="all" aria-pressed="true">All</button><button data-f="yes" aria-pressed="false">Yes</button><button data-f="partly" aria-pressed="false">Partly</button><button data-f="no" aria-pressed="false">No</button></nav>
{''.join(secs)}
</main><script>
const au=new Audio();let cur=null;
document.addEventListener('click',e=>{{const b=e.target.closest('button[data-a]');if(b){{if(cur===b&&!au.paused){{au.pause();return}}if(cur)cur.classList.remove('on');cur=b;au.src=b.dataset.a;au.play();b.classList.add('on');return}}
 const f=e.target.closest('nav button');if(!f)return;document.querySelectorAll('nav button').forEach(x=>x.setAttribute('aria-pressed',x===f));const k=f.dataset.f;
 document.querySelectorAll('.c').forEach(c=>c.classList.toggle('hide',k!=='all'&&!c.classList.contains(k)));
 document.querySelectorAll('.run').forEach(r=>{{const any=r.querySelector('.c:not(.hide)');r.classList.toggle('hide',!any);if(k!=='all'&&any)r.open=true}})}});
au.onended=au.onpause=()=>cur&&cur.classList.remove('on');
</script></body></html>"""
open(T + '/triage/index.html', 'w').write(page); print(len(R), 'runs', tot, 'asks', os.path.getsize(T + '/triage/index.html') // 1024, 'KB', page.count('data:audio'), 'sound clips', page.count('data:image'), 'pictures')
