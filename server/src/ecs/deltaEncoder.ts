import {
  networkedKeysForKind,
  type EntityDelta,
  type NetworkedComponentKey,
  type NetworkedEntity,
} from "@mmo-idle/shared";
import type { ServerEntity } from "./entity";
import { entityNetworkId, entityNetworkKind } from "./entity";

type AddEntityDelta = Extract<EntityDelta, { kind: "add" }>;

export function encodeAdd(entity: ServerEntity): AddEntityDelta | null {
  const netId = entityNetworkId(entity);
  const entityKind = entityNetworkKind(entity);
  if (!netId || !entityKind) return null;
  return {
    kind: "add",
    netId,
    entityKind,
    components: pickComponents(entity, networkedKeysForKind(entityKind)),
  };
}

export function encodePatch(
  entity: ServerEntity,
  keys: Iterable<NetworkedComponentKey>,
  removed?: Iterable<NetworkedComponentKey>,
): EntityDelta | null {
  const netId = entityNetworkId(entity);
  if (!netId) return null;
  const components = pickComponents(entity, keys);
  const removedKeys = removed ? [...removed] : [];
  if (Object.keys(components).length === 0 && removedKeys.length === 0) return null;
  return {
    kind: "patch",
    netId,
    components: Object.keys(components).length > 0 ? components : undefined,
    removed: removedKeys.length > 0 ? removedKeys : undefined,
  };
}

export function pickComponents(
  entity: ServerEntity,
  keys: Iterable<NetworkedComponentKey>,
): Partial<NetworkedEntity> {
  const components: Partial<NetworkedEntity> = {};
  for (const key of keys) {
    const value = entity[key];
    if (value !== undefined) {
      (components as Record<string, unknown>)[key] = value;
    }
  }
  return components;
}
