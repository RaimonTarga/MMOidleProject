import {
  absoluteZoneLevel,
  biomeLevelCap,
  SPIRIT_KIT,
  type KitBiome,
} from "@mmo-idle/shared";
import { allOf, type Condition, type NodeRef, type Route, type RouteStep } from "../route/types";
import { SPIRIT_CLASS_ROOT, spiritT1Route } from "./spiritT1";

/**
 * The Spirit's T2 route (T2-W2): the T1 route through promotion, a discipline from
 * the Passive Tree, then each T2 zone farmed to the guide's level and its boss.
 * The zones run in the bible's table order (§11.16). Thresholds stay in `auto`
 * mode, so the server fields the T2 pieces, the discipline's piece and the trophy ranks.
 */
export const SPIRIT_T2_ID = "spirit-t2";

/** Overflow, Tide or Reservoir. Tide is the balanced middle (bible §11.5); a placeholder pick. */
export const SPIRIT_T2_DISCIPLINE = "spirit-tide";

/** Each zone and the piece its T2 lesson teaches (a rank-up or a new piece). */
export const SPIRIT_T2_ZONES: ReadonlyArray<{ biome: KitBiome; pieceId: string }> = [
  { biome: "plains", pieceId: "spirit-gale" },
  { biome: "forest", pieceId: "spirit-thunderclap" },
  { biome: "mountain", pieceId: "spirit-hailstorm" },
  { biome: "swamp", pieceId: "spirit-downpour" },
  { biome: "cave", pieceId: "spirit-updraft" },
  { biome: "jungle", pieceId: "spirit-flare" },
  { biome: "desert", pieceId: "spirit-dust-devil" },
];

/** The biome level where a zone's T2 lesson lands (levels run across tiers). */
export function spiritT2LessonLevel(biome: KitBiome, pieceId: string): number {
  for (const lesson of SPIRIT_KIT.lessons) {
    if (lesson.pieceId === pieceId && lesson.source.kind === "zone" && lesson.source.tier === 2 && lesson.source.biome === biome) {
      return absoluteZoneLevel(lesson.source);
    }
  }
  throw new Error(`spirit-t2: no T2 lesson for ${pieceId} in ${biome}`);
}

/** A T2 zone is farmed to its tier-2 cap, as the guide does, before its boss. */
export function spiritT2FarmLevel(biome: KitBiome): number {
  return biomeLevelCap(2, biome);
}

function zone(biomeGroup: KitBiome): NodeRef {
  return { kind: "biome", biomeGroup, tier: 2, pick: "uncleared" };
}

export function spiritT2Route(): Route {
  const t1 = spiritT1Route();
  const disciplinePiece = SPIRIT_KIT.lessons.find((lesson) =>
    lesson.source.kind === "discipline" && lesson.source.disciplineId === SPIRIT_T2_DISCIPLINE)?.pieceId;
  if (!disciplinePiece) throw new Error(`spirit-t2: ${SPIRIT_T2_DISCIPLINE} has no discipline piece`);
  const picked: Condition = { type: "pieceLearned", pieceId: disciplinePiece };

  const steps: RouteStep[] = [
    ...t1.steps,
    { type: "unlockSkill", skillId: SPIRIT_T2_DISCIPLINE, label: "pick a discipline" },
  ];
  const milestones: Route["milestones"] = [
    ...t1.milestones,
    { id: "discipline-picked", when: picked },
  ];
  const bosses: Condition[] = [];

  for (const { biome, pieceId } of SPIRIT_T2_ZONES) {
    const at = zone(biome);
    const lesson = spiritT2LessonLevel(biome, pieceId);
    const level = spiritT2FarmLevel(biome);
    steps.push(
      { type: "travel", to: at },
      { type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup: biome, level } },
      { type: "attemptBoss", biomeGroup: biome, tier: 2 },
    );
    milestones.push(
      { id: `${biome}-t2-lesson`, when: { type: "biomeLevelAtLeast", biomeGroup: biome, level: lesson } },
      { id: `${biome}-t2-level-${level}`, when: { type: "biomeLevelAtLeast", biomeGroup: biome, level } },
      { id: `${biome}-t2-boss`, when: { type: "bossCleared", biomeGroup: biome, tier: 2 } },
    );
    bosses.push({ type: "bossCleared", biomeGroup: biome, tier: 2 });
  }

  return {
    id: SPIRIT_T2_ID,
    version: "1.0.0",
    classRoot: SPIRIT_CLASS_ROOT,
    description:
      "Spirit T2: the T1 route, a discipline (Tide), each T2 zone to the guide's level, " +
      "and the seven T2 bosses.",
    steps,
    completion: allOf(picked, ...bosses),
    milestones,
  };
}
