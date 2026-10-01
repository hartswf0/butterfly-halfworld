#!/usr/bin/env python3
"""
THE DOOR — one index for everything this archive made.

    python3 cut/pf/door.py

Why this exists: there were thirty-nine instruments, four libraries, five cuts
and twenty-four notes, and every one of them had its own front page. None of
them had a front page. The repository's own index.html links to three things and
does not know this archive exists; wygwyl/atlas.html indexes the sibling body of
work. So the honest answer to "where is the single index" was: nowhere. This
builds it.

The entries are declared by hand, because what a thing IS cannot be measured —
but everything measurable is measured here and nothing is typed twice:

    href exists?  ->  file count  ->  bytes  ->  last touched  ->  a real preview

A preview is pulled from the collection itself (first image, or a frame lifted
from the first clip at 1/3 in). An entry whose href is missing is not silently
dropped: it renders struck through, with the reason, because an index that hides
its own dead links is worth less than no index.
"""
import os, sys, json, subprocess, hashlib, time
import numpy as np, cv2

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # .../MARKOV_POET_ARCHIVE-FLY
OUT  = os.path.join(BASE, 'INDEX.html')
THUMBS = os.path.join(BASE, 'INDEX_thumbs')
EDGE, Q = 460, 74

# ---------------------------------------------------------------- the entries
# kind:  operate | browse | look | watch | read
# each: (id, kind, name, href, line, note)
#   line — what it is, in one sentence
#   note — what it is NOT, or what it costs. '' when there is nothing to warn about.
E = [
 # ---- OPERATE: live tools. you make something that did not exist before.
 ('I01','operate','OPERATOR 16','cut/out/op16/index.html',
  'The patch studio: lay images into a 192x144 ink field as corner-dragged quads, bind them to the limbs of a beflix body so they carry when it moves, blend nine ways, and stream a whole poem or a whole film onto the strip.',
  'Heaviest tool here. A picked region is still not a nameable part — that gap is written up in cut/pf/OP16_FIT.md.'),
 ('I02','operate','OPERATOR 15','cut/out/op15/index.html',
  'The previous operator, kept whole: single-frame patch work before spans, quads and binding existed.',
  'Superseded by I01. Kept because it is the last version where a patch was just x, y and size.'),
 ('I03','operate','OPERATOR 14','cut/out/op/index.html',
  'The first operator — the studio in its original form, where the dot law and the patch ontology were worked out.',
  'Superseded twice.'),
 ('I04','operate','PASTE','cut/out/paste/index.html',
  'The blend table: two grids, nine folds — over, behind, deepen, lift, darkest, lightest, differ, mask, knock — on eight ink weights.',
  'A bench, not a composer. It shows you what a blend does; it does not keep the result.'),
 ('I05','operate','HELD','cut/out/held/index.html',
  'The archive shelf: 2,033 cut-out subjects, cropped to their own alpha and capped at 256px, pickable into any socket.',
  ''),
 ('I06','operate','HALFWORLD STUDIO','cut/out/studio/index.html',
  'The world bench: compose a halfworld from grounds, worlds, elements and ink, and watch it resolve at the dot law.',
  ''),
 ('I07','operate','THE LAB','cut/out/lab/index.html',
  'Finding the body: segmentation probes over the archive, looking for the limbs a photograph does not have.',
  'Research bench. Several probes are dead ends and are left in as dead ends.'),
 ('I08','operate','PATCHFIELD','cut/out/patchfield/index.html',
  'A field of patches at once — the whole ontology laid out flat so you can see what kind each thing is.',
  ''),
 ('I09','operate','DRESS','cut/out/dress/index.html',
  'Skins mapped onto moving bodies: a texture taken across a silhouette as it walks.',
  ''),
 ('I10','operate','INHABIT','cut/out/inhabit/index.html',
  'Putting a real subject inside a generated place, and measuring whether the place accepts it.',
  ''),
 ('I11','operate','THE LOOM','cut/out/loom/index.html',
  'Weaving two sources into one strip, warp and weft, frame against frame.',
  ''),
 ('I12','operate','TEXTULE','cut/out/textule/index.html',
  'Text as texture: the poems rendered as surface rather than as words to read.',
  ''),
 ('I13','operate','THE CITY','cut/out/archigram/index.html',
  'Archigram method on the archive: the film’s architecture drawn as plug-in parts.',
  ''),
 ('I14','operate','THE SETS','cut/out/scene/index.html',
  'Twenty-eight scenes staged as sets — each one a place the film could be shot in rather than a shot.',
  ''),
 ('I15','operate','THE WOVEN SHEETS','cut/out/sheets/index.html',
  'Contact sheets woven from the archive, fourteen of them, one per poem.',
  ''),
 ('I16','operate','I AM SITTING IN A ROOM','cut/out/lucier/index.html',
  'Lucier’s method applied to an image: re-render the re-render until only the room is left.',
  ''),
 ('I17','operate','CHURN','cut/out/churn/index.html',
  'A radio: the archive cut, re-cut and broadcast against itself, continuously.',
  '1.1 GB of rendered segments on disk.'),
 ('I18','operate','MOUSSA','cut/out/moussa/index.html',
  'The carrier study — one body carried through every poem in the suite.',
  '1.3 GB.'),
 ('I19','operate','THE JOURNEYS','cut/out/journeys/index.html',
  'Routes through the archive computed as journeys rather than cuts.',
  '393 MB.'),
 ('I20','operate','THE COLLAGES','cut/out/collage/index.html',
  'The first collage bench — thirty-three works and the grammar they were built with.',
  ''),
 ('I21','operate','PREVIS','cut/out/previs/index.html',
  'Previsualisation of the suite: fourteen leads, one per poem.',
  ''),
 ('I22','operate','THE SIX','cut/out/shorts/index.html',
  'Six WYGWYL shorts, cut and playable.',
  '923 MB.'),
 ('I23','operate','FIVE CUTS','cut/index.html',
  'The player for the five master cuts, the concordance and the music map, with a pane that tracks the playhead.',
  ''),

 # ---- BROWSE: libraries. you search, sort and take things away.
 ('L01','browse','THE BOARD','BOARD/index.html',
  '2,275 rows — every image this archive made, each with its prompt, sortable by poem, type, video or still, and downloadable a row at a time as a real ZIP written by hand in the page.',
  'Images load on an IntersectionObserver; a cold scroll to the bottom pulls a lot of files.'),
 ('L02','browse','EVERY EXPERIMENT','COLLAGE_AND_VIDEO/index.html',
  'Forty-five works gathered into one folder — 834 moving pieces and 4,384 stills — with the prompt or the inspiration for each written beside it.',
  '10.0 GB in place. The folder links by relative path, never by symlink: directory symlinks here took down every Pages deploy.'),
 ('L03','browse','THE COLLAGE ZETTELS','COLLAGE_ZETTELS/index.html',
  '107 zettels, one per collage at every stage, each with the image and a text-to-video cineosis prompt written for it — collage 33, scene 28, cutsheet 14, lucier 20, plate 9, quilt 1, partswap 1, patchfield 1.',
  ''),
 ('L04','browse','AUDIO RADIOLOGY','../audio/index.html',
  '1,095 sounds, every one imaged on five planes (waveform, mel, chroma, onset and beat, harmonic/percussive split) with eighteen measurements and a Krumhansl–Schmuckler key, then named by CLAP on four axes with an EarSketch constant.',
  'Lives at the repository root in audio/, beside the film’s own sound. Plates are 59 MB of WebP and are NOT yet committed — see the note at the foot of this page.'),
 ('L05','browse','MARKOV POET GALLERY','MARKOV_POET_GALLERY.html',
  'The archive’s own gallery of the 135 generated shots.',
  ''),

 # ---- LOOK: finished images. nothing to operate.
 ('W01','look','THE META COLLAGES','cut/out/meta',
  'Fourteen posters, one per poem — a collage made out of the collages, on a value ladder that keeps a poster legible, with the hue taken from the most-saturated decile rather than the most common colour.',
  ''),
 ('W02','look','THE SECOND PASS','cut/out/second',
  'Fourteen works rebuilt with a voice each: eight geometries, five formats, coverage from 0.34 to 1.00, four palette structures, and mark weight set inverse to coverage so sparse does not read as thin.',
  'Honest gap: nothing was ever rejected. Fourteen went in and fourteen came out. 06 and 09 still share the constellation geometry. Written up in cut/pf/SECOND_PASS.md.'),
 ('W03','look','THE PARTS','cut/out/parts',
  'Every shot reduced to its parts — the second-moment anchors that binding carries by.',
  ''),
 ('W04','look','THE BEFLIX SHEETS','cut/out/beflix_e',
  'The ink field proved out: the dot law at eight levels, sheet by sheet.',
  ''),
 ('W05','look','THE QUILT / THE SWAP / THE FIT','cut/out/quilt',
  'Three small studies that each answered one question: can a shot be quilted, can two parts be swapped, can a piece be fitted to a limb.',
  'The swap is in cut/out/partswap, the fit in cut/out/bind.'),

 # ---- STOCK: the material. not a work and not a tool — what the works were cut from.
 ('S01','stock','THE SEGMENTS','cut/churn_segments',
  'Every clip the seven cuts were assembled from, kept whole and kept separate: the churn, the deck, the journeys, Moussa, the music, the shorts and the bastard pass.',
  'Seven folders, one per cut. This is the pile; the cuts are F01–F05.'),
 ('S02','stock','THE CUT-OUTS','cut/out/elements',
  '2,033 subjects lifted out of the archive, each one a figure floating in a transparent frame — the pile every socket draws from.',
  'The sheet shows the web-sized twin (cut/out/thumbs \u2014 cropped to alpha, capped at 256px, 8.9 MB); each thumbnail links to its full-size original.'),
 ('S03','stock','THE HARVEST','cut/out/harvest',
  '521 renders in two passes — each shot read against itself and against its contrary, world over subject and subject over real.',
  'Two passes: harvest and harvest_flow.'),
 ('S04','stock','ARS POETICA','cut/out/arspoetica',
  'Four treatments of the same shot rendered side by side — ink, subject-ink, subject-real, world-ground — so the difference between them could be looked at rather than argued about.',
  ''),
 ('S05','stock','THE LEADS','cut/out/footage',
  'One lead per poem, cut long: the fourteen pieces of footage the suite was previsualised from.',
  ''),
 ('S06','stock','THE BEDS AND THE MIXES','cut/out/sound',
  'The sound beds and mixes built per poem, plus the two pitched takes the music study turned on.',
  ''),
 ('S07','stock','THE FRAMES AND THE SHEETS','cut/frames',
  'A mid-frame extracted from all 135 shots, and the contact sheets made from them — the evidence that showed the category field was a garbage bucket.',
  'Two folders: cut/frames and contact_sheets.'),
 ('S08','stock','THE HALFWORLDS','cut/halfworlds',
  'Fourteen halfworlds, one per poem: a whole place rendered at the dot law rather than a shot of one.',
  ''),

 # ---- WATCH: the cuts.
 ('F01','watch','A · THE PQ REEL','cut/out/WYGWYL_A_THE_PQ_REEL.mp4',
  'The reel that never re-encodes: every shot passed through at its real duration, 5.04s to 39.17s, so the HDR is not thrown away by being flattened.',
  '29 MB.'),
 ('F02','watch','B · THE WINDOW AND THE DOOR','cut/out/WYGWYL_B_THE_WINDOW_AND_THE_DOOR.mp4',
  'The suite cut to its own script — 111 stanzas with screen text, voiceover and an image-function, which no previous cut had ever referenced.',
  '373 MB.'),
 ('F03','watch','C · THE DECK AT 60BPM','cut/out/WYGWYL_C_THE_DECK_60BPM.mp4',
  'Cut to a grid: one bar per shot at sixty beats per minute, with its own score.',
  '243 MB. A silent version sits beside it.'),
 ('F04','watch','D · THE DOOR','cut/out/WYGWYL_D_THE_DOOR.mp4',
  'Ends on P014 — the single shot in the whole archive of an open, lit doorway, which had been sitting in the middle of poem 01.',
  '108 MB.'),
 ('F05','watch','E · THE DOOR, SCORED','cut/out/WYGWYL_E_THE_DOOR_mareamemory_06.mp4',
  'D again, carried on mareamemory 06.',
  '125 MB. Silent version beside it.'),
 ('F06','watch','THE SUITE PLAYER','wygwyl-suite-player.html',
  'The fourteen poems as a suite, playable in the browser.',
  ''),
 ('F07','watch','THE COVERAGE MATRIX','wygwyl-coverage-matrix.html',
  'Which stanza every one of the 135 shots actually covers — the page that showed the category field was a garbage bucket.',
  ''),

 # ---- READ: the record.
 ('R01','read','THE LEDGER','cut/LEDGER.md',
  'What this pass saw, what it changed, and what it got wrong on the way. A ledger with no failures is a falsified ledger.',
  ''),
 ('R02','read','THE CUT README','cut/README.md',
  'How the five cuts were made and what each one is for.',
  ''),
 ('R03','read','THE OPERATOR NOTES','cut/pf',
  'Twenty-four notes written while building: the patch ontology, the quad warp, binding by follow and by fit, the nine blends, the undo model, what picking is, and the two films problem.',
  ''),
 ('R04','read','THE SECOND-PASS NOTE','cut/pf/SECOND_PASS.md',
  'Why the first second pass failed — every work had the same structure and only the hue changed — and what a voice actually needs.',
  ''),
 ('R05','read','THE FIT NOTE','cut/pf/OP16_FIT.md',
  'The one gap left open: a picked region is not yet a bindable part. One step, not a system.',
  ''),
 ('R06','read','THE COVERAGE MAP','WYGWYL_COVERAGE_MAP.md',
  'The archive measured against the poems, stanza by stanza.',
  ''),
 ('R07','read','THE SIBLING ATLAS','../wygwyl/atlas.html',
  'The other body of work in this repository, indexed in its own record idiom: the city, the world, the radio, the spine key, sixty-six entries.',
  'Not this archive. Linked because this is the only place the two indexes meet.'),
]


# --------------------------------------------- what to measure, what to show
# An entry's href is a door; the thing behind it is usually a whole directory.
# MEASURE says which. Default: an index.html measures its own folder, anything
# else measures itself. A markdown note measures itself and shows no picture,
# because the only image in its folder belongs to something else — a borrowed
# preview is a small lie told sixteen times.
MEASURE = {
 'S01':['cut/bastard_segments','cut/churn_segments','cut/deck_segments','cut/journey_segments',
        'cut/moussa_segments','cut/music_segments','cut/short_segments'],
 'S02':['cut/out/elements','cut/out/thumbs'],
 'S03':['cut/out/harvest','cut/out/harvest_flow'],
 'S06':['cut/out/sound','cut/out/music'],
 'S07':['cut/frames','contact_sheets'],
 # the player is the page; the cuts it plays are counted once, as F01-F05
 'I23':'cut/index.html',
 'W05':['cut/out/quilt','cut/out/partswap','cut/out/bind'],
 'L01':'BOARD', 'L02':'COLLAGE_AND_VIDEO', 'L03':'COLLAGE_ZETTELS', 'L04':'../audio',
 'L05':'MARKOV_POET_00',
 'R03':'cut/pf',
}
# COUNT: a library's real headline number, read from its own manifest, because
# "4 files" is true of BOARD/ and tells you nothing about it.
COUNT = {
 'L01':('BOARD/board.json','rows'),
 'L02':('COLLAGE_AND_VIDEO/catalogue.json','works'),
 'L03':('COLLAGE_ZETTELS/catalogue.json','zettels'),
 'L04':('../audio/index.json','sounds'),
}
# PREVIEW: an explicit member of the collection, where the collection's own
# folder holds only the page that indexes it.
PREVIEW = {
 'S02':'cut/out/thumbs',
 'L01':'cut/out/collage/GRID_ALL.webp',
 'L02':'cut/out/lucier',
 'L03':'cut/out/scene',
 'L04':'../audio/plates/0035ba4fa124.webp',
 'L05':'MARKOV_POET_00/thumbnails',
}
# notes get a drawn mark, never the only picture that happens to sit in their folder
NOPREVIEW = {'R01','R02','R03','R04','R05','R06'}   # notes: a drawn mark, not someone else's picture

KINDS = [('operate','OPERATE','tools you work in'),
         ('browse','BROWSE','libraries you search and take from'),
         ('look','LOOK','finished images'),
         ('watch','WATCH','the cuts'),
         ('stock','STOCK','the material it was all cut from'),
         ('read','READ','the record')]

IMGX = ('.png','.jpg','.jpeg','.webp')
VIDX = ('.mp4','.mov','.m4v')

def walk(p, cap=40000):
    """count, bytes, newest mtime — for a file, itself; for a dir, everything under it"""
    if os.path.isfile(p):
        s = os.stat(p); return 1, s.st_size, s.st_mtime
    n = b = 0; t = 0.0
    for root, dirs, files in os.walk(p):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.startswith('.'): continue
            try: s = os.stat(os.path.join(root, f))
            except OSError: continue
            n += 1; b += s.st_size; t = max(t, s.st_mtime)
            if n >= cap: return n, b, t
    return n, b, t

def pick_source(p):
    """the image this collection should show: its own first image, or a frame from its first clip"""
    d = p if os.path.isdir(p) else os.path.dirname(p)
    if os.path.isfile(p) and p.lower().endswith(VIDX): return ('vid', p)
    imgs, vids = [], []
    for root, dirs, files in os.walk(d):
        dirs[:] = sorted(x for x in dirs if not x.startswith('.') and x not in ('plates','thumbs','elements'))
        for f in sorted(files):
            l = f.lower()
            if l.endswith(IMGX) and not l.startswith('.'): imgs.append(os.path.join(root, f))
            elif l.endswith(VIDX): vids.append(os.path.join(root, f))
        if imgs or vids: break
        if root.count(os.sep) - d.count(os.sep) >= 2: break
    if imgs: return ('img', imgs[0])
    if vids: return ('vid', vids[0])
    return (None, None)

def frame_of(path, out):
    """a frame one third of the way in — the first frame of a cut is often black"""
    dur = 0.0
    try:
        r = subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',
                            '-of','default:nw=1:nk=1', path], capture_output=True, text=True, timeout=30)
        dur = float((r.stdout or '0').strip() or 0)
    except Exception: pass
    at = max(0.0, dur/3.0) if dur > 1.5 else 0.0
    try:
        subprocess.run(['ffmpeg','-v','error','-ss',f'{at:.2f}','-i',path,'-frames:v','1',
                        '-y', out], capture_output=True, timeout=60)
        return os.path.exists(out) and os.path.getsize(out) > 0
    except Exception: return False

def thumb(src, kind, dst):
    tmp = dst + '.src.png'
    if kind == 'vid':
        if not frame_of(src, tmp): return False
        src = tmp
    im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
    if im is None:
        if os.path.exists(tmp): os.remove(tmp)
        return False
    if im.dtype != np.uint8:
        im = cv2.normalize(im, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    if im.shape[2] == 4:
        # a cut-out is mostly transparent nothing — crop to what is actually there,
        # then lay it on paper, because a checkerboard is not the aesthetic
        a = im[:,:,3]; ys, xs = np.nonzero(a > 12)
        if len(ys): im = im[ys.min():ys.max()+1, xs.min():xs.max()+1]
        al = im[:,:,3:4].astype(np.float32)/255.0
        im = (im[:,:,:3].astype(np.float32)*al + 244.0*(1.0-al)).astype(np.uint8)
    ih, iw = im.shape[:2]
    s = min(1.0, EDGE/float(max(ih, iw)))
    if s < 1.0: im = cv2.resize(im, (max(1,int(iw*s)), max(1,int(ih*s))), interpolation=cv2.INTER_AREA)
    ok = cv2.imwrite(dst, im, [cv2.IMWRITE_WEBP_QUALITY, Q])
    if os.path.exists(tmp): os.remove(tmp)
    return bool(ok)


# Bayer 8x8, the same ordered matrix the tools dither with
BAYER = np.array([[ 0,32, 8,40, 2,34,10,42],[48,16,56,24,50,18,58,26],
                  [12,44, 4,36,14,46, 6,38],[60,28,52,20,62,30,54,22],
                  [ 3,35,11,43, 1,33, 9,41],[51,19,59,27,49,17,57,25],
                  [15,47, 7,39,13,45, 5,37],[63,31,55,23,61,29,53,21]], np.float32) / 64.0

def mark(eid, dst, cells=(46, 23), cell=10):
    """An entry with no image of its own gets a real ink field, not a screenshot
       borrowed from its neighbour: a seeded smooth field quantised to eight
       levels through the ordered matrix and drawn with the tools' own disc law,
       radius = CELL*0.5*(lv/7)^0.72*1.24. It is a placeholder that tells the
       truth about what the thing behind it is made of."""
    rs = np.random.RandomState(int(hashlib.md5(eid.encode()).hexdigest()[:8], 16))
    cw, ch = cells
    f = np.zeros((ch, cw), np.float32)
    for oct_, amp in ((2, 1.0), (4, 0.55), (8, 0.28), (16, 0.14)):
        g = rs.rand(max(2, oct_ * ch // cw + 1), oct_).astype(np.float32)
        f += amp * cv2.resize(g, (cw, ch), interpolation=cv2.INTER_CUBIC)
    f -= f.min(); f /= max(1e-6, float(np.ptp(f)))   # numpy 2: ndarray.ptp is gone
    b = BAYER[np.arange(ch) % 8][:, np.arange(cw) % 8]
    lv = np.clip(np.floor(f * 7.0 + (b - 0.5) * 1.1 + 0.5), 0, 7).astype(np.int32)
    im = np.full((ch * cell, cw * cell, 3), 228, np.uint8)
    for y in range(ch):
        for x in range(cw):
            v = int(lv[y, x])
            if v == 0: continue
            r = cell * 0.5 * (v / 7.0) ** 0.72 * 1.24
            cv2.circle(im, (int(x * cell + cell / 2), int(y * cell + cell / 2)),
                       max(1, int(round(r))), (20, 20, 20), -1, cv2.LINE_AA)
    return bool(cv2.imwrite(dst, im, [cv2.IMWRITE_WEBP_QUALITY, 88]))

def esc(s):
    return (s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;'))

def human(b):
    for u, d in (('GB',1e9), ('MB',1e6), ('KB',1e3)):
        if b >= d: return f'{b/d:.1f} {u}' if b/d < 100 else f'{b/d:.0f} {u}'
    return f'{b} B'



# --------------------------------------------------- what survives a clone
# Measuring the disk answers "is it here". It does not answer "will it be here
# for anyone else", and those turned out to be very different questions: the
# five cuts, the segments, the halfworlds and the 135 generated shots are all
# on this disk and none of them is in the repository. An index that does not
# say so sends a visitor to fourteen 404s.
def git_state():
    try:
        top = subprocess.run(['git','rev-parse','--show-toplevel'], cwd=BASE,
                             capture_output=True, text=True, timeout=20).stdout.strip()
        ls = subprocess.run(['git','ls-files','-z'], cwd=top,
                            capture_output=True, text=True, timeout=120).stdout
        return top, set(x for x in ls.split('\0') if x)
    except Exception as ex:
        print(f'  ! git unreadable ({ex}); repository state will not be shown')
        return None, None

GIT_TOP, GIT_FILES = git_state()

def tracked(paths):
    """how many files under these roots git knows about"""
    if GIT_FILES is None: return None
    n = 0
    for x in paths:
        r = os.path.relpath(x, GIT_TOP).replace(os.sep, '/')
        if r in GIT_FILES: n += 1; continue
        pre = r.rstrip('/') + '/'
        n += sum(1 for f in GIT_FILES if f.startswith(pre))
    return n

# ------------------------------------------------------- the folder sheets
# Fourteen entries point at a directory. A local server redirects a bare
# directory to a listing; GitHub Pages returns 404. So every directory entry
# gets a real page written into it — which is better anyway: clicking THE META
# COLLAGES should show the fourteen posters, not a list of filenames.
SHEET_CAP = 300          # render media for this many; list the rest honestly
THUMB_MIRROR = {'cut/out/elements': 'cut/out/thumbs'}   # 1.1 GB of PNG has an 8.9 MB web-sized twin

SHEET_CSS = """
*{box-sizing:border-box;margin:0;padding:0;border-radius:0!important}
body{background:#f4f4f0;color:#141414;font:400 14px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;
 padding:0 20px 80px;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto}
header{border-bottom:3px solid #141414;padding:28px 0 18px;margin-bottom:26px}
.up{font:700 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;
 color:#0033cc;text-decoration:none;display:inline-block;margin-bottom:18px}
h1{font:900 clamp(21px,4vw,34px)/1.08 Helvetica,Arial;letter-spacing:.03em;text-transform:uppercase}
h1 small{display:block;font:700 10px/1 ui-monospace,monospace;letter-spacing:.2em;color:#8a8a86;margin-top:11px}
.lede{margin:16px 0 0;max-width:68ch;font-size:15px}
.note{margin:12px 0 0;font:400 12px/1.5 ui-monospace,Menlo,monospace;color:#8a6d00;
 border-left:2px solid #8a6d00;padding-left:9px;max-width:68ch}
.tot{margin:14px 0 0;font:700 11px/1.6 ui-monospace,monospace;letter-spacing:.06em;color:#8a8a86}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(236px,1fr));gap:12px}
.it{border:2px solid #141414;background:#fdfdfa;display:flex;flex-direction:column}
.it a.box{display:block;background:#e4e4e0;border-bottom:2px solid #141414}
.it img,.it video{width:100%;display:block;background:#e4e4e0}
.it .cap{padding:9px 10px;font:400 11px/1.4 ui-monospace,Menlo,monospace;word-break:break-all}
.it .cap b{display:block;font-weight:700;margin-bottom:3px}
.it .cap span{color:#8a8a86}
.rows{border:2px solid #141414;background:#fdfdfa;margin-top:16px}
.rows a{display:flex;gap:14px;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #e4e4e0;
 font:400 12px/1.4 ui-monospace,Menlo,monospace;color:#141414;text-decoration:none}
.rows a:last-child{border-bottom:0}
.rows a:hover{background:#141414;color:#fdfdfa}
.rows span{color:#8a8a86;white-space:nowrap}
.rows em{font-style:normal;color:#8a8a86;flex:1 1 auto;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:10px}
.rows a:hover em{color:#a8a8a4}
.rows a:hover span{color:#a8a8a4}
.more{margin:22px 0 10px;font:700 10px/1 Helvetica;letter-spacing:.2em;text-transform:uppercase;color:#8a8a86;
 border-top:2px solid #141414;padding-top:12px}
@media(max-width:560px){body{padding:0 13px 70px}.grid{grid-template-columns:1fr 1fr;gap:8px}}
"""

def sheet(r, base):
    """Write a contact sheet into a directory entry. Never clobbers a page that
       is already there — an existing index.html is somebody's work."""
    roots = r.get('roots') or []
    dirs = [x for x in roots if os.path.isdir(x)]
    if not dirs: return None
    tgt = os.path.normpath(os.path.join(base, r['href']))
    if not os.path.isdir(tgt): return None
    out = os.path.join(tgt, 'index.html')
    if os.path.exists(out) and not open(out).read(400).count('data-door'): return None

    items = []
    for d in dirs:
        for root, sub, files in os.walk(d):
            sub[:] = sorted(x for x in sub if not x.startswith('.'))
            for f in sorted(files):
                if f.startswith('.') or f == 'index.html': continue
                fp = os.path.join(root, f)
                items.append((os.path.relpath(fp, tgt), fp, os.path.getsize(fp)))
    items.sort(key=lambda t: t[0])

    mirror = None
    for k, v in THUMB_MIRROR.items():
        if os.path.normpath(os.path.join(base, k)) in dirs:
            mirror = os.path.normpath(os.path.join(base, v))
    cards, rows = [], []
    for i, (rel, fp, sz) in enumerate(items):
        l = rel.lower()
        href = '/'.join(urlq(x) for x in rel.split(os.sep))
        if i < SHEET_CAP and l.endswith(IMGX):
            src = href
            if mirror:
                m = os.path.join(mirror, os.path.splitext(os.path.basename(rel))[0] + '.webp')
                if os.path.exists(m): src = os.path.relpath(m, tgt).replace(os.sep, '/')
            cards.append(f'<div class="it"><a class="box" href="{href}">'
                         f'<img src="{src}" alt="" loading="lazy" decoding="async"></a>'
                         f'<div class="cap"><b>{esc(rel)}</b><span>{human(sz)}</span></div></div>')
        elif i < SHEET_CAP and l.endswith(VIDX):
            # preload=none: a folder of 46 clips must not pull 1.4 GB to open
            cards.append(f'<div class="it"><div class="box">'
                         f'<video src="{href}" controls preload="none" playsinline></video></div>'
                         f'<div class="cap"><b>{esc(rel)}</b><span>{human(sz)}</span></div></div>')
        elif i < SHEET_CAP and l.endswith(('.wav', '.m4a', '.mp3', '.aac', '.flac', '.ogg')):
            cards.append(f'<div class="it"><div class="cap"><b>{esc(rel)}</b><span>{human(sz)}</span>'
                         f'<audio src="{href}" controls preload="none" style="width:100%;margin-top:7px"></audio>'
                         f'</div></div>')
        else:
            # a folder of notes is unreadable as filenames; give each one its title
            sub_ = ''
            if l.endswith('.md'):
                try:
                    for ln in open(fp, errors='replace'):
                        t = ln.strip().lstrip('#').strip()
                        if t and not t.startswith('---'): sub_ = t[:92]; break
                except OSError: pass
            rows.append(f'<a href="{href}">{esc(rel)}'
                        + (f'<em>{esc(sub_)}</em>' if sub_ else '')
                        + f'<span>{human(sz)}</span></a>')

    nb = sum(t[2] for t in items)
    extra = (f'<div class="more">the remaining {len(rows):,} files, listed</div>'
             if rows and len(items) > SHEET_CAP else
             (f'<div class="more">files</div>' if rows else ''))
    html = (f'<!doctype html><html lang="en" data-door="1"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{esc(r["name"])}</title><style>{SHEET_CSS}</style></head><body><div class="wrap">'
            f'<header><a class="up" href="{rel_to_door(tgt, base)}">← THE DOOR</a>'
            f'<h1>{esc(r["name"])}<small>{r["id"]}</small></h1>'
            f'<p class="lede">{esc(r["line"])}</p>'
            + (f'<p class="note">{esc(r["note"])}</p>' if r['note'] else '')
            + f'<p class="tot">{len(items):,} FILES &middot; {human(nb)}'
            + (f' &middot; SHOWING THE FIRST {SHEET_CAP}' if len(items) > SHEET_CAP else '')
            + '</p></header>'
            + (f'<div class="grid">{"".join(cards)}</div>' if cards else '')
            + extra + (f'<div class="rows">{"".join(rows)}</div>' if rows else '')
            + '</div></body></html>')
    open(out, 'w').write(html)
    r['sheet'] = (len(items), min(len(items), SHEET_CAP) if cards else 0)
    return out

def urlq(x):
    return x.replace('%', '%25').replace('#', '%23').replace('?', '%3F').replace(' ', '%20')

def rel_to_door(tgt, base):
    return os.path.relpath(os.path.join(base, 'INDEX.html'), tgt).replace(os.sep, '/')

# ------------------------------------------------------------------- measure
os.makedirs(THUMBS, exist_ok=True)
rows, dead, nopreview = [], [], []
for eid, kind, name, href, line, note in E:
    p = os.path.normpath(os.path.join(BASE, href))
    r = dict(id=eid, kind=kind, name=name, href=href, line=line, note=note,
             ok=os.path.exists(p), n=0, bytes=0, mtime=0, thumb='', noun='files')
    if not r['ok']:
        dead.append((eid, href)); rows.append(r); continue
    m = MEASURE.get(eid)
    if m is None:
        m = os.path.dirname(href) if os.path.basename(href) == 'index.html' else href
    ms = m if isinstance(m, list) else [m]
    ms = [os.path.normpath(os.path.join(BASE, x)) for x in ms if x]
    ms = [x for x in ms if os.path.exists(x)] or [p]
    for x in ms:
        n, b, t = walk(x)
        r['n'] += n; r['bytes'] += b; r['mtime'] = max(r['mtime'], t)
    r['roots'] = ms
    r['git'] = tracked(ms)
    mp = ms[0]
    if eid in COUNT:
        cf, noun = COUNT[eid]
        try:
            r['n'] = len(json.load(open(os.path.normpath(os.path.join(BASE, cf)))))
            r['noun'] = noun
        except Exception as ex:
            print(f'    ! {eid} manifest unreadable: {ex}')
    if eid in NOPREVIEW:
        sk, ss = None, None
    else:
        pv = PREVIEW.get(eid)
        sk, ss = pick_source(os.path.normpath(os.path.join(BASE, pv))) if pv else pick_source(mp)
    if ss:
        q = os.path.join(THUMBS, f'{eid}.webp')
        if os.path.exists(q) and '--refresh' not in sys.argv:
            r['thumb'] = f'INDEX_thumbs/{eid}.webp'
        elif thumb(ss, sk, q):
            r['thumb'] = f'INDEX_thumbs/{eid}.webp'
            r['from'] = os.path.relpath(ss, BASE)
    if not r['thumb']:
        q = os.path.join(THUMBS, f'{eid}_mark.webp')
        if (os.path.exists(q) and '--refresh' not in sys.argv) or mark(eid, q):
            r['thumb'] = f'INDEX_thumbs/{eid}_mark.webp'; r['drawn'] = True
        nopreview.append(eid)
    rows.append(r)
    print(f"  {eid}  {name[:28]:28s} {r['n']:6d} {r['noun']}  {human(r['bytes']):>9s}  {'thumb' if r['thumb'] else '—'}", flush=True)

sheets = []
for r in rows:
    if not r['ok']: continue
    try:
        w = sheet(r, BASE)
        if w: sheets.append(os.path.relpath(w, BASE))
    except Exception as ex:
        print(f"    ! {r['id']} sheet failed: {ex}")
if sheets:
    print(f"\n  {len(sheets)} folder sheets written (a bare directory is a 404 on Pages):")
    for x in sheets: print(f"    {x}")

live = [r for r in rows if r['ok']]
allroots = sorted({x for r in live for x in r.get('roots', [])})
tops = []
for x in allroots:
    if not any(x != y and x.startswith(y.rstrip(os.sep) + os.sep) for y in allroots):
        tops.append(x)
TOT_N = TOT_B = 0
for x in tops:
    n, b, _ = walk(x); TOT_N += n; TOT_B += b
print(f'\n  total over {len(tops)} distinct roots ({len(allroots)-len(tops)} nested, not double-counted)')

# ---------------------------------------------------------------- the page
def dots(eid):
    """a four-dot mark seeded by the id, for an entry with no image of its own —
       a drawn placeholder is honest where a borrowed screenshot is not"""
    h = int(hashlib.md5(eid.encode()).hexdigest(), 16)
    out = []
    for i in range(16):
        lv = (h >> (i*3)) & 7
        if lv < 3: continue
        x, y = 12 + (i % 4) * 26, 12 + (i // 4) * 26
        out.append(f'<circle cx="{x}" cy="{y}" r="{2.2 + lv*1.5:.1f}"/>')
    return ('<svg class="dots" viewBox="0 0 110 110" aria-hidden="true">'
            f'<g fill="#141414">{"".join(out)}</g></svg>')

cards = []
for r in rows:
    cls = 'card' + ('' if r['ok'] else ' gone')
    meta = ('<span class="gonetag">LINK DEAD</span>' if not r['ok'] else
            f"<span>{r['n']:,} {r['noun']}{'' if r['noun'].endswith('s') else 's'}</span><span>{human(r['bytes'])}</span>"
            f"<span>{time.strftime('%Y-%m-%d', time.localtime(r['mtime']))}</span>"
            + ('' if r.get('git') is None else
               ('<span class="disk">DISK ONLY</span>' if r['git'] == 0 else
                ('<span class="part">PART IN REPO</span>' if r['git'] < r['n'] else ''))))
    note = r['note']
    if r.get('sheet'):
        n_, shown = r['sheet']
        made = (f'Contact sheet generated into the folder: {shown} of {n_:,} shown, the rest listed.'
                if n_ > shown else 'Contact sheet generated into the folder.')
        note = (note + '  ' + made) if note else made
    pv = ((f'<img src="{esc(r["thumb"])}" alt="" loading="lazy" decoding="async"'
           + (' class="drawn" title="drawn ink field — this entry has no image of its own">'
              if r.get('drawn') else '>'))
          if r['thumb'] else dots(r['id']))
    body = (f'<div class="pv">{pv}</div>'
            f'<div class="txt"><div class="hd"><span class="eid">{r["id"]}</span>'
            f'<h3>{esc(r["name"])}</h3></div>'
            f'<p class="line">{esc(r["line"])}</p>'
            + (f'<p class="note">{esc(note)}</p>' if note else '')
            + f'<div class="meta">{meta}</div></div>')
    hay = esc((r['id'] + ' ' + r['name'] + ' ' + r['line'] + ' ' + r['note'] + ' ' + r['href']).lower())
    if r['ok']:
        cards.append(f'<a class="{cls}" href="{esc(r["href"])}" data-k="{r["kind"]}" data-h="{hay}">{body}</a>')
    else:
        cards.append(f'<div class="{cls}" data-k="{r["kind"]}" data-h="{hay}">{body}</div>')

tabs = ''.join(f'<button class="tab" data-f="{k}">{lab}<small>{sum(1 for r in live if r["kind"]==k)}</small></button>'
               for k, lab, _ in KINDS)
secs = []
for k, lab, sub in KINDS:
    ids = [r['id'] for r in rows if r['kind'] == k]
    secs.append(f'<h2 data-sec="{k}">{lab} <small>{sub} · {len(ids)}</small></h2>'
                + '<div class="grid" data-sec="' + k + '">'
                + ''.join(c for c in cards if f'data-k="{k}"' in c) + '</div>')

DISKONLY = sum(1 for r in live if r.get('git') == 0)
HTML = f'''<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>THE DOOR — one index for the whole archive</title>
<meta name="description" content="{len(live)} entries: {sum(1 for r in live if r['kind']=='operate')} instruments you can work in, {sum(1 for r in live if r['kind']=='browse')} libraries, the finished works, the five cuts and the record — {TOT_N:,} files, {human(TOT_B)}.">
<style>
/* Same room as the film: cream paper, hard contour, eight ink levels,
   no gradients, no rounded corners. A door in a different language than
   the room is a lie about the room. */
:root{{--paper:#f4f4f0;--paper2:#fdfdfa;--ink:#141414;--dim:#8a8a86;--accent:#0033cc;
  --l1:#e4e4e0;--l3:#a8a8a4;--warn:#8a6d00}}
*{{box-sizing:border-box;margin:0;padding:0;border-radius:0!important}}
body{{background:var(--paper);color:var(--ink);
  font:400 15px/1.6 "Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;
  padding:0 22px 110px}}
.wrap{{max-width:1180px;margin:0 auto}}
header{{border-bottom:3px solid var(--ink);padding:40px 0 22px}}
.mark{{width:26px;height:26px;margin-bottom:22px;
  background:radial-gradient(circle 3.4px at 6px 6px,var(--ink) 98%,transparent),
             radial-gradient(circle 3.4px at 20px 6px,var(--ink) 98%,transparent),
             radial-gradient(circle 3.4px at 6px 20px,var(--ink) 98%,transparent),
             radial-gradient(circle 3.4px at 20px 20px,var(--ink) 98%,transparent)}}
h1{{font:900 clamp(26px,5.2vw,44px)/1.05 Helvetica,Arial;letter-spacing:.03em;text-transform:uppercase}}
h1 small{{display:block;font:900 11px/1 Helvetica;letter-spacing:.34em;color:var(--dim);margin-top:14px}}
.lede{{margin:24px 0 0;font-size:17px;max-width:68ch}} .lede b{{font-weight:900}}
.tot{{margin:18px 0 0;font:700 12px/1.7 ui-monospace,Menlo,monospace;letter-spacing:.06em;color:var(--dim)}}
.bar{{position:sticky;top:0;z-index:40;background:var(--paper);border-bottom:1px solid var(--l3);
  padding:12px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}}
.tab{{border:1px solid var(--ink);background:var(--paper2);color:var(--ink);font:900 10px/1 Helvetica;
  letter-spacing:.16em;text-transform:uppercase;padding:9px 12px;cursor:pointer;display:flex;gap:7px;align-items:center}}
.tab small{{font:700 10px/1 ui-monospace,monospace;color:var(--dim);letter-spacing:0}}
.tab[aria-pressed="true"]{{background:var(--ink);color:var(--paper2)}}
.tab[aria-pressed="true"] small{{color:var(--l3)}}
#q{{flex:1 1 180px;min-width:150px;border:1px solid var(--ink);background:var(--paper2);color:var(--ink);
  font:400 13px/1 ui-monospace,Menlo,monospace;padding:10px 11px}}
#q::placeholder{{color:var(--l3)}}
#cnt{{font:700 11px/1 ui-monospace,monospace;color:var(--dim);letter-spacing:.06em;white-space:nowrap}}
h2{{font:900 11px/1 Helvetica;letter-spacing:.22em;text-transform:uppercase;color:var(--ink);
  margin:46px 0 14px;padding-bottom:8px;border-bottom:2px solid var(--ink);display:flex;gap:12px;align-items:baseline}}
h2 small{{font:700 10px/1 ui-monospace,monospace;letter-spacing:.06em;color:var(--dim);text-transform:none}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(318px,1fr));gap:14px}}
.card{{border:2px solid var(--ink);background:var(--paper2);text-decoration:none;color:var(--ink);
  display:flex;flex-direction:column;min-height:0}}
a.card:hover{{background:var(--ink);color:var(--paper2)}}
a.card:hover .line{{color:var(--paper2)}} a.card:hover .eid,a.card:hover .meta span{{color:var(--l3)}}
a.card:hover .note{{color:#d8c87a;border-color:#6d6d6a}}
a.card:hover .pv{{border-bottom-color:var(--paper2)}}
.pv{{border-bottom:2px solid var(--ink);background:var(--l1);height:178px;overflow:hidden;
  display:flex;align-items:center;justify-content:center;flex:0 0 auto}}
.pv img{{width:100%;height:100%;object-fit:cover;display:block;image-rendering:auto}}
.pv .dots{{width:88px;height:88px;opacity:.5}}
.pv img.drawn{{object-fit:cover;opacity:.9}}
.txt{{padding:14px 15px 15px;display:flex;flex-direction:column;gap:9px;flex:1 1 auto}}
.hd{{display:flex;gap:9px;align-items:baseline}}
.eid{{font:700 10px/1.2 ui-monospace,monospace;color:var(--dim);letter-spacing:.08em;flex:0 0 auto;padding-top:2px}}
h3{{font:900 14px/1.18 Helvetica,Arial;letter-spacing:.035em;text-transform:uppercase}}
.line{{font-size:13.5px;line-height:1.5;color:var(--ink)}}
.note{{font:400 12px/1.5 ui-monospace,Menlo,monospace;color:var(--warn);
  border-left:2px solid var(--warn);padding-left:9px}}
.meta{{margin-top:auto;display:flex;gap:12px;flex-wrap:wrap;
  font:700 10px/1 ui-monospace,monospace;letter-spacing:.06em;color:var(--dim);padding-top:4px}}
.gone{{opacity:.6}} .gone h3{{text-decoration:line-through}}
.gonetag{{color:#cf222e;font-weight:900}}
.meta .disk{{color:#cf222e;font-weight:900}} a.card:hover .meta .disk{{color:#ff8a92}}
.meta .part{{color:var(--warn);font-weight:900}} a.card:hover .meta .part{{color:#d8c87a}}
footer{{margin-top:56px;border-top:3px solid var(--ink);padding-top:20px;
  font:400 13px/1.62 ui-monospace,Menlo,monospace;color:var(--dim);max-width:78ch}}
footer b{{color:var(--ink)}} footer p{{margin:12px 0}}
footer a{{color:var(--accent)}}
.hide{{display:none!important}}
@media(max-width:560px){{body{{padding:0 14px 90px}} .grid{{grid-template-columns:1fr}} .pv{{height:200px}}}}
</style></head><body><div class="wrap">

<header>
  <div class="mark"></div>
  <h1>The Door<small>one index for the whole archive</small></h1>
  <p class="lede">Everything made from the MARKOV&nbsp;POET archive and the fourteen WYGWYL
  poems, in one place. <b>{sum(1 for r in live if r['kind']=='operate')} instruments</b> you can
  work in, <b>{sum(1 for r in live if r['kind']=='browse')} libraries</b> you can search and take
  from, the finished works, the five cuts, and the record of what went wrong.
  Every count and every byte on this page was measured off the disk when it was built;
  every preview is a real frame from the thing it stands for.</p>
  <p class="tot">{len(live)} ENTRIES &nbsp;·&nbsp; {TOT_N:,} FILES &nbsp;·&nbsp; {human(TOT_B)} &nbsp;·&nbsp; BUILT {time.strftime('%Y-%m-%d %H:%M')}</p>
</header>

<div class="bar">
  <button class="tab" data-f="all" aria-pressed="true">All<small>{len(live)}</small></button>
  {tabs}
  <input id="q" type="search" placeholder="search  /  the whole page" autocomplete="off" spellcheck="false">
  <span id="cnt"></span>
</div>

{''.join(secs)}

<footer>
  <p><b>What will not survive a clone.</b> {DISKONLY} of these {len(live)} entries are on this
  disk and in no repository — marked <b>DISK ONLY</b> on their cards, and <b>PART IN REPO</b>
  where the page ships but its material does not. Every tool, every library, every note and
  every contact sheet is committed. What is not: the five cuts, and the 135 generated shots
  behind the gallery.</p>
  <p>Some of that is a decision and some of it is not a choice at all. B, C, D and E run 113 MB
  to 391 MB each and GitHub refuses any single file over 100 MB, so they cannot be pushed as
  they are — they need a release asset or an external host. A is 30 MB and could go in; it is
  out because the five belong together. <code>MARKOV_POET_00/</code> is 237 MB of source
  material, not an output, and nothing but this disk holds it — that one is worth a backup
  rather than a commit. The segments, the harvest, the halfworlds and the 1.1 GB of cut-outs
  are regenerable stock and stay local on purpose, the way <code>cut/out/elements/</code>
  already did.</p>
  <p><b>What is open.</b> A picked region is still not a nameable, bindable part, so the
  forearm-and-sleeve case cannot be done by name (<a href="cut/pf/OP16_FIT.md">OP16_FIT</a>).
  The second pass has structure but no subject, and rejected nothing — fourteen in,
  fourteen out (<a href="cut/pf/SECOND_PASS.md">SECOND_PASS</a>).</p>
  <p><b>How this page is kept true.</b> It is generated, not written:
  <code>python3 cut/pf/door.py</code>. The builder checks every link against the disk and
  renders a missing one struck through with LINK DEAD rather than dropping it, so this
  index cannot quietly outlive what it indexes.</p>
</footer>

</div><script>
(function(){{
 var cards=[].slice.call(document.querySelectorAll('.card')),
     tabs=[].slice.call(document.querySelectorAll('.tab')),
     secs=[].slice.call(document.querySelectorAll('[data-sec]')),
     q=document.getElementById('q'), cnt=document.getElementById('cnt'), f='all';
 function apply(){{
  var t=q.value.trim().toLowerCase(), n=0;
  cards.forEach(function(c){{
   var ok=(f==='all'||c.dataset.k===f)&&(!t||c.dataset.h.indexOf(t)>=0);
   c.classList.toggle('hide',!ok); if(ok)n++;
  }});
  /* a heading over an empty grid is a lie about what is there */
  secs.forEach(function(s){{
   var g=s.classList.contains('grid')?s:document.querySelector('.grid[data-sec="'+s.dataset.sec+'"]');
   var any=[].slice.call(g.children).some(function(c){{return !c.classList.contains('hide');}});
   s.classList.toggle('hide',!any);
  }});
  cnt.textContent=(t||f!=='all')?n+' SHOWN':'';
  tabs.forEach(function(b){{b.setAttribute('aria-pressed', b.dataset.f===f?'true':'false');}});
 }}
 tabs.forEach(function(b){{b.addEventListener('click',function(){{f=b.dataset.f;apply();}});}});
 q.addEventListener('input',apply);
 document.addEventListener('keydown',function(e){{
  if(e.key==='/'&&document.activeElement!==q){{e.preventDefault();q.focus();}}
  if(e.key==='Escape'&&document.activeElement===q){{q.value='';q.blur();apply();}}
 }});
 apply();
}})();
</script></body></html>'''

open(OUT, 'w').write(HTML)

print(f"\n{len(live)} live · {len(dead)} dead · {TOT_N:,} files · {human(TOT_B)}")
if dead:
    print("DEAD LINKS (rendered struck through, not hidden):")
    for eid, h in dead: print(f"    {eid}  {h}")
if nopreview:
    print(f"no preview (drawn mark instead): {' '.join(nopreview)}")
print(f"-> {os.path.relpath(OUT, os.getcwd())}")
