import {
  buildFeatureCollisionRegions,
  GAME_CONFIG,
  minimapProjection,
  projectShape,
  type CollisionRegion,
  type CollisionRegionKind,
  type LayerProjection,
  type MonsterView,
  type MinionView,
  type PlayerView,
  outerReachHalfW,
} from '@mmo-idle/shared';
import type Phaser from 'phaser';
import { getOwnView } from './state';
import type { RenderState } from './state';
import { gateCollisionRegionsFromState, ensureNodeGates, openGateCollisionRegions } from './nodeGates';
import { GATE_COLOR, MM_H, MM_PAD, MM_W } from '../scenes/game/nodeExits';

const KIND_COLORS: Partial<Record<CollisionRegionKind, number>> = {
  block: 0xff66cc,
  damage: 0xff4444,
  status: 0xffaa44,
  heal: 0x44ff88,
  gate: GATE_COLOR,
  body: 0xff3333,
  aggro: 0xff8844,
  leash: 0x4466cc,
  reach: 0xff4444,
  spawn: 0xaa88ff,
};

function hitboxRectsToBodyRegions(
  id: string,
  ownerKind: CollisionRegion['ownerKind'],
  x: number,
  y: number,
  rects: { offsetX: number; offsetY: number; halfW: number; halfH: number }[],
): CollisionRegion[] {
  return rects.map((rect, index) => ({
    id: `${id}:body:${index}`,
    kind: 'body' as const,
    ownerId: id,
    ownerKind,
    shape: {
      kind: 'rect' as const,
      x: x + rect.offsetX,
      y: y + rect.offsetY,
      halfW: rect.halfW,
      halfH: rect.halfH,
    },
  }));
}

function circleRegion(
  id: string,
  kind: CollisionRegionKind,
  ownerKind: CollisionRegion['ownerKind'],
  x: number,
  y: number,
  radius: number,
): CollisionRegion {
  return {
    id,
    kind,
    ownerId: id,
    ownerKind,
    shape: { kind: 'circle', x, y, radius },
  };
}

/** Interpolated node position — matches sprite placement in stepInterpolation. */
function entityDrawNodePos(
  state: RenderState,
  id: string,
): { x: number; y: number } | null {
  const interp = state.interpolation.get(id);
  if (interp) {
    return {
      x: interp.base.x + interp.lungeOffset.x,
      y: interp.base.y + interp.lungeOffset.y,
    };
  }
  const transform = state.transform.get(id);
  if (transform) {
    return { x: transform.pos.x, y: transform.pos.y };
  }
  return null;
}

function buildEntityCollisionRegions(state: RenderState): CollisionRegion[] {
  const regions: CollisionRegion[] = [];

  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    const view = state.view.get(id);
    if (!sprite || !view) continue;

    const kind = state.kind.get(id);
    if (!kind) continue;

    const drawPos = entityDrawNodePos(state, id);
    if (!drawPos) continue;
    const nodeX = drawPos.x;
    const nodeY = drawPos.y;

    if ('hitboxRects' in view) {
      regions.push(
        ...hitboxRectsToBodyRegions(
          id,
          kind,
          nodeX,
          nodeY,
          view.hitboxRects,
        ),
      );
    }

    const ranges = state.debugRanges.get(id);
    if (ranges?.pullRange != null) {
      regions.push(
        circleRegion(`${id}:aggro`, 'aggro', kind, nodeX, nodeY, ranges.pullRange),
      );
    }
    if (ranges?.leashRange != null) {
      regions.push(
        circleRegion(`${id}:leash`, 'leash', kind, nodeX, nodeY, ranges.leashRange),
      );
    }
    if (ranges?.attackRange != null && 'hitboxRects' in view) {
      const reach =
        ranges.attackRange + outerReachHalfW(view.hitboxRects);
      regions.push(
        circleRegion(`${id}:reach`, 'reach', kind, nodeX, nodeY, reach),
      );
    }
  }

  const player = getOwnView(state);
  const ownDrawPos = state.ownId ? entityDrawNodePos(state, state.ownId) : null;
  if (player && ownDrawPos && player.summonsMinions) {
    const mult = player.passives['summoner.leash-mult'] ?? 2.0;
    const leashRadius = Math.max(40, player.attackRange * mult);
    regions.push(
      circleRegion(
        `${state.ownId}:summoner-leash`,
        'leash',
        'player',
        ownDrawPos.x,
        ownDrawPos.y,
        leashRadius,
      ),
    );
  }

  return regions;
}

export function buildClientCollisionLayer(state: RenderState): CollisionRegion[] {
  ensureNodeGates(state);
  return [
    ...buildFeatureCollisionRegions(state.ownNodeId),
    ...gateCollisionRegionsFromState(state),
    ...buildEntityCollisionRegions(state),
  ];
}

function strokeProjectedShape(
  gfx: Phaser.GameObjects.Graphics,
  shape: CollisionRegion['shape'],
  projection: LayerProjection,
  color: number,
  alpha: number,
  lineWidth: number,
): void {
  const projected = projectShape(shape, projection);
  gfx.lineStyle(lineWidth, color, alpha);
  switch (projected.kind) {
    case 'circle':
      gfx.strokeCircle(projected.x, projected.y, projected.radius);
      break;
    case 'ellipse':
      gfx.strokeEllipse(projected.x, projected.y, projected.halfW * 2, projected.halfH * 2);
      break;
    case 'rect':
      gfx.strokeRect(
        projected.x - projected.halfW,
        projected.y - projected.halfH,
        projected.halfW * 2,
        projected.halfH * 2,
      );
      break;
  }
}

function fillProjectedShape(
  gfx: Phaser.GameObjects.Graphics,
  shape: CollisionRegion['shape'],
  projection: LayerProjection,
  color: number,
  alpha: number,
): void {
  const projected = projectShape(shape, projection);
  gfx.fillStyle(color, alpha);
  switch (projected.kind) {
    case 'circle':
      gfx.fillCircle(projected.x, projected.y, projected.radius);
      break;
    case 'ellipse':
      gfx.fillEllipse(projected.x, projected.y, projected.halfW * 2, projected.halfH * 2);
      break;
    case 'rect':
      gfx.fillRect(
        projected.x - projected.halfW,
        projected.y - projected.halfH,
        projected.halfW * 2,
        projected.halfH * 2,
      );
      break;
  }
}

export interface PaintCollisionLayerOptions {
  mode: 'world' | 'minimap';
  kinds?: CollisionRegionKind[];
}

export function paintCollisionLayer(
  gfx: Phaser.GameObjects.Graphics,
  regions: CollisionRegion[],
  projection: LayerProjection,
  opts: PaintCollisionLayerOptions,
): void {
  const allowed = opts.kinds ? new Set(opts.kinds) : null;

  for (const region of regions) {
    if (allowed && !allowed.has(region.kind)) continue;
    const color = KIND_COLORS[region.kind] ?? 0xffffff;

    if (opts.mode === 'minimap') {
      if (region.kind === 'gate') {
        fillProjectedShape(gfx, region.shape, projection, color, 1);
      } else if (region.kind === 'block' || region.kind === 'damage') {
        fillProjectedShape(gfx, region.shape, projection, color, 0.12);
      }
      continue;
    }

    if (region.kind === 'gate') {
      fillProjectedShape(gfx, region.shape, projection, color, 0.88);
      continue;
    }

    const alpha =
      region.kind === 'leash' ? 0.35
      : region.kind === 'aggro' ? 0.5
      : region.kind === 'reach' ? 0.6
      : region.kind === 'body' ? 0.9
      : 0.85;
    const lineWidth =
      region.kind === 'body' ? 2
      : region.kind === 'reach' && region.ownerKind === 'player' ? 1.5
      : 1;

    strokeProjectedShape(gfx, region.shape, projection, color, alpha, lineWidth);
  }
}

export function minimapLayerProjection(
  screenWidth: number,
  screenHeight: number,
): LayerProjection {
  const mmX = screenWidth - MM_W - MM_PAD;
  const mmY = screenHeight - MM_H - MM_PAD;
  return minimapProjection(mmX, mmY, MM_W, MM_H, GAME_CONFIG.NODE_WIDTH, GAME_CONFIG.NODE_HEIGHT);
}

export function worldLayerProjection(): LayerProjection {
  return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
}

/** World-scene gate bars: glow from entity bounds, solid bar from collision regions. */
export function paintGateWorldMarkers(
  gfx: Phaser.GameObjects.Graphics,
  state: RenderState,
): void {
  ensureNodeGates(state);
  gfx.clear();

  const openRegions = openGateCollisionRegions(state);

  for (const gate of state.nodeGateEntities) {
    if (gate.sealed) continue;
    gfx.fillStyle(GATE_COLOR, 0.22);
    gfx.fillRect(
      gate.glowBounds.x,
      gate.glowBounds.y,
      gate.glowBounds.width,
      gate.glowBounds.height,
    );
  }

  paintCollisionLayer(gfx, openRegions, worldLayerProjection(), {
    mode: 'world',
    kinds: ['gate'],
  });
}

export function paintEntityDotsOnMinimap(
  gfx: Phaser.GameObjects.Graphics,
  state: RenderState,
  projection: LayerProjection,
): void {
  for (const id of state.ids) {
    const sprite = state.sprite.get(id);
    if (!sprite) continue;
    const kind = state.kind.get(id);
    if (kind !== 'monster' && kind !== 'player') continue;

    const drawPos = entityDrawNodePos(state, id);
    if (!drawPos) continue;

    const px = projection.offsetX + drawPos.x * projection.scaleX;
    const py = projection.offsetY + drawPos.y * projection.scaleY;
    const size = id === state.ownId ? 3 : 2;
    const color = id === state.ownId ? 0x44ff88 : kind === 'monster' ? 0xff4444 : 0x4488ff;
    gfx.fillStyle(color, 1);
    gfx.fillRect(px - size / 2, py - size / 2, size, size);
  }
}

export function tacticalKinds(): CollisionRegionKind[] {
  return ['block', 'damage', 'status', 'heal', 'body', 'aggro', 'leash', 'reach'];
}

export function minimapStaticKinds(): CollisionRegionKind[] {
  return ['gate', 'block', 'damage'];
}
