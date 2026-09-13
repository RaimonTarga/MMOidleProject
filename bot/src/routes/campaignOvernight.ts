import type { Route, RouteStep } from "../route/types";
import { CAMPAIGN_PLAINS_T1_BUILD } from "./campaignBoss";

/** V1h isolates absorb recovery, then adds burst mitigation without dropping movement rules. */
export function caveRecoveryRoute(tripleGuard: boolean): Route {
  const tag = tripleGuard ? "triple-cave-charm" : "dual-cave-charm";
  const build = structuredClone(CAMPAIGN_PLAINS_T1_BUILD);
  build.abilities = { techniques: [], guards: tripleGuard
    ? ["second-wind", "brace", "cleanse"] : ["second-wind", "cleanse"] };
  return {
    id: `striker-campaign-cave-${tag}-t1`, version: "1.0.0", classRoot: "cadence-root",
    startsFromTierEntry: 1, suppressTransitCombat: true,
    description: `Cave ${tag}: earn Pulse Stone +5, verify the kit, then one ordinary dungeon cycle.`,
    steps: [
      ...structuredClone(entryGates), ...checkItem("mountain-vest-t1", false),
      { type: "configureBuild", build: structuredClone(CAMPAIGN_PLAINS_T1_BUILD), label: `v1h:${tag}:preparation` },
      { type: "craft", recipeIds: ["cave-charm-t1"], farmAt: { kind: "biome", biomeGroup: "cave", tier: 1 } },
      { type: "upgrade", definitionId: "cave-charm-t1", toPlus: 5, farmAt: { kind: "biome", biomeGroup: "cave", tier: 1 } },
      ...(tripleGuard ? [{ type: "learnAbility" as const, recipeId: "ability-recipe-brace", abilityId: "brace", slot: "guard" as const, attune: false,
        farmAt: { kind: "biome" as const, biomeGroup: "mountain", tier: 1 } }] : []),
      { type: "equip", definitionIds: ["mountain-vest-t1", "cave-charm-t1"] },
      ...checkItem("mountain-vest-t1"), ...checkItem("cave-charm-t1"),
      { type: "configureBuild", build, label: `v1h:${tag}:build` },
      { type: "milestone", id: `v1h:${tag}:ready` },
      { type: "attemptBoss", biomeGroup: "cave", tier: 1, maxAttempts: 1, label: `v1h:${tag}:attempt` },
    ],
    completion: { type: "bossCleared", biomeGroup: "cave", tier: 1 }, milestones: [],
  };
}

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

export const CAMPAIGN_CAVE_RECOVERY_ROUTES = [caveRecoveryRoute(false), caveRecoveryRoute(true)];

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

/** User's manual-play hypothesis: trade Expose for a second Guard against rot. */
export const CAMPAIGN_NIGHT_SWAMP_DUAL_GUARD: Route = {
  ...structuredClone(CAMPAIGN_NIGHT_BOSSES.find(route => route.id === "striker-campaign-night-swamp-t1")!),
  id: "striker-campaign-night-swamp-dual-guard-t1",
  description: "Swamp comparison: no Technique, Second Wind plus Cleanse; same gear and ordered Rune rules.",
  steps: CAMPAIGN_NIGHT_BOSSES.find(route => route.id === "striker-campaign-night-swamp-t1")!.steps.map(step => {
    const copy = structuredClone(step);
    if (copy.type === "configureBuild") copy.build.abilities = { techniques: [], guards: ["second-wind", "cleanse"] };
    if (copy.label) copy.label = copy.label.replace("night:swamp:", "night:swamp-dual:");
    if (copy.type === "milestone") copy.id = copy.id.replace("night:swamp:", "night:swamp-dual:");
    return copy;
  }),
};

/** Cave hypothesis: cleansing corrosion may preserve defense at a DPS cost. */
export const CAMPAIGN_CAVE_DUAL_GUARD: Route = {
  ...structuredClone(CAMPAIGN_NIGHT_BOSSES.find(route => route.id === "striker-campaign-night-cave-t1")!),
  id: "striker-campaign-cave-dual-guard-t1",
  description: "Cave comparison: replace Expose with Cleanse alongside Second Wind; unchanged earned kit and Rune rules.",
  steps: CAMPAIGN_NIGHT_BOSSES.find(route => route.id === "striker-campaign-night-cave-t1")!.steps.map(step => {
    const copy = structuredClone(step);
    if (copy.type === "configureBuild") copy.build.abilities = { techniques: [], guards: ["second-wind", "cleanse"] };
    if (copy.label) copy.label = copy.label.replace("night:cave:", "v1g:cave-dual:");
    if (copy.type === "milestone") copy.id = copy.id.replace("night:cave:", "v1g:cave-dual:");
    return copy;
  }),
};
