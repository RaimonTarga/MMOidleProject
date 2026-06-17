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
      aggroSource.kind !== "player"
    ) {
      return;
    }
    if (!getFlag(player.tracksCombat, RUNE_TAUNT_CURRENT_TARGET_FLAG)) return;
    if (monster.hasHealth.hp <= 0) return;
    if (monsterIgnoresTaunts(monster)) return;
    if (
      monster.hasAggroTarget?.targetKind === "player" &&
      monster.hasAggroTarget.targetId === player.isPlayer.id
    ) {
      return;
    }
    if (getCooldown(player.tracksCombat, TAUNT_COOLDOWN_KEY) > 0) return;

    setAggroTarget(
      world,
      monster,
      { id: player.isPlayer.id, kind: "player" },
      Date.now(),
    );
    setCooldown(player.tracksCombat, TAUNT_COOLDOWN_KEY, RUNE_TAUNT_COOLDOWN_MS);
  });
}
