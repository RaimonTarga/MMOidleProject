import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';
import { SUMMONER_SPECIALIZATION_TUNING, summonerSpecializationFor, type SummonerFrame } from '../data/summoner';
import { resolveRelicMagnitudeMultiplier, type RelicRatings } from './relics';
import { SCALABLE_DEBUFFS } from './debuffScaling';
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
    // The Controller Core only ever strengthens debuffs it already owns
    // (SCALABLE_DEBUFFS); a mechanic added to the Relic registry here must not
    // start reading as Core-scalable just because it now has a preview line.
    const core = kind === 'debuff' && SCALABLE_DEBUFFS[id] ? 1 + (p['core.debuff-potency-mult'] ?? 0) : 1;
    const before = value * core;
    result.push({ kind, label, unit, before, after: scaleMechanicMagnitude(id, field, before, resolveRelicMagnitudeMultiplier(kind === 'buff' ? ratings.buffEffect : ratings.debuffEffect), registry) });
  };
  if (archetype === 'cadence') {
    if ((p['cadence.momentum-echo'] ?? 0) > 0) add('buff', 'cadence-echo', 'damageBonus', 'Echo bonus damage', p['cadence.momentum-echo-bonus'] ?? 0.5, 'percent');
    if ((p['cadence.hemorrhage'] ?? 0) > 0) add('debuff', 'cadence-hemorrhage', 'damagePerTick', 'Hemorrhage tick damage', 1, 'multiplier');
    if ((p['cadence.debuff-vuln-pct'] ?? 0) > 0) {
      // Display the bonus fraction; the runtime registry stores 1 + this fraction.
      const before = (p['cadence.debuff-vuln-pct'] ?? 0) / 100 * (1 + (p['core.debuff-potency-mult'] ?? 0));
      result.push({ kind: 'debuff', label: 'Vulnerability damage taken', before, after: before * resolveRelicMagnitudeMultiplier(ratings.debuffEffect), unit: 'percent' });
    }
    if ((p['cadence.debuff-plating-shred'] ?? 0) > 0) add('debuff', 'plating-shred', 'platingReduction', 'Plating removed per finisher', p['cadence.debuff-plating-shred']!, 'flat');
    if ((p['cadence.rampage'] ?? 0) > 0) {
      add('buff', 'cadence-rampage', 'multPerStack', 'Rampage finisher damage per stack', p['cadence.rampage-mult-per-stack'] ?? 0.15, 'percent');
      add('buff', 'cadence-rampage', 'apsPerStackMs', 'Rampage attack cooldown reduction per stack', p['cadence.rampage-aps-per-stack-ms'] ?? 60, 'flat');
    }
  }
  if (archetype === 'cooldown' && (p['cooldown.overdrive'] ?? 0) > 0) add('buff', 'cooldown-overdrive', 'attackSpeedPct', 'Overdrive attack-speed bonus', p['cooldown.overdrive-attack-speed-pct'] ?? 1, 'percent');
  if (archetype === 'reload') {
    if ((p['reload.hair-trigger'] ?? 0) > 0) add('buff', 'reload-hair-trigger', 'attackSpeedPctPerShot', 'Hair Trigger attack speed per shot', p['reload.hair-trigger-pct-per-shot'] ?? 0.07, 'percent');
    if ((p['reload.suppressing-fire'] ?? 0) > 0) add('debuff', 'reload-suppress-shred', 'platingReduction', 'Suppressing Fire plating removed per stack', p['reload.suppress-shred'] ?? 4, 'flat');
  }
  if (archetype === 'energy') {
    if ((p['energy.overdrive'] ?? 0) > 0) add('buff', 'energy-overdrive', 'attackDamagePct', 'Surge attack-damage bonus', p['energy.overdrive-attack-damage-pct'] ?? 0.4, 'percent');
    // damagePerTick is captured from `attack` at cast time, unavailable here;
    // totalMult scales identically (damagePerTick is linear in it), so it
    // stands in as a truthful, attack-independent preview of the same ratio.
    if ((p['energy.endless-storm'] ?? 0) > 0) add('debuff', 'energy-storm', 'damagePerTick', 'Storm damage multiplier', p['energy.endless-storm-total-mult'] ?? 8.0, 'multiplier');
  }
  if (archetype === 'dot') {
    add('debuff', 'dot', 'damagePerStack', 'DoT damage per stack', 1, 'multiplier');
    if ((p['dot.frenzy'] ?? 0) > 0) {
      add('buff', 'dot-frenzy', 'attackSpeedPct', 'Frenzy attack-speed bonus', p['dot.frenzy-attack-speed-pct'] ?? 0.3, 'percent');
      add('buff', 'dot-frenzy', 'onHitPerTier', 'Frenzy on-hit damage', (p['dot.frenzy-onhit-per-tier'] ?? 10) * Math.max(1, tier - 3) * (1 + (p['core.onhit-mult'] ?? 0)), 'flat');
    }
    if ((p['dot.rimeshatter'] ?? 0) > 0) add('debuff', 'brittle', 'drPerStack', 'Rimeshatter damage reduction removed', p['dot.rimeshatter-dr-reduction'] ?? 0.08, 'percent');
    if ((p['dot.freezing-cold'] ?? 0) > 0) {
      add('debuff', 'dot-chill', 'moveSlowPerStack', 'Chill movement slow per stack', p['dot.chill-move-slow-per-stack'] ?? 0.05, 'percent');
      add('debuff', 'dot-chill', 'attackSlowPerStack', 'Chill attack-cooldown increase per stack', p['dot.chill-attack-slow-per-stack'] ?? 0.05, 'percent');
      add('debuff', 'dot-frozen', 'damageTakenPct', 'Frozen damage taken', p['dot.freeze-damage-taken-pct'] ?? 0.35, 'percent');
    }
    if ((p['dot.wind-spirit'] ?? 0) > 0) add('debuff', 'dot-frostbite', 'dotTakenPerStack', 'Frostbite DoT damage taken per stack', p['dot.frostbite-dot-taken-pct'] ?? 0.03, 'percent');
  }
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
