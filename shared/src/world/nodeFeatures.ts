import { GAME_CONFIG } from "../config/gameConfig";

/** Axis-aligned or circular zone in world pixels (node-local coordinates). */
export type NodeFeatureShape =
  | { kind: "circle"; x: number; y: number; radius: number }
  | { kind: "ellipse"; x: number; y: number; halfW: number; halfH: number }
  | { kind: "rect"; x: number; y: number; halfW: number; halfH: number };

export type FeatureTarget = "player" | "monster";

export const DEFAULT_HITBOX_SCALE = 0.55;
export const DEFAULT_HITBOX_KIND: "rect" | "circle" = "rect";

export interface NodeFeatureSpec {
  id: string;
  /** Overlay center in node-local world px. */
  x: number;
  y: number;
  /** Footprint used for derived hitbox and client decor placement. */
  displayW: number;
  displayH: number;
  /** Option B: shrink transparent PNG padding (default DEFAULT_HITBOX_SCALE). */
  hitboxScale?: number;
  hitboxKind?: "rect" | "circle" | "ellipse";
  /** Vertical shrink for ellipse hitboxes (default 1). Only used when hitboxKind is ellipse. */
  hitboxHeightScale?: number;
  /** Option A: explicit shape wins over derived hitbox. */
  shape?: NodeFeatureShape;

  /** Per-target blocking. `['player']` blocks players (and player-side minions) only. */
  blocksMovement?: FeatureTarget[];
  /** While inside (or in contact band): refresh positional DoT (mitigation via dot-resistance). */
  damage?: {
    effectId: string;
    damagePerStack: number;
    tickIntervalMs: number;
    maxStacks: number;
    refreshMs: number;
    targets: FeatureTarget[];
    /** Apply when within this px of the shape edge, not only when fully inside. */
    contactBandPx?: number;
    /** Skip damage while this feature's movement block is suppressed. */
    requiresActiveBlock?: boolean;
    /** Only during an engaged ultimate encounter before the final stage. */
    preFinalStageOnly?: boolean;
  };
  /** While inside: refresh status (e.g. slow uses speedMult + totalMs in data). */
  statusWhileInside?: {
    effectId: string;
    data: Record<string, number>;
    refreshMs: number;
    targets: FeatureTarget[];
  };
  /** While inside: heal as a fraction of max HP per second. */
  healWhileInside?: {
    hpPctPerSec: number;
    targets: FeatureTarget[];
    /** When true, only encounter adds (not the boss or ambient mobs) heal. */
    encounterAddsOnly?: boolean;
  };
  spawns?: {
    monsterTypeId: string;
    intervalMs: number;
    maxAlive: number;
    count?: number;
    requiresPlayerInNode?: boolean;
  };
}

export type ResolvedNodeFeature = NodeFeatureSpec & { shape: NodeFeatureShape };

/** Shared id for the clearing rune altar feature (client decor + server gating). */
export const RUNE_ALTAR_FEATURE_ID = "rune_altar";

export function resolveFeatureShape(spec: NodeFeatureSpec): NodeFeatureShape {
  if (spec.shape) return spec.shape;
  const scale = spec.hitboxScale ?? DEFAULT_HITBOX_SCALE;
  const halfW = (spec.displayW * scale) / 2;
  const halfH = (spec.displayH * scale) / 2;
  if (spec.hitboxKind === "circle") {
    return {
      kind: "circle",
      x: spec.x,
      y: spec.y,
      radius: Math.min(halfW, halfH),
    };
  }
  if (spec.hitboxKind === "ellipse") {
    const heightScale = spec.hitboxHeightScale ?? 1;
    return {
      kind: "ellipse",
      x: spec.x,
      y: spec.y,
      halfW,
      halfH: halfH * heightScale,
    };
  }
  return { kind: "rect", x: spec.x, y: spec.y, halfW, halfH };
}

function buildResolvedNodeFeatures(): Record<string, ResolvedNodeFeature[]> {
  return Object.fromEntries(
    Object.entries(NODE_FEATURES).map(([nodeId, specs]) => [
      nodeId,
      specs.map((s) => ({ ...s, shape: resolveFeatureShape(s) })),
    ]),
  );
}

/** Per-node static hazards and obstacles. */
export const NODE_FEATURES: Record<string, NodeFeatureSpec[]> = {
  // Clearing (T0). Rune altar centerpiece, just north of the player spawn point
  // (node center). Non-blocking on purpose — its hitbox exists only so future
  // interaction logic can detect a player standing at the altar.
  "node-5-5": [
    {
      id: RUNE_ALTAR_FEATURE_ID,
      x: GAME_CONFIG.NODE_WIDTH / 2,
      y: GAME_CONFIG.NODE_HEIGHT / 2 - 320,
      displayW: 560,
      displayH: 560,
      hitboxScale: 0.7,
      hitboxKind: "ellipse",
      hitboxHeightScale: 0.62,
      // No `blocksMovement`: players (and minions) can walk through it freely.
    },
  ],
  "node-9-0": [
    {
      id: "abyssal_throne",
      x: GAME_CONFIG.NODE_WIDTH / 2,
      y: GAME_CONFIG.NODE_HEIGHT / 2,
      displayW: 1440,
      displayH: 1440,
      hitboxScale: 0.78,
      hitboxKind: "ellipse",
      hitboxHeightScale: 0.91,
      blocksMovement: ["player"],
      damage: {
        effectId: "void-throne",
        damagePerStack: 1,
        tickIntervalMs: 2000,
        maxStacks: 1,
        refreshMs: 5000,
        targets: ["player"],
        contactBandPx: 48,
        requiresActiveBlock: true,
        preFinalStageOnly: true,
      },
      healWhileInside: {
        hpPctPerSec: 0.05,
        targets: ["monster"],
        encounterAddsOnly: true,
      },
    },
  ],
};

export const RESOLVED_NODE_FEATURES = buildResolvedNodeFeatures();
