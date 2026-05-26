import { addCounter, getCounter, setCounter } from '@mmo-idle/shared';
import { registerCombatListener } from '../../combat/engine/combatPipeline';
import { EVASION_KEY } from '../core/pools';

/**
 * Register the evasion listener on `onDamageTaken`. Counts incoming hits via
 * `evasionHits` counter; when the count reaches the player's `evadesHits`
 * threshold, the next hit is fully evaded (ctx.damage zeroed, metadata flag set).
 *
 * Runs first in the damageTaken chain so evaded hits are not seen by downstream
 * defense listeners (damage cap, shields, hit-to-DoT, absorb).
 */
export function registerEvasion(): void {
  registerCombatListener('onDamageTaken', (ctx, _world) => {
    if (ctx.defenderType !== 'player') return;
    const player = ctx.defender;
    if (!player.evadesHits) return;

    const state = player.tracksCombat;

    addCounter(state, EVASION_KEY, 1);
    const count = getCounter(state, EVASION_KEY);

    if (count >= player.evadesHits.threshold) {
      setCounter(state, EVASION_KEY, 0);
      player.evadesHits.count = 0;
      ctx.damage             = 0;
      ctx.metadata['evaded'] = true;
    } else {
      player.evadesHits.count = count;
    }
  });
}
