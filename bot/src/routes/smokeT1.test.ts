import assert from "node:assert/strict";
import { CLEARING_NODE_ID, RECIPE_DATABASE, SKILL_TREE } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { ROUTES, requireRoute } from "./index";
import { DEFAULT_SMOKE_CLASS, SMOKE_T1_ARMOR, SMOKE_T1_ID, smokeT1Route } from "./smokeT1";

/** The step kinds the class-agnostic harness keeps. */
const KEPT_STEP_KINDS = [
  "assert", "attemptBoss", "captureCheckpoint", "chooseClass", "craft", "equip", "unequip",
  "upgrade", "farm", "travel", "moveWithinNode", "ifPossible", "repeatUntil", "milestone",
  "unlockSkill", "configureRunes", "classConfig",
] as const;

/** The conditions it keeps. */
const KEPT_CONDITION_KINDS = [
  "biomeLevelAtLeast", "essenceAtLeast", "recipeUnlocked", "hasItem", "itemAtLeastPlus",
  "equipped", "bossCleared", "playerTierAtLeast", "fullyRecovered", "canCraft", "canUpgrade",
  "globalMasteryAtLeast", "classSelected", "pieceLearned", "trophyHeld", "elapsedMs", "allOf", "anyOf", "not",
] as const;

// Compile-time pin: the route vocabulary is exactly the kept kinds, no more and
// no fewer, so a removed step or condition cannot come back unnoticed.
type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const stepsAreKept: Exactly<RouteStep["type"], (typeof KEPT_STEP_KINDS)[number]> = true;
const conditionsAreKept: Exactly<Condition["type"], (typeof KEPT_CONDITION_KINDS)[number]> = true;
assert(stepsAreKept && conditionsAreKept);

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const stepKinds = new Set<string>(KEPT_STEP_KINDS);
const conditionKinds = new Set<string>(KEPT_CONDITION_KINDS);

function checkNodeRef(ref: NodeRef, where: string): void {
  if (ref.kind === "node") assert.equal(typeof ref.nodeId, "string", `${where}: node ref names a node`);
  else if (ref.kind === "biome") {
    assert.equal(typeof ref.biomeGroup, "string", `${where}: biome ref names a biome`);
    assert(Number.isInteger(ref.tier) && ref.tier >= 0, `${where}: biome ref names a tier`);
  } else {
    assert.equal(ref.kind, "dungeon", `${where}: a node ref is a node, a biome or a dungeon`);
  }
}

function checkCondition(condition: Condition, where: string): void {
  assert(conditionKinds.has(condition.type), `${where}: condition ${condition.type} is in the kept vocabulary`);
  if (condition.type === "allOf" || condition.type === "anyOf") {
    assert(condition.of.length > 0, `${where}: ${condition.type} is not empty`);
    condition.of.forEach((child) => checkCondition(child, where));
  } else if (condition.type === "not") {
    checkCondition(condition.of, where);
  }
}

function checkSteps(steps: readonly RouteStep[], where: string): void {
  for (const [index, step] of steps.entries()) {
    const at = `${where} step ${index} (${step.type})`;
    assert(stepKinds.has(step.type), `${at}: the step kind is in the kept vocabulary`);
    if (step.requires) checkCondition(step.requires, at);
    switch (step.type) {
      case "chooseClass":
      case "unlockSkill":
        assert(SKILL_TREE.has(step.skillId), `${at}: names a real skill`);
        break;
      case "travel":
        checkNodeRef(step.to, at);
        break;
      case "farm":
        checkNodeRef(step.at, at);
        checkCondition(step.until, at);
        break;
      case "craft":
        assert(step.recipeIds.length > 0, `${at}: crafts something`);
        if (step.farmAt) checkNodeRef(step.farmAt, at);
        break;
      case "equip":
        assert(step.definitionIds.length > 0, `${at}: equips something`);
        break;
      case "assert":
        checkCondition(step.condition, at);
        break;
      case "repeatUntil":
        checkCondition(step.until, at);
        checkSteps(step.steps, at);
        break;
      case "ifPossible":
        checkCondition(step.when, at);
        checkSteps(step.steps, at);
        break;
      default:
        break;
    }
  }
}

/** The route schema: identity, a class root, steps, completion and milestones. */
function checkRouteSchema(route: Route): void {
  assert(KEBAB.test(route.id), `${route.id}: the id is kebab-case`);
  assert(/^\d+\.\d+\.\d+$/.test(route.version), `${route.id}: the version is x.y.z`);
  assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0, `${route.id}: the class root is a tier-0 skill`);
  assert(route.description.length > 0, `${route.id}: the route is described`);
  assert(route.steps.length > 0, `${route.id}: the route has steps`);
  checkSteps(route.steps, route.id);
  checkCondition(route.completion, `${route.id} completion`);
  const milestoneIds = route.milestones.map((milestone) => milestone.id);
  assert.equal(new Set(milestoneIds).size, milestoneIds.length, `${route.id}: milestone ids are unique`);
  for (const milestone of route.milestones) {
    assert(KEBAB.test(milestone.id), `${route.id}: milestone ${milestone.id} is kebab-case`);
    checkCondition(milestone.when, `${route.id} milestone ${milestone.id}`);
  }
}

// ── The registered route, and the route for every class ──────────────────────
const registered = ROUTES.get(SMOKE_T1_ID);
assert(registered, "smoke-t1 is registered");
assert.equal(registered.classRoot, `${DEFAULT_SMOKE_CLASS}-root`, "the registered smoke route plays the default class");
const classRoots = [...SKILL_TREE.values()].filter((node) => node.tier === 0).map((node) => node.id);
assert(classRoots.length > 0, "fixture: the Passive Tree has class roots");
for (const classRoot of classRoots) {
  const route = requireRoute(SMOKE_T1_ID, classRoot);
  assert.deepEqual(route, smokeT1Route(classRoot), `--class=${classRoot} builds the same data as the route builder`);
  checkRouteSchema(route);

  // The route's own shape: the tier-0 quest, the class, the Plains, the armor.
  const kinds = route.steps.map((step) => step.type);
  assert.deepEqual(kinds, ["travel", "farm", "chooseClass", "travel", "farm", "craft", "equip", "assert"]);
  const [toClearing, quest, choose, toPlains, plainsFarm, craft, equip, check] = route.steps;
  assert(toClearing.type === "travel" && toClearing.to.kind === "node" && toClearing.to.nodeId === CLEARING_NODE_ID);
  assert(quest.type === "farm" && quest.until.type === "playerTierAtLeast" && quest.until.tier === 1,
    "the tier-0 quest comes first: nothing banks in the Plains at tier 0");
  assert(choose.type === "chooseClass" && choose.skillId === classRoot, "the route chooses its own class");
  assert(toPlains.type === "travel" && toPlains.to.kind === "biome" && toPlains.to.biomeGroup === "plains" && toPlains.to.tier === 1);
  assert(plainsFarm.type === "farm" && plainsFarm.until.type === "biomeLevelAtLeast" &&
    plainsFarm.until.biomeGroup === "plains" && plainsFarm.until.level === 2, "the route farms to Plains level 2");
  assert(craft.type === "craft" && craft.recipeIds.length === 1 && craft.recipeIds[0] === SMOKE_T1_ARMOR);
  assert(equip.type === "equip" && equip.definitionIds.length === 1 && equip.definitionIds[0] === SMOKE_T1_ARMOR);
  assert(check.type === "assert" && check.condition.type === "equipped" && check.condition.definitionId === SMOKE_T1_ARMOR,
    "the route asserts the armor is equipped");
  assert(route.completion.type === "equipped" && route.completion.definitionId === SMOKE_T1_ARMOR);
}

// ── The armor: a Plains T1 armor recipe that unlocks by Plains level 2 and
// that every class can wear ────────────────────────────────────────────────
{
  const recipe = RECIPE_DATABASE.get(SMOKE_T1_ARMOR);
  assert(recipe, "the smoke armor recipe exists");
  assert.equal(recipe.slot, "armor");
  assert.equal(recipe.recipeGroup, "plains");
  assert.equal(recipe.tier, 1);
  assert(recipe.requiredBiomeLevel <= 2, "the recipe unlocks by the Plains level the route farms to");
  assert.equal((recipe as { classes?: unknown }).classes, undefined, "no class restriction: every class can wear it");
}

console.log("smokeT1: ok");
