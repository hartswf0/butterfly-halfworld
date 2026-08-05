/* C01 — THE OLDER QUESTION
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "C01";
export const title      = "THE OLDER QUESTION";
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "HOLD";
export const seconds    = 7.5;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12, 4);


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
    ? `${Math.max(500,weight)} ${size}px Helvetica, Arial, sans-serif`
    : `${weight} ${size}px "Iowan Old Style", Georgia, serif`;
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
  g.font=`${opt.weight||600} ${size}px ui-monospace, Menlo, monospace`;
  g.fillText(s,x,y); g.restore();
}
function rule(g,x0,x1,y,w=3){ g.save(); g.strokeStyle=INK; g.lineWidth=w;
  g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y); g.stroke(); g.restore(); }

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
