import type { DesiredBuild } from "../loadout/loadout";
import type { Route, RouteStep } from "../route/types";
import { CAMPAIGN_T2_BOSS_ROUTES } from "./campaignT2Boss";
import { t2Runes } from "./t2Common";

// Preserve V1i routes. Reuse their qualified ordinary +5 preparation sequence.
const source = CAMPAIGN_T2_BOSS_ROUTES.find(r => r.id === "spirit-campaign-forest-ruinous-axe-t2")!;
export const CAMPAIGN_T2_EXPANSION_ROUTES: Route[] = [
  { group: "mountain", charm: "mountain-charm-t2" },
  { group: "swamp", charm: "mountain-charm-t2" },
  { group: "swamp", charm: "swamp-charm-t2" },
].map(({ group, charm }) => {
  const tag = `v1j:spirit:${group}:${charm}`;
  const build: DesiredBuild = {
    abilities: { techniques: ["expose-weakness"], guards: group === "swamp" ? ["second-wind", "cleanse"] : ["second-wind", "brace"] },
    runeRules: t2Runes("ranged-orbit"),
    stances: { attuned: ["defensive-stance"], default: "defensive-stance" }, rites: [],
  };
  // Last three steps in the qualified route are final build, readiness, attempt.
  const preparation: RouteStep[] = source.steps.slice(0, -3).map(step => {
    if (step.type === "assert" && step.condition.type === "not" && step.condition.of.type === "bossCleared") {
      return { ...step, condition: { type: "not", of: { type: "bossCleared", biomeGroup: group, tier: 2 } } };
    }
    return step.type === "configureBuild" ? { ...step, label: `${tag}:preparation` } : step;
  });
  // Both Swamp arms pay the same acquisition costs and keep the Mountain charm
  // equipped while farming. Only their final equipped charm differs.
  if (group === "swamp") preparation.push(
    { type: "learnAbility", recipeId: "ability-recipe-cleanse", abilityId: "cleanse", slot: "guard", attune: false,
      farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2 } },
    { type: "evolveItem", recipeId: "swamp-charm-t2", mode: "reconstruct",
      farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2, modifier: "fortified" } },
    { type: "upgrade", definitionId: "swamp-charm-t2", toPlus: 5, farmForMissingResources: true,
      farmAt: { kind: "biome", biomeGroup: "swamp", tier: 2, modifier: "fortified" } },
    { type: "assert", condition: { type: "itemAtLeastPlus", definitionId: "swamp-charm-t2", plus: 5 } },
  );
  return {
    ...source, id: `spirit-campaign-${group}-${charm}-v1j`, version: "1.0.0",
    description: `V1j Spirit ${group}: ${charm}, one ordinary guardian-inclusive cycle.`,
    steps: [...preparation,
      { type: "equip", definitionIds: [charm] },
      { type: "assert", condition: { type: "equipped", definitionId: charm } },
      { type: "assert", condition: { type: "itemAtLeastPlus", definitionId: charm, plus: 5 } },
      { type: "configureBuild", build, label: `${tag}:build` },
      { type: "milestone", id: `${tag}:ready` },
      { type: "attemptBoss", biomeGroup: group, tier: 2, maxAttempts: 1, label: `${tag}:attempt` }],
    completion: { type: "bossCleared", biomeGroup: group, tier: 2 },
  };
});
