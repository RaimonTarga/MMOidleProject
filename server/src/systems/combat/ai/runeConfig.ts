import { updateHeatManagement, heatManagementState, recordHeatDecision } from "./heatManagement";
import {
  deriveAutoConfigFromRunes,
  getFlag,
  isWaitOutCandidate,
  AMBIENT_RAMP_KEY,
  RUNE_NODE_ACQUIRE_RADIUS,
  setFlag,
  setString,
  type RuneContext,
  type RuneTraceRule,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import type { PlayerEntity } from "../../../ecs/entity";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { updateTelegraphEvasionLifecycle } from "./telegraphEvasion";
import { updatePlayerMoments } from "../moments/moments";

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
export const RUNE_RECALL_SUMMONS_FLAG = "rune.recallSummons";
export const RUNE_LET_DOTS_FINISH_FLAG = "rune.letDotsFinish";
export const RUNE_SPREAD_DOTS_FLAG = "rune.spreadDots";
export const RUNE_FOCUS_ELITES_FLAG = "rune.focusElites";
export const RUNE_AVOID_NODE_HAZARDS_FLAG = "rune.avoidNodeHazards";
export const RUNE_CAREFUL_PULLING_FLAG = "rune.carefulPulling";
export const RUNE_AVOID_ENEMIES_FLAG = "rune.avoidEnemies";
export const RUNE_FIGHT_BACK_WHILE_TRAVELING_FLAG = "rune.fightBackWhileTraveling";
export const RUNE_EVADE_TELEGRAPH_FLAG = "rune.evadeTelegraph";

// Presentation consumes the exact fold result, never a second evaluation after combat.
// Weak ownership keeps this tick-local data out of persistence and releases departed players.
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
    // The fight's facts, measured once per tick for the rules here and for every class
    // system (the moments registry, class-first build plan F6).
    const fight = updatePlayerMoments(world, player, now);
    const dangerousTelegraphs = fight.telegraphs;
    const ctx: RuneContext = {
      hpPct: fight.hpPct,
      targetHpPct: fight.targetHpPct,
      inCombat: fight.inCombat,
      activelyEngaged: fight.activelyEngaged,
      formationBroken: fight.formationBroken,
      inParty: fight.inParty,
      aggroCount: fight.aggroCount,
      combatArchetype: player.usesSkills.combatArchetype,
      debuffed: fight.debuffed,
      controlled: fight.controlled,
      enemyInContact: fight.enemyInContact,
      enemyCharging: fight.enemyCharging,
      insideDangerousTelegraph: dangerousTelegraphs.length > 0,
      empoweredImminent: fight.empoweredImminent,
      targetIsElite: fight.targetIsElite,
      targetAtMaxDotStacks: fight.targetAtMaxDotStacks,
      targetShielded: fight.targetShielded,
      targetEscaping: fight.targetEscaping,
      debuffCount: fight.debuffCount,
      traveling: fight.traveling,
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
    ]);
    const acquireRadius = d.autoPathEnemy
      ? RUNE_NODE_ACQUIRE_RADIUS
      : d.config.acquireRadius;
    const changed =
      ac.priorityMode !== d.config.priorityMode ||
      ac.fleeWhenLow !== d.config.fleeWhenLow ||
      ac.fleeHpPct !== d.config.fleeHpPct ||
      ac.acquireRadius !== acquireRadius ||
      ac.focusLeaderTarget !== d.config.focusLeaderTarget;

    if (changed) {
      ac.priorityMode = d.config.priorityMode;
      ac.fleeWhenLow = d.config.fleeWhenLow;
      ac.fleeHpPct = d.config.fleeHpPct;
      ac.acquireRadius = acquireRadius;
      ac.focusLeaderTarget = d.config.focusLeaderTarget;
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
    // Call the rune recall out once, as it starts, like the R recall.
    if (d.recallSummons && player.usesAutocombat.auto && !getFlag(player.tracksCombat, RUNE_RECALL_SUMMONS_FLAG)) {
      world.pushEvent(player.hasPosition.nodeId, { kind: 'summons-recalled', playerId: player.isPlayer.id });
    }
    setFlag(
      player.tracksCombat,
      RUNE_RECALL_SUMMONS_FLAG,
      d.recallSummons,
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
  }
}
