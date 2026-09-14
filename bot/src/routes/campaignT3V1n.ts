import { allOf, type Route } from "../route/types";
import { NIGHT2_TRAVEL_BUILD } from "./campaignNight2Bridge";

/** Independent initial T3 pressure screens; no purchases or automatic retries. */
export const CAMPAIGN_T3_V1N_ROUTES: Route[] = ["volcanic", "tundra"].map(biomeGroup => {
  const sanctuary = { kind: "node" as const, nodeId: "node-t3-sanctuary" };
  const at = { kind: "biome" as const, biomeGroup, tier: 3, pick: "first" as const };
  const recovered = { type: "fullyRecovered" as const };
  return {
    id: `spirit-${biomeGroup}-t3-v1n`, version: "1.0.0", classRoot: "energy-root",
    frameId: "energy-heavy", startsFromTierEntry: 3, stopOnFirstDeath: true,
    suppressTransitCombat: true, captureTier2Handoff: true,
    description: `Earned Wisp checkpoint: five minutes of ${biomeGroup} T3 farming, then recovered Sanctuary return.`,
    steps: [
      { type: "configureBuild", build: NIGHT2_TRAVEL_BUILD },
      { type: "farm", at: sanctuary, until: recovered, stepTimeoutMs: 180_000 },
      { type: "milestone", id: `v1n:${biomeGroup}:ready` },
      { type: "travel", to: at },
      { type: "milestone", id: `v1n:${biomeGroup}:arrived` },
      { type: "farm", at, until: recovered, observeForMs: 300_000, stepTimeoutMs: 420_000,
        label: `v1n:${biomeGroup}:farm` },
      { type: "milestone", id: `v1n:${biomeGroup}:farm-complete` },
      { type: "travel", to: sanctuary },
      { type: "farm", at: sanctuary, until: recovered, observeForMs: 20_000, stepTimeoutMs: 180_000 },
      { type: "assert", condition: recovered },
    ],
    completion: allOf({ type: "playerTierAtLeast", tier: 3 }, recovered), milestones: [],
  };
});
