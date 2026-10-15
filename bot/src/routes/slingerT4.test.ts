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
import { slingerT3Route } from "./slingerT3";
import {
  DEFAULT_SLINGER_LEAF,
  SLINGER_LEAVES,
  SLINGER_T4_ID,
  slingerT4FarmLevel,
  slingerT4LessonLevel,
  slingerT4Route,
  T4_ZONE_ORDER,
} from "./slingerT4";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function gates(condition: Condition | TutorialCondition): (Condition | TutorialCondition)[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

/** The highest tier-4 biome level the Slinger guide waits on in this zone. */
function tutorialT4Level(biomeGroup: string): number {
  let level = 0;
  for (const beat of tutorialScriptFor(SLINGER_CLASS_ROOT).beats) {
    for (const step of beat.steps) {
      if (step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 4) continue;
      for (const gate of gates(step.until)) {
        if (gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup) level = Math.max(level, gate.level);
      }
    }
  }
  return level;
}

const route = slingerT4Route();
const t3 = slingerT3Route();
assert.equal(route.id, SLINGER_T4_ID);
assert(KEBAB.test(route.id), "the id is kebab-case");
assert.equal(route.classRoot, SLINGER_CLASS_ROOT);
assert(route.description.length > 0, "the route is described");
assert.deepEqual(ROUTES.get(SLINGER_T4_ID), route, "slinger-t4 is registered");
assert.deepEqual(requireRoute(SLINGER_T4_ID, "reload"), route, "--class=reload is the route's own class");
assert.equal(isControlledRouteId(SLINGER_T4_ID), false, "slinger-t4 stays out of the controlled batch until it has run live");

// ── The T3 route comes first, unchanged ──────────────────────────────────────
assert.deepEqual(route.steps.slice(0, t3.steps.length), t3.steps, "the T3 steps open the route");
assert.deepEqual(route.milestones.slice(0, t3.milestones.length), t3.milestones, "and the T3 milestones");
const tail = route.steps.slice(t3.steps.length);

// ── The leaf: one tier-3 tree node per option, each under its discipline ─────
assert.equal(SLINGER_LEAVES.length, 9, "nine leaves");
tail.slice(0, SLINGER_LEAVES.length).forEach((step, index) => {
  const leaf = SLINGER_LEAVES[index];
  assert(step.type === "unlockSkill", "the leaf is picked with unlockSkill");
  if (step.type !== "unlockSkill") return;
  assert.equal(step.skillId, leaf.id);
  const node = SKILL_TREE.get(step.skillId);
  assert(node?.tier === 3 && node.classId === SLINGER_CLASS_ROOT && node.parent === leaf.disciplineId, `${step.skillId} is a leaf of the Slinger`);
  assert(SLINGER_KIT.leaves.some((entry) => entry.id === step.skillId), `${step.skillId} is a kit leaf`);
  assert.equal(step.choice?.id, "slinger-leaf");
  assert.equal(step.choice?.defaultOption, DEFAULT_SLINGER_LEAF);
  assert(KEBAB.test(step.choice?.option ?? ""), "the option is kebab-case");
});
{
  const defaults = resolveChoices(route, {});
  assert.equal(defaults.selected["slinger-leaf"], DEFAULT_SLINGER_LEAF);
  const light = SLINGER_LEAVES.find((leaf) => leaf.id === `slinger-${DEFAULT_SLINGER_LEAF}`);
  assert.equal(light?.disciplineId, "slinger-gunslinger", "the default leaf sits under the default discipline");
}
for (const leaf of SLINGER_LEAVES) {
  const option = leaf.id.replace(/^slinger-/, "");
  const { route: resolved, selected } = resolveChoices(route, { "slinger-leaf": option });
  assert.equal(selected["slinger-leaf"], option);
  assert.equal(
    resolved.steps.filter((step) => step.type === "unlockSkill" && SLINGER_LEAVES.some((entry) => entry.id === step.skillId)).length,
    1,
    `${leaf.id}: exactly one leaf pick survives`,
  );
}

// ── The T4 zones: travel, farm to the tutorial's level, boss at tier 4 ───────
const zoneSteps = tail.slice(SLINGER_LEAVES.length);
assert.deepEqual(zoneSteps.map((step) => step.type), T4_ZONE_ORDER.flatMap(() => ["travel", "farm", "attemptBoss"]));
T4_ZONE_ORDER.forEach((biomeGroup, index) => {
  const [travel, farm, boss] = zoneSteps.slice(index * 3, index * 3 + 3) as [
    Extract<RouteStep, { type: "travel" }>,
    Extract<RouteStep, { type: "farm" }>,
    Extract<RouteStep, { type: "attemptBoss" }>,
  ];
  assert(travel.to.kind === "biome" && travel.to.biomeGroup === biomeGroup && travel.to.tier === 4, `${biomeGroup}: travels to its tier-4 zone`);
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 4, `${biomeGroup}: farms its tier-4 zone`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup, `${biomeGroup}: waits on its own level`);
  assert.equal(farm.until.type === "biomeLevelAtLeast" ? farm.until.level : -1, slingerT4FarmLevel(biomeGroup));
  assert.equal(slingerT4FarmLevel(biomeGroup), biomeLevelCap(4, biomeGroup), `${biomeGroup}: the tier-4 cap`);
  assert.equal(slingerT4FarmLevel(biomeGroup), tutorialT4Level(biomeGroup), `${biomeGroup}: farmed to the level the guide farms`);
  assert(slingerT4LessonLevel(biomeGroup) < slingerT4FarmLevel(biomeGroup), `${biomeGroup}: the lesson lands before the cap`);
  assert(boss.biomeGroup === biomeGroup && boss.tier === 4, `${biomeGroup}: the tier-4 boss`);
});

// ── Completion and milestones ────────────────────────────────────────────────
assert(route.completion.type === "allOf", "completion is T3 plus every T4 boss");
if (route.completion.type === "allOf") {
  assert.deepEqual(route.completion.of[0], t3.completion, "T3 completion first");
  assert.deepEqual(
    route.completion.of.slice(1),
    T4_ZONE_ORDER.map((biomeGroup) => ({ type: "bossCleared", biomeGroup, tier: 4 })),
    "then every tier-4 boss, in order",
  );
}
const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(KEBAB.test(id), `milestone ${id} is kebab-case`);
for (const biomeGroup of T4_ZONE_ORDER) {
  for (const suffix of ["lesson", `level-${slingerT4FarmLevel(biomeGroup)}`, "boss"]) {
    assert(milestoneIds.includes(`t4-${biomeGroup}-${suffix}`), `t4-${biomeGroup}-${suffix} is a milestone`);
  }
}

console.log("slingerT4: ok");
