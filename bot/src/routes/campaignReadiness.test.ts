import {
  globalMastery, isStanceRecipeUnlocked, runeIdsFromCraftedRecipes,
  STANCE_RECIPE_DATABASE, type PlayerView,
} from "@mmo-idle/shared";
import { CAMPAIGN_PROFILES } from "../loadout/campaignProfiles";
import { buildRP, validateBuild } from "../loadout/loadout";
import { requireTierEntryProfile, t2EntryProfileId } from "../tierEntry/profiles";
import { CAMPAIGN_READINESS_ROUTES } from "./campaignReadiness";

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
assert(CAMPAIGN_READINESS_ROUTES.length === 6, "six readiness cases");
for (const profile of CAMPAIGN_PROFILES) {
  const entry = requireTierEntryProfile(t2EntryProfileId(profile.classRoot, "clean"));
  const view = {
    knownAbilities: entry.knownAbilities, knownStances: [], knownRites: entry.knownRites,
    runesOwned: runeIdsFromCraftedRecipes(entry.runeRecipesCrafted),
    globalMastery: globalMastery(entry.biomeLevels),
    combatArchetype: entry.classRoot.replace(/-root$/, ""),
  } as unknown as PlayerView;
  assert(validateBuild(profile.entry, view).length === 0, `${profile.id}: entry legality`);
  const route = CAMPAIGN_READINESS_ROUTES.find(r => r.classRoot === profile.classRoot)!;
  const levels = { ...entry.biomeLevels };
  for (const step of route.steps) {
    if (step.type === "farm" && step.until.type === "biomeLevelAtLeast") {
      levels[step.until.biomeGroup] = Math.max(levels[step.until.biomeGroup] ?? 0, step.until.level);
      view.globalMastery = globalMastery(levels);
    }
    if (step.type === "craftStance") {
      const recipe = STANCE_RECIPE_DATABASE.get(step.recipeId)!;
      assert(isStanceRecipeUnlocked(recipe, { biomeLevel: levels, bossesCleared: entry.bossesCleared }),
        `${profile.id}: stance acquisition gate`);
      view.knownStances.push(recipe.stanceId);
    }
    if (step.type === "configureBuild") {
      const issues = validateBuild(step.build, view);
      assert(!issues.length, `${profile.id}: ${JSON.stringify(issues)}`);
    }
  }
  assert(route.steps.at(-1)?.type === "assert", "terminal build edits must not be short-circuited");
  assert(!route.steps.some(s => s.type === "attemptBoss" || s.type === "unlockSkill"), "readiness is local and pre-branch");
  const unlearned = { ...view, knownStances: [] };
  assert(validateBuild(profile.farm, unlearned).some(i => i.code === "MISSING_UNLOCK"), "cannot grant a free stance");
  assert(validateBuild(profile.entry, { ...view, globalMastery: 0 }).some(i => i.code === "INSUFFICIENT_RP"), "under-budget state rejected");
  console.log(`${profile.id}: entry=${buildRP(profile.entry).total}, farm=${buildRP(profile.farm).total}, boss=${buildRP(profile.bossCandidate).total}`);
}
console.log("campaignReadiness: ok (static legality/order, not gameplay evidence)");
