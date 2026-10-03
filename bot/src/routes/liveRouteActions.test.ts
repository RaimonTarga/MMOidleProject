import assert from "node:assert/strict";
import { lineageForRecipeId } from "@mmo-idle/shared";
import { ROUTES } from "./index";
import type { RouteStep } from "../route/types";

function check(steps: readonly RouteStep[], routeId: string): void {
  const unlocked = new Set<string>();
  for (const step of steps) {
    assert(!["upgrade", "evolveItem"].includes(step.type), `${routeId}: retired action ${step.type}`);
    if (step.type === "unlockForm") {
      assert.equal(step.lineageId, lineageForRecipeId(step.recipeId)?.id);
      unlocked.add(step.recipeId);
    }
    if (step.type === "wearForm") assert(unlocked.has(step.recipeId), `${routeId}: unlock before wear`);
    if (step.type === "repeatUntil" || step.type === "ifPossible") check(step.steps, routeId);
  }
}
for (const route of ROUTES.values()) {
  if (route.retired) { assert.equal(route.steps.length, 0); continue; }
  check(route.steps, route.id);
}
console.log("liveRouteActions: ok");
