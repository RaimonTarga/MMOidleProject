/**
 * Ability buff descriptors (system rework Step 7).
 *
 * Guard abilities that grant a lasting boon are EXPLICIT buffs — they show in the
 * buff bar with an icon + timer, like every other buff. One descriptor per GUARD
 * SLOT: two equipped Guards layer independently, and each tile labels itself from
 * the ability occupying its own slot.
 */
import {
  ABILITY_GUARD_EFFECT_IDS,
  ABILITY_SECOND_WIND_EFFECT_ID,
  abilityDef,
  getStatusEffect,
} from "@mmo-idle/shared";
import { defineBuff, type BuffDescriptor } from "../../combat/buffs/descriptor";
import { BRAMBLE_EFFECT_ID } from "./abilityBramble";

/** One DR-buff descriptor per Guard slot, reading that slot's effect id. */
const GUARD_SLOT_BUFFS = ABILITY_GUARD_EFFECT_IDS.map((effectId, slotIndex) =>
  defineBuff(
    effectId,
    ({ player, playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, effectId);
      if (!eff || eff.remainingMs <= 0) return null;
      const totalMs = eff.data["totalMs"] ?? eff.remainingMs;
      const drPct = Math.round((eff.data["drPct"] ?? 0) * 100);
      const def = abilityDef(
        player.tracksProgression.equippedAbilities?.guards?.[slotIndex],
      );
      return {
        id: effectId,
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
);

export const ABILITY_BUFFS = [
  ...GUARD_SLOT_BUFFS,
  defineBuff(
    "ability-bramble",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, BRAMBLE_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const totalMs = eff.data["totalMs"] ?? eff.remainingMs;
      const plating = Math.round(eff.data["platingBonus"] ?? 0);
      const reflect = Math.round(eff.data["reflectFlat"] ?? 0);
      return {
        id: "ability-bramble",
        label: "Bramble",
        stacks: 1,
        durationPct:
          totalMs > 0 && eff.remainingMs > 0 ? (eff.remainingMs / totalMs) * 100 : -1,
        color: "#8fd48b",
        logSourceName: "Bramble Guard",
        logSourceSide: "ally",
        logDetail: `+${plating} plating, ${reflect} thorns`,
      };
    },
    { category: "neutral", shape: "square", color: "#8fd48b", label: "Bramble" },
  ),
  defineBuff(
    "ability-second-wind",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, ABILITY_SECOND_WIND_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const totalMs = eff.data["totalMs"] ?? eff.remainingMs;
      // Post-potency fraction of the player's Recovery RATE, not a % of max HP —
      // what this converts to in HP depends on their Recovery stat.
      const recoveryPct = Math.round((eff.data["recoveryPct"] ?? 0) * 100);
      return {
        id: "ability-second-wind",
        label: "Wind",
        stacks: 1,
        durationPct:
          totalMs > 0 && eff.remainingMs > 0 ? (eff.remainingMs / totalMs) * 100 : -1,
        color: "#73d7ff",
        logSourceName: "Second Wind",
        logSourceSide: "ally",
        logDetail: `+${recoveryPct}% Recovery`,
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
