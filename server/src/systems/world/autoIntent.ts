import {
  ACTION_DATABASE,
  getFlag,
  getRuleName,
  NODE_BIOMES,
  type HasAutoIntent,
  type RuneActionId,
} from "@mmo-idle/shared";
import type { World } from "../../world/World";
import type { PlayerEntity } from "../../ecs/entity";
import { attachComponent, detachComponent } from "../../ecs/markerHelpers";
import {
  effectivePartyLeaderId,
  isEffectivePartyFollower,
} from "../player/party/partySystem";
import { isFleeing } from "../combat/ai/flee";
import { getAutoTargetId } from "../combat/ai/targetPriority";
import {
  RUNE_FOCUS_ELITES_FLAG,
  RUNE_FOLLOW_LEADER_FLAG,
  RUNE_LET_DOTS_FINISH_FLAG,
  RUNE_SPREAD_DOTS_FLAG,
  RUNE_TACTICAL_RELOAD_FLAG,
  RUNE_EVADE_TELEGRAPH_FLAG,
  RUNE_KEEP_DISTANCE_FLAG,
  RUNE_WAIT_FOR_EXECUTION_FLAG,
  RUNE_WAIT_FOR_REGEN_FLAG,
} from "../combat/ai/runeConfig";

/**
 * Stamp the networked {@link HasAutoIntent} telegraph onto every live player
 * whose current behavior is server-directed.
 *
 * Runs at the end of `World.tick` (after movement/targeting/combat have settled)
 * and derives intent from the durable post-tick state that actually governs the
 * player's behavior, in priority order: flee → follow → travel → maintenance →
 * attack → idle.
 *
 * Auto actions can still telegraph with auto-combat off: server-driven map
 * navigation, and active combat (the player auto-attacks any mob in range
 * regardless of the toggle — "engaged with a mob"). The combat intent clears
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
  if (!player.usesAutocombat.auto && !player.fightsWhileTraveling) {
    return (
      attackIntent(world, player, player.hasAttackTarget?.targetId, false) ??
      travelIntent(player, false)
    );
  }

  if (isFleeing(player)) {
    const reason =
      player.isFleeing?.phase === "recover"
        ? "Recovering before returning"
        : player.isFleeing?.phase === "return"
          ? "Returning to the fight"
          : "Retreating to safety";
    return {
      kind: "flee",
      reason,
      source: ruleLabel(player, "flee"),
      activeRune: runeTrace(player, "flee"),
      travelPaused: player.fightsWhileTraveling !== undefined,
    };
  }

  if (getFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG)) {
    const overridden = getFlag(player.tracksCombat, RUNE_KEEP_DISTANCE_FLAG)
      ? runeTrace(player, "orbit")
      : runeTrace(player, "chase-enemy");
    return {
      kind: "idle",
      reason: "Stepping out of an incoming attack",
      source: ruleLabel(player, "step-back"),
      activeRune: runeTrace(player, "step-back"),
      ...(overridden ? { overriddenRune: overridden } : {}),
      travelPaused: player.fightsWhileTraveling !== undefined,
    };
  }

  if (
    isEffectivePartyFollower(world, player) &&
    getFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG)
  ) {
    return {
      kind: "follow",
      leaderId: effectivePartyLeaderId(world, player) ?? undefined,
      reason: "Staying with the party leader",
      source: ruleLabel(player, "follow-and-assist"),
      activeRune: runeTrace(player, "follow-and-assist"),
    };
  }

  // A retained travel path is not the current owner while Fight Back is
  // resolving the interruption; expose the combat Rune first and annotate it
  // as a paused route.
  if (player.fightsWhileTraveling) {
    const interruptedAttack = attackIntent(
      world,
      player,
      getAutoTargetId(player) ?? player.hasAttackTarget?.targetId,
      true,
    );
    if (interruptedAttack) {
      return { ...interruptedAttack, travelPaused: true };
    }
  }

  const travel = travelIntent(player, true);
  if (travel) return travel;

  const maintenance = maintenanceIntent(player);
  if (maintenance) return maintenance;

  const attack = attackIntent(
    world,
    player,
    getAutoTargetId(player) ?? player.hasAttackTarget?.targetId,
    true,
  );
  if (attack) return attack;

  return {
    kind: "idle",
    reason: "No worthy target nearby",
    source: "",
  };
}

/** Attack intent toward a monster target id in the player's node, if any. */
function attackIntent(
  world: World,
  player: PlayerEntity,
  targetId: string | undefined,
  automated: boolean,
): HasAutoIntent | null {
  if (!targetId) return null;
  const monster = world.getMonsterEntity(targetId);
  if (!monster || monster.hasPosition.nodeId !== player.hasPosition.nodeId) {
    return null;
  }
  const explanation = automated
    ? attackExplanation(player)
    : {
        reason: "Locked in battle",
        source: "",
      };
  return {
    kind: "attack",
    targetMonsterTypeId: monster.isMonster.monsterTypeId,
    ...explanation,
  };
}

/** Travel intent toward the destination of an active navigation path, if any. */
function travelIntent(
  player: PlayerEntity,
  automated: boolean,
): HasAutoIntent | null {
  const traverse = player.hasAutoTraversePath;
  if (!traverse || traverse.targetNodeId === player.hasPosition.nodeId) {
    return null;
  }
  const destBiomeGroup = NODE_BIOMES[traverse.targetNodeId]?.biomeGroup;
  return destBiomeGroup
    ? {
        kind: "travel",
        destBiomeGroup,
        reason: automated
          ? "Following the hunt's path"
          : "Following your chosen path",
        source: getFlag(player.tracksCombat, "rune.avoidEnemies")
          ? ruleLabel(player, "avoid-enemies")
          : ruleLabel(player, "fight-back"),
        activeRune: getFlag(player.tracksCombat, "rune.avoidEnemies")
          ? runeTrace(player, "avoid-enemies")
          : runeTrace(player, "fight-back"),
        travelPaused: player.fightsWhileTraveling !== undefined,
      }
    : null;
}

function maintenanceIntent(player: PlayerEntity): HasAutoIntent | null {
  if (
    getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG) &&
    player.hasAttackTarget === undefined &&
    player.hasHealth.hp < player.hasHealth.maxHp
  ) {
    return {
      kind: "idle",
      reason: "Waiting to recover to full health",
      source: ruleLabel(player, "wait-for-regen"),
      activeRune: runeTrace(player, "wait-for-regen"),
    };
  }
  if (
    getFlag(player.tracksCombat, RUNE_WAIT_FOR_EXECUTION_FLAG) &&
    player.hasAttackTarget === undefined &&
    player.usesCooldown !== undefined &&
    player.hasEmpoweredAttack === undefined
  ) {
    return {
      kind: "idle",
      reason: "Waiting for execution to recharge",
      source: ruleLabel(player, "wait-for-execution"),
      activeRune: runeTrace(player, "wait-for-execution"),
    };
  }
  if (
    getFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG) &&
    player.hasAttackTarget === undefined &&
    player.usesReload !== undefined &&
    player.usesReload.reloadingMs > 0
  ) {
    return {
      kind: "idle",
      reason: "Waiting for reload to finish",
      source: ruleLabel(player, "tactical-reload"),
      activeRune: runeTrace(player, "tactical-reload"),
    };
  }
  return null;
}

function attackExplanation(
  player: PlayerEntity,
): Pick<HasAutoIntent, "reason" | "source" | "activeRune"> {
  if (getFlag(player.tracksCombat, RUNE_FOCUS_ELITES_FLAG)) {
    return {
      reason: "Elite target priority",
      source: ruleLabel(player, "focus-elites"),
      activeRune: runeTrace(player, "focus-elites"),
    };
  }
  if (getFlag(player.tracksCombat, RUNE_SPREAD_DOTS_FLAG)) {
    return {
      reason: "Spreading damage-over-time effects",
      source: ruleLabel(player, "spread-dots"),
      activeRune: runeTrace(player, "spread-dots"),
    };
  }
  if (getFlag(player.tracksCombat, RUNE_LET_DOTS_FINISH_FLAG)) {
    return {
      reason: "Avoiding damage-over-time overkill",
      source: ruleLabel(player, "let-dots-finish"),
      activeRune: runeTrace(player, "let-dots-finish"),
    };
  }

  switch (player.usesAutocombat.priorityMode) {
    case "lowest-hp":
      return {
        reason: "Lowest-health eligible target",
        source: ruleLabel(player, "focus-lowest-hp"),
        activeRune: runeTrace(player, "focus-lowest-hp"),
      };
    case "highest-max-hp":
      return {
        reason: "Largest eligible health pool",
        source: ruleLabel(player, "focus-highest-max-hp"),
        activeRune: runeTrace(player, "focus-highest-max-hp"),
      };
    case "damage":
      return { reason: "Best opening for damage", source: "" };
    case "threat":
      return { reason: "Most dangerous foe", source: "" };
    case "balanced":
      return { reason: "Best all-around target", source: "" };
    case "nearest":
    default:
      return {
        reason: "Nearest eligible target",
        source: ruleLabel(player, "focus-closest"),
        activeRune: getFlag(player.tracksCombat, RUNE_KEEP_DISTANCE_FLAG)
          ? runeTrace(player, "orbit")
          : runeTrace(player, "chase-enemy") ?? runeTrace(player, "focus-closest"),
      };
  }
}

function ruleLabel(
  player: PlayerEntity,
  actionId: RuneActionId,
): string {
  const rule = player.tracksProgression.runesEquipped.find(
    (entry) => entry.actionId === actionId,
  );
  if (!rule) return "";
  return (
    getRuleName(rule.conditionId, rule.actionId)?.name ??
    ACTION_DATABASE.get(actionId)?.name ??
    ""
  );
}

function runeTrace(
  player: PlayerEntity,
  actionId: RuneActionId,
) {
  const rule = player.tracksProgression.runesEquipped.find(
    (entry) => entry.actionId === actionId,
  );
  return rule
    ? { conditionId: rule.conditionId, actionId: rule.actionId }
    : undefined;
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
    a.reason === b.reason &&
    a.source === b.source &&
    a.targetMonsterTypeId === b.targetMonsterTypeId &&
    a.leaderId === b.leaderId &&
    a.destBiomeGroup === b.destBiomeGroup
    && a.activeRune?.conditionId === b.activeRune?.conditionId
    && a.activeRune?.actionId === b.activeRune?.actionId
    && a.overrideRune?.conditionId === b.overrideRune?.conditionId
    && a.overrideRune?.actionId === b.overrideRune?.actionId
    && a.overriddenRune?.conditionId === b.overriddenRune?.conditionId
    && a.overriddenRune?.actionId === b.overriddenRune?.actionId
    && a.travelPaused === b.travelPaused
  );
}
