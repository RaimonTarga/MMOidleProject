import { absoluteZoneLevel, biomeLevelCap, type KitBiome } from "@mmo-idle/shared";
import type { Condition, NodeRef, Route, RouteStep } from "../route/types";
import { SQUIRE_CLASS_ROOT, SQUIRE_LESSON_LEVEL, farmWearingGear, squireT1Route } from "./squireT1";

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
 * Gear (OV-SQUIRE): in each zone the route crafts and wears that zone's tier-2
 * pieces as soon as its level unlocks them (`SQUIRE_T2_ZONE_GEAR`), and the
 * weapons the discipline fights with (`SQUIRE_T2_WEAPONS`), so the first T2 boss
 * is met in a tier-2 weapon, armor, charm and boots. Base crafts only, no upgrades.
 */
export const SQUIRE_T2_ID = "squire-t2";

/**
 * The default pick: the Bulwark, the balanced discipline (bible section 8.5). PLACEHOLDER
 * (OV-SQUIRE): its own weapon is the first T2 zone's.
 */
export const SQUIRE_T2_DISCIPLINE = "squire-bulwark";

/** The T2 zones in tutorial order; the Jungle and the Desert first appear at this tier. */
export const SQUIRE_T2_BIOMES = ["plains", "forest", "mountain", "swamp", "cave", "jungle", "desert"] as const;
export type SquireT2Biome = (typeof SQUIRE_T2_BIOMES)[number];

/**
 * The shared tier-2 pieces a Squire wears from each zone, in unlock order. PLACEHOLDER picks
 * (OV-SQUIRE): every zone's armor and charm (each line answers that zone's threat, bible
 * §8.16), boots only when faster than the pair already worn.
 */
export const SQUIRE_T2_ZONE_GEAR: Record<SquireT2Biome, readonly string[]> = {
  plains: ["plains-vest-t2", "plains-charm-t2", "plains-boots-t2"],
  forest: ["forest-vest-t2", "forest-charm-t2", "forest-boots-t2"],
  mountain: ["mountain-vest-t2", "mountain-charm-t2"],
  swamp: ["swamp-vest-t2", "swamp-charm-t2"],
  cave: ["cave-vest-t2", "cave-charm-t2"],
  jungle: ["jungle-vest-t2", "jungle-charm-t2", "jungle-boots-t2"],
  desert: ["desert-vest-t2", "desert-charm-t2", "desert-boots-t2"],
};

/**
 * The tier-2 weapons each discipline crafts and wields, by the zone that makes them (its
 * weapons in bible §8.5; the Plains mace first for every discipline, since it is the only
 * tier-2 weapon before the first boss). PLACEHOLDER (OV-SQUIRE).
 */
export const SQUIRE_T2_WEAPONS: Readonly<Record<string, Partial<Record<SquireT2Biome, string>>>> = {
  "squire-avenger": { plains: "squire-flanged-mace-t2", forest: "squire-arming-sword-t2", cave: "squire-tower-shield-t2" },
  // The Bulwark takes the Warhammer into the plated Mountain boss (sim: 16% -> 42% HP left; live lost
  // twice in the mace, boss at 19% and 2%), then its own Tower Shield from the Cave on.
  "squire-bulwark": { plains: "squire-flanged-mace-t2", mountain: "squire-warhammer-t2", cave: "squire-tower-shield-t2" },
  "squire-juggernaut": { plains: "squire-flanged-mace-t2", mountain: "squire-warhammer-t2" },
};

/** Where the tutorial stops farming a T2 zone. */
export function squireT2TutorialFarmLevel(biome: SquireT2Biome): number {
  return biomeLevelCap(2, biome);
}

/** The biome level at which a T2 zone teaches its lesson (an absolute level, as the game counts). */
export function squireT2LessonLevel(biome: SquireT2Biome): number {
  return absoluteZoneLevel({ kind: "zone", biome: biome as KitBiome, tier: 2, level: SQUIRE_LESSON_LEVEL });
}

/** Everything the route crafts and wears in a T2 zone for this discipline. */
export function squireT2ZoneGear(disciplineId: string, biome: SquireT2Biome): string[] {
  const weapon = SQUIRE_T2_WEAPONS[disciplineId]?.[biome];
  return [...(weapon ? [weapon] : []), ...SQUIRE_T2_ZONE_GEAR[biome]];
}

function biomeRef(biome: SquireT2Biome): NodeRef {
  return { kind: "biome", biomeGroup: biome, tier: 2, pick: "uncleared" };
}

function farmZone(disciplineId: string, biome: SquireT2Biome): RouteStep[] {
  return farmWearingGear(biomeRef(biome), biome, squireT2TutorialFarmLevel(biome),
    squireT2ZoneGear(disciplineId, biome), `farm the tier 2 ${biome}`);
}

export function squireT2Route(disciplineId: string = SQUIRE_T2_DISCIPLINE): Route {
  const t1 = squireT1Route();
  const bossCleared = (biome: SquireT2Biome): Condition => ({ type: "bossCleared", biomeGroup: biome, tier: 2 });
  return {
    id: SQUIRE_T2_ID,
    version: "1.1.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T2: the T1 route to tier 2, a discipline, then every T2 zone farmed to the tier cap wearing its gear, and its boss.",
    steps: [
      ...t1.steps,
      { type: "unlockSkill", skillId: disciplineId, label: "pick the discipline" },
      ...SQUIRE_T2_BIOMES.flatMap((biome): RouteStep[] => [
        ...farmZone(disciplineId, biome),
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
