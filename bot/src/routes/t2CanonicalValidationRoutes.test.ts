import { T2_CANONICAL_VALIDATION_ROUTES } from "./t2CanonicalValidationRoutes";
import type { RouteStep } from "../route/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function flatten(steps: readonly RouteStep[]): RouteStep[] {
  const out: RouteStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (step.type === "ifPossible" || step.type === "repeatUntil") out.push(...flatten(step.steps));
  }
  return out;
}

assert(T2_CANONICAL_VALIDATION_ROUTES.length === 4, "two classes x two frame arms");
assert(
  new Set(T2_CANONICAL_VALIDATION_ROUTES.map((route) => route.id)).size === 4,
  "canonical validation route ids are unique",
);

for (const route of T2_CANONICAL_VALIDATION_ROUTES) {
  assert(route.startsFromTierEntry === 2, `${route.id}: T2 entry declared`);
  assert(route.frameId, `${route.id}: frame declared`);
  assert(!flatten(route.steps).some((step) => step.type === "attemptBoss"), `${route.id}: bossless validation route`);
  const assertions = flatten(route.steps).filter(
    (step): step is Extract<RouteStep, { type: "assert" }> => step.type === "assert",
  );
  assert(
    assertions.some((step) => step.condition.type === "frameSelected" && step.condition.frameId === route.frameId),
    `${route.id}: entry frame assertion matches the route frame`,
  );
  assert(
    assertions.some((step) => step.condition.type === "equipped" && step.condition.definitionId === "core-force"),
    `${route.id}: terminal farming Core assertion present`,
  );
}

console.log("t2CanonicalValidationRoutes.test.ts: ok");
