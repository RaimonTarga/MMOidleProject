/**
 * WHEN A BOSS IGNORES PLAYER CONTROL (boss-lineage-redesign principle 6).
 *
 * Control is one answer to a boss, never the answer. Two shapes say no to it:
 *   - `controlImmune` bosses (Tundra, Volcanic) accept none at all;
 *   - a boss behind a `blocksControl` barrier (the Mountain plate) ignores stun
 *     and root until the plate is broken — break it first, or control the boss
 *     before it plates.
 *
 * Checked where control ENTERS a monster (ability stun / root), so a refused
 * control never shows a stun it is not having, and by the pattern runtime, so a
 * control that arrived by another route (a class freeze) cannot stop a cast either.
 */
import { MONSTER_DATABASE } from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import { sourceBarrierRemaining } from '../engine/sourceBarriers';

export function monsterIgnoresControl(monster: MonsterEntity): boolean {
  if (MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.controlImmune) return true;
  const plate = monster.runsBossPattern?.controlBarrierSourceId;
  return plate !== undefined && sourceBarrierRemaining(monster, plate) > 0;
}
