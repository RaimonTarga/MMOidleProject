import { isMobileViewport } from '../breakpoints';

/**
 * World width (px) a mobile viewport should show regardless of device size.
 * Nodes are 3200px square; a phone at zoom 1 would frame ~400px of that, which
 * is a keyhole. Fitting a fixed slice instead means a small phone and a large
 * tablet frame the same amount of fight.
 */
export const MOBILE_TARGET_VIEW_WIDTH = 900;

/** Never shrink sprites below half size — past that, pixel art stops reading. */
export const MIN_CAMERA_ZOOM = 0.5;

/**
 * Camera zoom for the current viewport.
 *
 * Desktop is always 1: the existing 1:1 framing is the intended desktop feel and
 * any zoom there would soften the pixel art for no gain. Below the shared mobile
 * breakpoint the camera zooms out to show {@link MOBILE_TARGET_VIEW_WIDTH} of
 * world, clamped so it never magnifies (>1) and never shrinks past
 * {@link MIN_CAMERA_ZOOM}. Tablets just under the breakpoint land near 0.9, so
 * crossing it is a nudge rather than a jump.
 */
export function cameraZoomForViewport(viewportWidth: number): number {
  if (!isMobileViewport()) return 1;
  if (viewportWidth <= 0) return 1;
  const fit = viewportWidth / MOBILE_TARGET_VIEW_WIDTH;
  return Math.min(1, Math.max(MIN_CAMERA_ZOOM, fit));
}

/**
 * Size of the camera's world view, in world px.
 *
 * Every bit of camera math that reasons in WORLD space (peek bounds, scroll
 * clamping, backdrop sizing) must use this rather than `cam.width`/`cam.height`,
 * which stay in screen px and so understate the view whenever zoom < 1.
 */
export function cameraWorldViewSize(cam: {
  width: number;
  height: number;
  zoom: number;
}): { width: number; height: number } {
  const zoom = cam.zoom || 1;
  return { width: cam.width / zoom, height: cam.height / zoom };
}

/**
 * Phaser's camera zoom transforms EVERYTHING the camera draws — including
 * `scrollFactor(0)` HUD objects, which are only pinned against camera SCROLL, not
 * against zoom. So at mobile zoom a full-screen overlay sized `scale.width` renders
 * at `scale.width * zoom` and reads as a box floating in the middle of the screen.
 *
 * Multiply a screen-space object's SIZE (or `setScale`) by this to cancel that out.
 */
export function screenSpaceScale(cam: { zoom: number }): number {
  return 1 / (cam.zoom || 1);
}

/**
 * Object-space position that puts a `scrollFactor(0)` object at screen pixel
 * (`screenX`, `screenY`).
 *
 * Zoom is applied about the camera's origin (its center), so screen-space objects
 * pinned anywhere OTHER than dead center drift inward as zoom drops — a top-left
 * label at (14, 14) lands a quarter of the way into the screen at zoom 0.5. Centered
 * objects are already correct and map to themselves.
 */
export function screenToCameraSpace(
  cam: { width: number; height: number; zoom: number },
  screenX: number,
  screenY: number,
): { x: number; y: number } {
  const zoom = cam.zoom || 1;
  const originX = cam.width / 2;
  const originY = cam.height / 2;
  return {
    x: originX + (screenX - originX) / zoom,
    y: originY + (screenY - originY) / zoom,
  };
}
