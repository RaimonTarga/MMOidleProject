import assert from "node:assert/strict";
import {
  ITEM_DATABASE,
  RECIPE_DATABASE,
  SKILL_TREE,
  strikerComboLength,
  tutorialScriptWithoutGear,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { CONTROLLED_ROUTE_IDS, isClassAgnosticRouteId, requireRoute, ROUTES } from "./index";
import { STRIKER_CLASS_ROOT, strikerT1Route } from "./strikerT1";
import {
  STRIKER_T2_BOSS_ORDER,
  STRIKER_T2_LATE_SEALS,
  STRIKER_T2_LIGHT_ID,
  STRIKER_T2_ROUTE_IDS,
  STRIKER_T2_ZONES,
  strikerT2FarmLevel,
  strikerT2Route,
  strikerT2ZoneCharm,
  strikerT2ZoneGear,
} from "./strikerT2";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The tier-2 level the Striker guide farms this zone to. */
function tutorialT2Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptWithoutGear(STRIKER_CLASS_ROOT).beats) {
    if (!beat.id.startsWith("striker2:")) continue;
    for (const step of beat.steps) {
      if (step.type !== "farm") continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const t1 = strikerT1Route();
for (const [disciplineId, id] of Object.entries(STRIKER_T2_ROUTE_IDS)) {
  const route = strikerT2Route(disciplineId);
  assert.equal(route.id, id);
  assert(KEBAB.test(route.id), "the id is kebab-case");
  assert.equal(route.classRoot, STRIKER_CLASS_ROOT);
  assert(route.description.length > 0, "the route is described");
  assert.deepEqual(ROUTES.get(id), route, `${id} is registered`);
  assert.equal(requireRoute(id), ROUTES.get(id));
  assert.equal(isClassAgnosticRouteId(id), false, "the route is not rebuilt for another class");
  assert(CONTROLLED_ROUTE_IDS.includes(id), `${id} joins the controlled batch list`);

  // It is the T1 route, then the pick, the Order, each T2 zone (travel, its gear, the farm, its
  // boss unless that seal is a late one), then the late seals.
  // The T1 route comes first, unchanged, run only while it is not done (a resume skips the walk).
  const [replay] = route.steps;
  assert(replay.type === "ifPossible" && replay.when.type === "not", "the T1 route is wrapped in an unless-done");
  if (replay.type === "ifPossible" && replay.when.type === "not") {
    assert.deepEqual(replay.steps, t1.steps, "the T1 route comes first, unchanged");
    assert.deepEqual(replay.when.of, t1.completion, "it is skipped once the T1 route is complete");
  }
  const rest = route.steps.slice(1);
  assert.deepEqual(
    rest.map((step) => step.type),
    [
      "unlockSkill", "classConfig",
      ...STRIKER_T2_ZONES.flatMap((biomeGroup) => [
        "travel",
        ...strikerT2ZoneGear(disciplineId, biomeGroup).flatMap(() => ["craft", "equip"]),
        "farm",
        ...(STRIKER_T2_LATE_SEALS.includes(biomeGroup) ? [] : ["attemptBoss"]),
      ]),
      ...STRIKER_T2_LATE_SEALS.flatMap(() => ["equip", "attemptBoss"]),
    ],
  );

  // Gear: T2 recipes from the zone the route is farming, in unlock order, and before the zone's farm ends.
  const wornBefore = new Set<string>();
  for (const biomeGroup of STRIKER_T2_ZONES) {
    const ids = strikerT2ZoneGear(disciplineId, biomeGroup);
    let last = 0;
    for (const itemId of ids) {
      // A charm put back on (strikerT2ZoneCharm) was crafted in an earlier zone of the route.
      if (strikerT2ZoneCharm(biomeGroup, disciplineId) === itemId) {
        assert(wornBefore.has(itemId), `${itemId}, put back on in ${biomeGroup}, was crafted earlier`);
        continue;
      }
      wornBefore.add(itemId);
      const recipe = RECIPE_DATABASE.get(itemId);
      assert(recipe && recipe.recipeGroup === biomeGroup, `${itemId} is a ${biomeGroup} recipe`);
      assert(ITEM_DATABASE.get(itemId)?.tier === 2, `${itemId} is tier-2 gear`);
      assert(recipe.requiredBiomeLevel >= last && recipe.requiredBiomeLevel <= strikerT2FarmLevel(biomeGroup),
        `${itemId} unlocks in order, inside ${biomeGroup}'s T2 farm`);
      last = recipe.requiredBiomeLevel;
    }
  }
  const first = strikerT2ZoneGear(disciplineId, STRIKER_T2_BOSS_ORDER[0]).map((itemId) => RECIPE_DATABASE.get(itemId)?.slot);
  assert.deepEqual(first, ["weapon", "armor", "recovery", "mobility"], "the first T2 seal meets a full set of T2 gear");

  const [pick, config] = rest;
  assert(pick.type === "unlockSkill" && pick.skillId === disciplineId, "the route picks its discipline");
  assert.equal(SKILL_TREE.get(disciplineId)?.disciplineId, disciplineId, "the discipline is a skill node");
  assert(config.type === "classConfig" && config.config.mode === "auto", "the Order goes back to auto");
  if (config.type === "classConfig" && config.config.system.kind === "order") {
    assert.equal(config.config.system.beats.length, strikerComboLength(disciplineId) - 1, "the Order fits the discipline's combo");
  }

  const farms = rest.filter((step): step is Extract<RouteStep, { type: "farm" }> => step.type === "farm");
  const bosses = rest.filter((step): step is Extract<RouteStep, { type: "attemptBoss" }> => step.type === "attemptBoss");
  assert.deepEqual(bosses.map((step) => step.biomeGroup), [...STRIKER_T2_BOSS_ORDER], "every T2 boss, the late seals last");
  assert.deepEqual([...STRIKER_T2_BOSS_ORDER].sort(), [...STRIKER_T2_ZONES].sort(), "every T2 zone's boss, once");
  assert(bosses.every((step) => step.tier === 2), "the bosses are tier 2");
  STRIKER_T2_ZONES.forEach((biomeGroup, index) => {
    const farm = farms[index];
    assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 2, `${biomeGroup} is farmed at tier 2`);
    assert(farm.until.type === "biomeLevelAtLeast" && farm.until.level === strikerT2FarmLevel(biomeGroup), `${biomeGroup} waits on its cap`);
    assert.equal(strikerT2FarmLevel(biomeGroup), tutorialT2Level(biomeGroup), `${biomeGroup} is farmed to the level the guide farms`);
  });

  assert(route.completion.type === "allOf", "completion is every T2 boss");
  if (route.completion.type === "allOf") {
    assert.equal(route.completion.of.length, STRIKER_T2_ZONES.length);
    assert(route.completion.of.every((condition) => condition.type === "bossCleared" && condition.tier === 2));
  }

  const ids = route.milestones.map((milestone) => milestone.id);
  assert.equal(new Set(ids).size, ids.length, "milestone ids are unique");
  for (const milestone of ids) assert(KEBAB.test(milestone), `milestone ${milestone} is kebab-case`);
  for (const biomeGroup of STRIKER_T2_ZONES) assert(ids.includes(`${biomeGroup}-t2-boss`), `${biomeGroup} has a boss milestone`);
}

assert.equal(strikerT2Route().id, STRIKER_T2_LIGHT_ID, "Light is the default arm");
assert.throws(() => strikerT2Route("striker-nope"), /unknown Striker discipline/);
assert.notEqual(
  strikerComboLength("striker-light"),
  strikerComboLength("striker-heavy"),
  "the disciplines' combos differ, so each arm needs its own Order",
);

console.log("strikerT2: ok");
