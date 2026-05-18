import type { PlayerState } from '@mmo-idle/shared';
import { registerCombatListener } from './combatPipeline';
import { addCounter, getCounter, setCounter } from './combatState';

export const CADENCE_THRESHOLD  = 5;
export const CADENCE_DAMAGE_MULT = 2;
const CADENCE_KEY = 'cadenceCount';

/**
 * Register the cadence hit-counter mechanic for the 'cadence' class.
 * Called by activateClassMechanics('cadence') at startup.
 *
 * Every CADENCE_THRESHOLD confirmed hits by a cadence player trigger a
 * rhythm burst: the triggering hit deals ×CADENCE_DAMAGE_MULT damage and
 * the counter resets to 0. Progress is mirrored to player.cadenceCount so
 * the client can display a live bar without extra network overhead.
 */
export function initCadenceArchetype(): void {
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (ctx.attacker.combatArchetype !== 'cadence') return;

    const state = world.playerCombatState.get(ctx.attacker.id);
    if (!state) return;

    const player = world.players.get(ctx.attacker.id) as PlayerState | undefined;
    if (!player) return;

    if (player.cadenceThreshold === 0) {
      player.cadenceThreshold = CADENCE_THRESHOLD;
    }

    addCounter(state, CADENCE_KEY, 1);
    const newCount = getCounter(state, CADENCE_KEY);
    player.cadenceCount = newCount;

    if (newCount >= CADENCE_THRESHOLD) {
      setCounter(state, CADENCE_KEY, 0);
      player.cadenceCount = 0;

      const base = ctx.damage;
      ctx.damage = base * CADENCE_DAMAGE_MULT;

      ctx.metadata['cadenceTrigger']    = true;
      ctx.metadata['cadenceDamageBonus'] = base;

      console.log(
        `[Cadence] ${player.id}: rhythm triggered — ${base} → ${ctx.damage} dmg (×${CADENCE_DAMAGE_MULT})`,
      );
    }
  });
}
