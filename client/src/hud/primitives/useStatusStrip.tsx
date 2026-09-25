import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Hover inspection for a row of live status tiles (the buff bar, the target
 * frame's statuses).
 *
 * `useHoverTooltip` gives each tile its own tooltip. That is the wrong owner for
 * tiles the server adds, removes and reorders several times a second: the card
 * dies with its tile the moment a buff ends, and a neighbour ending slides a
 * different tile under a still cursor, so the card closes or flips to the wrong
 * status mid-read. Here the STRIP owns inspection instead:
 *
 * - While a card is open the strip's layout is frozen. Tiles keep the slots they
 *   had, anything that ends stays in place as an `ended` entry showing its last
 *   known state, and anything new joins at the end. The row reflows once the
 *   inspection closes.
 * - An ended entry keeps its card open for as long as the pointer stays on it.
 * - Closing waits a beat, so sliding across the gap between two tiles moves the
 *   card instead of blinking it.
 * - The card follows its tile's current rect rather than the one it opened at.
 */

/** Grace between leaving a tile and the card closing. */
const CLOSE_DELAY_MS = 200;

export interface StripEntry<T> {
  key: string;
  item: T;
  /** No longer live: shown from its last snapshot while the strip is frozen. */
  ended: boolean;
}

export interface StripTileProps {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onFocus: (e: React.FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}

interface Inspected {
  key: string;
  el: HTMLElement;
}

export function useStatusStrip<T>({
  items,
  keyOf,
  enabled,
  resetKey,
  renderTip,
}: {
  /** Live items in their natural display order. */
  items: readonly T[];
  keyOf: (item: T) => string;
  /** False on touch: no inspection, no freezing. */
  enabled: boolean;
  /** Changing this (e.g. a new target) drops the snapshot and closes the card. */
  resetKey?: string;
  renderTip: (entry: StripEntry<T>) => ReactNode;
}): {
  entries: StripEntry<T>[];
  frozen: boolean;
  inspectedKey: string | null;
  tileProps: (key: string) => StripTileProps | Record<string, never>;
  node: ReactNode;
} {
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const closeTimer = useRef<number | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const snapshot = useRef(new Map<string, T>());
  const lastOrder = useRef<string[]>([]);
  const frozenOrder = useRef<string[] | null>(null);
  const lastReset = useRef(resetKey);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const closeNow = () => {
    cancelClose();
    setInspected(null);
    setPos(null);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setInspected(null);
      setPos(null);
    }, CLOSE_DELAY_MS);
  };

  // A different subject is a different strip: nothing from the old one may
  // linger as "ended", and an open card would now describe the wrong thing.
  let inspecting = enabled ? inspected : null;
  if (lastReset.current !== resetKey) {
    lastReset.current = resetKey;
    snapshot.current.clear();
    frozenOrder.current = null;
    lastOrder.current = [];
    inspecting = null;
  }
  useEffect(() => {
    closeNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const live = new Map<string, T>();
  for (const item of items) live.set(keyOf(item), item);
  for (const [key, item] of live) snapshot.current.set(key, item);

  const frozen = inspecting !== null;
  let order: string[];
  if (frozen) {
    frozenOrder.current ??= [...lastOrder.current];
    for (const key of live.keys()) {
      if (!frozenOrder.current.includes(key)) frozenOrder.current.push(key);
    }
    order = frozenOrder.current;
  } else {
    frozenOrder.current = null;
    order = [...live.keys()];
    // Only live items can be needed again once the strip is thawed.
    for (const key of [...snapshot.current.keys()]) {
      if (!live.has(key)) snapshot.current.delete(key);
    }
  }
  lastOrder.current = order;

  const entries: StripEntry<T>[] = [];
  for (const key of order) {
    const liveItem = live.get(key);
    const item = liveItem ?? snapshot.current.get(key);
    if (item !== undefined) entries.push({ key, item, ended: liveItem === undefined });
  }

  const inspectedEntry = inspecting
    ? entries.find((e) => e.key === inspecting.key)
    : undefined;

  // Follow the tile, not the rect it opened at. Runs every render (the strip
  // re-renders on each status update) and only commits a real move.
  useLayoutEffect(() => {
    if (!inspecting || !tipRef.current) return;
    if (!inspecting.el.isConnected) {
      closeNow();
      return;
    }
    const anchor = inspecting.el.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const gap = 8;
    let left = anchor.right + gap;
    if (left + t.width > window.innerWidth - 6) left = anchor.left - t.width - gap;
    left = Math.max(6, left);
    let top = anchor.top;
    if (top + t.height > window.innerHeight - 6) top = window.innerHeight - t.height - 6;
    top = Math.max(6, top);
    // DOM rects are viewport pixels; the portalled card itself is CSS-zoomed.
    const zoom = parseFloat(getComputedStyle(tipRef.current).zoom) || 1;
    const next = { left: left / zoom, top: top / zoom };
    if (!pos || Math.abs(pos.left - next.left) > 0.5 || Math.abs(pos.top - next.top) > 0.5) {
      setPos(next);
    }
  });

  useEffect(() => {
    if (!inspecting) return;
    window.addEventListener('resize', closeNow);
    return () => window.removeEventListener('resize', closeNow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspecting]);

  useEffect(() => cancelClose, []);

  const open = (key: string, el: HTMLElement) => {
    cancelClose();
    setInspected((cur) => (cur && cur.key === key && cur.el === el ? cur : { key, el }));
  };

  const tileProps = (key: string): StripTileProps | Record<string, never> =>
    enabled
      ? {
          onMouseEnter: (e) => open(key, e.currentTarget),
          onMouseLeave: scheduleClose,
          onFocus: (e) => open(key, e.currentTarget),
          onBlur: scheduleClose,
          onKeyDown: (e) => {
            if (e.key === 'Escape') closeNow();
          },
        }
      : {};

  const node: ReactNode = inspecting && inspectedEntry
    ? createPortal(
        <div
          ref={tipRef}
          className="hud-tooltip"
          style={{
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {renderTip(inspectedEntry)}
        </div>,
        document.body,
      )
    : null;

  return {
    entries,
    frozen,
    inspectedKey: inspecting?.key ?? null,
    tileProps,
    node,
  };
}
