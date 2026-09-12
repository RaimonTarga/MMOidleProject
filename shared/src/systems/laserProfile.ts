import type { PassiveMap } from '../passives';
import { relicRatingsFromPassives, resolveRelicCount, resolveRelicInterval, type RelicRatings, type RelicValue } from './relics';

export interface LaserRelicProfile {
  archetype: 'laser';
  heatMax: RelicValue<number>;
  coolingMs: RelicValue<number>;
}

/** Heat is the magazine: capacity changes burst length, frequency changes full reload time. */
export function resolveLaserRelicProfile(passives: PassiveMap, ratings: RelicRatings): LaserRelicProfile {
  const coolingMs = 100 / Math.max(0.1, passives['reload.laser-cool-per-tick'] ?? 2.5) * 100;
  return {
    archetype: 'laser',
    heatMax: { before: 100, after: resolveRelicCount(100, ratings.potency, 1, 1) },
    coolingMs: { before: coolingMs, after: resolveRelicInterval(coolingMs, ratings.frequency, 1, 100) },
  };
}

export function resolveLaserProfile(passives: PassiveMap) {
  const profile = resolveLaserRelicProfile(passives, relicRatingsFromPassives(passives));
  return {
    heatMax: profile.heatMax.after,
    coolingMs: profile.coolingMs.after,
    heatPerTick: Math.max(0.1, passives['reload.laser-heat-per-tick'] ?? 2),
    coolPerTick: profile.heatMax.after * 100 / profile.coolingMs.after,
    damagePerTickPct: passives['reload.laser-damage-per-tick-pct'] ?? 0.18,
  };
}
