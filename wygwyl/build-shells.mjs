#!/usr/bin/env node
/* Writes one thin shell per world. A shell is a mount call and nothing else:
   every law of the world lives in worlds/<slug>.mjs and the shared engine, so
   there is never a second place to fix a bug. Re-run after adding a world. */
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname);
const slugs = fs.readdirSync(path.join(HERE, "worlds")).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort();
for (const f of slugs) {
  const slug = f.replace(/\.mjs$/, "");
  fs.writeFileSync(path.join(HERE, slug + ".html"),
`<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${slug} — a WYGWYL halfworld</title>
<link rel="stylesheet" href="halfworld.css">
<script type="module">
  import { mount } from "./halfworld.mjs";
  import world from "./worlds/${f}";
  mount(world);
</script>
`);
}
console.log("wrote " + slugs.length + " shells: " + slugs.map(s => s.slice(0, 2)).join(" "));
