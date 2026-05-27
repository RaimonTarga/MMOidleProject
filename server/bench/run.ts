#!/usr/bin/env tsx
import { GAME_CONFIG } from '@mmo-idle/shared';
import {
  createBenchWorld,
  spawnBenchPlayers,
  BENCH_DT_MS,
  BENCH_BROADCAST_MS,
} from './harness';
import { resolveScenario, type BenchScenarioId } from './scenarios';
import { timeSync } from '../src/telemetry/nodeTelemetry';

const WARMUP_TICKS = 200;
const MEASURE_TICKS = 500;

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

function parseArgs(argv: string[]): { scenario: BenchScenarioId; players: number[] } {
  let scenario: BenchScenarioId = 'idle';
  let players: number[] = [0, 1, 5, 10, 25, 50, 100];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--scenario' && argv[i + 1]) {
      scenario = argv[++i] as BenchScenarioId;
    } else if (arg === '--players' && argv[i + 1]) {
      players = argv[++i].split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
    }
  }

  return { scenario, players };
}

function printUsage(): void {
  console.error('Usage: tsx bench/run.ts [--scenario idle|autoCombatSameNode|spreadNodes] [--players 0,1,10,50,100]');
}

function runScenarioPlayerCount(scenarioId: BenchScenarioId, playerCount: number): void {
  const scenario = resolveScenario(scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);

  const world = createBenchWorld();
  spawnBenchPlayers(world, scenario, playerCount);

  let now = Date.now();
  for (let i = 0; i < WARMUP_TICKS; i++) {
    world.tick(BENCH_DT_MS, now);
    now += BENCH_DT_MS;
  }

  const tickSamples: number[] = [];
  const broadcastSamples: number[] = [];

  for (let i = 0; i < MEASURE_TICKS; i++) {
    const tickTimed = timeSync(() => world.tick(BENCH_DT_MS, now));
    tickSamples.push(tickTimed.ms);
    now += BENCH_DT_MS;

    if ((i + 1) % Math.round(GAME_CONFIG.LOGIC_TICK_RATE / GAME_CONFIG.BROADCAST_TICK_RATE) === 0) {
      const dirty = world.beginBroadcast();
      const nodesBuilt = new Set<string>();
      let broadcastMs = 0;
      for (const player of world.playerEntities) {
        const nodeId = player.hasPosition.nodeId;
        if (nodesBuilt.has(nodeId)) continue;
        nodesBuilt.add(nodeId);
        const timed = timeSync(() => world.buildNodeDeltaWithStats(nodeId, dirty));
        broadcastMs += timed.ms;
        world.telemetry.recordBroadcast(nodeId, timed.ms, timed.result.stats);
      }
      broadcastSamples.push(broadcastMs);
    }
  }

  world.syncTelemetryOccupancy();
  const snap = world.telemetry.flush(world.tickCounter);

  console.log([
    scenarioId,
    playerCount,
    percentile(tickSamples, 50).toFixed(2),
    percentile(tickSamples, 95).toFixed(2),
    percentile(broadcastSamples, 50).toFixed(2),
    percentile(broadcastSamples, 95).toFixed(2),
    snap.process.orphanCpuPct.toFixed(1),
    snap.process.heapUsedMb.toFixed(1),
    world.monsterEntities.size,
  ].join(','));
}

function main(): void {
  const { scenario, players } = parseArgs(process.argv.slice(2));
  if (!resolveScenario(scenario)) {
    printUsage();
    process.exit(1);
  }
  if (players.length === 0) {
    printUsage();
    process.exit(1);
  }

  console.log('scenario,players,tick_p50_ms,tick_p95_ms,broadcast_p50_ms,broadcast_p95_ms,orphan_cpu_pct,heap_mb,monsters');
  for (const n of players) {
    runScenarioPlayerCount(scenario, n);
  }
}

main();
