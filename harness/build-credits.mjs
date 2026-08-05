#!/usr/bin/env node
/* ============================================================================
   build-credits.mjs — THE END ROLL.

   A credit roll is not decoration. It is the only place a film states, in its
   own voice, what it is made of and what it is not sure about — and this film
   has an unusual amount of the second kind. It stands on a real experiment
   whose strongest claim is contested, a real precedent, and a 4th-century BCE
   parable, and it invents a butterfly that does something neither the
   experiment nor the parable contains. The end of the film is where that gets
   said plainly, because the film itself never says it out loud.

   ---------------------------------------------------------------------------
   THE TRAP THIS FILE WAS BUILT AROUND, HAVING FALLEN IN IT TWICE.

   BUILD-BRIEF §5 is the dot floor: detail finer than the lattice does not
   become subtle, it becomes noise, and then it becomes nothing. The framing
   cards were set in a thin serif at ~23px against a ~33px floor and every word
   dissolved; I halved the copy and reset it at 26–52px. Looking at the film
   again, C01, C03 and C04 STILL have body copy in thin serif that is barely
   holding — the same mistake, one size up, in the same place.

   So the roll has one rule and no exceptions: NOTHING UNDER 30px, AND NO SERIF.
   The dot lattice cannot render a hairline stroke, and a serif is nothing but
   hairline strokes. Everything here is Helvetica, 30–56px, and there is much
   less of it than a credit roll usually has — because the constraint is real
   and the honest response to a constraint is to say less, not to say it
   smaller.

   SPEED. 12fps and a moving field of type is the other way to lose it. At more
   than ~46px/s the rows strobe against the lattice. This rolls at 40.

     node harness/build-credits.mjs            write scenes/CREDITS.mjs
     node harness/build-credits.mjs --report   print the roll, write nothing
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const REPORT = process.argv.includes("--report");
const FPS = 12, SPEED = 46, NH = 760;   // 46 is the fastest that does not strobe against the lattice

/* size, weight, text. size is in stage px and never goes below 30. */
const H1 = (t) => ({ s: 54, w: 900, t, gap: 30 });
const HD = (t) => ({ s: 30, w: 900, t, gap: 14, track: 0.26, dim: true });
const NM = (t) => ({ s: 40, w: 700, t, gap: 10 });
const BD = (t) => ({ s: 32, w: 400, t, gap: 8 });
const SP = (n = 40) => ({ s: 0, w: 400, t: "", gap: n });
const RULE = () => ({ rule: true, gap: 30 });

/* PASS 2. The first roll was 66 lines, 4068px of content and TWO MINUTES on a
   film that runs under seven — the same failure as the framing cards and the
   same lesson for the third time: a constraint asks you to say LESS, and I keep
   answering it by saying the same amount more carefully. Cut to 34 lines. What
   survived is what the film cannot state for itself: who it stands on, exactly
   where it departs from them, and which of its facts is contested. */
const ROLL = [
  SP(90),
  H1("I REMEMBER"),
  H1("BEING A BUTTERFLY"),
  SP(44),
  RULE(),
  SP(34),

  HD("CAST"),
  NM("MARA · NIKO · IONA ASH"),
  NM("ELISE · THE GIRL"),
  BD("voiced by synthesis, and named as such"),
  SP(44),
  RULE(),
  SP(34),

  HD("STANDS ON"),
  NM("JOE NAGAI"),
  BD("swallowtail memory through metamorphosis"),
  SP(16),
  NM("MARTHA WEISS"),
  BD("a learned aversion surviving pupation"),
  SP(16),
  NM("莊周夢蝶"),
  BD("Zhuang Zhou dreams the butterfly"),
  SP(40),

  HD("AND DEPARTS HERE"),
  BD("The real results are fifty-fifty"),
  BD("and seventy-thirty. Both are choices."),
  BD("This animal declines the question."),
  BD("That is invented. So is everyone in it."),
  SP(38),

  HD("CONTESTED"),
  BD("Memory across metamorphosis is"),
  BD("established. Across three generations"),
  BD("it is reported, not settled. The film"),
  BD("does not need it to be true — it needs"),
  BD("someone to have wanted it to be."),
  SP(36),

  HD("THE KINDEST AVAILABLE SMELL"),
  BD("A child replaced the killing agent"),
  BD("with lavender, to be kinder."),
  BD("Lavender is the trauma cue."),
  SP(36),

  HD("MADE OF"),
  BD("Eight ink levels. No photographs, no"),
  BD("footage, no samples — every image is"),
  BD("code, and the score is synthesised at"),
  BD("60Hz, the frequency the lab hums at."),
  SP(18),
  BD("Aeolian at the start, Dorian at the end."),
  BD("One note different. 物化."),
  SP(46),
  RULE(),
  SP(34),
  NM("HALFWORLD"),
  SP(120),
];

/* ---- geometry ----------------------------------------------------------- */
let H = 0;
const laid = ROLL.map((r) => { const y = H; H += (r.s || 0) * 1.0 + r.gap; return { ...r, y }; });
const travel = H + NH;
const seconds = +(travel / SPEED).toFixed(1);
const frames = Math.round(seconds * FPS);

const under = laid.filter((r) => r.s && r.s < 30);
console.log(`THE END ROLL\n`);
console.log(`  ${ROLL.filter((r) => r.t).length} lines · ${H}px of content · ${travel}px of travel`);
console.log(`  ${seconds}s at ${SPEED}px/s · ${frames} frames @${FPS}fps`);
console.log(`  smallest type ${Math.min(...laid.filter((r) => r.s).map((r) => r.s))}px against a ~33px dot floor`);
console.log(under.length ? `  ** ${under.length} line(s) under 30px and will dissolve` : `  nothing under 30px · no serif anywhere`);

if (REPORT) { for (const r of laid) if (r.t) console.log(`   ${String(r.y).padStart(5)}  ${String(r.s).padStart(2)}px  ${r.t}`); process.exit(0); }

const mod = `/* ============================================================================
   CREDITS — the end roll.
   GENERATED by harness/build-credits.mjs. Do not hand-edit; edit the ROLL.

   ${seconds}s · ${frames} frames @${FPS}fps · ${SPEED}px/s.

   TYPE LAW, and it is the third time this repo has had to learn it: nothing
   under 30px and no serif, because the dot lattice cannot render a hairline and
   a serif is made of hairlines. BUILD-BRIEF §5. The framing cards lost their
   body copy to this twice.
   ========================================================================= */
import { framesFor } from "../engine/motion.mjs";
import { NW, NH } from "../assets/set/_stage.mjs";
import { INK, inkLevel } from "../engine/halfworld-engine.mjs";

export const id = "CREDITS";
export const title = "END";
export const place = "outside the film";
export const plan = null;
export const motion = "ADVANCE";        // a roll is an advance and nothing else
export const beats = null;
export const seconds = ${seconds};
export const loopClosed = false;
export const frames = ${frames};
export const declaredBreak = null;
export const breakAt = null;
export const subject = "what the film is made of, and what it is not sure about";
export const distance = "WIDE";
export const leftOut = ["everything in the film"];

const SPEED = ${SPEED};
const ROWS = ${JSON.stringify(laid.map((r) => r.rule ? { y: r.y, rule: 1 }
  : r.t ? { y: r.y, s: r.s, w: r.w, t: r.t, k: r.track || 0, d: r.dim ? 1 : 0 } : null).filter(Boolean))};

export function at(u) { return { u, scroll: u * seconds * SPEED }; }

export function draw(g, W, H, s) {
  g.save();
  g.scale(W / NW, H / NH);
  g.textAlign = "center";
  g.textBaseline = "top";
  for (const r of ROWS) {
    const y = NH + r.y - s.scroll;
    if (y < -90 || y > NH + 40) continue;
    if (r.rule) {
      g.strokeStyle = INK; g.lineWidth = 5;
      g.beginPath(); g.moveTo(NW * 0.32, y); g.lineTo(NW * 0.68, y); g.stroke();
      continue;
    }
    g.fillStyle = r.d ? inkLevel(5) : INK;
    g.font = \`\${r.w} \${r.s}px Helvetica,Arial,sans-serif\`;
    if (r.k) {
      // letterspaced headings, drawn glyph by glyph because canvas has no
      // letter-spacing and a heading that is not tracked reads as a name
      const sp = r.s * r.k;
      const chars = [...r.t];
      let total = 0; for (const c of chars) total += g.measureText(c).width + sp;
      let x = NW / 2 - (total - sp) / 2;
      for (const c of chars) { g.textAlign = "left"; g.fillText(c, x, y); x += g.measureText(c).width + sp; }
      g.textAlign = "center";
    } else g.fillText(r.t, NW / 2, y);
  }
  g.restore();
}

export const SCENE_VERSION = "credits/1.0.0";
`;
fs.writeFileSync(path.join(ROOT, "scenes", "CREDITS.mjs"), mod);

/* The roll has to put ITSELF in the running order. build-cards.mjs regenerates
   film/order.json from its own list every time it runs, so an entry added by
   hand survives exactly until the next card rebuild — which is how the credits
   silently fell out of the cut the first time. Whoever owns a unit owns its
   placement. */
const orderPath = path.join(ROOT, "film", "order.json");
const order = JSON.parse(fs.readFileSync(orderPath, "utf8"));
order.cards = order.cards.filter((c) => c.card !== "CREDITS");
order.cards.push({ card: "CREDITS", after: "BF-40",
  why: "the end roll: who the film stands on, where it departs from them, and which of its facts is contested" });
fs.writeFileSync(orderPath, JSON.stringify(order, null, 1));
console.log(`\n  wrote scenes/CREDITS.mjs and placed it after BF-40 in film/order.json`);
