import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import type { World } from '../../../../world/World';
import { GAME_CONFIG } from '@mmo-idle/shared';
import { initReloadT3 } from './t3';

// ── Fallback constants (balanced-frame defaults, used when no frame is unlocked) ─

const RELOAD_MAX_AMMO = 8;
const RELOAD_TIME_MS  = 2500;

// ── Tick-driven reload completion ─────────────────────────────────────────────

/**
 * Run once per world tick, AFTER updateCombatState. The ammo clip and reload
 * timer live on the ReloadComponent now; this function keeps them in sync with
 * the current `reload.max-ammo` passive, ticks down the reload timer, and
 * refills when it expires.
 *
 * For every reload-archetype player:
 *   1. First call / passive change: reconcile ammoMax against the passive.
 *   2. Decrement reloadingMs each tick.
 *   3. When reload timer hits zero and ammo is 0: refill to max.
 */
export function updateReloadArchetype(world: World, dt: number, now: number): void {
  for (const entity of world.reloadPlayers) {
    const reload = entity.usesReload;

    const maxAmmo = Math.round(entity.usesSkills.passives['reload.max-ammo'] ?? RELOAD_MAX_AMMO);

    // Lazy-init or sync when the max-ammo passive changes.
    if (reload.ammoMax !== maxAmmo) {
      const isFirstInit = reload.ammoMax === 0;
      reload.ammoMax = maxAmmo;
      if (isFirstInit || reload.ammo > maxAmmo) {
        reload.ammo = maxAmmo;
      }
    }

    const lastCombatAt = entity.tracksEngagement;
    const inCombat = entity.hasAttackTarget !== undefined ||
      (lastCombatAt !== undefined && (now - lastCombatAt) < GAME_CONFIG.COMBAT_REGEN_DELAY);

    // OOC: trigger a reload if the clip is partial and not already reloading.
    if (!inCombat && reload.ammo < reload.ammoMax && reload.reloadingMs <= 0 && reload.ammo > 0) {
      const reloadTimeMs = Math.round(entity.usesSkills.passives['reload.reload-time-ms'] ?? RELOAD_TIME_MS);
      reload.reloadingMs = reloadTimeMs;
      reload.ammo = 0;
      console.log(`[Reload] ${entity.isPlayer.id}: OOC auto-reload triggered`);
    }

    // Tick down the reload timer — 2× speed while OOC.
    if (reload.reloadingMs > 0) {
      const tickMs = inCombat ? dt : dt * 2;
      reload.reloadingMs = Math.max(0, reload.reloadingMs - tickMs);
    }

    // Reload complete: refill when timer expired and clip is empty.
    if (reload.reloadingMs <= 0 && reload.ammo === 0) {
      reload.ammo = reload.ammoMax;
      console.log(`[Reload] ${entity.isPlayer.id}: reload complete — ${reload.ammoMax} rounds`);
    }

  }
}

// ── Combat listener ───────────────────────────────────────────────────────────

/**
 * Register the beforeAttack listener that enforces the ammo/reload gate.
 * Called once at server startup via registerClassMechanic / activateClassMechanics.
 *
 * Behavior:
 *   - If the reload timer is active or ammo is 0: cancel the attack.
 *   - Otherwise: consume one round; if that empties the clip, start the reload
 *     timer (duration from reload.reload-time-ms passive, or fallback constant).
 */
export function initReloadArchetype(): void {
  initReloadT3();

  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity?.usesReload) return;

    ctx.platingMult = 0.5;

    const reload = entity.usesReload;

    if (reload.reloadingMs > 0 || reload.ammo === 0) {
      ctx.cancelled = true;
      return;
    }

    reload.ammo -= 1;

    if (reload.ammo === 0) {
      const reloadTimeMs = Math.round(entity.usesSkills.passives['reload.reload-time-ms'] ?? RELOAD_TIME_MS);
      reload.reloadingMs = reloadTimeMs;
      console.log(`[Reload] ${entity.isPlayer.id}: clip empty — reloading (${reloadTimeMs}ms)`);
    }
  });
}
