import type { ServerEntity } from "./entity";
import type { World } from "../world/World";
import type { CombatState } from "../systems/combatState";
import { getStatusEffect, getStatusEffects } from "@mmo-idle/shared";

const MARKER = {};

type MarkerKey =
  | "hasDetonation"
  | "hasHemorrhage"
  | "hasDot"
  | "hasConflagration"
  | "hasChill"
  | "hasFrozen"
  | "hasEntropy"
  | "hasAshbrandBurn";

export function attachComponent<K extends keyof ServerEntity>(
  world: World,
  entity: ServerEntity,
  key: K,
  value: NonNullable<ServerEntity[K]>,
): void {
  if (entity[key] !== undefined) {
    entity[key] = value;
    return;
  }
  world.ecs.addComponent(entity, key, value);
}

export function detachComponent<K extends keyof ServerEntity>(
  world: World,
  entity: ServerEntity,
  key: K,
): void {
  if (entity[key] === undefined) return;
  world.ecs.removeComponent(entity, key);
}

export function attachMarker(
  world: World,
  entity: ServerEntity,
  key: MarkerKey,
): void {
  attachComponent(world, entity, key, MARKER);
}

export function detachMarker(
  world: World,
  entity: ServerEntity,
  key: MarkerKey,
): void {
  detachComponent(world, entity, key);
}

/** Detach marker when no matching status effect remains on combat state. */
export function detachMarkerIfNoEffect(
  world: World,
  entity: ServerEntity,
  key: MarkerKey,
  state: CombatState,
  effectId: string,
): void {
  if (!getStatusEffect(state, effectId)) {
    detachComponent(world, entity, key);
  }
}

/** Detach marker when no status effects with the given id remain. */
export function detachMarkerIfNoEffects(
  world: World,
  entity: ServerEntity,
  key: MarkerKey,
  state: CombatState,
  effectId: string,
): void {
  if (getStatusEffects(state, effectId).length === 0) {
    detachComponent(world, entity, key);
  }
}
