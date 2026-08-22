import { GAME_CONFIG, isCooldownActive, setCooldown } from "@mmo-idle/shared";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { applyHealToPlayer } from "../regen/healing";
import { BARRIER_RIDER_CD } from "./barrier";

/**
 * Heal when an absorb pool is emptied: a fraction of the barrier's max when the
 * barrier bottoms out, or of a ward's max when that ward breaks.
 *
 * Reads `ctx.metadata['barrierEmptied']` / `['wardBrokenMax']` (set by the two
 * absorb listeners) and sums the charm key `defense.barrier-break-heal-pct` with
 * the armor-side `defense.barrier-break-hp-recovery-pct`. Registered AFTER both
 * absorb listeners so the metadata is already populated.
 *
 * COOLDOWN. Under the recharge model a barrier sitting at zero is a routine state,
 * not a rare event — every subsequent hit would "empty" it again. The shared
 * rider cooldown (`GAME_CONFIG.BARRIER_BREAK_RIDER_CD_MS`) is what keeps this a
 * once-an-engagement payout instead of a per-hit heal.
 *
 * Lives in its own file (not barrier.ts) to avoid a barrier ↔ healing import cycle.
 */
export function registerBarrierBreakHeal(): void {
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.defenderType !== "player") return;

    const barrierEmptied = ctx.metadata["barrierEmptied"] === true;
    const wardBrokenMax = (ctx.metadata["wardBrokenMax"] as number) ?? 0;
    if (!barrierEmptied && wardBrokenMax <= 0) return;

    const player = ctx.defender;
    const pct =
      (player.usesSkills.passives["defense.barrier-break-heal-pct"] ?? 0) +
      (player.usesSkills.passives["defense.barrier-break-hp-recovery-pct"] ?? 0);
    if (pct <= 0) return;

    const cs = player.tracksCombat;
    if (isCooldownActive(cs, BARRIER_RIDER_CD)) return;

    // The barrier's whole pool is the payout basis when it empties; a ward pays
    // out its own max. A hit that does both takes the larger of the two rather
    // than stacking, so the rider stays one payout per cooldown.
    const basis = Math.max(barrierEmptied ? (player.hasBarrier?.max ?? 0) : 0, wardBrokenMax);
    if (basis <= 0) return;

    setCooldown(cs, BARRIER_RIDER_CD, GAME_CONFIG.BARRIER_BREAK_RIDER_CD_MS);
    applyHealToPlayer(player, cs, basis * pct, world);
  });
}
