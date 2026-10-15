/**
 * What happens when a monster lands a hit on one of the Conduit's summons (class-first build
 * plan CD.5): the unhit clock Sapbark reads, and Bramble's thorns. Called from
 * `runMonsterAttackOnMinion` right after the damage lands.
 */
import { setResource } from '@mmo-idle/shared';
import type { MinionEntity, MonsterEntity } from '../../../../ecs/entity';
import type { World } from '../../../../world/World';
import { applyPlayerAoeTo } from '../../../combat/damage/aoeDamage';
import { onMinionStruckT2 } from './minionHitsT2';

/** When this summon was last hit (ms, the attack's clock); Sapbark waits this long. */
export const LAST_HIT_AT = 'minion.lastHitAt';
/** Sapbark: the share of its max HP a summon regenerates per second once the wait is over. PLACEHOLDER. */
export const SAPBARK_PCT_PER_SEC = 0.05;

export function onMinionStruck(world: World, monster: MonsterEntity, minion: MinionEntity, now: number): void {
  setResource(minion.tracksCombat, LAST_HIT_AT, now);
  const owner = world.getPlayerEntity(minion.isMinion.ownerPlayerId);
  if (!owner) return;
  onMinionStruckT2(world, owner, monster, minion);
  // Bramble: the summon hits back a flat amount for every hit it takes.
  const thorns = owner.usesSkills.passives['conduit.thorns'] ?? 0;
  if (thorns > 0 && monster.hasHealth.hp > 0) applyPlayerAoeTo(world, owner, [monster], thorns, 'summon', {}, {});
}
