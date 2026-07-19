import type Phaser from "phaser";
import type {
  NetworkedEntity,
  NodeGateEntity,
  PlayerView,
  MonsterView,
  MinionView,
  VoidOverlordRespawnState,
  Vec2,
  DamageElement,
} from "@mmo-idle/shared";

export type NetworkId = string;

/**
 * Per-snapshot styling hint for a monster's HP-delta damage number, derived from
 * that snapshot's combat events (empowered/execution from player-hit, element from
 * dot-tick). The amount shown is still the HP delta; this only picks color/size/glyph.
 */
export interface DamageNumberHint {
  hasDirectHit: boolean;
  empowered: boolean;
  execution: boolean;
  dotElement?: DamageElement;
  /** Total shield HP absorbed this snapshot — rendered as a separate blue number. */
  shieldAbsorbed?: number;
  /** A hit was partially evaded (glancing) — restyles the HP-delta number. */
  evadedPartial?: boolean;
  /** A hit tripped the damage cap — restyles the HP-delta number. */
  capped?: boolean;
}

export interface RenderState {
  ids: Set<NetworkId>;
  kind: Map<NetworkId, "player" | "monster" | "minion">;
  entity: Map<NetworkId, NetworkedEntity>;
  view: Map<NetworkId, PlayerView | MonsterView | MinionView>;

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
    | Phaser.GameObjects.Image
    | Phaser.GameObjects.Rectangle
    | Phaser.GameObjects.Sprite
  >;
  shadow: Map<NetworkId, Phaser.GameObjects.Ellipse>;
  label: Map<NetworkId, Phaser.GameObjects.Text>;
  hpBar: Map<NetworkId, Phaser.GameObjects.Graphics>;
  cdBar: Map<NetworkId, Phaser.GameObjects.Graphics>;
  /** Monster charged-attack wind-up: the skill-name label (the bar reuses the
   *  cooldown bar, tinted red) + the cast timing, keyed by monster id. */
  castLabel: Map<NetworkId, Phaser.GameObjects.Text>;
  castState: Map<NetworkId, { startedAt: number; castMs: number; label: string }>;
  /** Player skill-name callout (Technique armed / Guard fired), keyed by player id.
   *  Pops in, lingers, then drifts up + fades (see skillCallouts.ts). */
  skillCallout: Map<
    NetworkId,
    { label: Phaser.GameObjects.Text; expiresAt: number; driftY: number }
  >;
  /** Players with a Technique armed for their next attack — tints their cooldown
   *  bar red until the consuming hit's ability client-effect tag clears it. */
  techniqueArmed: Map<NetworkId, { abilityId: string; armedAt: number }>;
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
      show: boolean;
      casting: boolean;
      armed: boolean;
    }
  >;

  effectOverlays: Map<NetworkId, Map<string, Phaser.GameObjects.Sprite>>;

  /** Auto-combat "next action" thought bubble above each player's head. */
  thoughtBubble: Map<
    NetworkId,
    {
      container: Phaser.GameObjects.Container;
      icon:
        | Phaser.GameObjects.Image
        | Phaser.GameObjects.Sprite
        | Phaser.GameObjects.Text
        | null;
      signature: string | null;
      visible: boolean;
    }
  >;

  spriteMeta: Map<
    NetworkId,
    {
      currentFrame: string | null;
      textureKey?: string;
      shadowLevel?: number;
      barOffsetY: number;
      entityName?: string;
      monsterBehavior?: string;
      monsterIsRanged?: boolean;
      isOwn?: boolean;
      /** Skip atlas frame refresh on patch (void-overlord sheet sprites). */
      skipFrameRefresh?: boolean;
      /** True when sprite is a Phaser Sprite with a running animation. */
      isAnimated?: boolean;
      /** Client-only render nudge (negative Y = up). Logical pos unchanged. */
      visualOffsetY?: number;
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
  /** Devout Priest channeled holy beam (see client/src/fx/holyBeam.ts). */
  holyBeam: {
    graphics: Phaser.GameObjects.Graphics | null;
    targetId: string | null;
    until: number;
  };
  /** Cannoneer charge-up ring on the own player (see client/src/fx/cannonFx.ts). */
  cannonCharge: {
    graphics: Phaser.GameObjects.Graphics | null;
  };
  /** Red ground ring under the own player's attack target (see render/targetIndicator.ts). */
  targetIndicator: {
    graphics: Phaser.GameObjects.Graphics | null;
  };
  /** Per-player transformation aura glow graphics (see client/src/fx/aura.ts). */
  auras: Map<string, Phaser.GameObjects.Graphics>;
  /** Per-player identity accent overlays (see client/src/fx/identityAccent.ts). */
  identityAccents: Map<string, Phaser.GameObjects.Image>;
  voidOverlordRespawn: {
    payload: VoidOverlordRespawnState;
    deadlineMs: number;
    sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
    lastText: string;
  } | null;
  /** True after the Void Overlord dies until a new one spawns (client prediction). */
  voidThroneHazardLifted: boolean;
  movementEffectNextAt: Map<string, number>;
  ledgeHopNextAt: Map<string, number>;
  knownUnlockedRecipes: Set<string>;
  knownUnlockedRecipesInitialized: boolean;
  gameplaySettingsSynced: boolean;
  throttles: {
    minimapAt: number;
    effectOverlaysAt: number;
    debugClearedAt: number;
  };

  ownId: NetworkId | null;
  ownNodeId: string;
  /** Client-only A* waypoints for own-player click-to-move prediction. */
  ownPathWaypoints: Vec2[];
  ownPathGoal: Vec2 | null;
  /** Gate entities for the current node; collision + world markers derive from these. */
  nodeGateEntities: NodeGateEntity[];
  lastSpawnedGateNodeId: string;

  /** Transient per-snapshot damage-number style hints (built in applyDelta). */
  damageStyleHints: Map<NetworkId, DamageNumberHint>;
  /** Monster ids currently presented as dungeon guardians. */
  dungeonGuardianIds: Set<NetworkId>;
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
    castLabel: new Map(),
    castState: new Map(),
    skillCallout: new Map(),
    techniqueArmed: new Map(),
    hpBarCache: new Map(),
    cdBarCache: new Map(),
    effectOverlays: new Map(),
    thoughtBubble: new Map(),
    spriteMeta: new Map(),
    debugRanges: new Map(),
    laserBeam: {
      graphics: null,
      targetId: null,
      until: 0,
    },
    holyBeam: {
      graphics: null,
      targetId: null,
      until: 0,
    },
    cannonCharge: {
      graphics: null,
    },
    targetIndicator: {
      graphics: null,
    },
    auras: new Map(),
    identityAccents: new Map(),
    voidOverlordRespawn: null,
    voidThroneHazardLifted: false,
    movementEffectNextAt: new Map(),
    ledgeHopNextAt: new Map(),
    knownUnlockedRecipes: new Set(),
    knownUnlockedRecipesInitialized: false,
    gameplaySettingsSynced: false,
    throttles: {
      minimapAt: 0,
      effectOverlaysAt: 0,
      debugClearedAt: 0,
    },
    ownId: null,
    ownNodeId: "",
    ownPathWaypoints: [],
    ownPathGoal: null,
    nodeGateEntities: [],
    lastSpawnedGateNodeId: "",
    damageStyleHints: new Map(),
    dungeonGuardianIds: new Set(),
  };
}

export function getOwnView(state: RenderState): PlayerView | null {
  if (!state.ownId) return null;
  const s = state.view.get(state.ownId);
  return s && state.kind.get(state.ownId) === "player"
    ? (s as PlayerView)
    : null;
}
