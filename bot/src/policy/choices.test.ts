import assert from "node:assert/strict";
import { parseChoices, resolveChoices } from "./choices";
import { requirePolicy } from "./profiles";
import { STRIKER_DECISIONS_T1 } from "../routes/strikerDecisionsT1";
import { STRIKER_T1 } from "../routes/strikerT1";
import { RouteExecutor, type ExecutorDeps } from "../route/executor";

assert.throws(() => parseChoices('["early"]'));
assert.throws(() => parseChoices('{"boss-preparation":true}'));
assert.throws(() => resolveChoices(STRIKER_T1, { typo: "early" }));
assert.throws(() => resolveChoices(STRIKER_T1, {}, requirePolicy("early-boss").choices));
assert(STRIKER_DECISIONS_T1.retired?.includes("+N ladder"));
assert.equal(STRIKER_DECISIONS_T1.steps.length, 0);
assert(STRIKER_T1.steps.every(s => !s.choice), "baseline must remain untouched");

// Retirement must fail before any observation, farming, or purchase.
async function main() {
  const executor = new RouteExecutor({ route: STRIKER_DECISIONS_T1 } as ExecutorDeps);
  await assert.rejects(() => executor.run(), /retired:.*upgrade decision/);
  console.log("player choices and retired route: ok");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
