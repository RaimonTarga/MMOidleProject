import type { DeltaSnapshot } from '@mmo-idle/shared';

export type BroadcastKind = 'state:sync' | 'node:delta';

const ENABLED = process.env.NETCODE_PROFILE === '1';

interface Sample {
  kind: BroadcastKind;
  bytes: number;
  deltas: number;
  events: number;
  slice: Record<string, number>;
}

const samples: Sample[] = [];

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
  return sorted[idx] ?? 0;
}

function sliceBreakdown(snap: DeltaSnapshot): Record<string, number> {
  const slice: Record<string, number> = {};
  for (const d of snap.deltas) {
    if (d.kind === 'remove' || !d.components) continue;
    for (const [k, v] of Object.entries(d.components)) {
      slice[k] = (slice[k] ?? 0) + JSON.stringify(v).length;
    }
  }
  return slice;
}

export function recordBroadcast(snap: DeltaSnapshot, kind: BroadcastKind): void {
  if (!ENABLED) return;
  try {
    samples.push({
      kind,
      bytes: JSON.stringify(snap).length,
      deltas: snap.deltas.length,
      events: snap.events.length,
      slice: sliceBreakdown(snap),
    });
  } catch (err) {
    console.warn('[netcode-profile] recordBroadcast failed:', err);
  }
}

function flushSummary(): void {
  if (samples.length === 0) return;

  const bytes = samples.map((s) => s.bytes);
  const totalBytes = bytes.reduce((a, b) => a + b, 0);
  const sliceTotals: Record<string, number> = {};
  for (const s of samples) {
    for (const [k, v] of Object.entries(s.slice)) {
      sliceTotals[k] = (sliceTotals[k] ?? 0) + v;
    }
  }
  const topSlices = Object.entries(sliceTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');

  const syncCount = samples.filter((s) => s.kind === 'state:sync').length;
  const deltaCount = samples.filter((s) => s.kind === 'node:delta').length;

  console.log(
    `[netcode-profile] samples=${samples.length} sync=${syncCount} delta=${deltaCount} ` +
    `bytes/sec=${Math.round(totalBytes / 5)} p50=${percentile(bytes, 50)} p95=${percentile(bytes, 95)} ` +
    `topSlices=[${topSlices}]`,
  );
  samples.length = 0;
}

if (ENABLED) {
  setInterval(flushSummary, 5_000);
  console.log('[netcode-profile] enabled — summaries every 5s');
}
