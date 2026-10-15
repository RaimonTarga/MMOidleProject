/**
 * Piece and trophy ids this character has already been shown on the class screen.
 * `class-screen-seen:<playerId>` in localStorage. A missing or blocked store means
 * nothing is new: the screen still renders, it just grows no badges.
 */

const listeners = new Set<() => void>();
const seenByPlayer = new Map<string, ReadonlySet<string> | undefined>();

function storageKey(playerId: string): string {
  return `class-screen-seen:${playerId}`;
}

function readSeen(playerId: string): ReadonlySet<string> | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(playerId));
    if (raw === null) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return undefined;
  }
}

/** The ids already shown, or undefined when this character has no storage. */
export function classScreenSeenFor(playerId: string | null): ReadonlySet<string> | undefined {
  if (!playerId) return undefined;
  if (seenByPlayer.has(playerId)) return seenByPlayer.get(playerId);
  const seen = readSeen(playerId);
  seenByPlayer.set(playerId, seen);
  return seen;
}

export function subscribeClassScreenSeen(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitSeen(): void {
  for (const listener of listeners) listener();
}

/** Remember ids the screen just showed. No-ops when storage is unavailable. */
export function markClassScreenSeen(playerId: string, ids: readonly string[]): void {
  const current = classScreenSeenFor(playerId);
  if (!current) return;
  const next = new Set(current);
  let changed = false;
  for (const id of ids) {
    if (next.has(id)) continue;
    next.add(id);
    changed = true;
  }
  if (!changed) return;
  try {
    window.localStorage.setItem(storageKey(playerId), JSON.stringify([...next]));
  } catch {
    return;
  }
  seenByPlayer.set(playerId, next);
  emitSeen();
}
