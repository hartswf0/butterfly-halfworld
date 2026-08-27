/* ============================================================================
   4. HELLO STATE — make one value survive from one frame to the next.

   From HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE / PROMPT.
   Paste this whole file into sketch.js at editor.p5js.org and press Play.

   THEORY = RULE THAT PREDICTS WHAT HAPPENS
     At frame t, draw the circle at x. Then replace x with x + 2. The next
     frame uses the new value. The rule is x(next) = x(now) + 2. This is the
     smallest useful model of persistent state.

   IMAGE
     A gray 400 x 400 square with an 80-pixel circle starting near the left
     edge and sliding steadily to the right. It leaves the canvas and does
     not come back — nothing in this sketch says it should.

   ERROR MESSAGE
     p5.js says: "x" is not defined in the current scope.
     Break it: move let x = 50; inside setup() while still using x in draw().

   REPAIR
     Declare x outside both functions so both can access the same persistent
     variable. Scope errors tell you that the name exists in the wrong region
     or not at all.

   TEST
     Change the 2 to -2 and predict which way it goes before you run it. Then
     change it to 0.5 — the circle still moves, one pixel every other frame,
     because x holds a number and not a pixel.

   PROMPT TO MAKE THIS SKETCH
     Write one complete p5.js sketch.js. Create a 400 x 400 gray canvas.
     Start a circle at x = 50, y = 200. Move it 2 pixels to the right every
     frame using one global variable named x. Keep the code simple enough for
     a first-day learner.
   ========================================================================= */

// Declared OUT HERE, so it belongs to neither function and outlives both.
// A variable declared inside draw() is created and destroyed every frame and
// can therefore never remember anything.
let x = 50;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);              // wipe, so we see one circle and not a smear
  circle(x, 200, 80);           // draw at where x is NOW
  x = x + 2;                    // then set where x will be NEXT frame
}
