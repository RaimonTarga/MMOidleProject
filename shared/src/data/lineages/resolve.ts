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
import { packetScalingStat } from './packets';
import {
  gateBiomeLevel, gateCapstoneAmount, gateEssenceCost, gateShardCost,
  LINEAGE_SWITCH_DISCOUNT, lineageMasteryLevelForGate, lineageMasteryLevelForRow,
  payoffValue, rowBiomeLevel, rowEssenceCost, rowShardCost, statRowValue,
  triggerNForLane,
} from './magnitudes';
import type {
  DefensiveFace, LineageCapstone, LineageCard, LineageCost, LineageDefinition,
  LineageForm, LineageGateCost, LineageStatEffects, LineageStatKey,
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

/** What a card costs, in the lineage's essence and its own lane's shard. */
export function lineageCardCost(
  card: LineageCard,
  lineage: Pick<LineageDefinition, 'homeBiome'>,
  options: ResolveOptions = {},
): LineageCost {
  const essenceType = lineageEssenceType(lineage);
  return {
    essence: { [essenceType]: applyDiscount(rowEssenceCost(card.tier, card.row), options.discounted) },
    shards: { [card.lane]: applyDiscount(rowShardCost(card.tier, card.row), options.discounted) },
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
    resolved.statEffects = { [key]: statRowValue({ statKey: key, ...scale }) } as LineageStatEffects;
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
