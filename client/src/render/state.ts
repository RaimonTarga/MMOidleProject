import type Phaser from 'phaser';
import type { PlayerSnapshot, MonsterSnapshot } from '@mmo-idle/shared';

export type NetworkId = string;

export interface RenderState {
  ids: Set<NetworkId>;
  kind: Map<NetworkId, 'player' | 'monster'>;
  snapshot: Map<NetworkId, PlayerSnapshot | MonsterSnapshot>;

  transform: Map<
    NetworkId,
    {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
    }
  >;

  interpolation: Map<
    NetworkId,
    {
      baseX: number;
      baseY: number;
      lungeOffsetX: number;
      lungeOffsetY: number;
    }
  >;

  sprite: Map<
    NetworkId,
    Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  >;
  shadow: Map<NetworkId, Phaser.GameObjects.Ellipse>;
  label: Map<NetworkId, Phaser.GameObjects.Text>;
  hpBar: Map<NetworkId, Phaser.GameObjects.Graphics>;
  cdBar: Map<NetworkId, Phaser.GameObjects.Graphics>;

  effectOverlays: Map<NetworkId, Map<string, Phaser.GameObjects.Sprite>>;

  spriteMeta: Map<
    NetworkId,
    {
      currentFrame: string | null;
      shadowOffsetY: number;
      shadowLevel?: number;
      barOffsetY: number;
      entityName?: string;
      monsterBehavior?: string;
      isOwn?: boolean;
    }
  >;

  debugRanges: Map<
    NetworkId,
    {
      pullRange?: number;
      leashRange?: number;
      attackRange?: number;
    }
  >;

  ownId: NetworkId | null;
  ownNodeId: string;
}

export function createRenderState(): RenderState {
  return {
    ids: new Set(),
    kind: new Map(),
    snapshot: new Map(),
    transform: new Map(),
    interpolation: new Map(),
    sprite: new Map(),
    shadow: new Map(),
    label: new Map(),
    hpBar: new Map(),
    cdBar: new Map(),
    effectOverlays: new Map(),
    spriteMeta: new Map(),
    debugRanges: new Map(),
    ownId: null,
    ownNodeId: '',
  };
}

export function getOwnSnapshot(state: RenderState): PlayerSnapshot | null {
  if (!state.ownId) return null;
  const s = state.snapshot.get(state.ownId);
  return s && state.kind.get(state.ownId) === 'player'
    ? (s as PlayerSnapshot)
    : null;
}
