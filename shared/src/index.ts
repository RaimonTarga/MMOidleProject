export * from './skillTree';
export * from './items';
export * from './itemDatabase';
export * from './recipeDatabase';
export * from './monsterDatabase';
export * from './biomeDatabase';

import type { EquipmentMap, EquipmentSlot, EssenceType } from './items';
import type { SubVariant } from './skillTree';

// ─── Buff display ─────────────────────────────────────────────────────────────

/**
 * A single active buff entry, populated server-side each tick and sent to the
 * client for display. Only player buffs are tracked here — debuffs on monsters
 * are server-only.
 *
 * Resilience notes:
 *   - `id` will be used as the sprite key when icons are added later.
 *   - `durationPct` of -1 means the buff has no timer (permanent or count-based).
 *   - `stacks` of 1 means no stack badge is shown.
 *   - `color` is a CSS hex string used for the placeholder shape; replace with
 *     icon textures later without changing any other code.
 */
export interface PlayerBuff {
  /** Unique identifier — will double as the future icon sprite key. */
  id: string;
  /** Short label shown beneath the icon (3–6 chars). */
  label: string;
  /** Stack count; 1 = single instance (no badge shown). */
  stacks: number;
  /** 0–100 remaining duration percentage; -1 = no timer. */
  durationPct: number;
  /** CSS hex color string for the placeholder shape, e.g. '#00ffaa'. */
  color: string;
}

// ─── Combat archetype ─────────────────────────────────────────────────────────

/**
 * Determines which server-side combat mechanic module governs an entity.
 * null  = vanilla behavior (no archetype-specific mechanics).
 * Extend this union as new archetypes are implemented.
 */
export type CombatArchetype = 'cadence' | 'cooldown' | 'energy' | 'reload' | 'dot' | null;

// ─── Shield ───────────────────────────────────────────────────────────────────

/**
 * A temporary hit-point buffer that absorbs damage before real HP.
 * Sent to the client so the HP bar can render the shield layer.
 */
export interface ShieldState {
  /** Current remaining shield HP. */
  amount: number;
  /** Shield HP at creation — used for proportional bar rendering. */
  maxAmount: number;
  /**
   * Remaining duration in milliseconds.
   * -1 = permanent: never expires by timer, depletes only via damage.
   * >0 = timed: decremented each tick; shield is removed when this reaches 0.
   */
  remainingMs: number;
}

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
  /** Flat damage reduction — subtracted from incoming damage before percentage. */
  plating: number;
  /** Percentage damage reduction applied after plating (0.0–1.0). */
  damageReduction: number;
  /**
   * Hit counter threshold for evasion. 0 = disabled.
   * Every N incoming hits, the Nth is fully nullified.
   */
  evasion: number;
  /** Current hit count toward the next evasion trigger. Mirrored from CombatState. */
  evasionCount: number;
  /** Active temporary shields. Damage is absorbed here before reaching HP. */
  shields: ShieldState[];
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
  /**
   * Accumulated numeric mechanic modifiers from skill nodes' mechanicEffects.
   * Rebuilt by recalculatePlayerStats from scratch on every stat recalculation.
   * Archetype systems read these at runtime to adjust behavior.
   * e.g. passives['cadence.threshold-mod'] = -2 means the cadence threshold is reduced by 2.
   */
  passives: Record<string, number>;
  /**
   * Active cadence speed stacks (Accelerando passive).
   * Each stack reduces attackCooldown by a fixed amount, up to a cap.
   * Reset to 0 by recalculatePlayerStats (on equip/skill change) and on respawn.
   */
  cadenceSpeedStacks: number;
  /** ID of the class root node that was first unlocked, or null before class selection. */
  selectedClass: string | null;
  /** Which sub-variant (light / balanced / heavy) was chosen at tier 1, or null before that choice. */
  selectedSubVariant: SubVariant | null;
  /** ID of the range node chosen at tier 2 (range-close / range-mid / range-far), or null before that choice. */
  selectedRange: string | null;
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
  /**
   * Which server-side combat mechanic module governs this player.
   * null = vanilla behavior; set server-side only, sent to client for future UI use.
   */
  combatArchetype: CombatArchetype;
  /**
   * Current position in the cadence cycle (0 … cadenceThreshold-1).
   * Reset to 0 after each trigger. Mirrored to PlayerState every hit so
   * the client can display a live progress bar without extra network overhead.
   */
  cadenceCount: number;
  /**
   * Hits required to complete one cadence cycle.
   * 0 means this player is not using the cadence archetype.
   */
  cadenceThreshold: number;
  /**
   * True when an empowered (finisher) attack has been armed and will fire on
   * the next hit. The cadenceCount is reset to 0 at arming time, so without
   * this flag the client cannot distinguish "start of cycle" from "finisher next".
   */
  cadenceEmpoweredArmed: boolean;
  /** Current ammo count for reload-archetype players. 0 = reloading. */
  ammoCount: number;
  /** Max ammo capacity. 0 means this player is not using the reload archetype. */
  ammoMax: number;
  /** Cooldown archetype: true when the execution strike is armed and the next hit will trigger it. */
  executionReady: boolean;
  /** Cooldown archetype: preparation progress 0–100 toward the next execution window. 100 = ready. */
  executionCooldownPct: number;
  /** Energy archetype: current energy level, 0–100. Fills on hits; empowers at 100. */
  energyCount: number;
  /** Energy archetype: true when an empowered attack is armed (consumed on next hit). */
  empoweredReady: boolean;
  /** DoT archetype: number of DoT stacks currently on the player's attack target (0 if no target). */
  targetDotStacks: number;
  /** DoT archetype (Freezing Cold): chill stacks on the attack target (0 if no target or no chill). */
  targetChillStacks: number;
  /** Sacred Cross weapon: true while the divine burst buff is active. */
  sacredBuffActive: boolean;
  /** Sacred Cross weapon: 0–100 progress toward the next buff window (100 = buff active). */
  sacredBuffPct: number;
  /**
   * Cooldown Channeled Beam: true while the channel is active.
   * Server locks movement and skips auto-attacks while this is true.
   * Client should display a channel bar and block move inputs.
   */
  isChanneling: boolean;
  /** Channeled Beam progress 0–100 through the channel window. 0 when not channeling. */
  channelingPct: number;
  /**
   * Active buffs on this player, populated server-side each tick by syncPlayerBuffs.
   * Only buffs are tracked here — monster debuffs are server-only.
   * The client renders these verbatim; no client-side buff logic is needed.
   */
  activeBuffs: PlayerBuff[];

  // ── Quest progression ────────────────────────────────────────────────────

  /**
   * Kill count toward each active quest. Key = questId, value = kills so far.
   * Missing key = 0 progress. Quest is complete when value >= quest.killsRequired.
   */
  questProgress: Record<string, number>;
  /**
   * Accumulated progression XP from completed quests.
   * Resets (modulo XP_PER_LEVEL) each time a level is gained.
   */
  progressionXP: number;
  /**
   * Progression level gained via completed quests. Each level grants 1 skill point.
   * Separate from the flat kill-count `level` field.
   */
  progressionLevel: number;
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
  /** Flat damage reduction — subtracted from incoming damage before percentage. */
  plating: number;
  /** Percentage damage reduction applied after plating (0.0–1.0). Default 0. */
  damageReduction: number;
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
  /** True for dungeon boss monsters — clients render them larger with a distinct label. */
  isBoss: boolean;
  /** Future: allows elite/boss monsters to use archetype mechanics. */
  combatArchetype?: CombatArchetype;
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
  /**
   * True for dungeon variant nodes. Enemies within deal extra damage and have more HP.
   * One boss monster is maintained alongside the normal population.
   */
  isDungeon: boolean;
}

/**
 * 9×9 grid map. Center is node-4-4 (T0 clearing).
 * Chebyshev distance from center determines tier band:
 *   0 — clearing (T0)
 *   1 — T1 biomes (8 nodes)
 *   2 — T2 biomes (16 nodes)
 *   3 — T3 biomes (24 nodes)
 *   4 — T4 biomes (32 nodes)
 *
 * Each tier has at least one dungeon node. Dungeons are marked isDungeon: true.
 * Geographic layout:
 *   North (rows 0-3) — tundra / mountain
 *   West  (cols 0-3) — swamp / cave / necropolis / abyss
 *   East  (cols 5-8) — plains / desert / forest / jungle
 *   South (rows 5-8) — jungle / volcanic / necropolis / abyss
 */
export const NODE_BIOMES: Record<string, { biomeGroup: string; biomeTier: number; isDungeon?: boolean }> = {
  // ── Row 0 — T4 outer ring (north) ─────────────────────────────────────────
  'node-0-0': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-1': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-2': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-3': { biomeGroup: 'mountain',   biomeTier: 4 },
  'node-0-4': { biomeGroup: 'mountain',   biomeTier: 4, isDungeon: true },
  'node-0-5': { biomeGroup: 'mountain',   biomeTier: 4 },
  'node-0-6': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-7': { biomeGroup: 'tundra',     biomeTier: 4 },
  'node-0-8': { biomeGroup: 'forest',     biomeTier: 4 },
  // ── Row 1 — T3/T4 ──────────────────────────────────────────────────────────
  'node-1-0': { biomeGroup: 'necropolis', biomeTier: 4, isDungeon: true },
  'node-1-1': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-1-2': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-1-3': { biomeGroup: 'mountain',   biomeTier: 3 },
  'node-1-4': { biomeGroup: 'mountain',   biomeTier: 3 },
  'node-1-5': { biomeGroup: 'mountain',   biomeTier: 3 },
  'node-1-6': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-1-7': { biomeGroup: 'tundra',     biomeTier: 3 },
  'node-1-8': { biomeGroup: 'plains',     biomeTier: 4 },
  // ── Row 2 — T2/T3 ──────────────────────────────────────────────────────────
  'node-2-0': { biomeGroup: 'swamp',      biomeTier: 4 },
  'node-2-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-2-2': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-3': { biomeGroup: 'tundra',     biomeTier: 2 },
  'node-2-4': { biomeGroup: 'tundra',     biomeTier: 2, isDungeon: true },
  'node-2-5': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-6': { biomeGroup: 'mountain',   biomeTier: 2 },
  'node-2-7': { biomeGroup: 'plains',     biomeTier: 3 },
  'node-2-8': { biomeGroup: 'plains',     biomeTier: 4 },
  // ── Row 3 — T1/T2/T3 ───────────────────────────────────────────────────────
  'node-3-0': { biomeGroup: 'abyss',      biomeTier: 4 },
  'node-3-1': { biomeGroup: 'swamp',      biomeTier: 3 },
  'node-3-2': { biomeGroup: 'swamp',      biomeTier: 2 },
  'node-3-3': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-3-4': { biomeGroup: 'forest',     biomeTier: 1 },
  'node-3-5': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-3-6': { biomeGroup: 'plains',     biomeTier: 2 },
  'node-3-7': { biomeGroup: 'forest',     biomeTier: 3 },
  'node-3-8': { biomeGroup: 'desert',     biomeTier: 4 },
  // ── Row 4 — T0 center + T1 ring ────────────────────────────────────────────
  'node-4-0': { biomeGroup: 'abyss',      biomeTier: 4, isDungeon: true },
  'node-4-1': { biomeGroup: 'necropolis', biomeTier: 3, isDungeon: true },
  'node-4-2': { biomeGroup: 'swamp',      biomeTier: 1 },
  'node-4-3': { biomeGroup: 'swamp',      biomeTier: 1 },
  'node-4-4': { biomeGroup: 'clearing',   biomeTier: 0 },
  'node-4-5': { biomeGroup: 'plains',     biomeTier: 1 },
  'node-4-6': { biomeGroup: 'desert',     biomeTier: 2 },
  'node-4-7': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-4-8': { biomeGroup: 'desert',     biomeTier: 4 },
  // ── Row 5 — T1/T2/T3 ───────────────────────────────────────────────────────
  'node-5-0': { biomeGroup: 'abyss',      biomeTier: 4 },
  'node-5-1': { biomeGroup: 'cave',       biomeTier: 3 },
  'node-5-2': { biomeGroup: 'cave',       biomeTier: 2 },
  'node-5-3': { biomeGroup: 'cave',       biomeTier: 1 },
  'node-5-4': { biomeGroup: 'jungle',     biomeTier: 1 },
  'node-5-5': { biomeGroup: 'jungle',     biomeTier: 1 },
  'node-5-6': { biomeGroup: 'volcanic',   biomeTier: 2 },
  'node-5-7': { biomeGroup: 'jungle',     biomeTier: 3 },
  'node-5-8': { biomeGroup: 'jungle',     biomeTier: 4 },
  // ── Row 6 — T2/T3 ──────────────────────────────────────────────────────────
  'node-6-0': { biomeGroup: 'cave',       biomeTier: 4 },
  'node-6-1': { biomeGroup: 'cave',       biomeTier: 3 },
  'node-6-2': { biomeGroup: 'jungle',     biomeTier: 2 },
  'node-6-3': { biomeGroup: 'volcanic',   biomeTier: 2, isDungeon: true },
  'node-6-4': { biomeGroup: 'volcanic',   biomeTier: 2 },
  'node-6-5': { biomeGroup: 'volcanic',   biomeTier: 2 },
  'node-6-6': { biomeGroup: 'jungle',     biomeTier: 2 },
  'node-6-7': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-6-8': { biomeGroup: 'jungle',     biomeTier: 4 },
  // ── Row 7 — T3/T4 ──────────────────────────────────────────────────────────
  'node-7-0': { biomeGroup: 'volcanic',   biomeTier: 4 },
  'node-7-1': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-7-2': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-7-3': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-7-4': { biomeGroup: 'necropolis', biomeTier: 3 },
  'node-7-5': { biomeGroup: 'desert',     biomeTier: 3 },
  'node-7-6': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-7-7': { biomeGroup: 'volcanic',   biomeTier: 3 },
  'node-7-8': { biomeGroup: 'volcanic',   biomeTier: 4 },
  // ── Row 8 — T4 outer ring (south) ─────────────────────────────────────────
  'node-8-0': { biomeGroup: 'volcanic',   biomeTier: 4 },
  'node-8-1': { biomeGroup: 'volcanic',   biomeTier: 4 },
  'node-8-2': { biomeGroup: 'volcanic',   biomeTier: 4 },
  'node-8-3': { biomeGroup: 'necropolis', biomeTier: 4 },
  'node-8-4': { biomeGroup: 'abyss',      biomeTier: 4, isDungeon: true },
  'node-8-5': { biomeGroup: 'necropolis', biomeTier: 4 },
  'node-8-6': { biomeGroup: 'volcanic',   biomeTier: 4 },
  'node-8-7': { biomeGroup: 'volcanic',   biomeTier: 4 },
  'node-8-8': { biomeGroup: 'volcanic',   biomeTier: 4 },
};

/** Full world state for a node, sent every tick and on join. */
export interface NodeSnapshot {
  players: PlayerState[];
  monsters: MonsterState[];
}

// ─── Quest system ─────────────────────────────────────────────────────────────

/**
 * A quest that requires the player to kill a set number of specific monsters.
 * Completing the quest awards progressionXP, which accumulates toward level-ups
 * that convert into skill points.
 */
export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  /** Monster type IDs (keys in MONSTER_DATABASE) that count toward this quest. */
  targetMonsterTypes: string[];
  /** Total kills required to complete the quest. */
  killsRequired: number;
  /** Progression XP awarded on completion. */
  xpReward: number;
}

/** All available quests. Empty at launch — add entries to populate quests. */
export const QUEST_DATABASE = new Map<string, QuestDefinition>();

/** XP required to gain one progression level (and thus one skill point). */
export const XP_PER_LEVEL = 100;

// ─── Socket.IO event maps ─────────────────────────────────────────────────────

/** Events the server sends to clients */
export interface ServerToClientEvents {
  /** Full snapshot sent to a newly connected player */
  'state:sync': (snapshot: NodeSnapshot) => void;
  /** Authoritative world snapshot broadcast every server tick */
  'node:state': (snapshot: NodeSnapshot) => void;
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

  // ── Player base stats ────────────────────────────────────────────────────────
  PLAYER_MAX_HP:  100,
  PLAYER_ATTACK:  15,  // damage per hit (before plating)
  PLAYER_PLATING: 2,
  /** Pixel radius within which a player can hit a monster */
  PLAYER_ATTACK_RANGE: 60,
  /** Milliseconds between attacks when unarmed. Overridden by weapon attacksPerSecond when a weapon is equipped. */
  PLAYER_ATTACK_COOLDOWN: 3000,
  /** HP recovered per second when out of combat */
  PLAYER_HP_REGEN: 5,
  /** Milliseconds after last hit before regen starts */
  COMBAT_REGEN_DELAY: 3000,

  // ── Spawn ─────────────────────────────────────────────────────────────────────
  /** Minimum pixel distance between two monsters at spawn time */
  MONSTER_MIN_SPAWN_DIST: 120,
} as const;
