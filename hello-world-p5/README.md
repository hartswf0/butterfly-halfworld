# HELLO WORLD: p5.js — theory / text / image / error / prompt

Six minimal sketches, each a complete `sketch.js`, each carrying its own
**THEORY / IMAGE / ERROR / REPAIR / TEST / PROMPT** boxes in the header comment.
Built from *HELLO WORLD: p5.js — THEORY / TEXT / IMAGE / ERROR MESSAGE /
PROMPT*, whose commentary is quoted in the sketches themselves.

## START HERE

1. Open `editor.p5js.org`.
2. Put the **whole** file into `sketch.js`.
3. Press Play.
4. Compare the canvas to the **IMAGE** box.
5. Make the listed mistake on purpose. Read the **ERROR MESSAGE**. Repair it.
6. Change one number and **predict the result before you run it**.

Or open `index.html` from a local server — `python3 -m http.server` in this
directory works — and use the tabs. p5.js 1.11.3 is vendored in `lib/`, so the
page needs no network at all.

## THE SKETCHES

| | | learns |
|---|---|---|
| 1 | [`01-hello-canvas.js`](sketches/01-hello-canvas.js) | `setup()` runs once, `draw()` runs forever — and a still image cannot tell you which |
| 2 | [`02-hello-circle.js`](sketches/02-hello-circle.js) | `circle(x, y, diameter)`, and that y grows *downward* |
| 3 | [`03-hello-mouse.js`](sketches/03-hello-mouse.js) | `mouseX` / `mouseY` / `mouseIsPressed`, and that the trail is a repaint left **out**, not a feature put in |
| 4 | [`04-hello-state.js`](sketches/04-hello-state.js) | `x(next) = x(now) + 2` — the smallest useful model of persistent state, and why the variable must live outside both functions |
| 5 | [`05-hello-rule.js`](sketches/05-hello-rule.js) | an invariant in **edges**, not centers: `x + diameter/2 <= width` |
| 6 | [`06-hello-bug.js`](sketches/06-hello-bug.js) | **ships broken on purpose** — valid syntax, real names, legal types, wrong rule, silent console |

## WHAT "THEORY" MEANS HERE

Not an invisible mental possession. Write a rule that can be tested: what runs,
what changes, when it changes, and what must stay true. **If the rule cannot
predict a next frame or guide a repair, rewrite the rule.**

## READ THE ERROR MESSAGE BEFORE YOU EDIT

Three beginner errors. Three different actions.

| | message | what to do |
|---|---|---|
| **SyntaxError** | `missing ) after argument list` | Look for missing or misplaced punctuation: `)`, `}`, `]`, comma, quote. Read from where the parser stopped, not from where the canvas looks wrong. |
| **ReferenceError** | `myX is not defined` | Search for the exact name. Check declaration, spelling, capitalization, and scope. |
| **Type / parameter** | `circle() was expecting Number for the first parameter, received string instead` | Find the value passed into the *named* parameter. Check whether it is a number, string, or object. |
| **Logic bug** | *nothing* | State the rule the sketch should obey. Log the values that implement it. Find the first frame where the rule becomes false. |

### The 30-second debug loop

1. Read the first error line.
2. Go to the named line or variable.
3. Change one thing.
4. Run again.
5. If there is no error message, log the values that implement the rule.
6. Test a second case, so the "repair" is not just a lucky patch.

### The console is a second canvas

`x = 370` can still look legal while `rightEdge = 410` has already violated a
400-pixel boundary:

```js
console.log({ x, rightEdge: x + diameter / 2, width });
```

Sketch 6 has this line in it. Run it and watch the numbers cross the wall.

### Negative-space debugging

When a repair attempt becomes cluttered, ask: What did *not* happen? Which
condition did *not* fire? Which value was *not* preserved? Which fact do I *not*
need?

## PROMPT A COMPLETE SKETCH — NOT A FRAGMENT

```
Write ONE COMPLETE p5.js sketch.js for a beginner.
GOAL: [describe the visible behavior]
CANVAS: 400 x 400
LIBRARY: p5.js built-ins only

Requirements:
- Include the complete function setup() and function draw().
- Declare every variable the sketch uses.
- Keep the first version under 20 lines when possible.
- Do not return HTML, CSS, React, or external libraries.
- After the complete sketch, write exactly five short items:
  THEORY: the rule that predicts what changes.
  IMAGE:  what should appear on the canvas.
  ERROR:  one realistic beginner mistake and its console message.
  REPAIR: the smallest correction.
  TEST:   one number or condition to change to verify the repair.

If I paste an error message, diagnose that exact message before rewriting code.
```

**Accept the answer only if** you can paste the entire sketch into `sketch.js`;
every variable is declared; the IMAGE description matches the canvas; the THEORY
predicts a change; the ERROR names an observable failure; and the TEST can prove
the repair still works after a modification.

## THE TEST

Do not end with "it runs." Change one number, one variable, or one condition.
Predict what should happen. Run it. If the result differs, use the error message
or console trace to locate the first broken rule.

## A NOTE ON THE RUNNER

`index.html` does one thing worth stealing: **the five boxes are parsed out of
each sketch's own header comment** rather than written into the page. A page
that restates what a file says will eventually disagree with it, and then the
lesson teaches two things at once. There is one copy of the text and it lives
next to the code it describes.

The sketches stay pure global-mode p5 — no `parent()`, no container, nothing the
page needs — so every one of them pastes into `editor.p5js.org` unchanged. The
page moves the canvas after p5 creates it instead of asking the sketch to place
itself.

Building that runner reproduced the document's own lesson twice, without an
error message either time. The sketch was injected after `window.load`, so p5's
auto-start had already come and gone: `setup()` and `draw()` existed and nobody
had called them, and the page sat there with a blank holder and a clean console.
And the box parser searched the whole comment for the word `THEORY`, which it
found first inside the header's own title line — `THEORY / TEXT / IMAGE / ERROR
MESSAGE / PROMPT` — so every boundary after it was wrong. Valid code, real
names, legal types, silent console, wrong rule.

## SOURCES

1. p5.js, *Setting Up Your Environment* — p5js.org/tutorials/setting-up-your-environment/
2. p5.js, *Get Started* — p5js.org/tutorials/get-started/
3. McIntyre, Nick, et al., *Field Guide to Debugging* — p5js.org/tutorials/field-guide-to-debugging/
4. Naur, Peter, "Programming as Theory Building," *Microprocessing and Microprogramming* 15(5), 1985, 253–261. DOI 10.1016/0165-6074(85)90032-8
5. Goodin, James Ronald (Ronnie), "The Art World's Concept of Negative Space Applied to System Safety Management," NASA Kennedy Space Center, 2005. NTRS 20110024177
6. p5.js, *Friendly Error System (FES)* — p5js.org/contribute/friendly_error_system/

p5.js is vendored in `lib/p5.min.js` (v1.11.3, LGPL-2.1).
