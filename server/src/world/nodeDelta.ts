import {
  type DeltaSnapshot,
  type EntityDelta,
  type NetworkedComponentKey,
  type NetworkedEntity,
} from "@mmo-idle/shared";
import type { World, NodeDeltaState } from "./World";
import type { ServerEntity } from "../ecs/entity";
import { entityNetworkId } from "../ecs/entity";
import { componentsForEntity } from "../ecs/deltaEncoder";
import type { DirtyDrain } from "../ecs/dirtyTracker";
import type { BroadcastStats } from "../telemetry/nodeTelemetry";
import { buildGroundZoneViews } from "../systems/world/groundZones";

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

  for (const e of world.minionEntities) {
    entityScans++;
    if (e.hasPosition.nodeId !== nodeId) continue;
    const kind = encodeNodeEntityDelta(e, dirty, members, liveIds, deltas);
    if (kind === 'add') adds++;
    else if (kind === 'patch') patches++;
  }

  for (const netId of [...members.keys()]) {
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

  const respawnMarker = world.bossRespawnMarkers.get(nodeId);
  if (respawnMarker?.monsterTypeId === "void-overlord") {
    snapshot.voidOverlordRespawn = {
      nodeId,
      pos: respawnMarker.pos,
      durationMs: respawnMarker.durationMs,
      remainingMs: Math.max(0, respawnMarker.respawnAt - Date.now()),
    };
  }

  const dungeonGauntlet = world.buildDungeonGauntletView(nodeId);
  if (dungeonGauntlet) snapshot.dungeonGauntlet = dungeonGauntlet;

  const groundZones = buildGroundZoneViews(world, nodeId, Date.now());
  if (groundZones) snapshot.groundZones = groundZones;

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
  members: NodeDeltaState,
  liveIds: Set<string>,
  deltas: EntityDelta[],
): 'add' | 'patch' | 'none' {
  const netId = entityNetworkId(entity);
  if (!netId) return 'none';
  liveIds.add(netId);

  const built = componentsForEntity(entity);
  if (!built) return 'none';
  const { entityKind, components } = built;

  // Serialize each present slice once (wire-quantized) for value comparison.
  const currentStrings = new Map<NetworkedComponentKey, string>();
  for (const key of Object.keys(components) as NetworkedComponentKey[]) {
    currentStrings.set(key, JSON.stringify(components[key]));
  }

  const sent = members.get(netId);
  if (!sent) {
    // New to this node's delta stream → full add; seed the sent-value store.
    deltas.push({ kind: 'add', netId, entityKind, components });
    members.set(netId, currentStrings);
    return 'add';
  }

  // Value-diff (hybrid safety net): include a slice only when its serialized
  // value actually changed since the last broadcast, regardless of whether the
  // mutating system remembered to mark it dirty. A slice present before but
  // absent now is reported as removed. dirty.detached is unioned in for
  // robustness.
  const patchComponents: Partial<NetworkedEntity> = {};
  let changed = 0;
  const removedKeys: NetworkedComponentKey[] = [];

  for (const [key, str] of currentStrings) {
    if (sent.get(key) !== str) {
      (patchComponents as Record<string, unknown>)[key] = components[key];
      sent.set(key, str);
      changed++;
    }
  }

  for (const key of [...sent.keys()]) {
    if (!currentStrings.has(key)) {
      removedKeys.push(key);
      sent.delete(key);
    }
  }

  const detached = dirty.detached.get(netId);
  if (detached) {
    for (const key of detached) {
      if (!currentStrings.has(key) && !removedKeys.includes(key)) {
        removedKeys.push(key);
        sent.delete(key);
      }
    }
  }

  if (changed === 0 && removedKeys.length === 0) return 'none';
  deltas.push({
    kind: 'patch',
    netId,
    components: changed > 0 ? patchComponents : undefined,
    removed: removedKeys.length > 0 ? removedKeys : undefined,
  });
  return 'patch';
}
