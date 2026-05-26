import { GAME_CONFIG } from '@mmo-idle/shared';
import type { World } from '../../world/World';
import { registerEvasion } from './mitigation/evasion';
import { registerDamageCap } from './mitigation/damageCap';
import { registerShieldAbsorb } from './shields/shields';
import { registerHitToDot, runDebtDrain } from './mitigation/hitToDot';
import { registerDamageAbsorb, runAbsorbDrain } from './shields/damageAbsorb';
import { runRegenBurst } from './regen/regenBurst';
import { runPeriodicShield } from './shields/periodicShield';
import { runDebuffCleanse } from './mitigation/debuffCleanse';
import { runInCombatRegen } from './regen/inCombatRegen';

/**
 * Register all defense-layer combat pipeline listeners.
 * Call once at server startup after weapon/archetype effects so defense
 * listeners run last in onDamageTaken.
 *
 * Listener order within onDamageTaken (player as defender):
 *   1. Evasion         — may zero ctx.damage
 *   2. Damage cap      — clamps to defense.max-hit-pct of maxHp
 *   3. Shield          — absorbs remaining damage
 *   4. Hit-to-DoT      — redirects defense.hit-to-dot-pct to debt pool
 *   5. Damage absorb   — converts defense.absorb-pct of hit into HoT pool
 */
export function initDefenseSystems(): void {
  registerEvasion();
  registerDamageCap();
  registerShieldAbsorb();
  registerHitToDot();
  registerDamageAbsorb();
}

/**
 * Run once per world tick after combat resolution.
 *
 * Handles all time-based defensive and recovery mechanics for each player.
 * The order matters — debt drain can kill the player and is skipped first.
 */
export function updateDefensiveSystems(world: World, dt: number, now: number): void {
  for (const player of world.playerEntities) {
    const lastCombatAt = player.tracksEngagement;
    const inCombat = player.hasAttackTarget !== undefined ||
      (lastCombatAt !== undefined && (now - lastCombatAt) < GAME_CONFIG.COMBAT_REGEN_DELAY);

    if (runDebtDrain(world, player)) continue;   // player died → skip remaining

    runAbsorbDrain(player, dt);
    runRegenBurst(player, dt);
    runPeriodicShield(world, player, inCombat);
    runDebuffCleanse(player);
    runInCombatRegen(player, dt);
  }
}

// ── Public re-exports (preserve `defenseSystems` public API) ─────────────────

export { applyShield, applyShieldPercent, updateShields } from './shields/shields';
export { applyHealToPlayer, getAntiHealMult, getDebuffResistanceMult } from './regen/healing';
export {
  getDefenseAbsorbPool,
  getDefenseBurstPool,
  getDefenseDebtPool,
} from './core/pools';
export { DEFENSE_BUFFS } from './core/buffs';
