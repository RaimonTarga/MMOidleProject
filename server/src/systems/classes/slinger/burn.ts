/**
 * The Slinger's burn (bible §10.16 T3): Incendiary's rounds and Cinder Round set a target
 * burning. A burn builds to a cap and never detonates (the Apprentice's payoffs do). It is a
 * status on the monster; the Slinger's own tick (`tickBurns`, run from `updateSlinger`) deals
 * the damage as proc damage, so it skips plating like every other DoT tick.
 */
import { applyStatusEffect, getStatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyPlayerProcDamage } from '../../combat/damage/procDamage';

export const SLINGER_BURN_ID = 'slinger-burn';

/** Put `addStacks` burn on the target: the damage per stack never drops, the cap and the clock hold. */
export function applyBurn(
  player: PlayerEntity,
  target: MonsterEntity,
  perStack: number,
  addStacks: number,
  maxStacks: number,
  durationMs: number,
  tickMs: number,
): void {
  const cs = target.tracksCombat;
  const prior = getStatusEffect(cs, SLINGER_BURN_ID);
  let effect = prior;
  for (let i = 0; i < Math.max(1, addStacks); i++) {
    effect = applyStatusEffect(cs, {
      id: SLINGER_BURN_ID,
      maxStacks,
      remainingMs: durationMs,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: { damagePerTick: Math.max(1, Math.round(perStack)), nextTickIn: tickMs, tickIntervalMs: tickMs, totalMs: durationMs },
    });
  }
  if (!effect) return;
  effect.data['damagePerTick'] = Math.max(Math.round(perStack), prior?.data['damagePerTick'] ?? 0, 1);
  effect.data['tickIntervalMs'] = tickMs;
  effect.data['totalMs'] = Math.max(durationMs, effect.data['totalMs'] ?? 0);
  if (prior) effect.data['nextTickIn'] = prior.data['nextTickIn'] ?? tickMs;
}

/** Tick every burn this Slinger owns on the monsters in its node. */
export function tickBurns(world: World, player: PlayerEntity, dt: number): void {
  const pid = player.isPlayer.id;
  for (const monster of [...world.monsterEntitiesInNode(player.hasPosition.nodeId)]) {
    const burn = getStatusEffect(monster.tracksCombat, SLINGER_BURN_ID);
    if (!burn || burn.sourceId !== pid || monster.hasHealth.hp <= 0) continue;
    burn.data['nextTickIn'] = (burn.data['nextTickIn'] ?? burn.data['tickIntervalMs'] ?? 1000) - dt;
    if (burn.data['nextTickIn'] > 0) continue;
    burn.data['nextTickIn'] = burn.data['tickIntervalMs'] ?? 1000;
    applyPlayerProcDamage(world, player, monster, (burn.data['damagePerTick'] ?? 1) * Math.max(1, burn.stacks), { tags: ['slinger-burn'] });
  }
}
