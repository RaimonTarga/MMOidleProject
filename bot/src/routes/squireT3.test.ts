import assert from "node:assert/strict";
import { SKILL_TREE, buildSquireBeats, SQUIRE_KIT, type TutorialBeat } from "@mmo-idle/shared";
import { ROUTES, isControlledRouteId, requireRoute } from "./index";
import { SQUIRE_CLASS_ROOT } from "./squireT1";
import { SQUIRE_T2_DISCIPLINE, squireT2Route } from "./squireT2";
import { checkFirstBossKit, checkZoneSegments } from "./squireGearChecks";
import {
  SQUIRE_T3_BIOMES,
  SQUIRE_T3_ID,
  SQUIRE_T3_SPECIALIZATION,
  SQUIRE_T3_BOSS_GEAR,
  SQUIRE_T3_ZONE_GEAR,
  squireT3LessonLevel,
  squireT3Route,
  squireT3TutorialFarmLevel,
  type SquireT3Biome,
} from "./squireT3";

/** The last biome-level gate the Squire's tutorial farms this tier-3 zone to. */
function tutorialFarmLevel(biome: SquireT3Biome): number {
  let level: number | null = null;
  for (const beat of buildSquireBeats() as readonly TutorialBeat[]) {
    for (const step of beat.steps) {
      if (
        step.type === "farm" &&
        step.at.kind === "biome" &&
        step.at.biomeGroup === biome &&
        step.at.tier === 3 &&
        step.until.type === "biomeLevelAtLeast"
      ) {
        level = step.until.level;
      }
    }
  }
  assert(level !== null, `${biome}: the tutorial farms this tier-3 zone`);
  return level;
}

const route = squireT3Route();
const registered = ROUTES.get(SQUIRE_T3_ID);
assert(registered, "squire-t3 is registered");
assert.deepEqual(registered, route, "the registry holds the authored route");
assert.equal(requireRoute(SQUIRE_T3_ID), registered);
assert.equal(isControlledRouteId(SQUIRE_T3_ID), false, "squire-t3 stays out of the controlled batch until it has run live");
assert.throws(() => requireRoute(SQUIRE_T3_ID, "cadence"), /authored for cooldown-root/);
assert.equal(route.classRoot, SQUIRE_CLASS_ROOT);

// It begins with the T2 route, untouched.
const t2 = squireT2Route();
assert.deepEqual(route.steps.slice(0, t2.steps.length), t2.steps, "T2 steps come first, unchanged");

// Then the specialization, a tier-2 node of the picked discipline.
const pick = route.steps[t2.steps.length];
assert(pick.type === "unlockSkill" && pick.skillId === SQUIRE_T3_SPECIALIZATION, "the specialization is picked after tier 3");
const node = SKILL_TREE.get(SQUIRE_T3_SPECIALIZATION);
assert(node && node.tier === 2 && node.classId === SQUIRE_CLASS_ROOT, "the pick is a tier-2 node of the Squire");
assert.equal(node.disciplineId, SQUIRE_T2_DISCIPLINE, "and sits under the discipline the T2 route picked");
for (const spec of SQUIRE_KIT.specializations) {
  const other = squireT3Route(spec.id);
  const discipline = other.steps.find((step) => step.type === "unlockSkill");
  assert(discipline && discipline.type === "unlockSkill" && discipline.skillId === spec.disciplineId,
    `${spec.id}: the route picks its discipline first`);
}
assert.throws(() => squireT3Route("squire-nope"), /unknown specialization/);

// Then each T3 zone: farmed to the tutorial's level, wearing its gear as it unlocks, then its boss.
const rest = route.steps.slice(t2.steps.length + 1);
SQUIRE_T3_BIOMES.forEach((biome) => {
  const level = squireT3TutorialFarmLevel(biome);
  assert.equal(level, tutorialFarmLevel(biome), `${biome}: the route farms to the tutorial's level`);
  assert(level >= squireT3LessonLevel(biome), `${biome}: the lesson is learned before the boss`);
});
checkZoneSegments(rest, 3, SQUIRE_T3_BIOMES.map((biome) => ({
  biome,
  level: squireT3TutorialFarmLevel(biome),
  gear: SQUIRE_T3_ZONE_GEAR[biome],
  bossGear: SQUIRE_T3_BOSS_GEAR[biome],
})));
// The first T3 boss is met in a tier-3 weapon, armor, charm and boots.
checkFirstBossKit(SQUIRE_T3_ZONE_GEAR[SQUIRE_T3_BIOMES[0]], 3);
assert(route.completion.type === "allOf" && route.completion.of.length === SQUIRE_T3_BIOMES.length,
  "done when every T3 boss has fallen");

const milestoneIds = route.milestones.map((milestone) => milestone.id);
assert.equal(new Set(milestoneIds).size, milestoneIds.length, "milestone ids are unique");
for (const id of milestoneIds) assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id), `${id} is kebab-case`);

console.log("squireT3: ok");
