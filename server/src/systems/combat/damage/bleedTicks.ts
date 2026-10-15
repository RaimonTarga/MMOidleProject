/**
 * The bleed tick driver: ticks every player bleed record on a monster (`BLEED_EFFECT_IDS`,
 * today the Striker's Rend and Festering Cut's rot) and resolves the kills it causes.
 * Run each tick by the cadence module. It lived under the old cadence T3 paths
 * (`t3/ticks/hemorrhage.ts`) until they were deleted (class-first build plan CS7).
 */
import { outgoingFinalDamage } from './finalDamage';
import { mitigatePlayerTickOnMonster } from './monsterTickMitigation';
import { getStatusEffects, pruneStatusEffects } from '@mmo-idle/shared';
import type { World } from '../../../world/World';
import { detachMarker } from '../../../ecs/markerHelpers';
import { grantMonsterRewards } from '../../player/progression/rewards';
import {
  buildSimpleBreakdown,
  recordMonsterDamagedByPlayer,
  recordPlayerKillMonster,
} from '../../../world/worldLogCombat';
import { actorFromSourceId } from '../../../world/worldLogActors';
import { isInvulnerableMonster } from '../invulnerability';
import { pushDotTickEvent } from './dotTickEvent';
import { emitPlayerMonsterOnKill } from './killHooks';
import { applyMonsterDamageTakenDebuffs } from '../../classes/shared/debuffs';
import {
  BLEED_EFFECT_IDS,
  hasAnyBleed,
  type BleedMode,
} from './bleedIds';

export function updateHemorrhages(world: World, dt: number): void {
  const toKill: Array<{ monsterId: string; sourceId: string; damage: number }> = [];

  for (const entity of world.hemorrhagedMonsters) {
    const monsterId = entity.isMonster.id;
    const state     = entity.tracksCombat;
    if (isInvulnerableMonster(entity)) continue;
    // Every bleed id the driver owns (`BLEED_EFFECT_IDS`).
    const bleeds = BLEED_EFFECT_IDS.flatMap((id) => getStatusEffects(state, id));
    if (bleeds.length === 0) continue;

    let lastSourceId = '';
    let lastTickDamage = 0;

    for (const bleed of bleeds) {
      bleed.data['nextTickIn'] -= dt;
      if (bleed.data['nextTickIn'] > 0) continue;

      bleed.data['nextTickIn'] = bleed.data['tickIntervalMs'];
      const mode: BleedMode = bleed.data['bleedMode'] === 1 ? 'intensity' : 'ticks';
      // `ticks`: one stack is one remaining tick, consumed here and pruned at
      // zero. `intensity`: stacks multiply the tick and expire with the timer.
      const perTick = mode === 'intensity'
        ? bleed.data['damagePerTick'] * Math.max(1, bleed.stacks)
        : bleed.data['damagePerTick'];
      if (mode === 'ticks') bleed.stacks--; // drives the target-frame countdown
      const tickDmg = outgoingFinalDamage(world, bleed.sourceId, applyMonsterDamageTakenDebuffs(state, mitigatePlayerTickOnMonster(entity, perTick, 'dot')));
      recordMonsterDamagedByPlayer(
        world,
        bleed.sourceId,
        actorFromSourceId(world, bleed.sourceId),
        entity,
        tickDmg,
        'dot',
        buildSimpleBreakdown(tickDmg, tickDmg),
      );
      entity.hasHealth.hp -= tickDmg;
      // `sourceId` attributes the tick to its owner.
      pushDotTickEvent(world, entity, 'bleed', tickDmg, { sourceType: 'special', sourceId: bleed.sourceId }); // bleed-red number + 🩸 glyph
      lastSourceId = bleed.sourceId;
      lastTickDamage = tickDmg;
    }

    pruneStatusEffects(state, e => BLEED_EFFECT_IDS.includes(e.id) && e.stacks <= 0);
    // The marker means "carries some bleed", so it only leaves when every id has.
    if (!hasAnyBleed(state)) detachMarker(world, entity, 'hasHemorrhage');

    if (entity.hasHealth.hp <= 0) {
      toKill.push({ monsterId, sourceId: lastSourceId, damage: lastTickDamage });
    }
  }

  for (const { monsterId, sourceId, damage } of toKill) {
    const monster = world.getMonsterEntity(monsterId);
    if (monster && sourceId) {
      emitPlayerMonsterOnKill(world, sourceId, monster, damage, 'dot');
      const rewardInfo = grantMonsterRewards(world, sourceId, monster);
      recordPlayerKillMonster(world, sourceId, monster, damage, rewardInfo);
    }
    world.removeMonsterEntity(monsterId);
  }
}
