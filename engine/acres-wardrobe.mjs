/* ============================================================
   engine/acres-wardrobe.mjs — ADDITIVE. Nothing in the engine imports this.

   THE PROBLEM IT SOLVES. The hero rig can wear exactly one garment gray and
   has no props. Abiding Acres is a show about people holding objects: a
   binder, a clipboard, a travel mug, a library book. Every one of those is
   declared IMMUTABLE by its character's world-text, and every one of them is
   the thing that makes the person legible at thumbnail size.

   The Odyssey's lesson was that per-module hand-drawing is how a cast drifts
   out of family (six Odysseus modules, six silhouettes). So the overpaint
   lives HERE, once, and every Abiding character imports the same functions.
   One hand, one ink weight, one set of grays, across the whole street.

   RULES OBSERVED
   - Light planes, hard contour. Fills sit between 0xc0 and 0xe6 so the dot
     pass leaves paper showing; only seams and edges are INK.
   - No full-width horizontal bars: every span is broken or inset.
   - No type. Barcodes, tabs and checkmarks are drawn as GEOMETRY.
   - Everything is placed from the rig's REPORTED anchors, so props track the
     pose instead of floating at fixed coordinates.
   ============================================================ */
import { INK, gray } from "./halfworld-engine.mjs";

const TAU = Math.PI*2;

/* head radius in pixels, from the rig's head + crown anchors */
export function headR(W, H, head, crown){
  const R = (head.y - crown.y) * H;
  return R > 8 ? R : W*0.10;
}

/* ---- HAIR ---------------------------------------------------------------
   The rig draws a crown cap only, which reads as a bald head with a hairband
   on anyone whose hair passes the ear. This is an annulus: an outer silhouette
   from the crown down to `len` (1.0 = jaw, 1.9 = past the shoulder), with an
   inner edge that hugs the face oval so the whole face stays clear.
   opts: { len, fill, part:-1|0|1, clip:boolean } */
export function hairMass(ctx, W, H, head, crown, opts={}){
  const len  = opts.len ?? 1.25;
  const fill = opts.fill ?? gray(0xc4);
  const part = opts.part ?? 0;
  const cx = head.x*W, cy = head.y*H, R = headR(W,H,head,crown);
  const outW = R*1.08;                 // just outside the ears, never past the shoulders
  const botY = cy + R*len;             // 1.0 = the chin

  ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - outW, botY);
  ctx.quadraticCurveTo(cx - outW*1.03, cy - R*0.55, cx - outW*0.72, cy - R*1.02);
  ctx.quadraticCurveTo(cx,             cy - R*1.34, cx + outW*0.72, cy - R*1.02);
  ctx.quadraticCurveTo(cx + outW*1.03, cy - R*0.55, cx + outW, botY);
  // inner edge: up the near cheek, across the brow, down the far cheek
  ctx.lineTo(cx + R*0.86, botY - R*0.10);
  ctx.quadraticCurveTo(cx + R*0.96, cy - R*0.28, cx + R*0.78, cy - R*0.66);
  ctx.quadraticCurveTo(cx + part*R*0.30, cy - R*0.94, cx - R*0.78, cy - R*0.66);
  ctx.quadraticCurveTo(cx - R*0.96, cy - R*0.28, cx - R*0.86, botY - R*0.10);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // the part — one ink stroke off the crown, to the side the world-text names
  ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx + part*R*0.34, cy - R*1.10);
  ctx.quadraticCurveTo(cx + part*R*0.66, cy - R*0.98, cx + part*R*0.80, cy - R*0.76);
  ctx.stroke();

  // a single clip, if she wears one — two strokes, not a filled block
  if (opts.clip){
    ctx.lineWidth = 3.2;
    for (const dy of [0, R*0.09]){
      ctx.beginPath();
      ctx.moveTo(cx + part*R*0.66, cy - R*0.86 + dy);
      ctx.lineTo(cx + part*R*0.98, cy - R*0.80 + dy);
      ctx.stroke();
    }
  }
}

/* Long hair that is TUCKED BEHIND BOTH EARS: two falls either side of the
   face, from the temple down past the jaw, leaving the rig's own crown cap and
   the whole face oval untouched. The annulus above is right for a set bob; on
   a child it boxes the head into a slab, which is exactly what the first Beth
   render did. opts: { len, fill } — len in head radii below centre. */
export function hairFall(ctx, W, H, head, crown, opts={}){
  const len  = opts.len ?? 1.7;
  const fill = opts.fill ?? gray(0xb8);
  const cx = head.x*W, cy = head.y*H, R = headR(W,H,head,crown);
  ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin="round";
  for (const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(cx + s*R*0.74, cy - R*0.74);
    ctx.quadraticCurveTo(cx + s*R*1.22, cy - R*0.30, cx + s*R*1.14, cy + R*(len*0.62));
    ctx.quadraticCurveTo(cx + s*R*1.06, cy + R*len, cx + s*R*0.86, cy + R*len);
    ctx.quadraticCurveTo(cx + s*R*0.74, cy + R*(len*0.60), cx + s*R*0.80, cy - R*0.28);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // the tuck: one short ink stroke where it goes behind each ear
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap="round";
  for (const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(cx + s*R*0.84, cy - R*0.40);
    ctx.quadraticCurveTo(cx + s*R*1.04, cy - R*0.16, cx + s*R*0.96, cy + R*0.16);
    ctx.stroke();
  }
}

/* A pushed-back hood bunched at the neck — the thing that makes an oversized
   zip hoodie read as an oversized zip hoodie in silhouette. */
export function hood(ctx, W, H, head, crown, neck, fill=gray(0xcc)){
  const R = headR(W,H,head,crown);
  const nx = neck.x*W, ny = neck.y*H;
  ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin="round";
  ctx.beginPath();
  ctx.moveTo(nx - R*1.12, ny + R*0.10);
  ctx.quadraticCurveTo(nx - R*1.02, ny - R*0.62, nx, ny - R*0.54);
  ctx.quadraticCurveTo(nx + R*1.02, ny - R*0.62, nx + R*1.12, ny + R*0.10);
  ctx.quadraticCurveTo(nx, ny + R*0.52, nx - R*1.12, ny + R*0.10);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // drawstrings, short, one either side of the zip
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap="round";
  for (const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(nx + s*R*0.22, ny + R*0.28);
    ctx.quadraticCurveTo(nx + s*R*0.26, ny + R*0.62, nx + s*R*0.16, ny + R*0.86);
    ctx.stroke();
  }
}

/* ---- HELD RECTANGLES ----------------------------------------------------
   A binder, a clipboard and a library book are the same object at three
   sizes with three edge treatments. One function, three faces, so the three
   characters who hold them are holding things made by the same hand. */
export function heldBoard(ctx, W, H, at, o={}){
  const w = o.w ?? W*0.20, h = o.h ?? w*0.84, tilt = o.tilt ?? 0;
  const face = o.face ?? gray(0xdc), edge = o.edge ?? gray(0x96);
  ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(tilt);
  ctx.fillStyle = face; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin="round";
  ctx.beginPath(); ctx.rect(-w/2, -h/2, w, h); ctx.fill(); ctx.stroke();

  if (o.kind === "binder"){
    // ring spine down the left, three laminated tabs stepping down the right
    ctx.fillStyle = edge;
    ctx.beginPath(); ctx.rect(-w/2, -h/2, w*0.14, h); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 3; ctx.fillStyle = gray(0xb4);
    for (let i=0;i<3;i++){
      ctx.beginPath(); ctx.rect(w/2 - w*0.015, -h*0.30 + i*h*0.27, w*0.07, h*0.14);
      ctx.fill(); ctx.stroke();
    }
    // the open leaf, one ruled crease
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-w*0.22, -h*0.36); ctx.lineTo(-w*0.22, h*0.36); ctx.stroke();
  }
  else if (o.kind === "clipboard"){
    // aluminum: a hard clip at the top, a paper inset, a bevel down one side
    ctx.fillStyle = edge; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.rect(-w*0.22, -h/2 - h*0.05, w*0.44, h*0.13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gray(0xf0); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(-w*0.38, -h*0.30, w*0.76, h*0.66); ctx.fill(); ctx.stroke();
    // three ruled lines on the form, inset, never spanning the sheet
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    for (let i=0;i<3;i++){
      const y = -h*0.14 + i*h*0.18;
      ctx.beginPath(); ctx.moveTo(-w*0.28, y); ctx.lineTo(w*(i===2?0.02:0.24), y); ctx.stroke();
    }
  }
  else if (o.kind === "book"){
    // library hardback: spine on the left, barcode block low on the spine,
    // a block of page edges on the right, one finger keeping the place
    ctx.fillStyle = edge;
    ctx.beginPath(); ctx.rect(-w/2, -h/2, w*0.20, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gray(0xf2); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(w/2 - w*0.10, -h*0.44, w*0.10, h*0.88); ctx.fill(); ctx.stroke();
    // barcode: five bars of two weights, geometry not type
    ctx.fillStyle = INK;
    for (let i=0;i<5;i++){
      const bw = i%2 ? w*0.012 : w*0.022;
      ctx.fillRect(-w/2 + w*0.035 + i*w*0.032, h*0.18, bw, h*0.16);
    }
    if (o.finger){
      ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(w*0.10, h*0.06); ctx.lineTo(w/2 - w*0.02, h*0.06); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---- SMALL HELD THINGS -------------------------------------------------- */

/* Insulated travel mug — in Gary's right hand in every scene, and the thing
   he points with instead of a finger. */
export function travelMug(ctx, W, H, at, o={}){
  const w = o.w ?? W*0.058, h = w*1.75, tilt = o.tilt ?? 0;
  ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(tilt);
  ctx.fillStyle = gray(0xd6); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin="round";
  ctx.beginPath();
  ctx.moveTo(-w*0.42, -h*0.5); ctx.lineTo(w*0.42, -h*0.5);
  ctx.lineTo(w*0.34, h*0.5); ctx.lineTo(-w*0.34, h*0.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // lid, darker, sitting proud of the body
  ctx.fillStyle = gray(0x8e); ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.rect(-w*0.50, -h*0.62, w, h*0.16); ctx.fill(); ctx.stroke();
  ctx.restore();
}

/* City ID on a frayed lanyard: "a soft rectangle with a lanyard breaking the
   chest line" — the wardrobe entity's own words for Gary's silhouette. */
export function lanyard(ctx, W, H, neck, hip){
  const nx = neck.x*W, ny = neck.y*H, drop = (hip.y-neck.y)*H*0.46;
  ctx.strokeStyle = INK; ctx.lineWidth = 3.2; ctx.lineCap="round";
  for (const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(nx + s*W*0.040, ny);
    ctx.quadraticCurveTo(nx + s*W*0.030, ny + drop*0.66, nx + s*W*0.006, ny + drop);
    ctx.stroke();
  }
  const cw = W*0.048, ch = cw*1.32;
  ctx.fillStyle = gray(0xe6); ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.rect(nx - cw/2, ny + drop, cw, ch); ctx.fill(); ctx.stroke();
  // the photo block and one ruled line — geometry, not type
  ctx.fillStyle = gray(0x9e); ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.rect(nx - cw*0.34, ny + drop + ch*0.14, cw*0.34, ch*0.40); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.moveTo(nx - cw*0.28, ny + drop + ch*0.74); ctx.lineTo(nx + cw*0.24, ny + drop + ch*0.74); ctx.stroke();
}

/* Reading glasses hanging on a beaded chain at the sternum — Marjorie's, and
   the only thing she ever adjusts. */
export function chainGlasses(ctx, W, H, neck, hip){
  const nx = neck.x*W, ny = neck.y*H, drop = (hip.y-neck.y)*H*0.40;
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap="round";
  for (const s of [-1,1]){
    ctx.beginPath();
    ctx.moveTo(nx + s*W*0.036, ny - H*0.004);
    ctx.quadraticCurveTo(nx + s*W*0.032, ny + drop*0.70, nx + s*W*0.010, ny + drop);
    ctx.stroke();
  }
  const gw = W*0.021, gy = ny + drop + H*0.006;
  ctx.fillStyle = gray(0xd2); ctx.strokeStyle = INK; ctx.lineWidth = 3.0;
  for (const s of [-1,1]){
    ctx.beginPath(); ctx.ellipse(nx + s*gw*0.98, gy, gw, gw*0.70, s*0.20, 0, TAU);
    ctx.fill(); ctx.stroke();
  }
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(nx - gw*0.12, gy - gw*0.06); ctx.lineTo(nx + gw*0.12, gy - gw*0.06); ctx.stroke();
}

/* A loosened necktie, knot off-centre, hanging clear of the shirt. */
export function looseTie(ctx, W, H, neck, hip, drop=0.44){
  const nx = neck.x*W + W*0.010, ny = neck.y*H + H*0.006;
  const len = (hip.y-neck.y)*H*drop, w = W*0.032;
  ctx.fillStyle = gray(0x6e); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.lineJoin="round";
  // knot, sitting low and to one side
  ctx.beginPath(); ctx.rect(nx - w*0.5, ny, w, w*0.9); ctx.fill(); ctx.stroke();
  // blade
  ctx.beginPath();
  ctx.moveTo(nx - w*0.44, ny + w*0.9);
  ctx.lineTo(nx + w*0.44, ny + w*0.9);
  ctx.lineTo(nx + w*0.30, ny + len);
  ctx.lineTo(nx, ny + len + w*0.34);
  ctx.lineTo(nx - w*0.30, ny + len);
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

/* A pencil behind the right ear. Dill's, always. */
export function earPencil(ctx, W, H, head, crown, side=1){
  const R = headR(W,H,head,crown), cx = head.x*W, cy = head.y*H;
  // tucked ALONG the skull above the ear, not standing off it like an antenna
  ctx.save(); ctx.translate(cx + side*R*0.90, cy - R*0.28); ctx.rotate(side*0.30);
  ctx.fillStyle = gray(0xc0); ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.rect(-R*0.075, -R*0.34, R*0.15, R*0.66); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(-R*0.075,-R*0.34); ctx.lineTo(R*0.075,-R*0.34); ctx.lineTo(0,-R*0.50); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ---- LEG WEAR -----------------------------------------------------------
   The rig has one leg palette: covered (trousers) or bare (with sandal
   straps, which is Ithaca, not Ohio). Both children are in shorts. These two
   functions paint the shorts hem and the socks over the rig's legs, using the
   hip and foot anchors — good for planted, standing poses, which is all
   either child does on camera. */
export function shortsHem(ctx, W, H, hip, footL, footR, fill=gray(0xd2)){
  const hx = hip.x*W, hy = hip.y*H;
  const lx = footL.x*W, rx = footR.x*W, fy = Math.max(footL.y, footR.y)*H;
  const t = 0.30;                                  // hem at 30% hip->foot: knee-length
  const yl = hy + (fy-hy)*t, yr = yl;
  const xl = hx + (lx-hx)*t*0.9, xr = hx + (rx-hx)*t*0.9;
  const wdt = Math.abs(rx-lx)*0.44 + W*0.036;
  ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineJoin="round";
  ctx.beginPath();
  ctx.moveTo(hx - wdt*0.78, hy - H*0.010);
  ctx.lineTo(hx + wdt*0.78, hy - H*0.010);
  ctx.lineTo(xr + wdt*0.46, yr);
  ctx.lineTo(hx + wdt*0.06, yr - H*0.008);        // the split between the legs
  ctx.lineTo(xl - wdt*0.46, yl);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // one loaded cargo pocket per leg, sagging
  ctx.lineWidth = 3; ctx.fillStyle = gray(0xbe);
  // kept INSIDE the hem: a child's shorter leg pulls the hem up toward the
  // hip, and a pocket measured back from the hem ended up straddling it
  for (const [px,py] of [[xl - wdt*0.20, hy + (yl-hy)*0.40],[xr + wdt*0.20, hy + (yr-hy)*0.40]]){
    ctx.beginPath(); ctx.rect(px - wdt*0.15, py, wdt*0.30, (yl-hy)*0.44); ctx.fill(); ctx.stroke();
  }
}
/* The bare stretch between a shorts hem and the top of a sock. Without it the
   rig paints trouser gray from hip to ankle and a child in shorts reads as a
   child in slacks with a light apron. */
export function bareShins(ctx, W, H, hip, footL, footR, o={}){
  const from = o.from ?? 0.28, to = o.to ?? 0.64, fill = o.fill ?? gray(0xc6);
  const hx = hip.x*W, hy = hip.y*H;
  for (const f of [footL, footR]){
    const fx = f.x*W, fy = f.y*H;
    const x0 = hx + (fx-hx)*from, y0 = hy + (fy-hy)*from;
    const x1 = hx + (fx-hx)*to,   y1 = hy + (fy-hy)*to;
    ctx.lineCap = "round";
    ctx.strokeStyle = INK; ctx.lineWidth = W*0.036 + 8;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = W*0.036;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
  }
}

export function tubeSocks(ctx, W, H, hip, footL, footR, fill=gray(0xee)){
  const hx = hip.x*W, hy = hip.y*H;
  ctx.strokeStyle = INK; ctx.lineCap = "butt";
  for (const f of [footL, footR]){
    const fx = f.x*W, fy = f.y*H;
    const x0 = hx + (fx-hx)*0.62, y0 = hy + (fy-hy)*0.62;
    const x1 = hx + (fx-hx)*0.93, y1 = hy + (fy-hy)*0.93;
    ctx.lineWidth = W*0.040 + 8; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.lineWidth = W*0.040; ctx.strokeStyle = fill;
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    // the ribbed top band, two strokes
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineCap="round";
    for (const u of [0.03, 0.12]){
      const bx = x0 + (x1-x0)*u, by = y0 + (y1-y0)*u;
      ctx.beginPath(); ctx.moveTo(bx - W*0.020, by); ctx.lineTo(bx + W*0.020, by); ctx.stroke();
    }
    ctx.lineCap = "butt";
  }
}

/* A sheet of paper held in a hand, or clipped to the top of a clipboard.
   Used for the county citation (yellow carbon, torn edge) and the returned
   form with the checked box. */
export function sheet(ctx, W, H, at, o={}){
  const w = o.w ?? W*0.13, h = o.h ?? w*1.26, tilt = o.tilt ?? 0;
  ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(tilt);
  ctx.fillStyle = o.face ?? gray(0xe8); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.lineJoin="round";
  ctx.beginPath();
  if (o.torn){
    // a torn edge down the left, four steps
    ctx.moveTo(-w/2, -h/2);
    ctx.lineTo(w/2, -h/2); ctx.lineTo(w/2, h/2); ctx.lineTo(-w/2, h/2);
    ctx.lineTo(-w*0.42, h*0.22); ctx.lineTo(-w/2, -h*0.06); ctx.lineTo(-w*0.42, -h*0.30);
  } else {
    ctx.rect(-w/2, -h/2, w, h);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // ruled lines, inset and broken
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  for (let i=0;i<3;i++){
    const y = -h*0.22 + i*h*0.20;
    ctx.beginPath(); ctx.moveTo(-w*0.30, y); ctx.lineTo(w*(i===1?0.10:0.30), y); ctx.stroke();
  }
  if (o.checkbox){
    // one box, and the mark in it, pressed hard: NO STANDING TO CONTEST
    const bx = -w*0.28, by = h*0.28, s = w*0.18;
    ctx.fillStyle = gray(0xfa); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.rect(bx, by, s, s); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(bx + s*0.16, by + s*0.52);
    ctx.lineTo(bx + s*0.44, by + s*0.84); ctx.lineTo(bx + s*0.90, by + s*0.14); ctx.stroke();
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(bx + s*1.4, by + s*0.55); ctx.lineTo(bx + s*3.0, by + s*0.55); ctx.stroke();
  }
  ctx.restore();
}

export const WARDROBE_VERSION = "acres-wardrobe/1.0.0";
