import { SQUIRE_KIT, absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { SQUIRE_CLASS_ROOT, SQUIRE_LESSON_LEVEL, farmWearingGear } from "./squireT1";
import { squireRouteId, squireT2Route } from "./squireT2";

/**
 * The Squire's T3 balance route (`squire-t3`).
 *
 * The whole T2 route (the T1 route, the discipline, every T2 zone and boss), then the
 * specialization pick, then every T3 zone in the order the Squire's tutorial walks them
 * (`buildSquireTierThreeBeats`): each farmed to the tier cap, then its boss. The Tundra and
 * Volcanic are new at this tier. The specialization is one `unlockSkill` step on a node under
 * the discipline the T2 route picked (`squireT3Route(specializationId)` derives the discipline
 * from the kit).
 *
 * Gear (OV-SQUIRE): each zone's tier-3 pieces are crafted and worn as soon as its level
 * unlocks them (`SQUIRE_T3_ZONE_GEAR`), so the first T3 boss (the Mountain's) is met in the
 * tier-3 Warhammer, armor, charm and boots. Base crafts only, no upgrades.
 *
 * Not in `CONTROLLED_ROUTE_IDS` until it has run live.
 */
export const SQUIRE_T3_ID = "squire-t3";

/** The default pick: a specialization of the default discipline (bible section 8.6). PLACEHOLDER (OV-SQUIRE). */
export const SQUIRE_T3_SPECIALIZATION = "squire-reverb";

/** The T3 zones in tutorial order; the Plains and Forest have retired, the Tundra and Volcanic are new. */
export const SQUIRE_T3_BIOMES = ["mountain", "cave", "swamp", "jungle", "desert", "tundra", "volcanic"] as const;
export type SquireT3Biome = (typeof SQUIRE_T3_BIOMES)[number];

/**
 * The tier-3 pieces a Squire wears from each zone, in unlock order. PLACEHOLDER picks
 * (OV-SQUIRE): every zone's armor and charm (the zone's own line; the Jungle and Volcanic
 * main bases, not the moved-line `-b` ones), boots only when faster, and the Mountain's
 * Warhammer for every discipline: the slam is a swing, so the heaviest attack makes the
 * biggest slam, and no later tier-3 weapon out-hits it.
 */
export const SQUIRE_T3_ZONE_GEAR: Record<SquireT3Biome, readonly string[]> = {
  mountain: ["squire-warhammer-t3", "mountain-vest-t3", "mountain-charm-t3", "mountain-boots-t3"],
  cave: ["cave-vest-t3", "cave-charm-t3", "cave-boots-t3"],
  swamp: ["swamp-vest-t3", "swamp-charm-t3"],
  jungle: ["jungle-vest-t3", "jungle-charm-t3", "jungle-boots-t3"],
  desert: ["desert-vest-t3", "desert-charm-t3", "desert-boots-t3"],
  tundra: ["tundra-vest-t3", "tundra-charm-t3"],
  volcanic: ["volcanic-vest-t3", "volcanic-charm-t3"],
};

/**
 * What the Squire puts on right before some T3 bosses (crafted earlier; equip only). PLACEHOLDER
 * (OV-SQUIRE): the Cave's vest (the tier's highest damage reduction) and Old Guard charm, the
 * Squire's tank set. Class boss sim, Bulwark + Reverb: the Volcanic boss lost 3/3 in the zone's
 * own set and won 3/3 in this one; the Desert boss went from a loss (boss at 1%) to a win at full
 * HP; the Tundra boss from 37% to 70% HP left. The Swamp boss keeps its own set (100% vs 35%).
 */
export const SQUIRE_T3_BOSS_GEAR: Partial<Record<SquireT3Biome, readonly string[]>> = {
  desert: ["cave-vest-t3", "cave-charm-t3"],
  tundra: ["cave-vest-t3", "cave-charm-t3"],
  volcanic: ["cave-vest-t3", "cave-charm-t3"],
};

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

function farmZone(biome: SquireT3Biome): RouteStep[] {
  return farmWearingGear(biomeRef(biome), biome, squireT3TutorialFarmLevel(biome), SQUIRE_T3_ZONE_GEAR[biome],
    `farm the tier 3 ${biome}`);
}

export function squireT3Route(specializationId: string = SQUIRE_T3_SPECIALIZATION): Route {
  const spec = SQUIRE_KIT.specializations.find((entry) => entry.id === specializationId);
  if (!spec) throw new Error(`squire-t3: unknown specialization "${specializationId}"`);
  const t2 = squireT2Route(spec.disciplineId);
  const bossCleared = (biome: SquireT3Biome): Condition => ({ type: "bossCleared", biomeGroup: biome, tier: 3 });
  return {
    id: squireRouteId(3, spec.disciplineId),
    version: "1.1.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T3: the T2 route to tier 3, a specialization, then every T3 zone farmed to the tier cap wearing its gear, and its boss.",
    steps: [
      ...t2.steps,
      { type: "unlockSkill", skillId: specializationId, label: "pick the specialization" },
      ...SQUIRE_T3_BIOMES.flatMap((biome): RouteStep[] => {
        const bossGear = SQUIRE_T3_BOSS_GEAR[biome];
        return [
          ...farmZone(biome),
          ...(bossGear ? [{ type: "equip" as const, definitionIds: [...bossGear], label: `wear the ${biome} boss gear` }] : []),
          { type: "attemptBoss", biomeGroup: biome, tier: 3 },
        ];
      }),
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
