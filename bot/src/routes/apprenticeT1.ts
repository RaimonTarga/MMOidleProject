import {
  biomeLevelCap,
  CLEARING_NODE_ID,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
} from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";

/** AP6, bible §9.13: the server rebuilds auto Payoff rules as lessons arrive. */
export const APPRENTICE_T1_ID = "apprentice-t1";
export const APPRENTICE_CLASS_ROOT = "dot-root";

/** T1 lessons unlock at zone level 2, as in the guide and kit data. */
const LESSON_LEVEL = 2;
const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };
const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;
const ZONE_ORDER = [
  FIRST_SEAL,
  ...T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL),
  SECOND_SEAL,
];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" };
}

/** The guide farms the Mountain to Seize; the other zones reach their cap. */
function farmLevel(biomeGroup: string): number {
  return biomeGroup === SECOND_SEAL ? LESSON_LEVEL : biomeLevelCap(1, biomeGroup);
}

export function apprenticeT1Route(): Route {
  const steps: RouteStep[] = [
    { type: "travel", to: CLEARING },
    {
      type: "farm",
      at: CLEARING,
      until: { type: "playerTierAtLeast", tier: 1 },
      label: "clear the tier-0 quest",
    },
    { type: "chooseClass", skillId: APPRENTICE_CLASS_ROOT },
    {
      type: "classConfig",
      config: { mode: "auto", relic: [], system: { kind: "payoffs", placements: [] } },
    },
  ];

  for (const biomeGroup of ZONE_ORDER) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: farmLevel(biomeGroup) },
    });
    if (biomeGroup === FIRST_SEAL || biomeGroup === SECOND_SEAL) {
      steps.push({ type: "attemptBoss", biomeGroup, tier: 1 });
    }
  }
  steps.push({
    type: "farm",
    at: zone(SECOND_SEAL),
    until: { type: "playerTierAtLeast", tier: 2 },
    label: "wait for the tier-2 promotion",
  });

  const milestones: Route["milestones"] = [
    { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
    { id: "class-chosen", when: { type: "classSelected" } },
  ];
  for (const biomeGroup of ZONE_ORDER) {
    const level = farmLevel(biomeGroup);
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
      milestones.push({
        id: `${biomeGroup}-seal`,
        when: { type: "bossCleared", biomeGroup, tier: 1 },
      });
    }
  }
  milestones.push({ id: "tier-2", when: { type: "playerTierAtLeast", tier: 2 } });

  return {
    id: APPRENTICE_T1_ID,
    version: "1.0.0",
    classRoot: APPRENTICE_CLASS_ROOT,
    description:
      "Apprentice T1: the tier-0 quest, auto Payoff rules, the guide's zone levels, " +
      "then the Plains and Mountain seals and the tier-2 promotion.",
    steps,
    completion: allOf(
      { type: "bossCleared", biomeGroup: FIRST_SEAL, tier: 1 },
      { type: "bossCleared", biomeGroup: SECOND_SEAL, tier: 1 },
      { type: "playerTierAtLeast", tier: 2 },
    ),
    milestones,
  };
}
