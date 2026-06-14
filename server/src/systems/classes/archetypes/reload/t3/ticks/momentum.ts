import type { World } from '../../../../../../world/World';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import {
  DEFAULT_MOMENTUM_APS_PER_STACK,
  MOMENTUM_DECAY_INTERVAL_MS,
} from '../core/constants';

/**
 * Momentum (Reload Balanced). Stacks are granted on reload completion
 * (lifecycleHandlers); out of combat they decay one per interval, restoring the
 * attack cooldown as they fall off.
 */
export function updateReloadMomentum(world: World, dt: number): void {
  for (const player of world.reloadPlayers) {
    const reload = player.usesReload;
    if ((player.usesSkills.passives['reload.momentum'] ?? 0) <= 0) continue;
    if (reload.momentumStacks <= 0) continue;

    if (player.hasAttackTarget !== undefined) {
      reload.momentumDecayMs = 0;
      continue;
    }

    reload.momentumDecayMs += dt;
    let changed = false;
    while (reload.momentumStacks > 0 && reload.momentumDecayMs >= MOMENTUM_DECAY_INTERVAL_MS) {
      reload.momentumDecayMs -= MOMENTUM_DECAY_INTERVAL_MS;
      reload.momentumStacks--;
      changed = true;
    }
    if (!changed) continue;

    const pct = player.usesSkills.passives['reload.momentum-aps-per-stack'] ?? DEFAULT_MOMENTUM_APS_PER_STACK;
    if (reload.momentumStacks === 0) {
      if (reload.momentumBaseCd > 0) player.performsAttack.attackCooldown = reload.momentumBaseCd;
      reload.momentumBaseCd = 0;
    } else if (reload.momentumBaseCd > 0) {
      player.performsAttack.attackCooldown = Math.max(
        150,
        Math.round(reload.momentumBaseCd / (1 + reload.momentumStacks * pct)),
      );
    }
    markSliceDirty(world, player, 'performsAttack');
    markSliceDirty(world, player, 'usesReload');
  }
}
