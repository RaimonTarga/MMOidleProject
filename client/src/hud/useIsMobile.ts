import { useEffect, useState } from 'react';
import { isMobileViewport, MOBILE_MEDIA_QUERY } from '../breakpoints';

/**
 * True when the viewport is at or below the shared mobile/tablet breakpoint —
 * the same threshold the DOM HUD uses to switch layouts. Updates on resize.
 * Shared so panels can branch their interaction model (e.g. tap-to-select on
 * touch where desktop relies on hover).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(isMobileViewport);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
