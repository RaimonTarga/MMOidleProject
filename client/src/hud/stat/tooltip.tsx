import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Custom hover tooltip. Rendered via a portal to <body> (not inside the row) so
// it is never clipped by the sidebar's overflow:auto, and positioned with fixed
// coordinates from the trigger's bounding rect, flipping/clamping to stay
// on-screen. Desktop hover only; the tooltip itself is pointer-events:none.
export function useHoverTooltip(tip: ReactNode | undefined) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!anchor || !tipRef.current) return;
    const t = tipRef.current.getBoundingClientRect();
    const gap = 8;
    // Prefer to the right of the row; flip left if it would overflow.
    let left = anchor.right + gap;
    if (left + t.width > window.innerWidth - 6) left = anchor.left - t.width - gap;
    left = Math.max(6, left);
    // Align to the row top, clamped into the viewport.
    let top = anchor.top;
    if (top + t.height > window.innerHeight - 6) top = window.innerHeight - t.height - 6;
    top = Math.max(6, top);
    setPos({ left, top });
  }, [anchor]);

  // No help text → inert: no handlers attached, nothing portalled.
  if (!tip) return { handlers: {} as Record<string, never>, node: null as ReactNode };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget.getBoundingClientRect()),
    onMouseLeave: () => { setAnchor(null); setPos(null); },
  };

  const node: ReactNode = anchor
    ? createPortal(
        <div
          ref={tipRef}
          className="hud-tooltip"
          style={{
            left: pos?.left ?? anchor.right + 8,
            top: pos?.top ?? anchor.top,
            visibility: pos ? 'visible' : 'hidden',
          }}
        >
          {tip}
        </div>,
        document.body,
      )
    : null;

  return { handlers, node };
}
