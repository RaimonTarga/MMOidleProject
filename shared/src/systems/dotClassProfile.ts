import type { PassiveMap } from '../passives';
import { SKILL_TREE, type SubVariant } from '../data/skillTree';

export type DotClassElement = 'poison' | 'fire' | 'frost';

export interface DotClassProfile {
  element: DotClassElement;
  conversionPct: number;
  maxStacks: number;
  tickIntervalMs: number;
  durationMs: number;
  dotMechanicMultiplier: number;
}

/**
 * The DoT baseline lives in the class root nodes (`shared/src/data/skillTree/rootsAndFrames.ts`)
 * so every tunable number for a path sits next to its stat budget. This file is a thin
 * adapter: it reads those nodes' `mechanicEffects` into typed profiles, attaches the
 * cosmetic element, and exposes the resolve/compute helpers the combat code calls.
 *
 * `element` is presentation flavor only — the live tick color is resolved by
 * `dotElementForPlayer` (which also accounts for higher-tier path passives).
 */
interface SubVariantDotMeta {
  rootId: string;
  element: DotClassElement;
}

const DOT_SUBVARIANT_META: Record<SubVariant, SubVariantDotMeta> = {
  light: { rootId: 'dot-light', element: 'poison' },
  balanced: { rootId: 'dot-balanced', element: 'fire' },
  heavy: { rootId: 'dot-heavy', element: 'frost' },
};

// Defensive defaults, used only if a root somehow omits a key. Real values come
// from the root node `mechanicEffects` below.
const DOT_PROFILE_FALLBACK = {
  conversionPct: 0.5,
  maxStacks: 6,
  tickIntervalMs: 1_500,
  durationMs: 5_500,
  dotMechanicMultiplier: 1.2,
} as const;

function buildBaseProfile(subVariant: SubVariant): DotClassProfile {
  const meta = DOT_SUBVARIANT_META[subVariant];
  const m = SKILL_TREE.get(meta.rootId)?.mechanicEffects ?? {};
  return {
    element: meta.element,
    conversionPct: m['dot.conversion-pct'] ?? DOT_PROFILE_FALLBACK.conversionPct,
    maxStacks: m['dot.max-stacks'] ?? DOT_PROFILE_FALLBACK.maxStacks,
    tickIntervalMs: m['dot.tick-interval-ms'] ?? DOT_PROFILE_FALLBACK.tickIntervalMs,
    durationMs: m['dot.duration-ms'] ?? DOT_PROFILE_FALLBACK.durationMs,
    dotMechanicMultiplier: m['dot.mechanic-mult'] ?? DOT_PROFILE_FALLBACK.dotMechanicMultiplier,
  };
}

export const POISON_DOT_PROFILE: DotClassProfile = buildBaseProfile('light');
export const FIRE_DOT_PROFILE: DotClassProfile = buildBaseProfile('balanced');
export const FROST_DOT_PROFILE: DotClassProfile = buildBaseProfile('heavy');

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
    dotMechanicMultiplier: passives['dot.mechanic-mult'] ?? base.dotMechanicMultiplier,
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
