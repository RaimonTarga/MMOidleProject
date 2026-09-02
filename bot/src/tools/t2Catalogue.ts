import {
  RECIPE_DATABASE,
  biomeLevelCap,
  upgradeCeilingFromGlobalMastery,
} from "@mmo-idle/shared";

/**
 * Print the live Tier-2 crafting catalogue, in the order the control route
 * meets it. Regenerate after any balance or content change rather than quoting
 * a stale copy: `pnpm bot:t2-catalogue`.
 */
const ORDER = ["plains", "forest", "swamp", "mountain", "cave", "jungle", "desert"];

console.log("Tier-2 biome caps at playerTier 2 / 3:");
for (const g of ORDER) console.log(`  ${g.padEnd(9)} ${biomeLevelCap(2, g)} / ${biomeLevelCap(3, g)}`);
console.log("\nTier-2 item upgrade ceiling by Global Mastery:");
for (const gm of [30, 36, 42, 48, 54, 60, 66, 72]) {
  console.log(`  GM ${String(gm).padStart(2)} -> +${upgradeCeilingFromGlobalMastery(gm, 2)}`);
}

for (const group of ORDER) {
  console.log(`\n=== ${group.toUpperCase()} (T2) ===`);
  const recipes = [...RECIPE_DATABASE.values()]
    .filter((r) => r.tier === 2 && r.recipeGroup === group)
    .sort((a, b) => a.requiredBiomeLevel - b.requiredBiomeLevel);
  for (const r of recipes) {
    const total: Record<string, number> = { ...r.cost } as unknown as Record<string, number>;
    const cat: Record<string, number> = { ...(r.catalystCost ?? {}) } as unknown as Record<string, number>;
    for (const u of r.upgrades ?? []) {
      for (const [k, v] of Object.entries(u.cost)) total[k] = (total[k] ?? 0) + (v as number);
      for (const [k, v] of Object.entries(u.catalystCost ?? {})) cat[k] = (cat[k] ?? 0) + (v as number);
    }
    console.log(
      `  L${String(r.requiredBiomeLevel).padStart(2)} ${r.slot.padEnd(8)} ${r.id.padEnd(24)}` +
        ` aps=${r.attacksPerSecond ?? "-"} stats=${JSON.stringify(r.stats)}` +
        `${r.mechanicEffects ? ` mech=${JSON.stringify(r.mechanicEffects)}` : ""}` +
        `\n        craft=${JSON.stringify(r.cost)}${r.catalystCost ? `+${JSON.stringify(r.catalystCost)}` : ""}` +
        ` | to+5=${JSON.stringify(total)}+${JSON.stringify(cat)}`,
    );
    if (r.description) console.log(`        "${r.description}"`);
  }
}
