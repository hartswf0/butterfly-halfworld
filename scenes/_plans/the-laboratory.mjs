/* scenes/_plans/the-laboratory.mjs — THE LABORATORY. Upper floor of a converted mill.
   ============================================================================
   USED BY: 13 units, the heaviest load in the world.

     BF-02  MONITOR              TRACE      the flight path gathers into a figure
     BF-03  LABORATORY           HOLD       the manual switch; the hood; hands in sleeves
     BF-04  THE BENCH            TRANSFER   six points becoming twelve, twelve becoming none
     BF-05  THE PARTITION        HOLD       it settles on the white partition; the eyes look back
     BF-06  MONITOR              HOLD       "delete the path visualization" + the loose wire
     BF-07  HER HAND             TRANSFER   scales through a puncture; rubbed, they BRIGHTEN
     BF-08  THE TALL WINDOWS     HOLD       the city preserved in the glass; the loom bolts
     BF-09  THE CABINET          HOLD       the 1945 photograph, four people, a glasshouse
     BF-10  THE REVERSE          HOLD       ASTER HOUSE / AUGUST 1945 / DO NOT TURN AROUND
     BF-11  LABORATORY           CYCLE loop every answer is yes; returns exactly to its start
     BF-12  THE VIAL             BREAK      a crescent cut from the hindwing. Declared.
     BF-13  THE PHONE            HOLD       breathing, then Iona
     BF-14  RECOVERY RACK        CYCLE loop dry tapping at equal intervals

   MOTIONS DECLARED HERE: TRACE(1) HOLD(7) TRANSFER(2) CYCLE(2, both loop:true) BREAK(1).
   Both loop:true units are apparatus — the tapping vial (BF-14) and, arguably, BF-11.
   BF-11 is two people, but the thing that is closed is the DIALOGUE, not the bodies:
   Niko's questions return exactly to their start and Mara concedes each one. The plan
   answers this by giving BF-11 no MOVES at all. Nobody walks anywhere during it. If a
   body drifted across a closed cycle the loop would not close, and MOTION-BRIEF is
   explicit that a closed cycle is a trap and never a living thing.

   ---------------------------------------------------------------------------
   THE CAMERA. One camera at the fire door, low, looking the length of the room.
     z = 0   the tall windows
     z = 1   the fire door
   Everything in the first third of the story happens between those two numbers.

   THE NEAR EDGE IS THE NEXT PLAN'S FAR EDGE. `fire_door` here IS `fire_door` in
   the-mill: the same leaf of steel, at z .946 in this plan and z .085 in that one.
   Check F prints both projections: (561,709) here, (560,404) there.
   BF-14 ends in this room and BF-15 begins on the other side of that door with a smell
   coming up the stairwell. You walk out of the near edge of one frame into the far edge
   of the next and there is no cut. That is the same trick the-court/the-easement play
   with easement_mouth, and it is why the plans agree on which door it is.

   ---------------------------------------------------------------------------
   THE WINDOWS ARE THE CHARACTER, AND THEY ARE AT z = 0.10
   The instruction to make them the character and the decision to put them at the far,
   small end look like they contradict. They do not, for a mechanical reason:
   project() is a pure function of z and HAS NO ALTITUDE. A window "too tall for modern
   use" is tall in a dimension this plan does not have. Its height is the scene's job;
   the plan's job is to say where its foot is. Putting the glass at the far end buys
   something the near end could not: the city is small, held, and INSIDE the frame's
   vanishing end, which is what "preserved within the glass" means. They are not looking
   out at water towers. The water towers are in there with them, at 0.13 of the room's
   depth, at scale 0.719 against the 0.984 of the woman looking at them — 73% of a body,
   measured, not guessed. Same move as `stacks_dead_end` in the sibling
   world's library, where dead(7) is a direction rather than a mood.

   THE LOOM BOLTS ARE THE ROOM'S MEMORY AND THEY RHYME WITH THE MARK.
   Seven of them, on the loom-frame pitch: two rows of three, plus one in the middle of
   the floor. Each is a dark circle surrounded by rust — a filled circle in a ring, which
   is the broken circle with the gap closed and the stroke removed. The room is standing
   on seven of the same shape, unbroken, and nobody has looked at the floor.
   `loom_bolt_centre` sits directly on the line from `fire_door` to `mara_at_sleeves`.
   She steps over it every day without looking; that is the fixture `mara_path_of_habit`,
   and it is authored so that BF-08's revelation is a shot of ground she has already
   crossed in every unit of this plan that moves her at all.

   THE OBSERVATION BOX IS HELD AT LOW RESOLUTION HERE, ON PURPOSE.
   Three stations inside it — the two corridors and the white partition — and no more.
   The maze's interior geometry is authored ONCE, in scenes/_plans/the-maze.mjs, which
   is a magnification of this same object. `the-laboratory.partition_white_mid` IS
   `the-maze.partition_white_mid`. BF-05 (the wings closing, the false eyes looking
   backward) is shot in this plan because it is a thing seen from the room; BF-01 and
   BF-37 are shot in that one because they are things seen from the box.

   THE TRACE RUN IS THE ONLY ORDERED ARRAY HERE, AND IT IS A BROKEN CIRCLE.
   BF-02 declares TRACE and trace(u, points) consumes an ordered point list. The line
   on the monitor is NOT authored separately from the flight: `flightTraceArc` is nine
   stations on the path the animal actually flies over the box, ordered by angle, and
   the monitor draws that run. The arc's angular span and the position of its gap are
   taken from brokenCircle() in engine/motion.mjs — the gap is at the FAR edge (motion
   .mjs puts `open` at -PI/2, which is the top of the image, which is small z here) and
   the stroke crosses near the NEAR edge (strokeAt .78 lands the stroke at image y
   .74..795, the lower edge). Three stroke stations, `flightTraceStroke`, monotonic in x.

   WHERE THE STROKE MEETS THE ARC THERE IS NO STATION, and there cannot be: a plan
   cannot hold two names at one point, and the crossing is exactly one point. That
   intersection is the entire content of the mark and is drawn by brokenCircle(), not
   placed by this file. The stroke stations are deliberately set off the crossing.
   ============================================================================ */
import { makePlan, occupancyAt } from "../../engine/blocking.mjs";

export const theLaboratory = makePlan({
  id: "the-laboratory",
  name: "The Laboratory — upper floor, converted textile mill",
  notes:
    "Do not move the loom bolts; they are on the loom-frame pitch and `loom_bolt_centre` " +
    "is on the walked line from fire_door to mara_at_sleeves. Do not move fire_door — it " +
    "is the same steel leaf as the-mill.fire_door and check F asserts the name in both. Do " +
    "not add stations inside the observation box: the maze is authored in the-maze.mjs " +
    "and duplicating it there and here is how the world starts lying about one shape.",

  stations: {
    /* ===== FAR BAND: THE TALL WINDOWS ===================================
       Too tall for modern use. They hold the city rather than showing it. The three
       glass_* stations are things preserved IN the glass, not things behind it. */
    window_bay_west:        { x:.135, z:.110 },
    window_bay_centre:      { x:.440, z:.100 },
    window_bay_east:        { x:.760, z:.115 },
    glass_water_towers:     { x:.210, z:.132 },
    glass_apartment_roofs:  { x:.505, z:.126 },
    glass_stadium_rind:     { x:.672, z:.140 },   // the white rind. Not outside. In.
    window_ledge_west:      { x:.170, z:.178 },
    window_ledge_east:      { x:.735, z:.185 },

    /* ===== THE EXTRACTION HOOD AND THE FANS — far right ================
       BF-03: "Fans sigh. The lavender thins into the extraction hood." */
    hood_mouth:             { x:.885, z:.225 },
    hood_duct:              { x:.930, z:.290 },
    fan_bank:               { x:.955, z:.360 },
    filter_face:            { x:.912, z:.415 },

    /* ===== THE STAINLESS BENCH — the middle band ======================= */
    bench_west_end:         { x:.208, z:.452 },
    bench_vial_tray:        { x:.276, z:.470 },
    vial_upright:           { x:.300, z:.487 },
    bench_lamp:             { x:.606, z:.436 },
    bench_east_end:         { x:.660, z:.462 },

    /* ===== THE OBSERVATION BOX ==========================================
       Low resolution on purpose. See the header. */
    observation_box_far:    { x:.4455, z:.4225 },
    observation_box_lid:    { x:.4455, z:.4455 },  // acrylic. No resistance until contact.
    observation_box_centre: { x:.4455, z:.4695 },  // the trace arc turns about this point
    corridor_lavender_mid:      { x:.4025, z:.4805 },  // the corridor that carries it
    partition_white_mid:   { x:.4455, z:.4885 },  // BF-05. == the-maze.partition_white_mid
    corridor_clean_mid:         { x:.4885, z:.4805 },  // the corridor that does not
    observation_box_near:   { x:.4455, z:.5285 },

    /* ===== THE FLIGHT — BF-02's TRACE, in plan space ====================
       Nine stations, 42 degrees apart, spanning 336 degrees about
       observation_box_centre. The 24-degree gap is at the FAR edge, matching
       brokenCircle()'s `open` = 0.42 rad at -PI/2. */
    flight_arc_01:          { x:.4611, z:.4387 },  // -78 deg, just past the gap
    flight_arc_02:          { x:.5062, z:.4510 },  // -36
    flight_arc_03:          { x:.5201, z:.4728 },  //   6
    flight_arc_04:          { x:.4957, z:.4929 },  //  48
    flight_arc_05:          { x:.4455, z:.5010 },  //  90 — the near edge of the loop
    flight_arc_06:          { x:.3953, z:.4929 },  // 132
    flight_arc_07:          { x:.3709, z:.4728 },  // 174
    flight_arc_08:          { x:.3848, z:.4510 },  // 216
    flight_arc_09:          { x:.4299, z:.4387 },  // 258, and then it does not close

    /* the crooked stroke through the lower edge. Crooked in z, ordered in x.
       No station sits where it crosses the arc; see the header. */
    flight_stroke_west:     { x:.4103, z:.4917 },
    flight_stroke_mid:      { x:.4310, z:.4968 },
    flight_stroke_east:     { x:.4763, z:.4941 },

    /* ===== THE SLEEVE PORTS ============================================
       BF-03: "both hands inside the sleeves, although there was nothing left for her
       hands to do." Two ports, two gloves, one body behind them. */
    sleeve_port_left:       { x:.4125, z:.5745 },
    sleeve_port_right:      { x:.4785, z:.5745 },
    mara_glove_left:        { x:.4185, z:.5985 },  // CONTACT PAIR with sleeve_port_left
    mara_glove_right:       { x:.4725, z:.5985 },  // CONTACT PAIR with sleeve_port_right
    mara_at_sleeves:        { x:.4455, z:.6225 },  // she does not move for four units

    /* ===== INSIDE THE BOX: THE WRIST, THE VIAL, THE PUNCTURE ============
       BF-04 / BF-07 / BF-12. Six points becoming twelve, twelve becoming none. */
    mara_wrist_in_box:      { x:.4425, z:.5445 },  // CONTACT PAIR
    swallowtail_over_wrist: { x:.4485, z:.5375 },  // CONTACT PAIR — feet, not pressure
    glove_puncture_thumb:   { x:.4285, z:.5525 },  // BF-07: they came through here
    vial_in_glove:          { x:.4735, z:.5495 },  // she never gets it lowered
    white_card_behind:      { x:.4795, z:.5385 },  // BF-12: impossible brightness through
                                                   //   the missing crescent
    palm_scales_lit:        { x:.4085, z:.6475 },  // CONTACT PAIR with mara_at_sleeves.
                                                   //   Rubbed, they BRIGHTEN. Never dim.

    /* ===== NIKO ========================================================= */
    niko_manual_switch:     { x:.6285, z:.5325 },
    niko_hand_switch:       { x:.6135, z:.5645 },  // CONTACT PAIR — BF-03, "Stop means stop"
    loose_wire:             { x:.6725, z:.5645 },
    niko_hand_wire:         { x:.6595, z:.5785 },  // CONTACT PAIR — BF-06. He cannot yet
                                                   //   tell whether it is live.
    niko_at_bench:          { x:.5645, z:.6355 },
    mara_at_lamp:           { x:.5325, z:.5905 },  // BF-09/BF-10: she carries the
                                                   //   photograph to the bench lamp

    /* ===== THE MONITOR — a cart at the east end ========================= */
    monitor_cart:           { x:.7285, z:.5085 },
    monitor_screen:         { x:.7165, z:.4885 },  // where the green line gathers
    monitor_keyboard:       { x:.7365, z:.5285 },  // where it is deleted from the report
    mara_at_monitor:        { x:.7185, z:.5825 },
    niko_at_monitor:        { x:.7845, z:.5905 },

    /* ===== THE PERSONAL-OBJECTS CABINET — west wall =====================
       BF-09 / BF-10. The photograph is taken out here and read at the bench lamp,
       which is why it has two positions and not two sides: a plan has no verso. */
    cabinet_face:           { x:.0855, z:.5285 },
    cabinet_door_open:      { x:.1195, z:.5455 },
    cabinet_shelf_photos:   { x:.0925, z:.5645 },
    photo_at_cabinet:       { x:.1345, z:.5905 },  // CONTACT PAIR
    mara_at_cabinet:        { x:.1685, z:.6285 },  // CONTACT PAIR
    photo_under_lamp:       { x:.5885, z:.4785 },  // BF-09 face / BF-10 reverse
    photo_mark_child:       { x:.6015, z:.4845 },  // a broken circle above one child's head
    photo_reverse_ink:      { x:.5765, z:.4885 },  // blue fountain pen, faded black to brown

    /* ===== THE RECOVERY RACK — BF-14 ==================================== */
    recovery_rack_top:      { x:.8785, z:.4750 },
    recovery_rack_mid:      { x:.8845, z:.5285 },  // CONTACT PAIR
    recovery_rack_vial:     { x:.8905, z:.5765 },  // CONTACT PAIR — set in by hand.
                                                   //   Then the tapping starts.

    /* ===== THE PHONE — BF-13 ============================================ */
    wall_phone:             { x:.2005, z:.4325 },  // CONTACT PAIR
    mara_at_phone:          { x:.2345, z:.4785 },  // CONTACT PAIR

    /* ===== THE LOOM BOLTS — the floor's memory ==========================
       Two rows of three on the loom-frame pitch, plus one in the walked line.
       Dark circle in a ring of rust: the mark with its gap closed. */
    loom_bolt_nw:           { x:.318, z:.572 },
    loom_bolt_ne:           { x:.622, z:.560 },
    loom_bolt_w:            { x:.288, z:.700 },
    loom_bolt_e:            { x:.648, z:.688 },
    loom_bolt_centre:       { x:.468, z:.756 },   // the one she steps over without looking
    loom_bolt_sw:           { x:.262, z:.832 },
    loom_bolt_se:           { x:.672, z:.820 },

    /* ===== THE NEAR EDGE: THE FIRE DOOR ================================= */
    floor_open:             { x:.4655, z:.8855 },
    fire_door:              { x:.5005, z:.9455 },  // == the-mill.fire_door_landing
    fire_door_bar:          { x:.5405, z:.9525 },
  },

  fixtures: [
    { id:"tall_windows", kind:"prop",
      along:["window_bay_west","window_bay_east"], count:3,
      note:"three bays, broken by piers — a continuous glazing run stripes the frame " +
           "(BUILD-BRIEF S5). Too tall for modern use; the top third is above every " +
           "shot in this episode and is never given a sill." },
    { id:"city_in_the_glass", kind:"prop",
      along:["glass_water_towers","glass_stadium_rind"],
      note:"water towers, apartment roofs, the white rind of a stadium. PRESERVED " +
           "WITHIN the glass — draw them at the glass plane, not beyond it. Nothing " +
           "in this room is outdoors." },
    { id:"the_bench", kind:"prop", along:["bench_west_end","bench_east_end"], count:4,
      note:"stainless. Break the span in four; a full-width horizontal bar stripes " +
           "the frame." },
    { id:"extraction", kind:"prop", along:["hood_mouth","fan_bank"],
      note:"BF-03: the lavender thins into it. The odor is stopped. That is not the " +
           "same as stopped." },
    { id:"mara_path_of_habit", kind:"path",
      along:["fire_door","floor_open","loom_bolt_centre","mara_at_sleeves"],
      note:"the walked line. loom_bolt_centre is ON it. She steps over it without " +
           "looking, eleven times in thirteen units, and BF-08 is the unit that " +
           "finally looks down." },
    { id:"loom_bolt_rows", kind:"prop",
      along:["loom_bolt_nw","loom_bolt_se"], count:7,
      note:"dark circles surrounded by rust. The broken circle with the gap closed. " +
           "Do not draw them as ellipses of shadow — they are ink circles in a ring." },
    { id:"sightline_sleeves_to_monitor", kind:"sightline",
      along:["mara_at_sleeves","monitor_screen"],
      note:"BF-02/BF-06. She can see the line being drawn and the line being deleted " +
           "without taking her hands out of the box." },
    { id:"sightline_sleeves_to_windows", kind:"sightline",
      along:["mara_at_sleeves","window_bay_centre"],
      note:"BF-08. The whole length of the room, over every loom bolt on the walked " +
           "line, and it ends in a pane holding a stadium." },
    { id:"the_trace", kind:"path",
      along:["flight_arc_01","flight_arc_09"], count:9,
      note:"BF-02. Not a drawing. The animal's actual course, accumulated by trace()." },
  ],
});

/* ============================================================================
   MOTION-AWARE ORDERED RUNS.
   A motion cannot sweep an unordered set. Each run declares the axis it traverses
   and harness/verify-plans.mjs asserts monotonicity in exactly that axis.
   axis "theta" is unwrapped about `about` before the check, because a ring that
   crosses atan2's branch cut is still a ring.
   ============================================================================ */
export const orderedRuns = [
  { id:"flightTraceArc", axis:"theta", dir:1, about:"observation_box_centre",
    motion:"TRACE", units:["BF-02"],
    stations:["flight_arc_01","flight_arc_02","flight_arc_03","flight_arc_04",
              "flight_arc_05","flight_arc_06","flight_arc_07","flight_arc_08",
              "flight_arc_09"],
    note:"336 degrees in nine steps of 42. The 24-degree gap between arc_09 and " +
         "arc_01 is at the FAR edge and is brokenCircle()'s `open`. The figure is " +
         "invisible in every instant of it." },
  { id:"flightTraceStroke", axis:"x", dir:1,
    motion:"TRACE", units:["BF-02"],
    stations:["flight_stroke_west","flight_stroke_mid","flight_stroke_east"],
    note:"the crooked stroke across the lower edge. Ordered in x; crooked in z, " +
         "which is what makes it crooked and not a chord." },
];
export const flightTraceArc    = orderedRuns[0].stations;
export const flightTraceStroke = orderedRuns[1].stations;

/* CONTACT PAIRS — declared, not discovered. Every one is on ground a body can stand
   on or reach across. Nothing is paired to the glass, the hood, or a loom bolt. */
export const contactPairs = [
  ["sleeve_port_left",  "mara_glove_left"],      // BF-03: hands inside, nothing to do
  ["sleeve_port_right", "mara_glove_right"],
  ["mara_wrist_in_box", "swallowtail_over_wrist"],// BF-04: six points becoming twelve
  ["mara_at_sleeves",   "palm_scales_lit"],      // BF-07: she rubs them and they brighten
  ["niko_manual_switch","niko_hand_switch"],     // BF-03: "Stop means stop."
  ["loose_wire",        "niko_hand_wire"],       // BF-06: he cannot tell whether it is live
  ["photo_at_cabinet",  "mara_at_cabinet"],      // BF-09: she takes it off the shelf
  ["recovery_rack_mid", "recovery_rack_vial"],   // BF-14: it is set into the rack by hand
  ["wall_phone",        "mara_at_phone"],        // BF-13: a number she does not know
];

/* ============================================================================
   BLOCKING. Five of the thirteen units are blocked, chained, because they are the
   ones where a body actually crosses ground. The other eight are HOLD or CYCLE on
   stations already occupied, and pre-authoring MOVES tables for them before a frame
   has been rendered would be inventing motion the text does not have.

   BF-11 IS DELIBERATELY UNBLOCKED. It is CYCLE loop:true and the loop must close
   exactly. A body crossing the room during it would make the last frame differ from
   frame 0. Nobody moves; the closed thing is the conversation.
   ============================================================================ */
const carryOver = (occ, ...who) =>
  Object.fromEntries(Object.entries(occ).filter(([k]) => who.includes(k)));

/* --- BF-02  MONITOR — the line gathers. TRACE. mara, niko ------------------
   She does not leave the box. Niko crosses to the screen and says stop. */
export const INITIAL_BF02 = {
  mara:"mara_at_sleeves", niko:"niko_at_bench", swallowtail:"flight_arc_05",
};
export const MOVES_BF02 = [
  { who:"niko",        from:"niko_at_bench",  to:"niko_at_monitor", t0:1.4, t1:3.2 },
  { who:"swallowtail", from:"flight_arc_05",  to:"flight_arc_09",   t0:0.0, t1:2.6 },
];
export const exitOccupancyBF02 = occupancyAt(theLaboratory, MOVES_BF02, 6, INITIAL_BF02);

/* --- BF-03  LABORATORY — the switch, the hood, the hands. HOLD ------------
   CONTINUOUS: the initial occupancy is BF-02's exit, unedited. Niko crosses to the
   manual switch. Mara has not moved and will not for four units. */
export const INITIAL_BF03 = exitOccupancyBF02;
export const MOVES_BF03 = [
  { who:"niko", from:"niko_at_monitor", to:"niko_hand_switch", t0:0.4, t1:2.2 },
  { who:"swallowtail", from:"flight_arc_09", to:"flight_arc_05", t0:0.0, t1:3.4 },
];
export const exitOccupancyBF03 = occupancyAt(theLaboratory, MOVES_BF03, 6, INITIAL_BF03);

/* --- BF-04  THE BENCH — the transfer. TRANSFER ----------------------------
   The only unit in which the animal and the body occupy a contact pair. */
export const INITIAL_BF04 = { ...exitOccupancyBF03 };
export const MOVES_BF04 = [
  { who:"swallowtail", from:"flight_arc_05", to:"swallowtail_over_wrist", t0:0.6, t1:2.0 },
  { who:"swallowtail", from:"swallowtail_over_wrist", to:"observation_box_lid",
    t0:3.4, t1:4.2 },
];
export const exitOccupancyBF04 = occupancyAt(theLaboratory, MOVES_BF04, 6, INITIAL_BF04);

/* --- BF-09  THE CABINET — the 1945 photograph. HOLD -----------------------
   The first time in the episode Mara takes her hands out of the box. The walk is
   long on purpose: cabinet is at x .085 and the box is at x .445, and she crosses
   four loom bolts to get there. */
export const INITIAL_BF09 = {
  ...carryOver(exitOccupancyBF04, "niko", "swallowtail"),
  mara:"mara_at_sleeves",
};
export const MOVES_BF09 = [
  { who:"mara", from:"mara_at_sleeves",  to:"mara_at_cabinet",  t0:0.0, t1:2.8 },
  { who:"mara", from:"mara_at_cabinet",  to:"mara_at_lamp",     t0:5.0, t1:7.4 },
  { who:"niko", from:"niko_hand_switch", to:"niko_at_monitor",  t0:1.0, t1:2.6 },
];
export const exitOccupancyBF09 = occupancyAt(theLaboratory, MOVES_BF09, 9, INITIAL_BF09);

/* --- BF-13  THE PHONE — breathing, then Iona. HOLD ------------------------
   Iona is a voice with a number and no body in this plan; she is not blocked here,
   and the first station she is ever given is the-mill.iona_stand. */
export const INITIAL_BF13 = carryOver(exitOccupancyBF09, "mara", "niko", "swallowtail");
export const MOVES_BF13 = [
  { who:"mara", from:"mara_at_lamp", to:"mara_at_phone", t0:0.8, t1:3.0 },
  { who:"swallowtail", from:"observation_box_lid", to:"recovery_rack_vial",
    t0:0.0, t1:1.2 },
];
export const exitOccupancyBF13 = occupancyAt(theLaboratory, MOVES_BF13, 6, INITIAL_BF13);

/* --- BF-14  RECOVERY RACK — the tapping. CYCLE loop:true ------------------
   NO MOVES. loop:true is an apparatus and the loop must close. The tapping goes
   around the circumference of a palm-width vial at equal intervals; that ring is
   BELOW THIS PLAN'S RESOLUTION and is deliberately not authored as stations. Eight
   stations around a 30mm vial would project 0.4px apart and would be a lie about
   what a plan can hold. The plan supplies recovery_rack_vial; the scene draws the
   ring at that point with cycle({ beats: 8, closed: true }). The identical decision
   is taken for the canister in the-mill (BF-21), and the two rings are the rhyme. */
export const INITIAL_BF14 = carryOver(exitOccupancyBF13, "mara", "niko", "swallowtail");
export const MOVES_BF14 = [];
export const exitOccupancyBF14 = occupancyAt(theLaboratory, MOVES_BF14, 6, INITIAL_BF14);

export const exitOccupancy = {
  "BF-02": exitOccupancyBF02, "BF-03": exitOccupancyBF03,
  "BF-04": exitOccupancyBF04, "BF-09": exitOccupancyBF09,
  "BF-13": exitOccupancyBF13, "BF-14": exitOccupancyBF14,
};

export const occupancySinks = [];

/* CROSS-PLAN TIES. One physical object, two plans, one name. Check F asserts the
   name exists in both and prints the two projections, which SHOULD differ — the
   cameras are different, and that is the point. */
export const crossPlanTies = [
  { station:"fire_door", plan:"the-mill",
    note:"the same steel leaf. z .946 here (the near edge), z .085 there (the far " +
         "edge). BF-14 ends on this side of it and BF-15 begins on the other." },
];

export default theLaboratory;
