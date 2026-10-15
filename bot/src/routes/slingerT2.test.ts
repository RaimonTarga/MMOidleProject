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
import { SLINGER_CLASS_ROOT, slingerT1Route } from "./slingerT1";
import {
  DEFAULT_SLINGER_DISCIPLINE,
  SLINGER_DISCIPLINES,
  SLINGER_T2_ID,
  slingerT2FarmLevel,
  slingerT2LessonLevel,
  slingerT2Route,
  T2_ZONE_ORDER,
} from "./slingerT2";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-2 biome level the Slinger guide waits on in this zone. */
function tutorialT2Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(SLINGER_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 2) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const route = slingerT2Route();
const t1 = slingerT1Route();
assert.equal(route.id, SLINGER_T2_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.version, "1.0.0");
assert.equal(route.classRoot, SLINGER_CLASS_ROOT);
assert(route.description.length > 0, "the route is described");
assert.deepEqual(ROUTES.get(SLINGER_T2_ID), route, "slinger-t2 is registered");
assert.equal(requireRoute(SLINGER_T2_ID), ROUTES.get(SLINGER_T2_ID));
assert.deepEqual(requireRoute(SLINGER_T2_ID, "reload"), route, "--class=reload is the route's own class");
assert.equal(isControlledRouteId(SLINGER_T2_ID), false, "slinger-t2 is a one-off run until the conductor admits it");
let rejected = false;
try {
  requireRoute(SLINGER_T2_ID, "cadence");
} catch {
  rejected = true;
}
assert(rejected, "naming another class is rejected");

// ── The T1 route comes first, unchanged ──────────────────────────────────────
assert.deepEqual(route.steps.slice(0, t1.steps.length), t1.steps, "the T1 steps open the route");
assert.deepEqual(route.milestones.slice(0, t1.milestones.length), t1.milestones, "and the T1 milestones");
const tail = route.steps.slice(t1.steps.length);

// ── The discipline: one tier-1 node of the class per option, Gunslinger by default ──
const picks = tail.slice(0, SLINGER_DISCIPLINES.length);
assert(picks.every((step) => step.type === "unlockSkill"), "the discipline is picked with unlockSkill");
picks.forEach((step, index) => {
  const discipline = SLINGER_DISCIPLINES[index];
  if (step.type !== "unlockSkill") return;
  assert.equal(step.skillId, `slinger-${discipline}`);
  const node = SKILL_TREE.get(step.skillId);
  assert(node?.tier === 1 && node.parent === SLINGER_CLASS_ROOT && node.disciplineId === step.skillId, `${step.skillId} is a tier-1 discipline of the Slinger`);
  assert(SLINGER_KIT.disciplines.some((entry) => entry.id === step.skillId), `${step.skillId} is a kit discipline`);
  assert.deepEqual(step.choice, { id: "slinger-discipline", option: discipline, defaultOption: DEFAULT_SLINGER_DISCIPLINE });
});
assert.equal(DEFAULT_SLINGER_DISCIPLINE, "gunslinger");
for (const discipline of SLINGER_DISCIPLINES) {
  const { route: resolved, selected } = resolveChoices(route, { "slinger-discipline": discipline });
  assert.equal(selected["slinger-discipline"], discipline);
  const unlocks = resolved.steps.filter((step) => step.type === "unlockSkill" && step.skillId !== SLINGER_CLASS_ROOT);
  assert.equal(unlocks.length, 1, `${discipline}: exactly one discipline step survives`);
}
assert.equal(resolveChoices(route, {}).selected["slinger-discipline"], "gunslinger");

// ── The T2 zones: travel, farm to the tutorial's level, boss at tier 2 ───────
const zoneSteps = tail.slice(SLINGER_DISCIPLINES.length);
assert.deepEqual(zoneSteps.map((step) => step.type), T2_ZONE_ORDER.flatMap(() => ["travel", "farm", "attemptBoss"]));
T2_ZONE_ORDER.forEach((biomeGroup, index) => {
  const [travel, farm, boss] = zoneSteps.slice(index * 3, index * 3 + 3) as [
    Extract<RouteStep, { type: "travel" }>,
    Extract<RouteStep, { type: "farm" }>,
    Extract<RouteStep, { type: "attemptBoss" }>,
  ];
  assert(travel.to.kind === "biome" && travel.to.biomeGroup === biomeGroup && travel.to.tier === 2, `${biomeGroup}: travels to its tier-2 zone`);
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 2, `${biomeGroup}: farms its tier-2 zone`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup, `${biomeGroup}: waits on its own level`);
  assert.equal(farm.until.type === "biomeLevelAtLeast" ? farm.until.level : -1, slingerT2FarmLevel(biomeGroup));
  assert.equal(slingerT2FarmLevel(biomeGroup), biomeLevelCap(2, biomeGroup), `${biomeGroup}: the tier-2 cap`);
  assert.equal(slingerT2FarmLevel(biomeGroup), tutorialT2Level(biomeGroup), `${biomeGroup}: farmed to the level the guide farms`);
  assert(slingerT2LessonLevel(biomeGroup) < slingerT2FarmLevel(biomeGroup), `${biomeGroup}: the lesson lands before the cap`);
  assert(boss.biomeGroup === biomeGroup && boss.tier === 2, `${biomeGroup}: the tier-2 boss`);
});

// ── Completion and milestones ────────────────────────────────────────────────
assert(route.completion.type === "allOf", "completion is T1 plus every T2 boss");
if (route.completion.type === "allOf") {
  assert.deepEqual(route.completion.of[0], t1.completion, "T1 completion first");
  const bosses = route.completion.of.slice(1);
  assert.deepEqual(
    bosses,
    T2_ZONE_ORDER.map((biomeGroup) => ({ type: "bossCleared", biomeGroup, tier: 2 })),
    "then every tier-2 boss, in order",
  );
}
const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biomeGroup of T2_ZONE_ORDER) {
  for (const suffix of ["lesson", `level-${slingerT2FarmLevel(biomeGroup)}`, "boss"]) {
    assert(milestoneIds.includes(`t2-${biomeGroup}-${suffix}`), `t2-${biomeGroup}-${suffix} is a milestone`);
  }
}

console.log("slingerT2: ok");
