import {
  areAllBiomeRecipesUnlocked,
  areAllNonBossNodesClearedAtTier,
  hasDungeonForBiomeTier,
  isBiomeFullyDoneAtTier,
  isBiomeLevelCapped,
  isNodeCleared,
  isBossClearedAtTier,
  listNonBossNodesForBiomeTier,
  NODE_BIOMES,
  pickNextIncompleteBiome,
  type BiomeProgressInput,
} from '@mmo-idle/shared';
import type { World } from '../../world/World';
import type { PlayerEntity } from '../../ecs/entity';
import { attachComponent, detachComponent } from '../../ecs/markerHelpers';
import { markSliceDirty } from '../../ecs/dirtyHelpers';
import {
  directionFromTo,
  findDungeonNodeFor,
  findRegularNodeFor,
  findShortestNodePath,
  gateTargetForDirection,
} from '../../world/nodePath';
import { setEntityMotion, stopEntity } from './movement';

type TraversePhase = 'mob' | 'boss' | 'advance';

export function clearAutoTraversePath(world: World, player: PlayerEntity): void {
  detachComponent(world, player, 'hasAutoTraversePath');
}

function resolveTraversePhase(
  progression: BiomeProgressInput,
  biomeGroup: string,
  biomeTier: number,
): TraversePhase {
  if (isBiomeFullyDoneAtTier(progression, biomeGroup, biomeTier)) return 'advance';
  if (
    isBiomeLevelCapped(progression, biomeGroup) &&
    areAllBiomeRecipesUnlocked(progression, biomeGroup) &&
    !areAllNonBossNodesClearedAtTier(progression, biomeGroup, biomeTier)
  ) {
    return 'mob';
  }
  if (
    isBiomeLevelCapped(progression, biomeGroup) &&
    areAllBiomeRecipesUnlocked(progression, biomeGroup) &&
    hasDungeonForBiomeTier(biomeGroup, biomeTier) &&
    !isBossClearedAtTier(progression, biomeGroup, biomeTier)
  ) {
    return 'boss';
  }
  return 'mob';
}

function resolveDesiredNodeId(
  progression: BiomeProgressInput,
  phase: TraversePhase,
  biomeGroup: string,
  biomeTier: number,
  currentNodeId: string,
): string | null {
  if (phase === 'mob') {
    const currentNode = NODE_BIOMES[currentNodeId];
    const currentIsRelevantRegular =
      currentNode?.biomeGroup === biomeGroup &&
      currentNode.biomeTier === biomeTier &&
      !currentNode.isDungeon;
    const currentBiomeCapped =
      isBiomeLevelCapped(progression, biomeGroup) &&
      areAllBiomeRecipesUnlocked(progression, biomeGroup);

    if (currentIsRelevantRegular && (!currentBiomeCapped || !isNodeCleared(progression, currentNodeId))) {
      return currentNodeId;
    }

    return listNonBossNodesForBiomeTier(biomeGroup, biomeTier)
      .find(nodeId => !isNodeCleared(progression, nodeId)) ??
      findRegularNodeFor(biomeGroup, biomeTier);
  }
  if (phase === 'boss') {
    return findDungeonNodeFor(biomeGroup, biomeTier);
  }
  const next = pickNextIncompleteBiome(progression, 0);
  if (!next) return null;
  return findRegularNodeFor(next.biomeGroup, next.tier);
}

function advancePathIfArrived(world: World, player: PlayerEntity): void {
  const pathState = player.hasAutoTraversePath;
  if (!pathState) return;
  if (player.hasPosition.nodeId !== pathState.remainingPath[0]) return;

  pathState.remainingPath.shift();
  if (pathState.remainingPath.length === 0) {
    clearAutoTraversePath(world, player);
    stopEntity(world, player);
  }
}

function continueAutoTraversePath(world: World, player: PlayerEntity): boolean {
  const pathState = player.hasAutoTraversePath;
  if (!pathState) return false;
  if (pathState.remainingPath.length === 0) {
    clearAutoTraversePath(world, player);
    stopEntity(world, player);
    return false;
  }

  const nextHop = pathState.remainingPath[0];
  const dir = directionFromTo(player.hasPosition.nodeId, nextHop);
  if (!dir) {
    clearAutoTraversePath(world, player);
    stopEntity(world, player);
    return false;
  }

  setEntityMotion(world, player, gateTargetForDirection(player.hasPosition.nodeId, dir));
  return true;
}

function markCurrentNodeClearedIfCapped(world: World, player: PlayerEntity): void {
  const nodeId = player.hasPosition.nodeId;
  const nodeInfo = NODE_BIOMES[nodeId];
  if (!nodeInfo || nodeInfo.isDungeon) return;
  if (!isBiomeLevelCapped(player.tracksProgression, nodeInfo.biomeGroup)) return;
  if (!areAllBiomeRecipesUnlocked(player.tracksProgression, nodeInfo.biomeGroup)) return;
  if (isNodeCleared(player.tracksProgression, nodeId)) return;

  player.tracksProgression.clearedNodes ??= [];
  player.tracksProgression.clearedNodes.push(nodeId);
  markSliceDirty(world, player, 'tracksProgression');
}

export function updateAutoTraverse(world: World): void {
  for (const player of world.playerEntities) {
    if (!player.usesAutocombat.auto || !player.usesAutocombat.autoTraverse) {
      if (player.hasAutoTraversePath) clearAutoTraversePath(world, player);
      continue;
    }
    if (player.hasManualMoveIntent) {
      clearAutoTraversePath(world, player);
      continue;
    }

    advancePathIfArrived(world, player);
    if (continueAutoTraversePath(world, player)) continue;
    markCurrentNodeClearedIfCapped(world, player);

    const nodeId = player.hasPosition.nodeId;
    const nodeInfo = NODE_BIOMES[nodeId];
    if (!nodeInfo) continue;

    let biomeGroup = nodeInfo.biomeGroup;
    let biomeTier = nodeInfo.biomeTier;
    if (isBiomeFullyDoneAtTier(player.tracksProgression, biomeGroup, biomeTier)) {
      const next = pickNextIncompleteBiome(player.tracksProgression, 0);
      if (!next) {
        if (player.hasAutoTraversePath) clearAutoTraversePath(world, player);
        continue;
      }
      biomeGroup = next.biomeGroup;
      biomeTier = next.tier;
    }

    const phase = resolveTraversePhase(player.tracksProgression, biomeGroup, biomeTier);
    const desiredNodeId = resolveDesiredNodeId(
      player.tracksProgression,
      phase,
      biomeGroup,
      biomeTier,
      nodeId,
    );
    if (!desiredNodeId || desiredNodeId === nodeId) {
      if (player.hasAutoTraversePath) clearAutoTraversePath(world, player);
      continue;
    }

    if (
      !player.hasAutoTraversePath ||
      player.hasAutoTraversePath.targetNodeId !== desiredNodeId
    ) {
      const path = findShortestNodePath(nodeId, desiredNodeId);
      if (!path || path.length < 2) continue;
      attachComponent(world, player, 'hasAutoTraversePath', {
        targetNodeId: desiredNodeId,
        remainingPath: path.slice(1),
      });
    }

    continueAutoTraversePath(world, player);
  }
}
