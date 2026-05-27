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
import type { BroadcastStats } from "../telemetry/nodeTelemetry";

export interface NodeDeltaResult {
  snapshot: DeltaSnapshot;
  stats: BroadcastStats;
}

export function buildNodeDelta(
  world: World,
  nodeId: string,
  dirty: DirtyDrain,
  opts: { resync?: boolean } = {},
): NodeDeltaResult {
  const events = world.takeNodeEvents(nodeId);

  const deltas: EntityDelta[] = [];
  const liveIds = new Set<string>();
  let entityScans = 0;
  let adds = 0;
  let patches = 0;

  if (opts.resync) world.resetNodeDeltaState(nodeId);
  const members = world.getOrCreateNodeMembership(nodeId);
  const full = opts.resync || members.size === 0;

  for (const e of world.monsterEntities) {
    entityScans++;
    if (e.hasPosition.nodeId !== nodeId) continue;
    const kind = encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
    if (kind === 'add') adds++;
    else if (kind === 'patch') patches++;
  }

  for (const e of world.playerEntities) {
    entityScans++;
    if (e.hasPosition.nodeId !== nodeId) continue;
    const kind = encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
    if (kind === 'add') adds++;
    else if (kind === 'patch') patches++;
  }

  for (const netId of [...members]) {
    if (liveIds.has(netId)) continue;
    deltas.push({ kind: 'remove', netId });
    members.delete(netId);
  }

  const snapshot: DeltaSnapshot = {
    tick: world.tickCounter,
    nodeId,
    full,
    deltas,
    events,
  };

  let deltaBytes = 0;
  try {
    deltaBytes = JSON.stringify(snapshot).length;
  } catch {
    deltaBytes = 0;
  }

  return {
    snapshot,
    stats: {
      deltaBytes,
      adds,
      patches,
      fullResync: full,
      entityScans,
      membershipSize: members.size,
      pendingEvents: events.length,
    },
  };
}

function encodeNodeEntityDelta(
  entity: ServerEntity,
  dirty: DirtyDrain,
  members: Set<string>,
  liveIds: Set<string>,
  deltas: EntityDelta[],
): 'add' | 'patch' | 'none' {
  const netId = entityNetworkId(entity);
  if (!netId) return 'none';
  liveIds.add(netId);
  if (!members.has(netId)) {
    const add = encodeAdd(entity);
    if (!add) return 'none';
    deltas.push(add);
    members.add(netId);
    return 'add';
  }

  const entityKind = entityNetworkKind(entity);
  if (!entityKind) return 'none';
  const patchKeys = new Set(networkedKeysForKind(entityKind));
  for (const key of dirty.patched.get(netId) ?? []) patchKeys.add(key);
  const patch = encodePatch(entity, patchKeys, dirty.detached.get(netId));
  if (patch) {
    deltas.push(patch);
    return 'patch';
  }
  return 'none';
}
