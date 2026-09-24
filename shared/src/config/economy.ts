/** Economy v2 candidate. T0/T1 are the unchanged denomination anchor.
 * Curves are independent: reward opportunity, acquisition effort and mastery time.
 * T5+ hold T4 values until their content/economy is authored (not a pacing promise).
 */
export const ECONOMY_BY_TIER = [
  { essenceReward: 1, xpReward: 1, xpBudget: 0, catalystProgress: 1, essenceCost: 1, catalystCost: 1 },
  { essenceReward: 2, xpReward: 2, xpBudget: 1_750, catalystProgress: 0.5, essenceCost: 1, catalystCost: 1 },
  { essenceReward: 8, xpReward: 8, xpBudget: 32_000, catalystProgress: 1, essenceCost: 6, catalystCost: 2 },
  { essenceReward: 16, xpReward: 12, xpBudget: 168_000, catalystProgress: 1.5, essenceCost: 20, catalystCost: 4 },
  { essenceReward: 48, xpReward: 30, xpBudget: 1_080_000, catalystProgress: 2, essenceCost: 80, catalystCost: 8 },
] as const;

export function economyForTier(tier: number) {
  return ECONOMY_BY_TIER[Math.max(0, Math.min(4, Math.floor(tier)))];
}

/** Authored costs remain base denominations; public databases expose payable prices.
 * Apply exactly once during registration, never again in UI/server consumers.
 */
export function scaleEconomyCost<T extends Partial<Record<string, number>>>(cost: T, factor: number): T {
  return Object.fromEntries(Object.entries(cost).map(([key, value]) => [key, Math.round((value ?? 0) * factor)])) as T;
}

/** T2+ full upgrade totals are preserved; +1…+3 now buys 40%, tail buys 60%.
 * Cumulative rounding preserves each colour's full price exactly.
 */
export const ECONOMY_UPGRADE_SHARES = [6, 14, 20, 27, 33] as const;

type Cost = Partial<Record<string, number>>;
interface PricedRecipe {
  tier: number;
  cost: Cost;
  catalystCost?: Cost;
  reconstructCost?: Cost;
  reconstructCatalystCost?: Cost;
  upgrades?: { cost: Cost; catalystCost?: Cost }[];
}

export function priceRecipeForEconomy<T extends PricedRecipe>(recipe: T): T {
  if (recipe.tier <= 1) return recipe;
  const { essenceCost, catalystCost } = economyForTier(recipe.tier);
  const result = { ...recipe, cost: scaleEconomyCost(recipe.cost, essenceCost) };
  if (recipe.catalystCost) result.catalystCost = scaleEconomyCost(recipe.catalystCost, catalystCost);
  if (recipe.reconstructCost) result.reconstructCost = scaleEconomyCost(recipe.reconstructCost, essenceCost);
  if (recipe.reconstructCatalystCost) result.reconstructCatalystCost = scaleEconomyCost(recipe.reconstructCatalystCost, catalystCost);
  if (recipe.upgrades) {
    const totals: Cost = {};
    for (const step of recipe.upgrades) {
      for (const [colour, value] of Object.entries(step.cost)) totals[colour] = (totals[colour] ?? 0) + (value ?? 0);
    }
    let share = 0;
    result.upgrades = recipe.upgrades.map((step, index) => {
      const before = share;
      share += ECONOMY_UPGRADE_SHARES[index] ?? 0;
      // Only the authored five-step track is redistributed; other lengths retain shape.
      const cost = recipe.upgrades!.length === ECONOMY_UPGRADE_SHARES.length
        ? Object.fromEntries(Object.entries(totals).map(([colour, value]) => [colour,
          Math.round((value ?? 0) * essenceCost * share / 100) - Math.round((value ?? 0) * essenceCost * before / 100),
        ]))
        : scaleEconomyCost(step.cost, essenceCost);
      return { ...step, cost, ...(step.catalystCost ? { catalystCost: scaleEconomyCost(step.catalystCost, catalystCost) } : {}) };
    });
  }
  return result;
}
