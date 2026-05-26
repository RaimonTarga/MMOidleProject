import { getStatusEffect, removeStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../world/World';
import { hasPassive } from '../core/helpers';
import {
  ACC_BUFF_FX, ACC_BASE_DRAIN_PER_SEC, ACC_DRAIN_PER_STACK,
} from '../core/constants';

/**
 * Accumulator (energy-light-t3-a) tick.
 *
 * Drains energy each tick at `BASE + stacks × PER_STACK` per second. When the
 * bar hits zero with stacks active, clear all stacks (the buff drops).
 */
export function updateAccumulator(world: World, dt: number): void {
  for (const entity of world.energyPlayers) {
    if (!hasPassive(entity, 'energy.accumulator')) continue;

    const state  = entity.tracksCombat;
    const energy = entity.usesEnergy;

    const stacks      = getStatusEffect(state, ACC_BUFF_FX)?.stacks ?? 0;
    const drainPerSec = ACC_BASE_DRAIN_PER_SEC + stacks * ACC_DRAIN_PER_STACK;
    energy.energy     = Math.max(0, energy.energy - drainPerSec * (dt / 1000));

    if (energy.energy === 0 && stacks > 0) {
      removeStatusEffect(state, ACC_BUFF_FX);
      console.log(`[Accumulator] ${entity.isPlayer.id}: energy drained to 0 - ${stacks} stacks cleared`);
    }
  }
}
