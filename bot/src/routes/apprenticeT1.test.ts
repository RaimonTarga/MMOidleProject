import assert from "node:assert/strict";
import {
  APPRENTICE_KIT,
  biomeLevelCap,
  bossClearKey,
  buildSealRouteBeats,
  classConfigContextFromState,
  CLEARING_NODE_ID,
  emptyEquipment,
  globalMastery,
  resolveBeatIndex,
  resolveClassConfig,
  SKILL_TREE,
  T1_BIOME_ORDER,
  TUTORIAL_CLASS_BEATS,
  TUTORIAL_OPENING,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  validateClassConfig,
  type ClassConfig,
  type TutorialCondition,
  type TutorialView,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { isClassAgnosticRouteId, isControlledRouteId, requireRoute, ROUTES } from "./index";
import { APPRENTICE_CLASS_ROOT, APPRENTICE_T1_ID, apprenticeT1Route } from "./apprenticeT1";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;
const WALKS = T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL);
const ZONE_ORDER = [FIRST_SEAL, ...WALKS, SECOND_SEAL];
const route = apprenticeT1Route();
const script = tutorialScriptFor(APPRENTICE_CLASS_ROOT);

assert.equal(route.id, "apprentice-t1");
assert(KEBAB.test(route.id));
assert.equal(route.version, "1.0.0");
assert.equal(route.classRoot, "dot-root");
assert.equal(SKILL_TREE.get(route.classRoot)?.tier, 0);
assert(route.description.length > 0);
assert.deepEqual(ROUTES.get(APPRENTICE_T1_ID), route, "the Apprentice route is registered");
assert.equal(requireRoute(APPRENTICE_T1_ID), ROUTES.get(APPRENTICE_T1_ID));
assert.deepEqual(requireRoute(APPRENTICE_T1_ID, "dot"), route);
assert.deepEqual(requireRoute(APPRENTICE_T1_ID, APPRENTICE_CLASS_ROOT), route);
assert(isControlledRouteId(APPRENTICE_T1_ID), "controlled batches admit apprentice-t1");
assert.equal(isClassAgnosticRouteId(APPRENTICE_T1_ID), false);
assert.throws(() => requireRoute(APPRENTICE_T1_ID, "cadence"), /authored for dot-root/);

// The quest grants the class point before the route configures auto Payoff rules.
const [travel, quest, choose, configure] = route.steps;
assert(travel.type === "travel" && travel.to.kind === "node" && travel.to.nodeId === CLEARING_NODE_ID);
assert(quest.type === "farm" && quest.at.kind === "node" && quest.at.nodeId === CLEARING_NODE_ID);
assert.deepEqual(quest.until, { type: "playerTierAtLeast", tier: 1 });
assert(choose.type === "chooseClass" && choose.skillId === APPRENTICE_CLASS_ROOT);
assert(configure.type === "classConfig");
assert.equal(configure.config.mode, "auto");
assert.equal(configure.config.system.kind, "payoffs");
assert.deepEqual(configure.config.relic, [], "the first boss is approached without a trophy");

function resolved(biomeLevel: Record<string, number>, bossesCleared: string[] = []): ClassConfig {
  const context = classConfigContextFromState({ combatArchetype: "dot", biomeLevel, bossesCleared });
  assert(context);
  const checked = validateClassConfig(configure.type === "classConfig" ? configure.config : null, context);
  assert(checked.ok, "the auto payload validates against the pieces actually owned");
  return resolveClassConfig(checked.config, context);
}

const starter = resolved({ clearing: 4 });
assert.equal(starter.system.kind, "payoffs");
if (starter.system.kind !== "payoffs") throw new Error("expected Payoff rules");
assert.deepEqual(starter.system.placements, [
  { moment: "target-full", pieceId: "apprentice-detonate", conditions: [] },
], "a fresh Apprentice has full -> Detonate, with no unlearned payoffs");
assert.deepEqual(starter.relic, []);

const plainsDefault = resolved({ clearing: 4, plains: 2 });
assert(plainsDefault.system.kind === "payoffs");
assert.deepEqual(plainsDefault.system.placements, [
  { moment: "target-full", pieceId: "apprentice-spread", conditions: [{ id: "enemies-near", param: 2 }] },
  { moment: "target-full", pieceId: "apprentice-detonate", conditions: [] },
], "the same auto payload gains Spread before Detonate when the Plains lesson arrives");

const learnedDefault = resolved({ clearing: 4, plains: 6, forest: 6, swamp: 6, cave: 6, mountain: 2 }, ["plains:1"]);
assert(learnedDefault.system.kind === "payoffs");
assert.deepEqual(learnedDefault.system.placements.slice(2), [
  { moment: "enemy-winds-up", pieceId: "apprentice-seize", conditions: [] },
  { moment: "hp-low", pieceId: "apprentice-siphon", conditions: [] },
], "auto gains Seize and Siphon on the bible's moments");
assert.deepEqual(learnedDefault.relic, ["apprentice-relic-plains"], "Outbreak follows the first boss, never precedes it");

// Both the route and the guide farm the same zones, to the same levels.
function gates(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}

const farms = route.steps.filter((step): step is Extract<RouteStep, { type: "farm" }> =>
  step.type === "farm" && step.at.kind === "biome");
assert.equal(farms.length, ZONE_ORDER.length + 1, "each zone, then the tier-2 wait");
for (const [index, biomeGroup] of ZONE_ORDER.entries()) {
  const farm = farms[index];
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 1);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup);
  const guideLevels = script.beats.flatMap((beat) => beat.steps.flatMap((step) =>
    step.type !== "farm" ? [] : gates(step.until).flatMap((gate) =>
      gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup ? [gate.level] : [])));
  assert.equal(farm.until.level, Math.max(...guideLevels), `${biomeGroup}: matches the guide's terminal level`);
  assert.equal(farm.until.level, biomeGroup === SECOND_SEAL ? 2 : biomeLevelCap(1, biomeGroup));
}
const tierWait = farms[farms.length - 1];
assert.deepEqual(tierWait.until, { type: "playerTierAtLeast", tier: 2 });
assert(tierWait.at.kind === "biome" && tierWait.at.biomeGroup === SECOND_SEAL);

const bosses = route.steps.filter((step) => step.type === "attemptBoss");
assert.deepEqual(bosses.map((step) => [step.biomeGroup, step.tier]), [[FIRST_SEAL, 1], [SECOND_SEAL, 1]]);
const plainsBossIndex = route.steps.indexOf(bosses[0]);
const forestIndex = route.steps.indexOf(farms[1]);
assert(plainsBossIndex < forestIndex, "the first seal is fought with the base kit, before the Forest lessons");
assert.deepEqual(route.completion, {
  type: "allOf",
  of: [
    { type: "bossCleared", biomeGroup: FIRST_SEAL, tier: 1 },
    { type: "bossCleared", biomeGroup: SECOND_SEAL, tier: 1 },
    { type: "playerTierAtLeast", tier: 2 },
  ],
});
const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length);
assert(milestoneIds.every((id) => KEBAB.test(id)));
for (const biomeGroup of ZONE_ORDER) {
  assert.deepEqual(route.milestones.find((milestone) => milestone.id === `${biomeGroup}-lesson`)?.when,
    { type: "biomeLevelAtLeast", biomeGroup, level: 2 });
}
for (const biomeGroup of TUTORIAL_SEALS) {
  assert.deepEqual(route.milestones.find((milestone) => milestone.id === `${biomeGroup}-seal`)?.when,
    { type: "bossCleared", biomeGroup, tier: 1 });
}
assert(milestoneIds.includes("tier-1-reached") && milestoneIds.includes("class-chosen") && milestoneIds.includes("tier-2"));

// The registered guide preserves the opening, seal order and farewell.
assert(TUTORIAL_CLASS_BEATS[APPRENTICE_CLASS_ROOT]);
assert.equal(script.id, "tutorial-apprentice");
TUTORIAL_OPENING.beats.forEach((beat, index) => assert.equal(script.beats[index], beat));
const tail = { ...script, beats: script.beats.slice(TUTORIAL_OPENING.beats.length) };
const seal = buildSealRouteBeats();
const sealIds = new Set(seal.map((beat) => beat.id));
assert.deepEqual(tail.beats.filter((beat) => sealIds.has(beat.id)).map((beat) => beat.id), seal.map((beat) => beat.id));
assert.deepEqual(tail.beats[tail.beats.length - 1], seal[seal.length - 1]);
assert.equal(new Set(script.beats.map((beat) => beat.id)).size, script.beats.length);
for (const beat of tail.beats) {
  for (const line of [beat.say, beat.waiting]) {
    if (line !== undefined) assert(line.length > 0 && line.length < 170, `${beat.id}: short line (${line.length})`);
  }
  if (!sealIds.has(beat.id)) assert(KEBAB.test(beat.id), `${beat.id}: new ids are kebab-case`);
}
assert.match(tail.beats[0].say, /plain wand/);
assert.match(tail.beats[0].say, /Sigils 4.*pips on enemies/);
assert.match(tail.beats[0].say, /full means Detonate/);
assert.match(tail.beats.find((beat) => beat.id === "zone:forest")?.say ?? "", /base kit.*Outbreak/);

const state: TutorialView = {
  nodeId: CLEARING_NODE_ID, hp: 100, maxHp: 100, isDead: false,
  playerTier: 1, selectedClass: APPRENTICE_CLASS_ROOT,
  biomeLevel: {}, globalMastery: 0, unlockedRecipes: [],
  essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
  inventory: [], equipment: emptyEquipment(), itemUpgrades: {},
  questProgress: {}, bossesCleared: [], clearedNodes: [],
};
function current(): string {
  state.globalMastery = globalMastery(state.biomeLevel);
  return tail.beats[resolveBeatIndex(tail, state)]?.id ?? "done";
}

assert.equal(current(), "open:plains");
for (const biomeGroup of [FIRST_SEAL, ...WALKS]) {
  const lesson = APPRENTICE_KIT.lessons.find((entry) =>
    entry.source.kind === "zone" && entry.source.tier === 1 && entry.source.biome === biomeGroup);
  assert(lesson?.source.kind === "zone");
  state.biomeLevel[biomeGroup] = lesson.source.level;
  assert.equal(current(), `${lesson.pieceId}-lesson`, `${biomeGroup}: the payoff line appears at its real unlock`);
  state.biomeLevel[biomeGroup] = biomeLevelCap(1, biomeGroup);
  if (biomeGroup === FIRST_SEAL) {
    assert.equal(current(), `boss:${FIRST_SEAL}`, "no trophy line before the first boss dies");
    state.bossesCleared.push(bossClearKey(FIRST_SEAL, 1));
  }
}
assert.equal(current(), "apprentice-mountain-approach");
state.biomeLevel[SECOND_SEAL] = 2;
assert.equal(current(), `boss:${SECOND_SEAL}`);
assert.match(tail.beats[resolveBeatIndex(tail, state)].say, /Seize.*wind-up/);
state.bossesCleared.push(bossClearKey(SECOND_SEAL, 1));
assert.equal(current(), "farewell", "both seals still wait on the tier-2 promotion");
state.playerTier = 2;
assert.equal(current(), "done");
delete state.biomeLevel[SECOND_SEAL];
assert.equal(current(), "done", "an existing Mountain seal does not replay the approach on resume");

console.log("apprenticeT1: ok");
