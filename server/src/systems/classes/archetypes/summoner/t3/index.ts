import type { World } from '../../../../../world/World';
import { registerCavePathHooks, tickCavePath } from './paths/cave';
import { tickMountainPath } from './paths/mountain';
import { registerPlainsPathHooks, tickPlainsPath } from './paths/plains';

export function initSummonerT3(): void {
  registerCavePathHooks();
  registerPlainsPathHooks();
}

export { registerMountainPathHooks } from './paths/mountain';

export function updateSummonerT3(world: World, dt: number, now: number): void {
  tickCavePath(world);
  tickPlainsPath(world, dt, now);
  tickMountainPath(world, now);
}

export { SUMMONER_T3_BUFFS } from './core/buffs';
