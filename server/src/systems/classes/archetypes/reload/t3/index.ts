import type { World } from '../../../../../world/World';
import { registerLaserGateAndSnipeCooldown } from './pipeline/beforeAttack';
import { registerGatlingKnockback } from './pipeline/gatlingKnockback';
import { registerSnipeDamage } from './pipeline/snipeDamage';
import { updateReloadT3Ticks } from './ticks/laser';

export function initReloadT3(): void {
  registerLaserGateAndSnipeCooldown();
  registerSnipeDamage();
  registerGatlingKnockback();
}

export function updateReloadT3(world: World, dt: number, now: number = Date.now()): void {
  updateReloadT3Ticks(world, dt, now);
}

export { RELOAD_T3_BUFFS } from './core/buffs';
export { getSnipeReady } from './core/selectors';
