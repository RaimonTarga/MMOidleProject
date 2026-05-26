import type Phaser from 'phaser';
import type { NetworkedEntity, PlayerView, MonsterView, Vec2 } from '@mmo-idle/shared';

export type NetworkId = string;

export interface RenderState {
  ids: Set<NetworkId>;
  kind: Map<NetworkId, 'player' | 'monster'>;
  entity: Map<NetworkId, NetworkedEntity>;
  view: Map<NetworkId, PlayerView | MonsterView>;

  transform: Map<
    NetworkId,
    {
      pos: Vec2;
      target: Vec2;
      speed: number;
    }
  >;

  interpolation: Map<
    NetworkId,
    {
      base: Vec2;
      lungeOffset: Vec2;
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
  hpBarCache: Map<
    NetworkId,
    {
      x: number;
      y: number;
      hpPct: number;
      shieldPct: number;
      shieldShown: boolean;
    }
  >;
  cdBarCache: Map<
    NetworkId,
    {
      x: number;
      y: number;
      bucket: number;
      hasTarget: boolean;
    }
  >;

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

  laserBeam: {
    graphics: Phaser.GameObjects.Graphics | null;
    targetId: string | null;
    until: number;
  };
  movementEffectNextAt: Map<string, number>;
  knownUnlockedRecipes: Set<string>;
  knownUnlockedRecipesInitialized: boolean;
  throttles: {
    minimapAt: number;
    effectOverlaysAt: number;
    debugClearedAt: number;
  };

  ownId: NetworkId | null;
  ownNodeId: string;
}

export function createRenderState(): RenderState {
  return {
    ids: new Set(),
    kind: new Map(),
    entity: new Map(),
    view: new Map(),
    transform: new Map(),
    interpolation: new Map(),
    sprite: new Map(),
    shadow: new Map(),
    label: new Map(),
    hpBar: new Map(),
    cdBar: new Map(),
    hpBarCache: new Map(),
    cdBarCache: new Map(),
    effectOverlays: new Map(),
    spriteMeta: new Map(),
    debugRanges: new Map(),
    laserBeam: {
      graphics: null,
      targetId: null,
      until: 0,
    },
    movementEffectNextAt: new Map(),
    knownUnlockedRecipes: new Set(),
    knownUnlockedRecipesInitialized: false,
    throttles: {
      minimapAt: 0,
      effectOverlaysAt: 0,
      debugClearedAt: 0,
    },
    ownId: null,
    ownNodeId: '',
  };
}

export function getOwnView(state: RenderState): PlayerView | null {
  if (!state.ownId) return null;
  const s = state.view.get(state.ownId);
  return s && state.kind.get(state.ownId) === 'player'
    ? (s as PlayerView)
    : null;
}
