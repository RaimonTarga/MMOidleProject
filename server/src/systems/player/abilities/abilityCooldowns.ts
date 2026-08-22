/**
 * Ability cooldown keys and modifiers.
 *
 * Split out from `abilityFiring.ts` so the firing driver and the cast driver can
 * both use them without an import cycle.
 */
import { abilityCooldownMs, type AbilityDef } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";

/**
 * Cooldowns are keyed PER ABILITY, not per slot: with two Technique slots a
 * fixed `ability.technique.cd` would let a loadout swap dodge the cooldown and
 * would couple two independent abilities' rhythms together.
 */
export function abilityCooldownKey(abilityId: string): string {
  return `ability.cd.${abilityId}`;
}

/** Matches the existing guard cooldown-reduction cap. */
const CD_REDUCTION_CAP = 0.9;

/**
 * Technique cooldown after `technique.cooldown-reduction-pct`, starting from the
 * AUTHORED cooldown for the player's rank. The offensive sibling of
 * `guard.cooldown-reduction-pct`; the two namespaces stay separate so offensive
 * and defensive budgets can't be bought with one stat.
 *
 * Abilities tagged `mobility` additionally take the Scout core's
 * `core.mobility-cooldown-reduction-pct`. The two reductions are SUMMED before the
 * single cap, not applied one after the other — sequential application would let a
 * Scout core plus a cooldown weapon slip past 90% total, and the cap exists to keep
 * a repositioning ability from becoming permanently available.
 */
export function techniqueCooldownMs(
  player: PlayerEntity,
  ability: AbilityDef,
): number {
  let reduction = player.usesSkills.passives["technique.cooldown-reduction-pct"] ?? 0;

  if (ability.tags?.includes("mobility")) {
    reduction += player.usesSkills.passives["core.mobility-cooldown-reduction-pct"] ?? 0;
  }

  const clamped = Math.min(CD_REDUCTION_CAP, Math.max(0, reduction));
  return abilityCooldownMs(ability, player.tracksProgression.playerTier) * (1 - clamped);
}

/** Guard cooldown after `guard.cooldown-reduction-pct`, from the authored rank. */
export function guardCooldownMs(
  player: PlayerEntity,
  ability: AbilityDef,
): number {
  const reduction = player.usesSkills.passives["guard.cooldown-reduction-pct"] ?? 0;
  const clamped = Math.min(CD_REDUCTION_CAP, Math.max(0, reduction));
  return abilityCooldownMs(ability, player.tracksProgression.playerTier) * (1 - clamped);
}
