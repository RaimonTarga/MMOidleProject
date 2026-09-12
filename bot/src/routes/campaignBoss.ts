import type { DesiredBuild } from "../loadout/loadout";
import type { Route, RouteStep } from "../route/types";
import { STRIKER_T1 } from "./strikerT1";
import { controlledT1Runes } from "./t1RouteBuilder";

// Plains is an add-pressure encounter. Sweep handles the herd; Second Wind
// sustains the player. Keep hazard avoidance for preparation and guardians.
export const CAMPAIGN_PLAINS_T1_BUILD: DesiredBuild = {
  abilities: { techniques: ["sweep"], guards: ["second-wind"] },
  runeRules: controlledT1Runes("melee-chase", "dodge-counterplay", "final"),
  stances: { attuned: [], default: null }, rites: [],
};

const firstBoss = STRIKER_T1.steps.findIndex(step => step.type === "attemptBoss");
if (firstBoss < 2 || STRIKER_T1.steps[firstBoss - 2].type !== "setAbilities" ||
    STRIKER_T1.steps[firstBoss - 1].type !== "configureRunes") {
  throw new Error("Campaign Plains route requires the reviewed T1 boss preparation boundary");
}
const boss = STRIKER_T1.steps[firstBoss];
if (boss.type !== "attemptBoss" || boss.biomeGroup !== "plains" || boss.tier !== 1) {
  throw new Error("Campaign first encounter must remain Tier 1 Plains");
}
const kit = ["chaotic-axe", "plains-vest-t1", "swamp-charm-t1", "plains-boots-t1"];
const gates: RouteStep[] = [
  { type: "assert", condition: { type: "not", of: { type: "playerTierAtLeast", tier: 2 } },
    message: "V1a must reach the first boss before a frame or higher tier" },
  { type: "assert", condition: { type: "globalMasteryAtLeast", value: 30 } },
  ...kit.flatMap(definitionId => [
    { type: "assert" as const, condition: { type: "equipped" as const, definitionId } },
    { type: "assert" as const, condition: { type: "itemAtLeastPlus" as const, definitionId, plus: 5 } },
  ]),
];

/** Fresh-character T1 preparation, then one ordinary dungeon attempt only. */
export const STRIKER_CAMPAIGN_PLAINS_BOSS_T1: Route = {
  id: "striker-campaign-plains-boss-t1", version: "1.0.0",
  classRoot: "cadence-root",
  description: "V1a: earned GM30 and +5 T1 kit, verified Sweep/Second Wind, one Plains dungeon attempt.",
  steps: [
    ...structuredClone(STRIKER_T1.steps.slice(0, firstBoss - 2)),
    ...gates,
    { type: "configureBuild", build: structuredClone(CAMPAIGN_PLAINS_T1_BUILD), label: "v1a:verified-plains-build" },
    { type: "milestone", id: "v1a:preparation-complete" },
    { type: "attemptBoss", biomeGroup: "plains", tier: 1, maxAttempts: 1, label: "v1a:plains-attempt" },
  ],
  completion: { type: "bossCleared", biomeGroup: "plains", tier: 1 }, milestones: [],
};
