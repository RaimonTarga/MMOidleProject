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
    /**
     * Override the spawned monster's `pullRange` (detection radius). Used by the
     * Jungle dense-bush ambush: bush mobs spawn DORMANT with a small pull range so
     * they only wake when the player steps into the thicket (the ambush), rather
     * than charging across the node. When the spawn type is a pack alpha, the whole
     * pack spawns clustered (one synchronized pounce via call-allies).
     */
    pullRange?: number;
  };
  /**
   * Volcanic "ambient heat" — a NODE-WIDE escalating burn (the shape is ignored;
   * it is not positional). While a player is in this node AND in combat, heat
   * stacks ramp every `rampMs` up to `maxStacks`; each stack adds `perStackDamage`
   * to a burn ticking every `tickIntervalMs` (mitigated by dot-resistance + DR like
   * a lava vent). Out of combat (or after leaving the node) the heat decays at the
   * same cadence. The soft timer: BURST the fight or OUT-REGEN the rising heat —
   * the in-combat-regen answer is the only build that beats "the room cooks you".
   */
  ambientHeat?: {
    effectId: string;
    perStackDamage: number;
    maxStacks: number;
    rampMs: number;
    tickIntervalMs: number;
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

/**
 * Swamp "rot pool": a non-blocking ambient hazard zone. Walking through poisons
 * (DoT mitigated by the player's dot-resistance — the Swamp counter) and slows.
 * Targets players only, so mobs wade their own marsh freely and random spawns are
 * never affected. Placeholder values — user balance pass.
 */
function rotPool(id: string, x: number, y: number, radius: number): NodeFeatureSpec {
  return {
    id,
    x,
    y,
    displayW: radius * 2,
    displayH: radius * 2,
    shape: { kind: "circle", x, y, radius },
    damage: {
      effectId: "swamp-rot",
      damagePerStack: 3,
      tickIntervalMs: 1000,
      maxStacks: 4,
      refreshMs: 1000,
      targets: ["player"],
      contactBandPx: 40,
    },
    statusWhileInside: {
      effectId: "slow",
      data: { speedMult: 0.6, totalMs: 1200 },
      refreshMs: 1200,
      targets: ["player"],
    },
  };
}

/**
 * Jungle "dense bush": a non-blocking overgrowth thicket. Walking through SLOWS the
 * player (players-only, like the Swamp rot pool — mobs move through their own bush
 * freely) and conceals a dormant ambush. When `ambushPackAlpha` is set, the bush is
 * also a capped spawner: it seeds a small dormant pack (low `pullRange`) inside the
 * thicket that only wakes — and pounces — when the player steps in. `maxAlive` caps
 * how many bush mobs can be hidden at once (so the node never fills with ambushers).
 * Placeholder toxic-green fill renders until real foliage sprites (add NODE_DECOR).
 * Placeholder values — user balance pass (Step 15).
 */
function denseBush(
  id: string,
  x: number,
  y: number,
  radius: number,
  ambush?: { packAlpha: string; maxAlive: number; intervalMs: number; pullRange: number },
): NodeFeatureSpec {
  return {
    id,
    x,
    y,
    displayW: radius * 2,
    displayH: radius * 2,
    shape: { kind: "circle", x, y, radius },
    statusWhileInside: {
      effectId: "slow",
      data: { speedMult: 0.55, totalMs: 1000 },
      refreshMs: 1000,
      targets: ["player"],
    },
    ...(ambush
      ? {
          spawns: {
            monsterTypeId: ambush.packAlpha,
            intervalMs: ambush.intervalMs,
            maxAlive: ambush.maxAlive,
            count: 1,
            requiresPlayerInNode: true,
            pullRange: ambush.pullRange,
          },
        }
      : {}),
  };
}

/**
 * Volcanic "lava vent": a non-blocking positional fire hazard (rot-pool sibling).
 * Standing on it burns (DoT mitigated by the player's dot-resistance, same as rot);
 * targets players only so the fire swarm wades its own caldera freely. You weave the
 * vents while a ramping swarm chases and the room heats up. Placeholder values.
 */
function lavaVent(id: string, x: number, y: number, radius: number): NodeFeatureSpec {
  return {
    id,
    x,
    y,
    displayW: radius * 2,
    displayH: radius * 2,
    shape: { kind: "circle", x, y, radius },
    damage: {
      effectId: "lava-burn",
      damagePerStack: 5,
      tickIntervalMs: 1000,
      maxStacks: 4,
      refreshMs: 1000,
      targets: ["player"],
      contactBandPx: 40,
    },
  };
}

/**
 * Volcanic "heat" emitter: a node-wide ambient escalating burn (the soft timer).
 * Invisible + non-positional (the shape is a formality — the system applies it to
 * every player in the node, gated on in-combat). One per volcanic node. Placeholder
 * values — user balance pass (Step 15).
 */
function volcanicHeat(id: string): NodeFeatureSpec {
  const cx = GAME_CONFIG.NODE_WIDTH / 2;
  const cy = GAME_CONFIG.NODE_HEIGHT / 2;
  return {
    id,
    x: cx,
    y: cy,
    displayW: 0,
    displayH: 0,
    shape: { kind: "circle", x: cx, y: cy, radius: 1 },
    ambientHeat: {
      effectId: "volcanic-heat",
      perStackDamage: 4,
      maxStacks: 6,
      rampMs: 3000,
      tickIntervalMs: 1000,
    },
  };
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
  // MOUNTAIN T1 (node-4-4) — "guarded ascent" template. Two rock walls flank a
  // central pass the player must thread (sentinels hold the gap). Blocks PLAYERS
  // only: monsters ignore it (so random spawns never wedge in a wall and patrols
  // never stall), while the player's approach is funneled. Placeholder gray fills
  // render until real mountain rock sprites replace them (add a NODE_DECOR entry).
  // Passability: the perimeter ring is fully open (walls span only the middle band),
  // so all four edges stay connected — verified via findPathForMover.
  "node-4-4": [
    {
      id: "mountain_pass_west",
      x: 1300,
      y: 1200,
      displayW: 340,
      displayH: 860,
      shape: { kind: "rect", x: 1300, y: 1200, halfW: 170, halfH: 430 },
      blocksMovement: ["player"],
    },
    {
      id: "mountain_pass_east",
      x: 1900,
      y: 1200,
      displayW: 340,
      displayH: 860,
      shape: { kind: "rect", x: 1900, y: 1200, halfW: 170, halfH: 430 },
      blocksMovement: ["player"],
    },
  ],
  // SWAMP T1 (node-6-6) — "attrition terrain": ambient rot pools scattered with
  // clear lanes between them. Hazard-aware movement (weaving the gaps) is the read;
  // dot-resistance / cleanse / regen is the build answer. Non-blocking → no
  // passability concern. Placeholder toxic-green fills until real rot-pool sprites.
  "node-6-6": [
    rotPool("rot_pool_a", 820, 720, 300),
    rotPool("rot_pool_b", 2350, 760, 280),
    rotPool("rot_pool_c", 1500, 1650, 320),
    rotPool("rot_pool_d", 2420, 1800, 280),
  ],
  // SWAMP T1 dungeon (node-7-4, Grave Toadeater) — the boss exam is a hazard field:
  // pools ring the arena (center left clear for the boss), so "survive the rot"
  // pressures positioning during the fight too.
  "node-7-4": [
    rotPool("boss_rot_a", 900, 800, 280),
    rotPool("boss_rot_b", 2300, 900, 280),
    rotPool("boss_rot_c", 1600, 1780, 300),
  ],
  // JUNGLE T2 (node-3-7, node-3-8) — "ambush ecology": dense overgrowth thickets
  // that slow the player AND conceal a dormant hunting pack (jungle-ape + 2 snakes,
  // call-allies linked). The pack only wakes — and pounces (openingStrike) — when
  // the player steps into the thicket; `maxAlive` caps hidden bush mobs so the node
  // never fills with ambushers. Open lanes between bushes are the safe read; evasion
  // + hardening is the build answer. Non-blocking → no passability concern.
  // Placeholder toxic-green fills until real foliage sprites (add NODE_DECOR).
  "node-3-7": [
    denseBush("jungle_bush_a", 820, 720, 300, { packAlpha: "jungle-ape", maxAlive: 3, intervalMs: 12000, pullRange: 150 }),
    denseBush("jungle_bush_b", 2360, 780, 280),
    denseBush("jungle_bush_c", 1600, 1720, 320, { packAlpha: "jungle-ape", maxAlive: 3, intervalMs: 12000, pullRange: 150 }),
    denseBush("jungle_bush_d", 2420, 1800, 260),
  ],
  "node-3-8": [
    denseBush("jungle_bush_a", 760, 800, 300, { packAlpha: "jungle-ape", maxAlive: 3, intervalMs: 12000, pullRange: 150 }),
    denseBush("jungle_bush_b", 2300, 1640, 300, { packAlpha: "jungle-ape", maxAlive: 3, intervalMs: 12000, pullRange: 150 }),
    denseBush("jungle_bush_c", 1500, 760, 260),
  ],
  // JUNGLE T2 dungeon (node-2-8, Jungle Dread-Gorger) — the boss exam adds an ambush
  // layer: thickets ring the arena (center clear for the boss) so the pack adds the
  // boss summons can melt into cover and the "survive the ambush" pressure persists.
  "node-2-8": [
    denseBush("boss_bush_a", 900, 820, 280),
    denseBush("boss_bush_b", 2300, 900, 280),
    denseBush("boss_bush_c", 1640, 1760, 300),
  ],
  // VOLCANIC T3 (node-7-8, node-8-8) — "escalating heat": a node-wide ambient burn
  // (the soft timer — ramps while you fight, decays when you disengage/leave) layered
  // over scattered lava vents (positional fire DoT). You weave the vents while a
  // ramping fire swarm chases AND the room cooks — burst it fast or out-regen the
  // heat (the in-combat-regen answer). Non-blocking → no passability concern.
  "node-7-8": [
    volcanicHeat("volcanic_heat"),
    lavaVent("lava_vent_a", 820, 720, 280),
    lavaVent("lava_vent_b", 2360, 820, 260),
    lavaVent("lava_vent_c", 1560, 1700, 300),
    lavaVent("lava_vent_d", 2440, 1780, 240),
  ],
  "node-8-8": [
    volcanicHeat("volcanic_heat"),
    lavaVent("lava_vent_a", 760, 840, 280),
    lavaVent("lava_vent_b", 2300, 1640, 280),
    lavaVent("lava_vent_c", 1520, 760, 240),
  ],
  // VOLCANIC T3 dungeon (node-8-9, Cinder-Shell Magma-Salamander) + T4 dungeon
  // (node-10-10, Caldera Sovereign) — the heat soft-timer becomes the boss exam: the
  // arena cooks during the fight (vents ring the edges, center clear for the boss), so
  // a slow attrition kill out-paces your regen unless you bring the in-combat-regen answer.
  "node-8-9": [
    volcanicHeat("volcanic_heat"),
    lavaVent("boss_vent_a", 900, 800, 260),
    lavaVent("boss_vent_b", 2300, 880, 260),
    lavaVent("boss_vent_c", 1620, 1760, 280),
  ],
  "node-10-10": [
    volcanicHeat("volcanic_heat"),
    lavaVent("boss_vent_a", 880, 820, 280),
    lavaVent("boss_vent_b", 2320, 900, 280),
    lavaVent("boss_vent_c", 1600, 1780, 300),
  ],
  "node-10-0": [
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
