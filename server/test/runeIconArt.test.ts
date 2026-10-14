/**
 * Every rune condition and action that resolves to a concept icon resolves to a
 * PNG that exists. Playtest 3 (2026-10-12) found Use Ability and Formation Broken
 * requesting files that were never drawn: a 404 on the Runes panel and a "?" tile.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ACTION_DATABASE, CONDITION_DATABASE } from '@mmo-idle/shared';
import { runeActionIconSource, runeConditionIconSource } from '../../client/src/ui/conceptIcons';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const PUBLIC = join(__dirname, '../../client/public');
const onDisk = (publicPath: string): boolean => existsSync(join(PUBLIC, publicPath.split('?')[0]));

for (const id of CONDITION_DATABASE.keys()) {
  const icon = runeConditionIconSource(id);
  if (icon) assert(onDisk(icon.src), `rune condition ${id}'s icon ${icon.src} is not on disk`);
}
for (const id of ACTION_DATABASE.keys()) {
  const icon = runeActionIconSource(id);
  if (icon) assert(onDisk(icon.src), `rune action ${id}'s icon ${icon.src} is not on disk`);
}

// The one that was missing now draws real art (Use Ability, the other, is gone).
assert(runeConditionIconSource('formation-broken'), 'Formation Broken has a rune icon');

console.log('runeIconArt.test.ts: ok');
