import assert from "node:assert/strict";
import {
  RECIPE_DATABASE,
  biomeLevelCap,
  SKILL_TREE,
  tutorialScriptWithoutGear,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { isControlledRouteId, requireRoute, ROUTES } from "./index";
import { CONDUIT_CLASS_ROOT, conduitT1Route } from "./conduitT1";
import {
  CONDUIT_T2_DISCIPLINE,
  CONDUIT_T2_ID,
  CONDUIT_T2_ZONES,
  conduitT2FarmLevel,
  conduitT2LessonLevel,
  conduitT2Route,
  CONDUIT_T2_GEAR,
} from "./conduitT2";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-2 biome level the Conduit guide waits on in this zone. */
function tutorialT2Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptWithoutGear(CONDUIT_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 2) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const route = conduitT2Route();
const t1 = conduitT1Route();
assert.equal(route.id, CONDUIT_T2_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.classRoot, CONDUIT_CLASS_ROOT);
assert.deepEqual(ROUTES.get(CONDUIT_T2_ID), route, "conduit-t2 is registered");
assert.deepEqual(requireRoute(CONDUIT_T2_ID, "summoner"), route, "--class=summoner is the route's own class");
assert.equal(isControlledRouteId(CONDUIT_T2_ID), false, "the T2 route is not in the controlled batch default yet");

// ── The T1 route first, through the tier-2 promotion ─────────────────────────
assert.deepEqual(route.steps.slice(0, t1.steps.length), t1.steps, "the T1 route comes first, unchanged");
const tail = route.steps.slice(t1.steps.length);
const last = t1.steps[t1.steps.length - 1];
assert(last.type === "farm" && last.until.type === "playerTierAtLeast" && last.until.tier === 2, "T1 ends on the tier-2 promotion");

// ── The discipline pick ──────────────────────────────────────────────────────
const [pick, marker] = tail;
assert(pick.type === "unlockSkill" && pick.skillId === CONDUIT_T2_DISCIPLINE, "the next step picks the discipline");
assert.equal(SKILL_TREE.get(CONDUIT_T2_DISCIPLINE)?.tier, 1, "the discipline is a tier-1 node of the Passive Tree");
assert.equal(SKILL_TREE.get(CONDUIT_T2_DISCIPLINE)?.classId, CONDUIT_CLASS_ROOT, "and it belongs to the Conduit");
assert(marker.type === "milestone", "the pick is marked");
for (const id of ["conduit-swarm", "conduit-pack", "conduit-elite"]) {
  const other = conduitT2Route(id).steps[t1.steps.length];
  assert(other.type === "unlockSkill" && other.skillId === id, `${id} can be the pick`);
}

// ── The T2 zones: travel, farm to the cap, the T2 boss ───────────────────────
const zoneSteps = tail.slice(2).filter((step) => step.type !== "ifPossible");

// ── Gear: each zone's pieces as its levels unlock them, skipped from tier 4 ──
const wears = tail.filter((step): step is Extract<RouteStep, { type: "ifPossible" }> => step.type === "ifPossible");
assert.equal(wears.length, Object.values(CONDUIT_T2_GEAR).flat().length, "one wear step per piece");
for (const step of wears) {
  assert.deepEqual(step.when, { type: "not", of: { type: "playerTierAtLeast", tier: 4 } }, "T2 gear is kept until tier 4: three T2 seals already make the character tier 3");
  const [farm, craft, equip] = step.steps;
  assert(farm.type === "farm" && craft.type === "craft" && equip.type === "equip", "farm, craft, equip");
  const recipe = RECIPE_DATABASE.get(craft.recipeIds[0]);
  assert(recipe && recipe.tier === 2, `${craft.recipeIds[0]} is a tier-2 recipe`);
  assert.deepEqual(equip.definitionIds, craft.recipeIds);
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === recipe.recipeGroup && farm.at.tier === 2, `${recipe.id} is farmed in its own zone`);
  assert(recipe.requiredBiomeLevel <= biomeLevelCap(2, recipe.recipeGroup), `${recipe.id} unlocks within the zone's farm`);
}
const firstZone = CONDUIT_T2_ZONES[0];
assert(CONDUIT_T2_GEAR[firstZone]?.some((id) => RECIPE_DATABASE.get(id)?.slot === "weapon"),
  "the tier's first boss is met in this tier's Conduit weapon");
assert.equal(zoneSteps.length, CONDUIT_T2_ZONES.length * 3);
CONDUIT_T2_ZONES.forEach((biomeGroup, index) => {
  const [travel, farm, boss] = zoneSteps.slice(index * 3, index * 3 + 3) as [RouteStep, RouteStep, RouteStep];
  assert(travel.type === "travel" && travel.to.kind === "biome" && travel.to.biomeGroup === biomeGroup && travel.to.tier === 2,
    `${biomeGroup}: travels to its tier-2 zone`);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.tier === 2 && farm.until.type === "biomeLevelAtLeast",
    `${biomeGroup}: farms its tier-2 zone`);
  if (farm.type === "farm" && farm.until.type === "biomeLevelAtLeast") {
    assert.equal(farm.until.level, conduitT2FarmLevel(biomeGroup));
    assert.equal(farm.until.level, biomeLevelCap(2, biomeGroup), `${biomeGroup}: farmed to the tier-2 cap`);
    assert.equal(farm.until.level, tutorialT2Level(biomeGroup), `${biomeGroup}: farmed to the level the guide farms`);
    assert(conduitT2LessonLevel(biomeGroup) <= farm.until.level, `${biomeGroup}: the lesson comes before the cap`);
  }
  assert(boss.type === "attemptBoss" && boss.biomeGroup === biomeGroup && boss.tier === 2, `${biomeGroup}: attempts the tier-2 boss`);
});

// ── Completion and milestones ────────────────────────────────────────────────
assert(route.completion.type === "allOf", "completion is every T2 boss");
if (route.completion.type === "allOf") {
  assert.deepEqual(
    route.completion.of.map((c) => (c.type === "bossCleared" ? `${c.biomeGroup}:${c.tier}` : c.type)),
    CONDUIT_T2_ZONES.map((biome) => `${biome}:2`),
  );
}
const ids = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(ids).size, ids.length, "milestone ids are unique");
for (const id of ids) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biome of CONDUIT_T2_ZONES) {
  assert(ids.includes(`${biome}-t2-lesson`) && ids.includes(`${biome}-t2-boss`), `${biome} has T2 milestones`);
}

console.log("conduitT2: ok");
