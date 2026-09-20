import type { EquipmentMap, Recipe } from '@mmo-idle/shared';
import { RECIPE_DATABASE, requiredPlusFor } from '@mmo-idle/shared';
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

export function evolutionPlan(params: {
  recipe: Recipe;
  inventory: readonly string[];
  equipment: Readonly<EquipmentMap>;
  itemUpgrades: Record<string, number>;
}): EvolutionPlan | null {
  const { recipe, inventory, equipment, itemUpgrades } = params;
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

  return {
    recipe,
    predecessor,
    requiredPlus,
    ownedPlus,
    equipped,
    consumedPlus,
    resultPlus,
    meetsPlus: ownedPlus !== null && ownedPlus >= requiredPlus,
    diff: computeEvolutionDiff(predecessor.id, consumedPlus, recipe.id, resultPlus),
  };
}
