/**
 * The Conduit's T4 leaves and Souls as numbers (bible §7.7, §7.16): pure, so the server runtime
 * reads one answer. Every number is a PLACEHOLDER the bots and playtests tune; the bible gives
 * the concepts, and only "double strength" (Final Command) is a stated number.
 */

export type ConduitLeafId =
  | 'conduit-burst' | 'conduit-grand-entrance' | 'conduit-devour'
  | 'conduit-avenge' | 'conduit-fall-back' | 'conduit-rally'
  | 'conduit-final-command' | 'conduit-last-stand' | 'conduit-shared-burden';

export const CONDUIT_LEAF_TUNING = {
  /** Burst: a dying summon explodes for this multiple of its own attack, in this radius. */
  burstRadius: 100,
  burstMult: 1.5,
  /** Grand Entrance: a rebuilt summon stuns the enemies within this reach for this long. */
  grandEntranceRadius: 140,
  grandEntranceStunMs: 800,
  /** Devour: after living this long, a summon heals this share of the damage it deals. */
  devourAfterMs: 8_000,
  devourShare: 0.25,
  /** Avenge: each surviving summon strikes the killer once, at this multiple of a normal hit. */
  avengeMult: 1,
  /** Fall Back: under `fallBackBelow` of its HP a summon retreats behind the tanks and mends, and rejoins at `fallBackUntil`. */
  fallBackBelow: 0.35,
  fallBackUntil: 0.75,
  fallBackRegenPctPerSec: 0.1,
  fallBackBehind: 110,
  /** Rally: the Pack Strike mends every summon for this share of its max HP. */
  rallyHealPct: 0.12,
  /** Final Command: a dying elite uses its extra once more at this strength (bible: double). */
  finalCommandMult: 2,
  /** Last Stand: once a fight, an elite that would die holds at 1 HP for this long. */
  lastStandMs: 4_000,
  /** Shared Burden: this share of the damage an elite takes is paid from your HP (never below 1 HP). */
  sharedBurdenShare: 0.3,
} as const;

/** The two new T4 Souls (Graveyard's Charnel-Crown, Trench's Elder Serpent). PLACEHOLDERS. */
export const CONDUIT_SOUL_T4_TUNING = {
  /** Charnel-Crown: an enemy the formation kills rises as a thrall that strikes this long, this often, at this multiple of the owner's attack. */
  thrallMs: 5_000,
  thrallEveryMs: 1_000,
  thrallMult: 0.5,
  thrallCap: 12,
  /** Elder Serpent: every `toughStepSec` of the fight, summons take this much less damage, up to `toughMaxSteps` steps. */
  toughPerStep: 0.05,
  toughStepSec: 10,
  toughMaxSteps: 6,
} as const;

/** The T4 gear jobs as numbers. PLACEHOLDERS. */
export const CONDUIT_GEAR_T4_TUNING = {
  /** Cleave: the splash radius (the share is the weapon's `conduit.cleave-pct`). */
  cleaveRadius: 90,
  /** Tidewater: the debuff count on you at which Recovery doubles. */
  tidewaterDebuffs: 3,
} as const;
