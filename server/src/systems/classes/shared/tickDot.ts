/**
 * A poison or wound a class puts on a monster as remaining ticks, through the bleed driver
 * (`updateHemorrhages`): every hit adds ticks up to a cap and the per-tick damage never drops
 * (the Conduit's Poison Staff, the Slinger's Venom and Rot Round).
 */
import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import { attachMarker } from '../../../ecs/markerHelpers';
import type { World } from '../../../world/World';
import { applyPlayerDebuff } from './applyPlayerDebuff';

export function applyTickDot(
  world: World,
  owner: PlayerEntity,
  target: MonsterEntity,
  id: string,
  perTick: number,
  addTicks: number,
  maxTicks: number,
  tickMs: number,
): void {
  const prior = getStatusEffect(target.tracksCombat, id);
  const ticks = Math.min(maxTicks, (prior?.stacks ?? 0) + addTicks);
  const damage = Math.max(1, Math.round(perTick), prior?.data['damagePerTick'] ?? 0);
  removeStatusEffect(target.tracksCombat, id);
  const effect = applyPlayerDebuff(owner, target.tracksCombat, {
    id,
    instanced: false,
    remainingMs: -1,
    sourceId: owner.isPlayer.id,
    data: { damagePerTick: damage, nextTickIn: tickMs, tickIntervalMs: tickMs },
  }, { origin: 'mechanic' });
  effect.stacks = ticks; // one stack per remaining tick, as a bleed
  attachMarker(world, target, 'hasHemorrhage');
}
