/**
 * Dev-only proof that the Striker's class system fires in real fights (overnight OV-STRIKER):
 * counts of what the Order actually did (each technique beat, each resolved cast, each finisher
 * by trophy, the discipline's resource at the finisher), written to the server log once a minute
 * as one `striker class system` line. Off in production.
 */
import { log } from '../../../../log';

const ENABLED = process.env.NODE_ENV !== 'production';
/** How often the counts are written (ms). */
const FLUSH_MS = 60_000;

const counts = new Map<string, number>();
let lastFlushAt = 0;

/** Count one event (`beat:striker-rend`, `cast:striker-coil`, `finisher:striker-relic-plains`...). */
export function countStriker(key: string, by = 1): void {
  if (!ENABLED) return;
  counts.set(key, (counts.get(key) ?? 0) + by);
}

/** Write and reset the counts, at most once a minute (called from the cadence tick). */
export function flushStrikerCounts(now: number): void {
  if (!ENABLED || now - lastFlushAt < FLUSH_MS) return;
  lastFlushAt = now;
  if (counts.size === 0) return;
  const striker = Object.fromEntries([...counts].sort((a, b) => a[0].localeCompare(b[0])));
  counts.clear();
  log.info({ striker }, 'striker class system');
}
