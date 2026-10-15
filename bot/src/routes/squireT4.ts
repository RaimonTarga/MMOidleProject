import { SQUIRE_KIT, absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { SQUIRE_CLASS_ROOT, SQUIRE_LESSON_LEVEL } from "./squireT1";
import { SQUIRE_T3_SPECIALIZATION, squireT3Route } from "./squireT3";

/**
 * The Squire's T4 balance route (`squire-t4`).
 *
 * The whole T3 route, then the leaf pick (one `unlockSkill` under the discipline), then every T4
 * zone in the order the Squire's tutorial walks them (`buildSquireTierFourBeats`): each farmed to
 * the tier cap, then its boss. The Wasteland (`graveyard`) and Trench are new at this tier.
 * `squireT4Route(leafId)` derives the specialization (and so the discipline) from the leaf.
 *
 * Not in `CONTROLLED_ROUTE_IDS` until it has run live.
 */
export const SQUIRE_T4_ID = "squire-t4";

/** The default pick: an Avenger leaf (bible section 8.7). */
export const SQUIRE_T4_LEAF = "squire-last-word";

/** The T4 zones in tutorial order. */
export const SQUIRE_T4_BIOMES = ["mountain", "tundra", "jungle", "desert", "volcanic", "graveyard", "trench"] as const;
export type SquireT4Biome = (typeof SQUIRE_T4_BIOMES)[number];

/** Where the tutorial stops farming a T4 zone. */
export function squireT4TutorialFarmLevel(biome: SquireT4Biome): number {
  return biomeLevelCap(4, biome);
}

/** The biome level at which a T4 zone teaches its lesson (an absolute level, as the game counts). */
export function squireT4LessonLevel(biome: SquireT4Biome): number {
  return absoluteZoneLevel({ kind: "zone", biome: biome as KitBiome, tier: 4, level: SQUIRE_LESSON_LEVEL });
}

function biomeRef(biome: SquireT4Biome): NodeRef {
  return { kind: "biome", biomeGroup: biome, tier: 4, pick: "uncleared" };
}

function farmZone(biome: SquireT4Biome): RouteStep {
  return {
    type: "farm",
    at: biomeRef(biome),
    until: { type: "biomeLevelAtLeast", biomeGroup: biome, level: squireT4TutorialFarmLevel(biome) },
    label: `farm the tier 4 ${biome}`,
  };
}

/** A specialization of the picked leaf's discipline (the first the kit lists; the T3 default for Avenger). */
function specializationFor(disciplineId: string): string {
  const fallback = SQUIRE_KIT.specializations.find((entry) => entry.id === SQUIRE_T3_SPECIALIZATION);
  if (fallback?.disciplineId === disciplineId) return fallback.id;
  const spec = SQUIRE_KIT.specializations.find((entry) => entry.disciplineId === disciplineId);
  if (!spec) throw new Error(`squire-t4: no specialization under "${disciplineId}"`);
  return spec.id;
}

export function squireT4Route(leafId: string = SQUIRE_T4_LEAF): Route {
  const leaf = SQUIRE_KIT.leaves.find((entry) => entry.id === leafId);
  if (!leaf) throw new Error(`squire-t4: unknown leaf "${leafId}"`);
  const t3 = squireT3Route(specializationFor(leaf.disciplineId));
  const bossCleared = (biome: SquireT4Biome): Condition => ({ type: "bossCleared", biomeGroup: biome, tier: 4 });
  return {
    id: SQUIRE_T4_ID,
    version: "1.0.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T4: the T3 route to tier 4, a leaf, then every T4 zone farmed to the tier cap and its boss.",
    steps: [
      ...t3.steps,
      { type: "unlockSkill", skillId: leafId, label: "pick the leaf" },
      ...SQUIRE_T4_BIOMES.flatMap((biome): RouteStep[] => [
        farmZone(biome),
        { type: "attemptBoss", biomeGroup: biome, tier: 4 },
      ]),
    ],
    completion: { type: "allOf", of: SQUIRE_T4_BIOMES.map(bossCleared) },
    milestones: [
      ...t3.milestones,
      { id: "tier-4-reached", when: { type: "playerTierAtLeast", tier: 4 } },
      ...SQUIRE_T4_BIOMES.flatMap((biome) => [
        {
          id: `${biome}-t4-farmed`,
          when: { type: "biomeLevelAtLeast" as const, biomeGroup: biome, level: squireT4TutorialFarmLevel(biome) },
        },
        { id: `${biome}-t4-boss`, when: bossCleared(biome) },
      ]),
    ],
  };
}
