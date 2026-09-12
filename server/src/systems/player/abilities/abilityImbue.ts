/**
 * Imbue — the charge-based on-hit window (Imbue Lightning, T4 Jungle).
 *
 * The roster's first `self-cast` and its first window spent in HITS rather than
 * in seconds.
 *
 * WHY CHARGES. Every other offensive window in the game races a clock: Frenzy,
 * the stance windows, Overdrive. A clock quietly pays the most to whoever was
 * already attacking fastest and punishes the builds that swing slowly, which is
 * the opposite of what a "your next few strikes" fantasy promises. A charge
 * window pays every build the same: five hits are five hits whether they take
 * three seconds or ten. The price of that fairness is the wind-up tell and a
 * cooldown you cannot shorten by fighting faster.
 *
 * The window has NO duration (`remainingMs: -1`). It lives on `TracksCombat`,
 * which is server-only scratch state and is never persisted, so it correctly
 * evaporates on death and on logout with no explicit teardown.
 */
import {
  ABILITY_IMBUE_EFFECT_ID,
  ABILITY_IMBUE_FX,
  applyStatusEffect,
  getStatusEffect,
  removeStatusEffect,
  resolveAbilityEffect,
  type AbilityDef,
  type TracksCombat,
} from "@mmo-idle/shared";
import { registerCombatListener } from "../../combat/engine/combatPipeline";
import type { CombatContext } from "../../combat/engine/combatPipeline";
import type { PlayerEntity } from "../../../ecs/entity";
import type { World } from "../../../world/World";

/**
 * Apply the window. Charges and magnitude both come from the authored rank, with
 * Technique Power applied to the magnitude only — a damage stat must not buy a
 * longer window, and a charge count IS the window.
 */
export function applyImbueWindow(
  world: World,
  player: PlayerEntity,
  ability: AbilityDef,
): void {
  const effect = resolveAbilityEffect(ability, {
    playerTier: player.tracksProgression.playerTier,
    techniquePowerPct: player.usesSkills.passives["technique.power-pct"] ?? 0,
  });
  if (effect.kind !== "imbue") return;

  const charges = Math.max(1, Math.round(effect.charges));
  const onHitDamage = Math.max(0, Math.round(effect.onHitDamage));

  const applied = applyStatusEffect(player.tracksCombat, {
    id: ABILITY_IMBUE_EFFECT_ID,
    maxStacks: 1,
    // Permanent by duration; spent by charges. See the module header.
    remainingMs: -1,
    refreshable: false,
    sourceId: player.isPlayer.id,
    data: { charges, totalCharges: charges, onHitDamage },
  });
  // Re-casting refreshes rather than adds: the window is a state, not a stack.
  // Written explicitly because `applyStatusEffect` returns the EXISTING effect
  // when one is present and would otherwise leave stale charge/magnitude values
  // from an older, weaker rank behind.
  applied.stacks = 1;
  applied.data["charges"] = charges;
  applied.data["totalCharges"] = charges;
  applied.data["onHitDamage"] = onHitDamage;
  // No FX event is pushed here: the cast lifecycle already emits
  // `player-cast-end` for the resolve, and that is where the client hangs the
  // crackle. Pushing a `player-guard` too would run the Guard FX table and the
  // Guard-coloured callout over a Technique.
}

/** Charges left on the player's Imbue window, or 0 when none is up. */
export function imbueChargesRemaining(player: PlayerEntity): number {
  const effect = getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID);
  if (!effect) return 0;
  return Math.max(0, Math.floor(effect.data["charges"] ?? 0));
}

/**
 * Live on-hit-damage bonus from an active Imbue window, or 0 when none is up
 * (or its charges are spent).
 *
 * ONE DEFINITION, TWO CONSUMERS — combat.ts folds this straight into the same
 * `dealsDamage.onHitDamage` term used by gear (so it rides the same
 * core.onhit-mult / formation-weight / per-shot multipliers), and the
 * `hasStatus` mirror (see `hpForecast.ts`) reads this exact function so the
 * stat panel shows the boosted number instead of a value that visibly never
 * moves while the window is open — the same trap `attackCadenceMult` was
 * written to close for temporary haste/slow.
 */
export function imbueOnHitBonus(cs: TracksCombat): number {
  const effect = getStatusEffect(cs, ABILITY_IMBUE_EFFECT_ID);
  if (!effect) return 0;
  const charges = Math.floor(effect.data["charges"] ?? 0);
  if (charges <= 0) return 0;
  return Math.max(0, Math.round(effect.data["onHitDamage"] ?? 0));
}

/**
 * Register the on-hit consumer.
 *
 * Registered on `onHit` so the charge is spent as a normal part of the
 * outgoing hit. The bonus itself is NOT added to `ctx.damage` here — it is
 * handed off via `ctx.metadata["imbueOnHitBonus"]` and folded into
 * `dealsDamage.onHitDamage`'s own term further down the pipeline (combat.ts),
 * so it passes through the SAME plating/DR placement, core.onhit-mult,
 * formation weight, and per-shot multipliers as the real on-hit stat instead
 * of being a parallel, differently-composed number.
 *
 * ONE CHARGE PER LANDED HIT, which for a Reload magazine means one charge per
 * bullet (the designer's call). That is consistent with how the `onHitDamage`
 * stat already behaves per shot, and it means a magazine gets the full value of
 * the charges it spends rather than five bullets riding one.
 */
export function initImbueSystem(): void {
  registerCombatListener("onHit", (ctx, _world) => {
    if (ctx.attackerType !== "player") return;
    if (ctx.defenderType !== "monster") return;
    // A chaotic-weapon whiff deals no damage and must not eat a charge — the
    // same rule the armed-Technique rider follows.
    if (ctx.metadata["chaoticMiss"]) return;

    const player = ctx.attacker;
    const effect = getStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID);
    if (!effect) return;

    const charges = Math.floor(effect.data["charges"] ?? 0);
    if (charges <= 0) {
      removeStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID);
      return;
    }

    // Captured BEFORE the decrement below, which may remove the effect
    // outright on the last charge — combat.ts reads this handoff value
    // rather than re-querying `tracksCombat` after this listener returns.
    const bonus = Math.max(0, Math.round(effect.data["onHitDamage"] ?? 0));
    if (bonus > 0) ctx.metadata["imbueOnHitBonus"] = bonus;

    effect.data["charges"] = charges - 1;
    if (effect.data["charges"] <= 0) {
      removeStatusEffect(player.tracksCombat, ABILITY_IMBUE_EFFECT_ID);
    }

    tagImbueHit(ctx);
  });
}

/** Tag the hit so the client can crack lightning over it and pulse the HUD tile. */
function tagImbueHit(ctx: CombatContext): void {
  const existing = ctx.metadata["clientEffects"];
  ctx.metadata["clientEffects"] = Array.isArray(existing)
    ? [...existing, ABILITY_IMBUE_FX]
    : [ABILITY_IMBUE_FX];
}
