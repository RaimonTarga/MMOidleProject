import assert from "node:assert/strict";
import { ObservationWindow } from "../route/observationWindow";
import { CAMPAIGN_BEHAVIOR_ROUTES, CAMPAIGN_LOCAL_BEHAVIOR_ROUTES } from "./campaignBehavior";
import { resolveNodeCandidates } from "../route/conditions";
import type { Observation } from "../state/observation";
import { RouteExecutor } from "../route/executor";
const window = new ObservationWindow(1000);
const local = { kind: "biome", biomeGroup: "plains", tier: 2, pick: "current" } as const;
assert.deepEqual(resolveNodeCandidates(local, { nodeId: "node-t2-plains-04" } as Observation, 0), ["node-t2-plains-04"]);
assert.deepEqual(resolveNodeCandidates(local, { nodeId: "node-t2-sanctuary" } as Observation, 0), []);
assert.deepEqual(resolveNodeCandidates(local, { nodeId: "node-t2-forest-05" } as Observation, 0), []);
assert.deepEqual(resolveNodeCandidates(local, { nodeId: null } as unknown as Observation, 0), []);
for (const route of CAMPAIGN_LOCAL_BEHAVIOR_ROUTES) {
  const windows = route.steps.filter(s => s.type === "farm" && s.observeForMs);
  assert.equal(windows.length, 2);
  assert(windows.every(s => s.type === "farm" && s.at.kind === "biome" && s.at.pick === "current"));
}
assert.equal(window.sample(10000, true), false, "prep time cannot satisfy a new window");
assert.equal(window.sample(10500, true), false);
window.sample(11000, false);
window.sample(30000, true);
assert.equal(window.elapsedMs, 500, "death, transit and missing intervals excluded");
assert.equal(window.sample(30500, true), true);
assert.throws(() => new ObservationWindow(-1));
assert.throws(() => new ObservationWindow(NaN));
for (const route of CAMPAIGN_BEHAVIOR_ROUTES) {
  const windows = route.steps.filter(s => s.type === "farm" && s.observeForMs);
  assert.equal(windows.length, 2);
  for (const step of windows) {
    const previous = route.steps[route.steps.indexOf(step) - 1];
    assert.equal(previous.type, "configureBuild", "window begins after verified configuration");
    assert.equal(step.type === "farm" && step.observeForMs, 60000);
  }
  assert.equal(route.steps.at(-1)?.type, "assert", "pending assertion prevents early completion");
  assert.equal(route.steps.some(s => s.type === "attemptBoss"), false);
}
console.log("campaignBehavior: ok");

// Exercise the actual executor predicate: a pre-satisfied objective must still
// invoke farming and wait for eligible observations, including at the XP cap.
async function executorWindowRegression(): Promise<void> {
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
      assert.deepEqual(nodes, ["node-t2-plains-04"], "farm receives the preparation node, not catalogue first");
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
async function transitRecoveryRegression(): Promise<void> {
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
executorWindowRegression().then(transitRecoveryRegression).then(() => console.log("campaign executor observation and transit regressions: ok"));
