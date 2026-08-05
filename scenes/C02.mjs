/* C02 — THE TRIAL
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "C02";
export const title      = "THE TRIAL";
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "ADVANCE";
export const seconds    = 8;
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
    txt(g,"Both arms feed you.",cx,H*0.775,Math.max(38,W*0.042),{});
  }
  if(st>=2){
    const bw=W*0.055, by=H*0.70, bh=H*0.13;
    bar(g,cx-W*0.20-bw,by,bw,bh,0.50); bar(g,cx-W*0.20,by,bw,bh,0.50);
    mono(g,"UNTRAINED 50/50",cx-W*0.175,by+H*0.070,Math.max(26,W*0.026),{});
  }
  if(st>=3){
    const bw=W*0.055, by=H*0.70, bh=H*0.13;
    bar(g,cx+W*0.14,by,bw,bh,0.30); bar(g,cx+W*0.14+bw,by,bw,bh,0.70);
    mono(g,"TRAINED 30/70",cx+W*0.168,by+H*0.070,Math.max(26,W*0.026),{});
    mono(g,"THIS ONE GAVE NEITHER",cx,H*0.945,Math.max(32,W*0.033),{});
  }
}
