import { absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { SQUIRE_CLASS_ROOT, SQUIRE_LESSON_LEVEL, squireT1Route } from "./squireT1";

/**
 * The Squire's T2 balance route (`squire-t2`).
 *
 * The whole T1 route (the two seals promote to tier 2), then the discipline
 * pick, then every T2 zone in the order the Squire's tutorial walks them
 * (`buildSquireTierTwoBeats`): each farmed to the tier cap, where the tutorial's
 * last gate for that zone sits, and then its boss. The cap is also past the
 * zone's lesson level, so every T2 lesson is learned before its boss.
 *
 * The discipline is one `unlockSkill` step on the discipline's own skill id:
 * the discipline is a tier-1 node of the skill tree, picked with the point the
 * promotion grants. The Response rules stay on `auto` from T1; the server adds
 * each lesson and the discipline's piece as they arrive.
 *
 * Gear is not crafted here (the T1 route's gear steps are the seal zones');
 * the T2 weapon, armor and charm jobs are left to the drops and a later pass.
 */
export const SQUIRE_T2_ID = "squire-t2";

/** The default pick: the Avenger answers every blow (bible section 8.5). */
export const SQUIRE_T2_DISCIPLINE = "squire-avenger";

/** The T2 zones in tutorial order; the Jungle and the Desert first appear at this tier. */
export const SQUIRE_T2_BIOMES = ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"] as const;
export type SquireT2Biome = (typeof SQUIRE_T2_BIOMES)[number];

/** Where the tutorial stops farming a T2 zone. */
export function squireT2TutorialFarmLevel(biome: SquireT2Biome): number {
  return biomeLevelCap(2, biome);
}

/** The biome level at which a T2 zone teaches its lesson (an absolute level, as the game counts). */
export function squireT2LessonLevel(biome: SquireT2Biome): number {
  return absoluteZoneLevel({ kind: "zone", biome: biome as KitBiome, tier: 2, level: SQUIRE_LESSON_LEVEL });
}

function biomeRef(biome: SquireT2Biome): NodeRef {
  return { kind: "biome", biomeGroup: biome, tier: 2, pick: "uncleared" };
}

function farmZone(biome: SquireT2Biome): RouteStep {
  return {
    type: "farm",
    at: biomeRef(biome),
    until: { type: "biomeLevelAtLeast", biomeGroup: biome, level: squireT2TutorialFarmLevel(biome) },
    label: `farm the tier 2 ${biome}`,
  };
}

export function squireT2Route(disciplineId: string = SQUIRE_T2_DISCIPLINE): Route {
  const t1 = squireT1Route();
  const bossCleared = (biome: SquireT2Biome): Condition => ({ type: "bossCleared", biomeGroup: biome, tier: 2 });
  return {
    id: SQUIRE_T2_ID,
    version: "1.0.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T2: the T1 route to tier 2, a discipline, then every T2 zone farmed to the tier cap and its boss.",
    steps: [
      ...t1.steps,
      { type: "unlockSkill", skillId: disciplineId, label: "pick the discipline" },
      ...SQUIRE_T2_BIOMES.flatMap((biome): RouteStep[] => [
        farmZone(biome),
        { type: "attemptBoss", biomeGroup: biome, tier: 2 },
      ]),
    ],
    completion: { type: "allOf", of: SQUIRE_T2_BIOMES.map(bossCleared) },
    milestones: [
      ...t1.milestones,
      { id: "discipline-picked", when: { type: "pieceLearned", pieceId: "squire-last-breath" } },
      ...SQUIRE_T2_BIOMES.flatMap((biome) => [
        {
          id: `${biome}-t2-farmed`,
          when: { type: "biomeLevelAtLeast" as const, biomeGroup: biome, level: squireT2TutorialFarmLevel(biome) },
        },
        { id: `${biome}-t2-boss`, when: bossCleared(biome) },
      ]),
    ],
  };
}
