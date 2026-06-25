import {
  deriveAutoConfigFromRunes,
  getFlag,
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
export const RUNE_TACTICAL_RELOAD_FLAG = "rune.tacticalReload";
export const RUNE_FOLLOW_LEADER_FLAG = "rune.followLeader";
export const RUNE_LEAD_THE_WAY_FLAG = "rune.leadTheWay";
export const RUNE_TAUNT_CURRENT_TARGET_FLAG = "rune.tauntCurrentTarget";
export const RUNE_LET_DOTS_FINISH_FLAG = "rune.letDotsFinish";
export const RUNE_SPREAD_DOTS_FLAG = "rune.spreadDots";
export const RUNE_FOCUS_ELITES_FLAG = "rune.focusElites";
export const RUNE_AVOID_NODE_HAZARDS_FLAG = "rune.avoidNodeHazards";
/** System rework Step 7: a fire-technique / fire-guard rule is active this tick. */
export const RUNE_FIRE_TECHNIQUE_FLAG = "rune.fireTechnique";
export const RUNE_FIRE_GUARD_FLAG = "rune.fireGuard";
/** System rework Step 10: a switch-stance rule's condition is active this tick. */
export const RUNE_SWITCH_STANCE_FLAG = "rune.switchStance";

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
export function updateRuneDerivedConfig(world: World): void {
  for (const player of world.livePlayers) {
    const currentAggroCount = aggroCount(world, player);
    const attackTargetId = player.hasAttackTarget?.targetId;
    const ctx: RuneContext = {
      hpPct:
        player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
      // Rune "in combat" means an active fight, not the post-fight regen
      // cooldown. Recovery actions can therefore stop scouting immediately
      // while HP regeneration itself still observes COMBAT_REGEN_DELAY.
      inCombat:
        (attackTargetId !== undefined && world.hasMonster(attackTargetId)) ||
        currentAggroCount > 0,
      inParty: player.inParty !== undefined,
      aggroCount: currentAggroCount,
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
    // "Recover First" latches to full HP. A threshold condition such as
    // hp-below-25 stops being active the moment HP climbs back over 25%, but the
    // rule should keep the player resting until full once recovery has started.
    // Keep the flag set while out of combat, still below max HP, and the rule
    // remains equipped — so "HP Below 25% -> Recover First" tops off instead of
    // bailing at 26%. ("Out of Combat -> Recover First" already stays active
    // out of combat, so this is a no-op for it.)
    const belowFullHp = player.hasHealth.hp < player.hasHealth.maxHp;
    const recoveringLatched =
      getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG) &&
      belowFullHp &&
      !ctx.inCombat &&
      player.tracksProgression.runesEquipped.some(
        (rule) => rule.actionId === "wait-for-regen",
      );
    setFlag(
      player.tracksCombat,
      RUNE_WAIT_FOR_REGEN_FLAG,
      (d.waitForRegen || recoveringLatched) && belowFullHp,
    );
    setFlag(player.tracksCombat, RUNE_WAIT_FOR_EXECUTION_FLAG, d.waitForExecution);
    setFlag(player.tracksCombat, RUNE_TACTICAL_RELOAD_FLAG, d.tacticalReload);
    setFlag(player.tracksCombat, RUNE_FOLLOW_LEADER_FLAG, d.followLeader);
    setFlag(player.tracksCombat, RUNE_LEAD_THE_WAY_FLAG, d.leadTheWay);
    setFlag(
      player.tracksCombat,
      RUNE_TAUNT_CURRENT_TARGET_FLAG,
      d.tauntCurrentTarget,
    );
    setFlag(player.tracksCombat, RUNE_LET_DOTS_FINISH_FLAG, d.letDotsFinish);
    setFlag(player.tracksCombat, RUNE_SPREAD_DOTS_FLAG, d.spreadDots);
    setFlag(player.tracksCombat, RUNE_FOCUS_ELITES_FLAG, d.focusElites);
    setFlag(player.tracksCombat, RUNE_AVOID_NODE_HAZARDS_FLAG, d.avoidHazards);
    setFlag(player.tracksCombat, RUNE_FIRE_TECHNIQUE_FLAG, d.fireTechnique);
    setFlag(player.tracksCombat, RUNE_FIRE_GUARD_FLAG, d.fireGuard);
    setFlag(player.tracksCombat, RUNE_SWITCH_STANCE_FLAG, d.switchStance);
  }
}
