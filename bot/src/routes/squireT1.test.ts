import assert from "node:assert/strict";
import {
  CLEARING_NODE_ID,
  RECIPE_DATABASE,
  SKILL_TREE,
  T1_BIOME_ORDER,
  buildSquireBeats,
  classConfigContext,
  resolveClassConfig,
  validateClassConfig,
  type T1Biome,
  type TutorialBeat,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { ROUTES, isClassAgnosticRouteId, isControlledRouteId, requireRoute } from "./index";
import {
  SQUIRE_CLASS_ROOT,
  SQUIRE_CLEARING_SET,
  SQUIRE_T1_ID,
  SQUIRE_T1_SEAL_GEAR,
  SQUIRE_T1_ZONE_GEAR,
  squireT1Route,
  squireTutorialFarmLevel,
} from "./squireT1";

/** The last biome-level gate the Squire's tutorial farms this zone to. */
function tutorialFarmLevel(biome: T1Biome): number {
  let level: number | null = null;
  const visit = (beats: readonly TutorialBeat[]): void => {
    for (const beat of beats) {
      for (const step of beat.steps) {
        if (
          step.type === "farm" &&
          step.at.kind === "biome" &&
          step.at.biomeGroup === biome &&
          step.at.tier === 1 &&
          step.until.type === "biomeLevelAtLeast"
        ) {
          level = step.until.level;
        }
      }
    }
  };
  visit(buildSquireBeats());
  assert(level !== null, `${biome}: the tutorial farms this zone`);
  return level;
}

const route = squireT1Route();
const registered = ROUTES.get(SQUIRE_T1_ID);
assert(registered, "squire-t1 is registered");
assert.deepEqual(registered, route, "the registry holds the authored route");
assert.equal(requireRoute(SQUIRE_T1_ID), registered);
assert.equal(isClassAgnosticRouteId(SQUIRE_T1_ID), false, "squire-t1 is authored for one class");
assert.equal(isControlledRouteId(SQUIRE_T1_ID), true, "squire-t1 is admitted to a controlled batch");
assert.throws(() => requireRoute(SQUIRE_T1_ID, "cadence"), /authored for cooldown-root/);
assert.equal(requireRoute(SQUIRE_T1_ID, "cooldown").classRoot, SQUIRE_CLASS_ROOT);

assert.equal(route.id, "squire-t1");
assert.equal(route.version, "1.1.0");
assert.equal(route.classRoot, SQUIRE_CLASS_ROOT);
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0, "the class root is a tier-0 skill");
assert(route.description.length > 0, "the route is described");

const [toClearing, quest, choose, config, clearingFarm, clearingCraft, clearingEquip, ...rest] = route.steps;
assert(toClearing.type === "travel" && toClearing.to.kind === "node" && toClearing.to.nodeId === CLEARING_NODE_ID);
assert(quest.type === "farm" && quest.until.type === "playerTierAtLeast" && quest.until.tier === 1,
  "the tier-0 quest comes first");
assert(choose.type === "chooseClass" && choose.skillId === SQUIRE_CLASS_ROOT);

assert(config.type === "classConfig" && config.config.mode === "auto", "the class config is auto");
assert(config.type === "classConfig" && config.config.system.kind === "responses");
{
  const ctx = classConfigContext("cooldown", { biomeLevel: {}, bossesCleared: [], disciplineId: null }, 0);
  const checked = validateClassConfig(config.type === "classConfig" ? config.config : null, ctx);
  assert(checked.ok, `auto config is valid for a fresh Squire${checked.ok ? "" : `: ${checked.reasons.join("; ")}`}`);
  if (checked.ok) {
    const resolved = resolveClassConfig(checked.config, ctx);
    assert.equal(resolved.mode, "auto");
    assert.equal(resolved.system.kind, "responses");
    assert.deepEqual(resolved.relic, [], "a fresh Squire has no trophy yet");
  }
}

// The Clearing set, as the guide's opening makes it: the class's start weapon and the shared pieces.
assert(clearingFarm.type === "farm" && clearingFarm.until.type === "biomeLevelAtLeast" &&
  clearingFarm.until.biomeGroup === "clearing" && clearingFarm.until.level === 4, "the Clearing is farmed to its cap");
assert(clearingCraft.type === "craft" && clearingEquip.type === "equip");
assert.deepEqual(clearingCraft.type === "craft" ? clearingCraft.recipeIds : [], [...SQUIRE_CLEARING_SET]);
assert.deepEqual(clearingEquip.type === "equip" ? clearingEquip.definitionIds : [], [...SQUIRE_CLEARING_SET]);
{
  const weapon = RECIPE_DATABASE.get(SQUIRE_CLEARING_SET[0]);
  assert(weapon && weapon.slot === "weapon" && weapon.recipeGroup === "clearing" && weapon.classes?.includes("cooldown"),
    "the start weapon is the Squire's Clearing weapon");
}

// Every T1 zone: farmed to the tutorial's level, wearing each of its pieces once its level unlocks it.
const bossAt = rest.findIndex((step) => step.type === "attemptBoss");
const zoneSteps = rest.slice(0, bossAt - 1);
T1_BIOME_ORDER.forEach((biome) => {
  const level = squireTutorialFarmLevel(biome);
  assert.equal(level, tutorialFarmLevel(biome), `${biome}: the route farms to the tutorial's level`);
  const farms = zoneSteps.filter((step) => step.type === "farm" && step.at.kind === "biome" && step.at.biomeGroup === biome);
  assert(farms.length > 0, `${biome}: farms that zone`);
  const last = farms[farms.length - 1];
  assert(last.type === "farm" && last.at.kind === "biome" && last.at.tier === 1 && last.until.type === "biomeLevelAtLeast" &&
    last.until.biomeGroup === biome && last.until.level === level, `${biome}: until the tutorial's level`);
  for (const id of SQUIRE_T1_ZONE_GEAR[biome]) {
    const recipe = RECIPE_DATABASE.get(id);
    assert(recipe, `${id} is a recipe`);
    assert.equal(recipe.recipeGroup, biome, `${id} is made in the ${biome}`);
    if (recipe.requiredBiomeLevel > level) continue;
    const craftAt = zoneSteps.findIndex((step) => step.type === "craft" && step.recipeIds.includes(id));
    assert(craftAt > 0, `${id}: crafted in the ${biome}`);
    const gate = zoneSteps[craftAt - 1];
    assert(gate.type === "farm" && gate.until.type === "biomeLevelAtLeast" && gate.until.level === recipe.requiredBiomeLevel,
      `${id}: crafted as soon as its level unlocks it`);
    const wear = zoneSteps[craftAt + 1];
    assert(wear.type === "equip" && wear.definitionIds.includes(id), `${id}: worn at once`);
  }
});

const bosses = rest.filter((step) => step.type === "attemptBoss");
assert.equal(bosses.length, 2);
assert(bosses[0].type === "attemptBoss" && bosses[0].biomeGroup === "plains" && bosses[0].tier === 1, "the Plains seal");
assert(bosses[1].type === "attemptBoss" && bosses[1].biomeGroup === "mountain" && bosses[1].tier === 1, "the Mountain seal");
// The seal gear is equipped right before each seal, and every piece was crafted earlier in the route.
const crafted = new Set(route.steps.flatMap((step) => (step.type === "craft" ? step.recipeIds : [])));
for (const [biome, ids] of Object.entries(SQUIRE_T1_SEAL_GEAR)) {
  const at = route.steps.findIndex((step) => step.type === "attemptBoss" && step.biomeGroup === biome);
  const before = route.steps[at - 1];
  assert(before.type === "equip" && before.definitionIds.join() === ids.join(), `${biome}: its seal gear is worn first`);
  for (const id of ids) assert(crafted.has(id), `${id}: crafted before the ${biome} seal`);
}

assert(route.completion.type === "playerTierAtLeast" && route.completion.tier === 2,
  "two seals promote to tier 2");

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.deepEqual(milestoneIds, [
  "tier-1-reached", "class-chosen", "clearing-set",
  ...T1_BIOME_ORDER.map((biome) => `${biome}-farmed`),
  "plains-seal", "mountain-seal",
]);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const milestone of route.milestones) {
  assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(milestone.id), `${milestone.id} is kebab-case`);
}

// The route never names a step kind the harness dropped.
const used: RouteStep["type"][] = route.steps.map((step) => step.type);
assert(used.every((kind) => kind !== "configureRunes" && kind !== "unlockSkill"), "no old rune or skill steps");

console.log("squireT1: ok");
