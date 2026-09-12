import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateStudy } from "./study.mjs";
import { buildRunPlan, normalizeCreateOptions, writeRunConfig } from "./lib.mjs";
import { timeline, compareStudy, calibrate, distribution, readEvents, readJson } from "./experience.mjs";

const study = validateStudy({ schemaVersion: 1, question: "Does postponing upgrades help?", factor: "policy", arms: [
  { id: "control", route: "striker-t1", policy: "intended" },
  { id: "affordable", route: "striker-t1", policy: "affordable-upgrades" },
] });
assert.throws(() => validateStudy({ ...study, arms: [study.arms[0], { ...study.arms[1], route: "squire-t1" }] }), /more than/);
assert.throws(() => validateStudy({ ...study, arms: [study.arms[0], study.arms[0]] }), /duplicate/);
const config = { study, count: 3, mode: "canonical-isolated" };
const runs = buildRunPlan(config, "test");
assert.equal(runs.length, 6);
assert.deepEqual(runs.map(r => r.armId), ["control", "affordable", "affordable", "control", "control", "affordable"]);
assert.equal(new Set(runs.map(r => r.runKey)).size, 6);
const sample = (atMs, durationMs, activity, purpose = "farm") => ({ kind: "experience-sample", atMs, durationMs, activity, purpose, nodeId: "n" });
const t = timeline([sample(1000, 1000, "combat"), sample(2000, 1000, "combat"), sample(4000, 1000, "dead"),
  { kind: "blocked-on-resource", atMs: 4000, phase: "start", forWhat: "upgrade", blockReasons: [{ kind: "essence" }] }], 5000);
assert.deepEqual(t.activityMs, { combat: 2000, unavailable: 2000, dead: 1000 });
assert.equal(t.segments[0].endMs, 2000);
assert.equal(t.blocks[0].censored, true);
assert.equal(Object.values(t.activityMs).reduce((a, b) => a + b), 5000);
assert.throws(() => timeline([sample(1000, 1000, "combat"), sample(1500, 1000, "combat")], 2000), /overlapping/);
assert.equal(timeline([], 100).activityMs.unavailable, 100);
assert.equal(distribution([10, 20]).median, 15);

const manifest = { experimentId: "test", config, source: { gitRevision: "abc123" } };
const summaries = new Map(runs.map(r => [r.runKey, { run: { economyEvidenceEligible: true, canonical: true, gitRevision: "abc123", routeId: r.routeId, policyId: r.policyId,
  taints: [], isolationGrade: "isolated", behavior: { choices: {} }, startState: { inventory: [], hp: 10 }, classRoot: "cadence-root", rewardMultiplier: 1,
  completion: "completed", durationMs: r.armId === "control" ? 1000 : 800 }, deaths: { total: 0 } }]));
const state = { runs: runs.map(r => ({ ...r, status: "completed" })) };
const report = () => compareStudy(manifest, state, r => summaries.get(r.runKey));
assert(report().pairs.every(p => p.comparable));
assert.equal(report().arms[1].pairedDurationDeltaMs.median, -200);
summaries.get(runs[1].runKey).run.completion = "timed-out";
summaries.get(runs[1].runKey).run.canonical = false;
summaries.get(runs[1].runKey).run.economyEvidenceEligible = false;
assert.equal(report().rows[1].evidenceClass, "incomplete-observation");
assert.equal(report().pairs[0].comparable, false);
assert.equal(report().arms[1].pairedDurationDeltaMs.n, 2);
summaries.get(runs[2].runKey).run.startState.hp = 5;
assert(report().pairs[1].issues.some(i => i.includes("mismatch")));
summaries.delete(runs[4].runKey);
assert.equal(report().rows.length, 6);
assert.equal(report().pairs[2].comparable, false);

const choiceStudy = validateStudy({ schemaVersion: 1, question: "Preparation timing", factor: "choice", choiceId: "boss-preparation", arms: [
  { id: "prepared", route: "striker-decisions-t1", policy: "intended", choices: { "boss-preparation": "prepared" } },
  { id: "early", route: "striker-decisions-t1", policy: "intended", choices: { "boss-preparation": "early" } },
] });
const choiceConfig = { study: choiceStudy, count: 1, mode: "canonical-isolated" };
const choiceRuns = buildRunPlan(choiceConfig, "choice").map(r => ({ ...r, status: "completed" }));
const choiceSummaries = choiceRuns.map(r => ({ run: { ...summaries.get(runs[0].runKey).run, routeId: r.routeId,
  behavior: { choices: r.choices, reachedChoices: r.choices } } }));
const choiceReport = () => compareStudy({ ...manifest, config: choiceConfig }, { runs: choiceRuns }, r => choiceSummaries[choiceRuns.indexOf(r)]);
assert(choiceReport().pairs[0].comparable);
choiceSummaries[1].run.behavior.reachedChoices = {};
assert(choiceReport().rows[1].issues.includes("declared choice never reached"));

const header = { classRoot: "cadence-root", gitRevision: "abc123", rewardMultiplier: 1, taints: [] };
const bot = [{ kind: "run-start", atMs: 0, header }, sample(1000, 1000, "combat"), sample(2000, 1000, "idle"), { kind: "run-end", atMs: 2000, durationMs: 2000 }];
const human = [{ kind: "run-start", atMs: 0, header: { ...header, type: "HUMAN_PLAYTEST", characterId: "human" } },
  ...[0, 200, 400, 600, 800, 1000, 2000].map(atMs => ({ kind: "position-sample", atMs, combat: atMs < 1000 })),
  { kind: "world", atMs: 600, event: { kind: "kill", killer: { id: "other" } } },
  { kind: "world", atMs: 700, event: { kind: "kill", killer: { ownerPlayerId: "human" } } },
  { kind: "run-end", atMs: 2000, durationMs: 2000 }];
const calibrated = calibrate(bot, human, { label: "same node", botStartMs: 0, humanStartMs: 0, durationMs: 2000 });
assert.equal(calibrated.human.combatFraction, .5, "must time-weight variable human cadence");
assert.equal(calibrated.human.kills, 1, "exclude another player's kill");
assert.throws(() => calibrate(bot, human, { label: "bad", botStartMs: 0, humanStartMs: 0, durationMs: 3000 }), /exceeds/);

const dir = mkdtempSync(join(tmpdir(), "experience-test-"));
try {
  writeFileSync(join(dir, "study.json"), JSON.stringify(study));
  const normalized = normalizeCreateOptions({ revision: "HEAD", study: join(dir, "study.json"), count: "3" });
  assert.equal(buildRunPlan(normalized, "test").length, 6);
  assert.throws(() => normalizeCreateOptions({ revision: "HEAD", study: join(dir, "study.json"), routes: "striker-t1" }), /cannot be combined/);
  writeRunConfig({ ...manifest, inputs: {}, build: { buildId: "b" } }, { postgresPassword: "fixture" }, { ...runs[0], choices: { "boss-preparation": "early" } }, dir);
  assert.deepEqual(readJson(join(dir, "run-config.json")).choices, { "boss-preparation": "early" });
  writeFileSync(join(dir, "bad.jsonl"), '{"kind":"kill","atMs":1}\nBROKEN\n');
  assert.throws(() => readEvents(join(dir, "bad.jsonl")), /invalid JSON/);
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log("experience studies, timelines, pairing and calibration: ok");
