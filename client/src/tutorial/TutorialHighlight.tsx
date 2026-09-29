import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAtomValue } from 'jotai';
import { tutorialAnchorSelector } from '@mmo-idle/shared';
import { tutorialHighlightAtom, tutorialPressAtom } from './atoms';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const RING_PAD = 4;

/**
 * Rendered AND visible. A dialog on its way out (or hidden by a UI unlock wake)
 * can keep its buttons in the DOM with a real rect; ringing those leaves a
 * ghost box floating over the game.
 */
function visibleRect(element: Element | null): DOMRect | null {
  if (!element) return null;
  const check = (element as Element & { checkVisibility?: (o?: object) => boolean }).checkVisibility;
  if (check && !check.call(element, { checkOpacity: true, checkVisibilityCSS: true })) return null;
  for (let node: Element | null = element; node; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 0.05) return null;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? rect : null;
}

function sameBox(a: Box | null, b: Box | null): boolean {
  return a === b || (!!a && !!b
    && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height);
}

/**
 * The pulsing ring around whatever the guide is about to press. It follows the
 * element every frame (dialogs animate in, lists scroll), and draws nothing
 * while the element is not rendered — a staged unlock or a closed panel is a
 * wait, not an error.
 */
export function TutorialHighlight() {
  const anchor = useAtomValue(tutorialHighlightAtom);
  const presses = useAtomValue(tutorialPressAtom);
  const [box, setBox] = useState<Box | null>(null);
  // True for one pulse after each press. A flag, not a class tied to the count:
  // the ring remounts on every new anchor and must not replay an old press.
  const [pulsing, setPulsing] = useState(false);
  useEffect(() => {
    if (presses === 0) return;
    setPulsing(true);
    const timer = setTimeout(() => setPulsing(false), 360);
    return () => clearTimeout(timer);
  }, [presses]);

  useEffect(() => {
    if (!anchor) {
      setBox(null);
      return;
    }
    const selector = tutorialAnchorSelector(anchor);
    let frame = 0;
    let scrolledTo: Element | null = null;
    const track = () => {
      const element = document.querySelector(selector);
      if (element && element !== scrolledTo && visibleRect(element)) {
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        scrolledTo = element;
      }
      const rect = visibleRect(element);
      const next = rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
      setBox((prev) => (sameBox(prev, next) ? prev : next));
      frame = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  if (!box) return null;
  return createPortal(
    <div
      key={pulsing ? `press-${presses}` : 'ring'}
      className={`tutorial-ring${pulsing ? ' tutorial-ring--press' : ''}`}
      aria-hidden
      style={{
        left: box.left - RING_PAD,
        top: box.top - RING_PAD,
        width: box.width + RING_PAD * 2,
        height: box.height + RING_PAD * 2,
      }}
    />,
    document.body,
  );
}
