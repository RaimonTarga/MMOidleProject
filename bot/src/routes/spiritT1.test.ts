import assert from "node:assert/strict";
import {
  biomeLevelCap,
  bossClearKey,
  classConfigContext,
  globalMastery,
  resolveClassConfig,
  SKILL_TREE,
  SPIRIT_KIT,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  validateClassConfig,
  type T1Biome,
  type TutorialCondition,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { isClassAgnosticRouteId, isControlledRouteId, requireRoute, ROUTES } from "./index";
import { SPIRIT_CLASS_ROOT, SPIRIT_T1_ID, spiritFarmLevel, spiritT1Route } from "./spiritT1";

function gates(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return condition.of.flatMap(gates);
  if (condition.type === "not") return gates(condition.of);
  return [condition];
}

function tutorialLevel(biome: T1Biome): number {
  return Math.max(...tutorialScriptFor(SPIRIT_CLASS_ROOT).beats.flatMap((beat) =>
    beat.steps.flatMap((step) => step.type === "farm" ? gates(step.until).flatMap((gate) =>
      gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biome ? [gate.level] : []) : [])));
}

const route = spiritT1Route();
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;
const walks = T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL);
const zoneOrder = [FIRST_SEAL, ...walks, SECOND_SEAL];
assert.equal(route.id, "spirit-t1");
assert.equal(route.version, "1.0.0");
assert.equal(route.classRoot, "energy-root");
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0);
assert.deepEqual(ROUTES.get(SPIRIT_T1_ID), route, "spirit-t1 is registered");
assert.equal(requireRoute(SPIRIT_T1_ID), ROUTES.get(SPIRIT_T1_ID));
assert.deepEqual(requireRoute(SPIRIT_T1_ID, "energy"), route);
assert.deepEqual(requireRoute(SPIRIT_T1_ID, SPIRIT_CLASS_ROOT), route);
assert.equal(isClassAgnosticRouteId(SPIRIT_T1_ID), false);
assert.equal(isControlledRouteId(SPIRIT_T1_ID), true, "Spirit is admitted to controlled batches");
assert.throws(() => requireRoute(SPIRIT_T1_ID, "cadence"), /authored for energy-root/);

assert.deepEqual(route.steps.map((step) => step.type), [
  "travel", "farm", "chooseClass", "classConfig",
  "travel", "farm", "attemptBoss",
  ...walks.flatMap(() => ["travel", "farm"]),
  "travel", "farm", "attemptBoss", "farm",
]);
const [travel, quest, choose, config] = route.steps;
assert(travel.type === "travel" && travel.to.kind === "node");
assert(quest.type === "farm" && quest.until.type === "playerTierAtLeast" && quest.until.tier === 1,
  "the tier-0 quest precedes the class pick");
assert(choose.type === "chooseClass" && choose.skillId === SPIRIT_CLASS_ROOT);
assert(config.type === "classConfig" && config.config.mode === "auto");
const saved = config.config;

// Check the authored config with the executor's real validator, first without
// lessons or a trophy, then as the route learns each zone and earns its seals.
const levels: Record<string, number> = {};
const cleared: string[] = [];
function resolved() {
  const ctx = classConfigContext("energy", {
    biomeLevel: levels, bossesCleared: cleared, disciplineId: null,
  }, globalMastery(levels));
  const checked = validateClassConfig(saved, ctx);
  assert(checked.ok, checked.ok ? "" : checked.reasons.join("; "));
  const current = resolveClassConfig(checked.config, ctx);
  assert.equal(current.mode, "auto");
  assert(current.system.kind === "thresholds");
  assert.equal(current.system.floorPct, 30);
  assert.equal(current.system.phase, "gather");
  return { ...current, system: current.system };
}
const fresh = resolved();
assert.deepEqual(fresh.relic, [], "the first boss starts without a trophy");
assert.deepEqual(fresh.system.bands, [{ pieceId: "spirit-bolt", atLeastPct: 30 }], "only Bolt is owned at the pick");

const farms = route.steps.filter((step): step is Extract<RouteStep, { type: "farm" }> =>
  step.type === "farm" && step.at.kind === "biome");
assert.equal(farms.length, zoneOrder.length + 1, "five zones and the promotion wait");
for (const [index, biome] of zoneOrder.entries()) {
  const farm = farms[index];
  const level = spiritFarmLevel(biome);
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biome && farm.at.tier === 1);
  assert.deepEqual(farm.until, { type: "biomeLevelAtLeast", biomeGroup: biome, level });
  assert.equal(level, tutorialLevel(biome), `${biome}: bot and guide finish at the same level`);
  assert.equal(level, biome === SECOND_SEAL ? 2 : biomeLevelCap(1, biome));
  levels[biome] = level;
  const lesson = SPIRIT_KIT.lessons.find((entry) =>
    entry.rank === 1 && entry.source.kind === "zone" && entry.source.tier === 1 && entry.source.biome === biome);
  assert(lesson && lesson.source.kind === "zone" && lesson.source.level === 2);
  const current = resolved();
  const band = current.system.bands.find((entry) => entry.pieceId === lesson.pieceId);
  assert(band, `${biome}: auto fields the newly learned piece`);
  if (biome === "plains" || biome === "cave") assert(band.atLeastPct > current.system.floorPct, "big strikes sit above the floor");
  if (biome === "mountain") assert.equal(band.atLeastPct, current.system.floorPct, "Eye sits at the floor");
  if (biome === FIRST_SEAL || biome === SECOND_SEAL) {
    cleared.push(bossClearKey(biome, 1));
    assert.deepEqual(resolved().relic, [`spirit-relic-${biome}`], "auto equips the newest seal trophy");
  }
}
assert.deepEqual(farms.at(-1)?.until, { type: "playerTierAtLeast", tier: 2 });
assert.deepEqual(route.steps.filter((step) => step.type === "attemptBoss"), [
  { type: "attemptBoss", biomeGroup: FIRST_SEAL, tier: 1 },
  { type: "attemptBoss", biomeGroup: SECOND_SEAL, tier: 1 },
]);
assert.deepEqual(route.completion, { type: "allOf", of: [
  { type: "bossCleared", biomeGroup: FIRST_SEAL, tier: 1 },
  { type: "bossCleared", biomeGroup: SECOND_SEAL, tier: 1 },
  { type: "playerTierAtLeast", tier: 2 },
] });

const ids = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(ids).size, ids.length);
assert(ids.every((id) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)));
for (const biome of zoneOrder) {
  assert(route.milestones.some((milestone) => milestone.id === `${biome}-lesson` &&
    milestone.when.type === "biomeLevelAtLeast" && milestone.when.biomeGroup === biome && milestone.when.level === 2));
}
assert(ids.includes("plains-seal") && ids.includes("mountain-seal") && ids.includes("tier-2"));

console.log("spiritT1: ok");
