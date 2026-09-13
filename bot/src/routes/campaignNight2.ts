import type { Route, RouteStep } from "../route/types";
import { CAMPAIGN_T2_V1K_ROUTES } from "./campaignT2V1k";

const cave = CAMPAIGN_T2_V1K_ROUTES.find(r => r.id === "spirit-campaign-cave-cave-vest-t2-v1k")!;

/** Night 2: ordinary player rules only; historical routes stay unchanged. */
export const CAMPAIGN_NIGHT2_ROUTES: Route[] = ["cave-control", "cave-telegraph-brace", "jungle-hamstring"].map(arm => {
  const group = arm.startsWith("cave") ? "cave" : "jungle";
  const tag = `night2:spirit:${arm}`;
  const completion = { type: "bossCleared" as const, biomeGroup: group, tier: 2 };
  const steps: RouteStep[] = cave.steps.map(step => {
    if (step.type === "assert" && step.condition.type === "not" && step.condition.of.type === "bossCleared") {
      return { ...step, condition: { type: "not", of: completion } };
    }
    if (step.type === "configureBuild" && step.label?.endsWith(":build")) {
      return { ...step, label: `${tag}:build`, build: { ...step.build,
        abilities: group === "jungle" ? { techniques: ["hamstring"], guards: ["second-wind", "brace"] } : step.build.abilities,
        runeRules: [...step.build.runeRules, ...(arm === "cave-telegraph-brace"
          ? [{ conditionId: "inside-telegraph", actionId: "use-ability", targetAbilityId: "brace" }] : [])],
      } };
    }
    if (step.type === "milestone") return { ...step, id: `${tag}:ready` };
    if (step.type === "attemptBoss") return { ...step, biomeGroup: group, label: `${tag}:attempt` };
    if (step.type === "farm" && step.observeForMs) return { ...step,
      at: { kind: "dungeon", biomeGroup: group, tier: 2 }, until: completion, requires: completion, label: `${tag}:post-clear-observe` };
    if (step.type === "assert" && step.requires) return { ...step, condition: completion, requires: completion, label: `${tag}:post-clear-observed` };
    return step;
  });
  if (group === "jungle") steps.splice(steps.length - 5, 0, {
    type: "learnAbility", recipeId: "ability-recipe-hamstring", abilityId: "hamstring", slot: "technique", attune: false,
    farmAt: { kind: "biome", biomeGroup: "jungle", tier: 2 },
  });
  return { ...cave, id: `spirit-${arm}-t2-night2`, version: "1.0.0",
    description: `Night 2 ${arm}: single prepared boss cycle with bounded survival observation.`, steps, completion };
});
