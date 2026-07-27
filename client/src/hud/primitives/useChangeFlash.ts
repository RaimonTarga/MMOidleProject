import { useEffect, useRef, useState } from 'react';

const FLASH_MS = 1100;

export interface ChangeFlash {
  /** Increments on every noticed change, so a caller can restart its animation. */
  flashKey: number;
  /** The signed change, cleared once the mark has played. */
  delta: number | null;
}

/**
 * Notices that a value actually changed, and reports the delta once.
 *
 * The Wave 3 motion rule in one hook: a stat only moves when the player moves
 * it, so the only honest animation is a one-shot mark on a real change.
 * Deliberately silent on the first value and on any change while the document is
 * hidden or reduced motion is on — hydration is not an event, and a flash nobody
 * saw must not be queued for their return.
 */
export function useChangeFlash(value: number | undefined): ChangeFlash {
  const previous = useRef<number | undefined>(undefined);
  const [state, setState] = useState<ChangeFlash>({ flashKey: 0, delta: null });

  useEffect(() => {
    const before = previous.current;
    previous.current = value;
    if (value === undefined || before === undefined || before === value) return;
    if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setState((current) => ({ flashKey: current.flashKey + 1, delta: value - before }));
    const timer = window.setTimeout(
      () => setState((current) => ({ ...current, delta: null })),
      FLASH_MS,
    );
    return () => window.clearTimeout(timer);
  }, [value]);

  return state;
}
