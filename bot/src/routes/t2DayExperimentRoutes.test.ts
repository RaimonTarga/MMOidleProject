import {
  T2_DAY_CONTAGION_ROUTES,
  T2_DAY_D0_CHECKPOINT_ROUTES,
  T2_DAY_EXPERIMENT_ROUTES,
  T2_DAY_FRAME_ROUTES,
  T2_DAY_J0_CHECKPOINT_ROUTES,
  T2_DAY_J3_CHECKPOINT_ROUTES,
  T2_DAY_SURVIVALIST_ROUTES,
  T2_DAY_WEAPON_ROUTES,
} from "./t2DayExperimentRoutes";
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

assert(T2_DAY_J0_CHECKPOINT_ROUTES.length === 6, "six class J0 checkpoint routes");
assert(T2_DAY_J3_CHECKPOINT_ROUTES.length === 1, "one practical J3 checkpoint route");
assert(T2_DAY_D0_CHECKPOINT_ROUTES.length === 4, "four D0 checkpoint routes");
assert(T2_DAY_FRAME_ROUTES.length === 9, "three classes x Light/Balanced/Heavy frame arms");
assert(T2_DAY_WEAPON_ROUTES.length === 8, "four classes x two paired weapon arms");
assert(T2_DAY_CONTAGION_ROUTES.length === 4, "two classes x Sweep/Contagion arms");
assert(T2_DAY_SURVIVALIST_ROUTES.length === 8, "four classes x Tempered/Survivalist arms");
assert(T2_DAY_EXPERIMENT_ROUTES.length === 40, "checkpoint and primary route matrix totals 40 authored routes");
assert(new Set(T2_DAY_EXPERIMENT_ROUTES.map((route) => route.id)).size === 40, "day route ids are unique");

for (const route of T2_DAY_EXPERIMENT_ROUTES) {
  assert(route.startsFromTierEntry === 2, `${route.id}: T2 entry declared`);
  assert(!flatten(route.steps).some((step) => step.type === "attemptBoss"), `${route.id}: bossless experiment route`);
  assert(flatten(route.steps).some((step) => step.type === "assert"), `${route.id}: treatment assertions present`);
}

for (const route of T2_DAY_J0_CHECKPOINT_ROUTES) {
  assert(route.checkpointKind === "j0", `${route.id}: J0 checkpoint`);
  assert(!route.entryCheckpointKind, `${route.id}: source route has no entry checkpoint`);
}
for (const route of T2_DAY_J3_CHECKPOINT_ROUTES) {
  assert(route.checkpointKind === "j3", `${route.id}: J3 checkpoint`);
  assert(route.entryCheckpointKind === "j0", `${route.id}: J3 consumes J0`);
  assert(flatten(route.steps).some((step) => step.type === "milestone" && step.id === "checkpoint:j3"), `${route.id}: explicit J3 boundary`);
}
for (const route of T2_DAY_D0_CHECKPOINT_ROUTES) {
  assert(route.checkpointKind === "d0", `${route.id}: D0 checkpoint`);
  assert(route.entryCheckpointKind === "j0", `${route.id}: D0 consumes J0`);
  assert(flatten(route.steps).some((step) => step.type === "milestone" && step.id === "checkpoint:d0"), `${route.id}: explicit D0 boundary`);
}

for (const route of [
  ...T2_DAY_FRAME_ROUTES,
  ...T2_DAY_WEAPON_ROUTES,
  ...T2_DAY_CONTAGION_ROUTES,
  ...T2_DAY_SURVIVALIST_ROUTES,
]) {
  assert(route.captureTier2Handoff === false, `${route.id}: tail must not emit Snapshot B`);
  assert(
    route.entryCheckpointKind === (T2_DAY_SURVIVALIST_ROUTES.includes(route) ? "d0" : "j0"),
    `${route.id}: expected source checkpoint kind`,
  );
  assert(
    flatten(route.steps).some((step) => step.type === "assert" && step.condition.type === "frameSelected"),
    `${route.id}: live frame assertion`,
  );
}

for (const route of T2_DAY_CONTAGION_ROUTES) {
  const steps = flatten(route.steps);
  assert(steps.some((step) => step.type === "equip" && step.definitionIds.includes("swamp-mirebrand")), `${route.id}: same DoT weapon equipped`);
  assert(steps.some((step) => step.type === "assert" && step.condition.type === "equippedWeaponWithDot"), `${route.id}: spreadable DoT assertion`);
}

for (const route of T2_DAY_WEAPON_ROUTES) {
  const equipped = flatten(route.steps)
    .filter((step): step is Extract<RouteStep, { type: "equip" }> => step.type === "equip")
    .flatMap((step) => step.definitionIds);
  assert(!equipped.includes("jungle-stinger-rapier"), `${route.id}: no invalid fast on-hit arm`);
}

console.log("t2DayExperimentRoutes.test.ts: ok");
