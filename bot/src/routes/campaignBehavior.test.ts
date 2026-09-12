import assert from "node:assert/strict";
import { ObservationWindow } from "../route/observationWindow";
import { CAMPAIGN_BEHAVIOR_ROUTES } from "./campaignBehavior";
import { RouteExecutor } from "../route/executor";
const window = new ObservationWindow(1000);
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
    const obs = { self: { auto: false, isDead: false }, nodeId: "node-t2-plains-01" };
    const executor = new RouteExecutor({ obs, startedAt: 0,
      policy: { farmCondition: (condition: unknown) => condition } } as never);
    let invoked = false;
    Object.assign(executor, { farmUntil: async (_nodes: string[], done: () => boolean, opts: { ignoreBiomeCap: boolean }) => {
      invoked = true;
      assert.equal(opts.ignoreBiomeCap, true);
      assert.equal(done(), false);
      now += 5000; assert.equal(done(), false, "auto-off prep does not count");
      obs.self.auto = true; assert.equal(done(), false);
      now += 500; assert.equal(done(), false);
      obs.self.isDead = true; now += 500; assert.equal(done(), false);
      obs.self.isDead = false; now += 500; assert.equal(done(), false);
      now += 500; assert.equal(done(), true);
    } });
    await (executor as unknown as { doFarm: (step: unknown) => Promise<void> }).doFarm({
      type: "farm", at: { kind: "node", nodeId: obs.nodeId }, until: { type: "elapsedMs", ms: 0 }, observeForMs: 1000,
    });
    assert.equal(invoked, true);
  } finally { Date.now = originalNow; }
}
executorWindowRegression().then(() => console.log("campaign executor observation regression: ok"));
