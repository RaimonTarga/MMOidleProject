import {
  networkedKeysForKind,
  type EntityDelta,
  type HasPosition,
  type IsMoving,
  type NetworkedComponentKey,
  type NetworkedEntity,
} from "@mmo-idle/shared";
import type { ServerEntity } from "./entity";
import { entityNetworkId, entityNetworkKind } from "./entity";

type AddEntityDelta = Extract<EntityDelta, { kind: "add" }>;

/** Round spatial fields to whole pixels on the wire — halves float JSON size. */
function quantizeComponentForWire(
  key: NetworkedComponentKey,
  value: NetworkedEntity[NetworkedComponentKey],
): NetworkedEntity[NetworkedComponentKey] {
  if (key === 'hasPosition') {
    const pos = value as HasPosition;
    return {
      ...pos,
      current: { x: Math.round(pos.current.x), y: Math.round(pos.current.y) },
      speed: Math.round(pos.speed),
    };
  }
  if (key === 'isMoving') {
    const moving = value as IsMoving;
    return {
      motion: {
        direction: {
          x: Math.round(moving.motion.direction.x * 1000) / 1000,
          y: Math.round(moving.motion.direction.y * 1000) / 1000,
        },
        magnitude: Math.round(moving.motion.magnitude),
      },
    };
  }
  return value;
}

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
      (components as Record<string, unknown>)[key] = quantizeComponentForWire(key, value);
    }
  }
  return components;
}
