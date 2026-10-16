/**
 * Dev-only proof that the Loadout fires in a real fight (overnight 2026-10-16): per Slinger,
 * the rounds fired by clip, the last rounds by trophy, called shots, shells, reloads (and how
 * many started inside a telegraph), switch and early reloads, time spent reloading against
 * firing, and the damage taken in each. One log line per Slinger per minute of fighting
 * (`slinger loadout`), nothing in production. Read it from a lane's server log.
 */
import type { PlayerEntity } from '../../../ecs/entity';
import { log } from '../../../log';

const ENABLED = process.env.NODE_ENV !== 'production';
const FLUSH_MS = 60_000;

interface Tally {
  rounds: Record<string, number>;
  lastRounds: Record<string, number>;
  called: number;
  shells: number;
  reloads: number;
  reloadsInTelegraph: number;
  switchReloads: number;
  earlyReloads: number;
  deferredReloads: number;
  reloadMs: number;
  firingMs: number;
  takenReloading: number;
  takenFiring: number;
  since: number;
}

const tallies = new WeakMap<PlayerEntity, Tally>();

function fresh(now: number): Tally {
  return {
    rounds: {}, lastRounds: {}, called: 0, shells: 0, reloads: 0, reloadsInTelegraph: 0,
    switchReloads: 0, earlyReloads: 0, deferredReloads: 0, reloadMs: 0, firingMs: 0, takenReloading: 0, takenFiring: 0, since: now,
  };
}

/** The player's open tally, or null in production. */
export function slingerTally(player: PlayerEntity, now = Date.now()): Tally | null {
  if (!ENABLED) return null;
  let tally = tallies.get(player);
  if (!tally) {
    tally = fresh(now);
    tallies.set(player, tally);
  }
  return tally;
}

export function countRound(player: PlayerEntity, clip: string, last: boolean, trophyId: string | undefined, called: boolean): void {
  const tally = slingerTally(player);
  if (!tally) return;
  tally.rounds[clip] = (tally.rounds[clip] ?? 0) + 1;
  if (last) {
    const key = trophyId ?? 'plain-last-round';
    tally.lastRounds[key] = (tally.lastRounds[key] ?? 0) + 1;
  }
  if (called) tally.called += 1;
}

/** Log and reset the tally once a minute of fighting has gone by. */
export function flushSlingerTally(player: PlayerEntity, now: number): void {
  const tally = ENABLED ? tallies.get(player) : undefined;
  if (!tally || now - tally.since < FLUSH_MS) return;
  if (tally.firingMs + tally.reloadMs > 0) {
    log.info({
      slinger: player.isPlayer.id,
      clip: player.usesReload?.clipId,
      discipline: player.usesSkills.disciplineId ?? null,
      specialization: player.usesSkills.specializationId ?? null,
      ...tally,
      reloadMs: Math.round(tally.reloadMs),
      firingMs: Math.round(tally.firingMs),
      takenReloading: Math.round(tally.takenReloading),
      takenFiring: Math.round(tally.takenFiring),
    }, 'slinger loadout');
  }
  tallies.set(player, fresh(now));
}
