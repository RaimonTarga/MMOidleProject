import type { RenderState } from '../render/state';

/** A reply belongs to one order, player, and coordinate space. */
export function isCurrentClickOrder(
  state: Pick<RenderState, 'ownMoveGeneration' | 'ownId' | 'ownNodeId' | 'ownClickActive'>,
  generation: number,
  ownId: string,
  nodeId: string,
): boolean {
  return state.ownClickActive && state.ownMoveGeneration === generation && state.ownId === ownId && state.ownNodeId === nodeId;
}
