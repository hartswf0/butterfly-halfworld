/* ============================================================================
   6. HELLO BUG — when the console says nothing.

   From HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE / PROMPT.
   Paste this whole file into sketch.js at editor.p5js.org and press Play.

   THIS SKETCH SHIPS BROKEN ON PURPOSE. It is sketch 5 with one character
   class removed from one line, and it is the most important beginner bug
   there is: a program that runs exactly as written, but not as intended.

   THEORY = RULE THAT PREDICTS WHAT HAPPENS
     The rule the sketch SHOULD obey has not changed: reverse speed when an
     EDGE of the circle reaches a wall, so 0 <= x - diameter/2 and
     x + diameter/2 <= width, always. The rule the code actually implements
     is about the center. Both are rules. Only one of them is the one wanted,
     and no machine can tell you which.

   ERROR MESSAGE
     NONE.
     Syntax is valid. Names exist. Types are legal. The rule is simply wrong.

   IMAGE (what actually happens, which is not what was wanted)
     The circle slides right and keeps going until its CENTER hits the wall —
     by which time half of it is already off the canvas. Watch the right-hand
     turn: it takes a 40-pixel bite out of the circle.

   USE THE CONSOLE AS A SECOND CANVAS
     The log below is the instrument. x = 370 can still look legal while
     rightEdge = 410 has already violated a 400-pixel boundary. Find the
     first violated rule, then repair the test.

   REPAIR
     if (x + diameter / 2 >= width) — compare edges, not centers. Then TEST:
     set diameter to 120 and confirm the repair still holds. A fix that only
     works at one size was luck.

   TEST
     Do not stop at "the circle bounces now." Set diameter to 120 and run it
     again — a repair that only holds at one size was luck. Then set the
     canvas to 600 and confirm the log never prints a rightEdge above width.

   NEGATIVE-SPACE DEBUGGING
     When a repair attempt becomes cluttered, ask: What did NOT happen? Which
     condition did NOT fire? Which value was NOT preserved? Which fact do I
     NOT need?
   ========================================================================= */

let x = 50;
let speed = 3;
let diameter = 80;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  circle(x, 200, diameter);
  x = x + speed;

  // BUG: tests the center, not the right edge.
  if (x >= width) {
    speed = speed * -1;
  }

  // The console is a second canvas. Throttled to once a second, because a
  // 60-per-second log is a wall of numbers and a wall is not evidence.
  if (frameCount % 60 === 0) {
    console.log({ x, rightEdge: x + diameter / 2, width });
  }
}
