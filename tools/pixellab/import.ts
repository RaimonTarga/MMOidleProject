// art:import — one-time (re-runnable) bootstrap of the art/src source tree.
//
// Slices the packed atlases (sprites/icons/UI_icons) back into individual PNGs
// under art/src/<frame name>, and copies loose shipped assets into
// art/src/files/<relpath>. After this, art/src is the single source of truth
// and art:pack can rebuild client/public/assets from it.
//
// Usage: pnpm art:import [--force]   (--force re-slices over existing files)

import fs from 'node:fs';
import path from 'node:path';
import { ATLASES, sliceAtlas, walkFiles } from './lib/atlas';
import { ART_SRC_DIR, CLIENT_ASSETS_DIR } from './lib/paths';

const FORCE = process.argv.includes('--force');

// Not art sources: atlas outputs (sliced instead), bake outputs, audio, junk.
const LOOSE_EXCLUDE = [
  /^sprites\.(png|json)$/,
  /^icons\.(png|json)$/,
  /^UI_icons\.(png|json)$/,
  /^shadows\.json$/, // bake:hitboxes output, regenerated on server boot
  /^\.gitkeep$/,
  /^old_backgrounds\//, // superseded art kept for reference only
  /^audio\//, // not visual art; out of pipeline scope
  /\.gif$/,
];

async function main(): Promise<void> {
  let totalWritten = 0;
  let totalSkipped = 0;

  for (const def of ATLASES) {
    const { written, skipped } = await sliceAtlas(def, { force: FORCE });
    console.log(`${def.name}: sliced ${written} frames (${skipped} already present)`);
    totalWritten += written;
    totalSkipped += skipped;
  }

  let copied = 0;
  let skippedLoose = 0;
  for (const rel of walkFiles(CLIENT_ASSETS_DIR)) {
    if (LOOSE_EXCLUDE.some((re) => re.test(rel))) continue;
    const from = path.join(CLIENT_ASSETS_DIR, ...rel.split('/'));
    const to = path.join(ART_SRC_DIR, 'files', ...rel.split('/'));
    if (!FORCE && fs.existsSync(to)) {
      skippedLoose++;
      continue;
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied++;
  }
  console.log(`loose files: copied ${copied} (${skippedLoose} already present)`);
  console.log(
    `\nart/src is ready (${totalWritten + copied} new, ${totalSkipped + skippedLoose} kept). ` +
      `Next: pnpm art:seed, then pnpm art:pack to verify parity.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
