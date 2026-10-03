/**
 * LINEAGE PAYLOAD STATES — the lasting looks a payload leaves on a body
 * (course-correction W2-C): a shackle locking a rooted target's feet, a stunned
 * target knocked down, a heavy bleed dripping off its victim, a loaded weapon
 * glowing in the player's hand between the kill that arms it and the hit that
 * spends it.
 *
 * WHY A REGISTRY. The aura engine (`bossAuras.ts`) draws a state exactly while
 * `active(view)` says so, and a monster's status list reaches the client only
 * while somebody targets it — so "is this body shackled" is not on the view for
 * every viewer. The payload's own events are: the `card-fx` that started it
 * (with the APPLIED `durationMs`), and `lineage-load` for the loaded carry. This
 * module keeps one record per (entity, look) from those events, and the four
 * aura rows in `auraDefs.ts` read it. Pure data — no Phaser, no timers — so the
 * lifecycle is testable (`server/test/lineagePayloadFx.test.ts`).
 *
 * SERVER TRUTH FOR EARLY ENDS. A record ends on its clock (the server's applied
 * duration, started when the payload is PRESENTED, i.e. on the same playback clock
 * as the hit), or EARLIER when the view says the server's state is gone: a
 * targeted monster's mirrored status list stops carrying the root / the bleed,
 * or a knocked-down body's `hardControlled` drops. Only after the view has been
 * seen holding the state, and only when the clock still has more than
 * {@link EARLY_END_SLACK_MS} to run — the view is applied at receipt while the
 * payload is presented on the playback delay, so a natural end always shows up
 * on the view a few hundred ms before the clock's; that is not an early end.
 * A body that leaves the view (death, node change) is forgotten through
 * `destroyEntity`, which plays the cancel.
 */
import type { MonsterView, PlayerView } from '@mmo-idle/shared';
import { composesLoadedCarry, type PayloadLasting } from './lineagePayloadModel';

/** Playback delay (250 ms) plus two 5 Hz broadcast intervals. */
export const EARLY_END_SLACK_MS = 650;

/** The server status ids the mirrored target list names for two of the looks. */
export const ROOT_STATUS_ID = 'ability-rooted';
export const LINEAGE_BLEED_STATUS_ID = 'lineage.hemorrhage';

export interface LastingRecord {
  kind: PayloadLasting;
  startedAt: number;
  /** Clock end, ms (performance.now() domain). Infinity for `loaded`. */
  endsAt: number;
  /** The view has been seen holding the server's state at least once. */
  seenHold: boolean;
  /** 1 = an ordinary application; >1 a re-dose surge (drawn heavier). */
  intensity: number;
  /** `knockdown`: which way the body falls (away from the blow), ±1. */
  side?: number;
  /** Where the body was last drawn (centre and size), for a cancel drawn after it is gone. */
  lastX?: number;
  lastY?: number;
  lastW?: number;
  lastH?: number;
}

const records = new Map<string, Map<PayloadLasting, LastingRecord>>();

function recordsOf(id: string): Map<PayloadLasting, LastingRecord> {
  let map = records.get(id);
  if (!map) {
    map = new Map();
    records.set(id, map);
  }
  return map;
}

/**
 * Start (or refresh) a lasting look. A refresh keeps the record's position and
 * hold observation and takes the LATER end, so a second application never cuts
 * a running one short.
 */
export function startLasting(
  id: string,
  kind: PayloadLasting,
  now: number,
  durationMs: number,
  intensity = 1,
): LastingRecord {
  const map = recordsOf(id);
  const endsAt = kind === 'loaded' ? Infinity : now + Math.max(0, durationMs);
  const prior = map.get(kind);
  if (prior && prior.endsAt > now) {
    prior.endsAt = Math.max(prior.endsAt, endsAt);
    prior.intensity = Math.max(prior.intensity, intensity);
    return prior;
  }
  const record: LastingRecord = { kind, startedAt: now, endsAt, seenHold: false, intensity };
  map.set(kind, record);
  return record;
}

/** End a look now (the loaded hit was spent, an explicit server beat). */
export function endLasting(id: string, kind: PayloadLasting): void {
  const map = records.get(id);
  if (!map) return;
  map.delete(kind);
  if (map.size === 0) records.delete(id);
}

export function lastingRecord(id: string, kind: PayloadLasting): LastingRecord | undefined {
  return records.get(id)?.get(kind);
}

/** Remember where the look was last drawn, for a cancel after the body is gone. */
export function noteLastingPos(id: string, kind: PayloadLasting, x: number, y: number, w?: number, h?: number): void {
  const record = records.get(id)?.get(kind);
  if (!record) return;
  record.lastX = x;
  record.lastY = y;
  if (w !== undefined) record.lastW = w;
  if (h !== undefined) record.lastH = h;
}

/**
 * Does the view say the server still holds this state? `undefined` when the view
 * cannot tell (an untargeted monster's status list is not broadcast).
 */
export function serverHolds(kind: PayloadLasting, view: MonsterView | PlayerView): boolean | undefined {
  switch (kind) {
    case 'knockdown':
      return (view as MonsterView).hardControlled === true;
    case 'shackle':
    case 'drip': {
      const list = (view as MonsterView).targetStatus;
      if (!list || list.length === 0) return undefined;
      const id = kind === 'shackle' ? ROOT_STATUS_ID : LINEAGE_BLEED_STATUS_ID;
      return list.some((status) => status.id === id && status.remainingMs !== 0);
    }
    case 'loaded':
      return undefined;
  }
}

/**
 * Whether the look should be drawn on this body now. Ends (and drops) a record on
 * its clock, on the server's early end, on the owner's death, or — for the loaded
 * carry — once no card in play lands a loaded carry any more.
 */
export function lastingActive(
  id: string,
  kind: PayloadLasting,
  view: MonsterView | PlayerView,
  now: number,
): boolean {
  const record = records.get(id)?.get(kind);
  if (!record) return false;

  if (kind === 'loaded') {
    const player = view as PlayerView;
    if (player.isDead || !composesLoadedCarry(player)) {
      endLasting(id, kind);
      return false;
    }
    return true;
  }

  if (now >= record.endsAt) {
    endLasting(id, kind);
    return false;
  }
  const holds = serverHolds(kind, view);
  if (holds === true) record.seenHold = true;
  else if (holds === false && record.seenHold && record.endsAt - now > EARLY_END_SLACK_MS) {
    endLasting(id, kind);
    return false;
  }
  return true;
}

/**
 * Forget every look on a body that left (death, node change). Returns the records
 * that were still live, so the caller can draw their cancel where they were.
 */
export function forgetLasting(id: string, now: number): LastingRecord[] {
  const map = records.get(id);
  if (!map) return [];
  records.delete(id);
  return [...map.values()].filter((record) => record.endsAt > now);
}

/** Test seam: drop everything. */
export function resetLastingForTests(): void {
  records.clear();
}
