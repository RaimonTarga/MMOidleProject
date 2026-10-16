import assert from "node:assert/strict";
import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  SKILL_TREE,
  STRIKER_KIT,
  tutorialScriptWithoutGear,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { CONTROLLED_ROUTE_IDS, isClassAgnosticRouteId, requireRoute, ROUTES } from "./index";
import { STRIKER_CLASS_ROOT } from "./strikerT1";
import { strikerT3Route } from "./strikerT3";
import {
  STRIKER_T4_ROUTE_IDS,
  STRIKER_T4_ZONES,
  strikerT4FarmLevel,
  strikerT4Route,
  strikerT4ZoneGear,
} from "./strikerT4";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The tier-4 level the Striker guide farms this zone to. */
function tutorialT4Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptWithoutGear(STRIKER_CLASS_ROOT).beats) {
    if (!beat.id.startsWith("striker4:")) continue;
    for (const step of beat.steps) {
      if (step.type !== "farm") continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

assert.equal(Object.keys(STRIKER_T4_ROUTE_IDS).length, 9, "one route per leaf");
for (const [leafId, id] of Object.entries(STRIKER_T4_ROUTE_IDS)) {
  const leaf = STRIKER_KIT.leaves.find((entry) => entry.id === leafId);
  assert(leaf, `${leafId} is a kit leaf`);
  const route = strikerT4Route(leafId);
  assert.equal(route.id, id);
  assert(KEBAB.test(route.id), "the id is kebab-case");
  assert.equal(route.classRoot, STRIKER_CLASS_ROOT);
  assert(route.description.length > 0, "the route is described");
  assert.deepEqual(ROUTES.get(id), route, `${id} is registered`);
  assert.equal(requireRoute(id), ROUTES.get(id));
  assert.equal(isClassAgnosticRouteId(id), false, "the route is not rebuilt for another class");
  assert(!CONTROLLED_ROUTE_IDS.includes(id), `${id} stays out of the controlled batch until it has run live`);

  // It is a T3 route of the leaf's discipline, then the promotion wait, the pick, and three steps per T4 zone.
  const spec = STRIKER_KIT.specializations.find((entry) => entry.disciplineId === leaf.disciplineId)!;
  const t3 = strikerT3Route(spec.id);
  // The T3 route comes first, unchanged, run only while it is not done (a resume skips the walk).
  const [replay] = route.steps;
  assert(replay.type === "ifPossible" && replay.when.type === "not", "the T3 route is wrapped in an unless-done");
  if (replay.type === "ifPossible" && replay.when.type === "not") {
    assert.deepEqual(replay.steps, t3.steps, "the T3 route comes first, unchanged");
    assert.deepEqual(replay.when.of, t3.completion, "it is skipped once the T3 route is complete");
  }
  const rest = route.steps.slice(1);
  assert.deepEqual(
    rest.map((step) => step.type),
    ["farm", "unlockSkill", ...STRIKER_T4_ZONES.flatMap((biomeGroup) => [
      "travel", ...strikerT4ZoneGear(leaf.disciplineId, biomeGroup).flatMap(() => ["craft", "equip"]), "farm", "attemptBoss",
    ])],
  );
  // Gear: tier-4 recipes of the zone being farmed, in unlock order, inside its T4 farm; the first seal meets a full set.
  for (const biomeGroup of STRIKER_T4_ZONES) {
    let last = 0;
    for (const itemId of strikerT4ZoneGear(leaf.disciplineId, biomeGroup)) {
      const recipe = RECIPE_DATABASE.get(itemId);
      assert(recipe && recipe.recipeGroup === biomeGroup && ITEM_DATABASE.get(itemId)?.tier === 4, `${itemId} is tier-4 ${biomeGroup} gear`);
      assert(recipe.requiredBiomeLevel >= last && recipe.requiredBiomeLevel <= strikerT4FarmLevel(biomeGroup), `${itemId} unlocks in order, inside the farm`);
      last = recipe.requiredBiomeLevel;
    }
  }
  assert.deepEqual(strikerT4ZoneGear(leaf.disciplineId, STRIKER_T4_ZONES[0]).map((itemId) => RECIPE_DATABASE.get(itemId)?.slot),
    ["weapon", "armor", "recovery", "mobility"], "the first T4 seal meets a full set of T4 gear");

  const [wait, pick] = rest;
  assert(wait.type === "farm" && wait.until.type === "playerTierAtLeast" && wait.until.tier === 4, "it waits for tier 4");
  assert(pick.type === "unlockSkill" && pick.skillId === leafId, "the route picks its leaf");
  const node = SKILL_TREE.get(leafId);
  assert(node && node.disciplineId === leaf.disciplineId, "the leaf is a skill node of the route's discipline");

  const farms = rest.filter((step): step is Extract<RouteStep, { type: "farm" }> => step.type === "farm").slice(1);
  const bosses = rest.filter((step): step is Extract<RouteStep, { type: "attemptBoss" }> => step.type === "attemptBoss");
  assert.deepEqual(bosses.map((step) => step.biomeGroup), [...STRIKER_T4_ZONES], "every T4 boss, in guide order");
  assert(bosses.every((step) => step.tier === 4), "the bosses are tier 4");
  STRIKER_T4_ZONES.forEach((biomeGroup, index) => {
    const farm = farms[index];
    assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 4, `${biomeGroup} is farmed at tier 4`);
    assert(farm.until.type === "biomeLevelAtLeast" && farm.until.level === strikerT4FarmLevel(biomeGroup), `${biomeGroup} waits on its cap`);
    assert(strikerT4FarmLevel(biomeGroup) > 0, `${biomeGroup} has a tier-4 cap`);
    assert.equal(strikerT4FarmLevel(biomeGroup), tutorialT4Level(biomeGroup), `${biomeGroup} is farmed to the level the guide farms`);
  });

  assert(route.completion.type === "allOf", "completion is every T4 boss");
  if (route.completion.type === "allOf") {
    assert.equal(route.completion.of.length, STRIKER_T4_ZONES.length);
    assert(route.completion.of.every((condition) => condition.type === "bossCleared" && condition.tier === 4));
  }

  const ids = route.milestones.map((milestone) => milestone.id);
  assert.equal(new Set(ids).size, ids.length, "milestone ids are unique");
  for (const milestone of ids) assert(KEBAB.test(milestone), `milestone ${milestone} is kebab-case`);
  for (const biomeGroup of STRIKER_T4_ZONES) assert(ids.includes(`${biomeGroup}-t4-boss`), `${biomeGroup} has a boss milestone`);
}

assert.equal(strikerT4Route().id, STRIKER_T4_ROUTE_IDS["striker-ghoststep"], "Ghoststep is the default arm");
assert.throws(() => strikerT4Route("striker-nope"), /unknown Striker leaf/);
assert(STRIKER_T4_ZONES.includes("graveyard") && STRIKER_T4_ZONES.includes("trench"), "the two new biomes are walked");
assert(!STRIKER_T4_ZONES.includes("swamp") && !STRIKER_T4_ZONES.includes("cave"), "the retired biomes are not");

console.log("strikerT4: ok");
