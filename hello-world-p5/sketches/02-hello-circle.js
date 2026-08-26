/* ============================================================================
   2. HELLO CIRCLE — put one visible thing on the canvas.

   From HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE / PROMPT.
   Paste this whole file into sketch.js at editor.p5js.org and press Play.

   THEORY = RULE THAT PREDICTS WHAT HAPPENS
     circle(x, y, diameter) uses the first two numbers for the center
     position and the third for size. On a 400 x 400 canvas,
     circle(200, 200, 100) places a 100-pixel circle in the center.

   IMAGE
     A gray 400 x 400 square with one white circle, black outline, dead
     centre, 100 pixels across.

   ERROR MESSAGE
     ReferenceError: myX is not defined
     Break it: change the circle line to circle(myX, 200, 100); without
     declaring myX.

   REPAIR
     Either put the number back, or declare let myX = 200; before setup().
     A ReferenceError points to a name the program cannot currently resolve.

   TEST
     Change 200, 200 to 100, 100 and predict which corner it moves toward
     before you run it. In p5.js, y grows DOWNWARD, so (100, 100) is up and
     to the left, not down and to the left.

   PROMPT TO MAKE THIS SKETCH
     Write one complete p5.js sketch.js. Make a 400 x 400 gray canvas and draw
     one white circle with a black outline in the center. Use
     circle(200, 200, 100). Keep the whole program under 10 lines.
   ========================================================================= */

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);              // repaint first, so nothing accumulates
  circle(200, 200, 100);        // x = 200, y = 200, diameter = 100
}
