import { registerCombatListener } from "../../combat/engine/combatPipeline";
import { applyHealToPlayer } from "../regen/healing";

/**
 * Heal a fraction of a broken shield's max value when a shield fully breaks.
 *
 * Reads `ctx.metadata['shieldBrokenMax']` (set by the shield-absorb listener) and
 * sums the charm key `defense.shield-break-heal-pct` with the armor-side
 * `defense.shield-break-hp-recovery-pct`. Registered AFTER `registerShieldAbsorb`
 * so the metadata is already populated.
 *
 * Lives in its own file (not shields.ts) to avoid a shields ↔ healing import cycle.
 */
export function registerShieldBreakHeal(): void {
  registerCombatListener("onDamageTaken", (ctx, world) => {
    if (ctx.defenderType !== "player") return;
    const brokenMax = (ctx.metadata["shieldBrokenMax"] as number) ?? 0;
    if (brokenMax <= 0) return;

    const player = ctx.defender;
    const pct =
      (player.usesSkills.passives["defense.shield-break-heal-pct"] ?? 0) +
      (player.usesSkills.passives["defense.shield-break-hp-recovery-pct"] ?? 0);
    if (pct <= 0) return;

    applyHealToPlayer(player, player.tracksCombat, brokenMax * pct, world);
  });
}
