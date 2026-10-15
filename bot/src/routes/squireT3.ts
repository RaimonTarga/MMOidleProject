import { SQUIRE_KIT, absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { SQUIRE_CLASS_ROOT, SQUIRE_LESSON_LEVEL } from "./squireT1";
import { squireT2Route } from "./squireT2";

/**
 * The Squire's T3 balance route (`squire-t3`).
 *
 * The whole T2 route (the T1 route, the discipline, every T2 zone and boss), then the
 * specialization pick, then every T3 zone in the order the Squire's tutorial walks them
 * (`buildSquireTierThreeBeats`): each farmed to the tier cap, then its boss. The Tundra and
 * Volcanic are new at this tier. The specialization is one `unlockSkill` step on a node under
 * the discipline the T2 route picked (the default Avenger's Measure for Measure; a
 * specialization of another discipline needs the matching `squireT2Route` pick, so
 * `squireT3Route(specializationId)` derives the discipline from the kit).
 *
 * Not in `CONTROLLED_ROUTE_IDS` until it has run live.
 */
export const SQUIRE_T3_ID = "squire-t3";

/** The default pick: an Avenger specialization (bible section 8.6). */
export const SQUIRE_T3_SPECIALIZATION = "squire-measure-for-measure";

/** The T3 zones in tutorial order; the Plains and Forest have retired, the Tundra and Volcanic are new. */
export const SQUIRE_T3_BIOMES = ["mountain", "cave", "swamp", "jungle", "desert", "tundra", "volcanic"] as const;
export type SquireT3Biome = (typeof SQUIRE_T3_BIOMES)[number];

/** Where the tutorial stops farming a T3 zone. */
export function squireT3TutorialFarmLevel(biome: SquireT3Biome): number {
  return biomeLevelCap(3, biome);
}

/** The biome level at which a T3 zone teaches its lesson (an absolute level, as the game counts). */
export function squireT3LessonLevel(biome: SquireT3Biome): number {
  return absoluteZoneLevel({ kind: "zone", biome: biome as KitBiome, tier: 3, level: SQUIRE_LESSON_LEVEL });
}

function biomeRef(biome: SquireT3Biome): NodeRef {
  return { kind: "biome", biomeGroup: biome, tier: 3, pick: "uncleared" };
}

function farmZone(biome: SquireT3Biome): RouteStep {
  return {
    type: "farm",
    at: biomeRef(biome),
    until: { type: "biomeLevelAtLeast", biomeGroup: biome, level: squireT3TutorialFarmLevel(biome) },
    label: `farm the tier 3 ${biome}`,
  };
}

export function squireT3Route(specializationId: string = SQUIRE_T3_SPECIALIZATION): Route {
  const spec = SQUIRE_KIT.specializations.find((entry) => entry.id === specializationId);
  if (!spec) throw new Error(`squire-t3: unknown specialization "${specializationId}"`);
  const t2 = squireT2Route(spec.disciplineId);
  const bossCleared = (biome: SquireT3Biome): Condition => ({ type: "bossCleared", biomeGroup: biome, tier: 3 });
  return {
    id: SQUIRE_T3_ID,
    version: "1.0.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T3: the T2 route to tier 3, a specialization, then every T3 zone farmed to the tier cap and its boss.",
    steps: [
      ...t2.steps,
      { type: "unlockSkill", skillId: specializationId, label: "pick the specialization" },
      ...SQUIRE_T3_BIOMES.flatMap((biome): RouteStep[] => [
        farmZone(biome),
        { type: "attemptBoss", biomeGroup: biome, tier: 3 },
      ]),
    ],
    completion: { type: "allOf", of: SQUIRE_T3_BIOMES.map(bossCleared) },
    milestones: [
      ...t2.milestones,
      { id: "tier-3-reached", when: { type: "playerTierAtLeast", tier: 3 } },
      ...SQUIRE_T3_BIOMES.flatMap((biome) => [
        {
          id: `${biome}-t3-farmed`,
          when: { type: "biomeLevelAtLeast" as const, biomeGroup: biome, level: squireT3TutorialFarmLevel(biome) },
        },
        { id: `${biome}-t3-boss`, when: bossCleared(biome) },
      ]),
    ],
  };
}
