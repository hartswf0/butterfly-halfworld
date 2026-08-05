/* C05 — 物化
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "C05";
export const title      = "物化";
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "HOLD";
export const seconds    = 7;
export const loopClosed = false;
export const frames     = framesFor(motion, seconds, 12, 4);


const PAPER="#f4f1e8", INK="#141210";
function field(g,W,H){ g.fillStyle=PAPER; g.fillRect(0,0,W,H); }
function txt(g,s,x,y,size,{align="center",weight=400,track=0,ink=INK}={}){
  g.save(); g.fillStyle=ink; g.textAlign=align; g.textBaseline="middle";
  /* PASS 3. Body copy on the cards was set in a serif, and a serif is made of
     hairline strokes — precisely the thing a 3.4px dot lattice cannot render.
     The first pass lost it at 23px; the second reset it at 26-52px and it was
     STILL dissolving at 36. The size was never the whole problem: the family
     was. Above 44px a serif has enough meat on it to survive the halftone and
     it earns the display line its authority; below that it is a rumour.
     So the family is chosen by size, and nothing small is ever a serif. */
  g.font = size >= 44
    ? `${weight} ${size}px "Iowan Old Style", Georgia, serif`
    : `${Math.max(500, weight)} ${size}px Helvetica, Arial, sans-serif`;
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
  g.font=`${opt.weight||400} ${size}px ui-monospace, Menlo, monospace`;
  g.fillText(s,x,y); g.restore();
}
function rule(g,x0,x1,y,w=3){ g.save(); g.strokeStyle=INK; g.lineWidth=w;
  g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y); g.stroke(); g.restore(); }

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
