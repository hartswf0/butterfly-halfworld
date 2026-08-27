/* ============================================================================
   1. HELLO CANVAS — run the exact starter sketch that new p5.js projects
   begin with.

   From HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE / PROMPT.
   Paste this whole file into sketch.js at editor.p5js.org and press Play.

   THEORY = RULE THAT PREDICTS WHAT HAPPENS
     setup() runs once. draw() runs repeatedly. createCanvas(400, 400)
     creates the drawing surface. background(220) repaints it gray. A still
     gray image does not tell you whether draw() ran once or thousands of
     times.

   IMAGE
     A 400 x 400 gray square. Nothing else. Nothing moves.

   ERROR MESSAGE
     SyntaxError: missing ) after argument list
     Break it: delete the closing parenthesis in createCanvas(400, 400);

   REPAIR
     Restore the missing ). Read punctuation errors from the point the parser
     stops, not from where the canvas looks wrong.

   TEST
     Change background(220) to background(0). Predict the colour before you
     run it. Then uncomment the frameCount line below: the number proves that
     draw() has been running all along, which the still gray image could not.

   PROMPT TO MAKE THIS SKETCH
     Write one complete p5.js sketch.js for a beginner. Use setup() and
     draw(). Create a 400 x 400 canvas and repaint it gray with
     background(220). Return only the complete sketch first, then explain
     setup and draw in two short sentences.
   ========================================================================= */

function setup() {
  // Runs ONCE, before the first frame. Make the drawing surface here.
  createCanvas(400, 400);
}

function draw() {
  // Runs REPEATEDLY, about 60 times a second, for as long as the sketch is up.
  background(220);              // repaint the whole surface gray, every frame

  // Uncomment to see the invisible loop. The canvas looks identical either
  // way — that is the point of this sketch.
  // console.log(frameCount);
}
