/**
 * Ability buff descriptors (system rework Step 7).
 *
 * Guard abilities that grant a lasting boon are EXPLICIT buffs — they show in the
 * buff bar with an icon + timer, like every other buff. One Guard slot ⇒ at most
 * one active guard buff, so a single `ability-guard` descriptor projects whichever
 * Guard ability is active (label/color pulled from the equipped ability def).
 */
import {
  ABILITY_GUARD_EFFECT_ID,
  ABILITY_SECOND_WIND_EFFECT_ID,
  abilityDef,
  getStatusEffect,
} from "@mmo-idle/shared";
import { defineBuff, type BuffDescriptor } from "../../combat/buffs/descriptor";

export const ABILITY_BUFFS = [
  defineBuff(
    "ability-guard",
    ({ player, playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, ABILITY_GUARD_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const totalMs = eff.data["totalMs"] ?? eff.remainingMs;
      const drPct = Math.round((eff.data["drPct"] ?? 0) * 100);
      const def = abilityDef(player.tracksProgression.equippedAbilities?.guard);
      return {
        id: "ability-guard",
        label: def?.name ?? "Guard",
        stacks: 1,
        durationPct:
          totalMs > 0 && eff.remainingMs > 0 ? (eff.remainingMs / totalMs) * 100 : -1,
        color: "#9ad0ff",
        logSourceName: "Ability",
        logSourceSide: "ally",
        logDetail: `-${drPct}% damage taken`,
      };
    },
    { category: "neutral", shape: "square", color: "#9ad0ff", label: "Guard" },
  ),
  defineBuff(
    "ability-second-wind",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, ABILITY_SECOND_WIND_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const totalMs = eff.data["totalMs"] ?? eff.remainingMs;
      const healPct = Math.round((eff.data["healPct"] ?? 0) * 100);
      return {
        id: "ability-second-wind",
        label: "Wind",
        stacks: 1,
        durationPct:
          totalMs > 0 && eff.remainingMs > 0 ? (eff.remainingMs / totalMs) * 100 : -1,
        color: "#73d7ff",
        logSourceName: "Second Wind",
        logSourceSide: "ally",
        logDetail: `heals ${healPct}% max HP`,
      };
    },
    {
      category: "neutral",
      shape: "circle",
      color: "#73d7ff",
      label: "Wind",
      iconKey: "second-wind",
    },
  ),
] as const satisfies readonly BuffDescriptor[];
