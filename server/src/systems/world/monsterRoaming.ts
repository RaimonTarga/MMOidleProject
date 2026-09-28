import type { Vec2 } from '@mmo-idle/shared';

// Idle destinations and ambient spawn centers leave breathing room at zone entries.
// Combat movement keeps its existing bounds; this is not an invulnerable border.
export const MONSTER_ROAM_MARGIN = 240;

export function clampMonsterRoamTarget(
  pos: Vec2,
  node: { width: number; height: number } | undefined,
): Vec2 {
  if (!node) return pos;
  const x = Math.min(MONSTER_ROAM_MARGIN, node.width / 2);
  const y = Math.min(MONSTER_ROAM_MARGIN, node.height / 2);
  return {
    x: Math.max(x, Math.min(node.width - x, pos.x)),
    y: Math.max(y, Math.min(node.height - y, pos.y)),
  };
}
