import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PlayerView, WorldLogEvent } from '@mmo-idle/shared';
import type { Observation } from '../state/observation';
import type { Route } from '../route/types';
import { BOT_JSONL_SCHEMA_VERSION, type RunHeader } from './events';
import { Recorder } from './recorder';
import { TelemetrySink } from './sink';
import { buildSummary } from './summary';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const temp = mkdtempSync(join(tmpdir(), 'mmo-idle-bot-telemetry-'));
const sink = new TelemetrySink(temp, 'required');
const startedAt = Date.now();
const recorder = new Recorder(sink, startedAt, () => 'player-1', false);
const obs = {
  self: { hp: 97, maxHp: 100 },
  attackersOnSelf: () => [],
} as unknown as Observation;
const common = { id: 1, tick: 1, serverTime: startedAt, nodeId: 'node-5-5' };
const player = { id: 'player-1', name: 'Telemetry Player', actorType: 'player' as const };

const events: WorldLogEvent[] = [
  {
    ...common,
    kind: 'damage',
    source: { id: 'ground-zone:gz-1', name: 'Grave Toadeater — Bile Pool', actorType: 'monster' },
    target: player,
    hpDamage: 3,
    absorbed: 0,
    damageType: 'dot',
    tags: ['ground-zone', 'toxic-pool', 'bile-pool'],
  },
  {
    ...common, id: 2, kind: 'hazard-contact', player,
    hazardId: 'gz-1', hazardKind: 'toxic-pool', sourceId: 'bile-pool', sourceName: 'Bile Pool',
    phase: 'enter',
  },
  {
    ...common, id: 3, kind: 'hazard-contact', player,
    hazardId: 'gz-1', hazardKind: 'toxic-pool', sourceId: 'bile-pool', sourceName: 'Bile Pool',
    phase: 'leave', durationMs: 1_250, damageReceived: 3, harmfulEffects: ['slow'], endReason: 'exited',
  },
  {
    ...common, id: 4, kind: 'hazard-escape', player,
    hazardIds: ['gz-1'], hazardKinds: ['bile-pool'], phase: 'attempt',
  },
  {
    ...common, id: 5, kind: 'hazard-escape', player,
    hazardIds: ['gz-1'], hazardKinds: ['bile-pool'], phase: 'result', outcome: 'success',
  },
  {
    ...common, id: 6, kind: 'ability-activation', player,
    abilityId: 'cleanse', slot: 'guard', removedEffects: [{ effectId: 'grave-toadeater-poison', stacks: 2 }],
  },
  {
    ...common, id: 7, kind: 'telegraph-dodge', player, phase: 'activation',
  },
  {
    ...common, id: 8, kind: 'telegraph-dodge', player, phase: 'attempt',
    telegraphId: 'slam-1', telegraphKind: 'slam-telegraph', ownerId: 'boss-1',
  },
  {
    ...common, id: 9, kind: 'telegraph-dodge', player, phase: 'result',
    telegraphId: 'slam-1', telegraphKind: 'slam-telegraph', ownerId: 'boss-1',
    outcome: 'failure', damageReceived: 22,
  },
  {
    ...common, id: 10, kind: 'technique-adapter', player,
    adapter: 'apprentice-sweep', event: 'apprentice-secondary-target',
    target: { id: 'add-1', name: 'Mud Toad', actorType: 'monster' }, stacksApplied: 1,
  },
  {
    ...common, id: 11, kind: 'technique-adapter', player,
    adapter: 'slinger-sweep', event: 'slinger-clip-created', clipSize: 6,
  },
  {
    ...common, id: 12, kind: 'technique-adapter', player,
    adapter: 'slinger-sweep', event: 'slinger-clip-shot', clipSize: 6,
  },
  {
    ...common, id: 13, kind: 'technique-adapter', player,
    adapter: 'slinger-sweep', event: 'slinger-splash-hit',
    target: { id: 'add-1', name: 'Mud Toad', actorType: 'monster' }, splashDamage: 4, clipSize: 6,
  },
  {
    ...common, id: 14, kind: 'technique-adapter', player,
    adapter: 'conduit-formation', event: 'conduit-arm', eligibleSummons: 3,
  },
  {
    ...common, id: 15, kind: 'technique-adapter', player,
    adapter: 'conduit-formation', event: 'conduit-delivery',
  },
  {
    ...common, id: 16, kind: 'technique-adapter', player,
    adapter: 'conduit-formation', event: 'conduit-share-lost',
  },
  {
    ...common, id: 17, kind: 'technique-adapter', player,
    adapter: 'conduit-formation', event: 'conduit-secondary-damage',
    target: { id: 'add-1', name: 'Mud Toad', actorType: 'monster' }, splashDamage: 9,
  },
];

recorder.ingestWorldEvents(events, obs);
recorder.ingestCombatEvents([
  { kind: 'stance-switch', playerId: 'player-1', stanceId: 'predator-stance' },
  { kind: 'stance-switch', playerId: 'other-player', stanceId: 'berserker-stance' },
], 'node-5-5');
recorder.bossAttempts = 1;
recorder.emit({
  kind: 'boss-attempt', atMs: 10_000, phase: 'end', nodeId: 'node-5-5', biomeGroup: 'swamp',
  attempt: 1, outcome: 'death', durationMs: 90_000, bossHpFraction: 0.37,
  bossCombatStartedAtMs: 20_000, bossCombatEndedAtMs: 80_000, bossCombatDurationMs: 60_000,
});

// Part 5 diagnostics: sampled read-only from the same view the client renders.
// A ranged build orbiting at reach, under add pressure, with a live barrier and
// a live formation. Only sampled while the recorder is inside a boss attempt.
const bossSelf = {
  id: 'player-1', pos: { x: 0, y: 0 }, hp: 80, maxHp: 100, isDead: false,
  attackTargetId: 'boss-1', attackRange: 100,
  barrier: 30, barrierMax: 60, barrierRecharging: true,
  catalysts: {}, essences: {},
} as unknown as PlayerView;
const bossObs = {
  nodeId: 'node-5-5',
  self: bossSelf,
  attackersOnSelf: () => [],
  monsters: () => [
    { id: 'boss-1', isBoss: true, pos: { x: 80, y: 0 }, hp: 500, maxHp: 1_000 },
    { id: 'add-1', isBoss: false, pos: { x: 40, y: 0 }, hp: 20, maxHp: 20 },
  ],
  minions: () => [{ id: 'minion-1', hp: 10 }, { id: 'minion-2', hp: 0 }],
  otherPlayers: () => [],
} as unknown as Observation;

// Outside a boss attempt nothing is sampled at all.
recorder.setActivity('farm');
{
  const until = Date.now() + 2;
  while (Date.now() < until) { /* spin */ }
  recorder.tick(bossObs);
}
const farmSamples: number = recorder.bossDiagnostics.samples;
assert(farmSamples === 0, 'diagnostics must not sample outside a boss attempt');

// `tick` ignores a zero-length frame, so space the samples over real time the
// way a 10 Hz run does.
function tickAfterAMillisecond(): void {
  const until = Date.now() + 2;
  while (Date.now() < until) { /* spin */ }
  recorder.tick(bossObs);
}

recorder.setActivity('boss');
for (let i = 0; i < 3; i++) tickAfterAMillisecond();
const bossSamples: number = recorder.bossDiagnostics.samples;
assert(bossSamples === 3, 'boss diagnostics should sample once per tick in a boss attempt');
recorder.setActivity('idle');

const header: RunHeader = {
  schemaVersion: BOT_JSONL_SCHEMA_VERSION,
  runId: 'required', botId: 'bot', devAccountId: 'account', characterName: 'Telemetry',
  characterId: 'character', routeId: 'route', routeVersion: '1', policyId: 'intended',
  classRoot: 'cadence-root', gitRevision: 'test', serverUrl: 'local', startedAt,
  rewardMultiplier: 1, taints: [],
  economyCandidate: {
    id: 'test', revision: 'test-revision', arm: 'C',
    t1Plus5EssenceCostMultiplier: 0.75, catalystProgressPerUnitT1: 150,
    catalystsScaledByRewardMultiplier: false,
    t1BiomeXpRewardMultiplier: 2, t1BiomeEssenceRewardMultiplier: 2,
    t1Plus5EssenceCosts: {},
  },
  executionMode: 'single', maxConcurrency: 1,
};
const route: Route = {
  id: 'route', version: '1', classRoot: 'cadence-root', description: 'test', steps: [],
  completion: { type: 'elapsedMs', ms: 0 }, milestones: [],
};
const summary = buildSummary({
  header, recorder, route, self: null, completion: 'completed', stalls: [],
  milestonesReached: [], routeStepsCompleted: 0, endedAt: startedAt + 100_000,
});

assert(summary.combat.totalDamageTaken === 3, 'hazard contact telemetry must not double-count its damage event');
assert(summary.combat.stanceSwitches.length === 1, 'only own authoritative stance-switch events should reach telemetry');
assert(summary.combat.stanceSwitches[0]?.stanceId === 'predator-stance', 'stance-switch event should preserve its target');
assert(summary.combat.topIncomingSources[0]?.name.includes('Bile Pool'), 'Bile Pool should be a distinct incoming source');
assert(summary.mechanics.persistentHazards['bile-pool']?.durationMs === 1_250, 'hazard dwell duration should reach summary');
assert(summary.mechanics.persistentHazards['bile-pool']?.damageReceived === 3, 'hazard damage should reach mechanic summary');
assert(summary.mechanics.hazardEscape.attempts === 1 && summary.mechanics.hazardEscape.successes === 1, 'escape attempt/success should reach summary');
assert(summary.mechanics.abilityActivations.cleanse === 1, 'Guard activation should reach summary');
assert(summary.mechanics.cleanseRemovedByEffect['grave-toadeater-poison'] === 2, 'Cleanse removals should reach summary');
assert(summary.mechanics.stepBack.attempts === 1 && summary.mechanics.stepBack.failures === 1, 'Step Back attempt/failure should reach summary');
assert(summary.mechanics.stepBack.damageReceived === 22, 'Step Back failure should carry authoritative damage');
assert(summary.bosses.attemptResults[0]?.bossHpFraction === 0.37, 'boss HP fraction should be wired into summary');
assert(summary.bosses.attemptResults[0]?.bossCombatDurationMs === 60_000, 'true boss fight duration should remain separate');

assert(summary.mechanics.apprenticeSweep.secondaryTargets === 1, 'Apprentice Sweep secondary target count should reach summary');
assert(summary.mechanics.apprenticeSweep.stacksApplied === 1, 'Apprentice Sweep applied-stack count should reach summary');
assert(summary.mechanics.slingerSweep.clipsCreated === 1, 'Slinger Sweep clip creation should reach summary');
assert(summary.mechanics.slingerSweep.shotsFired === 1, 'Slinger Sweep clip-shot count should reach summary');
assert(summary.mechanics.slingerSweep.splashHits === 1 && summary.mechanics.slingerSweep.splashDamage === 4, 'Slinger Sweep splash hit/damage should reach summary');
assert(summary.mechanics.conduitFormation.arms === 1 && summary.mechanics.conduitFormation.meanEligibleSummons === 3, 'Conduit formation arm/eligible-summons should reach summary');
assert(summary.mechanics.conduitFormation.deliveries === 1, 'Conduit formation delivery count should reach summary');
assert(summary.mechanics.conduitFormation.sharesLost === 1, 'Conduit formation lost-share count should reach summary');
assert(summary.mechanics.conduitFormation.secondaryDamage === 9, 'Conduit formation secondary damage should reach summary');

const diag = summary.mechanics.bossDiagnostics;
assert(diag.range.inReachFraction === 1, 'orbiting at 80/100 reach should read as in-reach, not hugging');
assert(diag.range.meanDistance === 80, 'mean boss distance should reach the summary');
assert(diag.adds.meanOthers === 1 && diag.adds.maxOthers === 1, 'add pressure during the boss should reach the summary');
assert(diag.barrier.meanFraction === 0.5 && diag.barrier.rechargingFraction === 1, 'Spirit barrier state should reach the summary');
assert(diag.summons.meanLiving === 1 && diag.summons.emptyFraction === 0, 'Conduit living-summon count should reach the summary');

// A run artifact must state, on its own, how it was executed and what
// concurrency it actually met -- otherwise clean and contended evidence are
// indistinguishable after the fact.
assert(summary.coordination.executionMode === 'single', 'run artifact states its execution mode');
assert(summary.coordination.maxConcurrency === 1, 'run artifact states its concurrency cap');
assert(summary.coordination.maximumSimultaneouslyProgressing >= 1, 'run artifact states peak progressing bots');
assert(summary.coordination.contaminated === false, 'an uncontended run is not marked contaminated');
assert(Array.isArray(summary.coordination.controlledOverlaps), 'run artifact carries an overlap list');

const ambientTransitSummary = buildSummary({
  header, recorder, route, self: null, completion: 'completed', stalls: [],
  milestonesReached: [], routeStepsCompleted: 0, endedAt: startedAt + 100_000,
  leaseEvidence: {
    totalWaitMs: 0, maximumWaitMs: 0, acquisitions: 1, releases: 1,
    contaminated: false,
    overlaps: [{
      areaId: 'node:transit', nodeId: 'transit', ownerIds: ['bot-a', 'bot-b'],
      entityIds: [], reason: 'transit-co-presence', contaminating: false,
    }],
    sharedAdmissions: 0, fallbacks: [], harnessInvalid: false,
  },
});
assert(ambientTransitSummary.run.isolationGrade === 'ambient-concurrency', 'transit co-presence remains auditable as ambient concurrency');
assert(ambientTransitSummary.run.economyEvidenceEligible === true, 'benign transit co-presence does not taint economy evidence');
// Node modifiers change monster stats, so the node mix is part of the evidence.
{
  const mix = summary.coordination.nodeMix;
  assert(mix.length > 0, 'run artifact records which nodes it actually spent time in');
  assert(mix.some((entry) => entry.nodeId === 'node-5-5'), 'the farmed node appears in the node mix');
  assert(mix.every((entry) => entry.timeMs > 0), 'every recorded node carries real dwell time');
}

void sink.close().then(() => {
  rmSync(temp, { recursive: true, force: true });
  console.log('requiredTelemetry.test.ts: ok');
});
