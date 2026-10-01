#!/usr/bin/env python3
"""
THE ENTRIES — what is in the archive, declared.

Shared by cut/pf/door.py (which builds the page) and cut/pf/strips.py (which
looks at every entry and chooses what to show of it). Declared in one place
because two copies of a list like this diverge inside a week.

What a thing IS cannot be measured and is written here by hand. Everything else
— counts, bytes, dates, which frame is the most telling one, what makes each
entry unlike the others — is measured by the two passes that read this file.
"""

IMGX = ('.png', '.jpg', '.jpeg', '.webp')
VIDX = ('.mp4', '.mov', '.m4v')
AUDX = ('.wav', '.m4a', '.mp3', '.aac', '.flac', '.ogg')

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
 ('F01','watch','A · THE PQ REEL','cut/out/script/A.html',
  'The reel that never re-encodes: every shot passed through at its real duration, 5.04s to 39.17s, so the HDR is not thrown away by being flattened.',
  '29 MB.'),
 ('F02','watch','B · THE WINDOW AND THE DOOR','cut/out/script/B.html',
  'The suite cut to its own script — 111 stanzas with screen text, voiceover and an image-function, which no previous cut had ever referenced.',
  '373 MB.'),
 ('F03','watch','C · THE DECK AT 60BPM','cut/out/script/C.html',
  'Cut to a grid: one bar per shot at sixty beats per minute, with its own score.',
  '243 MB. A silent version sits beside it.'),
 ('F04','watch','D · THE DOOR','cut/out/script/D.html',
  'Ends on P014 — the single shot in the whole archive of an open, lit doorway, which had been sitting in the middle of poem 01.',
  '108 MB.'),
 ('F05','watch','E · THE DOOR, SCORED','cut/out/script/E.html',
  'D again, carried on mareamemory 06.',
  '125 MB. Silent version beside it.'),
 ('F08','watch','THE SCRIPTS \u2014 ALL FIVE CUTS, READABLE','cut/out/script/index.html',
  'Each cut written out shot by shot: its own mid-frame, where it lands, how long it holds, the '
  'stanza it serves, the screen text or the line of the poem it carries, and the source clip and '
  'second it was taken from. 424 shots across the five, every one with a frame on file.',
  'This is the film written down, not the film. It is also the only way to read the cuts without '
  'the 920 MB of mp4, and it is what an editor relinks from.'),
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
 ('R08','read','THE EXCHANGE','cut/out/script/exchange.html',
  'What another editing room needs: an EDL, an OTIO, a JSON event list and a cue sheet for every '
  'cut \u2014 source clip, source timecode, record timecode, duration, stanza and label, shot by shot.',
  'Under cut/out/ beside the cuts themselves. Relinking needs the source shots in '
  'MARKOV_POET_00/, which is 237 MB and is not in the repository.'),
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
 # the card points at the page; the size and date still come from the file
 'F01':'cut/out/WYGWYL_A_THE_PQ_REEL.mp4',
 'F02':'cut/out/WYGWYL_B_THE_WINDOW_AND_THE_DOOR.mp4',
 'F03':'cut/out/WYGWYL_C_THE_DECK_60BPM.mp4',
 'F04':'cut/out/WYGWYL_D_THE_DOOR.mp4',
 'F05':'cut/out/WYGWYL_E_THE_DOOR_mareamemory_06.mp4',

 'F08':'cut/out/script',
 'R08':['cut/out/WYGWYL_A_THE_PQ_REEL.edl','cut/out/WYGWYL_B_THE_WINDOW_AND_THE_DOOR.edl',
        'cut/out/WYGWYL_C_THE_DECK_60BPM.edl','cut/out/WYGWYL_D_THE_DOOR.edl',
        'cut/out/WYGWYL_E_THE_DOOR_mareamemory_06.edl'],
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
 'L05':['MARKOV_POET','MARKOV_POET_00'],
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
 'F08':'cut/frames',
 'F08':'cut/frames',

 'S02':'cut/out/thumbs',
 'L01':'cut/out/collage/GRID_ALL.webp',
 'L02':'cut/out/lucier',
 'L03':'cut/out/scene',
 'L04':'../audio/plates',
 'L05':'MARKOV_POET_00/thumbnails',
}
# notes get a drawn mark, never the only picture that happens to sit in their folder
NOPREVIEW = {'R01','R02','R03','R04','R05','R06','R08'}

KINDS = [('operate','OPERATE','tools you work in'),
         ('browse','BROWSE','libraries you search and take from'),
         ('look','LOOK','finished images'),
         ('watch','WATCH','the cuts'),
         ('stock','STOCK','the material it was all cut from'),
         ('read','READ','the record')]



# ------------------------------------------------------------------ the ways in
# THE DOOR opens on 55 entries in six registers, which is the right shape for
# someone who already knows the work and the wrong shape for everyone else.
# These are routes: a handful of entries in an order, for a named person.
PATHS = [
 ('FOR THE POET', 'his own film, his own words, and what was made out of them',
  [('F08', 'read the cut shot by shot — every frame with the line it carries'),
   ('R06', 'which stanza each of the 135 shots actually covers'),
   ('W01', 'fourteen posters, one per poem'),
   ('W02', 'the same fourteen rebuilt, each with a voice of its own'),
   ('L03', '107 zettels — every collage with a prompt written for it'),
   ('F06', 'the fourteen poems as a suite, playing in the browser')]),
 ('FOR AN EDITOR', 'everything another cutting room needs to take this apart',
  [('R08', 'EDL, OTIO, JSON and a cue sheet for all five cuts'),
   ('F08', 'the relink sheet: source clip and in-point for all 424 shots'),
   ('F07', 'the coverage matrix — what is covered and what is not'),
   ('L01', '2,275 images with their prompts, downloadable by the row'),
   ('R01', 'the ledger: what was wrong with the previous cuts, and how')]),
 ('TO MAKE SOMETHING', 'the benches, in the order they make sense',
  [('I01', 'the patch studio — lay images into the ink field and bind them'),
   ('I05', '2,033 cut-out subjects to pull from'),
   ('I04', 'the blend table: nine ways one grid can meet another'),
   ('L04', '1,095 sounds, imaged and named, searchable in language'),
   ('I23', 'and the five cuts to put it back into')]),
]
