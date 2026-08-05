/* C00 — I REMEMBER BEING A BUTTERFLY
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "C00";
export const title      = "I REMEMBER BEING A BUTTERFLY";
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "TRACE";
export const seconds    = 6;
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
