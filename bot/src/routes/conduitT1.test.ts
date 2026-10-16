import assert from "node:assert/strict";
import {
  biomeLevelCap,
  classConfigContext,
  DEFAULT_FORMATION_ORDERS,
  defaultClassConfig,
  RECIPE_DATABASE,
  resolveClassConfig,
  SKILL_TREE,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  validateClassConfig,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { isClassAgnosticRouteId, isControlledRouteId, requireRoute, ROUTES } from "./index";
import { CONDUIT_CLASS_ROOT, CONDUIT_T1_GEAR, CONDUIT_T1_ID, conduitFarmLevel, conduitT1Route } from "./conduitT1";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest biome level the Conduit guide waits on in this zone. */
function tutorialLevel(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(CONDUIT_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      // Tier 1 only: the Tier 2 stretch farms the same biome groups to higher levels.
      if (step.type !== "farm" || (step.at.kind === "biome" && step.at.tier !== 1)) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) {
          level = Math.max(level, gate.level);
        }
      }
    }
  }
  return level;
}

const route = conduitT1Route();
assert.equal(route.id, CONDUIT_T1_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.version, "1.0.0");
assert.equal(route.classRoot, CONDUIT_CLASS_ROOT);
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0, "the class root is a tier-0 skill");
assert(route.description.length > 0, "the route is described");
assert.deepEqual(ROUTES.get(CONDUIT_T1_ID), route, "conduit-t1 is registered");
assert.equal(requireRoute(CONDUIT_T1_ID), ROUTES.get(CONDUIT_T1_ID));
assert.deepEqual(requireRoute(CONDUIT_T1_ID, "summoner"), route, "--class=summoner is the route's own class");
assert.deepEqual(requireRoute(CONDUIT_T1_ID, CONDUIT_CLASS_ROOT), route);
assert.equal(isClassAgnosticRouteId(CONDUIT_T1_ID), false, "the route is not rebuilt for another class");
assert.equal(isControlledRouteId(CONDUIT_T1_ID), true, "conduit-t1 is admitted to a controlled batch");
assert.throws(() => requireRoute(CONDUIT_T1_ID, "cadence"), /authored for summoner-root/);

// ── Steps: the quest, the class, the auto Formation, the guide's zones ───────
const kinds = route.steps.map((step) => step.type);
const walks = T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL);
const wears = (biomeGroup: string) => (CONDUIT_T1_GEAR[biomeGroup] ?? []).map(() => "ifPossible");
assert.deepEqual(kinds, [
  "travel", "farm", "chooseClass", "classConfig", ...wears("clearing"),
  "travel", ...wears(FIRST_SEAL), "farm", "attemptBoss",
  ...walks.flatMap((biome) => ["travel", ...wears(biome), "farm"]),
  "travel", ...wears(SECOND_SEAL), "farm", "attemptBoss",
  "farm",
]);

// ── Gear: the Clearing set, then each zone's pieces as its levels unlock them ──
const worn = route.steps.filter((step): step is Extract<RouteStep, { type: "ifPossible" }> => step.type === "ifPossible");
assert.equal(worn.length, Object.values(CONDUIT_T1_GEAR).flat().length, "one wear step per piece");
for (const step of worn) {
  assert.deepEqual(step.when, { type: "not", of: { type: "playerTierAtLeast", tier: 2 } },
    "T1 gear is skipped once the character is tier 2 (a later route replaying T1 keeps its gear)");
  assert.deepEqual(step.steps.map((inner) => inner.type), ["farm", "craft", "equip"]);
  const [farm, craft, equip] = step.steps;
  assert(craft.type === "craft" && equip.type === "equip" && farm.type === "farm");
  const recipe = RECIPE_DATABASE.get(craft.recipeIds[0]);
  assert(recipe, `${craft.recipeIds[0]} is a recipe`);
  assert.deepEqual(equip.definitionIds, craft.recipeIds, "the crafted piece is worn");
  assert.deepEqual(farm.until, { type: "biomeLevelAtLeast", biomeGroup: recipe.recipeGroup, level: recipe.requiredBiomeLevel },
    `${recipe.id} is crafted as soon as its zone level unlocks it`);
  const reach = recipe.recipeGroup === "clearing" ? biomeLevelCap(1, "clearing") : conduitFarmLevel(recipe.recipeGroup);
  assert(recipe.requiredBiomeLevel <= reach, `${recipe.id} unlocks within the route's farm of its zone`);
  if (recipe.slot === "weapon") assert(recipe.id.startsWith("conduit-"), `${recipe.id} is a Conduit weapon`);
}
assert.equal(CONDUIT_T1_GEAR.clearing[0], "conduit-plain-staff-t1", "the Clearing weapon is the Conduit's starter staff");

const [toClearing, quest, choose, config] = route.steps;
assert(toClearing.type === "travel" && toClearing.to.kind === "node", "the quest starts in the Clearing");
assert(quest.type === "farm" && quest.until.type === "playerTierAtLeast" && quest.until.tier === 1,
  "the tier-0 quest comes first");
assert(choose.type === "chooseClass" && choose.skillId === CONDUIT_CLASS_ROOT, "the route chooses the Conduit");
assert(config.type === "classConfig" && config.config.mode === "auto", "the Formation is left on auto");
if (config.type === "classConfig") {
  assert.equal(config.config.system.kind, "formation");
  const fresh = classConfigContext("summoner", { biomeLevel: {}, bossesCleared: [], disciplineId: null }, 0);
  const checked = validateClassConfig(config.config, fresh);
  assert(checked.ok, `auto config is valid for a fresh Conduit${checked.ok ? "" : `: ${checked.reasons.join("; ")}`}`);
  const resolved = resolveClassConfig(config.config, fresh);
  assert.deepEqual(resolved, defaultClassConfig(fresh), "auto resolves to the §7.13 default");
  assert.equal(resolved.mode, "auto");
  assert.deepEqual(resolved.relic, [], "a fresh Conduit has no Soul yet");
  assert.equal(resolved.system.kind, "formation");
  if (resolved.system.kind === "formation") {
    assert.deepEqual(
      resolved.system.roster,
      ["conduit-thrall", "conduit-thrall", "conduit-thrall", "conduit-thrall"],
      "nothing is bound yet, so the default is four Thralls",
    );
    assert.deepEqual(resolved.system.orders, {
      ...DEFAULT_FORMATION_ORDERS,
      recallWhen: [...DEFAULT_FORMATION_ORDERS.recallWhen],
    }, "the orders are the pre-set ones");
  }
}

const zoneOrder = [FIRST_SEAL, ...walks, SECOND_SEAL];
const farms = route.steps.filter((step): step is Extract<RouteStep, { type: "farm" }> =>
  step.type === "farm" && step.at.kind === "biome");
assert.equal(farms.length, zoneOrder.length + 1, "one farm per zone, then the tier-2 wait");
zoneOrder.forEach((biomeGroup, index) => {
  const farm = farms[index];
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 1, `${biomeGroup} is farmed in order`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup, `${biomeGroup} waits on its own level`);
  assert.equal(farm.until.type === "biomeLevelAtLeast" ? farm.until.level : -1, conduitFarmLevel(biomeGroup));
  assert.equal(conduitFarmLevel(biomeGroup), tutorialLevel(biomeGroup),
    `${biomeGroup} is farmed to the level the guide farms`);
  if (biomeGroup === SECOND_SEAL) assert.equal(conduitFarmLevel(biomeGroup), 2, "the Mountain stops at the Ridge Marksman lesson");
  else assert.equal(conduitFarmLevel(biomeGroup), biomeLevelCap(1, biomeGroup), `${biomeGroup} is farmed to the tier cap`);
});
const tierWait = farms[farms.length - 1];
assert(tierWait.until.type === "playerTierAtLeast" && tierWait.until.tier === 2, "the last farm waits on tier 2");
assert(tierWait.at.kind === "biome" && tierWait.at.biomeGroup === SECOND_SEAL, "the tier-2 wait stands in the second seal");

const bosses = route.steps.filter((step): step is Extract<RouteStep, { type: "attemptBoss" }> => step.type === "attemptBoss");
assert.deepEqual(bosses.map((step) => step.biomeGroup), [FIRST_SEAL, SECOND_SEAL], "the two seals, in guide order");
assert(bosses.every((step) => step.tier === 1), "both seals are tier 1");

assert(route.completion.type === "allOf", "completion is both seals and the promotion");
if (route.completion.type === "allOf") {
  const types = route.completion.of.map((condition) => condition.type);
  assert.deepEqual(types, ["bossCleared", "bossCleared", "playerTierAtLeast"]);
}

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biomeGroup of zoneOrder) {
  assert(milestoneIds.some((id) => id.startsWith(`${biomeGroup}-`)), `${biomeGroup} has a milestone`);
}
assert(milestoneIds.includes(`${FIRST_SEAL}-seal`) && milestoneIds.includes(`${SECOND_SEAL}-seal`), "each seal has a milestone");
assert(milestoneIds.includes("tier-2"), "tier 2 is a milestone");

console.log("conduitT1: ok");
