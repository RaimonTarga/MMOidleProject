import type { World } from "../../world/World";
import type { NodeDirection } from "@mmo-idle/shared";
import {
  exitNodeIdForGate,
  pointFromMotion,
  type Vec2,
} from "@mmo-idle/shared";
import { NODE_REGISTRY } from "../../world/nodeRegistry";
import { detachComponent } from "../../ecs/markerHelpers";
import { markSliceDirty } from "../../ecs/dirtyHelpers";
import { setEntityMotion, stopEntity } from "./movement";
import { thawNode } from "../../world/nodeLifecycle";
import { relocateMinionsForOwner } from "../classes/archetypes/summoner";

// Pixels from the boundary that fire a transition. Must match GATE_THICK in GameScene.
const EXIT_TRIGGER = 20;
/** Inset from gate band once the player has walked in after a transition. */
const PLACEMENT_INSET = EXIT_TRIGGER + 10;

function transitionPlacementTarget(
  direction: NodeDirection,
  node: { width: number; height: number },
  lateral: Vec2,
): Vec2 {
  const y = Math.max(0, Math.min(lateral.y, node.height));
  const x = Math.max(0, Math.min(lateral.x, node.width));
  switch (direction) {
    case "west":
      return { x: node.width - PLACEMENT_INSET, y };
    case "east":
      return { x: PLACEMENT_INSET, y };
    case "north":
      return { x, y: node.height - PLACEMENT_INSET };
    case "south":
      return { x, y: PLACEMENT_INSET };
  }
}

/** Entry point on the opposite edge — at the gate band, not yet inset. */
function transitionEntryPosition(
  direction: NodeDirection,
  node: { width: number; height: number },
  lateral: Vec2,
): Vec2 {
  const y = Math.max(0, Math.min(lateral.y, node.height));
  const x = Math.max(0, Math.min(lateral.x, node.width));
  switch (direction) {
    case "west":
      return { x: node.width - EXIT_TRIGGER, y };
    case "east":
      return { x: EXIT_TRIGGER, y };
    case "north":
      return { x, y: node.height - EXIT_TRIGGER };
    case "south":
      return { x, y: EXIT_TRIGGER };
  }
}
const TRANSITION_GATE_COOLDOWN_TICKS = 6;

const transitionGateCooldown = new Map<
  string,
  { nodeId: string; direction: NodeDirection; untilTick: number }
>();

/**
 * Clamp only wildly out-of-bounds client targets (stale cross-node coords).
 * Gate bands (0..EXIT_TRIGGER and height-EXIT_TRIGGER..height) must stay reachable.
 */
export function clampMoveTargetToNode(nodeId: string, target: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return target;
  return {
    x: Math.max(0, Math.min(node.width, target.x)),
    y: Math.max(0, Math.min(node.height, target.y)),
  };
}

/**
 * Returns the destination node id for an exit, or null if the boundary is sealed.
 */
export function resolveExit(
  nodeId: string,
  direction: NodeDirection,
): string | null {
  return exitNodeIdForGate(nodeId, direction);
}

/**
 * After movement is applied, check each player against the boundary of their
 * current node. A transition fires when the player reaches an edge that has an
 * exit to an adjacent node. Edges without an exit clamp the player in-place.
 */
export function updateTransitions(world: World): void {
  for (const entity of world.livePlayers) {
    const position = entity.hasPosition;
    const node = NODE_REGISTRY.get(position.nodeId);
    if (!node) continue;

    const W = node.width;
    const H = node.height;
    const current = position.current;

    const direction = world.collision.gateDirectionAt(current, position.nodeId);
    if (!direction) continue;

    const cooldown = transitionGateCooldown.get(entity.isPlayer.id);
    if (
      cooldown &&
      cooldown.nodeId === position.nodeId &&
      cooldown.direction === direction &&
      world.tickCounter <= cooldown.untilTick
    ) {
      continue;
    }
    if (cooldown && world.tickCounter > cooldown.untilTick) {
      transitionGateCooldown.delete(entity.isPlayer.id);
    }

    const targetNodeId = resolveExit(position.nodeId, direction);

    if (!targetNodeId) {
      // Sealed border — clamp player back inside.
      const target = entity.isMoving
        ? pointFromMotion(position.current, entity.isMoving.motion)
        : position.current;
      if (direction === "west") {
        position.current.x = EXIT_TRIGGER + 1;
        target.x = Math.max(EXIT_TRIGGER + 1, target.x);
      }
      if (direction === "east") {
        position.current.x = W - EXIT_TRIGGER - 1;
        target.x = Math.min(W - EXIT_TRIGGER - 1, target.x);
      }
      if (direction === "north") {
        position.current.y = EXIT_TRIGGER + 1;
        target.y = Math.max(EXIT_TRIGGER + 1, target.y);
      }
      if (direction === "south") {
        position.current.y = H - EXIT_TRIGGER - 1;
        target.y = Math.min(H - EXIT_TRIGGER - 1, target.y);
      }
      setEntityMotion(world, entity, target);
      continue;
    }

    const targetNode = NODE_REGISTRY.get(targetNodeId)!;
    const fromNodeId = position.nodeId;

    position.nodeId = targetNodeId;
    world.movePlayerNode(fromNodeId, targetNodeId, entity.isPlayer.id);

    // Thaw frozen destinations; node:preparing is only for long loads, not every gate cross.
    if (world.isNodeFrozen(targetNodeId)) {
      world.nodePreparingEmitter?.(entity.isPlayer.id, targetNodeId);
      thawNode(world, targetNodeId);
    }

    world.resetNodeDeltaState(targetNodeId);

    // Enter at the opposite gate band, then walk inward to clear it.
    const entry = transitionEntryPosition(direction, targetNode, position.current);
    const placement = transitionPlacementTarget(
      direction,
      targetNode,
      position.current,
    );
    position.current = entry;
    // Pre-transition keyboard/click intents are stale once the node changes.
    detachComponent(world, entity, "hasManualMoveIntent");
    const shouldContinueMotion =
      entity.hasAutoTraversePath ||
      (entity.usesAutocombat.auto && entity.usesAutocombat.autoTraverse);
    if (shouldContinueMotion) {
      setEntityMotion(world, entity, placement);
    } else {
      stopEntity(world, entity);
    }
    markSliceDirty(world, entity, "hasPosition");
    const oppositeDirection: NodeDirection =
      direction === "north"
        ? "south"
        : direction === "south"
          ? "north"
          : direction === "east"
            ? "west"
            : "east";
    transitionGateCooldown.set(entity.isPlayer.id, {
      nodeId: targetNodeId,
      direction: oppositeDirection,
      untilTick: world.tickCounter + TRANSITION_GATE_COOLDOWN_TICKS,
    });

    // Carry live summons into the new node at the player's entry point.
    relocateMinionsForOwner(world, entity);

    console.log(
      `[trans] ✓ ${entity.isPlayer.name} ${fromNodeId} → ${targetNodeId} via ${direction}  pos=(${Math.round(position.current.x)}, ${Math.round(position.current.y)})`,
    );
  }
}
