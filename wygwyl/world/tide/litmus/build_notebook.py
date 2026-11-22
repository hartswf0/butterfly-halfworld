#!/usr/bin/env python3
"""Build notebook.html: every experiment with the question, what was expected, the exact text and keys sent, what
happened, a verdict and the lesson. Past experiments are written here; probes are read from log.json."""
import json, os, html, sys, re
H = os.path.dirname(os.path.abspath(__file__)); sys.argv = ['x']; os.environ.setdefault('GEMINI_API_KEY', 'x')
T = json.load(open(H + '/tests.json'))['tests']; C3 = json.load(open(H + '/../cues/03.json'))
src = open(H + '/poemwalk.py').read(); ns = {}; exec(src[src.index('MAN = '):src.index('def stage')], {}, ns)
st = open(H + '/street.py').read(); MANS = re.search(r'MAN = \((.*?)\)\ndef', st, re.S).group(1).replace('"', '').replace('\n', ' ')
cues = lambda: '\n'.join(f"[{a['t']}s, for “{a['word']}” at {a['land']}s] {a['say']}\n      why: {a['why']}" for a in json.load(open(H + '/out/poemwalk-greybox.cues.json')))
PAST = [
 dict(id='03-take1', title='Poem 03, first full take', verdict='failed', question='Can generated cues from the treatment drive a whole poem?', expected='Each 8–10 s patch cue would change the scene; a director model would correct drift.',
      sent='SEED: a 329-word generated seed (style, place, people, water, sound, mood) + chapel-on-a-shore image.\nCUES, e.g.: “Empty chapel: pews, choir, baptism pool. Rain pools, steady. In frame: the Choir (Black women and men, deep blue choir robes with white stoles).”', keys='W held through every patch',
      result='Went through the chapel door at 14 s and showed a correctly dressed choir. Then walked into the altar wall; from 38 s it stared at a window. Later cues did nothing.',
      lesson='Three separate mistakes: constant walking ends at a wall; the director answered 10–15 s late and one stale correction removed the choir; and the cue contradicted the poem, which says the choir stands are EMPTY. I took the treatment on trust instead of reading the lines.', media=[]),
 dict(id='03-take2', title='Poem 03 from the lectern', verdict='failed', question='Can we start on him at the lectern and walk into the world as he names it?', expected='Wall parts on “temple”; we pass him; each named object appears on its word.',
      sent='SEED: ' + C3['seed'] + '\nCUES:\n' + '\n'.join(f"[for “{c['word']}”] {c['send']}\n      why: {c['intent']}" for c in C3['cues']), keys='W for 40% of each spoken line',
      result='Wall parted about 1 s after “temple”; pool appeared on “pools”; he stayed himself. But the camera walked into his face and he filled the frame from 26 s. Goods and lightning arrived 5–8 s late; bread, blankets, footprints and tambourine were never seen.',
      lesson='A person in the middle of the seed frame is an obstacle, not a doorway. Eleven cues in 60 s is too many: later ones queue up. I also shipped the first video at the wrong speed because I assumed 24 frames a second; it was 17.', media=[]),
 dict(id='door', title='Litmus: walk in through a door', verdict='failed', question=T['door']['claim'], expected='Walking 14 s reaches and enters the doorway.', sent='SEED: ' + T['door']['seed'] + '\nCUE at 6 s: ' + T['door']['script'][1]['say'], keys='W from 0.5 s to 14 s',
      result='1 of 2 takes ended inside, and that one jumped rather than arrived. The doorway barely grew in 14 s of walking.', lesson='Walking covers little ground. A threshold must already be close in the seed frame. Two takes is too few to call a rate.', media=[]),
 dict(id='walker', title='Litmus: follow the Poet in', verdict='partly', question=T['walker']['claim'], expected='He appears from behind and enters ahead of us.', sent='SEED: ' + T['walker']['seed'] + '\nCUE at 6 s: ' + T['walker']['script'][1]['say'], keys='W from 0.5 s to 14 s',
      result='He appeared from behind in both takes and stayed the same figure for 16 s. Neither take got inside.', lesson='Third person is chosen by the seed text and is repeatable. This was the first thing that worked twice.', media=[]),
 dict(id='controls', title='Do the keys do anything', verdict='worked', question='With no text at all, do W, A and arrow-left change the view differently?', expected='If the keys are ignored, four takes look the same.', sent='SEED: ' + T['door']['seed'] + '\nNo cues.', keys='one key held 1–7 s per take: none / W / A / arrow-left',
      result='None: still. W: forward. A: slid left to new buildings. Arrow-left: turned until the temple left frame. 240 video tokens per frame on every take.', lesson='Movement is real and separable. One take per key shows it works, not how reliably.', media=['out/controls.jpg']),
 dict(id='street', title='The Poet walks down three streets', verdict='partly', question='Does third-person walking hold in different zones, and can the camera circle him?', expected='He walks 10 s; then a turn orbits him.', sent='SEED (place text is each shot’s own original prompt) + ' + MANS, keys='W 1–11 s, arrow-left 12–19.5 s',
      result='He walked in all three; climbed the escalator in the arcade. The turn panned away from him instead of circling; his clothes changed in the market take.', lesson='Arrow keys turn the camera on the spot. I called it a spin before checking what the key does. Nothing in the world changed, so this tested walking only.', media=['out/street-020.mp4', 'out/street-091.mp4', 'out/street-098.mp4']),
 dict(id='poemwalk', title='Word to world, poem 06 (grey-box and cel)', verdict='failed', question='As he reads, does the world change around him through blue water, on his words?', expected='Seven changes, each landing on its word; grey blocks become a city.',
      sent='SEED (grey-box): ' + ns['SEEDS']['greybox'] + '\nSEED (cel): ' + ns['SEEDS']['cel020'] + '\nCUES:\n' + cues(), keys='W for the first 60% of each line',
      result='Grey-box: blue lettered water at his feet on “hymns”, yellow bricks, comets, a lit city with robed people by 46 s. Cel: a blue fountain, a second man appeared, camera stuck at the gates. You judged both failures.',
      lesson='I reported the grey-box take as a success because the cues were visible in sampled frames. That is the wrong test. What was missing: the changes are decoration added around a man walking on a flat plane; nothing happens TO him or the ground he is on; the city arrives as a backdrop across the water, not as something that rises; the gates and towers never did what the lines say; and it reads as slow and literal, not surreal or fluid. I measured “did the noun appear” when the question is “does the world transform”.', media=['out/poemwalk-greybox.mp4', 'out/poemwalk-cel020.mp4']),
]
NOTES = {'probe-sheet': ('expected', 'Stayed a grid of four panels for all 12 s — but each panel moved forward on its own, like four cameras running at once.', 'A sheet is not merged into one territory. It could be used on purpose: four simultaneous views of a zone for the price of one session, cut apart afterwards.'),
         'probe-plan': ('surprise', 'I was wrong. It dropped straight to street level on a harbour quay with a walking figure. But it is a generic old-European harbour: nothing of our map or our city survived.', 'The image set the idea “harbour town” and the text did the rest. A map is not read as geography.'),
         'probe-life': ('partly', 'The street had people from the first frame and a crowd by the end, but far short of “wildly alive”, and the man in black was not the main figure.', 'Demanding exaggeration in words gives a mild version. The seed IMAGE sets how alive the world is; text nudges it.'),
         'probe-spin': ('expected', 'It turned, invented new streets, changed from flat illustration to photographic, then stopped turning about halfway. It never came back to the start.', 'There is no stable place behind the camera. A full circle is not a test this model can pass, so do not build shots that need one.')}
log = json.load(open(H + '/log.json')); e = html.escape
V = dict(worked='#9fe08a', partly='#ffd23f', failed='#ff6b8b', expected='#7fe0ff', surprise='#c58cff')
def media(ms): return ''.join(f"<video controls preload='none' src='{m}'></video>" if m.endswith('.mp4') else f"<img loading='lazy' src='{m}' alt='frames'>" for m in ms)
def card(i, title, verdict, q, exp, sent, keys, res, lesson, ms):
    return f"""<section><div class='n'>{i:02d}</div><h2>{e(title)} <span style='color:{V[verdict]}'>· {verdict}</span></h2>
<dl><dt>Question</dt><dd>{e(q)}</dd><dt>Expected</dt><dd>{e(exp)}</dd><dt>Sent, word for word</dt><dd><pre>{e(sent)}</pre></dd><dt>Keys</dt><dd>{e(keys)}</dd>
<dt>What happened</dt><dd>{e(res)}</dd><dt>Lesson</dt><dd class='l'>{e(lesson)}</dd></dl>{media(ms)}</section>"""
cards = [card(i + 1, r['title'], r['verdict'], r['question'], r['expected'], r['sent'], r['keys'], r['result'], r['lesson'], r['media']) for i, r in enumerate(PAST)]
for r in log:
    v, res, les = NOTES.get(r['id'], ('partly', '', ''))
    j = '; '.join(f"{x['t']}s " + ', '.join(f"{k}={'yes' if x[k] else 'no'}" for k in r['checks'] if k in x) for x in r['judged'])
    cards.append(card(len(cards) + 1, 'Probe: ' + r['id'].split('-')[1], 'worked' if v == 'surprise' else 'failed' if v == 'expected' and r['id'] != 'probe-sheet' else 'partly', r['question'], r['hypothesis'],
                      'SEED IMAGE: ' + r['seed_image'] + '\nSEED TEXT: ' + r['text_sent'], ', '.join(r['keys']), res + f"  [judge: {j}]", les, [r['video'], r['strip']]))
page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lab Notebook · WYGWYL</title>
<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{background:#061433;color:#eaf2ff;font:15px/1.55 "Iowan Old Style",Palatino,Georgia,serif}}main{{max-width:980px;margin:0 auto;padding:18px 16px 70px}}
h1{{font-size:clamp(26px,5vw,40px);font-weight:400;margin:6px 0}}h2{{font-size:21px;font-weight:400;margin-bottom:8px}}h3{{font:800 11px Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#ffd23f;margin:26px 0 8px}}
p,li{{max-width:820px}}.note{{color:#93a7cc}}li{{margin:6px 0 6px 20px}}section{{border-top:1px solid rgba(234,242,255,.18);padding:22px 0;position:relative}}.n{{font:800 11px Helvetica,Arial,sans-serif;color:#93a7cc;letter-spacing:.14em}}
dt{{font:800 10px Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#93a7cc;margin-top:10px}}dd.l{{color:#ffe9a8}}pre{{white-space:pre-wrap;background:#0b1e47;border:1px solid rgba(234,242,255,.16);padding:10px 12px;font:12.5px/1.5 ui-monospace,Menlo,monospace;color:#d8e6ff}}
video,img{{display:block;width:100%;margin-top:10px;border:1px solid rgba(234,242,255,.16);background:#000}}</style></head><body><main>
<div class="n">WYGWYL · THE TIDELINE</div><h1>Lab Notebook — what we tried with the world model, and what it taught us</h1>
<p class="note">Every experiment so far, in order: the question, what I expected, exactly what was sent, what came back, and what I got wrong. {len(cards)} entries, about 45 sessions' worth of footage, roughly $50.</p>
<h3>What I now believe</h3><ul>
<li><b>The seed image decides almost everything</b>: place, style, how alive it is, where the camera can go. Text after the start only adds things near the camera.</li>
<li><b>Third person works and repeats.</b> “A man ahead with his back to us, the camera follows” held in every take that asked for it.</li>
<li><b>Keys are real but small.</b> Forward, sideways and turn each do something different; none covers much ground; there is nothing stable behind the camera.</li>
<li><b>A cue takes about 3 seconds to show early in a take and longer later.</b> More than one cue every 7–8 seconds piles up.</li>
<li><b>I have been testing the wrong thing.</b> “The noun appeared” is not “the world transformed”. The next tests need a before and an after that differ in kind, not in props.</li></ul>
<h3>What I got wrong along the way</h3><ul>
<li>Trusted the treatment over the poem (a choir where the line says empty).</li><li>Sent a video at the wrong speed because I assumed a frame rate.</li>
<li>Called a camera pan a spin without checking the key.</li><li>Called the grey-box take a success from sampled frames; you watched it and it was not.</li>
<li>Kept walking forward on flat ground in nearly every test, so nothing could happen to him.</li></ul>
<h3>Experiments worth running next, each with a pass condition written first</h3><ul>
<li><b>Transform, don’t add.</b> One cue only, 20 s: “the street he is walking on turns to water and he sinks to his waist.” Pass: his body is visibly lower in frame and the ground is water. Tests whether anything can happen to him.</li>
<li><b>Before/after seeds.</b> Two sessions on the same frame, one seeded dry and grey, one seeded flooded and blue, cross-dissolved on his word in the edit. Tests whether the transition belongs in the cut, not in the model.</li>
<li><b>Four cameras.</b> A sheet seed on purpose: four views of one zone running together under one line of the poem.</li>
<li><b>Life from the image.</b> Seed with a frame that is already crowded and moving, ask for nothing. Compare with the “wildly alive” text probe.</li>
<li><b>Exaggeration ladder.</b> The same 12 s take three times with one cue at three strengths: plain, strong, absurd. Find how hard the words must push.</li></ul>
{''.join(cards)}</main></body></html>"""
open(H + '/notebook.html', 'w').write(page); print(len(cards), 'entries', len(page) // 1024, 'KB')
