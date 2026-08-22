/* THE BRIDGE — a carrier, resolved.

   patchfield's resolver is Python, because the piles, the 2033 cutouts and the
   compositing all live there. But the persistent surface lives in JS: solve()
   is the rig, and reimplementing it in Python would create a second rig that
   drifts from the first. So the rig stays where it is and answers questions.

   in:  {"figures":[{"x":96,"y":124,"h":46,"pose":{...}}], "fw":192,"fh":144}
   out: {"figures":[{"cells":[i,...],"uv":[[cell,boneIdx,u,v],...],
                     "bones":[{name,a,b,w0,w1}], "joints":{...}}]}

   Nothing is interpreted here. The bridge does not know what a skin is. */
import { drawFigure } from "../textule/figure.mjs";
import { bones, toUV } from "../textule/chart.mjs";

let raw = ""; for await (const c of process.stdin) raw += c;
const req = JSON.parse(raw);
const FW = req.fw || 192, FH = req.fh || 144;

function recorder() {
  const cells = new Set();
  const mark = (x, y) => { x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < FW && y < FH) cells.add(y * FW + x); };
  return { K: { ink: mark, put: mark,
    disc: (cx, cy, r) => { const R = Math.ceil(r);
      for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++)
        if (dx * dx + dy * dy <= r * r) mark(cx + dx, cy + dy); } }, cells };
}

const out = [];
for (const f of req.figures) {
  const pose = f.pose || { mode: "stand", phase: 0, face: 1 };
  const { K, cells } = recorder();
  drawFigure(K, f.x, f.y, f.h, pose, f.level ?? 7);
  const B = bones(f.x, f.y, f.h, pose);
  const names = B.list.map(b => b.name);
  const uv = [];
  for (const c of cells) {
    const q = toUV(c % FW, (c / FW) | 0, B);
    /* the same admission test step0 measured coverage with — a cell beyond
       |v|>1.25 or score>=1.6 is NOT nameable, and saying so is the point */
    if (q && Math.abs(q.v) <= 1.25 && q.score < 1.6)
      uv.push([c, names.indexOf(q.bone), +q.u.toFixed(4), +q.v.toFixed(4)]);
  }
  out.push({ cells: [...cells], uv, boneNames: names,
             bones: B.list.map(b => ({ name: b.name, a: b.a, b: b.b, w0: b.w0, w1: b.w1 })),
             joints: Object.fromEntries(Object.entries(B.joints).map(([k, v]) =>
               [k, Array.isArray(v) ? v : v])) });
}
process.stdout.write(JSON.stringify({ figures: out }));
