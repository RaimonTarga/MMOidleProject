import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';

export type DotClassElement = 'poison' | 'fire' | 'frost';

export interface DotClassProfile {
  element: DotClassElement;
  conversionPct: number;
  maxStacks: number;
  tickIntervalMs: number;
  durationMs: number;
  dotMechanicMultiplier: number;
}

export const POISON_DOT_PROFILE: DotClassProfile = {
  element: 'poison',
  conversionPct: 0.30,
  maxStacks: 8,
  tickIntervalMs: 1_000,
  durationMs: 5_000,
  dotMechanicMultiplier: 1.20,
};

export const FIRE_DOT_PROFILE: DotClassProfile = {
  element: 'fire',
  conversionPct: 0.50,
  maxStacks: 6,
  tickIntervalMs: 1_500,
  durationMs: 5_500,
  dotMechanicMultiplier: 1.20,
};

export const FROST_DOT_PROFILE: DotClassProfile = {
  element: 'frost',
  conversionPct: 0.70,
  maxStacks: 3,
  tickIntervalMs: 2_000,
  durationMs: 6_500,
  dotMechanicMultiplier: 1.30,
};

export const DOT_CLASS_PROFILE_BY_SUBVARIANT: Record<SubVariant, DotClassProfile> = {
  light: POISON_DOT_PROFILE,
  balanced: FIRE_DOT_PROFILE,
  heavy: FROST_DOT_PROFILE,
};

export function dotClassProfileForSubVariant(
  subVariant: SubVariant | null | undefined,
): DotClassProfile {
  return subVariant ? DOT_CLASS_PROFILE_BY_SUBVARIANT[subVariant] : FIRE_DOT_PROFILE;
}

export function resolveDotClassProfile(
  passives: PassiveMap,
  subVariant: SubVariant | null | undefined,
): DotClassProfile {
  const base = dotClassProfileForSubVariant(subVariant);
  return {
    ...base,
    conversionPct: passives['dot.conversion-pct'] ?? base.conversionPct,
    maxStacks: Math.max(1, Math.round(passives['dot.max-stacks'] ?? base.maxStacks)),
    tickIntervalMs: Math.max(100, Math.round(passives['dot.tick-interval-ms'] ?? base.tickIntervalMs)),
    durationMs: Math.max(100, Math.round(passives['dot.duration-ms'] ?? base.durationMs)),
  };
}

export function computeDotClassDamagePerStack(
  attackBase: number,
  profile: DotClassProfile,
): number {
  return Math.max(
    1,
    Math.round(
      (attackBase *
        profile.conversionPct *
        profile.dotMechanicMultiplier *
        profile.tickIntervalMs) /
        profile.maxStacks /
        1_000,
    ),
  );
}
