import { NODE_MODIFIER_FAMILIES, RECIPE_DATABASE } from "@mmo-idle/shared";

/**
 * Total Tier-2 catalyst demand, per family, if every Tier-2 item were obtained
 * and taken to +5 by its most expensive path.
 *
 * This is the number that sizes the `catalyst-primed` entry wallet, and the one
 * that explains why an accelerated Tier-2 run is catalyst-bound rather than
 * combat-bound: the dev reward multiplier deliberately does NOT scale catalyst
 * progress (`rewards.ts`), so catalysts mint at 1x in every run no matter what.
 *
 * `pnpm bot:t2-catalyst-demand`
 */
const demand: Record<string, number> = Object.fromEntries(
  NODE_MODIFIER_FAMILIES.map((f) => [f, 0]),
);
const rows: string[] = [];

for (const recipe of RECIPE_DATABASE.values()) {
  if (recipe.tier !== 2) continue;
  const per: Record<string, number> = {};
  const add = (cost: Partial<Record<string, number>> | undefined): void => {
    for (const [family, amount] of Object.entries(cost ?? {})) {
      per[family] = (per[family] ?? 0) + (amount ?? 0);
    }
  };
  // The worse of the two acquisition paths, because which one a given character
  // gets is decided by its Tier-1 history, not by the route.
  const evolveTotal = Object.values(recipe.catalystCost ?? {}).reduce<number>((a, b) => a + (b ?? 0), 0);
  const reconstructTotal = Object.values(recipe.reconstructCatalystCost ?? {}).reduce<number>(
    (a, b) => a + (b ?? 0),
    0,
  );
  add(reconstructTotal > evolveTotal ? recipe.reconstructCatalystCost : recipe.catalystCost);
  for (const step of recipe.upgrades ?? []) add(step.catalystCost);

  if (Object.keys(per).length === 0) continue;
  rows.push(`  ${recipe.recipeGroup.padEnd(9)} ${recipe.id.padEnd(24)} ${JSON.stringify(per)}`);
  for (const [family, amount] of Object.entries(per)) demand[family] = (demand[family] ?? 0) + amount;
}

console.log("Per-item Tier-2 catalyst demand (worst acquisition path + all +5 upgrade steps):");
console.log(rows.sort().join("\n"));
console.log("\nTotal Tier-2 catalyst demand by family:");
console.log(JSON.stringify(demand, null, 1));
console.log(
  "\nNote: the dev reward multiplier does NOT scale catalyst progress " +
    "(deliberate -- see rewards.ts). These are the same numbers at 1x and at 100x.",
);
