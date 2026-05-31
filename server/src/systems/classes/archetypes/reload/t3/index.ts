import type { World } from '../../../../../world/World';
import { registerLaserGateAndSnipeCooldown } from './pipeline/beforeAttack';
import { registerGatlingKnockback } from './pipeline/gatlingKnockback';
import { registerSnipeDamage } from './pipeline/snipeDamage';
import { registerBlunderbussVolley } from './pipeline/blunderbuss';
import { registerReloadLightT3 } from './pipeline/lightPaths';
import { registerReloadBalancedT3 } from './pipeline/balancedPaths';
import { registerCoverFire } from './pipeline/coverFire';
import { registerReloadLifecycleHandlers } from './lifecycleHandlers';
import { updateReloadT3Ticks } from './ticks/laser';

export function initReloadT3(): void {
  registerLaserGateAndSnipeCooldown();
  registerSnipeDamage();
  registerGatlingKnockback();
  registerBlunderbussVolley();
  registerReloadLightT3();
  registerReloadBalancedT3();
  registerCoverFire();
  registerReloadLifecycleHandlers();
}

export function updateReloadT3(world: World, dt: number, now: number = Date.now()): void {
  updateReloadT3Ticks(world, dt, now);
}

export { RELOAD_T3_BUFFS } from './core/buffs';
export { getSnipeReady } from './core/selectors';
