import type { StatusEffectConfig } from '../components/combat/tracksCombat';

/**
 * Which debuffs a Core may scale, and which of their `data` fields count as potency.
 *
 * WHY A REGISTRY AND NOT A BLANKET MULTIPLIER: `applyStatusEffect` has ~69 call
 * sites, and most of them are not debuffs at all — class resource clocks, self
 * buffs, monster-applied effects on the player, paired stack timers. Threading a
 * source multiplier through that function would scale all of them, and every future
 * status effect would silently opt in. Several would break outright: a resource
 * clock that runs 25% longer desynchronises its own mechanic.
 *
 * So a Core scales only what is named here. Same fencing pattern as
 * TECHNIQUE_POWER_FIELDS in abilities.ts, for the same reason.
 *
 * RULES FOR ADDING AN ENTRY:
 *  1. Player -> MONSTER only. Never register an effect a monster applies to the
 *     player (`slow` is the trap: it looks like a control debuff, but it is applied
 *     BY monsters and by dungeon hazards, so scaling it would buff the enemy).
 *  2. Never register an effect whose duration is load-bearing for a class's own
 *     timing — resource clocks, paired stack timers, anything another system reads
 *     as a cadence rather than as a debuff.
 *  3. Name the potency fields explicitly. An empty list means duration-only.
 */

/**
 * How a potency field encodes its magnitude, which decides how it must be scaled.
 *
 * This distinction is not cosmetic. `damageMultiplier` holds 1.20 for "+20% damage
 * taken". Scaling that number directly by a +12% core gives 1.344 — a +34.4% debuff,
 * nearly triple the intended increase. The excess above 1 is the actual magnitude,
 * so that is what gets scaled.
 */
export type DebuffFieldKind =
  /** 0.20 means +20%. Scale the value directly. */
  | 'fraction'
  /** 1.20 means +20%. Scale only the excess above 1. */
  | 'multiplier';

export interface ScalableDebuff {
  /** Potency fields in `data`, with how each encodes its magnitude. */
  fields: Readonly<Record<string, DebuffFieldKind>>;
  /**
   * False when the effect carries no meaningful timer — a stack-based debuff with
   * `remainingMs: -1`, where -1 is a "no timer" sentinel and scaling it produces
   * nonsense. Defaults to true.
   */
  scalesDuration?: boolean;
}

export const SCALABLE_DEBUFFS: Readonly<Record<string, ScalableDebuff>> = {
  // Cadence Cursed Finale + the Plague Axe dead swing.
  'vulnerability':   { fields: { damageMultiplier: 'multiplier' } },
  // Expose Weakness (Technique ability).
  'expose-weakness': { fields: { damageTakenPct: 'fraction' } },
  // Frost brittle + the weapon brittle shred. Both are per-stack armour strip.
  'brittle':         { fields: { platingPerStack: 'fraction', drPerStack: 'fraction' } },
  // Weapon brittle-shatter DR strip — a pure window, no magnitude of its own.
  'dr-shatter':      { fields: {} },
  // Frost chill: per-stack move + attack slow. The Controller's control identity.
  'dot-chill':       { fields: { moveSlowPerStack: 'fraction', attackSlowPerStack: 'fraction' } },
  // Frost frostbite: raises DoT damage the target takes.
  'dot-frostbite':   { fields: { dotTakenPerStack: 'fraction' } },
  // Cadence plating shred: stack-based with remainingMs -1, so potency only. Its
  // own hard cap (cadence.debuff-shred-cap) still applies downstream.
  'plating-shred':   { fields: { platingReduction: 'fraction' }, scalesDuration: false },
  // Reload suppressing fire: same stack-based shape as plating-shred.
  'reload-suppress-shred': { fields: { platingReduction: 'fraction' }, scalesDuration: false },
} as const;

/** Duration field mirrored into `data` so buff-bar clocks read the scaled value. */
const TOTAL_MS_FIELD = 'totalMs';

/**
 * Return a copy of `config` with its duration and registered potency fields scaled.
 * Unregistered effects are returned untouched, so calling this on a non-debuff is
 * safe — the registry, not the call site, decides what scales.
 *
 * `remainingMs <= 0` is left alone: 0 and -1 are "no timer" sentinels, and -1 is
 * how a permanent stack-based debuff declares itself.
 */
export function scaleDebuffConfig(
  config: StatusEffectConfig,
  durationMult: number,
  potencyMult: number,
): StatusEffectConfig {
  const entry = SCALABLE_DEBUFFS[config.id];
  if (!entry) return config;

  const scaleDuration = (entry.scalesDuration ?? true) && durationMult !== 1;
  const fieldNames = Object.keys(entry.fields);
  const scalePotency = potencyMult !== 1 && fieldNames.length > 0;
  if (!scaleDuration && !scalePotency) return config;

  const next: StatusEffectConfig = { ...config };

  if (scaleDuration && (config.remainingMs ?? -1) > 0) {
    next.remainingMs = Math.round(config.remainingMs! * durationMult);
  }

  if (scalePotency || scaleDuration) {
    const data = { ...(config.data ?? {}) };

    if (scalePotency) {
      for (const [field, kind] of Object.entries(entry.fields)) {
        const value = data[field];
        if (typeof value !== 'number') continue;
        data[field] = kind === 'multiplier'
          // 1.20 -> the magnitude is the 0.20, so scale that and re-add the base.
          ? 1 + (value - 1) * potencyMult
          : value * potencyMult;
      }
    }

    // Slow/root-style effects store totalMs for the buff-bar clock. If the real
    // duration moved, this has to move with it or the UI clock runs against a
    // denominator that no longer exists.
    if (scaleDuration && typeof data[TOTAL_MS_FIELD] === 'number' && next.remainingMs !== undefined) {
      data[TOTAL_MS_FIELD] = next.remainingMs;
    }

    next.data = data;
  }

  return next;
}
