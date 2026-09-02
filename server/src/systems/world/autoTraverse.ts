import {
  areAllBiomeRecipesUnlocked,
  areAllNonBossNodesClearedAtTier,
  hasDungeonForBiomeTier,
  isBiomeFullyDoneAtTier,
  isNodeCleared,
  isBossClearedAtTier,
  listNonBossNodesForBiomeTier,
  NODE_BIOMES,
  pickNextIncompleteBiome,
  getFlag,
  type BiomeProgressInput,
} from "@mmo-idle/shared";
import type { World } from "../../world/World";
import { NODE_REGISTRY } from "../../world/nodeRegistry";
import type { PlayerEntity } from "../../ecs/entity";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import { markSliceDirty } from "../../ecs/dirtyHelpers";
import {
  directionFromTo,
  findDungeonNodeFor,
  findRegularNodeFor,
  findShortestNodePath,
  gateApproachTarget,
} from "../../world/nodePath";
import { setEntityMotion, stopEntity } from "./movement";
import { isEffectivePartyFollower } from "../player/party/partySystem";
import { isFleeing } from "../combat/ai/flee";
import {
  RUNE_AVOID_ENEMIES_FLAG,
  RUNE_FOLLOW_LEADER_FLAG,
  RUNE_FIGHT_BACK_WHILE_TRAVELING_FLAG,
  RUNE_TACTICAL_RELOAD_FLAG,
  RUNE_WAIT_FOR_EXECUTION_FLAG,
  RUNE_WAIT_FOR_REGEN_FLAG,
} from "../combat/ai/runeConfig";
import { isPlayerActivelyInCombat, isPlayerInCombat } from "../combat/ai/engagement";

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
  // Once nothing more can be unlocked, stop grinding levels and switch to
  // clearing the remaining nodes, then the boss, then advance.
  if (
    areAllBiomeRecipesUnlocked(progression, biomeGroup) &&
    !areAllNonBossNodesClearedAtTier(progression, biomeGroup, biomeTier)
  ) {
    return "mob";
  }
  if (
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
      currentNode.kind === "normal";
    const currentBiomeUnlocksDone = areAllBiomeRecipesUnlocked(
      progression,
      biomeGroup,
    );

    if (
      currentIsRelevantRegular &&
      (!currentBiomeUnlocksDone || !isNodeCleared(progression, currentNodeId))
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
    travelGateTarget(world, player, dir),
  );
  return true;
}

/**
 * Phase-one Travel Safely steering: keep the existing node path and A* routing,
 * but choose a less exposed point along the required exit edge. Monsters remain
 * soft costs rather than new nav blockers, so an unavoidable route still works.
 */
function travelGateTarget(
  world: World,
  player: PlayerEntity,
  dir: "north" | "south" | "west" | "east",
) {
  const base = gateApproachTarget(player.hasPosition.nodeId, dir, player.hasPosition.current);
  if (!getFlag(player.tracksCombat, RUNE_AVOID_ENEMIES_FLAG)) return base;
  const node = NODE_REGISTRY.get(player.hasPosition.nodeId);
  if (!node) return base;
  const lateral = dir === "north" || dir === "south" ? "x" : "y";
  const extent = lateral === "x" ? node.width : node.height;
  const current = player.hasPosition.current[lateral];
  const candidates = [current, current - 180, current + 180, current - 360, current + 360]
    .map((value) => Math.max(50, Math.min(extent - 50, value)));

  let best = base;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const value of candidates) {
    const candidate = lateral === "x" ? { ...base, x: value } : { ...base, y: value };
    let score = Math.hypot(
      candidate.x - player.hasPosition.current.x,
      candidate.y - player.hasPosition.current.y,
    );
    for (const monster of world.monsterEntitiesInNode(player.hasPosition.nodeId)) {
      if (
        monster.hasAggroTarget?.targetKind === "player" &&
        monster.hasAggroTarget.targetId === player.isPlayer.id
      ) continue;
      const distance = Math.hypot(
        candidate.x - monster.hasPosition.current.x,
        candidate.y - monster.hasPosition.current.y,
      );
      score += Math.max(0, 1 - distance / 300) ** 2 * 900;
    }
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function travelMaintenanceOwns(player: PlayerEntity): boolean {
  return (
    (getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG) &&
      player.hasHealth.hp < player.hasHealth.maxHp) ||
    (getFlag(player.tracksCombat, RUNE_WAIT_FOR_EXECUTION_FLAG) &&
      player.usesCooldown !== undefined && player.hasEmpoweredAttack === undefined) ||
    (getFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG) &&
      player.usesReload !== undefined && player.usesReload.reloadingMs > 0)
  );
}

/** Pause and later release a path without copying or persisting its destination. */
function updateTravelCombatPause(world: World, player: PlayerEntity, now: number): boolean {
  const path = player.hasAutoTraversePath;
  if (!path || path.targetNodeId === player.hasPosition.nodeId) return false;
  const active = isPlayerActivelyInCombat(world, player);
  const mayFightBack = getFlag(player.tracksCombat, RUNE_FIGHT_BACK_WHILE_TRAVELING_FLAG);

  if (!player.fightsWhileTraveling && mayFightBack && active) {
    attachComponent(world, player, "fightsWhileTraveling", { startedAtMs: now });
  }
  if (!player.fightsWhileTraveling) return false;

  if (active || isPlayerInCombat(player, now) || travelMaintenanceOwns(player)) return true;
  detachComponent(world, player, "fightsWhileTraveling");
  return false;
}

function markCurrentNodeClearedIfUnlocksDone(
  world: World,
  player: PlayerEntity,
): void {
  const nodeId = player.hasPosition.nodeId;
  const nodeInfo = NODE_BIOMES[nodeId];
  if (!nodeInfo || nodeInfo.kind !== "normal") return;
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
  const now = Date.now();
  for (const player of world.livePlayers) {
    if (isFleeing(player)) continue;
    if (updateTravelCombatPause(world, player, now)) continue;
    // Rune-following party members mirror the effective leader
    // (updatePartyFollow owns them) instead of running their own traverse.
    if (
      isEffectivePartyFollower(world, player) &&
      player.usesAutocombat.auto &&
      getFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG)
    ) {
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
    markCurrentNodeClearedIfUnlocksDone(world, player);

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
