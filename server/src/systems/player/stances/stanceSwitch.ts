import { pushDamageEvent } from '../../combat/damage/damageEvent';
import {
  BERSERKER_SELF_DAMAGE_INTERVAL_MS,
  BERSERKER_SELF_DAMAGE_PCT,
  EXECUTE_BONUS,
  EXECUTE_HP_THRESHOLD,
  NO_STANCE_ID,
  PREDATOR_OPENER_BONUS,
  brawlerDamageReduction,
  getCooldown,
  getCounter,
  getFlag,
  getString,
  setCooldown,
  setCounter,
  setFlag,
  setString,
  stanceDamageTakenMult,
  stanceDef,
  stanceGateMet,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import { recalculatePlayerStanceStats } from "../../../ecs/playerEntityFormulas";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { RUNE_STANCE_TARGET_KEY, RUNE_SWITCH_STANCE_FLAG } from "../../combat/ai/runeConfig";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { playerCombatPhase } from "../../combat/ai/engagement";
import {
  POWERING_UP_ID,
  initNewStanceBehaviors,
  releasePoweringUpCharge,
  tickPoweringUpCharge,
} from "./stanceBehaviors";

const STANCE_SWITCH_CD_KEY = "stance.switch.cd";
const PREDATOR_OPENER_FLAG = "stance.predator.opener";
const BERSERKER_TICK_ACC = "stance.berserker.tick";
/** Last observed state of the active stance's HP gate, so a crossing recalcs once. */
const STANCE_GATE_MET_FLAG = "stance.gate.met";
const STANCE_LAST_ACTIVE_KEY = "stance.lastActive";
export const STANCE_SWITCH_COOLDOWN_MS = 1500;

export function updateStanceSwitch(world: World, dt: number, now: number): void {
  for (const player of world.livePlayers) {
    const prog = player.tracksProgression;
    if (getString(player.tracksCombat, STANCE_LAST_ACTIVE_KEY) === undefined) {
      setString(player.tracksCombat, STANCE_LAST_ACTIVE_KEY, prog.activeStance ?? "none");
      setCooldown(player.tracksCombat, STANCE_SWITCH_CD_KEY, STANCE_SWITCH_COOLDOWN_MS);
    }
    const ruleTarget = getString(player.tracksCombat, RUNE_STANCE_TARGET_KEY);
    const legalTarget = ruleTarget && (ruleTarget === NO_STANCE_ID || (prog.knownStances ?? []).includes(ruleTarget))
      ? ruleTarget
      : null;
    const desired = getFlag(player.tracksCombat, RUNE_SWITCH_STANCE_FLAG) && legalTarget
      ? (legalTarget === NO_STANCE_ID ? null : legalTarget)
      : (prog.equippedStances?.default ?? null);

    let switched = false;
    if (desired !== prog.activeStance && getCooldown(player.tracksCombat, STANCE_SWITCH_CD_KEY) <= 0) {
      switched = true;
      // Leaving Powering Up ALWAYS spends its charge, however it was left. Done
      // before `activeStance` moves, because the release reads the stance we are
      // leaving, not the one we are entering.
      if (prog.activeStance === POWERING_UP_ID) releasePoweringUpCharge(player);
      prog.activeStance = desired;
      recalculatePlayerStanceStats(world, player);
      setCooldown(player.tracksCombat, STANCE_SWITCH_CD_KEY, STANCE_SWITCH_COOLDOWN_MS);
      setString(player.tracksCombat, STANCE_LAST_ACTIVE_KEY, desired ?? "none");
      markSliceDirty(world, player, "tracksProgression");
      world.pushEvent(player.hasPosition.nodeId, {
        kind: "stance-switch",
        playerId: player.isPlayer.id,
        stanceId: desired,
      });
    }

    // A gated posture (Perfection) turns its upside half on and off as the player crosses
    // an HP threshold, and those modifiers live in the stat rebuild — so the crossing has
    // to trigger one. Edge-triggered off a stored flag: recalculating every tick would
    // throw away rampage/cadence state ten times a second for no reason.
    //
    // The rebuild preserves HP PERCENTAGE and no stance touches maxHp, so the fraction is
    // identical on both sides of the recalc. The gate cannot oscillate.
    const gateMet = stanceGateMet(
      stanceDef(prog.activeStance),
      player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
    );
    if (switched) {
      // The switch already rebuilt stats from the current HP, so only the record updates.
      setFlag(player.tracksCombat, STANCE_GATE_MET_FLAG, gateMet);
    } else if (getFlag(player.tracksCombat, STANCE_GATE_MET_FLAG) !== gateMet) {
      recalculatePlayerStanceStats(world, player);
      // After the rebuild: it restores the combat-state snapshot it took on entry.
      setFlag(player.tracksCombat, STANCE_GATE_MET_FLAG, gateMet);
    }

    const combatPhase = playerCombatPhase(world, player, now);

    // Powering Up charges only while actually fighting, and loses the charge when
    // combat ends — never free preparation between pulls. Ticked after the switch so
    // a stance entered this tick starts charging immediately.
    if (prog.activeStance === POWERING_UP_ID) {
      tickPoweringUpCharge(player.tracksCombat, dt, combatPhase !== "OUT_OF_COMBAT");
    }

    if (prog.activeStance === "predator-stance" && combatPhase === "OUT_OF_COMBAT") {
      setFlag(player.tracksCombat, PREDATOR_OPENER_FLAG, true);
    }

    if (prog.activeStance !== "berserker-stance" || combatPhase === "OUT_OF_COMBAT") {
      setCounter(player.tracksCombat, BERSERKER_TICK_ACC, 0);
      continue;
    }
    let accumulator = getCounter(player.tracksCombat, BERSERKER_TICK_ACC) + dt;
    while (accumulator >= BERSERKER_SELF_DAMAGE_INTERVAL_MS && player.hasHealth.hp > 0) {
      accumulator -= BERSERKER_SELF_DAMAGE_INTERVAL_MS;
      const damage = Math.max(1, Math.round(player.hasHealth.maxHp * BERSERKER_SELF_DAMAGE_PCT));
      player.hasHealth.hp -= damage;
      pushDamageEvent(world, player, damage);
      markSliceDirty(world, player, "hasHealth");
      if (player.hasHealth.hp <= 0) {
        world.killPlayer(player.isPlayer.id, {
          kind: "stance",
          stanceName: "Berserker Stance",
          damage,
        });
      }
    }
    setCounter(player.tracksCombat, BERSERKER_TICK_ACC, accumulator);
  }
}

export function initStanceCombatEffects(): void {
  initNewStanceBehaviors();

  registerCombatListener("onHit", (ctx) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;
    const player = ctx.attacker;
    const stanceId = player.tracksProgression.activeStance;
    if (stanceId === "predator-stance" && getFlag(player.tracksCombat, PREDATOR_OPENER_FLAG)) {
      ctx.damage = Math.round(ctx.damage * (1 + PREDATOR_OPENER_BONUS));
      setFlag(player.tracksCombat, PREDATOR_OPENER_FLAG, false);
    }
    if (
      stanceId === "execute-stance" &&
      ctx.defender.hasHealth.hp / Math.max(1, ctx.defender.hasHealth.maxHp) <= EXECUTE_HP_THRESHOLD
    ) {
      ctx.damage = Math.round(ctx.damage * (1 + EXECUTE_BONUS));
    }
  });

  // Incoming-damage posture. Both clauses are MULTIPLICATIVE layers on the already
  // mitigated hit rather than contributions to `mitigatesDamage.damageReduction`:
  // that pool clamps to [0, 0.9], which silently swallowed every stance's "you take
  // more damage" drawback for any character without gear DR, and let the "less
  // damage" side compound into the shared cap alongside gear and class DR.
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.defenderType !== "player") return;
    const player = ctx.defender;
    const stanceId = player.tracksProgression.activeStance;
    if (!stanceId) return;

    let mult = stanceDamageTakenMult(
      stanceId,
      player.hasHealth.hp / Math.max(1, player.hasHealth.maxHp),
    );

    if (stanceId === "brawler-stance") {
      let attackers = 0;
      for (const monster of world.aggroedMonsters) {
        if (
          monster.hasAggroTarget.targetKind === "player" &&
          monster.hasAggroTarget.targetId === player.isPlayer.id
        ) attackers++;
      }
      mult *= 1 - brawlerDamageReduction(attackers);
    }

    if (mult === 1) return;
    // Floored at 1 while the hit was doing anything at all, so a heavy defensive
    // posture reads as a glancing hit rather than as immunity.
    ctx.damage = Math.max(ctx.damage > 0 ? 1 : 0, Math.round(ctx.damage * mult));
  });
}
