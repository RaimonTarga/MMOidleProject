/**
 * Ability cooldown keys and modifiers.
 *
 * Split out from `abilityFiring.ts` so the firing driver and the cast driver can
 * both use them without an import cycle.
 */
import { modifiedAbilityCooldownMs, type AbilityDef } from "@mmo-idle/shared";
import type { PlayerEntity } from "../../../ecs/entity";

/**
 * Cooldowns are keyed PER ABILITY, not per slot: with two Technique slots a
 * fixed `ability.technique.cd` would let a loadout swap dodge the cooldown and
 * would couple two independent abilities' rhythms together.
 */
export function abilityCooldownKey(abilityId: string): string {
  return `ability.cd.${abilityId}`;
}

/** Both firing channels use the same tag-based equipment modifiers as the UI. */
export function techniqueCooldownMs(player: PlayerEntity, ability: AbilityDef): number {
  return modifiedAbilityCooldownMs(ability, player.tracksProgression.playerTier, player.usesSkills.passives);
}

export function guardCooldownMs(player: PlayerEntity, ability: AbilityDef): number {
  return modifiedAbilityCooldownMs(ability, player.tracksProgression.playerTier, player.usesSkills.passives);
}
