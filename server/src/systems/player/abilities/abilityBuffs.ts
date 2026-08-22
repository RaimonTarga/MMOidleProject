/**
 * Ability buff descriptors.
 *
 * Ability boons that last are EXPLICIT buffs — they show in the buff bar with an
 * icon + timer, like every other buff, rather than hiding as raw state. Where an
 * effect can belong to either Guard slot there is one descriptor PER SLOT: two
 * equipped Guards layer independently, and each tile labels itself from the
 * ability occupying its own slot. Status-effect `data` is numbers-only, so the
 * owning slot cannot live in effect data — it has to be in the id.
 */
import {
  ABILITY_CONTROL_RESIST_EFFECT_ID,
  ABILITY_FRENZY_EFFECT_ID,
  ABILITY_GUARD_EFFECT_IDS,
  ABILITY_RECOVERY_EFFECT_IDS,
  abilityDef,
  getStatusEffect,
} from "@mmo-idle/shared";
import { defineBuff, type BuffDescriptor } from "../../combat/buffs/descriptor";
import { BRAMBLE_EFFECT_ID } from "./abilityBramble";

/** Clock fraction for a timed effect, or -1 when it has no authored total. */
function durationPct(remainingMs: number, totalMs: number): number {
  return totalMs > 0 && remainingMs > 0 ? (remainingMs / totalMs) * 100 : -1;
}

/** One DR-buff descriptor per Guard slot, reading that slot's effect id. */
const GUARD_SLOT_BUFFS = ABILITY_GUARD_EFFECT_IDS.map((effectId, slotIndex) =>
  defineBuff(
    effectId,
    ({ player, playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, effectId);
      if (!eff || eff.remainingMs <= 0) return null;
      const drPct = Math.round((eff.data["drPct"] ?? 0) * 100);
      const def = abilityDef(
        player.tracksProgression.equippedAbilities?.guards?.[slotIndex],
      );
      return {
        id: effectId,
        label: def?.name ?? "Guard",
        stacks: 1,
        durationPct: durationPct(eff.remainingMs, eff.data["totalMs"] ?? eff.remainingMs),
        color: "#9ad0ff",
        logSourceName: "Ability",
        logSourceSide: "ally",
        logDetail: `-${drPct}% damage taken`,
      };
    },
    { category: "neutral", shape: "square", color: "#9ad0ff", label: "Guard" },
  ),
);

/**
 * One Recovery-skill descriptor per Guard slot. Second Wind (strong/short) and
 * Recuperate (weak/long) are opposite shapes of the same access and may be held
 * together, so they need independent windows and independent tiles.
 */
const RECOVERY_SLOT_BUFFS = ABILITY_RECOVERY_EFFECT_IDS.map((effectId, slotIndex) =>
  defineBuff(
    effectId,
    ({ player, playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, effectId);
      if (!eff || eff.remainingMs <= 0) return null;
      // Post-potency fraction of the player's Recovery RATE, not a % of max HP —
      // what this converts to in HP depends on their Recovery stat.
      const recoveryPct = Math.round((eff.data["recoveryPct"] ?? 0) * 100);
      const def = abilityDef(
        player.tracksProgression.equippedAbilities?.guards?.[slotIndex],
      );
      return {
        id: effectId,
        label: def?.name ?? "Recovery",
        stacks: 1,
        durationPct: durationPct(eff.remainingMs, eff.data["totalMs"] ?? eff.remainingMs),
        color: "#73d7ff",
        logSourceName: def?.name ?? "Recovery skill",
        logSourceSide: "ally",
        logDetail: `+${recoveryPct}% Recovery`,
      };
    },
    {
      category: "neutral",
      shape: "circle",
      color: "#73d7ff",
      label: "Recovery",
      iconKey: "second-wind",
    },
  ),
);

export const ABILITY_BUFFS = [
  ...GUARD_SLOT_BUFFS,
  ...RECOVERY_SLOT_BUFFS,
  defineBuff(
    "ability-bramble",
    ({ playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, BRAMBLE_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const plating = Math.round(eff.data["platingBonus"] ?? 0);
      const reflect = Math.round(eff.data["reflectFlat"] ?? 0);
      return {
        id: "ability-bramble",
        label: "Bramble",
        stacks: 1,
        durationPct: durationPct(eff.remainingMs, eff.data["totalMs"] ?? eff.remainingMs),
        color: "#8fd48b",
        logSourceName: "Bramble Guard",
        logSourceSide: "ally",
        logDetail: `+${plating} plating, ${reflect} thorns`,
      };
    },
    { category: "neutral", shape: "square", color: "#8fd48b", label: "Bramble" },
  ),
  defineBuff(
    ABILITY_FRENZY_EFFECT_ID,
    ({ playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, ABILITY_FRENZY_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const pct = Math.round((eff.data["attackSpeedPct"] ?? 0) * 100);
      return {
        id: ABILITY_FRENZY_EFFECT_ID,
        label: "Frenzy",
        stacks: 1,
        durationPct: durationPct(eff.remainingMs, eff.data["totalMs"] ?? eff.remainingMs),
        color: "#ff8a3d",
        logSourceName: "Frenzy",
        logSourceSide: "ally",
        logDetail: `+${pct}% attack speed`,
      };
    },
    { category: "neutral", shape: "circle", color: "#ff8a3d", label: "Frenzy" },
  ),
  defineBuff(
    ABILITY_CONTROL_RESIST_EFFECT_ID,
    ({ playerCs }) => {
      if (!playerCs) return null;
      const eff = getStatusEffect(playerCs, ABILITY_CONTROL_RESIST_EFFECT_ID);
      if (!eff || eff.remainingMs <= 0) return null;
      const pct = Math.round((eff.data["controlResistPct"] ?? 0) * 100);
      return {
        id: ABILITY_CONTROL_RESIST_EFFECT_ID,
        label: "Unbound",
        stacks: 1,
        durationPct: durationPct(eff.remainingMs, eff.data["totalMs"] ?? eff.remainingMs),
        color: "#d9c2ff",
        logSourceName: "Break Free",
        logSourceSide: "ally",
        logDetail: `-${pct}% control duration`,
      };
    },
    { category: "neutral", shape: "circle", color: "#d9c2ff", label: "Unbound" },
  ),
] as const satisfies readonly BuffDescriptor[];
