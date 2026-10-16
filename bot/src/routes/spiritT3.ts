import {
  absoluteZoneLevel,
  biomeLevelCap,
  SPIRIT_KIT,
  type KitBiome,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { spiritT2Route, SPIRIT_T2_DISCIPLINE, SPIRIT_T2_ZONES } from "./spiritT2";
import { SPIRIT_CLASS_ROOT, wearZoneGear } from "./spiritT1";

/**
 * The Spirit's T3 route (T3-W2): the T2 route, the tier-3 promotion, a specialization from the
 * Passive Tree (under the T2 discipline), then each T3 zone farmed to the guide's level and its
 * boss, in the bible's table order (§11.16). Thresholds stay in `auto` mode, so the server fields
 * the T3 pieces and trophy ranks. Never run live yet, so it is not in the controlled batch.
 */
export const SPIRIT_T3_ID = "spirit-t3";

/** One of the discipline's three specializations. Spring Tide (Tide) is a placeholder pick. */
export const SPIRIT_T3_SPECIALIZATION = "spirit-spring-tide";

/** Each T3 zone and the piece its lesson teaches (a rank-up or a new piece). */
export const SPIRIT_T3_ZONES: ReadonlyArray<{ biome: KitBiome; pieceId: string }> = [
  { biome: "mountain", pieceId: "spirit-downburst" },
  { biome: "cave", pieceId: "spirit-updraft" },
  { biome: "swamp", pieceId: "spirit-tailwind" },
  { biome: "jungle", pieceId: "spirit-forked-bolt" },
  { biome: "desert", pieceId: "spirit-dust-devil" },
  { biome: "tundra", pieceId: "spirit-foehn" },
  { biome: "volcanic", pieceId: "spirit-ash-lightning" },
];

/**
 * What the Spirit wears from each T3 zone, in unlock order. PLACEHOLDER picks, each an upgrade
 * for this class: the Mountain set meets the first T3 boss; the Cave's heavy vest, charm and
 * boots, the Jungle's charm and boots, the Desert's boots, and the Volcanic's Flash Steam vest
 * and Thermal charm for the Heat race (fire hits drain the storm at half cost) follow.
 */
export const SPIRIT_T3_GEAR: Readonly<Record<string, readonly string[]>> = {
  mountain: ["spirit-summit-staff-t3", "mountain-vest-t3", "mountain-charm-t3", "mountain-boots-t3"],
  cave: ["cave-vest-t3", "cave-charm-t3", "cave-boots-t3"],
  swamp: [],
  jungle: ["jungle-charm-t3", "jungle-boots-t3"],
  desert: ["desert-boots-t3"],
  tundra: [],
  volcanic: ["volcanic-vest-t3", "volcanic-charm-t3"],
};

/** The biome level where a zone's T3 lesson lands (levels run across tiers). */
export function spiritT3LessonLevel(biome: KitBiome, pieceId: string): number {
  for (const lesson of SPIRIT_KIT.lessons) {
    if (lesson.pieceId === pieceId && lesson.source.kind === "zone" && lesson.source.tier === 3 && lesson.source.biome === biome) {
      return absoluteZoneLevel(lesson.source);
    }
  }
  throw new Error(`spirit-t3: no T3 lesson for ${pieceId} in ${biome}`);
}

/** A T3 zone is farmed to its tier-3 cap, as the guide does, before its boss. */
export function spiritT3FarmLevel(biome: KitBiome): number {
  return biomeLevelCap(3, biome);
}

function zone(biomeGroup: KitBiome): NodeRef {
  return { kind: "biome", biomeGroup, tier: 3, pick: "uncleared" };
}

export function spiritT3Route(): Route {
  const t2 = spiritT2Route();
  const spec = SPIRIT_KIT.specializations.find((entry) => entry.id === SPIRIT_T3_SPECIALIZATION);
  if (!spec || spec.disciplineId !== SPIRIT_T2_DISCIPLINE) {
    throw new Error(`spirit-t3: ${SPIRIT_T3_SPECIALIZATION} is not under ${SPIRIT_T2_DISCIPLINE}`);
  }
  // Wait out the tier-3 promotion where the T2 route ended, as the T1 route does for tier 2.
  const lastT2 = SPIRIT_T2_ZONES[SPIRIT_T2_ZONES.length - 1].biome;
  const steps: RouteStep[] = [
    ...t2.steps,
    {
      type: "farm",
      at: { kind: "biome", biomeGroup: lastT2, tier: 2, pick: "uncleared" },
      until: { type: "playerTierAtLeast", tier: 3 },
      label: "wait for the tier-3 promotion",
    },
    { type: "unlockSkill", skillId: SPIRIT_T3_SPECIALIZATION, label: "pick a specialization" },
  ];
  const milestones: Route["milestones"] = [
    ...t2.milestones,
    { id: "tier-3", when: { type: "playerTierAtLeast", tier: 3 } },
  ];
  const bosses: Condition[] = [];

  for (const { biome, pieceId } of SPIRIT_T3_ZONES) {
    const at = zone(biome);
    const lesson = spiritT3LessonLevel(biome, pieceId);
    const level = spiritT3FarmLevel(biome);
    steps.push(
      { type: "travel", to: at },
      ...wearZoneGear(at, 3, SPIRIT_T3_GEAR[biome] ?? [], "T3 " + biome),
      { type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup: biome, level } },
      { type: "attemptBoss", biomeGroup: biome, tier: 3 },
    );
    milestones.push(
      { id: `${biome}-t3-lesson`, when: { type: "biomeLevelAtLeast", biomeGroup: biome, level: lesson } },
      { id: `${biome}-t3-level-${level}`, when: { type: "biomeLevelAtLeast", biomeGroup: biome, level } },
      { id: `${biome}-t3-boss`, when: { type: "bossCleared", biomeGroup: biome, tier: 3 } },
    );
    bosses.push({ type: "bossCleared", biomeGroup: biome, tier: 3 });
  }

  return {
    id: SPIRIT_T3_ID,
    version: "1.0.0",
    classRoot: SPIRIT_CLASS_ROOT,
    description:
      "Spirit T3: the T2 route, the tier-3 promotion, a specialization (Spring Tide), each T3 zone " +
      "to the guide's level, and the seven T3 bosses.",
    steps,
    completion: allOf(t2.completion, ...bosses),
    milestones,
  };
}
