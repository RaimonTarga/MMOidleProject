import assert from "node:assert/strict";
import type { BotEvent, RunHeader } from "./events";
import { BOT_JSONL_SCHEMA_VERSION } from "./events";
import { Recorder } from "./recorder";
import type { TelemetrySink } from "./sink";
import type { PlayerView, WorldLogEvent } from "@mmo-idle/shared";
import type { Observation } from "../state/observation";
import type { Route } from "../route/types";
import { buildSummary } from "./summary";

const events: BotEvent[] = [];
const recorder = new Recorder(
  { write: (event: BotEvent) => events.push(event) } as unknown as TelemetrySink,
  1_000,
  () => "player-1",
  false,
);
const realNow = Date.now;
let now = 1_000;
Date.now = () => now;

const self = {
  id: "player-1",
  pos: { x: 100, y: 100 },
  target: { x: 104, y: 100 },
  hp: 80,
  maxHp: 100,
  barrier: 20,
  barrierMax: 40,
  barrierRecharging: false,
  wards: [{ amount: 5, maxAmount: 10, remainingMs: 2_000 }],
  incomingDot: 3,
  pendingHeal: 4,
  targetDotStacks: 0,
  targetChillStacks: 1,
  activeEffects: { "debuff-slow": 1 },
  activeBuffs: [],
  attackTargetId: null as string | null,
  auto: true,
  autoTraverse: false,
  autoIntent: {
    kind: "idle" as const,
    reason: "No worthy target nearby",
    source: "auto-combat",
  },
  catalysts: {},
  biomeLevel: { volcanic: 18 },
  essences: {},
  isDead: false,
} as unknown as PlayerView;

const monster = {
  id: "monster-1",
  monsterTypeId: "ember-skink",
  name: "Ember Skink",
  hp: 100,
  maxHp: 100,
  isBoss: false,
  pos: { x: 140, y: 100 },
  target: { x: 140, y: 100 },
  state: "idle" as const,
  attackTargetId: null,
  activeEffects: {},
  targetStatus: [],
} as const;

const obs = {
  nodeId: "node-t4-volcanic-05",
  self,
  monsters: () => [monster],
  attackersOnSelf: () => [],
  otherPlayers: () => [],
  minions: () => [],
} as unknown as Observation;

try {
  recorder.setActivity("farm");
  for (let second = 1; second <= 91; second += 1) {
    now = 1_000 + second * 1_000;
    recorder.tick(obs);
  }

  const kill: WorldLogEvent = {
    kind: "kill",
    id: 1,
    tick: 1,
    serverTime: now,
    nodeId: "node-t4-volcanic-05",
    killer: { id: "player-1", name: "Telemetry Player", actorType: "player" },
    victim: { id: "monster-1", name: "Ember Skink", actorType: "monster" },
    damage: 100,
  };
  recorder.ingestWorldEvents([kill], obs);
  self.attackTargetId = "monster-1";
  now = 94_000;
  recorder.tick(obs);

  const diagnostics = events.filter((event) => event.kind === "activity-diagnostic");
  assert.deepEqual(diagnostics.map((event) => event.phase), ["start", "sample", "end"]);
  const start = diagnostics[0];
  const end = diagnostics.at(-1);
  assert(start?.kind === "activity-diagnostic" && end?.kind === "activity-diagnostic");
  assert.equal(start.activityReason, "No worthy target nearby");
  assert.equal(start.population.monstersInNode, 1);
  assert.equal(start.player.barrier, 20);
  assert.equal(start.player.incomingDot, 3);
  assert.equal(start.path.distanceToMovementTarget, 4);
  assert.equal(end.termination, "engagement-resumed");
  assert.equal(end.recentProgress.lastKillAtMs, 91_000);
  assert.equal(end.recentProgress.killsSinceWindowStart, 1);

  const header: RunHeader = {
    schemaVersion: BOT_JSONL_SCHEMA_VERSION,
    runId: "productive-activity-test",
    botId: "bot",
    devAccountId: "account",
    characterName: "Telemetry Player",
    characterId: "player-1",
    routeId: "route",
    routeVersion: "1",
    policyId: "intended",
    classRoot: "energy-root",
    gitRevision: "test",
    serverUrl: "local",
    startedAt: 1_000,
    rewardMultiplier: 1,
    economyCandidate: {
      id: "test",
      revision: "test",
      arm: "C",
      t1Plus5EssenceCostMultiplier: 1,
      catalystProgressPerUnitT1: 150,
      catalystsScaledByRewardMultiplier: false,
      t1BiomeXpRewardMultiplier: 1,
      t1BiomeEssenceRewardMultiplier: 1,
      t1Plus5EssenceCosts: {},
    },
    taints: [],
    executionMode: "single",
    maxConcurrency: 1,
  };
  const route: Route = {
    id: "route",
    version: "1",
    classRoot: "energy-root",
    description: "test",
    steps: [],
    completion: { type: "elapsedMs", ms: 0 },
    milestones: [],
  };
  const summary = buildSummary({
    header,
    recorder,
    route,
    self,
    completion: "completed",
    stalls: [],
    milestonesReached: [],
    routeStepsCompleted: 0,
    endedAt: 94_000,
  });
  assert.equal(summary.productiveActivity.flaggedWindows, 1);
  assert.equal(summary.productiveActivity.windows[0]?.killsDuringWindow, 1);
  assert.equal(summary.productiveActivity.windows[0]?.termination, "engagement-resumed");
  console.log("productive activity telemetry: ok");
} finally {
  Date.now = realNow;
}
