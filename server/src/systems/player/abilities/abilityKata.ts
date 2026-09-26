/**
 * KATA — the Desert technique staff's rhythm mechanic (2026-09-26).
 *
 * Each STRIKE Technique fired (armed, cast, charge, reposition) adds a Kata
 * stack, up to `technique.kata-stacks` (default 3). A strike Technique fired
 * while the stacks are full spends them, and that Technique resolves with
 * `technique.kata-power-pct` extra Technique Power. So the rhythm is three
 * ordinary Techniques, then one empowered one.
 *
 * Instant self-buffs (Frenzy) neither build nor spend Kata. They do not occupy
 * the offensive channel, so one could fire while an empowered strike is still
 * waiting for its hit and steal the release.
 *
 * `techniquePowerPctFor` is the ONE place Technique Power is read. Every
 * Technique resolution path must use it, or it silently opts out of Kata.
 */
import { applyStatusEffect, getStatusEffect, removeStatusEffect } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";
import { defineBuff } from "../../combat/buffs/descriptor";

export const KATA_EFFECT_ID = "kata";
/** Server-only marker: the next strike Technique to resolve carries the bonus. */
export const KATA_RELEASE_EFFECT_ID = "kata-release";
/** Stacks fade if the rhythm stops. */
const KATA_STACK_MS = 12_000;
/**
 * Long enough for the empowered Technique to resolve (an armed strike waits for
 * its next hit; a cast for its wind-up). The next strike Technique fired clears
 * it anyway, and the one-channel rule means it cannot resolve before that.
 */
const KATA_RELEASE_MS = 8_000;

function kataPower(player: PlayerEntity): number {
  return player.usesSkills.passives["technique.kata-power-pct"] ?? 0;
}

/** Technique Power for a resolving Technique: the passive, plus a released Kata. */
export function techniquePowerPctFor(player: PlayerEntity): number {
  const base = player.usesSkills.passives["technique.power-pct"] ?? 0;
  const bonus = kataPower(player);
  if (bonus <= 0) return base;
  return getStatusEffect(player.tracksCombat, KATA_RELEASE_EFFECT_ID) ? base + bonus : base;
}

/**
 * Advance Kata for a strike Technique that just FIRED. Call it once per
 * activation, before the Technique's payload resolves.
 */
export function advanceKata(player: PlayerEntity): void {
  if (kataPower(player) <= 0) return;
  const cs = player.tracksCombat;
  // The previous strike has resolved by now (one offensive channel), so any
  // release it carried is spent.
  removeStatusEffect(cs, KATA_RELEASE_EFFECT_ID);

  const threshold = Math.max(1, Math.round(player.usesSkills.passives["technique.kata-stacks"] ?? 3));
  const stacks = getStatusEffect(cs, KATA_EFFECT_ID)?.stacks ?? 0;
  if (stacks >= threshold) {
    removeStatusEffect(cs, KATA_EFFECT_ID);
    applyStatusEffect(cs, {
      id: KATA_RELEASE_EFFECT_ID,
      maxStacks: 1,
      remainingMs: KATA_RELEASE_MS,
      refreshable: true,
      sourceId: player.isPlayer.id,
      data: {},
    });
    return;
  }
  applyStatusEffect(cs, {
    id: KATA_EFFECT_ID,
    maxStacks: threshold,
    remainingMs: KATA_STACK_MS,
    refreshable: true,
    sourceId: player.isPlayer.id,
    data: { totalMs: KATA_STACK_MS },
  });
}

/** HUD tile: the stacks building toward the empowered Technique. */
export const KATA_BUFFS = [
  defineBuff(
    KATA_EFFECT_ID,
    ({ player }) => {
      const bonus = kataPower(player);
      if (bonus <= 0) return null;
      const effect = getStatusEffect(player.tracksCombat, KATA_EFFECT_ID);
      if (!effect || effect.stacks <= 0 || effect.remainingMs <= 0) return null;
      const threshold = Math.max(1, Math.round(player.usesSkills.passives["technique.kata-stacks"] ?? 3));
      const totalMs = effect.data["totalMs"] ?? effect.remainingMs;
      const ready = effect.stacks >= threshold;
      return {
        id: KATA_EFFECT_ID,
        label: "Kata",
        stacks: effect.stacks,
        durationPct: totalMs > 0 ? (effect.remainingMs / totalMs) * 100 : -1,
        color: "#e8b04a",
        logSourceName: "Weapon",
        logSourceSide: "ally",
        logDetail: ready
          ? `next Technique +${Math.round(bonus * 100)}% power`
          : `${effect.stacks}/${threshold} toward an empowered Technique`,
        remainingMs: effect.remainingMs,
        values: [{ label: "Empowered Technique", value: `+${Math.round(bonus * 100)}% power`, good: true }],
      };
    },
    { category: "neutral", shape: "square", color: "#e8b04a", label: "Kata" },
  ),
] as const;
