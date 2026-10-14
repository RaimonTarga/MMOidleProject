import assert from "node:assert/strict";
import { parseChoices, resolveChoices } from "./choices";
import { requirePolicy } from "./profiles";
import { requireRoute } from "../routes";
import { SMOKE_T1_ID } from "../routes/smokeT1";
import { RouteExecutor, type ExecutorDeps } from "../route/executor";
import type { Route } from "../route/types";

const smoke = requireRoute(SMOKE_T1_ID);

// An authored decision: two alternatives for the same step, one the default.
const decided: Route = {
  ...smoke,
  id: "test-choices",
  steps: [
    ...smoke.steps,
    { type: "milestone", id: "early", choice: { id: "boss-preparation", option: "early", defaultOption: "late" } },
    { type: "milestone", id: "late", choice: { id: "boss-preparation", option: "late", defaultOption: "late" } },
  ],
};

assert.throws(() => parseChoices('["early"]'));
assert.throws(() => parseChoices('{"boss-preparation":true}'));
assert.throws(() => resolveChoices(smoke, { typo: "early" }), "an unknown override is rejected");
assert.throws(
  () => resolveChoices(smoke, {}, requirePolicy("early-boss").choices),
  "a profile preference needs an authored matching decision",
);
assert(smoke.steps.every(s => !s.choice), "the smoke route authors no decisions");

{
  const { route, selected } = resolveChoices(decided, {});
  assert.deepEqual(selected, { "boss-preparation": "late" }, "the default option is selected");
  assert.equal(route.steps.length, smoke.steps.length + 1, "the unselected alternative is removed");
  const early = resolveChoices(decided, {}, requirePolicy("early-boss").choices);
  assert.deepEqual(early.selected, { "boss-preparation": "early" }, "the profile preference is honoured");
  assert.throws(() => resolveChoices(decided, { "boss-preparation": "never" }), "an unknown option is rejected");
}

// Retirement must fail before any observation, farming, or purchase.
async function main() {
  const retired: Route = { ...smoke, id: "test-retired", retired: "kept for the record only", steps: [] };
  const executor = new RouteExecutor({ route: retired } as ExecutorDeps);
  await assert.rejects(() => executor.run(), /retired: kept for the record only/);
  console.log("player choices and retired route: ok");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
