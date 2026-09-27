/**
 * MONSTER_DISPLAY_SCALE must name real, non-boss monsters and stay below boss size.
 * A typo'd key silently draws that mob at 1x; a boss key would be ignored by the
 * renderer and mislead whoever tunes the table.
 */
import { MONSTER_DATABASE } from '../data/monsters';
import { MONSTER_DISPLAY_SCALE } from './frameMaps';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

for (const [typeId, scale] of Object.entries(MONSTER_DISPLAY_SCALE)) {
  const def = MONSTER_DATABASE.get(typeId);
  assert(def, `MONSTER_DISPLAY_SCALE: unknown monster '${typeId}'`);
  assert(!def.isBoss, `MONSTER_DISPLAY_SCALE: '${typeId}' is a boss; bosses have their own size`);
  assert(scale > 1 && scale <= 1.75, `MONSTER_DISPLAY_SCALE: '${typeId}' scale ${scale} outside (1, 1.75]`);
}

console.log('monsterDisplayScale: ok');
