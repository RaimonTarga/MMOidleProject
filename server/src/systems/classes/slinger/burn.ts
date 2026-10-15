/**
 * The Slinger's burn (bible §10.16 T3): Incendiary's rounds and Cinder Round set a target
 * burning (Thermite, T4, also eats shells). A burn builds to a cap and never detonates (the Apprentice's payoffs do). It is a
 * status on the monster; the Slinger's own tick (`tickBurns`, run from `updateSlinger`) deals
 * the damage as proc damage, so it skips plating like every other DoT tick.
 */
import { applyStatusEffect, getStatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { applyPlayerProcDamage } from '../../combat/damage/procDamage';
import { eatShells } from './t4';

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
  /** Thermite: each tick also eats shells, `drain` times the tick's damage; ice and obsidian lose `mult` times that. */
  shell?: { drain: number; mult: number },
): void {
  const cs = target.tracksCombat;
  const prior = getStatusEffect(cs, SLINGER_BURN_ID);
  let effect = prior;
  for (let i = 0; i < Math.max(1, addStacks); i++) {
    effect = applyStatusEffect(target.tracksCombat, {
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
  if (shell) {
    effect.data['shellDrain'] = shell.drain;
    effect.data['shellMult'] = shell.mult;
  }
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
    const tick = (burn.data['damagePerTick'] ?? 1) * Math.max(1, burn.stacks);
    applyPlayerProcDamage(world, player, monster, tick, { tags: ['slinger-burn'] });
    // Thermite: the burn eats shells (damage over time skips barriers, so it wears them down here).
    if ((burn.data['shellDrain'] ?? 0) > 0 && monster.hasHealth.hp > 0) eatShells(monster, tick * burn.data['shellDrain']!, burn.data['shellMult'] ?? 1);
  }
}
