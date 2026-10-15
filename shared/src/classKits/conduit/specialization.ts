/**
 * The Conduit's specializations as numbers (bible §7.6, the T3 pick): pure, so the config check
 * and the server runtime read one answer. Every number is a PLACEHOLDER the bots and playtests
 * tune; the bible gives the concepts, and only Colossus's +100% HP / +50% damage is a stated
 * starting point.
 */

export type ConduitSpecializationId =
  | 'conduit-burn-bright' | 'conduit-legion' | 'conduit-infestation'
  | 'conduit-shield-wall' | 'conduit-the-hunt' | 'conduit-choir'
  | 'conduit-colossus' | 'conduit-ascendant' | 'conduit-two-souls';

const IDS: readonly string[] = [
  'conduit-burn-bright', 'conduit-legion', 'conduit-infestation',
  'conduit-shield-wall', 'conduit-the-hunt', 'conduit-choir',
  'conduit-colossus', 'conduit-ascendant', 'conduit-two-souls',
];

export function isConduitSpecialization(id: string | null | undefined): id is ConduitSpecializationId {
  return id != null && IDS.includes(id);
}

export const CONDUIT_SPECIALIZATION_TUNING = {
  /** Burn Bright: a fresh summon attacks this much faster (a fraction) for this long, then burns out. */
  burnBrightMs: 6_000,
  burnBrightHaste: 0.6,
  /** Legion: at these copy counts of one summon, every copy hits and endures this much more (visible steps, never per copy). */
  legionSteps: [
    { copies: 4, damagePct: 0.25, hpPct: 0.15 },
    { copies: 8, damagePct: 0.6, hpPct: 0.3 },
  ],
  /** Infestation: a hit adds ticks of a poison-shaped infestation worth this share of the hit; an infested enemy that dies bursts. */
  infestTickShare: 0.15,
  infestTicksPerHit: 2,
  infestMaxTicks: 16,
  infestTickMs: 1_000,
  infestBurstRadius: 120,
  infestBurstMult: 1.5,
  /** ...and (T4) rises as this many short-lived husks that strike for this long, this often, at this multiple of your attack. */
  infestHusks: 3,
  infestHuskMs: 5_000,
  infestHuskEveryMs: 1_000,
  infestHuskMult: 0.4,
  /** Shield Wall: each different kind of tank beyond the first takes this much more off the damage a tank soaks. */
  shieldWallLayerRelief: 0.1,
  /** The Hunt: a different damage summon that hit the target within this window adds this much to everyone's damage on it. */
  huntWindowMs: 5_000,
  huntPerType: 0.15,
  /** Choir: a support's ability echoes through every other support type at this share of its strength. */
  choirEcho: 0.5,
  /** Colossus: summons grow to this multiple of the BASE summon's HP and damage (replacing Elite's own step), and every hit shakes the ground. */
  colossusHpMult: 2,
  colossusDamageMult: 1.5,
  colossusShockRadius: 110,
  colossusShockShare: 0.35,
  /** Ascendant: damage grows this much per second of the fight, up to the cap in seconds. */
  ascendantPerSec: 0.01,
  ascendantMaxSec: 40,
  /** Two Souls: with two Souls out, each is this much stronger. */
  twoSoulsBuff: 0.25,
} as const;
