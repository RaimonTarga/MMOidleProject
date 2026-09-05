import assert from "node:assert/strict";
import {
  buildRunPlan,
  isTerminal,
  makeExperimentId,
  normalizeCreateOptions,
  parseArgs,
  sanitizeId,
} from "./lib.mjs";

function throws(message, fn) {
  assert.throws(fn, (error) => error instanceof Error && error.message.includes(message));
}

const args = parseArgs(["--revision=HEAD", "--routes=striker-t1,squire-t1", "--workers=2", "--flag"]);
assert.equal(args.revision, "HEAD");
assert.equal(args.routes, "striker-t1,squire-t1");
assert.equal(args.flag, "true");

const canonical = normalizeCreateOptions(args);
assert.equal(canonical.mode, "canonical-isolated");
assert.equal(canonical.workerConcurrency, 2);
assert.equal(canonical.rewardMultiplier, 1);
assert.equal(canonical.completionMode, "full-gauntlet");

throws("--revision", () => normalizeCreateOptions({ routes: "striker-t1" }));
throws("--routes", () => normalizeCreateOptions({ revision: "HEAD" }));
throws("integer from 1 to 4", () => normalizeCreateOptions({ revision: "HEAD", routes: "striker-t1", workers: "6" }));
throws("rewardMultiplier=1", () => normalizeCreateOptions({ revision: "HEAD", routes: "striker-t1", rewardMultiplier: "25" }));
throws("real --tierEntrySnapshot", () => normalizeCreateOptions({ revision: "HEAD", routes: "striker-t2-mid" }));

const smoke = normalizeCreateOptions({
  revision: "HEAD",
  routes: "striker-t1,squire-t1",
  policies: "intended",
  mode: "smoke-isolated",
  rewardMultiplier: "25",
  completion: "next-tier",
  count: "2",
});
const plan = buildRunPlan(smoke, "experiment-id");
assert.equal(plan.length, 4);
assert.deepEqual(plan.map((run) => run.routeId), ["striker-t1", "squire-t1", "striker-t1", "squire-t1"]);
assert(plan.every((run) => run.status === "queued" && run.attempt === 1));
assert.equal(new Set(plan.map((run) => run.runKey)).size, plan.length);

assert.equal(isTerminal("completed"), true);
assert.equal(isTerminal("failed"), true);
assert.equal(isTerminal("running"), false);
assert.equal(sanitizeId("T1 / Test Name"), "t1-test-name");
assert.match(makeExperimentId("My Test", new Date("2026-09-05T12:34:56.000Z")), /^20260905t123456z-my-test$/);

console.log("experiment.test.mjs: ok");
