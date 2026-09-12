import type { Route, RouteStep } from "../route/types";
import { CAMPAIGN_PLAINS_T1_BUILD } from "./campaignBoss";

const importedKit = ["chaotic-axe", "plains-vest-t1", "swamp-charm-t1", "plains-boots-t1"];
const checkItem = (definitionId: string, equipped = true): RouteStep[] => [
  ...(equipped ? [{ type: "assert" as const, condition: { type: "equipped" as const, definitionId } }] : []),
  { type: "assert", condition: { type: "itemAtLeastPlus", definitionId, plus: 5 } },
];
const entryGates: RouteStep[] = [
  { type: "assert", condition: { type: "not", of: { type: "playerTierAtLeast", tier: 2 } } },
  { type: "assert", condition: { type: "globalMasteryAtLeast", value: 30 } },
  ...importedKit.flatMap(id => checkItem(id)),
];

/** Earn the one missing endgame armor upgrade once, before independent probes. */
export const CAMPAIGN_NIGHT_KIT: Route = {
  id: "striker-campaign-night-kit-t1", version: "1.0.0", classRoot: "cadence-root",
  startsFromTierEntry: 1, suppressTransitCombat: true,
  description: "Earn Mountain armor +5 from the V1d state, retaining its equipped kit; no boss.",
  steps: [
    ...structuredClone(entryGates),
    { type: "upgrade", definitionId: "mountain-vest-t1", toPlus: 5 },
    { type: "configureBuild", build: structuredClone(CAMPAIGN_PLAINS_T1_BUILD), label: "night:kit-build" },
    { type: "milestone", id: "night:kit-ready" },
    ...checkItem("mountain-vest-t1", false),
  ],
  completion: { type: "itemAtLeastPlus", definitionId: "mountain-vest-t1", plus: 5 }, milestones: [],
};

export const CAMPAIGN_NIGHT_BOSSES: Route[] = ["plains", "forest", "swamp", "mountain", "cave"].map(group => {
  const armor = ["plains", "forest"].includes(group) ? "plains-vest-t1" : "mountain-vest-t1";
  const charm = group === "plains" ? "plains-charm-t1" : "swamp-charm-t1";
  const build = structuredClone(CAMPAIGN_PLAINS_T1_BUILD);
  build.abilities = { techniques: [group === "plains" ? "sweep" : "expose-weakness"], guards: [group === "swamp" ? "cleanse" : "second-wind"] };
  return {
    id: `striker-campaign-night-${group}-t1`, version: "1.0.0", classRoot: "cadence-root",
    startsFromTierEntry: 1, suppressTransitCombat: true,
    description: `Independent earned-state ${group} T1 probe; exact +5 kit, one dungeon cycle.`,
    steps: [
      ...structuredClone(entryGates), ...checkItem("mountain-vest-t1", false),
      ...(group === "plains" ? [{ type: "upgrade" as const, definitionId: charm, toPlus: 5 }] : []),
      { type: "equip", definitionIds: [armor, charm] },
      ...checkItem(armor), ...checkItem(charm),
      { type: "configureBuild", build, label: `night:${group}:build` },
      { type: "milestone", id: `night:${group}:ready` },
      { type: "attemptBoss", biomeGroup: group, tier: 1, maxAttempts: 1, label: `night:${group}:attempt` },
    ],
    completion: { type: "bossCleared", biomeGroup: group, tier: 1 }, milestones: [],
  };
});
