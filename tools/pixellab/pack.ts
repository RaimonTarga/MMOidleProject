// art:pack — compile art/src into the shipped client assets.
//
// Usage: pnpm art:pack [--check] [--atlas=<sprites|icons|UI_icons>]
//
// - Repacks the three atlases (sprites, icons, UI_icons) from art/src, keeping
//   frame names identical to the file paths so no game code changes.
// - Copies art/src/files/** verbatim into client/public/assets/**.
// - --check writes nothing; exits 1 if outputs would differ (drift detector).
// - --atlas limits work to one deterministic atlas and skips loose-file copying.
//
// shadows.json is NOT produced here — it is baked by bake:hitboxes against the
// new sprites.png hash, which the server dev script already runs on every boot.

import fs from 'node:fs';
import path from 'node:path';
import { ATLASES, packAtlas, walkFiles } from './lib/atlas';
import { ART_SRC_DIR, CLIENT_ASSETS_DIR } from './lib/paths';

const CHECK = process.argv.includes('--check');
const atlasArg = process.argv.find((arg) => arg.startsWith('--atlas='));
const atlasName = atlasArg?.slice('--atlas='.length);
const selectedAtlases = atlasName
  ? ATLASES.filter((def) => def.name === atlasName)
  : ATLASES;

if (atlasName && selectedAtlases.length === 0) {
  throw new Error(
    `Unknown atlas '${atlasName}'. Expected one of: ${ATLASES.map((def) => def.name).join(', ')}`,
  );
}

function sameBytes(filePath: string, next: Buffer | string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const current = fs.readFileSync(filePath);
  const nextBuf = typeof next === 'string' ? Buffer.from(next) : next;
  return current.equals(nextBuf);
}

function emit(filePath: string, content: Buffer | string): boolean {
  if (sameBytes(filePath, content)) return false;
  if (!CHECK) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
  return true;
}

async function main(): Promise<void> {
  const changed: string[] = [];

  for (const def of selectedAtlases) {
    const { png, json } = await packAtlas(def);
    if (emit(path.join(CLIENT_ASSETS_DIR, def.png), png)) changed.push(def.png);
    if (emit(path.join(CLIENT_ASSETS_DIR, def.json), json)) changed.push(def.json);
    console.log(`${def.name}: ${png.length / 1024 | 0}KB`);
  }

  if (!atlasName) {
    const filesRoot = path.join(ART_SRC_DIR, 'files');
    for (const rel of walkFiles(filesRoot)) {
      const from = path.join(filesRoot, ...rel.split('/'));
      const to = path.join(CLIENT_ASSETS_DIR, ...rel.split('/'));
      if (emit(to, fs.readFileSync(from))) changed.push(rel);
    }
  }

  if (changed.length === 0) {
    console.log('\nAll shipped assets already match art/src — nothing to do.');
    return;
  }
  if (CHECK) {
    console.log(`\nDRIFT: ${changed.length} shipped assets differ from art/src:`);
    for (const c of changed) console.log(`  ${c}`);
    process.exit(1);
  }
  console.log(`\nWrote ${changed.length} changed assets:`);
  for (const c of changed) console.log(`  ${c}`);
  if (changed.includes('sprites.png')) {
    console.log(
      '\nNote: sprites.png changed — shadows.json will be rebaked automatically by',
    );
    console.log('bake:hitboxes on the next `pnpm dev:server` boot (atlas hash mismatch).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
