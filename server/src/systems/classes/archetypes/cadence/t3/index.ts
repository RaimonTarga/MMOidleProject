import type { World } from '../../../../../world/World';
import { registerCadenceEmpoweredHit } from './pipeline/empoweredHit';
import { registerCadenceNormalHit } from './pipeline/normalHit';
import { registerCadenceSwiftblade } from './pipeline/swiftblade';
import { registerCadenceVerdict } from './pipeline/verdict';
import { updateCadenceState } from './ticks/cadenceState';
import { updateHemorrhages } from './ticks/hemorrhage';

export function initCadenceT3(): void {
  registerCadenceEmpoweredHit();
  registerCadenceNormalHit();
  registerCadenceSwiftblade();
  registerCadenceVerdict();
}

export function updateCadenceT3(world: World, dt: number): void {
  // Delayed Verdict (character-side) + Crescendo + Rampage decay live here now;
  // the old enemy-side detonation tick (ticks/detonation.ts) is retired.
  updateCadenceState(world, dt);
  updateHemorrhages(world, dt);
}

export { CADENCE_T3_BUFFS } from './core/buffs';
