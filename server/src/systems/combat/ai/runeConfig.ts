import {
  deriveAutoConfigFromRunes,
  getFlag,
  isHarmfulPlayerStatusEffect,
  MONSTER_DATABASE,
  RUNE_NODE_ACQUIRE_RADIUS,
  setFlag,
  setString,
  type RuneContext,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { playerDotAtMaxStacks } from "../damage/dotInventory";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { isMonsterThreatening } from "./guardableThreats";
import { isPlayerActivelyInCombat, isPlayerInCombat } from "./engagement";
import {
  telegraphsContainingPlayer,
  updateTelegraphEvasionLifecycle,
} from "./telegraphEvasion";
import { POWERING_UP_ID, poweringUpFullyCharged } from "../../player/stances/stanceBehaviors";

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
export const RUNE_CAREFUL_PULLING_FLAG = "rune.carefulPulling";
export const RUNE_AVOID_ENEMIES_FLAG = "rune.avoidEnemies";
export const RUNE_FIGHT_BACK_WHILE_TRAVELING_FLAG = "rune.fightBackWhileTraveling";
export const RUNE_EVADE_TELEGRAPH_FLAG = "rune.evadeTelegraph";
/** System rework Step 7: a fire-technique / fire-guard rule is active this tick. */
export const RUNE_FIRE_TECHNIQUE_FLAG = "rune.fireTechnique";
export const RUNE_FIRE_GUARD_FLAG = "rune.fireGuard";
/** Abilities evolution §7: the same, for the SECOND slot of each kind. */
export const RUNE_FIRE_TECHNIQUE_2_FLAG = "rune.fireTechnique2";
export const RUNE_FIRE_GUARD_2_FLAG = "rune.fireGuard2";
/** System rework Step 10: a switch-stance rule's condition is active this tick. */
export const RUNE_SWITCH_STANCE_FLAG = "rune.switchStance";
export const RUNE_STANCE_TARGET_KEY = "rune.stanceTarget";

/**
 * Count enemies aggroed onto this player and whether any is winding up a cast the
 * player is meant to ANSWER. Deliberately the shared guardable-threat query rather
 * than the charged-attack state alone: a boss mid `MonsterAbility` area-hit is
 * every bit the threat a Power Shot is, and utility casts stay excluded so Guard
 * is not spent on a self-buff.
 */
function aggroStats(
  world: World,
  player: PlayerEntity,
  now: number,
): { count: number; charging: boolean } {
  let count = 0;
  let charging = false;
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === "player" &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      count++;
      if (!charging && isMonsterThreatening(world, monster, now)) charging = true;
    }
  }
  return { count, charging };
}

/** Whether the player's current attack target is an elite (or a boss). */
function isEliteTarget(world: World, targetId: string | undefined): boolean {
  if (!targetId) return false;
  const monster = world.getMonsterEntity(targetId);
  if (!monster) return false;
  if (monster.isMonster.isBoss) return true;
  return MONSTER_DATABASE.get(monster.isMonster.monsterTypeId)?.elite === true;
}

/**
 * Per-tick rune derivation. Runs at the START of `World.tick`, before the
 * party-follow / auto-traverse / auto-target systems, so they read freshly
 * derived values. Equipped rules are the sole driver of the auto-combat config:
 * the baseline + rune overrides are stamped onto `usesAutocombat` every tick,
 * overwriting any stale settings-tab values, and the flee / keep-distance flags
 * are written to the server-only combat-state bag.
 */
export function updateRuneDerivedConfig(world: World, now = Date.now()): void {
  for (const player of world.livePlayers) {
    const { count: currentAggroCount, charging: enemyCharging } = aggroStats(
      world,
      player,
      now,
    );
    const attackTargetId = player.hasAttackTarget?.targetId;
    const attackTarget = attackTargetId ? world.getMonsterEntity(attackTargetId) : undefined;
    const dangerousTelegraphs = telegraphsContainingPlayer(world, player, now);
    const ctx: RuneContext = {
      hpPct:
        player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
      targetHpPct: attackTarget
        ? attackTarget.hasHealth.hp / Math.max(1, attackTarget.hasHealth.maxHp)
        : undefined,
      inCombat: currentAggroCount > 0 || isPlayerInCombat(player, now),
      activelyEngaged: isPlayerActivelyInCombat(world, player),
      inParty: player.inParty !== undefined,
      aggroCount: currentAggroCount,
      combatArchetype: player.usesSkills.combatArchetype,
      debuffed: player.tracksCombat.statusEffects.some(
        (e) => e.stacks > 0 && isHarmfulPlayerStatusEffect(e.id, e.data),
      ),
      enemyCharging,
      insideDangerousTelegraph: dangerousTelegraphs.length > 0,
      // The shared empowered-attack flag is armed → the next attack is empowered.
      // Set by each class when its finisher/execution/discharge becomes ready
      // (cadence/cooldown/energy); absent for classes with no empowered attack.
      empoweredImminent: player.hasEmpoweredAttack !== undefined,
      // Only a charging posture ever sets this; every other stance leaves it false,
      // so a `Stance Charged` rule built without one simply never fires.
      stanceCharged:
        player.tracksProgression.activeStance === POWERING_UP_ID &&
        poweringUpFullyCharged(player.tracksCombat),
      // Elite-ness is a property of the monster DEFINITION, same source the
      // `focus-elites` targeting bonus reads.
      targetIsElite: isEliteTarget(world, attackTargetId),
      // Measured through the DoT inventory rather than by reading any one
      // effect id, so a future T4 damage-over-time path drives `target-max-stacks`
      // the moment it registers a family. Weapon reservoirs are excluded there,
      // not here.
      targetAtMaxDotStacks: attackTarget
        ? playerDotAtMaxStacks(world, player, attackTarget)
        : false,
      traveling:
        player.hasAutoTraversePath !== undefined &&
        player.hasAutoTraversePath.targetNodeId !== player.hasPosition.nodeId &&
        player.hasAutoTraversePath.remainingPath.length > 0,
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
      ac.engageUltimateBosses !== d.config.engageUltimateBosses;

    if (changed) {
      ac.priorityMode = d.config.priorityMode;
      ac.fleeWhenLow = d.config.fleeWhenLow;
      ac.fleeHpPct = d.config.fleeHpPct;
      ac.acquireRadius = acquireRadius;
      ac.focusLeaderTarget = d.config.focusLeaderTarget;
      ac.engageUltimateBosses = d.config.engageUltimateBosses;
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
    // Note: "Always -> Recover First" reaches this point with the combat timer
    // still running. It is `deriveAutoConfigFromRunes` that keeps the hold from
    // outranking a live fight — the rule only claims the recovery channel while
    // `activelyEngaged` is false, so anything aggroing onto the player releases
    // it and the player fights back instead of standing still while being hit.
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
    setFlag(player.tracksCombat, RUNE_CAREFUL_PULLING_FLAG, d.carefulPulling);
    setFlag(player.tracksCombat, RUNE_AVOID_ENEMIES_FLAG, d.avoidEnemies);
    setFlag(
      player.tracksCombat,
      RUNE_FIGHT_BACK_WHILE_TRAVELING_FLAG,
      d.fightBackWhileTraveling,
    );
    const stepBackOwnsMovement = updateTelegraphEvasionLifecycle(
      world,
      player,
      now,
      d.evadeTelegraph ? dangerousTelegraphs : [],
      {
        autoEnabled: player.usesAutocombat.auto,
        manualOverride: player.hasManualMoveIntent !== undefined,
        fleePriority: player.isFleeing !== undefined || d.fleeRequested,
        stepBackEquipped: player.tracksProgression.runesEquipped.some(
          (rule) => rule.actionId === "step-back",
        ),
      },
    );
    setFlag(player.tracksCombat, RUNE_EVADE_TELEGRAPH_FLAG, stepBackOwnsMovement);
    setFlag(player.tracksCombat, RUNE_FIRE_TECHNIQUE_FLAG, d.fireTechnique);
    setFlag(player.tracksCombat, RUNE_FIRE_TECHNIQUE_2_FLAG, d.fireTechnique2);
    setFlag(player.tracksCombat, RUNE_FIRE_GUARD_FLAG, d.fireGuard);
    setFlag(player.tracksCombat, RUNE_FIRE_GUARD_2_FLAG, d.fireGuard2);
    setFlag(player.tracksCombat, RUNE_SWITCH_STANCE_FLAG, d.switchStance);
    setString(player.tracksCombat, RUNE_STANCE_TARGET_KEY, d.stanceTargetId ?? "");
  }
}
