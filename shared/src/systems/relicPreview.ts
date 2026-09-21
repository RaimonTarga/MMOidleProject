import { relicEffectPreview, type RelicEffectNote } from './relicEffectPreview';
import type { PassiveMap } from '../passives';
import type { SubVariant } from '../data/skillTree';
import { resolveDotClassProfile, resolveDotStackCap } from './dotClassProfile';
import { resolveSummonerProfile } from './summonerProfile';
import { resolveEnergyMaxBeforeRelic } from './energyMax';
import { resolveLaserRelicProfile } from './laserProfile';
import { ZERO_RELIC_RATINGS, resolveCadenceRelicProfile, resolveCooldownRelicProfile, resolveReloadRelicProfile, resolveDotRelicDeliveryProfile, resolveEnergyRelicProfile, type RelicRatings, type ResolvedRelicProfile } from './relics';

/** Character-specific preview authority used by inventory and Forge. */
function resolvePrimaryRelicPreview(
  archetype: string | null | undefined,
  passives: PassiveMap,
  ratings: RelicRatings,
  options: { subVariant?: SubVariant | null; playerTier?: number; unlockedSkills?: readonly string[]; selectedRange?: string | null; rampageStacks?: number; momentumStacks?: number } = {},
): ResolvedRelicProfile | null {
  switch (archetype) {
    case 'cadence': {
      const threshold = Math.max(2, Math.round(
        (passives['cadence.empowered-threshold'] ?? 5)
          + (passives['cadence.threshold-mod'] ?? 0) - (options.rampageStacks ?? 0),
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
      if ((passives['reload.laser'] ?? 0) > 0) return resolveLaserRelicProfile(passives, ratings);
      const ammo = Math.max(1, Math.round(passives['reload.max-ammo'] ?? 10));
      const base = Math.round(passives['reload.reload-time-ms'] ?? 1600);
      const momentum = (passives['reload.momentum'] ?? 0) > 0 ? Math.max(passives['reload.momentum-reload-reduction-floor'] ?? 0.3, 1 - (options.momentumStacks ?? 0) * (passives['reload.momentum-reload-reduction'] ?? 0.1)) : 1;
      const ms = Math.max(100, Math.round(base * (passives['reload.reload-time-mult'] ?? 1) * momentum));
      return resolveReloadRelicProfile(ms, ammo, ratings);
    }
    case 'dot': {
      const profile = resolveDotClassProfile(passives, options.subVariant);
      return resolveDotRelicDeliveryProfile(profile.tickIntervalMs, resolveDotStackCap(passives, profile.maxStacks), ratings);
    }
    case 'energy': {
      const flash = (passives['energy.flash'] ?? 0) > 0;
      const perHit = flash ? Math.max(0, passives['energy.flash-energy-per-hit'] ?? 5) : Math.max(1, Math.round(passives['energy.per-hit'] ?? 14));
      const max = resolveEnergyMaxBeforeRelic(passives, options.playerTier ?? 0);
      const mult = ((passives['energy.empowered-mult'] ?? 2)
        + (passives['shared.empowered-mult-add'] ?? 0))
        * (1 + (passives['weapon.empowered-mult-bonus'] ?? 0));
      return {
        ...resolveEnergyRelicProfile(perHit, max, mult, ratings),
        gainPerHitLabel: (['energy.alternating-currents', 'energy.capacitor-shunt', 'energy.binary-cycle', 'energy.critical-mass', 'energy.singularity-execute'] as const).some(key => (passives[key] ?? 0) > 0)
          ? 'Energy gain per hit before phase bonuses or splitting' : undefined,
        dischargeSuppressed: (['energy.flash', 'energy.micro-venting', 'energy.alternating-currents', 'energy.overdrive', 'energy.upkeep'] as const).some(key => (passives[key] ?? 0) > 0),
      };
    }
    case 'summoner': {
      const input = { selectedSubVariant: options.subVariant ?? null, selectedRange: options.selectedRange ?? null, unlockedSkills: options.unlockedSkills ?? [], passives };
      const before = resolveSummonerProfile({ ...input, relicRatings: ZERO_RELIC_RATINGS });
      const after = resolveSummonerProfile({ ...input, relicRatings: ratings });
      return {
        archetype: 'summoner',
        summonCount: { before: before.slots.length, after: after.slots.length },
        respawnMs: { before: before.reconstructionIntervalMs, after: after.reconstructionIntervalMs },
        ...(before.slots.some(slot => slot.role !== 'normal') ? { summonPower: { before: 1, after: after.formationOffenseMult / before.formationOffenseMult } } : {}),
      };
    }
    default:
      return null;
  }
}

export function resolveRelicPreview(
  archetype: string | null | undefined,
  passives: PassiveMap,
  ratings: RelicRatings,
  options: { subVariant?: SubVariant | null; playerTier?: number; unlockedSkills?: readonly string[]; selectedRange?: string | null; rampageStacks?: number; momentumStacks?: number } = {},
): ResolvedRelicProfile | null {
  const profile = resolvePrimaryRelicPreview(archetype, passives, ratings, options);
  const secondaryEffects = relicEffectPreview(archetype, passives, ratings, {
    tier: options.playerTier,
    subVariant: options.subVariant,
    unlockedSkills: options.unlockedSkills,
  });
  const secondaryNotes: RelicEffectNote[] = [];
  if (ratings.buffEffect !== 0 && !secondaryEffects.some(effect => effect.kind === 'buff')) secondaryNotes.push({ kind: 'buff', message: 'No eligible mechanic buff in this build' });
  if (ratings.debuffEffect !== 0 && !secondaryEffects.some(effect => effect.kind === 'debuff')) secondaryNotes.push({ kind: 'debuff', message: 'No eligible mechanic debuff in this build' });
  return profile ? { ...profile, secondaryEffects, secondaryNotes } : null;
}

/** Compare two equipped choices rather than silently comparing both against no relic. */
export function resolveRelicComparison(
  archetype: string | null | undefined,
  passives: PassiveMap,
  current: RelicRatings,
  proposed: RelicRatings,
  options: Parameters<typeof resolveRelicPreview>[3] = {},
): ResolvedRelicProfile | null {
  const before = resolveRelicPreview(archetype, passives, current, options);
  const after = resolveRelicPreview(archetype, passives, proposed, options);
  if (!before || !after || before.archetype !== after.archetype) return after;
  for (const key of Object.keys(after)) {
    const oldValue = (before as unknown as Record<string, unknown>)[key];
    const newValue = (after as unknown as Record<string, unknown>)[key];
    if (oldValue && newValue && typeof oldValue === 'object' && typeof newValue === 'object' && 'after' in oldValue && 'before' in newValue) {
      newValue.before = oldValue.after;
    }
  }
  after.secondaryEffects = after.secondaryEffects?.map(effect => ({ ...effect, before: before.secondaryEffects?.find(previous => previous.label === effect.label)?.after ?? effect.before }));
  return after;
}
