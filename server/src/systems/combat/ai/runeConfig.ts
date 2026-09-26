import { updateHeatManagement, heatManagementState, heatEngagementTargets, recordHeatDecision } from "./heatManagement";
import {
  deriveAutoConfigFromRunes,
  getFlag,
  isWaitOutCandidate,
  isHarmfulPlayerStatusEffect,
  AMBIENT_RAMP_KEY,
  MONSTER_DATABASE,
  RUNE_NODE_ACQUIRE_RADIUS,
  posHitboxFromEntity,
  reachGap,
  setFlag,
  setString,
  type RuneContext,
  type RuneTraceRule,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { MonsterEntity, PlayerEntity } from "../../../ecs/entity";
import { playerDotAtMaxStacks } from "../damage/dotInventory";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { isMonsterThreatening } from "./guardableThreats";
import { isPlayerActivelyInCombat, isPlayerInCombat } from "./engagement";
import {
  telegraphsContainingPlayer,
  updateTelegraphEvasionLifecycle,
} from "./telegraphEvasion";
import { POWERING_UP_ID, poweringUpFullyCharged } from "../../player/stances/stanceBehaviors";
import { isPlayerControlled } from "../status/playerHardControl";

/** Server-only runtime flags read by the auto-combat systems. */
export const RUNE_FLEE_FLAG = "rune.flee";
export const RUNE_KEEP_DISTANCE_FLAG = "rune.keepDistance";
export const RUNE_WAIT_FOR_REGEN_FLAG = "rune.waitForRegen";
export const RUNE_WAIT_FOR_SUMMONS_FLAG = "rune.waitForSummons";
export const RUNE_WAIT_IT_OUT_FLAG = "rune.waitItOut";
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
/** Abilities evolution §7: the same, for the SECOND slot of each kind. */
/** System rework Step 10: a switch-stance rule's condition is active this tick. */
export const RUNE_SWITCH_STANCE_FLAG = "rune.switchStance";
export const RUNE_STANCE_TARGET_KEY = "rune.stanceTarget";

// Presentation consumes the exact fold result, never a second evaluation after combat.
// Weak ownership keeps this tick-local data out of persistence and releases departed players.
const abilityDecisions = new WeakMap<PlayerEntity, string[]>();
export function getAbilityRuneTargets(player: PlayerEntity): readonly string[] { return abilityDecisions.get(player) ?? []; }

const runeDecisions = new WeakMap<PlayerEntity, RuneTraceRule[]>();
export function getRuneDecisions(player: PlayerEntity): RuneTraceRule[] {
  return runeDecisions.get(player) ?? [];
}

/** Harmful effects that will actually make progress while the player waits. */
export function playerHasWaitOutStatus(world: World, player: PlayerEntity): boolean {
  return player.tracksCombat.statusEffects.some((effect) => {
    if (!isWaitOutCandidate(effect)) return false;
    if ((effect.data[AMBIENT_RAMP_KEY] ?? 0) === 0) return true;

    // Ambient ramps are normally permanent-duration statuses whose generic owner
    // decays them out of combat. A live encounter override can impose a floor;
    // wait only down to that floor so the rune can never softlock there.
    const floor = Math.max(
      0,
      world.ambientRampOverrides.get(player.hasPosition.nodeId)?.minStacks ?? 0,
    );
    return effect.stacks > floor;
  });
}

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
): { count: number; charging: boolean; contact: boolean } {
  let count = 0;
  let charging = false;
  let contact = false;
  const playerBox = posHitboxFromEntity(player);
  for (const monster of world.aggroedMonsters) {
    if (
      monster.hasAggroTarget.targetKind === "player" &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      count++;
      if (!charging && isMonsterThreatening(world, monster, now)) charging = true;
      if (!contact) contact = inMeleeContact(player, playerBox, monster);
    }
  }
  return { count, charging, contact };
}

/**
 * Melee monsters reach at most 72px and ranged ones at least 180px, so anything
 * reaching further than this is a shooter, not something "in contact".
 */
const MELEE_CONTACT_MAX_REACH = 100;
/** Slack over the monster's own reach, so contact reads a step before the swing. */
const MELEE_CONTACT_SLACK_PX = 10;

/** A live melee enemy in the player's node is within its own reach of them. */
function inMeleeContact(
  player: PlayerEntity,
  playerBox: ReturnType<typeof posHitboxFromEntity>,
  monster: MonsterEntity,
): boolean {
  const reach = monster.performsAttack?.attackRange;
  if (reach === undefined || reach > MELEE_CONTACT_MAX_REACH) return false;
  if (monster.hasHealth.hp <= 0 || monster.hasPosition.nodeId !== player.hasPosition.nodeId) return false;
  return reachGap(playerBox, posHitboxFromEntity(monster)) <= reach + MELEE_CONTACT_SLACK_PX;
}

/**
 * A living owned summon in the owner's node targets a live monster there, or is
 * targeted by one. Summon aggro never counts toward the owner's `aggroCount`:
 * summons taking hits is not pressure on the player's body.
 */
function summonsInCombat(world: World, player: PlayerEntity): boolean {
  const ids = player.summonsMinions?.minionIds;
  if (!ids?.length) return false;
  const nodeId = player.hasPosition.nodeId;
  const living = new Set<string>();
  for (const id of ids) {
    const minion = world.getMinionEntity(id);
    if (!minion || minion.isMinion.ownerPlayerId !== player.isPlayer.id
      || minion.hasHealth.hp <= 0 || minion.hasPosition.nodeId !== nodeId) continue;
    living.add(id);
    const targetId = minion.hasAttackTarget?.targetId;
    const target = targetId ? world.getMonsterEntity(targetId) : undefined;
    if (target && target.hasHealth.hp > 0 && target.hasPosition.nodeId === nodeId) return true;
  }
  for (const monster of world.aggroedMonsters) {
    if (monster.hasAggroTarget.targetKind === "minion" && living.has(monster.hasAggroTarget.targetId)
      && monster.hasHealth.hp > 0 && monster.hasPosition.nodeId === nodeId) return true;
  }
  return false;
}

/** Summoner with at most half of its target summon count alive in its node. */
function formationBroken(world: World, player: PlayerEntity): boolean {
  const summons = player.summonsMinions;
  if (!summons || summons.targetCount <= 0) return false;
  const nodeId = player.hasPosition.nodeId;
  let living = 0;
  for (const id of summons.minionIds) {
    const minion = world.getMinionEntity(id);
    if (minion && minion.isMinion.ownerPlayerId === player.isPlayer.id
      && minion.hasHealth.hp > 0 && minion.hasPosition.nodeId === nodeId) living++;
  }
  return living * 2 <= summons.targetCount;
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
  for (const player of world.playerEntities) updateHeatManagement(world, player);
  for (const player of world.livePlayers) {
    const { count: currentAggroCount, charging: enemyCharging, contact: enemyInContact } = aggroStats(
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
      inCombat: currentAggroCount > 0 || isPlayerInCombat(player, now) ||
        (heatManagementState(player) === "requested" && heatEngagementTargets(world, player).size > 0),
      activelyEngaged: isPlayerActivelyInCombat(world, player) ||
        (heatManagementState(player) === "requested" && heatEngagementTargets(world, player).size > 0),
      summonsInCombat: summonsInCombat(world, player),
      formationBroken: formationBroken(world, player),
      inParty: player.inParty !== undefined,
      aggroCount: currentAggroCount,
      combatArchetype: player.usesSkills.combatArchetype,
      debuffed: player.tracksCombat.statusEffects.some(
        (e) => e.stacks > 0 && isHarmfulPlayerStatusEffect(e.id, e.data),
      ),
      controlled: isPlayerControlled(player),
      enemyInContact,
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

    setString(player.tracksCombat, "rune.heatManagement", heatManagementState(player));
    const ac = player.usesAutocombat;
    runeDecisions.set(player, [
      ...Object.entries(d.claimed).flatMap(([channel, claim]) =>
        channel !== "OOC_MAINTENANCE" && claim ? [{ ...claim.rule }] : []
      ),
      ...d.oocMaintenanceClaims.map((claim) => ({ ...claim.rule })),
      ...d.abilityRules,
    ]);
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
    setFlag(
      player.tracksCombat,
      RUNE_WAIT_IT_OUT_FLAG,
      heatManagementState(player) === "waiting" ||
        (d.waitItOut && d.oocMaintenanceClaims.some(c => c.action.id === "wait-it-out" && c.rule.waitOutMode !== "heat-managed") && playerHasWaitOutStatus(world, player)),
    );
    const summons = player.summonsMinions;
    let missingSummon = false;
    let summonsEngaged = false;
    if (d.waitForSummons && summons) {
      for (let slot = 0; slot < summons.targetCount; slot++) {
        const minion = world.getMinionEntity(summons.minionIds[slot] ?? "");
        if (!minion || minion.hasHealth.hp <= 0) {
          missingSummon = true;
          continue;
        }
        const targetId = minion.hasAttackTarget?.targetId;
        const target = targetId ? world.getMonsterEntity(targetId) : undefined;
        if (target && target.hasHealth.hp > 0 && target.hasPosition.nodeId === player.hasPosition.nodeId) {
          summonsEngaged = true;
        }
      }
      // Conduit fights through its bodies: an enemy attacking a surviving
      // summon must also interrupt the hold, even if the owner has no target.
      if (missingSummon && !summonsEngaged) {
        for (const monster of world.aggroedMonsters) {
          if (monster.hasAggroTarget.targetKind === "minion" &&
            summons.minionIds.includes(monster.hasAggroTarget.targetId) &&
            monster.hasHealth.hp > 0 && monster.hasPosition.nodeId === player.hasPosition.nodeId) {
            summonsEngaged = true;
            break;
          }
        }
      }
    }
    setFlag(player.tracksCombat, RUNE_WAIT_FOR_SUMMONS_FLAG, d.waitForSummons && missingSummon && !summonsEngaged);
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
    recordHeatDecision(world, player, now, getFlag(player.tracksCombat, RUNE_WAIT_IT_OUT_FLAG), getFlag(player.tracksCombat, RUNE_WAIT_FOR_REGEN_FLAG));
    abilityDecisions.set(player, d.abilityTargets);
    setFlag(player.tracksCombat, RUNE_SWITCH_STANCE_FLAG, d.switchStance);
    setString(player.tracksCombat, RUNE_STANCE_TARGET_KEY, d.stanceTargetId ?? "");
  }
}
