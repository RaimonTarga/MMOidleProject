import {
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  type TutorialStep,
} from "@mmo-idle/shared";
import type { Route, RouteStep } from "../route/types";

/**
 * The guided Tier-1 tutorial scripts as ordinary routes (docs/guided-tutorial-plan.md).
 *
 * The scripts live in shared/src/tutorial and are what the client guide plays.
 * Their step and condition shapes are this harness's own vocabulary, so the
 * adapter only fills in the one thing a player decides by hand (the class) and
 * gives boss attempts a patient retry budget. A green `pnpm bot:run
 * --route=tutorial-<class>-t1` run is the evidence that the guide still reaches
 * Tier 2 for that class.
 */

/** A guided player retries until it wins; the bot keeps a finite but patient budget. */
const TUTORIAL_BOSS_ATTEMPTS = 12;

function toRouteStep(step: TutorialStep, classRoot: string): RouteStep {
  switch (step.type) {
    case "chooseClass":
      return { type: "chooseClass", skillId: classRoot };
    case "attemptBoss":
      return { ...step, maxAttempts: TUTORIAL_BOSS_ATTEMPTS };
    default:
      return step;
  }
}

export function tutorialRouteId(className: string): string {
  return `tutorial-${className.toLowerCase()}-t1`;
}

export const TUTORIAL_ROUTES: readonly Route[] = TUTORIAL_CLASS_PLANS.map((plan) => {
  const script = tutorialScriptFor(plan.classRoot);
  return {
    id: tutorialRouteId(plan.className),
    version: "1.0.0",
    classRoot: plan.classRoot,
    description: `Guided Tier-1 tutorial for the ${plan.className}: every T1 zone to Global Mastery 30, then the ${TUTORIAL_SEALS.join(" and ")} seals.`,
    steps: script.beats.flatMap((beat) =>
      beat.steps.map((step): RouteStep => ({ ...toRouteStep(step, plan.classRoot), label: `${beat.id}: ${step.type}` }))),
    completion: {
      type: "allOf",
      of: TUTORIAL_SEALS.map((biomeGroup) => ({ type: "bossCleared" as const, biomeGroup, tier: 1 })),
    },
    milestones: [
      { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
      { id: "gm-6", when: { type: "globalMasteryAtLeast", value: 6 } },
      { id: "gm-12", when: { type: "globalMasteryAtLeast", value: 12 } },
      { id: "gm-18", when: { type: "globalMasteryAtLeast", value: 18 } },
      { id: "gm-24", when: { type: "globalMasteryAtLeast", value: 24 } },
      { id: "gm-30-all-maxed", when: { type: "globalMasteryAtLeast", value: 30 } },
      { id: "first-seal", when: { type: "bossCleared", biomeGroup: TUTORIAL_SEALS[0], tier: 1 } },
      { id: "tier-2-reached", when: { type: "playerTierAtLeast", tier: 2 } },
    ],
  };
});

export const TUTORIAL_ROUTE_IDS: readonly string[] = TUTORIAL_ROUTES.map((route) => route.id);

