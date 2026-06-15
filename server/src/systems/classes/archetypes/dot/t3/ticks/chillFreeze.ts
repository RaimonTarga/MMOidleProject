import {
  MONSTER_DATABASE,
  getStatusEffect, hasStatusEffect, getFlag, setFlag,
} from '@mmo-idle/shared';
import { detachMarker, detachMarkerIfNoEffect } from '../../../../../../ecs/markerHelpers';
import type { World } from '../../../../../../world/World';
import type { MonsterEntity } from '../../../../../../ecs/entity';
import { CHILL_EFFECT, FROZEN_EFFECT, SMOLDER_EFFECT } from '../core/constants';
import {
  CHILL_SPEED_MULT, CHILL_ATK_MULT, CHILL_FLAG,
  FREEZE_SPEED_MULT, FREEZE_ATK_MULT,
} from '../paths/_constants';

/**
 * Slow a monster by a fraction of its base speed + lengthen its attack cooldown,
 * computed from MONSTER_DATABASE so repeated applications don't compound. Flags
 * the monster as slowed so `restoreMonsterStats` knows to reset it later.
 */
function applyMonsterSlow(
  entity: MonsterEntity,
  speedReduction: number,
  atkIncrease: number,
): void {
  const def = MONSTER_DATABASE.get(entity.isMonster.monsterTypeId);
  if (!def) return;
  entity.hasPosition.speed = Math.max(10, Math.round(def.stats.speed * (1 - speedReduction)));
  entity.performsAttack.attackCooldown = Math.round(def.stats.attackCooldown * (1 + atkIncrease));
  if (!getFlag(entity.tracksCombat, CHILL_FLAG)) setFlag(entity.tracksCombat, CHILL_FLAG, true);
}

/** Restore base speed + attack cooldown once no slow source (chill/freeze) remains. */
function restoreMonsterStats(entity: MonsterEntity): void {
  if (!getFlag(entity.tracksCombat, CHILL_FLAG)) return;
  const def = MONSTER_DATABASE.get(entity.isMonster.monsterTypeId);
  if (def) {
    entity.hasPosition.speed = def.stats.speed;
    entity.performsAttack.attackCooldown = def.stats.attackCooldown;
  }
  setFlag(entity.tracksCombat, CHILL_FLAG, false);
}

/**
 * Chill / freeze stat-mod tick. Frozen is a SEVERE slow (not a full stop), so it's
 * handled here as a strong speed/attack-cooldown penalty and overrides chill while
 * active. Chill applies a lighter per-stack slow. When neither remains, base stats
 * are restored from MONSTER_DATABASE.
 */
export function updateChillAndFreeze(world: World): void {
  const slowed = new Set<string>();

  // Frozen = severe slow; overrides chill while active.
  for (const entity of world.frozenMonsters) {
    if (hasStatusEffect(entity.tracksCombat, FROZEN_EFFECT)) {
      applyMonsterSlow(entity, FREEZE_SPEED_MULT, FREEZE_ATK_MULT);
      slowed.add(entity.isMonster.id);
    } else {
      detachMarker(world, entity, 'hasFrozen');
      // Chill may still be present; the chill loop re-applies its slow this tick.
      restoreMonsterStats(entity);
    }
  }

  // Chill = per-stack slow (skipped for monsters already governed by freeze).
  for (const entity of world.chilledMonsters) {
    if (slowed.has(entity.isMonster.id)) continue;
    const chillEffect = getStatusEffect(entity.tracksCombat, CHILL_EFFECT);
    if (chillEffect) {
      applyMonsterSlow(entity, chillEffect.stacks * CHILL_SPEED_MULT, chillEffect.stacks * CHILL_ATK_MULT);
    } else {
      detachMarker(world, entity, 'hasChill');
      restoreMonsterStats(entity);
    }
  }

  for (const entity of world.smolderMonsters) {
    detachMarkerIfNoEffect(world, entity, 'hasSmolder', entity.tracksCombat, SMOLDER_EFFECT);
  }
}
