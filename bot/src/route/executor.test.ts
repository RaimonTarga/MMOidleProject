/**
 * Executor regressions over small inline routes. Kept from the retired campaign
 * route suites: the behavior they pinned belongs to the harness, not to any
 * class's route.
 */
import assert from "node:assert/strict";
import { ObservationWindow } from "./observationWindow";
import { evaluate, resolveNodeCandidates } from "./conditions";
import { RouteExecutor, type ExecutorDeps } from "./executor";
import type { Route } from "./types";
import type { Observation } from "../state/observation";
import { requirePolicy } from "../policy/profiles";

// ── `pick: "current"` observes in place and never turns into a trip ──────────
const local = { kind: "biome", biomeGroup: "plains", tier: 2, pick: "current" } as const;
assert.deepEqual(resolveNodeCandidates(local, { nodeId: "node-t2-plains-04" } as Observation, 0), ["node-t2-plains-04"]);
assert.deepEqual(resolveNodeCandidates(local, { nodeId: "node-t2-sanctuary" } as Observation, 0), []);
assert.deepEqual(resolveNodeCandidates(local, { nodeId: "node-t2-forest-05" } as Observation, 0), []);
assert.deepEqual(resolveNodeCandidates(local, { nodeId: null } as unknown as Observation, 0), []);

// ── An observation window counts only alive, auto-enabled, in-area time ──────
{
  const window = new ObservationWindow(1000);
  assert.equal(window.sample(10000, true), false, "prep time cannot satisfy a new window");
  assert.equal(window.sample(10500, true), false);
  window.sample(11000, false);
  window.sample(30000, true);
  assert.equal(window.elapsedMs, 500, "death, transit and missing intervals excluded");
  assert.equal(window.sample(30500, true), true);
  assert.throws(() => new ObservationWindow(-1));
  assert.throws(() => new ObservationWindow(NaN));
}

// ── `fullyRecovered` means alive, full HP and nothing ticking ────────────────
for (const [hp, incomingDot, isDead, expected] of [
  [100, 0, false, true], [99, 0, false, false], [100, 2, false, false], [100, 0, true, false],
] as const) {
  assert.equal(
    evaluate({ type: "fullyRecovered" }, { elapsedMs: 0, obs: { self: { hp, maxHp: 100, incomingDot, isDead } } } as never),
    expected,
  );
}

const fixtureRoute: Route = {
  id: "test-executor",
  version: "1",
  classRoot: "cadence-root",
  description: "executor fixture",
  steps: [],
  completion: { type: "elapsedMs", ms: 0 },
  milestones: [],
};

// A pre-satisfied objective must still invoke farming and wait for eligible
// observations, including at the XP cap.
async function observationWindowFarm(): Promise<void> {
  const originalNow = Date.now;
  let now = 100000;
  Date.now = () => now;
  try {
    const obs = { self: { auto: false, isDead: false }, nodeId: "node-t2-plains-04" };
    const executor = new RouteExecutor({ obs, startedAt: 0,
      policy: { farmCondition: (condition: unknown) => condition } } as never);
    let invoked = false;
    Object.assign(executor, { farmUntil: async (nodes: string[], done: () => boolean, opts: { ignoreBiomeCap: boolean }) => {
      invoked = true;
      assert.deepEqual(nodes, ["node-t2-plains-04"], "farm receives the current node, not the catalogue's first");
      assert.equal(opts.ignoreBiomeCap, true);
      assert.equal(done(), false);
      now += 5000; assert.equal(done(), false, "auto-off prep does not count");
      obs.self.auto = true; assert.equal(done(), false);
      now += 500; assert.equal(done(), false);
      obs.self.isDead = true; now += 500; assert.equal(done(), false);
      obs.self.isDead = false; now += 500; assert.equal(done(), false);
      obs.nodeId = "node-t2-plains-01"; now += 500; assert.equal(done(), false, "another Plains node cannot count toward the fixed window");
      obs.nodeId = "node-t2-plains-04"; now += 500; assert.equal(done(), false);
      now += 500; assert.equal(done(), true);
    } });
    await (executor as unknown as { doFarm: (step: unknown) => Promise<void> }).doFarm({
      type: "farm", at: local, until: { type: "elapsedMs", ms: 0 }, observeForMs: 1000,
    });
    assert.equal(invoked, true);
  } finally { Date.now = originalNow; }
}

// A death in transit re-issues the walk once the bot is alive again, and
// suppressed or foreign transit never turns into farming.
async function transitRecovery(): Promise<void> {
  const originalNow = Date.now;
  let now = 100000;
  Date.now = () => now;
  try {
    for (const foreign of [false, true]) {
      let deaths = 0;
      let navigations = 0;
      let combatEnables = 0;
      const obs = { self: { isDead: false }, nodeId: "source", attackersOnSelf: () => [{}] };
      const executor = new RouteExecutor({ obs,
        route: { suppressTransitCombat: !foreign },
        deathCount: () => deaths,
        leaseSession: foreign ? { isForeignNode: () => true, ownsNode: () => false, releaseNode: () => {} } : undefined,
        recorder: { setActivity: () => {} },
        intents: { setAuto: (on: boolean) => { if (on) combatEnables++; }, navigateTo: () => { navigations++; } },
      } as never);
      Object.assign(executor, { waitUntil: async (done: () => boolean, opts: { onPoll: () => void }) => {
        assert.equal(navigations, 1);
        deaths++; obs.self.isDead = true; opts.onPoll(); opts.onPoll();
        assert.equal(navigations, 1, "do not navigate a corpse");
        obs.self.isDead = false; obs.nodeId = "hub"; opts.onPoll();
        assert.equal(navigations, 2, "death remains pending until live respawn");
        opts.onPoll();
        assert.equal(navigations, 2, "do not repeatedly replay the same death");
        for (let i = 0; i < 62; i++) { now += 1000; opts.onPoll(); }
        assert.equal(navigations, 3, "attackers cannot suppress the bounded navigation retry");
        assert.equal(combatEnables, 0, "suppressed or foreign transit never enables farming");
        obs.nodeId = "destination";
        assert.equal(done(), true);
      } });
      await (executor as unknown as { ensureAt: (nodeId: string) => Promise<void> }).ensureAt("destination");
    }
  } finally { Date.now = originalNow; }
}

// A step that `requires` a seal runs after the win and is skipped, not waited
// on, once that boss's attempts are exhausted.
async function failedSealSkipsDependents(): Promise<void> {
  const seal = { type: "bossCleared", biomeGroup: "swamp", tier: 2 } as const;
  const route: Route = {
    ...fixtureRoute,
    completion: seal,
    steps: [
      { type: "farm", at: local, until: { type: "elapsedMs", ms: 0 }, observeForMs: 60_000, requires: seal },
      { type: "assert", condition: seal, requires: seal },
    ],
  };
  for (const won of [true, false]) {
    const executed: string[] = [];
    const executor = new RouteExecutor({ route, aborted: () => false,
      recorder: { emit: () => {}, now: () => 0 },
    } as never);
    Object.assign(executor, { test: () => won, checkMilestones: () => {},
      failedFacts: new Set(won ? [] : ["bossCleared:swamp:2"]),
      runStep: async (step: { type: string }) => { executed.push(step.type); },
    });
    await executor.run();
    assert.deepEqual(executed, won ? ["farm", "assert"] : [], "observe after a win; skip after exhausted boss attempts");
  }
}

// Every named capture runs even when the route's completion already holds, and
// each one stops automation first.
async function checkpointCapture(): Promise<void> {
  const names: string[] = [];
  const actions: string[] = [];
  const route: Route = {
    ...fixtureRoute,
    steps: [
      { type: "captureCheckpoint", boundaryId: "first" },
      { type: "captureCheckpoint", boundaryId: "second" },
    ],
  };
  const runner = new RouteExecutor({ route, policy: requirePolicy("intended"), aborted: () => false,
    startedAt: Date.now(), obs: { self: null },
    recorder: { now: () => 0, emit: () => {} }, captureCheckpoint: async (id: string) => { names.push(id); },
    intents: { setAuto: () => actions.push("auto-off"), setAutoTraverse: () => actions.push("traverse-off") },
  } as unknown as ExecutorDeps);
  await runner.run();
  assert.deepEqual(names, ["first", "second"]);
  assert.equal(actions.length, 4);
  assert.equal(runner.outcomes.length, 2, "a pre-satisfied completion must not skip a named capture");
}

// Local movement is an ordinary movement intent, confirmed by observation, and
// only from the declared starting node.
async function moveWithinNode(): Promise<void> {
  const step = { type: "moveWithinNode", nodeId: "node-t1-plains-01", position: { x: 4700, y: 2400 } } as const;
  const self = { pos: { x: 4795, y: 2400 }, target: { x: 4795, y: 2400 }, auto: false, autoTraverse: false, isDead: false };
  const observed: { self: typeof self; nodeId: string } = { self, nodeId: step.nodeId };
  let requested = false;
  const runner = new RouteExecutor({ route: fixtureRoute, obs: observed, aborted: () => false, startedAt: Date.now(),
    intents: { setAuto: () => {}, setAutoTraverse: () => {}, moveTo: (point: { x: number; y: number }) => {
      assert.deepEqual(self.pos, { x: 4795, y: 2400 }, "the executor does not rewrite the observed position");
      requested = true; self.pos = { ...point }; self.target = { ...point }; // the authoritative acknowledgement
    } }, recorder: { now: () => 0, emit: () => {} },
  } as unknown as ExecutorDeps);
  const api = runner as unknown as { doMoveWithinNode(s: typeof step): Promise<void> };
  await api.doMoveWithinNode(step);
  assert(requested, "an ordinary movement intent was issued");
  assert.deepEqual(self.pos, step.position);
  observed.nodeId = "node-clearing";
  await assert.rejects(() => api.doMoveWithinNode(step), /declared starting node/);
}

observationWindowFarm()
  .then(transitRecovery)
  .then(failedSealSkipsDependents)
  .then(checkpointCapture)
  .then(moveWithinNode)
  .then(() => console.log("executor.test.ts: ok"), (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
