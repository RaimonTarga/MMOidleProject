/**
 * Ability cooldown keys and modifiers.
 *
 * Split out from `abilityFiring.ts` so the firing driver and the cast driver can
 * both use them without an import cycle.
 */
import type { AbilityDef } from "@mmo-idle/shared";
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
 * Technique cooldown after `technique.cooldown-reduction-pct`. The offensive
 * sibling of `guard.cooldown-reduction-pct`; the two namespaces stay separate so
 * offensive and defensive budgets can't be bought with one stat (plan §3.3).
 */
export function techniqueCooldownMs(
  player: PlayerEntity,
  ability: AbilityDef,
): number {
  const reduction = player.usesSkills.passives["technique.cooldown-reduction-pct"] ?? 0;
  const clamped = Math.min(CD_REDUCTION_CAP, Math.max(0, reduction));
  return ability.cooldownMs * (1 - clamped);
}
