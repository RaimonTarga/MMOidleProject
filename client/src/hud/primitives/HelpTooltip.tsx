import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Custom hover tooltip. Rendered via a portal to <body> (not inside the row) so
// it is never clipped by a panel's overflow:auto, and positioned with fixed
// coordinates from the trigger's bounding rect, flipping/clamping to stay
// on-screen. The tooltip itself is pointer-events:none, so it can never sit
// between the cursor and the thing it is describing.
//
// Desktop pointer plus keyboard focus: focus opens the same tooltip hover does,
// and Escape dismisses it without moving focus, so a keyboard reader is not
// stuck with a card covering what they are about to tab to. Trigger elements
// opt in by being focusable — the handlers are inert on an element that cannot
// take focus, so nothing already using this hook changes behaviour.
//
// Lives in primitives because it is the explanation grammar for the whole HUD,
// not just the character sheet: stat rows, skill nodes, ability effect lines,
// class mechanics and the evasion instrument all explain themselves this way.
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

  const open = (e: { currentTarget: HTMLElement }) =>
    setAnchor(e.currentTarget.getBoundingClientRect());
  const close = () => { setAnchor(null); setPos(null); };

  const handlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => open(e),
    onMouseLeave: close,
    onFocus: (e: React.FocusEvent<HTMLElement>) => open(e),
    onBlur: close,
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Escape') close();
    },
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

/**
 * The hook's wrapper form, for the common case: a span that explains itself on
 * hover. Callers that need the handlers on an element they already own (a row,
 * a button, a node card) should use {@link useHoverTooltip} directly.
 */
export function HelpTooltip({
  tip,
  className,
  children,
}: {
  tip: ReactNode | undefined;
  className?: string;
  children: ReactNode;
}) {
  const { handlers, node } = useHoverTooltip(tip);
  return (
    <span className={className} {...handlers}>
      {children}
      {node}
    </span>
  );
}
