/**
 * Turning an authored ability-node option into numbers — the ONLY bridge between
 * `types.ts`/`offers.ts` (shape, no numbers) and the magnitude table.
 *
 * Nothing new is tuned here. A node borrows the lineage payoff row's own value
 * for its lane and band and takes the `ABILITY_NODE_SHARE` slice of it, so the
 * single knob for "what an ability node is worth" is that one column (design
 * §19: "the node's payoff share comes from a new ABILITY_NODE_SHARE column").
 *
 * WHY THE PAYOFF IS RESOLVED WITH NO TRIGGER. `payoffValue` divides a payoff's
 * per-pull unit by how often its trigger fires (design §18.3). An ability node
 * has no lane trigger: it fires when the ability lands or casts, which a Rune
 * rule and a cooldown decide — about once a pull, the same rate `guard-cast`
 * carries in `TRIGGER_FIRES_PER_PULL`. Passing no trigger yields exactly that
 * rate (one), so the node is priced like a once-per-pull payoff without a new
 * number and without widening the trigger vocabulary.
 */
import { ABILITY_DATABASE } from '../../abilities';
import type { AbilityDef } from '../../abilities';
import { ABILITY_RECIPE_DATABASE } from '../../abilityRecipes';
import type { AbilityRecipe } from '../../abilityRecipes';
import type { EssenceType } from '../../items';
import {
  ABILITY_NODE_SHARE, PAYOFF_UNIT, clampTier, ladderMasteryLevelForRow,
  payoffValue, rowEssenceCost, rowShardCost,
} from '../lineages/magnitudes';
import type { LineageCost, LineagePayoff, RowKind } from '../lineages/types';
import type { AbilityNodeOption, AbilityNodeRow } from './types';

/**
 * Which lineage row an ability node row borrows its price and scalar from. The
 * packet node is a payoff row (it adds an event); the amplifier node is an
 * amplifier row (it modifies one the player already owns).
 */
export const NODE_ROW_AS_LINEAGE_ROW: Record<AbilityNodeRow, RowKind> = {
  packet: 'payoff',
  amplifier: 'amplifier',
};

/**
 * Which band a row is gated in — the one home of that rule.
 *
 * The packet node sits on the ability's HOME TIER band and the amplifier one band
 * above it. Design §19's "the T1 packet node and the T2 amplifier node" reads
 * relative to the ability, which is the only reading under which a T4 ability's
 * node is reachable at all; "unlock on the ability's home tier band with Global
 * Mastery" is the same sentence said the other way round. A T4 ability's
 * amplifier clamps back into the T4 band, exactly as the magnitude table clamps
 * every tier past its last column, and lands one plus-slot higher inside it.
 */
export function abilityNodeRowTier(ability: Pick<AbilityDef, 'tier'>, row: AbilityNodeRow): number {
  return clampTier(row === 'packet' ? ability.tier : ability.tier + 1);
}

/** The band an option's own row is gated in. */
export function abilityNodeTier(option: Pick<AbilityNodeOption, 'abilityId' | 'row'>): number {
  const ability = ABILITY_DATABASE.get(option.abilityId);
  return ability ? abilityNodeRowTier(ability, option.row) : 1;
}

/** An ability node option with its numbers filled in. */
export interface ResolvedAbilityNodeOption {
  option: AbilityNodeOption;
  /** The band this row is gated in. */
  tier: number;
  /** Global Mastery required, from the same per-tier band lineage rows use. */
  requiredGlobalMastery: number;
  cost: LineageCost;
  /** `packet` rows only: what the node fires. An amplifier moves this instead. */
  payoff?: LineagePayoff;
}

const recipeByAbility: Map<string, AbilityRecipe> = new Map(
  [...ABILITY_RECIPE_DATABASE.values()].map((recipe) => [recipe.abilityId, recipe]),
);

/** The ability recipe that teaches an ability — where its essence colour comes from. */
export function abilityRecipeFor(abilityId: string): AbilityRecipe | undefined {
  return recipeByAbility.get(abilityId);
}

/**
 * The essence an ability's nodes are paid in: the one the ability itself was
 * learned with.
 *
 * Abilities have no home biome of their own, so there is nothing to look up in
 * `BIOME_PRIMARY_ESSENCE` the way a lineage does — but the recipe that teaches
 * the ability already names a colour, and that colour already says which biome
 * taught it. Reusing it keeps "you pay where you learned it" true with no second
 * table to fall out of step.
 */
export function abilityNodeEssenceType(abilityId: string): EssenceType {
  const recipe = abilityRecipeFor(abilityId);
  const first = recipe ? (Object.keys(recipe.cost) as EssenceType[])[0] : undefined;
  return first ?? 'green';
}

/** What a node option costs: essence where it was learned, plus its lane's shard. */
export function abilityNodeCost(option: AbilityNodeOption): LineageCost {
  const tier = abilityNodeTier(option);
  const row = NODE_ROW_AS_LINEAGE_ROW[option.row];
  return {
    essence: { [abilityNodeEssenceType(option.abilityId)]: rowEssenceCost(tier, row) },
    shards: { [option.lane]: rowShardCost(tier, row) },
  };
}

/**
 * The resolved payoff of a `packet` option: the lineage payoff row's own value
 * for that lane and band, times the node share.
 *
 * A binary payoff (stun, cleanse) has no share to take — "half a stun" is not a
 * shorter stun, it is no stun — so the node table never uses one, and this
 * returns undefined rather than quietly handing back a full-strength one.
 */
export function abilityNodePayoff(option: AbilityNodeOption): LineagePayoff | undefined {
  if (option.row !== 'packet') return undefined;
  const unit = PAYOFF_UNIT.get(option.payoff);
  if (!unit || unit.binary) return undefined;

  const { magnitude, durationMs } = payoffValue({
    payoff: option.payoff,
    tier: abilityNodeTier(option),
    row: NODE_ROW_AS_LINEAGE_ROW.packet,
    lane: option.lane,
  });
  const shared = magnitude * ABILITY_NODE_SHARE.packet;
  return {
    kind: option.payoff,
    magnitude: unit.fractional
      ? Math.max(0.001, Math.round(shared * 1000) / 1000)
      : Math.max(1, Math.round(shared)),
    ...(durationMs !== undefined ? { durationMs } : {}),
  };
}

/** An option with its tier, mastery gate, cost and payoff filled in. */
export function resolveAbilityNodeOption(option: AbilityNodeOption): ResolvedAbilityNodeOption {
  const tier = abilityNodeTier(option);
  return {
    option,
    tier,
    requiredGlobalMastery: ladderMasteryLevelForRow(tier, NODE_ROW_AS_LINEAGE_ROW[option.row]),
    cost: abilityNodeCost(option),
    ...(option.row === 'packet' ? { payoff: abilityNodePayoff(option) } : {}),
  };
}
