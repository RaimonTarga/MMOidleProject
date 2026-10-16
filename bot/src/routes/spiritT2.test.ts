import assert from "node:assert/strict";
import {
  biomeLevelCap,
  bossClearKey,
  classConfigContext,
  globalMastery,
  RECIPE_DATABASE,
  resolveClassConfig,
  SKILL_TREE,
  SPIRIT_KIT,
  tutorialScriptWithoutGear,
  validateClassConfig,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { isControlledRouteId, requireRoute, ROUTES } from "./index";
import { SPIRIT_CLASS_ROOT, spiritT1Route } from "./spiritT1";
import {
  SPIRIT_T2_DISCIPLINE,
  SPIRIT_T2_GEAR,
  SPIRIT_T2_ID,
  SPIRIT_T2_ZONES,
  spiritT2FarmLevel,
  spiritT2LessonLevel,
  spiritT2Route,
} from "./spiritT2";

function gates(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return condition.of.flatMap(gates);
  if (condition.type === "not") return gates(condition.of);
  return [condition];
}

/** The deepest level the guide's Tier-2 farms ask of a biome. */
function tutorialT2Level(biome: string): number {
  return Math.max(...tutorialScriptWithoutGear(SPIRIT_CLASS_ROOT).beats.flatMap((beat) =>
    beat.steps.flatMap((step) => step.type === "farm" && step.at.kind === "biome" && step.at.tier === 2
      ? gates(step.until).flatMap((gate) =>
        gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biome ? [gate.level] : [])
      : [])));
}

const route = spiritT2Route();
const t1 = spiritT1Route();
assert.equal(route.id, "spirit-t2");
assert.equal(route.classRoot, "energy-root");
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0);
assert.deepEqual(ROUTES.get(SPIRIT_T2_ID), route, "spirit-t2 is registered");
assert.equal(requireRoute(SPIRIT_T2_ID), ROUTES.get(SPIRIT_T2_ID));
assert.equal(isControlledRouteId(SPIRIT_T2_ID), false, "a one-off route until a live run clears it");
assert.throws(() => requireRoute(SPIRIT_T2_ID, "cadence"), /authored for energy-root/);

// It continues the T1 route unchanged, then picks a discipline the Passive Tree offers.
assert.deepEqual(route.steps.slice(0, t1.steps.length), t1.steps, "the T1 route comes first, through promotion");
const pick = route.steps[t1.steps.length];
assert(pick.type === "unlockSkill" && pick.skillId === SPIRIT_T2_DISCIPLINE);
const node = SKILL_TREE.get(SPIRIT_T2_DISCIPLINE);
assert(node && node.classId === SPIRIT_CLASS_ROOT && node.disciplineId === SPIRIT_T2_DISCIPLINE, "the pick is one of the Spirit's disciplines");
assert(SPIRIT_KIT.disciplines.some((discipline) => discipline.id === SPIRIT_T2_DISCIPLINE));

// Each T2 zone: travel, farm to the guide's level, then its T2 boss.
const t2 = route.steps.slice(t1.steps.length + 1).filter((step) => step.type !== "ifPossible");
assert.equal(t2.length, SPIRIT_T2_ZONES.length * 3);
for (const [index, { biome, pieceId }] of SPIRIT_T2_ZONES.entries()) {
  const [travel, farm, boss] = t2.slice(index * 3, index * 3 + 3);
  assert(travel.type === "travel" && travel.to.kind === "biome" && travel.to.biomeGroup === biome && travel.to.tier === 2);
  const level = spiritT2FarmLevel(biome);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.tier === 2);
  assert.deepEqual(farm.until, { type: "biomeLevelAtLeast", biomeGroup: biome, level });
  assert.equal(level, biomeLevelCap(2, biome));
  assert.equal(level, tutorialT2Level(biome), `${biome}: bot and guide finish at the same level`);
  assert(spiritT2LessonLevel(biome, pieceId) <= level, `${biome}: the lesson lands before the cap`);
  assert.deepEqual(boss, { type: "attemptBoss", biomeGroup: biome, tier: 2 });
}


// Gear: each zone's pieces (from SPIRIT_T2_GEAR) are crafted there and worn, only while the character is still T2;
// the first zone hands over a full set of this tier: the class weapon, an armor, a charm and boots.
const gearBlocks2 = route.steps.slice(t1.steps.length + 1).filter((step): step is Extract<RouteStep, { type: "ifPossible" }> => step.type === "ifPossible");
const worn2: string[] = [];
for (const block of gearBlocks2) {
  assert.deepEqual(block.when, { type: "not", of: { type: "playerTierAtLeast", tier: 3 } });
  for (let i = 0; i < block.steps.length; i += 2) {
    const [craft, equip] = [block.steps[i], block.steps[i + 1]];
    assert(craft.type === "craft" && craft.farmAt?.kind === "biome" && craft.farmAt.tier === 2);
    assert(equip.type === "equip" && equip.definitionIds[0] === craft.recipeIds[0]);
    const recipe = RECIPE_DATABASE.get(craft.recipeIds[0]);
    assert(recipe && recipe.recipeGroup === craft.farmAt.biomeGroup && recipe.tier === 2, craft.recipeIds[0] + " is a T2 recipe of its zone");
    worn2.push(recipe.id);
  }
}
assert.deepEqual(worn2, SPIRIT_T2_ZONES.flatMap(({ biome }) => [...(SPIRIT_T2_GEAR[biome] ?? [])]));
const firstSet2 = (SPIRIT_T2_GEAR[SPIRIT_T2_ZONES[0].biome] ?? []).map((id) => RECIPE_DATABASE.get(id)?.slot).sort();
assert.deepEqual(firstSet2, ["armor", "mobility", "recovery", "weapon"], "the first T2 boss is met in a full set of the tier");

// The T1 route's auto config stays valid through the discipline pick and every T2 lesson and rank-up.
const levels: Record<string, number> = {};
const cleared: string[] = [];
for (const biome of ["plains", "forest", "swamp", "mountain", "cave"]) {
  levels[biome] = biomeLevelCap(1, biome);
  cleared.push(bossClearKey(biome, 1));
}
const config = route.steps.find((step) => step.type === "classConfig");
assert(config && config.type === "classConfig");
for (const { biome } of SPIRIT_T2_ZONES) {
  levels[biome] = spiritT2FarmLevel(biome);
  cleared.push(bossClearKey(biome, 2));
  const ctx = classConfigContext("energy", {
    biomeLevel: levels, bossesCleared: cleared, disciplineId: SPIRIT_T2_DISCIPLINE,
  }, globalMastery(levels));
  const checked = validateClassConfig(config.config, ctx);
  assert(checked.ok, checked.ok ? "" : `${biome}: ${checked.reasons.join("; ")}`);
  assert.equal(resolveClassConfig(checked.config, ctx).mode, "auto");
}

assert.deepEqual(route.completion.type === "allOf" ? route.completion.of.length : 0, 1 + SPIRIT_T2_ZONES.length);
const ids = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(ids).size, ids.length);
assert(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)));
assert(ids.includes("discipline-picked") && ids.includes("desert-t2-boss") && ids.includes("tier-2"));

console.log("spiritT2: ok");
