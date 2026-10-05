import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getHitboxDef, hydrateHitboxCacheFromArtifact } from '../src/hitbox/cache';
import { getAtlasPaths } from '../src/hitbox/paths';

const file = resolve(__dirname, '../src/hitbox/baked-hitboxes.json');
const artifact = JSON.parse(readFileSync(file, 'utf8'));
const pngHash = createHash('sha256').update(readFileSync(getAtlasPaths().atlasPng)).digest('hex');
assert.equal(artifact.atlasHash, createHash('sha256').update(pngHash).digest('hex'), 'artifact matches current atlas');
assert(hydrateHitboxCacheFromArtifact(file) > 0);
for (const id of ['grass-kite', 'bramble-pod', 'rockback-ram', 'brood-spiderling', 'fen-hexer']) {
  const frame = `sprites/monsters/${id}.png`;
  const hitbox = getHitboxDef(frame);
  assert(hitbox, `${id}: baked runtime hitbox`);
  assert(hitbox.rects.length > 0 && hitbox.coverage > 0, `${id}: nonempty geometry`);
  assert(hitbox.sourceW > 0 && hitbox.sourceH > 0);
}
console.log('bakedHitboxArtifact: ok');
