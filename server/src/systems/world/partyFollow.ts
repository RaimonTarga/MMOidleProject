import type { World } from "../../world/World";
import { setEntityMotion, stopEntity } from "./movement";
import {
  directionFromTo,
  findShortestNodePath,
  gateTargetForDirection,
} from "../../world/nodePath";
import { steerTowardTarget } from "../combat/ai/autoTarget";
import { isFleeing } from "../combat/ai/flee";
import { getFlag } from "@mmo-idle/shared";
import { RUNE_FOLLOW_LEADER_FLAG } from "../combat/ai/runeConfig";
import { effectivePartyLeaderId } from "../player/party/partySystem";

/** How close a follower trails an idle leader before holding position (px). */
const PARTY_FOLLOW_DISTANCE = 90;
const PARTY_FOLLOW_DISTANCE_SQ = PARTY_FOLLOW_DISTANCE * PARTY_FOLLOW_DISTANCE;

/**
 * Steer party followers in auto-combat: they trail the leader, assist against the
 * leader's current target, and chase the leader across zone boundaries. Runs before
 * `updateAutoTraverse` / `updateAutoTargets`, which skip followers so this owns their
 * movement. Followers only react while their own auto-combat is enabled.
 */
export function updatePartyFollow(world: World, now: number): void {
  for (const player of world.livePlayers) {
    if (!player.usesAutocombat.auto) continue;
    if (isFleeing(player)) continue;
    if (player.hasManualMoveIntent) continue;

    if (!player.inParty) continue;

    const leaderId = effectivePartyLeaderId(world, player);
    if (!leaderId || leaderId === player.isPlayer.id) continue; // not a follower

    const leader = world.getPlayerEntity(leaderId);
    if (!leader) continue;
    if (!getFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG)) continue;

    const playerNode = player.hasPosition.nodeId;
    const leaderNode = leader.hasPosition.nodeId;

    // Leader is in another zone — path toward the gate that heads their way.
    if (leaderNode !== playerNode) {
      const path = findShortestNodePath(playerNode, leaderNode);
      if (path && path.length >= 2) {
        const dir = directionFromTo(playerNode, path[1]);
        if (dir) {
          setEntityMotion(
            world,
            player,
            gateTargetForDirection(playerNode, dir),
          );
          continue;
        }
      }
      stopEntity(world, player);
      continue;
    }

    // Same zone: assist against whatever the leader is attacking.
    // Summoner followers stay back — minions fight; they only trail the leader.
    const leaderTargetId = leader.hasAttackTarget?.targetId;
    if (
      leaderTargetId &&
      player.usesAutocombat.focusLeaderTarget &&
      player.usesSkills.combatArchetype !== "summoner"
    ) {
      const monster = world.getMonsterEntity(leaderTargetId);
      if (monster && monster.hasPosition.nodeId === playerNode) {
        steerTowardTarget(world, player, monster, now);
        continue;
      }
    }

    // Leader idle: trail them, stopping once close enough to avoid stacking.
    const dx = leader.hasPosition.current.x - player.hasPosition.current.x;
    const dy = leader.hasPosition.current.y - player.hasPosition.current.y;
    if (dx * dx + dy * dy > PARTY_FOLLOW_DISTANCE_SQ) {
      setEntityMotion(world, player, leader.hasPosition.current);
    } else {
      stopEntity(world, player);
    }
  }
}
