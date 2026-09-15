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
};

const obs = {
  nodeId: "node-t4-volcanic-05",
  self,
  monsters: () => [monster],
  attackersOnSelf: () => [],
  otherPlayers: () => [],
  minions: () => [],
} as unknown as Observation;

try {
  recorder.setActivity('boss');
  monster.isBoss = true;
  self.attackTargetId = monster.id;
  self.lastAttackAt = 2500;
  now = 3000;
  recorder.tick(obs);
  const first = events.find(e => e.kind === 'concurrency-sample');
  assert(first?.kind === 'concurrency-sample' && first.bossState);
  assert.equal(first.bossState.bosses[0].hp, 100);
  assert.equal(first.bossState.player.lastAttackAt, 2500);
  monster.hp = 24;
  self.pos.x = 200;
  now = 4000;
  recorder.tick(obs);
  assert.equal(events.filter(e => e.kind === 'concurrency-sample').length, 1, 'bounded cadence');
  now = 5000;
  recorder.tick(obs);
  const samples = events.filter(e => e.kind === 'concurrency-sample');
  assert.equal(samples[1].bossState?.bosses[0].hp, 24, 'late phase visible');
  assert.equal(first.bossState.player.pos.x, 100, 'samples do not alias live position');
  assert.equal(first.bossState.bosses[0].hp, 100);
  recorder.setActivity('travel');
  now = 7000;
  recorder.tick(obs);
  const last = events.filter(e => e.kind === 'concurrency-sample').at(-1)!;
  assert.equal(last.bossState, undefined, 'no boss detail outside boss activity');
} finally { Date.now = realNow; }
console.log('boss timeline: ok');
