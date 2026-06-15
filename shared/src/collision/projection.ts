import type { NodeFeatureShape } from '../world/nodeFeatures';
import type { Vec2 } from '../systems/spatial';

export interface LayerProjection {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export function identityProjection(): LayerProjection {
  return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
}

export function minimapProjection(
  mmX: number,
  mmY: number,
  mmW: number,
  mmH: number,
  nodeW: number,
  nodeH: number,
): LayerProjection {
  return {
    scaleX: mmW / nodeW,
    scaleY: mmH / nodeH,
    offsetX: mmX,
    offsetY: mmY,
  };
}

export function projectPoint(point: Vec2, projection: LayerProjection): Vec2 {
  return {
    x: projection.offsetX + point.x * projection.scaleX,
    y: projection.offsetY + point.y * projection.scaleY,
  };
}

export function projectShape(
  shape: NodeFeatureShape,
  projection: LayerProjection,
): NodeFeatureShape {
  switch (shape.kind) {
    case 'circle':
      return {
        kind: 'circle',
        x: projection.offsetX + shape.x * projection.scaleX,
        y: projection.offsetY + shape.y * projection.scaleY,
        radius: shape.radius * Math.min(projection.scaleX, projection.scaleY),
      };
    case 'ellipse':
      return {
        kind: 'ellipse',
        x: projection.offsetX + shape.x * projection.scaleX,
        y: projection.offsetY + shape.y * projection.scaleY,
        halfW: shape.halfW * projection.scaleX,
        halfH: shape.halfH * projection.scaleY,
      };
    case 'rect':
      return {
        kind: 'rect',
        x: projection.offsetX + shape.x * projection.scaleX,
        y: projection.offsetY + shape.y * projection.scaleY,
        halfW: shape.halfW * projection.scaleX,
        halfH: shape.halfH * projection.scaleY,
      };
  }
}
