import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';
import { DEFAULT_SNIPE_COOLDOWN_MS } from '../core/constants';

export function registerLaserGateAndSnipeCooldown(): void {
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity.usesReload) return;

    const reload = entity.usesReload;
    const passives = entity.usesSkills.passives;

    // Laser path: standard auto-attack is cancelled — the laser fires its own
    // damage ticks in updateLaserPlayer.
    if ((passives['reload.laser'] ?? 0) > 0) {
      ctx.cancelled = true;
      return;
    }

    if ((passives['reload.snipe'] ?? 0) <= 0) return;

    if (reload.snipeCooldownMs > 0) {
      ctx.cancelled = true;
      return;
    }

    if (reload.ammo <= 0) return;

    reload.snipeCooldownMs = Math.round(passives['reload.snipe-cooldown-ms'] ?? DEFAULT_SNIPE_COOLDOWN_MS);
  });
}
