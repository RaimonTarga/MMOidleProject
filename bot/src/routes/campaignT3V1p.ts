import { allOf, type Route } from "../route/types";
import { NIGHT2_TRAVEL_BUILD } from "./campaignNight2Bridge";
import type { DesiredBuild } from "../loadout/loadout";

/** Travel remains 28RP; fixed encounters use all31RP at the GM78 entry budget. */
export const V1P_TUNDRA_BUILD: DesiredBuild = {
  ...NIGHT2_TRAVEL_BUILD,
  abilities: { techniques: ["sweep", "hamstring"], guards: ["second-wind", "brace"] },
  runeRules: NIGHT2_TRAVEL_BUILD.runeRules.filter(r => r.conditionId !== "while-traveling"),
};
const sanctuary = { kind: "node" as const, nodeId: "node-t3-sanctuary" };
const tundra = { kind: "biome" as const, biomeGroup: "tundra", tier: 3, pick: "first" as const };
const recovered = { type: "fullyRecovered" as const };

export const CAMPAIGN_T3_V1P_TUNDRA: Route = {
  id: "spirit-tundra-counterplay-t3-v1p", version: "1.0.0", classRoot: "energy-root",
  frameId: "energy-heavy", startsFromTierEntry: 3, stopOnFirstDeath: true,
  suppressTransitCombat: true, captureTier2Handoff: true,
  description: "Earn Hamstring and Desert Boots+5, then qualify Wisp counterplay in natural Tundra farming and recovered return.",
  steps: [
    { type: "configureBuild", build: NIGHT2_TRAVEL_BUILD },
    { type: "learnAbility", recipeId: "ability-recipe-hamstring", abilityId: "hamstring", slot: "technique", attune: false,
      farmAt: { kind: "biome", biomeGroup: "jungle", tier: 2 }, stepTimeoutMs: 300_000 },
    { type: "craft", recipeIds: ["desert-boots-t2"],
      farmAt: { kind: "biome", biomeGroup: "desert", tier: 2 }, stepTimeoutMs: 300_000 },
    { type: "upgrade", definitionId: "desert-boots-t2", toPlus: 5, farmForMissingResources: true,
      farmAt: { kind: "biome", biomeGroup: "desert", tier: 2, modifier: "dominion" }, stepTimeoutMs: 600_000 },
    { type: "equip", definitionIds: ["desert-boots-t2"] },
    { type: "assert", condition: { type: "itemAtLeastPlus", definitionId: "desert-boots-t2", plus: 5 } },
    { type: "assert", condition: { type: "equipped", definitionId: "desert-boots-t2" } },
    { type: "travel", to: sanctuary },
    { type: "farm", at: sanctuary, until: recovered, stepTimeoutMs: 180_000 },
    { type: "configureBuild", build: V1P_TUNDRA_BUILD },
    { type: "milestone", id: "v1p:tundra:combat-build-qualified" },
    { type: "configureBuild", build: NIGHT2_TRAVEL_BUILD },
    { type: "milestone", id: "v1p:tundra:ready" },
    { type: "travel", to: tundra },
    { type: "configureBuild", build: V1P_TUNDRA_BUILD },
    { type: "milestone", id: "v1p:tundra:arrived" },
    { type: "farm", at: tundra, until: recovered, observeForMs: 300_000, stepTimeoutMs: 420_000,
      label: "v1p:tundra:farm" },
    { type: "milestone", id: "v1p:tundra:farm-complete" },
    { type: "configureBuild", build: NIGHT2_TRAVEL_BUILD },
    { type: "travel", to: sanctuary },
    { type: "farm", at: sanctuary, until: recovered, observeForMs: 20_000, stepTimeoutMs: 180_000 },
    { type: "assert", condition: recovered },
  ],
  completion: allOf({ type: "playerTierAtLeast", tier: 3 }, recovered), milestones: [],
};
