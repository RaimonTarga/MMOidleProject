import assert from "node:assert/strict";
import {
  biomeLevelCap,
  SKILL_TREE,
  tutorialScriptFor,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { Condition, RouteStep } from "../route/types";
import { isControlledRouteId, requireRoute, ROUTES } from "./index";
import { CONDUIT_CLASS_ROOT } from "./conduitT1";
import { CONDUIT_T2_DISCIPLINE } from "./conduitT2";
import { conduitT3Route } from "./conduitT3";
import {
  CONDUIT_T4_ID,
  CONDUIT_T4_LEAF,
  CONDUIT_T4_ZONES,
  conduitT4FarmLevel,
  conduitT4LessonLevel,
  conduitT4Route,
} from "./conduitT4";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-4 biome level the Conduit guide waits on in this zone. */
function tutorialT4Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(CONDUIT_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 4) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const route = conduitT4Route();
const t3 = conduitT3Route();
assert.equal(route.id, CONDUIT_T4_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.classRoot, CONDUIT_CLASS_ROOT);
assert.deepEqual(ROUTES.get(CONDUIT_T4_ID), route, "conduit-t4 is registered");
assert.deepEqual(requireRoute(CONDUIT_T4_ID, "summoner"), route, "--class=summoner is the route's own class");
assert.equal(isControlledRouteId(CONDUIT_T4_ID), false, "the T4 route is not in the controlled batch default until it has run live");

// The T3 route first, unchanged.
assert.deepEqual(route.steps.slice(0, t3.steps.length), t3.steps, "the T3 route comes first, unchanged");
const tail = route.steps.slice(t3.steps.length);

// The tier-4 promotion, then the leaf pick.
const [promotion, pick, marker] = tail;
assert(promotion.type === "farm" && promotion.until.type === "playerTierAtLeast" && promotion.until.tier === 4, "the T3 route ends on the tier-4 promotion");
assert(pick.type === "unlockSkill" && pick.skillId === CONDUIT_T4_LEAF, "the next step picks the leaf");
const node = SKILL_TREE.get(CONDUIT_T4_LEAF);
assert.equal(node?.tier, 3, "the leaf is a tier-3 node of the Passive Tree (the Tier 4 pick)");
assert.equal(node?.classId, CONDUIT_CLASS_ROOT, "and it belongs to the Conduit");
assert.equal(node?.disciplineId, CONDUIT_T2_DISCIPLINE, "and it sits under the discipline the route picked");
assert(marker.type === "milestone", "the pick is marked");
for (const id of ["conduit-avenge", "conduit-fall-back", "conduit-rally"]) {
  const other = conduitT4Route(id).steps[t3.steps.length + 1];
  assert(other.type === "unlockSkill" && other.skillId === id, `${id} can be the pick`);
  assert.equal(SKILL_TREE.get(id)?.disciplineId, CONDUIT_T2_DISCIPLINE, `${id} is one of Pack's leaves`);
}

// The T4 zones: travel, farm to the cap, the T4 boss.
const zoneSteps = tail.slice(3);
assert.equal(zoneSteps.length, CONDUIT_T4_ZONES.length * 3);
CONDUIT_T4_ZONES.forEach((biomeGroup, index) => {
  const [travel, farm, boss] = zoneSteps.slice(index * 3, index * 3 + 3) as [RouteStep, RouteStep, RouteStep];
  assert(travel.type === "travel" && travel.to.kind === "biome" && travel.to.biomeGroup === biomeGroup && travel.to.tier === 4,
    `${biomeGroup}: travels to its tier-4 zone`);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.tier === 4 && farm.until.type === "biomeLevelAtLeast",
    `${biomeGroup}: farms its tier-4 zone`);
  if (farm.type === "farm" && farm.until.type === "biomeLevelAtLeast") {
    assert.equal(farm.until.level, conduitT4FarmLevel(biomeGroup));
    assert.equal(farm.until.level, biomeLevelCap(4, biomeGroup), `${biomeGroup}: farmed to the tier-4 cap`);
    assert.equal(farm.until.level, tutorialT4Level(biomeGroup), `${biomeGroup}: farmed to the level the guide farms`);
    assert(conduitT4LessonLevel(biomeGroup) <= farm.until.level, `${biomeGroup}: the lesson comes before the cap`);
  }
  assert(boss.type === "attemptBoss" && boss.biomeGroup === biomeGroup && boss.tier === 4, `${biomeGroup}: attempts the tier-4 boss`);
});

// Completion and milestones.
assert(route.completion.type === "allOf", "completion is every T4 boss");
if (route.completion.type === "allOf") {
  assert.deepEqual(
    route.completion.of.map((c) => (c.type === "bossCleared" ? `${c.biomeGroup}:${c.tier}` : c.type)),
    CONDUIT_T4_ZONES.map((biome) => `${biome}:4`),
  );
}
const ids = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(ids).size, ids.length, "milestone ids are unique");
for (const id of ids) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biome of CONDUIT_T4_ZONES) {
  assert(ids.includes(`${biome}-t4-lesson`) && ids.includes(`${biome}-t4-boss`), `${biome} has T4 milestones`);
}

console.log("conduitT4: ok");
