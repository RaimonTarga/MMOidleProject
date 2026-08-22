import {
  MONSTER_DATABASE,
  applyStatusEffect,
  distanceSq,
  getCounter,
  setCounter,
} from '@mmo-idle/shared';
import type { MonsterEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { BOSS_ROAR_HASTE_EFFECT_ID } from '../engine/monsterMechanics';

/**
 * NECROTIC SCREECH — the Wasteland's ranged support beat.
 *
 * While engaged, a monster with `empowersAllies` periodically hastens every living
 * monster within `radius`. It does not hurt the player directly; it makes everything
 * else hurt them faster, which is a different job from "a third mob applying a DoT"
 * and the reason the Carrion Vulture's plague was taken away.
 *
 * Reuses `BOSS_ROAR_HASTE_EFFECT_ID`, which `monsterAttackCooldown` already reads —
 * the screech is mechanically the boss roar at trash scale, so there is no reason
 * for a second attack-speed status. Non-stacking by refresh, and attack speed ONLY:
 * the locked rule is not to stack a big damage boost and a big speed boost at once.
 *
 * Runs BEFORE `updateMonsters` with the other ecology coordinators, and only writes
 * status effects — `updateMonsters` and `updateCombat` stay the executors.
 */
const SESSION_KEY = 'empowerAlliesSession';
const NEXT_KEY = 'empowerAlliesNextAt';

export function updateAllyEmpower(world: World, now: number): void {
  for (const monster of world.monsterEntities) {
    const spec = MONSTER_DATABASE.get(
      monster.isMonster.monsterTypeId,
    )?.empowersAllies;
    if (!spec) continue;
    if (monster.hasHealth.hp <= 0) continue;

    const cs = monster.tracksCombat;
    const aggro = monster.hasAggroTarget;
    if (!aggro) {
      setCounter(cs, SESSION_KEY, 0);
      continue;
    }

    // Cadence keyed to the aggro SESSION, so leashing out and re-pulling restarts
    // the delay rather than letting a banked timer fire on contact.
    if (getCounter(cs, SESSION_KEY) !== aggro.sinceMs) {
      setCounter(cs, SESSION_KEY, aggro.sinceMs);
      setCounter(cs, NEXT_KEY, now + spec.intervalMs);
      continue;
    }
    if (now < getCounter(cs, NEXT_KEY)) continue;
    setCounter(cs, NEXT_KEY, now + spec.intervalMs);

    const radiusSq = spec.radius * spec.radius;
    let hastened = false;
    for (const ally of world.monsterEntitiesInNode(monster.hasPosition.nodeId)) {
      if (ally === monster || ally.hasHealth.hp <= 0) continue;
      if (
        distanceSq(ally.hasPosition.current, monster.hasPosition.current) >
        radiusSq
      ) {
        continue;
      }
      applyStatusEffect(ally.tracksCombat, {
        id: BOSS_ROAR_HASTE_EFFECT_ID,
        maxStacks: 1,
        remainingMs: spec.durationMs,
        refreshable: true,
        sourceId: monster.isMonster.id,
        data: { attackSpeedPct: spec.attackSpeedPct, totalMs: spec.durationMs },
      });
      hastened = true;
    }

    if (hastened) {
      world.pushEvent(monster.hasPosition.nodeId, {
        kind: 'ecology-pulse',
        monsterId: monster.isMonster.id,
        pos: { ...monster.hasPosition.current },
        pulse: 'ally-haste',
      });
    }
  }
}
