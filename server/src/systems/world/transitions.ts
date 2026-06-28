import type { World } from "../../world/World";
import type { PlayerEntity } from "../../ecs/entity";
import type { NodeDirection } from "@mmo-idle/shared";
import {
  exitNodeIdForGate,
  pointFromMotion,
  type MotionVector,
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
/**
 * Dirty hotfix (pending the netcode rework): how far from an edge a server-driven
 * crossing is forced. Server travel (nav / auto-traverse / party follow / flee)
 * steers toward a goal placed *past* the edge; once the mover is within this
 * distance of that edge we force the transition outright instead of waiting for it
 * to thread the narrow EXIT_TRIGGER band — which is what bricks around corners.
 * Generous on purpose ("overkill"): drive the character through.
 */
const TRANSITION_DRIVE_IN = EXIT_TRIGGER * 2;
/**
 * Resting offset from the edge after a crossing. MUST clear the EXIT_TRIGGER gate
 * band: the gate trigger rect is inclusive up to EXIT_TRIGGER, so a player parked
 * exactly on it (path complete, idle party follower) sits inside the trigger and
 * gets yanked back through the gate the moment the re-cross cooldown lapses —
 * producing the cross-node oscillation. Keep this strictly greater than
 * EXIT_TRIGGER, mirroring the EXIT_TRIGGER+1 rest position the old gate-strip
 * system used (and the ENTRANCE_SPAWN_INSET convention in nodePath.ts).
 */
const ENTRY_INSET = EXIT_TRIGGER + 10;
/** Deeper target travelers steer toward so momentum carries them off the edge. */
const PLACEMENT_INSET = EXIT_TRIGGER + 30;

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

/**
 * Resting entry point on the opposite edge, already clear of the gate trigger
 * band so a player who stops immediately after the crossing does not re-fire it.
 */
function transitionEntryPosition(
  direction: NodeDirection,
  node: { width: number; height: number },
  lateral: Vec2,
): Vec2 {
  const y = Math.max(0, Math.min(lateral.y, node.height));
  const x = Math.max(0, Math.min(lateral.x, node.width));
  switch (direction) {
    case "west":
      return { x: node.width - ENTRY_INSET, y };
    case "east":
      return { x: ENTRY_INSET, y };
    case "north":
      return { x, y: node.height - ENTRY_INSET };
    case "south":
      return { x, y: ENTRY_INSET };
  }
}
const TRANSITION_GATE_COOLDOWN_TICKS = 6;

const transitionGateCooldown = new Map<
  string,
  { nodeId: string; direction: NodeDirection; untilTick: number }
>();

/**
 * Margin (px) a manual move target is held inside each node edge. Wider than the
 * EXIT_TRIGGER gate band so a click that lands near a border stops just short of
 * the band instead of walking the player into it and accidentally crossing.
 */
const INTERIOR_MOVE_MARGIN = EXIT_TRIGGER + 10;

/**
 * Clamp a manual move target to the player's node, intent-aware so navigating
 * close to a border does not accidentally cross zones.
 *
 * A target beyond an edge means the player is steering toward the neighbor
 * (a neighbor-region click, or keyboard held into the edge): clamp it only to the
 * node rect so the gate band stays reachable and the crossing fires. A target
 * already inside the node is held clear of the gate bands, so clicking near a
 * border stops short instead of crossing into the next zone. Deliberate
 * server-driven crossings (navigate/auto-traverse/follow/flee) bypass this — they
 * steer past the border directly via gateApproachTarget.
 */
export function clampMoveTargetToNode(nodeId: string, target: Vec2): Vec2 {
  const node = NODE_REGISTRY.get(nodeId);
  if (!node) return target;
  return {
    x: clampMoveAxis(target.x, node.width),
    y: clampMoveAxis(target.y, node.height),
  };
}

function clampMoveAxis(value: number, dim: number): number {
  // Past the edge → cross intent: clamp only to the band-reachable node rect.
  if (value <= 0) return 0;
  if (value >= dim) return dim;
  // Inside the node → keep the goal out of the gate bands.
  return Math.max(INTERIOR_MOVE_MARGIN, Math.min(dim - INTERIOR_MOVE_MARGIN, value));
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
 * True when the player's motion actually carries them outward through `direction`
 * — the dominant motion axis points across that border. A player merely grazing a
 * gate band while travelling parallel to it (e.g. hugging an edge toward a
 * perpendicular gate) is not crossing and must not trigger a transition. Pairs
 * with the nav grid keeping waypoints out of the bands: this is the invariant that
 * guarantees a transition reflects intent even if a path ever skirts an edge.
 */
function motionExitsThroughBorder(
  motion: MotionVector | undefined,
  direction: NodeDirection,
): boolean {
  if (!motion || motion.magnitude <= 0) return false;
  const { x: dx, y: dy } = motion.direction;
  switch (direction) {
    case "west":
      return dx < 0 && Math.abs(dx) >= Math.abs(dy);
    case "east":
      return dx > 0 && Math.abs(dx) >= Math.abs(dy);
    case "north":
      return dy < 0 && Math.abs(dy) >= Math.abs(dx);
    case "south":
      return dy > 0 && Math.abs(dy) >= Math.abs(dx);
  }
}

/**
 * After movement is applied, check each player against the boundary of their
 * current node. A transition fires when the player reaches an edge that has an
 * exit to an adjacent node. Edges without an exit clamp the player in-place.
 */
/**
 * Direction a server-driven crossing should be forced in, or null. Server travel
 * steers toward a goal placed past one edge (gateApproachTarget keeps the lateral
 * in-bounds), so an out-of-bounds goal axis is an active crossing in that
 * direction. We force it once the mover is within {@link TRANSITION_DRIVE_IN} of
 * that edge, bypassing the band/priority detection that bricks around corners.
 * Manual movement and mob chasing aim at in-bounds goals, so they return null and
 * fall through to the normal position-based logic.
 */
function forcedCrossDirection(
  entity: PlayerEntity,
  node: { width: number; height: number },
): NodeDirection | null {
  const goal = entity.hasMovePath?.goal;
  if (!goal) return null;
  const pos = entity.hasPosition.current;
  if (goal.x < 0 && pos.x <= TRANSITION_DRIVE_IN) return "west";
  if (goal.x > node.width && pos.x >= node.width - TRANSITION_DRIVE_IN) return "east";
  if (goal.y < 0 && pos.y <= TRANSITION_DRIVE_IN) return "north";
  if (goal.y > node.height && pos.y >= node.height - TRANSITION_DRIVE_IN) return "south";
  return null;
}

function isOnReentryCooldown(
  world: World,
  entity: PlayerEntity,
  nodeId: string,
  direction: NodeDirection,
): boolean {
  const cooldown = transitionGateCooldown.get(entity.isPlayer.id);
  if (!cooldown) return false;
  if (cooldown.nodeId === nodeId && cooldown.direction === direction) {
    return world.tickCounter <= cooldown.untilTick;
  }
  if (world.tickCounter > cooldown.untilTick) {
    transitionGateCooldown.delete(entity.isPlayer.id);
  }
  return false;
}

/** Move the player into `targetNodeId` across `direction` and settle them clear of
 *  the entry band. Shared by the forced drive-through and the normal trigger. */
function performCrossing(
  world: World,
  entity: PlayerEntity,
  direction: NodeDirection,
  targetNodeId: string,
): void {
  const position = entity.hasPosition;
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

  // Enter just past the opposite gate band (clear of the trigger); travelers
  // then steer deeper inward for momentum, others rest here without re-firing.
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

}

export function updateTransitions(world: World): void {
  for (const entity of world.livePlayers) {
    const position = entity.hasPosition;
    const node = NODE_REGISTRY.get(position.nodeId);
    if (!node) continue;

    // Overkill hotfix: force the crossing as soon as server-driven travel is
    // driving into its target edge, before the finicky band detection can brick.
    const forced = forcedCrossDirection(entity, node);
    if (forced && !isOnReentryCooldown(world, entity, position.nodeId, forced)) {
      const forcedTarget = resolveExit(position.nodeId, forced);
      if (forcedTarget) {
        performCrossing(world, entity, forced, forcedTarget);
        continue;
      }
    }

    const W = node.width;
    const H = node.height;
    const current = position.current;

    const direction = world.collision.gateDirectionAt(current, position.nodeId);
    if (!direction) continue;

    if (isOnReentryCooldown(world, entity, position.nodeId, direction)) continue;

    const targetNodeId = resolveExit(position.nodeId, direction);

    if (!targetNodeId || !motionExitsThroughBorder(entity.isMoving?.motion, direction)) {
      // Sealed border, or the player is only grazing the band while moving along
      // it (not crossing) — clamp them back inside so the transition can't misfire.
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

    performCrossing(world, entity, direction, targetNodeId);
  }
}
