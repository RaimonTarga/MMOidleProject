import {
  MONSTER_DATABASE,
  getStatusEffect, hasStatusEffect, getFlag, setFlag,
} from '@mmo-idle/shared';
import { detachMarker } from '../../../../../../ecs/markerHelpers';
import type { World } from '../../../../../../world/World';
import { CHILL_EFFECT, FROZEN_EFFECT } from '../core/constants';
import { CHILL_SPEED_MULT, CHILL_ATK_MULT, CHILL_FLAG } from '../paths/_constants';

/**
 * Chill / freeze stat-mod tick. While `dot-chill` is present, slows the
 * monster and lengthens its attack cooldown proportional to stacks. When
 * chill drops, base stats are restored from MONSTER_DATABASE. Frozen
 * monsters whose status has expired have their marker detached.
 */
export function updateChillAndFreeze(world: World): void {
  for (const entity of world.chilledMonsters) {
    const monsterState = entity.tracksCombat;

    const chillEffect = getStatusEffect(monsterState, CHILL_EFFECT);
    const wasChilled  = getFlag(monsterState, CHILL_FLAG);

    if (chillEffect) {
      const def = MONSTER_DATABASE.get(entity.isMonster.monsterTypeId);
      if (def) {
        entity.hasPosition.speed = Math.max(10, Math.round(def.stats.speed * (1 - chillEffect.stacks * CHILL_SPEED_MULT)));
        entity.performsAttack.attackCooldown = Math.round(def.stats.attackCooldown * (1 + chillEffect.stacks * CHILL_ATK_MULT));
      }
      if (!wasChilled) setFlag(monsterState, CHILL_FLAG, true);
    } else {
      detachMarker(world, entity, 'hasChill');
      if (wasChilled) {
        const def = MONSTER_DATABASE.get(entity.isMonster.monsterTypeId);
        if (def) {
          entity.hasPosition.speed = def.stats.speed;
          entity.performsAttack.attackCooldown = def.stats.attackCooldown;
        }
        setFlag(monsterState, CHILL_FLAG, false);
      }
    }
  }

  for (const entity of world.frozenMonsters) {
    if (!hasStatusEffect(entity.tracksCombat, FROZEN_EFFECT)) {
      detachMarker(world, entity, 'hasFrozen');
    }
  }
}
