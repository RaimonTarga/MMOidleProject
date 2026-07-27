/**
 * The single mobile/desktop boundary shared by React, Phaser, and input.
 *
 * The stylesheets mirror this value as `@media (max-width: 1100px)` and
 * `@media (min-width: 1101px)`. Changing it here means changing those two
 * queries as well — nothing else should re-declare the number.
 */
export const MOBILE_MAX_WIDTH = 1100;

export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

/** Viewport-based, deliberately independent of Phaser's rail-narrowed canvas. */
export function isMobileViewport(): boolean {
  return (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia(MOBILE_MEDIA_QUERY).matches
  );
}
