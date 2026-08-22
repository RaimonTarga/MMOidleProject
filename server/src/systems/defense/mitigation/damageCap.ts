import { GAME_CONFIG, isCooldownActive, setCooldown } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { BARRIER_RIDER_CD, refillBarrier } from '../barrier/barrier';

/**
 * Register the per-hit soft damage cap on `onDamageTaken`.
 * Excess above `defense.max-hit-pct × maxHp` is reduced by `defense.max-hit-mult`.
 * Formula: threshold + (excess × mult), where mult defaults to 1 (no reduction).
 *
 * Order: runs after evasion (no-op on evaded hits) so only non-evaded damage
 * is capped, and before shields so shields only absorb the capped amount.
 */
export function registerDamageCap(): void {
  registerCombatListener('onDamageTaken', (ctx, world) => {
    if (ctx.defenderType !== 'player') return;
    if (ctx.damage <= 0) return;

    const player = ctx.defender;
    const maxHitPct = player.usesSkills.passives['defense.max-hit-pct'] ?? 0;
    if (maxHitPct <= 0) return;

    const threshold = player.hasHealth.maxHp * maxHitPct;
    if (ctx.damage <= threshold) return;

    const mult = player.usesSkills.passives['defense.max-hit-mult'] ?? 1;
    ctx.damage = Math.ceil(threshold + (ctx.damage - threshold) * mult);
    // Flag for the client damage-number styling (capped hits render distinctly).
    ctx.metadata['damageCapped'] = true;

    // Titan's Keep: a cap trigger immediately refills the barrier to full. Shares
    // the break-rider cooldown — the cap fires on every big hit, and without the
    // gate this would make the barrier unbreakable against a hard-hitting boss.
    if ((player.usesSkills.passives['defense.max-hit-refills-barrier'] ?? 0) > 0
        && !isCooldownActive(player.tracksCombat, BARRIER_RIDER_CD)) {
      setCooldown(player.tracksCombat, BARRIER_RIDER_CD, GAME_CONFIG.BARRIER_BREAK_RIDER_CD_MS);
      refillBarrier(world, player);
    }
  });
}
