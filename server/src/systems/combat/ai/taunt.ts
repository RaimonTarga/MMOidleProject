import {
  getCooldown,
  getFlag,
  setCooldown,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../engine/combatPipeline";
import { setAggroTarget } from "./targeting";
import { monsterIgnoresTaunts } from "./monsterTargeting";
import { RUNE_TAUNT_CURRENT_TARGET_FLAG } from "./runeConfig";

const TAUNT_COOLDOWN_KEY = "rune.tauntCurrentTarget.cd";
export const RUNE_TAUNT_COOLDOWN_MS = 4000;

export function initRuneTauntSystem(): void {
  registerCombatListener("afterHit", (ctx, world) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") {
      return;
    }

    const player = ctx.attacker;
    const monster = ctx.defender;
    const aggroSource = ctx.metadata.aggroSource;
    if (
      !aggroSource ||
      typeof aggroSource !== "object" ||
      !("kind" in aggroSource) ||
      !("id" in aggroSource) ||
      (aggroSource.kind !== "player" && aggroSource.kind !== "minion")
    ) {
      return;
    }
    if (!getFlag(player.tracksCombat, RUNE_TAUNT_CURRENT_TARGET_FLAG)) return;
    if (monster.hasHealth.hp <= 0) return;
    if (monsterIgnoresTaunts(monster)) return;
    // A Conduit's formation is "you": the striking summon draws the enemy, and
    // an enemy already on any of this owner's summons is left where it is.
    const aggro = monster.hasAggroTarget;
    if (aggro?.targetKind === "player" && aggroSource.kind === "player"
      && aggro.targetId === player.isPlayer.id) {
      return;
    }
    if (aggro?.targetKind === "minion" && aggroSource.kind === "minion"
      && world.getMinionEntity(aggro.targetId)?.isMinion.ownerPlayerId === player.isPlayer.id) {
      return;
    }
    if (getCooldown(player.tracksCombat, TAUNT_COOLDOWN_KEY) > 0) return;

    setAggroTarget(
      world,
      monster,
      { id: String(aggroSource.id), kind: aggroSource.kind },
      Date.now(),
    );
    setCooldown(player.tracksCombat, TAUNT_COOLDOWN_KEY, RUNE_TAUNT_COOLDOWN_MS);
  });
}
