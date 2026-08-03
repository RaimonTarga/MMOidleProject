import {
  ABILITY_DATABASE,
  MONSTER_DATABASE,
  getCooldown,
  setCooldown,
} from "@mmo-idle/shared";
import { registerCombatListener } from "./engine/combatPipeline";
import { abilityCooldownKey } from "../player/abilities/abilityCooldowns";

/**
 * Combat-time core effects.
 *
 * Most cores are pure stat multipliers resolved in the stat rebuild
 * (`shared/src/systems/stats.ts`, the `core.*-mult` pass). The two here need a
 * combat event instead, because they depend on WHO was hit or WHAT died:
 *
 *  - `core.elite-damage-mult`            (Duelist) — onHit, vs elites and bosses
 *  - `core.mobility-refund-on-kill-pct`  (Bruiser) — onKill, refunds mobility cd
 *
 * `core.onhit-mult` (Catalyst) is NOT here: it folds into the on-hit term inside
 * `runPlayerAttack`, where that term is applied.
 *
 * Registered from combatBootstrap.ts so the bench and the live server behave
 * identically.
 */
export function initCoreCombatEffects(): void {
  registerEliteDamage();
  registerMobilityRefundOnKill();
}

// ── Duelist: extra damage vs elites and bosses ───────────────────────────────

function registerEliteDamage(): void {
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;

    const mult = ctx.attacker.usesSkills.passives["core.elite-damage-mult"] ?? 0;
    if (mult === 0) return;

    const def = MONSTER_DATABASE.get(ctx.defender.isMonster.monsterTypeId);
    // `elite` marks a biome's standout; `isBoss` marks a dungeon boss. A Duelist
    // is paid for single-target commitment, so both count.
    if (!def?.elite && !def?.isBoss) return;

    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 + mult)));
  });
}

// ── Bruiser: kills refund part of the mobility ability's cooldown ────────────

function registerMobilityRefundOnKill(): void {
  registerCombatListener("onKill", (ctx, _world) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;

    const player = ctx.attacker;
    const pct = player.usesSkills.passives["core.mobility-refund-on-kill-pct"] ?? 0;
    if (pct <= 0) return;

    // Inert unless the build actually carries a mobility ability — the magnifier
    // rule. Today only Charge is tagged `mobility`, so this is a narrow but
    // deliberate dependency, and it widens for free as more are authored.
    for (const abilityId of player.tracksProgression.equippedAbilities.techniques) {
      const ability = ABILITY_DATABASE.get(abilityId);
      if (!ability?.tags?.includes("mobility")) continue;

      const key = abilityCooldownKey(abilityId);
      const remaining = getCooldown(player.tracksCombat, key);
      if (remaining <= 0) continue; // already up — nothing to refund

      // Cooldowns are stored as REMAINING ms and ticked down, so a refund is a
      // subtraction. Refund a fraction of the ability's FULL cooldown rather than
      // of what is left, so the reward for a kill does not shrink as the cooldown
      // runs out (which would make chained kills feel worse, not better).
      setCooldown(player.tracksCombat, key, Math.max(0, remaining - ability.cooldownMs * pct));
    }
  });
}
