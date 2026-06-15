import { GAME_CONFIG, nodeExitsForNodeId, type NodeDirection } from '@mmo-idle/shared';
import type { GameScene } from '../scenes/game/GameScene';
import {
  destroyNodeStatic,
  paintNodeStatic,
  type NodeStaticGroup,
} from '../scenes/game/overlays';

export type NeighborLayer = Map<NodeDirection, NodeStaticGroup>;

/** Scene-pixel offset of a neighbor node's local (0,0) gameplay corner. */
export function directionOffset(dir: NodeDirection): { x: number; y: number } {
  const { NODE_WIDTH: W, NODE_HEIGHT: H } = GAME_CONFIG;
  switch (dir) {
    case 'east':
      return { x: W, y: 0 };
    case 'west':
      return { x: -W, y: 0 };
    case 'north':
      return { x: 0, y: -H };
    case 'south':
      return { x: 0, y: H };
  }
}

export function rebuildNeighborLayer(scene: GameScene, centerNodeId: string): void {
  for (const g of scene.neighborLayer.values()) destroyNodeStatic(g);
  scene.neighborLayer.clear();

  const exits = nodeExitsForNodeId(centerNodeId);
  for (const dir of ['north', 'south', 'east', 'west'] as NodeDirection[]) {
    const id = exits[dir];
    if (!id) continue;
    const off = directionOffset(dir);
    scene.neighborLayer.set(
      dir,
      paintNodeStatic(scene, id, off.x, off.y, -0.01, false, { preview: true }),
    );
  }
}

export function clearNeighborLayer(scene: GameScene): void {
  for (const g of scene.neighborLayer.values()) destroyNodeStatic(g);
  scene.neighborLayer.clear();
}
