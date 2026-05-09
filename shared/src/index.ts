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
}

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
}

/** Events clients send to the server */
export interface ClientToServerEvents {
  /** Set the player's movement destination (click-to-move or AI-issued). */
  'player:move': (position: { x: number; y: number }) => void;
  /** Enable or disable server-side auto-targeting for this player. */
  'player:setAuto': (enabled: boolean) => void;
}

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Logical pixel dimensions of a single node (the scrollable world area) */
  NODE_WIDTH:  3200,
  NODE_HEIGHT: 2400,
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
