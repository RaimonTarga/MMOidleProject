import { setCooldown } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';

/**
 * Register the per-hit soft damage cap on `onDamageTaken`.
 * Excess above `defense.max-hit-pct × maxHp` is reduced by `defense.max-hit-mult`.
 * Formula: threshold + (excess × mult), where mult defaults to 1 (no reduction).
 *
 * Order: runs after evasion (no-op on evaded hits) so only non-evaded damage
 * is capped, and before shields so shields only absorb the capped amount.
 */
export function registerDamageCap(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender;
    const maxHitPct = player.usesSkills.passives['defense.max-hit-pct'] ?? 0;
    if (maxHitPct <= 0) return;

    const threshold = player.hasHealth.maxHp * maxHitPct;
    if (ctx.damage <= threshold) return;

    const mult = player.usesSkills.passives['defense.max-hit-mult'] ?? 1;
    ctx.damage = Math.ceil(threshold + (ctx.damage - threshold) * mult);

    // Titan's Keep: a cap trigger immediately rearms the periodic shield by
    // clearing its cooldown, so runPeriodicShield re-applies on the next tick.
    if ((player.usesSkills.passives['defense.max-hit-rearms-shield'] ?? 0) > 0) {
      setCooldown(player.tracksCombat, 'shieldRegen', 0);
    }
  });
}
