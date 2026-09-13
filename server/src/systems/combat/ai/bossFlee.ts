import { GAME_CONFIG, distanceSq, inflateShape, segmentEntryT, type Vec2 } from '@mmo-idle/shared';
import type { MonsterEntity, PlayerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';
import { NODE_REGISTRY } from '../../../world/nodeRegistry';
import { navigationPadForEntity } from '../../world/movement';

/** A local, collision-clear retreat. Never path around the pursuer to a distant goal. */
export function fleeDestination(world: World, monster: MonsterEntity, target: PlayerEntity): Vec2 | null {
  const from = monster.hasPosition.current;
  const player = target.hasPosition.current;
  const ai = monster.controlsMonster;
  const node = NODE_REGISTRY.get(monster.hasPosition.nodeId);
  const width = node?.width ?? GAME_CONFIG.NODE_WIDTH;
  const height = node?.height ?? GAME_CONFIG.NODE_HEIGHT;
  const bearing = Math.atan2(from.y - player.y, from.x - player.x);
  const pad = navigationPadForEntity(monster);
  const shapes = world.collision.blockShapes(monster.hasPosition.nodeId, 'monster').map(shape => inflateShape(shape, pad));
  let best: Vec2 | null = null;
  let bestGain = 0;
  // Prefer straight away. Detours remain in the outward half-plane, never toward the player.
  for (const degrees of [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75]) {
    const angle = bearing + degrees * Math.PI / 180;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const offset = { x: from.x - ai.spawn.x, y: from.y - ai.spawn.y };
    const projection = offset.x * direction.x + offset.y * direction.y;
    const discriminant = projection ** 2 + Math.max(0, ai.leashRange - 2) ** 2 - offset.x ** 2 - offset.y ** 2;
    if (discriminant < 0) continue;
    let length = -projection + Math.sqrt(discriminant);
    // Bound the ray itself, without clamping an endpoint into a different heading.
    if (direction.x > 1e-6) length = Math.min(length, (width - 40 - from.x) / direction.x);
    if (direction.x < -1e-6) length = Math.min(length, (40 - from.x) / direction.x);
    if (direction.y > 1e-6) length = Math.min(length, (height - 40 - from.y) / direction.y);
    if (direction.y < -1e-6) length = Math.min(length, (40 - from.y) / direction.y);
    if (length < 40) continue;
    const end = { x: from.x + direction.x * length, y: from.y + direction.y * length };
    let fraction = 1;
    for (const shape of shapes) {
      const hit = segmentEntryT(from, end, shape);
      if (hit !== null) fraction = Math.min(fraction, hit);
    }
    const clearLength = length * fraction - 2;
    if (clearLength < 40) continue;
    const candidate = { x: from.x + direction.x * clearLength, y: from.y + direction.y * clearLength };
    // Follow an open straight line even when a sideways route could go farther.
    if (degrees === 0 && clearLength >= Math.min(160, length - 2)) return candidate;
    const gain = distanceSq(candidate, player) - distanceSq(from, player);
    if (gain > bestGain) { best = candidate; bestGain = gain; }
  }
  return best;
}
