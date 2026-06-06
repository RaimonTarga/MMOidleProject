import type { World } from "./World";
import type { MinionEntity } from "../ecs/entity";

/** O(1) typed lookup. Backed by world.minionById, populated via onEntityAdded. */
export function getMinionEntity(world: World, id: string): MinionEntity | undefined {
  return world.minionById.get(id);
}

/** Iterate every minion entity in `nodeId`. Uses the `hasPosition` slice. */
export function* minionEntitiesInNode(world: World, nodeId: string): IterableIterator<MinionEntity> {
  for (const e of world.minionEntities) {
    if (e.hasPosition.nodeId === nodeId) yield e;
  }
}

/** True if the minion currently exists in the world. */
export function hasMinion(world: World, id: string): boolean {
  return getMinionEntity(world, id) !== undefined;
}

/**
 * Centralized minion despawn. Removes the entity from miniplex, which
 * cascades component removal across every query in one call.
 */
export function removeMinionEntity(world: World, id: string): void {
  const e = getMinionEntity(world, id);
  if (!e) return;
  world.ecs.remove(e);
}
