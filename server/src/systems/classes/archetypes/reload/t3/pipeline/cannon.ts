import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { registerReloadLifecycleHook } from '../../reloadLifecycle';
import { applyPlayerProcDamage } from '../../../../../combat/damage/procDamage';
import { markSliceDirty } from '../../../../../../ecs/dirtyHelpers';
import type { World } from '../../../../../../world/World';
import {
  DEFAULT_CANNON_DAMAGE_PER_SHOT,
  CANNON_CHARGE_FRACTION,
  CANNON_BLAST_EFFECT,
} from '../core/constants';

/**
 * Cannoneer. While firing, each shot banks `attack × cannon-damage-per-shot` into a
 * stored pool (the "Cannon" buff). Reloading charges the cannon for half the reload
 * duration, then fires the whole pool at the target as a single empowered burst and
 * resets the pool.
 *
 * This intentionally avoids the isChanneling beam system (which would force stand-still
 * and run the Devout Priest beam ticks) — the charge is a timed, networked wind-up
 * (cannonChargePct) that doesn't interfere with reload movement.
 */
export function registerCannon(): void {
  // Bank damage on every landed shot.
  registerCombatListener('onHit', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.defenderType !== 'monster') return;
    const player = ctx.attacker;
    const reload = player.usesReload;
    if (!reload) return;
    if ((player.usesSkills.passives['reload.cannon'] ?? 0) <= 0) return;

    const perShot = player.usesSkills.passives['reload.cannon-damage-per-shot'] ?? DEFAULT_CANNON_DAMAGE_PER_SHOT;
    // Cap at one full clip's worth (ammoMax shots). Out-of-combat reloads don't fire
    // the cannon (no target), so without this the pool would stack across clips forever.
    const cap = Math.max(1, Math.round(reload.ammoMax * player.dealsDamage.attack * perShot));
    reload.cannonStored = Math.min(cap, reload.cannonStored + Math.round(player.dealsDamage.attack * perShot));
    markSliceDirty(_world, player, 'usesReload');
  });

  // Arm the mid-reload charge when a reload starts (if anything is stored).
  registerReloadLifecycleHook({
    onStart(world, player) {
      const reload = player.usesReload;
      if (!reload) return;
      if ((player.usesSkills.passives['reload.cannon'] ?? 0) <= 0) return;
      if (reload.cannonStored <= 0) return;

      const targetId = player.hasAttackTarget?.targetId;
      if (!targetId) return;

      const chargeFraction = player.usesSkills.passives['reload.cannon-charge-fraction'] ?? CANNON_CHARGE_FRACTION;
      const chargeMs = Math.max(1, Math.round(reload.reloadingMs * chargeFraction));
      reload.cannonFireMs = chargeMs;
      reload.cannonChargeTotalMs = chargeMs;
      reload.cannonTargetId = targetId;
      markSliceDirty(world, player, 'usesReload');
    },
  });
}

/**
 * Per-tick: advance the cannon charge; when it completes, fire the stored pool as a
 * single empowered burst (crit styling, no AoE) with a blast FX, then reset.
 */
export function updateCannonFire(world: World, dt: number): void {
  for (const player of world.reloadPlayers) {
    const reload = player.usesReload;
    if (reload.cannonFireMs <= 0) continue;

    reload.cannonFireMs -= dt;
    if (reload.cannonFireMs > 0) continue;

    // Charge complete — fire.
    const stored = reload.cannonStored;
    const targetId = reload.cannonTargetId;
    reload.cannonFireMs = 0;
    reload.cannonChargeTotalMs = 0;
    reload.cannonTargetId = null;
    reload.cannonStored = 0;
    markSliceDirty(world, player, 'usesReload');

    if (stored <= 0 || !targetId) continue;
    const target = world.getMonsterEntity(targetId);
    if (!target) continue;

    applyPlayerProcDamage(world, player, target, stored, {
      tags: ['cannon'],
      clientEffects: [CANNON_BLAST_EFFECT],
      empowered: true, // crit styling; proc damage never splashes (no AoE)
    });
  }
}
