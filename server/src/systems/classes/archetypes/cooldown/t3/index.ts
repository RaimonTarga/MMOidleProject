import type { World } from '../../../../../world/World';
import { registerBeforeAttack } from './pipeline/beforeAttack';
import { registerEmpoweredHit } from './pipeline/empoweredHit';
import { registerNormalHit } from './pipeline/normalHit';
import { registerPostEmpoweredHit } from './pipeline/postEmpoweredHit';
import { updateOverdrive } from './ticks/light/overdrive';
import { updateBattery } from './ticks/balanced/battery';
import { updateSingularExtraction } from './ticks/heavy/singularExtraction';
import { updateChanneledBeam } from './ticks/heavy/channeledBeam';
import { registerCooldownDamageTracking, updateCooldownState } from './ticks/cooldownState';

/**
 * Register all tier-3 cooldown combat pipeline listeners.
 * Called once from initCooldownArchetype() at server startup.
 *
 * Registration order:
 *   1. beforeAttack       — suppress standard empowered mult for replacement paths
 *   2. onHit (empowered)  — each path's unique empowered effect
 *   3. onHit (normal)     — every non-empowered path
 *   4. onHit (empowered)  — battery bonus + alignment buff after the empowered hit
 */
export function initCooldownT3(): void {
  registerBeforeAttack();
  registerEmpoweredHit();
  registerNormalHit();
  registerPostEmpoweredHit();
  registerCooldownDamageTracking();
}

/**
 * Run once per world tick, after updateCombatState (so cooldowns are already
 * decremented) to handle time-driven T3 cooldown mechanics.
 */
export function updateCooldownT3(world: World, dt: number): void {
  updateOverdrive(world, dt);
  updateBattery(world, dt);
  updateSingularExtraction(world, dt);
  updateChanneledBeam(world, dt);
  updateCooldownState(world, dt);
}

// ── Public re-exports (preserve cooldownT3 module API) ───────────────────────
export {
  getOverdrivePct,
  getEternalChargeStacks,
  getTemporalExtPct,
  getBatteryStacks,
  getAlignmentPct,
} from './core/selectors';
export { COOLDOWN_T3_BUFFS } from './core/buffs';
