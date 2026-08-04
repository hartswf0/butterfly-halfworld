/* scenes/_plans/the-mill.mjs — THE MILL. The stairwell and the lobby, as one space.
   ============================================================================
   USED BY: 11 units.

     BF-15  THE FIRE DOOR       TRANSFER   a smell rises. Green and bitter. Crushed stems.
     BF-16  THE STAIRCASE       ADVANCE    down through the dusty columns, one after another
     BF-17  THE LOBBY           HOLD       a small woman in a navy coat. "You have her shoulders."
     BF-18  THE LOBBY           HOLD       the canister: rust, tape, ASTER, fresh scales
     BF-19  THE LOBBY           HOLD       Niko reaches. Mara moves it away. A confession.
     BF-20  THE GLASS DOOR      TRANSFER   a bus passes; the lobby fills with people moving backward
     BF-21  THE LOBBY FLOOR     CYCLE loop the canister clicks. Around the circumference. Equal intervals.
     BF-22  THE LOBBY           HOLD       Iona catches Mara's wrist. The scar at the thumb.
     BF-23  THE OPEN CANISTER   CYCLE      a black leg appears, withdraws, appears again
     BF-24  THE REEL            CYCLE      the mark exists only when the wings are closed
     BF-25  THE ENTRANCE DOOR   BREAK      the crash bar. Summer enters. Declared.

   MOTIONS: TRANSFER(2) ADVANCE(1) HOLD(4) CYCLE(3, one loop:true) BREAK(1).

   ---------------------------------------------------------------------------
   THE CAMERA. One camera in the lobby, at the foot of the stairs, looking UP the
   stairwell.
     z = 0   the fire door at the stairhead
     z = 1   the glass entrance door and the street beyond it
   That is not the obvious choice. The obvious choice looks at the stairs from the
   street door, which would put the descent moving TOWARD the lens. This camera puts
   it moving AWAY from the small end of the frame and INTO the near band, which means
   BF-16's ADVANCE gets bigger with every landing: project() renders a body in column_5
   at scale 0.739 and in column_1 at 0.960 — 30% growth over five quantised steps — and
   then lands her, at full scale, in a lobby where a stranger is already standing. The
   scale law does the arriving; no scene has to ask for it.

   THE FAR EDGE IS THE PREVIOUS PLAN'S NEAR EDGE. `fire_door` here IS `fire_door` in
   the-laboratory: same leaf of steel, z .085 in this plan and z .946 in that one. Check
   F in harness/verify-plans.mjs asserts the name exists in both and prints the two
   projections, which SHOULD differ. BF-14 ends on the laboratory side of it; BF-15
   begins with a smell coming up through it.

   ---------------------------------------------------------------------------
   THE LIGHT COLUMNS ARE COUNTABLE, WHICH IS WHY THIS UNIT IS AN ADVANCE AND NOT A DRIFT
   "Light enters from windows at each landing and falls in long dusty columns. Mara
   moves down through them, ONE AFTER ANOTHER." advance(u, count, { dwell }) is
   quantised with a dwell — five columns, five dwells, five slides. So the plan supplies
   exactly five, named and ordered:

     window_landing_5 -> column_5   (the light source, and where the column lands)
     ...
     window_landing_1 -> column_1

   `lightColumnsDescending` is monotonic in z, and `landingsDescending` is the tread
   run it interleaves with, seven stations from stairhead to stair_foot. A column is
   authored SEPARATE from its landing — the window is in the brick wall on the west
   side and the column falls out across the tread — because if the column were the
   landing you could not walk through it, and walking through them is the unit.

   THE RED SATIN gets a contact pair, satin_strip / mara_shoe_step, between landings 2
   and 1. It is the only thing that touches her in the whole descent.

   ---------------------------------------------------------------------------
   THE REFLECTION IS A STATION BAND, NOT A TEXTURE
   BF-20: "For an instant its windows reflect the mill's brick facade, and the lobby
   appeared occupied by rows of seated people moving backward." Seven seats on the
   glass plane at z .886 — `reflectedSeatRow` — declared axis x, dir -1, and listed in
   the order the eye receives them, right to left, because that is the direction the
   reflection travels while the bus goes the other way. If this were a texture it could
   not move backward; only an ordered band can be traversed against its own direction.
   The seats are ON the glass, not behind it, for the same reason the city is in the
   laboratory's window rather than beyond it.

   THE TAPPING IS NOT AUTHORED AS STATIONS. BF-21: "Something taps from inside, moving
   around the circumference at equal intervals" — on a canister "no wider than her
   palm". Eight stations around a 90mm circle would project 1.4px apart and would fail
   check A honestly, because a plan cannot hold a ring that small. The plan supplies
   `lobby_floor_canister`; the scene draws the ring there with cycle({ beats: 8,
   closed: true }) — CLOSED, because loop:true, because it is a container and not a
   body. The identical decision is taken for the vial in the-laboratory (BF-14), and
   those two closed rings twenty minutes apart are the rhyme the episode is built on.
   ============================================================================ */
import { makePlan, occupancyAt } from "../../engine/blocking.mjs";

export const theMill = makePlan({
  id: "the-mill",
  name: "The Mill — stairwell and lobby",
  notes:
    "Do not merge a column with its landing; she has to be able to walk through the " +
    "light. Do not move the reflected seat row off the glass plane (z .886) — those " +
    "people are in the door, not on the street. Do not move fire_door: the-laboratory " +
    "asserts the same name and the two plans meet on it.",

  stations: {
    /* ===== FAR: THE STAIRHEAD ==========================================
       BF-15. The smell comes UP, which in this camera means it comes from the
       small end of the frame — the only thing in the episode that travels that way. */
    fire_door:            { x:.500, z:.085 },   // == the-laboratory.fire_door
    stairhead:            { x:.512, z:.108 },
    fire_door_smell:      { x:.478, z:.112 },   // green and bitter. Crushed stems.

    /* ===== THE STAIRCASE — landings, in descent order ==================== */
    landing_5:            { x:.385, z:.145 },
    landing_4:            { x:.300, z:.235 },
    landing_3:            { x:.245, z:.335 },
    landing_2:            { x:.215, z:.445 },
    landing_1:            { x:.205, z:.555 },
    stair_foot:           { x:.248, z:.648 },

    /* ===== THE INTERIOR BRICK WALL, AND A WINDOW AT EACH LANDING ========= */
    brick_wall_high:      { x:.118, z:.205 },
    brick_wall_low:       { x:.098, z:.512 },
    window_landing_5:     { x:.318, z:.128 },
    window_landing_4:     { x:.238, z:.218 },
    window_landing_3:     { x:.182, z:.318 },
    window_landing_2:     { x:.152, z:.428 },
    window_landing_1:     { x:.142, z:.538 },

    /* ===== THE COLUMNS — where each shaft of light lands on the tread =====
       Five. Countable. This is what BF-16's ADVANCE advances through. */
    column_5:             { x:.448, z:.168 },
    column_4:             { x:.362, z:.258 },
    column_3:             { x:.306, z:.358 },
    column_2:             { x:.276, z:.468 },
    column_1:             { x:.266, z:.578 },

    /* ===== THE RED SATIN — the one thing that touches her on the way down = */
    satin_strip:          { x:.222, z:.502 },   // CONTACT PAIR
    mara_shoe_step:       { x:.234, z:.516 },   // CONTACT PAIR — like a tongue

    /* ===== THE LOBBY ==================================================== */
    lobby_far:            { x:.505, z:.675 },
    mara_stand:           { x:.452, z:.735 },
    niko_stand:           { x:.382, z:.702 },
    lobby_centre:         { x:.512, z:.742 },
    iona_stand:           { x:.612, z:.722 },   // CONTACT PAIR
    iona_bag:             { x:.642, z:.742 },   // CONTACT PAIR — darkened at the bottom
    lavender_bundle:      { x:.668, z:.758 },   // protruding in a thick bundle
    stone_floor_west:     { x:.268, z:.788 },
    stone_floor_east:     { x:.732, z:.782 },

    /* ===== BF-18: THE CANISTER CHANGES HANDS ============================
       "I brought you the film." Dented, palm-width, rust from the hinge in
       branching lines, black tape, a fragment of label reading ASTER, and yellow
       scales caught in the adhesive, fresh enough to shine. */
    iona_hand_out:        { x:.562, z:.748 },   // CONTACT PAIR
    mara_hand_take:       { x:.532, z:.756 },   // CONTACT PAIR

    /* ===== BF-19: THE GESTURE THAT ENTERS LIKE A CONFESSION ============== */
    niko_reach:           { x:.478, z:.772 },   // CONTACT PAIR
    canister_withheld:    { x:.448, z:.782 },   // CONTACT PAIR — she moves it away

    /* ===== BF-22: IONA CATCHES MARA'S WRIST ============================== */
    iona_grip:            { x:.578, z:.792 },   // CONTACT PAIR — unexpectedly strong
    mara_wrist_caught:    { x:.548, z:.800 },   // CONTACT PAIR
    iona_thumb_scar:      { x:.598, z:.782 },   // a broken circle crossed by a crooked
                                                //   line. Same shape as the flight, the
                                                //   pen mark, the wing, the new paint.

    /* ===== BF-21 / BF-23 / BF-24: THE FLOOR ============================= */
    lobby_floor_canister: { x:.498, z:.822 },   // set down. Then it clicks.
    reel_on_floor:        { x:.478, z:.842 },   // CONTACT PAIR — 8mm in waxed paper
    chrysalis_in_reel:    { x:.462, z:.852 },   // CONTACT PAIR — in the hollow centre.
                                                //   Split along one side. Empty.
    oldbutterfly_emerge:  { x:.494, z:.856 },   // a black leg appears, withdraws, appears
    oldbutterfly_on_reel: { x:.522, z:.868 },   // BF-24: open, the symbol divides;
                                                //   closed, the symbol becomes whole

    /* ===== BF-25: THE ORANGE CUP ======================================== */
    cup_in_hand:          { x:.362, z:.762 },   // CONTACT PAIR with niko_stand
    cup_fall:             { x:.348, z:.808 },
    cup_pieces:           { x:.322, z:.838 },   // breaks without drama, pieces sliding
                                                //   apart over the stone

    /* ===== NEAR: THE GLASS ENTRANCE DOOR ================================ */
    oldbutterfly_on_door: { x:.468, z:.896 },   // climbing the white brightness
    entrance_door_glass:  { x:.500, z:.902 },
    crash_bar:            { x:.552, z:.912 },
    door_threshold:       { x:.500, z:.948 },
    awning_out:           { x:.500, z:.988 },   // and vanishes above it. Off-map sink.
    bus_passing:          { x:.620, z:.972 },

    /* ===== THE REFLECTION BAND — ON the glass, at z .886 ================= */
    reflect_seat_1:       { x:.285, z:.886 },
    reflect_seat_2:       { x:.355, z:.886 },
    reflect_seat_3:       { x:.425, z:.886 },
    reflect_seat_4:       { x:.495, z:.886 },
    reflect_seat_5:       { x:.565, z:.886 },
    reflect_seat_6:       { x:.635, z:.886 },
    reflect_seat_7:       { x:.705, z:.886 },
  },

  fixtures: [
    { id:"stair_run", kind:"prop", along:["stairhead","stair_foot"], count:6,
      note:"six flights. Break the run — a continuous stringer stripes the frame." },
    { id:"brick_wall", kind:"prop", along:["brick_wall_high","brick_wall_low"],
      note:"interior brick. The windows are IN it, not opposite it." },
    { id:"column_5_shaft", kind:"sightline", along:["window_landing_5","column_5"] },
    { id:"column_4_shaft", kind:"sightline", along:["window_landing_4","column_4"] },
    { id:"column_3_shaft", kind:"sightline", along:["window_landing_3","column_3"] },
    { id:"column_2_shaft", kind:"sightline", along:["window_landing_2","column_2"] },
    { id:"column_1_shaft", kind:"sightline", along:["window_landing_1","column_1"],
      note:"five shafts, each authored window-to-floor so the light has a direction " +
           "and the dust in it has a plane. Long and dusty; never a glow." },
    { id:"the_descent", kind:"path",
      along:["fire_door","stairhead","landing_5","landing_4","landing_3","landing_2",
             "landing_1","stair_foot","lobby_far"],
      note:"BF-16, one continuous walk in one coordinate system, from the door the " +
           "laboratory ends at to the floor Iona is standing on." },
    { id:"the_reflection", kind:"prop",
      along:["reflect_seat_7","reflect_seat_1"], count:7,
      note:"BF-20. Rows of seated people, moving backward, ON the glass. They are " +
           "gone when the bus is gone and nobody in the lobby turns around." },
    { id:"sightline_iona_to_the_door", kind:"sightline",
      along:["iona_stand","entrance_door_glass"],
      note:"BF-17: 'She looks not up the stairs but at their reflection in the glass " +
           "door.' She is facing the near edge of the frame while Mara comes down the " +
           "far one. They are looking at each other through the exit." },
  ],
});

/* ============================================================================
   MOTION-AWARE ORDERED RUNS. A motion cannot traverse an unordered set.
   ============================================================================ */
export const orderedRuns = [
  { id:"landingsDescending", axis:"z", dir:1,
    motion:"ADVANCE", units:["BF-16"],
    stations:["stairhead","landing_5","landing_4","landing_3","landing_2",
              "landing_1","stair_foot"],
    note:"seven treads in descent order. Monotonic in z because descending, in this " +
         "camera, is coming toward the lens." },
  { id:"lightColumnsDescending", axis:"z", dir:1,
    motion:"ADVANCE", units:["BF-16"],
    stations:["column_5","column_4","column_3","column_2","column_1"],
    note:"five. advance(u, 5, { dwell }) has exactly these to quantise onto. She is " +
         "IN a column or BETWEEN columns and never partly in one; that is the dwell." },
  { id:"reflectedSeatRow", axis:"x", dir:-1,
    motion:"TRANSFER", units:["BF-20"],
    stations:["reflect_seat_7","reflect_seat_6","reflect_seat_5","reflect_seat_4",
              "reflect_seat_3","reflect_seat_2","reflect_seat_1"],
    note:"listed in the order the eye receives them: right to left, against the bus. " +
         "dir -1 IS the backwardness. An unordered band cannot move backward." },
];
export const landingsDescending     = orderedRuns[0].stations;
export const lightColumnsDescending = orderedRuns[1].stations;
export const reflectedSeatRow       = orderedRuns[2].stations;

/* CONTACT PAIRS. Seven, all on the stone floor or the stair treads — walkable ground.
   Six of the seven are in the lobby, inside ninety seconds of story: this is the room
   where the world stops being observed through a glove and starts touching people. */
export const contactPairs = [
  ["satin_strip",       "mara_shoe_step"],      // BF-16, the only touch on the stairs
  ["iona_stand",        "iona_bag"],            // BF-17, darkened at the bottom
  ["iona_hand_out",     "mara_hand_take"],      // BF-18, the canister changes hands
  ["niko_reach",        "canister_withheld"],   // BF-19, and she moves it away
  ["iona_grip",         "mara_wrist_caught"],   // BF-22, unexpectedly strong
  ["reel_on_floor",     "chrysalis_in_reel"],   // BF-23, a nest of its own discarded
                                                //   history. The one pair that is two
                                                //   objects; both are on the floor.
  ["niko_stand",        "cup_in_hand"],         // BF-25, until he shoves the crash bar
];

/* ============================================================================
   BLOCKING. Six of the eleven, chained through the whole lobby sequence, because
   this is the one plan in the world where the blocking IS the plot: who is holding
   the canister at each instant is the argument of BF-18, BF-19 and BF-21.
   ============================================================================ */
const carryOver = (occ, ...who) =>
  Object.fromEntries(Object.entries(occ).filter(([k]) => who.includes(k)));

/* --- BF-15  THE FIRE DOOR — a smell rises. TRANSFER ----------------------- */
export const INITIAL_BF15 = { mara:"fire_door", niko:"stairhead" };
export const MOVES_BF15 = [];
export const exitOccupancyBF15 = occupancyAt(theMill, MOVES_BF15, 4, INITIAL_BF15);

/* --- BF-16  THE STAIRCASE — down through the columns. ADVANCE -------------
   Five columns, five dwells. The t0/t1 pairs are the dwells: she is stationary in
   a column and then slides to the next, which is what advance() quantises. Niko
   does not follow yet; he is still at the stairhead when she reaches the lobby, and
   that is why BF-17 is two women alone. */
export const INITIAL_BF16 = exitOccupancyBF15;
export const MOVES_BF16 = [
  { who:"mara", from:"fire_door", to:"column_5",  t0:0.0, t1:1.0 },
  { who:"mara", from:"column_5",  to:"column_4",  t0:1.7, t1:2.4 },
  { who:"mara", from:"column_4",  to:"column_3",  t0:3.1, t1:3.8 },
  { who:"mara", from:"column_3",  to:"column_2",  t0:4.5, t1:5.2 },
  { who:"mara", from:"column_2",  to:"mara_shoe_step", t0:5.9, t1:6.4 },  // the satin
  { who:"mara", from:"mara_shoe_step", to:"column_1", t0:6.8, t1:7.3 },
  { who:"mara", from:"column_1",  to:"stair_foot", t0:8.0, t1:8.9 },
];
export const exitOccupancyBF16 = occupancyAt(theMill, MOVES_BF16, 10, INITIAL_BF16);

/* --- BF-17  THE LOBBY — "You have her shoulders." HOLD -------------------- */
export const INITIAL_BF17 = { ...exitOccupancyBF16, iona:"iona_stand" };
export const MOVES_BF17 = [
  { who:"mara", from:"stair_foot", to:"mara_stand", t0:0.4, t1:2.6 },
];
export const exitOccupancyBF17 = occupancyAt(theMill, MOVES_BF17, 6, INITIAL_BF17);

/* --- BF-18  THE LOBBY — the canister changes hands. HOLD -------------------
   Niko finally comes down. Iona and Mara meet at the contact pair; the object is
   in two people's hands for one instant and in one person's for the rest of the
   episode. */
export const INITIAL_BF18 = exitOccupancyBF17;
export const MOVES_BF18 = [
  { who:"iona", from:"iona_stand",  to:"iona_hand_out",  t0:1.0, t1:2.4 },
  { who:"mara", from:"mara_stand",  to:"mara_hand_take", t0:1.2, t1:2.6 },
  { who:"niko", from:"stairhead",   to:"niko_stand",     t0:0.0, t1:3.4 },
];
export const exitOccupancyBF18 = occupancyAt(theMill, MOVES_BF18, 6, INITIAL_BF18);

/* --- BF-19  THE LOBBY — the gesture. HOLD ---------------------------------
   "The gesture is small. It enters the room like a confession." It is authored as
   30px: niko_reach to canister_withheld. The smallest move in the plan and the one
   that decides which side of the story Mara is on. */
export const INITIAL_BF19 = exitOccupancyBF18;
export const MOVES_BF19 = [
  { who:"niko", from:"niko_stand",     to:"niko_reach",        t0:0.6, t1:1.8 },
  { who:"mara", from:"mara_hand_take", to:"canister_withheld", t0:1.6, t1:2.2 },
];
export const exitOccupancyBF19 = occupancyAt(theMill, MOVES_BF19, 5, INITIAL_BF19);

/* --- BF-21  THE LOBBY FLOOR — the canister clicks. CYCLE loop:true --------
   She puts it down, and then NOBODY MOVES. loop:true must close exactly; a body
   drifting during it would break the loop at the wrap. Same rule as
   the-laboratory's BF-11. */
export const INITIAL_BF21 = exitOccupancyBF19;
export const MOVES_BF21 = [
  { who:"mara", from:"canister_withheld", to:"mara_stand", t0:0.0, t1:1.6 },
];
export const exitOccupancyBF21 = { ...occupancyAt(theMill, MOVES_BF21, 4, INITIAL_BF21),
                                   canister:"lobby_floor_canister" };

/* --- BF-25  THE ENTRANCE DOOR — BREAK, declared at the crash bar ----------
   THE BREAK IS ONE INSTANT: Niko's hand hitting the bar. Everything before it is
   the butterfly cycling on the glass (impact, drop, recovery) and everything after
   it is summer. The plan's part is to give the discontinuity somewhere to happen:
   cup_in_hand to crash_bar is 196.6px of frame, the longest single move in this plan,
   and the man who makes it is the one who says "If it gets outside—". awning_out is a
   declared occupancy sink — the animal is above the awning and is not standing on
   anything, which is the one place in five plans where that is true. */
export const INITIAL_BF25 = {
  ...carryOver(exitOccupancyBF21, "mara", "niko", "iona"),
  oldbutterfly:"oldbutterfly_on_reel",
};
export const MOVES_BF25 = [
  { who:"oldbutterfly", from:"oldbutterfly_on_reel", to:"oldbutterfly_on_door",
    t0:0.0, t1:2.2 },
  { who:"niko", from:"niko_reach", to:"cup_in_hand",  t0:0.4, t1:1.4 },
  { who:"niko", from:"cup_in_hand", to:"crash_bar",   t0:3.6, t1:4.0 },   // the BREAK
  { who:"oldbutterfly", from:"oldbutterfly_on_door", to:"awning_out",
    t0:4.0, t1:4.6 },
  { who:"mara", from:"mara_stand", to:"door_threshold", t0:4.2, t1:5.6 },
];
export const exitOccupancyBF25 = occupancyAt(theMill, MOVES_BF25, 7, INITIAL_BF25);

export const exitOccupancy = {
  "BF-15": exitOccupancyBF15, "BF-16": exitOccupancyBF16,
  "BF-17": exitOccupancyBF17, "BF-18": exitOccupancyBF18,
  "BF-19": exitOccupancyBF19, "BF-21": exitOccupancyBF21,
  "BF-25": exitOccupancyBF25,
};

/* off-map. The animal is above the awning and is not standing on anything. */
export const occupancySinks = ["awning_out"];

export const crossPlanTies = [
  { station:"fire_door", plan:"the-laboratory",
    note:"one leaf of steel, two cameras. The world's only seamless walk between plans." },
];

export default theMill;
