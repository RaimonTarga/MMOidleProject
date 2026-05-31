import { createBenchWorld } from '../harness';
import type { World } from '../../src/world/World';

export function createBalanceWorld(): World {
  const world = createBenchWorld();
  world.suppressRepopulation = true;
  return world;
}
