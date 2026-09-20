import type { EquipmentMap, EquipmentPreviewInput, Recipe } from '@mmo-idle/shared';
import { RECIPE_DATABASE, previewEquipmentStats, requiredPlusFor } from '@mmo-idle/shared';
import { computeEvolutionDiff, type EvolutionDiff } from './itemDisplay';

/**
 * Everything the evolution surfaces need to know, read once from the
 * authoritative shapes rather than re-derived per widget.
 *
 * The semantics encoded here are the server's, from
 * `server/src/systems/player/economy/itemEvolution.ts`:
 *  - EVOLVE consumes the predecessor. An EQUIPPED predecessor is preferred and
 *    the evolved item takes its slot directly, so the player never has to
 *    unequip; a bagged one is spliced out of the inventory.
 *  - Upgrades do NOT transfer. `itemUpgrades` is keyed by item DEFINITION and is
 *    left untouched, so the evolved item arrives at whatever level the account
 *    already holds for it — normally +0.
 *  - RECONSTRUCT pays the higher cost, touches no predecessor, and always
 *    delivers to the bag (the equip-in-place branch is evolve-only).
 */
export interface EvolutionPlan {
  recipe: Recipe;
  predecessor: Recipe;
  /** Predecessor +level the evolution demands. */
  requiredPlus: number;
  /** Player's level on the predecessor definition; null when they own none. */
  ownedPlus: number | null;
  equipped: boolean;
  /** The +level the predecessor would actually be consumed at. */
  consumedPlus: number;
  /** The +level the evolved item arrives at. */
  resultPlus: number;
  meetsPlus: boolean;
  diff: EvolutionDiff | null;
}

/**
 * The rest of the character, needed only for the build-level rows (DPS), which
 * cannot be read off the item: the same weapon is worth a different amount to a
 * Striker and a Conduit. Omit it and those rows are simply absent — an
 * unresolvable number is not worth inventing.
 */
export type EvolutionBuildContext = Omit<EquipmentPreviewInput, 'equipment' | 'itemUpgrades'>;

export function evolutionPlan(params: {
  recipe: Recipe;
  inventory: readonly string[];
  equipment: Readonly<EquipmentMap>;
  itemUpgrades: Record<string, number>;
  build?: EvolutionBuildContext;
}): EvolutionPlan | null {
  const { recipe, inventory, equipment, itemUpgrades, build } = params;
  if (!recipe.evolvesFrom) return null;
  const predecessor = RECIPE_DATABASE.get(recipe.evolvesFrom);
  if (!predecessor) return null;

  const equipped = equipment[recipe.slot] === predecessor.id;
  const owns = equipped || inventory.includes(predecessor.id);
  const ownedPlus = owns ? (itemUpgrades[predecessor.id] ?? 0) : null;
  const requiredPlus = requiredPlusFor(recipe);
  // Owning it above the gate does not waste the surplus quietly — the item is
  // consumed as it stands, so that is the state the comparison is drawn from.
  const consumedPlus = Math.max(requiredPlus, ownedPlus ?? 0);
  const resultPlus = itemUpgrades[recipe.id] ?? 0;

  const diff = computeEvolutionDiff(predecessor.id, consumedPlus, recipe.id, resultPlus);
  if (diff && build) {
    const row = buildDpsRow(build, equipment, itemUpgrades, predecessor, consumedPlus, recipe, resultPlus);
    // DPS leads: it is the one row that answers "is this weapon better for ME",
    // and on a lineage branch it is the only row that resolves the trade.
    if (row) diff.rows.unshift(row);
  }

  return {
    recipe,
    predecessor,
    requiredPlus,
    ownedPlus,
    equipped,
    consumedPlus,
    resultPlus,
    meetsPlus: ownedPlus !== null && ownedPlus >= requiredPlus,
    diff,
  };
}

const roundDps = (v: number): number => Math.round(v * 100) / 100;

/**
 * Sustained DPS for this character wearing each side of the evolution, through
 * the same `previewEquipmentStats` the inventory stat sheet uses — so the two
 * panels can never disagree about what a weapon is worth.
 *
 * BOTH sides are hypothetical on purpose. The slot may currently hold something
 * else entirely, and the question the preview answers is what the predecessor
 * becomes, not what the player happens to be wearing right now.
 */
function buildDpsRow(
  build: EvolutionBuildContext,
  equipment: Readonly<EquipmentMap>,
  itemUpgrades: Record<string, number>,
  predecessor: Recipe,
  consumedPlus: number,
  recipe: Recipe,
  resultPlus: number,
) {
  // Upgrade levels are per definition, so the consumed/arriving levels are
  // pinned here rather than trusting whatever the account happens to hold.
  const levels = { ...itemUpgrades, [predecessor.id]: consumedPlus, [recipe.id]: resultPlus };
  const at = (itemId: string) => previewEquipmentStats({
    ...build,
    equipment: { ...equipment, [recipe.slot]: itemId },
    itemUpgrades: levels,
  }).stats.dps;

  const from = roundDps(at(predecessor.id));
  const to = roundDps(at(recipe.id));
  if (from === to) return null;
  const delta = roundDps(to - from);
  return {
    key: 'dps',
    label: 'DPS',
    from: String(from),
    to: String(to),
    delta: `${delta >= 0 ? '+' : ''}${delta}`,
  };
}
