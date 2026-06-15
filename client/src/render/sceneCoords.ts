import {
  nodeToSceneCoords as sharedNodeToSceneCoords,
  sceneToNodeCoords as sharedSceneToNodeCoords,
} from '@mmo-idle/shared';

export function nodeToSceneX(x: number): number {
  return x;
}

export function nodeToSceneY(y: number): number {
  return y;
}

export function nodeToScene(x: number, y: number): { x: number; y: number } {
  return sharedNodeToSceneCoords(x, y);
}

export function sceneToNode(x: number, y: number): { x: number; y: number } {
  return sharedSceneToNodeCoords(x, y);
}

/** Y-sort depth uses scene-space foot Y. */
export function sceneDepthY(nodeY: number, visualOffsetY = 0): number {
  return nodeToSceneY(nodeY + visualOffsetY);
}
