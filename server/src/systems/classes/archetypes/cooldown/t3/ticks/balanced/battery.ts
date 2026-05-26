import { applyStatusEffect, getStatusEffect } from '@mmo-idle/shared';
import type { World } from '../../../../../../../world/World';
import { hasPassive } from '../../core/helpers';
import { BAT_CHARGE_FX } from '../../core/constants';

/**
 * Battery tick. While the execution CD is actively ticking, accumulate
 * 1 stack/second on `BAT_CHARGE_FX`. Stacks are permanent until consumed
 * on the next empowered hit (handled in `registerPostEmpoweredHit`).
 */
export function updateBattery(world: World, dt: number): void {
  for (const entity of world.cooldownPlayers) {
    const state = entity.tracksCombat;
    const cd    = entity.usesCooldown;
    if (!hasPassive(entity, 'cooldown.battery')) continue;

    // Only accumulate while the execution CD is actively ticking
    if (cd.executionCooldownMs <= 0) continue;

    const acc       = cd.batteryTimerAcc + dt;
    const newStacks = Math.floor(acc / 1000);
    cd.batteryTimerAcc = acc - newStacks * 1000;

    for (let i = 0; i < newStacks; i++) {
      applyStatusEffect(state, {
        id:          BAT_CHARGE_FX,
        instanced:   false,
        remainingMs: -1, // permanent until empowered fires
        refreshable: false,
        sourceId:    entity.isPlayer.id,
        data:        {},
      });
    }

    if (newStacks > 0) {
      const total = getStatusEffect(state, BAT_CHARGE_FX)?.stacks ?? 0;
      console.log(`[Battery] ${entity.isPlayer.id}: +${newStacks} stack(s) -> ${total} total`);
    }
  }
}
