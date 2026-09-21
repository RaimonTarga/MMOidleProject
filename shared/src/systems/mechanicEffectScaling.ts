import type { StatusEffectConfig } from '../components/combat/tracksCombat';

export type MechanicMagnitudeFieldKind =
  | 'fraction'
  | 'multiplier'
  | 'flat'
  | 'damage-per-stack';

export interface ScalableMechanicEffect {
  fields: Readonly<Record<string, MechanicMagnitudeFieldKind>>;
}

/**
 * Explicit opt-in registry for beneficial effects emitted by class mechanics.
 * Defensive, healing, shielding, duration, timing, and stack-cap fields are
 * intentionally absent from v1.
 */
export const SCALABLE_MECHANIC_BUFFS: Readonly<Record<string, ScalableMechanicEffect>> = {
  'cadence-echo': { fields: { damageBonus: 'fraction' } },
  'cooldown-overdrive': { fields: { attackSpeedPct: 'fraction' } },
  'reload-hair-trigger': { fields: { attackSpeedPctPerShot: 'fraction' } },
  'dot-frenzy': { fields: { attackSpeedPct: 'fraction', onHitPerTier: 'flat' } },
  'energy-overdrive': { fields: { attackDamagePct: 'fraction' } },
  // Grand Ritual's empowered-attack multiplier. 1.6 means the bonus is the
  // 0.6 above ×1, so the field kind is 'multiplier', not 'flat'.
  'summoner-grand-ritual': { fields: { damageMult: 'multiplier' } },
  // Berserker Rampage's two beneficial per-stack magnitudes only. The regular-
  // attack penalty (an authored downside) and the Cadence threshold reduction
  // (delivery frequency, which overlaps Relic Mechanic Frequency) are both
  // deliberately absent.
  'cadence-rampage': { fields: { multPerStack: 'fraction', apsPerStackMs: 'flat' } },
} as const;

/** Explicit opt-in registry for harmful class-mechanic effects. */
export const SCALABLE_MECHANIC_DEBUFFS: Readonly<Record<string, ScalableMechanicEffect>> = {
  'dot': { fields: { damagePerStack: 'damage-per-stack' } },
  'cadence-hemorrhage': { fields: { damagePerTick: 'damage-per-stack' } },
  'vulnerability': { fields: { damageMultiplier: 'multiplier' } },
  'plating-shred': { fields: { platingReduction: 'fraction' } },
  'brittle': { fields: { platingPerStack: 'fraction', drPerStack: 'fraction' } },
  'dot-chill': { fields: { moveSlowPerStack: 'fraction', attackSlowPerStack: 'fraction' } },
  'dot-frostbite': { fields: { dotTakenPerStack: 'fraction' } },
  'reload-suppress-shred': { fields: { platingReduction: 'fraction' } },
  // Harrier Brood's per-mark damage-taken magnitude, read from specialization
  // tuning rather than status-effect data.
  'summoner-harrier-brood': { fields: { damageTakenPctPerSlot: 'fraction' } },
  // Withering Chorus's per-voice proc-damage magnitude.
  'summoner-withering-chorus': { fields: { damagePctPerSlot: 'fraction' } },
  // Endless Storm (Tempest) tick damage, captured at cast time in status data.
  'energy-storm': { fields: { damagePerTick: 'flat' } },
  // Winter Warden's Frozen payoff: only the damage-taken magnitude, not the
  // freeze trigger, duration, or Chill threshold that produces it.
  'dot-frozen': { fields: { damageTakenPct: 'fraction' } },
} as const;

export function scaleMechanicEffectConfig(
  config: StatusEffectConfig,
  magnitudeMult: number,
  registry: Readonly<Record<string, ScalableMechanicEffect>>,
): StatusEffectConfig {
  const entry = registry[config.id];
  if (!entry || magnitudeMult === 1 || !config.data) return config;

  const data = { ...config.data };
  let changed = false;
  for (const [field, kind] of Object.entries(entry.fields)) {
    const value = data[field];
    if (typeof value !== 'number') continue;
    data[field] = kind === 'multiplier'
      ? 1 + (value - 1) * magnitudeMult
      : value * magnitudeMult;
    changed = true;
  }
  return changed ? { ...config, data } : config;
}

/** Scale one approved magnitude for mechanics represented outside status data. */
export function scaleMechanicMagnitude(
  effectId: string,
  field: string,
  value: number,
  magnitudeMult: number,
  registry: Readonly<Record<string, ScalableMechanicEffect>>,
): number {
  const kind = registry[effectId]?.fields[field];
  if (!kind || magnitudeMult === 1) return value;
  return kind === 'multiplier'
    ? 1 + (value - 1) * magnitudeMult
    : value * magnitudeMult;
}
