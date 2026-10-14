/**
 * BOSS ADDS — the bodies that fight FOR a boss (its summoned entourage and the
 * dead it raises). Wasteland redesign (playtest 2026-09-27): the army is one force
 * with its commander — it shares the boss's target, never leashes on its own, and
 * never idles while the boss fights.
 */
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { setAggroTarget, setAttackTarget } from './targeting';

/** True when `monster` fights for `boss` (summoned by it, or raised by it). */
export function isBossAdd(monster: MonsterEntity, bossId: string): boolean {
  return monster.controlsMonster.bossSpawnerId === bossId || monster.isRaised?.raiserId === bossId;
}

/** The boss's living adds in its node. */
export function bossAdds(world: World, boss: MonsterEntity): MonsterEntity[] {
  const adds: MonsterEntity[] = [];
  for (const m of world.monsterEntitiesInNode(boss.hasPosition.nodeId)) {
    if (m !== boss && m.hasHealth.hp > 0 && isBossAdd(m, boss.isMonster.id)) adds.push(m);
  }
  return adds;
}

/**
 * Bind an add to its boss: the boss's anchor and leash, and its current target.
 * The AI then keeps the add's target synced for the rest of the fight
 * (`syncBossSpawnedAddTarget`) and exempts it from its own leash.
 */
export function bindBossAdd(world: World, boss: MonsterEntity, add: MonsterEntity, now: number): void {
  add.controlsMonster.bossSpawnerId = boss.isMonster.id;
  add.controlsMonster.spawn = { ...boss.controlsMonster.spawn };
  add.controlsMonster.leashRange = boss.controlsMonster.leashRange;
  add.hasAwareness.leashRange = boss.hasAwareness.leashRange;
  const aggro = boss.hasAggroTarget;
  if (!aggro) return;
  setAggroTarget(world, add, { id: aggro.targetId, kind: aggro.targetKind }, now);
  setAttackTarget(world, add, boss.hasAttackTarget?.targetId ?? aggro.targetId);
}
