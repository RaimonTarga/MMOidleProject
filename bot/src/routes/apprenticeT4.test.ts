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
  RECIPE_DATABASE,
  resolveClassConfig,
  SKILL_TREE,
  tutorialScriptWithoutGear,
  validateClassConfig,
  type TutorialView,
} from "@mmo-idle/shared";
import { isClassAgnosticRouteId, isControlledRouteId, requireRoute, ROUTES } from "./index";
import { APPRENTICE_CLASS_ROOT } from "./apprenticeT1";
import { apprenticeT2Route } from "./apprenticeT2";
import { APPRENTICE_T3_DISCIPLINE, APPRENTICE_T3_SPECIALIZATION, APPRENTICE_T3_ZONES, apprenticeT3Route } from "./apprenticeT3";
import { APPRENTICE_T4_ID, APPRENTICE_T4_LEAF, APPRENTICE_T4_ZONES, apprenticeT4Payoffs, apprenticeT4Route } from "./apprenticeT4";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const route = apprenticeT4Route();
const t3 = apprenticeT3Route();
const script = tutorialScriptWithoutGear(APPRENTICE_CLASS_ROOT);

assert.equal(route.id, "apprentice-t4");
assert(KEBAB.test(route.id));
assert.equal(route.classRoot, "dot-root");
assert.deepEqual(ROUTES.get(APPRENTICE_T4_ID), route, "the T4 route is registered");
assert.deepEqual(requireRoute(APPRENTICE_T4_ID, "dot"), route);
assert.equal(isClassAgnosticRouteId(APPRENTICE_T4_ID), false);
assert.equal(isControlledRouteId(APPRENTICE_T4_ID), false, "not controlled until it has run live");

// The T3 route first, step for step.
assert.deepEqual(route.steps.slice(0, t3.steps.length), t3.steps);
const tail = route.steps.slice(t3.steps.length);

// The promotion wait, then the leaf pick under the picked school.
const [wait, pick, marker] = tail;
assert(wait.type === "farm" && wait.until.type === "playerTierAtLeast" && wait.until.tier === 4, "wait for tier 4");
assert(pick.type === "unlockSkill" && pick.skillId === APPRENTICE_T4_LEAF, "then the leaf pick");
assert(marker.type === "milestone");
const leaf = APPRENTICE_KIT.leaves.find((entry) => entry.id === APPRENTICE_T4_LEAF);
assert.equal(leaf?.disciplineId, APPRENTICE_T3_DISCIPLINE, "the leaf belongs to the picked school");
const node = SKILL_TREE.get(APPRENTICE_T4_LEAF);
assert.equal(node?.classId, APPRENTICE_CLASS_ROOT);
assert.equal(node?.disciplineId, APPRENTICE_T3_DISCIPLINE);

// The Passive Tree lists the nine leaves under their schools.
for (const entry of APPRENTICE_KIT.disciplines) {
  const listed = [...SKILL_TREE.values()].filter((n) => n.classId === APPRENTICE_CLASS_ROOT && n.disciplineId === entry.id && APPRENTICE_KIT.leaves.some((l) => l.id === n.id));
  assert.deepEqual(listed.map((n) => n.id).sort(), APPRENTICE_KIT.leaves.filter((l) => l.disciplineId === entry.id).map((l) => l.id).sort(), `${entry.id}: its three leaves`);
}
const asPlayer = (disciplineId: string) => ({
  usesSkills: { unlockedSkills: [APPRENTICE_CLASS_ROOT, disciplineId, APPRENTICE_T3_SPECIALIZATION], selectedClass: APPRENTICE_CLASS_ROOT, disciplineId },
  tracksProgression: { skillPoints: 1, currentSkillTier: node?.tier ?? 0 },
});
assert(canUnlockSkill(asPlayer(APPRENTICE_T3_DISCIPLINE), APPRENTICE_T4_LEAF).ok, "the leaf opens under the picked school");
assert(!canUnlockSkill(asPlayer("apprentice-poison"), APPRENTICE_T4_LEAF).ok, "and not under another school");

// The seven T4 zones: travel and farm to the cap, the rules, then the bosses.
const zoneSteps = tail.slice(3);
const farms = zoneSteps.filter((step) => step.type === "farm");
assert.equal(farms.length, APPRENTICE_T4_ZONES.length);
assert(APPRENTICE_T4_ZONES.some((z) => z.biomeGroup === "graveyard") && APPRENTICE_T4_ZONES.some((z) => z.biomeGroup === "trench"), "the Wasteland and the Trench");

function guideLevels(biomeGroup: string): number[] {
  return script.beats.flatMap((beat) => beat.steps.flatMap((step) =>
    step.type !== "farm" || step.at.kind !== "biome" || step.at.tier !== 4 || step.until.type !== "biomeLevelAtLeast"
      || step.until.biomeGroup !== biomeGroup ? [] : [step.until.level]));
}
for (const [index, { biomeGroup, pieceId, rank }] of APPRENTICE_T4_ZONES.entries()) {
  const farm = farms[index];
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.biomeGroup === biomeGroup && farm.at.tier === 4, `${biomeGroup}: the T4 node`);
  assert(farm.until.type === "biomeLevelAtLeast" && farm.until.level === biomeLevelCap(4, biomeGroup));
  assert.equal(farm.until.level, Math.max(...guideLevels(biomeGroup)), `${biomeGroup}: matches the guide's terminal level`);
  const entry = APPRENTICE_KIT.lessons.find((l) => l.pieceId === pieceId && l.rank === rank);
  assert(entry?.source.kind === "zone" && entry.source.biome === biomeGroup && entry.source.tier === 4, `${pieceId}: a ${biomeGroup} tier-4 lesson`);
  assert(absoluteZoneLevel(entry.source) <= farm.until.level, `${pieceId}: learned before the zone is capped`);
}
const bossIndex = zoneSteps.findIndex((step) => step.type === "attemptBoss");
const configIndex = zoneSteps.findIndex((step) => step.type === "classConfig");
assert(configIndex > 0 && configIndex < bossIndex, "the rules are set once every T4 lesson is learned");
assert.deepEqual(
  zoneSteps.filter((step) => step.type === "attemptBoss").map((step) => [step.biomeGroup, step.tier]),
  APPRENTICE_T4_ZONES.map(({ biomeGroup }) => [biomeGroup, 4]),
  "the seven T4 bosses, in the guide's order",
);

// The server accepts the T4 rules once every lesson through T4 is learned.
const levels: Record<string, number> = { clearing: 4 };
for (const { biomeGroup } of APPRENTICE_T3_ZONES) levels[biomeGroup] = biomeLevelCap(3, biomeGroup);
for (const { biomeGroup } of APPRENTICE_T4_ZONES) levels[biomeGroup] = biomeLevelCap(4, biomeGroup);
for (const biomeGroup of ["plains", "forest"]) levels[biomeGroup] = biomeLevelCap(2, biomeGroup);
const ctx = classConfigContextFromState({
  combatArchetype: "dot", biomeLevel: levels, bossesCleared: ["plains:1", "mountain:1"],
  disciplineId: APPRENTICE_T3_DISCIPLINE, specializationId: APPRENTICE_T3_SPECIALIZATION,
});
assert(ctx);
const checked = validateClassConfig(apprenticeT4Payoffs(), ctx);
assert(checked.ok, `the T4 Payoff rules validate (${checked.ok ? "" : checked.reasons.join("; ")})`);
const resolved = resolveClassConfig(checked.config, ctx);
assert(resolved.system.kind === "payoffs");
const placed = new Set(resolved.system.placements.map((placement) => placement.pieceId));
for (const piece of ["apprentice-frostcrack", "apprentice-pyre", "apprentice-transference", "apprentice-cinderfall", "apprentice-melt"]) {
  assert(placed.has(piece), `${piece} is placed`);
}

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length);
assert(milestoneIds.every((id) => KEBAB.test(id)));
for (const { biomeGroup } of APPRENTICE_T4_ZONES) assert(milestoneIds.includes(`${biomeGroup}-t4-boss`));

// The T4 guide, after the T3 stretch: the leaf line on the first zone, then lesson and boss per zone.
const guide = { ...script, beats: script.beats.slice(script.beats.findIndex((beat) => beat.id === "apprentice-t4-mountain")) };
assert.match(guide.beats[0].say ?? "", /leaf/i);
for (const beat of guide.beats) {
  for (const line of [beat.say, beat.waiting]) {
    if (line !== undefined) assert(line.length > 0 && line.length < 190, `${beat.id}: short line (${line.length})`);
  }
  assert(KEBAB.test(beat.id), `${beat.id}: kebab-case`);
}
assert.equal(new Set(script.beats.map((beat) => beat.id)).size, script.beats.length, "ids are unique");

const state: TutorialView = {
  nodeId: CLEARING_NODE_ID, hp: 100, maxHp: 100, isDead: false,
  playerTier: 4, selectedClass: APPRENTICE_CLASS_ROOT,
  biomeLevel: {}, globalMastery: 0, unlockedRecipes: [],
  essences: { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 },
  inventory: [], equipment: emptyEquipment(), itemUpgrades: {},
  questProgress: {}, bossesCleared: [bossClearKey("plains", 1), bossClearKey("mountain", 1)], clearedNodes: [],
};
for (const biomeGroup of ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"]) {
  state.biomeLevel[biomeGroup] = biomeLevelCap(2, biomeGroup);
  state.bossesCleared.push(bossClearKey(biomeGroup, 2));
}
for (const { biomeGroup } of APPRENTICE_T3_ZONES) {
  state.biomeLevel[biomeGroup] = biomeLevelCap(3, biomeGroup);
  state.bossesCleared.push(bossClearKey(biomeGroup, 3));
}
state.biomeLevel.clearing = 4;
function current(): string {
  state.globalMastery = globalMastery(state.biomeLevel);
  return guide.beats[resolveBeatIndex(guide, state)]?.id ?? "done";
}
for (const { biomeGroup, pieceId, rank } of APPRENTICE_T4_ZONES) {
  const entry = APPRENTICE_KIT.lessons.find((l) => l.pieceId === pieceId && l.rank === rank);
  assert(entry?.source.kind === "zone");
  const lessonId = rank === 1 ? pieceId : `${pieceId}-${rank}`;
  assert.equal(current(), `apprentice-t4-${biomeGroup}`, `${biomeGroup}: the farm to the lesson`);
  state.biomeLevel[biomeGroup] = absoluteZoneLevel(entry.source);
  assert.equal(current(), `${lessonId}-lesson`, `${biomeGroup}: the lesson line at the real unlock`);
  state.biomeLevel[biomeGroup] = biomeLevelCap(4, biomeGroup);
  assert.equal(current(), `apprentice-boss-${biomeGroup}-4`, `${biomeGroup}: the boss line`);
  state.bossesCleared.push(bossClearKey(biomeGroup, 4));
}
assert.equal(current(), "done", "the guide is finished after the Trench boss");

// The other two school chains (OV2): each tier's route registered under its suffix, each
// replaying the tier before, each pick opening under the school, every worn piece a recipe.
for (const school of ["apprentice-poison", "apprentice-frost"]) {
  const suffix = school.replace("apprentice-", "-");
  const chain = [apprenticeT2Route(school), apprenticeT3Route(school), apprenticeT4Route(school)];
  chain.forEach((tierRoute, index) => {
    const id = `apprentice-t${index + 2}${suffix}`;
    assert.equal(tierRoute.id, id);
    assert.deepEqual(ROUTES.get(id), tierRoute, `${id} is registered`);
    assert.equal(isControlledRouteId(id), false, `${id}: not controlled until it has run live`);
    if (index > 0) assert.deepEqual(tierRoute.steps.slice(0, chain[index - 1].steps.length), chain[index - 1].steps, `${id}: the tier before first`);
  });
  const picks = chain[2].steps.flatMap((step) => (step.type === "unlockSkill" ? [step.skillId] : []));
  assert.equal(picks[0], school, `${school}: the school is the first pick`);
  const [spec, schoolLeaf] = picks.slice(1);
  assert.equal(APPRENTICE_KIT.specializations.find((s) => s.id === spec)?.disciplineId, school, `${spec} is under ${school}`);
  assert.equal(APPRENTICE_KIT.leaves.find((l) => l.id === schoolLeaf)?.disciplineId, school, `${schoolLeaf} is under ${school}`);
  const player = {
    usesSkills: { unlockedSkills: [APPRENTICE_CLASS_ROOT, school, spec], selectedClass: APPRENTICE_CLASS_ROOT, disciplineId: school },
    tracksProgression: { skillPoints: 1, currentSkillTier: SKILL_TREE.get(schoolLeaf)?.tier ?? 0 },
  };
  assert(canUnlockSkill(player, schoolLeaf).ok, `${schoolLeaf} opens under ${school}`);
  for (const step of chain[2].steps) {
    if (step.type === "craft") for (const recipeId of step.recipeIds) assert(RECIPE_DATABASE.has(recipeId), `${school}: ${recipeId} is a recipe`);
  }
}

console.log("apprenticeT4: ok");
