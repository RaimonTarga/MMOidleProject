// ─── Entity shapes ────────────────────────────────────────────────────────────

export interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Server-authoritative destination; clients interpolate toward this. */
  targetX: number;
  targetY: number;
  nodeId: string;
}

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
}

// ─── Game balance constants ───────────────────────────────────────────────────

export const GAME_CONFIG = {
  /** Logical pixel dimensions of a single node */
  NODE_WIDTH: 800,
  NODE_HEIGHT: 600,
  /** Server authoritative tick rate in Hz */
  TICK_RATE: 2,
  /** Player movement speed in pixels per second */
  PLAYER_SPEED: 120,
  /** Number of monsters spawned per node on startup */
  MONSTERS_PER_NODE: 6,
  /** Starting HP for all monsters */
  MONSTER_HP: 20,
} as const;
