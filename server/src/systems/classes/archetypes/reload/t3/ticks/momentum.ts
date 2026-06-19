import type { World } from '../../../../../../world/World';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import {
  DEFAULT_MOMENTUM_APS_PER_STACK,
  MOMENTUM_DECAY_INTERVAL_MS,
} from '../core/constants';

/**
 * Momentum (Reload Light / Desperado). Stacks are granted on reload completion
 * (lifecycleHandlers). Out of combat they decay one per interval. Each tick we
 * (re)assert the attack-speed reduction from the current stack count — caching the
 * un-momentum cooldown so it restores cleanly — so a stat recalc between reloads
 * can never silently wipe the bonus (the same approach Flurry uses).
 */
export function updateReloadMomentum(world: World, dt: number): void {
  for (const player of world.reloadPlayers) {
    const reload = player.usesReload;
    if ((player.usesSkills.passives['reload.momentum'] ?? 0) <= 0) continue;

    // Out of combat: decay stacks one per interval. In combat: hold (reset timer).
    if (reload.momentumStacks > 0 && player.hasAttackTarget === undefined) {
      reload.momentumDecayMs += dt;
      while (reload.momentumStacks > 0 && reload.momentumDecayMs >= MOMENTUM_DECAY_INTERVAL_MS) {
        reload.momentumDecayMs -= MOMENTUM_DECAY_INTERVAL_MS;
        reload.momentumStacks--;
        markSliceDirty(world, player, 'usesReload');
      }
    } else {
      reload.momentumDecayMs = 0;
    }

    const pct = player.usesSkills.passives['reload.momentum-aps-per-stack'] ?? DEFAULT_MOMENTUM_APS_PER_STACK;

    if (reload.momentumStacks > 0) {
      // Cache the clean cooldown on the 0→active transition, then reassert.
      if (reload.momentumBaseCd === 0) reload.momentumBaseCd = player.performsAttack.attackCooldown;
      const next = Math.max(150, Math.round(reload.momentumBaseCd / (1 + reload.momentumStacks * pct)));
      if (next !== player.performsAttack.attackCooldown) {
        player.performsAttack.attackCooldown = next;
        markSliceDirty(world, player, 'performsAttack');
      }
    } else if (reload.momentumBaseCd > 0) {
      // Stacks ran out — restore the clean cooldown and clear the cache.
      if (player.performsAttack.attackCooldown !== reload.momentumBaseCd) {
        player.performsAttack.attackCooldown = reload.momentumBaseCd;
        markSliceDirty(world, player, 'performsAttack');
      }
      reload.momentumBaseCd = 0;
    }
  }
}
