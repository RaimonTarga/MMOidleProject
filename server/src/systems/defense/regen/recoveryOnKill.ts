import { GAME_CONFIG } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { activateRecovery } from './recovery';

/**
 * Register the on-kill Recovery listener.
 *
 * `defense.recovery-on-kill-pct` switches on a fraction of the player's Recovery
 * for `recovery-on-kill-ms` whenever they land a killing blow. Further kills
 * REFRESH the window rather than stacking another copy, which is what makes this
 * a dense-chain-farming mechanic — and deliberately weak against bosses and
 * isolated elites, where there is nothing to refresh off.
 */
export function registerRecoveryOnKill(): void {
  registerCombatListener('onKill', (ctx) => {
    if (ctx.attackerType !== 'player') return;

    const player = ctx.attacker;
    const pct = player.usesSkills.passives['defense.recovery-on-kill-pct'] ?? 0;
    if (pct <= 0) return;

    const durationMs =
      player.usesSkills.passives['defense.recovery-on-kill-ms'] ?? GAME_CONFIG.RECOVERY_ON_KILL_MS;
    activateRecovery(player.tracksCombat, 'kill', pct, durationMs);
  });
}
