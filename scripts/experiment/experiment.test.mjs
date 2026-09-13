import assert from "node:assert/strict";
import "./release.test.mjs";
import { mkdtempSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addQueueEntries,
  allExperimentsTerminal,
  availableGlobalSlot,
  availableSlot,
  buildRunPlan,
  globalActiveRunCount,
  isTerminal,
  loadQueueRegistry,
  makeExperimentId,
  markQueueEntryStatus,
  normalizeCreateOptions,
  parseArgs,
  sanitizeId,
  selectNextQueuedRunAcross,
  writeJsonAtomic,
} from "./lib.mjs";

// Exercise real file publication while deterministically injecting Windows
// sharing failures. Readers must see the old whole state until rename succeeds.
const atomicDir = mkdtempSync(join(tmpdir(), "mmo-atomic-test-"));
try {
  const statePath = join(atomicDir, "state.json");
  writeJsonAtomic(statePath, { version: 1 });
  let calls = 0;
  let waits = 0;
  writeJsonAtomic(statePath, { version: 2 }, {
    rename: (from, to) => {
      assert.equal(JSON.parse(readFileSync(to, "utf8")).version, 1);
      if (++calls < 3) throw Object.assign(new Error("busy"), { code: "EPERM" });
      renameSync(from, to);
    }, wait: () => { waits++; },
  });
  assert.equal(waits, 2);
  assert.equal(JSON.parse(readFileSync(statePath, "utf8")).version, 2);
  for (const code of ["EPERM", "EIO"]) {
    calls = 0;
    assert.throws(() => writeJsonAtomic(statePath, { version: 3 }, {
      rename: () => { calls++; throw Object.assign(new Error(code), { code }); }, wait: () => {},
    }), new RegExp(code));
    assert.equal(calls, code === "EPERM" ? 21 : 1);
    assert.equal(JSON.parse(readFileSync(statePath, "utf8")).version, 2);
    assert.deepEqual(readdirSync(atomicDir), ["state.json"]);
  }
} finally { rmSync(atomicDir, { recursive: true, force: true }); }

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
assert.equal(smoke.requireTierEntrySnapshot, false);
const checkpointSmoke = normalizeCreateOptions({
  revision: "HEAD",
  routes: "striker-t2-day-jungle-frame-light",
  mode: "smoke-isolated",
  rewardMultiplier: "25",
  tierEntrySnapshotDir: "inputs",
  requireTierEntrySnapshot: "true",
});
assert.equal(checkpointSmoke.requireTierEntrySnapshot, true);
throws("requires --tierEntrySnapshot", () => normalizeCreateOptions({
  revision: "HEAD",
  routes: "striker-t2-day-jungle-frame-light",
  mode: "smoke-isolated",
  rewardMultiplier: "25",
  requireTierEntrySnapshot: "true",
}));
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

// --- Cross-cohort queue controller (Phase 1 orchestration repair) ---------

// slotBase simulates the controller handing out globally-unique slot numbers
// across cohorts (a real queue controller never lets two managed experiments
// reuse the same global slot, unlike each experiment's own independent
// 1..workerConcurrency numbering).
function fakeState(runStatuses, slotBase = 0) {
  return {
    runs: runStatuses.map((status, index) => ({
      runKey: `r${index}`,
      status,
      workerSlot: status === "starting" || status === "running" ? slotBase + index + 1 : null,
    })),
  };
}

// A never-launched registry entry is unambiguously "not-started": every run is
// still queued and the entry itself never flipped to "active".
const neverLaunchedRegistry = loadQueueRegistry("/nonexistent-root-for-test");
assert.equal(neverLaunchedRegistry.entries.length, 0);
const added = addQueueEntries(neverLaunchedRegistry, ["cohort-a", "cohort-b"]);
assert.deepEqual(added, ["cohort-a", "cohort-b"]);
assert(neverLaunchedRegistry.entries.every((entry) => entry.status === "queued"));
// Re-adding the same ids is a no-op (idempotent registration, safe on resume).
assert.deepEqual(addQueueEntries(neverLaunchedRegistry, ["cohort-a", "cohort-c"]), ["cohort-c"]);
assert.equal(neverLaunchedRegistry.entries.length, 3);

throws("unknown queue entry status", () => markQueueEntryStatus(neverLaunchedRegistry, "cohort-a", "bogus"));
markQueueEntryStatus(neverLaunchedRegistry, "cohort-a", "active");
assert.equal(neverLaunchedRegistry.entries.find((entry) => entry.experimentId === "cohort-a").status, "active");

// Global active-run accounting sums across every managed experiment, not just one.
const statesAllIdle = [
  { experimentId: "cohort-a", state: fakeState(["queued", "queued"]) },
  { experimentId: "cohort-b", state: fakeState(["queued", "queued", "queued"]) },
];
assert.equal(globalActiveRunCount(statesAllIdle), 0);
assert.equal(availableGlobalSlot(statesAllIdle, 4), 1);

const statesBusy = [
  { experimentId: "cohort-a", state: fakeState(["running", "starting", "queued"], 0) },
  { experimentId: "cohort-b", state: fakeState(["running", "queued"], 2) },
];
assert.equal(globalActiveRunCount(statesBusy), 3);
// 4 global workers, 3 active -> exactly one slot free regardless of which
// cohort happens to hold it.
assert.equal(availableGlobalSlot(statesBusy, 4), 4);

// All 4 global slots occupied across two cohorts -> nobody gets to start,
// which is exactly the "maximum 4 active workers globally" requirement.
const statesFull = [
  { experimentId: "cohort-a", state: fakeState(["running", "running"], 0) },
  { experimentId: "cohort-b", state: fakeState(["running", "running", "queued"], 2) },
];
assert.equal(globalActiveRunCount(statesFull), 4);
assert.equal(availableGlobalSlot(statesFull, 4), null);

// Freed capacity anywhere lets a queued run from *either* cohort acquire the
// slot (Phase 2's readiness requirement): once cohort-a's runs finish, the
// next queued run is still found even though it belongs to cohort-b.
const statesAfterCohortAFinished = [
  { experimentId: "cohort-a", state: fakeState(["completed", "completed"]) },
  { experimentId: "cohort-b", state: fakeState(["running", "running", "queued"]) },
];
const nextAfterFree = selectNextQueuedRunAcross(statesAfterCohortAFinished);
assert.equal(nextAfterFree.experimentId, "cohort-b");
assert.equal(nextAfterFree.runState.runKey, "r2");

// Scheduling fairness is registration order: cohort registered first offers
// its queued run before a later cohort, even if both have queued work.
const statesBothQueued = [
  { experimentId: "cohort-a", state: fakeState(["queued"]) },
  { experimentId: "cohort-b", state: fakeState(["queued"]) },
];
assert.equal(selectNextQueuedRunAcross(statesBothQueued).experimentId, "cohort-a");

// A fully terminal mix (completed/failed/timed_out/cancelled) across cohorts
// is recognized as done with no queued run left to pick.
const statesDone = [
  { experimentId: "cohort-a", state: fakeState(["completed", "cancelled"]) },
  { experimentId: "cohort-b", state: fakeState(["failed", "timed_out"]) },
];
assert.equal(allExperimentsTerminal(statesDone), true);
assert.equal(selectNextQueuedRunAcross(statesDone), null);
assert.equal(availableSlot(fakeState(["running", "running"]), 4), 3);

console.log("experiment.test.mjs: ok");
