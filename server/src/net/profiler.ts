import type { DeltaSnapshot } from '@mmo-idle/shared';

export type BroadcastKind = 'state:sync' | 'node:delta' | 'spectate:snapshot';

const ENABLED = process.env.NETCODE_PROFILE === '1';

interface Sample {
  kind: BroadcastKind;
  bytes: number;
  deltas: number;
  events: number;
  slice: Record<string, number>;
}

const samples: Sample[] = [];

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
  } catch {
  }
}

function flushSummary(): void {
  if (samples.length === 0) return;
  samples.length = 0;
}

if (ENABLED) {
  setInterval(flushSummary, 5_000);
}
