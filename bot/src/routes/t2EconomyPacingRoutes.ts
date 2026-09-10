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
 * First-three-biome Tier-2 economy/progression measurement arms.
 *
 * These routes keep the live class gear and encounter plans unchanged and stop
 * at Swamp. They exist to expose the time spent in Plains -> Forest -> Swamp
 * before a full-gauntlet run is justified. The normal no-progress watchdog is
 * intentionally left intact; only active farm step time is extended because a
 * canonical 1x biome can legitimately take longer than the generic 30-minute
 * route-step budget.
 */
const ECONOMY_PACING_FARM_TIMEOUT_MS = 2 * 60 * 60 * 1000;

function allowLongPacingFarms(route: Route): Route {
  return {
    ...route,
    steps: route.steps.map((step) =>
      step.type === "farm"
        ? { ...step, stepTimeoutMs: ECONOMY_PACING_FARM_TIMEOUT_MS }
        : step,
    ),
  };
}

function basePlan(slug: string): T2ClassPlan {
  const plan = T2_CLASS_PLANS.find((candidate) => candidate.slug === slug);
  if (!plan) throw new Error(`T2 economy pacing base plan missing: ${slug}`);
  return plan;
}

function entryAssertions(frameId: string): T2TreatmentAssertion[] {
  return [
    {
      condition: { type: "playerTierAtLeast", tier: 2 },
      message: "Tier-2 economy pacing entry is player tier 2",
    },
    {
      condition: { type: "globalMasteryAtLeast", value: 30 },
      message: "Tier-2 economy pacing entry carries the T1 mastery boundary",
    },
    {
      condition: { type: "frameSelected", frameId },
      message: `economy pacing frame is ${frameId}`,
    },
    {
      condition: { type: "equipped", definitionId: "chaotic-axe" },
      message: "economy pacing entry preserves the intended T1 endgame weapon",
    },
  ];
}

const REPRESENTATIVE_ARMS = [
  ["squire", "cooldown-heavy"],
  ["striker", "cadence-balanced"],
  ["spirit", "energy-heavy"],
] as const;

export const T2_ECONOMY_PACING_ROUTES: readonly Route[] = REPRESENTATIVE_ARMS.map(
  ([slug, frameId]) => {
    const base = basePlan(slug);
    const plan: T2ClassPlan = {
      ...base,
      frameId,
      hypothesis:
        `${base.hypothesis} Economy pacing arm: measure the ordinary resource ` +
        `and mastery timeline through Swamp under ${frameId}.`,
    };
    return allowLongPacingFarms(makeT2Route({
      plan,
      branch: "mid",
      version: "economy-pacing-2026-09-10-1.0.0",
      bossless: true,
      stopAfter: "swamp",
      routeId: `${slug}-t2-economy-pacing-${frameId.split("-").at(-1)}`,
      entryAssertions: entryAssertions(frameId),
    }));
  },
);

export const T2_ECONOMY_PACING_ROUTE_IDS: readonly string[] =
  T2_ECONOMY_PACING_ROUTES.map((route) => route.id);
