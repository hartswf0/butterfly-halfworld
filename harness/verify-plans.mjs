/* harness/verify-plans.mjs — assert the five BUTTERFLY plans are geometrically sane.
   ============================================================================
   Usage:  node harness/verify-plans.mjs
   Exit 0 = every assertion holds. Exit 1 = at least one failed.
   Prints real numbers, never impressions (BUILD-BRIEF S6/S7).

   The frame is the harness default, 1120 x 760 CSS px (harness/render-scene-harness
   .html line 9), rendered at DPR 2. All pixel figures are CSS px; device px are 2x.

   ASSERTIONS
     A   no two DISTINCT stations project within 2px of each other, unless they are a
         declared adjacency (contactPairs or impactPairs). An adjacency is a claim, not
         an escape hatch: A' separately asserts every declared pair projects between
         3px and 40px apart, so a pair that has collapsed to one point fails as loudly
         as one that was never a contact.
     B   every station projects inside the frame, with a 4px margin.
     C   projected depth order matches z order, pairwise and signed. Any station with
         z < 0.08 would be clamped by project() and would break C silently, so C also
         range-checks every z.
     D   EVERY EXPORTED ORDERED ARRAY IS MONOTONIC IN THE AXIS IT CLAIMS TO TRAVERSE.
         This world animates and SWEEP/ADVANCE/TRACE consume ordered lists; an
         unordered one is a silent, unrenderable bug. Four axes are legal:
           "x"     strictly monotonic in station.x, sign = dir
           "z"     strictly monotonic in station.z, sign = dir
           "theta" strictly monotonic in UNWRAPPED atan2(z-cz, x-cx) about `about`,
                   sign = dir. Unwrapped, because a ring that crosses atan2's branch
                   cut at +/-PI is still a ring and a naive check would reject it.
           "cycle" NOT monotonic in x or in z (a monotonic cycle is a line), no
                   repeated station, and first..last separated by more than 0 and less
                   than 60px — it comes back near where it began but NOT to it.
                   MOTION-BRIEF: a living cycle is open and drifts; only an apparatus
                   closes. The check enforces the drift.
     B'  every fixture (props, paths, sightlines) names stations that exist.
     E   occupancy and moves reference stations that exist, and no two bodies exit a
         unit standing on the same station.
     F   cross-plan ties: a station declared identical in two plans must carry the
         same name in both. Reported with both projected positions, since the two
         plans have different cameras and the pixel values are SUPPOSED to differ.
   ============================================================================ */
import { project } from "../engine/blocking.mjs";
import { readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const W = 1120, H = 760, MARGIN = 4;
const MIN_SEP = 2, PAIR_MIN = 3, PAIR_MAX = 40;
const CYCLE_RETURN_MAX = 60;

const PLANS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "scenes", "_plans");
const files = readdirSync(PLANS_DIR).filter(f => f.endsWith(".mjs")).sort();

/* AUTO-DISCOVERY. Every module in scenes/_plans/ that default-exports a plan is
   checked, plus anything it lists in `extraPlans` — the-maze exports TWO plans from
   one authored geometry (one camera outside the box, one inside it) and both must be
   verified or the second camera is unchecked. A module may also declare
   `isPlan = false` if it refuses to be a space; nothing here does, but the sibling
   world's the-feed did and the hook is kept. */
const MODULES = [];
for (const file of files){
  const mod = await import(pathToFileURL(resolve(PLANS_DIR, file)).href);
  if (mod.isPlan === false){
    console.log(`   SKIP  ${file} — declares isPlan:false (a surface, not a space)`);
    continue;
  }
  const plan = mod.default;
  if (!plan?.stations || typeof plan.names !== "function"){
    console.log(`   SKIP  ${file} — no default-exported plan`);
    continue;
  }
  MODULES.push({ key: plan.id, mod, plan, file, primary: true });
  for (const extra of (mod.extraPlans || [])){
    MODULES.push({ key: extra.id, mod, plan: extra, file, primary: false });
  }
}

let failures = 0;
const fail = (m) => { failures++; console.log(`   FAIL  ${m}`); };
const px = (s) => { const p = project(s); return { x:p.x*W, y:p.y*H, d:p.d }; };
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const f = (n,k=2) => n.toFixed(k);

const TOTALS = { stations:0, pairs:0, sepChecks:0, orderChecks:0, runs:0, runSteps:0 };

for (const { key, mod, plan, primary } of MODULES){
  const names = plan.names();
  const P = Object.fromEntries(names.map(n => [n, px(plan.stations[n])]));
  /* impactPairs are declared adjacencies that are NOT on walkable ground — the-maze
     declares the strike on the acrylic lid that way, because a butterfly hitting a
     roof is a real contact with something that is not floor. They are exempt from A
     and held to the same A' band, and are counted separately so that the rule
     "contact pairs go on walkable ground" stays legible rather than quietly bent. */
  const walkPairs   = primary ? (mod.contactPairs || []) : (plan.contactPairs || []);
  const impactPairs = primary ? (mod.impactPairs   || []) : (plan.impactPairs   || []);
  const pairs = [...walkPairs, ...impactPairs];
  const pairKey = new Set(pairs.map(([a,b]) => [a,b].sort().join(" ")));

  TOTALS.stations += names.length;
  TOTALS.pairs += pairs.length;

  console.log(`\n=== ${key} — "${plan.name}"`);
  console.log(`    ${names.length} stations · ${walkPairs.length} contact pairs · ` +
              `${impactPairs.length} impact pairs · ${primary ? "primary" : "derived camera"}`);

  /* ---- A: separation ----------------------------------------------------- */
  let minNonPair = Infinity, minNonPairAt = null, violA = 0, checked = 0;
  for (let i=0;i<names.length;i++) for (let j=i+1;j<names.length;j++){
    const a = names[i], b = names[j];
    if (pairKey.has([a,b].sort().join(" "))) continue;
    checked++;
    const dpx = dist(P[a], P[b]);
    if (dpx < minNonPair){ minNonPair = dpx; minNonPairAt = [a,b]; }
    if (dpx < MIN_SEP){ violA++;
      fail(`A  [${key}] ${a} / ${b} project ${f(dpx)}px apart (< ${MIN_SEP}px) and are not declared adjacent`); }
  }
  TOTALS.sepChecks += checked;
  console.log(`  A  ${checked} non-adjacent station pairs checked; closest = ` +
              `${minNonPairAt ? minNonPairAt.join(" / ") : "n/a"} at ${f(minNonPair)}px  ` +
              `${violA?`[${violA} VIOLATIONS]`:"[ok]"}`);

  /* ---- A': the declared pairs themselves --------------------------------- */
  const pairRows = [];
  for (const [a,b] of pairs){
    if (!plan.has(a) || !plan.has(b)){ fail(`A' [${key}] pair names an unknown station: ${a} / ${b}`); continue; }
    const dpx = dist(P[a], P[b]);
    pairRows.push([`${a} / ${b}`, dpx]);
    if (dpx < PAIR_MIN) fail(`A' [${key}] pair ${a} / ${b} has collapsed: ${f(dpx)}px (< ${PAIR_MIN}px)`);
    if (dpx > PAIR_MAX) fail(`A' [${key}] pair ${a} / ${b} is not a contact: ${f(dpx)}px (> ${PAIR_MAX}px)`);
  }
  if (pairRows.length){
    const ds = pairRows.map(r=>r[1]);
    console.log(`  A' ${pairRows.length} declared pairs span ${f(Math.min(...ds))}px .. ${f(Math.max(...ds))}px  [ok]`);
    for (const [n,d] of pairRows.sort((a,b)=>a[1]-b[1])) console.log(`       ${f(d).padStart(6)}px  ${n}`);
  }

  /* ---- B: inside the frame ----------------------------------------------- */
  let violB = 0, minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  for (const n of names){
    const p = P[n];
    minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x);
    minY=Math.min(minY,p.y); maxY=Math.max(maxY,p.y);
    if (p.x < MARGIN || p.x > W-MARGIN || p.y < MARGIN || p.y > H-MARGIN){
      violB++; fail(`B  [${key}] ${n} projects to (${f(p.x,1)}, ${f(p.y,1)}) — outside ${W}x${H} minus ${MARGIN}px`); }
  }
  console.log(`  B  x span ${f(minX,1)} .. ${f(maxX,1)} of ${W};  y span ${f(minY,1)} .. ${f(maxY,1)} of ${H}  ` +
              `${violB?`[${violB} VIOLATIONS]`:"[ok]"}`);

  /* ---- C: depth ordering -------------------------------------------------- */
  let violC = 0, orderChecks = 0;
  const zOf = (n) => plan.stations[n].z;
  for (const n of names){
    if (zOf(n) < 0.08 || zOf(n) > 1){ violC++;
      fail(`C  [${key}] ${n} has z=${zOf(n)} outside [0.08, 1] — project() clamps it and depth order breaks silently`); }
  }
  for (let i=0;i<names.length;i++) for (let j=i+1;j<names.length;j++){
    const a=names[i], b=names[j]; orderChecks++;
    const sz = Math.sign(zOf(a)-zOf(b)), sy = Math.sign(P[a].y-P[b].y);
    if (sz !== sy){ violC++;
      fail(`C  [${key}] depth inversion: ${a}(z=${zOf(a)}, y=${f(P[a].y,2)}) vs ${b}(z=${zOf(b)}, y=${f(P[b].y,2)})`); }
  }
  TOTALS.orderChecks += orderChecks;
  const zs = names.map(zOf);
  console.log(`  C  z range ${f(Math.min(...zs),3)} .. ${f(Math.max(...zs),3)}; ` +
              `${orderChecks} pairwise orderings  ${violC?`[${violC} VIOLATIONS]`:"[ok]"}`);

  /* ---- D: ordered runs are monotonic in the axis they claim ---------------- */
  const runs = (primary ? (mod.orderedRuns || []) : (plan.orderedRuns || []));
  if (runs.length){
    for (const run of runs){
      TOTALS.runs++;
      const { id, axis, dir = 1, stations: st = [], about, motion, units } = run;
      let bad = 0;
      const missing = st.filter(n => !plan.has(n));
      if (missing.length){ bad++; fail(`D  [${key}] run ${id} names unknown stations: ${missing.join(", ")}`); }
      if (st.length < 2){ bad++; fail(`D  [${key}] run ${id} has ${st.length} station(s) — a motion cannot traverse that`); }
      if (new Set(st).size !== st.length){ bad++; fail(`D  [${key}] run ${id} repeats a station`); }
      TOTALS.runSteps += Math.max(0, st.length - 1);
      if (missing.length || st.length < 2) continue;

      let series = null, label = axis;
      if (axis === "x") series = st.map(n => plan.stations[n].x);
      else if (axis === "z") series = st.map(n => plan.stations[n].z);
      else if (axis === "theta"){
        const c = plan.stations[about];
        if (!c){ bad++; fail(`D  [${key}] run ${id} axis theta names unknown centre "${about}"`); }
        else {
          const raw = st.map(n => Math.atan2(plan.stations[n].z - c.z, plan.stations[n].x - c.x));
          series = [raw[0]];
          for (let i=1;i<raw.length;i++){
            let v = raw[i];
            while (v - series[i-1] >  Math.PI) v -= 2*Math.PI;
            while (v - series[i-1] < -Math.PI) v += 2*Math.PI;
            series.push(v);
          }
          label = `theta about ${about} (unwrapped)`;
        }
      }
      else if (axis === "cycle"){
        const xs = st.map(n => plan.stations[n].x), zr = st.map(n => plan.stations[n].z);
        const mono = (a) => a.every((v,i) => i===0 || v > a[i-1]) || a.every((v,i) => i===0 || v < a[i-1]);
        if (mono(xs) || mono(zr)){ bad++;
          fail(`D  [${key}] run ${id} claims axis "cycle" but is monotonic in ${mono(xs)?"x":"z"} — that is a line, not a cycle`); }
        const close = dist(P[st[0]], P[st[st.length-1]]);
        if (!(close > 0)){ bad++; fail(`D  [${key}] run ${id} closes exactly (${f(close)}px). MOTION-BRIEF: a living cycle drifts.`); }
        if (close > CYCLE_RETURN_MAX){ bad++;
          fail(`D  [${key}] run ${id} does not return: first..last ${f(close)}px (> ${CYCLE_RETURN_MAX}px)`); }
        console.log(`  D  ${id.padEnd(24)} ${String(st.length).padStart(3)} stations · axis cycle · ` +
                    `drift first..last ${f(close)}px · ${motion} ${units?.join(",")||""}  ${bad?"[FAIL]":"[ok]"}`);
        continue;
      }
      else { bad++; fail(`D  [${key}] run ${id} declares unknown axis "${axis}"`); }

      if (series){
        let breaks = 0, minStep = Infinity;
        for (let i=1;i<series.length;i++){
          const step = (series[i] - series[i-1]) * Math.sign(dir);
          if (step <= 0){ breaks++; bad++;
            fail(`D  [${key}] run ${id} is not monotonic in ${label}: ${st[i-1]} -> ${st[i]} steps ${f(step,5)} (dir ${dir})`); }
          minStep = Math.min(minStep, step);
        }
        console.log(`  D  ${id.padEnd(24)} ${String(st.length).padStart(3)} stations · axis ${label} dir ${dir>0?"+1":"-1"} · ` +
                    `smallest step ${f(minStep,5)} · ${motion} ${units?.join(",")||""}  ` +
                    `${breaks?`[${breaks} BREAKS]`:"[ok]"}`);
      }
    }
  } else {
    console.log(`  D  no ordered runs declared`);
  }

  /* ---- B': fixtures reference real stations -------------------------------
     Cheap, and it caught a `wall_1988` that had to actually exist on a generated
     wall before the sightline naming it meant anything. */
  let fxN = 0, fxBad = 0;
  for (const fx of (plan.fixtures || [])){
    for (const n of [...(fx.along || []), ...(fx.at ? [fx.at] : []), ...(fx.between || [])]){
      fxN++;
      if (!plan.has(n)){ fxBad++; fail(`B' [${key}] fixture ${fx.id} names unknown station "${n}"`); }
    }
  }
  console.log(`  B' ${(plan.fixtures||[]).length} fixtures, ${fxN} station references  ` +
              `${fxBad?`[${fxBad} VIOLATIONS]`:"[ok]"}`);

  /* ---- E: occupancy + moves reference real stations, and nobody overlaps --- */
  if (primary){
    let occN = 0, occBad = 0, mvN = 0;
    for (const [k,v] of Object.entries(mod)){
      if (/^MOVES_/.test(k) && Array.isArray(v)){
        for (const m of v){ mvN++;
          for (const s of [m.from, m.to]) if (!plan.has(s)){ occBad++; fail(`E  [${key}] ${k} references unknown station "${s}"`); } }
      }
    }
    const sinks = new Set(mod.occupancySinks || []);
    for (const [scene, occ] of Object.entries(mod.exitOccupancy || {})){
      const seen = new Map();
      for (const [who, st] of Object.entries(occ)){
        occN++;
        if (!plan.has(st)){ occBad++; fail(`E  [${key}] exitOccupancy[${scene}].${who} = "${st}" is not a station`); continue; }
        if (sinks.has(st)) continue;
        if (seen.has(st)){ occBad++; fail(`E  [${key}] ${scene}: ${seen.get(st)} and ${who} both exit on "${st}"`); }
        else seen.set(st, who);
      }
    }
    const scenes = Object.keys(mod.exitOccupancy || {});
    console.log(`  E  ${scenes.length} unit(s) blocked [${scenes.join(", ")}]; ${mvN} moves, ` +
                `${occN} occupancy entries  ${occBad?`[${occBad} VIOLATIONS]`:"[ok]"}`);
    for (const s of scenes){
      const occ = mod.exitOccupancy[s];
      console.log(`       ${s.padEnd(6)} exit -> ${Object.entries(occ).map(([k,v])=>`${k}:${v}`).join("  ")}`);
    }
  }
}

/* ---- F: cross-plan ties ----------------------------------------------------
   A station that two plans both claim is the same physical object must be named
   identically in both. The projected positions will differ — different cameras — and
   that difference is printed, not asserted. */
console.log(`\n=== cross-plan ties`);
const byKey = Object.fromEntries(MODULES.map(m => [m.key, m]));
const ties = [];
for (const { key, mod, primary } of MODULES){
  if (!primary) continue;
  for (const t of (mod.crossPlanTies || [])) ties.push({ from:key, ...t });
}
if (!ties.length) console.log(`  (none declared)`);
for (const t of ties){
  const a = byKey[t.from], b = byKey[t.plan];
  if (!b){ fail(`F  tie from ${t.from} names unknown plan "${t.plan}"`); continue; }
  if (!a.plan.has(t.station)){ fail(`F  tie ${t.from}.${t.station} — no such station`); continue; }
  if (!b.plan.has(t.station)){
    fail(`F  tie ${t.from}.${t.station} -> ${t.plan}.${t.station} — the other plan has no station of that name`); continue; }
  const pa = px(a.plan.stations[t.station]), pb = px(b.plan.stations[t.station]);
  console.log(`  F  ${t.station.padEnd(24)} ${t.from} (${f(pa.x,0)},${f(pa.y,0)}) == ` +
              `${t.plan} (${f(pb.x,0)},${f(pb.y,0)})  [ok]  ${t.note ? "— " + t.note : ""}`);
}

/* ---- the numbers, reported not asserted ---------------------------------- */
console.log(`\n=== totals`);
console.log(`  ${MODULES.length} plans (${MODULES.filter(m=>m.primary).length} files, ` +
            `${MODULES.filter(m=>!m.primary).length} derived cameras)`);
console.log(`  ${TOTALS.stations} stations · ${TOTALS.pairs} declared adjacencies`);
console.log(`  ${TOTALS.sepChecks} separation checks (A) · ${TOTALS.orderChecks} depth orderings (C)`);
console.log(`  ${TOTALS.runs} ordered runs · ${TOTALS.runSteps} monotonic steps asserted (D)`);

console.log(`\n${failures ? `${failures} FAILURE(S)` : "ALL ASSERTIONS HOLD"} — ` +
            `frame ${W}x${H} CSS px @ DPR 2, min separation ${MIN_SEP}px, ` +
            `adjacency band ${PAIR_MIN}..${PAIR_MAX}px, cycle return < ${CYCLE_RETURN_MAX}px.`);
process.exit(failures ? 1 : 0);
