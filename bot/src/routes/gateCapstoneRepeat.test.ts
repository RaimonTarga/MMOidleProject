/**
 * A capstone loop's boss step must be marked `repeat`.
 *
 * The gate asks for N capstone drops and only the biome boss drops them, so the bot has
 * to kill that boss N times. `doAttemptBoss` answered "is this fight won?" with
 * `obs.bossCleared(biome, tier)` — which is the biome's FIRST clear and stays true
 * forever — so after the first kill every later attempt returned instantly. Seen live at
 * 1x on 2026-10-02: five `boss forest T1` steps starting *and* ending at the same
 * millisecond, then `repeatUntil exhausted 5 iterations`, with the Greatbear beaten once
 * and the gate unpaid. At 25x rewards one kill dropped `round(25)` capstones, so the
 * whole defect was invisible until the first canonical run.
 *
 * `repeat: true` switches the win signal to the capstone wallet, which rises once per
 * kill. This suite pins the wiring and the reason it is needed:
 *
 *   1. Every boss step inside a `repeatUntil` carries `repeat`.
 *   2. The plain seal steps do NOT — a seal is won once, and re-fighting a boss whose
 *      seal is already held is exactly what the early return is for.
 *   3. The gate really does ask for more than one capstone, which is what makes a
 *      non-repeat step unable to finish it.
 *
 * It is a structural test: the predicate itself lives in a private method behind the
 * lease, intents and recorder deps, so what is pinned here is that the step which needs
 * it asks for it.
 */
import assert from "node:assert/strict";
import { TUTORIAL_ROUTES } from "./tutorialRoutes";
import type { Condition, RouteStep } from "../route/types";

type BossStep = Extract<RouteStep, { type: "attemptBoss" }>;

function bossStepsOf(steps: readonly RouteStep[]): { direct: BossStep[]; repeated: BossStep[] } {
  const direct: BossStep[] = [];
  const repeated: BossStep[] = [];
  for (const step of steps) {
    if (step.type === "attemptBoss") direct.push(step);
    else if (step.type === "repeatUntil") {
      for (const inner of step.steps) {
        if (inner.type === "attemptBoss") repeated.push(inner);
      }
    }
  }
  return { direct, repeated };
}

/** Every `capstoneAtLeast` a condition tree asks for. */
function capstoneDemands(condition: Condition): { biome: string; amount: number }[] {
  if (condition.type === "capstoneAtLeast") {
    return [{ biome: condition.biome, amount: condition.amount }];
  }
  if (condition.type === "allOf" || condition.type === "anyOf") {
    return condition.of.flatMap(capstoneDemands);
  }
  return [];
}

assert.ok(TUTORIAL_ROUTES.length > 0, "the tutorial routes should exist");

let repeatedSeen = 0;
for (const route of TUTORIAL_ROUTES) {
  const { direct, repeated } = bossStepsOf(route.steps);

  // 1. A boss step inside a repeat loop needs a fresh kill every round.
  for (const step of repeated) {
    assert.equal(
      step.repeat,
      true,
      `${route.id}: the ${step.biomeGroup} T${step.tier} boss step inside a repeatUntil must ` +
        `carry repeat:true, or every round after the first returns the moment the seal exists`,
    );
    repeatedSeen += 1;
  }

  // 2. A one-shot seal step must NOT, so an already-won boss is still skipped.
  for (const step of direct) {
    assert.notEqual(
      step.repeat,
      true,
      `${route.id}: the ${step.biomeGroup} T${step.tier} seal step must not be repeatable — ` +
        `a held seal should skip the fight, not re-run it`,
    );
  }
  assert.ok(
    direct.length > 0,
    `${route.id}: the tutorial fights its seals with plain attemptBoss steps`,
  );
}
assert.ok(
  repeatedSeen > 0,
  "no tutorial route has a repeated boss step; this suite would pass vacuously",
);

// 3. The gate asks for MORE THAN ONE capstone, which is what a non-repeat step cannot
//    deliver. If a future edit drops the gate to one drop the repeat becomes harmless
//    rather than load-bearing, and this assertion is the place that says so.
let gatesChecked = 0;
for (const route of TUTORIAL_ROUTES) {
  for (const step of route.steps) {
    if (step.type !== "repeatUntil") continue;
    const demands = capstoneDemands(step.until);
    if (demands.length === 0) continue;
    for (const demand of demands) {
      assert.ok(
        demand.amount > 1,
        `${route.id}: the gate asks for ${demand.amount} ${demand.biome} capstone(s); ` +
          `at 1 a single kill would do and the repeat would no longer be load-bearing`,
      );
      gatesChecked += 1;
    }
  }
}
assert.ok(gatesChecked > 0, "no gate capstone demand found; check the gate beat's until condition");

console.log("gateCapstoneRepeat.test.ts: ok");
