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
import { CONDUIT_CLASS_ROOT } from "./conduitT1";
import { CONDUIT_T2_DISCIPLINE, conduitT2Route } from "./conduitT2";
import {
  CONDUIT_T3_ID,
  CONDUIT_T3_SPECIALIZATION,
  CONDUIT_T3_ZONES,
  conduitT3FarmLevel,
  conduitT3LessonLevel,
  conduitT3Route,
  CONDUIT_T3_GEAR,
} from "./conduitT3";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-3 biome level the Conduit guide waits on in this zone. */
function tutorialT3Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptWithoutGear(CONDUIT_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 3) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const route = conduitT3Route();
const t2 = conduitT2Route();
assert.equal(route.id, CONDUIT_T3_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.classRoot, CONDUIT_CLASS_ROOT);
assert.deepEqual(ROUTES.get(CONDUIT_T3_ID), route, "conduit-t3 is registered");
assert.deepEqual(requireRoute(CONDUIT_T3_ID, "summoner"), route, "--class=summoner is the route's own class");
assert.equal(isControlledRouteId(CONDUIT_T3_ID), false, "the T3 route is not in the controlled batch default until it has run live");

// ── The T2 route first, unchanged ────────────────────────────────────────────
assert.deepEqual(route.steps.slice(0, t2.steps.length), t2.steps, "the T2 route comes first, unchanged");
const tail = route.steps.slice(t2.steps.length);

// ── The tier-3 promotion, then the specialization pick ───────────────────────
const [promotion, pick, marker] = tail;
assert(promotion.type === "farm" && promotion.until.type === "playerTierAtLeast" && promotion.until.tier === 3, "the T2 route ends on the tier-3 promotion");
assert(pick.type === "unlockSkill" && pick.skillId === CONDUIT_T3_SPECIALIZATION, "the next step picks the specialization");
const node = SKILL_TREE.get(CONDUIT_T3_SPECIALIZATION);
assert.equal(node?.tier, 2, "the specialization is a tier-2 node of the Passive Tree (the Tier 3 pick)");
assert.equal(node?.classId, CONDUIT_CLASS_ROOT, "and it belongs to the Conduit");
assert.equal(node?.disciplineId, CONDUIT_T2_DISCIPLINE, "and it sits under the discipline the route picked");
assert(marker.type === "milestone", "the pick is marked");
for (const id of ["conduit-burn-bright", "conduit-legion", "conduit-infestation", "conduit-shield-wall", "conduit-the-hunt", "conduit-choir"]) {
  const other = conduitT3Route(id).steps[t2.steps.length + 1];
  assert(other.type === "unlockSkill" && other.skillId === id, `${id} can be the pick`);
}

// ── The T3 zones: travel, farm to the cap, the T3 boss ───────────────────────
const zoneSteps = tail.slice(3).filter((step) => step.type !== "ifPossible");

// ── Gear: each zone's pieces as its levels unlock them, skipped from tier 5 ──
const wears = tail.filter((step): step is Extract<RouteStep, { type: "ifPossible" }> => step.type === "ifPossible");
assert.equal(wears.length, Object.values(CONDUIT_T3_GEAR).flat().length, "one wear step per piece");
for (const step of wears) {
  assert.deepEqual(step.when, { type: "not", of: { type: "playerTierAtLeast", tier: 5 } }, "T3 gear is kept until tier 5: four T3 seals already make the character tier 4");
  const [farm, craft, equip] = step.steps;
  assert(farm.type === "farm" && craft.type === "craft" && equip.type === "equip", "farm, craft, equip");
  const recipe = RECIPE_DATABASE.get(craft.recipeIds[0]);
  assert(recipe && recipe.tier === 3, `${craft.recipeIds[0]} is a tier-3 recipe`);
  assert.deepEqual(equip.definitionIds, craft.recipeIds);
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === recipe.recipeGroup && farm.at.tier === 3, `${recipe.id} is farmed in its own zone`);
  assert(recipe.requiredBiomeLevel <= biomeLevelCap(3, recipe.recipeGroup), `${recipe.id} unlocks within the zone's farm`);
}
const firstZone = CONDUIT_T3_ZONES[0];
assert(CONDUIT_T3_GEAR[firstZone]?.some((id) => RECIPE_DATABASE.get(id)?.slot === "weapon"),
  "the tier's first boss is met in this tier's Conduit weapon");
assert.equal(zoneSteps.length, CONDUIT_T3_ZONES.length * 3);
CONDUIT_T3_ZONES.forEach((biomeGroup, index) => {
  const [travel, farm, boss] = zoneSteps.slice(index * 3, index * 3 + 3) as [RouteStep, RouteStep, RouteStep];
  assert(travel.type === "travel" && travel.to.kind === "biome" && travel.to.biomeGroup === biomeGroup && travel.to.tier === 3,
    `${biomeGroup}: travels to its tier-3 zone`);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.tier === 3 && farm.until.type === "biomeLevelAtLeast",
    `${biomeGroup}: farms its tier-3 zone`);
  if (farm.type === "farm" && farm.until.type === "biomeLevelAtLeast") {
    assert.equal(farm.until.level, conduitT3FarmLevel(biomeGroup));
    assert.equal(farm.until.level, biomeLevelCap(3, biomeGroup), `${biomeGroup}: farmed to the tier-3 cap`);
    assert.equal(farm.until.level, tutorialT3Level(biomeGroup), `${biomeGroup}: farmed to the level the guide farms`);
    assert(conduitT3LessonLevel(biomeGroup) <= farm.until.level, `${biomeGroup}: the lesson comes before the cap`);
  }
  assert(boss.type === "attemptBoss" && boss.biomeGroup === biomeGroup && boss.tier === 3, `${biomeGroup}: attempts the tier-3 boss`);
});

// ── Completion and milestones ────────────────────────────────────────────────
assert(route.completion.type === "allOf", "completion is every T3 boss");
if (route.completion.type === "allOf") {
  assert.deepEqual(
    route.completion.of.map((c) => (c.type === "bossCleared" ? `${c.biomeGroup}:${c.tier}` : c.type)),
    CONDUIT_T3_ZONES.map((biome) => `${biome}:3`),
  );
}
const ids = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(ids).size, ids.length, "milestone ids are unique");
for (const id of ids) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biome of CONDUIT_T3_ZONES) {
  assert(ids.includes(`${biome}-t3-lesson`) && ids.includes(`${biome}-t3-boss`), `${biome} has T3 milestones`);
}

console.log("conduitT3: ok");
