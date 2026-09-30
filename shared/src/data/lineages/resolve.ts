/**
 * Turning authored cards into numbers. The ONLY bridge between `types.ts` (shape,
 * no numbers) and `magnitudes.ts` (numbers, no shape).
 *
 * Callers never read a magnitude off a card, because a card has none — they
 * resolve it here, optionally against the wearer's frame face so defensive cards
 * pay the off-face bias (design §3.1).
 */
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
  ResolvedLineageCapstone, ResolvedLineageCard,
} from './types';

export interface ResolveOptions {
  /** The wearer's frame defensive face, for the off-face bias on defensive cards. */
  frameFace?: DefensiveFace;
  /** Halve the cost — the player already owns this row on another lineage of the
   *  slot at the same tier (design §2). Gates are never discounted. */
  discounted?: boolean;
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
  const resolved: ResolvedLineageCard = {
    card,
    requiredBiomeLevel: rowBiomeLevel(card.tier, card.row),
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
    resolved.payoff = { kind: card.payoff, ...payoffValue({ payoff: card.payoff, row: card.row, ...scale }) };
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
  const payoff = payoffValue({
    payoff: capstone.payoff, tier: form.tier, row: 'payoff',
    lane: capstone.lane, frameFace: options.frameFace,
  });
  return {
    capstone,
    form,
    trigger: capstone.trigger === 'hit-nth'
      ? { kind: 'hit-nth', n: triggerNForLane(capstone.lane) }
      : { kind: capstone.trigger },
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

/** Biome level required in the FORM's biome to pay its gate. */
export function formGateBiomeLevel(form: LineageForm): number {
  // The gate sits at the cap of the band below the form it opens.
  return gateBiomeLevel(form.tier - 1);
}

/** Global Mastery required to pay a form's gate — where +5 sits in that band. */
export function formGateMastery(form: LineageForm): number {
  return lineageMasteryLevelForGate(form.tier - 1);
}
