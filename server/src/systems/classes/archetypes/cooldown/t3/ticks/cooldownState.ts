import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import type { World } from '../../../../../../world/World';
import { hasPassive } from '../core/helpers';

/**
 * Vengeance: accumulate incoming damage on the cooldown player so the next
 * execution can cash it out. Registered on onDamageTaken (player as defender).
 */
export function registerCooldownDamageTracking(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (!player.usesCooldown) return;
    if (!hasPassive(player, 'cooldown.vengeance')) return;
    if (ctx.damage > 0) player.usesCooldown.vengeanceDamageTaken += ctx.damage;
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
