/* C04 — THE PRECEDENT
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "C04";
export const title      = "THE PRECEDENT";
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "SWEEP";
export const seconds    = 6.5;
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
