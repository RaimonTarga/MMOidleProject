/**
 * Dev-only proof that the Conduit's class system fires in real fights (OV-CONDUIT): each
 * Conduit counts its formation's mechanics (taunts, acid, power shots, Pack Strikes, rebuilds,
 * summon deaths...) and logs the counts once a minute while any is non-zero. Off in production.
 */
import type { PlayerEntity } from '../../../../ecs/entity';
import { log } from '../../../../log';

const ENABLED = process.env.NODE_ENV !== 'production';
const FLUSH_MS = 60_000;

interface Counts { since?: number; counts: Record<string, number> }
const byOwner = new Map<string, Counts>();

export function countConduitMechanic(owner: PlayerEntity, key: string, _now?: number): void {
  if (!ENABLED) return;
  const id = owner.isPlayer.id;
  let entry = byOwner.get(id);
  if (!entry) {
    entry = { counts: {} };
    byOwner.set(id, entry);
  }
  entry.counts[key] = (entry.counts[key] ?? 0) + 1;
}

/** Called from the summoner tick: logs and resets a Conduit's counts once a minute. */
export function flushConduitMechanics(owner: PlayerEntity, now: number): void {
  if (!ENABLED) return;
  const entry = byOwner.get(owner.isPlayer.id);
  if (!entry) return;
  // The window starts at the first tick that sees a count, on the tick's own clock.
  if (entry.since === undefined) entry.since = now;
  if (now - entry.since < FLUSH_MS) return;
  byOwner.delete(owner.isPlayer.id);
  if (Object.keys(entry.counts).length === 0) return;
  log.info({ conduitMechanics: entry.counts, playerId: owner.isPlayer.id, node: owner.hasPosition.nodeId,
    seconds: Math.round((now - entry.since) / 1000) }, 'conduit mechanics');
}
