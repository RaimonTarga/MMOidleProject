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
} from "@mmo-idle/shared";
import type { World } from "../../world/World";
import type { PlayerEntity } from "../../ecs/entity";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import { markSliceDirty } from "../../ecs/dirtyHelpers";
import {
  directionFromTo,
  findDungeonNodeFor,
  findRegularNodeFor,
  findShortestNodePath,
  gateTargetForDirection,
} from "../../world/nodePath";
import { setEntityMotion, stopEntity } from "./movement";
import { isPartyFollower } from "../player/party/partySystem";
import { isFleeing } from "../combat/ai/flee";

type TraversePhase = "mob" | "boss" | "advance";

export function clearAutoTraversePath(
  world: World,
  player: PlayerEntity,
): void {
  detachComponent(world, player, "hasAutoTraversePath");
}

/**
 * Begin walking to `destNodeId` via the shortest gate path — the server-side
 * owner of map click-to-navigate. Turns off auto-combat (the player just
 * travels) and installs a traverse path. `updateAutoTraverse` steps the path
 * every tick even while auto-combat/auto-traverse are off, so the client no
 * longer needs to compute gate destinations or advance the path itself.
 */
export function startManualNavigation(
  world: World,
  player: PlayerEntity,
  destNodeId: string,
): void {
  detachComponent(world, player, "hasManualMoveIntent");
  if (player.usesAutocombat.auto) {
    player.usesAutocombat.auto = false;
    markSliceDirty(world, player, "usesAutocombat");
  }

  const fromNodeId = player.hasPosition.nodeId;
  if (destNodeId === fromNodeId) {
    clearAutoTraversePath(world, player);
    return;
  }

  const path = findShortestNodePath(fromNodeId, destNodeId);
  if (!path || path.length < 2) {
    clearAutoTraversePath(world, player);
    return;
  }

  attachComponent(world, player, "hasAutoTraversePath", {
    targetNodeId: destNodeId,
    remainingPath: path.slice(1),
  });
}

function resolveTraversePhase(
  progression: BiomeProgressInput,
  biomeGroup: string,
  biomeTier: number,
): TraversePhase {
  if (isBiomeFullyDoneAtTier(progression, biomeGroup, biomeTier))
    return "advance";
  if (
    isBiomeLevelCapped(progression, biomeGroup) &&
    areAllBiomeRecipesUnlocked(progression, biomeGroup) &&
    !areAllNonBossNodesClearedAtTier(progression, biomeGroup, biomeTier)
  ) {
    return "mob";
  }
  if (
    isBiomeLevelCapped(progression, biomeGroup) &&
    areAllBiomeRecipesUnlocked(progression, biomeGroup) &&
    hasDungeonForBiomeTier(biomeGroup, biomeTier) &&
    !isBossClearedAtTier(progression, biomeGroup, biomeTier)
  ) {
    return "boss";
  }
  return "mob";
}

function resolveDesiredNodeId(
  progression: BiomeProgressInput,
  phase: TraversePhase,
  biomeGroup: string,
  biomeTier: number,
  currentNodeId: string,
): string | null {
  if (phase === "mob") {
    const currentNode = NODE_BIOMES[currentNodeId];
    const currentIsRelevantRegular =
      currentNode?.biomeGroup === biomeGroup &&
      currentNode.biomeTier === biomeTier &&
      !currentNode.isDungeon;
    const currentBiomeCapped =
      isBiomeLevelCapped(progression, biomeGroup) &&
      areAllBiomeRecipesUnlocked(progression, biomeGroup);

    if (
      currentIsRelevantRegular &&
      (!currentBiomeCapped || !isNodeCleared(progression, currentNodeId))
    ) {
      return currentNodeId;
    }

    return (
      listNonBossNodesForBiomeTier(biomeGroup, biomeTier).find(
        (nodeId) => !isNodeCleared(progression, nodeId),
      ) ?? findRegularNodeFor(biomeGroup, biomeTier)
    );
  }
  if (phase === "boss") {
    return findDungeonNodeFor(biomeGroup, biomeTier);
  }
  const next = pickNextIncompleteBiome(progression);
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

  setEntityMotion(
    world,
    player,
    gateTargetForDirection(player.hasPosition.nodeId, dir),
  );
  return true;
}

function markCurrentNodeClearedIfCapped(
  world: World,
  player: PlayerEntity,
): void {
  const nodeId = player.hasPosition.nodeId;
  const nodeInfo = NODE_BIOMES[nodeId];
  if (!nodeInfo || nodeInfo.isDungeon) return;
  if (!isBiomeLevelCapped(player.tracksProgression, nodeInfo.biomeGroup))
    return;
  if (
    !areAllBiomeRecipesUnlocked(player.tracksProgression, nodeInfo.biomeGroup)
  )
    return;
  if (isNodeCleared(player.tracksProgression, nodeId)) return;

  player.tracksProgression.clearedNodes ??= [];
  player.tracksProgression.clearedNodes.push(nodeId);
  markSliceDirty(world, player, "tracksProgression");
}

export function updateAutoTraverse(world: World): void {
  for (const player of world.livePlayers) {
    if (isFleeing(player)) continue;
    // Party followers in auto-combat mirror the leader (updatePartyFollow owns
    // them) instead of running their own traverse. With auto off they may still
    // manually navigate, so fall through to manual path stepping below.
    if (isPartyFollower(player) && player.usesAutocombat.auto) {
      if (player.hasAutoTraversePath) clearAutoTraversePath(world, player);
      continue;
    }
    // A direct click-to-move cancels any in-progress navigation / traverse.
    if (player.hasManualMoveIntent) {
      if (player.hasAutoTraversePath) clearAutoTraversePath(world, player);
      continue;
    }

    const autoTraverseActive =
      player.usesAutocombat.auto && player.usesAutocombat.autoTraverse;

    // Auto-traverse off: we may still be walking a manual navigation path (map
    // click-to-navigate). Step it, but skip the auto-combat biome decision.
    if (!autoTraverseActive) {
      if (player.hasAutoTraversePath) {
        advancePathIfArrived(world, player);
        continueAutoTraversePath(world, player);
      }
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
    if (
      isBiomeFullyDoneAtTier(player.tracksProgression, biomeGroup, biomeTier)
    ) {
      const next = pickNextIncompleteBiome(player.tracksProgression);
      if (!next) {
        if (player.hasAutoTraversePath) clearAutoTraversePath(world, player);
        continue;
      }
      biomeGroup = next.biomeGroup;
      biomeTier = next.tier;
    }

    const phase = resolveTraversePhase(
      player.tracksProgression,
      biomeGroup,
      biomeTier,
    );
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
      attachComponent(world, player, "hasAutoTraversePath", {
        targetNodeId: desiredNodeId,
        remainingPath: path.slice(1),
      });
    }

    continueAutoTraversePath(world, player);
  }
}
