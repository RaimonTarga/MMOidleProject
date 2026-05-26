import { getStatusEffect } from '@mmo-idle/shared';
import { detachMarkerIfNoEffect } from '../../../../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../../../../player/progression/rewards';
import type { World } from '../../../../../../world/World';
import { DOT_EFFECT_ID, DOT_TICK_MS } from '../core/constants';
import { getSmolderMult, getFrozenMult } from '../core/selectors';
import { PERM_MAX_HITS, PERM_PCT_PER_HIT } from '../paths/_constants';

/**
 * Permafrost tick. Walks every monster with the `hasDot` marker, but only
 * processes effects with `data.t3Perm` set. Damage ramps with `hits` and
 * scales by Smoldering Ember vulnerability and Frozen bonus. On lethal
 * damage, rewards are granted to the source player and the monster is
 * removed.
 */
export function updatePermafrost(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string }> = [];

  for (const entity of world.dottedMonsters) {
    const monsterId    = entity.isMonster.id;
    const monsterState = entity.tracksCombat;
    const effect = getStatusEffect(monsterState, DOT_EFFECT_ID);
    if (!effect || !effect.data.t3Perm) {
      if (!effect?.data.t3Perm) detachMarkerIfNoEffect(world, entity, 'hasDot', monsterState, DOT_EFFECT_ID);
      continue;
    }

    effect.data.nextTickIn -= dt;
    if (effect.data.nextTickIn > 0) continue;

    effect.data.nextTickIn = effect.data.tickIntervalMs ?? DOT_TICK_MS;

    const source = world.getPlayerEntity(effect.sourceId);
    if (!source) continue;

    const hits   = Math.min(PERM_MAX_HITS, effect.data.hits ?? 0);
    const pct    = hits * PERM_PCT_PER_HIT;
    const base   = Math.max(1, Math.round(source.dealsDamage.attack * pct));
    const damage = Math.round(base * getSmolderMult(monsterState) * getFrozenMult(monsterState));
    entity.hasHealth.hp -= damage;
    console.log(`[Permafrost] ${monsterId}: ${damage} tick (${hits}/${PERM_MAX_HITS} hits = ${Math.round(pct * 100)}% ATK)`);

    if (entity.hasHealth.hp <= 0) toKill.push({ monsterId, sourceId: effect.sourceId });
  }

  for (const { monsterId, sourceId } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) grantMonsterRewards(world, sourceId, monster);
    world.removeMonsterEntity(monsterId);
  }
}
