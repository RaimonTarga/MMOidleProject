import {
  biomeLevelCap,
  CLEARING_NODE_ID,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  type ClassConfig,
  type T1Biome,
} from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";

/** The Spirit's T1 route: auto Thresholds (§11.13), the guide's zones, both seals. */
export const SPIRIT_T1_ID = "spirit-t1";
export const SPIRIT_CLASS_ROOT = "energy-root";

/** The T1 lesson level, shared by the tutorial and the class kit. */
const LESSON_LEVEL = 2;
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;
const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };

/** The guide fights Plains first and Mountain after Forest, Swamp and Cave. */
const ZONE_ORDER: readonly T1Biome[] = [
  FIRST_SEAL,
  ...T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL),
  SECOND_SEAL,
];

function zone(biomeGroup: T1Biome): NodeRef {
  return { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" };
}

/** Mountain stops at Eye of the Storm; the other farms end at the T1 cap. */
export function spiritFarmLevel(biomeGroup: T1Biome): number {
  return biomeGroup === SECOND_SEAL ? LESSON_LEVEL : biomeLevelCap(1, biomeGroup);
}

/**
 * Valid before the first lesson: only Bolt, a 30% floor and gather, no trophy.
 * Auto lets the server rebuild the bands and relic as lessons and seals arrive.
 */
function autoThresholds(): ClassConfig {
  return {
    mode: "auto",
    relic: [],
    system: {
      kind: "thresholds",
      floorPct: 30,
      bands: [{ pieceId: "spirit-bolt", atLeastPct: 30 }],
      phase: "gather",
    },
  };
}

export function spiritT1Route(): Route {
  const steps: RouteStep[] = [
    { type: "travel", to: CLEARING },
    {
      type: "farm",
      at: CLEARING,
      until: { type: "playerTierAtLeast", tier: 1 },
      label: "clear the tier-0 quest",
    },
    { type: "chooseClass", skillId: SPIRIT_CLASS_ROOT },
    { type: "classConfig", config: autoThresholds() },
  ];
  const milestones: Route["milestones"] = [
    { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
    { id: "class-chosen", when: { type: "classSelected" } },
  ];

  for (const biomeGroup of ZONE_ORDER) {
    const at = zone(biomeGroup);
    const level = spiritFarmLevel(biomeGroup);
    steps.push(
      { type: "travel", to: at },
      { type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup, level } },
    );
    milestones.push({
      id: `${biomeGroup}-lesson`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level: LESSON_LEVEL },
    });
    if (level !== LESSON_LEVEL) {
      milestones.push({
        id: `${biomeGroup}-level-${level}`,
        when: { type: "biomeLevelAtLeast", biomeGroup, level },
      });
    }
    if (biomeGroup === FIRST_SEAL || biomeGroup === SECOND_SEAL) {
      steps.push({ type: "attemptBoss", biomeGroup, tier: 1 });
      milestones.push({
        id: `${biomeGroup}-seal`,
        when: { type: "bossCleared", biomeGroup, tier: 1 },
      });
    }
  }

  steps.push({
    type: "farm",
    at: zone(SECOND_SEAL),
    until: { type: "playerTierAtLeast", tier: 2 },
    label: "wait for the tier-2 promotion",
  });
  milestones.push({ id: "tier-2", when: { type: "playerTierAtLeast", tier: 2 } });

  return {
    id: SPIRIT_T1_ID,
    version: "1.0.0",
    classRoot: SPIRIT_CLASS_ROOT,
    description:
      "Spirit T1: the tier-0 quest, auto Thresholds, each T1 zone to the guide's level, " +
      "the Plains and Mountain seals, and tier-2 promotion.",
    steps,
    completion: allOf(
      { type: "bossCleared", biomeGroup: FIRST_SEAL, tier: 1 },
      { type: "bossCleared", biomeGroup: SECOND_SEAL, tier: 1 },
      { type: "playerTierAtLeast", tier: 2 },
    ),
    milestones,
  };
}
