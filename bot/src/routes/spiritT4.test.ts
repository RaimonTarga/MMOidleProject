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
import { spiritRouteId, SPIRIT_T2_DISCIPLINE, SPIRIT_T2_ZONES, spiritT2FarmLevel, spiritT2Route } from "./spiritT2";
import { SPIRIT_T3_SPECIALIZATION, SPIRIT_T3_SPECIALIZATIONS, SPIRIT_T3_ZONES, spiritT3FarmLevel, spiritT3Route } from "./spiritT3";
import {
  SPIRIT_T4_GEAR,
  SPIRIT_T4_ID,
  SPIRIT_T4_LEAF,
  SPIRIT_T4_LEAVES,
  SPIRIT_T4_ZONES,
  spiritT4FarmLevel,
  spiritT4LessonLevel,
  spiritT4Route,
} from "./spiritT4";

function gates(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return condition.of.flatMap(gates);
  if (condition.type === "not") return gates(condition.of);
  return [condition];
}

/** The deepest level the guide's Tier-4 farms ask of a biome. */
function tutorialT4Level(biome: string): number {
  return Math.max(...tutorialScriptFor(SPIRIT_CLASS_ROOT).beats.flatMap((beat) =>
    beat.steps.flatMap((step) => step.type === "farm" && step.at.kind === "biome" && step.at.tier === 4
      ? gates(step.until).flatMap((gate) =>
        gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biome ? [gate.level] : [])
      : [])));
}

const route = spiritT4Route();
const t3 = spiritT3Route();
assert.equal(route.id, "spirit-t4");
assert.equal(route.classRoot, "energy-root");
assert.deepEqual(ROUTES.get(SPIRIT_T4_ID), route, "spirit-t4 is registered");
assert.equal(requireRoute(SPIRIT_T4_ID), ROUTES.get(SPIRIT_T4_ID));
assert.equal(isControlledRouteId(SPIRIT_T4_ID), false, "a one-off route until a live run clears it");
assert.throws(() => requireRoute(SPIRIT_T4_ID, "cadence"), /authored for energy-root/);

// It continues the T3 route unchanged, waits for tier 4, then picks a leaf under the discipline.
assert.deepEqual(route.steps.slice(0, t3.steps.length), t3.steps, "the T3 route comes first");
const wait = route.steps[t3.steps.length];
assert(wait.type === "farm" && wait.until.type === "playerTierAtLeast" && wait.until.tier === 4, "waits for the tier-4 promotion");
const pick = route.steps[t3.steps.length + 1];
assert(pick.type === "unlockSkill" && pick.skillId === SPIRIT_T4_LEAF);
const node = SKILL_TREE.get(SPIRIT_T4_LEAF);
assert(node && node.classId === SPIRIT_CLASS_ROOT && node.disciplineId === SPIRIT_T2_DISCIPLINE, "the pick is a leaf of the route's discipline");

// Each T4 zone: travel, farm to the guide's level, then its T4 boss.
const t4 = route.steps.slice(t3.steps.length + 2).filter((step) => step.type !== "ifPossible");
assert.equal(t4.length, SPIRIT_T4_ZONES.length * 3);
for (const [index, { biome, pieceId }] of SPIRIT_T4_ZONES.entries()) {
  const [travel, farm, boss] = t4.slice(index * 3, index * 3 + 3);
  assert(travel.type === "travel" && travel.to.kind === "biome" && travel.to.biomeGroup === biome && travel.to.tier === 4);
  const level = spiritT4FarmLevel(biome);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.tier === 4);
  assert.deepEqual(farm.until, { type: "biomeLevelAtLeast", biomeGroup: biome, level });
  assert.equal(level, biomeLevelCap(4, biome));
  assert.equal(level, tutorialT4Level(biome), `${biome}: bot and guide finish at the same level`);
  assert(spiritT4LessonLevel(biome, pieceId) <= level, `${biome}: the lesson lands before the cap`);
  assert.deepEqual(boss, { type: "attemptBoss", biomeGroup: biome, tier: 4 });
}


// Gear: each zone's pieces (from SPIRIT_T4_GEAR) are crafted there and worn, only while the character is still T4;
// the first zone hands over a full set of this tier: the class weapon, an armor, a charm and boots.
const gearBlocks4 = route.steps.slice(t3.steps.length + 2).filter((step): step is Extract<RouteStep, { type: "ifPossible" }> => step.type === "ifPossible");
const worn4: string[] = [];
for (const block of gearBlocks4) {
  assert.deepEqual(block.when, { type: "not", of: { type: "playerTierAtLeast", tier: 5 } });
  for (let i = 0; i < block.steps.length; i += 2) {
    const [craft, equip] = [block.steps[i], block.steps[i + 1]];
    assert(craft.type === "craft" && craft.farmAt?.kind === "biome" && craft.farmAt.tier === 4);
    assert(equip.type === "equip" && equip.definitionIds[0] === craft.recipeIds[0]);
    const recipe = RECIPE_DATABASE.get(craft.recipeIds[0]);
    assert(recipe && recipe.recipeGroup === craft.farmAt.biomeGroup && recipe.tier === 4, craft.recipeIds[0] + " is a T4 recipe of its zone");
    worn4.push(recipe.id);
  }
}
assert.deepEqual(worn4, SPIRIT_T4_ZONES.flatMap(({ biome }) => [...(SPIRIT_T4_GEAR[biome] ?? [])]));
const firstSet4 = (SPIRIT_T4_GEAR[SPIRIT_T4_ZONES[0].biome] ?? []).map((id) => RECIPE_DATABASE.get(id)?.slot).sort();
assert.deepEqual(firstSet4, ["armor", "mobility", "recovery", "weapon"], "the first T4 boss is met in a full set of the tier");

// The auto config stays valid through the leaf and every T4 lesson and rank-up.
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
for (const { biome } of SPIRIT_T3_ZONES) {
  levels[biome] = spiritT3FarmLevel(biome);
  cleared.push(bossClearKey(biome, 3));
}
const config = route.steps.find((step) => step.type === "classConfig");
assert(config && config.type === "classConfig");
for (const { biome } of SPIRIT_T4_ZONES) {
  levels[biome] = spiritT4FarmLevel(biome);
  cleared.push(bossClearKey(biome, 4));
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
assert(ids.includes("tier-4") && ids.includes("trench-t4-boss") && ids.includes("volcanic-t3-boss"));
assert(SPIRIT_KIT.leaves.some((entry) => entry.id === SPIRIT_T4_LEAF));

// The other two disciplines' chains (OV2): the same steps, with the discipline's own picks at T2, T3 and T4.
for (const discipline of ["spirit-overflow", "spirit-reservoir"]) {
  const chain = [spiritT2Route(discipline), spiritT3Route(discipline), spiritT4Route(discipline)];
  assert.deepEqual(chain.map((entry) => entry.id), [2, 3, 4].map((tier) => spiritRouteId(tier as 2 | 3 | 4, discipline)));
  for (const entry of chain) {
    assert.deepEqual(ROUTES.get(entry.id), entry, `${entry.id} is registered`);
    assert.equal(isControlledRouteId(entry.id), false);
  }
  const [two, three, four] = chain;
  assert.deepEqual(four.steps.slice(0, three.steps.length), three.steps, `${four.id}: the T3 route comes first`);
  assert.deepEqual(three.steps.slice(0, two.steps.length), two.steps, `${three.id}: the T2 route comes first`);
  assert.equal(four.steps.length, route.steps.length, `${four.id}: the Tide chain's steps, other picks`);
  const picks = four.steps.filter((step) => step.type === "unlockSkill").map((step) => step.type === "unlockSkill" ? step.skillId : "");
  const own = [discipline, SPIRIT_T3_SPECIALIZATIONS[discipline], SPIRIT_T4_LEAVES[discipline]];
  assert.deepEqual(picks.slice(-3), own, `${four.id}: discipline, specialization, leaf`);
  for (const id of own.slice(1)) assert.equal(SKILL_TREE.get(id)?.disciplineId, discipline, `${id} is under ${discipline}`);
}

console.log("spiritT4: ok");
