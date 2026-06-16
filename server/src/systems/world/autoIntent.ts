import { getFlag, NODE_BIOMES, type HasAutoIntent } from "@mmo-idle/shared";
import type { World } from "../../world/World";
import type { PlayerEntity } from "../../ecs/entity";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import {
  effectivePartyLeaderId,
  isEffectivePartyFollower,
} from "../player/party/partySystem";
import { isFleeing } from "../combat/ai/flee";
import { getAutoTargetId } from "../combat/ai/targetPriority";
import { RUNE_FOLLOW_LEADER_FLAG } from "../combat/ai/runeConfig";

/**
 * Stamp the networked {@link HasAutoIntent} telegraph onto every auto-combat
 * player so the client can render a thought bubble of their next action.
 *
 * Runs at the end of `World.tick` (after movement/targeting/combat have settled)
 * and derives intent from the durable post-tick state that actually governs the
 * player's behavior, in priority order: flee → follow → travel → attack → idle.
 *
 * Auto actions still telegraph with auto-combat OFF: server-driven map
 * navigation, and active combat (the player auto-attacks any mob in range
 * regardless of the toggle — "engaged with a mob"). The combat bubble clears
 * when the mob leaves range (i.e. the player manually disengages).
 *
 * Only writes when the resolved intent differs from the existing slice so the
 * delta broadcast isn't churned every tick.
 */
export function updateAutoIntent(world: World): void {
  for (const player of world.livePlayers) {
    const desired = resolveIntent(world, player);
    applyIntent(world, player, desired);
  }
}

function resolveIntent(
  world: World,
  player: PlayerEntity,
): HasAutoIntent | null {
  // Auto actions available with auto-combat off: server-driven map navigation
  // and active combat. The player auto-attacks any mob in range regardless of
  // the toggle, so an attack target means "engaged with a mob" — show it, and
  // let it clear naturally when they walk out of range (manual disengage).
  if (!player.usesAutocombat.auto) {
    return (
      attackIntent(world, player, player.hasAttackTarget?.targetId) ??
      travelIntent(player)
    );
  }

  if (isFleeing(player)) return { kind: "flee" };

  if (
    isEffectivePartyFollower(world, player) &&
    getFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG)
  ) {
    const leaderId = effectivePartyLeaderId(world, player);
    return leaderId ? { kind: "follow", leaderId } : { kind: "follow" };
  }

  const travel = travelIntent(player);
  if (travel) return travel;

  const attack = attackIntent(
    world,
    player,
    getAutoTargetId(player) ?? player.hasAttackTarget?.targetId,
  );
  if (attack) return attack;

  return { kind: "idle" };
}

/** Attack intent toward a monster target id in the player's node, if any. */
function attackIntent(
  world: World,
  player: PlayerEntity,
  targetId: string | undefined,
): HasAutoIntent | null {
  if (!targetId) return null;
  const monster = world.getMonsterEntity(targetId);
  if (!monster || monster.hasPosition.nodeId !== player.hasPosition.nodeId) {
    return null;
  }
  return { kind: "attack", targetMonsterTypeId: monster.isMonster.monsterTypeId };
}

/** Travel intent toward the destination of an active navigation path, if any. */
function travelIntent(player: PlayerEntity): HasAutoIntent | null {
  const traverse = player.hasAutoTraversePath;
  if (!traverse || traverse.targetNodeId === player.hasPosition.nodeId) {
    return null;
  }
  const destBiomeGroup = NODE_BIOMES[traverse.targetNodeId]?.biomeGroup;
  return destBiomeGroup ? { kind: "travel", destBiomeGroup } : null;
}

function applyIntent(
  world: World,
  player: PlayerEntity,
  desired: HasAutoIntent | null,
): void {
  if (!desired) {
    detachComponent(world, player, "hasAutoIntent");
    return;
  }
  if (sameIntent(player.hasAutoIntent, desired)) return;
  attachComponent(world, player, "hasAutoIntent", desired);
}

function sameIntent(
  a: HasAutoIntent | undefined,
  b: HasAutoIntent,
): boolean {
  return (
    a !== undefined &&
    a.kind === b.kind &&
    a.targetMonsterTypeId === b.targetMonsterTypeId &&
    a.leaderId === b.leaderId &&
    a.destBiomeGroup === b.destBiomeGroup
  );
}
