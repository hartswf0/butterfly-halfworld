/* scenes/_plans/the-maze.mjs — THE CHOICE MAZE. ONE geometry. TWO cameras.
   ============================================================================
   USED BY: 2 units, the first and the second-to-last, and they are the same event.

     BF-01  INT. OBSERVATION BOX          CYCLE loop:false  from outside, looking in
     BF-37  INT. THE MAZE · THE BUTTERFLY'S VIEW
                                          CYCLE loop:false  from inside, looking out

   Both declare CYCLE and both are loop:false. MOTION-BRIEF: never animate a living
   thing as a closed cycle. The swallowtail striking the ceiling is OPEN — it is dying
   of this — and `strikeCycleRun` below is verified to drift rather than close, in both
   cameras, by check D.

   ============================================================================
   THE ARGUMENT: ONE PLAN OR TWO?
   ============================================================================
   BF-37 is shot FROM INSIDE the maze, looking out through the acrylic lid at Mara
   "enormous, distorted, holding her breath". So the file has to work from both sides.
   Three ways to do that, and I rejected two.

   REJECTED 1 — TWO SEPARATE PLANS, EACH HAND-AUTHORED.
   The corridors, the partition and the lid do not move between the two units; they are
   the same object thirty centimetres across, twenty minutes apart in the story. Author
   them twice and they will drift, and this world's whole claim is that one shape recurs
   and is provably the same shape (MOTION-BRIEF S5: "The broken circle is authored once
   ... Do not redraw it. Import it. If they differ, the world is lying about its own
   central claim."). Hand-authoring the maze twice is the same failure as redrawing
   brokenCircle() twice. Rejected on those grounds alone.

   REJECTED 2 — ONE PLAN, AND DERIVE THE INSIDE CAMERA BY MIRRORING DEPTH (z -> 1-z).
   This is the obvious involution and it is WRONG, and the engine says so out loud.
   project() gives scale = (0.60 + 0.50 d) k, so scale is maximal at d = 1. Mara stands
   at the near edge of the outside camera, l = .965, where she renders at scale 1.169.
   Mirror that and she lands at z = .035, which project() CLAMPS to d = 0.08, and she
   renders at 0.691 — 59% of what she was, and SMALLER THAN THE CORRIDOR FLOOR she is
   looking down into, which comes out at 0.697. The text says enormous. A depth mirror
   produces the exact opposite of the only adjective the unit gives us, which is how I
   know the mirror is not what the camera did. (Those four numbers are printed by
   harness/verify-plans.mjs's scale column and were not guessed; an earlier draft of
   this comment said '40% scale' and was wrong.)

   CHOSEN — ONE AUTHORED GEOMETRY, TWO CAMERAS, EACH DELETING A DIFFERENT AXIS.
   The maze is authored once, below, in THREE dimensions, as plain data:

       a   across the maze, 0..1, left..right         (the two corridors)
       l   along the maze,  0..1, far end..the start chamber
       h   height above the maze floor, 0..1, floor..beyond the lid

   Neither camera can carry all three, because project() has exactly two inputs. So
   each camera picks two and DELETES ONE, and the axis it deletes is the axis its unit
   is not about:

     theMaze        (BF-01)   x = a        z = l    — height deleted
     theMazeInside  (BF-37)   x = 1 - a    z = h    — length deleted

   That is not a workaround. It is the subject.

   BF-01's camera cannot see height, so it cannot see the striking. It sees a body
   at a position in a maze, arm-lavender or arm-clean, and a clock: "The choice
   interval has run 43 seconds and should have ended after 30. It does not choose."
   That camera can only ever record non-completion. It is the camera that produces
   the report in BF-06 with the path visualization deleted and the arm choice kept.

   BF-37's camera cannot see length, so the maze has no length. The far, middle and
   near thirds of one corridor project to ONE POINT, 0.00px apart — the whole distance
   the trial is measuring collapses to nothing, and INSIDE_VISIBLE has to drop two stations out of
   every three because of it. What the camera has instead is the floor-to-roof axis:
   decision_point to lid_strike_point is 182.7px, and it is the only distance the
   animal has been trying to cross for 43 seconds. A choice worth nothing and a roof
   worth 183 pixels. That ratio is the unit.

   And Mara comes out enormous FOR FREE, from the engine, with no special-casing:
   pressed to the lid she is at h = .96, which is d = .96, which is scale
   (0.60 + 0.50 * 0.96) * 1.08 = 1.166, against the corridor floor's 0.697 — 1.67x,
   measured. The projection produces the adjective. Distortion is the scene's job; the
   plan supplies the ground column.

   x IS MIRRORED (a -> 1 - a) because the camera has turned around. The corridor that
   carries lavender is on the left from outside and on the right from inside, and the
   left sleeve port is the right one. Any scene that reads `corridor_lavender_mid` from
   the inside camera gets the mirrored position automatically and cannot get it wrong.

   THE NAMES ARE SHARED. That is the whole payoff. A scene says `lid_strike_point` in
   either camera and gets the right point in that camera. There is one station table.

   ============================================================================
   THE COST, STATED: NOT EVERY STATION SURVIVES THE INSIDE CAMERA
   ============================================================================
   A camera that deletes an axis cannot address two stations that differ only in that
   axis. partition_white_far, _mid and _near differ ONLY in l; from inside they are one
   point. So `theMazeInside` exposes a REDUCED station set — INSIDE_VISIBLE below —
   and refuses to name the rest, rather than pretending to hold three names at one
   coordinate. assertNoCollapse() runs at IMPORT TIME and throws if any two stations
   the list chose to KEEP land within 3px of each other, so the exclusion list is
   checked by running code and not merely asserted in this comment. Eight of the
   twenty-eight stations are excluded — INSIDE_EXCLUDED maps each to the station that
   absorbed it — and the inside camera carries twenty.

   ============================================================================
   THE LID IS A SURFACE THE WAY A SCREEN IS
   ============================================================================
   "The roof offers no resistance until contact." A lid station is not walkable ground
   and a body cannot stand on it, so `lid_strike_point` / `swallowtail_rise` is NOT
   exported as a contact pair. It is exported as an IMPACT PAIR — a declared adjacency
   held to the same 3..40px band by check A', and exempted from the walkable rule
   explicitly rather than quietly. The verifier counts the two kinds separately so that
   "contact pairs go on walkable ground" stays a real rule.

   AND THIS PLAN HAS NO CONTACT PAIRS AT ALL. Zero. In the room where the whole story
   starts, nothing touches anything except an animal and a roof — and the roof is not
   there until the instant it is. Every other plan in this world has between two and
   nine. That number is the argument of the episode and it is meant to be read.

   The same surface logic governs the plastic sheeting in the-facility and the glass
   entrance door in the-mill, and it is worth saying that the projection in BF-37 is a
   third instance: Mara is watching a screen showing a lid, and neither offers any
   resistance until it does.

   ============================================================================
   TIES: THIS OBJECT ALSO APPEARS IN the-laboratory
   ============================================================================
   The box sits on the stainless bench and the laboratory plan holds it at LOW
   resolution — three stations, on purpose. `corridor_lavender_mid`,
   `corridor_clean_mid` and `partition_white_mid` carry identical names in both files
   and check F asserts it. BF-05 (the wings closing on the partition, the false eyes
   looking backward) is shot in the-laboratory because it is a thing seen from the
   room. BF-01 and BF-37 are shot here because they are things seen from the box.
   ============================================================================ */
import { makePlan, occupancyAt, project } from "../../engine/blocking.mjs";

/* ---------------------------------------------------------------------------
   THE GEOMETRY. Authored ONCE, in three dimensions. Neither camera owns this.
   --------------------------------------------------------------------------- */
export const MAZE_GEOMETRY = {
  /* the two arms and the wall between them */
  /* a corridor is a STRAIGHT channel: `a` is constant down each arm. That is not
     decoration — it is what makes the three stations of one arm collapse to exactly
     0.00px in the inside camera, which is the thing INSIDE_EXCLUDED is for and which
     assertNoCollapse() proves at import time. An earlier draft tapered them by .01
     for no reason and quietly made the whole argument false by 5.3 pixels. */
  corridor_lavender_far:  { a:.345, l:.135, h:.090 },
  corridor_lavender_mid:  { a:.345, l:.315, h:.090 },  // == the-laboratory
  corridor_lavender_near: { a:.345, l:.495, h:.090 },
  corridor_clean_far:     { a:.655, l:.135, h:.090 },
  corridor_clean_mid:     { a:.655, l:.315, h:.090 },  // == the-laboratory
  corridor_clean_near:    { a:.655, l:.495, h:.090 },
  partition_white_far:    { a:.500, l:.145, h:.220 },
  partition_white_mid:    { a:.500, l:.325, h:.220 },  // == the-laboratory. BF-05:
                                                       //   it settles here and closes
                                                       //   its wings; the false eyes
                                                       //   on the undersides look back.
  partition_white_near:   { a:.500, l:.505, h:.220 },

  /* the floor. "lavender divides the world: one corridor carries it, the other
     does not." Lavender is a SMELL and is never drawn purple. */
  maze_floor_lavender:    { a:.318, l:.408, h:.085 },
  maze_floor_clean:       { a:.682, l:.408, h:.085 },

  /* the decision the trial is asking for, and the place it is asked from */
  decision_point:         { a:.500, l:.600, h:.090 },
  start_chamber:          { a:.500, l:.690, h:.090 },

  /* the clear acrylic lid. A surface, not a ceiling. */
  lid_over_lavender:      { a:.352, l:.300, h:.620 },
  lid_over_partition:     { a:.500, l:.395, h:.620 },
  lid_over_clean:         { a:.648, l:.300, h:.620 },
  lid_strike_point:       { a:.500, l:.462, h:.620 },  // IMPACT PAIR. 43 seconds.

  /* the cycle. Impact. Drop. A tilt of black-veined wings. Recovery. Impact.
     OPEN: it does not return to where it began, and the drift is the cost. */
  swallowtail_rise:       { a:.500, l:.478, h:.545 },  // IMPACT PAIR
  swallowtail_drop:       { a:.478, l:.552, h:.340 },
  swallowtail_tilt:       { a:.535, l:.500, h:.490 },
  swallowtail_recover:    { a:.516, l:.520, h:.440 },

  /* the near face of the box, and the two ports Mara's arms go through */
  box_near_face:          { a:.500, l:.790, h:.300 },
  sleeve_port_left:       { a:.418, l:.845, h:.360 },
  sleeve_port_right:      { a:.582, l:.845, h:.360 },

  /* and Mara. From outside: a body at the near edge. From inside: a face on the
     roof, at h .86..96, which project() renders at 2.5x the scale of the corridors
     without being asked to. */
  mara_at_lid:            { a:.500, l:.905, h:.860 },
  mara_eye_left:          { a:.462, l:.955, h:.930 },
  mara_eye_right:         { a:.538, l:.958, h:.935 },
  mara_held_breath:       { a:.500, l:.965, h:.960 },
};

/* the two cameras, as one line each */
const outsideCamera = (g) => ({ x: g.a,     z: g.l });
const insideCamera  = (g) => ({ x: 1 - g.a, z: g.h });

const stationsFrom = (camera, keys = Object.keys(MAZE_GEOMETRY)) =>
  Object.fromEntries(keys.map(k => [k, camera(MAZE_GEOMETRY[k])]));

/* ---------------------------------------------------------------------------
   CAMERA ONE — BF-01. Outside the box, looking in. Height deleted.
   --------------------------------------------------------------------------- */
export const theMaze = makePlan({
  id: "the-maze",
  name: "The Choice Maze — from outside the box",
  notes:
    "x = across, z = along. This camera has no height, therefore no striking, " +
    "therefore no refusal — only a position and a clock. That is why the trial is " +
    "logged as non-completion. Do not add a height proxy to this camera.",
  stations: stationsFrom(outsideCamera),
  fixtures: [
    { id:"acrylic_lid", kind:"prop",
      along:["lid_over_lavender","lid_over_clean"],
      note:"clear. It offers no resistance until contact. In this camera it is " +
           "directly above the corridors and reads as a bright plane over the " +
           "whole plan — a brightness she could not enter." },
    { id:"the_two_arms", kind:"prop",
      along:["corridor_lavender_far","corridor_clean_far"],
      note:"one carries lavender and one does not. They are otherwise identical, " +
           "and in this camera that difference is invisible: it is a smell." },
    { id:"sightline_mara_down_the_maze", kind:"sightline",
      along:["mara_held_breath","partition_white_far"],
      note:"BF-01. She is looking the length of the maze at a wall, and the animal " +
           "is above it, in an axis this camera does not have." },
  ],
});

/* ---------------------------------------------------------------------------
   CAMERA TWO — BF-37. Inside the maze, looking out through the lid. Length deleted.

   INSIDE_VISIBLE is the reduced set. Five stations are excluded because they
   collapse onto another under (1-a, h); each is listed with its absorber.
   --------------------------------------------------------------------------- */
export const INSIDE_VISIBLE = [
  "corridor_lavender_mid",  // absorbs corridor_lavender_far and _near (differ only in l)
  "corridor_clean_mid",     // absorbs corridor_clean_far and _near
  "partition_white_mid",    // absorbs partition_white_far and _near
  "maze_floor_lavender",
  "maze_floor_clean",
  "decision_point",         // absorbs start_chamber (a .500 / h .090 in both)
  "lid_over_lavender",
  "lid_over_clean",
  "lid_strike_point",       // absorbs lid_over_partition (a .500 / h .620 in both).
                            //   The strike point wins: it is the one BF-37 needs.
  "swallowtail_rise",
  "swallowtail_tilt",
  "swallowtail_recover",
  "swallowtail_drop",
  "box_near_face",
  "sleeve_port_left",       // appears on the RIGHT from in here
  "sleeve_port_right",      // appears on the LEFT
  "mara_at_lid",
  "mara_eye_left",
  "mara_eye_right",
  "mara_held_breath",
];

export const INSIDE_EXCLUDED = {
  corridor_lavender_far:  "corridor_lavender_mid",
  corridor_lavender_near: "corridor_lavender_mid",
  corridor_clean_far:     "corridor_clean_mid",
  corridor_clean_near:    "corridor_clean_mid",
  partition_white_far:    "partition_white_mid",
  partition_white_near:   "partition_white_mid",
  start_chamber:          "decision_point",
  lid_over_partition:     "lid_strike_point",
};

/* checked at import time, not asserted in prose: if two stations we chose to KEEP
   collapse into each other under this camera, the exclusion list is wrong. */
function assertNoCollapse(keys, camera, W = 1120, H = 760, minPx = 3){
  for (let i=0;i<keys.length;i++) for (let j=i+1;j<keys.length;j++){
    const a = project(camera(MAZE_GEOMETRY[keys[i]]));
    const b = project(camera(MAZE_GEOMETRY[keys[j]]));
    const d = Math.hypot((a.x-b.x)*W, (a.y-b.y)*H);
    if (d < minPx) throw new Error(
      `[the-maze] inside camera collapses ${keys[i]} and ${keys[j]} to ${d.toFixed(2)}px — ` +
      `add one of them to INSIDE_EXCLUDED with its absorber`);
  }
}
assertNoCollapse(INSIDE_VISIBLE, insideCamera);

export const theMazeInside = makePlan({
  id: "the-maze-inside",
  name: "The Choice Maze — from inside, through the lid",
  notes:
    "x = 1 - across (the camera has turned), z = height. This camera has no corridor " +
    "length, therefore no choice — only a floor, a roof, and a face on the roof. " +
    "Mara at h .96 comes out at scale 1.166 against the corridor floor's 0.697: " +
    "enormous, " +
    "from the engine, unasked. Distortion is the scene's job.",
  stations: stationsFrom(insideCamera, INSIDE_VISIBLE),
  fixtures: [
    { id:"the_lid_from_below", kind:"prop",
      along:["lid_over_clean","lid_over_lavender"],
      note:"BF-37. The whole upper band of the frame. It is a screen: the projection " +
           "in the-facility is playing this shot, so the audience is watching a lid " +
           "through a screen through a lid." },
    { id:"sightline_up_through_the_lid", kind:"sightline",
      along:["lid_strike_point","mara_held_breath"],
      note:"the only sightline in the plan, 125.9px long, and there is a sheet of " +
           "acrylic across the middle of it. The image goes white at the far end." },
  ],
});

/* the derived camera carries its own adjacencies and runs, because the verifier
   reads them off the plan object for anything that is not a module default. */
theMazeInside.contactPairs = [];
theMazeInside.impactPairs  = [["lid_strike_point", "swallowtail_rise"]];
theMazeInside.orderedRuns  = [
  { id:"strikeCycleRun_inside", axis:"cycle",
    motion:"CYCLE", units:["BF-37"],
    stations:["swallowtail_rise","lid_strike_point","swallowtail_drop","swallowtail_recover"],
    note:"the same four beats, seen from underneath. In this camera the drop is a " +
         "fall through the plan's entire depth, which is what it is." },
];

export const extraPlans = [theMazeInside];

/* ============================================================================
   MOTION-AWARE ORDERED RUN — the strike cycle, in beat order.
   cycle(u, { beats: 4, closed: false, drift }) returns beat 0=rise 1=impact
   2=drop 3=recover. These four stations are those four beats.

   Check D's "cycle" axis asserts three things about it, and they are the three
   things MOTION-BRIEF asks for: it is not monotonic in x or z (a monotonic cycle is
   a line); it does not close exactly (loop:false, it is alive); and it returns to
   within 60px of where it began (or it is not a cycle at all). It measures 19.6px of
   drift in the outside camera and 39.5px in the inside one, which is right — the
   wearing-down is mostly vertical and the camera that can see height sees more of it.
   ============================================================================ */
export const strikeCycleRun = [
  "swallowtail_rise", "lid_strike_point", "swallowtail_drop", "swallowtail_recover",
];

export const orderedRuns = [
  { id:"strikeCycleRun", axis:"cycle",
    motion:"CYCLE", units:["BF-01"],
    stations: strikeCycleRun,
    note:"Impact. Drop. A tilt of black-veined wings. Recovery. Impact. OPEN — it is " +
         "dying of this, and closed:true here would invert the meaning of the unit." },
];

/* NO CONTACT PAIRS. See the header. Nothing in this room touches anything. */
export const contactPairs = [];

/* ONE IMPACT PAIR: an animal and a roof that is not there until it is. */
export const impactPairs = [
  ["lid_strike_point", "swallowtail_rise"],
];

/* ============================================================================
   BLOCKING. Both units, because there are only two and both are the same event.
   ============================================================================ */

/* --- BF-01  INT. OBSERVATION BOX — MORNING. CYCLE, open. -------------------
   The animal never enters either arm. It goes from the start chamber to the
   decision point and then UP, which in this camera is nowhere: its z barely
   changes for the rest of the unit while it strikes the roof eleven times. That
   flat occupancy trace IS the trial record. Mara does not move at all. */
export const INITIAL_BF01 = {
  swallowtail:"start_chamber", mara:"mara_held_breath",
};
export const MOVES_BF01 = [
  { who:"swallowtail", from:"start_chamber",      to:"decision_point",      t0:0.0, t1:1.4 },
  { who:"swallowtail", from:"decision_point",     to:"swallowtail_rise",    t0:1.4, t1:2.2 },
  { who:"swallowtail", from:"swallowtail_rise",   to:"lid_strike_point",    t0:2.2, t1:2.5 },
  { who:"swallowtail", from:"lid_strike_point",   to:"swallowtail_drop",    t0:2.5, t1:3.1 },
  { who:"swallowtail", from:"swallowtail_drop",   to:"swallowtail_recover", t0:3.1, t1:3.8 },
  { who:"swallowtail", from:"swallowtail_recover",to:"swallowtail_rise",    t0:3.8, t1:4.3 },
];
export const exitOccupancyBF01 = occupancyAt(theMaze, MOVES_BF01, 5, INITIAL_BF01);

/* --- BF-37  THE BUTTERFLY'S VIEW. Same event, other camera. ----------------
   Same moves, same station names, resolved against theMazeInside. Nothing in this
   table changed except which plan it is handed to, and that is the test of whether
   the two-camera decision was right. It was: this compiles and produces different
   pixels for the same story.

   BF-37 is a PROJECTION of the morning's trial, so its occupancy is not chained
   from BF-01 in the-facility's timeline; it is BF-01's occupancy replayed. Mara is
   in it twice — once as the body at the lid, once as the woman in the-facility
   watching — and only the first one is blocked here. */
export const INITIAL_BF37 = INITIAL_BF01;
export const MOVES_BF37 = MOVES_BF01;
export const exitOccupancyBF37 = occupancyAt(theMazeInside, MOVES_BF37, 5, INITIAL_BF37);

export const exitOccupancy = {
  "BF-01": exitOccupancyBF01,
  "BF-37": exitOccupancyBF37,
};

export const occupancySinks = [];

export const crossPlanTies = [
  { station:"corridor_lavender_mid", plan:"the-laboratory",
    note:"the arm that carries it. Same object, two scales." },
  { station:"corridor_clean_mid", plan:"the-laboratory",
    note:"the arm that does not." },
  { station:"partition_white_mid", plan:"the-laboratory",
    note:"BF-05 is shot in the laboratory: a thing seen from the room. BF-01 and " +
         "BF-37 are shot here: things seen from the box." },
];

export default theMaze;
