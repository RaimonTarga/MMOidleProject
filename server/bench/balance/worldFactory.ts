import { createBenchWorld } from '../harness';
import type { World } from '../../src/world/World';

/**
 * Arena world — for measuring a FIGHT. Repopulation is suppressed so a node can
 * be emptied and the clear timed; without this the node refills under the bot
 * and `isNodeCleared` never fires.
 */
export function createBalanceWorld(): World {
  const world = createBenchWorld();
  world.suppressRepopulation = true;
  return world;
}

/**
 * Farm world — for measuring a RUN. Repopulation stays ON, so the node refills
 * on the live `ensurePopulation` cadence and the bot keeps killing for as long
 * as the sim runs. The only difference from the live server is that no other
 * players exist, so nothing competes for spawns.
 */
export function createFarmWorld(): World {
  return createBenchWorld();
}
