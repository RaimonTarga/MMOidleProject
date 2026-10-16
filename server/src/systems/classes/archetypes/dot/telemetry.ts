/**
 * Dev-only proof that the Apprentice's Payoff rules fire in a real fight (OV-APPRENTICE): a count
 * of each payoff fired, chain links, Spread passes and sigils laid, logged once a minute per player
 * (`apprentice payoffs`). Nothing is kept in production; the counts never touch gameplay.
 */
import type { PlayerEntity } from '../../../../ecs/entity';
import { log } from '../../../../log';

const FLUSH_MS = 60_000;
const ENABLED = process.env.NODE_ENV !== 'production';

const counts = new WeakMap<PlayerEntity, { since: number; byKey: Record<string, number> }>();

/** Count one event (`detonate`, `chain-link`, `spread-pass`, `sigils-laid`, ...) for `player`. */
export function noteApprentice(player: PlayerEntity, key: string, n = 1): void {
  if (!ENABLED || n <= 0) return;
  let entry = counts.get(player);
  if (!entry) counts.set(player, (entry = { since: 0, byKey: {} }));
  entry.byKey[key] = (entry.byKey[key] ?? 0) + n;
}

/** Log and reset the player's counts once a minute (called from the per-tick update). */
export function flushApprentice(player: PlayerEntity, now: number, cap: number): void {
  if (!ENABLED) return;
  const entry = counts.get(player);
  if (!entry) return;
  if (entry.since === 0) entry.since = now;
  if (now - entry.since < FLUSH_MS) return;
  if (Object.keys(entry.byKey).length > 0) {
    log.info({ playerId: player.isPlayer.id, nodeId: player.hasPosition.nodeId, cap, payoffs: entry.byKey }, 'apprentice payoffs');
  }
  entry.since = now;
  entry.byKey = {};
}
