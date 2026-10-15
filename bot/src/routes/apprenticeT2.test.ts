import assert from "node:assert/strict";
import {
  absoluteZoneLevel,
  APPRENTICE_KIT,
  biomeLevelCap,
  bossClearKey,
  classConfigContextFromState,
  CLEARING_NODE_ID,
  emptyEquipment,
  globalMastery,
  resolveBeatIndex,
  resolveClassConfig,
  tutorialScriptFor,
  validateClassConfig,
  type TutorialCondition,
  type TutorialView,
} from "@mmo-idle/shared";
import type { RouteStep } from "../route/types";
import { isClassAgnosticRouteId, requireRoute, ROUTES } from "./index";
import { APPRENTICE_CLASS_ROOT, apprenticeT1Route } from "./apprenticeT1";
import { APPRENTICE_T2_ID, APPRENTICE_T2_ZONES, apprenticeT2Payoffs, apprenticeT2Route } from "./apprenticeT2";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const t1 = apprenticeT1Route();
const route = apprenticeT2Route();
const script = tutorialScriptFor(APPRENTICE_CLASS_ROOT);

assert.equal(route.id, "apprentice-t2");
assert(KEBAB.test(route.id));
assert.equal(route.classRoot, "dot-root");
assert(route.description.length > 0);
assert.deepEqual(ROUTES.get(APPRENTICE_T2_ID), route, "the T2 route is registered");
assert.deepEqual(requireRoute(APPRENTICE_T2_ID, "dot"), route);
assert.equal(isClassAgnosticRouteId(APPRENTICE_T2_ID), false);
assert.throws(() => requireRoute(APPRENTICE_T2_ID, "cadence"), /authored for dot-root/);

// It is the T1 route, unchanged, then the T2 work.
assert.deepEqual(route.steps.slice(0, t1.steps.length), t1.steps, "T1 first, step for step");
const t2Steps = route.steps.slice(t1.steps.length);
const farms = t2Steps.filter((step): step is Extract<RouteStep, { type: "farm" }> => step.type === "farm");
assert.equal(farms.length, APPRENTICE_T2_ZONES.length, "one farm per T2 zone");

// The same tutorial: every T2 zone is farmed at tier 2 to the level the guide farms to.
function gates(condition: TutorialCondition): TutorialCondition[] {
  if (condition.type === "allOf" || condition.type === "anyOf") return [condition, ...condition.of.flatMap(gates)];
  if (condition.type === "not") return [condition, ...gates(condition.of)];
  return [condition];
}
for (const [index, { biomeGroup, lesson }] of APPRENTICE_T2_ZONES.entries()) {
  const farm = farms[index];
  assert(farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 2, `${biomeGroup}: the T2 node`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.biomeGroup === biomeGroup);
  assert.equal(farm.until.level, biomeLevelCap(2, biomeGroup));
  const guideLevels = script.beats.flatMap((beat) => beat.steps.flatMap((step) =>
    step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 2 ? [] : gates(step.until).flatMap((gate) =>
      gate.type === "biomeLevelAtLeast" && gate.biomeGroup === biomeGroup ? [gate.level] : [])));
  assert.equal(farm.until.level, Math.max(...guideLevels), `${biomeGroup}: matches the guide's terminal level`);

  // The lesson is one the kit teaches in this zone, below the level the route farms to.
  const rank = lesson.endsWith("-2") ? 2 : 1;
  const pieceId = lesson.replace(/-2$/, "");
  const entry = APPRENTICE_KIT.lessons.find((l) => l.pieceId === pieceId && l.rank === rank);
  assert(entry?.source.kind === "zone" && entry.source.biome === biomeGroup && entry.source.tier === 2, `${lesson}: a ${biomeGroup} tier-2 lesson`);
  assert(absoluteZoneLevel(entry.source) <= farm.until.level, `${lesson}: learned before the zone is capped`);
}
const bossIndex = t2Steps.findIndex((step) => step.type === "attemptBoss");
assert(t2Steps.slice(0, bossIndex).filter((step) => step.type === "farm").length === APPRENTICE_T2_ZONES.length, "all farms before the bosses");
assert.deepEqual(
  t2Steps.filter((step) => step.type === "attemptBoss").map((step) => [step.biomeGroup, step.tier]),
  APPRENTICE_T2_ZONES.map(({ biomeGroup }) => [biomeGroup, 2]),
  "the seven T2 bosses, in the guide's order",
);

// The rules step comes after the lessons and before the first T2 boss, and the server accepts it.
const configIndex = t2Steps.findIndex((step) => step.type === "classConfig");
assert(configIndex > 0 && configIndex < bossIndex, "Payoff rules are set once every lesson is learned, before the bosses");
const levels: Record<string, number> = { clearing: 4 };
for (const { biomeGroup } of APPRENTICE_T2_ZONES) levels[biomeGroup] = biomeLevelCap(2, biomeGroup);
const ctx = classConfigContextFromState({ combatArchetype: "dot", biomeLevel: levels, bossesCleared: ["plains:1", "mountain:1"], disciplineId: null });
assert(ctx);
const checked = validateClassConfig(apprenticeT2Payoffs(), ctx);
assert(checked.ok, `the T2 Payoff rules validate (${checked.ok ? "" : checked.reasons.join("; ")})`);
const resolved = resolveClassConfig(checked.config, ctx);
assert(resolved.system.kind === "payoffs");
const placed = new Set(resolved.system.placements.map((placement) => placement.pieceId));
for (const piece of ["apprentice-blast-back", "apprentice-sear", "apprentice-seep", "apprentice-snag", "apprentice-recoil"]) {
  assert(placed.has(piece), `${piece} is placed`);
}

assert.deepEqual(route.completion, {
  type: "allOf",
  of: [
    t1.completion,
    ...APPRENTICE_T2_ZONES.map(({ biomeGroup }) => ({ type: "bossCleared", biomeGroup, tier: 2 })),
  ],
});
const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length);
assert(milestoneIds.every((id) => KEBAB.test(id)));
for (const { biomeGroup } of APPRENTICE_T2_ZONES) assert(milestoneIds.includes(`${biomeGroup}-t2-boss`));

// The T2 guide: the discipline line, then each zone's lesson and boss, after the farewell.
const tail = { ...script, beats: script.beats.slice(script.beats.findIndex((beat) => beat.id === "farewell")) };
for (const beat of tail.beats) {
  for (const line of [beat.say, beat.waiting]) {
    if (line !== undefined) assert(line.length > 0 && line.length < 170, `${beat.id}: short line (${line.length})`);
  }
  assert(KEBAB.test(beat.id), `${beat.id}: kebab-case`);
}
assert.equal(new Set(script.beats.map((beat) => beat.id)).size, script.beats.length, "ids are unique");

const state: TutorialView = {
  nodeId: CLEARING_NODE_ID, hp: 100, maxHp: 100, isDead: false,
  playerTier: 1, selectedClass: APPRENTICE_CLASS_ROOT,
  biomeLevel: {}, globalMastery: 0, unlockedRecipes: [],
  essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
  inventory: [], equipment: emptyEquipment(), itemUpgrades: {},
  questProgress: {}, bossesCleared: [bossClearKey("plains", 1), bossClearKey("mountain", 1)], clearedNodes: [],
};
function current(): string {
  state.globalMastery = globalMastery(state.biomeLevel);
  return tail.beats[resolveBeatIndex(tail, state)]?.id ?? "done";
}
// Everything from T1 is done; the guide waits on the promotion.
state.biomeLevel = { clearing: 4, plains: 6, forest: 6, swamp: 6, mountain: 2, cave: 6 };
assert.equal(current(), "farewell");
state.playerTier = 2;
assert.equal(current(), "apprentice-t2-plains");
assert.match(tail.beats[resolveBeatIndex(tail, state)].say, /pick a school/i);
for (const { biomeGroup, lesson } of APPRENTICE_T2_ZONES) {
  const rank = lesson.endsWith("-2") ? 2 : 1;
  const entry = APPRENTICE_KIT.lessons.find((l) => l.pieceId === lesson.replace(/-2$/, "") && l.rank === rank);
  assert(entry?.source.kind === "zone");
  assert.equal(current(), `apprentice-t2-${biomeGroup}`, `${biomeGroup}: the farm to the lesson`);
  state.biomeLevel[biomeGroup] = absoluteZoneLevel(entry.source);
  assert.equal(current(), `${lesson}-lesson`, `${biomeGroup}: the lesson line at the real unlock`);
  state.biomeLevel[biomeGroup] = biomeLevelCap(2, biomeGroup);
  assert.equal(current(), `apprentice-boss-${biomeGroup}-2`, `${biomeGroup}: the boss line`);
  state.bossesCleared.push(bossClearKey(biomeGroup, 2));
}
assert.equal(current(), "done", "the guide is finished after the Desert boss");

console.log("apprenticeT2: ok");
