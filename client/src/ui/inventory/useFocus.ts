import { useEffect, useRef, useState } from 'react';

/**
 * Click pins an item to the stat sheet; hovering another item previews it
 * without losing the pin. Items are tracked by id, so a pinned item stays
 * pinned as it moves between the bag and its slot.
 */
export interface ComparePin {
  pinned: string | null;
  hovered: string | null;
  /** What the sheet shows: the hovered item, else the pinned one. */
  shown: string | null;
  /** The sheet is showing a hover preview rather than the pin. */
  preview: boolean;
  togglePin: (defId: string) => void;
  hover: (defId: string | null) => void;
  unpin: () => void;
}

export function useComparePin(onPin?: (defId: string) => void): ComparePin {
  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Leaving a tile clears the preview after a beat, so crossing the gap between
  // two tiles does not flash the pinned item in between.
  function hover(defId: string | null) {
    if (timer.current) clearTimeout(timer.current);
    if (defId) setHovered(defId);
    else timer.current = setTimeout(() => setHovered(null), 120);
  }

  function togglePin(defId: string) {
    setHovered(null);
    const next = pinned === defId ? null : defId;
    setPinned(next);
    if (next) onPin?.(next);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const shown = hovered ?? pinned;
  return {
    pinned,
    hovered,
    shown,
    preview: hovered !== null && hovered !== pinned,
    togglePin,
    hover,
    unpin: () => setPinned(null),
  };
}
