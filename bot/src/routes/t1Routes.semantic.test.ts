import {
  ABILITY_RECIPE_DATABASE,
  ITEM_DATABASE,
  RECIPE_DATABASE,
  RUNE_RECIPE_DATABASE,
  STARTER_RUNE_IDS,
  globalMastery,
  isRuneRecipeAvailableForArchetype,
  isRuneRuleCompatibleForArchetype,
  runeBudgetForGlobalMastery,
  runicPointLoadoutCost,
  SKILL_TREE,
  canUnlockSkill,
  type CombatArchetype,
  type EquippedRule,
} from "@mmo-idle/shared";
import { runeLoadoutsEqual } from "../route/executor";
import type { Route, RouteStep } from "../route/types";
import {
  ROUTES,
  T1_CONTROLLED_ROUTE_IDS,
  T1_CONTROLLED_ROUTES,
  requireRoute,
} from "./index";
import { T1_BOSS_ORDER, T1_PROGRESSION_ORDER, type T1BiomeGroup } from "./t1RouteBuilder";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

const ARCHETYPE_FOR_ROOT: Record<string, CombatArchetype> = {
  "cadence-root": "cadence",
  "cooldown-root": "cooldown",
  "reload-root": "reload",
  "energy-root": "energy",
  "dot-root": "dot",
  "summoner-root": "summoner",
};

interface RuneTransition {
  index: number;
  gm: number;
  used: number;
  available: number;
  rules: EquippedRule[];
}

interface BossSnapshot {
  biomeGroup: string;
  technique: string;
  guard: string;
  rules: EquippedRule[];
  equipment: string[];
  gm: number;
}

interface RouteSemantics {
  route: Route;
  progressionOrder: string[];
  bosses: BossSnapshot[];
  runeTransitions: RuneTransition[];
  learnedAt: Map<string, { gm: number; biomeLevels: Record<string, number> }>;
  runeCraftedAt: Map<string, { gm: number; biomeLevels: Record<string, number> }>;
  craftedItems: string[];
  upgrades: string[];
  learnedAbilities: string[];
  craftedRuneRecipes: string[];
  frameUnlock?: { index: number; skillId: string };
}

function updateLevelForCondition(condition: Extract<RouteStep, { type: "farm" }>["until"], levels: Record<string, number>): void {
  if (condition.type === "biomeLevelAtLeast") {
    levels[condition.biomeGroup] = Math.max(levels[condition.biomeGroup] ?? 0, condition.level);
  } else if (condition.type === "recipeUnlocked") {
    const recipe = RECIPE_DATABASE.get(condition.recipeId);
    if (recipe) {
      levels[recipe.recipeGroup] = Math.max(
        levels[recipe.recipeGroup] ?? 0,
        recipe.requiredBiomeLevel,
      );
    }
  } else if (condition.type === "allOf") {
    condition.of.forEach((child) => updateLevelForCondition(child, levels));
  }
}

/** Interpret the generated data in execution order; this deliberately does not inspect route configs. */
function analyze(route: Route): RouteSemantics {
  const archetype = ARCHETYPE_FOR_ROOT[route.classRoot];
  assert(archetype, `${route.id}: class root maps to an archetype`);

  const levels: Record<string, number> = {};
  const crafted = new Set<string>();
  const learned = new Set<string>();
  const ownedRunes = new Set(STARTER_RUNE_IDS);
  const learnedAt = new Map<string, { gm: number; biomeLevels: Record<string, number> }>();
  const runeCraftedAt = new Map<string, { gm: number; biomeLevels: Record<string, number> }>();
  const runeTransitions: RuneTransition[] = [];
  const bosses: BossSnapshot[] = [];
  const progressionOrder: string[] = [];
  const craftedItems: string[] = [];
  const upgrades: string[] = [];
  const learnedAbilities: string[] = [];
  const craftedRuneRecipes: string[] = [];
  let currentTechnique = "";
  let currentGuard = "";
  let currentRules: EquippedRule[] = [];
  let currentEquipment: string[] = [];
  let frameUnlock: { index: number; skillId: string } | undefined;

  for (let index = 0; index < route.steps.length; index++) {
    const step = route.steps[index];
    if (step.type === "travel" && step.to.kind === "biome") {
      if (!progressionOrder.includes(step.to.biomeGroup)) progressionOrder.push(step.to.biomeGroup);
    } else if (step.type === "farm") {
      updateLevelForCondition(step.until, levels);
    } else if (step.type === "craft") {
      for (const recipeId of step.recipeIds) {
        assert(RECIPE_DATABASE.has(recipeId), `${route.id}: item recipe exists (${recipeId})`);
        crafted.add(recipeId);
        craftedItems.push(recipeId);
      }
    } else if (step.type === "equip") {
      for (const definitionId of step.definitionIds) {
        assert(crafted.has(definitionId), `${route.id}: ${definitionId} is crafted before equip`);
        assert(ITEM_DATABASE.has(definitionId), `${route.id}: ${definitionId} is a live item`);
      }
      currentEquipment = [...step.definitionIds];
    } else if (step.type === "upgrade") {
      assert(crafted.has(step.definitionId), `${route.id}: ${step.definitionId} is crafted before upgrade`);
      upgrades.push(`${step.definitionId}:+${step.toPlus}`);
    } else if (step.type === "learnAbility") {
      const recipe = ABILITY_RECIPE_DATABASE.get(step.recipeId);
      assert(recipe?.abilityId === step.abilityId, `${route.id}: ${step.abilityId} uses its live recipe`);
      if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
        levels[recipe.recipeGroup] = Math.max(
          levels[recipe.recipeGroup] ?? 0,
          recipe.requiredBiomeLevel,
        );
      }
      learned.add(step.abilityId);
      learnedAbilities.push(step.abilityId);
      learnedAt.set(step.abilityId, { gm: globalMastery(levels), biomeLevels: { ...levels } });
      if (step.slot === "technique") currentTechnique = step.abilityId;
      else currentGuard = step.abilityId;
    } else if (step.type === "unlockSkill") {
      frameUnlock = { index, skillId: step.skillId };
    } else if (step.type === "setAbilities") {
      for (const abilityId of [...step.techniques, ...step.guards]) {
        assert(learned.has(abilityId), `${route.id}: ${abilityId} is learned before setAbilities`);
      }
      currentTechnique = step.techniques[0] ?? "";
      currentGuard = step.guards[0] ?? "";
    } else if (step.type === "craftRune") {
      const recipe = RUNE_RECIPE_DATABASE.get(step.recipeId);
      assert(recipe?.runeId, `${route.id}: ${step.recipeId} is a live Rune recipe`);
      assert(
        isRuneRecipeAvailableForArchetype(recipe, archetype),
        `${route.id}: ${step.recipeId} is available to ${archetype}`,
      );
      if (recipe.recipeGroup && recipe.requiredBiomeLevel !== undefined) {
        levels[recipe.recipeGroup] = Math.max(
          levels[recipe.recipeGroup] ?? 0,
          recipe.requiredBiomeLevel,
        );
      }
      ownedRunes.add(recipe.runeId);
      craftedRuneRecipes.push(step.recipeId);
      runeCraftedAt.set(step.recipeId, {
        gm: globalMastery(levels),
        biomeLevels: { ...levels },
      });
    } else if (step.type === "configureRunes") {
      for (const rule of step.rules) {
        assert(
          ownedRunes.has(rule.conditionId) && ownedRunes.has(rule.actionId),
          `${route.id}: owns ${rule.conditionId} -> ${rule.actionId} before use`,
        );
        assert(
          isRuneRuleCompatibleForArchetype(rule, archetype),
          `${route.id}: ${rule.conditionId} -> ${rule.actionId} is compatible with ${archetype}`,
        );
      }
      const gm = globalMastery(levels);
      const used = runicPointLoadoutCost({ rules: step.rules, rites: [] });
      const available = runeBudgetForGlobalMastery(gm);
      assert(used <= available, `${route.id}: ${used}/${available} RP at GM${gm}`);
      currentRules = step.rules.map((rule) => ({ ...rule }));
      runeTransitions.push({ index, gm, used, available, rules: currentRules });
    } else if (step.type === "attemptBoss") {
      assert(currentTechnique !== "", `${route.id}: Technique equipped for ${step.biomeGroup}`);
      assert(currentGuard !== "", `${route.id}: Guard equipped for ${step.biomeGroup}`);
      bosses.push({
        biomeGroup: step.biomeGroup,
        technique: currentTechnique,
        guard: currentGuard,
        rules: currentRules.map((rule) => ({ ...rule })),
        equipment: [...currentEquipment],
        gm: globalMastery(levels),
      });
    } else if (step.type === "repeatUntil") {
      throw new Error(`${route.id}: controlled routes must not hide semantics in repeatUntil`);
    }
  }

  return {
    route,
    progressionOrder,
    bosses,
    runeTransitions,
    learnedAt,
    runeCraftedAt,
    craftedItems,
    upgrades,
    learnedAbilities,
    craftedRuneRecipes,
    frameUnlock,
  };
}

function hasRule(rules: readonly EquippedRule[], conditionId: string, actionId: string): boolean {
  return rules.some((rule) => rule.conditionId === conditionId && rule.actionId === actionId);
}

function ruleIndex(rules: readonly EquippedRule[], actionId: string): number {
  return rules.findIndex((rule) => rule.actionId === actionId);
}

const EXPECTED_CONTROLLED = [
  "striker-t1",
  "striker-brace-tank-t1",
  "squire-t1",
  "squire-brace-tank-t1",
  "slinger-t1",
  "spirit-t1",
  "apprentice-t1",
  "conduit-t1",
];
assert(
  JSON.stringify(T1_CONTROLLED_ROUTE_IDS) === JSON.stringify(EXPECTED_CONTROLLED),
  "controlled registry is exactly the intended eight routes",
);
assert(T1_CONTROLLED_ROUTES.length === 8, "all eight controlled routes resolve");

const historicalPatterns = ["-v2-", "heavyhammer", "murkeyeonly", "letdotsfinish"];
for (const routeId of ROUTES.keys()) {
  if (historicalPatterns.some((pattern) => routeId.includes(pattern))) {
    assert(!T1_CONTROLLED_ROUTE_IDS.includes(routeId as never), `${routeId} is excluded from controlled runs`);
  }
}

const semantics = new Map(T1_CONTROLLED_ROUTES.map((route) => [route.id, analyze(route)]));
const ranged = new Set(["slinger-t1", "spirit-t1", "apprentice-t1", "conduit-t1"]);
const braceRoutes = new Set(["striker-brace-tank-t1", "squire-brace-tank-t1"]);
const EXPECTED_FRAMES: Record<string, string> = {
  "striker-t1": "cadence-balanced",
  "striker-brace-tank-t1": "cadence-balanced",
  "squire-t1": "cooldown-heavy",
  "squire-brace-tank-t1": "cooldown-heavy",
  "slinger-t1": "reload-heavy",
  "spirit-t1": "energy-heavy",
  "apprentice-t1": "dot-balanced",
  "conduit-t1": "summoner-balanced",
};

for (const route of T1_CONTROLLED_ROUTES) {
  const result = semantics.get(route.id)!;
  const frameId = EXPECTED_FRAMES[route.id];
  assert(route.frameId === frameId, `${route.id}: declares its intended frame`);
  assert(result.frameUnlock?.skillId === frameId, `${route.id}: spends exactly the T2 point on its frame`);
  const forestBossIndex = route.steps.findIndex(
    (step) => step.type === "attemptBoss" && step.biomeGroup === "forest",
  );
  assert((result.frameUnlock?.index ?? -1) > forestBossIndex, `${route.id}: frame follows the Forest seal`);
  const root = SKILL_TREE.get(route.classRoot);
  const frame = SKILL_TREE.get(frameId);
  assert(!!root && !!frame && frame.parent === root.id, `${route.id}: frame is a child of its root`);
  assert(
    canUnlockSkill(
      {
        usesSkills: {
          unlockedSkills: [root!.id],
          selectedClass: root!.id,
          selectedSubVariant: null,
          selectedRange: null,
        },
        tracksProgression: { skillPoints: 1, currentSkillTier: 1 },
      },
      frameId,
    ).ok,
    `${route.id}: frame is legal with the post-Forest point`,
  );
  assert(
    JSON.stringify(result.progressionOrder) === JSON.stringify(T1_PROGRESSION_ORDER),
    `${route.id}: controlled biome progression order`,
  );
  assert(
    JSON.stringify(result.bosses.map((boss) => boss.biomeGroup)) === JSON.stringify(T1_BOSS_ORDER),
    `${route.id}: controlled boss order`,
  );
  assert(!route.steps.some((step) => step.type === "configureRunes" && hasRule(step.rules, "hp-below-25", "flee")), `${route.id}: no Flee`);

  const sweepAt = result.learnedAt.get("sweep");
  assert(sweepAt?.biomeLevels.plains === 2, `${route.id}: Sweep learned at Plains L2`);
  assert(result.bosses[0]?.technique === "sweep", `${route.id}: Plains boss exercises Sweep`);
  const exposeAt = result.learnedAt.get("expose-weakness");
  assert(exposeAt?.biomeLevels.cave === 3, `${route.id}: Expose Weakness learned at Cave L3`);

  for (const boss of result.bosses) {
    assert(boss.gm === 30, `${route.id}: ${boss.biomeGroup} boss starts at GM30`);
    const expectedTechnique = boss.biomeGroup === "plains" ? "sweep" : "expose-weakness";
    assert(boss.technique === expectedTechnique, `${route.id}: ${boss.biomeGroup} Technique`);
    const fireGuard = hasRule(boss.rules, "target-casting", "fire-guard");
    assert(fireGuard === (boss.guard === "brace"), `${route.id}: fire-guard iff Brace at ${boss.biomeGroup}`);
    assert(hasRule(boss.rules, "always", "avoid-hazards"), `${route.id}: Avoid Hazards at ${boss.biomeGroup}`);
    assert(hasRule(boss.rules, "always", "wait-for-regen"), `${route.id}: Wait for Regen at ${boss.biomeGroup}`);
  }

  const guards = Object.fromEntries(result.bosses.map((boss) => [boss.biomeGroup, boss.guard]));
  assert(guards.plains === "second-wind", `${route.id}: Plains uses Second Wind`);
  assert(guards.forest === "second-wind", `${route.id}: Forest uses Second Wind`);
  assert(guards.swamp === "cleanse", `${route.id}: Swamp uses Cleanse`);
  if (braceRoutes.has(route.id)) {
    assert(guards.mountain === "brace" && guards.cave === "brace", `${route.id}: Mountain/Cave use Brace`);
    assert(!result.runeCraftedAt.has("rune-recipe-step-back"), `${route.id}: Brace arm omits Step Back`);
  } else {
    assert(guards.mountain === "second-wind", `${route.id}: Mountain uses Second Wind`);
    assert(guards.cave === "second-wind", `${route.id}: Cave uses Second Wind for the current boss roster`);
    const stepBack = result.runeCraftedAt.get("rune-recipe-step-back");
    assert(stepBack?.gm === 26 && stepBack.biomeLevels.cave === 2, `${route.id}: Step Back at Cave L2 / GM26`);
  }

  for (const boss of result.bosses) {
    if (braceRoutes.has(route.id)) {
      assert(!hasRule(boss.rules, "inside-telegraph", "step-back"), `${route.id}: no Step Back at bosses`);
      assert(hasRule(boss.rules, "in-combat", "chase-enemy"), `${route.id}: Brace arm retains chase`);
    } else if (ranged.has(route.id)) {
      assert(hasRule(boss.rules, "in-combat", "orbit"), `${route.id}: Orbit after unlock`);
      assert(!hasRule(boss.rules, "in-combat", "chase-enemy"), `${route.id}: no chase after Orbit unlock`);
      assert(ruleIndex(boss.rules, "step-back") < ruleIndex(boss.rules, "orbit"), `${route.id}: Step Back precedes Orbit`);
    } else {
      assert(hasRule(boss.rules, "in-combat", "chase-enemy"), `${route.id}: chase retained`);
      assert(ruleIndex(boss.rules, "step-back") < ruleIndex(boss.rules, "chase-enemy"), `${route.id}: Step Back precedes chase`);
    }
  }

  if (ranged.has(route.id)) {
    const orbit = result.runeCraftedAt.get("rune-recipe-keep-distance");
    assert(orbit?.gm === 21 && orbit.biomeLevels.mountain === 3, `${route.id}: Orbit at Mountain L3 / GM21`);
    const afterOrbit = result.runeTransitions.find((transition) => transition.index > route.steps.findIndex((step) => step.type === "craftRune" && step.recipeId === "rune-recipe-keep-distance"));
    // Step Back is now a Cave unlock, so Mountain's pre-Cave ranged profile
    // carries Orbit and recovery/pathing rules but not the telegraph response.
    assert(afterOrbit?.used === 6 && afterOrbit.available === 10, `${route.id}: ranged standing profile is 6/10 RP at GM21`);
  }
}

// Apprentice's removed focus-targeting experiment would make the requested
// Mountain profile 11 RP at GM21. The generated canonical instead exercises
// its new Sweep adapter and now uses the legal shared Orbit profile.
const apprentice = semantics.get("apprentice-t1")!;
assert(
  !apprentice.craftedRuneRecipes.includes("rune-recipe-focus-lowest-hp"),
  "Apprentice canonical excludes the old focus-lowest-hp experiment",
);
assert(
  apprentice.bosses.every((boss) => !hasRule(boss.rules, "in-combat", "focus-lowest-hp")),
  "Apprentice canonical has no hidden targeting dimension",
);

// Slinger, Apprentice and Conduit are the three class adapters added for the
// clean wave; each canonical learns Sweep and actually equips it for Plains.
for (const routeId of ["slinger-t1", "apprentice-t1", "conduit-t1"]) {
  const result = semantics.get(routeId)!;
  assert(result.learnedAbilities.includes("sweep"), `${routeId}: Sweep adapter is learned`);
  assert(result.bosses[0]?.technique === "sweep", `${routeId}: Sweep adapter is exercised canonically`);
}

// Brace routes share their parent's declarative progression/gear source. Check
// the generated output, not the config object, for unrelated drift.
for (const [parentId, braceId] of [
  ["striker-t1", "striker-brace-tank-t1"],
  ["squire-t1", "squire-brace-tank-t1"],
] as const) {
  const parent = semantics.get(parentId)!;
  const brace = semantics.get(braceId)!;
  assert(JSON.stringify(parent.progressionOrder) === JSON.stringify(brace.progressionOrder), `${braceId}: progression matches parent`);
  assert(JSON.stringify(parent.craftedItems) === JSON.stringify(brace.craftedItems), `${braceId}: crafted gear matches parent`);
  assert(JSON.stringify(parent.upgrades) === JSON.stringify(brace.upgrades), `${braceId}: upgrades match parent`);
  assert(JSON.stringify(parent.bosses.map((boss) => boss.biomeGroup)) === JSON.stringify(brace.bosses.map((boss) => boss.biomeGroup)), `${braceId}: boss order matches parent`);
  assert(JSON.stringify(parent.bosses.map((boss) => boss.technique)) === JSON.stringify(brace.bosses.map((boss) => boss.technique)), `${braceId}: Techniques match parent`);
  assert(JSON.stringify(parent.bosses.map((boss) => boss.equipment)) === JSON.stringify(brace.bosses.map((boss) => boss.equipment)), `${braceId}: boss gear matches parent`);
  const parentSharedAbilities = parent.learnedAbilities.filter((id) => id !== "brace");
  const braceSharedAbilities = brace.learnedAbilities.filter((id) => id !== "brace");
  assert(JSON.stringify(parentSharedAbilities) === JSON.stringify(braceSharedAbilities), `${braceId}: non-Brace abilities match parent`);
  const parentSharedRunes = parent.craftedRuneRecipes.filter((id) => id !== "rune-recipe-step-back");
  const braceSharedRunes = brace.craftedRuneRecipes.filter((id) => id !== "rune-recipe-step-back");
  assert(JSON.stringify(parentSharedRunes) === JSON.stringify(braceSharedRunes), `${braceId}: non-defensive Rune unlocks match parent`);
}

// Regression for the runtime Orbit drift: same length is not semantic equality,
// and priority order is not interchangeable. The pre-Orbit Mountain transition
// intentionally has no Step Back now that it unlocks in Cave.
const chaseRules = requireRoute("slinger-t1").steps.find(
  (step) => step.type === "configureRunes" && !hasRule(step.rules, "inside-telegraph", "step-back") && hasRule(step.rules, "in-combat", "chase-enemy") && hasRule(step.rules, "always", "avoid-hazards"),
);
const orbitRules = semantics.get("slinger-t1")!.runeTransitions.find(
  (transition) => transition.rules.some((rule) => rule.actionId === "orbit"),
)?.rules ?? [];
assert(chaseRules?.type === "configureRunes", "Slinger has a pre-Orbit chase transition");
assert(chaseRules.rules.length === orbitRules.length, "regression fixture uses equal-length loadouts");
assert(!runeLoadoutsEqual(chaseRules.rules, orbitRules), "equal-length Chase and Orbit loadouts differ");
assert(!runeLoadoutsEqual(orbitRules, [...orbitRules].reverse()), "Rune priority order is semantic");

console.log("t1Routes.semantic.test.ts: ok");
