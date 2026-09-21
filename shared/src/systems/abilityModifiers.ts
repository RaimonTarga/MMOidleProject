import { abilityCooldownMs, resolveAbilityEffect, type AbilityDef, type AbilityEffectSpec } from '../abilities';
import { abilityHasTag } from '../data/abilityTags';

export const ABILITY_COOLDOWN_REDUCTION_CAP = 0.9;
export const ABILITY_GUARD_MAGNITUDE_CAP = 0.9;

export function abilityCooldownReduction(ability: AbilityDef, passives: Record<string, number>): number {
  const familyKey = abilityHasTag(ability, 'technique')
    ? 'technique.cooldown-reduction-pct' : 'guard.cooldown-reduction-pct';
  let reduction = Math.max(0, passives[familyKey] ?? 0);
  if (abilityHasTag(ability, 'mobility')) reduction += Math.max(0, passives['core.mobility-cooldown-reduction-pct'] ?? 0);
  if (abilityHasTag(ability, 'cleanse')) reduction += Math.max(0, passives['cleanse.cooldown-reduction-pct'] ?? 0);
  return Math.min(ABILITY_COOLDOWN_REDUCTION_CAP, reduction);
}

export function modifiedAbilityCooldownMs(ability: AbilityDef, playerTier: number, passives: Record<string, number>): number {
  return abilityCooldownMs(ability, playerTier) * (1 - abilityCooldownReduction(ability, passives));
}

/** Equipment subset modifiers, shared by authoritative firing and every preview. */
export function resolveAbilityEffectWithPassives(ability: AbilityDef, playerTier: number, passives: Record<string, number>): AbilityEffectSpec {
  const effect = resolveAbilityEffect(ability, { playerTier, techniquePowerPct: passives['technique.power-pct'] });
  if (abilityHasTag(ability, 'recovery') && effect.kind === 'heal') {
    return { ...effect, recoveryPct: effect.recoveryPct * (1 + Math.max(0, passives['defense.recovery-skill-potency'] ?? 0)) };
  }
  if (!abilityHasTag(ability, 'guard') || !abilityHasTag(ability, 'mitigation')) return effect;
  const potency = 1 + Math.max(0, passives['guard.potency-pct'] ?? 0);
  const duration = 1 + Math.max(0, passives['guard.duration-pct'] ?? 0);
  if (effect.kind === 'damage-reduction') return {
    ...effect,
    drPct: Math.min(ABILITY_GUARD_MAGNITUDE_CAP, effect.drPct * potency),
    durationMs: Math.round(effect.durationMs * duration),
    ...(effect.knockbackResistPct !== undefined
      ? { knockbackResistPct: Math.min(ABILITY_GUARD_MAGNITUDE_CAP, effect.knockbackResistPct * potency) } : {}),
  };
  if (effect.kind === 'bramble') return {
    ...effect, platingBonus: Math.round(effect.platingBonus * potency), reflectFlat: Math.round(effect.reflectFlat * potency),
    durationMs: Math.round(effect.durationMs * duration),
  };
  return effect;
}
