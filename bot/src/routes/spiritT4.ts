import {
  absoluteZoneLevel,
  biomeLevelCap,
  SPIRIT_KIT,
  type KitBiome,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { spiritRouteId, SPIRIT_DISCIPLINE_NAME, SPIRIT_T2_DISCIPLINE } from "./spiritT2";
import { SPIRIT_T3_ZONES, spiritT3Route } from "./spiritT3";
import { SPIRIT_CLASS_ROOT, wearZoneGear } from "./spiritT1";

/**
 * The Spirit's T4 route (T4-W2): the T3 route, the tier-4 promotion, a leaf from the Passive Tree
 * (under the T2 discipline), then each T4 zone farmed to the guide's level and its boss, in the
 * bible's table order (§11.16; the Swamp and Cave have retired, the Wasteland and Trench are new).
 * Thresholds stay in `auto` mode, so the server fields the T4 pieces and trophy ranks. Never run
 * live yet, so it is not in the controlled batch.
 */
export const SPIRIT_T4_ID = "spirit-t4";

/** One of the discipline's leaves. Wading (Tide, swarm) is a placeholder pick. */
export const SPIRIT_T4_LEAF = "spirit-wading";

/**
 * Each discipline's T4 leaf (OV2, PLACEHOLDER): the answer to what empties the storm at a boss,
 * a sustained pressure (Static Field for Overflow, Dam for Reservoir).
 */
export const SPIRIT_T4_LEAVES: Readonly<Record<string, string>> = {
  "spirit-tide": SPIRIT_T4_LEAF,
  "spirit-overflow": "spirit-static-field",
  "spirit-reservoir": "spirit-dam",
};

/** Each T4 zone and the piece its lesson teaches (a rank-up, a sidegrade or a new piece). */
export const SPIRIT_T4_ZONES: ReadonlyArray<{ biome: KitBiome; pieceId: string }> = [
  { biome: "mountain", pieceId: "spirit-downburst" },
  { biome: "tundra", pieceId: "spirit-sleet" },
  { biome: "jungle", pieceId: "spirit-ground-charge" },
  { biome: "desert", pieceId: "spirit-dust-wall" },
  { biome: "volcanic", pieceId: "spirit-ash-lightning" },
  { biome: "graveyard", pieceId: "spirit-thunderstorm" },
  { biome: "trench", pieceId: "spirit-maelstrom" },
];

/**
 * What the Spirit wears from each T4 zone, in unlock order. PLACEHOLDER picks, each an upgrade
 * for this class: the Mountain set meets the first T4 boss; the Tundra's charm, the Desert's boots,
 * and the Volcanic's Flash Steam vest and Thermal charm for the Heat race follow.
 */
export const SPIRIT_T4_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["spirit-summit-staff-t4", "mountain-vest-t4", "mountain-charm-t4", "mountain-boots-t4"],
  tundra: ["tundra-charm-t4"],
  jungle: [],
  desert: ["desert-boots-t4"],
  volcanic: ["volcanic-vest-t4", "volcanic-charm-t4"],
  graveyard: [],
  trench: [],
};

/** The biome level where a zone's T4 lesson lands (levels run across tiers). */
export function spiritT4LessonLevel(biome: KitBiome, pieceId: string): number {
  for (const lesson of SPIRIT_KIT.lessons) {
    if (lesson.pieceId === pieceId && lesson.source.kind === "zone" && lesson.source.tier === 4 && lesson.source.biome === biome) {
      return absoluteZoneLevel(lesson.source);
    }
  }
  throw new Error(`spirit-t4: no T4 lesson for ${pieceId} in ${biome}`);
}

/** A T4 zone is farmed to its tier-4 cap, as the guide does, before its boss. */
export function spiritT4FarmLevel(biome: KitBiome): number {
  return biomeLevelCap(4, biome);
}

function zone(biomeGroup: KitBiome): NodeRef {
  return { kind: "biome", biomeGroup, tier: 4, pick: "uncleared" };
}

export function spiritT4Route(disciplineId = SPIRIT_T2_DISCIPLINE): Route {
  const t3 = spiritT3Route(disciplineId);
  const id = spiritRouteId(4, disciplineId);
  const leafId = SPIRIT_T4_LEAVES[disciplineId];
  const leaf = SPIRIT_KIT.leaves.find((entry) => entry.id === leafId);
  if (!leaf || leaf.disciplineId !== disciplineId) {
    throw new Error(`${id}: ${leafId} is not under ${disciplineId}`);
  }
  // Wait out the tier-4 promotion where the T3 route ended.
  const lastT3 = SPIRIT_T3_ZONES[SPIRIT_T3_ZONES.length - 1].biome;
  const steps: RouteStep[] = [
    ...t3.steps,
    {
      type: "farm",
      at: { kind: "biome", biomeGroup: lastT3, tier: 3, pick: "uncleared" },
      until: { type: "playerTierAtLeast", tier: 4 },
      label: "wait for the tier-4 promotion",
    },
    { type: "unlockSkill", skillId: leaf.id, label: "pick a leaf" },
  ];
  const milestones: Route["milestones"] = [
    ...t3.milestones,
    { id: "tier-4", when: { type: "playerTierAtLeast", tier: 4 } },
  ];
  const bosses: Condition[] = [];

  for (const { biome, pieceId } of SPIRIT_T4_ZONES) {
    const at = zone(biome);
    const lesson = spiritT4LessonLevel(biome, pieceId);
    const level = spiritT4FarmLevel(biome);
    steps.push(
      { type: "travel", to: at },
      ...wearZoneGear(at, 4, SPIRIT_T4_GEAR[biome] ?? [], "T4 " + biome),
      { type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup: biome, level } },
      { type: "attemptBoss", biomeGroup: biome, tier: 4 },
    );
    milestones.push(
      { id: `${biome}-t4-lesson`, when: { type: "biomeLevelAtLeast", biomeGroup: biome, level: lesson } },
      { id: `${biome}-t4-level-${level}`, when: { type: "biomeLevelAtLeast", biomeGroup: biome, level } },
      { id: `${biome}-t4-boss`, when: { type: "bossCleared", biomeGroup: biome, tier: 4 } },
    );
    bosses.push({ type: "bossCleared", biomeGroup: biome, tier: 4 });
  }

  return {
    id,
    version: "1.0.0",
    classRoot: SPIRIT_CLASS_ROOT,
    description:
      `Spirit T4: the T3 route, the tier-4 promotion, a leaf (${SPIRIT_DISCIPLINE_NAME[disciplineId]}: ${leaf.name}), each T4 zone ` +
      "to the guide's level, and the seven T4 bosses.",
    steps,
    completion: allOf(t3.completion, ...bosses),
    milestones,
  };
}
