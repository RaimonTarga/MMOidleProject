import type { NodeDirection } from "@mmo-idle/shared";
import { distanceSq } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import { attachComponent, detachComponent } from "../../../ecs/markerHelpers";
import type { World } from "../../../world/World";
import { NODE_REGISTRY } from "../../../world/nodeRegistry";
import {
  directionFromTo,
  findShortestNodePath,
  gateTargetForDirection,
} from "../../../world/nodePath";
import { setEntityMotion, stopEntity } from "../../world/movement";
import { setAttackTarget } from "./targeting";

const GATE_ORDER: NodeDirection[] = ["north", "south", "west", "east"];
const FULL_HP_EPSILON = 0.01;

export function isFleeing(player: PlayerEntity): boolean {
  return player.isFleeing !== undefined;
}

/**
 * Enter the flee state.
 *
 * Flee is intentionally a presence component rather than a boolean flag in
 * `usesAutocombat`: while present it owns the player's motion and suppresses
 * auto-traverse / target chasing. The state remembers the node we fled from so
 * recovery can return and re-engage instead of abandoning the objective.
 */
export function beginFlee(world: World, player: PlayerEntity): void {
  if (player.isFleeing) return;
  attachComponent(world, player, "isFleeing", {
    phase: "out",
    returnNodeId: player.hasPosition.nodeId,
  });
  detachComponent(world, player, "hasAutoTraversePath");
  setAttackTarget(world, player, null);
}

/**
 * Advance the flee state machine by one auto-target tick.
 *
 * out     -> walk to the nearest open gate; `updateTransitions` performs the
 *            actual node switch later in the tick.
 * recover -> wait in the adjacent node until healed. Party leaders also wait
 *            until every currently-present party member is healed.
 * return  -> path back to `returnNodeId`, then detach the marker so normal
 *            target scoring resumes and can re-engage.
 */
export function stepFlee(world: World, player: PlayerEntity): void {
  const state = player.isFleeing;
  if (!state) return;

  setAttackTarget(world, player, null);

  switch (state.phase) {
    case "out": {
      if (player.hasPosition.nodeId !== state.returnNodeId) {
        attachComponent(world, player, "isFleeing", {
          ...state,
          phase: "recover",
        });
        stopEntity(world, player);
        return;
      }

      const gate = nearestGateTarget(player);
      if (!gate) {
        attachComponent(world, player, "isFleeing", {
          ...state,
          phase: "recover",
        });
        stopEntity(world, player);
        return;
      }
      setEntityMotion(world, player, gate);
      return;
    }

    case "recover": {
      stopEntity(world, player);
      if (!isRecoveryComplete(world, player)) return;
      attachComponent(world, player, "isFleeing", {
        ...state,
        phase: "return",
      });
      return;
    }

    case "return": {
      if (player.hasPosition.nodeId === state.returnNodeId) {
        detachComponent(world, player, "isFleeing");
        return;
      }

      const path = findShortestNodePath(player.hasPosition.nodeId, state.returnNodeId);
      const nextHop = path && path.length >= 2 ? path[1] : null;
      const dir = nextHop ? directionFromTo(player.hasPosition.nodeId, nextHop) : null;
      if (!dir) {
        detachComponent(world, player, "isFleeing");
        stopEntity(world, player);
        return;
      }

      setEntityMotion(
        world,
        player,
        gateTargetForDirection(player.hasPosition.nodeId, dir),
      );
      return;
    }
  }
}

function nearestGateTarget(player: PlayerEntity) {
  const node = NODE_REGISTRY.get(player.hasPosition.nodeId);
  if (!node) return null;

  let bestDir: NodeDirection | null = null;
  let bestDist = Infinity;
  for (const dir of GATE_ORDER) {
    if (!node.exits[dir]) continue;
    const gate = gateTargetForDirection(player.hasPosition.nodeId, dir);
    const d = distanceSq(player.hasPosition.current, gate);
    if (d < bestDist) {
      bestDist = d;
      bestDir = dir;
    }
  }
  return bestDir ? gateTargetForDirection(player.hasPosition.nodeId, bestDir) : null;
}

function isRecoveryComplete(world: World, player: PlayerEntity): boolean {
  if (!isFullHp(player)) return false;
  if (player.inParty?.leaderId !== player.isPlayer.id) return true;

  for (const member of world.playerEntities) {
    if (member.inParty?.leaderId !== player.isPlayer.id) continue;
    if (!isFullHp(member)) return false;
  }
  return true;
}

function isFullHp(player: PlayerEntity): boolean {
  return player.hasHealth.hp >= player.hasHealth.maxHp - FULL_HP_EPSILON;
}
