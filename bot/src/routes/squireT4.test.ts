import assert from "node:assert/strict";
import { SKILL_TREE, buildSquireBeats, SQUIRE_KIT, type TutorialBeat } from "@mmo-idle/shared";
import { ROUTES, isControlledRouteId, requireRoute } from "./index";
import { SQUIRE_CLASS_ROOT } from "./squireT1";
import { squireT3Route } from "./squireT3";
import {
  SQUIRE_T4_BIOMES,
  SQUIRE_T4_ID,
  SQUIRE_T4_LEAF,
  squireT4LessonLevel,
  squireT4Route,
  squireT4TutorialFarmLevel,
  type SquireT4Biome,
} from "./squireT4";

/** The last biome-level gate the Squire's tutorial farms this tier-4 zone to. */
function tutorialFarmLevel(biome: SquireT4Biome): number {
  let level: number | null = null;
  for (const beat of buildSquireBeats() as readonly TutorialBeat[]) {
    for (const step of beat.steps) {
      if (
        step.type === "farm" &&
        step.at.kind === "biome" &&
        step.at.biomeGroup === biome &&
        step.at.tier === 4 &&
        step.until.type === "biomeLevelAtLeast"
      ) {
        level = step.until.level;
      }
    }
  }
  assert(level !== null, `${biome}: the tutorial farms this tier-4 zone`);
  return level;
}

const route = squireT4Route();
assert.deepEqual(ROUTES.get(SQUIRE_T4_ID), route, "squire-t4 is registered");
assert.deepEqual(requireRoute(SQUIRE_T4_ID), route);
assert.equal(isControlledRouteId(SQUIRE_T4_ID), false, "squire-t4 stays out of the controlled batch until it has run live");
assert.throws(() => requireRoute(SQUIRE_T4_ID, "cadence"), /authored for cooldown-root/);
assert.equal(route.classRoot, SQUIRE_CLASS_ROOT);

// It begins with the T3 route, untouched.
const t3 = squireT3Route();
assert.deepEqual(route.steps.slice(0, t3.steps.length), t3.steps, "T3 steps come first, unchanged");

// Then the leaf, a node under the picked discipline.
const pick = route.steps[t3.steps.length];
assert(pick.type === "unlockSkill" && pick.skillId === SQUIRE_T4_LEAF, "the leaf is picked after tier 4");
const node = SKILL_TREE.get(SQUIRE_T4_LEAF);
assert(node && node.classId === SQUIRE_CLASS_ROOT && node.disciplineId === "squire-avenger", "the pick is a Squire leaf under Avenger");
for (const leaf of SQUIRE_KIT.leaves) {
  const other = squireT4Route(leaf.id);
  const disciplines = other.steps.filter((step) => step.type === "unlockSkill").map((step) => step.skillId);
  assert(disciplines.includes(leaf.disciplineId), `${leaf.id}: the route picks its discipline first`);
  const spec = SQUIRE_KIT.specializations.find((s) => s.id === disciplines[1]);
  assert(spec?.disciplineId === leaf.disciplineId, `${leaf.id}: and a specialization of that discipline`);
}
assert.throws(() => squireT4Route("squire-nope"), /unknown leaf/);

// Then each T4 zone: a farm to the tutorial's level, then its boss.
const rest = route.steps.slice(t3.steps.length + 1);
assert.equal(rest.length, SQUIRE_T4_BIOMES.length * 2, "a farm and a boss per T4 zone");
SQUIRE_T4_BIOMES.forEach((biome, index) => {
  const farm = rest[index * 2];
  const boss = rest[index * 2 + 1];
  const level = squireT4TutorialFarmLevel(biome);
  assert.equal(level, tutorialFarmLevel(biome), `${biome}: the route farms to the tutorial's level`);
  assert(level >= squireT4LessonLevel(biome), `${biome}: the lesson is learned before the boss`);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.biomeGroup === biome && farm.at.tier === 4,
    `${biome}: farms the tier-4 zone`);
  assert(boss.type === "attemptBoss" && boss.biomeGroup === biome && boss.tier === 4, `${biome}: the tier-4 boss`);
});
assert(route.completion.type === "allOf" && route.completion.of.length === SQUIRE_T4_BIOMES.length,
  "done when every T4 boss has fallen");

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id), `${id} is kebab-case`);

console.log("squireT4: ok");
