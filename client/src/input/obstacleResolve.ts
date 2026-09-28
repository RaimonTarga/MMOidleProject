import {
  blockShapesForMover,
  navigationBodyHalfExtents,
  resolveMoveAgainstBlocks,
  type NodeFeatureShape,
  type Vec2,
} from '@mmo-idle/shared';
import type { RenderState } from '../render/state';
import type { GameScene } from '../scenes/GameScene';

export function getOwnBlockShapes(scene: GameScene): NodeFeatureShape[] {
  return blockShapesForMover(scene.state.ownNodeId, 'player', new Set<string>());
}

export function getOwnMovePad(state: RenderState): Vec2 {
  void state;
  return navigationBodyHalfExtents('player');
}

/** Box-vs-block move resolution using the caller's chosen segment start. */
export function resolveOwnMoveAgainstBlocks(
  scene: GameScene,
  from: Vec2,
  to: Vec2,
): Vec2 {
  const shapes = getOwnBlockShapes(scene);
  if (shapes.length === 0) return to;
  return resolveMoveAgainstBlocks(from, to, shapes, getOwnMovePad(scene.state));
}
