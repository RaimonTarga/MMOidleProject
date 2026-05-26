import { getStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../../world/World';
import { detachMarkerIfNoEffect } from '../../../../../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../../../../../player/progression/rewards';
import { ENT_DOT_FX } from '../../core/constants';

/**
 * Entropy Collapse tick. Per-monster DoT whose damage scales with the
 * target's missing HP:
 *   missingFraction = 1 - hp/maxHp (clamped to 0.9)
 *   mult            = 1 + (missingFraction / 0.9)^3 × 3   (1.0× → 4.0×)
 *   damage          = round(baseDamagePerTick × mult)
 *
 * Dead monsters are queued for kill-reward and removal at end of tick.
 */
export function updateEntropyCollapse(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.entropyMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    const effect = getStatusEffect(state, ENT_DOT_FX);
    if (!effect) {
      detachMarkerIfNoEffect(world, entity, 'hasEntropy', state, ENT_DOT_FX);
      continue;
    }

    effect.data['nextTickIn'] -= dt;
    if (effect.data['nextTickIn'] > 0) continue;

    effect.data['nextTickIn'] = effect.data['tickIntervalMs'];

    const missingFraction = Math.max(0, 1 - entity.hasHealth.hp / entity.hasHealth.maxHp);
    const scaled          = Math.min(missingFraction, 0.9) / 0.9;
    const mult            = 1 + Math.pow(scaled, 3) * 3;
    const damage          = Math.max(1, Math.round(effect.data['baseDamagePerTick'] * mult));

    entity.hasHealth.hp -= damage;
    console.log(
      `[EntropyColl] ${monsterId}: ${damage} tick (${(missingFraction * 100).toFixed(0)}% missing, ${mult.toFixed(2)}x), hp=${Math.max(0, entity.hasHealth.hp)}`,
    );

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: effect.sourceId });
    }
  }

  for (const entity of world.entropyMonsters) {
    detachMarkerIfNoEffect(world, entity, 'hasEntropy', entity.tracksCombat, ENT_DOT_FX);
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}
