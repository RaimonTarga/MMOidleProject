import {
  deriveAutoConfigFromRunes,
  GAME_CONFIG,
  RUNE_NODE_ACQUIRE_RADIUS,
  setFlag,
  type RuneContext,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";

/** Server-only runtime flags read by the auto-combat systems. */
export const RUNE_FLEE_FLAG = "rune.flee";
export const RUNE_KEEP_DISTANCE_FLAG = "rune.keepDistance";
export const RUNE_WAIT_FOR_REGEN_FLAG = "rune.waitForRegen";
export const RUNE_WAIT_FOR_EXECUTION_FLAG = "rune.waitForExecution";
export const RUNE_FOLLOW_LEADER_FLAG = "rune.followLeader";
export const RUNE_LEAD_THE_WAY_FLAG = "rune.leadTheWay";
export const RUNE_TAUNT_CURRENT_TARGET_FLAG = "rune.tauntCurrentTarget";
export const RUNE_LET_DOTS_FINISH_FLAG = "rune.letDotsFinish";
export const RUNE_SPREAD_DOTS_FLAG = "rune.spreadDots";

/**
 * "In combat" for rune evaluation: an active attack target, or recent
 * engagement within the combat-regen grace window. Matches the predicate used
 * by `isReloadPlayerInCombat` in autoTarget.ts so the derivation and the
 * steering both agree on combat state.
 */
function isPlayerInCombat(player: PlayerEntity, now: number): boolean {
  if (player.hasAttackTarget !== undefined) return true;
  const last = player.tracksEngagement;
  return last !== undefined && now - last < GAME_CONFIG.COMBAT_REGEN_DELAY;
}

function aggroCount(world: World, player: PlayerEntity): number {
  let count = 0;
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === "player" &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Per-tick rune derivation. Runs at the START of `World.tick`, before the
 * party-follow / auto-traverse / auto-target systems, so they read freshly
 * derived values. Equipped rules are the sole driver of the auto-combat config:
 * the baseline + rune overrides are stamped onto `usesAutocombat` every tick,
 * overwriting any stale settings-tab values, and the flee / keep-distance flags
 * are written to the server-only combat-state bag.
 */
export function updateRuneDerivedConfig(world: World, now: number): void {
  for (const player of world.livePlayers) {
    const ctx: RuneContext = {
      hpPct:
        player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
      inCombat: isPlayerInCombat(player, now),
      inParty: player.inParty !== undefined,
      aggroCount: aggroCount(world, player),
      combatArchetype: player.usesSkills.combatArchetype,
    };

    const d = deriveAutoConfigFromRunes(
      player.tracksProgression.runesEquipped,
      ctx,
    );

    const ac = player.usesAutocombat;
    const acquireRadius = d.autoPathEnemy
      ? RUNE_NODE_ACQUIRE_RADIUS
      : d.config.acquireRadius;
    const changed =
      ac.priorityMode !== d.config.priorityMode ||
      ac.fleeWhenLow !== d.config.fleeWhenLow ||
      ac.fleeHpPct !== d.config.fleeHpPct ||
      ac.acquireRadius !== acquireRadius ||
      ac.focusLeaderTarget !== d.config.focusLeaderTarget ||
      ac.engageUltimateBosses !== d.config.engageUltimateBosses ||
      ac.autoTraverse !== false;

    if (changed) {
      ac.priorityMode = d.config.priorityMode;
      ac.fleeWhenLow = d.config.fleeWhenLow;
      ac.fleeHpPct = d.config.fleeHpPct;
      ac.acquireRadius = acquireRadius;
      ac.focusLeaderTarget = d.config.focusLeaderTarget;
      ac.engageUltimateBosses = d.config.engageUltimateBosses;
      ac.autoTraverse = false;
      markSliceDirty(world, player, "usesAutocombat");
    }

    setFlag(player.tracksCombat, RUNE_FLEE_FLAG, d.fleeRequested);
    setFlag(player.tracksCombat, RUNE_KEEP_DISTANCE_FLAG, d.orbit);
    setFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG, d.waitForRegen);
    setFlag(player.tracksCombat, RUNE_WAIT_FOR_EXECUTION_FLAG, d.waitForExecution);
    setFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG, d.followLeader);
    setFlag(player.tracksCombat, RUNE_LEAD_THE_WAY_FLAG, d.leadTheWay);
    setFlag(
      player.tracksCombat,
      RUNE_TAUNT_CURRENT_TARGET_FLAG,
      d.tauntCurrentTarget,
    );
    setFlag(player.tracksCombat, RUNE_LET_DOTS_FINISH_FLAG, d.letDotsFinish);
    setFlag(player.tracksCombat, RUNE_SPREAD_DOTS_FLAG, d.spreadDots);
  }
}
