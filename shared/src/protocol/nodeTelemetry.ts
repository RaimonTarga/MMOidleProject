export interface NodeTelemetryRow {
  players: number;
  monsters: number;
  bosses: number;
  occupied: boolean;

  tickCpuMs: number;
  broadcastCpuMs: number;
  idlePopulationMs: number;

  nodeMembership: number;
  pendingEvents: number;
  lastDeltaBytes: number;
  estimatedBytes: number;

  deltaAdds: number;
  deltaPatches: number;
  fullResyncs: number;
  entityScans: number;

  monsterTrend10m: number;
  membershipDrift: number;
  leakFlags: string[];
  frozen: boolean;
}

export interface ProcessTelemetry {
  heapUsedMb: number;
  eventLoopP99Ms: number;
  totalTickCpuMs: number;
  totalBroadcastCpuMs: number;
  orphanCpuPct: number;
}

export interface NodeTelemetrySnapshot {
  tick: number;
  windowMs: number;
  capturedAt: number;
  process: ProcessTelemetry;
  nodes: Record<string, NodeTelemetryRow>;
}
