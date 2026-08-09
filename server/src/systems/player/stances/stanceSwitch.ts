import {
  NO_STANCE_ID,
  getCooldown,
  getCounter,
  getFlag,
  getString,
  setCooldown,
  setCounter,
  setFlag,
  setString,
} from "@mmo-idle/shared";
import type { World } from "../../../world/World";
import { recalculatePlayerStanceStats } from "../../../ecs/playerEntityFormulas";
import { markSliceDirty } from "../../../ecs/dirtyHelpers";
import { RUNE_STANCE_TARGET_KEY, RUNE_SWITCH_STANCE_FLAG } from "../../combat/ai/runeConfig";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { playerCombatPhase } from "../../combat/ai/engagement";

const STANCE_SWITCH_CD_KEY = "stance.switch.cd";
const PREDATOR_OPENER_FLAG = "stance.predator.opener";
const BERSERKER_TICK_ACC = "stance.berserker.tick";
const STANCE_LAST_ACTIVE_KEY = "stance.lastActive";
export const STANCE_SWITCH_COOLDOWN_MS = 1500;
const BERSERKER_TICK_MS = 1000;
const BERSERKER_HP_DAMAGE_PCT = 0.02;

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

    if (desired !== prog.activeStance && getCooldown(player.tracksCombat, STANCE_SWITCH_CD_KEY) <= 0) {
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

    const combatPhase = playerCombatPhase(world, player, now);
    if (prog.activeStance === "predator-stance" && combatPhase === "OUT_OF_COMBAT") {
      setFlag(player.tracksCombat, PREDATOR_OPENER_FLAG, true);
    }

    if (prog.activeStance !== "berserker-stance" || combatPhase === "OUT_OF_COMBAT") {
      setCounter(player.tracksCombat, BERSERKER_TICK_ACC, 0);
      continue;
    }
    let accumulator = getCounter(player.tracksCombat, BERSERKER_TICK_ACC) + dt;
    while (accumulator >= BERSERKER_TICK_MS && player.hasHealth.hp > 0) {
      accumulator -= BERSERKER_TICK_MS;
      const damage = Math.max(1, Math.round(player.hasHealth.maxHp * BERSERKER_HP_DAMAGE_PCT));
      player.hasHealth.hp -= damage;
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
  registerCombatListener("onHit", (ctx) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;
    const player = ctx.attacker;
    if (player.tracksProgression.activeStance === "predator-stance" && getFlag(player.tracksCombat, PREDATOR_OPENER_FLAG)) {
      ctx.damage = Math.round(ctx.damage * 1.75);
      setFlag(player.tracksCombat, PREDATOR_OPENER_FLAG, false);
    }
    if (
      player.tracksProgression.activeStance === "execute-stance" &&
      ctx.defender.hasHealth.hp / Math.max(1, ctx.defender.hasHealth.maxHp) <= 0.25
    ) {
      ctx.damage = Math.round(ctx.damage * 1.75);
    }
  });

  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.defenderType !== "player" || ctx.defender.tracksProgression.activeStance !== "brawler-stance") return;
    let attackers = 0;
    for (const monster of world.aggroedMonsters) {
      if (monster.hasAggroTarget.targetKind === "player" && monster.hasAggroTarget.targetId === ctx.defender.isPlayer.id) attackers++;
    }
    const reduction = Math.min(0.4, 0.1 * Math.log2(1 + attackers));
    ctx.damage = Math.max(0, Math.round(ctx.damage * (1 - reduction)));
  });
}
