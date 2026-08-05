/* C03 — THE SUBSTITUTION
   A framing card. Same contract, same dot law, same 12fps as every scene:
   a card that does not obey the world's rules announces itself as apparatus,
   and this film is already about apparatus. */
import { framesFor, trace, brokenCircle, advance, dissolve, sweep, hold } from "../engine/motion.mjs";

export const id         = "C03";
export const title      = "THE SUBSTITUTION";
export const kind       = "card";
export const place      = "CARD";
export const plan       = null;
export const motion     = "DISSOLVE";
export const seconds    = 7;
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
    o.font=`600 ${size}px ui-monospace, Menlo, monospace`;
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
