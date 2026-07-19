import type { Vec2 } from '../systems/spatial';

export type NavigationBodyKind = 'player' | 'monster' | 'minion';

/**
 * Deliberately simple, compact bodies used only for terrain navigation.
 * Sprite-derived hitboxes remain authoritative for combat reach and presentation.
 * Keeping navigation independent prevents animation silhouettes and tiny sprite
 * details from creating corner catches or paths that movement cannot reproduce.
 */
export const NAVIGATION_BODY_HALF_EXTENTS: Readonly<
  Record<NavigationBodyKind | 'boss', Readonly<Vec2>>
> = {
  player: { x: 22, y: 18 },
  monster: { x: 22, y: 18 },
  minion: { x: 18, y: 16 },
  boss: { x: 34, y: 28 },
};

export function navigationBodyHalfExtents(
  kind: NavigationBodyKind,
  isBoss = false,
): Vec2 {
  const body = isBoss ? NAVIGATION_BODY_HALF_EXTENTS.boss : NAVIGATION_BODY_HALF_EXTENTS[kind];
  return { x: body.x, y: body.y };
}
