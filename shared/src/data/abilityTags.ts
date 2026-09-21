import type { AbilityDef, AbilityTag } from '../abilities';

export const ABILITY_TAG_INFO: Record<AbilityTag, { label: string; help: string }> = {
  technique: { label: 'Technique', help: 'Uses Technique cooldown bonuses. Technique Power scales its eligible offensive magnitudes.' },
  guard: { label: 'Guard', help: 'Uses Guard cooldown bonuses. Mitigation and Recovery tags determine which potency bonuses apply.' },
  armed: { label: 'Armed', help: 'Waits for your next qualifying attack to deliver its effect.' },
  cast: { label: 'Cast', help: 'Has a wind-up. Cast speed shortens the wind-up, including self-casts and charges.' },
  aoe: { label: 'AoE', help: 'Can affect multiple enemies in an area. Technique Power does not increase the radius or target count.' },
  recovery: { label: 'Recovery', help: 'Activates Recovery. Recovery skill potency increases the activated fraction; Guard potency does not.' },
  mobility: { label: 'Mobility', help: 'Moves you. Eligible for mobility cooldown reduction and cooldown refunds on kills.' },
  mitigation: { label: 'Mitigation', help: 'A protective buff. On Guards, Guard potency increases its defensive magnitudes and Guard duration extends the buff.' },
  control: { label: 'Control', help: 'Applies or counters crowd control such as slows, roots, and stuns. Technique Power does not extend control durations.' },
  cleanse: { label: 'Cleanse', help: 'Removes harmful effects or control. Cleanse cooldown bonuses apply to Cleanse and Break Free; removal counts remain unchanged.' },
  'offensive-buff': { label: 'Offensive Buff', help: 'Creates an offensive window. Technique Power scales only its eligible offensive magnitudes.' },
};

/** Family and execution tags derive from their existing authoritative fields. */
export function abilityHasTag(ability: AbilityDef, tag: AbilityTag): boolean {
  if (tag === 'guard' || tag === 'technique') return ability.slot === tag;
  if (tag === 'armed') return ability.shape === 'armed';
  if (tag === 'cast') return ['cast', 'self-cast', 'charge'].includes(ability.shape);
  if (tag === 'aoe') return ability.ranks.some(({ effect }) => 'radius' in effect && (effect.radius ?? 0) > 0);
  return ability.tags.includes(tag);
}

export function abilityTags(ability: AbilityDef): AbilityTag[] {
  return (Object.keys(ABILITY_TAG_INFO) as AbilityTag[]).filter(tag => abilityHasTag(ability, tag));
}
