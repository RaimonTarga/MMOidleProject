/**
 * The magnitude table — every number a lineage card has (design §9).
 *
 * "One magnitude table per tier. Card numbers derive from a per-tier scalar and a
 * lane budget. Hand-authored numbers per card are forbidden." Authored cards carry
 * no numbers at all (see `types.ts`), so this file is the only place a lineage
 * value can be tuned, and tuning a tier is one row in one table.
 *
 * The resolution formula, for every row and every payoff:
 *
 *     value = unit × TIER_SCALAR[tier] × ROW_SCALAR[row] × PACKET_BUDGET[lane] × faceScalar
 *
 * where `unit` is the natural unit of the stat or payoff kind (a units table, not a
 * tuning table), and `faceScalar` is 1 on the matching frame face and
 * {@link OFF_FACE_SCALAR} off it. Cross-lane cards borrow at `ROW_SCALAR.cross`,
 * which is the single expression of "~50% of the payoff row" (design §4).
 *
 * PROVISIONAL. Nothing here has been through the bench yet — the lane budget check
 * (§9: full rows land within ±10% of the tier median) is Phase 1.5, and the T2–T4
 * columns exist so the shape is testable, not because they are calibrated.
 */
import { BIOME_LEVELS_PER_TIER } from '../../config/gameConfig';
import { globalMasteryRequiredForUpgrade, MAX_UPGRADE } from '../../systems/itemUpgrades';
import type {
  DefensiveFace, LineageStatKey, PacketId, PayoffKind, RowKind,
} from './types';

// ─── The three scalars ───────────────────────────────────────────────────────

/** Highest tier the table describes. Tiers past it hold at the last column. */
export const MAX_LINEAGE_TIER = 4;

/**
 * The tuning knob for a whole band — two columns, because absolute and relative
 * numbers must not climb together.
 *
 *  - `absolute` scales flat quantities (Attack, max HP, on-hit, plating, Recovery,
 *    move speed) so a T4 card keeps pace with T4 damage. Seeded off the existing
 *    weapon curve, where a T1 rapier's 8 Attack becomes 17 at T2.
 *  - `fraction` scales percentages (attack %, attack speed %, and every fractional
 *    payoff: vulnerability, echo share, slow, windows). These are already relative
 *    to numbers that grow on their own, so multiplying them by the absolute column
 *    would double-dip — a 35% echo would become a 385% echo at T4. They climb
 *    gently instead, so a late card feels stronger without the lane breaking.
 *
 * Binary payoffs (stun, cleanse) scale by NEITHER: they either happen or they do
 * not, and their duration is authored once in {@link PAYOFF_UNIT}.
 */
export interface TierScalars {
  absolute: number;
  fraction: number;
}

export const TIER_SCALAR: Record<number, TierScalars> = {
  1: { absolute: 1, fraction: 1 },
  2: { absolute: 2.2, fraction: 1.15 },
  3: { absolute: 5, fraction: 1.32 },
  4: { absolute: 11, fraction: 1.5 },
};

/**
 * One scalar per row. `cross` at 0.5 is design §4's "borrow a second lane's payoff
 * at ~50%"; `amplifier` is deliberately below `payoff` because it modifies a card
 * the player already owns rather than adding a new event.
 */
export const ROW_SCALAR: Record<RowKind, number> = {
  stat: 1,
  payoff: 1,
  amplifier: 0.6,
  keystone: 1.2,
  cross: 0.5,
};

/**
 * The lane budget (design §9). Every packet starts at parity; the bench moves
 * these, one number per lane, when a pure lane lands outside ±10% of the tier
 * median on its favoured variant.
 */
export const PACKET_BUDGET: Record<PacketId, number> = {
  'tempo': 1,
  'empowered': 1,
  'affliction': 1,
  'control': 1,
  'kill-chain': 1,
  'engagement': 1,
  'bulwark': 1,
  'barrier-tempo': 1,
};

/**
 * What a defensive card pays on the wrong frame face (design §3.1). Bias, never
 * lock: target 80%, never 0%. Offensive cards are frame-neutral and never scaled.
 */
export const OFF_FACE_SCALAR = 0.8;

/** Rows already owned at the same tier on another lineage of the slot cost half
 *  on a new tree (design §2). Gates are never discounted. */
export const LINEAGE_SWITCH_DISCOUNT = 0.5;

// ─── Units ───────────────────────────────────────────────────────────────────

/**
 * The value of one stat row at tier scalar 1 — the natural unit of each stat, not
 * a per-tier tuning row. `quantizeStat` decides how each is rounded.
 */
export const STAT_UNIT: Record<LineageStatKey, number> = {
  attack: 3,
  onHitDamage: 2,
  plating: 2,
  damageReduction: 0.02,
  evasion: 0.02,
  maxHp: 12,
  recovery: 1,
  speed: 4,
  attackPct: 0.05,
  attackSpeedPct: 0.06,
};

/** Stats that are fractions and keep three decimals; everything else is an integer. */
const FRACTIONAL_STATS: ReadonlySet<LineageStatKey> = new Set<LineageStatKey>([
  'damageReduction', 'evasion', 'attackPct', 'attackSpeedPct',
]);

export function quantizeStat(key: LineageStatKey, value: number): number {
  if (FRACTIONAL_STATS.has(key)) return Math.round(value * 1000) / 1000;
  return Math.max(1, Math.round(value));
}

export interface PayoffUnit {
  /** Unit magnitude at tier scalar 1. Meaning is per kind — see the comment. */
  magnitude: number;
  /** Unit duration in ms, or absent for instantaneous payoffs. Durations do NOT
   *  scale with tier: a longer window is an amplifier's job, not a tier's. */
  durationMs?: number;
  /** True when the magnitude is a fraction (0–1) and must stay one. */
  fractional: boolean;
  /**
   * True when the payoff is binary — it either happens or it does not, so the
   * tier scalar buys duration-free presence and `magnitude` stays 1.
   */
  binary?: boolean;
}

/**
 * Magnitude meaning per payoff kind:
 *   vulnerability   fraction added to damage taken by the target
 *   plating-shred   fraction of the target's plating removed
 *   echo-hit        fraction of the hit repeated as a second, non-empowered hit
 *   hemorrhage      share of the hit converted into the bleed reservoir
 *   poison-stack    share of the hit converted per stack applied
 *   slow            fraction of move speed removed
 *   stun            binary
 *   damage-window   fraction added through `ctx.metadata.empoweredMultiplier`
 *   speed-window    attack-speed fraction added for the window
 *   recovery-window fraction added to the Recovery rate for the window
 *   ward            fraction of max HP absorbed
 *   cleanse         binary
 *   plating-stack   fraction of base plating gained per stack
 *   engagement-dr   fraction of damage reduced during the opening
 *   contagion       share of the source's stacks copied to a nearby target
 */
const payoffUnitEntries: [PayoffKind, PayoffUnit][] = [
  ['vulnerability',   { magnitude: 0.12, durationMs: 4000, fractional: true }],
  ['plating-shred',   { magnitude: 0.25, durationMs: 4000, fractional: true }],
  ['echo-hit',        { magnitude: 0.35, fractional: true }],
  ['hemorrhage',      { magnitude: 0.20, durationMs: 4000, fractional: true }],
  ['poison-stack',    { magnitude: 0.15, durationMs: 5000, fractional: true }],
  ['slow',            { magnitude: 0.20, durationMs: 2500, fractional: true }],
  ['stun',            { magnitude: 1, durationMs: 750, fractional: false, binary: true }],
  ['damage-window',   { magnitude: 0.15, durationMs: 2000, fractional: true }],
  ['speed-window',    { magnitude: 0.20, durationMs: 2500, fractional: true }],
  ['recovery-window', { magnitude: 0.25, durationMs: 3000, fractional: true }],
  ['ward',            { magnitude: 0.10, durationMs: 5000, fractional: true }],
  ['cleanse',         { magnitude: 1, fractional: false, binary: true }],
  ['plating-stack',   { magnitude: 0.15, durationMs: 4000, fractional: true }],
  ['engagement-dr',   { magnitude: 0.15, durationMs: 3000, fractional: true }],
  ['contagion',       { magnitude: 0.30, durationMs: 4000, fractional: true }],
];

export const PAYOFF_UNIT: Map<PayoffKind, PayoffUnit> = new Map<PayoffKind, PayoffUnit>(payoffUnitEntries);

/**
 * `hit-nth` interval per lane. Tempo fires on every third hit (design §13);
 * Affliction's "a share of each hit" is n = 1. The amplifier row is where a lane
 * buys a shorter interval, so this is per lane, not per tier.
 */
export const TRIGGER_N_BY_LANE: Record<PacketId, number> = {
  'tempo': 3,
  'empowered': 1,
  'affliction': 1,
  'control': 3,
  'kill-chain': 1,
  'engagement': 1,
  'bulwark': 1,
  'barrier-tempo': 1,
};

// ─── Unlock levels (design §4) ───────────────────────────────────────────────

/**
 * Level WITHIN the tier's six at which each row unlocks. The band never gets
 * wider, so each tier adds one row and redistributes the same six levels.
 * T1: stat L2, payoff L4, gate L6 (locked). T2: L2 / L3 / L5, gate L6 (locked).
 * T3 and T4 spread across the band with the gate at the cap.
 */
export const ROW_LOCAL_LEVEL: Record<number, Partial<Record<RowKind, number>>> = {
  1: { stat: 2, payoff: 4 },
  2: { stat: 2, payoff: 3, amplifier: 5 },
  3: { stat: 2, payoff: 3, amplifier: 4, keystone: 5 },
  4: { stat: 1, payoff: 2, amplifier: 3, keystone: 4, cross: 5 },
};

/** The gate sits at full mastery of the tier, every tier. */
export const GATE_LOCAL_LEVEL = BIOME_LEVELS_PER_TIER;

/** Rows a tier's band actually has. */
export function rowsForTier(tier: number): RowKind[] {
  const band = ROW_LOCAL_LEVEL[clampTier(tier)] ?? {};
  return (Object.keys(band) as RowKind[]).sort(
    (a, b) => (band[a] ?? 0) - (band[b] ?? 0),
  );
}

/** Whether `row` exists in `tier`'s band. */
export function tierHasRow(tier: number, row: RowKind): boolean {
  return ROW_LOCAL_LEVEL[clampTier(tier)]?.[row] !== undefined;
}

/** Level within the tier's six at which `row` unlocks, or undefined if absent. */
export function rowLocalLevel(tier: number, row: RowKind): number | undefined {
  return ROW_LOCAL_LEVEL[clampTier(tier)]?.[row];
}

/** Absolute biome level (biome-local, spanning every tier) for a row's unlock. */
export function rowBiomeLevel(tier: number, row: RowKind): number {
  const local = rowLocalLevel(tier, row);
  if (local === undefined) throw new Error(`tier ${tier} has no '${row}' row`);
  return (clampTier(tier) - 1) * BIOME_LEVELS_PER_TIER + local;
}

/** Absolute biome level for a tier's gate. */
export function gateBiomeLevel(tier: number): number {
  return (clampTier(tier) - 1) * BIOME_LEVELS_PER_TIER + GATE_LOCAL_LEVEL;
}

/**
 * Global Mastery required for a row, reusing the per-tier GM band the +1..+5
 * ladder is built on (design §4: "Rows unlock on the same per-tier mastery band
 * that +1..+5 use today, with the gate where +5 sits").
 *
 * The mapping is the ladder's own one: a +N step opened at biome level N+1, so a
 * row at local level L sits on plus-slot L−1, and the gate at local level 6 sits
 * on +5 — full mastery of the tier.
 */
export function lineageMasteryLevelForRow(tier: number, row: RowKind): number {
  const local = rowLocalLevel(tier, row);
  if (local === undefined) throw new Error(`tier ${tier} has no '${row}' row`);
  return globalMasteryRequiredForUpgrade(clampTier(tier), plusSlotForLocalLevel(local));
}

/** Global Mastery required to pay a tier's gate — where +5 sits. */
export function lineageMasteryLevelForGate(tier: number): number {
  return globalMasteryRequiredForUpgrade(clampTier(tier), MAX_UPGRADE);
}

function plusSlotForLocalLevel(local: number): number {
  return Math.min(MAX_UPGRADE, Math.max(1, local - 1));
}

// ─── Costs ───────────────────────────────────────────────────────────────────

/**
 * Essence a row costs at T1, in the lineage's home-biome primary essence. Seeded
 * against the ladder these replace: a T1 weapon's +1..+5 ran 25/50/75/125/155.
 */
export const ESSENCE_BASE: Record<RowKind, number> = {
  stat: 30,
  payoff: 90,
  amplifier: 70,
  keystone: 140,
  cross: 110,
};

/** Essence a gate costs at T1, on top of the capstone material. */
export const GATE_ESSENCE_BASE = 180;

/** Per-tier multiplier on essence costs. Mirrors how steeply recipe costs climb. */
export const ESSENCE_TIER_MULT: Record<number, number> = {
  1: 1,
  2: 3.5,
  3: 9,
  4: 22,
};

/** Shards a row costs at T1, in the card's own lane's shard. */
export const SHARD_BASE: Record<RowKind, number> = {
  stat: 3,
  payoff: 8,
  amplifier: 6,
  keystone: 12,
  cross: 10,
};

/** Shards a gate costs at T1, in the lane its form crowns. */
export const GATE_SHARD_BASE = 10;

/**
 * Shards a single kill drops, before the tier multiplier and the reward
 * multipliers. Design §12: "every kill drops a small amount of the mob family's
 * shard, deterministically."
 *
 * Deliberately not the binding cost. A T1 band is 33 shards across three lanes
 * against 360 essence, so essence pays the bulk and the shard says WHERE you
 * farmed — which is the point of keying materials by packet rather than biome.
 */
export const SHARD_BASE_PER_KILL = 1;

/**
 * Per-tier multiplier on shard costs AND shard drops — the same curve on both
 * sides, which is what design §12's "drop quantity and card cost scale by tier
 * with the same kind of multiplier essence uses" asks for. Far shallower than
 * the essence curve, so lower-tier farming stays a slow but legal route.
 */
export const SHARD_TIER_MULT: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
};

/** Boss capstone materials a gate costs — that many boss kills, every tier. */
export const GATE_CAPSTONE_AMOUNT: Record<number, number> = {
  1: 3,
  2: 3,
  3: 4,
  4: 5,
};

// ─── Resolution helpers ──────────────────────────────────────────────────────

export function clampTier(tier: number): number {
  return Math.min(MAX_LINEAGE_TIER, Math.max(1, Math.floor(tier)));
}

/** Whether a value is a percentage of something that already scales. */
export type ScaleKind = 'absolute' | 'fraction';

export function tierScalar(tier: number, kind: ScaleKind): number {
  const scalars = TIER_SCALAR[clampTier(tier)];
  return (kind === 'fraction' ? scalars?.fraction : scalars?.absolute) ?? 1;
}

/** 1 on the matching face, {@link OFF_FACE_SCALAR} off it, 1 for offensive cards. */
export function faceScalar(cardFace: DefensiveFace | undefined, frameFace: DefensiveFace | undefined): number {
  if (!cardFace || !frameFace) return 1;
  return cardFace === frameFace ? 1 : OFF_FACE_SCALAR;
}

/** The full multiplier a card's numbers are scaled by. */
export function cardScalar(params: {
  tier: number;
  row: RowKind;
  lane: PacketId;
  kind: ScaleKind;
  cardFace?: DefensiveFace;
  frameFace?: DefensiveFace;
}): number {
  return tierScalar(params.tier, params.kind)
    * (ROW_SCALAR[params.row] ?? 1)
    * (PACKET_BUDGET[params.lane] ?? 1)
    * faceScalar(params.cardFace, params.frameFace);
}

/** The resolved value of a stat row. */
export function statRowValue(params: {
  statKey: LineageStatKey;
  tier: number;
  lane: PacketId;
  cardFace?: DefensiveFace;
  frameFace?: DefensiveFace;
}): number {
  const kind: ScaleKind = FRACTIONAL_STATS.has(params.statKey) ? 'fraction' : 'absolute';
  const raw = STAT_UNIT[params.statKey] * cardScalar({ ...params, row: 'stat', kind });
  return quantizeStat(params.statKey, raw);
}

/** The resolved magnitude and duration of a payoff. */
export function payoffValue(params: {
  payoff: PayoffKind;
  tier: number;
  row: RowKind;
  lane: PacketId;
  cardFace?: DefensiveFace;
  frameFace?: DefensiveFace;
}): { magnitude: number; durationMs?: number } {
  const unit = PAYOFF_UNIT.get(params.payoff);
  if (!unit) throw new Error(`unknown payoff kind '${params.payoff}'`);

  // A binary payoff has nothing to scale: it happens or it does not, and a stun
  // that grew with the tier scalar would be an eight-second stun at T4.
  if (unit.binary) return { magnitude: unit.magnitude, durationMs: unit.durationMs };

  const kind: ScaleKind = unit.fractional ? 'fraction' : 'absolute';
  const scaled = unit.magnitude * cardScalar({ ...params, kind });
  return {
    // Durations do NOT scale with tier — a longer window is an amplifier's job.
    magnitude: unit.fractional ? Math.round(scaled * 1000) / 1000 : Math.round(scaled),
    durationMs: unit.durationMs,
  };
}

/** Essence a row costs, before any lineage-switch discount. */
export function rowEssenceCost(tier: number, row: RowKind): number {
  return Math.round(ESSENCE_BASE[row] * (ESSENCE_TIER_MULT[clampTier(tier)] ?? 1));
}

/** Shards a row costs, before any lineage-switch discount. */
export function rowShardCost(tier: number, row: RowKind): number {
  return Math.round(SHARD_BASE[row] * (SHARD_TIER_MULT[clampTier(tier)] ?? 1));
}

export function gateEssenceCost(tier: number): number {
  return Math.round(GATE_ESSENCE_BASE * (ESSENCE_TIER_MULT[clampTier(tier)] ?? 1));
}

export function gateShardCost(tier: number): number {
  return Math.round(GATE_SHARD_BASE * (SHARD_TIER_MULT[clampTier(tier)] ?? 1));
}

export function gateCapstoneAmount(tier: number): number {
  return GATE_CAPSTONE_AMOUNT[clampTier(tier)] ?? 1;
}

/** `hit-nth` interval for a lane. */
export function triggerNForLane(lane: PacketId): number {
  return TRIGGER_N_BY_LANE[lane] ?? 1;
}
