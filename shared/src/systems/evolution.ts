import type { EssenceType, EquipmentMap } from '../items';
import type { Recipe } from '../data/recipes/types';

/**
 * Item evolution & reconstruction — RETIRED on every slot (design §24.5).
 *
 * An evolved recipe (`evolvesFrom` set) used to be craftable two ways: EVOLVE
 * (consume the predecessor at +{@link EVOLUTION_REQUIRED_PLUS}, pay `cost`) or
 * RECONSTRUCT (pay `reconstructCost`, no predecessor). Weapons left this path in
 * progression rework Phase 2b (their tier-2+ forms open at the lineage gate);
 * armour, charm and boots left it in the course correction, where their T2+
 * items became plain recipes gated by biome level. One rule for every slot now:
 * both checks refuse, and `crafting:evolveItem` answers with the same refusal.
 *
 * `evolvesFrom` survives on weapon recipes only, as the lineage form graph the
 * weapon trees were authored from; it no longer means "craftable by evolving".
 * The constants below are kept for the legacy bot route builders that still
 * describe historical evolve plans; nothing live reads them.
 */

/** Retired with the path; kept for the legacy bot route builders (see above). */
export const EVOLUTION_REQUIRED_PLUS = 3;

/** Retired with the path; kept for the legacy bot route builders (see above). */
export function requiredPlusFor(recipe: Recipe): number {
  return recipe.slot === 'core' || recipe.slot === 'relic' ? 0 : EVOLUTION_REQUIRED_PLUS;
}

export type EvolveMode = 'evolve' | 'reconstruct';

export function isEvolvedRecipe(recipe: Recipe): boolean {
  return recipe.evolvesFrom !== undefined;
}

export interface EvolveCheck {
  ok: boolean;
  reason?: string;
}

/** Why both checks refuse, for every slot. */
export const EVOLUTION_RETIRED_REASON =
  'Evolving is retired: craft the item from its recipe, or open a weapon form at its gate.';
const RETIRED: EvolveCheck = { ok: false, reason: EVOLUTION_RETIRED_REASON };

/** Whether the player can EVOLVE into `recipe`. Never: the path is retired. */
export function checkEvolve(_params: {
  recipe: Recipe;
  inventory: readonly string[];
  equipment?: Readonly<EquipmentMap>;
  itemUpgrades: Record<string, number>;
  essences: Record<EssenceType, number>;
  isTestRoom?: boolean;
}): EvolveCheck {
  return RETIRED;
}

/** Whether the player can RECONSTRUCT `recipe`. Never: the path is retired. */
export function checkReconstruct(_params: {
  recipe: Recipe;
  essences: Record<EssenceType, number>;
  isTestRoom?: boolean;
}): EvolveCheck {
  return RETIRED;
}
