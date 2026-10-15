import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';
import { SUMMONER_SPECIALIZATION_TUNING, summonerSpecializationFor, type SummonerFrame } from '../data/summoner';
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
  if (archetype === 'summoner') {
    const frame = (options.subVariant ?? 'root') as SummonerFrame;
    const specialization = summonerSpecializationFor(frame, options.unlockedSkills ?? []);
    if (specialization === 'grand-ritual') {
      add('buff', 'summoner-grand-ritual', 'damageMult', 'Grand Ritual empowered damage', SUMMONER_SPECIALIZATION_TUNING.grandRitual.damageMult, 'multiplier');
    }
    if (specialization === 'harrier-brood') {
      add('debuff', 'summoner-harrier-brood', 'damageTakenPctPerSlot', 'Harrier damage taken per mark', SUMMONER_SPECIALIZATION_TUNING.harrierBrood.damageTakenPctPerSlot, 'percent');
    }
    if (specialization === 'withering-chorus') {
      add('debuff', 'summoner-withering-chorus', 'damagePctPerSlot', 'Withering Chorus damage per voice', SUMMONER_SPECIALIZATION_TUNING.witheringChorus.damagePctPerSlot, 'percent');
    }
  }
  return result;
}
