import {
  CLEARING_NODE_ID,
  T1_BIOME_ORDER,
  biomeLevelCap,
  type ClassConfig,
  type T1Biome,
} from "@mmo-idle/shared";
import type { NodeRef, Route, RouteStep } from "../route/types";

/**
 * The Squire's T1 balance route (`squire-t1`).
 *
 * The tier-0 quest, the class, then the Response rules in `auto` (the server
 * resolves the §8.13 default as each response is learned). Then every T1 zone
 * in `T1_BIOME_ORDER`, farmed to the level the Squire's tutorial finishes that
 * zone at: the tier cap, except the Mountain, which the guide farms only to
 * the lesson level so Guard is learned before the second seal. Then the Plains
 * seal and the Mountain seal. Two seals promote to tier 2.
 *
 * The guide fights the Plains boss before the later zones, and it also fights
 * the Grave Toadeater. This route does not: it is the balance path to both
 * seals, not a beat-for-beat replay.
 */
export const SQUIRE_T1_ID = "squire-t1";

export const SQUIRE_CLASS_ROOT = "cooldown-root";

/**
 * The second level of a tier. The class kits call this `LESSON_ZONE_LEVEL`:
 * the zone's response, around minute 6, always before its boss.
 */
export const SQUIRE_LESSON_LEVEL = 2;

/** Where the Squire's tutorial stops farming a zone. */
export function squireTutorialFarmLevel(biome: T1Biome): number {
  return biome === "mountain" ? SQUIRE_LESSON_LEVEL : biomeLevelCap(1, biome);
}

const CLEARING: NodeRef = { kind: "node", nodeId: CLEARING_NODE_ID };

/**
 * Sent once, right after the class pick. `auto` is rebuilt by the server as
 * lessons and trophies arrive; the empty rules are valid before any response
 * is learned, and the resolve step replaces them with the class default.
 */
const SQUIRE_AUTO: ClassConfig = {
  mode: "auto",
  relic: [],
  system: { kind: "responses", rules: [], groundTelegraphs: "step-out", holdSlam: [] },
};

function biomeRef(biome: T1Biome): NodeRef {
  return { kind: "biome", biomeGroup: biome, tier: 1, pick: "uncleared" };
}

function farmZone(biome: T1Biome): RouteStep {
  const level = squireTutorialFarmLevel(biome);
  return {
    type: "farm",
    at: biomeRef(biome),
    until: { type: "biomeLevelAtLeast", biomeGroup: biome, level },
    label: `farm the ${biome}`,
  };
}

export function squireT1Route(): Route {
  return {
    id: SQUIRE_T1_ID,
    version: "1.0.0",
    classRoot: SQUIRE_CLASS_ROOT,
    description:
      "Squire T1: the tier-0 quest, Response rules on auto, every T1 zone, then the Plains and Mountain seals.",
    steps: [
      { type: "travel", to: CLEARING },
      {
        type: "farm",
        at: CLEARING,
        until: { type: "playerTierAtLeast", tier: 1 },
        label: "clear the tier-0 quest",
      },
      { type: "chooseClass", skillId: SQUIRE_CLASS_ROOT },
      { type: "classConfig", config: SQUIRE_AUTO },
      ...T1_BIOME_ORDER.map(farmZone),
      { type: "attemptBoss", biomeGroup: "plains", tier: 1 },
      { type: "attemptBoss", biomeGroup: "mountain", tier: 1 },
    ],
    completion: { type: "playerTierAtLeast", tier: 2 },
    milestones: [
      { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
      { id: "class-chosen", when: { type: "classSelected" } },
      ...T1_BIOME_ORDER.map((biome) => ({
        id: `${biome}-farmed`,
        when: { type: "biomeLevelAtLeast" as const, biomeGroup: biome, level: squireTutorialFarmLevel(biome) },
      })),
      { id: "plains-seal", when: { type: "bossCleared", biomeGroup: "plains", tier: 1 } },
      { id: "mountain-seal", when: { type: "bossCleared", biomeGroup: "mountain", tier: 1 } },
    ],
  };
}
