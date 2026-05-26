import type { World } from '../../../../../world/World';
import { registerBeforeAttack } from './pipeline/beforeAttack';
import { registerEmpoweredHit } from './pipeline/empoweredHit';
import { registerNormalHit } from './pipeline/normalHit';
import { registerAfterHit } from './pipeline/afterHit';
import { updateAlternatingCurrents } from './ticks/alternatingCurrents';
import { updateFlashSpeed } from './ticks/flash';

/**
 * Register all tier-3 energy combat pipeline listeners.
 * Called once from `initEnergyArchetype()` at server startup, BEFORE the base
 * empowered-multiplier listener so:
 *   - beforeAttack suppression fires early in the phase
 *   - empowered onHit handlers see the empowered flag still set
 *   - afterHit handlers can set `ctx.metadata['energyHandled']` to skip the
 *     base energy gain in `energyPrototype`
 *
 * Registration order:
 *   1. beforeAttack  — suppression + Singularity Execute trigger + Flash teleport
 *   2. onHit         — empowered discharge handlers (Polarity Decay, Cascading
 *                      Induction, Superconducting Mass, Capacitor Shunt)
 *   3. onHit         — non-empowered passive bonuses (MV, PD stack consume,
 *                      AC charge mult, HE window, CI tagging, SM charge build)
 *   4. afterHit      — custom energy gain (MV, AC charge→discharge,
 *                      CS reservoir split, SE accelerating fill)
 */
export function initEnergyT3(): void {
  registerBeforeAttack();
  registerEmpoweredHit();
  registerNormalHit();
  registerAfterHit();
}

/**
 * Run once per world tick. Flash resets its speed ramp on disengage, while
 * Alternating Currents reads discharge slice state.
 */
export function updateEnergyT3(world: World, dt: number): void {
  updateFlashSpeed(world, dt);
  updateAlternatingCurrents(world, dt);
}

// ── Public re-exports (preserve energyT3 module API) ─────────────────────────
export {
  getOverchargeStacks,
  getACPhase,
  getACPhaseForPlayer,
  getACDischargeRemainingPct,
  getCapacitorReservoirPct,
  getSMChargePool,
} from './core/selectors';
export { ENERGY_T3_BUFFS } from './core/buffs';
export { CS_RESERVOIR_MAX, SE_ENERGY_MAX } from './core/constants';
