import { STANCE_RECIPE_DATABASE } from "@mmo-idle/shared";
import { CAMPAIGN_PROFILES } from "../loadout/campaignProfiles";
import { requireTierEntryProfile, t2EntryProfileId } from "../tierEntry/profiles";
import type { Route, RouteStep } from "../route/types";
import { soleCatalystFamily, t2FarmFor } from "./t2Common";

/** No bosses, upgrades or later biomes: qualify one explicit build transition. */
export const CAMPAIGN_READINESS_ROUTES: Route[] = CAMPAIGN_PROFILES.map(profile => {
  const entry = requireTierEntryProfile(t2EntryProfileId(profile.classRoot, "clean"));
  const at = t2FarmFor("plains");
  const steps: RouteStep[] = [
    { type: "assert", condition: { type: "frameSelected", frameId: profile.frameId } },
    { type: "assert", condition: { type: "not", of: { type: "playerTierAtLeast", tier: 3 } } },
    ...Object.values(entry.equipment).filter((id): id is string => !!id).map(definitionId =>
      ({ type: "assert" as const, condition: { type: "equipped" as const, definitionId } })),
    { type: "configureBuild", build: structuredClone(profile.entry), label: `${profile.id}: entry` },
    { type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup: "plains", level: 7 },
      stepTimeoutMs: 120_000, stallAfterMs: 60_000 },
  ];
  for (const recipeId of ["stance-recipe-offensive", "stance-recipe-defensive"]) {
    const recipe = STANCE_RECIPE_DATABASE.get(recipeId);
    if (!recipe) throw new Error(`Missing campaign stance recipe ${recipeId}`);
    steps.push({ type: "craftStance", recipeId,
      farmAt: t2FarmFor("plains", soleCatalystFamily(recipe.catalystCost)) });
  }
  steps.push(
    { type: "configureBuild", build: structuredClone(profile.farm), label: `${profile.id}: Plains farm` },
    { type: "farm", at, until: { type: "biomeLevelAtLeast", biomeGroup: "plains", level: 8 },
      stepTimeoutMs: 120_000, stallAfterMs: 60_000 },
    { type: "configureBuild", build: structuredClone(profile.bossCandidate), label: `${profile.id}: boss configuration only` },
    // The final assertion keeps completion from skipping the preceding build
    // edits if stance acquisition already took Plains past level 8.
    { type: "assert", condition: { type: "abilityEquipped", abilityId: "expose-weakness" },
      message: "readiness ended after exact boss-candidate configuration" },
  );
  return {
    id: profile.id.replace("-campaign-v1", "-campaign-readiness-t2"), version: "1.0.0",
    classRoot: profile.classRoot, frameId: profile.frameId, startsFromTierEntry: 2,
    description: "Noncanonical Plains-local acquisition and exact RP build-transition readiness; no boss evidence.",
    suppressTransitCombat: true, steps,
    completion: { type: "biomeLevelAtLeast", biomeGroup: "plains", level: 8 }, milestones: [],
  };
});
