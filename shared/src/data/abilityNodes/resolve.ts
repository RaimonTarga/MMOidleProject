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
  ABILITY_NODE_SHARE, MAX_LINEAGE_TIER, PAYOFF_UNIT, clampTier, ladderMasteryLevelForRow,
  payoffValue, rowEssenceCost, rowShardCost,
} from '../lineages/magnitudes';
import type { LineageCost, LineagePayoff, PacketId, RowKind } from '../lineages/types';
import type { AbilityNodeOption, AbilityNodeProgress, AbilityNodeRow } from './types';

/**
 * Which lineage row an ability node row borrows its price, scalar and unlock
 * level from. The packet node is a payoff row (it adds an event); the amplifier
 * node an amplifier row (it modifies one the player already owns); the keystone
 * and cross rows are the lineage rows of the same names (design §22.1).
 */
export const NODE_ROW_AS_LINEAGE_ROW: Record<AbilityNodeRow, RowKind> = {
  packet: 'payoff',
  amplifier: 'amplifier',
  keystone: 'keystone',
  cross: 'cross',
};

/**
 * How many tiers above the ability's home each row sits (design §22.1): packet at
 * home, amplifier +1, keystone +2, cross +3. One rule, every ability.
 */
export const ABILITY_NODE_ROW_OFFSET: Record<AbilityNodeRow, number> = {
  packet: 0,
  amplifier: 1,
  keystone: 2,
  cross: 3,
};

/**
 * The tier a row BELONGS to — home + {0, 1, 2, 3}, the one home of that rule.
 *
 * NOT clamped (design §22.10: "Row tiers: home + N, no clamp"). A T1 ability's
 * rows read 1/2/3/4, a T2 one's 2/3/4/5, a T4 one's 4/5/6/7. "Nothing is
 * retroactive: a row unlocks on the tier that owns it, so late abilities grow
 * into T5–T8 and the tree needs no new rows when those tiers ship." Where the row
 * is actually bought today is {@link abilityNodeBandTier}.
 */
export function abilityNodeRowTier(ability: Pick<AbilityDef, 'tier'>, row: AbilityNodeRow): number {
  return Math.max(1, Math.floor(ability.tier)) + ABILITY_NODE_ROW_OFFSET[row];
}

/**
 * The band a row is GATED AND PRICED in: its own tier, folded into the cap band
 * while that tier does not exist yet (design §22.10: "until a tier exists, the
 * rows above the current cap fold into the cap band, so today's game still
 * reaches every row of every ability, and unfold when the tier ships").
 *
 * THE FOLD RULE. A row whose own tier is above `MAX_LINEAGE_TIER` is bought in the
 * `MAX_LINEAGE_TIER` band, at that band's unlock level for the row's own kind
 * (`ROW_LOCAL_LEVEL[4]` already spreads payoff / amplifier / keystone / cross
 * across levels 2–5), and at that band's price. Option ids carry no tier, the
 * save records only which ids are owned and active, and the band is derived from
 * the ability's home tier at read time — so raising the cap moves a folded row
 * into its own band with no save touched, and what was bought stays bought.
 */
export function abilityNodeBandTier(ability: Pick<AbilityDef, 'tier'>, row: AbilityNodeRow): number {
  return Math.min(MAX_LINEAGE_TIER, clampTier(abilityNodeRowTier(ability, row)));
}

/** Whether a row is folded into the cap band today (its own tier has not shipped). */
export function abilityNodeRowFolded(ability: Pick<AbilityDef, 'tier'>, row: AbilityNodeRow): boolean {
  return abilityNodeRowTier(ability, row) > MAX_LINEAGE_TIER;
}

/** The band an option's own row is gated in. */
export function abilityNodeTier(option: Pick<AbilityNodeOption, 'abilityId' | 'row'>): number {
  const ability = ABILITY_DATABASE.get(option.abilityId);
  return ability ? abilityNodeBandTier(ability, option.row) : 1;
}

/** An ability node option with its numbers filled in. */
export interface ResolvedAbilityNodeOption {
  option: AbilityNodeOption;
  /** The band this row is gated in. */
  tier: number;
  /** Global Mastery required, from the same per-tier band lineage rows use. */
  requiredGlobalMastery: number;
  cost: LineageCost;
  /** `packet` and `cross` rows: what the node fires. An amplifier moves this instead. */
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

/**
 * The lane of the player's ACTIVE packet option for this ability, or undefined
 * when none is slotted. Read off the option id's own lane, never a second table.
 */
export function activePacketLane(
  abilityId: string,
  progress: AbilityNodeProgress | undefined,
): PacketId | undefined {
  const id = progress?.active.packet;
  if (!id || !progress?.owned.includes(id)) return undefined;
  const prefix = `${abilityId}.packet.`;
  return id.startsWith(prefix) ? id.slice(prefix.length) as PacketId : undefined;
}

/**
 * What a node option costs: essence where it was learned, plus a lane's shard.
 *
 * Packet, amplifier and cross options are paid in their own lane's shard (a cross
 * option's lane is the offer it borrows). A KEYSTONE is not keyed to a lane, so
 * it is paid in the ACTIVE packet's shard (design §22.1: "plus the shard of the
 * ability's ACTIVE packet option") — which is why it needs `progress`; with no
 * active packet it has no shard to quote, and the purchase check refuses it.
 */
export function abilityNodeCost(option: AbilityNodeOption, progress?: AbilityNodeProgress): LineageCost {
  const tier = abilityNodeTier(option);
  const row = NODE_ROW_AS_LINEAGE_ROW[option.row];
  const shardLane = option.row === 'keystone'
    ? activePacketLane(option.abilityId, progress)
    : option.lane;
  return {
    essence: { [abilityNodeEssenceType(option.abilityId)]: rowEssenceCost(tier, row) },
    shards: shardLane ? { [shardLane]: rowShardCost(tier, row) } : {},
  };
}

/**
 * The resolved payoff of a `packet` option: the lineage payoff row's own value
 * for that lane and band, times the node share. A `cross` option is the same
 * packet-row payoff at the cross scalar (design §22.1: "the cross row borrows one
 * of the ability's other two offers at `ROW_SCALAR.cross`") — `payoffValue` takes
 * the row, so the cross row's scalar and band replace the payoff row's and the
 * node share applies to both alike. No second runtime.
 *
 * A binary payoff (stun, cleanse) has no share to take — "half a stun" is not a
 * shorter stun, it is no stun — so the node table never uses one, and this
 * returns undefined rather than quietly handing back a full-strength one.
 */
export function abilityNodePayoff(option: AbilityNodeOption): LineagePayoff | undefined {
  if (option.row !== 'packet' && option.row !== 'cross') return undefined;
  const unit = PAYOFF_UNIT.get(option.payoff);
  if (!unit || unit.binary) return undefined;

  const { magnitude, durationMs } = payoffValue({
    payoff: option.payoff,
    tier: abilityNodeTier(option),
    row: NODE_ROW_AS_LINEAGE_ROW[option.row],
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

/**
 * The share of a hit a keystone that `paysShare` lands — straight off the
 * magnitude table at `ROW_SCALAR.keystone`, in the keystone row's band, through
 * `payoffValue` (design §22.4: "durations and shares come from the magnitude table
 * at `ROW_SCALAR.keystone`"). The lane is the active packet's — the route the
 * ability runs — so the lane budget applies exactly as it does to the packet
 * payoff; with none slotted, the Technique lane's, the packet every ability is.
 */
export function abilityKeystoneShare(
  keystoneOption: AbilityNodeOption,
  progress?: AbilityNodeProgress,
): number {
  const lane = activePacketLane(keystoneOption.abilityId, progress) ?? 'technique';
  return payoffValue({
    payoff: keystoneOption.payoff,
    tier: abilityNodeTier(keystoneOption),
    row: 'keystone',
    lane,
  }).magnitude;
}

/**
 * The wind-up an ability amplifier's `cast` axis takes off, as a cast-speed
 * fraction that joins `technique.cast-speed-pct` in ONE capped sum (design §22.9:
 * "the 60% cap holds against every source combined").
 *
 * Derived from the amplifier's own boost, never authored: the axis makes the cast
 * `1 + ABILITY_NODE_SHARE.amplifier` times as fast — the same "boost" the other
 * axes apply to a window or a share — which is a wind-up `1 / (1 + boost)` as
 * long, i.e. this fraction of it removed. On its own it can never reach the cap.
 */
export function abilityNodeCastSpeedPct(): number {
  return Math.round((1 - 1 / (1 + ABILITY_NODE_SHARE.amplifier)) * 1000) / 1000;
}

/** An option with its tier, mastery gate, cost and payoff filled in. */
export function resolveAbilityNodeOption(
  option: AbilityNodeOption,
  /** The player's progress on this ability: a keystone's price needs the active packet. */
  progress?: AbilityNodeProgress,
): ResolvedAbilityNodeOption {
  const tier = abilityNodeTier(option);
  const payoff = abilityNodePayoff(option);
  return {
    option,
    tier,
    requiredGlobalMastery: ladderMasteryLevelForRow(tier, NODE_ROW_AS_LINEAGE_ROW[option.row]),
    cost: abilityNodeCost(option, progress),
    ...(payoff ? { payoff } : {}),
  };
}
