export * from './skillTree';
export * from './items';
export * from './itemDatabase';
export * from './recipeDatabase';
export * from './monsterDatabase';
export * from './biomeDatabase';

import type { EquipmentMap, EquipmentSlot, EssenceType } from './items';

// ─── Entity shapes ────────────────────────────────────────────────────────────

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Server-authoritative destination; clients interpolate toward this. */
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  /** Pixel radius within which this player can attack a monster. */
  attackRange: number;
  /** Milliseconds between discrete attacks. */
  attackCooldown: number;
  /** Server timestamp (ms) of the last attack — clients use for cooldown-bar progress. */
  lastAttackAt: number;
  /** Monster ID currently being attacked, or null when idle. */
  attackTargetId: string | null;
  /** Whether the server is driving this player toward the nearest monster. */
  auto: boolean;
  nodeId: string;
  /** Accumulated essence resources — keyed by type, granted by server on monster kills. */
  essences: Record<EssenceType, number>;
  /** Flat progression counter — incremented by 1 per kill. */
  level: number;
  /** Unspent points available to invest in the skill tree. */
  skillPoints: number;
  /** IDs of all unlocked skill tree nodes. */
  unlockedSkills: string[];
  /** ID of the class root node that was first unlocked, or null before class selection. */
  selectedClass: string | null;
  /**
   * The tier currently available to unlock. Starts at 0 (class root selection).
   * Increments by 1 on each successful unlock. Nodes are only unlockable when
   * node.tier === currentSkillTier.
   */
  currentSkillTier: number;
  /** HP recovered per second when out of combat. Modified by equipment. */
  hpRegen: number;
  /** Movement speed in px/s. Modified by equipment. */
  speed: number;
  /** Visual style used for attack animations on the client. */
  attackStyle: string;
  /** Definition IDs of items carried but not equipped. */
  inventory: string[];
  /** Currently equipped items, one per slot. Null means nothing equipped. */
  equipment: EquipmentMap;
  /**
   * Raw kill count per biome group — the progression metric that drives recipe
   * unlocks. Incremented server-side on every monster kill.
   * e.g. { forest: 12, mountain: 0 }
   */
  biomeKills: Record<string, number>;
  /**
   * Derived from biomeKills via BIOME_UNLOCK_THRESHOLDS. Value is the maximum
   * recipe tier accessible in that group. Missing key means nothing unlocked.
   * e.g. { forest: 1 } means T1 forest recipes are craftable.
   */
  recipeProgress: Record<string, number>;
}

/**
 * All valid AI states for a monster.
 * The state machine starts at 'idle'; 'chasing', 'attacking', 'returning'
 * are plugged in when combat AI is added.
 */
export type MonsterAIState =
  | 'idle'
  | 'wandering'
  | 'chasing'
  | 'attacking'
  | 'returning';

export interface MonsterState {
  id: string;
  /** Key into MONSTER_DATABASE — drives stat lookup and reward lookup. */
  monsterTypeId: string;
  /** Placeholder rectangle color, copied from MonsterDefinition.color at spawn. */
  color: number;
  name: string;
  x: number;
  y: number;
  /** Server-authoritative destination; clients interpolate toward this. */
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  /** Movement speed in px/s — clients use this for accurate interpolation. */
  speed: number;
  /** Current AI state — clients can use for animation/visual cues. */
  state: MonsterAIState;
  /** Pixel radius within which this monster notices and chases a player. */
  pullRange: number;
  /** Pixel radius within which this monster deals damage to its target. */
  attackRange: number;
  /** Milliseconds between discrete attacks. */
  attackCooldown: number;
  /** Server timestamp (ms) of the last attack — clients use for cooldown-bar progress. */
  lastAttackAt: number;
  /** Player ID currently being attacked, or null when not in melee contact. */
  attackTargetId: string | null;
  nodeId: string;
  /** Visual style used for attack animations on the client. */
  attackStyle: string;
}

// ─── Node / zone definitions ──────────────────────────────────────────────────

export type NodeDirection = 'north' | 'south' | 'east' | 'west';

export interface NodeDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Which biome family this node belongs to (e.g. "forest", "mountain"). */
  biomeGroup: string;
  /** Difficulty tier within the biome family — higher tiers have harder mobs. */
  biomeTier: number;
  /** Adjacent node ids keyed by the direction of travel. Only present exits are listed. */
  exits: Partial<Record<NodeDirection, string>>;
}

/**
 * Flat lookup from node ID to its biome info.
 * Mirrors nodeRegistry on the server; both client and server import from here
 * so the mapping has a single source of truth.
 */
/**
 * 5×5 grid map. Center is node-2-2 (ring 0).
 * Chebyshev distance from center determines ring: 0 = clearing, 1 = tier 1, 2 = tier 2.
 *
 * Geographic layout:
 *   North  — tundra / mountain
 *   West   — swamp
 *   East   — plains → desert
 *   South  — cave / jungle / volcanic
 */
export const NODE_BIOMES: Record<string, { biomeGroup: string; biomeTier: number }> = {
  // row 0 — ring 2
  'node-0-0': { biomeGroup: 'tundra',   biomeTier: 2 },
  'node-0-1': { biomeGroup: 'tundra',   biomeTier: 2 },
  'node-0-2': { biomeGroup: 'mountain', biomeTier: 2 },
  'node-0-3': { biomeGroup: 'mountain', biomeTier: 2 },
  'node-0-4': { biomeGroup: 'tundra',   biomeTier: 2 },
  // row 1
  'node-1-0': { biomeGroup: 'swamp',    biomeTier: 2 },
  'node-1-1': { biomeGroup: 'forest',   biomeTier: 1 },
  'node-1-2': { biomeGroup: 'forest',   biomeTier: 1 },
  'node-1-3': { biomeGroup: 'plains',   biomeTier: 1 },
  'node-1-4': { biomeGroup: 'desert',   biomeTier: 2 },
  // row 2
  'node-2-0': { biomeGroup: 'swamp',    biomeTier: 2 },
  'node-2-1': { biomeGroup: 'swamp',    biomeTier: 1 },
  'node-2-2': { biomeGroup: 'clearing', biomeTier: 0 },
  'node-2-3': { biomeGroup: 'plains',   biomeTier: 1 },
  'node-2-4': { biomeGroup: 'desert',   biomeTier: 2 },
  // row 3
  'node-3-0': { biomeGroup: 'jungle',   biomeTier: 2 },
  'node-3-1': { biomeGroup: 'cave',     biomeTier: 1 },
  'node-3-2': { biomeGroup: 'cave',     biomeTier: 1 },
  'node-3-3': { biomeGroup: 'jungle',   biomeTier: 1 },
  'node-3-4': { biomeGroup: 'volcanic', biomeTier: 2 },
  // row 4 — ring 2
  'node-4-0': { biomeGroup: 'jungle',   biomeTier: 2 },
  'node-4-1': { biomeGroup: 'cave',     biomeTier: 2 },
  'node-4-2': { biomeGroup: 'jungle',   biomeTier: 2 },
  'node-4-3': { biomeGroup: 'volcanic', biomeTier: 2 },
  'node-4-4': { biomeGroup: 'volcanic', biomeTier: 2 },
};

/** Full world state for a node, sent every tick and on join. */
export interface NodeSnapshot {
  players: PlayerState[];
  monsters: MonsterState[];
}

// ─── Socket.IO event maps ─────────────────────────────────────────────────────

/** Events the server sends to clients */
export interface ServerToClientEvents {
  /** Full snapshot sent to a newly connected player */
  'state:sync': (snapshot: NodeSnapshot) => void;
  /** Authoritative world snapshot broadcast every server tick */
  'node:state': (snapshot: NodeSnapshot) => void;
  /** Broadcast when any player joins the node */
  'player:joined': (player: PlayerState) => void;
  /** Broadcast when any player leaves the node */
  'player:left': (playerId: string) => void;
  /** Immediate result of a crafting attempt — success or reason for failure. */
  'crafting:result': (result: { success: boolean; reason?: string }) => void;
  /** Sent to a player whose HP reached zero — they are simultaneously respawned server-side. */
  'player:died': () => void;
}

/** Events clients send to the server */
export interface ClientToServerEvents {
  /** Set the player's movement destination (click-to-move or AI-issued). */
  'player:move': (position: { x: number; y: number }) => void;
  /** Enable or disable server-side auto-targeting for this player. */
  'player:setAuto': (enabled: boolean) => void;
  /** Request to unlock a skill tree node by ID. Server validates and applies. */
  'player:unlockSkill': (skillId: string) => void;
  /** Equip an item from inventory by its definition ID. */
  'inventory:equipItem': (definitionId: string) => void;
  /** Move the item in the given slot back to inventory. */
  'inventory:unequip': (slot: EquipmentSlot) => void;
  /** Attempt to craft a recipe by ID. Server validates and applies. */
  'crafting:craftRecipe': (recipeId: string) => void;
}

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Logical pixel dimensions of a single node (the scrollable world area) */
  NODE_WIDTH:  3200,
  NODE_HEIGHT: 2400,
  /** Half-width of each cardinal gate opening along the border edge */
  GATE_HALF: 160,
  /** Server authoritative tick rate in Hz */
  TICK_RATE: 2,
  /** Player movement speed in pixels per second */
  PLAYER_SPEED: 120,
  /** Maximum number of monsters alive in a node at any time */
  MONSTERS_PER_NODE: 12,

  // ── Combat ──────────────────────────────────────────────────────────────────
  /** Pixel radius within which a player can hit a monster */
  PLAYER_ATTACK_RANGE: 60,
  /** Milliseconds between player discrete attacks */
  PLAYER_ATTACK_COOLDOWN: 2000,

  /** Pixel radius within which a slime notices and begins chasing a player */
  SLIME_PULL_RANGE: 200,
  /** Pixel radius within which a slime deals damage to its target */
  SLIME_ATTACK_RANGE: 60,
  /** Pixel radius from spawn before a chasing slime gives up and returns */
  SLIME_LEASH_RANGE: 600,
  /** Milliseconds between slime discrete attacks */
  SLIME_ATTACK_COOLDOWN: 2500,

  // Player base stats
  PLAYER_MAX_HP:  100,
  PLAYER_ATTACK:  15,  // damage per hit (before defense); 2 s cooldown ≈ 7 effective DPS
  PLAYER_DEFENSE: 2,
  /** HP recovered per second when out of combat */
  PLAYER_HP_REGEN: 5,
  /** Milliseconds after last hit before regen starts */
  COMBAT_REGEN_DELAY: 3000,

  // Monster base stats
  MONSTER_HP:      50,
  MONSTER_ATTACK:  8,  // damage per hit (before defense); 2.5 s cooldown ≈ 3 effective DPS
  MONSTER_DEFENSE: 1,
  /** Milliseconds after death before a new monster is spawned */
  MONSTER_RESPAWN_DELAY: 8000,

  // ── Slime AI ─────────────────────────────────────────────────────────────────
  /** Slime movement speed in px/s */
  SLIME_SPEED: 40,
  /** How far from its spawn point a slime will wander (px) */
  SLIME_WANDER_RADIUS: 220,
  /** Minimum idle time between wanders (ms) */
  SLIME_IDLE_MIN: 1500,
  /** Maximum idle time between wanders (ms) */
  SLIME_IDLE_MAX: 4500,
  /** Minimum distance between spawn positions when placing a new slime (px) */
  SLIME_MIN_SPAWN_DIST: 120,
} as const;
