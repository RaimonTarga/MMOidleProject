import assert from "node:assert/strict";
import {
  absoluteZoneLevel,
  APPRENTICE_KIT,
  biomeLevelCap,
  bossClearKey,
  canUnlockSkill,
  classConfigContextFromState,
  CLEARING_NODE_ID,
  emptyEquipment,
  globalMastery,
  resolveBeatIndex,
  resolveClassConfig,
  SKILL_TREE,
  tutorialScriptWithoutGear,
  validateClassConfig,
  type TutorialView,
} from "@mmo-idle/shared";
import { isClassAgnosticRouteId, isControlledRouteId, requireRoute, ROUTES } from "./index";
import { APPRENTICE_CLASS_ROOT } from "./apprenticeT1";
import { apprenticeT2Route } from "./apprenticeT2";
import {
  APPRENTICE_T3_DISCIPLINE,
  APPRENTICE_T3_ID,
  APPRENTICE_T3_SPECIALIZATION,
  APPRENTICE_T3_ZONES,
  apprenticeT3Payoffs,
  apprenticeT3Route,
} from "./apprenticeT3";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const route = apprenticeT3Route();
const t2 = apprenticeT2Route(APPRENTICE_T3_DISCIPLINE);
const script = tutorialScriptWithoutGear(APPRENTICE_CLASS_ROOT);

assert.equal(route.id, "apprentice-t3");
assert(KEBAB.test(route.id));
assert.equal(route.classRoot, "dot-root");
assert.deepEqual(ROUTES.get(APPRENTICE_T3_ID), route, "the T3 route is registered");
assert.deepEqual(requireRoute(APPRENTICE_T3_ID, "dot"), route);
assert.equal(isClassAgnosticRouteId(APPRENTICE_T3_ID), false);
assert.equal(isControlledRouteId(APPRENTICE_T3_ID), false, "not controlled until it has run live");

// The T2 route first (with the school picked), step for step.
assert.deepEqual(route.steps.slice(0, t2.steps.length), t2.steps);
assert(t2.steps.some((step) => step.type === "unlockSkill" && step.skillId === APPRENTICE_T3_DISCIPLINE), "the school is picked");
const tail = route.steps.slice(t2.steps.length);

// The promotion wait, then the specialization pick under the picked school.
const [wait, pick, marker] = tail;
assert(wait.type === "farm" && wait.until.type === "playerTierAtLeast" && wait.until.tier === 3, "wait for tier 3");
assert(pick.type === "unlockSkill" && pick.skillId === APPRENTICE_T3_SPECIALIZATION, "then the specialization pick");
assert(marker.type === "milestone");
const node = SKILL_TREE.get(APPRENTICE_T3_SPECIALIZATION);
assert.equal(node?.classId, APPRENTICE_CLASS_ROOT);
assert.equal(node?.disciplineId, APPRENTICE_T3_DISCIPLINE, "the specialization sits under the picked school");
assert.equal(node?.tier, 2);

// The Passive Tree lists the Apprentice's real specializations under each school, and only the picked school's opens.
const specsOf = (disciplineId: string) => [...SKILL_TREE.values()].filter((entry) => entry.tier === 2 && entry.classId === APPRENTICE_CLASS_ROOT && entry.disciplineId === disciplineId);
for (const entry of APPRENTICE_KIT.disciplines) {
  assert.deepEqual(specsOf(entry.id).map((spec) => spec.id).sort(), APPRENTICE_KIT.specializations.filter((spec) => spec.disciplineId === entry.id).map((spec) => spec.id).sort(), `${entry.id}: its three specializations`);
}
const asPlayer = (disciplineId: string | null) => ({
  usesSkills: { unlockedSkills: [APPRENTICE_CLASS_ROOT], selectedClass: APPRENTICE_CLASS_ROOT, disciplineId },
  tracksProgression: { skillPoints: 1, currentSkillTier: 2 },
});
assert(canUnlockSkill(asPlayer(APPRENTICE_T3_DISCIPLINE), APPRENTICE_T3_SPECIALIZATION).ok, "the pick opens under the picked school");
assert(!canUnlockSkill(asPlayer("apprentice-poison"), APPRENTICE_T3_SPECIALIZATION).ok, "and not under another school");

// The seven T3 zones: travel and farm to the cap, the rules, then the bosses.
const zoneSteps = tail.slice(3);
const farms = zoneSteps.filter((step) => step.type === "farm");
assert.equal(farms.length, APPRENTICE_T3_ZONES.length);

function guideLevels(biomeGroup: string): number[] {
  return script.beats.flatMap((beat) => beat.steps.flatMap((step) =>
    step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 3 || step.until.type !== "biomeLevelAtLeast"
      || step.until.biomeGroup !== biomeGroup ? [] : [step.until.level]));
}
for (const [index, { biomeGroup, lesson }] of APPRENTICE_T3_ZONES.entries()) {
  const farm = farms[index];
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 3, `${biomeGroup}: the T3 node`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.level === biomeLevelCap(3, biomeGroup));
  assert.equal(farm.until.level, Math.max(...guideLevels(biomeGroup)), `${biomeGroup}: matches the guide's terminal level`);
  const rank = lesson.endsWith("-2") ? 2 : 1;
  const entry = APPRENTICE_KIT.lessons.find((l) => l.pieceId === lesson.replace(/-2$/, "") && l.rank === rank);
  assert(entry?.source.kind === "zone" && entry.source.biome === biomeGroup && entry.source.tier === 3, `${lesson}: a ${biomeGroup} tier-3 lesson`);
  assert(absoluteZoneLevel(entry.source) <= farm.until.level, `${lesson}: learned before the zone is capped`);
}
const bossIndex = zoneSteps.findIndex((step) => step.type === "attemptBoss");
const configIndex = zoneSteps.findIndex((step) => step.type === "classConfig");
assert(configIndex > 0 && configIndex < bossIndex, "the rules are set once every T3 lesson is learned");
assert.deepEqual(
  zoneSteps.filter((step) => step.type === "attemptBoss").map((step) => [step.biomeGroup, step.tier]),
  APPRENTICE_T3_ZONES.map(({ biomeGroup }) => [biomeGroup, 3]),
  "the seven T3 bosses, in the guide's order",
);

// The server accepts the T3 rules once every lesson through T3 is learned.
const levels: Record<string, number> = { clearing: 4 };
for (const { biomeGroup } of APPRENTICE_T3_ZONES) levels[biomeGroup] = biomeLevelCap(3, biomeGroup);
for (const biomeGroup of ["plains", "forest"]) levels[biomeGroup] = biomeLevelCap(2, biomeGroup);
const ctx = classConfigContextFromState({
  combatArchetype: "dot", biomeLevel: levels, bossesCleared: ["plains:1", "mountain:1"],
  disciplineId: APPRENTICE_T3_DISCIPLINE, specializationId: APPRENTICE_T3_SPECIALIZATION,
});
assert(ctx);
const checked = validateClassConfig(apprenticeT3Payoffs(), ctx);
assert(checked.ok, `the T3 Payoff rules validate (${checked.ok ? "" : checked.reasons.join("; ")})`);
const resolved = resolveClassConfig(checked.config, ctx);
assert(resolved.system.kind === "payoffs");
const placed = new Set(resolved.system.placements.map((placement) => placement.pieceId));
for (const piece of ["apprentice-cinderfall", "apprentice-spore-burst", "apprentice-melt", "apprentice-blast-back"]) {
  assert(placed.has(piece), `${piece} is placed`);
}

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length);
assert(milestoneIds.every((id) => KEBAB.test(id)));
for (const { biomeGroup } of APPRENTICE_T3_ZONES) assert(milestoneIds.includes(`${biomeGroup}-t3-boss`));

// The T3 guide, after the T2 stretch: the pick line on the first zone, then lesson and boss per zone.
const t4Start = script.beats.findIndex((beat) => beat.id === "apprentice-t4-mountain");
const guide = { ...script, beats: script.beats.slice(script.beats.findIndex((beat) => beat.id === "apprentice-t3-mountain"), t4Start < 0 ? undefined : t4Start) };
assert.match(guide.beats[0].say ?? "", /specialization/i);
for (const beat of guide.beats) {
  for (const line of [beat.say, beat.waiting]) {
    if (line !== undefined) assert(line.length > 0 && line.length < 170, `${beat.id}: short line (${line.length})`);
  }
  assert(KEBAB.test(beat.id), `${beat.id}: kebab-case`);
}
assert.equal(new Set(script.beats.map((beat) => beat.id)).size, script.beats.length, "ids are unique");

const state: TutorialView = {
  nodeId: CLEARING_NODE_ID, hp: 100, maxHp: 100, isDead: false,
  playerTier: 3, selectedClass: APPRENTICE_CLASS_ROOT,
  biomeLevel: {}, globalMastery: 0, unlockedRecipes: [],
  essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
  inventory: [], equipment: emptyEquipment(), itemUpgrades: {},
  questProgress: {}, bossesCleared: [bossClearKey("plains", 1), bossClearKey("mountain", 1)], clearedNodes: [],
};
for (const biomeGroup of ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"]) {
  state.biomeLevel[biomeGroup] = biomeLevelCap(2, biomeGroup);
  state.bossesCleared.push(bossClearKey(biomeGroup, 2));
}
state.biomeLevel.clearing = 4;
function current(): string {
  state.globalMastery = globalMastery(state.biomeLevel);
  return guide.beats[resolveBeatIndex(guide, state)]?.id ?? "done";
}
for (const { biomeGroup, lesson } of APPRENTICE_T3_ZONES) {
  const rank = lesson.endsWith("-2") ? 2 : 1;
  const entry = APPRENTICE_KIT.lessons.find((l) => l.pieceId === lesson.replace(/-2$/, "") && l.rank === rank);
  assert(entry?.source.kind === "zone");
  assert.equal(current(), `apprentice-t3-${biomeGroup}`, `${biomeGroup}: the farm to the lesson`);
  state.biomeLevel[biomeGroup] = absoluteZoneLevel(entry.source);
  assert.equal(current(), `${lesson}-lesson`, `${biomeGroup}: the lesson line at the real unlock`);
  state.biomeLevel[biomeGroup] = biomeLevelCap(3, biomeGroup);
  assert.equal(current(), `apprentice-boss-${biomeGroup}-3`, `${biomeGroup}: the boss line`);
  state.bossesCleared.push(bossClearKey(biomeGroup, 3));
}
assert.equal(current(), "done", "the guide is finished after the Volcanic boss");

console.log("apprenticeT3: ok");
