import { GAME_CONFIG } from "@mmo-idle/shared";
import type { Condition } from "../route/types";
import type { DesiredBuild } from "../loadout/loadout";
import { allOf, type Route, type RouteStep } from "../route/types";
import { CAMPAIGN_T4_V1Z } from "./campaignT4V1z";
import { V1V_BOSS_BUILD, V1V_TRAVEL_BUILD } from "./campaignT3V1v";
import { V1W_CASES } from "./campaignT3V1w";

const hub = "node-t4-sanctuary";
const recovered = { type: "fullyRecovered" as const };
const jungleBuild = V1W_CASES.find((entry) => entry.group === "jungle")!.build;

/**
 * Fixed, source-reviewed paths for the six remaining T4 dungeon screens.
 * These are authored route hops, not a request to search for a better route at
 * run time. The executor still records the authoritative transit plan for each
 * hop, so a map or hazard discrepancy remains visible in the artifact.
 */
export const T4_VALIDATION_BOSS_CASES = [
  {
    group: "jungle",
    path: [
      hub,
      "node-t4-mountain-05",
      "node-t4-tundra-05",
      "node-t4-mountain-03",
      "node-t4-mountain-02",
      "node-t4-jungle-dungeon",
    ],
    bossId: "verdant-crown-predator",
    bossName: "Verdant-Crown Predator",
    guardId: "jungle-t4-guard",
    guardianTotal: 9,
    build: jungleBuild,
  },
  {
    group: "desert",
    path: [
      hub,
      "node-t4-mountain-05",
      "node-t4-tundra-05",
      "node-t4-tundra-03",
      "node-t4-tundra-01",
      "node-t4-desert-dungeon",
    ],
    bossId: "dune-throne-sovereign",
    bossName: "Dune-Throne Sovereign",
    guardId: "desert-t4-guard",
    guardianTotal: 3,
    build: V1V_BOSS_BUILD,
  },
  {
    group: "tundra",
    path: [
      hub,
      "node-t4-mountain-05",
      "node-t4-tundra-05",
      "node-t4-tundra-04",
      "node-t4-tundra-02",
      "node-t4-tundra-dungeon",
    ],
    bossId: "glacial-patriarch",
    bossName: "Glacial Patriarch",
    guardId: "tundra-t4-guard",
    guardianTotal: 3,
    build: V1V_BOSS_BUILD,
  },
  {
    group: "trench",
    path: [
      hub,
      "node-t4-trench-05",
      "node-t4-graveyard-04",
      "node-t4-trench-06",
      "node-t4-trench-01",
      "node-t4-trench-dungeon",
    ],
    bossId: "elder-trench-serpent",
    bossName: "Elder Trench Serpent",
    guardId: "trench-t4-guard",
    guardianTotal: 2,
    build: V1V_BOSS_BUILD,
  },
  {
    group: "graveyard",
    path: [
      hub,
      "node-t4-trench-05",
      "node-t4-graveyard-04",
      "node-t4-graveyard-05",
      "node-t4-graveyard-02",
      "node-t4-graveyard-01",
      "node-t4-graveyard-dungeon",
    ],
    bossId: "charnel-crown-sovereign",
    bossName: "Charnel-Crown Sovereign",
    guardId: "graveyard-t4-guard",
    guardianTotal: 9,
    build: jungleBuild,
  },
  {
    group: "volcanic",
    path: [
      hub,
      "node-t4-trench-05",
      "node-t4-graveyard-04",
      "node-t4-graveyard-05",
      "node-t4-volcanic-06",
      "node-t4-volcanic-02",
      "node-t4-volcanic-dungeon",
    ],
    bossId: "caldera-sovereign",
    bossName: "Caldera Sovereign",
    guardId: "volcanic-t4-guard",
    guardianTotal: 9,
    build: jungleBuild,
  },
] as const satisfies ReadonlyArray<{
  group: string;
  path: readonly string[];
  bossId: string;
  bossName: string;
  guardId: string;
  guardianTotal: number;
  build: DesiredBuild;
}>;

const mountainReturnEntry: Route["progressionEntry"] = {
  boundaryId: "night3-mountain-control-r1-returned",
  nodeId: hub,
  tier: 4,
  revisionPolicy: "explicit-current-revision",
  prerequisites: [
    recovered,
    { type: "globalMasteryAtLeast", value: 132 },
    { type: "bossCleared", biomeGroup: "mountain", tier: 4 },
    ...["mountain-vest-t4", "mountain-charm-t4"].flatMap((definitionId) => [
      { type: "equipped" as const, definitionId },
      { type: "itemAtLeastPlus" as const, definitionId, plus: 2 },
    ]),
  ],
};

function walk(path: readonly string[]): RouteStep[] {
  return path.slice(1).map((nodeId) => ({
    type: "travel" as const,
    to: { kind: "node" as const, nodeId },
    stepTimeoutMs: 180_000,
  }));
}

function rest(): RouteStep[] {
  return [
    {
      type: "moveWithinNode",
      nodeId: hub,
      position: { x: GAME_CONFIG.NODE_WIDTH / 2, y: GAME_CONFIG.NODE_HEIGHT / 2 },
      stepTimeoutMs: 45_000,
    },
    {
      type: "farm",
      at: { kind: "node", nodeId: hub },
      until: recovered,
      observeForMs: 10_000,
      stepTimeoutMs: 180_000,
    },
  ];
}

function bossEntry(group: string): Route["progressionEntry"] {
  const victory: Condition = { type: "bossCleared", biomeGroup: group, tier: 4 };
  return {
    ...mountainReturnEntry!,
    prerequisites: [...mountainReturnEntry!.prerequisites, { type: "not", of: victory }],
  };
}

/**
 * Stage 2 breadth packet: one ordinary, first-death-stop attempt per remaining
 * T4 dungeon. Every route restores the same declared Mountain-return capture;
 * no case consumes another case's seal or mastery.
 */
export const CAMPAIGN_T4_BOSS_COVERAGE_ROUTES: Route[] = T4_VALIDATION_BOSS_CASES.map((entry) => {
  const victory = { type: "bossCleared" as const, biomeGroup: entry.group, tier: 4 };
  const readyBoundary = `t4-exit-${entry.group}-ready`;
  const returnedBoundary = `t4-exit-${entry.group}-returned`;
  return {
    id: `t4-exit-${entry.group}-boss`,
    version: "1.0.0",
    classRoot: "energy-root",
    frameId: "energy-heavy",
    stopOnFirstDeath: true,
    suppressTransitCombat: true,
    description: `Validation exit: one independent T4 ${entry.group} boss attempt against ${entry.bossName}; no relic, no retry, return capture when safe.`,
    progressionEntry: bossEntry(entry.group),
    steps: [
      { type: "configureBuild", build: V1V_TRAVEL_BUILD },
      ...rest(),
      { type: "captureCheckpoint", boundaryId: readyBoundary },
      { type: "milestone", id: "approach-start" },
      ...walk(entry.path),
      { type: "milestone", id: "dungeon-arrival" },
      { type: "configureBuild", build: entry.build },
      { type: "milestone", id: "measurement-start" },
      {
        type: "attemptBoss",
        biomeGroup: entry.group,
        tier: 4,
        maxAttempts: 1,
        stepTimeoutMs: 720_000,
      },
      { type: "assert", condition: victory },
      { type: "milestone", id: "boss-defeated" },
      { type: "configureBuild", build: V1V_TRAVEL_BUILD },
      { type: "milestone", id: "return-start" },
      ...walk([...entry.path].reverse()),
      ...rest(),
      { type: "captureCheckpoint", boundaryId: returnedBoundary },
      { type: "assert", condition: recovered },
    ],
    completion: allOf(recovered, victory),
    milestones: [],
  };
});

export const T4_VOLCANO_DIAGNOSTIC_PATH = [
  hub,
  "node-t4-trench-05",
  "node-t4-graveyard-03",
  "node-t4-volcanic-05",
] as const;

/**
 * Stage 1 bounded replay of the original empty-relic Volcano control. The
 * route is intentionally a new-world replay when launched: the restored
 * progression and source are fixed, while encounter seed/world occupancy are
 * recorded as a confounder rather than silently treated as identical to Night3.
 */
export const CAMPAIGN_T4_VOLCANO_DIAGNOSTIC: Route = {
  id: "t4-exit-volcanic-control-diagnostic",
  version: "1.0.0",
  classRoot: "energy-root",
  frameId: "energy-heavy",
  stopOnFirstDeath: true,
  suppressTransitCombat: true,
  description: "Validation exit: bounded empty-relic Volcano control replay with event-triggered productive-activity diagnostics; no relic comparison.",
  progressionEntry: {
    ...CAMPAIGN_T4_V1Z.progressionEntry!,
    boundaryId: "v1z-plus2-prepared-returned",
    prerequisites: [
      recovered,
      { type: "globalMasteryAtLeast", value: 132 },
      ...["mountain-vest-t4", "mountain-charm-t4"].flatMap((definitionId) => [
        { type: "equipped" as const, definitionId },
        { type: "itemAtLeastPlus" as const, definitionId, plus: 2 },
      ]),
      { type: "not", of: { type: "bossCleared" as const, biomeGroup: "mountain", tier: 4 } },
    ],
  },
  steps: [
    { type: "configureBuild", build: V1V_TRAVEL_BUILD },
    ...rest(),
    { type: "captureCheckpoint", boundaryId: "t4-exit-volcanic-diagnostic-ready" },
    { type: "milestone", id: "approach-start" },
    ...walk(T4_VOLCANO_DIAGNOSTIC_PATH),
    { type: "milestone", id: "target-arrival" },
    { type: "configureBuild", build: jungleBuild },
    { type: "milestone", id: "measurement-start" },
    {
      type: "farm",
      at: { kind: "node", nodeId: T4_VOLCANO_DIAGNOSTIC_PATH.at(-1)! },
      until: { type: "elapsedMs", ms: 0 },
      observeForMs: 600_000,
      stepTimeoutMs: 720_000,
      stallAfterMs: 720_000,
    },
    { type: "milestone", id: "measurement-end" },
    { type: "configureBuild", build: V1V_TRAVEL_BUILD },
    { type: "milestone", id: "return-start" },
    ...walk([...T4_VOLCANO_DIAGNOSTIC_PATH].reverse()),
    ...rest(),
    { type: "captureCheckpoint", boundaryId: "t4-exit-volcanic-diagnostic-returned" },
    { type: "assert", condition: recovered },
  ],
  completion: recovered,
  milestones: [],
};
