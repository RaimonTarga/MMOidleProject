import type { DamageElement } from '@mmo-idle/shared';
import { entityNetworkId, entityNetworkKind, type ServerEntity } from '../../../ecs/entity';
import type { World } from '../../../world/World';

/** Presentation only. Call beside finalized HP loss, unless an existing hit/DoT
 * event already carries that instance. Never invokes damage hooks or changes HP. */
export function pushDamageEvent(
  world: World,
  target: ServerEntity,
  amount: number,
  options: { category?: 'direct' | 'dot'; element?: DamageElement; sourceId?: string } = {},
): void {
  const targetId = entityNetworkId(target);
  const targetKind = entityNetworkKind(target);
  if (!targetId || !targetKind || !target.hasPosition || !Number.isFinite(amount) || amount <= 0) return;
  world.pushEvent(target.hasPosition.nodeId, {
    kind: 'damage', targetId, targetKind, targetPos: { ...target.hasPosition.current },
    amount, category: options.category ?? 'direct',
    ...(options.element ? { element: options.element } : {}),
    ...(options.sourceId ? { sourceId: options.sourceId } : {}),
  });
}
