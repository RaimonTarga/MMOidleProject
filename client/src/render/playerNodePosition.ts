import type { PlayerView } from '@mmo-idle/shared';
import type { RenderState } from './state';
import { nodeToScene } from './sceneCoords';

/** Positions are node-local: never interpolate a retained sprite across nodes. */
export function resetPlayerNodePosition(
  state: Pick<RenderState, 'interpolation' | 'transform' | 'sprite'>,
  previousNodeId: string | undefined,
  player: Pick<PlayerView, 'id' | 'nodeId' | 'pos' | 'target'>,
  resetPosition = false,
): void {
  if (!resetPosition && (previousNodeId === undefined || previousNodeId === player.nodeId)) return;
  const interp = state.interpolation.get(player.id);
  if (interp) {
    interp.base = { ...player.pos };
    // Replace the offset so an old-node attack tween cannot move this sprite.
    interp.lungeOffset = { x: 0, y: 0 };
  }
  const transform = state.transform.get(player.id);
  if (transform) {
    transform.pos = { ...player.pos };
    transform.target = { ...player.target };
  }
  const position = nodeToScene(player.pos.x, player.pos.y);
  state.sprite.get(player.id)?.setPosition(position.x, position.y);
}
