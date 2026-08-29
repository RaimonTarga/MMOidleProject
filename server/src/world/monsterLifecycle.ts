import type { World } from "./World";
import type { MonsterEntity } from "../ecs/entity";
import type { HasKnockback } from "../systems/combat/damage/knockback";
import { setAttackTarget } from "../systems/combat/ai/targeting";
import { clearToxicPoolsByOwner } from "../systems/world/groundZones";

/** O(1) typed lookup. Backed by world.monsterById, populated via onEntityAdded. */
export function getMonsterEntity(world: World, id: string): MonsterEntity | undefined {
  return world.monsterById.get(id);
}

/** Iterate every monster entity in `nodeId`. Uses the `hasPosition` slice. */
export function* monsterEntitiesInNode(world: World, nodeId: string): IterableIterator<MonsterEntity> {
  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId === nodeId) yield e;
  }
}

/** True if the monster currently exists in the world. */
export function hasMonster(world: World, id: string): boolean {
  return getMonsterEntity(world, id) !== undefined;
}

export function getMonsterKnockback(world: World, id: string): HasKnockback | undefined {
  return getMonsterEntity(world, id)?.hasKnockback;
}

export function setMonsterKnockback(world: World, id: string, kb: HasKnockback): void {
  const e = getMonsterEntity(world, id);
  if (!e) return;
  if (e.hasKnockback) {
    e.hasKnockback = kb;
  } else {
    world.ecs.addComponent(e, "hasKnockback", kb);
  }
}

export function clearMonsterKnockback(world: World, id: string): void {
  const e = getMonsterEntity(world, id);
  if (!e || !e.hasKnockback) return;
  world.ecs.removeComponent(e, "hasKnockback");
}

/**
 * Centralized monster despawn. Removes the entity from miniplex, which
 * cascades component removal across every query in one call. Use this
 * instead of multiple `world.<map>.delete(id)` lines.
 */
export function removeMonsterEntity(world: World, id: string): void {
  const e = getMonsterEntity(world, id);
  if (!e) return;
  for (const player of world.livePlayers) {
    if (player.hasAttackTarget?.targetId === id) {
      setAttackTarget(world, player, null);
    }
  }
  // A hazard this monster planted dies with it. Boss pools now run for minutes,
  // so an uncleared arena would stay lethal long after the encounter ended.
  clearToxicPoolsByOwner(world, e.hasPosition.nodeId, e.isMonster.id);
  world.adjustMonsterCount(e.hasPosition.nodeId, -1, e.isMonster.isBoss);
  world.ecs.remove(e);
}
