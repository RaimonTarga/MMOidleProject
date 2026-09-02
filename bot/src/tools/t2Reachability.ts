import { RECIPE_DATABASE, EVOLUTION_REQUIRED_PLUS } from "@mmo-idle/shared";
import { TIER_ENTRY_PROFILES } from "../tierEntry/profiles";

/**
 * Which Tier-2 items can each Tier-2 entry template actually obtain, and by
 * which path?
 *
 * 20 of the 32 Tier-2 recipes are EVOLUTIONS of a specific Tier-1 predecessor
 * (`evolvesFrom`), and `craftRecipe` refuses them outright. An evolution needs
 * the predecessor sitting in the BAG at +5; otherwise the only route is
 * reconstruction, which is a separate, more expensive cost axis and is only
 * possible where `reconstructCost` is authored.
 *
 * That makes Tier-2 gear reachability a function of what the character happened
 * to craft in Tier 1 -- which is exactly the sort of thing a route can get
 * silently wrong and spend hours failing to act on. `pnpm bot:t2-reachability`.
 */
const T2 = [...RECIPE_DATABASE.values()].filter((r) => r.tier === 2);

for (const profile of TIER_ENTRY_PROFILES.values()) {
  if (!profile.id.endsWith("-clean")) continue; // economy mode does not change ownership
  const bag = new Set(profile.inventory);
  const equipped = new Set(Object.values(profile.equipment).filter((id): id is string => !!id));
  console.log(`\n=== ${profile.classRoot} (${profile.id}) ===`);
  console.log(`  bag      ${[...bag].join(", ") || "(empty)"}`);
  console.log(`  equipped ${[...equipped].join(", ")}`);
  console.log(`  upgrades ${JSON.stringify(profile.itemUpgrades)}`);
  for (const recipe of T2) {
    const pred = recipe.evolvesFrom;
    let verdict: string;
    if (!pred) {
      verdict = "CRAFT (plain recipe)";
    } else {
      const plus = profile.itemUpgrades[pred] ?? 0;
      const held = bag.has(pred) ? "bag" : equipped.has(pred) ? "EQUIPPED" : "absent";
      if (held === "bag" && plus >= EVOLUTION_REQUIRED_PLUS) {
        verdict = `EVOLVE (${pred} +${plus} in bag)`;
      } else if (held === "EQUIPPED" && plus >= EVOLUTION_REQUIRED_PLUS) {
        verdict = `EVOLVE after unequip (${pred} +${plus} is worn, not in bag)`;
      } else if (recipe.reconstructCost) {
        verdict = `RECONSTRUCT (${pred} ${held}${held === "absent" ? "" : ` +${plus}`}) cost=${JSON.stringify(recipe.reconstructCost)}+${JSON.stringify(recipe.reconstructCatalystCost ?? {})}`;
      } else {
        verdict = `UNREACHABLE (needs ${pred} +${EVOLUTION_REQUIRED_PLUS}, have ${held} +${plus}; no reconstruct cost authored)`;
      }
    }
    console.log(`    ${recipe.recipeGroup.padEnd(9)} ${recipe.id.padEnd(24)} ${verdict}`);
  }
}
