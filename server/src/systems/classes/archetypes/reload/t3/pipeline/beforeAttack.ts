import { registerCombatListener } from '../../../../../combat/engine/combatPipeline';

export function registerLaserGate(): void {
  registerCombatListener('beforeAttack', (ctx, _world) => {
    if (ctx.attackerType !== 'player') return;

    const entity = ctx.attacker;
    if (!entity.usesReload) return;

    // Laser path: standard auto-attack is cancelled — the laser fires its own
    // damage ticks in updateLaserPlayer.
    if ((entity.usesSkills.passives['reload.laser'] ?? 0) > 0) {
      ctx.cancelled = true;
    }

    // Snipe needs no gate here: its slow cadence is hard-set on attackCooldown in
    // recalculatePlayerStats, so the normal attack timer already paces it. (The old
    // cancel-gate cancelled rapid attacks AFTER reloadPrototype had decremented ammo,
    // which is what drained the clip on its own.)
  });
}
