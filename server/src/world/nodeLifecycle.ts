import { TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import { db } from '../db/index';
import { saveNodeSnapshot, loadNodeSnapshot } from '../db/nodeRepo';
import type { World } from './World';
import { serializeNode, hydrateNodeSnapshot } from './nodeSnapshotCodec';
import { removeMonsterEntity } from './monsterLifecycle';
import { ensurePopulation, ensureBoss } from '../systems/world/spawning';

export function freezeNode(world: World, nodeId: string): void {
  if (nodeId === TEST_ROOM_NODE_ID) return;
  if (world.isNodeFrozen(nodeId)) return;

  const bossRespawnAt = world.bossRespawnAt.get(nodeId) ?? null;
  const snapshot = serializeNode(world, nodeId, bossRespawnAt);
  saveNodeSnapshot(db, snapshot);

  for (const m of [...world.monsterEntitiesInNode(nodeId)]) {
    removeMonsterEntity(world, m.isMonster.id);
  }

  world.frozenNodes.add(nodeId);
  world.resetNodeDeltaState(nodeId);
  world.clearNodeEvents(nodeId);
  world.telemetry.clearNodeTelemetry(nodeId);
}

export function thawNode(world: World, nodeId: string): void {
  if (nodeId === TEST_ROOM_NODE_ID) return;
  if (!world.isNodeFrozen(nodeId)) return;

  world.frozenNodes.delete(nodeId);
  world.telemetry.syncFrozen(nodeId, false);
  const saved = loadNodeSnapshot(db, nodeId);

  if (saved?.monsters.length) {
    hydrateNodeSnapshot(world, saved);
  } else {
    ensurePopulation(world, nodeId);
    ensureBoss(world, nodeId);
  }

  world.resetNodeDeltaState(nodeId);
}

export function onNodeOccupancyChange(
  world: World,
  nodeId: string,
  prev: number,
  next: number,
): void {
  if (prev === 0 && next === 1) {
    thawNode(world, nodeId);
  } else if (prev === 1 && next === 0) {
    freezeNode(world, nodeId);
  }
}
