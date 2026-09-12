import assert from "node:assert/strict";
import { Recorder } from "./recorder";
import type { BotEvent } from "./events";
import type { TelemetrySink } from "./sink";
import type { Observation } from "../state/observation";

const events: BotEvent[] = [];
const recorder = new Recorder({ write: (event: BotEvent) => events.push(event) } as unknown as TelemetrySink, 1000, () => "self", false);
const self = { hp: 100, maxHp: 100, attackTargetId: null as string | null, isDead: false, catalysts: {}, biomeLevel: {} };
const obs = { self, nodeId: "node-5-5", attackersOnSelf: () => [], otherPlayers: () => [], monsters: () => [] } as unknown as Observation;
const realNow = Date.now;
let now = 1000;
Date.now = () => now;
try {
  now = 2000; recorder.tick(obs); // startup state cannot explain the whole preceding interval
  recorder.setActivity("travel");
  now = 3000; recorder.tick(obs);
  self.attackTargetId = "monster";
  now = 4000; recorder.tick(obs); // combat while travelling: count only once
  self.isDead = true;
  now = 5000; recorder.tick(obs); // death wins even if target has not cleared
  now = 10000; recorder.tick(obs); // observation gap is unknown
  recorder.emit({ kind: "build-change", atMs: 9000, system: "policy-choice", detail: { id: "boss-preparation", option: "early" } });
  assert.equal(recorder.reachedChoices["boss-preparation"], "early");
} finally { Date.now = realNow; }
const samples = events.filter(e => e.kind === "experience-sample");
assert.deepEqual(samples.map(e => e.activity), ["unavailable", "travel", "combat", "dead", "unavailable"]);
assert.equal(samples.reduce((sum, e) => sum + e.durationMs, 0), 9000);
assert.equal(samples[2].purpose, "travel");
console.log("experience recorder: ok");
