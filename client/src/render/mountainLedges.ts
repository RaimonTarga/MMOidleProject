import Phaser from 'phaser';
import type { NodeFeatureShape } from '@mmo-idle/shared';

type Ring = 'outer' | 'inner';
type Side = 'north' | 'south' | 'west' | 'east';

export interface MountainLedgeFeature {
  id: string;
  shape: NodeFeatureShape;
}

const LEVEL_ONE = 0x81909a;
const LEVEL_TWO = 0x929fa7;
const FACE = 0x465966;
const FACE_DARK = 0x354650;
const LIP = 0xb4bec4;
const SHADOW = 0x1f2b32;
const FACE_DEPTH = 26;
const SHADOW_DEPTH = 13;
const CORNER_REACH = 80;

function segmentInfo(id: string): { ring: Ring; side: Side } | null {
  const match = id.match(/_(outer|inner)_(north|south|west|east)_/);
  if (!match) return null;
  return { ring: match[1] as Ring, side: match[2] as Side };
}

function ringBounds(
  features: MountainLedgeFeature[],
  ring: Ring,
): { left: number; right: number; top: number; bottom: number } | null {
  const sides: Partial<Record<Side, number[]>> = {};
  for (const feature of features) {
    const info = segmentInfo(feature.id);
    if (!info || info.ring !== ring || feature.shape.kind !== 'rect') continue;
    (sides[info.side] ??= []).push(
      info.side === 'north' || info.side === 'south'
        ? feature.shape.y
        : feature.shape.x,
    );
  }
  const avg = (values: number[] | undefined): number | null =>
    values?.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const left = avg(sides.west);
  const right = avg(sides.east);
  const top = avg(sides.north);
  const bottom = avg(sides.south);
  return left != null && right != null && top != null && bottom != null
    ? { left, right, top, bottom }
    : null;
}

function drawPlateauSurface(
  graphics: Phaser.GameObjects.Graphics,
  bounds: NonNullable<ReturnType<typeof ringBounds>>,
  offsetX: number,
  offsetY: number,
  color: number,
  alpha: number,
): void {
  graphics.fillStyle(color, alpha);
  graphics.fillRect(
    offsetX + bounds.left,
    offsetY + bounds.top,
    bounds.right - bounds.left,
    bounds.bottom - bounds.top,
  );
}

function drawHorizontalFace(
  graphics: Phaser.GameObjects.Graphics,
  shape: Extract<NodeFeatureShape, { kind: 'rect' }>,
  side: 'north' | 'south',
  offsetX: number,
  offsetY: number,
  trimStart = 0,
  trimEnd = 0,
): void {
  const x = offsetX + shape.x - shape.halfW;
  const width = shape.halfW * 2;
  const lipY = offsetY + shape.y + (side === 'north' ? shape.halfH : -shape.halfH);
  const dir = side === 'north' ? -1 : 1;
  const faceY = dir < 0 ? lipY - FACE_DEPTH : lipY;
  const shadowY = dir < 0
    ? faceY - SHADOW_DEPTH
    : faceY + FACE_DEPTH;

  graphics.fillStyle(SHADOW, 0.38);
  graphics.fillRect(x + 5, shadowY, width - 10, SHADOW_DEPTH);
  graphics.fillStyle(FACE_DARK, 1);
  graphics.fillRect(x, faceY, width, FACE_DEPTH);
  graphics.fillStyle(FACE, 1);
  graphics.fillRect(x + 3, faceY + 2, width - 6, FACE_DEPTH * 0.58);
  graphics.lineStyle(4, LIP, 0.95);
  graphics.lineBetween(x + trimStart, lipY, x + width - trimEnd, lipY);

  graphics.lineStyle(2, FACE_DARK, 0.8);
  for (const frac of [0.24, 0.51, 0.78]) {
    const crackX = x + width * frac;
    graphics.lineBetween(crackX, faceY + 4, crackX - dir * 4, faceY + FACE_DEPTH - 3);
  }
}

function drawVerticalFace(
  graphics: Phaser.GameObjects.Graphics,
  shape: Extract<NodeFeatureShape, { kind: 'rect' }>,
  side: 'west' | 'east',
  offsetX: number,
  offsetY: number,
  trimStart = 0,
  trimEnd = 0,
): void {
  const y = offsetY + shape.y - shape.halfH;
  const height = shape.halfH * 2;
  const lipX = offsetX + shape.x + (side === 'west' ? shape.halfW : -shape.halfW);
  const dir = side === 'west' ? -1 : 1;
  const faceX = dir < 0 ? lipX - FACE_DEPTH : lipX;
  const shadowX = dir < 0 ? faceX - SHADOW_DEPTH : faceX + FACE_DEPTH;

  graphics.fillStyle(SHADOW, 0.3);
  graphics.fillRect(shadowX, y + 5, SHADOW_DEPTH, height - 10);
  graphics.fillStyle(FACE_DARK, 1);
  graphics.fillRect(faceX, y, FACE_DEPTH, height);
  graphics.fillStyle(FACE, 1);
  graphics.fillRect(faceX + 2, y + 3, FACE_DEPTH * 0.58, height - 6);
  graphics.lineStyle(4, LIP, 0.95);
  graphics.lineBetween(lipX, y + trimStart, lipX, y + height - trimEnd);
}

function cornerSegment(
  features: MountainLedgeFeature[],
  ring: Ring,
  side: Side,
  corner: 'min' | 'max',
): Extract<NodeFeatureShape, { kind: 'rect' }> | null {
  let best: Extract<NodeFeatureShape, { kind: 'rect' }> | null = null;
  let bestEdge = corner === 'min' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  for (const feature of features) {
    const info = segmentInfo(feature.id);
    if (!info || info.ring !== ring || info.side !== side || feature.shape.kind !== 'rect') {
      continue;
    }
    const horizontal = side === 'north' || side === 'south';
    const edge = horizontal
      ? feature.shape.x + (corner === 'min' ? -feature.shape.halfW : feature.shape.halfW)
      : feature.shape.y + (corner === 'min' ? -feature.shape.halfH : feature.shape.halfH);
    if ((corner === 'min' && edge < bestEdge) || (corner === 'max' && edge > bestEdge)) {
      best = feature.shape;
      bestEdge = edge;
    }
  }
  return best;
}

function hasCornerJoin(
  features: MountainLedgeFeature[],
  ring: Ring,
  horizontalSide: 'north' | 'south',
  verticalSide: 'west' | 'east',
  bounds: NonNullable<ReturnType<typeof ringBounds>>,
): boolean {
  const xEnd = verticalSide === 'west' ? 'min' : 'max';
  const yEnd = horizontalSide === 'north' ? 'min' : 'max';
  const horizontal = cornerSegment(features, ring, horizontalSide, xEnd);
  const vertical = cornerSegment(features, ring, verticalSide, yEnd);
  if (!horizontal || !vertical) return false;

  const targetX = verticalSide === 'west' ? bounds.left : bounds.right;
  const targetY = horizontalSide === 'north' ? bounds.top : bounds.bottom;
  const horizontalEdge = horizontal.x + (xEnd === 'min' ? -horizontal.halfW : horizontal.halfW);
  const verticalEdge = vertical.y + (yEnd === 'min' ? -vertical.halfH : vertical.halfH);
  // A corner entrance carves one or both segments well away from the nominal
  // corner. Do not bridge that authored opening with a visual join.
  if (Math.abs(horizontalEdge - targetX) > CORNER_REACH) return false;
  if (Math.abs(verticalEdge - targetY) > CORNER_REACH) return false;
  return true;
}

function drawCornerJoin(
  graphics: Phaser.GameObjects.Graphics,
  features: MountainLedgeFeature[],
  ring: Ring,
  horizontalSide: 'north' | 'south',
  verticalSide: 'west' | 'east',
  bounds: NonNullable<ReturnType<typeof ringBounds>>,
  offsetX: number,
  offsetY: number,
): void {
  if (!hasCornerJoin(features, ring, horizontalSide, verticalSide, bounds)) return;
  const xEnd = verticalSide === 'west' ? 'min' : 'max';
  const yEnd = horizontalSide === 'north' ? 'min' : 'max';
  const horizontal = cornerSegment(features, ring, horizontalSide, xEnd)!;
  const vertical = cornerSegment(features, ring, verticalSide, yEnd)!;

  const lipX = offsetX + vertical.x + (verticalSide === 'west' ? vertical.halfW : -vertical.halfW);
  const lipY = offsetY + horizontal.y + (horizontalSide === 'north' ? horizontal.halfH : -horizontal.halfH);
  const dirX = verticalSide === 'west' ? -1 : 1;
  const dirY = horizontalSide === 'north' ? -1 : 1;
  const faceX = dirX < 0 ? lipX - FACE_DEPTH : lipX;
  const faceY = dirY < 0 ? lipY - FACE_DEPTH : lipY;
  const shadowX = dirX < 0 ? faceX - SHADOW_DEPTH : faceX + FACE_DEPTH;
  const shadowY = dirY < 0 ? faceY - SHADOW_DEPTH : faceY + FACE_DEPTH;

  graphics.fillStyle(SHADOW, 0.38);
  graphics.fillRoundedRect(shadowX, shadowY, SHADOW_DEPTH, SHADOW_DEPTH, 5);
  graphics.fillStyle(FACE_DARK, 1);
  graphics.fillRoundedRect(faceX, faceY, FACE_DEPTH, FACE_DEPTH, 7);
  graphics.fillStyle(FACE, 1);
  graphics.fillRoundedRect(
    faceX + (dirX < 0 ? 5 : 2),
    faceY + (dirY < 0 ? 5 : 2),
    FACE_DEPTH - 7,
    FACE_DEPTH - 7,
    5,
  );

  // One mitered L replaces the two independently stroked endpoints.
  graphics.lineStyle(4, LIP, 0.95);
  graphics.beginPath();
  graphics.moveTo(lipX - dirX * FACE_DEPTH, lipY);
  graphics.lineTo(lipX, lipY);
  graphics.lineTo(lipX, lipY - dirY * FACE_DEPTH);
  graphics.strokePath();
}

function drawRingCorners(
  graphics: Phaser.GameObjects.Graphics,
  features: MountainLedgeFeature[],
  ring: Ring,
  bounds: NonNullable<ReturnType<typeof ringBounds>>,
  offsetX: number,
  offsetY: number,
): void {
  drawCornerJoin(graphics, features, ring, 'north', 'west', bounds, offsetX, offsetY);
  drawCornerJoin(graphics, features, ring, 'north', 'east', bounds, offsetX, offsetY);
  drawCornerJoin(graphics, features, ring, 'south', 'west', bounds, offsetX, offsetY);
  drawCornerJoin(graphics, features, ring, 'south', 'east', bounds, offsetX, offsetY);
}

/** Draw two continuous raised surfaces and only their outward cliff boundaries. */
export function drawMountainElevation(
  graphics: Phaser.GameObjects.Graphics,
  features: MountainLedgeFeature[],
  offsetX: number,
  offsetY: number,
): boolean {
  const ledges = features.filter((feature) => segmentInfo(feature.id));
  if (ledges.length === 0) return false;

  const outer = ringBounds(ledges, 'outer');
  const inner = ringBounds(ledges, 'inner');
  if (outer) drawPlateauSurface(graphics, outer, offsetX, offsetY, LEVEL_ONE, 0.16);
  if (inner) drawPlateauSurface(graphics, inner, offsetX, offsetY, LEVEL_TWO, 0.18);

  for (const feature of ledges) {
    const info = segmentInfo(feature.id);
    if (!info || feature.shape.kind !== 'rect') continue;
    if (info.side === 'north' || info.side === 'south') {
      const isStartSegment = cornerSegment(ledges, info.ring, info.side, 'min') === feature.shape;
      const isEndSegment = cornerSegment(ledges, info.ring, info.side, 'max') === feature.shape;
      const westSegment = cornerSegment(ledges, info.ring, 'west', info.side === 'north' ? 'min' : 'max');
      const eastSegment = cornerSegment(ledges, info.ring, 'east', info.side === 'north' ? 'min' : 'max');
      const westLipX = westSegment ? westSegment.x + westSegment.halfW : feature.shape.x - feature.shape.halfW;
      const eastLipX = eastSegment ? eastSegment.x - eastSegment.halfW : feature.shape.x + feature.shape.halfW;
      const trimStart = outer && info.ring === 'outer'
        ? (isStartSegment && hasCornerJoin(ledges, info.ring, info.side, 'west', outer)
          ? Math.max(0, westLipX - (feature.shape.x - feature.shape.halfW)) : 0)
        : inner && info.ring === 'inner'
          ? (isStartSegment && hasCornerJoin(ledges, info.ring, info.side, 'west', inner)
            ? Math.max(0, westLipX - (feature.shape.x - feature.shape.halfW)) : 0)
          : 0;
      const trimEnd = outer && info.ring === 'outer'
        ? (isEndSegment && hasCornerJoin(ledges, info.ring, info.side, 'east', outer)
          ? Math.max(0, feature.shape.x + feature.shape.halfW - eastLipX) : 0)
        : inner && info.ring === 'inner'
          ? (isEndSegment && hasCornerJoin(ledges, info.ring, info.side, 'east', inner)
            ? Math.max(0, feature.shape.x + feature.shape.halfW - eastLipX) : 0)
          : 0;
      drawHorizontalFace(
        graphics,
        feature.shape,
        info.side,
        offsetX,
        offsetY,
        trimStart,
        trimEnd,
      );
    } else {
      const isStartSegment = cornerSegment(ledges, info.ring, info.side, 'min') === feature.shape;
      const isEndSegment = cornerSegment(ledges, info.ring, info.side, 'max') === feature.shape;
      const northSegment = cornerSegment(ledges, info.ring, 'north', info.side === 'west' ? 'min' : 'max');
      const southSegment = cornerSegment(ledges, info.ring, 'south', info.side === 'west' ? 'min' : 'max');
      const northLipY = northSegment ? northSegment.y + northSegment.halfH : feature.shape.y - feature.shape.halfH;
      const southLipY = southSegment ? southSegment.y - southSegment.halfH : feature.shape.y + feature.shape.halfH;
      const trimStart = outer && info.ring === 'outer'
        ? (isStartSegment && hasCornerJoin(ledges, info.ring, 'north', info.side, outer)
          ? Math.max(0, northLipY - (feature.shape.y - feature.shape.halfH)) : 0)
        : inner && info.ring === 'inner'
          ? (isStartSegment && hasCornerJoin(ledges, info.ring, 'north', info.side, inner)
            ? Math.max(0, northLipY - (feature.shape.y - feature.shape.halfH)) : 0)
          : 0;
      const trimEnd = outer && info.ring === 'outer'
        ? (isEndSegment && hasCornerJoin(ledges, info.ring, 'south', info.side, outer)
          ? Math.max(0, feature.shape.y + feature.shape.halfH - southLipY) : 0)
        : inner && info.ring === 'inner'
          ? (isEndSegment && hasCornerJoin(ledges, info.ring, 'south', info.side, inner)
            ? Math.max(0, feature.shape.y + feature.shape.halfH - southLipY) : 0)
          : 0;
      drawVerticalFace(
        graphics,
        feature.shape,
        info.side,
        offsetX,
        offsetY,
        trimStart,
        trimEnd,
      );
    }
  }
  if (outer) drawRingCorners(graphics, ledges, 'outer', outer, offsetX, offsetY);
  if (inner) drawRingCorners(graphics, ledges, 'inner', inner, offsetX, offsetY);
  return true;
}
