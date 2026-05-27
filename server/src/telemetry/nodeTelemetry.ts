import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import type { NodeTelemetryRow, NodeTelemetrySnapshot } from '@mmo-idle/shared';
import { NODE_REGISTRY } from '../world/nodeRegistry';
import {
  TELEMETRY_HISTORY_INTERVAL_MS,
  TELEMETRY_HISTORY_MAX_SAMPLES,
  LEAK_MEMBERSHIP_DRIFT_THRESHOLD,
  LEAK_MONSTER_TREND_THRESHOLD,
  EST_PLAYER_BYTES,
  EST_MONSTER_BYTES,
  EST_NET_ID_BYTES,
} from './constants';

export interface BroadcastStats {
  deltaBytes: number;
  adds: number;
  patches: number;
  fullResync: boolean;
  entityScans: number;
  membershipSize: number;
  pendingEvents: number;
}

interface MutableRow {
  players: number;
  monsters: number;
  bosses: number;
  occupied: boolean;
  frozen: boolean;

  tickCpuMs: number;
  broadcastCpuMs: number;
  idlePopulationMs: number;
  populationScans: number;

  nodeMembership: number;
  pendingEvents: number;
  lastDeltaBytes: number;

  deltaAdds: number;
  deltaPatches: number;
  fullResyncs: number;
  entityScans: number;
}

function emptyMutableRow(): MutableRow {
  return {
    players: 0,
    monsters: 0,
    bosses: 0,
    occupied: false,
    frozen: true,
    tickCpuMs: 0,
    broadcastCpuMs: 0,
    idlePopulationMs: 0,
    populationScans: 0,
    nodeMembership: 0,
    pendingEvents: 0,
    lastDeltaBytes: 0,
    deltaAdds: 0,
    deltaPatches: 0,
    fullResyncs: 0,
    entityScans: 0,
  };
}

function linearSlope(samples: Array<{ t: number; monsters: number }>): number {
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dtMin = (last.t - first.t) / 60_000;
  if (dtMin <= 0) return 0;
  return (last.monsters - first.monsters) / dtMin;
}

function buildLeakFlags(
  row: MutableRow,
  membershipDrift: number,
  monsterTrend10m: number,
): string[] {
  const flags: string[] = [];
  if (membershipDrift > LEAK_MEMBERSHIP_DRIFT_THRESHOLD) {
    flags.push('membership-drift');
  }
  if (!row.occupied && !row.frozen && monsterTrend10m > LEAK_MONSTER_TREND_THRESHOLD) {
    flags.push('monster-growth');
  }
  if (!row.occupied && !row.frozen && row.monsters > 0 && row.idlePopulationMs > 0.5) {
    flags.push('orphan-simulation');
  }
  return flags;
}

function toPublicRow(row: MutableRow, monsterTrend10m: number): NodeTelemetryRow {
  const liveEntities = row.players + row.monsters + row.bosses;
  const membershipDrift = Math.max(0, row.nodeMembership - liveEntities);
  const estimatedBytes =
    row.players * EST_PLAYER_BYTES +
    row.monsters * EST_MONSTER_BYTES +
    row.bosses * EST_MONSTER_BYTES +
    row.nodeMembership * EST_NET_ID_BYTES +
    row.lastDeltaBytes;

  return {
    players: row.players,
    monsters: row.monsters,
    bosses: row.bosses,
    occupied: row.occupied,
    tickCpuMs: roundMs(row.tickCpuMs),
    broadcastCpuMs: roundMs(row.broadcastCpuMs),
    idlePopulationMs: roundMs(row.idlePopulationMs),
    nodeMembership: row.nodeMembership,
    pendingEvents: row.pendingEvents,
    lastDeltaBytes: row.lastDeltaBytes,
    estimatedBytes,
    deltaAdds: row.deltaAdds,
    deltaPatches: row.deltaPatches,
    fullResyncs: row.fullResyncs,
    entityScans: row.entityScans + row.populationScans,
    monsterTrend10m: roundMs(monsterTrend10m),
    membershipDrift,
    leakFlags: buildLeakFlags(row, membershipDrift, monsterTrend10m),
    frozen: row.frozen,
  };
}

function roundMs(n: number): number {
  return Math.round(n * 100) / 100;
}

export class NodeTelemetry {
  private readonly rows = new Map<string, MutableRow>();
  private readonly history = new Map<string, Array<{ t: number; monsters: number }>>();
  private lastHistoryAt = 0;
  private readonly elDelay = monitorEventLoopDelay({ resolution: 20 });
  private windowStartedAt = performance.now();

  constructor() {
    this.elDelay.enable();
    for (const nodeId of NODE_REGISTRY.keys()) {
      this.rows.set(nodeId, emptyMutableRow());
      this.history.set(nodeId, []);
    }
  }

  recordPopulationMs(nodeId: string, ms: number, occupied: boolean): void {
    const row = this.getRow(nodeId);
    row.tickCpuMs += ms;
    if (!occupied) row.idlePopulationMs += ms;
  }

  recordPopulationScan(nodeId: string, scanIterations: number): void {
    this.getRow(nodeId).populationScans += scanIterations;
  }

  recordBroadcast(nodeId: string, ms: number, stats: BroadcastStats): void {
    const row = this.getRow(nodeId);
    row.broadcastCpuMs += ms;
    row.tickCpuMs += ms;
    row.lastDeltaBytes = stats.deltaBytes;
    row.nodeMembership = stats.membershipSize;
    row.pendingEvents = stats.pendingEvents;
    row.deltaAdds += stats.adds;
    row.deltaPatches += stats.patches;
    if (stats.fullResync) row.fullResyncs += 1;
    row.entityScans += stats.entityScans;
  }

  syncOccupancy(
    nodeId: string,
    players: number,
    monsters: number,
    bosses: number,
  ): void {
    const row = this.getRow(nodeId);
    row.players = players;
    row.monsters = monsters;
    row.bosses = bosses;
    row.occupied = players > 0;
  }

  syncFrozen(nodeId: string, frozen: boolean): void {
    this.getRow(nodeId).frozen = frozen;
  }

  clearNodeTelemetry(nodeId: string): void {
    const row = this.getRow(nodeId);
    row.monsters = 0;
    row.bosses = 0;
    row.nodeMembership = 0;
    row.pendingEvents = 0;
    row.lastDeltaBytes = 0;
    row.idlePopulationMs = 0;
    row.frozen = true;
  }

  flush(tick: number): NodeTelemetrySnapshot {
    const now = Date.now();
    this.maybeRecordHistory(now);

    const nodes: Record<string, NodeTelemetryRow> = {};
    let totalTickCpuMs = 0;
    let totalBroadcastCpuMs = 0;
    let totalIdlePopulationMs = 0;

    for (const [nodeId, row] of this.rows) {
      const trend = linearSlope(this.history.get(nodeId) ?? []);
      nodes[nodeId] = toPublicRow(row, trend);
      totalTickCpuMs += row.tickCpuMs;
      totalBroadcastCpuMs += row.broadcastCpuMs;
      totalIdlePopulationMs += row.idlePopulationMs;
    }

    const windowMs = Math.max(1, Math.round(performance.now() - this.windowStartedAt));
    const elNs = this.elDelay.percentile(99);
    this.elDelay.reset();

    const snapshot: NodeTelemetrySnapshot = {
      tick,
      windowMs,
      capturedAt: now,
      process: {
        heapUsedMb: roundMs(process.memoryUsage().heapUsed / (1024 * 1024)),
        eventLoopP99Ms: roundMs(elNs / 1e6),
        totalTickCpuMs: roundMs(totalTickCpuMs),
        totalBroadcastCpuMs: roundMs(totalBroadcastCpuMs),
        orphanCpuPct: roundMs(
          (totalIdlePopulationMs / Math.max(1, totalTickCpuMs)) * 100,
        ),
      },
      nodes,
    };

    this.resetWindow();
    return snapshot;
  }

  private getRow(nodeId: string): MutableRow {
    let row = this.rows.get(nodeId);
    if (!row) {
      row = emptyMutableRow();
      this.rows.set(nodeId, row);
      this.history.set(nodeId, []);
    }
    return row;
  }

  private maybeRecordHistory(now: number): void {
    if (now - this.lastHistoryAt < TELEMETRY_HISTORY_INTERVAL_MS) return;
    this.lastHistoryAt = now;
    for (const [nodeId, row] of this.rows) {
      const samples = this.history.get(nodeId) ?? [];
      samples.push({ t: now, monsters: row.monsters + row.bosses });
      while (samples.length > TELEMETRY_HISTORY_MAX_SAMPLES) samples.shift();
      this.history.set(nodeId, samples);
    }
  }

  private resetWindow(): void {
    for (const row of this.rows.values()) {
      row.tickCpuMs = 0;
      row.broadcastCpuMs = 0;
      row.idlePopulationMs = 0;
      row.populationScans = 0;
      row.deltaAdds = 0;
      row.deltaPatches = 0;
      row.fullResyncs = 0;
      row.entityScans = 0;
    }
    this.windowStartedAt = performance.now();
  }
}

export function timeSync<T>(fn: () => T): { result: T; ms: number } {
  const t0 = performance.now();
  const result = fn();
  return { result, ms: performance.now() - t0 };
}
