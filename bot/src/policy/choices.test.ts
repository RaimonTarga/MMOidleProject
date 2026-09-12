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
const prepared = resolveChoices(STRIKER_DECISIONS_T1, {});
const early = resolveChoices(STRIKER_DECISIONS_T1, {}, requirePolicy("early-boss").choices);
const retained = resolveChoices(STRIKER_DECISIONS_T1, {}, requirePolicy("familiar-gear").choices);
assert.equal(prepared.selected["boss-preparation"], "prepared");
const beforeBoss = (route: typeof STRIKER_T1) => route.steps.slice(0, route.steps.findIndex(s => s.type === "attemptBoss"));
assert(beforeBoss(prepared.route).some(s => s.type === "upgrade"));
assert(!beforeBoss(early.route).some(s => s.type === "upgrade"));
assert.equal(early.route.steps.filter(s => s.type === "upgrade").length, STRIKER_T1.steps.filter(s => s.type === "upgrade").length);
assert(retained.route.steps.filter(s => s.type === "equip").length < prepared.route.steps.filter(s => s.type === "equip").length);
assert.equal(resolveChoices(STRIKER_DECISIONS_T1, { "boss-preparation": "prepared" }, requirePolicy("early-boss").choices).selected["boss-preparation"], "prepared");
assert.throws(() => resolveChoices(STRIKER_DECISIONS_T1, { "boss-preparation": "imaginary" }));
assert(STRIKER_T1.steps.every(s => !s.choice), "baseline must remain untouched");

// Exercise the actual executor's deferred-spend boundary: it must return without farming or purchasing.
async function main() {
const events: any[] = [];
const executor = new RouteExecutor({
  policy: requirePolicy("affordable-upgrades"), aborted: () => false,
  obs: { maxUpgradeFor: () => 5, itemPlus: () => 0, canUpgrade: () => ({ ok: false, reason: "insufficient essence" }) },
  recorder: { now: () => 0, emit: (e: unknown) => events.push(e) },
  intents: new Proxy({}, { get: () => () => { throw new Error("unexpected purchase"); } }),
} as unknown as ExecutorDeps);
await (executor as unknown as { doUpgrade(step: unknown): Promise<void> }).doUpgrade({ type: "upgrade", definitionId: "plains-vest-t1", toPlus: 3 });
assert.equal(events[0].detail.decision, "defer-upgrade");
assert.equal(events[0].detail.reason, "insufficient essence");
console.log("player choices and affordable upgrades: ok");

}
main().catch(error => { console.error(error); process.exitCode = 1; });
