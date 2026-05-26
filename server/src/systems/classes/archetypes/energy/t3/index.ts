import type { World } from '../../../../../world/World';
import { registerBeforeAttack } from './pipeline/beforeAttack';
import { registerEmpoweredHit } from './pipeline/empoweredHit';
import { registerNormalHit } from './pipeline/normalHit';
import { registerAfterHit } from './pipeline/afterHit';
import { updateAccumulator } from './ticks/accumulator';
import { updateAlternatingCurrents } from './ticks/alternatingCurrents';

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
 *   1. beforeAttack  — suppression + Singularity Execute trigger
 *   2. onHit         — empowered discharge handlers (Polarity Decay, Cascading
 *                      Induction, Superconducting Mass, Capacitor Shunt)
 *   3. onHit         — non-empowered passive bonuses (Accumulator, MV, PD
 *                      stack consume, AC charge mult, HE window, CI tagging,
 *                      SM charge build)
 *   4. afterHit      — custom energy gain (Accumulator, MV, AC charge→discharge,
 *                      CS reservoir split, SE accelerating fill)
 */
export function initEnergyT3(): void {
  registerBeforeAttack();
  registerEmpoweredHit();
  registerNormalHit();
  registerAfterHit();
}

/**
 * Run once per world tick. Order doesn't matter — Accumulator and
 * Alternating Currents read disjoint slice state.
 */
export function updateEnergyT3(world: World, dt: number): void {
  updateAccumulator(world, dt);
  updateAlternatingCurrents(world, dt);
}

// ── Public re-exports (preserve energyT3 module API) ─────────────────────────
export {
  getAccumulatorStacks,
  getOverchargeStacks,
  getACPhase,
  getACPhaseForPlayer,
  getACDischargeRemainingPct,
  getCapacitorReservoirPct,
  getSMChargePool,
} from './core/selectors';
export { ENERGY_T3_BUFFS } from './core/buffs';
export { CS_RESERVOIR_MAX, SE_ENERGY_MAX } from './core/constants';
