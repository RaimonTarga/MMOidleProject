import type { EssenceType } from '../items';
import { ESSENCE_LABELS } from '../items';
import type { Recipe } from '../data/recipes/types';

/**
 * Item evolution & reconstruction (system rework Step 6).
 *
 * An EVOLVED recipe (`evolvesFrom` set) can be crafted two ways, both requiring the
 * recipe to be unlocked (biome level), like normal crafting:
 *  - EVOLVE: consume the predecessor item at +{@link EVOLUTION_REQUIRED_PLUS}, pay the
 *    recipe's `cost`/`catalystCost` (the cheaper "true evolution" cost).
 *  - RECONSTRUCT: pay `reconstructCost`/`reconstructCatalystCost` (higher), no predecessor.
 *
 * These checks are the shared authority — the server applies them and the client
 * gates the buttons, exactly like `checkUpgrade`.
 */

/**
 * Minimum predecessor upgrade level required to evolve.
 *
 * History: +3 originally; raised to +5 by the T2 progression/economy pass
 * (2026-08-29, docs/briefs/T2_PROGRESSION_ECONOMY_IMPLEMENTATION_2026-08-29.md)
 * so that fully committing to a T1 item earned real credit; LOWERED BACK TO +3
 * on 2026-09-04 by designer decision.
 *
 * Why it came back down: the canonical Tier-1 routes were never updated for the
 * +5 gate, and they take only SOME gear that far (Striker's flash-rapier ends at
 * +4, its iron-broadsword at +1). Measured against the six Tier-2 class plans,
 * that left **22 of 50 planned acquisitions paying ~3.5x reconstruction** for
 * predecessors the character had genuinely invested in — the gate was not
 * rewarding commitment, it was taxing a route/gate mismatch. See
 * docs/briefs/t2-bossless-progression-campaign-2026-09-03.md section 12.
 *
 * The gate is evaluated at Tier-2 time, not at Tier-1 snapshot-capture time, so
 * this change does not invalidate already-captured T1 handoff snapshots.
 */
export const EVOLUTION_REQUIRED_PLUS = 3;

/**
 * Predecessor +level required to evolve/rank-up into `recipe`. Gear evolves from a
 * +3 predecessor; cores (Step 9) are off the +N upgrade track entirely, so a core
 * rank-up only requires *owning* the predecessor rank (+0).
 */
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

function affordEssence(
  cost: Partial<Record<EssenceType, number>> | undefined,
  essences: Record<EssenceType, number>,
): EvolveCheck {
  for (const [type, amount] of Object.entries(cost ?? {})) {
    if ((essences[type as EssenceType] ?? 0) < (amount ?? 0)) {
      return { ok: false, reason: `Not enough ${ESSENCE_LABELS[type as EssenceType]} essence (need ${amount}).` };
    }
  }
  return { ok: true };
}

function affordCatalysts(
  cost: Partial<Record<string, number>> | undefined,
  catalysts: Record<string, number> | undefined,
): EvolveCheck {
  for (const [group, amount] of Object.entries(cost ?? {})) {
    if ((catalysts?.[group] ?? 0) < (amount ?? 0)) {
      return { ok: false, reason: `Not enough ${group} catalysts (need ${amount}).` };
    }
  }
  return { ok: true };
}

/** Whether the player can EVOLVE into `recipe` (consume the +3 predecessor). */
export function checkEvolve(params: {
  recipe: Recipe;
  /** Bag contents (item ids). The predecessor copy that gets consumed must be here. */
  inventory: readonly string[];
  /** Per-item-id upgrade levels. */
  itemUpgrades: Record<string, number>;
  essences: Record<EssenceType, number>;
  catalysts?: Record<string, number>;
  /** Test room skips ownership + cost gates. */
  isTestRoom?: boolean;
}): EvolveCheck {
  const { recipe, inventory, itemUpgrades, essences, catalysts, isTestRoom } = params;
  if (!recipe.evolvesFrom) return { ok: false, reason: 'This recipe is not an evolution.' };
  if (isTestRoom) return { ok: true };

  const predId = recipe.evolvesFrom;
  if (!inventory.includes(predId)) {
    return { ok: false, reason: 'Predecessor item must be in your bag to evolve.' };
  }
  const reqPlus = requiredPlusFor(recipe);
  if ((itemUpgrades[predId] ?? 0) < reqPlus) {
    return { ok: false, reason: `Predecessor must be +${reqPlus} to evolve.` };
  }

  const essCheck = affordEssence(recipe.cost, essences);
  if (!essCheck.ok) return essCheck;
  return affordCatalysts(recipe.catalystCost, catalysts);
}

/** Whether the player can RECONSTRUCT `recipe` directly (no predecessor). */
export function checkReconstruct(params: {
  recipe: Recipe;
  essences: Record<EssenceType, number>;
  catalysts?: Record<string, number>;
  isTestRoom?: boolean;
}): EvolveCheck {
  const { recipe, essences, catalysts, isTestRoom } = params;
  if (!recipe.evolvesFrom) return { ok: false, reason: 'This recipe is not an evolution.' };
  if (!recipe.reconstructCost) {
    return { ok: false, reason: 'This lineage cannot be reconstructed directly.' };
  }
  if (isTestRoom) return { ok: true };

  const essCheck = affordEssence(recipe.reconstructCost, essences);
  if (!essCheck.ok) return essCheck;
  return affordCatalysts(recipe.reconstructCatalystCost, catalysts);
}
