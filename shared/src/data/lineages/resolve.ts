/**
 * Turning authored cards into numbers. The ONLY bridge between `types.ts` (shape,
 * no numbers) and `magnitudes.ts` (numbers, no shape).
 *
 * Callers never read a magnitude off a card, because a card has none — they
 * resolve it here, optionally against the wearer's frame face so defensive cards
 * pay the off-face bias (design §3.1).
 */
import { BIOME_LEVELS_PER_TIER, biomeLevelOffset } from '../../config/gameConfig';
import { BIOME_PRIMARY_ESSENCE } from '../../items';
import type { EssenceType } from '../../items';
import { packetHalves, packetScalingStat } from './packets';
import {
  MAX_LEAN_RANK, clampLeanRank, gateBiomeLevel, gateCapstoneAmount, gateEssenceCost, gateShardCost,
  LINEAGE_SWITCH_DISCOUNT, PACKET_HALF_NUMBERS, leanRankEssenceCost, leanRankMastery,
  leanRankShardCost, leanRankValue, lineageMasteryLevelForGate,
  lineageMasteryLevelForRow, payoffValue, rowBiomeLevel, rowEssenceCost, rowShardCost,
  scalePayloadSize, statRowValue, triggerNForLane, verbTierScalar,
} from './magnitudes';
import type { PacketPayloadNumbers } from './magnitudes';
import type {
  DefensiveFace, LineageCapstone, LineageCard, LineageComposition, LineageCost,
  LineageDefinition, LineageForm, LineageFxKey, LineageGateCost, LineagePayoff,
  LineageStatEffects, LineageStatKey, LineageTrigger, PacketId, PayoffKind,
  ResolvedLineageCapstone, ResolvedLineageCard, RowKind,
} from './types';

export interface ResolveOptions {
  /** The wearer's frame defensive face, for the off-face bias on defensive cards. */
  frameFace?: DefensiveFace;
  /** Halve the cost — the player already owns this row on another lineage of the
   *  slot at the same tier (design §2). Gates are never discounted. */
  discounted?: boolean;
  /**
   * The band's DOOR biome: the biome of the form worn at this card's tier
   * (design §21). A band of tier N gates on the biome that let the player in at
   * tier N, never on the lineage's home biome — which is only ever the T1 door.
   *
   * Omitted means the home biome, which is exactly right for a T1 band and is the
   * display default for a band the player has not reached yet (no door chosen).
   * WHICH door a band has is a question about the player's progress, so that
   * policy lives in `lineageBandBiome` (`shared/src/systems/lineages.ts`); this
   * file only turns a biome into a number.
   */
  bandBiome?: string;
  /**
   * A RANKED card only (the T1 lean trio, design §26.1): the rank to resolve at —
   * its value, its Global Mastery gate, and the price of BUYING that rank. Clamped
   * to 1..`MAX_LEAN_RANK`; omitted means rank I. Ignored on an unranked card.
   */
  rank?: number;
}

// ─── Ranks (design §26.1) ────────────────────────────────────────────────────

/** Is this card RANKED — one of the T1 lean trio, bought one rank at a time? */
export function isRankedCard(card: Pick<LineageCard, 'leanKind'>): boolean {
  return card.leanKind !== undefined;
}

/** A card's highest rank: `MAX_LEAN_RANK` for a ranked card, 1 for every other. */
export function maxCardRank(card: Pick<LineageCard, 'leanKind'>): number {
  return isRankedCard(card) ? MAX_LEAN_RANK : 1;
}

/**
 * The PAYLOAD lane a lean names — the lane whose packet payload a verb delivers
 * while this card is the active lean (design §24.2), or undefined for none.
 *
 * A lane-named lean (every T2 lean) names its own lane. The T1 trio's `lane` is
 * colour and currency only (design §26.1): an Attack or Speed lean names NO
 * payload, so the fixed verb reads its pure pair under it — an Attack lean never
 * turns the Dagger's verb into an Empowered payload — and an Effect lean names its
 * lane, which is the fixed verb's own, so the verb also reads its pure pair and
 * the Effect's rank scales what the Effect scales.
 */
export function leanPayloadLane(card: Pick<LineageCard, 'lane' | 'leanKind'>): PacketId | undefined {
  if (card.leanKind === 'attack' || card.leanKind === 'speed') return undefined;
  return card.lane;
}

/**
 * The level a band row asks for IN A GIVEN BIOME — design §21.
 *
 * `rowBiomeLevel` is an ABSOLUTE reference level: what a biome that debuts in T1
 * would call it. A biome that debuts later numbers its own levels from 1
 * ({@link biomeLevelOffset}), and `biomeLevelCap` is in those same local numbers,
 * so a T3 Jungle door asks for Jungle 8 rather than Jungle 14 — the same content,
 * counted the way that biome counts. Without the shift, every band whose door
 * biome debuts above T1 demanded a level that biome can never reach: the Graveyard
 * caps at 6 and the T4 band wanted 19–23.
 */
export function bandBiomeLevel(tier: number, row: RowKind, biome: string): number {
  return Math.max(1, rowBiomeLevel(tier, row) - biomeLevelOffset(biome));
}

/**
 * The door biome's own level a band of `tier` sits above — the zero of that band's
 * mastery bar, and the floor the UI subtracts to show "L2 of 6".
 */
export function bandBiomeFloor(tier: number, biome: string): number {
  const band = Math.max(1, Math.floor(tier));
  return Math.max(0, (band - 1) * BIOME_LEVELS_PER_TIER - biomeLevelOffset(biome));
}

/** The stat a card's stat row scales: its override, else its lane's. */
export function cardStatKey(card: LineageCard): LineageStatKey {
  return card.statKey ?? packetScalingStat(card.lane);
}

/** Essence type a lineage's cards are paid in — its home biome's primary. */
export function lineageEssenceType(lineage: Pick<LineageDefinition, 'homeBiome'>): EssenceType {
  return BIOME_PRIMARY_ESSENCE[lineage.homeBiome] ?? 'green';
}

function applyDiscount(amount: number, discounted: boolean | undefined): number {
  if (!discounted) return amount;
  // Round UP so a small shard cost is halved without collapsing to nothing.
  return Math.max(1, Math.ceil(amount * LINEAGE_SWITCH_DISCOUNT));
}

/**
 * What a card costs, in the lineage's essence and its own lane's shard. A ranked
 * card costs the price of BUYING `options.rank` (default rank I): the same essence
 * and the same shard at every rank, scaled by `LEAN_RANK_PRICE_SCALE`.
 */
export function lineageCardCost(
  card: LineageCard,
  lineage: Pick<LineageDefinition, 'homeBiome'>,
  options: ResolveOptions = {},
): LineageCost {
  const essenceType = lineageEssenceType(lineage);
  const ranked = isRankedCard(card);
  const rank = clampLeanRank(options.rank ?? 1);
  const essence = ranked ? leanRankEssenceCost(card.tier, card.row, rank) : rowEssenceCost(card.tier, card.row);
  const shards = ranked ? leanRankShardCost(card.tier, card.row, rank) : rowShardCost(card.tier, card.row);
  return {
    essence: { [essenceType]: applyDiscount(essence, options.discounted) },
    shards: { [card.lane]: applyDiscount(shards, options.discounted) },
  };
}

/** A card with its numbers filled in. */
export function resolveLineageCard(
  card: LineageCard,
  lineage: Pick<LineageDefinition, 'homeBiome'>,
  options: ResolveOptions = {},
): ResolvedLineageCard {
  const scale = { tier: card.tier, lane: card.lane, cardFace: card.face, frameFace: options.frameFace };
  // The band gates on its DOOR biome (design §21). The Global Mastery band is
  // unchanged in meaning: it is tier-wide, so it never moves with the door.
  const bandBiome = options.bandBiome ?? lineage.homeBiome;
  const resolved: ResolvedLineageCard = {
    card,
    requiredBiomeGroup: bandBiome,
    requiredBiomeLevel: bandBiomeLevel(card.tier, card.row, bandBiome),
    requiredGlobalMastery: lineageMasteryLevelForRow(card.tier, card.row),
    cost: lineageCardCost(card, lineage, options),
  };

  if (card.row === 'stat') {
    const key = cardStatKey(card);
    if (card.leanKind) {
      // A RANKED lean (design §26.1): its number is its kind's, not its lane's —
      // the lane is colour and currency only — and the rank moves the number, the
      // Global Mastery gate and the price together.
      const rank = clampLeanRank(options.rank ?? 1);
      resolved.statEffects = { [key]: leanRankValue(card.leanKind, key, rank, card.tier) } as LineageStatEffects;
      resolved.requiredGlobalMastery = leanRankMastery(card.tier, card.row, rank);
      resolved.rank = rank;
      resolved.maxRank = MAX_LEAN_RANK;
      return resolved;
    }
    resolved.statEffects = { [key]: statRowValue({ statKey: key, ...scale }) } as LineageStatEffects;
    return resolved;
  }

  // A verb (design §24.2, §24.9) resolved on its own has no lean to compose with,
  // so it reads its lane's PURE pair at its own tier — exactly what it does in play
  // with no lean active. `resolveLineageCards` re-composes it against the lean.
  if (isVerbCard(card)) {
    applyComposition(resolved, composeVerb(card.lane, undefined, card.tier, card.seeds === 'slow'));
    return resolved;
  }

  if (card.trigger) {
    resolved.trigger = card.trigger === 'hit-nth'
      ? { kind: 'hit-nth', n: triggerNForLane(card.borrowsLane ?? card.lane) }
      : { kind: card.trigger };
  }
  if (card.payoff) {
    // The trigger goes in so the magnitude is normalised by its rate (design §18.3).
    resolved.payoff = {
      kind: card.payoff,
      ...payoffValue({ payoff: card.payoff, row: card.row, ...scale, trigger: resolved.trigger }),
    };
  }
  return resolved;
}

/** A worn form's capstone with its numbers filled in. Granted, never bought. */
export function resolveLineageCapstone(
  form: LineageForm,
  options: ResolveOptions = {},
): ResolvedLineageCapstone | undefined {
  const capstone: LineageCapstone | undefined = form.capstone;
  if (!capstone) return undefined;
  // A capstone is the band's reward, so it resolves at the payoff row's scalar.
  const trigger: ResolvedLineageCapstone['trigger'] = capstone.trigger === 'hit-nth'
    ? { kind: 'hit-nth', n: triggerNForLane(capstone.lane) }
    : { kind: capstone.trigger };
  const payoff = payoffValue({
    payoff: capstone.payoff, tier: form.tier, row: 'payoff',
    lane: capstone.lane, frameFace: options.frameFace, trigger,
  });
  return {
    capstone,
    form,
    trigger,
    payoff: { kind: capstone.payoff, ...payoff },
  };
}

/**
 * What a gate costs: essence, the shard of the lane the new form crowns, and the
 * boss capstone material of the form's biome. Gates are never discounted.
 */
export function lineageGateCost(
  form: LineageForm,
  lineage: Pick<LineageDefinition, 'homeBiome'>,
): LineageGateCost {
  const gateTier = form.tier - 1;
  const lane = form.capstone?.lane;
  return {
    essence: { [lineageEssenceType(lineage)]: gateEssenceCost(gateTier) },
    shards: lane ? { [lane]: gateShardCost(gateTier) } : {},
    capstone: { biome: form.biome, amount: gateCapstoneAmount(gateTier) },
  };
}

/**
 * Biome level required in the FORM's biome to pay its gate.
 *
 * The gate sits at the cap of the band below the form it opens — read in that
 * biome's own numbering, for the reason {@link bandBiomeLevel} gives: the T2 gate
 * into a Jungle T3 form is full mastery of the Jungle's T2 content, which the
 * Jungle calls level 6, not level 12 (a level it only reaches at player tier 3).
 */
export function formGateBiomeLevel(form: LineageForm): number {
  return Math.max(1, gateBiomeLevel(form.tier - 1) - biomeLevelOffset(form.biome));
}

/** Global Mastery required to pay a form's gate — where +5 sits in that band. */
export function formGateMastery(form: LineageForm): number {
  return lineageMasteryLevelForGate(form.tier - 1);
}

// ─── The lean and verb (design §24.2; T2+ bands compose too, §24.9) ──────────

/**
 * A VERB: a `payoff`-row card authored with neither a trigger nor a payoff. It
 * carries only its lane; the moment comes from that lane's packet and the payload
 * from the active lean's, sized by the verb's own tier. Every weapon band's payoff
 * row (T1 and T2) is verbs; a payoff-row card that authors both is never a verb.
 */
export function isVerbCard(card: Pick<LineageCard, 'row' | 'trigger' | 'payoff'>): boolean {
  return card.row === 'payoff' && card.trigger === undefined && card.payoff === undefined;
}

/** A packet moment with the per-body latch the engagement moment carries. */
export type PacketMoment = LineageTrigger & { perTarget?: boolean };

/**
 * A packet's moment — the trigger its verb fires on, numbers filled in from
 * `PACKET_HALF_NUMBERS`. Undefined for a packet with no halves (the two
 * defensive ones, while non-weapon trees are parked).
 */
export function packetMoment(id: PacketId): PacketMoment | undefined {
  const shape = packetHalves(id)?.moment;
  const numbers = PACKET_HALF_NUMBERS[id]?.moment;
  if (!shape || !numbers) return undefined;
  const moment: PacketMoment = { kind: shape.kind };
  if (numbers.n !== undefined) moment.n = numbers.n;
  if (numbers.capMs !== undefined) moment.capMs = numbers.capMs;
  if (shape.carry) moment.carry = true;
  if (shape.perTarget) moment.perTarget = true;
  return moment;
}

/**
 * A half's payload with its numbers, at `tier`: the T1 numbers from
 * `PACKET_HALF_NUMBERS` with their SIZE multiplied by the verb's tier scalar
 * (design §24.9: the same table, scaled by tier — `scalePayloadSize`). Tier 1 is
 * the table verbatim.
 */
function payoffFrom(kind: PayoffKind, numbers: PacketPayloadNumbers, tier: number): LineagePayoff {
  const payoff: LineagePayoff = { kind, magnitude: numbers.magnitude };
  if (numbers.durationMs !== undefined) payoff.durationMs = numbers.durationMs;
  if (numbers.loadMultiplier !== undefined) payoff.loadMultiplier = numbers.loadMultiplier;
  scalePayloadSize(payoff, verbTierScalar(tier));
  return payoff;
}

/**
 * The payload a lean of this lane hands a verb of ANOTHER lane, per firing, at the
 * verb's `tier` (default 1).
 */
export function packetPayload(id: PacketId, tier = 1): LineagePayoff | undefined {
  const kind = packetHalves(id)?.payload;
  const numbers = PACKET_HALF_NUMBERS[id]?.payload;
  return kind && numbers ? payoffFrom(kind, numbers, tier) : undefined;
}

/**
 * The packet's PURE pair: its own moment and its pure payload, at the verb's `tier`
 * (default 1). Used when the lean is the verb's own lane, and when no lean is active
 * (design §24.2: "a verb alone never does nothing"). The moment never scales.
 */
export function packetPurePair(id: PacketId, tier = 1): { trigger: PacketMoment; payoff: LineagePayoff } | undefined {
  const trigger = packetMoment(id);
  const kind = packetHalves(id)?.pure.payload;
  const numbers = PACKET_HALF_NUMBERS[id]?.pure;
  if (!trigger || !kind || !numbers) return undefined;
  return { trigger, payoff: payoffFrom(kind, numbers, tier) };
}

/** What one verb does with one lean (or none). */
export interface VerbComposition extends LineageComposition {
  trigger: PacketMoment;
  payoff: LineagePayoff;
  /** The fx the firing pushes: the payload's own. */
  fx: LineageFxKey;
}

/**
 * Compose a verb of `verbLane` with a lean of `leanLane` (design §24.2), at the
 * verb's `tier` (design §24.9: T2+ bands compose too).
 *
 * Another lane's lean: the verb's moment, the lean's payload. The same lane, or no
 * lean: the verb lane's pure pair. The tier scales the payload's SIZE and never the
 * moment, so a T2 verb is its T1 sentence with bigger numbers. Resolve time only —
 * the combat runtime sees an ordinary trigger and payoff and knows nothing of halves.
 *
 * WHOSE TIER: the verb's. The verb is the card that fires, so its purchase sets the
 * payload's size whichever band the lean came from — a T1 verb slotted under a T2
 * form (a collapsed band is a wardrobe, design §4) pays T1 numbers with the T2
 * lean's payload, and a T2 verb pays T2 numbers with a lean carried up through the
 * gate. Nothing the gate does makes a slotted card smaller.
 *
 * NO COMPOSITION RECURSES. The one payload that "counts as the mechanic"
 * (`mechanic-proxy`) never reaches the mechanic moment: Empowered × Empowered is
 * pure (a bigger mechanic hit), and the proxy never emits `mechanic-fired`
 * anyway (rule 3). `composition.test.ts` pins both halves of that.
 */
export function composeVerb(
  verbLane: PacketId,
  leanLane?: PacketId,
  tier = 1,
  /** The verb card seeds its own hold (`LineageCard.seeds === 'slow'`, design §26.5). */
  verbSeedsHold = false,
): VerbComposition | undefined {
  const verbHalves = packetHalves(verbLane);
  const pure = packetPurePair(verbLane, tier);
  if (!verbHalves || !pure) return undefined;
  // The Control moment needs a held target. A lean whose stat slows on every hit
  // (the Control lean, design §24.9) is that hold's source, and a fixed verb that
  // seeds its own slow (§26.5) is another; with either the verb needs nothing.
  // With any other lean, or none, the page says "needs a slow".
  const leanHolds = leanLane !== undefined && packetScalingStat(leanLane) === 'slowOnHit';
  const needs = verbHalves.moment.kind === 'hit-held' && !leanHolds && !verbSeedsHold ? { needs: 'slow' as const } : {};

  if (leanLane && leanLane !== verbLane) {
    const leanHalves = packetHalves(leanLane);
    const payoff = packetPayload(leanLane, tier);
    if (leanHalves && payoff) {
      return {
        verbLane, leanLane, pure: false, ...needs,
        trigger: pure.trigger, payoff, fx: leanHalves.payloadFx,
      };
    }
  }
  return {
    verbLane, ...(leanLane ? { leanLane } : {}), pure: true, ...needs,
    trigger: pure.trigger, payoff: pure.payoff, fx: verbHalves.pure.fx,
  };
}

/** Write a composition onto a resolved verb, replacing whatever it carried. */
export function applyComposition(resolved: ResolvedLineageCard, composed: VerbComposition | undefined): void {
  delete resolved.trigger;
  delete resolved.payoff;
  delete resolved.payoffFx;
  delete resolved.perTargetTrigger;
  delete resolved.composition;
  if (!composed) return;
  const { perTarget, ...trigger } = composed.trigger;
  resolved.trigger = trigger;
  resolved.payoff = { ...composed.payoff };
  resolved.payoffFx = composed.fx;
  if (perTarget) resolved.perTargetTrigger = true;
  resolved.composition = {
    verbLane: composed.verbLane,
    ...(composed.leanLane ? { leanLane: composed.leanLane } : {}),
    pure: composed.pure,
    ...(composed.needs ? { needs: composed.needs } : {}),
  };
}
