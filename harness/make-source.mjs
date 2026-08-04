#!/usr/bin/env node
/* ============================================================================
   make-source.mjs — I REMEMBER BEING A BUTTERFLY → atlas/source.json

   THIS WORLD IS NOT A PHOTO-ROMAN. Abiding Acres was stills because 44% of it
   held in silence. This text is the opposite: its central images do not exist
   in a single frame at all.

     "The mark existed only when the wings were closed together."

   The symbol is not a picture. It is the difference between two states, and it
   only exists across the cycle. Likewise the broken circle is a TRACE — the
   accumulated flight path, invisible in any instant. Likewise the chrysalis
   wall opens as "a synchronized line passing across the wall from left to
   right" — a sweep, not a state.

   So every unit declares a MOTION, and the motion vocabulary is taken from the
   text rather than imposed on it:

     CYCLE     a loop that repeats and must not resolve
               "Impact. Drop. A tilt of black-veined wings. Recovery. Impact."
     TRACE     accumulation; the figure appears only after time has passed
               "The line gathered over itself, loop after loop, until a figure appeared"
     SWEEP     a wave crossing space in one direction
               "a synchronized line passing across the wall from left to right"
     TRANSFER  a substance moving between surfaces, changing neither
               scales: butterfly → glove → skin → tape → film → the beam
     ADVANCE   discrete frames stepping past a gate
               the film strip between her fingers; the projector
     DISSOLVE  one image becoming another without a cut
               the projection changing from the glasshouse to the lobby
     HOLD      stillness doing work; the held breath, the refusal to move
     BREAK     a single discontinuity — the only kind of cut this world allows

   Every unit also declares `loop`: whether its motion closes (returns to its
   first frame) or does not. A CYCLE that closes is a trap. A CYCLE that does
   not close is a life. The text is about the difference.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const A = path.resolve("atlas");
fs.mkdirSync(A, { recursive: true });

const U = [];
const u = (id, title, place, time, motion, loop, cast, beats, el = [], concepts = []) =>
  U.push({ id, kind: "scene", num: String(U.length + 1).padStart(2, "0"),
           title: `${place.startsWith("EXT") ? "" : ""}${place} -- ${time}`,
           place, motion, loop, cast, beats, el, concepts,
           ep: "B01", eptitle: "I REMEMBER BEING A BUTTERFLY" });

/* ---------------------------------------------------------------- THE MAZE */
u("BF-01","The Refusal","INT. OBSERVATION BOX","MORNING","CYCLE",false,["swallowtail","mara"],
  ["A swallowtail rises into the clear acrylic lid of a choice maze and strikes it.",
   "It falls, rights itself in air, and strikes again. The roof offers no resistance until contact.",
   "Below, lavender divides the world: one corridor carries it, the other does not.",
   "The choice interval has run 43 seconds and should have ended after 30. It does not choose."],
  [["VO","I remember being a butterfly."],
   ["VO","I remember the roof as a brightness I could not enter."],
   ["VO","I did not choose."]],
  [{concept:"refusal",h:9},{concept:"transparency",h:7}]);

u("BF-02","The Trace","INT. LABORATORY · MONITOR","CONTINUOUS","TRACE",false,["mara","niko"],
  ["The software draws the flight path as a green line.",
   "The line gathers over itself, loop after loop.",
   "A figure appears: an almost closed circle crossed near its lower edge by a crooked stroke."],
  [["CHAR","NIKO"],["DIAL","Stop the trial."]],
  [{concept:"mark",h:10},{concept:"accumulation",h:8}]);

u("BF-03","Stop Means Stop","INT. LABORATORY","CONTINUOUS","HOLD",false,["mara","niko","swallowtail"],
  ["Niko presses the manual switch. Fans sigh. The lavender thins into the extraction hood.",
   "The butterfly continues its pattern regardless.",
   "Mara has not moved. Her hands are still inside the sleeves of the observation box."],
  [["CHAR","NIKO"],["DIAL","Stop means stop."],["CHAR","MARA"],["DIAL","It's stopped."],
   ["CHAR","NIKO"],["DIAL","The odor is stopped."],["CHAR","MARA"],["DIAL","That's what I meant."],
   ["CHAR","NIKO"],["DIAL","No, it isn't."]],
  [{concept:"refusal",h:6}]);

u("BF-04","Six Points Becoming Twelve","INT. LABORATORY · THE BENCH","CONTINUOUS","TRANSFER",false,["mara","swallowtail"],
  ["The butterfly passes over her wrist before she can lower the vial.",
   "Its feet touch her skin: not pressure but arrangement — six points becoming twelve, twelve becoming none.",
   "It lifts and strikes the ceiling once more. A yellow powder remains on her glove."],
  [], [{concept:"transfer",h:9}]);

u("BF-05","The False Eyes","INT. LABORATORY · THE PARTITION","CONTINUOUS","HOLD",false,["mara","swallowtail"],
  ["The swallowtail settles on the white partition between the two corridors.",
   "Its wings close, opening the false eyes on their undersides.",
   "The eyes look backward."],
  [["CHAR","NIKO"],["DIAL","Trial 6F-19. Non-completion."],
   ["CHAR","MARA"],["DIAL","It completed something."],
   ["CHAR","NIKO"],["DIAL","It chose the ceiling?"],
   ["CHAR","MARA"],["DIAL","It rejected the premise."]],
  [{concept:"watching",h:8},{concept:"refusal",h:7}]);

u("BF-06","Delete The Path","INT. LABORATORY · MONITOR","CONTINUOUS","HOLD",false,["mara","niko"],
  ["Mara asks for the path visualization to be deleted from the report.",
   "Niko discovers a loose wire and cannot yet tell whether it is live."],
  [["CHAR","MARA"],["DIAL","Delete the path visualization."],
   ["CHAR","NIKO"],["DIAL","The path is the record."],
   ["CHAR","MARA"],["DIAL","The arm choice is the record."],
   ["CHAR","NIKO"],["DIAL","It didn't choose an arm."],
   ["CHAR","MARA"],["DIAL","Then the trial failed."]],
  [{concept:"cleanversion",h:9},{concept:"mark",h:5}]);

u("BF-07","The Scales Brighten","INT. LABORATORY · HER HAND","CONTINUOUS","TRANSFER",false,["mara"],
  ["Yellow scales have passed through a puncture near the thumb and settled on her skin.",
   "They lie in the lines of her palm like ground metal.",
   "She rubs them with the side of her finger. Instead of disappearing, they brighten."],
  [["CHAR","NIKO"],["DIAL","What is that?"],["CHAR","MARA"],["DIAL","Wing scale."]],
  [{concept:"transfer",h:10}]);

u("BF-08","The Mill","INT. LABORATORY · THE TALL WINDOWS","MORNING","HOLD",false,["mara"],
  ["The laboratory occupies the upper floor of a converted textile mill; the windows are too tall for modern use.",
   "Water towers, apartment roofs, the white rind of a stadium appear not outside but preserved within the glass.",
   "The butterfly room once housed looms. Their floor bolts remain — dark circles surrounded by rust."],
  [], [{concept:"preservation",h:7},{concept:"mark",h:4}]);

/* ------------------------------------------------------------ THE PHOTOGRAPH */
u("BF-09","Aster House","INT. LABORATORY · THE CABINET","CONTINUOUS","HOLD",false,["mara","niko"],
  ["Four people stand outside a glasshouse whose windows have been painted white for blackout.",
   "A woman in a pale dress holds a shallow wooden tray of chrysalides, each tied upright to a narrow card.",
   "Someone has drawn a mark above one child's head: a broken circle with a stroke through its lower edge."],
  [["CHAR","NIKO"],["DIAL","Who are they?"],["CHAR","MARA"],["DIAL","I don't know."],
   ["CHAR","NIKO"],["DIAL","Family?"],["CHAR","MARA"],["DIAL","The woman is supposed to be my grandmother."]],
  [{concept:"mark",h:9},{concept:"recurrence",h:8}]);

u("BF-10","Do Not Turn Around","INT. LABORATORY · THE REVERSE","CONTINUOUS","HOLD",false,["mara","niko"],
  ["On the back, in blue fountain pen: ASTER HOUSE / AUGUST 1945 / IONA, ELISE, THOMAS / DO NOT TURN AROUND.",
   "Below the writing is the same broken circle. The ink has faded from black to brown but the shape is clean."],
  [["CHAR","NIKO"],["DIAL","Your mother was alive in 1945?"],["CHAR","MARA"],["DIAL","No."],
   ["CHAR","MARA"],["DIAL","My mother was born in 1963."],
   ["CHAR","NIKO"],["DIAL","Then Elise isn't your mother."],
   ["CHAR","MARA"],["DIAL","It was her name."],
   ["CHAR","MARA"],["DIAL","She said she remembered being there."]],
  [{concept:"recurrence",h:10},{concept:"turnback",h:9}]);

u("BF-11","Could It Have","INT. LABORATORY","CONTINUOUS","CYCLE",true,["mara","niko"],
  ["A closed loop of question and concession that returns exactly to where it began.",
   "Every answer is yes. Nothing is resolved by any of them."],
  [["CHAR","NIKO"],["DIAL","Could it have gotten into the intake?"],["CHAR","MARA"],["DIAL","The sensor would have caught it."],
   ["CHAR","NIKO"],["DIAL","Could the sensor be wrong?"],["CHAR","MARA"],["DIAL","Yes."],
   ["CHAR","NIKO"],["DIAL","Could the cleaning have failed?"],["CHAR","MARA"],["DIAL","Yes."],
   ["CHAR","NIKO"],["DIAL","Then why are we looking at a photograph from 1945?"]],
  [{concept:"cleanversion",h:8}]);

u("BF-12","The Crescent","INT. LABORATORY · THE VIAL","CONTINUOUS","BREAK",false,["mara","niko","swallowtail"],
  ["One hindwing is damaged. A small crescent has been removed from its edge, as neatly as if cut with a punch.",
   "Through the missing portion, the white card behind shows with impossible brightness.",
   "There is nothing sharp in the maze."],
  [["CHAR","NIKO"],["DIAL","Was that there before?"],["CHAR","MARA"],["DIAL","No."]],
  [{concept:"damage",h:9},{concept:"transparency",h:6}]);

u("BF-13","You Opened The Lavender","INT. LABORATORY · THE PHONE","CONTINUOUS","HOLD",false,["mara","niko","iona"],
  ["For several seconds there is only breathing — a larger rhythm, rough and receding, like water dragged over stone.",
   "An old woman's voice arrives from a number Mara does not know."],
  [["CHAR","IONA (V.O.)"],["DIAL","You opened the lavender."],
   ["CHAR","IONA (V.O.)"],["DIAL","You always open it too early. Your mother did. Her mother did. The insects wake before the story is ready for them."],
   ["CHAR","IONA (V.O.)"],["DIAL","I found the boy. He has been dead for eleven years."]],
  [{concept:"recurrence",h:9},{concept:"waking",h:8}]);

u("BF-14","Equal Intervals","INT. LABORATORY · RECOVERY RACK","CONTINUOUS","CYCLE",true,["swallowtail"],
  ["From the recovery rack comes a dry tapping.",
   "The butterfly strikes the vial once, then again. Not wildly.",
   "It moves around the circumference, testing the glass at equal intervals."],
  [], [{concept:"refusal",h:7},{concept:"mark",h:6}]);

/* ------------------------------------------------------------ THE DESCENT */
u("BF-15","The Stairwell","INT. MILL · THE FIRE DOOR","CONTINUOUS","TRANSFER",false,["mara","niko"],
  ["A smell rises from the stairwell — not the measured concentration of the maze.",
   "This is green and bitter. Crushed stems warming in a hand."],
  [["CHAR","MARA"],["DIAL","Call building security."]],
  [{concept:"transfer",h:7},{concept:"waking",h:6}]);

u("BF-16","Long Dusty Columns","INT. MILL · THE STAIRCASE","CONTINUOUS","ADVANCE",false,["mara"],
  ["Light enters from windows at each landing and falls in long dusty columns.",
   "Mara moves down through them, one after another.",
   "A strip of red satin slides across her shoe like a tongue."],
  [], [{concept:"advance",h:6}]);

u("BF-17","Iona Ash","INT. MILL · THE LOBBY","NOON","HOLD",false,["mara","iona"],
  ["A small woman in a navy coat with a flattened fur collar, holding a grocery bag darkened at the bottom.",
   "Lavender protrudes from it in a thick bundle.",
   "She looks not up the stairs but at their reflection in the glass door.",
   "Her face has an unfinished quality — expressions arriving before the features can contain them."],
  [["CHAR","IONA"],["DIAL","You have her shoulders."],
   ["CHAR","MARA"],["DIAL","Are you Iona Ash?"],
   ["CHAR","IONA"],["DIAL","That depends which paper you're reading."],
   ["CHAR","MARA"],["DIAL","My mother is dead."],
   ["CHAR","IONA"],["DIAL","Yes. That was what made it difficult."]],
  [{concept:"recurrence",h:8}]);

u("BF-18","The Canister","INT. MILL · THE LOBBY","CONTINUOUS","HOLD",false,["mara","iona","niko"],
  ["A dented circular canister no wider than her palm. Rust spreads from the hinge in branching lines.",
   "Around the edge, black electrical tape. Beneath the rust, a fragment of white label: ASTER.",
   "Yellow scales cling to the tape, caught in the adhesive. They are fresh enough to shine."],
  [["CHAR","IONA"],["DIAL","I brought you the film."],
   ["CHAR","MARA"],["DIAL","Where did these come from?"],
   ["CHAR","IONA"],["DIAL","The envelope."],
   ["CHAR","MARA"],["DIAL","Was there a butterfly in it?"],
   ["CHAR","IONA"],["DIAL","Not when I closed it."]],
  [{concept:"transfer",h:9},{concept:"containment",h:7}]);

u("BF-19","The Clean Version","INT. MILL · THE LOBBY","CONTINUOUS","HOLD",false,["mara","niko","iona"],
  ["Niko reaches for the canister. Mara moves it away from him.",
   "The gesture is small. It enters the room like a confession."],
  [["CHAR","IONA"],["DIAL","You work for the clean version."],
   ["CHAR","NIKO"],["DIAL","And you work for what?"],
   ["CHAR","IONA"],["DIAL","The version that survived."],
   ["CHAR","NIKO"],["DIAL","This is exactly how contamination happens."]],
  [{concept:"cleanversion",h:10},{concept:"containment",h:8}]);

u("BF-20","Rows Of Seated People","INT. MILL · THE GLASS DOOR","CONTINUOUS","TRANSFER",false,["mara"],
  ["Through the glass the street stands white in the noon heat. A bus passes.",
   "For an instant its windows reflect the mill's brick façade, and the lobby appears occupied by rows of seated people moving backward."],
  [], [{concept:"preservation",h:8},{concept:"turnback",h:7}]);

u("BF-21","The Tapping","INT. MILL · THE LOBBY FLOOR","CONTINUOUS","CYCLE",true,["mara","niko","iona"],
  ["The canister clicks. All three hear it.",
   "The sound comes again, faint and exact. Not metal contracting.",
   "Something taps from inside, moving around the circumference at equal intervals."],
  [["CHAR","NIKO"],["DIAL","Put it down."],
   ["CHAR","NIKO"],["DIAL","That isn't possible."]],
  [{concept:"waking",h:9},{concept:"containment",h:8}]);

u("BF-22","Do Not Watch It A Third Time","INT. MILL · THE LOBBY","CONTINUOUS","HOLD",false,["mara","iona"],
  ["Iona catches Mara's wrist. Her hand is unexpectedly strong.",
   "At the base of her thumb is a scar: a broken circle crossed by a crooked line."],
  [["CHAR","IONA"],["DIAL","The first time you see it, you will think the picture is remembering the event."],
   ["CHAR","IONA"],["DIAL","The second time, you will think the event was arranged to resemble the picture."],
   ["CHAR","IONA"],["DIAL","Do not watch it a third time."],
   ["CHAR","MARA"],["DIAL","Why?"],
   ["CHAR","IONA"],["DIAL","Because then you will remember being there."]],
  [{concept:"mark",h:9},{concept:"recurrence",h:9}]);

u("BF-23","Emerging Through Its Own History","INT. MILL · THE OPEN CANISTER","CONTINUOUS","CYCLE",false,["mara","oldbutterfly"],
  ["Inside: a coil of 8mm film wrapped in waxed paper, and a dry chrysalis resting in the hollow centre of the reel.",
   "Larger than any swallowtail chrysalis Mara has seen. Split along one side. Empty.",
   "A black leg appears beneath the film, withdraws, appears again.",
   "The butterfly pushes upward through a nest of its own discarded history."],
  [], [{concept:"waking",h:10},{concept:"recurrence",h:7}]);

u("BF-24","The Mark Divides","INT. MILL · THE REEL","CONTINUOUS","CYCLE",false,["mara","oldbutterfly"],
  ["Across the left hindwing the scales form a pale broken circle. No line crosses it.",
   "The butterfly raises its wings. On the right hindwing is the line.",
   "The mark exists only when the wings are closed together.",
   "It opens: the symbol divides. It closes: the symbol becomes whole."],
  [["CHAR","IONA"],["DIAL","Now you understand why it cannot be photographed."],
   ["CHAR","NIKO"],["DIAL","Of course it can be photographed."]],
  [{concept:"mark",h:10},{concept:"transparency",h:8}]);

u("BF-25","Summer Enters","INT. MILL · THE ENTRANCE DOOR","CONTINUOUS","BREAK",false,["mara","niko","oldbutterfly"],
  ["The butterfly climbs the white brightness of the door. Impact. Drop. Recovery.",
   "The orange cup breaks without drama, pieces sliding apart over the stone.",
   "Niko shoves the crash bar. Heat, traffic, hot rubber, river damp, cut weeds, diesel, sunlight.",
   "The butterfly passes into all of it and vanishes above the awning."],
  [["CHAR","MARA"],["DIAL","Open the door."],
   ["CHAR","NIKO"],["DIAL","If it gets outside—"],
   ["CHAR","MARA"],["DIAL","It will kill itself."]],
  [{concept:"refusal",h:8},{concept:"transparency",h:9}]);

/* -------------------------------------------------------------- THE PURSUIT */
u("BF-26","Therefore They Turned","EXT. SERVICE ALLEY","CONTINUOUS","ADVANCE",false,["mara","niko","iona","oldbutterfly"],
  ["The butterfly turns at the alley's end. Therefore they turn.",
   "It crosses a fenced lot where waist-high weeds have grown through the chassis of a delivery truck.",
   "Iona is fast for perhaps twenty paces. Then her body remembers its age."],
  [["CHAR","MARA"],["DIAL","Where is it going?"],
   ["CHAR","IONA"],["DIAL","To the boy."],
   ["CHAR","MARA"],["DIAL","You said he's dead."],
   ["CHAR","IONA"],["DIAL","I said we found him."]],
  [{concept:"advance",h:8}]);

u("BF-27","It Isn't Afraid","EXT. THE LOT · THE SPILLED LAVENDER","CONTINUOUS","HOLD",false,["mara","iona","oldbutterfly"],
  ["The bag splits, releasing lavender stems across the pavement.",
   "The butterfly descends and touches one flower. It does not recoil."],
  [["CHAR","MARA"],["DIAL","It isn't afraid."],
   ["CHAR","IONA"],["DIAL","Why would it be?"],
   ["CHAR","MARA"],["DIAL","Our colony—"],
   ["CHAR","IONA"],["DIAL","Your colony was taught."],
   ["CHAR","MARA"],["DIAL","This one has the same marking."],
   ["CHAR","IONA"],["DIAL","Marking is not memory."]],
  [{concept:"mark",h:8},{concept:"waking",h:6}]);

u("BF-28","The Paint Is New","EXT. THE WAREHOUSE · PLYWOOD","CONTINUOUS","HOLD",false,["mara","niko"],
  ["A low brick structure attached to the rear of the warehouse, windows covered in plywood.",
   "On the nearest board, painted: a broken circle with a line through it. The paint is new."],
  [["CHAR","NIKO"],["DIAL","That wasn't here last week."],
   ["CHAR","MARA"],["DIAL","You come here?"],
   ["CHAR","NIKO"],["DIAL","Lunch."]],
  [{concept:"mark",h:9},{concept:"recurrence",h:7}]);

/* ------------------------------------------------------------ THE FACILITY */
u("BF-29","The Part That Keeps Reappearing","INT. REARING FACILITY","CONTINUOUS","HOLD",false,["mara","niko","iona"],
  ["Clear plastic sheeting divides the loading room into narrow chambers. Tubes run along the floor. Fans turn behind filters.",
   "Hundreds of chrysalides hang from cards along the far wall. Each card bears a date: 1951, 1952, 1953, 1954, 1955.",
   "The oldest cards are brown and soft at the corners. The newest are clean white plastic.",
   "Every chrysalis, old or new, is fastened identically: a loop of silk around the thorax, a drop of adhesive beneath the tail."],
  [["CHAR","NIKO"],["DIAL","This is a rearing facility."],
   ["CHAR","IONA"],["DIAL","No."],
   ["CHAR","IONA"],["DIAL","This is the part that keeps reappearing."],
   ["CHAR","MARA"],["DIAL","You built this."],
   ["CHAR","IONA"],["DIAL","I remembered it."]],
  [{concept:"recurrence",h:10},{concept:"preservation",h:9}]);

u("BF-30","The Pool","INT. REARING FACILITY · THE TILED POOL","CONTINUOUS","HOLD",false,["mara","iona"],
  ["A shallow tiled pool at the centre. Lavender grows in galvanized troughs around its edge.",
   "A projector stands on a wheeled cart. Its power light is on. Opposite, a white rectangle waits."],
  [["CHAR","NIKO"],["DIAL","Someone has been running experiments here."],
   ["CHAR","NIKO"],["DIAL","How many?"],
   ["CHAR","IONA"],["DIAL","Enough to keep it from becoming evidence."]],
  [{concept:"containment",h:8},{concept:"preservation",h:7}]);

u("BF-31","The Frame That Is Today","INT. REARING FACILITY · THE FILM IN HER HAND","CONTINUOUS","ADVANCE",false,["mara","niko"],
  ["She holds the strip toward the fluorescent light and advances it between her fingers.",
   "The child straightens. The woman turns. The butterfly descends.",
   "Then the image changes: the next frame shows Mara herself standing in the lobby with the canister in her hands.",
   "She drops the film. Niko catches it. He lifts it to the light and sees only the glasshouse."],
  [["CHAR","NIKO"],["DIAL","What did you see?"],
   ["CHAR","MARA"],["DIAL","I saw today."],
   ["CHAR","IONA"],["DIAL","You saw yourself arranged as a memory."]],
  [{concept:"advance",h:10},{concept:"turnback",h:8}]);

u("BF-32","Every Chrysalis Was Empty","INT. REARING FACILITY · THE WALL","CONTINUOUS","SWEEP",false,["mara","niko","iona"],
  ["A clicking comes from the wall. One chrysalis moves. Then another. The sound travels down the rows.",
   "Each seam splits at once — a synchronized line passing across the wall from left to right.",
   "The oldest open first. Empty. Then the next. Empty. Every chrysalis is empty.",
   "Yet the wall continues to move: something passes through the husks without occupying them, a distortion like wind crossing tall grass."],
  [["CHAR","NIKO"],["DIAL","Temperature change?"],["CHAR","MARA"],["DIAL","No."],
   ["CHAR","NIKO"],["DIAL","Vibration?"],["CHAR","MARA"],["DIAL","No."],
   ["CHAR","NIKO"],["DIAL","You have to give me something."]],
  [{concept:"waking",h:10},{concept:"recurrence",h:9}]);

u("BF-33","No One Had Threaded The Film","INT. REARING FACILITY · THE PROJECTION","CONTINUOUS","DISSOLVE",false,["mara","iona"],
  ["The projector turns on. Its fan rises to speed. Light strikes the wall.",
   "No one has threaded the film. Nevertheless an image appears.",
   "A glasshouse. White-painted windows. Lavender beside a pool. Three children with their backs to the camera.",
   "A woman enters carrying a tray of chrysalides. Mara knows her before she turns — not her face. Her shoulders."],
  [["CHAR","MARA"],["DIAL","Who is filming?"],
   ["CHAR","IONA"],["DIAL","The person who remembers."]],
  [{concept:"preservation",h:9},{concept:"turnback",h:8}]);

u("BF-34","Her Mother's Voice","INT. REARING FACILITY","CONTINUOUS","HOLD",false,["mara","elise"],
  ["The sound comes from behind her.",
   "Not the voice thinned by medication and made formal by the effort to appear lucid.",
   "This is the voice from childhood — impatient and amused, calling from the front seat while Mara knelt backward in the car to watch a storm disappear behind them."],
  [["CHAR","ELISE (V.O.)"],["DIAL","Do not turn around."]],
  [{concept:"turnback",h:10}]);

u("BF-35","Therefore The Film Changed","INT. REARING FACILITY · THE WALL","CONTINUOUS","DISSOLVE",false,["mara","niko"],
  ["Mara turns. Therefore the film changes.",
   "She now sees the laboratory lobby: Iona handing her the canister, Niko dropping the orange cup, the butterfly striking the door.",
   "Within the projected image, the small projected Mara turns toward the camera. Her lips move. This time there is sound."],
  [["CHAR","PROJECTED MARA"],["DIAL","I remember being a butterfly."]],
  [{concept:"turnback",h:9},{concept:"recurrence",h:10}]);

u("BF-36","The Cascade","INT. REARING FACILITY · THE POOL","CONTINUOUS","ADVANCE",false,["mara","niko"],
  ["The reel slips and rolls in a widening circle across the floor, film unwinding behind it.",
   "It strikes the tiled edge and falls into the water. Therefore the strip tightens.",
   "Therefore every frame between the cart and the water becomes briefly visible:",
   "A man raising his hand. A woman in a green dress. A burning barn. A hotel corridor. A child on an airport platform. A face reflected in an artificial eye. A car sinking through blue light. A witness pointing across a courtroom. A dead wife opening her eyes on a space station."],
  [], [{concept:"advance",h:10},{concept:"preservation",h:8}]);

u("BF-37","From Inside The Maze","INT. THE MAZE · THE BUTTERFLY'S VIEW","CONTINUOUS","CYCLE",false,["mara","swallowtail"],
  ["The projection cuts to a butterfly beating against a transparent ceiling — the same trial from that morning.",
   "But the viewpoint is inside the maze.",
   "Mara sees herself beyond the acrylic: enormous, distorted, holding her breath.",
   "The butterfly strikes the lid. The image goes white."],
  [], [{concept:"transparency",h:10},{concept:"refusal",h:9},{concept:"watching",h:9}]);

u("BF-38","A Frame Too Small","INT. REARING FACILITY · DARKNESS","CONTINUOUS","TRANSFER",false,["mara"],
  ["Every fluorescent tube goes out. Darkness arrives complete except for the projector beam.",
   "Within it, scales drift. Thousands of them.",
   "They move across the light in slow currents, each scale briefly becoming a bright rectangle — a frame too small to contain the event it had carried."],
  [], [{concept:"transfer",h:10},{concept:"preservation",h:10}]);

u("BF-39","A Pressure Toward Action","INT. REARING FACILITY · DARKNESS","CONTINUOUS","HOLD",false,["mara"],
  ["The memory enters through no opening she can name. Not a vision. Not information. A pressure toward action.",
   "She knows a child stands behind her at the edge of the pool.",
   "She knows the child will fall if she does not turn. She knows turning will cause the glass above them to break.",
   "She knows her mother stood in this position. She knows Iona did. She knows none of these things can all be true."],
  [["CHAR","IONA (O.S.)"],["DIAL","You see why it survives."],
   ["CHAR","NIKO"],["DIAL","Mara."]],
  [{concept:"turnback",h:10},{concept:"recurrence",h:10}]);

u("BF-40","Someone Is Still Inside","INT. REARING FACILITY · THE POOL'S EDGE","CONTINUOUS","BREAK",false,["mara","thegirl"],
  ["At the pool's edge stands a girl in a yellow dress. Water streams from her hair.",
   "In both hands she holds a chrysalis split neatly along one side. She looks eight years old.",
   "She has Mara's face. She raises the empty chrysalis to her ear.",
   "Then the projector stops. In the darkness, something opens its wings."],
  [["CHAR","THE GIRL"],["DIAL","Someone is still inside."]],
  [{concept:"waking",h:10},{concept:"recurrence",h:10},{concept:"mark",h:7}]);

/* -------------------------------------------------------------------- cast */
const CHARS = [
  ["mara","Mara Venn"], ["niko","Niko Alvarez"], ["iona","Iona Ash"],
  ["elise","Elise"], ["thegirl","The Girl in the Yellow Dress"],
  ["swallowtail","The Swallowtail"], ["oldbutterfly","The Older Butterfly"],
];

/* ---------------------------------------------------------------- concepts */
const CONCEPTS = [
  ["mark","THE BROKEN CIRCLE","A shape that only completes when two halves are brought together, and which appears in flight path, photograph, scar, wing and new paint."],
  ["transfer","TRANSFER","A substance that moves between surfaces without changing: butterfly to glove to skin to tape to film to the beam. It brightens rather than fades when rubbed."],
  ["refusal","REFUSAL","Rejecting the premise rather than the options. The insect does not choose an arm; it strikes the ceiling."],
  ["transparency","TRANSPARENCY","A barrier that offers no resistance until the instant of contact. Mistaking transparency for permission."],
  ["recurrence","RECURRENCE","The part that keeps reappearing. Three generations opening the lavender too early."],
  ["turnback","DO NOT TURN AROUND","The instruction that governs the whole text, written on a photograph in 1945 and spoken aloud in the dark."],
  ["waking","WAKING TOO EARLY","The insects wake before the story is ready for them. Empty chrysalides that still move."],
  ["cleanversion","THE CLEAN VERSION","The record that omits the path. Deleting the visualization while keeping the trial."],
  ["containment","CONTAINMENT","Sealed things that tap from inside. Tape, vials, canisters, plastic sheeting, glass."],
  ["preservation","PRESERVATION","Windows that hold the city rather than showing it. Factories pretending they have forgotten what they made."],
  ["watching","THE EYES LOOK BACKWARD","False eyes on the underside of a wing. Being observed by the thing you are observing."],
  ["advance","ADVANCE","Frames stepping past a gate one at a time — film, landings, corridors of light."],
  ["accumulation","ACCUMULATION","A figure that only appears after enough time has passed over itself."],
  ["damage","DAMAGE","A crescent removed as neatly as if cut with a punch, from a place nothing sharp could reach."],
];

const src = {
  title: "I REMEMBER BEING A BUTTERFLY",
  docs: U,
  eps: [{ id: "B01", num: "01", title: "I REMEMBER BEING A BUTTERFLY", part: "ONE MOVEMENT",
          scenes: U.map((x) => x.id) }],
  chars: CHARS.map(([id, name]) => ({ id, name, wt: null })),
  concepts: CONCEPTS.map(([id, name, gloss]) => ({
    id, name, src: "", gloss,
    docs: U.filter((u) => u.concepts.some((c) => c.concept === id))
           .map((u) => ({ d: u.id, h: u.concepts.find((c) => c.concept === id).h })),
  })),
};

fs.writeFileSync(path.join(A, "source.json"), JSON.stringify(src, null, 1));

const motions = {};
for (const x of U) motions[x.motion] = (motions[x.motion] || 0) + 1;
console.log(`I REMEMBER BEING A BUTTERFLY`);
console.log(`  ${U.length} units · ${CHARS.length} cast · ${CONCEPTS.length} concepts`);
console.log(`  ${U.reduce((n, x) => n + x.el.filter(([k]) => k === "DIAL").length, 0)} spoken lines`);
console.log(`\n  MOTION            UNITS   these are the film`);
for (const [m, n] of Object.entries(motions).sort((a, b) => b[1] - a[1]))
  console.log(`  ${m.padEnd(18)} ${String(n).padStart(3)}`);
console.log(`\n  ${U.filter((x) => x.loop).length} unit(s) LOOP CLOSED — a cycle that returns to its first frame is a trap`);
console.log(`  ${U.filter((x) => x.motion === "CYCLE" && !x.loop).length} CYCLE(s) that do not close`);
