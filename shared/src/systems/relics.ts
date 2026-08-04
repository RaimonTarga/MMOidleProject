import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';
import { resolveDotClassProfile } from './dotClassProfile';

/** T4 in the live progression domain (playerTier 0 is the Clearing tutorial). */
export const RELIC_UNLOCK_PLAYER_TIER = 4;
/** Relic recipes use the player-facing item tier domain. */
export const RELIC_ITEM_TIER = 4;

export function relicIsUnlocked(playerTier: number, isTestRoom = false): boolean {
  return isTestRoom || playerTier >= RELIC_UNLOCK_PLAYER_TIER;
}

export const RELIC_RATING_KEYS = {
  frequency: 'relic.mechanic-frequency',
  potency: 'relic.mechanic-potency',
  buffEffect: 'relic.mechanic-buff-effect',
  debuffEffect: 'relic.mechanic-debuff-effect',
} as const;

export interface RelicRatings {
  frequency: number;
  potency: number;
  buffEffect: number;
  debuffEffect: number;
}

export const ZERO_RELIC_RATINGS: Readonly<RelicRatings> = {
  frequency: 0,
  potency: 0,
  buffEffect: 0,
  debuffEffect: 0,
};

export function relicRatingsFromPassives(passives: PassiveMap): RelicRatings {
  return {
    frequency: passives[RELIC_RATING_KEYS.frequency] ?? 0,
    potency: passives[RELIC_RATING_KEYS.potency] ?? 0,
    buffEffect: passives[RELIC_RATING_KEYS.buffEffect] ?? 0,
    debuffEffect: passives[RELIC_RATING_KEYS.debuffEffect] ?? 0,
  };
}

export function relicRatingsFromEffects(
  effects: Readonly<Record<string, number>> | undefined,
): RelicRatings {
  return {
    frequency: effects?.[RELIC_RATING_KEYS.frequency] ?? 0,
    potency: effects?.[RELIC_RATING_KEYS.potency] ?? 0,
    buffEffect: effects?.[RELIC_RATING_KEYS.buffEffect] ?? 0,
    debuffEffect: effects?.[RELIC_RATING_KEYS.debuffEffect] ?? 0,
  };
}

/** Ratings remain signed, but cannot make a denominator reach zero. */
export const RELIC_RATING_MIN = -0.75;
export const RELIC_RATING_MAX = 2;

export type RelicArchetype =
  | 'cadence'
  | 'cooldown'
  | 'reload'
  | 'dot'
  | 'energy'
  | 'summoner';

export interface RelicCoefficients {
  frequency: number;
  potency: number;
}

/**
 * V1 cross-class balance knobs. Discrete roots use a stronger coefficient where
 * a +10% rating would otherwise round away on their baseline frame.
 */
export const RELIC_COEFFICIENTS: Readonly<Record<RelicArchetype, RelicCoefficients>> = {
  cadence:  { frequency: 2, potency: 1 },
  cooldown: { frequency: 1, potency: 1 },
  reload:   { frequency: 1, potency: 1 },
  dot:      { frequency: 1, potency: 1 },
  energy:   { frequency: 1, potency: 1 },
  summoner: { frequency: 1, potency: 2 },
};

export const RELIC_INTERVAL_FLOORS_MS = {
  cooldown: 100,
  reload: 100,
  dot: 100,
  summoner: 500,
} as const;

function safeRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.max(RELIC_RATING_MIN, Math.min(RELIC_RATING_MAX, rating));
}

function relicFactor(rating: number, coefficient: number): number {
  return Math.max(0.1, 1 + safeRating(rating) * Math.max(0, coefficient));
}

/** Resolve a signed Relic rating into a safe magnitude multiplier. */
export function resolveRelicMagnitudeMultiplier(
  rating: number,
  coefficient = 1,
): number {
  return relicFactor(rating, coefficient);
}

export function resolveRelicInterval(
  baseMs: number,
  frequency: number,
  coefficient: number,
  floorMs: number,
): number {
  return Math.max(floorMs, Math.round(baseMs / relicFactor(frequency, coefficient)));
}

export function resolveRelicGain(
  base: number,
  frequency: number,
  coefficient: number,
  floor: number,
): number {
  return Math.max(floor, Math.round(base * relicFactor(frequency, coefficient)));
}

export function resolveRelicBonusMultiplier(
  baseMultiplier: number,
  potency: number,
  coefficient: number,
): number {
  const bonus = Math.max(0, baseMultiplier - 1);
  return Math.max(1, 1 + bonus * relicFactor(potency, coefficient));
}

export function resolveRelicCount(
  base: number,
  potency: number,
  coefficient: number,
  floor: number,
  cap?: number,
): number {
  let value = Math.max(floor, Math.round(base * relicFactor(potency, coefficient)));
  if (cap !== undefined) value = Math.min(value, cap);
  return value;
}

export interface RelicValue<T> { before: T; after: T }

export interface CadenceRelicProfile {
  archetype: 'cadence';
  threshold: RelicValue<number>;
  empoweredMultiplier: RelicValue<number>;
}

export function resolveCadenceRelicProfile(
  threshold: number,
  empoweredMultiplier: number,
  ratings: RelicRatings,
): CadenceRelicProfile {
  const c = RELIC_COEFFICIENTS.cadence;
  return {
    archetype: 'cadence',
    threshold: {
      before: threshold,
      after: resolveRelicInterval(threshold, ratings.frequency, c.frequency, 2),
    },
    empoweredMultiplier: {
      before: empoweredMultiplier,
      after: resolveRelicBonusMultiplier(empoweredMultiplier, ratings.potency, c.potency),
    },
  };
}

export interface CooldownRelicProfile {
  archetype: 'cooldown';
  cooldownMs: RelicValue<number>;
  empoweredMultiplier: RelicValue<number>;
}

export function resolveCooldownRelicProfile(
  cooldownMs: number,
  empoweredMultiplier: number,
  ratings: RelicRatings,
): CooldownRelicProfile {
  const c = RELIC_COEFFICIENTS.cooldown;
  return {
    archetype: 'cooldown',
    cooldownMs: {
      before: cooldownMs,
      after: resolveRelicInterval(
        cooldownMs, ratings.frequency, c.frequency, RELIC_INTERVAL_FLOORS_MS.cooldown,
      ),
    },
    empoweredMultiplier: {
      before: empoweredMultiplier,
      after: resolveRelicBonusMultiplier(empoweredMultiplier, ratings.potency, c.potency),
    },
  };
}

export interface ReloadRelicProfile {
  archetype: 'reload';
  reloadMs: RelicValue<number>;
  ammoMax: RelicValue<number>;
}

export function resolveReloadRelicProfile(
  reloadMs: number,
  ammoMax: number,
  ratings: RelicRatings,
): ReloadRelicProfile {
  const c = RELIC_COEFFICIENTS.reload;
  return {
    archetype: 'reload',
    reloadMs: {
      before: reloadMs,
      after: resolveRelicInterval(
        reloadMs, ratings.frequency, c.frequency, RELIC_INTERVAL_FLOORS_MS.reload,
      ),
    },
    ammoMax: {
      before: ammoMax,
      after: resolveRelicCount(ammoMax, ratings.potency, c.potency, 1),
    },
  };
}

export interface DotRelicProfile {
  archetype: 'dot';
  tickIntervalMs: RelicValue<number>;
  maxStacks: RelicValue<number>;
  damagePerStackReference: { tickIntervalMs: number; maxStacks: number };
}

export function resolveDotRelicDeliveryProfile(
  tickIntervalMs: number,
  maxStacks: number,
  ratings: RelicRatings,
): DotRelicProfile {
  const c = RELIC_COEFFICIENTS.dot;
  return {
    archetype: 'dot',
    tickIntervalMs: {
      before: tickIntervalMs,
      after: resolveRelicInterval(
        tickIntervalMs, ratings.frequency, c.frequency, RELIC_INTERVAL_FLOORS_MS.dot,
      ),
    },
    maxStacks: {
      before: maxStacks,
      after: resolveRelicCount(maxStacks, ratings.potency, c.potency, 1),
    },
    damagePerStackReference: { tickIntervalMs, maxStacks },
  };
}

export interface EnergyRelicProfile {
  archetype: 'energy';
  gainPerHit: RelicValue<number>;
  maxEnergy: RelicValue<number>;
  dischargeMultiplier: RelicValue<number>;
}

export function resolveEnergyRelicProfile(
  gainPerHit: number,
  maxEnergy: number,
  dischargeMultiplier: number,
  ratings: RelicRatings,
): EnergyRelicProfile {
  const c = RELIC_COEFFICIENTS.energy;
  const effectiveMax = resolveRelicCount(maxEnergy, ratings.potency, c.potency, 1);
  const capacityRatio = effectiveMax / Math.max(1, maxEnergy);
  return {
    archetype: 'energy',
    gainPerHit: {
      before: gainPerHit,
      after: resolveRelicGain(gainPerHit, ratings.frequency, c.frequency, 1),
    },
    maxEnergy: { before: maxEnergy, after: effectiveMax },
    dischargeMultiplier: {
      before: dischargeMultiplier,
      after: Math.max(1, 1 + Math.max(0, dischargeMultiplier - 1) * capacityRatio),
    },
  };
}

export interface SummonerRelicProfile {
  archetype: 'summoner';
  respawnMs: RelicValue<number>;
  summonCount: RelicValue<number>;
}

export function resolveSummonerRelicProfile(
  respawnMs: number,
  summonCount: number,
  ratings: RelicRatings,
  countCap?: number,
): SummonerRelicProfile {
  const c = RELIC_COEFFICIENTS.summoner;
  return {
    archetype: 'summoner',
    respawnMs: {
      before: respawnMs,
      after: resolveRelicInterval(
        respawnMs, ratings.frequency, c.frequency, RELIC_INTERVAL_FLOORS_MS.summoner,
      ),
    },
    summonCount: {
      before: summonCount,
      after: resolveRelicCount(summonCount, ratings.potency, c.potency, 1, countCap),
    },
  };
}

export type ResolvedRelicProfile =
  | CadenceRelicProfile
  | CooldownRelicProfile
  | ReloadRelicProfile
  | DotRelicProfile
  | EnergyRelicProfile
  | SummonerRelicProfile;

/** Character-specific preview authority used by inventory and Forge. */
export function resolveRelicPreview(
  archetype: string | null | undefined,
  passives: PassiveMap,
  ratings: RelicRatings,
  options: { subVariant?: SubVariant | null; playerTier?: number } = {},
): ResolvedRelicProfile | null {
  switch (archetype) {
    case 'cadence': {
      const threshold = Math.max(2, Math.round(
        (passives['cadence.empowered-threshold'] ?? 5)
          + (passives['cadence.threshold-mod'] ?? 0),
      ));
      const mult = (passives['cadence.empowered-mult'] ?? 2)
        + (passives['cadence.damage-mult-add'] ?? 0)
        + (passives['shared.empowered-mult-add'] ?? 0);
      const finalMult = mult * (1 + (passives['weapon.empowered-mult-bonus'] ?? 0));
      return resolveCadenceRelicProfile(threshold, finalMult, ratings);
    }
    case 'cooldown': {
      const ms = Math.max(100, Math.round(passives['cooldown.empowered-cd-ms'] ?? 7000));
      const mult = ((passives['cooldown.empowered-mult'] ?? 2)
        + (passives['shared.empowered-mult-add'] ?? 0))
        * (1 + (passives['weapon.empowered-mult-bonus'] ?? 0));
      return resolveCooldownRelicProfile(ms, mult, ratings);
    }
    case 'reload': {
      const ammo = Math.max(1, Math.round(passives['reload.max-ammo'] ?? 10));
      const base = Math.round(passives['reload.reload-time-ms'] ?? 1600);
      const ms = Math.max(100, Math.round(base * (passives['reload.reload-time-mult'] ?? 1)));
      return resolveReloadRelicProfile(ms, ammo, ratings);
    }
    case 'dot': {
      const profile = resolveDotClassProfile(passives, options.subVariant);
      return resolveDotRelicDeliveryProfile(profile.tickIntervalMs, profile.maxStacks, ratings);
    }
    case 'energy': {
      const perHit = Math.max(1, Math.round(passives['energy.per-hit'] ?? 14));
      const perTier = passives['energy.max-bonus'] ?? 0;
      const tierMult = Math.max(1, (options.playerTier ?? 0) - 4 + 1);
      const max = 100 + (perTier > 0 ? Math.round(perTier * tierMult) : 0);
      const mult = ((passives['energy.empowered-mult'] ?? 2)
        + (passives['shared.empowered-mult-add'] ?? 0))
        * (1 + (passives['weapon.empowered-mult-bonus'] ?? 0));
      return resolveEnergyRelicProfile(perHit, max, mult, ratings);
    }
    case 'summoner': {
      const base = passives['summoner.minion-count'] ?? 3;
      const mult = passives['summoner.minion-count-mult'] ?? 1;
      const count = Math.max(1, Math.floor(base * mult));
      const cap = passives['summoner.minion-count-cap'];
      const capped = cap && cap > 0 ? Math.min(count, Math.floor(cap)) : count;
      const respawn = Math.max(0, Math.round(passives['summoner.minion-respawn-ms'] ?? 5000));
      return resolveSummonerRelicProfile(respawn, capped, ratings, cap);
    }
    default:
      return null;
  }
}
