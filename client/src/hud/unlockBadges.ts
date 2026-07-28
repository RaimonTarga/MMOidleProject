import { useCallback, useEffect, useRef, useState } from 'react';
import type { SystemVisibility } from './systemVisibility';
import type { UiUnlockSystem } from './uiUnlocks';

const STORAGE_PREFIX = 'mmo_idle.unlock_badges.';

function storageKey(playerId: string): string {
  return `${STORAGE_PREFIX}${playerId}`;
}

function read(playerId: string): Set<UiUnlockSystem> {
  try {
    const raw = window.localStorage.getItem(storageKey(playerId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as UiUnlockSystem[]) : new Set();
  } catch {
    return new Set();
  }
}

function write(playerId: string, systems: Set<UiUnlockSystem>): void {
  try {
    window.localStorage.setItem(storageKey(playerId), JSON.stringify([...systems]));
  } catch {
    // Badges are decoration; losing them to a full or blocked store is fine.
  }
}

export interface UnlockBadges {
  /** True while this system has been revealed but never opened. */
  has: (system: UiUnlockSystem) => boolean;
  /** Called when the player first opens the destination. */
  clear: (system: UiUnlockSystem) => void;
}

/**
 * The "you have not looked at this yet" pip (§16).
 *
 * Deliberately client-only presentation state, per character, in localStorage:
 * it must never influence gameplay or visibility, only decoration. It is also
 * strictly *later* than the unlock wake — the wake fires on the transition, and
 * this persists afterwards so the reveal survives a reload the player did not
 * act on.
 *
 * Hydration is not a reveal. Logging in resolves every already-earned system
 * from false to true at once; badging those would light up the entire rail on
 * every login. The first resolution for a given character is therefore recorded
 * as the baseline and never badged.
 */
export function useUnlockBadges(
  visibility: SystemVisibility,
  playerId: string | null,
): UnlockBadges {
  const [badges, setBadges] = useState<Set<UiUnlockSystem>>(new Set());
  const baselineFor = useRef<string | null>(null);
  const previous = useRef<SystemVisibility | null>(null);

  useEffect(() => {
    if (!playerId) {
      baselineFor.current = null;
      previous.current = null;
      // Functional, and identity-stable when already empty. `visibility` is a
      // fresh object on every render, so this effect runs on every render —
      // handing it an unconditional `new Set()` made every render schedule the
      // next one, which React eventually killed with "Maximum update depth
      // exceeded". That window is the whole pre-login boot, when playerId is
      // null and this branch is the one that runs.
      setBadges((current) => (current.size === 0 ? current : new Set()));
      return;
    }

    // New character (or first sight of this one): take the current visibility as
    // the baseline and restore whatever pips it had already earned.
    if (baselineFor.current !== playerId) {
      baselineFor.current = playerId;
      previous.current = visibility;
      setBadges(read(playerId));
      return;
    }

    const before = previous.current;
    previous.current = visibility;
    if (!before) return;

    const revealed = (Object.keys(visibility) as UiUnlockSystem[])
      .filter((system) => !before[system] && visibility[system]);
    if (revealed.length === 0) return;

    setBadges((current) => {
      const next = new Set(current);
      for (const system of revealed) next.add(system);
      write(playerId, next);
      return next;
    });
  }, [visibility, playerId]);

  const has = useCallback((system: UiUnlockSystem) => badges.has(system), [badges]);

  const clear = useCallback((system: UiUnlockSystem) => {
    if (!playerId) return;
    setBadges((current) => {
      if (!current.has(system)) return current;
      const next = new Set(current);
      next.delete(system);
      write(playerId, next);
      return next;
    });
  }, [playerId]);

  return { has, clear };
}
