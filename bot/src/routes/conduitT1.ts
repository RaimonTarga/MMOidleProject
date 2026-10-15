import {
  biomeLevelCap,
  classConfigContext,
  CLEARING_NODE_ID,
  defaultClassConfig,
  T1_BIOME_ORDER,
  TUTORIAL_SEALS,
  type ClassConfig,
} from "@mmo-idle/shared";
import { allOf, type NodeRef, type Route, type RouteStep } from "../route/types";

/**
 * The Conduit's T1 route (CD7, bible §7.13).
 *
 * The tier-0 quest, the Conduit, then `classConfig` in `auto` mode. The server
 * rebuilds that default as lessons and the first Soul arrive: the bound
 * specialists in role order (tank, damage, damage, support), then the Cave
 * heavy once it fits, and Thralls fill whatever Command is left. Right after
 * the class pick nothing else is bound, so the default is four Thralls and the
 * pre-set orders. The zones are the tutorial's: `T1_BIOME_ORDER`, with the two
 * seals fought where the guide fights them (Plains after its farm, Mountain
 * after Cave). Plains, Forest, Swamp and Cave are farmed to the tier cap. The
 * Mountain is farmed to the Ridge Marksman lesson, then its boss. Completion
 * is both seals and the tier-2 promotion.
 */
export const CONDUIT_T1_ID = "conduit-t1";

export const CONDUIT_CLASS_ROOT = "summoner-root";

/** The level a T1 zone binds its specialist (bible §7.4, `LESSON_ZONE_LEVEL`). */
const LESSON_LEVEL = 2;

const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };

const [FIRST_SEAL, SECOND_SEAL] = TUTORIAL_SEALS;

/** Walks in `T1_BIOME_ORDER`, with each seal placed where the guide fights it. */
const ZONE_ORDER: readonly string[] = [
  FIRST_SEAL,
  ...T1_BIOME_ORDER.filter((biome) => biome !== FIRST_SEAL && biome !== SECOND_SEAL),
  SECOND_SEAL,
];

function zone(biomeGroup: string): NodeRef {
  return { kind: "biome", biomeGroup, tier: 1, pick: "uncleared" };
}

/** How far the guided route farms this zone before it moves on. */
export function conduitFarmLevel(biomeGroup: string): number {
  return biomeGroup === SECOND_SEAL ? LESSON_LEVEL : biomeLevelCap(1, biomeGroup);
}

/**
 * `auto` hands the Formation back to the class default. This is that default
 * for a fresh Conduit: no specialist bound, no Soul yet. A frozen roster would
 * not pick up the Warden, the later specialists, or the Soul.
 */
function autoFormation(): ClassConfig {
  return defaultClassConfig(classConfigContext("summoner", {
    biomeLevel: {},
    bossesCleared: [],
    disciplineId: null,
  }, 0));
}

export function conduitT1Route(): Route {
  const steps: RouteStep[] = [
    { type: "travel", to: CLEARING },
    {
      type: "farm",
      at: CLEARING,
      until: { type: "playerTierAtLeast", tier: 1 },
      label: "clear the tier-0 quest",
    },
    { type: "chooseClass", skillId: CONDUIT_CLASS_ROOT },
    { type: "classConfig", config: autoFormation() },
  ];

  for (const biomeGroup of ZONE_ORDER) {
    const at = zone(biomeGroup);
    steps.push({ type: "travel", to: at });
    steps.push({
      type: "farm",
      at,
      until: { type: "biomeLevelAtLeast", biomeGroup, level: conduitFarmLevel(biomeGroup) },
    });
    if (biomeGroup === FIRST_SEAL || biomeGroup === SECOND_SEAL) {
      steps.push({ type: "attemptBoss", biomeGroup, tier: 1 });
    }
  }

  // The guide's farewell: two seals promote to tier 2. If the kill already did,
  // this step is already done.
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
    const level = conduitFarmLevel(biomeGroup);
    if (level !== LESSON_LEVEL) {
      milestones.push({
        id: `${biomeGroup}-lesson`,
        when: { type: "biomeLevelAtLeast", biomeGroup, level: LESSON_LEVEL },
      });
    }
    milestones.push({
      id: `${biomeGroup}-level-${level}`,
      when: { type: "biomeLevelAtLeast", biomeGroup, level },
    });
    if (biomeGroup === FIRST_SEAL || biomeGroup === SECOND_SEAL) {
      milestones.push({
        id: `${biomeGroup}-seal`,
        when: { type: "bossCleared", biomeGroup, tier: 1 },
      });
    }
  }
  milestones.push({ id: "tier-2", when: { type: "playerTierAtLeast", tier: 2 } });

  return {
    id: CONDUIT_T1_ID,
    version: "1.0.0",
    classRoot: CONDUIT_CLASS_ROOT,
    description:
      "Conduit T1: the tier-0 quest, the class, an auto Formation, each T1 zone to the " +
      "level the guide farms, then the Plains seal and the Mountain seal.",
    steps,
    completion: allOf(
      { type: "bossCleared", biomeGroup: FIRST_SEAL, tier: 1 },
      { type: "bossCleared", biomeGroup: SECOND_SEAL, tier: 1 },
      { type: "playerTierAtLeast", tier: 2 },
    ),
    milestones,
  };
}
