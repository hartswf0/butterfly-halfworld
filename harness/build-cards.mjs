#!/usr/bin/env node
/* ============================================================================
   build-cards.mjs — TITLES AND FRAMING, generated as motion scenes.

   The film had no way in. It opened on an animal already refusing a question
   the viewer had not been asked, and it never said what the real trial was,
   why the smell was lavender, who had done it before, or what older question
   the title is answering. All of that now exists in atlas/references.json and
   none of it was on screen.

   These are not captions over black. They are SCENES — same contract, same
   dot law, same 12fps, same loop discipline — because a card that does not
   obey the world's rules announces itself as apparatus, and this film is
   already about apparatus.

   EACH CARD USES THE MOTION ITS CONTENT DEMANDS, which is the whole argument
   for making them scenes at all:

     C00  MAIN TITLE      TRACE     the broken circle draws itself and the title
                                    arrives inside it. The title IS the mark.
     C01  THE OLDER Q     HOLD      Zhuangzi. Still, because it is a doubt.
     C02  THE TRIAL       ADVANCE   the Y-maze, then the two real results
                                    stepping in one at a time: 50/50, then 70/30.
     C03  THE SUBSTITUTION DISSOLVE ETHYL ACETATE becomes LAVENDER OIL by
                                    per-dot swap — the dissolve IS the
                                    substitution, performed rather than stated.
     C04  THE PRECEDENT   SWEEP     the dated years crossing left to right,
                                    the same wavefront the husk wall uses.
     C05  物化            HOLD      the character, and one empty chrysalis.

   Writes scenes/C0*.mjs and film/order.json
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SCENES = path.join(ROOT, "scenes");

/* A card is a small module in the scene contract. The drawing helpers below are
   deliberately plain: heavy contour, quantised ink, generous paper. */
const HEAD = (id, title, motion, seconds, extra = "") => `/* ${id} — ${title}
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "${id}";
export const title      = ${JSON.stringify(title)};
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "${motion}";
export const seconds    = ${seconds};
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12, 4);
${extra}`;

/* shared drawing vocabulary for cards */
const KIT = `
const PAPER="#f4f1e8", INK="#141210";
function field(g,W,H){ g.fillStyle=PAPER; g.fillRect(0,0,W,H); }
function txt(g,s,x,y,size,{align="center",weight=400,track=0,ink=INK}={}){
  g.save(); g.fillStyle=ink; g.textAlign=align; g.textBaseline="middle";
  /* PASS 4. The rule was "serif above 44px, sans below", and it never fired:
     every body line on these cards computes to W*0.042 = 47px, so all of them
     stayed serif and all of them stayed mush.

     Size was the wrong test. Look at what actually survives on this lattice and
     what does not: "I REMEMBER BEING A BUTTERFLY" is serif at 47px and reads
     perfectly; "Zhuang Zhou dreamed he was a butterfly." is serif at the same
     47px and dissolves. The difference is CASE. A capital is a few thick
     strokes and a generous counter; a lowercase serif is ascenders, descenders,
     thin joins and tiny counters — four features per glyph that are all at or
     under the dot pitch, at any size this frame can hold.

     So the test is the string, not the number: anything containing a lowercase
     letter is set in sans. Serif is reserved for the uppercase display lines,
     where it is doing real work and can afford to. */
  g.font = /[a-z]/.test(s)
    ? \`\${Math.max(500,weight)} \${size}px Helvetica, Arial, sans-serif\`
    : \`\${weight} \${size}px "Iowan Old Style", Georgia, serif\`;
  if(track){ // manual tracking, because letter-spacing is not on canvas
    const chars=[...s]; const wid=chars.reduce((n,c)=>n+g.measureText(c).width+track,0)-track;
    let cx = align==="center" ? x-wid/2 : x;
    g.textAlign="left";
    for(const c of chars){ g.fillText(c,cx,y); cx+=g.measureText(c).width+track; }
  } else g.fillText(s,x,y);
  g.restore();
}
function mono(g,s,x,y,size,opt={}){
  g.save(); g.fillStyle=opt.ink||INK; g.textAlign=opt.align||"center"; g.textBaseline="middle";
  g.font=\`\${opt.weight||600} \${size}px ui-monospace, Menlo, monospace\`;
  g.fillText(s,x,y); g.restore();
}
function rule(g,x0,x1,y,w=3){ g.save(); g.strokeStyle=INK; g.lineWidth=w;
  g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y); g.stroke(); g.restore(); }
`;

const cards = [];

/* ---------------------------------------------------------------- C00 */
cards.push({ id:"C00", file:`${HEAD("C00","I REMEMBER BEING A BUTTERFLY","TRACE",6.0)}
${KIT}
const PATH = brokenCircle();

export function at(u){ return { u, drawn: trace(u, PATH, { fade: .5 }) }; }

export function draw(g,W,H,s){
  field(g,W,H);
  const R=Math.min(W,H)*0.62, cx=W*0.5, cy=H*0.44;
  // the mark draws itself — the title is the shape, not a word over it
  g.save(); g.strokeStyle=INK; g.lineWidth=Math.max(3,R*0.016); g.lineCap="round"; g.lineJoin="round";
  let started=false;
  for(const p of s.drawn){
    const x=cx+(p.x-0.5)*R, y=cy+(p.y-0.5)*R;
    if(p.seg==="stroke"&&started){ g.stroke(); g.beginPath(); started=false; }
    if(!started){ g.beginPath(); g.moveTo(x,y); started=true; } else g.lineTo(x,y);
  }
  if(started) g.stroke();
  g.restore();
  // the title arrives only once the shape has closed enough to be a shape
  const k=Math.max(0,(s.u-0.55)/0.45);
  if(k>0){
    g.save(); g.globalAlpha=1;
    txt(g,"I REMEMBER BEING A BUTTERFLY",W*0.5,H*0.845,Math.max(38,W*0.042),{track:W*0.004});
    if(k>0.5) mono(g,"物化",W*0.5,H*0.935,Math.max(32,W*0.034),{});
    g.restore();
  }
}
`});

/* ---------------------------------------------------------------- C01 */
cards.push({ id:"C01", file:`${HEAD("C01","THE OLDER QUESTION","HOLD",7.5)}
${KIT}
export function at(u){ return { u, h: hold(u,{dur:7.5}) }; }
export function draw(g,W,H,s){
  field(g,W,H);
  const cx=W*0.5;
  mono(g,"莊周夢蝶",cx,H*0.18,Math.max(20,W*0.040),{});
  rule(g,W*0.34,W*0.66,H*0.245,2);
  /* PASS 3. This card had six lines of the parable and TWO closing lines, and
     the last line of the poem sat on top of the first closing line — 0.365 +
     5 leads ran past 0.885. It was also, in the reading it got, "giving too
     much": the card was reciting a parable and then explaining it.

     The card has one job. Zhuangzi did NOT know which he was; this film's
     title says it does. Two lines of parable carry that, one line answers it,
     and everything else was me not trusting the juxtaposition. */
  const L=[
    "Zhuang Zhou dreamed he was a butterfly.",
    "Waking, he did not know which he was.",
  ];
  const size=Math.max(38,W*0.042), lead=size*1.70;
  L.forEach((l,i)=>txt(g,l,cx,H*0.430+i*lead,size,{}));
  rule(g,W*0.26,W*0.74,H*0.700,1);
  mono(g,"THIS FILM SAYS IT REMEMBERS",cx,H*0.800,Math.max(32,W*0.032),{});
}
`});

/* ---------------------------------------------------------------- C02 */
cards.push({ id:"C02", file:`${HEAD("C02","THE TRIAL","ADVANCE",8.0)}
${KIT}
// four steps: the maze · both arms baited · the untrained result · the trained result
export function at(u){ return { u, a: advance(u, 4, { dwell: .80 }) }; }

function yMaze(g,W,H,cx,cy,sc){
  g.save(); g.strokeStyle=INK; g.lineWidth=Math.max(3,sc*0.03); g.lineCap="round";
  g.beginPath();
  g.moveTo(cx,cy+sc*0.62); g.lineTo(cx,cy+sc*0.06);            // stem
  g.moveTo(cx,cy+sc*0.06); g.lineTo(cx-sc*0.60,cy-sc*0.52);    // left arm
  g.moveTo(cx,cy+sc*0.06); g.lineTo(cx+sc*0.60,cy-sc*0.52);    // right arm
  g.stroke(); g.restore();
}
function bar(g,x,y,w,h,fill){ g.save(); g.strokeStyle=INK; g.lineWidth=2.5;
  g.strokeRect(x,y-h,w,h);
  if(fill>0){ g.fillStyle=INK; g.fillRect(x,y-h*fill,w,h*fill); } g.restore(); }

export function draw(g,W,H,s){
  field(g,W,H);
  const st=s.a.index, cx=W*0.5, sc=Math.min(W,H)*0.34;
  mono(g,"THE TRIAL",cx,H*0.085,Math.max(30,W*0.030),{});
  rule(g,W*0.40,W*0.60,H*0.135,1);

  yMaze(g,W,H,cx,H*0.50,sc);

  if(st>=1){
    // BOTH arms baited — the only variable is memory
    mono(g,"SUGAR",cx-sc*0.66,H*0.50-sc*0.64,Math.max(28,W*0.028),{});
    mono(g,"SUGAR",cx+sc*0.66,H*0.50-sc*0.64,Math.max(28,W*0.028),{});
    mono(g,"+ LAVENDER",cx-sc*0.66,H*0.50-sc*0.50,Math.max(24,W*0.024),{});
  }
  if(st>=2){
    const bw=W*0.055, by=H*0.70, bh=H*0.13;
    bar(g,cx-W*0.20-bw,by,bw,bh,0.50); bar(g,cx-W*0.20,by,bw,bh,0.50);
    mono(g,"UNTRAINED",cx-W*0.175,by+H*0.060,Math.max(26,W*0.026),{});
    mono(g,"50 / 50",cx-W*0.175,by+H*0.125,Math.max(26,W*0.026),{});
  }
  if(st>=3){
    const bw=W*0.055, by=H*0.70, bh=H*0.13;
    bar(g,cx+W*0.14,by,bw,bh,0.30); bar(g,cx+W*0.14+bw,by,bw,bh,0.70);
    mono(g,"TRAINED",cx+W*0.168,by+H*0.060,Math.max(26,W*0.026),{});
    mono(g,"30 / 70",cx+W*0.168,by+H*0.125,Math.max(26,W*0.026),{});
    mono(g,"THIS ONE GAVE NEITHER",cx,H*0.955,Math.max(32,W*0.033),{});
  }
}
`});

/* ---------------------------------------------------------------- C03 */
cards.push({ id:"C03", file:`${HEAD("C03","THE SUBSTITUTION","DISSOLVE",7.0)}
${KIT}
// the dissolve IS the substitution — one word becomes the other by per-dot swap
export function at(u){ return { u }; }

export function draw(g,W,H,s){
  field(g,W,H);
  const cx=W*0.5, cy=H*0.44, size=Math.max(19,W*0.038);
  mono(g,"THE SUBSTITUTION",cx,H*0.085,Math.max(30,W*0.030),{});
  rule(g,W*0.36,W*0.64,H*0.145,1);

  // an ordered per-dot swap between two words, on a coarse grid so it reads
  const cell=Math.max(6,Math.round(W/150));
  const off=document.createElement("canvas"); off.width=W; off.height=Math.round(H*0.22);
  const o=off.getContext("2d");
  const paint=(word)=>{ o.fillStyle=PAPER; o.fillRect(0,0,off.width,off.height);
    o.fillStyle=INK; o.textAlign="center"; o.textBaseline="middle";
    o.font=\`600 \${size}px ui-monospace, Menlo, monospace\`;
    o.fillText(word,off.width/2,off.height/2); };

  paint("ETHYL ACETATE"); const A=o.getImageData(0,0,off.width,off.height).data;
  paint("LAVENDER OIL");  const B=o.getImageData(0,0,off.width,off.height).data;

  g.save(); g.fillStyle=INK;
  for(let gy=0; gy*cell<off.height; gy++) for(let gx=0; gx*cell<W; gx++){
    const px=gx*cell+((cell/2)|0), py=gy*cell+((cell/2)|0);
    if(px>=W||py>=off.height) continue;
    const i=(py*off.width+px)*4;
    const own=dissolve(s.u,gx,gy);            // ordered Bayer swap — no alpha
    const dark=(own==="a"?A[i]:B[i])<128;
    if(dark) g.fillRect(gx*cell, cy-off.height/2+gy*cell, cell-1, cell-1);
  }
  g.restore();

  txt(g,"The first was a killing agent.",cx,H*0.700,Math.max(38,W*0.042),{});
  txt(g,"A child chose the kinder smell.",cx,H*0.775,Math.max(38,W*0.042),{});
  rule(g,W*0.20,W*0.80,H*0.845,2);
  mono(g,"IT IS THE ONE THAT HURT THEM",cx,H*0.920,Math.max(32,W*0.033),{});
}
`});

/* ---------------------------------------------------------------- C04 */
cards.push({ id:"C04", file:`${HEAD("C04","THE PRECEDENT","SWEEP","6.5".replace(/"/g,''))}
${KIT}
const YEARS=[]; for(let y=1951;y<=2024;y++) YEARS.push(y);
const POS = YEARS.map((_,i)=>i/(YEARS.length-1));

export function at(u){ return { u, s: sweep(u, POS, { width: .07 }) }; }

export function draw(g,W,H,s){
  field(g,W,H);
  const cx=W*0.5;
  mono(g,"IT HAS BEEN DONE BEFORE",cx,H*0.11,Math.max(30,W*0.030),{});
  rule(g,W*0.32,W*0.68,H*0.165,1);

  // the years cross left to right on the same wavefront the husk wall uses
  const y0=H*0.44, x0=W*0.08, x1=W*0.92;
  g.save();
  s.s.forEach((it,i)=>{
    const x=x0+(x1-x0)*it.p;
    const open=it.open;
    g.strokeStyle=INK; g.lineWidth=open>0?2.5:1;
    g.beginPath(); g.moveTo(x,y0-H*(0.035+0.045*open)); g.lineTo(x,y0+H*0.035); g.stroke();
  });
  g.restore();
  mono(g,"1951",x0,y0+H*0.105,Math.max(26,W*0.026),{});
  mono(g,"2024",x1,y0+H*0.105,Math.max(26,W*0.026),{});

  txt(g,"Moths remembered a smell",cx,H*0.660,Math.max(38,W*0.042),{});
  txt(g,"they had learned as caterpillars.",cx,H*0.735,Math.max(38,W*0.042),{});
  rule(g,W*0.22,W*0.78,H*0.815,2);
  mono(g,"NOBODY BELIEVED IT",cx,H*0.895,Math.max(32,W*0.033),{});
}
`});

/* ---------------------------------------------------------------- C05 */
cards.push({ id:"C05", file:`${HEAD("C05","物化","HOLD",7.0)}
${KIT}
export function at(u){ return { u, h: hold(u,{dur:7.0}) }; }
export function draw(g,W,H,s){
  field(g,W,H);
  const cx=W*0.5;
  mono(g,"物化",cx,H*0.28,Math.max(70,W*0.095),{weight:600});
  txt(g,"wùhuà — the transformation of things",cx,H*0.435,Math.max(36,W*0.040),{});
  rule(g,W*0.30,W*0.70,H*0.50,1);
  txt(g,"It is also the word",cx,H*0.585,Math.max(38,W*0.042),{});
  txt(g,"for what a chrysalis does.",cx,H*0.655,Math.max(38,W*0.042),{});

  // one empty husk, split along its side, breathing very slightly
  const bx=cx, by=H*0.86, r=Math.min(W,H)*0.052*(1+0.02*s.h.breath);
  g.save(); g.strokeStyle=INK; g.lineWidth=3; g.lineJoin="round";
  g.beginPath(); g.ellipse(bx,by,r*0.42,r,0,0,Math.PI*2); g.stroke();
  g.beginPath(); g.moveTo(bx+r*0.05,by-r*0.86); g.lineTo(bx+r*0.20,by+r*0.55); g.stroke(); // the split
  g.restore();
  mono(g,"EMPTY",cx,H*0.955,Math.max(30,W*0.030),{});
}
`});

/* ------------------------------------------------------------------ write */
let wrote = 0;
for (const c of cards) { fs.writeFileSync(path.join(SCENES, `${c.id}.mjs`), c.file); wrote++; }

/* ---- where they sit in the film ----------------------------------------- */
// A card earns its place by answering a question the next scene will raise.
const ORDER = [
  { card: "C00", why: "the mark draws itself before anything is named" },
  { card: "C01", why: "the older question, before the film answers it in the affirmative" },
  { card: "C02", before: "BF-01", why: "you cannot read a refusal without the two choices it declines" },
  { card: "C03", after: "BF-07", why: "after the scales are on her hand: why the smell is the kindest one available" },
  { card: "C04", before: "BF-17", why: "before Iona arrives: someone did this, and was doubted" },
  { card: "C05", after: "BF-40", why: "the last word, and it is a chrysalis" },
];
/* PASS 2. This used to write { cards: ORDER } and nothing else, which silently
   deleted every entry in the running order that this file does not own — the
   end roll fell out of the cut TWICE that way, once without being noticed until
   the film came back 67 seconds short. A generator may replace its own entries.
   It may not replace somebody else's. */
const orderPath = path.join(ROOT, "film", "order.json");
const prior = fs.existsSync(orderPath) ? JSON.parse(fs.readFileSync(orderPath, "utf8")).cards || [] : [];
const mine = new Set(ORDER.map((c) => c.card));
const foreign = prior.filter((c) => !mine.has(c.card));
fs.writeFileSync(orderPath, JSON.stringify({ cards: [...ORDER, ...foreign] }, null, 1));
if (foreign.length) console.log(`  kept ${foreign.length} entr${foreign.length === 1 ? "y" : "ies"} owned by another generator: ${foreign.map((c) => c.card).join(", ")}`);

console.log(`framing cards — generated as scenes, not captions\n`);
console.log(`  CARD  MOTION     SEC   TITLE`);
for (const c of cards) {
  const m = /export const motion     = "(\w+)"/.exec(c.file)[1];
  const sec = /export const seconds    = ([\d.]+)/.exec(c.file)[1];
  const t = /export const title      = "([^"]+)"/.exec(c.file)[1];
  console.log(`  ${c.id}   ${m.padEnd(10)} ${String(sec).padStart(4)}   ${t}`);
}
console.log(`\n  placement:`);
for (const o of ORDER) console.log(`    ${o.card}  ${(o.before?"before "+o.before:o.after?"after "+o.after:"open").padEnd(14)} ${o.why}`);
console.log(`\n  wrote ${wrote} card scenes + film/order.json`);
