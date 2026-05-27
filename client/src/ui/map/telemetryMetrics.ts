import type { NodeTelemetryRow } from '@mmo-idle/shared';

export type TelemetryMetric =
  | 'tickCpuMs'
  | 'idlePopulationMs'
  | 'broadcastCpuMs'
  | 'entityScans'
  | 'lastDeltaBytes'
  | 'estimatedBytes'
  | 'pendingEvents';

export interface TelemetryMetricDef {
  id: TelemetryMetric;
  label: string;
  unit: 'ms' | 'count' | 'bytes';
}

export const TELEMETRY_METRICS: readonly TelemetryMetricDef[] = [
  { id: 'tickCpuMs',        label: 'Tick CPU',         unit: 'ms' },
  { id: 'idlePopulationMs', label: 'Idle population',  unit: 'ms' },
  { id: 'broadcastCpuMs',   label: 'Broadcast CPU',    unit: 'ms' },
  { id: 'entityScans',      label: 'Entity scans',     unit: 'count' },
  { id: 'lastDeltaBytes',   label: 'Last delta',       unit: 'bytes' },
  { id: 'estimatedBytes',   label: 'Est. footprint',   unit: 'bytes' },
  { id: 'pendingEvents',    label: 'Pending events',   unit: 'count' },
];

export function extractMetric(row: NodeTelemetryRow, metric: TelemetryMetric): number {
  return row[metric];
}

export function formatMetricValue(value: number, metric: TelemetryMetric): string {
  const def = TELEMETRY_METRICS.find(m => m.id === metric);
  if (!def) return String(value);
  if (def.unit === 'ms') return `${value.toFixed(2)} ms`;
  if (def.unit === 'bytes') {
    return value > 1024 ? `${(value / 1024).toFixed(1)} KB` : `${Math.round(value)} B`;
  }
  return String(Math.round(value));
}
