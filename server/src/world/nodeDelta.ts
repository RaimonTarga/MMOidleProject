import {
  networkedKeysForKind,
  type DeltaSnapshot,
  type EntityDelta,
} from "@mmo-idle/shared";
import type { World } from "./World";
import type { ServerEntity } from "../ecs/entity";
import { entityNetworkId, entityNetworkKind } from "../ecs/entity";
import { encodeAdd, encodePatch } from "../ecs/deltaEncoder";
import type { DirtyDrain } from "../ecs/dirtyTracker";

export function buildNodeDelta(
  world: World,
  nodeId: string,
  dirty: DirtyDrain,
  opts: { resync?: boolean } = {},
): DeltaSnapshot {
  const events = world.takeNodeEvents(nodeId);

  const deltas: EntityDelta[] = [];
  const liveIds = new Set<string>();
  if (opts.resync) world.resetNodeDeltaState(nodeId);
  const members = world.getOrCreateNodeMembership(nodeId);
  const full = opts.resync || members.size === 0;

  for (const e of world.monsterEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
  }

  for (const e of world.playerEntities) {
    if (e.hasPosition.nodeId !== nodeId) continue;
    encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
  }

  for (const netId of [...members]) {
    if (liveIds.has(netId)) continue;
    deltas.push({ kind: 'remove', netId });
    members.delete(netId);
  }

  return {
    tick: world.tickCounter,
    nodeId,
    full,
    deltas,
    events,
  };
}

function encodeNodeEntityDelta(
  entity: ServerEntity,
  dirty: DirtyDrain,
  members: Set<string>,
  liveIds: Set<string>,
  deltas: EntityDelta[],
): void {
  const netId = entityNetworkId(entity);
  if (!netId) return;
  liveIds.add(netId);
  if (!members.has(netId)) {
    const add = encodeAdd(entity);
    if (!add) return;
    deltas.push(add);
    members.add(netId);
    return;
  }

  const entityKind = entityNetworkKind(entity);
  if (!entityKind) return;
  const patchKeys = new Set(networkedKeysForKind(entityKind));
  for (const key of dirty.patched.get(netId) ?? []) patchKeys.add(key);
  const patch = encodePatch(entity, patchKeys, dirty.detached.get(netId));
  if (patch) deltas.push(patch);
}
