import type { PassiveMap } from '../passives';
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

/** Names only effects explicitly registered and produced by this build. */
export function relicEffectPreview(archetype: string | null | undefined, p: PassiveMap, ratings: RelicRatings, tier = 4): RelicEffectPreview[] {
  const result: RelicEffectPreview[] = [];
  const add = (kind: 'buff' | 'debuff', id: string, field: string, label: string, value: number, unit: RelicEffectPreview['unit']) => {
    const registry = kind === 'buff' ? SCALABLE_MECHANIC_BUFFS : SCALABLE_MECHANIC_DEBUFFS;
    if (!registry[id]?.fields[field]) return;
    const core = kind === 'debuff' && id !== 'dot' && id !== 'cadence-hemorrhage' ? 1 + (p['core.debuff-potency-mult'] ?? 0) : 1;
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
  }
  if (archetype === 'cooldown' && (p['cooldown.overdrive'] ?? 0) > 0) add('buff', 'cooldown-overdrive', 'attackSpeedPct', 'Overdrive attack-speed bonus', p['cooldown.overdrive-attack-speed-pct'] ?? 1, 'percent');
  if (archetype === 'reload') {
    if ((p['reload.hair-trigger'] ?? 0) > 0) add('buff', 'reload-hair-trigger', 'attackSpeedPctPerShot', 'Hair Trigger attack speed per shot', p['reload.hair-trigger-pct-per-shot'] ?? 0.07, 'percent');
    if ((p['reload.suppressing-fire'] ?? 0) > 0) add('debuff', 'reload-suppress-shred', 'platingReduction', 'Suppressing Fire plating removed per stack', p['reload.suppress-shred'] ?? 4, 'flat');
  }
  if (archetype === 'energy' && (p['energy.overdrive'] ?? 0) > 0) add('buff', 'energy-overdrive', 'attackDamagePct', 'Surge attack-damage bonus', p['energy.overdrive-attack-damage-pct'] ?? 0.4, 'percent');
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
    }
    if ((p['dot.wind-spirit'] ?? 0) > 0) add('debuff', 'dot-frostbite', 'dotTakenPerStack', 'Frostbite DoT damage taken per stack', p['dot.frostbite-dot-taken-pct'] ?? 0.03, 'percent');
  }
  return result;
}
