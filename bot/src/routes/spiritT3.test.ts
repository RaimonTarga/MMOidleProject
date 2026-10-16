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
  tutorialScriptFor,
  validateClassConfig,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { isControlledRouteId, requireRoute, ROUTES } from "./index";
import { SPIRIT_CLASS_ROOT } from "./spiritT1";
import { SPIRIT_T2_DISCIPLINE, SPIRIT_T2_ZONES, spiritT2FarmLevel, spiritT2Route } from "./spiritT2";
import {
  SPIRIT_T3_GEAR,
  SPIRIT_T3_ID,
  SPIRIT_T3_SPECIALIZATION,
  SPIRIT_T3_ZONES,
  spiritT3FarmLevel,
  spiritT3LessonLevel,
  spiritT3Route,
} from "./spiritT3";

function gates(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return condition.of.flatMap(gates);
  if (condition.type === "not") return gates(condition.of);
  return [condition];
}

/** The deepest level the guide's Tier-3 farms ask of a biome. */
function tutorialT3Level(biome: string): number {
  return Math.max(...tutorialScriptFor(SPIRIT_CLASS_ROOT).beats.flatMap((beat) =>
    beat.steps.flatMap((step) => step.type === "farm" && step.at.kind === "biome" && step.at.tier === 3
      ? gates(step.until).flatMap((gate) =>
        gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biome ? [gate.level] : [])
      : [])));
}

const route = spiritT3Route();
const t2 = spiritT2Route();
assert.equal(route.id, "spirit-t3");
assert.equal(route.classRoot, "energy-root");
assert.deepEqual(ROUTES.get(SPIRIT_T3_ID), route, "spirit-t3 is registered");
assert.equal(requireRoute(SPIRIT_T3_ID), ROUTES.get(SPIRIT_T3_ID));
assert.equal(isControlledRouteId(SPIRIT_T3_ID), false, "a one-off route until a live run clears it");
assert.throws(() => requireRoute(SPIRIT_T3_ID, "cadence"), /authored for energy-root/);

// It continues the T2 route unchanged, waits for tier 3, then picks a specialization under the discipline.
assert.deepEqual(route.steps.slice(0, t2.steps.length), t2.steps, "the T2 route comes first");
const wait = route.steps[t2.steps.length];
assert(wait.type === "farm" && wait.until.type === "playerTierAtLeast" && wait.until.tier === 3, "waits for the tier-3 promotion");
const pick = route.steps[t2.steps.length + 1];
assert(pick.type === "unlockSkill" && pick.skillId === SPIRIT_T3_SPECIALIZATION);
const node = SKILL_TREE.get(SPIRIT_T3_SPECIALIZATION);
assert(node && node.classId === SPIRIT_CLASS_ROOT && node.disciplineId === SPIRIT_T2_DISCIPLINE, "the pick is a specialization of the route's discipline");
assert(SPIRIT_KIT.specializations.some((spec) => spec.id === SPIRIT_T3_SPECIALIZATION && spec.disciplineId === SPIRIT_T2_DISCIPLINE));

// Each T3 zone: travel, farm to the guide's level, then its T3 boss.
const t3 = route.steps.slice(t2.steps.length + 2).filter((step) => step.type !== "ifPossible");
assert.equal(t3.length, SPIRIT_T3_ZONES.length * 3);
for (const [index, { biome, pieceId }] of SPIRIT_T3_ZONES.entries()) {
  const [travel, farm, boss] = t3.slice(index * 3, index * 3 + 3);
  assert(travel.type === "travel" && travel.to.kind === "biome" && travel.to.biomeGroup === biome && travel.to.tier === 3);
  const level = spiritT3FarmLevel(biome);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.tier === 3);
  assert.deepEqual(farm.until, { type: "biomeLevelAtLeast", biomeGroup: biome, level });
  assert.equal(level, biomeLevelCap(3, biome));
  assert.equal(level, tutorialT3Level(biome), `${biome}: bot and guide finish at the same level`);
  assert(spiritT3LessonLevel(biome, pieceId) <= level, `${biome}: the lesson lands before the cap`);
  assert.deepEqual(boss, { type: "attemptBoss", biomeGroup: biome, tier: 3 });
}


// Gear: each zone's pieces (from SPIRIT_T3_GEAR) are crafted there and worn, only while the character is still T3;
// the first zone hands over a full set of this tier: the class weapon, an armor, a charm and boots.
const gearBlocks3 = route.steps.slice(t2.steps.length + 2).filter((step): step is Extract<RouteStep, { type: "ifPossible" }> => step.type === "ifPossible");
const worn3: string[] = [];
for (const block of gearBlocks3) {
  assert.deepEqual(block.when, { type: "not", of: { type: "playerTierAtLeast", tier: 4 } });
  for (let i = 0; i < block.steps.length; i += 2) {
    const [craft, equip] = [block.steps[i], block.steps[i + 1]];
    assert(craft.type === "craft" && craft.farmAt?.kind === "biome" && craft.farmAt.tier === 3);
    assert(equip.type === "equip" && equip.definitionIds[0] === craft.recipeIds[0]);
    const recipe = RECIPE_DATABASE.get(craft.recipeIds[0]);
    assert(recipe && recipe.recipeGroup === craft.farmAt.biomeGroup && recipe.tier === 3, craft.recipeIds[0] + " is a T3 recipe of its zone");
    worn3.push(recipe.id);
  }
}
assert.deepEqual(worn3, SPIRIT_T3_ZONES.flatMap(({ biome }) => [...(SPIRIT_T3_GEAR[biome] ?? [])]));
const firstSet3 = (SPIRIT_T3_GEAR[SPIRIT_T3_ZONES[0].biome] ?? []).map((id) => RECIPE_DATABASE.get(id)?.slot).sort();
assert.deepEqual(firstSet3, ["armor", "mobility", "recovery", "weapon"], "the first T3 boss is met in a full set of the tier");

// The auto config stays valid through the specialization and every T3 lesson and rank-up.
const levels: Record<string, number> = {};
const cleared: string[] = [];
for (const biome of ["plains", "forest", "swamp", "mountain", "cave"]) {
  levels[biome] = biomeLevelCap(1, biome);
  cleared.push(bossClearKey(biome, 1));
}
for (const { biome } of SPIRIT_T2_ZONES) {
  levels[biome] = spiritT2FarmLevel(biome);
  cleared.push(bossClearKey(biome, 2));
}
const config = route.steps.find((step) => step.type === "classConfig");
assert(config && config.type === "classConfig");
for (const { biome } of SPIRIT_T3_ZONES) {
  levels[biome] = spiritT3FarmLevel(biome);
  cleared.push(bossClearKey(biome, 3));
  const ctx = classConfigContext("energy", {
    biomeLevel: levels, bossesCleared: cleared,
    disciplineId: SPIRIT_T2_DISCIPLINE, specializationId: SPIRIT_T3_SPECIALIZATION,
  }, globalMastery(levels));
  const checked = validateClassConfig(config.config, ctx);
  assert(checked.ok, checked.ok ? "" : `${biome}: ${checked.reasons.join("; ")}`);
  assert.equal(resolveClassConfig(checked.config, ctx).mode, "auto");
}

const ids = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(ids).size, ids.length);
assert(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)));
assert(ids.includes("tier-3") && ids.includes("volcanic-t3-boss") && ids.includes("desert-t2-boss"));

console.log("spiritT3: ok");
