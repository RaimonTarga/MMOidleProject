import {
  ABILITY_DATABASE,
  abilityCooldownMs,
  getCounter,
  getCooldown,
  getString,
  resetCounter,
  setCounter,
  setCooldown,
  setString,
} from "@mmo-idle/shared";
import { registerCombatListener, type CombatContext } from "./engine/combatPipeline";
import { abilityCooldownKey } from "../player/abilities/abilityCooldowns";
import type { PlayerEntity } from "../../ecs/entity";

const DUELIST_TARGET_KEY = "core.duelist-target-id";
const DUELIST_STACKS_KEY = "core.duelist-focus-stacks";

/**
 * Combat-time core effects.
 *
 * Most cores are pure stat multipliers resolved in the stat rebuild
 * (`shared/src/systems/stats.ts`, the `core.*-mult` pass). The two here need a
 * combat event instead, because they depend on WHO was hit or WHAT died:
 *
 *  - `core.focus-damage-per-hit-mult`    (Duelist) — onHit, same-target ramp
 *  - `core.mobility-refund-on-kill-pct`  (Bruiser) — onKill, refunds mobility cd
 *
 * `core.onhit-mult` (Catalyst) is NOT here: it folds into the on-hit term inside
 * `runPlayerAttack`, where that term is applied.
 *
 * Registered from combatBootstrap.ts so the bench and the live server behave
 * identically.
 */
export function initCoreCombatEffects(): void {
  registerDuelistFocus();
  registerMobilityRefundOnKill();
}

// ── Duelist: consecutive direct hits build focused pressure ─────────────────

function isDirectPlayerEvent(ctx: CombatContext): boolean {
  if (ctx.formation?.side === "summon") return false;
  if (ctx.metadata.physicalSource === "summon") return false;
  const aggroSource = ctx.metadata.aggroSource;
  return !(
    typeof aggroSource === "object" &&
    aggroSource !== null &&
    "kind" in aggroSource &&
    aggroSource.kind === "minion"
  );
}

/** Clear only Core-owned scratch state; unrelated combat ramps are preserved. */
export function resetCoreCombatState(player: PlayerEntity): void {
  setString(player.tracksCombat, DUELIST_TARGET_KEY, "");
  resetCounter(player.tracksCombat, DUELIST_STACKS_KEY);
}

function registerDuelistFocus(): void {
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;
    if (!isDirectPlayerEvent(ctx)) return;

    const perHit = ctx.attacker.usesSkills.passives["core.focus-damage-per-hit-mult"] ?? 0;
    const maxStacks = Math.max(
      0,
      Math.round(ctx.attacker.usesSkills.passives["core.focus-max-stacks"] ?? 0),
    );
    if (perHit <= 0 || maxStacks <= 0) return;

    const targetId = ctx.defender.isMonster.id;
    const previousTargetId = getString(ctx.attacker.tracksCombat, DUELIST_TARGET_KEY);
    const stacks = previousTargetId === targetId
      ? Math.min(maxStacks, getCounter(ctx.attacker.tracksCombat, DUELIST_STACKS_KEY) + 1)
      : 1;

    setString(ctx.attacker.tracksCombat, DUELIST_TARGET_KEY, targetId);
    setCounter(ctx.attacker.tracksCombat, DUELIST_STACKS_KEY, stacks);
    ctx.damage = Math.max(1, Math.round(ctx.damage * (1 + perHit * stacks)));
  });
}

// ── Bruiser: kills refund part of the mobility ability's cooldown ────────────

function registerMobilityRefundOnKill(): void {
  registerCombatListener("onKill", (ctx, _world) => {
    if (ctx.attackerType !== "player" || ctx.defenderType !== "monster") return;
    if (!isDirectPlayerEvent(ctx)) return;

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
      setCooldown(player.tracksCombat, key, Math.max(0, remaining - abilityCooldownMs(ability, player.tracksProgression.playerTier) * pct));
    }
  });
}
