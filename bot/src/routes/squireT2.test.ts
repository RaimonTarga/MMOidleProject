import assert from "node:assert/strict";
import {
  SKILL_TREE,
  buildSquireBeats,
  type TutorialBeat,
} from "@mmo-idle/shared";
import { ROUTES, isControlledRouteId, requireRoute } from "./index";
import { SQUIRE_CLASS_ROOT } from "./squireT1";
import {
  SQUIRE_T2_BIOMES,
  SQUIRE_T2_DISCIPLINE,
  SQUIRE_T2_ID,
  squireT2LessonLevel,
  squireT2Route,
  squireT2TutorialFarmLevel,
  type SquireT2Biome,
} from "./squireT2";
import { squireT1Route } from "./squireT1";

/** The last biome-level gate the Squire's tutorial farms this tier-2 zone to. */
function tutorialFarmLevel(biome: SquireT2Biome): number {
  let level: number | null = null;
  for (const beat of buildSquireBeats() as readonly TutorialBeat[]) {
    for (const step of beat.steps) {
      if (
        step.type === "farm" &&
        step.at.kind === "biome" &&
        step.at.biomeGroup === biome &&
        step.at.tier === 2 &&
        step.until.type === "biomeLevelAtLeast"
      ) {
        level = step.until.level;
      }
    }
  }
  assert(level !== null, `${biome}: the tutorial farms this tier-2 zone`);
  return level;
}

const route = squireT2Route();
const registered = ROUTES.get(SQUIRE_T2_ID);
assert(registered, "squire-t2 is registered");
assert.deepEqual(registered, route, "the registry holds the authored route");
assert.equal(requireRoute(SQUIRE_T2_ID), registered);
assert.equal(isControlledRouteId(SQUIRE_T2_ID), true, "squire-t2 is admitted to a controlled batch");
assert.throws(() => requireRoute(SQUIRE_T2_ID, "cadence"), /authored for cooldown-root/);

assert.equal(route.id, "squire-t2");
assert.equal(route.classRoot, SQUIRE_CLASS_ROOT);
assert(route.description.length > 0, "the route is described");

// It begins with the T1 route, untouched.
const t1 = squireT1Route();
assert.deepEqual(route.steps.slice(0, t1.steps.length), t1.steps, "T1 steps come first, unchanged");

// Then the discipline pick, on a real discipline node of this class.
const pick = route.steps[t1.steps.length];
assert(pick.type === "unlockSkill" && pick.skillId === SQUIRE_T2_DISCIPLINE, "the discipline is picked right after tier 2");
const node = SKILL_TREE.get(SQUIRE_T2_DISCIPLINE);
assert(node && node.tier === 1 && node.classId === SQUIRE_CLASS_ROOT, "the pick is a tier-1 node of the Squire");
assert.equal(squireT2Route("squire-juggernaut").steps[t1.steps.length].type, "unlockSkill");

// Then each T2 zone: a farm to the tutorial's level, then its boss.
const rest = route.steps.slice(t1.steps.length + 1);
assert.equal(rest.length, SQUIRE_T2_BIOMES.length * 2, "a farm and a boss per T2 zone");
SQUIRE_T2_BIOMES.forEach((biome, index) => {
  const farm = rest[index * 2];
  const boss = rest[index * 2 + 1];
  const level = squireT2TutorialFarmLevel(biome);
  assert.equal(level, tutorialFarmLevel(biome), `${biome}: the route farms to the tutorial's level`);
  assert(level >= squireT2LessonLevel(biome), `${biome}: the lesson is learned before the boss`);
  assert(farm.type === "farm" && farm.at.kind === "biome" && farm.at.biomeGroup === biome && farm.at.tier === 2,
    `${biome}: farms the tier-2 zone`);
  assert(farm.type === "farm" && farm.until.type === "biomeLevelAtLeast" && farm.until.level === level,
    `${biome}: until the tutorial's level`);
  assert(boss.type === "attemptBoss" && boss.biomeGroup === biome && boss.tier === 2, `${biome}: the tier-2 boss`);
});

assert(route.completion.type === "allOf" && route.completion.of.length === SQUIRE_T2_BIOMES.length,
  "done when every T2 boss has fallen");

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id), `${id} is kebab-case`);
for (const biome of SQUIRE_T2_BIOMES) {
  assert(milestoneIds.includes(`${biome}-t2-farmed`) && milestoneIds.includes(`${biome}-t2-boss`), `${biome}: milestones`);
}

console.log("squireT2: ok");
