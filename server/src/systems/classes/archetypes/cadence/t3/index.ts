import type { World } from '../../../../../world/World';
import { registerCadenceEmpoweredHit } from './pipeline/empoweredHit';
import { registerCadenceNormalHit } from './pipeline/normalHit';
import { updateDetonations } from './ticks/detonation';
import { updateHemorrhages } from './ticks/hemorrhage';

export function initCadenceT3(): void {
  registerCadenceEmpoweredHit();
  registerCadenceNormalHit();
}

export function updateCadenceT3(world: World, dt: number): void {
  updateDetonations(world, dt);
  updateHemorrhages(world, dt);
}

export { CADENCE_T3_BUFFS } from './core/buffs';
