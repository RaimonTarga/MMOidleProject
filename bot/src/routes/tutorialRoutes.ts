import {
  TUTORIAL_CLASS_PLANS,
  TUTORIAL_SEALS,
  tutorialScriptFor,
  type TutorialScript,
  type TutorialStep,
} from "@mmo-idle/shared";
import type { Condition, Route, RouteStep } from "../route/types";

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

/**
 * The gate's capstone beat needs SEVERAL wins against one boss, so its budget is
 * per round rather than per step: a small attempt budget inside a bounded repeat,
 * so a class that cannot beat that boss at all costs the run a handful of fights
 * and a named stall instead of dozens (the Forest Greatbear walls a GM-30 Striker
 * and Apprentice — docs/guided-tutorial-plan.md, Findings).
 */
const TUTORIAL_GATE_BOSS_ATTEMPTS = 4;
const TUTORIAL_GATE_BOSS_ROUNDS = 5;

function toRouteStep(step: TutorialStep, classRoot: string): RouteStep {
  switch (step.type) {
    case "chooseClass":
      return { type: "chooseClass", skillId: classRoot };
    case "attemptBoss": {
      const { until, ...boss } = step;
      // "Fight this boss until" is the bot's own `repeatUntil` over one attempt.
      if (!until) return { ...boss, maxAttempts: TUTORIAL_BOSS_ATTEMPTS };
      return {
        type: "repeatUntil",
        until: until as Condition,
        maxIterations: TUTORIAL_GATE_BOSS_ROUNDS,
        // `repeat`: the gate wants N capstone drops, so every round needs a FRESH
        // kill. Without it the harness reads `bossesCleared` — already true after the
        // first — and every later round returns instantly.
        steps: [{ ...boss, repeat: true, maxAttempts: TUTORIAL_GATE_BOSS_ATTEMPTS }],
      };
    }
    default:
      return step;
  }
}

export function tutorialRouteId(className: string): string {
  return `tutorial-${className.toLowerCase()}-t1`;
}

/**
 * The form the script's gate beat ends on, read off the script rather than
 * restated: it is what the route's completion and its `gate-paid` milestone
 * name, so moving the lesson in `classScript.ts` moves both with it.
 */
function gateTarget(script: TutorialScript): { lineageId: string; recipeId: string } | null {
  const worn = script.beats
    .flatMap((beat) => beat.steps)
    .filter((step): step is Extract<TutorialStep, { type: "wearForm" }> => step.type === "wearForm");
  const last = worn[worn.length - 1];
  return last ? { lineageId: last.lineageId, recipeId: last.recipeId } : null;
}

export const TUTORIAL_ROUTES: readonly Route[] = TUTORIAL_CLASS_PLANS.map((plan) => {
  const script = tutorialScriptFor(plan.classRoot);
  const gate = gateTarget(script);
  const sealsCleared: Condition[] = TUTORIAL_SEALS.map((biomeGroup) => ({
    type: "bossCleared" as const,
    biomeGroup,
    tier: 1,
  }));
  // The script does not stop at Tier 2 any more: the gate chapter follows it, so
  // a completion of "two seals" would short-circuit the run before the whole
  // script had been played (`runSteps` returns as soon as completion holds).
  const gatePaid: Condition[] = gate
    ? [{ type: "lineageFormWorn", lineageId: gate.lineageId, recipeId: gate.recipeId }]
    : [];
  const [leanCard, verbCard] = cardsOf(script);
  return {
    id: tutorialRouteId(plan.className),
    // 1.2.0: the weapon page's lean AND verb (design §24.2), each bought with
    // `unlockCard` + `setActive` — the intents the client's weapon page sends.
    version: "1.2.0",
    classRoot: plan.classRoot,
    description: `Guided Tier-1 tutorial for the ${plan.className}: every T1 zone to Global Mastery 30 with the Rapier's lean and verb, the ${TUTORIAL_SEALS.join(" and ")} seals, then the weapon lineage's tier-1 gate.`,
    steps: script.beats.flatMap((beat) =>
      beat.steps.map((step): RouteStep => ({ ...toRouteStep(step, plan.classRoot), label: `${beat.id}: ${step.type}` }))),
    completion: { type: "allOf", of: [...sealsCleared, ...gatePaid] },
    milestones: [
      { id: "tier-1-reached", when: { type: "playerTierAtLeast", tier: 1 } },
      { id: "gm-6", when: { type: "globalMasteryAtLeast", value: 6 } },
      { id: "gm-12", when: { type: "globalMasteryAtLeast", value: 12 } },
      { id: "gm-18", when: { type: "globalMasteryAtLeast", value: 18 } },
      { id: "gm-24", when: { type: "globalMasteryAtLeast", value: 24 } },
      { id: "gm-30-all-maxed", when: { type: "globalMasteryAtLeast", value: 30 } },
      { id: "first-seal", when: { type: "bossCleared", biomeGroup: TUTORIAL_SEALS[0], tier: 1 } },
      { id: "tier-2-reached", when: { type: "playerTierAtLeast", tier: 2 } },
      // The two purchases, timed: the lean (row 1) and the verb (row 2).
      ...(leanCard
        ? [{ id: "first-lineage-card", when: { type: "lineageCardOwned" as const, ...leanCard } }]
        : []),
      ...(verbCard
        ? [{ id: "verb-card", when: { type: "lineageCardOwned" as const, ...verbCard } }]
        : []),
      ...(gate
        ? [{
          id: "gate-paid",
          when: { type: "lineageFormOwned" as const, lineageId: gate.lineageId, recipeId: gate.recipeId },
        }]
        : []),
    ],
  };
});

/** The cards the script buys, in order, for the milestones that time the lessons. */
function cardsOf(script: TutorialScript): { lineageId: string; cardId: string }[] {
  return script.beats
    .flatMap((beat) => beat.steps)
    .filter((step): step is Extract<TutorialStep, { type: "unlockCard" }> => step.type === "unlockCard")
    .map(({ lineageId, cardId }) => ({ lineageId, cardId }));
}

export const TUTORIAL_ROUTE_IDS: readonly string[] = TUTORIAL_ROUTES.map((route) => route.id);
