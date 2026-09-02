import { T2_ROUTES } from "../routes/t2RouteBuilder";
import { T2_CLASS_PLANS } from "../routes/t2GearPlans";
import { planAcquisition } from "../routes/t2Acquisition";
import { t2EntryProfileId, TIER_ENTRY_PROFILES } from "../tierEntry/profiles";

/**
 * Print the eighteen Tier-2 branch routes: how many steps, and -- the part that
 * matters -- which acquisition path each planned item resolved to.
 * `pnpm bot:t2-routes`.
 */
console.log(`${T2_ROUTES.length} Tier-2 branch routes\n`);

for (const plan of T2_CLASS_PLANS) {
  const profile = TIER_ENTRY_PROFILES.get(t2EntryProfileId(plan.classRoot, "clean"))!;
  console.log(`=== ${plan.slug} (${plan.classRoot}) ===`);
  console.log(`  hypothesis: ${plan.hypothesis}`);
  for (const [group, biomePlan] of Object.entries(plan.biomes)) {
    const lines: string[] = [];
    for (const id of biomePlan.adopt ?? []) {
      const a = planAcquisition(profile, id);
      lines.push(`    ADOPT      ${id.padEnd(24)} ${a.path.toUpperCase().padEnd(22)} ${a.reason}`);
    }
    for (const id of biomePlan.craftOnly ?? []) {
      const a = planAcquisition(profile, id);
      lines.push(`    craft-only ${id.padEnd(24)} ${a.path.toUpperCase().padEnd(22)} ${a.reason}`);
    }
    for (const [id, why] of Object.entries(biomePlan.skip ?? {})) {
      lines.push(`    skip       ${id.padEnd(24)} ${"-".padEnd(22)} ${why}`);
    }
    if (biomePlan.learn) lines.push(`    learn      ${biomePlan.learn.abilityId}`);
    if (lines.length) console.log(`  ${group}:\n${lines.join("\n")}`);
  }
  const route = T2_ROUTES.find((r) => r.id === `${plan.slug}-t2-mid`)!;
  console.log(`  route ${route.id}: ${route.steps.length} steps\n`);
}

// Aggregate: how much of the tier is reachable at all, and how much of it has
// to be bought at the expensive reconstruction price.
const counts: Record<string, number> = {};
for (const plan of T2_CLASS_PLANS) {
  const profile = TIER_ENTRY_PROFILES.get(t2EntryProfileId(plan.classRoot, "clean"))!;
  for (const biomePlan of Object.values(plan.biomes)) {
    for (const id of [...(biomePlan.adopt ?? []), ...(biomePlan.craftOnly ?? [])]) {
      const path = planAcquisition(profile, id).path;
      counts[path] = (counts[path] ?? 0) + 1;
    }
  }
}
console.log("acquisition paths across all six class plans:", JSON.stringify(counts));
