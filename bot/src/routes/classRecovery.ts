import type { EquippedRule } from "@mmo-idle/shared";
import type { Route, RouteStep } from "../route/types";

/**
 * A Conduit goes into each pull prepared when it waits for its formation, not
 * its HP: Rebuild Formation (`wait-for-summons`) takes Recover First's slot on
 * the same condition, at the same 1 RP. Designer call, 2026-09-26.
 */
export function withClassRecovery(rules: readonly EquippedRule[], classRoot: string): EquippedRule[] {
  if (classRoot !== "summoner-root") return [...rules];
  return rules.map((rule) =>
    rule.actionId === "wait-for-regen" ? { ...rule, actionId: "wait-for-summons" } : rule);
}

function stepWithClassRecovery(step: RouteStep, classRoot: string): RouteStep {
  if (step.type === "configureRunes") return { ...step, rules: withClassRecovery(step.rules, classRoot) };
  if (step.type === "configureBuild") {
    return { ...step, build: { ...step.build, runeRules: withClassRecovery(step.build.runeRules, classRoot) } };
  }
  return step;
}

/** Apply `withClassRecovery` to every rune-bearing step of a finished route. */
export function routeWithClassRecovery(route: Route): Route {
  return { ...route, steps: route.steps.map((step) => stepWithClassRecovery(step, route.classRoot)) };
}
