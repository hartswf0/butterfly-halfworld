/* scenes/_plans/the-lot.mjs — THE LOT. Alley, fenced lot, warehouse annex. One exterior.
   ============================================================================
   USED BY: 3 units.

     BF-26  EXT. SERVICE ALLEY          ADVANCE  the butterfly turns; therefore they turn
     BF-27  THE LOT · SPILLED LAVENDER  HOLD     the bag splits; it descends and touches one
     BF-28  THE WAREHOUSE · PLYWOOD     HOLD     fresh paint on one board

   MOTIONS: ADVANCE(1) HOLD(2).

   ---------------------------------------------------------------------------
   THE CAMERA. At the mouth of the service alley, at the street, looking in.
     z = 0   the low brick structure at the rear of the paper warehouse
     z = 1   the alley mouth, and behind you the mill they have just run out of
   Three units, one continuous exterior, no cut. `annex_door` is a cross-plan tie with
   the-facility: BF-28 is the plywood face of this building and BF-29 is the inside of
   the same doorway, so the story crosses that threshold the way it crossed the fire
   door between the-laboratory and the-mill.

   THE GEOMETRY IS THE ARGUMENT AND IT IS ONE STRAIGHT LINE. Everything in these three
   units is a pursuit that never catches anything. So there is no station in this plan
   that is not on, or within a body's width of, `pursuitRun` — eleven stations from the
   alley mouth at z .938 to the annex door at z .238, strictly decreasing in z, which
   is a straight run away from the lens over 252px of frame depth. Nobody in this plan
   is ever facing the camera. The animal sets the direction and the humans inherit it:
   "The butterfly turns at the alley's end. THEREFORE they turn." The plan makes that
   literal — alley_end_turn is a station on the run and the run bends there.

   BF-26 IS THE ONLY ADVANCE IN THE WORLD THAT A BODY LOSES.
   "Iona is fast for perhaps twenty paces. Then her body remembers its age."
   `iona_falters` is authored ON the run, at z .598, four stations in — a little past a
   third of it. advance(u, 11, { dwell }) quantises the whole run; Iona's blocking stops
   at index 3 while Mara's continues to index 10. An ADVANCE both of them complete would
   make them equals, and the unit's content is that they are not.

   BF-27 THEN HAPPENS AT THE POINT SHE STOPPED. The bag splits where the body failed,
   one station on from iona_falters and 16px away. The lavender goes on the ground at
   the exact place the old woman ran out of running, and the butterfly comes down to it
   and is not afraid. `bag_split` is a contact pair with `iona_falters` for that reason:
   the last thing she is holding, at the instant she stops holding it.

   THE FRESH PAINT. `fresh_paint_mark` is a broken circle with a line through it, on
   `plywood_board_nearest`, 11px apart. It is the same shape as the flight trace in
   the-laboratory, the scar on Iona's thumb in the-mill, the pen mark on the 1945
   photograph and the marking on the old butterfly's closed wings. Authored once in
   brokenCircle(); imported, never redrawn. If they differ the world is lying
   (MOTION-BRIEF S5). Note that this is the ONLY one of the five that somebody made
   with a brush, recently, on purpose, and that Niko eats his lunch 0.117 of the lot
   from it — 68px of frame — and had not noticed it until this unit.
   ============================================================================ */
import { makePlan, occupancyAt } from "../../engine/blocking.mjs";

export const theLot = makePlan({
  id: "the-lot",
  name: "The Lot — service alley, fenced lot, warehouse annex",
  notes:
    "Do not move iona_falters off pursuitRun; it is a point ON the run and BF-27 is " +
    "staged at it. Do not move fresh_paint_mark off plywood_board_nearest. Do not " +
    "rename annex_door — the-facility asserts the same name.",

  stations: {
    /* ===== FAR: THE LOW BRICK STRUCTURE ================================= */
    warehouse_wall_east:    { x:.652, z:.172 },
    plywood_board_west:     { x:.318, z:.178 },
    plywood_board_mid:      { x:.372, z:.182 },
    warehouse_annex_face:   { x:.420, z:.185 },
    plywood_board_nearest:  { x:.462, z:.212 },   // "On the nearest board, painted:"
    fresh_paint_mark:       { x:.478, z:.228 },   // a broken circle with a line through
                                                  //   it. The paint is new.
    annex_door:             { x:.418, z:.238 },   // == the-facility.annex_door
    niko_lunch_spot:        { x:.578, z:.288 },   // "You come here?"  "Lunch."

    /* ===== THE FENCED LOT ==============================================
       Waist-high weeds grown THROUGH the chassis of a delivery truck: the weeds and
       the truck are authored as interleaved stations, not as one prop, because the
       growing-through is the fact. */
    lot_far_corner:         { x:.245, z:.322 },
    weeds_north:            { x:.352, z:.362 },
    truck_chassis_cab:      { x:.688, z:.392 },
    lot_open:               { x:.478, z:.418 },
    weeds_thru_chassis:     { x:.645, z:.428 },
    truck_chassis_rear:     { x:.602, z:.462 },
    weeds_south:            { x:.418, z:.478 },
    fence_line_east:        { x:.812, z:.552 },
    fence_gap:              { x:.532, z:.548 },
    fence_line_west:        { x:.268, z:.572 },

    /* ===== BF-27: WHERE THE BODY STOPS ================================== */
    iona_falters:           { x:.498, z:.598 },   // CONTACT PAIR — twenty paces
    oldbutterfly_alight:    { x:.518, z:.605 },   // CONTACT PAIR — it does not recoil
    lavender_stem_touched:  { x:.508, z:.612 },   // CONTACT PAIR
    bag_split:              { x:.482, z:.618 },   // CONTACT PAIR
    lavender_spill_west:    { x:.448, z:.638 },
    lavender_spill_east:    { x:.522, z:.642 },

    /* ===== THE SERVICE ALLEY — near band ================================ */
    alley_end_turn:         { x:.552, z:.652 },   // it turns. Therefore they turn.
    alley_wall_east:        { x:.762, z:.735 },
    alley_wall_west:        { x:.288, z:.742 },
    alley_mid:              { x:.512, z:.788 },
    mill_back_corner:       { x:.398, z:.905 },
    alley_mouth:            { x:.500, z:.938 },
  },

  fixtures: [
    { id:"plywood_run", kind:"prop",
      along:["plywood_board_west","plywood_board_nearest"], count:3,
      note:"windows covered in plywood. Three boards; the paint is on the nearest." },
    { id:"the_mark_in_paint", kind:"prop", at:"fresh_paint_mark",
      note:"brokenCircle(). IMPORTED, never redrawn. Same shape as the flight trace, " +
           "the pen mark, the scar and the wing. The only one made with a brush." },
    { id:"truck_and_weeds", kind:"prop",
      along:["truck_chassis_cab","truck_chassis_rear"],
      note:"waist-high weeds grown THROUGH the chassis. The weeds are authored " +
           "between the two chassis stations so the plant is inside the machine." },
    { id:"the_spill", kind:"prop",
      along:["lavender_spill_west","lavender_spill_east"],
      note:"stems across the pavement, at the point Iona stopped running." },
    { id:"the_pursuit", kind:"path",
      along:["alley_mouth","alley_mid","alley_end_turn","iona_falters","fence_gap",
             "weeds_south","truck_chassis_rear","weeds_thru_chassis",
             "truck_chassis_cab","lot_far_corner","annex_door"],
      note:"BF-26. One straight run away from the lens over 252px of frame depth. Nobody " +
           "faces the camera in this plan." },
    { id:"sightline_lunch_to_the_mark", kind:"sightline",
      along:["niko_lunch_spot","fresh_paint_mark"],
      note:"BF-28: 'That wasn't here last week.' He has been eating lunch inside " +
           "sight of this wall and the plan says how far: 0.117 of the lot, 68px." },
  ],
});

/* ============================================================================
   MOTION-AWARE ORDERED RUN. One, and it is the whole plan.
   ============================================================================ */
export const pursuitRun = [
  "alley_mouth", "alley_mid", "alley_end_turn", "iona_falters", "fence_gap",
  "weeds_south", "truck_chassis_rear", "weeds_thru_chassis", "truck_chassis_cab",
  "lot_far_corner", "annex_door",
];

export const orderedRuns = [
  { id:"pursuitRun", axis:"z", dir:-1,
    motion:"ADVANCE", units:["BF-26"],
    stations: pursuitRun,
    note:"eleven stations, strictly decreasing in z: away from the lens, the whole " +
         "depth of the plan, without a cut. iona_falters is index 3 of 10 and is " +
         "where one of the three bodies stops advancing." },
];

/* CONTACT PAIRS. Two, both on pavement. */
export const contactPairs = [
  ["iona_falters",          "bag_split"],             // BF-27: the last thing she holds
  ["lavender_stem_touched", "oldbutterfly_alight"],   // BF-27: it touches one flower
];

/* ============================================================================
   BLOCKING. Two of the three. BF-28 is a HOLD on a wall with two people looking at
   it and no ground crossed; its occupancy is BF-27's, unedited.
   ============================================================================ */

/* --- BF-26  SERVICE ALLEY — the pursuit. ADVANCE --------------------------
   Mara runs the whole run. Niko runs most of it. Iona runs three stations and
   stops. The t1 values are the quantisation: advance(u, 11) has eleven indices and
   these moves land on them. */
export const INITIAL_BF26 = {
  mara:"alley_mouth", niko:"alley_mouth", iona:"alley_mouth",
  oldbutterfly:"alley_mid",
};
export const MOVES_BF26 = [
  { who:"oldbutterfly", from:"alley_mid",      to:"alley_end_turn",     t0:0.0, t1:1.2 },
  { who:"oldbutterfly", from:"alley_end_turn", to:"truck_chassis_rear", t0:1.2, t1:3.4 },
  { who:"oldbutterfly", from:"truck_chassis_rear", to:"lot_far_corner", t0:3.4, t1:5.6 },

  { who:"mara", from:"alley_mouth",     to:"alley_mid",       t0:0.2, t1:1.0 },
  { who:"mara", from:"alley_mid",       to:"alley_end_turn",  t0:1.0, t1:2.0 },
  { who:"mara", from:"alley_end_turn",  to:"fence_gap",       t0:2.0, t1:3.2 },
  { who:"mara", from:"fence_gap",       to:"weeds_south",     t0:3.2, t1:4.4 },
  { who:"mara", from:"weeds_south",     to:"truck_chassis_rear", t0:4.4, t1:5.2 },

  { who:"niko", from:"alley_mouth",     to:"alley_mid",       t0:0.4, t1:1.4 },
  { who:"niko", from:"alley_mid",       to:"alley_end_turn",  t0:1.4, t1:2.6 },
  { who:"niko", from:"alley_end_turn",  to:"fence_gap",       t0:2.6, t1:4.0 },
  { who:"niko", from:"fence_gap",       to:"weeds_south",     t0:4.0, t1:5.4 },

  /* twenty paces, and then her body remembers its age */
  { who:"iona", from:"alley_mouth",     to:"alley_mid",       t0:0.2, t1:1.2 },
  { who:"iona", from:"alley_mid",       to:"alley_end_turn",  t0:1.2, t1:2.4 },
  { who:"iona", from:"alley_end_turn",  to:"iona_falters",    t0:2.4, t1:3.6 },
];
export const exitOccupancyBF26 = occupancyAt(theLot, MOVES_BF26, 7, INITIAL_BF26);

/* --- BF-27  THE SPILLED LAVENDER. HOLD ------------------------------------
   Mara comes BACK toward the lens, which is the only reversal in the plan, because
   the old woman has stopped and the butterfly has come down to her. */
export const INITIAL_BF27 = exitOccupancyBF26;
export const MOVES_BF27 = [
  { who:"mara", from:"truck_chassis_rear", to:"bag_split", t0:0.0, t1:2.4 },
  { who:"oldbutterfly", from:"lot_far_corner", to:"oldbutterfly_alight", t0:1.0, t1:3.6 },
];
export const exitOccupancyBF27 = occupancyAt(theLot, MOVES_BF27, 6, INITIAL_BF27);

/* --- BF-28  THE PLYWOOD. HOLD ---------------------------------------------
   Niko walks up to the board. Nobody else does. */
export const INITIAL_BF28 = exitOccupancyBF27;
export const MOVES_BF28 = [
  { who:"niko", from:"weeds_south", to:"plywood_board_nearest", t0:0.0, t1:3.0 },
];
export const exitOccupancyBF28 = occupancyAt(theLot, MOVES_BF28, 6, INITIAL_BF28);

export const exitOccupancy = {
  "BF-26": exitOccupancyBF26, "BF-27": exitOccupancyBF27, "BF-28": exitOccupancyBF28,
};

export const occupancySinks = [];

export const crossPlanTies = [
  { station:"annex_door", plan:"the-facility",
    note:"BF-28 is the outside of this doorway and BF-29 is the inside of it." },
];

export default theLot;
