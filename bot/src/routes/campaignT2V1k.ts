import type { DesiredBuild } from "../loadout/loadout";
import type { Condition, Route, RouteStep } from "../route/types";
import { CAMPAIGN_T2_EXPANSION_ROUTES } from "./campaignT2Expansion";
import { t2Runes } from "./t2Common";

const mountain = CAMPAIGN_T2_EXPANSION_ROUTES.find(r => r.id === "spirit-campaign-mountain-mountain-charm-t2-v1j")!;
const swamp = CAMPAIGN_T2_EXPANSION_ROUTES.find(r => r.id === "spirit-campaign-swamp-swamp-charm-t2-v1j")!;

/** Independent prepared-entry candidates; V1i/V1j definitions remain frozen. */
export const CAMPAIGN_T2_V1K_ROUTES: Route[] = [
  { group: "swamp", armor: "cave-vest-t2" },
  { group: "swamp", armor: "swamp-vest-t2" },
  { group: "cave", armor: "cave-vest-t2" },
  { group: "desert", armor: "cave-vest-t2" },
].map(({ group, armor }) => {
  const source = group === "swamp" ? swamp : mountain;
  const tag = `v1k:spirit:${group}:${armor}`;
  const cleared: Condition = { type: "bossCleared", biomeGroup: group, tier: 2 };
  const preparation: RouteStep[] = source.steps.slice(0, -3).map(step => {
    if (step.type === "assert" && step.condition.type === "not" && step.condition.of.type === "bossCleared") {
      return { ...step, condition: { type: "not", of: cleared } };
    }
    return step.type === "configureBuild" ? { ...step, label: `${tag}:preparation` } : step;
  });
  if (group === "swamp") preparation.push(
    // Both arms earn the candidate armor while wearing the same Cave armor.
    { type: "evolveItem", recipeId: "swamp-vest-t2", mode: "reconstruct",
      farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2, modifier: "fortified" } },
    { type: "upgrade", definitionId: "swamp-vest-t2", toPlus: 5, farmForMissingResources: true,
      farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2, modifier: "fortified" } },
    { type: "assert", condition: { type: "itemAtLeastPlus", definitionId: "swamp-vest-t2", plus: 5 } },
  );
  else preparation.push({ type: "learnAbility", recipeId: "ability-recipe-cleanse", abilityId: "cleanse", slot: "guard", attune: false,
    farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2 } });
  const build: DesiredBuild = {
    abilities: { techniques: group === "cave" ? [] : ["expose-weakness"],
      guards: group === "cave" ? ["second-wind", "cleanse", "brace"] : ["second-wind", "cleanse"] },
    runeRules: t2Runes("ranged-orbit"),
    stances: { attuned: ["defensive-stance"], default: "defensive-stance" }, rites: [],
  };
  return {
    ...source, id: `spirit-campaign-${group}-${armor}-v1k`, version: "1.0.0",
    description: `V1k Spirit ${group}: ${armor}, one boss cycle and bounded post-clear observation.`,
    steps: [...preparation,
      { type: "equip", definitionIds: [armor] },
      { type: "assert", condition: { type: "equipped", definitionId: armor } },
      { type: "assert", condition: { type: "itemAtLeastPlus", definitionId: armor, plus: 5 } },
      { type: "configureBuild", build, label: `${tag}:build` },
      { type: "milestone", id: `${tag}:ready` },
      { type: "attemptBoss", biomeGroup: group, tier: 2, maxAttempts: 1, label: `${tag}:attempt` },
      { type: "farm", at: { kind: "dungeon", biomeGroup: group, tier: 2 }, until: cleared,
        observeForMs: 20_000, stepTimeoutMs: 60_000, requires: cleared, label: `${tag}:post-clear-observe` },
      // Pending assertion prevents completion short-circuiting the observation.
      // A failed boss prerequisite skips both tail steps without a new attempt.
      { type: "assert", condition: cleared, requires: cleared, label: `${tag}:post-clear-observed` }],
    completion: cleared,
  };
});
