import type { DesiredBuild } from "../loadout/loadout";
import type { Route, RouteStep } from "../route/types";
import { t2Runes, t2MaxLevel, T2_PROGRESSION_ORDER } from "./t2Common";

export const spiritBossBuild = (technique: string): DesiredBuild => ({
  abilities: { techniques: technique === "sweep" ? ["sweep", "expose-weakness"] : [technique],
    guards: technique === "sweep" ? ["second-wind"] : ["second-wind", "brace"] },
  runeRules: t2Runes("ranged-orbit"),
  stances: { attuned: ["defensive-stance"], default: "defensive-stance" }, rites: [],
});

/** Independent boss probes from the unchanged V1h Spirit GM72 snapshot. */
export const CAMPAIGN_T2_BOSS_ROUTES: Route[] = [
  { group: "plains", weapon: "ruinous-axe", technique: "sweep" },
  { group: "plains", weapon: "gale-needle", technique: "sweep" },
  { group: "forest", weapon: "ruinous-axe", technique: "expose-weakness" },
].map(({ group, weapon, technique }) => {
  const tag = `v1i:spirit:${group}:${weapon}`;
  const kit = [weapon, "cave-vest-t2", "mountain-charm-t2", "plains-boots-t2"];
  const steps: RouteStep[] = [
    { type: "assert", condition: { type: "playerTierAtLeast", tier: 2 } },
    { type: "assert", condition: { type: "not", of: { type: "playerTierAtLeast", tier: 3 } } },
    { type: "assert", condition: { type: "frameSelected", frameId: "energy-heavy" } },
    { type: "assert", condition: { type: "globalMasteryAtLeast", value: 72 } },
    ...T2_PROGRESSION_ORDER.map(biomeGroup => ({ type: "assert" as const,
      condition: { type: "biomeLevelAtLeast" as const, biomeGroup, level: t2MaxLevel(biomeGroup) } })),
    { type: "assert", condition: { type: "not", of: { type: "bossCleared", biomeGroup: group, tier: 2 } } },
    ...kit.map(definitionId => ({ type: "assert" as const, condition: { type: "itemAtLeastPlus" as const, definitionId, plus: 4 } })),
    { type: "assert", condition: { type: "equipped", definitionId: "core-tempered" } },
    // Idempotent for the frozen source, which already owns this stance.
    { type: "craftStance", recipeId: "stance-recipe-defensive", farmAt: { kind: "biome", biomeGroup: "plains", tier: 2, modifier: "fortified" } },
    { type: "configureBuild", build: spiritBossBuild("sweep"), label: `${tag}:preparation` },
    { type: "equip", definitionIds: kit },
    ...kit.map(definitionId => ({ type: "upgrade" as const, definitionId, toPlus: 5, farmForMissingResources: true,
      farmAt: { kind: "biome" as const, biomeGroup: "plains", tier: 2 } })),
    ...kit.flatMap(definitionId => [
      { type: "assert" as const, condition: { type: "equipped" as const, definitionId } },
      { type: "assert" as const, condition: { type: "itemAtLeastPlus" as const, definitionId, plus: 5 } },
    ]),
    ...(group === "forest" ? [{ type: "learnAbility" as const, recipeId: "ability-recipe-brace", abilityId: "brace", slot: "guard" as const, attune: false,
      farmAt: { kind: "biome" as const, biomeGroup: "mountain", tier: 2 } }] : []),
    { type: "configureBuild", build: spiritBossBuild(technique), label: `${tag}:build` },
    { type: "milestone", id: `${tag}:ready` },
    { type: "attemptBoss", biomeGroup: group, tier: 2, maxAttempts: 1, label: `${tag}:attempt` },
  ];
  return {
    id: `spirit-campaign-${group}-${weapon}-t2`, version: "1.0.0",
    classRoot: "energy-root", frameId: "energy-heavy", startsFromTierEntry: 2,
    resumePreparedT2: true, suppressTransitCombat: true,
    entryItems: [...kit, "core-tempered"],
    description: `V1i independent Spirit ${group} boss: earned +5 ${weapon} kit, defensive stance, one normal cycle.`,
    steps, completion: { type: "bossCleared", biomeGroup: group, tier: 2 }, milestones: [],
  };
});
