# MATRIX O — OLOG STRUCTURAL MAP
**SOURCE** `wygwyl/footage/01-out-of-life-lead.mp4` · 1280×720 · 24fps · 88.38s · AAC 44.1k stereo
**TC BASE** no timecode track on the source; all times estimated from `01:00:00:00`
**METHOD** ffmpeg scene-score sweep at 24fps, then eye verification at 2fps across every candidate
boundary. Every boundary below was looked at. Nothing here is inferred from metadata alone.

## BRUTAL STRUCTURAL DIAGNOSIS

- **The scene detector is nearly blind on this material and that is a property of the footage, not
  the tool.** Only three cuts score above 0.25 (04:09, 29:19, 39:07). Four more hard cuts score
  between 0.06 and 0.10 — below any usable threshold — because every shot in the piece is a dark
  silhouette against teal or white, so consecutive shots have near-identical luma histograms. Any
  automatic conform against this source will drop half the cuts. **Cut it by eye or cut it wrong.**

- **The piece hides its own handoffs behind dissolves at exactly the three points where the space
  changes most.** Neon plaza → bedroom (18:12–19:12), bedroom-smoke → brick alley (34:12), CRT →
  bedroom-smoke (46:12). Three of the six space changes are mixes, not cuts, so the spatial
  discontinuity has to be reconstructed from what enters frame rather than from the edit.

- **Shot length collapses in the middle third and the patch law breaks there.** Shots 6, 7, 10 and
  11 run 3.2–4.8s, under the 6s patch floor. The piece accelerates from 7–10s shots to 4s shots
  exactly across the vape/roof/fall passage, then holds an 11.4s single for the spark tunnel. That
  acceleration is the only tempo argument the edit makes and it is legible.

- **The body is never identified.** No shot resolves a face until 01:01:22:00 — six seconds before
  the end, at which point the camera is close enough that identification is unavoidable. Every
  prior shot is back-of-head, three-quarter-dark, hooded, or silhouetted. Whether this is
  concealment strategy or generation-limit strategy, the structural consequence is identical: the
  piece cannot use identity as a cut motivation, so it uses **light state** instead.

- **Two graphic events sit inside the diegesis rather than over it.** The neon OUT OF LIFE at
  11:14–18:12 is built as a practical light source in a wet plaza with its own reflections; the
  WHERE YOU GO WHEN YOU LEAVE at 80:10 is a flat super. The first is a location. The second is a
  card. They are not the same kind of object and should not be conformed onto the same track.

- **A 3.1s contentless head.** The first cut is at 04:09 and the road before it is empty of bodies.
  Anything cut against this source can steal 0–4s for a pre-roll without losing an event.

## OLOG MAP

    <diegetic field>            [is bounded by]        <88.38s single continuous piece>
    <diegetic field>            [contains]             <15 shots, 6 hard cuts, 3 dissolves>
    <entity: MAN>               [is present in]        <13 of 15 shots>
    <entity: MAN>               [is never resolved as] <a face, until 01:01:22:00>
    <location: WET ROAD>        [precedes]             <location: NEON PLAZA>
    <location: NEON PLAZA>      [dissolves into]       <location: BEDROOM>
    <location: BEDROOM>         [hard cuts to]         <location: SMOKE ROOM>
    <location: SMOKE ROOM>      [dissolves into]       <location: BRICK ALLEY>
    <location: BRICK ALLEY>     [hard cuts to]         <location: CRT ROOM>
    <location: CRT ROOM>        [dissolves into]       <location: SMOKE ROOM>
    <location: SMOKE ROOM>      [hard cuts to]         <location: LEDGE>
    <location: LEDGE>           [is exited by]         <MAN, downward, out of frame top>
    <threshold: LEDGE EDGE>     [is crossed at]        <01:00:57:12>
    <threshold: LEDGE EDGE>     [converts]             <action vector: LATERAL> into <VERTICAL>
    <action vector: LATERAL>    [governs]              <shots 1–10>
    <action vector: VERTICAL>   [governs]              <shots 11–15>
    <camera relation>           [reverses at]          <01:01:14:07>
    <camera: BEHIND SUBJECT>    [becomes]              <camera: BELOW SUBJECT, FACING>
    <obstacle: SMOKE>           [recurs in]            <SMOKE ROOM, BRICK ALLEY, LEDGE, END BLACK>
    <obstacle: SMOKE>           [is the only]          <element present in every location>
    <light state: TEAL>         [governs]              <shots 1–5>
    <light state: BLUE>         [governs]              <shots 6, 9>
    <light state: WHITE STEAM>  [governs]              <shots 7, 10, 11, 12>
    <light state: GOLD RADIAL>  [governs]              <shots 13, 14>
    <light state: BLACK>        [governs]              <shot 15>
    <sound state>               [is segmented by]      <25 silences over 0.45s>
    <sound state: SILENCE>      [does not align with]  <any picture cut except 01:00:11:14>
    <graphic: OUT OF LIFE>      [is]                   <a practical source inside the plaza>
    <graphic: WHERE YOU GO…>    [is]                   <a flat super over picture>
    <object: NONE>              [is transferred in]    <any shot>
    <pressure: CONCEALMENT>     [is expressed as]      <backlight, hood, steam, distance>
    <pressure: DESCENT>         [is expressed as]      <one threshold crossing and four fall shots>

## STRUCTURAL CONSEQUENCES

**Segmentation logic revealed.** The piece is not segmented by action and it is not segmented by
location. It is segmented by **light state**, in five blocks — TEAL, BLUE, WHITE, GOLD, BLACK — and
every hard cut in the piece falls on a light-state boundary while every dissolve falls *inside*
one. That is the machine. A conform that respects light state will match the source's own logic;
a conform that respects location will fight it.

**Most important patch triggers, in order of reliability on this source.**
1. **Light state change.** Fires on all six hard cuts. The only trigger that never misses.
2. **Camera distance/angle change.** Fires once, decisively, at `01:01:14:07`. It is the single
   most important structural event in the piece — the body stops being watched and starts arriving.
3. **Threshold crossing.** Fires once, at `01:00:57:12`. Converts the whole kinetic vector.
4. **Entity exit.** Fires at `01:00:57:12` and `01:01:22:07`.
5. **Scene score.** Fires on three of six cuts. **Do not trust it on this material.**
