#!/usr/bin/env python3
"""
THE SEMANTIC LAYER — what the sound IS, in words, and what to call it.

audio_scan.py measures the physics. This says what the physics is OF. It uses
LAION-CLAP, which maps audio and natural language into one vector space the way
CLIP does for images: embed a phrase, embed a sound, and the cosine between them
is how much that phrase explains that sound.

WHY IT IS BUILT THIS WAY

The obvious implementation is the HuggingFace zero-shot pipeline, one call per
file. That re-embeds the same candidate phrases for every one of a thousand
files. Here the taxonomy is embedded ONCE and only the audio is embedded per
file, which is the difference between minutes and hours.

FOUR AXES, NOT ONE

A flat classifier cannot produce a compound name. The EarSketch constant is
[CREATOR]_[GENRE]_[TYPE]_[ID], so the taxonomy is scored on separate axes and the
name is assembled from the winners — the hierarchical approach, not one bucket
with a hundred labels in it.

HONESTY ABOUT CONFIDENCE

Zero-shot scores are relative, not absolute: something always wins. Every label
is stored with its margin over the runner-up, and anything under the margin floor
is written as `?` rather than guessed. A library labelled confidently and wrongly
is worse than one that says where it is unsure.

    python3 cut/pf/audio_label.py                  every imaged file
    python3 cut/pf/audio_label.py --limit 24       a taste first
"""
import os, io, sys, json, warnings
warnings.filterwarnings('ignore')
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
       os.path.dirname(os.path.abspath(__file__)))))
OUT  = os.path.join(ROOT, 'AUDIO')
MODEL = 'laion/clap-htsat-unfused'
SR = 48000
GAP = 0.010             # minimum COSINE gap between first and second place

# WHY NOT SOFTMAX. The first version scored with softmax(cos * 100), which is
# what most zero-shot examples do, and every margin came back at 1.000 — a
# temperature that high saturates, so the reported confidence was an artefact of
# the scaling rather than a property of the match. A confidence measure that is
# always 1.0 is not a confidence measure. The decision is made on the raw cosine
# gap between first and second place, which cannot be inflated; the softmax
# probability is kept alongside it for reference only.

# TWO TAXONOMIES, CHOSEN BY THE MATERIAL.
#
# The first version applied one sample vocabulary to everything, and on finished
# tracks it answered PLUCK 11 times out of 24 and POP 13 out of 24. That is not
# the model failing; it is being asked the wrong question. "Is this a snare hit
# or a pad chord" has no good answer for a three-minute song, so it returns
# whatever is least wrong, every time.
#
# A short file is a SAMPLE and the useful question is what role it would play in
# a beat. A long file is a TRACK and the useful question is what leads it, what
# it feels like, and how it was made. Duration decides, and which vocabulary was
# used is recorded on the label so nobody has to guess later.

SAMPLE_AXES = {
 'type': [
   ('MAINBEAT',  'a full drum beat loop'),
   ('KICK',      'a kick drum hit, deep and short'),
   ('SNARE',     'a snare drum hit'),
   ('HIHAT',     'a hi-hat cymbal ticking'),
   ('PERC',      'hand percussion, congas and shakers'),
   ('BASS',      'a deep bass line'),
   ('SUB',       'a sub bass sine tone, very low'),
   ('PAD',       'a sustained synth pad chord'),
   ('LEAD',      'a synth lead melody'),
   ('PLUCK',     'a plucked keyboard or piano phrase'),
   ('GUITAR',    'an electric or acoustic guitar riff'),
   ('STRINGS',   'orchestral strings'),
   ('BRASS',     'brass horns'),
   ('VOX',       'a human voice singing'),
   ('SPOKEN',    'a person speaking words'),
   ('RISER',     'a rising sweep building tension'),
   ('TEXTURE',   'an ambient drone texture with no rhythm'),
   ('FX',        'a sound effect, not musical'),
   ('FIELD',     'a field recording of a real place'),
   ('SILENCE',   'near silence, room tone'),
 ],
 'genre': [
   ('HIPHOP','a hip hop beat'), ('TRAP','a trap beat with fast hi-hats'),
   ('HOUSE','a four on the floor house track'), ('EDM','an electronic dance track'),
   ('DUBSTEP','a dubstep track with wobble bass'), ('FUNK','a funk groove'),
   ('RNB','a smooth r and b track'), ('SOUL','a soul record'),
   ('ROCK','a rock band'), ('JAZZ','a jazz ensemble'),
   ('AMBIENT','ambient atmospheric music'), ('ORCH','orchestral classical music'),
   ('POP','a pop song'), ('NOISE','harsh noise'),
 ],
 'character': [
   ('BRIGHT','a bright airy high frequency sound'),
   ('DARK','a dark muffled low frequency sound'),
   ('CLEAN','a clean undistorted recording'),
   ('DIRTY','a distorted saturated lo-fi recording'),
   ('WET','a sound drenched in reverb, distant and roomy'),
   ('DRY','a close dry sound with no reverb'),
   ('ACOUSTIC','an acoustic instrument played in a room'),
   ('SYNTH','a synthesizer, clearly electronic'),
 ],
 'motion': [
   ('LOOP','a repeating musical loop several bars long'),
   ('ONESHOT','a single isolated hit, one event only'),
   ('PHRASE','a musical phrase that develops and does not repeat'),
   ('BED','a continuous background bed with no events'),
 ],
}

TRACK_AXES = {
 'type': [   # what LEADS the arrangement, not what one hit is
   ('VOCAL',    'a song with a lead singer carrying the melody'),
   ('RAP',      'a track with rapped vocals over a beat'),
   ('PIANO',    'a track led by piano'),
   ('GUITAR',   'a track led by guitar'),
   ('SYNTH',    'a track led by synthesizers'),
   ('STRINGS',  'a track led by orchestral strings'),
   ('HORNS',    'a track led by brass and horns'),
   ('DRUMS',    'a track driven mainly by drums and percussion'),
   ('BASS',     'a track dominated by heavy bass'),
   ('DRONE',    'a sustained drone with no clear melody or beat'),
   ('FIELD',    'a field recording of an environment, not composed music'),
   ('SPOKEN',   'spoken word over music'),
 ],
 'genre': [
   ('HIPHOP','a hip hop record'), ('SOUL','a soul record'),
   ('RNB','an r and b record'), ('FUNK','a funk record'),
   ('JAZZ','a jazz recording'), ('GOSPEL','gospel music with choir'),
   ('AFRO','afrobeat and west african music'), ('ELECTRONIC','electronic dance music'),
   ('AMBIENT','ambient music'), ('ORCH','orchestral film score'),
   ('ROCK','a rock record'), ('EXPERIMENTAL','experimental sound art'),
 ],
 'mood': [
   ('MOURNFUL','sad, mournful and grieving music'),
   ('TENDER','tender, warm and intimate music'),
   ('TRIUMPHANT','triumphant, uplifting, victorious music'),
   ('MENACING','ominous, tense and menacing music'),
   ('ECSTATIC','ecstatic, euphoric, celebratory music'),
   ('CALM','calm, still and meditative music'),
   ('RESTLESS','restless, agitated, urgent music'),
   ('DESOLATE','empty, desolate and lonely music'),
 ],
 'production': [
   ('LOFI','a lo-fi recording with tape hiss and noise'),
   ('POLISHED','a clean, polished modern studio production'),
   ('CAVERNOUS','an enormous reverberant space, cathedral sized'),
   ('CLOSE','a close, dry, intimate recording'),
   ('DISTORTED','heavily distorted and saturated'),
   ('SPARSE','a sparse arrangement with few elements'),
   ('DENSE','a dense, layered, maximal arrangement'),
 ],
}

TRACK_MIN_S = 20.0   # longer than this and the sample questions stop making sense

def axes_for(seconds):
    return (TRACK_AXES, 'track') if seconds >= TRACK_MIN_S else (SAMPLE_AXES, 'sample')

def main():
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit')+1])
    import torch, librosa
    from transformers import ClapModel, ClapProcessor

    # SEPARATE FILES, ON PURPOSE. Both passes used to write index.json, so
    # running them at the same time meant the scanner's periodic dump clobbered
    # every label the labeller had just written. Physics owns index.json,
    # semantics owns labels.json, the viewer joins them on path. Neither pass can
    # now destroy the other's work, and either can be re-run alone.
    idxp = os.path.join(OUT, 'index.json')
    labp = os.path.join(OUT, 'labels.json')
    rows = json.load(io.open(idxp, encoding='utf-8'))
    labels = {}
    if os.path.exists(labp):
        try: labels = json.load(io.open(labp, encoding='utf-8'))
        except Exception: labels = {}
    todo = [r for r in rows if r['path'] not in labels]
    if limit: todo = todo[:limit]
    if not todo:
        print('nothing to label'); return

    print('loading %s …' % MODEL, flush=True)
    model = ClapModel.from_pretrained(MODEL).eval()
    proc  = ClapProcessor.from_pretrained(MODEL)

    # both taxonomies, embedded ONCE
    tvecs = {}
    with torch.no_grad():
        for kind, AX in (('sample', SAMPLE_AXES), ('track', TRACK_AXES)):
            for axis, pairs in AX.items():
                ti = proc(text=[p for _, p in pairs], return_tensors='pt', padding=True)
                e = model.get_text_features(**ti)
                tvecs[(kind, axis)] = torch.nn.functional.normalize(e, dim=-1)
    print('taxonomies embedded: %d sample phrases, %d track phrases'
          % (sum(len(v) for v in SAMPLE_AXES.values()),
             sum(len(v) for v in TRACK_AXES.values())), flush=True)

    done = 0
    for r in todo:
        try:
            y, _ = librosa.load(os.path.join(ROOT, r['path']), sr=SR, mono=True,
                                duration=10.0)
            if len(y) < 1000: raise ValueError('too short')
            with torch.no_grad():
                ai = proc(audios=y, sampling_rate=SR, return_tensors='pt')
                av = torch.nn.functional.normalize(
                     model.get_audio_features(**ai), dim=-1)
                AX, kind = axes_for(r.get('seconds', 0) or r.get('full_seconds', 0))
                out = {'taxonomy': kind}
                for axis, pairs in AX.items():
                    sim = (av @ tvecs[(kind, axis)].T).squeeze(0).numpy()
                    o = np.argsort(-sim)
                    top, second = int(o[0]), int(o[1])
                    gap = float(sim[top] - sim[second])
                    p = torch.softmax(torch.tensor(sim) * 20.0, dim=-1).numpy()
                    out[axis] = {
                      'label': pairs[top][0] if gap >= GAP else '?',
                      'best': pairs[top][0],
                      'cos': round(float(sim[top]), 4),
                      'gap': round(gap, 4),
                      'p': round(float(p[top]), 3),
                      'runner_up': pairs[second][0],
                    }
            labels[r['path']] = out
            done += 1
        except Exception as e:
            labels[r['path']] = {'error': str(e)[:80]}
        if done % 20 == 0:
            print('  %d/%d' % (done, len(todo)), flush=True)
            json.dump(labels, io.open(labp,'w',encoding='utf-8'), separators=(',',':'))

    # assemble the EarSketch-style constant, numbered without collisions
    seen = {}
    for path in sorted(labels):
        c = labels[path]
        if 'error' in c or not c or 'genre' not in c: continue
        g = c['genre']['label']; t = c['type']['label']
        g = g if g != '?' else 'UNK'; t = t if t != '?' else 'UNK'
        stem = 'WYG_%s_%s' % (g, t)
        seen[stem] = seen.get(stem, 0) + 1
        c['earsketch'] = '%s_%d' % (stem, seen[stem])

    json.dump(labels, io.open(labp,'w',encoding='utf-8'), separators=(',',':'))
    ok   = [c for c in labels.values() if 'error' not in c]
    errs = [c for c in labels.values() if 'error' in c]
    print('\n%d labelled, %d failed, %d not yet attempted'
          % (len(ok), len(errs), len(rows) - len(ok) - len(errs)))
    for axis in AXES:
        unsure = sum(1 for c in ok if c[axis]['label'] == '?')
        gaps = sorted(c[axis]['gap'] for c in ok)
        if not gaps: continue
        print('  %-10s %3d of %d under the gap floor  ·  median gap %.4f'
              % (axis, unsure, len(ok), gaps[len(gaps)//2]))
    # a taxonomy that answers the same way for everything is not discriminating
    import collections
    for axis in AXES:
        c = collections.Counter(x[axis]['label'] for x in ok)
        top, n = c.most_common(1)[0] if c else ('—', 0)
        if ok and n / float(len(ok)) > 0.45:
            print('  ! %s is %d%% "%s" — the taxonomy may not fit this material'
                  % (axis, round(100*n/len(ok)), top))

if __name__ == '__main__':
    main()
