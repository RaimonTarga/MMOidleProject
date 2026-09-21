import { abilityCastMs, abilityRankAt, TECHNIQUE_POWER_FIELDS, type AbilityDef, type AbilityTag } from '../abilities';
import { abilityHasTag } from './abilityTags';
import type { PassiveKey } from '../passives';

/** Describes existing modifiers; eligibility also checks the actual rank payload. */
export const ABILITY_MODIFIER_INFO: { key: PassiveKey; label: string; tags: AbilityTag[]; unit?: 'ms' }[] = [
  { key: 'technique.power-pct', label: 'Technique Power', tags: ['technique'] },
  { key: 'technique.cooldown-reduction-pct', label: 'Technique cooldown reduction', tags: ['technique'] },
  { key: 'guard.cooldown-reduction-pct', label: 'Guard cooldown reduction', tags: ['guard'] },
  { key: 'cleanse.cooldown-reduction-pct', label: 'Cleanse cooldown reduction', tags: ['cleanse'] },
  { key: 'technique.cast-speed-pct', label: 'Wind-up reduction', tags: ['cast'] },
  { key: 'guard.potency-pct', label: 'Guard potency', tags: ['guard', 'mitigation'] },
  { key: 'guard.duration-pct', label: 'Guard duration', tags: ['guard', 'mitigation'] },
  { key: 'guard.recovery-on-fire-pct', label: 'Recovery activated when this Guard fires', tags: ['guard'] },
  { key: 'guard.recovery-on-fire-ms', label: 'Guard-triggered Recovery duration', tags: ['guard'], unit: 'ms' },
  { key: 'defense.recovery-skill-potency', label: 'Recovery skill potency', tags: ['recovery'] },
  { key: 'core.mobility-cooldown-reduction-pct', label: 'Mobility cooldown reduction', tags: ['mobility'] },
  { key: 'core.mobility-refund-on-kill-pct', label: 'Base cooldown refunded per direct kill', tags: ['mobility'] },
];

export function abilityModifierApplies(key: string, ability: AbilityDef, tier: number): boolean {
  const info = ABILITY_MODIFIER_INFO.find(info => info.key === key);
  if (!info || !info.tags.every(tag => abilityHasTag(ability, tag))) return false;
  const effect = abilityRankAt(ability, tier).effect;
  if (key === 'technique.power-pct') return (TECHNIQUE_POWER_FIELDS[effect.kind] ?? []).some(field => field in effect);
  if (key === 'technique.cast-speed-pct') return abilityCastMs(ability, tier) > 0;
  if (key === 'guard.potency-pct' || key === 'guard.duration-pct') return effect.kind === 'bramble' || effect.kind === 'damage-reduction';
  if (key === 'defense.recovery-skill-potency') return effect.kind === 'heal';
  return true;
}

export function equipmentAbilityTags(effects: Record<string, number> = {}): AbilityTag[] {
  return [...new Set(ABILITY_MODIFIER_INFO.filter(info => (effects[info.key] ?? 0) > 0).flatMap(info => info.tags))];
}
