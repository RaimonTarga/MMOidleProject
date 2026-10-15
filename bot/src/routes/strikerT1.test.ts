import assert from "node:assert/strict";
import {
  biomeLevelCap,
  SKILL_TREE,
  strikerComboLength,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { isClassAgnosticRouteId, requireRoute, ROUTES } from "./index";
import { STRIKER_CLASS_ROOT, STRIKER_T1_ID, strikerFarmLevel, strikerT1Route } from "./strikerT1";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest biome level the Striker guide waits on in this zone. */
function tutorialLevel(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(STRIKER_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm") continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) {
          level = Math.max(level, gate.level);
        }
      }
    }
  }
  return level;
}

const route = strikerT1Route();
assert.equal(route.id, STRIKER_T1_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.version, "1.0.0");
assert.equal(route.classRoot, STRIKER_CLASS_ROOT);
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0, "the class root is a tier-0 skill");
assert(route.description.length > 0, "the route is described");
assert.deepEqual(ROUTES.get(STRIKER_T1_ID), route, "striker-t1 is registered");
assert.equal(requireRoute(STRIKER_T1_ID), ROUTES.get(STRIKER_T1_ID));
assert.deepEqual(requireRoute(STRIKER_T1_ID, "cadence"), route, "--class=cadence is the route's own class");
assert.deepEqual(requireRoute(STRIKER_T1_ID, STRIKER_CLASS_ROOT), route);
assert.equal(isClassAgnosticRouteId(STRIKER_T1_ID), false, "the route is not rebuilt for another class");
let rejected = false;
try {
  requireRoute(STRIKER_T1_ID, "dot");
} catch {
  rejected = true;
}
assert(rejected, "naming another class is rejected");

// ── Steps: the quest, the class, the auto Order, the guide's zones ───────────
const kinds = route.steps.map((step) => step.type);
const walks = T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL);
assert.deepEqual(kinds, [
  "travel", "farm", "chooseClass", "classConfig",
  "travel", "farm", "attemptBoss",
  ...walks.flatMap(() => ["travel", "farm"]),
  "travel", "farm", "attemptBoss",
  "farm",
]);

const [toClearing, quest, choose, config] = route.steps;
assert(toClearing.type === "travel" && toClearing.to.kind === "node", "the quest starts in the Clearing");
assert(quest.type === "farm" && quest.until.type === "playerTierAtLeast" && quest.until.tier === 1,
  "the tier-0 quest comes first");
assert(choose.type === "chooseClass" && choose.skillId === STRIKER_CLASS_ROOT, "the route chooses the Striker");
assert(config.type === "classConfig" && config.config.mode === "auto", "the Order is left on auto");
if (config.type === "classConfig") {
  assert.deepEqual(config.config.relic, [], "auto starts with no trophy");
  assert.equal(config.config.system.kind, "order");
  if (config.config.system.kind === "order") {
    const beats = strikerComboLength(null) - 1;
    assert.equal(config.config.system.beats.length, beats, "the auto Order has the T1 beats before the finisher");
    assert(config.config.system.beats.every((beat) => beat === null), "nothing is placed before a lesson is learned");
    assert.deepEqual(config.config.system.holdFinisher, []);
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
  assert.equal(farm.until.type === "biomeLevelAtLeast" ? farm.until.level : -1, strikerFarmLevel(biomeGroup));
  assert.equal(strikerFarmLevel(biomeGroup), tutorialLevel(biomeGroup),
    `${biomeGroup} is farmed to the level the guide farms`);
  if (biomeGroup === SECOND_SEAL) assert.equal(strikerFarmLevel(biomeGroup), 2, "the Mountain stops at the Coil lesson");
  else assert.equal(strikerFarmLevel(biomeGroup), biomeLevelCap(1, biomeGroup), `${biomeGroup} is farmed to the tier cap`);
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

console.log("strikerT1: ok");
