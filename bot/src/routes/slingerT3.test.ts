import assert from "node:assert/strict";
import {
  biomeLevelCap,
  SKILL_TREE,
  SLINGER_KIT,
  tutorialScriptFor,
  type TutorialCondition,
} from "@mmo-idle/shared";
import { resolveChoices } from "../policy/choices";
import type { Condition, RouteStep } from "../route/types";
import { isControlledRouteId, requireRoute, ROUTES } from "./index";
import { SLINGER_CLASS_ROOT } from "./slingerT1";
import { slingerT2Route } from "./slingerT2";
import {
  DEFAULT_SLINGER_SPECIALIZATION,
  SLINGER_SPECIALIZATIONS,
  SLINGER_T3_ID,
  slingerT3FarmLevel,
  slingerT3LessonLevel,
  slingerT3Route,
  T3_ZONE_ORDER,
} from "./slingerT3";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-3 biome level the Slinger guide waits on in this zone. */
function tutorialT3Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(SLINGER_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 3) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const route = slingerT3Route();
const t2 = slingerT2Route();
assert.equal(route.id, SLINGER_T3_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.classRoot, SLINGER_CLASS_ROOT);
assert(route.description.length > 0, "the route is described");
assert.deepEqual(ROUTES.get(SLINGER_T3_ID), route, "slinger-t3 is registered");
assert.deepEqual(requireRoute(SLINGER_T3_ID, "reload"), route, "--class=reload is the route's own class");
assert.equal(isControlledRouteId(SLINGER_T3_ID), false, "slinger-t3 stays out of the controlled batch until it has run live");

// ── The T2 route comes first, unchanged ──────────────────────────────────────
assert.deepEqual(route.steps.slice(0, t2.steps.length), t2.steps, "the T2 steps open the route");
assert.deepEqual(route.milestones.slice(0, t2.milestones.length), t2.milestones, "and the T2 milestones");
const tail = route.steps.slice(t2.steps.length);

// ── The specialization: one tier-2 node per option, each under its discipline ──
assert.equal(SLINGER_SPECIALIZATIONS.length, 9, "nine specializations");
const picks = tail.slice(0, SLINGER_SPECIALIZATIONS.length);
picks.forEach((step, index) => {
  const spec = SLINGER_SPECIALIZATIONS[index];
  assert(step.type === "unlockSkill", "the specialization is picked with unlockSkill");
  if (step.type !== "unlockSkill") return;
  assert.equal(step.skillId, spec.id);
  const node = SKILL_TREE.get(step.skillId);
  assert(node?.tier === 2 && node.classId === SLINGER_CLASS_ROOT && node.parent === spec.disciplineId, `${step.skillId} is a tier-2 specialization of the Slinger`);
  assert(SLINGER_KIT.specializations.some((entry) => entry.id === step.skillId), `${step.skillId} is a kit specialization`);
  assert.equal(step.choice?.id, "slinger-specialization");
  assert.equal(step.choice?.defaultOption, DEFAULT_SLINGER_SPECIALIZATION);
  assert(KEBAB.test(step.choice?.option ?? ""), "the option is kebab-case");
});
assert.equal(DEFAULT_SLINGER_SPECIALIZATION, "fan-the-hammer");
{
  const defaults = resolveChoices(route, {});
  assert.equal(defaults.selected["slinger-specialization"], "fan-the-hammer");
  assert.equal(defaults.selected["slinger-discipline"], "gunslinger");
  const fan = SLINGER_SPECIALIZATIONS.find((spec) => spec.id === "slinger-fan-the-hammer");
  assert.equal(fan?.disciplineId, "slinger-gunslinger", "the default pair is consistent");
}
for (const spec of SLINGER_SPECIALIZATIONS) {
  const option = spec.id.replace(/^slinger-/, "");
  const discipline = spec.disciplineId.replace(/^slinger-/, "");
  const { route: resolved, selected } = resolveChoices(route, { "slinger-discipline": discipline, "slinger-specialization": option });
  assert.equal(selected["slinger-specialization"], option);
  const unlocks = resolved.steps.filter((step) => step.type === "unlockSkill" && step.skillId === spec.id);
  assert.equal(unlocks.length, 1, `${spec.id}: exactly one pick survives`);
  assert.equal(resolved.steps.filter((step) => step.type === "unlockSkill" && SLINGER_SPECIALIZATIONS.some((s) => s.id === step.skillId)).length, 1);
}

// ── The T3 zones: travel, farm to the tutorial's level, boss at tier 3 ───────
const zoneSteps = tail.slice(SLINGER_SPECIALIZATIONS.length);
assert.deepEqual(zoneSteps.map((step) => step.type), T3_ZONE_ORDER.flatMap(() => ["travel", "farm", "attemptBoss"]));
T3_ZONE_ORDER.forEach((biomeGroup, index) => {
  const [travel, farm, boss] = zoneSteps.slice(index * 3, index * 3 + 3) as [
    Extract<RouteStep, { type: "travel" }>,
    Extract<RouteStep, { type: "farm" }>,
    Extract<RouteStep, { type: "attemptBoss" }>,
  ];
  assert(travel.to.kind === "biome" && travel.to.biomeGroup === biomeGroup && travel.to.tier === 3, `${biomeGroup}: travels to its tier-3 zone`);
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 3, `${biomeGroup}: farms its tier-3 zone`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup, `${biomeGroup}: waits on its own level`);
  assert.equal(farm.until.type === "biomeLevelAtLeast" ? farm.until.level : -1, slingerT3FarmLevel(biomeGroup));
  assert.equal(slingerT3FarmLevel(biomeGroup), biomeLevelCap(3, biomeGroup), `${biomeGroup}: the tier-3 cap`);
  assert.equal(slingerT3FarmLevel(biomeGroup), tutorialT3Level(biomeGroup), `${biomeGroup}: farmed to the level the guide farms`);
  assert(slingerT3LessonLevel(biomeGroup) < slingerT3FarmLevel(biomeGroup), `${biomeGroup}: the lesson lands before the cap`);
  assert(boss.biomeGroup === biomeGroup && boss.tier === 3, `${biomeGroup}: the tier-3 boss`);
});

// ── Completion and milestones ────────────────────────────────────────────────
assert(route.completion.type === "allOf", "completion is T2 plus every T3 boss");
if (route.completion.type === "allOf") {
  assert.deepEqual(route.completion.of[0], t2.completion, "T2 completion first");
  assert.deepEqual(
    route.completion.of.slice(1),
    T3_ZONE_ORDER.map((biomeGroup) => ({ type: "bossCleared", biomeGroup, tier: 3 })),
    "then every tier-3 boss, in order",
  );
}
const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biomeGroup of T3_ZONE_ORDER) {
  for (const suffix of ["lesson", `level-${slingerT3FarmLevel(biomeGroup)}`, "boss"]) {
    assert(milestoneIds.includes(`t3-${biomeGroup}-${suffix}`), `t3-${biomeGroup}-${suffix} is a milestone`);
  }
}

console.log("slingerT3: ok");
