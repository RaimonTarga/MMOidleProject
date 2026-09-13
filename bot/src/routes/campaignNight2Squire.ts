import type { DesiredBuild } from "../loadout/loadout";
import { allOf, type Route, type RouteStep } from "../route/types";
import { t2MaxLevel, t2Runes, T2_PROGRESSION_ORDER } from "./t2Common";

const build: DesiredBuild = {
  abilities: { techniques: ["sweep"], guards: ["second-wind", "brace"] },
  runeRules: t2Runes("melee-chase"),
  stances: { attuned: ["defensive-stance"], default: "defensive-stance" }, rites: [],
};
const kit = ["quake-hammer", "mountain-vest-t2", "plains-vest-t2", "plains-charm-t2", "plains-boots-t2"];
const clear = { type: "bossCleared" as const, biomeGroup: "plains", tier: 2 };
const prep: RouteStep[] = [
  { type: "assert", condition: allOf({ type: "playerTierAtLeast", tier: 2 }, { type: "not", of: { type: "playerTierAtLeast", tier: 3 } }, { type: "frameSelected", frameId: "cooldown-heavy" }, { type: "globalMasteryAtLeast", value: 72 }, { type: "not", of: clear }) },
  ...T2_PROGRESSION_ORDER.map(biomeGroup => ({ type: "assert" as const, condition: { type: "biomeLevelAtLeast" as const, biomeGroup, level: t2MaxLevel(biomeGroup) } })),
  ...kit.map(definitionId => ({ type: "assert" as const, condition: { type: "itemAtLeastPlus" as const, definitionId, plus: 4 } })),
  { type: "assert", condition: { type: "equipped", definitionId: "core-tempered" } },
  { type: "craftStance", recipeId: "stance-recipe-defensive", farmAt: { kind: "biome", biomeGroup: "plains", tier: 2 } },
  { type: "configureBuild", build: { ...build, abilities: { techniques: ["sweep"], guards: ["second-wind"] } }, label: "night2:squire:preparation" },
  { type: "equip", definitionIds: ["quake-hammer", "mountain-vest-t2", "plains-charm-t2", "plains-boots-t2"] },
  { type: "learnAbility", recipeId: "ability-recipe-brace", abilityId: "brace", slot: "guard", attune: false, farmAt: { kind: "biome", biomeGroup: "mountain", tier: 2 } },
  { type: "configureBuild", build, label: "night2:squire:dual-guard" },
  ...kit.map(definitionId => ({ type: "upgrade" as const, definitionId, toPlus: 5, farmForMissingResources: true, farmAt: { kind: "biome" as const, biomeGroup: "plains", tier: 2 } })),
  ...kit.map(definitionId => ({ type: "assert" as const, condition: { type: "itemAtLeastPlus" as const, definitionId, plus: 5 } })),
  { type: "travel", to: { kind: "node", nodeId: "node-t2-sanctuary" } },
];

/** Armor comparison with identical acquisition, class delivery, Guards and kill recovery. */
export const CAMPAIGN_NIGHT2_SQUIRE_ROUTES: Route[] = ["mountain", "plains"].map(armor => {
  const armorId = `${armor}-vest-t2`;
  const tag = `night2:squire:${armor}`;
  return {
    id: `squire-plains-${armor}-armor-t2-night2`, version: "1.0.0",
    classRoot: "cooldown-root", frameId: "cooldown-heavy", startsFromTierEntry: 2,
    resumePreparedT2: true, suppressTransitCombat: true, stopOnFirstDeath: true,
    entryItems: [...kit, "core-tempered"],
    description: `Squire Plains T2: Quake Hammer, ${armor} armor, Plains charm/boots, Sweep and dual Guards; one attempt.`,
    steps: [...prep,
      { type: "equip", definitionIds: [armorId] },
      ...["quake-hammer", armorId, "plains-charm-t2", "plains-boots-t2", "core-tempered"].map(definitionId => ({ type: "assert" as const, condition: { type: "equipped" as const, definitionId } })),
      { type: "configureBuild", build, label: `${tag}:build` },
      { type: "farm", at: { kind: "node", nodeId: "node-t2-sanctuary" }, until: { type: "fullyRecovered" }, stepTimeoutMs: 180_000, label: `${tag}:recover` },
      { type: "milestone", id: `${tag}:ready` },
      { type: "attemptBoss", biomeGroup: "plains", tier: 2, maxAttempts: 1, label: `${tag}:attempt` },
      { type: "farm", at: { kind: "dungeon", biomeGroup: "plains", tier: 2 }, until: { type: "fullyRecovered" }, observeForMs: 20_000, stepTimeoutMs: 180_000, requires: clear, label: `${tag}:tail` },
      { type: "assert", condition: allOf(clear, { type: "fullyRecovered" }), requires: clear, label: `${tag}:qualified` },
    ],
    completion: allOf(clear, { type: "fullyRecovered" }), milestones: [],
  };
});
