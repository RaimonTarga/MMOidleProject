import { registerCombatListener } from '../../../combat/engine/combatPipeline';
import { isMechanicProxy, registerEmpoweredMultiplier } from '../../../combat/engine/empoweredAttacks';
import { emitMechanicFired } from '../../../combat/engine/mechanicFired';
import { initSquire } from './squire';

/** Damage multiplier on the slam (the empowered swing). The kit's number rules on top. */
export const EXECUTION_MULTIPLIER = 2.0;

/**
 * Register listeners for the Squire's slam.
 * Call once at server startup, before the World is created.
 *
 * The empowered multiplier sizes the slam. The listener after it announces
 * `mechanic-fired` when that slam lands. Resolve, the responses and when the
 * slam arms live in `squire.ts` (class-first CQ.1). The 7s execution clock,
 * the frame loop and the T3 paths are gone (CQ7).
 */
export function initCooldownArchetype(): void {
  // Register the empowered multiplier before the Squire's onHit hooks so the slam
  // reads ctx.metadata['empoweredAttack'] on the same hit.
  registerEmpoweredMultiplier(EXECUTION_MULTIPLIER, {
    attackerType:  'player',
    attackerSlice: 'usesCooldown',
    passiveKey:    'cooldown.empowered-mult',
  });

  // `mechanic-fired`: this reads "the slam's empowered flag was just spent".
  // Registered immediately after the multiplier, before the Squire's hooks, so
  // anything that reads the moment sees the same hit. A mechanic-proxy counts
  // as the slam and never announces it (rule 3).
  registerCombatListener('onHit', (ctx, world) => {
    if (ctx.attackerType !== 'player') return;
    if (!ctx.metadata['empoweredAttack']) return;
    if (isMechanicProxy(ctx)) return;
    if (!ctx.attacker.usesCooldown) return;
    emitMechanicFired(world, ctx.attacker, ctx);
  });

  // Resolve, the Guard's catch, the slam. After the empowered multiplier.
  initSquire();
}
