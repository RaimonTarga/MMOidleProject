import assert from "node:assert/strict";
import {
  biomeLevelCap,
  RECIPE_DATABASE,
  SKILL_TREE,
  SLINGER_KIT,
  tutorialScriptWithoutGear,
  type TutorialCondition,
} from "@mmo-idle/shared";
import { resolveChoices } from "../policy/choices";
import type { Condition, RouteStep } from "../route/types";
import { isControlledRouteId, requireRoute, ROUTES } from "./index";
import { SLINGER_CLASS_ROOT } from "./slingerT1";
import { SLINGER_CHAINS, slingerRouteId } from "./slingerT2";
import { slingerT3Route } from "./slingerT3";
import {
  DEFAULT_SLINGER_LEAF,
  SLINGER_LEAVES,
  SLINGER_T4_GUNS,
  SLINGER_T4_ID,
  SLINGER_T4_ZONE_KIT,
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
  for (const beat of tutorialScriptWithoutGear(SLINGER_CLASS_ROOT).beats) {
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
const isGear = (step: RouteStep) => step.type === "craft" || step.type === "equip";
const zoneSteps = tail.slice(SLINGER_LEAVES.length).filter((step) => !isGear(step));
assert.deepEqual(zoneSteps.map((step) => step.type), T4_ZONE_ORDER.flatMap(() => ["travel", "farm", "attemptBoss"]));
// ── Gear: each zone's vest, charm and boots as they unlock; the first T4 boss in a T4 gun ──
for (const discipline of ["gunslinger", "siege", "trickshot"]) {
  const resolved = resolveChoices(route, { "slinger-discipline": discipline }).route.steps.slice(resolveChoices(t3, { "slinger-discipline": discipline }).route.steps.length);
  const crafts = resolved.filter((step): step is Extract<RouteStep, { type: "craft" }> => step.type === "craft");
  const equips = resolved.filter((step): step is Extract<RouteStep, { type: "equip" }> => step.type === "equip");
  assert.deepEqual(crafts.map((step) => step.recipeIds), equips.map((step) => step.definitionIds), `${discipline}: worn as made`);
  for (const step of crafts) {
    const recipe = RECIPE_DATABASE.get(step.recipeIds[0]);
    assert(recipe && recipe.tier === 4, `${step.recipeIds[0]} is a tier-4 recipe`);
    assert(step.farmAt?.kind === "biome" && step.farmAt.biomeGroup === recipe.recipeGroup && step.farmAt.tier === 4, `${recipe.id} is made in its own tier-4 zone`);
    assert(recipe.requiredBiomeLevel <= biomeLevelCap(4, recipe.recipeGroup), `${recipe.id} unlocks within the tier's cap`);
    if (recipe.slot === "weapon") assert(recipe.id.startsWith("slinger-"), `${recipe.id} is a Slinger gun`);
  }
  for (const biomeGroup of T4_ZONE_ORDER) {
    for (const id of SLINGER_T4_ZONE_KIT[biomeGroup]) assert(crafts.some((step) => step.recipeIds[0] === id), `${discipline}: ${id} is worn`);
  }
  const firstBoss = resolved.findIndex((step) => step.type === "attemptBoss");
  const gun = resolved.slice(0, firstBoss).find((step) => step.type === "equip" && RECIPE_DATABASE.get(step.definitionIds[0])?.slot === "weapon");
  assert(gun?.type === "equip", `${discipline}: a T4 gun before the first T4 boss`);
  assert(SLINGER_T4_GUNS.some((entry) => entry.discipline === discipline && entry.id === gun.definitionIds[0]), `${discipline}: the gun fits the discipline`);
}
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

// ── The other two discipline chains (OV2): registered, each defaulting to its own picks ──
for (const discipline of ["siege", "trickshot"] as const) {
  const chain = SLINGER_CHAINS[discipline];
  for (const tier of [2, 3, 4]) {
    const id = slingerRouteId(tier, discipline);
    assert.equal(id, `slinger-t${tier}-${discipline}`);
    assert(ROUTES.has(id), `${id} is registered`);
    assert.equal(isControlledRouteId(id), false, `${id} stays out of the controlled batch`);
  }
  const chainRoute = requireRoute(slingerRouteId(4, discipline), "reload");
  assert.deepEqual(chainRoute, slingerT4Route(discipline));
  const { route: resolved, selected } = resolveChoices(chainRoute, {});
  assert.equal(selected["slinger-discipline"], discipline, `${discipline}: the chain's discipline by default`);
  assert.equal(selected["slinger-specialization"], chain.specialization);
  assert.equal(selected["slinger-leaf"], chain.leaf);
  const picks = resolved.steps.filter((step): step is Extract<RouteStep, { type: "unlockSkill" }> => step.type === "unlockSkill").map((step) => step.skillId);
  assert.deepEqual(picks, [`slinger-${discipline}`, `slinger-${chain.specialization}`, `slinger-${chain.leaf}`], `${discipline}: one pick per tier`);
  const [spec, leaf] = picks.slice(-2);
  assert.equal(SLINGER_KIT.specializations.find((entry) => entry.id === spec)?.disciplineId, `slinger-${discipline}`, `${discipline}: the specialization sits under the discipline`);
  assert.equal(SLINGER_KIT.leaves.find((entry) => entry.id === leaf)?.disciplineId, `slinger-${discipline}`, `${discipline}: the leaf sits under the discipline`);
  // The chain is the default route with the chain's choices passed.
  const passed = resolveChoices(route, {
    "slinger-discipline": discipline, "slinger-specialization": chain.specialization, "slinger-leaf": chain.leaf,
  }).route;
  const bare = (steps: RouteStep[]) => steps.map(({ choice: _choice, ...step }) => step);
  assert.deepEqual(bare(resolved.steps), bare(passed.steps), `${discipline}: the default route with the choices passed`);
}

console.log("slingerT4: ok");
