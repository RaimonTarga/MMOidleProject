import { TEST_ROOM_NODE_ID } from '@mmo-idle/shared';
import type { World } from './World';
import { removeMonsterEntity } from './monsterLifecycle';
import { ensurePopulation, ensureBoss } from '../systems/world/spawning';
import { clearGroundZonesForNode } from '../systems/world/groundZones';
import { clearCorpsesForNode } from '../systems/world/corpses';
import { clearAmbientRampOverride } from '../systems/world/nodeFeatures';
import {
  clearDungeonRuntime,
  ensureDungeon,
  isDungeonNode,
} from '../systems/world/dungeons/dungeon';

export function freezeNode(world: World, nodeId: string): void {
  if (nodeId === TEST_ROOM_NODE_ID) return;
  if (world.isNodeFrozen(nodeId)) return;

  for (const m of [...world.monsterEntitiesInNode(nodeId)]) {
    removeMonsterEntity(world, m.isMonster.id);
  }
  clearDungeonRuntime(world, nodeId);
  clearGroundZonesForNode(world, nodeId);
  clearCorpsesForNode(world, nodeId);
  clearAmbientRampOverride(world, nodeId);
  world.nextMonsterIdByNode.delete(nodeId);
  world.reconcileMonsterCounts();

  for (const key of [...world.nodeFeatureSpawnState.keys()]) {
    if (key.startsWith(`${nodeId}:`)) world.nodeFeatureSpawnState.delete(key);
  }
  for (const key of [...world.suppressedFeatureBlocks]) {
    if (key.startsWith(`${nodeId}:`)) world.suppressedFeatureBlocks.delete(key);
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
  if (isDungeonNode(nodeId)) {
    ensureDungeon(world, nodeId);
  } else {
    ensurePopulation(world, nodeId);
    ensureBoss(world, nodeId);
  }
  world.reconcileMonsterCounts();
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
