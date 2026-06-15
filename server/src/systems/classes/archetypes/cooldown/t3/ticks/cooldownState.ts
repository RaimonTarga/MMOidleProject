import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import type { World } from '../../../../../../world/World';
import { hasPassive } from '../core/helpers';

/**
 * Vengeance: accumulate incoming damage on the cooldown player so the next
 * execution can cash it out. Registered on onDamageTaken (player as defender).
 *
 * Banks the PRE-mitigation incoming damage (ctx.metadata.incomingGross, the raw
 * monster hit before the player's plating/DR) when present, so high defenses don't
 * shrink the stockpile. Falls back to the mitigated ctx.damage for sources that
 * don't expose a gross (e.g. DoT ticks, which aren't plating-mitigated anyway).
 */
export function registerCooldownDamageTracking(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (!player.usesCooldown) return;
    if (!hasPassive(player, 'cooldown.vengeance')) return;
    const gross = typeof ctx.metadata['incomingGross'] === 'number'
      ? (ctx.metadata['incomingGross'] as number)
      : ctx.damage;
    if (gross > 0) player.usesCooldown.vengeanceDamageTaken += gross;
  });
}

/** Per-tick cooldown T4 state: decay the Rupture plating-bypass window. */
export function updateCooldownState(world: World, dt: number): void {
  for (const player of world.cooldownPlayers) {
    const cd = player.usesCooldown;
    if (cd.ruptureWindowMs > 0) {
      cd.ruptureWindowMs = Math.max(0, cd.ruptureWindowMs - dt);
    }
  }
}
