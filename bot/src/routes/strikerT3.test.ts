import assert from "node:assert/strict";
import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  SKILL_TREE,
  STRIKER_KIT,
  tutorialScriptFor,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { CONTROLLED_ROUTE_IDS, isClassAgnosticRouteId, requireRoute, ROUTES } from "./index";
import { STRIKER_CLASS_ROOT } from "./strikerT1";
import { strikerT2Route } from "./strikerT2";
import {
  STRIKER_T3_ROUTE_IDS,
  STRIKER_T3_ZONES,
  strikerT3FarmLevel,
  strikerT3Route,
  strikerT3ZoneGear,
} from "./strikerT3";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The tier-3 level the Striker guide farms this zone to. */
function tutorialT3Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(STRIKER_CLASS_ROOT).beats) {
    if (!beat.id.startsWith("striker3:")) continue;
    for (const step of beat.steps) {
      if (step.type !== "farm") continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

assert.equal(Object.keys(STRIKER_T3_ROUTE_IDS).length, 9, "one route per specialization");
for (const [specializationId, id] of Object.entries(STRIKER_T3_ROUTE_IDS)) {
  const spec = STRIKER_KIT.specializations.find((entry) => entry.id === specializationId);
  assert(spec, `${specializationId} is a kit specialization`);
  const route = strikerT3Route(specializationId);
  assert.equal(route.id, id);
  assert(KEBAB.test(route.id), "the id is kebab-case");
  assert.equal(route.classRoot, STRIKER_CLASS_ROOT);
  assert(route.description.length > 0, "the route is described");
  assert.deepEqual(ROUTES.get(id), route, `${id} is registered`);
  assert.equal(requireRoute(id), ROUTES.get(id));
  assert.equal(isClassAgnosticRouteId(id), false, "the route is not rebuilt for another class");
  assert(!CONTROLLED_ROUTE_IDS.includes(id), `${id} stays out of the controlled batch until it has run live`);

  // It is its discipline's T2 route, then the promotion wait, the pick, and three steps per T3 zone.
  const t2 = strikerT2Route(spec.disciplineId);
  // The T2 route comes first, unchanged, run only while it is not done (a resume skips the walk).
  const [replay] = route.steps;
  assert(replay.type === "ifPossible" && replay.when.type === "not", "the T2 route is wrapped in an unless-done");
  if (replay.type === "ifPossible" && replay.when.type === "not") {
    assert.deepEqual(replay.steps, t2.steps, "the T2 route comes first, unchanged");
    assert.deepEqual(replay.when.of, t2.completion, "it is skipped once the T2 route is complete");
  }
  const rest = route.steps.slice(1);
  assert.deepEqual(
    rest.map((step) => step.type),
    ["farm", "unlockSkill", ...STRIKER_T3_ZONES.flatMap((biomeGroup) => [
      "travel", ...strikerT3ZoneGear(spec.disciplineId, biomeGroup).flatMap(() => ["craft", "equip"]), "farm", "attemptBoss",
    ])],
  );
  // Gear: tier-3 recipes of the zone being farmed, in unlock order, inside its T3 farm; the first seal meets a full set.
  for (const biomeGroup of STRIKER_T3_ZONES) {
    let last = 0;
    for (const itemId of strikerT3ZoneGear(spec.disciplineId, biomeGroup)) {
      const recipe = RECIPE_DATABASE.get(itemId);
      assert(recipe && recipe.recipeGroup === biomeGroup && ITEM_DATABASE.get(itemId)?.tier === 3, `${itemId} is tier-3 ${biomeGroup} gear`);
      assert(recipe.requiredBiomeLevel >= last && recipe.requiredBiomeLevel <= strikerT3FarmLevel(biomeGroup), `${itemId} unlocks in order, inside the farm`);
      last = recipe.requiredBiomeLevel;
    }
  }
  assert.deepEqual(strikerT3ZoneGear(spec.disciplineId, STRIKER_T3_ZONES[0]).map((itemId) => RECIPE_DATABASE.get(itemId)?.slot),
    ["weapon", "armor", "recovery", "mobility"], "the first T3 seal meets a full set of T3 gear");

  const [wait, pick] = rest;
  assert(wait.type === "farm" && wait.until.type === "playerTierAtLeast" && wait.until.tier === 3, "it waits for tier 3");
  assert(pick.type === "unlockSkill" && pick.skillId === specializationId, "the route picks its specialization");
  const node = SKILL_TREE.get(specializationId);
  assert(node && node.disciplineId === spec.disciplineId, "the specialization is a skill node of the route's discipline");

  const farms = rest.filter((step): step is Extract<RouteStep, { type: "farm" }> => step.type === "farm").slice(1);
  const bosses = rest.filter((step): step is Extract<RouteStep, { type: "attemptBoss" }> => step.type === "attemptBoss");
  assert.deepEqual(bosses.map((step) => step.biomeGroup), [...STRIKER_T3_ZONES], "every T3 boss, in guide order");
  assert(bosses.every((step) => step.tier === 3), "the bosses are tier 3");
  STRIKER_T3_ZONES.forEach((biomeGroup, index) => {
    const farm = farms[index];
    assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 3, `${biomeGroup} is farmed at tier 3`);
    assert(farm.until.type === "biomeLevelAtLeast" && farm.until.level === strikerT3FarmLevel(biomeGroup), `${biomeGroup} waits on its cap`);
    assert.equal(strikerT3FarmLevel(biomeGroup), tutorialT3Level(biomeGroup), `${biomeGroup} is farmed to the level the guide farms`);
  });

  assert(route.completion.type === "allOf", "completion is every T3 boss");
  if (route.completion.type === "allOf") {
    assert.equal(route.completion.of.length, STRIKER_T3_ZONES.length);
    assert(route.completion.of.every((condition) => condition.type === "bossCleared" && condition.tier === 3));
  }

  const ids = route.milestones.map((milestone) => milestone.id);
  assert.equal(new Set(ids).size, ids.length, "milestone ids are unique");
  for (const milestone of ids) assert(KEBAB.test(milestone), `milestone ${milestone} is kebab-case`);
  for (const biomeGroup of STRIKER_T3_ZONES) assert(ids.includes(`${biomeGroup}-t3-boss`), `${biomeGroup} has a boss milestone`);
}

assert.equal(strikerT3Route().id, STRIKER_T3_ROUTE_IDS["striker-thousand-cuts"], "Thousand Cuts is the default arm");
assert.throws(() => strikerT3Route("striker-nope"), /unknown Striker specialization/);
assert(STRIKER_T3_ZONES.includes("tundra") && STRIKER_T3_ZONES.includes("volcanic"), "the two new biomes are walked");
assert(!STRIKER_T3_ZONES.includes("plains") && !STRIKER_T3_ZONES.includes("forest"), "the retired biomes are not");

console.log("strikerT3: ok");
