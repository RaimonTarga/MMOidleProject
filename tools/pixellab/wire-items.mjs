// Wire accepted item-icon frames into the recipe `icon:` fields.
//
//   node tools/pixellab/wire-items.mjs            # dry run, prints the diff it would make
//   node tools/pixellab/wire-items.mjs --apply    # write it
//
// Generating art does not wire it: `art:pack` only compiles the atlas. This is
// step 5 of the per-wave loop in
// design_docs/visual_and_aesthetics_design/item-icon-generation-plan.md.
//
// The join is manifest -> recipe, driven by each entry's `sources: ["item:<recipeId>"]`
// backreference. Do NOT slug the item name instead: names like "Titan's Keep" and
// "Survivor's Robe" do not slug to their authored frame names.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RECIPE_DIR = path.join(ROOT, 'shared/src/data/recipes');
const MANIFEST = path.join(ROOT, 'art/manifests/items.json');

const apply = process.argv.includes('--apply');

// recipeId -> accepted frame path
const wanted = new Map();
for (const e of JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).entries) {
  if (e.status !== 'accepted') continue;
  for (const src of e.sources ?? []) {
    if (src.startsWith('item:')) wanted.set(src.slice('item:'.length), e.out);
  }
}

let changed = 0;
let alreadyCorrect = 0;
const unmatched = [];

for (const file of fs.readdirSync(RECIPE_DIR).filter((f) => f.endsWith('.recipes.ts'))) {
  const full = path.join(RECIPE_DIR, file);
  const src = fs.readFileSync(full, 'utf8');

  // Entry boundaries look like: "\n  ['<recipe-id>', {"
  const next = src
    .split(/(?=\n  \['[a-z0-9-]+', \{)/)
    .map((chunk) => {
      const id = chunk.match(/\n  \['([a-z0-9-]+)', \{/)?.[1];
      if (!id) return chunk;
      const target = wanted.get(id);
      if (!target) return chunk;

      const current = chunk.match(/icon: '([^']+)'/);
      if (!current) {
        unmatched.push(`${file}: ${id} has no icon field`);
        return chunk;
      }
      if (current[1] === target) { alreadyCorrect++; return chunk; }

      changed++;
      console.log(`${file.replace('.recipes.ts', '').padEnd(10)} ${id.padEnd(26)} ${current[1]} -> ${target}`);
      return chunk.replace(/icon: '[^']+'/, `icon: '${target}'`);
    })
    .join('');

  if (apply && next !== src) fs.writeFileSync(full, next);
}

console.log(`\n${apply ? 'rewrote' : 'would rewrite'} ${changed} icon field(s); ${alreadyCorrect} already correct`);

// Every accepted frame should have found a recipe. A miss means a bad `sources` ref.
const recipeIds = new Set();
for (const file of fs.readdirSync(RECIPE_DIR).filter((f) => f.endsWith('.recipes.ts'))) {
  const src = fs.readFileSync(path.join(RECIPE_DIR, file), 'utf8');
  for (const m of src.matchAll(/\n  \['([a-z0-9-]+)', \{/g)) recipeIds.add(m[1]);
}
const orphans = [...wanted.keys()].filter((id) => !recipeIds.has(id));
if (orphans.length) unmatched.push(...orphans.map((id) => `manifest references unknown recipe id: ${id}`));

if (unmatched.length) {
  console.error('\nPROBLEMS:\n  ' + unmatched.join('\n  '));
  process.exit(1);
}
