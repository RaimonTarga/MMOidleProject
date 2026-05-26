import { isNetworkedComponentKey, type NetworkedComponentKey } from "@mmo-idle/shared";
import type { World } from "../world/World";
import type { ServerEntity } from "./entity";
import { entityNetworkId } from "./entity";

export function markSliceDirty(
  world: World,
  entity: ServerEntity,
  key: keyof ServerEntity,
): void {
  if (!isNetworkedComponentKey(key)) return;
  const netId = entityNetworkId(entity);
  if (!netId) return;
  world.dirty.markPatched(netId, key);
}

export function markSliceDetached(
  world: World,
  entity: ServerEntity,
  key: keyof ServerEntity,
): void {
  if (!isNetworkedComponentKey(key)) return;
  const netId = entityNetworkId(entity);
  if (!netId) return;
  world.dirty.markDetached(netId, key);
}

export function mutateSlice<K extends NetworkedComponentKey>(
  world: World,
  entity: ServerEntity,
  key: K,
  mutator: (slice: NonNullable<ServerEntity[K]>) => void,
): void {
  const slice = entity[key];
  if (!slice) return;
  mutator(slice as NonNullable<ServerEntity[K]>);
  markSliceDirty(world, entity, key);
}
