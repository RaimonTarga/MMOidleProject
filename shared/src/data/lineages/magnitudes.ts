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
import { BIOME_LEVELS_PER_TIER, GAME_CONFIG } from '../../config/gameConfig';
import { globalMasteryRequiredForUpgrade, MAX_UPGRADE } from '../../systems/itemUpgrades';
import type {
  DefensiveFace, LineageStatKey, PacketId, PayoffKind, RowKind, TriggerKind,
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
 * What an ABILITY node pays, as a share of the row it borrows from (design §19).
 *
 * An ability node is not a lineage row: it hangs a packet's payoff off an ability
 * the player already paid for, fires on that ability's own cadence rather than on
 * a lane trigger, and is one purchase instead of a whole band. So it gets its own
 * column rather than reusing {@link ROW_SCALAR} — "half a payoff row" and "what
 * an ability amplifier is worth" must be tunable for abilities without moving
 * every lineage card in the game.
 *
 *  - `packet`    the fraction of a full payoff row the node's payoff is worth.
 *  - `amplifier` the boost the amplifier node's axis applies, exactly as
 *    `ROW_SCALAR.amplifier` does for a lineage amplifier — seeded at the same
 *    value deliberately, so the two read alike until a bench separates them.
 *
 * PROVISIONAL, like the rest of this table: nothing here has been benched.
 */
export const ABILITY_NODE_SHARE: Record<'packet' | 'amplifier', number> = {
  packet: 0.5,
  amplifier: 0.6,
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
  // The ninth packet enters at parity like every other one (design §22 ships it,
  // §9 decides what it is worth, and only the bench may move this number).
  'technique': 1,
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
 *
 * THE T1 LEAN (design §24.2, 2026-10-03): "a real stat move of 8–10% in the lane's
 * scaling stat". The seven weapon lanes' units were re-pitched to that band, each
 * a PROVISIONAL pick for the designer:
 *
 *  - `attackSpeedPct` / `attackPct` / `techniquePowerPct` 0.09 — the middle of the
 *    band. (Technique power was 0.10, sized as "twice attackPct" when attackPct
 *    was 0.05; the lean puts all three percentage lanes at one number.)
 *  - `dotPotencyPct` 0.10 — the top of the band, because it adds into
 *    `dot.mechanic-mult` (base 1.15–1.25), so +0.10 there is +8–8.7% DoT damage.
 *  - `attack` 3 — unchanged: ≈ +10% of a ~29-Attack T1 weapon.
 *  - `speed` 11 — 9% of the reference player's base move speed
 *    (`GAME_CONFIG.PLAYER_SPEED` 120 × 0.09 = 10.8 → 11). Note the tier scalar's
 *    `absolute` column climbs ×11 by T4 (→ 121), which no other move-speed source
 *    does: a designer call before any T2+ Kill-chain stat row is benched.
 *
 * These units also feed every T2+ stat row through the tier scalar.
 */
export const STAT_UNIT: Record<LineageStatKey, number> = {
  attack: 3,
  onHitDamage: 2,
  plating: 2,
  damageReduction: 0.02,
  evasion: 0.02,
  maxHp: 12,
  recovery: 1,
  speed: 11,
  attackPct: 0.09,
  attackSpeedPct: 0.09,
  techniquePowerPct: 0.09,
  dotPotencyPct: 0.10,
};

/** Stats that are fractions and keep three decimals; everything else is an integer. */
const FRACTIONAL_STATS: ReadonlySet<LineageStatKey> = new Set<LineageStatKey>([
  'damageReduction', 'evasion', 'attackPct', 'attackSpeedPct', 'techniquePowerPct',
  'dotPotencyPct',
]);

/** Whether a stat row's value is a fraction (shown as a percentage). */
export function isFractionalStat(key: LineageStatKey): boolean {
  return FRACTIONAL_STATS.has(key);
}

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
  /**
   * True for the event-shaped T1 payloads (design §24.1): the unit is a value PER
   * FIRING — a multiplier, a share of a whole swing — never divided by the
   * trigger rate and never tier-scaled. A ×2 lunge divided by a hit-rate is not a
   * smaller lunge, it is a hit that does less than nothing extra.
   */
  perFiring?: boolean;
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
 *   technique-refund fraction taken off the REMAINING cooldown of each Technique
 *   technique-window fraction the next Technique's hit is empowered by
 *   evasion-window  flat evade (dodge) chance added to the player for the window
 *   big-hit         multiplier on the triggering hit (2 = double)
 *   mechanic-proxy  multiplier for a root with no damage-multiplier mechanic of
 *                   its own; every other root uses its own empowered multiplier
 *   heal-and-load   fraction of max HP healed (the load is `loadMultiplier`)
 *   root            binary
 *   redose          share of what the target's player DoTs still owe, added as
 *                   a lineage bleed (1 = doubles the affliction)
 *
 * The last five are the T1 composition payloads (design §24.2). The numbers the
 * T1 band actually fires are in {@link PACKET_HALF_NUMBERS}; their entries here
 * are the units a hand-authored (legacy-shaped) card using the kind would get.
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
  // The Technique packet (design §22). Both units are PER-PULL totals like every
  // other row here, so they are divided by `TRIGGER_FIRES_PER_PULL`'s
  // `technique-cast` figure before a card sees them.
  //
  // `technique-refund` is pitched at the echo's per-pull unit: across one pull a
  // Technique build hands itself back about a third of a Technique cooldown. It
  // carries NO duration — a refund happens and is over, and the amplifier axis
  // `nodePayoffAxis` picks for it is `magnitude` for exactly that reason.
  //
  // `technique-window` is twice `damage-window`'s per-pull unit on purpose. A
  // `damage-window` empowers EVERY hit that lands inside it; this one empowers
  // the next Technique and then closes, so the same per-pull total would be a
  // fraction of the value at the same price.
  ['technique-refund', { magnitude: 0.35, fractional: true }],
  ['technique-window', { magnitude: 0.30, durationMs: 4000, fractional: true }],
  // Added 2026-10-01 (design §6) so the avoid face has a real effect distinct
  // from engagement-dr: a chance to not be hit at all, rather than a flat
  // reduction of a hit that lands. Unit and window sized against its nearest
  // siblings — engagement-dr's magnitude (both are "avoid-flavoured" windows)
  // and speed-window's duration (both are proc-triggered, short windows) —
  // since the payoff has no bench history of its own yet.
  ['evasion-window',  { magnitude: 0.15, durationMs: 2500, fractional: true }],
  // The T1 composition payloads (design §24.2): per-firing, see `perFiring`.
  ['big-hit',         { magnitude: 2, fractional: false, perFiring: true }],
  ['mechanic-proxy',  { magnitude: 1.5, fractional: false, perFiring: true }],
  ['heal-and-load',   { magnitude: 0.10, fractional: true, perFiring: true }],
  ['root',            { magnitude: 1, durationMs: 2000, fractional: false, binary: true }],
  ['redose',          { magnitude: 1, durationMs: 4000, fractional: true, perFiring: true }],
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
  'technique': 1,
};

/**
 * The pull a payoff's value is measured against (design §18.3).
 *
 * PROVISIONAL, and grounded in the Phase 1.5 lane matrix rather than invented: a
 * reference T1 pull is about three bodies over twelve seconds, and a ~1.5 aps
 * weapon lands about eighteen hits in that time.
 */
export const REFERENCE_PULL = {
  /** Hits a reference weapon lands in one pull. */
  hits: 18,
  /** Monsters killed in one pull. */
  bodies: 3,
  /** How long one pull lasts. */
  ms: 12_000,
};

/**
 * How often a trigger is expected to fire in one reference pull (design §18.3).
 *
 * WHY. `PACKET_BUDGET` is one scalar per lane, so before this it paid a payoff
 * that fires on every hit and one that fires once per pull exactly the same — and
 * the bench measured the consequence: Affliction fired 4563 times against
 * Engagement's 452, and no packet landed inside §9's band. Dividing a payoff's
 * magnitude by its expected fires makes `PAYOFF_UNIT` a PER-PULL total, so the
 * lane budget compares like with like and starts at parity for real.
 *
 * `hit-nth` is computed from {@link REFERENCE_PULL} and the card's own interval,
 * so a lane that buys a shorter interval pays for it automatically. The rest are
 * authored here, derived from the reference pull: `kill` is one per body, `pulse`
 * is the pull divided by its cadence, `standing` assumes about half a pull held
 * still, and the incoming triggers assume a monster connects roughly every other
 * second.
 *
 * Binary payoffs (stun, cleanse) are NOT normalised: they happen or they do not,
 * and a stun divided by eighteen is not a shorter stun, it is no stun.
 */
export const TRIGGER_FIRES_PER_PULL: Record<TriggerKind, number> = {
  'hit-nth': 0, // computed; see triggerFiresPerPull
  'mechanic-fired': 6,
  'first-hit': 1,
  'kill': REFERENCE_PULL.bodies,
  'evade': 2,
  'hit-taken': 6,
  'guard-cast': 1,
  'standing': 4,
  'pulse': 3,
  'barrier-break': 1,
  // `technique-cast` (design §22), from the average Technique cooldown at
  // REFERENCE WIRING rather than from a guess. The reference wiring fires every
  // attuned Technique off cooldown while in combat (`abilityWiring.ts`), a T1
  // reference loadout carries one Technique slot, and the profile the lane matrix
  // measures the Broadsword with attunes Sweep — 6000 ms at its T1 rank. A
  // {@link REFERENCE_PULL} is 12 s, so 12000 / 6000 = 2.
  //
  // The whole T1 Technique roster averages ~9.7 s, which would read as 1.2; the
  // reference loadout's own pick is what the bench actually measures, so that is
  // the figure authored. Revisit when the lane matrix gains a second Technique
  // slot (design §18.10's frames column is the same kind of gap).
  'technique-cast': 2,
  // The two §24.2 moments are rate-capped at 5 s, and a class that satisfies them
  // trivially fires them AT the cap: 12 s / 5 s = 2.4 per pull, floored to 2
  // because the first firing has to wait for the target to be afflicted / held.
  // PROVISIONAL; only legacy-shaped cards (none authored) are normalised by it.
  'hit-afflicted': 2,
  'hit-held': 2,
};

/** Expected fires per pull for one resolved trigger. Never below 1. */
export function triggerFiresPerPull(trigger?: { kind: TriggerKind; n?: number }): number {
  if (!trigger) return 1;
  if (trigger.kind === 'hit-nth') {
    const n = Math.max(1, Math.round(trigger.n ?? 1));
    return Math.max(1, REFERENCE_PULL.hits / n);
  }
  return Math.max(1, TRIGGER_FIRES_PER_PULL[trigger.kind] ?? 1);
}

// ─── The T1 lean-and-verb halves (design §24.2) ──────────────────────────────

/** A moment's numbers: the `hit-nth` interval and the rate cap. */
export interface PacketMomentNumbers {
  n?: number;
  capMs?: number;
}

/** A payload's numbers, PER FIRING. Meaning per kind — see `PAYOFF_UNIT`. */
export interface PacketPayloadNumbers {
  magnitude: number;
  durationMs?: number;
  /** `heal-and-load` only: the loaded hit's multiplier. */
  loadMultiplier?: number;
}

export interface PacketHalfNumbers {
  /** The verb's moment. The pure pair fires on this same moment. */
  moment: PacketMomentNumbers;
  /** The payload this lane's lean hands a verb of another lane. */
  payload: PacketPayloadNumbers;
  /** The pure payload: same-lane pair, or a verb with no lean. */
  pure: PacketPayloadNumbers;
}

/**
 * Every number the T1 band fires (design §24.2). The SHAPES — which trigger, which
 * payoff, which fx, the phrases — are on `PacketDefinition.halves`
 * (`packets.ts`); `packetMoment`/`packetPayload`/`packetPurePair` (`resolve.ts`)
 * join the two, so this stays the one magnitude table.
 *
 * PER FIRING, NOT PER PULL (design §24.1): a payload is an event — a whole second
 * swing, a lunge, a root — and the moment's cadence (one firing every 4–6 s at
 * reference attack speed) and its rate cap carry the budget. Nothing here is
 * divided by the trigger rate, and nothing is tier-scaled: an event feels the
 * same at T1 as at T4.
 *
 * EVERY NUMBER IS PROVISIONAL — the shapes and cadences are design §24.2's, the
 * magnitudes are the course-correction brief's seeds for the designer:
 *
 *   tempo       moment every 6th hit, uncapped (the §24.1 "n of 5–6");
 *               payload/pure an echo of the WHOLE hit (1.0), on-hit included
 *   affliction  moment capped at one per 5 s (§24.2);
 *               payload a lineage bleed worth 1.0 × the hit over 4 s;
 *               pure a re-dose of 1.0 × what the target's DoTs still owe (doubles)
 *   engagement  moment per body; payload/pure a ×2 lunge
 *   empowered   moment = the mechanic's own cadence;
 *               payload the class's own empowered multiplier (`magnitude` 1.5 is
 *               the fallback for a root with none — dot, summoner, non-Duelist
 *               reload); pure ×1.5 on the mechanic's hit ("half again")
 *   control     moment capped at one per 5 s (§24.2);
 *               payload a 2 s root; pure a 1.5 s stun ("knocks it down")
 *   kill-chain  moment = the next landed hit after a kill;
 *               payload/pure heal 10% of max HP and the hit lands ×1.5
 *   technique   moment = a Technique landing;
 *               payload refunds 1/3 of that Technique's remaining cooldown;
 *               pure refunds 1/2
 */
export const PACKET_HALF_NUMBERS: Partial<Record<PacketId, PacketHalfNumbers>> = {
  'tempo': {
    moment: { n: 6 },
    payload: { magnitude: 1 },
    pure: { magnitude: 1 },
  },
  'affliction': {
    moment: { capMs: 5_000 },
    payload: { magnitude: 1, durationMs: 4_000 },
    pure: { magnitude: 1, durationMs: 4_000 },
  },
  'engagement': {
    moment: {},
    payload: { magnitude: 2 },
    pure: { magnitude: 2 },
  },
  'empowered': {
    moment: {},
    payload: { magnitude: 1.5 },
    pure: { magnitude: 1.5 },
  },
  'control': {
    moment: { capMs: 5_000 },
    payload: { magnitude: 1, durationMs: 2_000 },
    pure: { magnitude: 1, durationMs: 1_500 },
  },
  'kill-chain': {
    moment: {},
    payload: { magnitude: 0.1, loadMultiplier: 1.5 },
    pure: { magnitude: 0.1, loadMultiplier: 1.5 },
  },
  'technique': {
    moment: {},
    payload: { magnitude: 1 / 3 },
    pure: { magnitude: 0.5 },
  },
};

// ─── T2+ verbs compose too (design §24.9) ────────────────────────────────────
//
// The table above is the T1 column. A T2+ band is a lean and a verb exactly like
// T1 (design §24.9: "T2+ bands compose too"), resolved through the SAME halves
// and the SAME numbers, and the tier moves ONE number per payload — its SIZE —
// never the moment's cadence: the 4–6 s rhythm and the rate caps are the shape
// (§24.1), and a moment that came round faster at T2 would be a different verb.
// So a gate never makes a card read smaller: every T2+ payload is its T1 payload
// with its size multiplied by a scalar ≥ 1.

/**
 * What a payload's SIZE is — the one number a T2+ verb's tier scales, and the
 * number a `magnitude` amplifier (or an amplifier whose own axis the composed
 * pair does not have) moves on a composed pair. PROVISIONAL, a pick for the
 * designer, per payload kind:
 *
 *   share     `magnitude` is a share — of the hit (the echo, the heavy bleed), of
 *             what a DoT still owes (the re-dose), of the pool (the Kill-chain heal),
 *             of a cooldown (the Technique refund). It is multiplied, and capped
 *             at `max` where it is a share of a whole that cannot be exceeded.
 *             A `heal-and-load`'s load is a hit multiplier and grows by its bonus
 *             with it (×1.5 at s = 1.15 is ×1.575).
 *   bonus     `magnitude` is a hit multiplier (the lunge, the crash): its BONUS
 *             above 1 is multiplied, so ×2 at s = 1.15 is ×2.15, never ×2.3.
 *   duration  a binary payload (the root, the knockdown) either happens or does
 *             not, so what grows is how long it holds, rounded to the logic tick.
 *   proxy     `mechanic-proxy` lands at the CLASS mechanic's own multiplier, which
 *             only the runtime knows, so the size is a multiple of that bonus,
 *             carried as `bonusScale` (and of the fallback multiplier, for a root
 *             with none).
 *
 * `spread` marks a share that is a TOTAL laid out over `durationMs` (the heavy
 * bleed, the re-dose): lengthening one with a `duration` amplifier holds its tick
 * rate and so grows its total, rather than thinning the same total out.
 */
export type PayloadSizeAxis = 'share' | 'bonus' | 'duration' | 'proxy';

export interface PayloadSize {
  axis: PayloadSizeAxis;
  /** `share` only: the ceiling of the scaled share (a whole pool, a whole cooldown). */
  max?: number;
  /** `share` only: the share is a total over the payload's duration (a bleed). */
  spread?: boolean;
}

export const PAYLOAD_SIZE: Partial<Record<PayoffKind, PayloadSize>> = {
  'echo-hit': { axis: 'share' },
  'hemorrhage': { axis: 'share', spread: true },
  'redose': { axis: 'share', spread: true },
  'heal-and-load': { axis: 'share', max: 1 },
  'technique-refund': { axis: 'share', max: 1 },
  'big-hit': { axis: 'bonus' },
  'mechanic-proxy': { axis: 'proxy' },
  'root': { axis: 'duration' },
  'stun': { axis: 'duration' },
};

/** A payload kind's size: its entry, else `duration` for a binary unit, else a share. */
export function payloadSize(kind: PayoffKind): PayloadSize {
  return PAYLOAD_SIZE[kind] ?? { axis: PAYOFF_UNIT.get(kind)?.binary ? 'duration' : 'share' };
}

/**
 * The scalar a T2+ verb's payload size is multiplied by: the tier scalar's
 * `fraction` column (1 / 1.15 / 1.32 / 1.5). PROVISIONAL, the designer's: every
 * composed payload is already relative to something that grows with the tier on
 * its own — a hit, a pool, a cooldown, the class's mechanic — so the `absolute`
 * column would double-dip (a T4 echo of eleven hits), which is exactly the reason
 * the `fraction` column exists.
 */
export function verbTierScalar(tier: number): number {
  return tierScalar(tier, 'fraction');
}

/** The logic tick a scaled duration or cadence rounds to: nothing finer is real. */
const LOGIC_TICK_MS = 1000 / GAME_CONFIG.LOGIC_TICK_RATE;

const roundTo3 = (x: number): number => Math.round(x * 1000) / 1000;
const roundToTick = (ms: number): number => Math.max(LOGIC_TICK_MS, Math.round(ms / LOGIC_TICK_MS) * LOGIC_TICK_MS);

/**
 * Multiply a payload's SIZE by `factor`, in place — the tier's scaling of a T2+
 * verb and a size amplifier's move on a composed pair, one arithmetic for both.
 * A factor of 1 changes nothing; nothing here ever makes a payload smaller for a
 * factor ≥ 1.
 */
export function scalePayloadSize(
  payoff: { kind: PayoffKind; magnitude: number; durationMs?: number; loadMultiplier?: number; bonusScale?: number },
  factor: number,
): void {
  if (!(factor > 0) || factor === 1) return;
  const size = payloadSize(payoff.kind);
  switch (size.axis) {
    case 'share': {
      const scaled = roundTo3(payoff.magnitude * factor);
      payoff.magnitude = size.max !== undefined ? Math.min(size.max, scaled) : scaled;
      if (payoff.loadMultiplier !== undefined) {
        payoff.loadMultiplier = roundTo3(1 + (payoff.loadMultiplier - 1) * factor);
      }
      break;
    }
    case 'bonus':
      payoff.magnitude = roundTo3(1 + (payoff.magnitude - 1) * factor);
      break;
    case 'duration':
      if (payoff.durationMs !== undefined && payoff.durationMs > 0) {
        payoff.durationMs = roundToTick(payoff.durationMs * factor);
      }
      break;
    case 'proxy':
      payoff.bonusScale = roundTo3((payoff.bonusScale ?? 1) * factor);
      break;
  }
}

/**
 * Lengthen a payload's DURATION by `factor`, in place — a `duration` amplifier on
 * a composed pair. A `spread` share (a bleed that lays a total over its duration)
 * keeps its tick rate, so its total grows with it; anything else simply holds
 * longer. A payload with no duration is left alone (the caller falls back to its
 * size — see `composedAmplifierMove`).
 */
export function lengthenPayload(
  payoff: { kind: PayoffKind; magnitude: number; durationMs?: number },
  factor: number,
): void {
  if (!(factor > 0) || factor === 1) return;
  if (payoff.durationMs === undefined || payoff.durationMs <= 0) return;
  const before = payoff.durationMs;
  payoff.durationMs = roundToTick(before * factor);
  const size = payloadSize(payoff.kind);
  if (size.axis === 'share' && size.spread) {
    const scaled = roundTo3(payoff.magnitude * (payoff.durationMs / before));
    payoff.magnitude = size.max !== undefined ? Math.min(size.max, scaled) : scaled;
  }
}

/**
 * The same moment, coming round `factor` times as often — a `trigger` amplifier on
 * a composed pair (its FREQUENCY). A counted moment shortens its count (never
 * below every 2nd hit: every hit is not a rhythm), a capped one shortens its cap
 * (to the logic tick). Undefined when the moment has no number to move — a first
 * hit on each body, the hit after a kill, a mechanic or a Technique with no cap
 * come round exactly as often as the fight brings them.
 */
export function quickenMoment<T extends { kind: TriggerKind; n?: number; capMs?: number }>(
  trigger: T,
  factor: number,
): T | undefined {
  if (!(factor > 1)) return undefined;
  if (trigger.kind === 'hit-nth' && trigger.n !== undefined) {
    const n = Math.max(2, Math.round(trigger.n / factor));
    return n < trigger.n ? { ...trigger, n } : undefined;
  }
  if (trigger.capMs !== undefined && trigger.capMs > 0) {
    const capMs = roundToTick(trigger.capMs / factor);
    return capMs < trigger.capMs ? { ...trigger, capMs } : undefined;
  }
  return undefined;
}

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
  /** The card's resolved trigger, so the value is normalised by its rate. */
  trigger?: { kind: TriggerKind; n?: number };
}): { magnitude: number; durationMs?: number } {
  const unit = PAYOFF_UNIT.get(params.payoff);
  if (!unit) throw new Error(`unknown payoff kind '${params.payoff}'`);

  // A binary payoff has nothing to scale: it happens or it does not, and a stun
  // that grew with the tier scalar would be an eight-second stun at T4. For the
  // same reason it is never divided by its trigger rate. A per-firing payload
  // (design §24.1) is the same shape for a different reason: its unit already IS
  // one firing's worth.
  if (unit.binary || unit.perFiring) return { magnitude: unit.magnitude, durationMs: unit.durationMs };

  const kind: ScaleKind = unit.fractional ? 'fraction' : 'absolute';
  // `PAYOFF_UNIT` is a PER-PULL total (design §18.3), so a payoff is worth its
  // unit divided by how often it fires. Floored so a high-rate trigger rounds to
  // something rather than to nothing.
  const scaled = unit.magnitude * cardScalar({ ...params, kind })
    / triggerFiresPerPull(params.trigger);
  return {
    // Durations do NOT scale with tier — a longer window is an amplifier's job.
    magnitude: unit.fractional
      ? Math.max(0.001, Math.round(scaled * 1000) / 1000)
      : Math.max(1, Math.round(scaled)),
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

/**
 * Units the runtime needs that are not a payoff's magnitude: cadences, reaches and
 * counts (design §18.4).
 *
 * These lived as named constants in `lineageCards.ts` because no T1 card used the
 * trigger that wanted them. That made them invisible to the designer and
 * un-tunable without a code change, which is exactly what the magnitude table
 * exists to prevent. One authored home, here, with the rest of the numbers.
 *
 * They are flat: a `standing` window is a window whatever tier it is bought at, so
 * none of these takes a tier scalar.
 */
export interface LineageUnits {
  /** How long a player holds still in combat before a `standing` card pays. */
  standingMs: number;
  /** Cadence of a `pulse` card while in combat. */
  pulseMs: number;
  /** Quiet spell that ends an engagement, so `first-hit` re-arms on a fresh pull. */
  engagementIdleMs: number;
  /** Tick cadence of a lineage bleed. */
  bleedTickMs: number;
  /** How far a `contagion` payoff reaches for a neighbour, in world units. */
  contagionRadius: number;
  /** Neighbours one `contagion` application infects. */
  contagionTargets: number;
  /** Debuffs one `cleanse` payoff strips. */
  cleanseDebuffs: number;
  /** Stacks taken off each debuff a `cleanse` strips. */
  cleanseStacks: number;

  // ── Keystone units (design §4, the eight rule changes) ──────────────────
  //
  // A keystone changes a rule, so its numbers are timings, reaches and counts
  // rather than payoff magnitudes — and they belong here for the same reason the
  // rest do (design §18.4: no constants in the runtime). Chain's and Shockwave's
  // SHARE of a hit is not here: that is a magnitude, resolved from
  // `KEYSTONE_DEFINITIONS[lane].payoff` at `ROW_SCALAR.keystone`.

  /**
   * How many links one Chain may run before it stops regardless. The rule's own
   * bounds — a miss, or no fresh body in reach — already terminate it, since each
   * link consumes a target; this is the authored ceiling so a dense pack cannot
   * turn one echo into a node-wide clear.
   */
  chainMaxLinks: number;
  /**
   * The footprint of Shockwave's area hit, in world units. Deliberately Sweep's
   * own radius: "the hit cleaves" is one idea, and two different answers to how
   * far would read as a bug on screen.
   */
  shockwaveRadius: number;
  /** The root the Ladder's second rung applies. Binding Strike's own length. */
  ladderRootMs: number;
  /**
   * The stun the Ladder's top rung applies. The `stun` payoff's authored duration
   * rather than Stunning Strike's, so an item's hard control never out-stuns the
   * ability whose whole cost is that it stuns.
   */
  ladderStunMs: number;
  /** How long Immovable holds a bulwark stance after the player moves. */
  immovableGraceMs: number;
  /** The health fraction above which Unbroken ignores a hit's recharge reset. */
  unbrokenHpFraction: number;
}

export const LINEAGE_UNITS: LineageUnits = {
  standingMs: 1_500,
  pulseMs: 4_000,
  engagementIdleMs: 4_000,
  bleedTickMs: 1_000,
  contagionRadius: 120,
  contagionTargets: 1,
  cleanseDebuffs: 1,
  cleanseStacks: 1,
  chainMaxLinks: 4,
  shockwaveRadius: 90,
  ladderRootMs: 1_500,
  ladderStunMs: 750,
  immovableGraceMs: 2_000,
  unbrokenHpFraction: 0.5,
};

/** One authored unit. The runtime reads these and never its own constant. */
export function lineageUnit<K extends keyof LineageUnits>(key: K): LineageUnits[K] {
  return LINEAGE_UNITS[key];
}

/** `hit-nth` interval for a lane. */
export function triggerNForLane(lane: PacketId): number {
  return TRIGGER_N_BY_LANE[lane] ?? 1;
}
