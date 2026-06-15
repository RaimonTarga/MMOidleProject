import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 1100px)';

/**
 * True when the viewport is at or below the mobile/tablet breakpoint (1100px) —
 * the same threshold the DOM HUD uses to switch layouts. Updates on resize.
 * Shared so panels can branch their interaction model (e.g. tap-to-select on
 * touch where desktop relies on hover).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
