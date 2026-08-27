#!/usr/bin/env python3
"""
AUDIO RADIOLOGY — every sound in the repo, imaged in five planes.

A waveform is one projection of a sound, the way an X-ray is one projection of a
body: useful, and not the thing. To actually SEE a sample you need several planes
of the same object taken by different physics, read side by side.

Each file gets a PLATE of five:

  1. WAVEFORM      amplitude in time — the X-ray. Shape, transients, silence.
  2. MEL SPECTRO   energy across frequency in time — the MRI. Where the body is.
  3. CHROMA        the twelve pitch classes — the harmonic slice. What key it is.
  4. ONSET + BEAT  the attack envelope with detected beats — the ECG. Its pulse.
  5. HPSS          harmonic and percussive separated — the tissue contrast. What
                   part of this is pitched material and what part is hit.

and a CHART of measurements: duration, loudness, crest factor, spectral centroid
and rolloff and flatness, zero-crossing rate, onset density, tempo, key, the
harmonic/percussive ratio, and how much of it is silence.

Nothing here is a neural network. This is the physics layer, and it runs on every
file in about a second without downloading anything. The semantic layer — what
the sound IS, in words — is a separate pass (audio_label.py) because it needs a
model and can fail; this cannot.

    python3 cut/pf/audio_scan.py            every audio file in the repo
    python3 cut/pf/audio_scan.py wygwyl     only paths containing that
    python3 cut/pf/audio_scan.py --limit 20
"""
import os, io, sys, json, math, warnings, hashlib
warnings.filterwarnings('ignore')
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import librosa, librosa.display

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(
       os.path.dirname(os.path.abspath(__file__)))))
OUT  = os.path.join(ROOT, 'AUDIO')
PLATES = os.path.join(OUT, 'plates')
EXT = ('.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg')
SR  = 22050
MAX_S = 45.0     # a plate images the first 45s; a 512-second score is a
                 # different object and is marked as truncated rather than
                 # silently summarised

# Krumhansl–Schmuckler profiles: correlate the chroma against every rotation of
# a major and a minor template and take the best. Cheap, and honest about being
# an estimate rather than a transcription.
MAJ = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
MIN = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
NOTE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

def estimate_key(chroma):
    v = chroma.mean(1)
    if v.sum() <= 0: return ('?', 0.0)
    v = (v - v.mean()) / (v.std() or 1)
    best, bk = -9, ('?', 0.0)
    for i in range(12):
        for prof, name in ((MAJ, 'maj'), (MIN, 'min')):
            p = np.roll(prof, i); p = (p - p.mean()) / (p.std() or 1)
            r = float(np.dot(v, p) / 12.0)
            if r > best: best, bk = r, ('%s %s' % (NOTE[i], name), r)
    return bk

def db(x):
    return float(20 * np.log10(max(1e-9, x)))

def measure(y, sr):
    S  = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    mel = librosa.feature.melspectrogram(S=S**2, sr=sr, n_mels=96)
    chroma = librosa.feature.chroma_stft(S=S, sr=sr)
    onset = librosa.onset.onset_strength(S=librosa.power_to_db(mel), sr=sr)
    try:
        tempo, beats = librosa.beat.beat_track(onset_envelope=onset, sr=sr)
        tempo = float(np.atleast_1d(tempo)[0])
    except Exception:
        tempo, beats = 0.0, np.array([])
    on_frames = librosa.onset.onset_detect(onset_envelope=onset, sr=sr)
    H, P = librosa.decompose.hpss(S, margin=1.0)
    rms = librosa.feature.rms(S=S)[0]
    dur = len(y) / float(sr)
    quiet = float((rms < (rms.max() * 0.02 + 1e-9)).mean()) if len(rms) else 0.0
    k, kconf = estimate_key(chroma)
    return {
      'seconds': round(dur, 3),
      'sr': int(sr),
      'peak_dbfs': round(db(float(np.abs(y).max()) if len(y) else 0), 2),
      'rms_dbfs': round(db(float(np.sqrt((y**2).mean())) if len(y) else 0), 2),
      'crest_db': round(db(float(np.abs(y).max()) if len(y) else 0)
                        - db(float(np.sqrt((y**2).mean())) if len(y) else 0), 2),
      'centroid_hz': round(float(librosa.feature.spectral_centroid(S=S, sr=sr).mean()), 1),
      'rolloff_hz':  round(float(librosa.feature.spectral_rolloff(S=S, sr=sr).mean()), 1),
      'bandwidth_hz':round(float(librosa.feature.spectral_bandwidth(S=S, sr=sr).mean()), 1),
      'flatness':    round(float(librosa.feature.spectral_flatness(S=S).mean()), 4),
      'zcr':         round(float(librosa.feature.zero_crossing_rate(y).mean()), 4),
      'onsets': int(len(on_frames)),
      'onsets_per_s': round(len(on_frames) / max(0.001, dur), 2),
      'tempo_bpm': round(tempo, 1),
      'beats': int(len(beats)),
      'key': k, 'key_conf': round(kconf, 3),
      'harmonic_ratio': round(float(H.sum() / max(1e-9, H.sum() + P.sum())), 3),
      'silence_share': round(quiet, 3),
    }, (S, mel, chroma, onset, beats, H, P)

def plate(path, y, sr, m, parts, dest):
    S, mel, chroma, onset, beats, H, P = parts
    fig, ax = plt.subplots(5, 1, figsize=(7.4, 8.6), dpi=110,
                           gridspec_kw={'height_ratios': [1, 1.5, 1, .9, 1.3]})
    fig.set_dpi(96)
    fig.patch.set_facecolor('#0c0c0e')
    for a in ax:
        a.set_facecolor('#0c0c0e')
        for s in a.spines.values(): s.set_color('#2a2a30')
        a.tick_params(colors='#7a7a85', labelsize=6, length=2)

    t = np.linspace(0, m['seconds'], len(y))
    ax[0].plot(t, y, lw=.4, color='#8fd8ff'); ax[0].set_ylim(-1, 1)
    ax[0].set_ylabel('WAVE', color='#7a7a85', fontsize=6.5)

    librosa.display.specshow(librosa.power_to_db(mel, ref=np.max), sr=sr,
                             x_axis='time', y_axis='mel', ax=ax[1], cmap='magma')
    ax[1].set_ylabel('MEL', color='#7a7a85', fontsize=6.5)

    librosa.display.specshow(chroma, sr=sr, x_axis='time', y_axis='chroma',
                             ax=ax[2], cmap='cividis')
    ax[2].set_ylabel('CHROMA', color='#7a7a85', fontsize=6.5)

    ot = librosa.times_like(onset, sr=sr)
    ax[3].plot(ot, onset, lw=.7, color='#4ade80')
    if len(beats):
        bt = librosa.frames_to_time(beats, sr=sr)
        step = max(1, len(bt) // 48)          # thin, or the marks bury the trace
        ax[3].vlines(bt[::step], 0, onset.max() if len(onset) else 1,
                     color='#e5484d', lw=.55, alpha=.7)
    ax[3].set_ylabel('ONSET', color='#7a7a85', fontsize=6.5)
    ax[3].set_xlim(0, m['seconds'])

    hp = np.vstack([librosa.amplitude_to_db(H, ref=np.max),
                    librosa.amplitude_to_db(P, ref=np.max)])
    librosa.display.specshow(hp, sr=sr, x_axis='time', ax=ax[4], cmap='bone',
                             vmin=-55, vmax=0)
    ax[4].axhline(H.shape[0], color='#e5484d', lw=.6)
    ax[4].set_ylabel('H / P', color='#7a7a85', fontsize=6.5)

    for a in ax[:-1]: a.set_xlabel('')
    ax[4].set_xlabel('seconds', color='#7a7a85', fontsize=6.5)
    fig.suptitle(os.path.basename(path), color='#e8e6e1', fontsize=8, y=.995)
    fig.text(.5, .012,
        '%s · %s · %.0f bpm · %s · centroid %.0fHz · flat %.3f · H %.2f · %d onsets'
        % (('%.2fs of %.1fs' % (m['seconds'], m.get('full_seconds', m['seconds'])))
           if m.get('truncated') else ('%.2fs' % m['seconds']),
           '%.1f dBFS' % m['peak_dbfs'], m['tempo_bpm'], m['key'],
           m['centroid_hz'], m['flatness'], m['harmonic_ratio'], m['onsets']),
        color='#7a7a85', fontsize=6.4, ha='center')
    fig.tight_layout(rect=[0, .028, 1, .985])
    # WEBP, NOT PNG. A thousand plates as PNG is 247 MB — past what a repository
    # should carry, and the repo already gitignores derived bulk for exactly that
    # reason. But gitignoring these would leave the atlas empty on a clone, which
    # is a worse deliverable than a slightly lossy plate. WebP at 82 keeps every
    # line readable at about a fifth the bytes.
    import io as _io
    from PIL import Image as _Image
    buf = _io.BytesIO()
    fig.savefig(buf, format='png', facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    _Image.open(buf).convert('RGB').save(dest, 'WEBP', quality=82, method=4)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    limit = None
    if '--limit' in sys.argv:
        limit = int(sys.argv[sys.argv.index('--limit') + 1])
    filt = args[0] if args else None

    os.makedirs(PLATES, exist_ok=True)
    files = []
    for root, dirs, fs in os.walk(ROOT):
        if '/.git' in root or '.sam3env' in root or '/AUDIO/' in root: continue
        for f in sorted(fs):
            if f.lower().endswith(EXT):
                rel = os.path.relpath(os.path.join(root, f), ROOT)
                if filt and filt not in rel: continue
                files.append(rel)
    files.sort()
    if limit: files = files[:limit]

    idxp = os.path.join(OUT, 'index.json')
    done = {}
    if os.path.exists(idxp):
        try: done = {r['path']: r for r in json.load(io.open(idxp, encoding='utf-8'))}
        except Exception: done = {}

    rows, fails = [], []
    for i, rel in enumerate(files):
        pid = hashlib.md5(rel.encode()).hexdigest()[:12]
        dest = os.path.join(PLATES, pid + '.webp')
        if rel in done and os.path.exists(dest):
            rows.append(done[rel]); continue
        try:
            full = librosa.get_duration(path=os.path.join(ROOT, rel))
            y, sr = librosa.load(os.path.join(ROOT, rel), sr=SR, mono=True,
                                 duration=MAX_S)
            if len(y) < 512: raise ValueError('too short')
            m, parts = measure(y, sr)
            m['full_seconds'] = round(float(full), 2)
            m['truncated'] = bool(full > MAX_S + .05)
            plate(rel, y, sr, m, parts, dest)
            m.update({'path': rel, 'id': pid, 'plate': 'plates/%s.webp' % pid,
                      'name': os.path.basename(rel),
                      'family': '/'.join(rel.split('/')[:3])})
            rows.append(m)
        except Exception as e:
            fails.append((rel, str(e)[:70]))
        if (i+1) % 25 == 0:
            print('  %d/%d' % (i+1, len(files)), flush=True)
            json.dump(rows, io.open(idxp,'w',encoding='utf-8'), separators=(',',':'))

    json.dump(rows, io.open(idxp, 'w', encoding='utf-8'), separators=(',', ':'))
    print('%d imaged, %d failed' % (len(rows), len(fails)))
    for f, e in fails[:10]: print('  FAIL %s — %s' % (f, e))

if __name__ == '__main__':
    main()
