/**
 * MONSTER_DISPLAY_SCALE must name real, non-boss monsters and stay below boss size.
 * A typo'd key silently draws that mob at 1x; a boss key would be ignored by the
 * renderer and mislead whoever tunes the table.
 *
 * The table scales BOTH ways: heavy beasts read a head above the common mob, and
 * the T1 kin mobs (a spiderling beside its spider, a kite beside its hawk) read
 * below it. So an entry may sit either side of 1, but never AT 1 — that is what an
 * omitted type already draws at, so a 1 is a line with no effect — and never below
 * 0.5, where a 32px body stops being a target the player can read or click.
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
  assert(
    scale >= 0.5 && scale <= 1.75 && scale !== 1,
    `MONSTER_DISPLAY_SCALE: '${typeId}' scale ${scale} outside [0.5, 1.75], or a pointless 1`,
  );
}

console.log('monsterDisplayScale: ok');
