import { EVOLUTION_REQUIRED_PLUS, NODE_BIOMES, RECIPE_DATABASE, biomeLevelCap } from "@mmo-idle/shared";
import { T2_BRANCHES, T2_CONTROL_ROUTE_IDS, T2_ROUTES, rangeSkillId } from "./t2RouteBuilder";
import { T2_CLASS_PLANS } from "./t2GearPlans";
import { T2_PROGRESSION_ORDER } from "./t2Common";
import { planAcquisition } from "./t2Acquisition";
import { t2EntryProfileId, TIER_ENTRY_PROFILES } from "../tierEntry/profiles";
import type { RouteStep } from "../route/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function flatten(steps: readonly RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (step.type === "repeatUntil" || step.type === "ifPossible") out.push(...flatten(step.steps));
  }
  return out;
}

assert(T2_ROUTES.length === 18, "six class plans x three branches");
assert(new Set(T2_ROUTES.map((r) => r.id)).size === 18, "route ids are unique");
assert(T2_CONTROL_ROUTE_IDS.length === 6, "the control cohort is one branch per class");

for (const route of T2_ROUTES) {
  const steps = flatten(route.steps);
  assert(route.startsFromTierEntry === 2, `${route.id}: declares Tier-2 entry`);

  // The controlled variable is biome ORDER. If a route ever visits the biomes in
  // a different sequence it is no longer comparable to the rest of the cohort,
  // and every cross-class conclusion drawn from the batch is void.
  const visited = steps
    .filter((s): s is Extract<RouteStep, { type: "travel" }> => s.type === "travel")
    .map((s) => (s.to.kind === "biome" ? s.to.biomeGroup : null));
  assert(
    JSON.stringify(visited) === JSON.stringify([...T2_PROGRESSION_ORDER]),
    `${route.id}: visits the control biome order exactly once each (got ${visited.join(" -> ")})`,
  );

  // Every leg farms to the live playerTier-2 cap, not to a number typed by hand.
  for (const group of T2_PROGRESSION_ORDER) {
    const farm = steps.find(
      (s) =>
        s.type === "farm" &&
        s.until.type === "biomeLevelAtLeast" &&
        s.until.biomeGroup === group &&
        s.until.level === biomeLevelCap(2, group),
    );
    assert(farm, `${route.id}: maxes ${group} to the live tier-2 cap of ${biomeLevelCap(2, group)}`);
  }

  // Every biome gets a boss attempt: the seals are the tier gate, and a biome
  // whose boss was never tried produces no evidence about that boss.
  for (const group of T2_PROGRESSION_ORDER) {
    assert(
      steps.some((s) => s.type === "attemptBoss" && s.biomeGroup === group && s.tier === 2),
      `${route.id}: attempts the ${group} Tier-2 boss`,
    );
  }

  // The branch is bought behind an `ifPossible`, never unconditionally. A bare
  // `unlockSkill` would wait for a skill point the run may never earn and stall
  // out the whole route, destroying the record of where it was actually walled.
  const branch = route.steps.find((s) => s.type === "ifPossible");
  assert(branch && branch.type === "ifPossible", `${route.id}: gates its branch behind ifPossible`);
  assert(
    branch.when.type === "playerTierAtLeast" && branch.when.tier === 3,
    `${route.id}: the branch gate is reaching player tier 3`,
  );
  const unlock = branch.steps.find((s) => s.type === "unlockSkill");
  assert(unlock && unlock.type === "unlockSkill", `${route.id}: the branch buys a skill`);
  const expectedBranch = T2_BRANCHES.find((b) => route.id.endsWith(`-${b}`))!;
  assert(
    unlock.skillId === rangeSkillId(route.classRoot, expectedBranch),
    `${route.id}: buys its own range node (${unlock.skillId})`,
  );
  assert(
    steps.filter((s) => s.type === "unlockSkill").length === 1,
    `${route.id}: spends exactly one skill point`,
  );
}

// A class's three branch variants must be identical apart from the range node,
// or the branch is not the independent variable it claims to be.
for (const plan of T2_CLASS_PLANS) {
  const [close, mid, far] = T2_BRANCHES.map(
    (b) => T2_ROUTES.find((r) => r.id === `${plan.slug}-t2-${b}`)!,
  );
  // Drop the branch gate and its contents; everything else must match byte for
  // byte, including labels.
  const strip = (r: typeof close): string =>
    JSON.stringify(
      flatten(r.steps).filter((s) => s.type !== "unlockSkill" && s.type !== "ifPossible"),
    );
  assert(
    strip(close) === strip(mid) && strip(mid) === strip(far),
    `${plan.slug}: the three branch variants differ only in the range node`,
  );
}

// Acquisition paths must agree with the class's own entry template. A `craft`
// step aimed at an evolution recipe is rejected by the server outright, and a
// stale plan here is exactly the failure this test exists to catch early.
for (const plan of T2_CLASS_PLANS) {
  const profile = TIER_ENTRY_PROFILES.get(t2EntryProfileId(plan.classRoot, "clean"))!;
  for (const [group, biomePlan] of Object.entries(plan.biomes)) {
    for (const id of [...(biomePlan.adopt ?? []), ...(biomePlan.craftOnly ?? [])]) {
      const recipe = RECIPE_DATABASE.get(id);
      assert(recipe, `${plan.slug}/${group}: ${id} is a real recipe`);
      assert(recipe.tier === 2, `${plan.slug}/${group}: ${id} is a Tier-2 recipe`);
      assert(
        recipe.recipeGroup === group,
        `${plan.slug}: ${id} is planned in ${group} but belongs to ${recipe.recipeGroup}`,
      );
      const acquisition = planAcquisition(profile, id);
      if (acquisition.path === "evolve" || acquisition.path === "evolve-after-unequip") {
        assert(
          (profile.itemUpgrades[acquisition.predecessorId!] ?? 0) >= EVOLUTION_REQUIRED_PLUS,
          `${plan.slug}: ${id} evolves only from a +${EVOLUTION_REQUIRED_PLUS} predecessor`,
        );
      }
    }
    // A skip must name a real recipe, or the adoption report counts a typo as a
    // deliberate design decision.
    for (const id of Object.keys(biomePlan.skip ?? {})) {
      assert(RECIPE_DATABASE.get(id)?.tier === 2, `${plan.slug}/${group}: skip names a real T2 recipe (${id})`);
    }
  }
}

// Anything that costs catalysts must farm for them where they are MINTED.
// Catalysts come from the node modifier and from nothing else, so a cost-farm
// pointed at the plain biome ref waits on a wallet that may never fill -- the
// failure that cost a measured Striker run 521 of its 540 seconds.
for (const route of T2_ROUTES) {
  for (const step of flatten(route.steps)) {
    let cost: Partial<Record<string, number>> | undefined;
    let id: string;
    if (step.type === "evolveItem") {
      const recipe = RECIPE_DATABASE.get(step.recipeId)!;
      cost = step.mode === "reconstruct" ? recipe.reconstructCatalystCost : recipe.catalystCost;
      id = step.recipeId;
    } else if (step.type === "craft") {
      const recipe = RECIPE_DATABASE.get(step.recipeIds[0])!;
      cost = recipe.catalystCost;
      id = step.recipeIds[0];
    } else {
      continue;
    }
    const families = Object.entries(cost ?? {}).filter(([, n]) => (n ?? 0) > 0).map(([f]) => f);
    if (families.length !== 1) continue;
    const family = families[0];
    const at = step.farmAt;
    if (!at || at.kind !== "biome") continue;
    // Only demand it where the biome actually HAS a node of that family; the
    // helper falls back deliberately rather than making a route unresolvable.
    const available = Object.values(NODE_BIOMES).some(
      (info) =>
        info.biomeGroup === at.biomeGroup &&
        info.biomeTier === 2 &&
        info.kind === "normal" &&
        (info as { modifier?: string }).modifier === family,
    );
    if (!available) continue;
    assert(
      at.modifier === family,
      `${route.id}: ${id} costs ${family} catalysts but farms at an unfiltered ${at.biomeGroup} ref`,
    );
  }
}

console.log("t2Routes.semantic.test.ts: ok");
