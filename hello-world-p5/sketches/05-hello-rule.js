/* ============================================================================
   5. HELLO RULE — make motion obey a boundary.

   From HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE / PROMPT.
   Paste this whole file into sketch.js at editor.p5js.org and press Play.

   THEORY = RULE THAT PREDICTS WHAT HAPPENS
     The circle has a center x, a radius diameter / 2, and a signed speed.
     The rule is: if the right or left edge reaches the canvas boundary,
     reverse the sign of speed. The image shows a position; the rule predicts
     what happens next.

   IMAGE
     A gray 400 x 400 square with an 80-pixel circle sliding left and right
     forever, turning around when its EDGE touches the wall — never with a
     bite of it hanging off the side.

   ERROR MESSAGE
     NO ERROR MESSAGE — the sketch can be wrong and still run.
     Break it: change the right-edge test to if (x >= width). The circle
     center will reach the edge only after half the circle has already left
     the canvas.

   REPAIR
     Compare the invariant to the quantities: right edge = x + diameter / 2.
     Repair the test, not the final pixels.

   TEST
     Change diameter to 120 to make sure the rule still works. A test that
     only passes for one size was a lucky patch, not a repair. This is why
     the boundary check says `width` and not the literal 400: change the
     canvas to 600 and the rule follows it.

   PROMPT TO MAKE THIS SKETCH
     Write one complete p5.js sketch.js. Create a 400 x 400 canvas. Draw an
     80-pixel circle at y = 200. Store x, speed, and diameter in variables.
     Move the circle horizontally. Reverse speed when either edge of the
     circle reaches the canvas edge. Use width rather than the literal number
     400 in the collision test.
   ========================================================================= */

let x = 50;                     // the CENTER of the circle
let speed = 3;                  // signed: positive is right, negative is left
let diameter = 80;              // so the edges are x +/- diameter / 2

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  circle(x, 200, diameter);
  x = x + speed;

  // The invariant this sketch must never break:
  //   0 <= x - diameter / 2   and   x + diameter / 2 <= width
  // So the test is written in EDGES, not in centers.
  if (x + diameter / 2 >= width ||
      x - diameter / 2 <= 0) {
    speed = speed * -1;         // reverse direction, keep the same rate
  }
}
