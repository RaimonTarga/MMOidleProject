import { GAME_CONFIG } from "../config/gameConfig";
import { pointInNodeFeatureShape, type Vec2 } from "../systems/spatial";
import { WORLD_NODE_LIST } from "./map/registry";

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
  /**
   * While inside: multiply every monster's detection radius against this entity
   * (jungle thicket). Read straight off the feature by `detectionMultForPoint`
   * rather than carried on a status effect — `applyStatusEffect` refreshes an
   * existing effect's duration but NEVER replaces its `data`, so a bush that
   * piggybacked on the shared 'slow' id would silently do nothing whenever any
   * other slow happened to land first. Terrain-derived, so it cannot desync.
   */
  detectionMultWhileInside?: number;
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

/** Shared id for the Clearing/sanctuary rune altar (client decor + server gating). */
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
function rotPool(
  id: string,
  x: number,
  y: number,
  radius: number,
  damagePerStack = 1,
): NodeFeatureSpec {
  return {
    id,
    x,
    y,
    displayW: radius * 2,
    displayH: radius * 2,
    shape: { kind: "circle", x, y, radius },
    damage: {
      effectId: "swamp-rot",
      damagePerStack,
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
 * freely) and, crucially, BROADCASTS them: every monster's detection radius is
 * multiplied while the player stands inside.
 *
 * That radius IS the mechanic. The thicket used to also seed a dormant ambush pack
 * with a deliberately short `pullRange` (150) — below the entire jungle roster's
 * 240–290 — which meant the hidden mobs noticed you LATER than an ordinary mob
 * standing in the open, and the ambush read as dead in playtest. The spawner is gone;
 * `jungle-ape` still populates the node through the normal pool (it is in
 * `monsterPoolByTier`, and `ensurePopulation` spawns its pack via `spawnPack`).
 *
 * The multiplier is a FEATURE field, not status data. Riding the shared 'slow'
 * status looked cheaper, but `applyStatusEffect` only refreshes an existing effect's
 * duration and never replaces its `data` — so any other slow landing first would have
 * left the thicket silently inert. Reading terrain directly cannot desync.
 *
 * Values are placeholders — user balance pass.
 */

/**
 * How far a thicket throws the player's position. Jungle pull ranges run 240–290, so
 * 2x puts effective detection at 480–580px — well outside the 300px bush radius, so
 * mobs standing in the open pull the moment the player enters cover.
 */
const BUSH_DETECTION_MULT = 2;

function denseBush(
  id: string,
  x: number,
  y: number,
  radius: number,
): NodeFeatureSpec {
  return {
    id,
    x,
    y,
    displayW: radius * 2,
    displayH: radius * 2,
    shape: { kind: "circle", x, y, radius },
    detectionMultWhileInside: BUSH_DETECTION_MULT,
    statusWhileInside: {
      effectId: "slow",
      data: { speedMult: 0.55, totalMs: 1000 },
      refreshMs: 1000,
      targets: ["player"],
    },
  };
}

function rockLedge(
  id: string,
  x: number,
  y: number,
  halfW: number,
  halfH: number,
): NodeFeatureSpec {
  return {
    id,
    x,
    y,
    displayW: halfW * 2,
    displayH: halfH * 2,
    shape: { kind: "rect", x, y, halfW, halfH },
    blocksMovement: ["player", "monster"],
  };
}

const MOUNTAIN_OUTER_LEFT = 430;
const MOUNTAIN_OUTER_RIGHT = GAME_CONFIG.NODE_WIDTH - MOUNTAIN_OUTER_LEFT;
const MOUNTAIN_OUTER_TOP = 280;
const MOUNTAIN_OUTER_BOTTOM = GAME_CONFIG.NODE_HEIGHT - MOUNTAIN_OUTER_TOP;
const MOUNTAIN_INNER_LEFT = 900;
const MOUNTAIN_INNER_RIGHT = GAME_CONFIG.NODE_WIDTH - MOUNTAIN_INNER_LEFT;
const MOUNTAIN_INNER_TOP = 650;
const MOUNTAIN_INNER_BOTTOM = GAME_CONFIG.NODE_HEIGHT - MOUNTAIN_INNER_TOP;
/**
 * The procedural ledge renderer no longer relies on Wang-grid coverage, so the
 * collision band can hug the visible cliff face instead of reserving a broad
 * invisible strip on both sides. Two nav cells remain enough for robust walls.
 */
export const MOUNTAIN_LEDGE_THICKNESS = 64;
/** Hold posts keep the same clearance from the rock face across thickness changes. */
const MOUNTAIN_LEDGE_HOLD_OFFSET = MOUNTAIN_LEDGE_THICKNESS / 2 + 38;
const MOUNTAIN_SIDE_ENTRANCE_FRAC = 0.24;
const MOUNTAIN_CORNER_ENTRANCE_FRAC = 0.16;

type MountainEntrance =
  | "north"
  | "south"
  | "west"
  | "east"
  | "northWest"
  | "northEast"
  | "southWest"
  | "southEast";

interface MountainLedgeVariant {
  entrances: MountainEntrance[];
  wobble: number;
}

const MOUNTAIN_LEDGE_VARIANTS: MountainLedgeVariant[] = [
  { entrances: ["north", "southEast", "west"], wobble: 0 },
  { entrances: ["northWest", "east", "south", "west"], wobble: 1 },
  { entrances: ["northEast", "southWest", "east"], wobble: 2 },
  { entrances: ["north", "south", "northWest", "east", "southEast"], wobble: 3 },
  { entrances: ["west", "northEast", "south", "east"], wobble: 4 },
  { entrances: ["northWest", "northEast", "southWest", "southEast", "east", "west"], wobble: 5 },
];

export const MOUNTAIN_NODE_LEDGE_VARIANTS: Record<string, number> =
  Object.fromEntries(
    WORLD_NODE_LIST
      .filter((node) => node.biomeGroup === "mountain")
      .map((node) => [node.id, node.featureVariant ?? 0]),
  );

function mountainVariant(variantIndex: number): MountainLedgeVariant {
  return MOUNTAIN_LEDGE_VARIANTS[
    ((variantIndex % MOUNTAIN_LEDGE_VARIANTS.length) + MOUNTAIN_LEDGE_VARIANTS.length) %
      MOUNTAIN_LEDGE_VARIANTS.length
  ];
}

function mountainChokepointsForVariant(variantIndex: number): Vec2[] {
  const variant = mountainVariant(variantIndex);
  return variant.entrances.flatMap((entrance) => [
    mountainEntrancePoint(entrance, "outer", variant.wobble),
    mountainEntrancePoint(entrance, "inner", variant.wobble),
  ]);
}

export function mountainChokepointsForNode(nodeId: string): Vec2[] {
  const variantIndex = MOUNTAIN_NODE_LEDGE_VARIANTS[nodeId];
  return variantIndex === undefined ? [] : mountainChokepointsForVariant(variantIndex);
}

export function mountainLedgeHoldPointsForNode(nodeId: string): Vec2[] {
  if (MOUNTAIN_NODE_LEDGE_VARIANTS[nodeId] === undefined) return [];
  const off = MOUNTAIN_LEDGE_HOLD_OFFSET;
  return [
    { x: GAME_CONFIG.NODE_WIDTH / 2, y: MOUNTAIN_OUTER_TOP + off },
    { x: GAME_CONFIG.NODE_WIDTH / 2, y: MOUNTAIN_OUTER_BOTTOM - off },
    { x: MOUNTAIN_OUTER_LEFT + off, y: GAME_CONFIG.NODE_HEIGHT / 2 },
    { x: MOUNTAIN_OUTER_RIGHT - off, y: GAME_CONFIG.NODE_HEIGHT / 2 },
    { x: GAME_CONFIG.NODE_WIDTH / 2, y: MOUNTAIN_INNER_TOP - off },
    { x: GAME_CONFIG.NODE_WIDTH / 2, y: MOUNTAIN_INNER_BOTTOM + off },
    { x: MOUNTAIN_INNER_LEFT - off, y: GAME_CONFIG.NODE_HEIGHT / 2 },
    { x: MOUNTAIN_INNER_RIGHT + off, y: GAME_CONFIG.NODE_HEIGHT / 2 },
  ];
}

export function mountainLedgePatrolForPost(post: Vec2): Vec2[] {
  const off = MOUNTAIN_LEDGE_HOLD_OFFSET;
  const nearHorizontal =
    Math.abs(post.y - (MOUNTAIN_OUTER_TOP + off)) < 4 ||
    Math.abs(post.y - (MOUNTAIN_OUTER_BOTTOM - off)) < 4 ||
    Math.abs(post.y - (MOUNTAIN_INNER_TOP - off)) < 4 ||
    Math.abs(post.y - (MOUNTAIN_INNER_BOTTOM + off)) < 4;
  const span = 190;
  return nearHorizontal
    ? [
        { x: post.x - span, y: post.y },
        { x: post.x + span, y: post.y },
      ]
    : [
        { x: post.x, y: post.y - span },
        { x: post.x, y: post.y + span },
      ];
}

export function mountainLedgeFeatureIdsForNode(nodeId: string): Set<string> {
  return new Set(
    (RESOLVED_NODE_FEATURES[nodeId] ?? [])
      .filter((feature) => feature.id.startsWith("mountain_"))
      .map((feature) => feature.id),
  );
}

function mountainLedgeRings(prefix = "mountain_ledge", variantIndex = 0): NodeFeatureSpec[] {
  const variant = mountainVariant(variantIndex);
  return [
    ...mountainRingSegments(prefix, "outer", variant.entrances, variant.wobble),
    ...mountainRingSegments(prefix, "inner", variant.entrances, variant.wobble),
  ];
}

function mountainEntrancePoint(
  entrance: MountainEntrance,
  ring: "outer" | "inner",
  wobble: number,
): Vec2 {
  const b = mountainRingBounds(ring);
  const inset = ring === "outer" ? 118 : 92;
  const dx = (wobble % 3 - 1) * 18;
  const dy = ((wobble + 1) % 3 - 1) * 18;
  const innerOffset = ring === "inner" ? 260 + wobble * 12 : 0;
  switch (entrance) {
    case "north":
      return { x: (b.left + b.right) / 2 + dx + innerOffset, y: b.top + inset };
    case "south":
      return { x: (b.left + b.right) / 2 - dx - innerOffset, y: b.bottom - inset };
    case "west":
      return { x: b.left + inset, y: (b.top + b.bottom) / 2 + dy - innerOffset };
    case "east":
      return { x: b.right - inset, y: (b.top + b.bottom) / 2 - dy + innerOffset };
    case "northWest":
      return { x: b.left + inset + innerOffset * 0.45, y: b.top + inset + innerOffset * 0.25 };
    case "northEast":
      return { x: b.right - inset - innerOffset * 0.45, y: b.top + inset + innerOffset * 0.25 };
    case "southWest":
      return { x: b.left + inset + innerOffset * 0.45, y: b.bottom - inset - innerOffset * 0.25 };
    case "southEast":
      return { x: b.right - inset - innerOffset * 0.45, y: b.bottom - inset - innerOffset * 0.25 };
  }
}

function mountainRingBounds(ring: "outer" | "inner"): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  return ring === "outer"
    ? {
        left: MOUNTAIN_OUTER_LEFT,
        right: MOUNTAIN_OUTER_RIGHT,
        top: MOUNTAIN_OUTER_TOP,
        bottom: MOUNTAIN_OUTER_BOTTOM,
      }
    : {
        left: MOUNTAIN_INNER_LEFT,
        right: MOUNTAIN_INNER_RIGHT,
        top: MOUNTAIN_INNER_TOP,
        bottom: MOUNTAIN_INNER_BOTTOM,
      };
}

function mountainRingSegments(
  prefix: string,
  ring: "outer" | "inner",
  entrances: MountainEntrance[],
  wobble: number,
): NodeFeatureSpec[] {
  const b = mountainRingBounds(ring);
  const t = MOUNTAIN_LEDGE_THICKNESS;
  const gaps = mountainRingGaps(entrances);
  const segments: NodeFeatureSpec[] = [];
  let idx = 0;
  for (const [side, length] of [
    ["north", b.right - b.left],
    ["south", b.right - b.left],
    ["west", b.bottom - b.top],
    ["east", b.bottom - b.top],
  ] as const) {
    for (const [a, z] of carveIntervals(gaps[side] ?? [])) {
      if (z - a < 0.08) continue;
      const center = ((a + z) / 2) * length;
      const half = ((z - a) * length) / 2;
      const nudge = (((idx + wobble) % 3) - 1) * 10;
      if (side === "north" || side === "south") {
        const y = side === "north" ? b.top + nudge : b.bottom - nudge;
        segments.push(rockLedge(
          `${prefix}_${ring}_${side}_${idx}`,
          b.left + center,
          y,
          half,
          t / 2,
        ));
      } else {
        const x = side === "west" ? b.left + nudge : b.right - nudge;
        segments.push(rockLedge(
          `${prefix}_${ring}_${side}_${idx}`,
          x,
          b.top + center,
          t / 2,
          half,
        ));
      }
      idx++;
    }
  }
  return segments;
}

function mountainRingGaps(
  entrances: MountainEntrance[],
): Record<"north" | "south" | "west" | "east", Array<[number, number]>> {
  const gaps: Record<"north" | "south" | "west" | "east", Array<[number, number]>> = {
    north: [],
    south: [],
    west: [],
    east: [],
  };
  const add = (side: keyof typeof gaps, center: number, size: number): void => {
    gaps[side].push([Math.max(0, center - size / 2), Math.min(1, center + size / 2)]);
  };
  for (const entrance of entrances) {
    switch (entrance) {
      case "north":
        add("north", 0.5, MOUNTAIN_SIDE_ENTRANCE_FRAC);
        break;
      case "south":
        add("south", 0.5, MOUNTAIN_SIDE_ENTRANCE_FRAC);
        break;
      case "west":
        add("west", 0.5, MOUNTAIN_SIDE_ENTRANCE_FRAC);
        break;
      case "east":
        add("east", 0.5, MOUNTAIN_SIDE_ENTRANCE_FRAC);
        break;
      case "northWest":
        add("north", 0.08, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        add("west", 0.08, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        break;
      case "northEast":
        add("north", 0.92, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        add("east", 0.08, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        break;
      case "southWest":
        add("south", 0.08, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        add("west", 0.92, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        break;
      case "southEast":
        add("south", 0.92, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        add("east", 0.92, MOUNTAIN_CORNER_ENTRANCE_FRAC);
        break;
    }
  }
  return gaps;
}

function carveIntervals(gaps: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  const out: Array<[number, number]> = [];
  let cursor = 0;
  for (const [a, z] of sorted) {
    if (a > cursor) out.push([cursor, a]);
    cursor = Math.max(cursor, z);
  }
  if (cursor < 1) out.push([cursor, 1]);
  return out;
}
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
const LEGACY_NODE_FEATURE_TEMPLATES: Record<string, NodeFeatureSpec[]> = {
  // Clearing/sanctuary rune altar, just north of the player spawn point (node
  // center). Non-blocking: its shape is the passive-reset interaction area.
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
  // MOUNTAIN - "guarded ascent": two broken ledge rings. Ledges block players and
  // monsters for movement/pathing, but combat does not treat them as projectile
  // cover, so archers can hold a pass and shoot across the rock line. The client
  // paints these rects with the mountain ledge Wang tileset (render/wangGround.ts),
  // so the drawn rock face is exactly this blocking geometry.
  "node-0-3": mountainLedgeRings("mountain_0_3", MOUNTAIN_NODE_LEDGE_VARIANTS["node-0-3"]),
  "node-0-4": mountainLedgeRings("mountain_0_4", MOUNTAIN_NODE_LEDGE_VARIANTS["node-0-4"]),
  "node-0-5": mountainLedgeRings("mountain_0_5", MOUNTAIN_NODE_LEDGE_VARIANTS["node-0-5"]),
  "node-0-6": mountainLedgeRings("mountain_0_6", MOUNTAIN_NODE_LEDGE_VARIANTS["node-0-6"]),
  "node-0-7": mountainLedgeRings("mountain_0_7", MOUNTAIN_NODE_LEDGE_VARIANTS["node-0-7"]),
  "node-0-8": mountainLedgeRings("mountain_0_8", MOUNTAIN_NODE_LEDGE_VARIANTS["node-0-8"]),
  "node-1-2": mountainLedgeRings("mountain_1_2", MOUNTAIN_NODE_LEDGE_VARIANTS["node-1-2"]),
  "node-1-3": mountainLedgeRings("mountain_1_3", MOUNTAIN_NODE_LEDGE_VARIANTS["node-1-3"]),
  "node-1-4": mountainLedgeRings("mountain_1_4", MOUNTAIN_NODE_LEDGE_VARIANTS["node-1-4"]),
  "node-2-2": mountainLedgeRings("mountain_2_2", MOUNTAIN_NODE_LEDGE_VARIANTS["node-2-2"]),
  "node-2-3": mountainLedgeRings("mountain_2_3", MOUNTAIN_NODE_LEDGE_VARIANTS["node-2-3"]),
  "node-2-4": mountainLedgeRings("mountain_2_4", MOUNTAIN_NODE_LEDGE_VARIANTS["node-2-4"]),
  "node-3-2": mountainLedgeRings("mountain_3_2", MOUNTAIN_NODE_LEDGE_VARIANTS["node-3-2"]),
  "node-3-3": mountainLedgeRings("mountain_3_3", MOUNTAIN_NODE_LEDGE_VARIANTS["node-3-3"]),
  "node-3-4": mountainLedgeRings("mountain_3_4", MOUNTAIN_NODE_LEDGE_VARIANTS["node-3-4"]),
  "node-4-4": mountainLedgeRings("mountain_4_4", MOUNTAIN_NODE_LEDGE_VARIANTS["node-4-4"]),
  // SWAMP — "attrition terrain": each node has a few varied rot pools with clear
  // lanes between them. Hazard-aware movement is the read; dot-resistance /
  // cleanse / regen is the build answer. Pool count stays restrained by tier.
  "node-6-5": [
    rotPool("rot_pool_a", 760, 680, 240),
    rotPool("rot_pool_b", 2030, 1040, 310),
    rotPool("rot_pool_c", 1260, 1780, 260),
    rotPool("rot_pool_d", 2680, 1760, 150),
    rotPool("rot_pool_e", 430, 1520, 170),
  ],
  "node-6-6": [
    rotPool("rot_pool_a", 820, 720, 300),
    rotPool("rot_pool_b", 2350, 760, 240),
    rotPool("rot_pool_c", 1500, 1650, 320),
    rotPool("rot_pool_d", 520, 1740, 160),
    rotPool("rot_pool_e", 2660, 1440, 180),
  ],
  // SWAMP T1 dungeon (node-7-4, Grave Toadeater) — the boss exam is a hazard field:
  // pools ring the arena (center left clear for the boss), so "survive the rot"
  // pressures positioning during the fight too.
  "node-7-4": [
    rotPool("boss_rot_a", 900, 800, 250),
    rotPool("boss_rot_b", 2300, 900, 300),
    rotPool("boss_rot_c", 1600, 1780, 270),
    rotPool("boss_rot_d", 620, 1660, 150),
  ],
  "node-7-5": [
    rotPool("rot_pool_a", 620, 1440, 280),
    rotPool("rot_pool_b", 1700, 620, 230),
    rotPool("rot_pool_c", 2500, 1620, 310),
    rotPool("rot_pool_d", 840, 520, 160),
    rotPool("rot_pool_e", 1740, 1860, 170),
  ],
  "node-7-6": [
    rotPool("rot_pool_a", 1020, 520, 220),
    rotPool("rot_pool_b", 2460, 1040, 330),
    rotPool("rot_pool_c", 1180, 1880, 270),
    rotPool("rot_pool_d", 480, 1180, 150),
    rotPool("rot_pool_e", 2060, 1840, 170),
  ],
  "node-7-7": [
    rotPool("rot_pool_a", 740, 900, 300, 3),
    rotPool("rot_pool_b", 1660, 1550, 250, 3),
    rotPool("rot_pool_c", 2600, 580, 270, 3),
    rotPool("rot_pool_d", 650, 1840, 160, 3),
    rotPool("rot_pool_e", 2420, 1760, 150, 3),
  ],
  "node-8-4": [
    rotPool("rot_pool_a", 860, 620, 260, 2),
    rotPool("rot_pool_b", 1600, 1500, 310, 2),
    rotPool("rot_pool_c", 2550, 1040, 230, 2),
    rotPool("rot_pool_d", 520, 1620, 180, 2),
    rotPool("rot_pool_e", 2200, 1840, 150, 2),
  ],
  "node-8-5": [
    rotPool("rot_pool_a", 560, 1100, 240, 2),
    rotPool("rot_pool_b", 1840, 760, 320, 2),
    rotPool("rot_pool_c", 2400, 1840, 260, 2),
    rotPool("rot_pool_d", 980, 1840, 160, 2),
    rotPool("rot_pool_e", 2650, 780, 150, 2),
  ],
  "node-8-6": [
    rotPool("boss_rot_a", 760, 760, 280, 2),
    rotPool("boss_rot_b", 2400, 760, 260, 2),
    rotPool("boss_rot_c", 1600, 1780, 300, 2),
    rotPool("boss_rot_d", 620, 1660, 160, 2),
    rotPool("boss_rot_e", 2600, 1660, 150, 2),
  ],
  "node-8-7": [
    rotPool("rot_pool_a", 980, 1680, 290, 3),
    rotPool("rot_pool_b", 1720, 520, 240, 3),
    rotPool("rot_pool_c", 2460, 1780, 270, 3),
    rotPool("rot_pool_d", 540, 760, 160, 3),
    rotPool("rot_pool_e", 2720, 800, 150, 3),
  ],
  "node-9-4": [
    rotPool("boss_rot_a", 820, 920, 300, 3),
    rotPool("boss_rot_b", 2320, 820, 250, 3),
    rotPool("boss_rot_c", 1660, 1720, 280, 3),
    rotPool("boss_rot_d", 520, 1740, 150, 3),
    rotPool("boss_rot_e", 2660, 1540, 160, 3),
  ],
  "node-9-5": [
    rotPool("rot_pool_a", 720, 640, 230, 3),
    rotPool("rot_pool_b", 1400, 1700, 320, 3),
    rotPool("rot_pool_c", 2600, 940, 280, 3),
    rotPool("rot_pool_d", 520, 1580, 170, 3),
    rotPool("rot_pool_e", 1960, 520, 150, 3),
  ],
  "node-9-6": [
    rotPool("rot_pool_a", 940, 1380, 310, 3),
    rotPool("rot_pool_b", 1800, 660, 250, 3),
    rotPool("rot_pool_c", 2500, 1780, 230, 3),
    rotPool("rot_pool_d", 540, 620, 150, 3),
    rotPool("rot_pool_e", 1510, 1960, 160, 3),
  ],
  "node-9-7": [
    rotPool("rot_pool_a", 620, 1760, 270, 3),
    rotPool("rot_pool_b", 1540, 820, 300, 3),
    rotPool("rot_pool_c", 2480, 620, 250, 3),
    rotPool("rot_pool_d", 820, 620, 160, 3),
    rotPool("rot_pool_e", 2360, 1780, 170, 3),
  ],
  // JUNGLE — "ambush ecology": dense overgrowth thickets that slow the player and
  // multiply every monster's detection radius while they are inside, so stepping into
  // cover is what pulls the pack rather than hiding from it. Open lanes between bushes
  // are the safe read (the ground layout routes its open floor around the thickets);
  // evasion + hardening is the build answer. Non-blocking → no passability concern.
  "node-3-7": [
    denseBush("jungle_bush_a", 820, 720, 300),
    denseBush("jungle_bush_b", 2360, 780, 280),
    denseBush("jungle_bush_c", 1600, 1720, 320),
    denseBush("jungle_bush_d", 2420, 1800, 260),
  ],
  "node-3-8": [
    denseBush("jungle_bush_a", 760, 800, 300),
    denseBush("jungle_bush_b", 2300, 1640, 300),
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

const SWAMP_NORMAL_TEMPLATES = [
  "node-6-5",
  "node-6-6",
  "node-7-5",
  "node-7-6",
  "node-7-7",
  "node-8-4",
  "node-8-5",
  "node-8-7",
  "node-9-5",
  "node-9-6",
  "node-9-7",
];
const SWAMP_DUNGEON_TEMPLATES: Record<number, string> = {
  1: "node-7-4",
  2: "node-8-6",
  3: "node-9-4",
};
const JUNGLE_NORMAL_TEMPLATES = ["node-3-7", "node-3-8"];
const VOLCANIC_NORMAL_TEMPLATES = ["node-7-8", "node-8-8"];
const VOLCANIC_DUNGEON_TEMPLATES: Record<number, string> = {
  3: "node-8-9",
  4: "node-10-10",
};

function templateFeatures(
  templateId: string | undefined,
): NodeFeatureSpec[] {
  if (!templateId) return [];
  return (LEGACY_NODE_FEATURE_TEMPLATES[templateId] ?? []).map((feature) => ({
    ...feature,
  }));
}

function canonicalFeaturesForNode(
  node: (typeof WORLD_NODE_LIST)[number],
): NodeFeatureSpec[] {
  if (node.id === "node-clearing") {
    return templateFeatures("node-5-5");
  }
  if (node.kind === "sanctuary") {
    return templateFeatures("node-5-5");
  }
  if (node.biomeGroup === "mountain") {
    return mountainLedgeRings(
      `mountain_${node.id}`,
      node.featureVariant ?? 0,
    );
  }
  if (node.biomeGroup === "swamp") {
    if (node.kind === "dungeon") {
      return templateFeatures(SWAMP_DUNGEON_TEMPLATES[node.biomeTier]);
    }
    const index = (node.featureVariant ?? 0) % SWAMP_NORMAL_TEMPLATES.length;
    return templateFeatures(SWAMP_NORMAL_TEMPLATES[index]);
  }
  if (node.biomeGroup === "jungle") {
    const templateId =
      node.kind === "dungeon"
        ? "node-2-8"
        : JUNGLE_NORMAL_TEMPLATES[
            (node.featureVariant ?? 0) % JUNGLE_NORMAL_TEMPLATES.length
          ];
    return templateFeatures(templateId);
  }
  if (node.biomeGroup === "volcanic") {
    if (node.kind === "dungeon") {
      return templateFeatures(VOLCANIC_DUNGEON_TEMPLATES[node.biomeTier]);
    }
    const index =
      (node.featureVariant ?? 0) % VOLCANIC_NORMAL_TEMPLATES.length;
    return templateFeatures(VOLCANIC_NORMAL_TEMPLATES[index]);
  }
  return [];
}

/** Static hazards and obstacles projected from canonical feature metadata. */
export const NODE_FEATURES: Record<string, NodeFeatureSpec[]> =
  Object.fromEntries(
    WORLD_NODE_LIST.map((node) => [
      node.id,
      canonicalFeaturesForNode(node),
    ]),
  );

export const RESOLVED_NODE_FEATURES = buildResolvedNodeFeatures();

/**
 * Nodes that have at least one detection-multiplying feature. `playerDetectionMult`
 * runs per aggro candidate, so the overwhelmingly common case (a node with no such
 * feature) has to cost one Set probe rather than a feature scan.
 */
const DETECTION_FEATURE_NODES: ReadonlySet<string> = new Set(
  Object.entries(RESOLVED_NODE_FEATURES)
    .filter(([, features]) =>
      features.some((f) => (f.detectionMultWhileInside ?? 1) > 1),
    )
    .map(([nodeId]) => nodeId),
);

/**
 * Combined detection multiplier of every detection feature containing `pos`.
 * 1 when the node has none or the point is outside them all. Overlapping thickets
 * take the STRONGEST rather than compounding — two bushes touching should not make
 * the player four times as loud.
 */
export function detectionMultForPoint(nodeId: string, pos: Vec2): number {
  if (!DETECTION_FEATURE_NODES.has(nodeId)) return 1;
  let mult = 1;
  for (const feature of RESOLVED_NODE_FEATURES[nodeId] ?? []) {
    const m = feature.detectionMultWhileInside ?? 1;
    if (m <= mult) continue;
    if (pointInNodeFeatureShape(pos, feature.shape)) mult = m;
  }
  return mult;
}
