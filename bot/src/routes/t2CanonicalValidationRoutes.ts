import type { Route } from "../route/types";
import {
  makeT2Route,
  type T2TreatmentAssertion,
} from "./t2RouteBuilder";
import {
  T2_CLASS_PLANS,
  type T2ClassPlan,
} from "./t2GearPlans";

/**
 * Narrow full-progression frame arms for the final pre-balance validation.
 *
 * The Day frame routes are sealed-J0 tails, which is useful for isolating the
 * old Jungle signature but cannot answer whether a frame difference survives
 * ordinary Tier-2 resource and progression pacing. These routes keep the
 * existing class gear plan and biome order byte-for-byte, changing only the
 * declared frame.
 */
const VALIDATION_FRAMES = [
  ["squire", "cooldown-balanced", "quake-hammer"],
  ["squire", "cooldown-heavy", "quake-hammer"],
  ["striker", "cadence-balanced", "ruinous-axe"],
  ["striker", "cadence-heavy", "ruinous-axe"],
] as const;

// Normal 1x T2 mastery farming can legitimately exceed the generic 30-minute
// route-step watchdog. Keep the ordinary 12-minute no-progress guard intact
// (so an actual softlock still resolves), but give this diagnostic's active
// farms enough wall-clock budget to finish a slow biome leg.
const VALIDATION_FARM_TIMEOUT_MS = 2 * 60 * 60 * 1000;

function allowLongValidationFarms(route: Route): Route {
  return {
    ...route,
    steps: route.steps.map((step) =>
      step.type === "farm"
        ? { ...step, stepTimeoutMs: VALIDATION_FARM_TIMEOUT_MS }
        : step,
    ),
  };
}

function basePlan(slug: string): T2ClassPlan {
  const plan = T2_CLASS_PLANS.find((candidate) => candidate.slug === slug);
  if (!plan) throw new Error(`T2 canonical validation base plan missing: ${slug}`);
  return plan;
}

function entryAssertions(frameId: string): T2TreatmentAssertion[] {
  return [
    {
      condition: { type: "playerTierAtLeast", tier: 2 },
      message: "Tier-2 validation entry is player tier 2",
    },
    {
      condition: { type: "globalMasteryAtLeast", value: 30 },
      message: "Tier-2 validation entry carries the T1 mastery boundary",
    },
    {
      condition: { type: "frameSelected", frameId },
      message: `validation frame is ${frameId}`,
    },
    {
      condition: { type: "equipped", definitionId: "chaotic-axe" },
      message: "validation entry preserves the intended T1 endgame weapon",
    },
  ];
}

function terminalAssertions(frameId: string, weaponId: string): T2TreatmentAssertion[] {
  return [
    {
      condition: { type: "frameSelected", frameId },
      message: `terminal frame remains ${frameId}`,
    },
    {
      condition: { type: "equipped", definitionId: weaponId },
      message: `terminal intended weapon is ${weaponId}`,
    },
    {
      condition: { type: "equipped", definitionId: "core-force" },
      message: "terminal farming Core is core-force",
    },
  ];
}

export const T2_CANONICAL_VALIDATION_ROUTES: readonly Route[] = VALIDATION_FRAMES.map(
  ([slug, frameId, terminalWeapon]) => {
    const base = basePlan(slug);
    const plan: T2ClassPlan = {
      ...base,
      frameId,
      hypothesis:
        `${base.hypothesis} Final validation arm: hold the normal gear, ability, ` +
        `stance, Core and biome policy while testing ${frameId}.`,
    };
    return allowLongValidationFarms(makeT2Route({
      plan,
      branch: "mid",
      version: "canonical-validation-2026-09-10-1.0.0",
      bossless: true,
      routeId: `${slug}-t2-canonical-${frameId.split("-").at(-1)}`,
      entryAssertions: entryAssertions(frameId),
      terminalAssertions: terminalAssertions(frameId, terminalWeapon),
    }));
  },
);

export const T2_CANONICAL_VALIDATION_ROUTE_IDS: readonly string[] =
  T2_CANONICAL_VALIDATION_ROUTES.map((route) => route.id);
