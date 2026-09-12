import type { Route, RouteStep } from "../route/types";
import { CAMPAIGN_READINESS_ROUTES } from "./campaignReadiness";

/** Q2 keeps Q1 preparation/builds but measures both builds after configuration. */
export const CAMPAIGN_BEHAVIOR_ROUTES: Route[] = CAMPAIGN_READINESS_ROUTES.map(seed => {
  const steps: RouteStep[] = [];
  for (const step of seed.steps) {
    if (step.type === "farm" && step.until.type === "biomeLevelAtLeast" && step.until.level === 8) continue;
    steps.push(structuredClone(step));
    if (step.type === "configureBuild" && step.build.stances.default) {
      const stage = step.build.stances.default === "offensive-stance" ? "sweep" : "expose";
      steps.push({ type: "farm", at: { kind: "biome", biomeGroup: "plains", tier: 2, pick: "first" },
        until: { type: "elapsedMs", ms: 0 }, observeForMs: 60_000,
        stepTimeoutMs: 120_000, stallAfterMs: 90_000, label: `q2:${stage}:observe` });
    }
  }
  return { ...seed, id: seed.id.replace("readiness", "behavior"), version: "1.0.0", steps,
    description: "Q2: two 60-second observed auto-combat windows in Plains; no boss or balance comparison.",
    // The last assertion prevents the early-true completion predicate from
    // bypassing either window; no preparation mastery can finish a window.
    completion: { type: "elapsedMs", ms: 0 } };
});
