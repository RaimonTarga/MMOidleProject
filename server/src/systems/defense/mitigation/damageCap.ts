import { registerCombatListener } from '../../combat/engine/combatPipeline';

/**
 * Register the per-hit damage cap on `onDamageTaken`. Clamps a single hit to
 * at most `defense.max-hit-pct × maxHp`.
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

    ctx.damage = Math.min(ctx.damage, Math.ceil(player.hasHealth.maxHp * maxHitPct));
  });
}
