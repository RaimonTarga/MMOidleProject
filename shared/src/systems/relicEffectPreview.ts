import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';

import { resolveRelicMagnitudeMultiplier, type RelicRatings } from './relics';
import { SCALABLE_MECHANIC_BUFFS, SCALABLE_MECHANIC_DEBUFFS, scaleMechanicMagnitude } from './mechanicEffectScaling';

/** Which secondary relic rating produced a line; never inferred from its label. */
export type RelicSecondaryKind = 'buff' | 'debuff';

/** A secondary rating that scaled nothing, so the preview can say so out loud. */
export interface RelicEffectNote {
  kind: RelicSecondaryKind;
  message: string;
}

export interface RelicEffectPreview {
  kind: RelicSecondaryKind;
  label: string;
  before: number;
  after: number;
  unit: 'percent' | 'flat' | 'multiplier';
}

export interface RelicEffectPreviewOptions {
  tier?: number;
  subVariant?: SubVariant | null;
  unlockedSkills?: readonly string[];
}

/** Names only effects explicitly registered and produced by this build. */
export function relicEffectPreview(
  archetype: string | null | undefined,
  p: PassiveMap,
  ratings: RelicRatings,
  options: RelicEffectPreviewOptions = {},
): RelicEffectPreview[] {
  const tier = options.tier ?? 4;
  const result: RelicEffectPreview[] = [];
  const add = (kind: 'buff' | 'debuff', id: string, field: string, label: string, value: number, unit: RelicEffectPreview['unit']) => {
    const registry = kind === 'buff' ? SCALABLE_MECHANIC_BUFFS : SCALABLE_MECHANIC_DEBUFFS;
    if (!registry[id]?.fields[field]) return;
    const before = value;
    result.push({ kind, label, unit, before, after: scaleMechanicMagnitude(id, field, before, resolveRelicMagnitudeMultiplier(kind === 'buff' ? ratings.buffEffect : ratings.debuffEffect), registry) });
  };
  return result;
}
