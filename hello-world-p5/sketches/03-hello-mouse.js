/* ============================================================================
   3. HELLO MOUSE — make the sketch respond to a person immediately.

   From HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE / PROMPT.
   Paste this whole file into sketch.js at editor.p5js.org and press Play.

   THEORY = RULE THAT PREDICTS WHAT HAPPENS
     mouseX and mouseY supply the current pointer position. mouseIsPressed
     selects black or white. Because this sketch does not repaint the
     background inside draw(), old circles stay on the canvas and form a
     trail.

   IMAGE
     An EMPTY canvas that fills with 80-pixel circles wherever you move the
     pointer. Hold the button down and the trail turns black. Empty here means
     transparent, not white: a p5 canvas with no background() call shows
     whatever is behind it, which on the p5 editor's white page looks white
     and on a dark page looks dark.

   ERROR MESSAGE
     ReferenceError: myX is not defined
     Break it: replace mouseX with myX but do not define myX.

   REPAIR
     Restore mouseX, or deliberately introduce and declare your own variable.
     Use the name in the error message as the search target.

   TEST
     Add background(220); as the FIRST line of draw() and predict what
     happens to the trail before you run it. The trail is not a feature that
     was added — it is a repaint that was left out.

   PROMPT TO MAKE THIS SKETCH
     Write one complete p5.js sketch.js. Create a 400 x 400 canvas. Draw an
     80-pixel circle at mouseX, mouseY. Make the circle white normally and
     black while the mouse button is pressed. Do not clear the background in
     draw(), so the circles leave a trail.
   ========================================================================= */

function setup() {
  createCanvas(400, 400);
  // NOTE: there is no background() call anywhere in this sketch. That absence
  // is the whole visual idea — see the TEST box above.
}

function draw() {
  if (mouseIsPressed) {         // a boolean p5 keeps up to date for you
    fill(0);                    // black while the button is down
  } else {
    fill(255);                  // white otherwise
  }
  circle(mouseX, mouseY, 80);   // the pointer's current position, this frame
}
