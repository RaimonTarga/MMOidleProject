import {
  EVOLUTION_REQUIRED_PLUS,
  NODE_BIOMES,
  RECIPE_DATABASE,
  STANCE_RECIPE_DATABASE,
  biomeLevelCap,
} from "@mmo-idle/shared";
import {
  T2_BOSSLESS_MASTERY_TARGET,
  T2_BRANCHES,
  T2_CONTROL_ROUTE_IDS,
  T2_PROGRESSION_ROUTES,
  T2_ROUTES,
  rangeSkillId,
} from "./t2RouteBuilder";
import { T2_CLASS_PLANS } from "./t2GearPlans";
import { T2_PROGRESSION_ORDER, type T2BiomeGroup } from "./t2Common";
import { BIOME_ENCOUNTER_SHAPE, guardFor, techniqueFor } from "./t2Loadouts";
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

// ── Every scheduled purchase must be PAYABLE on the leg it is scheduled ────
//
// A gate is a biome LEVEL; affordability is a separate question, and on a clean
// entry it is the binding one. An essence colour is only earned in the biomes
// that mint it, so a cost scheduled before its colour's biome farms forever in a
// node that can never produce it -- no error, no stall, just a run quietly
// spending its whole budget on nothing. `pnpm bot:t2-payable` reports this;
// this test refuses to let a route ship with it.
{
  const ESSENCE_BIOME: Record<string, string> = {
    yellow: "plains",
    green: "forest",
    purple: "swamp",
    blue: "mountain",
    red: "cave",
  };
  const legOf = new Map<string, number>();
  T2_PROGRESSION_ORDER.forEach((g, i) => legOf.set(g, i + 1));
  const familyLeg = new Map<string, number>();
  for (const info of Object.values(NODE_BIOMES)) {
    if (info.biomeTier !== 2 || info.kind !== "normal") continue;
    const family = (info as { modifier?: string }).modifier;
    const leg = legOf.get(info.biomeGroup);
    if (family && leg) familyLeg.set(family, Math.min(familyLeg.get(family) ?? 99, leg));
  }

  const checkCost = (
    routeId: string,
    what: string,
    scheduledLeg: number,
    cost: Partial<Record<string, number>> | undefined,
    catalystCost: Partial<Record<string, number>> | undefined,
  ): void => {
    for (const [type, amount] of Object.entries(cost ?? {})) {
      if ((amount ?? 0) <= 0) continue;
      const leg = legOf.get(ESSENCE_BIOME[type] ?? "") ?? 99;
      assert(
        leg <= scheduledLeg,
        `${routeId}: ${what} is scheduled on leg ${scheduledLeg} but needs ${amount} ${type}, ` +
          `first minted on leg ${leg}`,
      );
    }
    for (const [family, amount] of Object.entries(catalystCost ?? {})) {
      if ((amount ?? 0) <= 0) continue;
      const leg = familyLeg.get(family) ?? 99;
      assert(
        leg <= scheduledLeg,
        `${routeId}: ${what} is scheduled on leg ${scheduledLeg} but needs ${amount} ${family} ` +
          `catalysts, first minted on leg ${leg}`,
      );
    }
  };

  for (const route of T2_ROUTES) {
    let leg = 0;
    for (const step of flatten(route.steps)) {
      if (step.type === "travel" && step.to.kind === "biome") {
        leg = legOf.get(step.to.biomeGroup) ?? leg;
        continue;
      }
      if (step.type === "craft") {
        for (const id of step.recipeIds) {
          const r = RECIPE_DATABASE.get(id)!;
          checkCost(route.id, id, leg, r.cost, r.catalystCost);
        }
      } else if (step.type === "evolveItem") {
        const r = RECIPE_DATABASE.get(step.recipeId)!;
        checkCost(
          route.id,
          step.recipeId,
          leg,
          step.mode === "reconstruct" ? r.reconstructCost : r.cost,
          step.mode === "reconstruct" ? r.reconstructCatalystCost : r.catalystCost,
        );
      } else if (step.type === "craftStance") {
        const r = STANCE_RECIPE_DATABASE.get(step.recipeId)!;
        assert(r, `${route.id}: stance recipe exists (${step.recipeId})`);
        checkCost(route.id, step.recipeId, leg, r.cost, r.catalystCost);
      }
    }
  }
}

// ── The encounter-shape policy, as the designer specified it ───────────────
for (const route of T2_ROUTES) {
  const steps = flatten(route.steps);
  const owned = new Set<string>();
  let leg: T2BiomeGroup | null = null;
  const seenFarmKit = new Set<string>();

  for (const step of steps) {
    if (step.type === "travel" && step.to.kind === "biome") {
      leg = step.to.biomeGroup as T2BiomeGroup;
      continue;
    }
    if (step.type === "craftStance") {
      owned.add(STANCE_RECIPE_DATABASE.get(step.recipeId)!.stanceId);
      continue;
    }
    if (step.type === "setDefaultStance" && step.stanceId) {
      // Never select a stance the run has not learned: the server silently
      // rejects it and the leg then runs in a kit nobody authored.
      assert(
        owned.has(step.stanceId),
        `${route.id}: selects ${step.stanceId} on the ${leg} leg before crafting it`,
      );
    }
    if (step.type === "setAbilities" && leg && !seenFarmKit.has(leg)) {
      seenFarmKit.add(leg);
      const expected = techniqueFor(BIOME_ENCOUNTER_SHAPE[leg]);
      assert(
        step.techniques[0] === expected,
        `${route.id}: ${leg} is a ${BIOME_ENCOUNTER_SHAPE[leg]} biome and must farm with ` +
          `${expected}, not ${step.techniques[0]}`,
      );
      assert(
        step.guards[0] === guardFor(leg),
        `${route.id}: ${leg} must farm with ${guardFor(leg)}, not ${step.guards[0]}`,
      );
    }
  }

  // Cleanse is a designer instruction, and Swamp is the only biome that gets it.
  for (const group of T2_PROGRESSION_ORDER) {
    const expected = group === "swamp" ? "cleanse" : "second-wind";
    assert(guardFor(group) === expected, `${group} guard policy is ${expected}`);
  }

  // Every boss is fought single-target, whatever its biome's farm shape.
  const bossKits = steps.filter(
    (s): s is Extract<RouteStep, { type: "setAbilities" }> =>
      s.type === "setAbilities" && s.techniques[0] === "expose-weakness",
  );
  assert(
    bossKits.length >= T2_PROGRESSION_ORDER.length,
    `${route.id}: every boss is fought with the single-target technique`,
  );

  // Cores are only ever equipped after being crafted, and only unrestricted
  // ones -- a directional core is inert without a range node.
  const craftedCores = new Set<string>();
  for (const step of steps) {
    if (step.type === "craft") {
      for (const id of step.recipeIds) {
        if (RECIPE_DATABASE.get(id)?.slot === "core") craftedCores.add(id);
      }
    }
    if (step.type === "equip") {
      for (const id of step.definitionIds) {
        const recipe = RECIPE_DATABASE.get(id);
        if (recipe?.slot !== "core") continue;
        assert(craftedCores.has(id), `${route.id}: equips core ${id} before crafting it`);
        assert(
          recipe.coreEligibility === "unrestricted",
          `${route.id}: ${id} is a ${recipe.coreEligibility} core, inert without a range node`,
        );
      }
    }
  }
}

// ── The bossless Tier-2 progression cohort ─────────────────────────────────
//
// This family exists because Tier-2 boss balance is being reworked and is
// therefore inadmissible as evidence. These assertions are what keep a future
// edit from quietly reintroducing a boss dependency and voiding a whole cohort.

assert(
  T2_PROGRESSION_ROUTES.length === T2_CLASS_PLANS.length,
  "one bossless progression route per class plan, and no branch axis",
);
assert(
  new Set(T2_PROGRESSION_ROUTES.map((r) => r.id)).size === T2_PROGRESSION_ROUTES.length,
  "bossless route ids are unique",
);

function walkSteps(steps: readonly RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (step.type === "ifPossible" || step.type === "repeatUntil") {
      out.push(...walkSteps(step.steps));
    }
  }
  return out;
}

for (const route of T2_PROGRESSION_ROUTES) {
  assert(route.startsFromTierEntry === 2, `${route.id}: declares Tier-2 entry`);

  const all = walkSteps(route.steps);

  // 1. No boss is fought, at any nesting depth.
  assert(
    all.every((step) => step.type !== "attemptBoss"),
    `${route.id}: must contain no attemptBoss step -- boss outcomes are not evidence here`,
  );

  // 2. No range branch is bought. A bossless run earns no seals, so an
  //    unlockSkill on a range node could never fire; asserting it is absent
  //    keeps the route honest rather than relying on a skipped conditional.
  assert(
    all.every((step) => step.type !== "unlockSkill"),
    `${route.id}: must buy no skill -- a bossless run never reaches playerTier 3`,
  );

  // 3. Completion is biome mastery, never the tier. Keying on playerTier 3
  //    would report every single run of this family as `stalled`.
  assert(
    route.completion.type === "globalMasteryAtLeast" &&
      route.completion.value === T2_BOSSLESS_MASTERY_TARGET,
    `${route.id}: completes on global mastery ${T2_BOSSLESS_MASTERY_TARGET}, not on seals`,
  );

  // 4. No milestone depends on a boss clear or on the tier advancing, so the
  //    summary cannot present boss-derived progress as campaign evidence.
  for (const milestone of route.milestones) {
    assert(
      milestone.when.type !== "bossCleared" && milestone.when.type !== "playerTierAtLeast",
      `${route.id}: milestone "${milestone.id}" depends on boss/tier progress`,
    );
  }

  // 5. Every biome is still visited, in the controlled order, and bracketed by
  //    an entered/leg-complete milestone pair so per-biome dwell time is
  //    recoverable for the response map.
  const visited = route.steps
    .filter((step): step is Extract<RouteStep, { type: "travel" }> => step.type === "travel")
    .map((step) => (step.to.kind === "biome" ? step.to.biomeGroup : null));
  assert(
    JSON.stringify(visited) === JSON.stringify([...T2_PROGRESSION_ORDER]),
    `${route.id}: visits the controlled biome order exactly once each`,
  );
  const milestoneIds = new Set(
    all
      .filter((step): step is Extract<RouteStep, { type: "milestone" }> => step.type === "milestone")
      .map((step) => step.id),
  );
  for (const group of T2_PROGRESSION_ORDER) {
    assert(
      milestoneIds.has(`${group}-t2-entered`) && milestoneIds.has(`${group}-t2-leg-complete`),
      `${route.id}: ${group} leg is not bracketed for per-biome dwell time`,
    );
  }
}

console.log("t2Routes.semantic.test.ts: ok");
