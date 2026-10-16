import { SQUIRE_KIT, absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { SQUIRE_CLASS_ROOT, SQUIRE_LESSON_LEVEL, farmWearingGear } from "./squireT1";
import { SQUIRE_T3_SPECIALIZATION, squireT3Route } from "./squireT3";

/**
 * The Squire's T4 balance route (`squire-t4`).
 *
 * The whole T3 route, then the leaf pick (one `unlockSkill` under the discipline), then every T4
 * zone in the order the Squire's tutorial walks them (`buildSquireTierFourBeats`): each farmed to
 * the tier cap, then its boss. The Wasteland (`graveyard`) and Trench are new at this tier.
 * `squireT4Route(leafId)` derives the specialization (and so the discipline) from the leaf.
 *
 * Gear (OV-SQUIRE): each zone's tier-4 pieces are crafted and worn as soon as its level unlocks
 * them (`SQUIRE_T4_ZONE_GEAR`), so the first T4 boss (the Mountain's) is met in the tier-4
 * Warhammer, armor, charm and boots. Base crafts only, no upgrades.
 *
 * Not in `CONTROLLED_ROUTE_IDS` until it has run live.
 */
export const SQUIRE_T4_ID = "squire-t4";

/** The default pick: a leaf of the default discipline (bible section 8.7). PLACEHOLDER (OV-SQUIRE). */
export const SQUIRE_T4_LEAF = "squire-second-line";

/** The T4 zones in tutorial order. */
export const SQUIRE_T4_BIOMES = ["mountain", "tundra", "jungle", "desert", "volcanic", "graveyard", "trench"] as const;
export type SquireT4Biome = (typeof SQUIRE_T4_BIOMES)[number];

/**
 * The tier-4 pieces a Squire wears from each zone, in unlock order. PLACEHOLDER picks
 * (OV-SQUIRE): every zone's armor and charm (the main bases), boots only when faster, and the
 * Mountain's Warhammer for every discipline (no later tier-4 weapon out-hits it, swing and slam).
 */
export const SQUIRE_T4_ZONE_GEAR: Record<SquireT4Biome, readonly string[]> = {
  mountain: ["squire-warhammer-t4", "mountain-vest-t4", "mountain-charm-t4", "mountain-boots-t4"],
  tundra: ["tundra-vest-t4", "tundra-charm-t4"],
  jungle: ["jungle-vest-t4", "jungle-charm-t4", "jungle-boots-t4"],
  desert: ["desert-vest-t4", "desert-charm-t4", "desert-boots-t4"],
  volcanic: ["volcanic-vest-t4", "volcanic-charm-t4"],
  graveyard: ["graveyard-vest-t4", "graveyard-charm-t4"],
  trench: ["trench-vest-t4", "trench-charm-t4"],
};

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

function farmZone(biome: SquireT4Biome): RouteStep[] {
  return farmWearingGear(biomeRef(biome), biome, squireT4TutorialFarmLevel(biome), SQUIRE_T4_ZONE_GEAR[biome],
    `farm the tier 4 ${biome}`);
}

/** A specialization of the picked leaf's discipline (the T3 default when it fits, else the first the kit lists). */
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
    version: "1.1.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T4: the T3 route to tier 4, a leaf, then every T4 zone farmed to the tier cap wearing its gear, and its boss.",
    steps: [
      ...t3.steps,
      { type: "unlockSkill", skillId: leafId, label: "pick the leaf" },
      ...SQUIRE_T4_BIOMES.flatMap((biome): RouteStep[] => [
        ...farmZone(biome),
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
