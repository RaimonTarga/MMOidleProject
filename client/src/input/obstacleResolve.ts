import {
  aabbHalfExtents,
  blockShapesForMover,
  FALLBACK_PLAYER_AABB,
  resolveMoveAgainstBlocks,
  type NodeFeatureShape,
  type PlayerView,
  type Vec2,
} from '@mmo-idle/shared';
import type { RenderState } from '../render/state';
import { ABYSSAL_THRONE_FEATURE_ID, isVoidThroneUnblocked } from '../scenes/game/voidThrone';
import type { GameScene } from '../scenes/GameScene';

export function getOwnBlockShapes(scene: GameScene): NodeFeatureShape[] {
  const suppressed = new Set<string>();
  if (isVoidThroneUnblocked(scene)) {
    suppressed.add(ABYSSAL_THRONE_FEATURE_ID);
  }
  return blockShapesForMover(scene.state.ownNodeId, 'player', suppressed);
}

export function getOwnMovePad(state: RenderState): Vec2 {
  const ownId = state.ownId;
  if (!ownId) return aabbHalfExtents([FALLBACK_PLAYER_AABB]);
  const view = state.view.get(ownId) as PlayerView | undefined;
  return aabbHalfExtents(view?.hitboxRects ?? [FALLBACK_PLAYER_AABB]);
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
