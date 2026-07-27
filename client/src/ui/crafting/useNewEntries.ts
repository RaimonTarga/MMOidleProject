import { useCallback, useEffect } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const STORAGE_PREFIX = 'mmo_idle.new_recipes.';

/**
 * Two sets, both per character:
 * - `known`: every key ever seen as eligible. Without it, "what is new" cannot
 *   survive a reload — the whole eligible set would read as new again.
 * - `pending`: the subset that became eligible and has not been looked at yet.
 *   Persisted too, so unlocking something and then reloading does not silently
 *   drop a badge you never saw.
 */
interface NewRecord {
  known: string[];
  pending: string[];
}

/**
 * Newness is tracked per SURFACE, not globally: "three new recipes" and "a
 * technique you have never equipped" are different questions, and a single
 * pending set would have the rail's craft count answering both.
 */
export type NewChannel = 'craft' | 'loadout';

function storageKey(channel: NewChannel, playerId: string): string {
  return `${STORAGE_PREFIX}${channel}.${playerId}`;
}

function read(channel: NewChannel, playerId: string): NewRecord | null {
  try {
    const raw = window.localStorage.getItem(storageKey(channel, playerId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Partial<NewRecord>;
    if (!Array.isArray(record.known) || !Array.isArray(record.pending)) return null;
    return { known: record.known, pending: record.pending };
  } catch {
    return null;
  }
}

function write(channel: NewChannel, playerId: string, record: NewRecord): void {
  try {
    window.localStorage.setItem(storageKey(channel, playerId), JSON.stringify(record));
  } catch {
    // Newness is decoration; losing it to a full or blocked store is fine.
  }
}

// Shared state, not per-component: the rail shows the count while the craft list
// clears entries, and two independent copies would disagree the moment you
// looked at anything. Jotai because that is how the HUD already shares state.
//
// Atom identity has to be stable across renders, so each channel's atoms are
// created once and cached here.
interface ChannelAtoms {
  pending: ReturnType<typeof atom<ReadonlySet<string>>>;
  known: ReturnType<typeof atom<ReadonlySet<string>>>;
  baseline: ReturnType<typeof atom<string | null>>;
}

const CHANNEL_ATOMS = new Map<NewChannel, ChannelAtoms>();

function atomsFor(channel: NewChannel): ChannelAtoms {
  const existing = CHANNEL_ATOMS.get(channel);
  if (existing) return existing;
  const created: ChannelAtoms = {
    pending: atom<ReadonlySet<string>>(new Set<string>()),
    known: atom<ReadonlySet<string>>(new Set<string>()),
    baseline: atom<string | null>(null),
  };
  CHANNEL_ATOMS.set(channel, created);
  return created;
}

export interface NewEntries {
  /** True while this key became available and has not been looked at. */
  has: (key: string) => boolean;
  /** How many are waiting — drives the rail's count. */
  count: number;
  /** Called when the player looks at (or makes) the thing. */
  clear: (key: string) => void;
}

/**
 * "This became available while you were out fighting."
 *
 * Deliberately client-only presentation state, per character, in localStorage —
 * it must never influence what is craftable, only what is worth looking at
 * first. Modelled on `useUnlockBadges`, including its most important property:
 *
 * HYDRATION IS NOT A REVEAL. Logging in resolves the whole eligible set at once,
 * and badging that would mark every recipe you already own as new on every
 * login. The first sight of a character records the current set as the baseline
 * and badges none of it; only keys that appear AFTER that are new.
 *
 * The caller passes the currently-eligible keys, so this covers every recipe
 * kind at once — gear arrives from the server's `unlockedRecipes`, while
 * techniques, stances, rites and runes are derived from biome levels and boss
 * clears and have no unlock event to listen for.
 *
 * Safe to call from several components at once: the sync below is a set union
 * against shared state, so whichever runs first simply leaves the others nothing
 * to do.
 */
export function useNewEntries(
  channel: NewChannel,
  playerId: string | null,
  eligibleKeys: readonly string[],
): NewEntries {
  const atoms = atomsFor(channel);
  const [pending, setPending] = useAtom(atoms.pending);
  const known = useAtomValue(atoms.known);
  const setKnown = useSetAtom(atoms.known);
  const [baseline, setBaseline] = useAtom(atoms.baseline);

  // A stable dependency: callers rebuild the array every render, but its CONTENT
  // only changes when progression does.
  const signature = eligibleKeys.join(' ');

  useEffect(() => {
    if (!playerId) {
      setBaseline(null);
      setKnown(new Set<string>());
      setPending(new Set<string>());
      return;
    }
    if (eligibleKeys.length === 0) return;

    if (baseline !== playerId) {
      setBaseline(playerId);
      const stored = read(channel, playerId);
      if (!stored) {
        // First sight of this character: everything eligible is the baseline.
        const nextKnown = new Set(eligibleKeys);
        setKnown(nextKnown);
        setPending(new Set<string>());
        write(channel, playerId, { known: [...nextKnown], pending: [] });
        return;
      }
      const nextKnown = new Set(stored.known);
      const revealed = eligibleKeys.filter((key) => !nextKnown.has(key));
      for (const key of revealed) nextKnown.add(key);
      const nextPending = new Set([...stored.pending, ...revealed]);
      setKnown(nextKnown);
      setPending(nextPending);
      write(channel, playerId, { known: [...nextKnown], pending: [...nextPending] });
      return;
    }

    const revealed = eligibleKeys.filter((key) => !known.has(key));
    if (revealed.length === 0) return;
    const nextKnown = new Set(known);
    for (const key of revealed) nextKnown.add(key);
    const nextPending = new Set([...pending, ...revealed]);
    setKnown(nextKnown);
    setPending(nextPending);
    write(channel, playerId, { known: [...nextKnown], pending: [...nextPending] });
    // `signature` is the real dependency; the rest are the state it folds into.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, playerId, signature, baseline]);

  const has = useCallback((key: string) => pending.has(key), [pending]);

  const clear = useCallback((key: string) => {
    if (!playerId || !pending.has(key)) return;
    const next = new Set(pending);
    next.delete(key);
    setPending(next);
    write(channel, playerId, { known: [...known], pending: [...next] });
  }, [channel, playerId, pending, known, setPending]);

  return { has, count: pending.size, clear };
}
